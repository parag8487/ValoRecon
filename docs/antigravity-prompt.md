# Antigravity CLI Implementation Prompt - ValoRecon Productionization

Paste the complete prompt below into Antigravity CLI IDE with its working directory set to:

`C:\IMP\ValoRecon-backup`

Do not run this prompt against `C:\IMP`, `C:\IMP\Hermes`, the original ValoRecon folder, or any other checkout.

---

You are the lead production engineer for ValoRecon. Work only inside `C:\IMP\ValoRecon-backup`. Do not read from, write to, format, move, delete, or run Git commands against any other project or parent-directory content.

Your task is to turn the existing ValoRecon prototype into the production foundation specified by the repository's authoritative production documentation. This is a real commercial product, not a demo, portfolio project, or disposable MVP. Implement the work, exercise it with real builds/tests, and leave an honest state. Do not stop after planning.

## 1. Authority and required reading

Before changing code, read these files completely in this order:

1. `docs/AUDIT.md`
2. `docs/compliance.md`
3. `docs/requirements.md`
4. `docs/design.md`
5. `docs/api-contracts.md`
6. `docs/security.md`
7. `docs/reliability-and-observability.md`
8. `docs/build-release-update.md`
9. `docs/testing.md`
10. `docs/tasks.md`
11. `docs/README.md`

Then inspect the live repository and verify important audit claims yourself. The filesystem may have changed since the audit.

Document precedence for this production effort is:

`docs/compliance.md` and security invariants > `docs/requirements.md` > `docs/design.md` and `docs/api-contracts.md` > operational documents > `docs/tasks.md` > current source behavior > historical `SPEC.md`, `AGENTS.md`, and root `README.md`.

`SPEC.md`, the existing root `AGENTS.md`, and the root `README.md` describe the historical web prototype. They are useful evidence of prior intent but are not the production architecture authority. Where they conflict with `docs/`, follow `docs/`. Do not delete working behavior merely because the historical documents are stale.

If two authoritative production documents genuinely conflict, choose the interpretation that preserves these invariants, document the decision in an ADR, and continue:

- Riot Client, Riot local API, Riot PvP/GLZ credentials, and authoritative live game state remain on the gaming PC.
- The cloud never imports Riot integration code, stores Riot tokens, or claims it can answer live local questions while the PC is offline.
- The Local Agent binds loopback only and is never exposed through port forwarding, LAN binding, tunnels, or a public reverse proxy.
- Local features work when the cloud is unavailable or the user is signed out.
- Secrets never enter a frontend/browser bundle or logs.
- Localhost is an untrusted boundary. Do not preserve the current unauthenticated `/api/auth/token` production bootstrap.
- Existing behavior is preserved unless a production document explicitly requires a security/compliance change.
- Agent-select automation is default-off and must return the documented typed refusal until the human compliance decision is signed. Do not silently enable it.
- Do not build an overlay, input injector, memory reader, Vanguard bypass, anti-cheat evasion, or fake cloud capability.

## 2. Mandatory preflight: establish truth and rollback

Do not edit application code until all preflight steps are complete.

1. Confirm the working directory is exactly `C:\IMP\ValoRecon-backup` using an absolute-path command.
2. Run `git status --short --branch`, `git branch --show-current`, `git log -3 --oneline`, and `git remote -v`.
3. The audited repository had zero commits and every file untracked. If that is still true:
   - inspect `.gitignore` first;
   - ensure runtime secrets/state, `.env`, `node_modules`, build outputs, logs, and `_build` scratch outputs are excluded;
   - inspect staged content before committing and scan it for credentials;
   - create a baseline commit containing the current source and authoritative docs only;
   - do not include `server/data/`, real `.env` files, generated `dist/`, `node_modules`, logs, or secrets.
4. If commits or user changes now exist, do not overwrite, reset, clean, stash, or revert them. Treat them as live user work. Record the observed state and work with it.
5. Capture baseline verification:
   - `npm ci` only when lockfiles and manifests agree; otherwise diagnose before changing dependencies;
   - `npm run build` at the root;
   - `npm test --prefix server`;
   - `npm run build --prefix web`;
   - record exact pass/fail counts and bundle sizes in an implementation log under `docs/implementation/`.
6. Inventory the current routes, response shapes, SSE frames, screen routes, environment variables, persisted files, and source/mock provenance. Use or generate characterization tests before refactoring shared behavior.
7. Search for credentials by name/pattern without printing secret values. Never open or print real `.env` or credential file contents.

If the baseline does not build or test, diagnose and restore the baseline first. Do not bury a pre-existing failure under architecture changes.

## 3. Execution method

Execute `docs/tasks.md` in milestone order, M0 through M9. Do not skip ahead to visually impressive cloud or desktop work while contract extraction, agent security, tests, or lifecycle controls are unfinished.

For every milestone:

1. Re-read that milestone plus the relevant requirement, design, contract, security, reliability, build, and testing sections.
2. Inspect exact symbols and call sites before editing. Prefer existing patterns where they are sound.
3. Add a failing characterization/unit/integration test for changed behavior first when practical.
4. Make the smallest coherent production change. Avoid broad rewrites and unrelated formatting.
5. Run the narrow tests during development.
6. Run the milestone's complete verification gate.
7. Exercise at least one real success path and the relevant failure/degraded path.
8. Compare preserved endpoint and screen inventories to the baseline.
9. Fix regressions before moving on.
10. Update only documentation that is made inaccurate by the implementation.
11. Create a small milestone commit only after the gate is green. Never commit secrets or unrelated user changes.
12. Write the exact commands, results, remaining risks, and commit SHA to `docs/implementation/MN-report.md`.

A compile is not proof of completion. A milestone is complete only when its acceptance criteria and regression gates pass with real output.

## 4. Required architecture direction

Follow the detailed design documents. The intended direction is a pragmatic monorepo with these conceptual packages/apps, adapted to the current repository through incremental migration rather than a rewrite:

- Desktop Client: Tauri 2 Windows shell supervising the packaged Local Agent and hosting the shared React UI.
- Local Agent: the existing Express/TypeScript server evolved in place, split behind interfaces over time; it remains the sole owner of Riot access and local mutable state.
- Shared contracts: runtime-validated schemas and generated/inferred TypeScript types used by agent, desktop UI, cloud, and companion. Do not keep manually duplicated response models.
- Cloud Platform: one TypeScript modular monolith with PostgreSQL, mature authentication integration, device management, entitlements, feature flags, telemetry ingestion, and authenticated relay. Do not create microservices or Kubernetes.
- Web Companion: reuse shared React features/components and contracts, but use a cloud transport and capability-aware availability states.
- Persistent channel: one outbound authenticated WebSocket from each Agent to the cloud, carrying the documented versioned request/response/stream/cancel envelopes. Never expose the Agent HTTP port publicly.

Use the exact stack and ADR decisions in `docs/design.md`. Before installing a dependency, confirm it is necessary, compatible, maintained, and license-appropriate; pin the selected version through the lockfile. Do not use `latest` dependency specifications.

Do not split `riotClient.ts` mechanically. First add characterization tests and injectable transport/clock/filesystem boundaries. Then extract cohesive modules while preserving queue concurrency, 70 ms spacing, TTL/cache semantics, local TLS handling, live/mock provenance, and endpoint behavior.

## 5. Security implementation requirements

Implement `docs/security.md`, not merely document it.

At minimum:

- Replace the production token bootstrap hole with a trusted Tauri-to-Agent launch handshake. The desktop shell generates a high-entropy per-launch credential, passes it through the documented restricted bootstrap channel, and the Agent never serves that credential from an unauthenticated production HTTP endpoint.
- Keep a clearly isolated dev-only bootstrap if needed for browser development. It must be impossible in a production build, and an automated test must prove that.
- Bind `127.0.0.1`; reject unexpected origins/hosts; use constant-time credential comparison where applicable; set request IDs, security headers, route-aware rate limits, body/stream limits, typed 404/error middleware, and schema validation.
- Store long-lived device credentials and user-supplied provider keys using Windows DPAPI/credential storage as specified. Move mutable state to `%LOCALAPPDATA%\ValoRecon\` with restrictive permissions and bounded retention.
- Keep Riot access and entitlements tokens memory-only and redact all tokens, keys, authorization headers, lockfile passwords, PUUIDs where required, chat/gameplay content, and signed URLs from logs/telemetry.
- Authenticate Agents with device credentials exchanged for short-lived cloud tokens. Support rotation and revocation. User sessions and device identities are distinct principals.
- Authorize every remote operation against user ownership, entitlement, device online state, protocol/capability support, method allowlist, and operation risk. Never offer a generic remote URL/HTTP proxy.
- Remote mutation is deny-by-default. Agent-select automation remains disabled unless the signed compliance path explicitly permits it.
- Add dependency/SBOM/secret checks and production-bundle scans.

Do not invent a custom password/session protocol. Use the mature auth integration selected in the design and keep provider configuration behind an adapter.

## 6. Compatibility and behavior preservation

Treat `docs/AUDIT.md` endpoint and feature inventories as a regression contract.

- Preserve existing local HTTP paths and response shapes during migration unless a versioned compatibility adapter is supplied.
- Preserve `/api/chat` SSE semantics: metadata frame, text stream, error semantics, `[DONE]`, and upstream abort on client disconnect.
- Preserve the zod-validated AI analysis output, deterministic fallback without a Gemini key, analysis cache, and persisted report behavior while moving storage to the production data directory.
- Preserve live-Riot-with-mock-fallback and explicit `source: 'live' | 'mock'` provenance. Mock data must never be represented as current live data.
- Preserve deterministic coach analytics and agent advisor logic.
- Preserve all 13 screen routes and all features listed in `docs/requirements.md` section 3.5.
- Maintain development mode while adding Tauri/production mode.
- Keep frontend API transport behind an interface so desktop-local and web-cloud clients reuse feature code without pretending they share trust boundaries.
- Every protocol or API breaking change requires a new version, compatibility test, migration note, and explicit minimum-version behavior.

The compliance-required removal of automatic background locking is an intentional safety change, not a regression. Keep read-only phase observation and advisor value.

## 7. Reliability and observability implementation requirements

Implement explicit state machines rather than scattered booleans:

- Desktop-to-Agent lifecycle and supervision.
- Riot/VALORANT availability.
- Agent-to-Cloud connection and enrollment/authentication.
- Web remote-session/device availability.

Implement bounded exponential backoff with jitter, heartbeats, stale/offline transitions, request deadlines, stream cancellation, idempotency where specified, graceful shutdown, single-instance behavior, timer cleanup, and no orphan Agent process.

Add structured logs with stable `VR-*` error codes, request/session correlation, redaction, rotation, and bounded local retention. Add the documented health/readiness/version/capability surfaces. Telemetry must be opt-out and data-minimized; cloud failure must not block local operation.

Do not add metrics, tracing, or crash reporting SDKs that transmit sensitive data by default. Configure scrubbing before enabling upload.

## 8. Cloud and remote protocol requirements

Build the cloud as a modular monolith, not distributed services. Its modules must have explicit ownership for auth/accounts, devices, entitlements, flags, relay, telemetry, and operations.

The cloud Agent channel must:

- be outbound-only from the PC over TLS;
- authenticate device identity and short-lived session tokens;
- negotiate protocol version and capabilities;
- use the exact versioned envelopes in `docs/api-contracts.md`;
- support unary responses, ordered stream chunks, terminal frames, cancellation, ping/pong, deadlines, duplicate request handling, bounded payloads, and backpressure;
- authorize an allowlisted capability/method, never arbitrary paths;
- avoid durable storage of proxied gameplay/chat payloads unless a documented, consented feature requires it;
- return explicit offline, unsupported, forbidden, timeout, and version errors;
- never claim a disconnected PC can satisfy a live request.

Add integration tests using a real cloud process, test database, and Agent protocol client. Fake Riot transport is appropriate; fake authorization logic is not sufficient for the final integration gate.

## 9. Desktop, packaging, and update requirements

Use Tauri 2 and package the Local Agent as a managed sidecar according to `docs/build-release-update.md`.

- The desktop shell owns Agent startup, trusted bootstrap, health wait, crash detection, bounded restart, shutdown, update coordination, tray behavior, single instance, and user-facing status.
- A fresh Windows machine must not require Node.js, npm, Rust, a terminal, or manual port configuration.
- Build deterministic artifacts from clean lockfiles.
- Produce installer artifacts, checksums, SBOM, provenance/manifest, and updater metadata.
- Support separate development, staging/beta, and stable configurations without compiling secrets into artifacts.
- Use signed installers and signed updater manifests for public release. If certificates/keys are unavailable, complete unsigned local packaging and CI structure, make signing/release jobs fail closed, and record the exact missing external material. Never fake signatures.
- Test update compatibility and rollback on staging before calling release readiness complete.

## 10. External dependencies and honest stopping rules

Expected external blockers may include a production domain, DNS/TLS, hosted PostgreSQL, auth provider credentials, OAuth application, code-signing certificate, Tauri updater signing key custody, telemetry/crash-reporting endpoint, Gemini production billing/key policy, and a signed compliance decision.

When one is missing:

1. Implement the local code, adapter, schema, validation, tests, example environment variables, and fail-closed behavior that do not require the credential.
2. Verify them locally with non-secret test configuration.
3. Record the exact owner action and required secret/resource in the milestone report and release checklist.
4. Continue independent milestones.
5. Do not insert a placeholder success response, dummy production secret, fake deployment URL, fabricated CI result, or claim the blocked capability works.

Stop and report instead of proceeding if:

- preserving a requirement would require exposing Riot local APIs or tokens;
- a migration would destroy user data without a tested backup/rollback;
- the live repository contains overlapping user edits that cannot be safely reconciled;
- a signing/deployment action would require guessing credentials or destinations;
- tests demonstrate an unresolved security or data-corruption regression.

## 11. Prohibited actions

Do not:

- rewrite the application from scratch;
- delete working routes/screens/features to simplify architecture;
- move Riot access into the cloud;
- expose loopback APIs to LAN/internet;
- place Riot, Gemini, device, OAuth, database, signing, or telemetry secrets in frontend code, `VITE_*`, logs, examples, fixtures, commits, or chat output;
- trust CORS as authentication;
- enable automation by default;
- create microservices, Kubernetes, service mesh, event bus, Redis, or a message broker without a demonstrated requirement approved by the docs;
- build a custom auth system;
- silently alter API behavior;
- use mock data without provenance;
- leave core paths as TODOs and claim completion;
- suppress tests, weaken assertions, or remove type safety to make a gate pass;
- run destructive Git commands (`reset --hard`, `clean -fd`, checkout-overwrite) or revert user work;
- commit or push unless the repository state and milestone instructions permit it; never push without explicit user instruction;
- modify anything outside `C:\IMP\ValoRecon-backup`.

## 12. Required final verification and report

Before ending, run every available gate specified in `docs/testing.md` and `docs/build-release-update.md`, including at least:

- clean install/reproducibility check;
- all package typechecks/builds/lints/tests;
- contract compatibility tests;
- frontend component/integration tests;
- Local Agent auth negative tests;
- Agent lifecycle/graceful-shutdown tests;
- Riot fake-transport tests for queue/cache/live/mock behavior;
- cloud auth/device/relay authorization tests;
- WebSocket unary/stream/cancel/reconnect/version tests;
- Tauri Rust tests and packaged sidecar smoke tests;
- end-to-end desktop local flow and web remote flow where infrastructure is available;
- production bundle secret scan;
- dependency, license, and vulnerability review;
- installer/update smoke tests when signing/update infrastructure is available;
- manual preserved-feature checklist.

Then provide a concise but exact final report containing:

1. Milestones completed, partially completed, and not started.
2. Files/modules materially changed.
3. Architecture now running, with which processes and trust boundaries.
4. Exact verification commands and observed results, including pass/fail counts.
5. Preserved endpoint/screen/feature comparison against baseline.
6. Security controls implemented and security risks still open.
7. External blockers with exact owner actions.
8. Compliance decision status and actual automation behavior.
9. Build artifacts and absolute paths.
10. Git status and milestone commit SHAs, without pushing.
11. The next single milestone/task to execute.

Do not say "production ready" unless every v1 acceptance criterion in `docs/requirements.md`, every release gate, signed compliance decision, signed artifact requirement, update/rollback exercise, and required external deployment has actually passed. Use precise labels such as "M0-M4 complete; cloud integration pending credentials" when that is the truth.

Begin now with the mandatory reading and preflight. Continue autonomously through the milestones, fixing regressions before advancing.
