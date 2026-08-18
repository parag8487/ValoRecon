# ValoRecon — Product Requirements

**Version:** 1.0 (production baseline) · **Date:** 2026-08-18
Companion documents: [`design.md`](./design.md) (how), [`tasks.md`](./tasks.md) (when).

---

## 1. Product definition

ValoRecon is a **Windows desktop application** that reads a player's own VALORANT
account and live game state from their PC and turns it into coaching: an AI coach
chat, post-match analysis, performance trends, an agent-select advisor, and account
views (store, loadout, battlepass, career). A **web/mobile companion** lets the same
user see the same information away from the PC, by talking to their PC through the
ValoRecon cloud.

One sentence: *ValoRecon is your AI VALORANT coach on your PC, reachable from your
phone.*

### 1.1 What the user must see

```
Download ValoRecon → Install → Launch → Sign in → "PC connected" → Use it
```

The user must never see, configure, or be told about: Node.js, npm, Express, ports,
tokens, Tauri, WebSockets, sidecars, device IDs, Cloudflare, lockfiles, or the
distinction between "agent" and "app".

### 1.2 What the product is not

- Not a cheat, overlay, aim assist, memory reader, or input injector.
- Not a Riot-affiliated or Riot-endorsed product.
- Not a multi-user/team platform in v1 (one account = one human, N of their own PCs).
- Not cross-platform in v1 (Windows only; VALORANT is Windows only).

---

## 2. Actors and the user/device model

```
User (1) ──owns──▶ Device (N) ──runs──▶ Agent (1 per device)
  │                    │
  │                    ├── deviceId        UUIDv4, generated at enrollment
  │                    ├── deviceSecret    32 random bytes; hash stored in cloud
  │                    ├── installId       survives app updates, not reinstalls
  │                    ├── displayName     user-editable, defaults to hostname
  │                    └── agentVersion    reported on every connect + heartbeat
  │
  ├── Entitlement (plan, status, expiry, grace)
  ├── Session (browser/web client auth session)
  └── RemoteSession (a web client ↔ device authorization window)
```

**Hard rules:**
- Identity is `deviceId`, never hostname. Hostname is display metadata only and may
  change or collide.
- A reinstall produces a **new** `deviceId` unless the user explicitly re-links; the
  cloud must tolerate orphaned devices and let the user delete them.
- One agent per device. A second agent on the same device must fail to start
  (single-instance lock), not race the first.
- Riot account identity (`puuid`, `gameName#tag`) is **device-local**. The cloud may
  store a display name for the device list only if the user opts in; it must never
  store Riot tokens.

---

## 3. Functional requirements

Notation: **MUST** / **SHOULD** / **MAY**. `[P]` = preserve existing behaviour.

### 3.1 Desktop application

| ID | Requirement |
|---|---|
| FR-D01 | The app MUST install via a signed Windows installer with no developer tooling on the target machine. |
| FR-D02 | Launching the app MUST start the Agent automatically and MUST NOT require any terminal command. |
| FR-D03 | The app MUST show a truthful connection state at all times: Agent connecting / connected / crashed / unsupported; VALORANT running / not running; Cloud online / offline / signed-out. |
| FR-D04 | If the Agent exits unexpectedly, the app MUST restart it with backoff and MUST tell the user after repeated failure — never a blank screen or a raw error. |
| FR-D05 | Closing the window SHOULD minimise to the system tray; quitting from the tray MUST shut the Agent down cleanly. |
| FR-D06 | The app MUST NOT leave an orphaned Agent process after quit, crash, or update. |
| FR-D07 | The app SHOULD offer launch-on-Windows-startup (default off) and MUST honour it. |
| FR-D08 | The app MUST report its version in the UI and MUST check for updates on launch (and every 6 h). |
| FR-D09 | All 13 existing screens MUST keep working. `[P]` |
| FR-D10 | The app MUST work fully with the cloud unreachable, for every local feature. |
| FR-D11 | Only one instance may run; launching again MUST focus the existing window. |

### 3.2 Local Agent

| ID | Requirement |
|---|---|
| FR-A01 | The Agent MUST bind loopback only (`127.0.0.1`), never `0.0.0.0`. |
| FR-A02 | The Agent MUST require a per-launch credential on every endpoint except `/api/health`. `[P, hardened]` |
| FR-A03 | The Agent MUST preserve all 45 existing HTTP handlers (43 router handlers plus `/api/health` and the development-only token bootstrap) with unchanged public response shapes unless a versioned contract migration is documented. `[P]` |
| FR-A04 | The Agent MUST keep the live-Riot-with-mock-fallback pattern and the `source: 'live' \| 'mock'` provenance field on every account payload. `[P]` |
| FR-A05 | The Agent MUST keep SSE streaming for `/api/chat`, including the `meta` frame, `[DONE]` terminator, and upstream abort on client disconnect. `[P]` |
| FR-A06 | The Agent MUST keep the Riot rate-limit protections (3-concurrent queue, 70 ms spacing, per-domain TTL caches). `[P]` |
| FR-A07 | The Agent MUST expose health and version metadata for the desktop shell and the cloud. |
| FR-A08 | The Agent MUST execute the same business logic for local HTTP callers and authenticated remote (cloud-relayed) callers, with no duplicated logic. |
| FR-A09 | The Agent MUST shut down gracefully: stop accepting connections, end SSE streams, clear timers, flush logs, exit ≤ 5 s. |
| FR-A10 | The Agent MUST store all mutable state under `%LOCALAPPDATA%\ValoRecon\`, never next to its executable. |
| FR-A11 | The Agent MUST work with VALORANT closed, Riot Client closed, and no Gemini key — degraded but never crashing. `[P]` |
| FR-A12 | The Agent MUST NOT log secrets (see `security.md` §5). |
| FR-A13 | Agent-select automation MUST be behind a default-off feature flag (see `compliance.md`). |

### 3.3 Cloud platform

| ID | Requirement |
|---|---|
| FR-C01 | The cloud MUST authenticate users (email+password and at least one OAuth provider) with a mature library, not a homegrown scheme. |
| FR-C02 | The cloud MUST support device enrollment, listing, renaming, and revocation. |
| FR-C03 | The cloud MUST track per-device: online/offline, last seen, agent version, app version, platform. |
| FR-C04 | The cloud MUST authenticate agents with a device credential distinct from user credentials, exchanged for short-lived tokens. |
| FR-C05 | The cloud MUST accept an outbound-only agent connection — no inbound ports, no router configuration, no public exposure of the local API. |
| FR-C06 | The cloud MUST authorise every remote request against (user owns device) ∧ (entitlement active) ∧ (device online) before relaying. |
| FR-C07 | The cloud MUST relay both unary and streaming responses (chat) to web clients. |
| FR-C08 | The cloud MUST serve entitlements and feature flags, and MUST NOT be required for local features. |
| FR-C09 | The cloud MUST accept telemetry and error reports, with secrets stripped agent-side before send. |
| FR-C10 | The cloud MUST NOT contain Riot integration code and MUST NOT store Riot tokens. |
| FR-C11 | The cloud MUST version its API (`/v1/…`) and reject/upgrade unknown agent protocol versions explicitly. |

### 3.4 Web / mobile companion

| ID | Requirement |
|---|---|
| FR-W01 | The web client MUST let a user sign in and see their devices with live status. |
| FR-W02 | The web client MUST clearly distinguish PC online / PC offline / VALORANT running / not running / Agent connected / disconnected — five distinct, named states, never a spinner and never a raw error. |
| FR-W03 | When the PC is offline the web client MUST show an explanatory empty state plus last-known cached data with its timestamp — offline MUST NOT look broken. |
| FR-W04 | The web client MUST reuse the desktop UI components and the shared contracts; no forked second implementation of screens. |
| FR-W05 | The web client MUST NOT contact Riot endpoints directly, ever. |
| FR-W06 | Remote-capable features MUST be declared per-capability so the web client can hide what a given agent version cannot do. |

### 3.5 Preserved features (regression list) `[P]`

All of these work today and are the acceptance baseline for every milestone:

1. Command dashboard (career KPIs, top agents, recent matches)
2. AI coach chat with token-by-token SSE streaming, suggestion chips, markdown,
   👍/👎 feedback, stop button, context-window meta notice
3. Match list + match detail (scoreboard, rounds, economy)
4. "Analyze with AI" → zod-validated report, cached, with rule-based fallback
5. Live match tracker (map, score, agents, ults, credits)
6. Agent select advisor (recommend mode + fast-pick mode)
7. Lineups knowledge base (filter + search + meta)
8. Statistics + trends (recharts, windows, deltas)
9. Store / night market, wallet
10. Loadout / arsenal
11. Battlepass + quests
12. Settings: theme accent, AI engine (key + model + verify + test), tone, account
    info, API health
13. Screenshot analysis (multimodal)
14. Coach suggestions / trends / weekly plan (deterministic, no LLM cost)
15. AI usage + cost counters
16. Live-vs-mock provenance on every account payload

---

## 4. Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Startup | Window visible ≤ 2 s; Agent healthy ≤ 5 s on a mid-range PC. |
| NFR-02 | Footprint | Idle: < 200 MB RSS total, < 1 % CPU average. Riot polling stays within existing throttles. |
| NFR-03 | Installer | < 40 MB; single `.exe`/`.msi`; WebView2 bootstrapped if absent. |
| NFR-04 | Latency | Local API p95 < 150 ms for cached reads. Remote round-trip p95 < 1.5 s on a 50 ms RTT link. |
| NFR-05 | Reliability | Agent crash detected < 3 s, restarted < 5 s. Cloud reconnect with jittered backoff, capped 60 s. |
| NFR-06 | Availability | Cloud target 99.5 %. Cloud outage MUST NOT degrade any local feature. |
| NFR-07 | Security | See `security.md`. No secret in any browser bundle. No Riot token off-device. |
| NFR-08 | Privacy | Telemetry opt-out; no gameplay content or chat text sent to the cloud without explicit consent; documented retention. |
| NFR-09 | Observability | Structured JSON logs with redaction, rotated 7 days locally; every user-visible failure carries a `VR-*` code. |
| NFR-10 | Compatibility | Cloud MUST serve agents ≥ 2 minor versions old. Desktop MUST refuse to run an agent older than `minAgentVersion` with a clear message. |
| NFR-11 | Reproducibility | Every dependency version-pinned; `npm ci` from committed lockfiles; documented one-command build. |
| NFR-12 | Testability | Every boundary (local auth, contracts, device enrollment, cloud auth, relay authorization, reconnect, lifecycle) has automated tests. |
| NFR-13 | Accessibility | Keyboard navigable, focus-visible, ≥ 4.5:1 contrast on text, no colour-only state. |
| NFR-14 | i18n-ready | User-facing strings centralised; English only in v1. |

---

## 5. Environments

| Env | Web | Cloud | Agent |
|---|---|---|---|
| dev | `vite` on :5173 | `localhost:8080` + local Postgres (docker) | `tsx watch`, :8799, token via handshake file |
| staging | built bundle on staging domain | staging deployment + staging DB | signed pre-release installer, `channel=beta` |
| prod | app.valorecon.* | api.valorecon.* | packaged sidecar, `channel=stable` |

Dev-only conveniences (the token bootstrap HTTP endpoint, permissive CORS, verbose
logs) MUST be compiled/guarded out of production builds, and there MUST be a test
asserting that.

---

## 6. Out of scope for v1 (explicitly)

macOS/Linux; team/coach multi-user accounts; payment processing (schema and
entitlement checks only, no checkout); push notifications; an in-game overlay of any
kind; storing full match history in the cloud; social/sharing features;
tournament/scrim tooling; Riot's official developer APIs (no key, not required).

---

## 7. Acceptance definition for "production ready v1"

1. Fresh Windows machine, no dev tools: installer runs, app launches, agent healthy,
   all 13 screens populated (live if VALORANT running, mock-tagged if not).
2. All 16 preserved features in §3.5 verified by hand against the pre-refactor build.
3. Cloud down (hosts-blocked): every local feature still works; UI shows "Cloud
   offline" and nothing else changes.
4. Agent killed via Task Manager: desktop detects, restarts, UI recovers, no dialog
   loop, no orphan process.
5. VALORANT closed mid-session: screens flip to explanatory states with mock/cached
   provenance, no raw errors, no console exceptions.
6. Sign in on web, device shows online, one remote read and one remote stream
   succeed; PC then shut down → device shows offline with last-seen and cached data.
7. `npm run test` green in all packages; local-auth negative tests pass; a scan of a
   production build finds no secret in any browser bundle.
8. Update: v1.0.0 → v1.0.1 installs via the in-app updater; agent version compat
   check passes; rollback path documented and tried once.
9. `compliance.md` §6 signed.
