import { z } from 'zod';

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['ready', 'degraded', 'not_ready']).optional(),
  agentVersion: z.string().optional(),
  protocolVersion: z.string().optional(),
  buildId: z.string().optional(),
  components: z.object({
    agent: z.enum(['ready', 'not_ready']).optional(),
    riot: z.enum(['available', 'closed', 'stale', 'throttled']).optional(),
    gemini: z.enum(['available', 'unconfigured', 'degraded']).optional(),
    cloud: z.enum(['connected', 'offline', 'signed_out']).optional(),
    storage: z.enum(['ready', 'read_only', 'full']).optional()
  }).optional(),
  checkedAt: z.string().optional()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const CapabilitiesResponseSchema = z.object({
  version: z.string(),
  protocolVersion: z.string(),
  capabilities: z.array(z.string()),
  features: z.record(z.string(), z.boolean())
});

export type CapabilitiesResponse = z.infer<typeof CapabilitiesResponseSchema>;

export const WebSocketEnvelopeSchema = z.object({
  version: z.number().default(1),
  type: z.enum(['request', 'response', 'event', 'heartbeat', 'close', 'stream_chunk', 'stream_end', 'stream_error']),
  id: z.string(),
  ts: z.string(),
  deviceId: z.string(),
  method: z.string().optional(),
  payload: z.any().optional(),
  traceId: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional()
});

export type WebSocketEnvelope = z.infer<typeof WebSocketEnvelopeSchema>;
