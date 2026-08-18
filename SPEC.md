# VALORECON — Build Specification

A VALORANT companion **web app** (React + Vite frontend, Node/Express backend). Rebuilt from
scratch from an architecture map. Own backend, own branding ("ValoRecon" —
do NOT copy the original's logo or exact visual identity).

## Stack (all tooling already installed — do NOT install Flutter/Dart)
- **Frontend:** React 18 + Vite + TypeScript. State: Zustand (or React Query for server state). Routing: react-router. Styling: CSS modules or Tailwind — your call, keep it clean and dark-themed like a gaming app.
- **Backend:** Node + Express + TypeScript. Runs on `http://localhost:8787`.
- **AI:** Google Gemini via `@google/genai` (or REST). API key is in env var `GEMINI_API_KEY` — read it from `process.env`, never hardcode. Model: `gemini-2.0-flash` (or latest flash).
- **Static VALORANT data:** fetch from public API `https://valorant-api.com/v1/...` (no auth). Cache in-memory.
- **Account-specific data (matches, career, store, wallet):** there is NO Riot account access. Serve **realistic mock/sample data** from JSON fixtures so every screen is fully populated and functional.

## Monorepo layout
```
ValoRecon/
  server/           Express API (TypeScript)
    src/index.ts
    src/routes/*.ts
    src/services/gemini.ts
    src/services/valorantApi.ts
    src/data/*.json      mock fixtures (matches, career, store, etc.)
    .env.example
    package.json  tsconfig.json
  web/              React + Vite app
    src/main.tsx  src/App.tsx
    src/shell/     desktop shell: NavRail, TitleBar, DashboardPanel
    src/screens/   one file per screen (list below)
    src/components/ chat/, agent-select/, cards
    src/api/client.ts   typed fetch client -> localhost:8787
    package.json  vite.config.ts  tsconfig.json
  README.md         how to run both
  package.json      root: concurrently run both dev servers
```

## Backend endpoints (recovered from the original client — reproduce these paths)
- `GET  /api/health` → `{ ok: true }`
- `GET  /api/agents` → valorant-api.com agents (playable only), normalized
- `GET  /api/maps` → valorant-api.com maps
- `GET  /api/weapons` → valorant-api.com weapons
- `GET  /api/player-career` → mock career (rank, tier, RR, win rate, KD, recent form)
- `GET  /api/matches` → mock list of recent matches (summary)
- `GET  /api/match/:id` → mock match detail (scoreboard, rounds, economy)
- `POST /api/match-analysis/ai` body `{matchId}` → **Gemini** analysis of that match's mock data (strengths, mistakes, coaching tips) as JSON
- `GET  /api/live-match` → mock live match state (agents picked per side, map)
- `POST /api/agent/choose` body `{map, allyComp[], role?}` → recommendation engine: best agent(s) for that map + comp, with reasons. Pure logic + data, no game interaction.
- `GET  /api/store` and `GET /api/store-v3` → mock daily store (skins from valorant-api.com weapons)
- `GET  /api/wallet` → mock currency (VP, RP, KC)
- `GET  /api/loadout` → mock loadout
- `GET  /api/battlepass` → mock battlepass progression + leaderboard
- `GET  /api/quests` → mock quests
- `GET  /api/premium/sync` → `{ premium: true }` (stub; local only)
- `POST /api/chat` → **SSE stream** (`text/event-stream`). Body `{messages[]}`. Streams the AI coach reply token-by-token from Gemini. This is the headline AI feature.

All mock endpoints return well-shaped, believable data so the UI is never empty.

## Frontend screens (recovered from the original — build all)
Desktop-style shell: left **NavRail**, top **TitleBar**, main content area (master-detail where it fits).
1. **Home / Dashboard** — hero banner, KPI cards (rank, win rate, KD, recent form), quick links.
2. **AI Coach (Chat)** — streaming chat UI (message bubbles, thinking indicator, suggestion chips, markdown rendering). Calls `POST /api/chat` SSE. THE core feature — make it good.
3. **Match Analysis** — list of matches (master) + detail panel; "Analyze with AI" button → `POST /api/match-analysis/ai` renders coaching breakdown.
4. **Match Detail** — full scoreboard, round-by-round, economy.
5. **Live Match** — current game: map, both teams' agents, your side.
6. **Agent Select Helper** — THE agent-select feature, TWO modes (both human-triggered, NO game automation, NO input injection, NO reading/writing the live game — user inputs map+comp manually or picks from UI):
   - **Recommend mode:** pick map + ally comp → shows best agent(s) with reasons (from `/api/agent/choose`), highlights your "main".
   - **Fast-pick mode:** your chosen main shown huge with one prominent **LOCK** button; clicking it just visually confirms your pick + copies the agent name — a fast human decision aid. It does NOT touch VALORANT. Label it clearly as a decision helper.
7. **Statistics** — charts (win rate over time, KD, agent performance, map performance). Use a light chart lib (recharts).
8. **Store** — daily store grid with skin art.
9. **Loadout** — weapon loadout view.
10. **Battlepass** — tier progression + leaderboard.
11. **Settings** — theme, mock account info, about.

Use VALORANT agent/map/weapon/rank art via valorant-api.com image URLs (they're Riot's public CDN).

## Definition of DONE (must all pass)
1. `cd server && npm install && npm run build` → no TypeScript errors.
2. `npm run dev` (root) starts BOTH servers; backend on 8787, web on 5173.
3. `curl http://localhost:8787/api/health` → `{"ok":true}`.
4. `curl http://localhost:8787/api/agents` → non-empty JSON from valorant-api.com.
5. Web app builds: `cd web && npm run build` → no errors.
6. Every screen renders with populated data (no blank screens, no unhandled errors in console).
7. AI Coach chat streams a real Gemini response.
8. Match "Analyze with AI" returns a real Gemini analysis.
9. Agent Select Helper returns recommendations.

## Hard constraints
- NO Flutter/Dart. NO native desktop build.
- NO VALORANT game automation, NO input injection, NO reading Riot's local API, NO anti-cheat interaction. The agent-select feature is a manual decision helper only.
- NO hardcoded secrets. `GEMINI_API_KEY` from env.
- Do NOT copy the original's logo/brand assets. Game art from valorant-api.com is fine (Riot's).
