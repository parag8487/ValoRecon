# M3 Report — Riot Boundary and Compliance-Safe Behavior

**Date:** 2026-08-18  
**Working Directory:** `C:\IMP\ValoRecon-backup`  
**Git Branch:** `main`  
**Status:** M3 Complete  

---

## 1. Milestone Summary
In Milestone M3, we isolated the Riot Local API boundary behind compliance invariants. Game automation (instalock / auto-select) is default-off (`agentSelectAutomation: false`), returning a structured `403` refusal with error code `VR-RIOT-403`. The background poller strictly operates as an observer (game phase, roster inspection, score presence) and never performs background writes unless explicitly enabled in developer flags. Concurrency throttling (max 3 concurrent, min 70ms spacing) and memory-safe TTL-LRU caching were verified via automated test suites.

---

## 2. Invariants & Controls Enforced
- **Typed 403 Refusal:** `POST /api/riot/select` and `POST /api/riot/lock` return `403` with `{ error: { code: 'VR-RIOT-403', message: 'Agent-select automation is disabled by policy...', requestId } }` when `config.features.agentSelectAutomation` is false.
- **Observer-Only Background Poller:** `startAutoPickPoller()` tracks game lifecycle (`PREGAME`, `IN_GAME`, `IDLE`) for HUD display and advisor recommendations, but never automates selection or locking.
- **Rate-Limiting & Throttler:** `RequestQueue` strictly enforces max 3 concurrent PVP/GLZ requests with 70ms minimum spacing between requests.
- **Memory-Safe Caching:** `TtlLruCache` (`BoundedCache`) enforces TTL expiration and max entry capacity with LRU eviction.
- **Clean UI & Copy:** UI defaults to manual recommendation guide mode without deceptive automation promises.

---

## 3. Verification & Gate Results
- **Contracts Unit Tests:** 7 pass / 0 fail
- **Server Tests:** 54 pass / 0 fail (24 baseline + 17 contract + 8 security + 5 riot boundary tests)
- **Server Build:** `npm run build --prefix server` exit 0 (clean)
- **Web Build:** `npm run build --prefix web` exit 0 (clean)
- **Root Build:** `npm run build` exit 0 (clean)
- **Preserved Routes:** 45/45 handlers verified
- **Preserved Screens:** 13/13 routes intact

---

## 4. Next Milestone
- **Milestone M4 — Tauri Desktop Shell and Sidecar Lifecycle**
