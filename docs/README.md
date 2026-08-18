# ValoRecon — Production Documentation Set

This folder is the authoritative specification for turning the current ValoRecon
prototype into a publicly distributed commercial product.

Everything here was written **after a full audit of the code that exists today**
(2026-08-18). Facts about the current system in `AUDIT.md` were verified by
reading files and running the build/test suite — they are not assumptions.

## Reading order

| # | Document | What it answers |
|---|----------|-----------------|
| 1 | [`AUDIT.md`](./AUDIT.md) | What exists today, exactly. Every route, service, secret, env var, dependency, and known defect. Read this first. |
| 2 | [`compliance.md`](./compliance.md) | The one **launch-blocking product decision** (auto-pick / instalock). Must be decided by a human before public release. |
| 3 | [`requirements.md`](./requirements.md) | Product requirements, user/device model, functional + non-functional requirements, out-of-scope list. |
| 4 | [`design.md`](./design.md) | The production architecture: 4 layers, target repo layout, every technology decision with rationale (ADRs), module boundaries. |
| 5 | [`api-contracts.md`](./api-contracts.md) | Versioned wire contracts for Desktop↔Agent, Cloud↔Agent, Web↔Cloud. Envelope format, RPC methods, error codes, compatibility rules. |
| 6 | [`security.md`](./security.md) | Threat model, local token design (and the hole in the current one), secret classification table, data-handling rules. |
| 7 | [`reliability-and-observability.md`](./reliability-and-observability.md) | Connection state machines, degradation matrix, logging/redaction, error taxonomy, health reporting. |
| 8 | [`build-release-update.md`](./build-release-update.md) | Reproducible build commands, sidecar packaging, installer, signing, updater, rollback. |
| 9 | [`testing.md`](./testing.md) | Test strategy per boundary, what must never be mocked, CI gates. |
| 10 | [`tasks.md`](./tasks.md) | The executable plan: milestones M0–M9, every task with acceptance criteria and regression guards. **This is the implementation checklist.** |
| 11 | [`antigravity-prompt.md`](./antigravity-prompt.md) | The prompt to paste into the Antigravity CLI IDE agent to execute the work. |

## Non-negotiable ground rules for anyone implementing this

1. **Preserve behaviour.** 45 HTTP endpoints and 13 screens work today. A refactor
   that loses one of them is a failed refactor. `docs/AUDIT.md` §3 is the inventory
   you are held to.
2. **The baseline must be committed before any change.** The repository currently
   has **zero git commits**. There is no undo. Fix that first (M0).
3. **Localhost is not trusted.** See `security.md` §§1, 3.1, and 4.2.
4. **The gaming PC is the only place Riot integration runs.** Never move Riot local
   access into the cloud, never expose Riot's local API to the internet.
5. **No placeholder that pretends to work.** A stub is fine if it is a documented,
   typed boundary that returns an explicit `NOT_IMPLEMENTED` error code. A stub is
   not fine if the UI shows fabricated data as if it were real.
6. **Local features must keep working with the cloud switched off.**

## Current status snapshot (2026-08-18)

```
Layer            State
---------------- ------------------------------------------------------------
Desktop client   Does not exist. React app runs in a browser via Vite.
Local Agent      Exists as `server/` (Express 4 + TS). 43 routes + 2 in entry.
Cloud platform   Does not exist. No auth, no DB, no device registry.
Web/mobile       Does not exist as a distinct client.
Shared contracts Do not exist. Types are duplicated in web/src/api/client.ts.
Build            `npm run build` green. 24/24 tests green. 908 kB web bundle.
Git              Repo initialised, branch `master`, ZERO commits, no remote.
```
