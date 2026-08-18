"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEnvelopeSchema = exports.CapabilitiesResponseSchema = exports.HealthResponseSchema = void 0;
const zod_1 = require("zod");
exports.HealthResponseSchema = zod_1.z.object({
    ok: zod_1.z.boolean(),
    status: zod_1.z.enum(['ready', 'degraded', 'not_ready']).optional(),
    agentVersion: zod_1.z.string().optional(),
    protocolVersion: zod_1.z.string().optional(),
    buildId: zod_1.z.string().optional(),
    components: zod_1.z.object({
        agent: zod_1.z.enum(['ready', 'not_ready']).optional(),
        riot: zod_1.z.enum(['available', 'closed', 'stale', 'throttled']).optional(),
        gemini: zod_1.z.enum(['available', 'unconfigured', 'degraded']).optional(),
        cloud: zod_1.z.enum(['connected', 'offline', 'signed_out']).optional(),
        storage: zod_1.z.enum(['ready', 'read_only', 'full']).optional()
    }).optional(),
    checkedAt: zod_1.z.string().optional()
});
exports.CapabilitiesResponseSchema = zod_1.z.object({
    version: zod_1.z.string(),
    protocolVersion: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    features: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean())
});
exports.WebSocketEnvelopeSchema = zod_1.z.object({
    version: zod_1.z.number().default(1),
    type: zod_1.z.enum(['request', 'response', 'event', 'heartbeat', 'close', 'stream_chunk', 'stream_end', 'stream_error']),
    id: zod_1.z.string(),
    ts: zod_1.z.string(),
    deviceId: zod_1.z.string(),
    method: zod_1.z.string().optional(),
    payload: zod_1.z.any().optional(),
    traceId: zod_1.z.string().optional(),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string()
    }).optional()
});
