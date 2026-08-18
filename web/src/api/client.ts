// Single source of truth for the API origin (override via VITE_API_BASE env).
const metaEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;
const API_BASE = metaEnv?.VITE_API_BASE || 'http://localhost:8799/api';

// ---- Per-launch auth token -------------------------------------------------
// The server generates a random token at boot and only the allowed dev origin
// can read it (CORS). We attach it to every request so arbitrary local pages
// can't drive the API (burning Gemini quota or reading Riot data).
let launchToken: string | null = null;

async function ensureToken(): Promise<string> {
  if (launchToken) return launchToken;
  const res = await fetch(`${API_BASE}/auth/token`);
  if (!res.ok) throw new Error('Failed to fetch auth token');
  launchToken = (await res.json()).token;
  return launchToken as string;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await ensureToken();
  const headers: Record<string, string> = {
    'x-valorecon-token': token,
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export interface RiotStatusData {
  connected: boolean;
  gameRunning: boolean;
  puuid?: string | null;
  gameName?: string | null;
  gameTag?: string | null;
  region?: string | null;
  shard?: string | null;
}

export interface Agent {
  uuid: string;
  displayName: string;
  description: string;
  developerName: string;
  characterTags: string[] | null;
  displayIcon: string;
  displayIconSmall: string;
  bustPortrait: string;
  fullPortrait: string;
  killfeedPortrait: string;
  background: string;
  backgroundGradientColors: string[];
  role: {
    uuid: string;
    displayName: 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
    description: string;
    displayIcon: string;
  } | null;
  isBaseContent?: boolean;
  unlocked?: boolean;
  abilities: Array<{
    slot: string;
    displayName: string;
    description: string;
    displayIcon: string;
  }>;
}

export interface MapData {
  uuid: string;
  displayName: string;
  narrativeDescription: string;
  splash: string;
  displayIcon: string;
  listViewIcon: string;
  coordinates: string;
}

export interface WeaponData {
  uuid: string;
  displayName: string;
  category: string;
  displayIcon: string;
  shopData: {
    cost: number;
    category: string;
    categoryText: string;
  } | null;
  skins: Array<{
    uuid: string;
    displayName: string;
    displayIcon: string;
  }>;
}

export interface CareerData {
  source?: 'live' | 'mock';
  player: {
    name: string;
    tag: string;
    title: string;
    accountLevel: number;
    cardUrl: string;
    smallCardUrl: string;
    avatarUrl: string;
  };
  rank: {
    tier: number;
    tierName: string;
    tierDivision: number;
    rr: number;
    maxRr: number;
    peakTier: number;
    peakTierName: string;
    tierIcon: string;
    leaderboardRank: number;
  };
  stats: {
    winRate: number;
    wins: number;
    losses: number;
    totalMatches: number;
    kd: number;
    kills: number;
    deaths: number;
    assists: number;
    headshotPct: number;
    bodyPct: number;
    legPct: number;
    damagePerRound: number;
    combatScore: number;
    clutchSuccessPct: number;
    firstBloodsPerMatch: number;
    aces: number;
    flawlessRounds: number;
  };
  recentForm: ('W' | 'L')[];
  topAgents: Array<{
    agentName: string;
    role: string;
    matches: number;
    winRate: number;
    kd: number;
    adr: number;
    iconUrl: string;
    portraitUrl: string;
  }>;
  mapWinRates: Array<{
    mapName: string;
    matches: number;
    winRate: number;
    kd: number;
  }>;
}

export interface MatchSummary {
  id: string;
  source?: 'live' | 'mock';
  mapName: string;
  mapImageUrl: string;
  gameMode: string;
  matchDate: string;
  gameLengthSeconds: number;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  score: string;
  playerTeamScore: number;
  enemyTeamScore: number;
  agentName: string;
  agentIconUrl: string;
  role: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  combatScore: number;
  headshotPct: number;
  damagePerRound: number;
  firstBloods: number;
  rrChange: number | string;
  tierName: string;
  tierIcon: string;
  mvp: string | null;
}

export interface MatchDetail {
  id: string;
  source?: 'live' | 'mock';
  mapName: string;
  mapImageUrl: string;
  gameMode: string;
  matchDate: string;
  duration: string;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  score: string;
  playerTeamScore: number;
  enemyTeamScore: number;
  halfTimeScore: string;
  mvp: string;
  server: string;
  playerSummary: {
    name: string;
    tag: string;
    agentName: string;
    role: string;
    agentIcon: string;
    kills: number;
    deaths: number;
    assists: number;
    kd: number;
    combatScore: number;
    headshotPct: number;
    damagePerRound: number;
    firstBloods: number;
    plants: number;
    defuses: number;
    rrChange: number | string;
  };
  teams: {
    allies: {
      name: string;
      score: number;
      won: boolean;
      players: Array<{
        name: string;
        tag: string;
        isPlayer: boolean;
        agent: string;
        agentIcon: string;
        rank: string;
        kills: number;
        deaths: number;
        assists: number;
        score: number;
        adr: number;
        hsPct: number;
        firstBloods: number;
        plants: number;
        defuses: number;
        econRating: number;
      }>;
    };
    enemies: {
      name: string;
      score: number;
      won: boolean;
      players: Array<{
        name: string;
        tag: string;
        isPlayer: boolean;
        agent: string;
        agentIcon: string;
        rank: string;
        kills: number;
        deaths: number;
        assists: number;
        score: number;
        adr: number;
        hsPct: number;
        firstBloods: number;
        plants: number;
        defuses: number;
        econRating: number;
      }>;
    };
  };
  rounds: Array<{
    round: number;
    winningTeam: string;
    winType: string;
    blueScore: number;
    redScore: number;
    buyTypeBlue: string;
    buyTypeRed: string;
    playerKills: number;
  }>;
  economy: {
    avgSpentPerRoundBlue: number;
    avgSpentPerRoundRed: number;
    blueRoundsFullBuy: number;
    blueRoundsEco: number;
    blueRoundsSemi: number;
    redRoundsFullBuy: number;
    redRoundsEco: number;
    redRoundsSemi: number;
  };
}

export interface AIMatchAnalysis {
  matchId: string;
  analysis: {
    needsApiKey?: boolean;
    overallVerdict: string;
    rating: number;
    summary: string;
    strengths: string[];
    mistakes: string[];
    coachingTips: string[];
    economyRating?: string;
    clutchRating?: string;
    keyRoundBreakdown?: Array<{
      round: number;
      type: string;
      verdict: string;
    }>;
  };
}

export interface LiveMatchData {
  matchId: string;
  source?: 'live' | 'mock';
  inGame?: boolean;
  status: string;
  map: string;
  mapImageUrl: string;
  mode: string;
  server: string;
  gameDuration: string;
  currentScore: string;
  currentRound: number;
  mySide: string;
  allies: Array<{
    name: string;
    tag: string;
    isPlayer: boolean;
    agent: string;
    agentIcon: string;
    role: string;
    rank: string;
    rankIcon: string;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    ping: number;
    ultReady: boolean;
    ultPoints: string;
    credits: number;
    loadout: string;
  }>;
  enemies: Array<{
    name: string;
    tag: string;
    isPlayer: boolean;
    agent: string;
    agentIcon: string;
    role: string;
    rank: string;
    rankIcon: string;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    ping: number;
    ultReady: boolean;
    ultPoints: string;
    credits: number;
    loadout: string;
  }>;
  liveInsights: string[];
}

export interface AgentAdvisorResponse {
  recommendations: Array<{
    agentName: string;
    role: 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
    tier: 'S' | 'A' | 'B';
    score: number;
    iconUrl: string;
    portraitUrl: string;
    mapAdvantage: string;
    synergyReasons: string[];
    keyAbilities: string[];
  }>;
  compAnalysis: {
    hasController: boolean;
    hasInitiator: boolean;
    hasDuelist: boolean;
    hasSentinel: boolean;
    missingRoles: string[];
    compSummary: string;
    allyComp: string[];
    map: string;
  };
}

export interface StoreData {
  source?: 'live' | 'mock';
  featuredBundle: {
    bundleUuid: string;
    displayName: string;
    displayIcon: string;
    verticalPromoImage: string;
    description: string;
    priceVP: number;
    originalPriceVP: number;
    discountPct: number;
    durationRemainingSeconds: number;
    items: Array<{
      name: string;
      weapon: string;
      priceVP: number;
      icon: string;
    }>;
  };
  dailyOffers: Array<{
    id: string;
    name: string;
    weapon: string;
    priceVP: number;
    tier: string;
    tierColor: string;
    icon: string;
  }>;
  nightMarket?: {
    isActive: boolean;
    durationRemainingSeconds: number;
    offers: Array<{
      id: string;
      name: string;
      weapon: string;
      originalPriceVP: number;
      discountPriceVP: number;
      discountPct: number;
      tier: string;
      isRevealed: boolean;
      icon: string;
    }>;
  };
  resetTimeRemainingSeconds: number;
}

export interface WalletData {
  source?: 'live' | 'mock';
  vp: number;
  rp: number;
  kc: number;
}

export interface LoadoutData {
  source?: 'live' | 'mock';
  weapons: Record<string, {
    skinName: string;
    chromaName: string;
    icon: string;
    buddy: string | null;
  }>;
  identity: {
    playerCard: string;
    cardWide: string;
    playerTitle: string;
    spray: string;
    levelBorder: string;
    accountLevel?: number;
  };
}

export interface BattlepassData {
  source?: 'live' | 'mock';
  actName?: string;
  currentTier: number;
  maxTier?: number;
  epilogueTiers?: number;
  currentTierProgressXP?: number;
  tierRequiredXP?: number;
  totalXPAccumulated: number;
  isPremium?: boolean;
  daysRemaining?: number | null;
  seasonProgressPct?: number;
  featuredRewards?: Array<{
    tier: number;
    name: string;
    type: string;
    icon: string;
    isFree: boolean;
  }>;
  tiers?: Array<{
    tier: number;
    name: string;
    type: string;
    isFree: boolean;
    claimed: boolean;
    icon: string;
  }>;
  leaderboard?: Array<{
    rank: number;
    name: string;
    tier: number;
    xp: number;
    level: number;
    isCurrentPlayer?: boolean;
  }>;
}

export interface QuestsData {
  source?: 'live' | 'mock';
  dailies: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    maxProgress: number;
    xpReward: number;
    apReward: number;
    completed: boolean;
    expiresInSeconds: number;
  }>;
  weeklies: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    maxProgress: number;
    xpReward: number;
    completed: boolean;
    expiresInSeconds: number;
  }>;
}

// API functions
export async function getRiotStatus(): Promise<RiotStatusData> {
  const res = await apiFetch(`/riot/status`);
  if (!res.ok) throw new Error('Failed to fetch Riot status');
  return res.json();
}

export async function getAgents(): Promise<Agent[]> {
  const res = await apiFetch(`/agents`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getMaps(): Promise<MapData[]> {
  const res = await apiFetch(`/maps`);
  if (!res.ok) throw new Error('Failed to fetch maps');
  return res.json();
}

export async function getWeapons(): Promise<WeaponData[]> {
  const res = await apiFetch(`/weapons`);
  if (!res.ok) throw new Error('Failed to fetch weapons');
  return res.json();
}

export async function getCareer(): Promise<CareerData> {
  const res = await apiFetch(`/player-career`);
  if (!res.ok) throw new Error('Failed to fetch career');
  return res.json();
}

export async function getMatches(): Promise<MatchSummary[]> {
  const res = await apiFetch(`/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function getMatchDetail(id: string): Promise<MatchDetail> {
  const res = await apiFetch(`/match/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch match ${id}`);
  return res.json();
}

export async function analyzeMatchAI(matchId: string, matchData?: any, focus?: string): Promise<AIMatchAnalysis> {
  const res = await apiFetch(`/match-analysis/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, matchData, focus })
  });
  if (!res.ok) throw new Error('Failed to analyze match');
  return res.json();
}

export async function getLiveMatch(): Promise<LiveMatchData> {
  const res = await apiFetch(`/live-match`);
  if (!res.ok) throw new Error('Failed to fetch live match');
  return res.json();
}

export async function chooseAgent(map: string, allyComp: string[], role?: string): Promise<AgentAdvisorResponse> {
  const res = await apiFetch(`/agent/choose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ map, allyComp, role })
  });
  if (!res.ok) throw new Error('Failed to recommend agents');
  return res.json();
}

export async function getStore(): Promise<StoreData> {
  const res = await apiFetch(`/store`);
  if (!res.ok) throw new Error('Failed to fetch store');
  return res.json();
}

export async function getWallet(): Promise<WalletData> {
  const res = await apiFetch(`/wallet`);
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

export async function getLoadout(): Promise<LoadoutData> {
  const res = await apiFetch(`/loadout`);
  if (!res.ok) throw new Error('Failed to fetch loadout');
  return res.json();
}

export async function getBattlepass(): Promise<BattlepassData> {
  const res = await apiFetch(`/battlepass`);
  if (!res.ok) throw new Error('Failed to fetch battlepass');
  return res.json();
}

export async function getQuests(): Promise<QuestsData> {
  const res = await apiFetch(`/quests`);
  if (!res.ok) throw new Error('Failed to fetch quests');
  return res.json();
}

export async function getPremium(): Promise<{ premium: boolean; tier: string }> {
  const res = await apiFetch(`/premium/sync`);
  if (!res.ok) throw new Error('Failed to sync premium');
  return res.json();
}

export interface AutoPickSettings {
  enabled: boolean;
  agentUuid: string;
  agentName: string;
  mode: 'hover' | 'lock';
  lastActionStatus?: string;
  lastActionTimestamp?: number;
  matchState?: 'IDLE' | 'PREGAME_HOVERED' | 'PREGAME_LOCKED' | 'IN_GAME';
}

export async function getRiotPregame(): Promise<any> {
  const res = await apiFetch(`/riot/pregame`);
  if (!res.ok) throw new Error('Failed to fetch pregame state');
  return res.json();
}

export interface LobbyInspectPlayer {
  isPlayer: boolean;
  teamId?: string;
  agentName: string | null;
  agentIcon: string | null;
  selectionState?: string;
  tier?: number;
  tierName?: string;
  tierIcon?: string | null;
  rr?: number;
  streak?: { type: 'W' | 'L' | null; count: number } | null;
  skins?: Array<{ weapon: string; skinName: string; icon: string | null; tierRank?: number }>;
}

export interface LobbyInspectData {
  available: boolean;
  phase: 'AGENT_SELECT' | 'IN_GAME' | 'IN_LOBBY' | 'OFFLINE' | 'ERROR';
  source?: 'live' | 'mock';
  map?: string;
  players: LobbyInspectPlayer[];
  skinsAvailable?: boolean;
  note?: string;
}

export async function getLobbyInspect(): Promise<LobbyInspectData> {
  const res = await apiFetch(`/riot/lobby-inspect`);
  if (!res.ok) throw new Error('Failed to fetch lobby inspection');
  return res.json();
}

export interface GamePhaseData {
  phase: 'OFFLINE' | 'MENUS' | 'AGENT_SELECT' | 'INGAME';
  matchId: string | null;
  source?: 'live' | 'mock';
}

export async function getGamePhase(): Promise<GamePhaseData> {
  const res = await apiFetch(`/riot/phase`);
  if (!res.ok) throw new Error('Failed to fetch game phase');
  return res.json();
}

export interface LiveScoreData {
  ally: number | null;
  enemy: number | null;
  round: number | null;
}

export async function getLiveScore(): Promise<LiveScoreData> {
  const res = await apiFetch(`/riot/score`);
  if (!res.ok) throw new Error('Failed to fetch live score');
  return res.json();
}

// ---- AI engine settings ----
export interface AiSettings {
  hasKey: boolean;
  keyHint: string;
  model: string;
  usingEnvKey: boolean;
  tone?: 'analytical' | 'tactical_mentor' | 'aggressive_drill';
}

export async function getAiSettings(): Promise<AiSettings> {
  const res = await apiFetch(`/ai/settings`);
  if (!res.ok) throw new Error('Failed to fetch AI settings');
  return res.json();
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

export async function getAutoPickSettings(): Promise<AutoPickSettings> {
  const res = await apiFetch(`/riot/autopick`);
  if (!res.ok) throw new Error('Failed to fetch autopick config');
  return res.json();
}

export async function saveAutoPickSettings(settings: Partial<AutoPickSettings>): Promise<AutoPickSettings> {
  const res = await apiFetch(`/riot/autopick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update autopick config');
  return res.json();
}

export async function selectAgentAction(agentUuid: string): Promise<any> {
  const res = await apiFetch(`/riot/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentUuid })
  });
  return res.json();
}

export async function lockAgentAction(agentUuid: string): Promise<any> {
  const res = await apiFetch(`/riot/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentUuid })
  });
  return res.json();
}

export async function getUnlockedAgents(): Promise<string[]> {
  const res = await apiFetch(`/riot/unlocked-agents`);
  if (!res.ok) return [];
  return res.json();
}

export async function streamCoachChat(
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  onMeta?: (meta: { dropped: number; window: number }) => void
): Promise<() => void> {
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

// ---- Coach extras ----------------------------------------------------------

export interface CoachSuggestion {
  label: string;
  prompt: string;
  reason: string;
}

export interface WindowStat {
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
}

export interface TrendReport {
  windows: WindowStat[];
  deltas: Array<{
    window: number;
    kd: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    winRate: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    acs: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    adr: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    hsPct: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
  }>;
  percentiles: Array<{ metric: string; current: number | null; percentile: number | null; sample: number }>;
}

export interface WeeklyPlan {
  weaknesses: { area: string; evidence: string; severity: 'high' | 'medium' | 'low' }[];
  goals: { goal: string; target: string; metric: string }[];
  drills: { drill: string; duration: string; focus: string; tiesTo: string }[];
}

export interface Lineup {
  id: string;
  map: string;
  agent: string;
  ability: string;
  side: 'Attack' | 'Defense';
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source: string;
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
