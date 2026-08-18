import { z } from 'zod';
export declare const HealthResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    status: z.ZodOptional<z.ZodEnum<["ready", "degraded", "not_ready"]>>;
    agentVersion: z.ZodOptional<z.ZodString>;
    protocolVersion: z.ZodOptional<z.ZodString>;
    buildId: z.ZodOptional<z.ZodString>;
    components: z.ZodOptional<z.ZodObject<{
        agent: z.ZodOptional<z.ZodEnum<["ready", "not_ready"]>>;
        riot: z.ZodOptional<z.ZodEnum<["available", "closed", "stale", "throttled"]>>;
        gemini: z.ZodOptional<z.ZodEnum<["available", "unconfigured", "degraded"]>>;
        cloud: z.ZodOptional<z.ZodEnum<["connected", "offline", "signed_out"]>>;
        storage: z.ZodOptional<z.ZodEnum<["ready", "read_only", "full"]>>;
    }, "strip", z.ZodTypeAny, {
        agent?: "ready" | "not_ready" | undefined;
        riot?: "available" | "closed" | "stale" | "throttled" | undefined;
        gemini?: "available" | "degraded" | "unconfigured" | undefined;
        cloud?: "connected" | "offline" | "signed_out" | undefined;
        storage?: "ready" | "read_only" | "full" | undefined;
    }, {
        agent?: "ready" | "not_ready" | undefined;
        riot?: "available" | "closed" | "stale" | "throttled" | undefined;
        gemini?: "available" | "degraded" | "unconfigured" | undefined;
        cloud?: "connected" | "offline" | "signed_out" | undefined;
        storage?: "ready" | "read_only" | "full" | undefined;
    }>>;
    checkedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    status?: "ready" | "degraded" | "not_ready" | undefined;
    agentVersion?: string | undefined;
    protocolVersion?: string | undefined;
    buildId?: string | undefined;
    components?: {
        agent?: "ready" | "not_ready" | undefined;
        riot?: "available" | "closed" | "stale" | "throttled" | undefined;
        gemini?: "available" | "degraded" | "unconfigured" | undefined;
        cloud?: "connected" | "offline" | "signed_out" | undefined;
        storage?: "ready" | "read_only" | "full" | undefined;
    } | undefined;
    checkedAt?: string | undefined;
}, {
    ok: boolean;
    status?: "ready" | "degraded" | "not_ready" | undefined;
    agentVersion?: string | undefined;
    protocolVersion?: string | undefined;
    buildId?: string | undefined;
    components?: {
        agent?: "ready" | "not_ready" | undefined;
        riot?: "available" | "closed" | "stale" | "throttled" | undefined;
        gemini?: "available" | "degraded" | "unconfigured" | undefined;
        cloud?: "connected" | "offline" | "signed_out" | undefined;
        storage?: "ready" | "read_only" | "full" | undefined;
    } | undefined;
    checkedAt?: string | undefined;
}>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export declare const CapabilitiesResponseSchema: z.ZodObject<{
    version: z.ZodString;
    protocolVersion: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    features: z.ZodRecord<z.ZodString, z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    protocolVersion: string;
    version: string;
    capabilities: string[];
    features: Record<string, boolean>;
}, {
    protocolVersion: string;
    version: string;
    capabilities: string[];
    features: Record<string, boolean>;
}>;
export type CapabilitiesResponse = z.infer<typeof CapabilitiesResponseSchema>;
export declare const WebSocketEnvelopeSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodNumber>;
    type: z.ZodEnum<["request", "response", "event", "heartbeat", "close", "stream_chunk", "stream_end", "stream_error"]>;
    id: z.ZodString;
    ts: z.ZodString;
    deviceId: z.ZodString;
    method: z.ZodOptional<z.ZodString>;
    payload: z.ZodOptional<z.ZodAny>;
    traceId: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
    }, {
        code: string;
        message: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "request" | "response" | "event" | "heartbeat" | "close" | "stream_chunk" | "stream_end" | "stream_error";
    id: string;
    version: number;
    ts: string;
    deviceId: string;
    error?: {
        code: string;
        message: string;
    } | undefined;
    method?: string | undefined;
    payload?: any;
    traceId?: string | undefined;
}, {
    type: "request" | "response" | "event" | "heartbeat" | "close" | "stream_chunk" | "stream_end" | "stream_error";
    id: string;
    ts: string;
    deviceId: string;
    error?: {
        code: string;
        message: string;
    } | undefined;
    version?: number | undefined;
    method?: string | undefined;
    payload?: any;
    traceId?: string | undefined;
}>;
export type WebSocketEnvelope = z.infer<typeof WebSocketEnvelopeSchema>;
