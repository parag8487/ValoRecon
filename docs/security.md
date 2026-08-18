# ValoRecon Security Specification

**Status:** normative production specification  
**Scope:** Windows desktop host, Local Agent, cloud modular monolith, companion clients, updater, and third-party integrations  
**Authority:** `requirements.md`, `compliance.md`, and verified findings in `AUDIT.md`

## 1. Security invariants

1. Riot integration executes only on the gaming PC. Riot lockfile passwords, access tokens, entitlement tokens, and private Riot endpoints never enter the cloud or a browser bundle.
2. The Local Agent binds only to `127.0.0.1`. It is never exposed by LAN binding, port forwarding, tunnels, or a public reverse proxy.
3. Localhost is untrusted. Reaching port 8799, omitting `Origin`, or running as the same Windows user does not establish authorization.
4. Local features remain usable while cloud identity, relay, telemetry, Gemini, and public content services are unavailable.
5. The cloud authorizes every remote request against the authenticated user, device ownership, entitlement, device status, protocol/capability support, operation allowlist, and risk policy. The Agent authorizes it again.
6. No secret appears in a URL, command line, browser storage, frontend bundle, ordinary config file, log, metric, trace, crash report, support bundle, or Git history.
7. Mutations fail closed. Reads may degrade to explicitly labeled cached or mock data; stale credentials, approvals, commands, or feature flags never execute.
8. Agent-select automation is disabled by default and cannot run until the human compliance decision permits a documented path.

## 2. Asset classification

| Class | Examples | Required handling |
|---|---|---|
| Public | static game metadata, published lineup content | Cache safely; validate third-party content before rendering |
| Operational | app/agent versions, coarse health, aggregate counters | Tenant/device scoped; bounded retention; no sensitive labels |
| Confidential | match details, chat, screenshots, player identity, diagnostics | Encrypt in transit/at rest; purpose limit; explicit consent before cloud/provider transmission |
| Secret | Gemini key, Riot lockfile password/tokens, cookies, device secret, refresh tokens | OS credential store/server secret manager; memory-only use; redaction and rotation |
| Critical integrity | code-signing/updater keys, enrollment authority, audit records | HSM/protected signing service; access audit; key rotation and incident plan |

The cloud stores only identity, device, entitlement, feature-flag, relay metadata, audit, and consented telemetry needed for product operation. It does not store Riot credentials or full match history in v1. Riot display identity is local by default; optional display metadata requires explicit consent.

## 3. Threat model

### 3.1 Browser pages and renderers

Assume malicious web pages, XSS, browser extensions, clickjacking, CSRF, stale sessions, malicious deep links, and hostile model/Markdown content.

Required controls:

- strict CSP with no `unsafe-eval`, restricted `connect-src`, and `frame-ancestors 'none'` unless explicitly required;
- secure HttpOnly SameSite cookies for web sessions; no access/refresh token in localStorage, sessionStorage, URLs, or page-visible state;
- CSRF protection and Origin validation for cookie-authenticated mutations;
- sanitized Markdown and URLs; no executable HTML, `javascript:` links, automatic downloads, or arbitrary remote media;
- Tauri capability allowlists exposing named commands only, never arbitrary shell, filesystem, process, network, or credential access;
- explicit confirmation and step-up authentication for enrollment, revocation, exports, secret changes, and any gameplay-affecting write.

CORS is a browser policy, not authentication. Production `/api/auth/token` must not disclose a launch token. A browser-development bootstrap may exist only behind a compile/runtime development guard, with an automated production-negative test.

### 3.2 Local processes and sidecar replacement

Assume another process can call loopback, inspect user-readable files, manipulate environment/configuration, replace an unsigned binary, crash the Agent, or compromise the renderer.

The Tauri host must:

- spawn the sidecar from an absolute installed path without shell interpretation;
- verify product identity, version, architecture, protocol compatibility, and signed manifest/hash before launch/update;
- generate a 32-byte or stronger per-launch credential and deliver it through a protected inherited pipe/handle or authenticated host bridge, never argv/env/file/URL;
- pass a minimal environment allowlist and fixed working directory;
- use an OS-backed single-instance lock and focus the existing window;
- own the Agent process tree and terminate it on quit, failed health, crash recovery, or update;
- expose only typed, schema-validated IPC with size limits and request IDs.

A Windows administrator/kernel compromise can inspect memory. ValoRecon does not claim to defeat that threat. It reduces blast radius with short-lived scoped credentials, signed updates, visible approvals, revocation, and no durable Riot tokens.

### 3.3 Cloud users and confused-deputy attacks

Assume stolen sessions, malicious authenticated users, tenant/device ID substitution, over-privileged operators, and a compromised cloud component. Tenant and user scope come from the authenticated principal, never a request body. Client-supplied device IDs are selectors, not proof of ownership.

A remote request is allowed only when:

`authenticated user AND owns target device AND entitlement active AND device enrolled/not revoked AND device online AND capability supported AND method allowlisted AND operation policy permits`

Use a mature authentication library/provider integration with standard password hashing, OIDC/OAuth state and nonce validation, secure server-side sessions or correctly validated short-lived tokens, rotating refresh tokens, revocation, and rate limiting. Do not invent authentication cryptography or session protocols.

### 3.4 Network and protocol attackers

All cloud traffic uses HTTPS/WSS with certificate and hostname verification. Riot loopback self-signed TLS is a narrowly scoped exception in the Riot local transport only; its permissive agent must never be reused for public/cloud traffic.

Cloud-Agent messages use the versioned schemas in `api-contracts.md`, authenticated connection identity, unique IDs, sequence/order rules, deadlines, replay protection, bounded payloads, queue limits, and explicit close codes. Reject expired, duplicate, malformed, downgraded, cross-device, unknown-method, and oversized messages. Never implement a generic remote URL/HTTP proxy.

### 3.5 Supply chain and third parties

Every release uses pinned dependencies and lockfiles, reviewed CI, SBOM, vulnerability/license checks, signed artifacts, provenance, checksums, and protected release credentials. CI actions are pinned to immutable revisions where applicable. Updates verify publisher, channel, version, metadata signature, payload hash, architecture, and downgrade policy.

Gemini, valorant-api.com, Riot endpoints, auth providers, registries, CDNs, and telemetry vendors receive only required data. Each adapter has explicit egress hosts, timeout, bounded retry, circuit breaker, redaction, and an operator kill switch. Third-party or model content is data and can never grant tools, permissions, or authorization.

## 4. Credential design

### 4.1 Local desktop-to-Agent credential

1. Tauri generates a high-entropy per-launch secret.
2. Tauri starts the expected Agent and transfers the secret through a protected one-use IPC channel or retains it in the host bridge.
3. Agent closes bootstrap IPC after successful transfer and accepts only authenticated requests on loopback.
4. Credentials are compared safely, scoped to the process lifetime, rotated on restart, and never returned by an HTTP endpoint.
5. Renderer feature code requests named operations through the trusted bridge; it does not read the credential.
6. A compromised/stale credential dies with the Agent instance.

`/api/health` may remain open but returns minimal liveness/build metadata only. Readiness, capabilities, state, diagnostics, and all feature routes require authentication.

### 4.2 Gemini key and local secret migration

Store a user-supplied Gemini key using Windows DPAPI/Credential Manager, scoped to the Windows user and ValoRecon install identity. Migrate legacy `server/data/ai_config.json` once: read locally, validate/store in the vault, remove the plaintext value through an atomic migration, and retain only a redacted migration result. Do not return a key to the renderer; settings display a mask and key status only.

Move mutable non-secret state to `%LOCALAPPDATA%\ValoRecon\` using restrictive ACLs, atomic writes, bounded retention, schema versions, backups, and rollback. Never write into the installation directory.

### 4.3 Device enrollment and rotation

1. A signed-in user starts enrollment and receives a single-use challenge with a five-minute expiry.
2. Agent generates a UUIDv4 `deviceId` and 32 random byte device secret locally.
3. The raw secret is stored in DPAPI/Credential Manager; cloud stores only a salted verifier/hash or public-key verifier.
4. Cloud displays device metadata and binds it to the authenticated user after proof and confirmation.
5. Agent exchanges device proof for a 15-minute access token and a rotating refresh token.
6. Refresh-token reuse revokes the family and marks the device suspicious.
7. User revocation stops new relay immediately and is enforced at heartbeat/reconnect; local cloud credentials are removed.
8. Reinstall creates a new device identity unless an explicit secure relink is completed.

User sessions and device principals are different. A user token cannot impersonate an Agent, and a device token cannot call user-account administration APIs.

## 5. Authorization and remote capability policy

Remote methods are declared capabilities such as health/status, career read, match read, coach stream, and approved settings metadata. Each declaration specifies minimum protocol/agent version, read/write risk, input/output schema, timeout, maximum bytes, entitlement, consent, and offline behavior.

Deny by default:

- arbitrary paths, methods, headers, URLs, filesystem paths, or shell commands;
- Riot credentials/debug output;
- local secret management;
- agent-select writes unless compliance, feature flag, explicit current user action, and policy all permit them;
- operations unsupported by the connected Agent version.

When automation is disabled, `/api/riot/select` and `/api/riot/lock` return the documented `VR-RIOT-403`; the background observer never calls either operation.

## 6. API hardening

- Loopback Agent: strict Host/Origin policy, authenticated custom header/bridge, constant-time credential check, request IDs, typed JSON 404/error middleware, no stack/provider error leakage.
- Cloud: versioned `/v1`, HTTPS only, secure cookies/session policy, CSRF protection, ownership filters on every query, database constraints, and least-privilege service identities.
- Validate all request/query/path data with shared schemas. Enforce content types, UUID/enums/ranges, maximum nesting/array/string sizes, and screenshot 5 MiB limit.
- Apply route-aware limits: stricter auth/enrollment/provider/mutation limits; return `429` with `Retry-After`.
- Apply security headers including CSP, HSTS on cloud, `nosniff`, no-referrer, and restrictive permissions policy.
- Abort work on disconnect/deadline. Limit SSE and WebSocket duration, bytes, queue depth, and decompression.
- Use idempotency keys for mutations; duplicate payloads return the original result and conflicting digests return a typed conflict.

## 7. Logging, telemetry, privacy, and retention

Redact before serialization or upload. Detect bearer/JWT/cookie/key/password/connection-string/Authorization patterns and replace them with typed redaction markers. Redaction failure blocks export.

Never log raw request bodies, chat, prompts, screenshots, Riot lockfile contents, tokens, player identifiers, or signed URLs. Hash device/account identifiers when operational correlation is needed. Metric labels are bounded and never contain user content.

Defaults:

- local structured logs: seven days and 100 MiB cap;
- cloud operational logs: 30 days;
- traces/crash reports: short bounded retention, opt-in where content risk exists;
- audit records: documented compliance retention;
- local reports/caches: size and age bounded with user deletion controls;
- chat/screenshots/gameplay telemetry: no cloud retention without explicit consent.

Telemetry is opt-out and local operation does not depend on telemetry. Provide account metadata export/deletion and explain unavoidable security-audit retention.

## 8. Error and audit requirements

All denials use a stable safe envelope with `code`, `message`, `requestId`, and `retryable`. Internal details stay in redacted local diagnostics. Security-relevant events include actor, target device, action/capability, policy/feature version, operation digest, request/trace ID, decision, result, and timestamp, but not payload secrets.

Audit enrollment, login/logout, device rename/revoke, entitlement/flag change, remote authorization, mutation approval, secret status change, update/signature result, support export, and emergency control use.

## 9. Incident controls

Operators must be able to revoke a device/session, rotate provider/enrollment/updater keys, pause remote mutations, disable a provider, quarantine a device/version, disable telemetry, and globally disable automation. Emergency actions are authenticated, audited, fail closed, and exercised in staging.

Response playbooks cover credential exposure, malicious release/update, cross-tenant access, Riot credential leakage, telemetry privacy leak, device theft, replay storm, and provider compromise. Each produces a regression test before closure.

## 10. Security acceptance gates

Automated tests must prove:

- production token bootstrap cannot disclose a credential to browser or no-Origin/local process requests;
- Agent binds only loopback and rejects missing/wrong/stale credentials;
- unknown routes/errors are typed JSON with no stacks or secrets;
- validation, content, body, stream, and rate limits work;
- disallowed Origin/CSRF/tenant substitution/cross-user device requests fail;
- enrollment expiry, duplicate use, token rotation/reuse, revocation, and replay fail safely;
- Cloud and browser bundles never contain Riot/Gemini/device/signing secrets;
- Riot permissive TLS is isolated from cloud HTTPS;
- feature flag off returns `VR-RIOT-403` and observer never locks;
- logs, metrics, traces, crashes, and support bundles pass a seeded redaction corpus;
- unsigned, wrong-channel, downgraded, wrong-architecture, expired, or hash-mismatched updates are rejected;
- dependency, license, secret, SBOM, and artifact scans pass or have explicit expiring approvals.

Public release remains blocked until these gates, signed artifacts, and the human `compliance.md` decision are complete.
