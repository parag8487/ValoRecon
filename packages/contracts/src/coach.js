"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseAgentInputSchema = exports.AgentAdvisorResponseSchema = exports.AgentAdvisorRecommendationSchema = exports.WeeklyPlanSchema = exports.TrendReportSchema = exports.TrendMetricDeltaSchema = exports.WindowStatSchema = exports.CoachSuggestionSchema = void 0;
const zod_1 = require("zod");
exports.CoachSuggestionSchema = zod_1.z.object({
    label: zod_1.z.string(),
    prompt: zod_1.z.string(),
    reason: zod_1.z.string()
});
exports.WindowStatSchema = zod_1.z.object({
    window: zod_1.z.number(),
    matches: zod_1.z.number(),
    wins: zod_1.z.number(),
    losses: zod_1.z.number(),
    winRate: zod_1.z.number().nullable(),
    kd: zod_1.z.number().nullable(),
    acs: zod_1.z.number().nullable(),
    adr: zod_1.z.number().nullable(),
    hsPct: zod_1.z.number().nullable(),
    firstBloodsPerMatch: zod_1.z.number().nullable()
});
exports.TrendMetricDeltaSchema = zod_1.z.object({
    direction: zod_1.z.enum(['improving', 'declining', 'stable']),
    delta: zod_1.z.number().nullable()
});
exports.TrendReportSchema = zod_1.z.object({
    windows: zod_1.z.array(exports.WindowStatSchema),
    deltas: zod_1.z.array(zod_1.z.object({
        window: zod_1.z.number(),
        kd: exports.TrendMetricDeltaSchema,
        winRate: exports.TrendMetricDeltaSchema,
        acs: exports.TrendMetricDeltaSchema,
        adr: exports.TrendMetricDeltaSchema,
        hsPct: exports.TrendMetricDeltaSchema
    })),
    percentiles: zod_1.z.array(zod_1.z.object({
        metric: zod_1.z.string(),
        current: zod_1.z.number().nullable(),
        percentile: zod_1.z.number().nullable(),
        sample: zod_1.z.number()
    }))
});
exports.WeeklyPlanSchema = zod_1.z.object({
    weaknesses: zod_1.z.array(zod_1.z.object({
        area: zod_1.z.string(),
        evidence: zod_1.z.string(),
        severity: zod_1.z.enum(['high', 'medium', 'low'])
    })),
    goals: zod_1.z.array(zod_1.z.object({
        goal: zod_1.z.string(),
        target: zod_1.z.string(),
        metric: zod_1.z.string()
    })),
    drills: zod_1.z.array(zod_1.z.object({
        drill: zod_1.z.string(),
        duration: zod_1.z.string(),
        focus: zod_1.z.string(),
        tiesTo: zod_1.z.string()
    }))
});
exports.AgentAdvisorRecommendationSchema = zod_1.z.object({
    agentName: zod_1.z.string(),
    role: zod_1.z.enum(['Duelist', 'Initiator', 'Controller', 'Sentinel']),
    tier: zod_1.z.enum(['S', 'A', 'B']),
    score: zod_1.z.number(),
    iconUrl: zod_1.z.string(),
    portraitUrl: zod_1.z.string(),
    mapAdvantage: zod_1.z.string(),
    synergyReasons: zod_1.z.array(zod_1.z.string()),
    keyAbilities: zod_1.z.array(zod_1.z.string())
});
exports.AgentAdvisorResponseSchema = zod_1.z.object({
    recommendations: zod_1.z.array(exports.AgentAdvisorRecommendationSchema),
    compAnalysis: zod_1.z.object({
        hasController: zod_1.z.boolean(),
        hasInitiator: zod_1.z.boolean(),
        hasDuelist: zod_1.z.boolean(),
        hasSentinel: zod_1.z.boolean(),
        missingRoles: zod_1.z.array(zod_1.z.string()),
        compSummary: zod_1.z.string(),
        allyComp: zod_1.z.array(zod_1.z.string()),
        map: zod_1.z.string()
    })
});
exports.ChooseAgentInputSchema = zod_1.z.object({
    map: zod_1.z.string().default('Ascent'),
    allyComp: zod_1.z.array(zod_1.z.string()).default([]),
    role: zod_1.z.string().optional()
});
