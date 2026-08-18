import { z } from 'zod';

export const AiSettingsSchema = z.object({
  hasKey: z.boolean(),
  keyHint: z.string(),
  model: z.string(),
  usingEnvKey: z.boolean(),
  tone: z.enum(['analytical', 'tactical_mentor', 'aggressive_drill']).optional()
});

export type AiSettings = z.infer<typeof AiSettingsSchema>;

export const AiSettingsSaveInputSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().optional(),
  tone: z.enum(['analytical', 'tactical_mentor', 'aggressive_drill']).optional()
});

export type AiSettingsSaveInput = z.infer<typeof AiSettingsSaveInputSchema>;

export const AiUsageSchema = z.object({
  calls: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedTokens: z.number(),
  totalTokens: z.number(),
  estimatedCostUSD: z.number()
});

export type AiUsage = z.infer<typeof AiUsageSchema>;

export const KeyRoundBreakdownSchema = z.object({
  round: z.number(),
  type: z.string(),
  verdict: z.string()
});

export const AnalysisReportSchema = z.object({
  needsApiKey: z.boolean().optional(),
  overallVerdict: z.string(),
  rating: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()),
  mistakes: z.array(z.string()),
  coachingTips: z.array(z.string()),
  economyRating: z.string().optional(),
  clutchRating: z.string().optional(),
  keyRoundBreakdown: z.array(KeyRoundBreakdownSchema).optional()
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const AIMatchAnalysisSchema = z.object({
  matchId: z.string(),
  analysis: AnalysisReportSchema
});

export type AIMatchAnalysis = z.infer<typeof AIMatchAnalysisSchema>;

export const ChatMessageSchema = z.object({
  role: z.string(),
  content: z.string()
});

export const ChatInputSchema = z.object({
  messages: z.array(ChatMessageSchema)
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const MatchAnalysisInputSchema = z.object({
  matchId: z.string(),
  matchData: z.any().optional(),
  focus: z.string().optional()
});

export type MatchAnalysisInput = z.infer<typeof MatchAnalysisInputSchema>;

export const ScreenshotInputSchema = z.object({
  image: z.string().max(7 * 1024 * 1024), // Max ~5MB binary encoded as base64
  mimeType: z.string().default('image/png')
});

export type ScreenshotInput = z.infer<typeof ScreenshotInputSchema>;
