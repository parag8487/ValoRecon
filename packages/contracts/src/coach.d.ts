import { z } from 'zod';
export declare const CoachSuggestionSchema: z.ZodObject<{
    label: z.ZodString;
    prompt: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    prompt: string;
    reason: string;
}, {
    label: string;
    prompt: string;
    reason: string;
}>;
export type CoachSuggestion = z.infer<typeof CoachSuggestionSchema>;
export declare const WindowStatSchema: z.ZodObject<{
    window: z.ZodNumber;
    matches: z.ZodNumber;
    wins: z.ZodNumber;
    losses: z.ZodNumber;
    winRate: z.ZodNullable<z.ZodNumber>;
    kd: z.ZodNullable<z.ZodNumber>;
    acs: z.ZodNullable<z.ZodNumber>;
    adr: z.ZodNullable<z.ZodNumber>;
    hsPct: z.ZodNullable<z.ZodNumber>;
    firstBloodsPerMatch: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    window: number;
    matches: number;
    wins: number;
    losses: number;
    winRate: number | null;
    kd: number | null;
    acs: number | null;
    adr: number | null;
    hsPct: number | null;
    firstBloodsPerMatch: number | null;
}, {
    window: number;
    matches: number;
    wins: number;
    losses: number;
    winRate: number | null;
    kd: number | null;
    acs: number | null;
    adr: number | null;
    hsPct: number | null;
    firstBloodsPerMatch: number | null;
}>;
export type WindowStat = z.infer<typeof WindowStatSchema>;
export declare const TrendMetricDeltaSchema: z.ZodObject<{
    direction: z.ZodEnum<["improving", "declining", "stable"]>;
    delta: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    direction: "improving" | "declining" | "stable";
    delta: number | null;
}, {
    direction: "improving" | "declining" | "stable";
    delta: number | null;
}>;
export declare const TrendReportSchema: z.ZodObject<{
    windows: z.ZodArray<z.ZodObject<{
        window: z.ZodNumber;
        matches: z.ZodNumber;
        wins: z.ZodNumber;
        losses: z.ZodNumber;
        winRate: z.ZodNullable<z.ZodNumber>;
        kd: z.ZodNullable<z.ZodNumber>;
        acs: z.ZodNullable<z.ZodNumber>;
        adr: z.ZodNullable<z.ZodNumber>;
        hsPct: z.ZodNullable<z.ZodNumber>;
        firstBloodsPerMatch: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        window: number;
        matches: number;
        wins: number;
        losses: number;
        winRate: number | null;
        kd: number | null;
        acs: number | null;
        adr: number | null;
        hsPct: number | null;
        firstBloodsPerMatch: number | null;
    }, {
        window: number;
        matches: number;
        wins: number;
        losses: number;
        winRate: number | null;
        kd: number | null;
        acs: number | null;
        adr: number | null;
        hsPct: number | null;
        firstBloodsPerMatch: number | null;
    }>, "many">;
    deltas: z.ZodArray<z.ZodObject<{
        window: z.ZodNumber;
        kd: z.ZodObject<{
            direction: z.ZodEnum<["improving", "declining", "stable"]>;
            delta: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }>;
        winRate: z.ZodObject<{
            direction: z.ZodEnum<["improving", "declining", "stable"]>;
            delta: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }>;
        acs: z.ZodObject<{
            direction: z.ZodEnum<["improving", "declining", "stable"]>;
            delta: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }>;
        adr: z.ZodObject<{
            direction: z.ZodEnum<["improving", "declining", "stable"]>;
            delta: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }>;
        hsPct: z.ZodObject<{
            direction: z.ZodEnum<["improving", "declining", "stable"]>;
            delta: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }, {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        }>;
    }, "strip", z.ZodTypeAny, {
        window: number;
        winRate: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        kd: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        acs: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        adr: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        hsPct: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
    }, {
        window: number;
        winRate: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        kd: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        acs: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        adr: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        hsPct: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
    }>, "many">;
    percentiles: z.ZodArray<z.ZodObject<{
        metric: z.ZodString;
        current: z.ZodNullable<z.ZodNumber>;
        percentile: z.ZodNullable<z.ZodNumber>;
        sample: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        metric: string;
        current: number | null;
        percentile: number | null;
        sample: number;
    }, {
        metric: string;
        current: number | null;
        percentile: number | null;
        sample: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    windows: {
        window: number;
        matches: number;
        wins: number;
        losses: number;
        winRate: number | null;
        kd: number | null;
        acs: number | null;
        adr: number | null;
        hsPct: number | null;
        firstBloodsPerMatch: number | null;
    }[];
    deltas: {
        window: number;
        winRate: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        kd: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        acs: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        adr: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        hsPct: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
    }[];
    percentiles: {
        metric: string;
        current: number | null;
        percentile: number | null;
        sample: number;
    }[];
}, {
    windows: {
        window: number;
        matches: number;
        wins: number;
        losses: number;
        winRate: number | null;
        kd: number | null;
        acs: number | null;
        adr: number | null;
        hsPct: number | null;
        firstBloodsPerMatch: number | null;
    }[];
    deltas: {
        window: number;
        winRate: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        kd: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        acs: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        adr: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
        hsPct: {
            direction: "improving" | "declining" | "stable";
            delta: number | null;
        };
    }[];
    percentiles: {
        metric: string;
        current: number | null;
        percentile: number | null;
        sample: number;
    }[];
}>;
export type TrendReport = z.infer<typeof TrendReportSchema>;
export declare const WeeklyPlanSchema: z.ZodObject<{
    weaknesses: z.ZodArray<z.ZodObject<{
        area: z.ZodString;
        evidence: z.ZodString;
        severity: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        area: string;
        evidence: string;
        severity: "high" | "medium" | "low";
    }, {
        area: string;
        evidence: string;
        severity: "high" | "medium" | "low";
    }>, "many">;
    goals: z.ZodArray<z.ZodObject<{
        goal: z.ZodString;
        target: z.ZodString;
        metric: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        metric: string;
        goal: string;
        target: string;
    }, {
        metric: string;
        goal: string;
        target: string;
    }>, "many">;
    drills: z.ZodArray<z.ZodObject<{
        drill: z.ZodString;
        duration: z.ZodString;
        focus: z.ZodString;
        tiesTo: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        focus: string;
        drill: string;
        duration: string;
        tiesTo: string;
    }, {
        focus: string;
        drill: string;
        duration: string;
        tiesTo: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    weaknesses: {
        area: string;
        evidence: string;
        severity: "high" | "medium" | "low";
    }[];
    goals: {
        metric: string;
        goal: string;
        target: string;
    }[];
    drills: {
        focus: string;
        drill: string;
        duration: string;
        tiesTo: string;
    }[];
}, {
    weaknesses: {
        area: string;
        evidence: string;
        severity: "high" | "medium" | "low";
    }[];
    goals: {
        metric: string;
        goal: string;
        target: string;
    }[];
    drills: {
        focus: string;
        drill: string;
        duration: string;
        tiesTo: string;
    }[];
}>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export declare const AgentAdvisorRecommendationSchema: z.ZodObject<{
    agentName: z.ZodString;
    role: z.ZodEnum<["Duelist", "Initiator", "Controller", "Sentinel"]>;
    tier: z.ZodEnum<["S", "A", "B"]>;
    score: z.ZodNumber;
    iconUrl: z.ZodString;
    portraitUrl: z.ZodString;
    mapAdvantage: z.ZodString;
    synergyReasons: z.ZodArray<z.ZodString, "many">;
    keyAbilities: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
    agentName: string;
    tier: "S" | "A" | "B";
    score: number;
    iconUrl: string;
    portraitUrl: string;
    mapAdvantage: string;
    synergyReasons: string[];
    keyAbilities: string[];
}, {
    role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
    agentName: string;
    tier: "S" | "A" | "B";
    score: number;
    iconUrl: string;
    portraitUrl: string;
    mapAdvantage: string;
    synergyReasons: string[];
    keyAbilities: string[];
}>;
export declare const AgentAdvisorResponseSchema: z.ZodObject<{
    recommendations: z.ZodArray<z.ZodObject<{
        agentName: z.ZodString;
        role: z.ZodEnum<["Duelist", "Initiator", "Controller", "Sentinel"]>;
        tier: z.ZodEnum<["S", "A", "B"]>;
        score: z.ZodNumber;
        iconUrl: z.ZodString;
        portraitUrl: z.ZodString;
        mapAdvantage: z.ZodString;
        synergyReasons: z.ZodArray<z.ZodString, "many">;
        keyAbilities: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        agentName: string;
        tier: "S" | "A" | "B";
        score: number;
        iconUrl: string;
        portraitUrl: string;
        mapAdvantage: string;
        synergyReasons: string[];
        keyAbilities: string[];
    }, {
        role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        agentName: string;
        tier: "S" | "A" | "B";
        score: number;
        iconUrl: string;
        portraitUrl: string;
        mapAdvantage: string;
        synergyReasons: string[];
        keyAbilities: string[];
    }>, "many">;
    compAnalysis: z.ZodObject<{
        hasController: z.ZodBoolean;
        hasInitiator: z.ZodBoolean;
        hasDuelist: z.ZodBoolean;
        hasSentinel: z.ZodBoolean;
        missingRoles: z.ZodArray<z.ZodString, "many">;
        compSummary: z.ZodString;
        allyComp: z.ZodArray<z.ZodString, "many">;
        map: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        map: string;
        hasController: boolean;
        hasInitiator: boolean;
        hasDuelist: boolean;
        hasSentinel: boolean;
        missingRoles: string[];
        compSummary: string;
        allyComp: string[];
    }, {
        map: string;
        hasController: boolean;
        hasInitiator: boolean;
        hasDuelist: boolean;
        hasSentinel: boolean;
        missingRoles: string[];
        compSummary: string;
        allyComp: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    recommendations: {
        role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        agentName: string;
        tier: "S" | "A" | "B";
        score: number;
        iconUrl: string;
        portraitUrl: string;
        mapAdvantage: string;
        synergyReasons: string[];
        keyAbilities: string[];
    }[];
    compAnalysis: {
        map: string;
        hasController: boolean;
        hasInitiator: boolean;
        hasDuelist: boolean;
        hasSentinel: boolean;
        missingRoles: string[];
        compSummary: string;
        allyComp: string[];
    };
}, {
    recommendations: {
        role: "Duelist" | "Initiator" | "Controller" | "Sentinel";
        agentName: string;
        tier: "S" | "A" | "B";
        score: number;
        iconUrl: string;
        portraitUrl: string;
        mapAdvantage: string;
        synergyReasons: string[];
        keyAbilities: string[];
    }[];
    compAnalysis: {
        map: string;
        hasController: boolean;
        hasInitiator: boolean;
        hasDuelist: boolean;
        hasSentinel: boolean;
        missingRoles: string[];
        compSummary: string;
        allyComp: string[];
    };
}>;
export type AgentAdvisorRecommendation = z.infer<typeof AgentAdvisorRecommendationSchema>;
export type AgentAdvisorResponse = z.infer<typeof AgentAdvisorResponseSchema>;
export declare const ChooseAgentInputSchema: z.ZodObject<{
    map: z.ZodDefault<z.ZodString>;
    allyComp: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    role: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    map: string;
    allyComp: string[];
    role?: string | undefined;
}, {
    map?: string | undefined;
    role?: string | undefined;
    allyComp?: string[] | undefined;
}>;
export type ChooseAgentInput = z.infer<typeof ChooseAgentInputSchema>;
