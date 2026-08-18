"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentActionInputSchema = exports.AutoPickSettingsSchema = exports.LobbyInspectDataSchema = exports.LobbyInspectPlayerSchema = exports.LiveScoreDataSchema = exports.GamePhaseDataSchema = exports.RiotStatusDataSchema = void 0;
const zod_1 = require("zod");
exports.RiotStatusDataSchema = zod_1.z.object({
    connected: zod_1.z.boolean(),
    gameRunning: zod_1.z.boolean(),
    puuid: zod_1.z.string().nullable().optional(),
    gameName: zod_1.z.string().nullable().optional(),
    gameTag: zod_1.z.string().nullable().optional(),
    region: zod_1.z.string().nullable().optional(),
    shard: zod_1.z.string().nullable().optional()
});
exports.GamePhaseDataSchema = zod_1.z.object({
    phase: zod_1.z.enum(['OFFLINE', 'MENUS', 'AGENT_SELECT', 'INGAME']),
    matchId: zod_1.z.string().nullable(),
    source: zod_1.z.enum(['live', 'mock']).optional()
});
exports.LiveScoreDataSchema = zod_1.z.object({
    ally: zod_1.z.number().nullable(),
    enemy: zod_1.z.number().nullable(),
    round: zod_1.z.number().nullable()
});
exports.LobbyInspectPlayerSchema = zod_1.z.object({
    isPlayer: zod_1.z.boolean(),
    teamId: zod_1.z.string().optional(),
    agentName: zod_1.z.string().nullable(),
    agentIcon: zod_1.z.string().nullable(),
    selectionState: zod_1.z.string().optional(),
    tier: zod_1.z.number().optional(),
    tierName: zod_1.z.string().optional(),
    tierIcon: zod_1.z.string().nullable().optional(),
    rr: zod_1.z.number().optional(),
    streak: zod_1.z.object({
        type: zod_1.z.enum(['W', 'L']).nullable(),
        count: zod_1.z.number()
    }).nullable().optional(),
    skins: zod_1.z.array(zod_1.z.object({
        weapon: zod_1.z.string(),
        skinName: zod_1.z.string(),
        icon: zod_1.z.string().nullable(),
        tierRank: zod_1.z.number().optional()
    })).optional()
});
exports.LobbyInspectDataSchema = zod_1.z.object({
    available: zod_1.z.boolean(),
    phase: zod_1.z.enum(['AGENT_SELECT', 'IN_GAME', 'IN_LOBBY', 'OFFLINE', 'ERROR']),
    source: zod_1.z.enum(['live', 'mock']).optional(),
    map: zod_1.z.string().optional(),
    players: zod_1.z.array(exports.LobbyInspectPlayerSchema),
    skinsAvailable: zod_1.z.boolean().optional(),
    note: zod_1.z.string().optional()
});
exports.AutoPickSettingsSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    agentUuid: zod_1.z.string(),
    agentName: zod_1.z.string(),
    mode: zod_1.z.enum(['hover', 'lock']),
    lastActionStatus: zod_1.z.string().optional(),
    lastActionTimestamp: zod_1.z.number().optional(),
    matchState: zod_1.z.enum(['IDLE', 'PREGAME_HOVERED', 'PREGAME_LOCKED', 'IN_GAME']).optional()
});
exports.AgentActionInputSchema = zod_1.z.object({
    agentUuid: zod_1.z.string().min(1)
});
