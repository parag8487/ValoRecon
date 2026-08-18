# ValoRecon Reliability and Observability Specification

**Status:** normative production specification  
**Scope:** Tauri desktop host, Local Agent sidecar, local Express API, Riot integration, cloud relay, web/mobile companion, and third-party dependencies

## 1. Reliability principles

- Local operation is the primary availability domain. Local screens, deterministic coaching, cached/mock-provenance reads, local Riot reads, local reports, and local settings continue when cloud, internet, identity, Gemini, or public CDNs fail.
- Cloud operation is optional. Cloud failures affect only sign-in, device status freshness, remote relay, cloud entitlements/flags, and opted-in telemetry.
- Any live/fallback response carries `source: 'live' | 'mock'` and, when cached, `observedAt`/`staleAt`. Fallback is never presented as live.
- Every process, stream, queue, timer, socket, file watcher, and child process has an owner, cancellation signal, timeout, bound, and shutdown hook. No resource outlives its owner.
- Reads degrade usefully; mutations fail closed. Stale data can be shown with age; stale credentials, approvals, flags, and commands cannot execute.
- Reliability changes preserve all 45 handlers, all 13 screens, SSE `meta`/text/`error`/`[DONE]`, client-disconnect abort, the Riot queue (3 concurrent, 70 ms spacing), bounded caches, deterministic coach analytics, and the rule-based AI fallback.

## 2. State machines

### 2.1 Desktop lifecycle

States: `STARTING -> HOST_READY -> AGENT_STARTING -> AGENT_READY -> RUNNING`. Failure transitions: `AGENT_STARTING -> AGENT_CRASHED`, `AGENT_READY -> AGENT_UNHEALTHY`, `RUNNING -> STOPPING` on quit/update, and any state -> `FAILED` after restart budget exhaustion.

Rules:

- Window visible target <=2 seconds; Agent health target <=5 seconds.
- Host starts exactly one signed sidecar from an absolute path and waits for authenticated readiness, not merely process creation.
- On crash/unhealthy, record a safe exit reason, kill descendants, and restart with jittered backoff: 250 ms, 1 s, 2 s, 5 s, 10 s, then 30 s capped. Five failures in 10 minutes enters `FAILED` and shows recovery plus `VR-AGENT-503`.
- A stable run of 10 minutes resets the restart counter. Updates drain/stop/install/start transactionally and roll back to the last verified version on failure.
- Window close minimizes to tray if enabled. Tray quit enters `STOPPING`; no Agent remains.

### 2.2 Local Agent lifecycle

States: `BOOTING -> CONFIG_LOADING -> LOCAL_READY -> SERVING`; optional dependencies independently use `AVAILABLE`, `DEGRADED`, or `UNAVAILABLE`: `RIOT`, `GEMINI`, `PUBLIC_DATA`, `CLOUD`.

`SERVING -> DRAINING` on shutdown: stop accepting new requests, stop the read-only Riot observer, cancel pending external work, close new SSE creation, send terminal errors to active streams, flush redacted logs/audit, close persistence, and exit <=5 seconds. A forced kill is reported as `VR-LIFECYCLE-504` on next startup. The Agent may serve local APIs in `LOCAL_READY` with all optional dependencies unavailable.

### 2.3 Cloud connection

States: `DISABLED -> SIGNED_OUT -> ENROLLING -> CONNECTING -> AUTHENTICATING -> CONNECTED -> DEGRADED -> RECONNECTING -> REVOKED`.

- `DISABLED` and `SIGNED_OUT` perform no reconnect loop and never block local work.
- `ENROLLING` is user-mediated and expires with the pairing challenge.
- `CONNECTING` uses outbound WSS only. `AUTHENTICATING` validates protocol, device, token, server time, and capabilities.
- `CONNECTED` requires heartbeat acknowledgement. At a 15-second heartbeat, missing three enters `DEGRADED`; missing six enters `RECONNECTING`.
- Reconnect uses full-jitter exponential backoff capped at 60 seconds and honors `Retry-After`. Auth failures do not hot-loop; invalid/revoked credentials enter `SIGNED_OUT`/`REVOKED`.
- `REVOKED` stops relay/telemetry, deletes local cloud tokens, and requires explicit enrollment.

### 2.4 Riot dependency

States: `CLOSED -> CLIENT_DETECTED -> LOCKFILE_READ -> SESSION_READY -> API_READY`; failure states `STALE` and `THROTTLED`.

Lockfile disappearance, process exit, certificate/port mismatch, or session expiry clears session tokens and transitions to a safe unavailable state. Allowed reads use cached/mock data with provenance. Riot writes are rejected unless session is ready, feature flag and compliance consent permit them, and a current human action exists.

The existing queue remains bounded at three concurrent requests and 70 ms minimum start spacing. Queue overflow returns `VR-RIOT-429`. External timeout is 3.5 seconds; domain TTLs remain bounded and explicit.

### 2.5 Request and stream lifecycle

Every request transitions `RECEIVED -> VALIDATED -> AUTHORIZED -> RUNNING -> SUCCEEDED | DEGRADED | FAILED | CANCELLED`. Emit one structured transition event with request ID. SSE additionally uses `OPEN -> STREAMING -> DRAINING -> DONE`; disconnect cancels upstream generation/external calls. Stream idle timeout is 60 seconds, absolute timeout 10 minutes, and terminal `[DONE]` or typed `error` is mandatory.

## 3. Degradation matrix

| Dependency/state | Local reads | Deterministic coach | Gemini chat/analysis | Local writes | Remote web/mobile | Telemetry |
|---|---|---|---|---|---|---|
| VALORANT/Riot closed | mock/cached, `source:mock` | works | works if provider available | refuses `VR-RIOT-404` | last-known state with age | local; queued if opted in |
| Riot throttled | cache/mock, no retry storm | works | works | refuses `VR-RIOT-429` | last-known data | counter only |
| Gemini absent | works | works | rule-based analysis; typed chat unavailable | N/A | local unaffected | no prompt content |
| Gemini outage | works | works | cache/rule fallback; `VR-AI-503` if none | N/A | degraded response | circuit breaker |
| Internet down | all local features | works | local fallback/cache | local writes work | offline + timestamp | bounded buffer/drop |
| Cloud down | all local features | works | local configured provider | local writes work | offline state | local only |
| Cloud token revoked | all local features | works | local provider | local writes work | signed-out/re-enroll | cloud telemetry stops |
| Public CDN down | bundled/cache assets | works | works | works | cached UI/data | works |
| Disk full/corrupt | safe read-only defaults, `VR-STORAGE-507` | in memory | no persistence | refuses atomic write | last known cache | bounded fallback |
| Agent crash | host restarts | after recovery | after recovery | no orphan/duplicate mutation | device offline | redacted crash context |
| Unsupported version | supported local reads | works if contracts valid | works locally | unsafe mutations disabled | clear upgrade message | version event |

## 4. Timeouts, retries, and idempotency

Defaults: cached local read 2 s; uncached Riot read 3.5 s; cloud unary 10 s; cloud connect 10 s; provider call 30 s; screenshot analysis 60 s; SSE first byte 10 s and absolute 10 min.

Retry only transient errors and only idempotent reads or requests with an idempotency key. Full-jitter backoff is base 250 ms, multiplier 2, maximum 60 s, maximum five attempts. Honor `Retry-After`; never retry authorization/validation errors, stale commands, or gameplay writes automatically. Circuit breakers open after five failures in 60 s, remain open 30 s, and allow a bounded half-open probe. Bulkheads isolate Riot, Gemini, cloud, and public-data pools.

Mutations use client idempotency keys retained 24 hours. Duplicate payloads return the original result; conflicting digests return `VR-REQUEST-409`. Shutdown cancels queued work instead of retrying it after restart.

## 5. Health, readiness, and compatibility

`GET /api/health` is minimal liveness and performs no network/secret checks. Add authenticated readiness:

```json
{
  "ok": true,
  "status": "ready|degraded|not_ready",
  "version": "1.2.3",
  "protocolVersion": "v1",
  "components": {
    "agent": "ready",
    "riot": "available|closed|stale|throttled",
    "gemini": "available|unconfigured|degraded",
    "cloud": "connected|offline|signed_out",
    "storage": "ready|read_only|full"
  },
  "checkedAt": "RFC3339"
}
```

`ready` means the Agent can serve local APIs and storage is usable. Optional dependency failure is `degraded`; startup/config/schema/integrity failure is `not_ready`. Health contains no tokens, usernames, file paths, prompts, or raw exceptions.

Every build exposes app version, Agent version, protocol version, channel, build ID, and dependency health. Cloud serves Agents at least two minor versions old. Unsupported minimums return `VR-PROTOCOL-426` and do not downgrade unsafely.

## 6. Shutdown and supervision

The host owns the Agent PID/job tree. On quit, update, logout, or crash recovery: mark lifecycle, stop new work, disable automation, stop observation, cancel external calls, close SSE streams with typed terminal errors, stop cloud reconnect, flush redacted telemetry/audit, close HTTP, release the instance lock, and wait <=5 s. A second signal may force termination and records `forced=true` next startup.

`startAutoPickPoller()` must return a stop handle. Its read-only observation runs only while serving; its auto-lock branch is removed until compliance Option B is explicitly signed. A lifecycle registry tracks timers, intervals, WebSockets, watchers, queues, child processes, and AbortControllers and asserts empty on shutdown. Startup repairs stale PID/lock files and reports incomplete prior shutdown.

## 7. Structured observability

### Logs

Use JSON fields `timestamp`, `level`, `service`, `component`, `version`, `buildId`, `environment`, `requestId`, `traceId`, hashed `deviceId`/`tenantId`, `event`, `durationMs`, `outcome`, and `errorCode`. Redact before serialization. Never log raw bodies, prompts, chat, screenshots, Riot tokens, lockfile data, player IDs, or query-bearing URLs.

Local logs rotate daily, retain seven days, and cap at 100 MiB. Cloud logs retain 30 days by default. Log state transitions, startup/shutdown, retry/circuit changes, queue saturation, cache/fallback status, child exit, enrollment/revocation, authorization result, and update/rollback. Rate-limit repeated identical errors and include count.

### Metrics and traces

Bounded metrics include HTTP/route status and latency, SSE count/first-byte/cancel, Agent readiness/restarts, dependency outcomes/latency/timeouts/retries, Riot queue depth/rejections/cache hit ratio/throttle count, cloud state/heartbeat/reconnect/token failures, fallback count/stale age, storage failures, security denials, rate limits, and forced shutdowns. Never use match ID, URL, username, prompt, UUID, or exception text as labels.

Trace desktop IPC, Agent HTTP/SSE, cloud relay, Riot, Gemini, storage, and updates with W3C context only across authenticated boundaries. Exclude payloads/secrets/content; sample normal reads lightly and retain errors/security denials.

### Crash reports

Include versions, OS family/build, signed build ID, lifecycle state, last 20 redacted transitions, safe error code, and bounded stack. Exclude memory dumps, secrets, files, prompts, chat, screenshots, lockfile values, and player identifiers by default. Upload is opt-in, encrypted, size-limited, queued, and disabled with telemetry opt-out. Crash loops quarantine the local mode and offer signed rollback/reinstall.

## 8. Error taxonomy

All failures use `{ code: "VR-*", message, requestId, retryable }` with safe actionable messages. Stable groups include `VR-AUTH-401/403`, `VR-DEVICE-409/410`, `VR-PROTOCOL-400/426`, `VR-REQUEST-400/409/413`, `VR-RIOT-404/408/429/503`, `VR-AI-401/429/503`, `VR-CLOUD-401/403/408/503`, `VR-AGENT-503/504`, `VR-STORAGE-507`, `VR-LIFECYCLE-499/504`, `VR-RATE-429`, and `VR-SECURITY-400/503`.

## 9. SLOs and alerting

| Indicator | Target | Alert |
|---|---|---|
| Cloud availability | 99.5% monthly | <99.0% over 30 min |
| Agent ready | 99% <=5 s | p95 >5 s for 15 min |
| Crash recovery | 99% detected <=3 s/restarted <=5 s | >1% over 15 min |
| Cached local p95 | <150 ms | >300 ms for 10 min |
| Remote p95 | <1.5 s at 50 ms RTT | >3 s for 15 min |
| SSE first byte | <2 s healthy provider | >5 s for 10 min |
| Reconnect | <=60 s p95 | sustained >60 s |
| Authorization correctness | 100% negative tests deny | immediate incident |
| Secret redaction | 100% corpus/export tests | block and incident |
| Data loss | zero acknowledged audit loss | immediate incident |

Measure local and cloud SLOs separately; cloud outage never counts as local availability failure. Dashboards show live/mock provenance, stale age, Riot/cloud state, Agent restarts, and error distribution.

## 10. Runbooks and drills

- **Cloud outage:** confirm local health, open circuit, stop reconnect storm, show Cloud Offline, retain local Gemini/features, bound telemetry, restore via probe and verify one remote read/stream.
- **Agent crash loop:** capture redacted context, stop descendants, execute bounded backoff, enter `FAILED` after five failures/10 min, disable automation, offer signed rollback/reinstall.
- **Riot outage/throttle:** preserve queue/cache limits, return cache/mock, refuse writes, show non-blocking explanation, probe after cooldown.
- **Credential/device theft:** revoke device and refresh family, invalidate sessions, rotate affected provider/enrollment keys, disable relay mutations, require signed re-enrollment.
- **Secret/privacy leak:** block export/upload, rotate, revoke, preserve redacted audit, identify retention scope, notify according to policy, add regression test.
- **Bad release:** stop channel, verify signature/provenance, quarantine, roll back known-good artifact, run startup/local-offline/Riot-closed/SSE/shutdown smoke tests.

Operational drills before public release: kill Agent from Task Manager, block cloud hosts, close VALORANT mid-request, revoke a connected device, fill the state volume, interrupt an update, and simulate provider outage. Each drill must produce the documented UI state, typed error, bounded resources, and recovery outcome.

## 11. Verification requirements

Automated tests cover state transitions/timeouts, sidecar crash/restart/orphan cleanup, single instance, graceful shutdown with active SSE, reconnect/backoff/revocation, cloud-offline local operation, Riot closed/throttled/mock provenance, disk-full/read-only behavior, idempotency, rate limits, error-code stability, metric cardinality, redaction, and update rollback. CI gates build, unit/integration/contract/security tests and production secret scans.
