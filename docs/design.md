# ValoRecon Production Architecture

**Status:** canonical implementation direction · **Scope:** Windows desktop, local agent, cloud, shared web companion

## 1. Canonical shape

ValoRecon has four boundaries:

1. Tauri desktop shell: owns the window, tray, installer, updater, single-instance behavior, and sidecar lifecycle.
2. Local Agent: the existing Express/TypeScript server hardened and packaged as a sidecar. It is the only layer allowed to read Riot Client state or call Riot local/PvP/GLZ APIs.
3. Cloud modular monolith: identity, device enrollment, entitlements, feature flags, relay, telemetry, and audit. It never contains Riot integration or Riot tokens.
4. Web/mobile companion: authenticated UI that calls the cloud only. It never calls localhost or Riot endpoints.

The gaming PC remains authoritative for Riot data and all local features. Cloud unavailability must not break the desktop experience.

## 2. Runtime topology

```text
Tauri desktop
  ├─ embedded web UI
  └─ managed Agent sidecar (127.0.0.1 only)
       ├─ existing 45-handler compatibility surface
       ├─ Riot local/PvP/GLZ adapters
       ├─ Gemini adapter and local state
       └─ outbound authenticated WebSocket -> Cloud

Web/mobile -> HTTPS -> Cloud API + relay -> authenticated Agent WebSocket
```

The desktop shell starts the Agent with a generated per-launch secret delivered through an OS-protected mechanism or inherited handle; it must never place the secret in a command line, URL, browser bundle, or log. The Agent refuses non-loopback binds.

## 3. Authority matrix

| Capability | Desktop | Agent | Cloud | Web/mobile |
|---|---|---|---|---|
| Riot lockfile, local session, game state | no | authoritative | never | never |
| Local account/gameplay reads | UI only | authoritative | cached metadata only | via relay |
| AI key local mode | UI settings | stores/uses locally | never receives key | cloud provider mode only |
| User identity and sessions | displays | no authority | authoritative | consumes |
| Device enrollment/revocation | initiates | proves possession | authoritative | manages |
| Entitlements/feature flags | consumes | enforces local flag | authoritative | consumes |
| Audit/telemetry | emits | redacts and emits | stores with retention | displays allowed records |

## 4. Repository target

```text
apps/desktop/                 Tauri shell and sidecar supervisor
apps/web/                     shared React UI entry points
packages/contracts/           versioned Zod schemas and generated TS types
packages/ui/                  shared screens/components
services/agent/               hardened extraction of current server/
services/cloud/               modular monolith API, auth, relay, persistence
infra/                        local-dev and deployment manifests
scripts/                      build, packaging, compatibility and audit scripts
docs/                         this specification set
```

Migration is incremental. First preserve the existing `server/` and `web/` paths, add contracts and boundaries, then move modules with characterization tests. Do not perform a blind rewrite.

## 5. Module ownership

The Agent owns Riot adapters, local storage, AI local mode, route compatibility, SSE, caches, queueing, and local health. Split `riotClient.ts` by transport, authentication/session, cache/queue, read adapters, and the separately gated `RiotAutomationService`. The Cloud owns users, devices, sessions, entitlements, relay authorization, protocol compatibility, telemetry, and audit. The UI owns presentation and user intent, never credentials or authority.

## 6. Technology decisions

- Keep TypeScript for the current Agent and Cloud migration; add strict shared Zod contracts.
- Use Tauri 2 for the Windows shell and a managed Node sidecar first; do not introduce a native rewrite before behavior is covered.
- Use a modular cloud monolith with PostgreSQL. Add Redis only when measured coordination or rate-limit needs justify it.
- Use outbound WSS from Agent to Cloud with short-lived access tokens and protocol version negotiation.
- Use structured JSON logs with redaction and stable `VR-*` error codes.
- Pin every dependency and commit lockfiles. Replace `@google/genai: latest` with a verified pinned version.

## 7. Non-negotiable migration rules

Preserve all 45 HTTP handlers, all 13 screens, SSE `meta` and `[DONE]` frames, live-vs-mock provenance, Riot queue/cache limits, deterministic coach logic, validated analysis reports, and offline local behavior. Every changed response requires a versioned contract and compatibility test. Automation remains disabled by default pending `docs/compliance.md` sign-off.

## 8. Failure boundaries

A crashed Agent is reported and restarted by Tauri with bounded backoff. A disconnected Cloud changes only remote status. A missing Riot session returns typed degraded state and mock provenance. A missing AI key retains deterministic features and returns a typed provider-unavailable error for generation. No boundary may fabricate live data.
