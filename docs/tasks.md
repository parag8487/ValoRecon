# ValoRecon Implementation Tasks

**Order:** M0 through M9. Each milestone is gated. Do not claim a milestone complete until its acceptance criteria and tests have real output.

## M0 — Baseline, rollback, and truth

Goal: create a safe starting point without changing behavior.

Tasks: inspect `.gitignore`; scan staged content for secrets; create the baseline commit if the repository still has none; capture route/screen/SSE/provenance inventories; preserve current server 24-test baseline and both builds; pin or document dependency drift; create `docs/implementation/M0-report.md`.

Gate: clean baseline build, 24 server tests pass, web build passes, no secrets or generated output staged, and rollback commit exists. Stop if baseline cannot be reproduced or user changes would be overwritten.

## M1 — Shared contracts and characterization

Goal: replace duplicated implicit shapes with versioned schemas while preserving the local API.

Tasks: create `packages/contracts` or the smallest equivalent boundary; model existing responses and errors with Zod; add route/status/body compatibility fixtures; add SSE parser/frame tests; make web client consume shared types; add contract drift checks.

Gate: all preserved handlers and 13 screen routes remain available; existing tests pass; contract tests cover live/mock provenance, analysis fallback, and SSE meta/text/done.

## M2 — Agent hardening and state migration

Goal: make the local Agent safe to run as a product process.

Tasks: add configuration schema, typed JSON errors, 404/error middleware, request IDs, headers, limits, rate limits, constant-time auth, loopback enforcement, graceful shutdown, timer handles, structured redacted logs, bounded report retention, and `%LOCALAPPDATA%\\ValoRecon\\` migration. Remove production token bootstrap; keep only a proven dev-only path if needed.

Gate: security negative tests pass; no stack traces/secrets leak; Agent stops within five seconds; state migration is backed up and rollback-tested; local degraded behavior remains intact.

## M3 — Riot boundary and compliance-safe behavior

Goal: isolate the highest-risk integration without losing read features.

Tasks: split Riot transport/session/cache/queue/read adapters behind injectable interfaces; preserve three-concurrent queue, 70 ms spacing, TTLs, local TLS exception, and mock provenance; make the observer start/stop cleanly; put writes behind `RiotAutomationService`; default automation false; return typed 403; remove background auto-lock; retain read-only phase observation and advisor UI.

Gate: fake-transport tests cover errors, cache/queue, cancellation, and session refresh; flag-off tests prove both write endpoints refuse and poller never locks; no real Riot endpoint is called by default tests.

## M4 — Tauri desktop shell and sidecar lifecycle

Goal: package the current UI and Agent as a Windows desktop application.

Tasks: add Tauri 2; implement single-instance, tray, sidecar start/health handshake, crash restart/backoff, trusted bootstrap, clean shutdown, version/capability reporting, offline state, and deep-link behavior; package a local unsigned development installer if signing material is unavailable.

Gate: clean Windows environment launches without Node/npm/Rust; Agent healthy within five seconds; second instance focuses existing window; crash/restart/quit leaves no orphan; all screens work locally.

## M5 — Cloud modular monolith, identity, and device enrollment

Goal: add optional remote identity and device management without moving Riot authority.

Tasks: create cloud modules for auth, sessions, users, devices, entitlements, flags, and audit; use a mature auth library; add PostgreSQL migrations; enroll/revoke/rename devices; hash device secrets; implement short-lived token exchange and capability/version checks.

Gate: auth/device negative tests pass; revoked and cross-user devices fail; cloud outage leaves local features usable; cloud stores no Riot tokens or local credentials.

## M6 — Agent relay protocol and web companion

Goal: provide authenticated remote reads and streams through the cloud.

Tasks: implement outbound WSS handshake, version negotiation, heartbeat, allowlisted RPC, deadlines, cancellation, backpressure, unary relay, ordered stream relay, reconnect, capability-aware web transport, last-seen/offline states, and consented minimized telemetry.

Gate: integration tests cover connect, reset, retry, version mismatch, unauthorized relay, device offline, duplicate IDs, stream cancellation, and cloud outage. Web never calls localhost or Riot endpoints.

## M7 — Production UI and operational observability

Goal: make failure states and support evidence truthful and usable.

Tasks: centralize connection state; add typed recovery UI for all 13 screens; remove remote asset dependence where packaging requires it; add accessibility checks; expose health/readiness/version/capabilities; add redacted structured logs, metrics, retention, and support-safe diagnostics.

Gate: offline, Riot-closed, Agent-crashed, cloud-signed-out, and provider-unavailable paths are distinguishable; no secret appears in bundles/logs; startup and latency targets are measured.

## M8 — Reproducible release and updater

Goal: build, sign, update, and roll back exact Windows artifacts.

Tasks: pin all dependencies/toolchains; add CI validation, characterization, unit, integration, security, supply-chain, SBOM, provenance, clean Windows build, and reproducibility jobs; add sidecar packaging, installer, beta/stable feeds, signed metadata, hash verification, update compatibility, and rollback.

Gate: unsigned setup may be used for local development only; stable release requires real signing, timestamp, updater key, artifact storage, clean-machine install, upgrade, and rollback evidence. Missing external credentials fail closed and are reported.

## M9 — Public-release decision and acceptance

Goal: verify the product honestly before distribution.

Tasks: execute the full manual matrix; verify all 16 preserved features; test cloud-offline and Agent recovery; review privacy/retention and marketing claims; obtain signed Option A or B in `compliance.md`; publish release manifest and known limitations.

Gate: every `requirements.md` v1 criterion, testing gate, release gate, compliance sign-off, and rollback exercise passes. Otherwise report the exact incomplete milestone and do not call the product production-ready.

## Milestone report format

Each `docs/implementation/MN-report.md` must record: date, source revision, files changed, commands, observed outputs, tests and counts, preserved-route/screen comparison, security findings, external blockers, compliance status, artifacts, rollback point, and next milestone. Never replace unavailable evidence with a claim.
