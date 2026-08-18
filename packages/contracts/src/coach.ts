import { z } from 'zod';

export const CoachSuggestionSchema = z.object({
  label: z.string(),
  prompt: z.string(),
  reason: z.string()
});

export type CoachSuggestion = z.infer<typeof CoachSuggestionSchema>;

export const WindowStatSchema = z.object({
  window: z.number(),
  matches: z.number(),
  wins: z.number(),
  losses: z.number(),
  winRate: z.number().nullable(),
  kd: z.number().nullable(),
  acs: z.number().nullable(),
  adr: z.number().nullable(),
  hsPct: z.number().nullable(),
  firstBloodsPerMatch: z.number().nullable()
});

export type WindowStat = z.infer<typeof WindowStatSchema>;

export const TrendMetricDeltaSchema = z.object({
  direction: z.enum(['improving', 'declining', 'stable']),
  delta: z.number().nullable()
});

export const TrendReportSchema = z.object({
  windows: z.array(WindowStatSchema),
  deltas: z.array(z.object({
    window: z.number(),
    kd: TrendMetricDeltaSchema,
    winRate: TrendMetricDeltaSchema,
    acs: TrendMetricDeltaSchema,
    adr: TrendMetricDeltaSchema,
    hsPct: TrendMetricDeltaSchema
  })),
  percentiles: z.array(z.object({
    metric: z.string(),
    current: z.number().nullable(),
    percentile: z.number().nullable(),
    sample: z.number()
  }))
});

export type TrendReport = z.infer<typeof TrendReportSchema>;

export const WeeklyPlanSchema = z.object({
  weaknesses: z.array(z.object({
    area: z.string(),
    evidence: z.string(),
    severity: z.enum(['high', 'medium', 'low'])
  })),
  goals: z.array(z.object({
    goal: z.string(),
    target: z.string(),
    metric: z.string()
  })),
  drills: z.array(z.object({
    drill: z.string(),
    duration: z.string(),
    focus: z.string(),
    tiesTo: z.string()
  }))
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

export const AgentAdvisorRecommendationSchema = z.object({
  agentName: z.string(),
  role: z.enum(['Duelist', 'Initiator', 'Controller', 'Sentinel']),
  tier: z.enum(['S', 'A', 'B']),
  score: z.number(),
  iconUrl: z.string(),
  portraitUrl: z.string(),
  mapAdvantage: z.string(),
  synergyReasons: z.array(z.string()),
  keyAbilities: z.array(z.string())
});

export const AgentAdvisorResponseSchema = z.object({
  recommendations: z.array(AgentAdvisorRecommendationSchema),
  compAnalysis: z.object({
    hasController: z.boolean(),
    hasInitiator: z.boolean(),
    hasDuelist: z.boolean(),
    hasSentinel: z.boolean(),
    missingRoles: z.array(z.string()),
    compSummary: z.string(),
    allyComp: z.array(z.string()),
    map: z.string()
  })
});

export type AgentAdvisorRecommendation = z.infer<typeof AgentAdvisorRecommendationSchema>;
export type AgentAdvisorResponse = z.infer<typeof AgentAdvisorResponseSchema>;

export const ChooseAgentInputSchema = z.object({
  map: z.string().default('Ascent'),
  allyComp: z.array(z.string()).default([]),
  role: z.string().optional()
});

export type ChooseAgentInput = z.infer<typeof ChooseAgentInputSchema>;
