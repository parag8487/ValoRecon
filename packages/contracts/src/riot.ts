import { z } from 'zod';

export const RiotStatusDataSchema = z.object({
  connected: z.boolean(),
  gameRunning: z.boolean(),
  puuid: z.string().nullable().optional(),
  gameName: z.string().nullable().optional(),
  gameTag: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  shard: z.string().nullable().optional()
});

export type RiotStatusData = z.infer<typeof RiotStatusDataSchema>;

export const GamePhaseDataSchema = z.object({
  phase: z.enum(['OFFLINE', 'MENUS', 'AGENT_SELECT', 'INGAME']),
  matchId: z.string().nullable(),
  source: z.enum(['live', 'mock']).optional()
});

export type GamePhaseData = z.infer<typeof GamePhaseDataSchema>;

export const LiveScoreDataSchema = z.object({
  ally: z.number().nullable(),
  enemy: z.number().nullable(),
  round: z.number().nullable()
});

export type LiveScoreData = z.infer<typeof LiveScoreDataSchema>;

export const LobbyInspectPlayerSchema = z.object({
  isPlayer: z.boolean(),
  teamId: z.string().optional(),
  agentName: z.string().nullable(),
  agentIcon: z.string().nullable(),
  selectionState: z.string().optional(),
  tier: z.number().optional(),
  tierName: z.string().optional(),
  tierIcon: z.string().nullable().optional(),
  rr: z.number().optional(),
  streak: z.object({
    type: z.enum(['W', 'L']).nullable(),
    count: z.number()
  }).nullable().optional(),
  skins: z.array(z.object({
    weapon: z.string(),
    skinName: z.string(),
    icon: z.string().nullable(),
    tierRank: z.number().optional()
  })).optional()
});

export type LobbyInspectPlayer = z.infer<typeof LobbyInspectPlayerSchema>;

export const LobbyInspectDataSchema = z.object({
  available: z.boolean(),
  phase: z.enum(['AGENT_SELECT', 'IN_GAME', 'IN_LOBBY', 'OFFLINE', 'ERROR']),
  source: z.enum(['live', 'mock']).optional(),
  map: z.string().optional(),
  players: z.array(LobbyInspectPlayerSchema),
  skinsAvailable: z.boolean().optional(),
  note: z.string().optional()
});

export type LobbyInspectData = z.infer<typeof LobbyInspectDataSchema>;

export const AutoPickSettingsSchema = z.object({
  enabled: z.boolean(),
  agentUuid: z.string(),
  agentName: z.string(),
  mode: z.enum(['hover', 'lock']),
  lastActionStatus: z.string().optional(),
  lastActionTimestamp: z.number().optional(),
  matchState: z.enum(['IDLE', 'PREGAME_HOVERED', 'PREGAME_LOCKED', 'IN_GAME']).optional()
});

export type AutoPickSettings = z.infer<typeof AutoPickSettingsSchema>;

export const AgentActionInputSchema = z.object({
  agentUuid: z.string().min(1)
});

export type AgentActionInput = z.infer<typeof AgentActionInputSchema>;
