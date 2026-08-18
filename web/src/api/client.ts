declare global {
  interface Window {
    __VALORECON_BOOTSTRAP__?: {
      port: number;
      token: string;
    };
  }
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
  const res = await fetch(`${getApiBase()}/auth/token`);
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

export async function getSkinMedia(query: { id?: string; name?: string; uuid?: string }): Promise<{
  videoUrl: string | null;
  imageUrl: string | null;
  displayName: string | null;
}> {
  const params = new URLSearchParams();
  if (query.id) params.set('id', query.id);
  if (query.name) params.set('name', query.name);
  if (query.uuid) params.set('uuid', query.uuid);
  const res = await apiFetch(`/skin-media?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch skin media');
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
export async function getRiotPregame(): Promise<any> {
  const res = await apiFetch(`/riot/pregame`);
  if (!res.ok) throw new Error('Failed to fetch pregame state');
  return res.json();
}

export async function getLobbyInspect(): Promise<LobbyInspectData> {
  const res = await apiFetch(`/riot/lobby-inspect`);
  if (!res.ok) throw new Error('Failed to fetch lobby inspection');
  return res.json();
}

export async function getGamePhase(): Promise<GamePhaseData> {
  const res = await apiFetch(`/riot/phase`);
  if (!res.ok) throw new Error('Failed to fetch game phase');
  return res.json();
}

export async function getLiveScore(): Promise<LiveScoreData> {
  const res = await apiFetch(`/riot/score`);
  if (!res.ok) throw new Error('Failed to fetch live score');
  return res.json();
}

export async function getAiSettings(): Promise<AiSettings> {
  const res = await apiFetch(`/ai/settings`);
  if (!res.ok) throw new Error('Failed to fetch AI settings');
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
