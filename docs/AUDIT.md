# ValoRecon — Repository Audit (Phase 1)

**Audited:** 2026-08-18 · **Path:** `C:\IMP\ValoRecon-backup` · **Method:** file reads +
`npm run build` + `npm test` in both packages. Every statement below is verified
against the code as it exists now. Line references are current at audit time.

---

## 1. Repository shape

```
ValoRecon-backup/
├── .gitignore
├── AGENTS.md              original build-agent instructions (historical)
├── README.md              user-facing readme (partly out of date — see §9)
├── SPEC.md                original build spec (materially out of date — see §9)
├── package.json           root orchestrator (concurrently), NOT npm workspaces
├── package-lock.json      root lockfile (11 KB, dev deps only)
├── server/                Express + TypeScript API  ← becomes the Local Agent
│   ├── .env               real, gitignored (contains only PORT)
│   ├── .env.example
│   ├── data/              RUNTIME STATE + SECRETS (gitignored)
│   │   ├── ai_config.json      ← plaintext Gemini API key
│   │   ├── autopick_state.json ← persisted instalock config
│   │   ├── feedback.jsonl
│   │   └── reports/*.json      persisted AI match analyses
│   ├── dist/              build output (gitignored, present in tree)
│   ├── src/
│   │   ├── index.ts            entrypoint + createApp() factory (120 lines)
│   │   ├── routes/             17 routers, 43 handlers
│   │   ├── services/           5 services, 4 196 lines total
│   │   ├── data/*.json         10 mock fixtures (53 KB)
│   │   ├── tests/              2 files, 24 tests
│   │   └── evals/golden.ts     manual AI eval harness
│   ├── package.json  tsconfig.json  package-lock.json
├── web/                   React 18 + Vite 6 + TypeScript ← becomes shared UI
│   ├── index.html
│   ├── dist/              build output (gitignored, present in tree)
│   ├── src/
│   │   ├── main.tsx  App.tsx  index.css (194 lines)
│   │   ├── api/client.ts       998 lines: transport + ALL duplicated types
│   │   ├── shell/              NavRail (249), TitleBar (221)
│   │   ├── components/         4 components (893 lines)
│   │   └── screens/            13 screens (5 447 lines)
│   ├── package.json  vite.config.ts  tsconfig.json  package-lock.json
├── _build/                agent scratch: driver scripts, iteration logs
└── _design/redesign-v1.html   20 KB design mock
```

**Total application source:** ~13 400 lines (server 4 900 · web 8 500).

### 1.1 Git state — **critical**

```
branch: master
commits: 0            ← "fatal: your current branch 'master' does not have any commits yet"
remote:  none
status:  every file untracked
```

There is **no version history and no rollback point**. Any refactor is currently
irreversible. This is finding **A-01** and must be fixed before any code changes.

### 1.2 Toolchain present on this machine (verified)

| Tool | Version | Needed for |
|------|---------|-----------|
| Node | 24.8.0 | agent, web, cloud |
| npm | 11.6.0 | workspaces |
| Rust / cargo | 1.93.0 | Tauri desktop shell |
| MSVC Build Tools | VS 2022 present | Tauri Windows build |
| Tauri CLI | **not installed** | must be added as a dev dependency |
| Docker | 29.6.2 | cloud local dev (Postgres) |

---

## 2. Package managers, build system, scripts

Three separate npm projects, three lockfiles, **no workspaces**. The root package
orchestrates via `--prefix`:

| Script (root) | Expands to |
|---|---|
| `npm run dev` | `concurrently "npm run dev --prefix server" "npm run dev --prefix web"` |
| `npm run build` | `build:server` (`tsc`) then `build:web` (`tsc && vite build`) |
| `npm start` | `server: node dist/index.js` + `web: vite preview` |

| Script (server) | Command |
|---|---|
| `build` | `tsc` → `dist/` (CommonJS, ES2022, `strict: true`) |
| `dev` | `tsx watch src/index.ts` |
| `start` | `node dist/index.js` |
| `test` | `node --import tsx --test src/tests/*.test.ts` |
| `eval` | `node --import tsx src/evals/golden.ts` |

| Script (web) | Command |
|---|---|
| `dev` | `vite --port 5173` |
| `build` | `tsc && vite build` |
| `preview` | `vite preview` |

**Verified baseline (must stay green):**

```
server: npm run build   → exit 0, no TS errors
server: npm test        → 24 pass / 0 fail (~8 s)
web:    npm run build   → exit 0; dist/assets/index-*.js = 908.85 kB (gzip 245.73 kB)
                          single chunk, Vite warns >500 kB
```

### 2.1 Dependencies

**server** — runtime: `@google/genai` (pinned to `latest` — **non-reproducible**,
finding A-02), `cors ^2.8.5`, `dotenv ^16.4.7`, `express ^4.21.2`, `zod ^3.25.76`.
Dev: `@types/cors`, `@types/express`, `@types/node ^22`, `tsx ^4.19`, `typescript ^5.7`.

**web** — runtime: `react ^18.3.1`, `react-dom`, `react-router-dom ^6.28`,
`recharts ^2.15`, `react-markdown ^9.0.3`, `lucide-react ^1.16`. Dev: `vite ^6.0.1`,
`@vitejs/plugin-react`, `typescript ^5.7`, `@types/react*`.

No test framework in `web` at all (finding A-03). No linter, no formatter, no CI
config anywhere in the repo (finding A-04).

---

## 3. Endpoint inventory — the contract that must not regress

45 HTTP handlers. `createApp()` mounts every router at `/api`.

### 3.1 Declared in `server/src/index.ts`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | **open** | `{ok:true}` only — no version, no state |
| GET | `/api/auth/token` | **open** | returns the launch token in plaintext — see §6.1 |

### 3.2 `routes/valorant.ts` — public game data (valorant-api.com proxy)

| GET | `/api/agents` · `/api/maps` · `/api/weapons` · `/api/skin-media` |

### 3.3 `routes/riot.ts` — **local Riot Client integration (11 handlers)**

| Method | Path | Effect |
|---|---|---|
| GET | `/api/riot/status` | lockfile + session presence |
| GET | `/api/riot/phase` | `OFFLINE \| MENUS \| AGENT_SELECT \| INGAME` |
| GET | `/api/riot/score` | live presence score (cheap poll) |
| GET | `/api/riot/pregame` | agent-select lobby state |
| GET | `/api/riot/lobby-inspect` | ally roster, ranks, agents |
| GET | `/api/riot/unlocked-agents` | owned agent UUIDs |
| GET | `/api/riot/debug` | probes 9 Riot PvP endpoints; **returns puuid + player name** |
| GET/POST | `/api/riot/autopick` | read/write instalock config (persisted to disk) |
| POST | `/api/riot/select` | **writes to the game**: hovers an agent in pregame |
| POST | `/api/riot/lock` | **writes to the game**: locks an agent in pregame |

### 3.4 AI (`routes/chat.ts`, `matchAnalysis.ts`, `ai.ts`, `coach.ts`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/chat` | **SSE** stream (`text/event-stream`), meta event + `[DONE]`, client-disconnect abort |
| POST | `/api/match-analysis/ai` | Gemini analysis, zod-validated report, 30 min cache, rule-based fallback with no key |
| POST | `/api/coach/screenshot` | multimodal image analysis (base64 body, 5 MB limit) |
| GET | `/api/coach/suggestions` · `/coach/trends` · `/coach/plan` · `/coach/live` | deterministic, no LLM |
| GET | `/api/ai/settings` · `/api/ai/usage` | masked key, token/cost counters |
| POST | `/api/ai/settings` · `/api/ai/models` · `/api/ai/test` | **writes the API key to disk** |

### 3.5 Account/gameplay data — live-with-mock-fallback pattern

| GET | `/api/player-career` · `/api/matches` · `/api/match/:id` · `/api/live-match` · `/api/store` · `/api/store-v3` · `/api/wallet` · `/api/loadout` · `/api/battlepass` · `/api/quests` · `/api/premium/sync` |
| POST | `/api/agent/choose` (pure logic) · `/api/feedback` (appends JSONL) |
| GET | `/api/lineups` · `/api/lineups/search` · `/api/lineups/meta` (static KB, 10.7 KB JSON) |

Every account route follows the same shape: call `fetchLiveX(mockFixture)`, and if
Riot is unavailable return the fixture tagged `source:'mock'`. **This
live-or-mock-with-provenance pattern is the single best idea in the codebase and
must be preserved verbatim.**

### 3.6 Validation status per boundary

| Route | Body validation |
|---|---|
| `/api/chat` | `Array.isArray(messages)` only |
| `/api/feedback` | manual checks + length truncation (good) |
| `/api/match-analysis/ai` | **none** — accepts arbitrary `matchData` straight into the LLM prompt |
| `/api/agent/choose` | **none** — `map \|\| 'Ascent'`, `allyComp \|\| []` |
| `/api/ai/settings` | **none** — arbitrary `apiKey`/`model` strings persisted |
| `/api/riot/select`, `/api/riot/lock` | presence of `agentUuid` only, no UUID format check |
| `/api/riot/autopick` | **none** — `req.body` spread into persisted config |

`zod ^3.25` is already a dependency and is used for the AI analysis report schema
(`AnalysisReportSchema`) — but nowhere for request input (finding A-05).

---

## 4. Backend architecture (the future Agent)

### 4.1 Entrypoint — `server/src/index.ts` (120 lines)

Good: exports a `createApp()` factory so tests boot an ephemeral instance;
`app.listen` guarded by `require.main === module && process.env.VALORECON_TEST !== '1'`;
binds `127.0.0.1` by default.

Missing (findings A-06…A-10):
- **A-06** no error-handling middleware → unhandled route throws leak Express's
  default HTML stack trace.
- **A-07** no 404 handler → unknown `/api/*` returns Express HTML.
- **A-08** no graceful shutdown: no `SIGINT`/`SIGTERM` handler, no `server.close()`,
  no in-flight SSE drain. `startAutoPickPoller()`'s `setInterval` is never cleared
  and has no handle returned — the poller cannot be stopped without killing the process.
- **A-09** no `helmet`, no rate limiting, no request-size limits beyond `json 5mb`,
  no request IDs.
- **A-10** no version/build metadata anywhere in the API surface.

### 4.2 Services

| File | Lines | Responsibility | Notes |
|---|---|---|---|
| `services/riotClient.ts` | 2 408 | **everything Riot** | see §4.3 — the god module |
| `services/gemini.ts` | 782 | AI: key config, streaming chat, match analysis, screenshots, usage accounting, coach context | mixes config persistence + prompt building + transport |
| `services/coachService.ts` | 453 | pure analytics: trends, suggestions, weekly plan, question intent, retrieval context | clean, well tested, no I/O except live context |
| `services/valorantApi.ts` | 321 | valorant-api.com client, 1 h in-memory cache, resolvers | clean |
| `services/agentAdvisor.ts` | 232 | pure agent recommendation engine | clean, no I/O |

### 4.3 `riotClient.ts` in detail (the highest-risk file)

Responsibilities crammed into one module: lockfile discovery
(`%LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile`), local HTTPS requests with
`Basic base64("riot:" + lockfilePassword)` against `127.0.0.1:<port>` (TLS verification
disabled via a shared `https.Agent`), entitlements-token negotiation, JWT payload
parsing to resolve shard/region, a hand-rolled `RequestQueue` (3 concurrent, 70 ms
spacing — anti-1015 throttle), a `BoundedCache<K,V>` with size+TTL eviction, six
ad-hoc `lastXCache` singletons, 20 s / 30 min TTL policies, and ~15 `fetchLiveX()`
domain readers (career, matches, match detail, wallet, store, loadout, battlepass,
quests, core-game, pregame, lobby-inspect, presence score, player names, rank/streak).

Plus two **mutating** operations and a background automation loop:

- `selectAgent(uuid)` → `POST /pregame/v1/matches/{id}/select/{agentId}`
- `lockAgent(uuid)` → `POST /pregame/v1/matches/{id}/lock/{agentId}`
- `startAutoPickPoller()` → `setInterval(2500 ms)` that, when
  `autoPickConfig.enabled`, **automatically calls `lockAgent()` the moment agent
  select is detected** ("Instalock armed … will instantly lock in 0ms").

Session cache holds `accessToken`, `entitlementsToken`, `puuid`, and the lockfile
`password` in memory with a 2-minute TTL. These never leave the machine today.

**This is the compliance decision described in `compliance.md`. It is not a
technical finding — it is a product/legal one, and it blocks public launch.**

### 4.4 Persistence

| Path | Contents | Risk |
|---|---|---|
| `server/data/ai_config.json` | `{"apiKey":"<real key>","model":"gemini-3.5-flash"}` | **plaintext third-party credential on disk, world-readable within the user account** (finding A-11) |
| `server/data/autopick_state.json` | instalock agent + mode + match state | behaviour persists across restarts, including `enabled` |
| `server/data/feedback.jsonl` | 👍/👎 events | fine |
| `server/data/reports/*.json` | persisted AI analyses keyed by match | fine; grows unbounded (finding A-12) |

All of `server/data/` is gitignored. Paths are derived from `__dirname` →
`dist/../../data`, which **breaks the moment the agent is packaged as a single
executable** (finding A-13). Runtime state must move to
`%LOCALAPPDATA%\ValoRecon\`.

### 4.5 Configuration

Only five env vars are read anywhere in the server:
`HOST`, `PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `VALORECON_TEST` (+ `LOCALAPPDATA`
from the OS). `dotenv.config()` is called once in the entrypoint. There is **no
config module, no schema validation, and no dev/prod separation** (finding A-14).
`server/.env` currently contains only `PORT`.

Defaults: `HOST=127.0.0.1`, `PORT=8799`, model `gemini-3.5-flash`.
Key resolution order: `data/ai_config.json` → `process.env.GEMINI_API_KEY` → none
(→ rule-based fallback for analysis, error for chat).

### 4.6 Logging & error handling

Raw `console.log` / `console.error` / `console.warn` in 10 files (26 call sites).
No levels, no structure, no timestamps, no correlation IDs, no file sink, no
redaction. `[riot] Local session negotiation notice: <err.message>` and
`[riot] Persisted Auto-Pick Config: <config>` are logged at info level.

Error style is inconsistent: some handlers return `500 {error: err.message}`
(**leaking internal messages to the client**), others swallow the error and return
a benign empty shape (`/api/riot/*` mostly). No error codes anywhere (finding A-15).

### 4.7 Tests

`server/src/tests/api.test.ts` (13 tests) — boots a real app on an ephemeral port,
sets `LOCALAPPDATA` to an empty temp dir so the Riot path is deterministically
absent, blanks the Gemini key, and asserts: health is open, missing token → 401,
token bootstrap works, chat SSE emits `meta` + text + `[DONE]`, coach endpoints,
lineups filtering, rule-based analysis fallback, feedback validation, usage counters.

`server/src/tests/coachService.test.ts` (11 tests) — pure unit tests of trends,
suggestions, weekly plan, question intent, retrieval context, message windowing,
match-context builder, and the zod report schema.

Gaps: nothing covers the Riot module, `/api/riot/*`, CORS/origin behaviour, the
token-bootstrap hole, rate limiting (none exists), lifecycle, or any frontend code.

---

## 5. Frontend architecture (the future shared UI)

`main.tsx` → `App.tsx`: `BrowserRouter` + `NavRail` + `TitleBar` + 13 routes
(`/`, `/coach`, `/analysis`, `/match-detail`, `/live-match`, `/agent-select`,
`/lineups`, `/trends`, `/statistics`, `/store`, `/loadout`, `/battlepass`,
`/settings`, wildcard → `/`).

**`web/src/api/client.ts` (998 lines) is the entire data layer:**

```ts
const API_BASE = metaEnv?.VITE_API_BASE || 'http://localhost:8799/api';
let launchToken: string | null = null;
async function ensureToken() { /* GET /auth/token, cache in module scope */ }
async function apiFetch(path, init) { /* adds x-valorecon-token */ }
```

- ~40 exported functions, one per endpoint.
- **All response types are hand-declared here and duplicated from the server's
  implicit shapes** — `Agent`, `MapData`, `WeaponData`, `CareerData`, `MatchSummary`,
  `MatchDetail`, `LiveMatchData`, `StoreData`, `WalletData`, `LoadoutData`,
  `BattlepassData`, `QuestsData`, `LobbyInspectData`, `GamePhaseData`,
  `AutoPickSettings`, `AiSettings`, `TrendReport`, `CoachSuggestion`, `Lineup`… none
  are shared with the server (finding A-16 — the top cause of future drift).
- SSE is consumed with `fetch` + `res.body.getReader()` (not `EventSource`), so the
  auth header can be attached — correct choice, keep it.
- `streamCoachChat` returns an abort function and handles `meta` / `text` / `error` /
  `[DONE]` frames.

**State management:** none. No Zustand, no React Query (both were in the original
spec, neither was used). Every screen owns `useState` + `useEffect` + `setInterval`
polling. `TitleBar` polls 3 endpoints every 5 s; `AgentSelectScreen` polls pregame
state; several screens poll independently → duplicated in-flight requests and no
single source of connection truth (finding A-17).

**Assets:** favicon and fonts load from remote CDNs (`media.valorant-api.com`,
`fonts.googleapis.com`) — will show as broken/unstyled offline and inside a packaged
desktop app with a strict CSP (finding A-18).

**Router:** `BrowserRouter` — works in Tauri's `tauri://localhost` custom protocol,
but only if the asset protocol serves `index.html` for deep links. Must be verified
during M4 (finding A-19).

**Bundle:** one 908 kB chunk, no code splitting, `recharts` + `react-markdown` +
`lucide-react` all eagerly loaded (finding A-20).

**Dev server:** `vite.config.ts` sets `host: true` → binds `0.0.0.0`, so the dev UI
is reachable from the LAN (the dev log shows 4 network URLs). No dev proxy, so the
browser calls port 8799 cross-origin and depends on CORS (finding A-21).

---

## 6. Security controls that exist today

### 6.1 The per-launch token — and the hole in it

`createApp()` generates `crypto.randomBytes(32).toString('hex')` at boot, stores it
on `app.locals`, never persists it. Middleware rejects any `/api/*` request without a
matching `x-valorecon-token` header — **except** `/api/health` and `/api/auth/token`.

CORS is an allowlist of `http://localhost:5173` and `http://127.0.0.1:5173`, but:

```ts
origin(origin, callback) {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
  else callback(null, false);
}
```

**Finding A-22 (critical):** requests with **no `Origin` header** are allowed, and
`/api/auth/token` requires no authentication. A CORS decision only controls response
*headers* — Express still executes the handler and still writes the body. So any
local process that is not a browser (`curl`, any installed app, any script) can do:

```
GET http://127.0.0.1:8799/api/auth/token   →   {"token":"<the launch token>"}
```

and then drive **every** protected endpoint: read the user's Riot data, burn their
Gemini quota, read/modify autopick config, and call `/api/riot/lock`. The token
therefore raises the bar against *web pages* only, not against local malware. The
architecture brief's "treat localhost as an untrusted boundary" is currently violated
at exactly this point.

Secondary findings: token comparison uses `!==` (not `crypto.timingSafeEqual`)
(A-23); there is no token rotation or lifetime beyond process lifetime (A-24,
acceptable); the token is fetched over plain HTTP on loopback (acceptable);
`/api/riot/debug` returns `puuid` and `gameName#tag` to any holder of the token (A-25).

### 6.2 Other security-relevant facts

| Item | State |
|---|---|
| Riot local tokens | in-memory only, 2 min TTL, never sent off-machine ✅ |
| TLS verification to Riot local API | disabled (`rejectUnauthorized:false` via shared agent) — **required**, Riot uses a self-signed cert ✅ |
| Gemini key | plaintext on disk; masked in `GET /api/ai/settings` ✅/❌ |
| Secrets in frontend bundle | none — verified, no `VITE_*` secret usage ✅ |
| Rate limiting | none ❌ |
| `helmet` / security headers | none ❌ |
| CSRF | mitigated in practice by the custom header requirement, undermined by A-22 ⚠️ |
| Bind address | `127.0.0.1` ✅ |
| Dependency pinning | `@google/genai: "latest"` ❌ |
| Input validation | see §3.6 ❌ |

---

## 7. Dependency map (current)

```
web (browser, :5173)
  └── web/src/api/client.ts ──HTTP+SSE──▶ server (:8799, 127.0.0.1)
         (x-valorecon-token)                │
                                            ├── routes/* (17 routers)
                                            │     │
                                            │     ├─▶ services/valorantApi ──▶ valorant-api.com (public)
                                            │     ├─▶ services/gemini ───────▶ Google Gemini API (key)
                                            │     │      └── data/ai_config.json (disk)
                                            │     ├─▶ services/coachService (pure)
                                            │     ├─▶ services/agentAdvisor (pure)
                                            │     └─▶ services/riotClient
                                            │            ├── %LOCALAPPDATA%/…/lockfile (disk)
                                            │            ├─▶ https://127.0.0.1:<port> (Riot Client local API)
                                            │            ├─▶ https://pd.<shard>.a.pvp.net (Riot PvP)
                                            │            ├─▶ https://glz-<region>…a.pvp.net (Riot GLZ)
                                            │            └── data/autopick_state.json (disk)
                                            └── data/feedback.jsonl, data/reports/ (disk)
```

External dependencies: **valorant-api.com** (public, no auth), **Google Gemini**
(user-supplied key), **Riot Client local API** (undocumented), **Riot PvP/GLZ
endpoints** (undocumented), Google Fonts + Riot media CDN (frontend).

Local-machine dependencies: Windows, `%LOCALAPPDATA%`, Riot Client lockfile, running
Riot Client/VALORANT process, loopback port 8799, loopback port 5173 (dev).

---

## 8. Findings register

| ID | Sev | Finding | Fixed in |
|---|---|---|---|
| A-01 | **Critical** | Zero git commits — no rollback point | M0 |
| A-22 | **Critical** | `/api/auth/token` is unauthenticated and no-Origin requests pass → any local process obtains the launch token | M2 |
| A-11 | High | Gemini API key stored plaintext on disk | M2 (encrypt) / M5 (cloud proxy option) |
| A-13 | High | Runtime state paths derived from `__dirname` → break when packaged | M2 |
| A-16 | High | Response types duplicated in `web/src/api/client.ts`, no shared contracts | M1/M3 |
| A-06 | High | No error-handling middleware → stack traces to clients | M2 |
| A-08 | High | No graceful shutdown; autopick interval unstoppable | M2 |
| A-05 | High | No request validation on 6 mutating/expensive endpoints | M3 |
| A-15 | Med | No error codes; inconsistent error surfaces | M2 |
| A-02 | Med | `@google/genai: "latest"` — non-reproducible builds | M1 |
| A-14 | Med | No config module / schema / prod-dev split | M2 |
| A-09 | Med | No helmet, no rate limiting, no request IDs | M2 |
| A-17 | Med | No shared connection state; duplicated polling in 5+ screens | M8 |
| A-12 | Med | `data/reports/` grows unbounded | M2 |
| A-25 | Med | `/api/riot/debug` exposes puuid/name to any token holder | M2 |
| A-23 | Low | Non-constant-time token comparison | M2 |
| A-18 | Low | Remote fonts/favicon break offline + strict CSP | M4 |
| A-19 | Low | `BrowserRouter` deep links unverified under Tauri protocol | M4 |
| A-20 | Low | 908 kB single bundle, no code splitting | M8 |
| A-21 | Low | Vite dev server binds `0.0.0.0` | M2 |
| A-03 | Low | No frontend test framework | M3 |
| A-04 | Low | No lint/format/CI | M1 |
| A-26 | Low | `_build/` scratch artifacts partially tracked (`.txt/.ps1/.py/.mjs` not ignored) | M0 |

---

## 9. Documentation drift (must be corrected, not preserved)

| Claim | Source | Reality |
|---|---|---|
| "backend on 8787" | `SPEC.md`, `AGENTS.md` | `8799` (README is right) |
| "model `gemini-2.0-flash`" | `SPEC.md` | default `gemini-3.5-flash` |
| "there is NO Riot account access, serve mock data" | `SPEC.md` | `riotClient.ts` is a 2 408-line live Riot integration |
| "NO reading Riot's local API, NO game automation" | `SPEC.md`, `AGENTS.md` hard constraints | `/api/riot/select`, `/api/riot/lock`, and a 2.5 s instalock poller exist |
| "Fast-pick mode … does NOT touch VALORANT" | `SPEC.md`, `README.md` | Fast-pick calls `POST /api/riot/lock`, which writes to Riot's pregame API |
| "Fair Play Guarantee: NO game automation, NO input injection, NO memory reading" | `README.md` | No memory reading and no input injection are **true**; "no automation" is **false** |
| "state: Zustand / React Query" | `SPEC.md` | neither is installed |

The README's Fair Play claim would be a **false advertising exposure** if published
as-is. It must be rewritten to describe exactly what the product does before launch.

---

## 10. What is genuinely good and must survive the refactor

1. **`createApp()` factory + listen guard** — already test-friendly; keep the shape.
2. **Live-or-mock with `source` provenance** on every account endpoint — the right
   answer for "VALORANT isn't running". Extend it, never remove it.
3. **`RequestQueue` + `BoundedCache` + per-domain TTLs** in `riotClient` — real,
   earned rate-limit protection against Riot's Cloudflare 1015. Preserve the values.
4. **SSE chat with client-disconnect abort** — stops paying for abandoned
   generations. Preserve exactly, including the `meta` frame protocol.
5. **Rule-based analysis fallback + zod-validated AI report** — the app stays useful
   with no API key and never renders unvalidated LLM output.
6. **Analysis cache + persisted reports** — avoids re-billing the user.
7. **Deterministic coach analytics** (`coachService.ts`) — 453 lines of pure,
   tested logic with no LLM cost. This is the product's real differentiator.
8. **Per-launch token concept** — the idea is right; only the bootstrap is broken.
9. **Masked key in `GET /api/ai/settings`** — correct instinct, keep it.
10. **24 passing tests with a hermetic Riot-absent fixture** — the pattern to extend.
