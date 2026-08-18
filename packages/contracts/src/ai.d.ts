import { z } from 'zod';
export declare const AiSettingsSchema: z.ZodObject<{
    hasKey: z.ZodBoolean;
    keyHint: z.ZodString;
    model: z.ZodString;
    usingEnvKey: z.ZodBoolean;
    tone: z.ZodOptional<z.ZodEnum<["analytical", "tactical_mentor", "aggressive_drill"]>>;
}, "strip", z.ZodTypeAny, {
    hasKey: boolean;
    keyHint: string;
    model: string;
    usingEnvKey: boolean;
    tone?: "analytical" | "tactical_mentor" | "aggressive_drill" | undefined;
}, {
    hasKey: boolean;
    keyHint: string;
    model: string;
    usingEnvKey: boolean;
    tone?: "analytical" | "tactical_mentor" | "aggressive_drill" | undefined;
}>;
export type AiSettings = z.infer<typeof AiSettingsSchema>;
export declare const AiSettingsSaveInputSchema: z.ZodObject<{
    apiKey: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    tone: z.ZodOptional<z.ZodEnum<["analytical", "tactical_mentor", "aggressive_drill"]>>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    tone?: "analytical" | "tactical_mentor" | "aggressive_drill" | undefined;
    apiKey?: string | undefined;
}, {
    model?: string | undefined;
    tone?: "analytical" | "tactical_mentor" | "aggressive_drill" | undefined;
    apiKey?: string | undefined;
}>;
export type AiSettingsSaveInput = z.infer<typeof AiSettingsSaveInputSchema>;
export declare const AiUsageSchema: z.ZodObject<{
    calls: z.ZodNumber;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cachedTokens: z.ZodNumber;
    totalTokens: z.ZodNumber;
    estimatedCostUSD: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
}, {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
}>;
export type AiUsage = z.infer<typeof AiUsageSchema>;
export declare const KeyRoundBreakdownSchema: z.ZodObject<{
    round: z.ZodNumber;
    type: z.ZodString;
    verdict: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    round: number;
    verdict: string;
}, {
    type: string;
    round: number;
    verdict: string;
}>;
export declare const AnalysisReportSchema: z.ZodObject<{
    needsApiKey: z.ZodOptional<z.ZodBoolean>;
    overallVerdict: z.ZodString;
    rating: z.ZodNumber;
    summary: z.ZodString;
    strengths: z.ZodArray<z.ZodString, "many">;
    mistakes: z.ZodArray<z.ZodString, "many">;
    coachingTips: z.ZodArray<z.ZodString, "many">;
    economyRating: z.ZodOptional<z.ZodString>;
    clutchRating: z.ZodOptional<z.ZodString>;
    keyRoundBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
        round: z.ZodNumber;
        type: z.ZodString;
        verdict: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        round: number;
        verdict: string;
    }, {
        type: string;
        round: number;
        verdict: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    overallVerdict: string;
    rating: number;
    summary: string;
    strengths: string[];
    mistakes: string[];
    coachingTips: string[];
    needsApiKey?: boolean | undefined;
    economyRating?: string | undefined;
    clutchRating?: string | undefined;
    keyRoundBreakdown?: {
        type: string;
        round: number;
        verdict: string;
    }[] | undefined;
}, {
    overallVerdict: string;
    rating: number;
    summary: string;
    strengths: string[];
    mistakes: string[];
    coachingTips: string[];
    needsApiKey?: boolean | undefined;
    economyRating?: string | undefined;
    clutchRating?: string | undefined;
    keyRoundBreakdown?: {
        type: string;
        round: number;
        verdict: string;
    }[] | undefined;
}>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export declare const AIMatchAnalysisSchema: z.ZodObject<{
    matchId: z.ZodString;
    analysis: z.ZodObject<{
        needsApiKey: z.ZodOptional<z.ZodBoolean>;
        overallVerdict: z.ZodString;
        rating: z.ZodNumber;
        summary: z.ZodString;
        strengths: z.ZodArray<z.ZodString, "many">;
        mistakes: z.ZodArray<z.ZodString, "many">;
        coachingTips: z.ZodArray<z.ZodString, "many">;
        economyRating: z.ZodOptional<z.ZodString>;
        clutchRating: z.ZodOptional<z.ZodString>;
        keyRoundBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
            round: z.ZodNumber;
            type: z.ZodString;
            verdict: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            round: number;
            verdict: string;
        }, {
            type: string;
            round: number;
            verdict: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        overallVerdict: string;
        rating: number;
        summary: string;
        strengths: string[];
        mistakes: string[];
        coachingTips: string[];
        needsApiKey?: boolean | undefined;
        economyRating?: string | undefined;
        clutchRating?: string | undefined;
        keyRoundBreakdown?: {
            type: string;
            round: number;
            verdict: string;
        }[] | undefined;
    }, {
        overallVerdict: string;
        rating: number;
        summary: string;
        strengths: string[];
        mistakes: string[];
        coachingTips: string[];
        needsApiKey?: boolean | undefined;
        economyRating?: string | undefined;
        clutchRating?: string | undefined;
        keyRoundBreakdown?: {
            type: string;
            round: number;
            verdict: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    matchId: string;
    analysis: {
        overallVerdict: string;
        rating: number;
        summary: string;
        strengths: string[];
        mistakes: string[];
        coachingTips: string[];
        needsApiKey?: boolean | undefined;
        economyRating?: string | undefined;
        clutchRating?: string | undefined;
        keyRoundBreakdown?: {
            type: string;
            round: number;
            verdict: string;
        }[] | undefined;
    };
}, {
    matchId: string;
    analysis: {
        overallVerdict: string;
        rating: number;
        summary: string;
        strengths: string[];
        mistakes: string[];
        coachingTips: string[];
        needsApiKey?: boolean | undefined;
        economyRating?: string | undefined;
        clutchRating?: string | undefined;
        keyRoundBreakdown?: {
            type: string;
            round: number;
            verdict: string;
        }[] | undefined;
    };
}>;
export type AIMatchAnalysis = z.infer<typeof AIMatchAnalysisSchema>;
export declare const ChatMessageSchema: z.ZodObject<{
    role: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: string;
    content: string;
}, {
    role: string;
    content: string;
}>;
export declare const ChatInputSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: string;
        content: string;
    }, {
        role: string;
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: string;
        content: string;
    }[];
}, {
    messages: {
        role: string;
        content: string;
    }[];
}>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export declare const MatchAnalysisInputSchema: z.ZodObject<{
    matchId: z.ZodString;
    matchData: z.ZodOptional<z.ZodAny>;
    focus: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    matchId: string;
    matchData?: any;
    focus?: string | undefined;
}, {
    matchId: string;
    matchData?: any;
    focus?: string | undefined;
}>;
export type MatchAnalysisInput = z.infer<typeof MatchAnalysisInputSchema>;
export declare const ScreenshotInputSchema: z.ZodObject<{
    image: z.ZodString;
    mimeType: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    image: string;
    mimeType: string;
}, {
    image: string;
    mimeType?: string | undefined;
}>;
export type ScreenshotInput = z.infer<typeof ScreenshotInputSchema>;
