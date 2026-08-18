# ValoRecon API and Protocol Contracts

**Status:** version 1 design · all schemas are illustrative contract requirements and must be implemented in `packages/contracts` with Zod tests.

## 1. Existing local compatibility

The Agent must preserve the current `/api/*` surface documented in `AUDIT.md`, including 45 handlers, response shapes, live/mock provenance, and POST `/api/chat` SSE. The current launch-token bootstrap is development-only and must not exist in production builds.

Every production request has a request ID and returns JSON errors in this shape:

```json
{"error":{"code":"VR-AUTH-401","message":"Unauthorized","requestId":"...","retryable":false}}
```

Never return stack traces, provider messages, tokens, Riot identifiers, or secrets by default.

## 2. Desktop to Agent

The desktop starts the sidecar with a one-time secret delivered through an OS-protected channel. The Agent exposes loopback HTTP only. Requests use an authenticated desktop bridge or a short-lived loopback credential delivered through the protected handshake. The credential is never put in browser JavaScript, a command line, a URL, or a log. `/api/health` is unauthenticated but returns only liveness/version metadata.

Required endpoints:

- `GET /api/health`: `{ok, agentVersion, protocolVersion, buildId}`
- `GET /api/capabilities`: versioned capability list
- existing feature endpoints unchanged
- `GET /api/state`: named connection states, no secrets
- `POST /api/agent/shutdown`: desktop-only authenticated graceful shutdown

Local SSE retains `meta`, `text`, `error`, and `[DONE]` frames and aborts upstream work on disconnect.

## 3. Cloud API

All cloud routes are under `/v1` and require a user session except health and public version metadata.

```text
POST /v1/auth/register|login|logout|refresh
GET  /v1/me
GET  /v1/devices
POST /v1/devices/enrollment/start
POST /v1/devices/enrollment/complete
PATCH /v1/devices/:deviceId
POST /v1/devices/:deviceId/revoke
GET  /v1/devices/:deviceId/capabilities
POST /v1/devices/:deviceId/requests
POST /v1/devices/:deviceId/streams
GET  /v1/entitlements
GET  /v1/feature-flags
POST /v1/telemetry
```

Before relay: authenticate user, verify device ownership, verify active entitlement, verify device online, verify capability, apply rate limits, and create an audit record. The cloud must not accept arbitrary method/path forwarding.

## 4. Agent WebSocket

Agent opens outbound `wss://api.valorecon.example/v1/agent`.

Envelope:

```json
{"version":1,"type":"request|response|event|heartbeat|close","id":"uuid","ts":"ISO-8601","deviceId":"uuid","method":"agent.health","payload":{},"traceId":"uuid"}
```

Handshake: `hello` with protocol and agent version, `challenge`, proof using the device credential, `welcome` with short-lived session token and server `minAgentVersion`, then heartbeat. Reject unknown major versions, explicitly negotiate minor versions, and close with typed codes on incompatibility.

Allowed RPC methods are an allowlist, for example `agent.health`, `agent.capabilities`, `feature.read`, `coach.stream`, and `telemetry.submit`. Riot operations are never exposed as generic cloud RPC. Every request has a deadline, maximum payload, cancellation, and replay protection.

## 5. Streaming relay

Cloud maps one authenticated web stream to one Agent stream. It forwards typed frames, preserves cancellation, enforces maximum duration and byte limits, and closes both sides on disconnect. The cloud stores metadata only unless the user explicitly opted into content telemetry.

## 6. Compatibility and errors

Stable codes include `VR-AUTH-401`, `VR-AUTH-403`, `VR-DEVICE-OFFLINE`, `VR-PROTOCOL-MISMATCH`, `VR-CAPABILITY-UNAVAILABLE`, `VR-RIOT-OFFLINE`, `VR-AI-UNCONFIGURED`, `VR-RATE-LIMITED`, `VR-VALIDATION-400`, `VR-INTERNAL-500`, and `VR-NOT-IMPLEMENTED`.

Cloud supports agents at least two minor versions old. Contract fixtures must test old/new envelopes, malformed payloads, unauthorized relay, cancellation, reconnect, and unknown methods.
