import { z } from 'zod';

export const CareerPlayerSchema = z.object({
  name: z.string(),
  tag: z.string(),
  title: z.string(),
  accountLevel: z.number(),
  cardUrl: z.string(),
  smallCardUrl: z.string(),
  avatarUrl: z.string()
});

export const CareerRankSchema = z.object({
  tier: z.number(),
  tierName: z.string(),
  tierDivision: z.number(),
  rr: z.number(),
  maxRr: z.number(),
  peakTier: z.number(),
  peakTierName: z.string(),
  tierIcon: z.string(),
  leaderboardRank: z.number()
});

export const CareerStatsSchema = z.object({
  winRate: z.number(),
  wins: z.number(),
  losses: z.number(),
  totalMatches: z.number(),
  kd: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  headshotPct: z.number(),
  bodyPct: z.number(),
  legPct: z.number(),
  damagePerRound: z.number(),
  combatScore: z.number(),
  clutchSuccessPct: z.number(),
  firstBloodsPerMatch: z.number(),
  aces: z.number(),
  flawlessRounds: z.number()
});

export const CareerTopAgentSchema = z.object({
  agentName: z.string(),
  role: z.string(),
  matches: z.number(),
  winRate: z.number(),
  kd: z.number(),
  adr: z.number(),
  iconUrl: z.string(),
  portraitUrl: z.string()
});

export const CareerMapWinRateSchema = z.object({
  mapName: z.string(),
  matches: z.number(),
  winRate: z.number(),
  kd: z.number()
});

export const CareerDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  player: CareerPlayerSchema,
  rank: CareerRankSchema,
  stats: CareerStatsSchema,
  recentForm: z.array(z.enum(['W', 'L'])),
  topAgents: z.array(CareerTopAgentSchema),
  mapWinRates: z.array(CareerMapWinRateSchema)
});

export type CareerData = z.infer<typeof CareerDataSchema>;

export const MatchSummarySchema = z.object({
  id: z.string(),
  source: z.enum(['live', 'mock']).optional(),
  mapName: z.string(),
  mapImageUrl: z.string(),
  gameMode: z.string(),
  matchDate: z.string(),
  gameLengthSeconds: z.number(),
  result: z.enum(['VICTORY', 'DEFEAT', 'DRAW']),
  score: z.string(),
  playerTeamScore: z.number(),
  enemyTeamScore: z.number(),
  agentName: z.string(),
  agentIconUrl: z.string(),
  role: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  kd: z.number(),
  combatScore: z.number(),
  headshotPct: z.number(),
  damagePerRound: z.number(),
  firstBloods: z.number(),
  rrChange: z.union([z.number(), z.string()]),
  tierName: z.string(),
  tierIcon: z.string(),
  mvp: z.string().nullable()
});

export type MatchSummary = z.infer<typeof MatchSummarySchema>;

export const MatchPlayerSummarySchema = z.object({
  name: z.string(),
  tag: z.string(),
  agentName: z.string(),
  role: z.string(),
  agentIcon: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  kd: z.number(),
  combatScore: z.number(),
  headshotPct: z.number(),
  damagePerRound: z.number(),
  firstBloods: z.number(),
  plants: z.number(),
  defuses: z.number(),
  rrChange: z.union([z.number(), z.string()])
});

export const MatchTeamPlayerSchema = z.object({
  name: z.string(),
  tag: z.string(),
  isPlayer: z.boolean(),
  agent: z.string(),
  agentIcon: z.string(),
  rank: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  score: z.number(),
  adr: z.number(),
  hsPct: z.number(),
  firstBloods: z.number(),
  plants: z.number(),
  defuses: z.number(),
  econRating: z.number()
});

export const MatchTeamSchema = z.object({
  name: z.string(),
  score: z.number(),
  won: z.boolean(),
  players: z.array(MatchTeamPlayerSchema)
});

export const MatchRoundSchema = z.object({
  round: z.number(),
  winningTeam: z.string(),
  winType: z.string(),
  blueScore: z.number(),
  redScore: z.number(),
  buyTypeBlue: z.string(),
  buyTypeRed: z.string(),
  playerKills: z.number()
});

export const MatchEconomySchema = z.object({
  avgSpentPerRoundBlue: z.number(),
  avgSpentPerRoundRed: z.number(),
  blueRoundsFullBuy: z.number(),
  blueRoundsEco: z.number(),
  blueRoundsSemi: z.number(),
  redRoundsFullBuy: z.number(),
  redRoundsEco: z.number(),
  redRoundsSemi: z.number()
});

export const MatchDetailSchema = z.object({
  id: z.string(),
  source: z.enum(['live', 'mock']).optional(),
  mapName: z.string(),
  mapImageUrl: z.string(),
  gameMode: z.string(),
  matchDate: z.string(),
  duration: z.string(),
  result: z.enum(['VICTORY', 'DEFEAT', 'DRAW']),
  score: z.string(),
  playerTeamScore: z.number(),
  enemyTeamScore: z.number(),
  halfTimeScore: z.string(),
  mvp: z.string(),
  server: z.string(),
  playerSummary: MatchPlayerSummarySchema,
  teams: z.object({
    allies: MatchTeamSchema,
    enemies: MatchTeamSchema
  }),
  rounds: z.array(MatchRoundSchema),
  economy: MatchEconomySchema
});

export type MatchDetail = z.infer<typeof MatchDetailSchema>;

export const LiveMatchPlayerSchema = z.object({
  name: z.string(),
  tag: z.string(),
  isPlayer: z.boolean(),
  agent: z.string(),
  agentIcon: z.string(),
  role: z.string(),
  rank: z.string(),
  rankIcon: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  score: z.number(),
  ping: z.number(),
  ultReady: z.boolean(),
  ultPoints: z.string(),
  credits: z.number(),
  loadout: z.string()
});

export const LiveMatchDataSchema = z.object({
  matchId: z.string(),
  source: z.enum(['live', 'mock']).optional(),
  inGame: z.boolean().optional(),
  status: z.string(),
  map: z.string(),
  mapImageUrl: z.string(),
  mode: z.string(),
  server: z.string(),
  gameDuration: z.string(),
  currentScore: z.string(),
  currentRound: z.number(),
  mySide: z.string(),
  allies: z.array(LiveMatchPlayerSchema),
  enemies: z.array(LiveMatchPlayerSchema),
  liveInsights: z.array(z.string())
});

export type LiveMatchData = z.infer<typeof LiveMatchDataSchema>;

export const StoreDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  featuredBundle: z.object({
    bundleUuid: z.string(),
    displayName: z.string(),
    displayIcon: z.string(),
    verticalPromoImage: z.string(),
    description: z.string(),
    priceVP: z.number(),
    originalPriceVP: z.number(),
    discountPct: z.number(),
    durationRemainingSeconds: z.number(),
    items: z.array(z.object({
      name: z.string(),
      weapon: z.string(),
      priceVP: z.number(),
      icon: z.string()
    }))
  }),
  dailyOffers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    weapon: z.string(),
    priceVP: z.number(),
    tier: z.string(),
    tierColor: z.string(),
    icon: z.string()
  })),
  nightMarket: z.object({
    isActive: z.boolean(),
    durationRemainingSeconds: z.number(),
    offers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      weapon: z.string(),
      originalPriceVP: z.number(),
      discountPriceVP: z.number(),
      discountPct: z.number(),
      tier: z.string(),
      isRevealed: z.boolean(),
      icon: z.string()
    }))
  }).optional(),
  resetTimeRemainingSeconds: z.number()
});

export type StoreData = z.infer<typeof StoreDataSchema>;

export const WalletDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  vp: z.number(),
  rp: z.number(),
  kc: z.number()
});

export type WalletData = z.infer<typeof WalletDataSchema>;

export const LoadoutDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  weapons: z.record(z.string(), z.object({
    skinName: z.string(),
    chromaName: z.string(),
    icon: z.string(),
    buddy: z.string().nullable()
  })),
  identity: z.object({
    playerCard: z.string(),
    cardWide: z.string(),
    playerTitle: z.string(),
    spray: z.string(),
    levelBorder: z.string(),
    accountLevel: z.number().optional()
  })
});

export type LoadoutData = z.infer<typeof LoadoutDataSchema>;

export const BattlepassDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  actName: z.string().optional(),
  currentTier: z.number(),
  maxTier: z.number().optional(),
  epilogueTiers: z.number().optional(),
  currentTierProgressXP: z.number().optional(),
  tierRequiredXP: z.number().optional(),
  totalXPAccumulated: z.number(),
  isPremium: z.boolean().optional(),
  daysRemaining: z.number().nullable().optional(),
  seasonProgressPct: z.number().optional(),
  featuredRewards: z.array(z.object({
    tier: z.number(),
    name: z.string(),
    type: z.string(),
    icon: z.string(),
    isFree: z.boolean()
  })).optional(),
  tiers: z.array(z.object({
    tier: z.number(),
    name: z.string(),
    type: z.string(),
    isFree: z.boolean(),
    claimed: z.boolean(),
    icon: z.string()
  })).optional(),
  leaderboard: z.array(z.object({
    rank: z.number(),
    name: z.string(),
    tier: z.number(),
    xp: z.number(),
    level: z.number(),
    isCurrentPlayer: z.boolean().optional()
  })).optional()
});

export type BattlepassData = z.infer<typeof BattlepassDataSchema>;

export const QuestsDataSchema = z.object({
  source: z.enum(['live', 'mock']).optional(),
  dailies: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    progress: z.number(),
    maxProgress: z.number(),
    xpReward: z.number(),
    apReward: z.number(),
    completed: z.boolean(),
    expiresInSeconds: z.number()
  })),
  weeklies: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    progress: z.number(),
    maxProgress: z.number(),
    xpReward: z.number(),
    completed: z.boolean(),
    expiresInSeconds: z.number()
  }))
});

export type QuestsData = z.infer<typeof QuestsDataSchema>;
