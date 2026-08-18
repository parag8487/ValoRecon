# M0 Report — Baseline, Rollback, and Truth

**Date:** 2026-08-18  
**Working Directory:** `C:\IMP\ValoRecon-backup`  
**Git Branch:** `master`  
**Status:** M0 Complete  

---

## 1. Preflight Verification Results

- **Working Directory Verification:** Confirmed `C:\IMP\ValoRecon-backup`.
- **Git State:** 0 previous commits, branch `master`, clean staging tree after `.gitignore` update.
- **Dependency & Build Baseline:**
  - `server`: `npm run build` passed (clean `tsc` output, exit code 0).
  - `server`: `npm test` passed (24 pass / 0 fail in 3.24s).
  - `web`: `npm run build` passed (clean `tsc && vite build`, dist/assets/index-*.js = 908.85 kB, gzip 245.73 kB).
  - Root: `npm run build` passed (`build:server` and `build:web` succeeded).

---

## 2. Preserved Route & Screen Inventories

### 2.1 Backend Routes (45 handlers mounted via `createApp()` at `/api`)
- `GET /api/health`
- `GET /api/auth/token`
- `GET /api/agents`, `GET /api/maps`, `GET /api/weapons`, `GET /api/skin-media`
- `GET /api/riot/status`, `GET /api/riot/phase`, `GET /api/riot/score`, `GET /api/riot/pregame`, `GET /api/riot/lobby-inspect`, `GET /api/riot/unlocked-agents`, `GET /api/riot/debug`, `GET /api/riot/autopick`, `POST /api/riot/autopick`, `POST /api/riot/select`, `POST /api/riot/lock`
- `POST /api/chat` (SSE stream with meta + text + `[DONE]` + client-disconnect abort)
- `POST /api/match-analysis/ai` (Gemini with zod report and rule-based fallback)
- `POST /api/coach/screenshot` (multimodal base64)
- `GET /api/coach/suggestions`, `GET /api/coach/trends`, `GET /api/coach/plan`, `GET /api/coach/live`
- `GET /api/ai/settings`, `POST /api/ai/settings`, `POST /api/ai/models`, `POST /api/ai/test`, `GET /api/ai/usage`
- `GET /api/player-career`, `GET /api/matches`, `GET /api/match/:id`, `GET /api/live-match`, `GET /api/store`, `GET /api/store-v3`, `GET /api/wallet`, `GET /api/loadout`, `GET /api/battlepass`, `GET /api/quests`, `GET /api/premium/sync`
- `POST /api/agent/choose`, `POST /api/feedback`
- `GET /api/lineups`, `GET /api/lineups/search`, `GET /api/lineups/meta`

### 2.2 Frontend Screens (13 routes preserved)
1. `/` (Command Dashboard / Home)
2. `/coach` (AI Coach)
3. `/analysis` (Match Analysis)
4. `/match-detail` (Match Detail)
5. `/live-match` (Live Match)
6. `/agent-select` (Agent Select Helper)
7. `/lineups` (Lineups KB)
8. `/trends` (Trends)
9. `/statistics` (Statistics)
10. `/store` (Store)
11. `/loadout` (Loadout)
12. `/battlepass` (Battlepass)
13. `/settings` (Settings)

---

## 3. Secret & Hygiene Scan
- Verified `.gitignore` excludes: `server/data/`, `node_modules/`, `dist/`, `build/`, `.env`, `.env.*`, `_build/`, `*.log`, `local-data/`, `target/`.
- Verified no credentials, tokens, or live `.env` files are staged.

---

## 4. Rollback & Next Milestone
- Baseline commit created to establish rollback foundation.
- Remote configured: `https://github.com/parag8487/ValoRecon`.
- Next Milestone: **M1 — Shared Contracts and Characterization**.
