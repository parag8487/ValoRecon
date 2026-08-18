"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestsDataSchema = exports.BattlepassDataSchema = exports.LoadoutDataSchema = exports.WalletDataSchema = exports.StoreDataSchema = exports.LiveMatchDataSchema = exports.LiveMatchPlayerSchema = exports.MatchDetailSchema = exports.MatchEconomySchema = exports.MatchRoundSchema = exports.MatchTeamSchema = exports.MatchTeamPlayerSchema = exports.MatchPlayerSummarySchema = exports.MatchSummarySchema = exports.CareerDataSchema = exports.CareerMapWinRateSchema = exports.CareerTopAgentSchema = exports.CareerStatsSchema = exports.CareerRankSchema = exports.CareerPlayerSchema = void 0;
const zod_1 = require("zod");
exports.CareerPlayerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    tag: zod_1.z.string(),
    title: zod_1.z.string(),
    accountLevel: zod_1.z.number(),
    cardUrl: zod_1.z.string(),
    smallCardUrl: zod_1.z.string(),
    avatarUrl: zod_1.z.string()
});
exports.CareerRankSchema = zod_1.z.object({
    tier: zod_1.z.number(),
    tierName: zod_1.z.string(),
    tierDivision: zod_1.z.number(),
    rr: zod_1.z.number(),
    maxRr: zod_1.z.number(),
    peakTier: zod_1.z.number(),
    peakTierName: zod_1.z.string(),
    tierIcon: zod_1.z.string(),
    leaderboardRank: zod_1.z.number()
});
exports.CareerStatsSchema = zod_1.z.object({
    winRate: zod_1.z.number(),
    wins: zod_1.z.number(),
    losses: zod_1.z.number(),
    totalMatches: zod_1.z.number(),
    kd: zod_1.z.number(),
    kills: zod_1.z.number(),
    deaths: zod_1.z.number(),
    assists: zod_1.z.number(),
    headshotPct: zod_1.z.number(),
    bodyPct: zod_1.z.number(),
    legPct: zod_1.z.number(),
    damagePerRound: zod_1.z.number(),
    combatScore: zod_1.z.number(),
    clutchSuccessPct: zod_1.z.number(),
    firstBloodsPerMatch: zod_1.z.number(),
    aces: zod_1.z.number(),
    flawlessRounds: zod_1.z.number()
});
exports.CareerTopAgentSchema = zod_1.z.object({
    agentName: zod_1.z.string(),
    role: zod_1.z.string(),
    matches: zod_1.z.number(),
    winRate: zod_1.z.number(),
    kd: zod_1.z.number(),
    adr: zod_1.z.number(),
    iconUrl: zod_1.z.string(),
    portraitUrl: zod_1.z.string()
});
exports.CareerMapWinRateSchema = zod_1.z.object({
    mapName: zod_1.z.string(),
    matches: zod_1.z.number(),
    winRate: zod_1.z.number(),
    kd: zod_1.z.number()
});
exports.CareerDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    player: exports.CareerPlayerSchema,
    rank: exports.CareerRankSchema,
    stats: exports.CareerStatsSchema,
    recentForm: zod_1.z.array(zod_1.z.enum(['W', 'L'])),
    topAgents: zod_1.z.array(exports.CareerTopAgentSchema),
    mapWinRates: zod_1.z.array(exports.CareerMapWinRateSchema)
});
exports.MatchSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.enum(['live', 'mock']).optional(),
    mapName: zod_1.z.string(),
    mapImageUrl: zod_1.z.string(),
    gameMode: zod_1.z.string(),
    matchDate: zod_1.z.string(),
    gameLengthSeconds: zod_1.z.number(),
    result: zod_1.z.enum(['VICTORY', 'DEFEAT', 'DRAW']),
    score: zod_1.z.string(),
    playerTeamScore: zod_1.z.number(),
    enemyTeamScore: zod_1.z.number(),
    agentName: zod_1.z.string(),
    agentIconUrl: zod_1.z.string(),
    role: zod_1.z.string(),
    kills: zod_1.z.number(),
    deaths: zod_1.z.number(),
    assists: zod_1.z.number(),
    kd: zod_1.z.number(),
    combatScore: zod_1.z.number(),
    headshotPct: zod_1.z.number(),
    damagePerRound: zod_1.z.number(),
    firstBloods: zod_1.z.number(),
    rrChange: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    tierName: zod_1.z.string(),
    tierIcon: zod_1.z.string(),
    mvp: zod_1.z.string().nullable()
});
exports.MatchPlayerSummarySchema = zod_1.z.object({
    name: zod_1.z.string(),
    tag: zod_1.z.string(),
    agentName: zod_1.z.string(),
    role: zod_1.z.string(),
    agentIcon: zod_1.z.string(),
    kills: zod_1.z.number(),
    deaths: zod_1.z.number(),
    assists: zod_1.z.number(),
    kd: zod_1.z.number(),
    combatScore: zod_1.z.number(),
    headshotPct: zod_1.z.number(),
    damagePerRound: zod_1.z.number(),
    firstBloods: zod_1.z.number(),
    plants: zod_1.z.number(),
    defuses: zod_1.z.number(),
    rrChange: zod_1.z.union([zod_1.z.number(), zod_1.z.string()])
});
exports.MatchTeamPlayerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    tag: zod_1.z.string(),
    isPlayer: zod_1.z.boolean(),
    agent: zod_1.z.string(),
    agentIcon: zod_1.z.string(),
    rank: zod_1.z.string(),
    kills: zod_1.z.number(),
    deaths: zod_1.z.number(),
    assists: zod_1.z.number(),
    score: zod_1.z.number(),
    adr: zod_1.z.number(),
    hsPct: zod_1.z.number(),
    firstBloods: zod_1.z.number(),
    plants: zod_1.z.number(),
    defuses: zod_1.z.number(),
    econRating: zod_1.z.number()
});
exports.MatchTeamSchema = zod_1.z.object({
    name: zod_1.z.string(),
    score: zod_1.z.number(),
    won: zod_1.z.boolean(),
    players: zod_1.z.array(exports.MatchTeamPlayerSchema)
});
exports.MatchRoundSchema = zod_1.z.object({
    round: zod_1.z.number(),
    winningTeam: zod_1.z.string(),
    winType: zod_1.z.string(),
    blueScore: zod_1.z.number(),
    redScore: zod_1.z.number(),
    buyTypeBlue: zod_1.z.string(),
    buyTypeRed: zod_1.z.string(),
    playerKills: zod_1.z.number()
});
exports.MatchEconomySchema = zod_1.z.object({
    avgSpentPerRoundBlue: zod_1.z.number(),
    avgSpentPerRoundRed: zod_1.z.number(),
    blueRoundsFullBuy: zod_1.z.number(),
    blueRoundsEco: zod_1.z.number(),
    blueRoundsSemi: zod_1.z.number(),
    redRoundsFullBuy: zod_1.z.number(),
    redRoundsEco: zod_1.z.number(),
    redRoundsSemi: zod_1.z.number()
});
exports.MatchDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.enum(['live', 'mock']).optional(),
    mapName: zod_1.z.string(),
    mapImageUrl: zod_1.z.string(),
    gameMode: zod_1.z.string(),
    matchDate: zod_1.z.string(),
    duration: zod_1.z.string(),
    result: zod_1.z.enum(['VICTORY', 'DEFEAT', 'DRAW']),
    score: zod_1.z.string(),
    playerTeamScore: zod_1.z.number(),
    enemyTeamScore: zod_1.z.number(),
    halfTimeScore: zod_1.z.string(),
    mvp: zod_1.z.string(),
    server: zod_1.z.string(),
    playerSummary: exports.MatchPlayerSummarySchema,
    teams: zod_1.z.object({
        allies: exports.MatchTeamSchema,
        enemies: exports.MatchTeamSchema
    }),
    rounds: zod_1.z.array(exports.MatchRoundSchema),
    economy: exports.MatchEconomySchema
});
exports.LiveMatchPlayerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    tag: zod_1.z.string(),
    isPlayer: zod_1.z.boolean(),
    agent: zod_1.z.string(),
    agentIcon: zod_1.z.string(),
    role: zod_1.z.string(),
    rank: zod_1.z.string(),
    rankIcon: zod_1.z.string(),
    kills: zod_1.z.number(),
    deaths: zod_1.z.number(),
    assists: zod_1.z.number(),
    score: zod_1.z.number(),
    ping: zod_1.z.number(),
    ultReady: zod_1.z.boolean(),
    ultPoints: zod_1.z.string(),
    credits: zod_1.z.number(),
    loadout: zod_1.z.string()
});
exports.LiveMatchDataSchema = zod_1.z.object({
    matchId: zod_1.z.string(),
    source: zod_1.z.enum(['live', 'mock']).optional(),
    inGame: zod_1.z.boolean().optional(),
    status: zod_1.z.string(),
    map: zod_1.z.string(),
    mapImageUrl: zod_1.z.string(),
    mode: zod_1.z.string(),
    server: zod_1.z.string(),
    gameDuration: zod_1.z.string(),
    currentScore: zod_1.z.string(),
    currentRound: zod_1.z.number(),
    mySide: zod_1.z.string(),
    allies: zod_1.z.array(exports.LiveMatchPlayerSchema),
    enemies: zod_1.z.array(exports.LiveMatchPlayerSchema),
    liveInsights: zod_1.z.array(zod_1.z.string())
});
exports.StoreDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    featuredBundle: zod_1.z.object({
        bundleUuid: zod_1.z.string(),
        displayName: zod_1.z.string(),
        displayIcon: zod_1.z.string(),
        verticalPromoImage: zod_1.z.string(),
        description: zod_1.z.string(),
        priceVP: zod_1.z.number(),
        originalPriceVP: zod_1.z.number(),
        discountPct: zod_1.z.number(),
        durationRemainingSeconds: zod_1.z.number(),
        items: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            weapon: zod_1.z.string(),
            priceVP: zod_1.z.number(),
            icon: zod_1.z.string()
        }))
    }),
    dailyOffers: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        weapon: zod_1.z.string(),
        priceVP: zod_1.z.number(),
        tier: zod_1.z.string(),
        tierColor: zod_1.z.string(),
        icon: zod_1.z.string()
    })),
    nightMarket: zod_1.z.object({
        isActive: zod_1.z.boolean(),
        durationRemainingSeconds: zod_1.z.number(),
        offers: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            weapon: zod_1.z.string(),
            originalPriceVP: zod_1.z.number(),
            discountPriceVP: zod_1.z.number(),
            discountPct: zod_1.z.number(),
            tier: zod_1.z.string(),
            isRevealed: zod_1.z.boolean(),
            icon: zod_1.z.string()
        }))
    }).optional(),
    resetTimeRemainingSeconds: zod_1.z.number()
});
exports.WalletDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    vp: zod_1.z.number(),
    rp: zod_1.z.number(),
    kc: zod_1.z.number()
});
exports.LoadoutDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    weapons: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        skinName: zod_1.z.string(),
        chromaName: zod_1.z.string(),
        icon: zod_1.z.string(),
        buddy: zod_1.z.string().nullable()
    })),
    identity: zod_1.z.object({
        playerCard: zod_1.z.string(),
        cardWide: zod_1.z.string(),
        playerTitle: zod_1.z.string(),
        spray: zod_1.z.string(),
        levelBorder: zod_1.z.string(),
        accountLevel: zod_1.z.number().optional()
    })
});
exports.BattlepassDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    actName: zod_1.z.string().optional(),
    currentTier: zod_1.z.number(),
    maxTier: zod_1.z.number().optional(),
    epilogueTiers: zod_1.z.number().optional(),
    currentTierProgressXP: zod_1.z.number().optional(),
    tierRequiredXP: zod_1.z.number().optional(),
    totalXPAccumulated: zod_1.z.number(),
    isPremium: zod_1.z.boolean().optional(),
    daysRemaining: zod_1.z.number().nullable().optional(),
    seasonProgressPct: zod_1.z.number().optional(),
    featuredRewards: zod_1.z.array(zod_1.z.object({
        tier: zod_1.z.number(),
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        icon: zod_1.z.string(),
        isFree: zod_1.z.boolean()
    })).optional(),
    tiers: zod_1.z.array(zod_1.z.object({
        tier: zod_1.z.number(),
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        isFree: zod_1.z.boolean(),
        claimed: zod_1.z.boolean(),
        icon: zod_1.z.string()
    })).optional(),
    leaderboard: zod_1.z.array(zod_1.z.object({
        rank: zod_1.z.number(),
        name: zod_1.z.string(),
        tier: zod_1.z.number(),
        xp: zod_1.z.number(),
        level: zod_1.z.number(),
        isCurrentPlayer: zod_1.z.boolean().optional()
    })).optional()
});
exports.QuestsDataSchema = zod_1.z.object({
    source: zod_1.z.enum(['live', 'mock']).optional(),
    dailies: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        progress: zod_1.z.number(),
        maxProgress: zod_1.z.number(),
        xpReward: zod_1.z.number(),
        apReward: zod_1.z.number(),
        completed: zod_1.z.boolean(),
        expiresInSeconds: zod_1.z.number()
    })),
    weeklies: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        progress: zod_1.z.number(),
        maxProgress: zod_1.z.number(),
        xpReward: zod_1.z.number(),
        completed: zod_1.z.boolean(),
        expiresInSeconds: zod_1.z.number()
    }))
});
