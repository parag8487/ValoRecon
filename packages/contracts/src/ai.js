"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotInputSchema = exports.MatchAnalysisInputSchema = exports.ChatInputSchema = exports.ChatMessageSchema = exports.AIMatchAnalysisSchema = exports.AnalysisReportSchema = exports.KeyRoundBreakdownSchema = exports.AiUsageSchema = exports.AiSettingsSaveInputSchema = exports.AiSettingsSchema = void 0;
const zod_1 = require("zod");
exports.AiSettingsSchema = zod_1.z.object({
    hasKey: zod_1.z.boolean(),
    keyHint: zod_1.z.string(),
    model: zod_1.z.string(),
    usingEnvKey: zod_1.z.boolean(),
    tone: zod_1.z.enum(['analytical', 'tactical_mentor', 'aggressive_drill']).optional()
});
exports.AiSettingsSaveInputSchema = zod_1.z.object({
    apiKey: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    tone: zod_1.z.enum(['analytical', 'tactical_mentor', 'aggressive_drill']).optional()
});
exports.AiUsageSchema = zod_1.z.object({
    calls: zod_1.z.number(),
    inputTokens: zod_1.z.number(),
    outputTokens: zod_1.z.number(),
    cachedTokens: zod_1.z.number(),
    totalTokens: zod_1.z.number(),
    estimatedCostUSD: zod_1.z.number()
});
exports.KeyRoundBreakdownSchema = zod_1.z.object({
    round: zod_1.z.number(),
    type: zod_1.z.string(),
    verdict: zod_1.z.string()
});
exports.AnalysisReportSchema = zod_1.z.object({
    needsApiKey: zod_1.z.boolean().optional(),
    overallVerdict: zod_1.z.string(),
    rating: zod_1.z.number(),
    summary: zod_1.z.string(),
    strengths: zod_1.z.array(zod_1.z.string()),
    mistakes: zod_1.z.array(zod_1.z.string()),
    coachingTips: zod_1.z.array(zod_1.z.string()),
    economyRating: zod_1.z.string().optional(),
    clutchRating: zod_1.z.string().optional(),
    keyRoundBreakdown: zod_1.z.array(exports.KeyRoundBreakdownSchema).optional()
});
exports.AIMatchAnalysisSchema = zod_1.z.object({
    matchId: zod_1.z.string(),
    analysis: exports.AnalysisReportSchema
});
exports.ChatMessageSchema = zod_1.z.object({
    role: zod_1.z.string(),
    content: zod_1.z.string()
});
exports.ChatInputSchema = zod_1.z.object({
    messages: zod_1.z.array(exports.ChatMessageSchema)
});
exports.MatchAnalysisInputSchema = zod_1.z.object({
    matchId: zod_1.z.string(),
    matchData: zod_1.z.any().optional(),
    focus: zod_1.z.string().optional()
});
exports.ScreenshotInputSchema = zod_1.z.object({
    image: zod_1.z.string().max(7 * 1024 * 1024), // Max ~5MB binary encoded as base64
    mimeType: zod_1.z.string().default('image/png')
});
