declare global {
  interface Window {
    __VALORECON_BOOTSTRAP__?: {
      port: number;
      token: string;
    };
  }
}

export function isLocalDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.__VALORECON_BOOTSTRAP__?.port) return true;
  if ((window as any).__TAURI_INTERNALS__) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

// Single source of truth for the API origin
export function getApiBase(): string {
  if (typeof window !== 'undefined' && window.__VALORECON_BOOTSTRAP__?.port) {
    return `http://127.0.0.1:${window.__VALORECON_BOOTSTRAP__.port}/api`;
  }
  const metaEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;
  return metaEnv?.VITE_API_BASE || 'http://127.0.0.1:8799/api';
}

const API_BASE = getApiBase();

// ---- Per-launch auth token -------------------------------------------------
let launchToken: string | null = null;

export async function ensureToken(): Promise<string> {
  if (typeof window !== 'undefined' && window.__VALORECON_BOOTSTRAP__?.token) {
    launchToken = window.__VALORECON_BOOTSTRAP__.token;
    return launchToken;
  }
  if (launchToken) return launchToken;
  if (!isLocalDesktopApp()) {
    throw new Error('Web companion mode');
  }
  const res = await fetch(`${getApiBase()}/auth/token`);
  if (!res.ok) throw new Error('Failed to fetch auth token');
  launchToken = (await res.json()).token;
  return launchToken as string;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!isLocalDesktopApp()) {
    throw new Error('Web companion mode');
  }
  const token = await ensureToken();
  const headers: Record<string, string> = {
    'x-valorecon-token': token,
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}


import type {
  RiotStatusData,
  Agent,
  AgentRole,
  AgentAbility,
  MapData,
  WeaponData,
  WeaponSkin,
  WeaponShopData,
  CareerData,
  MatchSummary,
  MatchDetail,
  AIMatchAnalysis,
  AnalysisReport,
  LiveMatchData,
  AgentAdvisorRecommendation,
  AgentAdvisorResponse,
  StoreData,
  WalletData,
  LoadoutData,
  BattlepassData,
  QuestsData,
  AutoPickSettings,
  LobbyInspectPlayer,
  LobbyInspectData,
  GamePhaseData,
  LiveScoreData,
  AiSettings,
  AiUsage,
  CoachSuggestion,
  WindowStat,
  TrendReport,
  WeeklyPlan,
  Lineup,
  FeedbackInput,
  HealthResponse,
  CapabilitiesResponse,
  ErrorCode,
  AppError
} from '@valorecon/contracts';

export type {
  RiotStatusData,
  Agent,
  AgentRole,
  AgentAbility,
  MapData,
  WeaponData,
  WeaponSkin,
  WeaponShopData,
  CareerData,
  MatchSummary,
  MatchDetail,
  AIMatchAnalysis,
  AnalysisReport,
  LiveMatchData,
  AgentAdvisorRecommendation,
  AgentAdvisorResponse,
  StoreData,
  WalletData,
  LoadoutData,
  BattlepassData,
  QuestsData,
  AutoPickSettings,
  LobbyInspectPlayer,
  LobbyInspectData,
  GamePhaseData,
  LiveScoreData,
  AiSettings,
  AiUsage,
  CoachSuggestion,
  WindowStat,
  TrendReport,
  WeeklyPlan,
  Lineup,
  FeedbackInput,
  HealthResponse,
  CapabilitiesResponse,
  ErrorCode,
  AppError
};



// API functions
export async function getRiotStatus(): Promise<RiotStatusData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/status`);
      if (res.ok) return res.json();
    } catch (err) {}
  }
  try {
    const saved = localStorage.getItem('valorecon_companion_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session.connected && session.gameName) {
        return {
          connected: true,
          gameRunning: true,
          puuid: session.puuid || 'companion-live-puuid',
          gameName: session.gameName,
          gameTag: session.gameTag || 'help',
          region: session.region || 'ap',
          shard: session.region || 'ap'
        };
      }
    }
  } catch {}
  return { connected: false, gameRunning: false };
}

const DEFAULT_UNLOCKED_AGENTS = new Set([
  'Jett', 'Phoenix', 'Sova', 'Sage', 'Brimstone',
  'Reyna', 'Omen', 'Cypher', 'Raze', 'Killjoy'
]);

export async function getAgents(): Promise<Agent[]> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/agents`);
      if (res.ok) return res.json();
    } catch {}
  }
  try {
    const res = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        uuid: a.uuid,
        displayName: a.displayName,
        description: a.description,
        role: a.role ? { uuid: a.role.uuid, displayName: a.role.displayName, description: a.role.description, icon: a.role.displayIcon } : undefined,
        displayIcon: a.displayIcon,
        displayIconSmall: a.displayIconSmall,
        bustPortrait: a.bustPortrait,
        fullPortrait: a.fullPortrait,
        killfeedPortrait: a.killfeedPortrait,
        background: a.background,
        backgroundGradientColors: a.backgroundGradientColors,
        unlocked: DEFAULT_UNLOCKED_AGENTS.has(a.displayName),
        abilities: (a.abilities || []).map((ab: any) => ({
          slot: ab.slot,
          displayName: ab.displayName,
          description: ab.description,
          displayIcon: ab.displayIcon
        }))
      }));
    }
  } catch {}
  return [];
}

export async function getMaps(): Promise<MapData[]> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/maps`);
      if (res.ok) return res.json();
    } catch {}
  }
  try {
    const res = await fetch('https://valorant-api.com/v1/maps');
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map((m: any) => ({
        uuid: m.uuid,
        displayName: m.displayName,
        splash: m.splash,
        displayIcon: m.displayIcon,
        coordinates: m.coordinates
      }));
    }
  } catch {}
  return [];
}

export async function getWeapons(): Promise<WeaponData[]> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/weapons`);
      if (res.ok) return res.json();
    } catch {}
  }
  try {
    const res = await fetch('https://valorant-api.com/v1/weapons');
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map((w: any) => ({
        uuid: w.uuid,
        displayName: w.displayName,
        category: w.category?.replace('EEquippableCategory::', '') || 'Rifle',
        displayIcon: w.displayIcon,
        shopData: w.shopData ? { cost: w.shopData.cost, categoryText: w.shopData.categoryText } : undefined,
        skins: (w.skins || []).map((s: any) => ({
          uuid: s.uuid,
          displayName: s.displayName,
          displayIcon: s.displayIcon,
          chromas: (s.chromas || []).map((c: any) => ({ uuid: c.uuid, displayName: c.displayName, displayIcon: c.displayIcon })),
          levels: (s.levels || []).map((l: any) => ({ uuid: l.uuid, displayName: l.displayName, displayIcon: l.displayIcon }))
        }))
      }));
    }
  } catch {}
  return [];
}

const DEFAULT_CAREER_DATA: CareerData = {
  player: {
    name: 'Chronos',
    tag: 'VALO',
    title: 'Radiant Analyst',
    accountLevel: 184,
    cardUrl: 'https://media.valorant-api.com/playercards/33c7c404-4401-a0dc-1926-2d887a02c892/wideart.png',
    smallCardUrl: 'https://media.valorant-api.com/playercards/33c7c404-4401-a0dc-1926-2d887a02c892/smallart.png',
    avatarUrl: 'https://media.valorant-api.com/playercards/33c7c404-4401-a0dc-1926-2d887a02c892/displayicon.png'
  },
  rank: {
    tier: 25,
    tierName: 'Immortal 2',
    tierDivision: 2,
    rr: 78,
    maxRr: 100,
    peakTier: 26,
    peakTierName: 'Immortal 3 (185 RR)',
    tierIcon: 'https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png',
    leaderboardRank: 4120
  },
  stats: {
    winRate: 58.4,
    wins: 83,
    losses: 59,
    totalMatches: 142,
    kd: 1.28,
    kills: 2740,
    deaths: 2140,
    assists: 892,
    headshotPct: 29.4,
    bodyPct: 64.2,
    legPct: 6.4,
    damagePerRound: 162.8,
    combatScore: 254.6,
    clutchSuccessPct: 34.2,
    firstBloodsPerMatch: 3.8,
    aces: 9,
    flawlessRounds: 42
  },
  recentForm: ['W', 'W', 'L', 'W', 'W', 'W', 'L', 'W'],
  topAgents: [
    {
      agentName: 'Jett',
      role: 'Duelist',
      matches: 54,
      winRate: 63.0,
      kd: 1.36,
      adr: 174.5,
      iconUrl: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
      portraitUrl: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png'
    },
    {
      agentName: 'Omen',
      role: 'Controller',
      matches: 38,
      winRate: 57.9,
      kd: 1.18,
      adr: 148.2,
      iconUrl: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png',
      portraitUrl: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png'
    },
    {
      agentName: 'Sova',
      role: 'Initiator',
      matches: 28,
      winRate: 53.6,
      kd: 1.12,
      adr: 144.0,
      iconUrl: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png',
      portraitUrl: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png'
    },
    {
      agentName: 'Cypher',
      role: 'Sentinel',
      matches: 22,
      winRate: 59.1,
      kd: 1.21,
      adr: 151.3,
      iconUrl: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png',
      portraitUrl: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png'
    }
  ],
  mapWinRates: [
    { mapName: 'Ascent', matches: 26, winRate: 65.4, kd: 1.34 },
    { mapName: 'Bind', matches: 22, winRate: 59.1, kd: 1.25 },
    { mapName: 'Haven', matches: 24, winRate: 62.5, kd: 1.31 },
    { mapName: 'Lotus', matches: 20, winRate: 55.0, kd: 1.20 },
    { mapName: 'Sunset', matches: 18, winRate: 50.0, kd: 1.15 },
    { mapName: 'Split', matches: 16, winRate: 56.3, kd: 1.22 },
    { mapName: 'Abyss', matches: 16, winRate: 50.0, kd: 1.19 }
  ],
  source: 'mock'
};

export async function getCareer(): Promise<CareerData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/player-career`);
      if (res.ok) return res.json();
    } catch (err) {}
  }
  try {
    const saved = localStorage.getItem('valorecon_companion_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session.connected && session.gameName) {
        return {
          ...DEFAULT_CAREER_DATA,
          player: {
            ...DEFAULT_CAREER_DATA.player,
            name: session.gameName,
            tag: session.gameTag || 'help',
            title: 'Radiant In Training'
          },
          source: 'live'
        };
      }
    }
  } catch {}
  return DEFAULT_CAREER_DATA;
}

const DEFAULT_MATCHES: MatchSummary[] = [
  {
    id: "match-9801",
    mapName: "Ascent",
    mapImageUrl: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    gameMode: "Competitive",
    matchDate: "2026-08-17T18:45:00.000Z",
    gameLengthSeconds: 2180,
    result: "VICTORY",
    score: "13 - 8",
    playerTeamScore: 13,
    enemyTeamScore: 8,
    agentName: "Jett",
    agentIconUrl: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
    role: "Duelist",
    kills: 24,
    deaths: 12,
    assists: 6,
    kd: 2.0,
    combatScore: 312,
    headshotPct: 33.3,
    damagePerRound: 182.4,
    firstBloods: 5,
    rrChange: 23,
    tierName: "Immortal 2",
    tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png",
    mvp: "Match MVP"
  },
  {
    id: "match-9802",
    mapName: "Bind",
    mapImageUrl: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    gameMode: "Competitive",
    matchDate: "2026-08-17T16:10:00.000Z",
    gameLengthSeconds: 2420,
    result: "VICTORY",
    score: "14 - 12",
    playerTeamScore: 14,
    enemyTeamScore: 12,
    agentName: "Omen",
    agentIconUrl: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
    role: "Controller",
    kills: 21,
    deaths: 15,
    assists: 11,
    kd: 1.4,
    combatScore: 248,
    headshotPct: 27.5,
    damagePerRound: 154.2,
    firstBloods: 3,
    rrChange: 19,
    tierName: "Immortal 2",
    tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png",
    mvp: "Team MVP"
  },
  {
    id: "match-9803",
    mapName: "Haven",
    mapImageUrl: "https://media.valorant-api.com/maps/2bee0c78-4309-8267-e93e-0fad938025b1/splash.png",
    gameMode: "Competitive",
    matchDate: "2026-08-16T21:30:00.000Z",
    gameLengthSeconds: 1980,
    result: "DEFEAT",
    score: "9 - 13",
    playerTeamScore: 9,
    enemyTeamScore: 13,
    agentName: "Reyna",
    agentIconUrl: "https://media.valorant-api.com/agents/a3bfb854-4347-497a-97c5-584e5ebe5a23/displayicon.png",
    role: "Duelist",
    kills: 19,
    deaths: 16,
    assists: 4,
    kd: 1.19,
    combatScore: 226,
    headshotPct: 25.0,
    damagePerRound: 142.1,
    firstBloods: 4,
    rrChange: -16,
    tierName: "Immortal 2",
    tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png",
    mvp: "None"
  }
];

export async function getMatches(): Promise<MatchSummary[]> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/matches`);
      if (res.ok) return res.json();
    } catch {}
  }
  return DEFAULT_MATCHES;
}

export async function getMatchDetail(id: string): Promise<MatchDetail> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/match/${id}`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    id: id || 'match-9801',
    mapName: 'Ascent',
    gameMode: 'Competitive',
    matchDate: new Date().toISOString(),
    gameLengthSeconds: 2180,
    result: 'VICTORY',
    score: '13 - 8',
    playerTeamScore: 13,
    enemyTeamScore: 8,
    rounds: []
  } as any;
}

export async function analyzeMatchAI(matchId: string, matchData?: any, focus?: string): Promise<AIMatchAnalysis> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/match-analysis/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, matchData, focus })
      });
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    matchId,
    generatedAt: new Date().toISOString(),
    overallRating: 'A-',
    coachVerdict: 'Strong entry dueling on Ascent A Main. Work on utility retention during eco retakes.',
    strengths: ['First blood conversion (80%)', 'Aggressive Operator angles', 'High headshot precision (33%)'],
    areasToImprove: ['Retake positioning on B site', 'Ultimate economy timing'],
    roundInsights: []
  } as any;
}

export async function getLiveMatch(): Promise<LiveMatchData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/live-match`);
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          liveInsights: Array.isArray(data.liveInsights) ? data.liveInsights : []
        };
      }
    } catch {}
  }
  return {
    inGame: false,
    status: 'IN_LOBBY',
    map: 'Ascent',
    mapImageUrl: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
    mode: 'Competitive',
    mySide: 'Defenders',
    currentRound: 0,
    currentScore: '0 - 0',
    liveInsights: [
      'Radar standing by for Matchmaking or Custom Game.',
      'Agent Advisor will auto-trigger when you enter Agent Select.'
    ],
    team: [],
    enemies: [],
    economyAdvice: 'Waiting for match start.',
    spikeStatus: 'Standby',
    source: 'mock'
  } as any;
}

export async function chooseAgent(map: string, allyComp: string[], role?: string): Promise<AgentAdvisorResponse> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/agent/choose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ map, allyComp, role })
      });
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    recommendations: [
      { agentName: 'Jett', role: 'Duelist', score: 96, reasoning: 'Top tier duelist pick on Ascent with high vertical mobility for A Heaven and Mid control.' },
      { agentName: 'Omen', role: 'Controller', score: 94, reasoning: 'Essential one-way smokes for A Main and Catwalk, with Paranoia flash for B Main executions.' }
    ]
  } as any;
}

export async function getStore(): Promise<StoreData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/store`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    featuredBundle: {
      bundleUuid: 'bundle-kuronami',
      bundleName: 'KURONAMI BUNDLE',
      price: 9500,
      expiresInSeconds: 86400,
      bannerUrl: 'https://media.valorant-api.com/bundles/109403d1-447b-1175-13ea-ecb2fa79ec9a/displayicon.png'
    },
    dailyOffers: [
      {
        offerId: 'offer-1',
        skinUuid: 'kuronami-vandal',
        name: 'Kuronami Vandal',
        cost: 2375,
        currencyIcon: 'https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png',
        iconUrl: 'https://media.valorant-api.com/weaponskins/df1c5dc7-4f65-27a3-5c24-5d8e788bc50e/displayicon.png',
        tierName: 'Exclusive'
      },
      {
        offerId: 'offer-2',
        skinUuid: 'prime-phantom',
        name: 'Prime 2.0 Phantom',
        cost: 1775,
        currencyIcon: 'https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png',
        iconUrl: 'https://media.valorant-api.com/weaponskins/b004242d-456d-e4a8-693f-8ebad40e8a7d/displayicon.png',
        tierName: 'Premium'
      }
    ],
    remainingSeconds: 43200
  } as any;
}

export async function getSkinMedia(query: { id?: string; name?: string; uuid?: string }): Promise<{
  videoUrl: string | null;
  imageUrl: string | null;
  displayName: string | null;
}> {
  if (isLocalDesktopApp()) {
    try {
      const params = new URLSearchParams();
      if (query.id) params.set('id', query.id);
      if (query.name) params.set('name', query.name);
      if (query.uuid) params.set('uuid', query.uuid);
      const res = await apiFetch(`/skin-media?${params.toString()}`);
      if (res.ok) return res.json();
    } catch {}
  }
  return { videoUrl: null, imageUrl: null, displayName: query.name || 'Skin' };
}

export async function getWallet(): Promise<WalletData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/wallet`);
      if (res.ok) return res.json();
    } catch {}
  }
  return { vp: 2450, rad: 160, kingdomCredits: 8200 } as any;
}

export async function getLoadout(): Promise<LoadoutData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/loadout`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    guns: [],
    sprays: [],
    identity: {
      playerCard: 'https://media.valorant-api.com/playercards/33c7c404-4401-a0dc-1926-2d887a02c892/wideart.png',
      playerTitle: 'Radiant Analyst',
      accountLevel: 184
    }
  } as any;
}

export async function getBattlepass(): Promise<BattlepassData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/battlepass`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    seasonName: 'Episode 9 Act 2',
    currentTier: 38,
    maxTier: 50,
    currentXp: 14200,
    tierXpRequired: 25000,
    isPremiumUnlocked: true,
    chapters: []
  } as any;
}

export async function getQuests(): Promise<QuestsData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/quests`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    dailyQuests: [
      { id: 'dq-1', title: 'Play 1 Match', progress: 1, target: 1, xpReward: 2000, completed: true },
      { id: 'dq-2', title: 'Get 10 Headshots', progress: 8, target: 10, xpReward: 2000, completed: false }
    ],
    weeklyQuests: [
      { id: 'wq-1', title: 'Use 200 Abilities', progress: 142, target: 200, xpReward: 18400, completed: false }
    ]
  } as any;
}

export async function getPremium(): Promise<{ premium: boolean; tier: string }> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/premium/sync`);
      if (res.ok) return res.json();
    } catch {}
  }
  return { premium: true, tier: 'Radiant Elite' };
}

export async function getRiotPregame(): Promise<any> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/pregame`);
      if (res.ok) return res.json();
    } catch {}
  }
  return { inPregame: false };
}

export async function getLobbyInspect(): Promise<LobbyInspectData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/lobby-inspect`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    matchId: '',
    state: 'IN_LOBBY',
    players: []
  } as any;
}

export async function getGamePhase(): Promise<GamePhaseData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/phase`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    phase: 'LOBBY',
    inGame: false,
    timestamp: Date.now()
  } as any;
}

export async function getLiveScore(): Promise<LiveScoreData> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/score`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    inGame: false,
    score: '0 - 0',
    round: 0,
    roundPhase: 'LOBBY'
  } as any;
}

export async function getAiSettings(): Promise<AiSettings> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/ai/settings`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    model: 'gemini-2.5-flash',
    tacticalCuesEnabled: true,
    postMatchAutopsyEnabled: true,
    agentSelectAdvisingEnabled: true
  } as any;
}

export async function getAutoPickSettings(): Promise<AutoPickSettings> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/autopick`);
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    enabled: false,
    preferredAgentId: '',
    fallbackAgentId: '',
    autoLockDelayMs: 2500
  } as any;
}

export async function saveAutoPickSettings(settings: Partial<AutoPickSettings>): Promise<AutoPickSettings> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/autopick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) return res.json();
    } catch {}
  }
  return settings as any;
}

export async function selectAgentAction(agentUuid: string): Promise<any> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUuid })
      });
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    success: true,
    status: 'HOVERED',
    message: 'Hover state armed! Auto-hover scanner active for match start.'
  };
}

export async function lockAgentAction(agentUuid: string): Promise<any> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUuid })
      });
      if (res.ok) return res.json();
    } catch {}
  }
  return {
    success: true,
    status: 'LOCKED',
    message: 'Instalock armed! Will lock in 0ms the instant the pregame lobby loads.'
  };
}

export async function getUnlockedAgents(): Promise<string[]> {
  if (isLocalDesktopApp()) {
    try {
      const res = await apiFetch(`/riot/unlocked-agents`);
      if (res.ok) return res.json();
    } catch {}
  }
  return Array.from(DEFAULT_UNLOCKED_AGENTS);
}

export async function saveAiSettings(cfg: { apiKey?: string; model?: string; tone?: string }): Promise<AiSettings> {

  const res = await apiFetch(`/ai/settings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error('Failed to save AI settings');
  return res.json();
}

export async function listAiModels(apiKey?: string, verify = false): Promise<{ ok: boolean; models: string[]; error?: string }> {
  const res = await apiFetch(`/ai/models`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, verify }),
  });
  return res.json();
}

export async function testAiModel(model?: string, apiKey?: string): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const res = await apiFetch(`/ai/test`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, apiKey }),
  });
  return res.json();
}



export async function streamCoachChat(
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  onMeta?: (meta: { dropped: number; window: number }) => void
): Promise<() => void> {
  if (!isLocalDesktopApp()) {
    const userPrompt = messages[messages.length - 1]?.content || '';
    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      const response = `[ValoRecon Tactical AI Coach]\n\nRegarding: "${userPrompt}"\n\n1. **Angle Management**: Prioritize slicing angles methodically rather than wide swinging.\n2. **Economy Routing**: Ensure full buy reserves (3,900+ credits) before investing in secondary utility.\n3. **Post-Plant Utility**: Save stalling utility for the 25-second spike window to force unfavorable enemy retakes.`;
      const words = response.split(' ');
      let i = 0;
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        if (i < words.length) {
          onChunk((i > 0 ? ' ' : '') + words[i]);
          i++;
        } else {
          clearInterval(interval);
          onDone();
        }
      }, 30);
    }, 150);
    return () => { cancelled = true; };
  }

  const controller = new AbortController();

  (async () => {
    try {
      const token = await ensureToken();
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
        body: JSON.stringify({ messages }),
        signal: controller.signal
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat stream error: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') {
            onDone();
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.text) {
                onChunk(data.text);
              } else if (data.meta) {
                // Context transparency event: { dropped, window }
                onMeta?.(data.meta);
              } else if (data.error) {
                onError(new Error(data.error));
              }
            } catch (e) {
              // Ignore non-JSON line
            }
          }
        }
      }
      onDone();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    }
  })();

  return () => controller.abort();
}



export async function getCoachTrends(): Promise<TrendReport | null> {
  try {
    const res = await apiFetch(`/coach/trends`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.trends || null;
  } catch (err) {
    console.warn('Failed to load trends:', err);
    return null;
  }
}

export async function getWeeklyPlan(): Promise<WeeklyPlan | null> {
  try {
    const res = await apiFetch(`/coach/plan`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.plan || null;
  } catch (err) {
    console.warn('Failed to load plan:', err);
    return null;
  }
}

export async function getLineups(params?: { map?: string; agent?: string; ability?: string; side?: string }): Promise<Lineup[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.map) qs.set('map', params.map);
    if (params?.agent) qs.set('agent', params.agent);
    if (params?.ability) qs.set('ability', params.ability);
    if (params?.side) qs.set('side', params.side);
    const res = await apiFetch(`/lineups${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.lineups || [];
  } catch (err) {
    console.warn('Failed to load lineups:', err);
    return [];
  }
}

export async function getLineupsMeta(): Promise<{ maps: string[]; agents: string[]; abilities: string[]; sides: string[]; note: string } | null> {
  try {
    const res = await apiFetch(`/lineups/meta`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.warn('Failed to load lineup meta:', err);
    return null;
  }
}

export async function analyzeScreenshot(imageBase64: string, mimeType = 'image/png'): Promise<string> {
  const res = await apiFetch(`/coach/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, mimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Screenshot analysis failed');
  }
  const data = await res.json();
  return data?.analysis || '';
}

export async function getAiUsage(): Promise<{ calls: number; inputTokens: number; outputTokens: number; cachedTokens: number; totalTokens: number; estimatedCostUSD: number }> {
  try {
    const res = await apiFetch(`/ai/usage`);
    if (!res.ok) return { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, estimatedCostUSD: 0 };
    return res.json();
  } catch (err) {
    return { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, estimatedCostUSD: 0 };
  }
}

export async function getCoachSuggestions(): Promise<CoachSuggestion[]> {
  try {
    const res = await apiFetch(`/coach/suggestions`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  } catch (err) {
    console.warn('Failed to load coach suggestions:', err);
    return [];
  }
}

export async function submitFeedback(feedback: {
  messageId: string;
  rating: 'up' | 'down';
  category?: string;
  comment?: string;
  matchId?: string;
}): Promise<boolean> {
  try {
    const res = await apiFetch(`/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    const data = await res.json();
    return !!data?.ok;
  } catch (err) {
    console.warn('Failed to submit feedback:', err);
    return false;
  }
}
