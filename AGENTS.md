# AGENTS.md — instructions for the build agent

You are building the app specified in `SPEC.md` (read it fully first). Work autonomously and do
not stop until the "Definition of DONE" checklist passes.

## Working rules
- Build in this order, verifying each stage before moving on:
  1. `server/` — scaffold, package.json, tsconfig, Express skeleton, `/api/health`. Verify it builds and boots.
  2. Backend data + valorant-api.com proxy routes. Verify `/api/agents` returns data.
  3. Gemini service + `/api/chat` SSE + `/api/match-analysis/ai`. Verify a streamed reply.
  4. Remaining mock endpoints.
  5. `web/` — Vite + React scaffold, API client, shell (NavRail/TitleBar), routing. Verify it builds.
  6. Screens one by one (Home, AI Coach, Match Analysis, Match Detail, Live Match, Agent Select Helper, Statistics, Store, Loadout, Battlepass, Settings). Verify build after each few.
  7. Root `package.json` with `concurrently` to run both. Final full verification against the DONE checklist.
- After each stage, actually RUN the verification command (`npm run build`, `curl`, etc.) and fix errors before continuing.
- Prefer small, working increments over big untested dumps.
- Keep dependencies minimal and mainstream (express, cors, dotenv, @google/genai, node-fetch if needed; react, react-router-dom, zustand, @tanstack/react-query, recharts, react-markdown).
- TypeScript everywhere. Strict enough to catch bugs, not so strict it blocks progress.
- If a dependency install fails, try `bun install` (bun is available) or pin a known-good version.
- Write realistic mock fixtures — the app must look alive.

## Environment
- Node 24, npm 11, bun 1.3, python 3.11, git — all installed. Flutter/Dart are NOT installed; do not use them.
- `GEMINI_API_KEY` is set in the environment. Read it via `process.env.GEMINI_API_KEY`. Also write `server/.env.example` documenting it (no real value).
- Ports: backend 8787, web 5173.

## Definition of done
See `SPEC.md`. All 9 checks must pass. When everything passes, print a final summary of what was built and how to run it.

## Out of scope (do NOT build)
- No Flutter/native desktop.
- No VALORANT game automation / auto-lock / input injection / anti-cheat evasion. The agent-select feature is a manual, human-triggered decision helper that never touches the game.
