# Launch Blocker — Auto-Pick / Instalock Compliance Decision

**Status:** OPEN · **Owner:** product owner (a human, not the implementation agent)
**Must be decided before:** first public build is distributed to anyone but you.

This is the only item in this documentation set that an engineer cannot resolve by
writing better code. Read it before M4.

---

## 1. What the code does today (verified)

`server/src/services/riotClient.ts`:

| Function | Behaviour |
|---|---|
| `selectAgent(uuid)` | `POST /pregame/v1/matches/{matchId}/select/{agentId}` on Riot's GLZ endpoint — hovers an agent in agent select |
| `lockAgent(uuid)` | `POST /pregame/v1/matches/{matchId}/lock/{agentId}` — **locks** an agent |
| `startAutoPickPoller()` | `setInterval` every 2 500 ms; while `autoPickConfig.enabled`, detects agent select and calls `lockAgent()` **with no human in the loop**. Status strings say *"Instalock armed … will instantly lock in 0ms when match starts."* |

Config persists to `server/data/autopick_state.json`, so the behaviour survives
restarts, including `enabled`.

Authentication for those calls comes from the Riot Client lockfile
(`riot:<password>` basic auth on loopback) plus the entitlements token — i.e. the
user's own live session credentials.

## 2. Why this is different from everything else in the app

Split the Riot surface into three tiers:

| Tier | Examples | Risk |
|---|---|---|
| **T1 — public data** | `valorant-api.com` agents/maps/weapons/skins | None. Public CDN, no auth. |
| **T2 — local reads** | career, MMR, match history, store, wallet, loadout, battlepass, presence, lobby-inspect | Undocumented and unsupported by Riot, but this is what every third-party tracker does. Read-only, no game state changed. Practically tolerated; formally at Riot's discretion. |
| **T3 — local writes / automation** | `select`, `lock`, and the background instalock poller | **Third-party software performing gameplay actions on the player's behalf.** This is the category Riot's Terms of Service and Vanguard exist to police. |

Nothing in T1 or T2 changes game state. T3 does. That is the whole distinction, and
it is the distinction Riot enforces on.

## 3. The concrete exposure

1. **Users bear the penalty, not you.** Enforcement lands on the Riot account that
   made the calls. A ban wave against paying customers is an unrecoverable product
   event.
2. **You would be selling it.** A commercial, advertised product that automates
   agent select is materially different from a hobby script — it is a business built
   on a ToS violation, with a payment trail.
3. **Vanguard is kernel-level and evolves.** Whether a given local-API write is
   detected today says nothing about next patch.
4. **Your own marketing currently contradicts the code.** `README.md` advertises a
   *"Fair Play Guarantee: 100% compliant manual decision helper — NO game
   automation"* while `AgentSelectScreen.tsx` ships an "Instalock armed" toggle.
   Publishing that pairing is a false-advertising problem independent of Riot.
5. **Distribution risk.** Automation features are the usual reason installers get
   flagged by AV heuristics and app stores.

## 4. The three options

### Option A — Remove T3 before launch *(recommended)*
Delete/disable `selectAgent`, `lockAgent`, the poller, and the autopick UI tab.
Keep the entire advisor: map/comp synergy recommendations, your-main highlight,
one-click **copy agent name**, and a big visual "PICK THIS" card the human acts on.

- Keeps 100 % of T1+T2 value, which is ~95 % of the product.
- Makes the existing "Fair Play" marketing true.
- Removes the ban vector entirely.
- Cost: the "instalock" novelty. It is the least defensible feature you own.

### Option B — Ship T3 behind an explicit, honest, off-by-default gate
Only if you consciously accept the risk:

- Feature flag `features.agentSelectAutomation`, **default false**, server-side
  killable from the cloud (`FeatureFlag` table exists in the M5 schema for this).
- One-time modal with an unchecked checkbox: *"This uses Riot's unsupported local
  API to lock your agent. It may violate Riot's Terms of Service and could result in
  action against your account. I accept this risk."* Consent recorded with timestamp
  and app version.
- **No background auto-lock.** `lock` only ever fires from a click that happens while
  agent select is on screen. Delete `startAutoPickPoller()`'s auto-lock branch.
- Rewrite every "instalock/0 ms/armed" string — those phrasings are the evidence of
  intent.
- Correct the README: remove the Fair Play Guarantee claim.
- Not in the free public build; not in advertising; not in screenshots.

### Option C — Keep it as-is
Not viable for a public commercial launch. Recorded only so the choice is explicit.

## 5. What the implementation must do until this is decided

The architecture work does **not** stall on this decision. Implement it so the answer
becomes a one-line change:

1. Keep `select`/`lock` in the Riot module, reachable only through
   `RiotAutomationService`, which is the **only** caller.
2. Gate that service on `config.features.agentSelectAutomation`, resolved from
   (a) local config, (b) a cloud feature flag when connected. Default **false**.
3. When disabled, `POST /api/riot/select` and `POST /api/riot/lock` return
   `403 { code: 'VR-RIOT-403', message: 'Agent-select automation is disabled' }` —
   a real, typed, documented refusal, not a silent no-op.
4. **Delete the auto-lock branch of `startAutoPickPoller()` now.** Keep the poller's
   read-only *state observation* (phase changes, "locked in" detection) which the
   Live Match and Agent Select screens use — that part is T2 and valuable.
5. Rewrite the UI copy so nothing promises automation while the flag is off, and the
   advisor is presented as an advisor.
6. Cover it with tests: flag off → 403 on both endpoints, poller never calls
   `lockAgent`. See `testing.md` §4.

That way: Option A is "leave the flag off forever and drop the two endpoints in a
later release", Option B is "flip a default and add the consent modal". Neither
requires re-architecting.

## 6. Sign-off

| Field | Value |
|---|---|
| Decision (A / B / C) | ☐ pending |
| Decided by | |
| Date | |
| If B: consent copy reviewed | ☐ |
| If B: README Fair Play claim corrected | ☐ |
| Riot third-party policy re-checked at | ☐ (re-check before every major release) |
