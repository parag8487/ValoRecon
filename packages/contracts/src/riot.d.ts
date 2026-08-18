import { z } from 'zod';
export declare const RiotStatusDataSchema: z.ZodObject<{
    connected: z.ZodBoolean;
    gameRunning: z.ZodBoolean;
    puuid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gameName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gameTag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    shard: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    connected: boolean;
    gameRunning: boolean;
    puuid?: string | null | undefined;
    gameName?: string | null | undefined;
    gameTag?: string | null | undefined;
    region?: string | null | undefined;
    shard?: string | null | undefined;
}, {
    connected: boolean;
    gameRunning: boolean;
    puuid?: string | null | undefined;
    gameName?: string | null | undefined;
    gameTag?: string | null | undefined;
    region?: string | null | undefined;
    shard?: string | null | undefined;
}>;
export type RiotStatusData = z.infer<typeof RiotStatusDataSchema>;
export declare const GamePhaseDataSchema: z.ZodObject<{
    phase: z.ZodEnum<["OFFLINE", "MENUS", "AGENT_SELECT", "INGAME"]>;
    matchId: z.ZodNullable<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["live", "mock"]>>;
}, "strip", z.ZodTypeAny, {
    matchId: string | null;
    phase: "OFFLINE" | "MENUS" | "AGENT_SELECT" | "INGAME";
    source?: "live" | "mock" | undefined;
}, {
    matchId: string | null;
    phase: "OFFLINE" | "MENUS" | "AGENT_SELECT" | "INGAME";
    source?: "live" | "mock" | undefined;
}>;
export type GamePhaseData = z.infer<typeof GamePhaseDataSchema>;
export declare const LiveScoreDataSchema: z.ZodObject<{
    ally: z.ZodNullable<z.ZodNumber>;
    enemy: z.ZodNullable<z.ZodNumber>;
    round: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    round: number | null;
    ally: number | null;
    enemy: number | null;
}, {
    round: number | null;
    ally: number | null;
    enemy: number | null;
}>;
export type LiveScoreData = z.infer<typeof LiveScoreDataSchema>;
export declare const LobbyInspectPlayerSchema: z.ZodObject<{
    isPlayer: z.ZodBoolean;
    teamId: z.ZodOptional<z.ZodString>;
    agentName: z.ZodNullable<z.ZodString>;
    agentIcon: z.ZodNullable<z.ZodString>;
    selectionState: z.ZodOptional<z.ZodString>;
    tier: z.ZodOptional<z.ZodNumber>;
    tierName: z.ZodOptional<z.ZodString>;
    tierIcon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rr: z.ZodOptional<z.ZodNumber>;
    streak: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        type: z.ZodNullable<z.ZodEnum<["W", "L"]>>;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "W" | "L" | null;
        count: number;
    }, {
        type: "W" | "L" | null;
        count: number;
    }>>>;
    skins: z.ZodOptional<z.ZodArray<z.ZodObject<{
        weapon: z.ZodString;
        skinName: z.ZodString;
        icon: z.ZodNullable<z.ZodString>;
        tierRank: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        weapon: string;
        skinName: string;
        icon: string | null;
        tierRank?: number | undefined;
    }, {
        weapon: string;
        skinName: string;
        icon: string | null;
        tierRank?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    agentName: string | null;
    isPlayer: boolean;
    agentIcon: string | null;
    tier?: number | undefined;
    skins?: {
        weapon: string;
        skinName: string;
        icon: string | null;
        tierRank?: number | undefined;
    }[] | undefined;
    teamId?: string | undefined;
    selectionState?: string | undefined;
    tierName?: string | undefined;
    tierIcon?: string | null | undefined;
    rr?: number | undefined;
    streak?: {
        type: "W" | "L" | null;
        count: number;
    } | null | undefined;
}, {
    agentName: string | null;
    isPlayer: boolean;
    agentIcon: string | null;
    tier?: number | undefined;
    skins?: {
        weapon: string;
        skinName: string;
        icon: string | null;
        tierRank?: number | undefined;
    }[] | undefined;
    teamId?: string | undefined;
    selectionState?: string | undefined;
    tierName?: string | undefined;
    tierIcon?: string | null | undefined;
    rr?: number | undefined;
    streak?: {
        type: "W" | "L" | null;
        count: number;
    } | null | undefined;
}>;
export type LobbyInspectPlayer = z.infer<typeof LobbyInspectPlayerSchema>;
export declare const LobbyInspectDataSchema: z.ZodObject<{
    available: z.ZodBoolean;
    phase: z.ZodEnum<["AGENT_SELECT", "IN_GAME", "IN_LOBBY", "OFFLINE", "ERROR"]>;
    source: z.ZodOptional<z.ZodEnum<["live", "mock"]>>;
    map: z.ZodOptional<z.ZodString>;
    players: z.ZodArray<z.ZodObject<{
        isPlayer: z.ZodBoolean;
        teamId: z.ZodOptional<z.ZodString>;
        agentName: z.ZodNullable<z.ZodString>;
        agentIcon: z.ZodNullable<z.ZodString>;
        selectionState: z.ZodOptional<z.ZodString>;
        tier: z.ZodOptional<z.ZodNumber>;
        tierName: z.ZodOptional<z.ZodString>;
        tierIcon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        rr: z.ZodOptional<z.ZodNumber>;
        streak: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            type: z.ZodNullable<z.ZodEnum<["W", "L"]>>;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "W" | "L" | null;
            count: number;
        }, {
            type: "W" | "L" | null;
            count: number;
        }>>>;
        skins: z.ZodOptional<z.ZodArray<z.ZodObject<{
            weapon: z.ZodString;
            skinName: z.ZodString;
            icon: z.ZodNullable<z.ZodString>;
            tierRank: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }, {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        agentName: string | null;
        isPlayer: boolean;
        agentIcon: string | null;
        tier?: number | undefined;
        skins?: {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }[] | undefined;
        teamId?: string | undefined;
        selectionState?: string | undefined;
        tierName?: string | undefined;
        tierIcon?: string | null | undefined;
        rr?: number | undefined;
        streak?: {
            type: "W" | "L" | null;
            count: number;
        } | null | undefined;
    }, {
        agentName: string | null;
        isPlayer: boolean;
        agentIcon: string | null;
        tier?: number | undefined;
        skins?: {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }[] | undefined;
        teamId?: string | undefined;
        selectionState?: string | undefined;
        tierName?: string | undefined;
        tierIcon?: string | null | undefined;
        rr?: number | undefined;
        streak?: {
            type: "W" | "L" | null;
            count: number;
        } | null | undefined;
    }>, "many">;
    skinsAvailable: z.ZodOptional<z.ZodBoolean>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phase: "OFFLINE" | "AGENT_SELECT" | "IN_GAME" | "IN_LOBBY" | "ERROR";
    available: boolean;
    players: {
        agentName: string | null;
        isPlayer: boolean;
        agentIcon: string | null;
        tier?: number | undefined;
        skins?: {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }[] | undefined;
        teamId?: string | undefined;
        selectionState?: string | undefined;
        tierName?: string | undefined;
        tierIcon?: string | null | undefined;
        rr?: number | undefined;
        streak?: {
            type: "W" | "L" | null;
            count: number;
        } | null | undefined;
    }[];
    map?: string | undefined;
    source?: "live" | "mock" | undefined;
    skinsAvailable?: boolean | undefined;
    note?: string | undefined;
}, {
    phase: "OFFLINE" | "AGENT_SELECT" | "IN_GAME" | "IN_LOBBY" | "ERROR";
    available: boolean;
    players: {
        agentName: string | null;
        isPlayer: boolean;
        agentIcon: string | null;
        tier?: number | undefined;
        skins?: {
            weapon: string;
            skinName: string;
            icon: string | null;
            tierRank?: number | undefined;
        }[] | undefined;
        teamId?: string | undefined;
        selectionState?: string | undefined;
        tierName?: string | undefined;
        tierIcon?: string | null | undefined;
        rr?: number | undefined;
        streak?: {
            type: "W" | "L" | null;
            count: number;
        } | null | undefined;
    }[];
    map?: string | undefined;
    source?: "live" | "mock" | undefined;
    skinsAvailable?: boolean | undefined;
    note?: string | undefined;
}>;
export type LobbyInspectData = z.infer<typeof LobbyInspectDataSchema>;
export declare const AutoPickSettingsSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    agentUuid: z.ZodString;
    agentName: z.ZodString;
    mode: z.ZodEnum<["hover", "lock"]>;
    lastActionStatus: z.ZodOptional<z.ZodString>;
    lastActionTimestamp: z.ZodOptional<z.ZodNumber>;
    matchState: z.ZodOptional<z.ZodEnum<["IDLE", "PREGAME_HOVERED", "PREGAME_LOCKED", "IN_GAME"]>>;
}, "strip", z.ZodTypeAny, {
    agentName: string;
    enabled: boolean;
    agentUuid: string;
    mode: "hover" | "lock";
    lastActionStatus?: string | undefined;
    lastActionTimestamp?: number | undefined;
    matchState?: "IN_GAME" | "IDLE" | "PREGAME_HOVERED" | "PREGAME_LOCKED" | undefined;
}, {
    agentName: string;
    enabled: boolean;
    agentUuid: string;
    mode: "hover" | "lock";
    lastActionStatus?: string | undefined;
    lastActionTimestamp?: number | undefined;
    matchState?: "IN_GAME" | "IDLE" | "PREGAME_HOVERED" | "PREGAME_LOCKED" | undefined;
}>;
export type AutoPickSettings = z.infer<typeof AutoPickSettingsSchema>;
export declare const AgentActionInputSchema: z.ZodObject<{
    agentUuid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agentUuid: string;
}, {
    agentUuid: string;
}>;
export type AgentActionInput = z.infer<typeof AgentActionInputSchema>;
