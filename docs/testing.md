# Testing Specification

## Status and testing principles

This is the target test specification for ValoRecon. The audited repository currently has 24 server tests in Node's built-in test runner, no frontend test framework, no CI configuration, and no Tauri/cloud implementation. Commands for future suites are specified below as interfaces to add; they must not be reported as passing until implemented.

Testing follows a characterization-first sequence. Preserve the existing `server/` behavior and live-or-mock provenance while refactoring. For every change, write a failing test for the intended behavior, run it to prove the failure is meaningful, implement the smallest change, run the focused test, then run the relevant complete suite.

## 1. Test pyramid and ownership

### Static and policy checks

Fast checks run on every change:

- TypeScript compilation for server and web.
- Rust formatting, Clippy, and compile checks once Tauri exists.
- Schema/contract validation and generated-client drift check.
- Lockfile consistency and dependency pinning; reject `latest` and undeclared registries.
- Secret scanning of source, bundles, logs, fixtures, installers, and artifacts.
- License policy, vulnerability audit, SBOM generation, and production-config checks.
- Formatting/linting once configured. The current repository has neither, so adding the tools and CI gate is required work.

### Unit tests

Most tests should be deterministic and fast: pure coach analytics, agent advisor decisions, zod schemas, config resolution, version compatibility, cache TTL/LRU behavior, Riot queue limits, SSE frame parsing, retry/backoff, redaction, migration transforms, updater metadata verification, and UI components/hooks.

### Integration tests

Use real process boundaries where the contract crosses a module or transport: `createApp()` with an ephemeral port, filesystem state under a temp `%LOCALAPPDATA%`, fake Riot HTTPS transport, fake Gemini transport, local cloud auth/device service, relay, WebSocket, and sidecar lifecycle. Avoid replacing the system under test with mocks that only prove mock behavior.

### End-to-end and manual tests

E2E tests install a release-equivalent desktop app on a clean Windows environment and exercise user-visible workflows. Manual tests cover real Riot Client/VALORANT behavior, signed installers, WebView2, tray/lifecycle, update/rollback, and network failure. Manual evidence must include build version, OS, channel, result, and defect IDs.

## 2. Characterization baseline first

Before refactoring, capture and keep green:

```bash
npm ci
npm ci --prefix server
npm ci --prefix web
npm run build
npm run build --prefix server
npm test --prefix server
npm run build --prefix web
```

Expected current baseline from `docs/AUDIT.md`: server build exits 0; server tests are 24 pass/0 fail; web build exits 0 with the existing Vite large-chunk warning. Snapshot or contract-test the 45 existing HTTP handlers, response shapes, `source: 'live' | 'mock'` provenance, `/api/chat` SSE `meta`/text/`[DONE]` protocol, rule-based AI fallback, cache behavior, and coach analytics. Record intentional contract changes instead of silently updating snapshots.

The characterization suite must run with no Gemini key, no Riot lockfile, and an isolated temporary data directory. It must never contact Gemini, Riot, or valorant-api.com. The existing tests' `VALORECON_TEST`, blank Gemini key, and empty `LOCALAPPDATA` approach is the starting pattern.

## 3. Exact test commands and suite layout

Until scripts are added, these are the commands that actually exist:

```bash
npm test --prefix server
npm run build --prefix server
npm run build --prefix web
npm run build
```

Add explicit scripts and use them in CI:

```text
root:        npm run test:all, npm run lint, npm run typecheck, npm run test:e2e
server:      npm test, npm run test:unit, npm run test:integration, npm run coverage
web:         npm test, npm run test:watch, npm run coverage
shared:      npm test, npm run generate, npm run check
cloud:       npm test, npm run test:integration
desktop:     cargo test, cargo clippy -- -D warnings, npm run tauri:test
```

Recommended tags/directories:

- `server/src/tests/characterization/`
- `server/src/tests/unit/`
- `server/src/tests/integration/`
- `server/src/tests/security/`
- `web/src/**/*.test.tsx`
- `desktop/src-tauri/tests/` and desktop lifecycle fixtures
- `tests/contracts/`, `tests/e2e/`, `tests/manual/`, `tests/fixtures/`

Coverage is a signal, not the gate by itself. Require branch and negative-case coverage for auth, config, protocol parsing, migrations, and mutating Riot operations. Do not lower the existing 24-test baseline to make a refactor green.

## 4. Contract and schema tests

Create one versioned contract source used by server and web. Test:

- every preserved route's method/path/status/body shape;
- required `source` provenance on live-or-mock account payloads;
- nullable/optional fields and enum values;
- malformed request bodies for `/api/chat`, `/api/match-analysis/ai`, `/api/agent/choose`, `/api/ai/settings`, `/api/riot/select`, `/api/riot/lock`, and `/api/riot/autopick`;
- UUID, length, range, enum, content-type, and 5 MB screenshot limits;
- SSE event schema, ordering, terminal `[DONE]`, upstream error, and disconnect abort;
- cloud `/v1` version negotiation and explicit rejection of unsupported Agent protocol versions;
- device enrollment, heartbeat, entitlement, relay authorization, update metadata, and migration schemas.

Contract tests must fail on additive or breaking changes unless the API version and migration are updated deliberately.

## 5. Local auth and security negative cases

The current launch-token bootstrap is a documented critical hole. Add tests that define the hardened target:

- `/api/health` is the only intentionally open production endpoint.
- Missing, empty, malformed, wrong, stale, and duplicated `x-valorecon-token` values return typed 401 responses.
- `/api/auth/token` is development-only or uses the authenticated Tauri handshake; it must not disclose the token to arbitrary no-Origin requests in production.
- Disallowed Origins, absent Origin, `null` Origin, preflight methods/headers, and cross-site requests are rejected according to production policy.
- Token comparison is constant-time and token rotation invalidates the old token.
- Unknown routes return JSON error codes, not Express HTML or stack traces.
- Request-size, rate-limit, content-type, and method checks are enforced.
- Error responses and logs contain no launch token, Riot lockfile password, access/entitlements token, Gemini key, device secret, OAuth token, chat text when disallowed, or raw internal exception.
- Production bundles contain no `GEMINI_*`, `VITE_*` secret, test token, dev endpoint, or token-bootstrap code.
- Agent binds only to `127.0.0.1`; cloud never receives Riot credentials.
- Agent-select automation flag off returns `403 { code: 'VR-RIOT-403', ... }` and the poller never calls `lockAgent`. This remains blocked by the open compliance decision in `docs/compliance.md`; tests must not be used as a claim that the feature is approved.

## 6. Riot adapters with fake transport

Split Riot access behind an injectable transport and test all adapter behavior without a live account. The fake transport must record method, URL, headers, body, order, concurrency, and cancellation.

Cover:

- missing/malformed/rotated lockfile and invalid port/password;
- self-signed local TLS behavior is scoped only to Riot loopback and does not disable verification for cloud/public HTTPS;
- Basic auth construction without logging credentials;
- entitlements negotiation, JWT parsing, shard/region resolution, and expired session refresh;
- timeout, connection refusal, malformed JSON, 401/403/404/429/5xx, and partial payloads;
- live response normalization and mock fallback with correct `source` provenance;
- `RequestQueue` maximum three concurrent requests and 70 ms minimum start spacing;
- bounded cache hit, TTL expiry, LRU eviction, stale/error behavior, and cache isolation;
- read-only phase/presence/lobby/account calls;
- `selectAgent`/`lockAgent` validation and disabled feature flag refusal;
- poller start/stop, timer cleanup, phase transitions, and guarantee that observation never causes an automatic lock;
- Riot close/restart during a request and graceful cancellation.

No test may call Riot's real undocumented endpoints in the default suite. A separately gated manual suite may use a dedicated test account only after compliance approval and must never persist its credentials.

## 7. Cloud auth, device, and relay

For planned cloud services, use a local ephemeral database or container fixture and fake external OAuth/device providers. Test:

- email/password success, wrong password, unknown user, disabled account, rate limit, reset expiry, and session revocation;
- OAuth state/nonce mismatch, callback replay, provider error, missing email, account-link conflict, and logout;
- device enrollment generates UUIDv4 identity and a secret whose hash only is stored cloud-side;
- duplicate enrollment, reinstall/new device, rename, list, revoke, deleted/orphaned device, and single-agent-per-device lock;
- short-lived device token exchange, expiry, rotation, replay, audience, issuer, and clock skew;
- heartbeat transitions and stale/offline detection;
- relay authorization requires user owns device, entitlement is active, device is online, capability is supported, and request scope is allowed;
- cloud outage, relay timeout, backpressure, unauthorized device, and unknown protocol version;
- cloud never stores or receives Riot tokens, lockfile passwords, unconsented chat/gameplay content, or secrets stripped by the Agent.

These tests are future gates; no cloud implementation is currently present.

## 8. WebSocket, streaming, reconnect, and cancel

Test the Agent/cloud/client protocol with a deterministic fake clock and controllable transport:

- connect handshake, protocol/version negotiation, authentication, heartbeat, and close codes;
- clean close, server close, TCP reset, DNS failure, TLS failure, timeout, and captive/intermittent network;
- jittered exponential reconnect capped at 60 seconds, no reconnect storm, and cancellation of pending timers;
- duplicate/out-of-order messages, message IDs, replay/ack policy, bounded buffers, and backpressure;
- unary response relay and chat stream relay preserving `meta`, text chunks, error, and `[DONE]` ordering;
- user cancellation and client disconnect abort upstream Gemini generation and relay work;
- Agent restart and cloud reconnect restore truthful UI state without duplicating a request;
- offline-to-online transition, stale last-seen data, and entitlement/device revocation while connected.

## 9. Frontend tests

Add a browser test runner and DOM component framework; none exists today. Test shared API client behavior, not implementation details:

- request token/header handling, typed errors, timeout, retry policy, and no token leakage to logs;
- SSE parser handles chunk boundaries, multi-line frames, malformed events, `[DONE]`, abort, and server errors;
- all 13 existing screens render loading, success, empty, mock-provenance, offline, unauthorized, and server-error states;
- connection state distinguishes Agent connecting/connected/crashed/unsupported, VALORANT running/not running, and cloud online/offline/signed-out;
- route/deep-link behavior under Vite and Tauri asset protocol;
- settings validation, masked key display, consent/feature flags, and no secret in rendered HTML;
- keyboard navigation, focus visibility, contrast, responsive layout, and no color-only state;
- polling cancellation on unmount and no duplicate intervals after navigation;
- React error boundaries show typed recovery UI rather than blank screens.

Use visual regression only for stable, user-visible contracts. Do not assert internal component structure or generated class names.

## 10. Tauri and Agent lifecycle tests

Once the desktop shell exists, test with a fake sidecar executable and a real packaged build:

- first launch starts the Agent and waits for health within 5 seconds;
- wrong executable, wrong architecture, bad protocol, immediate exit, hung startup, and repeated crash backoff;
- window close/minimize/tray behavior, explicit quit, second-instance focus, startup-on-Windows option;
- Agent shutdown stops accepting requests, drains SSE, clears autopick/read-only timers, flushes logs, and exits within 5 seconds;
- kill Agent externally and verify UI recovery, bounded restart, and no dialog loop;
- runtime state migration from executable-adjacent data to `%LOCALAPPDATA%\\ValoRecon\\`, backup, permissions, corruption, and rollback;
- install, uninstall, upgrade, failed upgrade, stale process cleanup, and protocol compatibility;
- update checks at launch and six-hour interval without blocking startup;
- WebView2 absent/present, CSP, offline assets, deep links, and clean-machine launch.

## 11. End-to-end scenarios

On a clean Windows VM using release-equivalent artifacts, run at minimum:

1. Install with no Node/npm/Rust tooling; launch and see Agent healthy, version, and all screens.
2. Launch a second instance; existing window focuses and no second Agent starts.
3. No VALORANT/Riot Client and no Gemini key; local screens use mock/cached data with provenance and no crash.
4. Configure Gemini through the supported settings path; verify masked display, test failure/success, persistence permissions, and no plaintext release artifact.
5. Start/stop the Agent; verify detection, restart backoff, no orphan, and recovery.
6. Run chat; verify streamed meta/text/done and stop mid-generation; verify upstream cancellation.
7. Run account reads through fake/live-approved Riot path; verify queue/cache and fallback.
8. Cloud unreachable; all local features remain usable and cloud status is truthful.
9. Sign in to web, enroll device, see online status, perform one remote read and one stream, then shut down PC and verify offline/last-seen behavior.
10. Install v1.0.0, update to v1.0.1 through beta feed, validate signature/hash, restart, and verify rollback to v1.0.0.
11. Attempt unsigned, expired, wrong-channel, downgraded, wrong-platform, and hash-mismatched update; all are rejected.

## 12. Performance and reliability

Automate benchmarks with fixed fixtures and record hardware/runtime:

- Agent health and desktop visible startup: target ≤ 5 s and ≤ 2 s respectively.
- Cached local API p95 < 150 ms.
- Remote round-trip p95 < 1.5 s at 50 ms RTT.
- Total idle RSS < 200 MB and average CPU < 1% on a defined mid-range Windows machine.
- Crash detection < 3 s and restart < 5 s.
- SSE first event and cancellation latency; no leaked timers, sockets, or child processes over repeated runs.
- Riot queue concurrency/spacing and cache memory bounds under sustained polling.
- Cloud relay reconnect and bounded memory under dropped connections.
- 30-minute report growth and retention/cleanup behavior.

Performance tests are thresholds with variance margins and must fail on regression, not merely print timings.

## 13. Supply-chain and security verification

Every release candidate must run:

- `npm ci` from each committed lockfile and dependency tree diff against the approved baseline;
- vulnerability and license audit with documented exceptions;
- SBOM generation and package-name/version/hash verification;
- secret scan source, Git history, bundles, `server/dist`, installer, and logs;
- provenance verification and artifact checksum verification;
- production config/CSP inspection and no-development-endpoint assertion;
- Windows Authenticode and timestamp verification for sidecar, executables, and installer;
- updater metadata signature/key-rotation/expiry/downgrade tests;
- installer archive inspection for unexpected files, credentials, debug symbols, or source data.

A vulnerability or license exception needs an owner, rationale, expiry, and explicit release approval. A missing scanner or signing service is a blocker, not a passing result.

## 14. Manual release matrix

Record evidence for each row:

| Area | Windows 10 x64 | Windows 11 x64 | Clean VM | Existing install | Staging/beta | Stable |
|---|---:|---:|---:|---:|---:|---:|
| Fresh install and uninstall | required | required | required | n/a | required | required |
| Launch/Agent health/version | required | required | required | required | required | required |
| Second instance/tray/quit | required | required | required | required | required | required |
| Riot closed/open and mock fallback | required | required | required | required | required | required |
| Gemini absent/invalid/valid | required | required | required | required | required | required |
| Cloud offline/online/device relay | required | required | required | required | required | required |
| Update signature/hash/restart | required | required | required | upgrade | required | required |
| Failed update and rollback | required | required | required | required | required | required |
| Accessibility/CSP/offline assets | required | required | required | required | required | required |
| Authenticode/trust warning | required | required | required | required | required | required |

Real Riot testing is manual and separately controlled because the current adapter uses undocumented local APIs and the compliance decision for gameplay writes is open.

## 15. CI release gates

A pull request gate requires static checks, characterization tests, server tests, web type/build checks, contract tests, security negatives, and secret scanning. A release-candidate gate additionally requires integration, fake Riot, auth/device/relay, streaming/reconnect, Tauri lifecycle, clean Windows E2E, supply-chain, reproducibility, signatures, SBOM, checksums, and staging smoke tests. Stable promotion requires all manual matrix rows applicable to the release, signed compliance decision, immutable artifact digest, rollback evidence, and a named approver.

No document or CI summary may say “all tests pass” while a planned suite is absent. Report current baseline separately from future gates, including the audited 24 server tests and the current lack of frontend, Tauri, cloud, and CI infrastructure.
