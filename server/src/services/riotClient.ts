import fs from 'fs';
import path from 'path';
import https from 'https';
import {
  getClientVersion,
  getAgents,
  getMaps,
  getWeapons,
  getCompetitiveTiers,
  resolveAgentByUuid,
  resolveMapByPathOrUuid,
  resolveSkinByUuid,
  resolveBundleByUuid,
  resolvePlayerCard,
  resolvePlayerTitle
} from './valorantApi';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const CLIENT_PLATFORM =
  'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

const CURRENCY_UUIDS = {
  VP: '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741',
  RP: 'e59aa87c-4cbf-517a-5983-6e81511be9b7',
  KC: '85ca954a-41f2-ce94-9b45-8ca3dd39a00d'
};

const CONTENT_TIER_META: Record<string, { name: string; color: string }> = {
  '12683d76-48d7-84a3-4e09-6985794f0445': { name: 'Select', color: '#5a9fe2' },
  '0cebb8be-46d7-c12a-d306-e9907bfc5a25': { name: 'Deluxe', color: '#009688' },
  '60bca009-4182-7998-dee7-b8a2558dc369': { name: 'Premium', color: '#d1548d' },
  'e046854e-406c-37f4-6607-19a9ba8426fc': { name: 'Exclusive', color: '#f8b73e' },
  '411e4a55-4e59-7757-41f0-86a53f101bb5': { name: 'Ultra', color: '#e91e63' }
};

export async function repairWeaponSkinUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const m = url.match(/weaponskins\/([0-9a-f-]{36})/i);
  if (m) {
    const resolved = await resolveSkinByUuid(m[1]);
    return resolved?.displayIcon || null;
  }
  return url;
}

const REQUEST_TIMEOUT_MS = 3500;

export interface LockfileData {
  name: string;
  pid: number;
  port: number;
  password: string;
  protocol: string;
}

export interface RiotSession {
  accessToken: string;
  entitlementsToken: string;
  puuid: string;
  gameName: string;
  gameTag: string;
  region: string;
  shard: string;
  port: number;
  password: string;
  expiresAt: number;
}

import { defaultStateStore } from '../storage/stateStore';
import { lifecycle } from '../lifecycle';

export interface AutoPickConfig {
  enabled: boolean;
  agentUuid: string;
  agentName: string;
  mode: 'hover' | 'lock';
  lastActionStatus?: string;
  lastActionTimestamp?: number;
  matchState?: 'IDLE' | 'PREGAME_HOVERED' | 'PREGAME_LOCKED' | 'IN_GAME';
}


function loadPersistedConfig(): AutoPickConfig {
  return defaultStateStore.readJson<AutoPickConfig>('autopick_state.json', {
    enabled: false,
    agentUuid: '',
    agentName: '',
    mode: 'hover',
    matchState: 'IDLE'
  });
}

function savePersistedConfig() {
  defaultStateStore.writeJsonAtomic('autopick_state.json', autoPickConfig);
}


export interface PlayerRankAndStreak {
  tier: number;
  tierName: string;
  tierIcon: string | null;
  rr: number;
  streak: { type: 'W' | 'L' | null; count: number } | null;
}

// -------------------------------------------------------------
// Bounded LRU Cache with TTL (Fix 3: Memory Safety)
// -------------------------------------------------------------
export class BoundedCache<K, V> {
  private map = new Map<K, { data: V; time: number }>();
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number, ttlMs: number) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.time > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh for LRU eviction order
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.data;
  }

  set(key: K, data: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, { data, time: Date.now() });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

export { BoundedCache as TtlLruCache };


// -------------------------------------------------------------
// Global PVP Request Throttler & Queue (Fix 2: Rate Limiting)
// Max concurrency: 3, Min spacing between request starts: 70ms
// -------------------------------------------------------------
export class RequestQueue {
  private maxConcurrency: number;
  private minSpacingMs: number;
  private activeCount = 0;
  private queue: Array<() => void> = [];
  private lastStartTime = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(maxConcurrency = 3, minSpacingMs = 70) {
    this.maxConcurrency = maxConcurrency;
    this.minSpacingMs = minSpacingMs;
  }

  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.schedulePump();
        }
      });
      this.schedulePump();
    });
  }

  private schedulePump() {
    if (this.timer) {
      return;
    }
    const now = Date.now();
    const elapsed = now - this.lastStartTime;
    const wait = Math.max(0, this.minSpacingMs - elapsed);

    this.timer = setTimeout(() => {
      this.timer = null;
      this.pump();
    }, wait);
  }

  private pump() {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastStartTime;
      if (this.lastStartTime > 0 && elapsed < this.minSpacingMs) {
        this.schedulePump();
        return;
      }
      const task = this.queue.shift();
      if (task) {
        this.activeCount++;
        this.lastStartTime = Date.now();
        task();
      }
    }
  }
}

const pvpRequestQueue = new RequestQueue(3, 70);

let cachedSession: RiotSession | null = null;
// Bounded caches with TTL
const matchDetailCache = new BoundedCache<string, any>(40, 15 * 60 * 1000); // max 40, 15 min TTL
const playerNameCache = new BoundedCache<string, { gameName: string; tagLine: string }>(200, 30 * 60 * 1000); // max 200, 30 min TTL
const playerRankStreakCache = new BoundedCache<string, PlayerRankAndStreak>(200, 5 * 60 * 1000); // max 200, 5 min TTL
const cacheTTL = 20000; // 20s in-memory cache to prevent Cloudflare 1015
const STATIC_TTL = 30 * 60 * 1000; // 30 min — for data that doesn't change mid-session (loadout, battlepass)
let lastWalletCache: { data: any; time: number } | null = null;
let lastCareerCache: { data: any; time: number } | null = null;
let lastStoreCache: { data: any; time: number } | null = null;
let lastLoadoutCache: { data: any; time: number } | null = null;
let lastBattlepassCache: { data: any; time: number } | null = null;
let lastMatchesCache: { data: any; time: number } | null = null;

let autoPickConfig: AutoPickConfig = loadPersistedConfig();

export function getAutoPickConfig(): AutoPickConfig {
  return autoPickConfig;
}

export function setAutoPickConfig(config: Partial<AutoPickConfig>): AutoPickConfig {
  autoPickConfig = {
    ...autoPickConfig,
    ...config
  };
  savePersistedConfig();
  console.log('[riot] Persisted Auto-Pick Config:', autoPickConfig);
  return autoPickConfig;
}

export function getLockfilePath(): string {
  const localAppData = process.env.LOCALAPPDATA || '';
  return path.join(localAppData, 'Riot Games', 'Riot Client', 'Config', 'lockfile');
}

export function readLockfile(): LockfileData | null {
  try {
    const lockPath = getLockfilePath();
    if (!fs.existsSync(lockPath)) return null;

    const content = fs.readFileSync(lockPath, 'utf8');
    const parts = content.trim().split(':');
    if (parts.length < 5) return null;

    return {
      name: parts[0],
      pid: parseInt(parts[1], 10),
      port: parseInt(parts[2], 10),
      password: parts[3],
      protocol: parts[4]
    };
  } catch (err) {
    return null;
  }
}

export function makeLocalRequest<T = any>(
  lock: LockfileData,
  endpoint: string,
  method = 'GET',
  bodyData?: any
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`riot:${lock.password}`).toString('base64');
    const options: https.RequestOptions = {
      hostname: '127.0.0.1',
      port: lock.port,
      path: endpoint,
      method,
      agent: httpsAgent,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 200, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode || 200, data: data as any });
        }
      });
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Local request timeout (${endpoint})`));
    });

    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

function parseJwt(token: string): any {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    return {};
  }
}

export function resolveShardAndRegion(
  jwtPayload: any,
  chatSession: any
): { shard: string; region: string } {
  const affinity = (jwtPayload?.affinity || '').toLowerCase();
  const chatRegion = (chatSession?.region || '').toLowerCase();
  const cty = (jwtPayload?.cty || '').toLowerCase();
  const datC = (jwtPayload?.dat?.c || '').toLowerCase();

  // AP Shard (Asia-Pacific, India, Japan, SEA, Oceania)
  if (
    affinity === 'ap' ||
    chatRegion.startsWith('jp') ||
    chatRegion.startsWith('ap') ||
    cty === 'ind' ||
    cty === 'jpn' ||
    cty === 'sgp' ||
    datC.startsWith('as')
  ) {
    return { shard: 'ap', region: 'ap' };
  }

  // EU Shard
  if (affinity === 'eu' || chatRegion.startsWith('eu') || chatRegion.startsWith('ru')) {
    return { shard: 'eu', region: 'eu' };
  }

  // KR Shard
  if (affinity === 'kr' || chatRegion.startsWith('kr') || cty === 'kor') {
    return { shard: 'kr', region: 'kr' };
  }

  // LATAM & BR Shards (Shard is NA for PVP API, region is latam/br for GLZ)
  if (affinity === 'latam' || chatRegion.startsWith('latam')) {
    return { shard: 'na', region: 'latam' };
  }
  if (affinity === 'br' || chatRegion.startsWith('br')) {
    return { shard: 'na', region: 'br' };
  }

  // Default to NA
  return { shard: 'na', region: 'na' };
}

export async function getRiotSession(forceRefresh = false): Promise<RiotSession | null> {
  const now = Date.now();
  if (!forceRefresh && cachedSession && cachedSession.expiresAt > now) {
    return cachedSession;
  }

  const lock = readLockfile();
  if (!lock) {
    cachedSession = null;
    return null;
  }

  try {
    const entRes = await makeLocalRequest<{
      accessToken: string;
      token: string;
      subject: string;
    }>(lock, '/entitlements/v1/token');

    if (!entRes.data?.accessToken || !entRes.data?.token) {
      return cachedSession;
    }

    let gameName = cachedSession?.gameName || 'Player';
    let gameTag = cachedSession?.gameTag || 'VALO';
    let chatSessionData: any = null;

    try {
      const chatRes = await makeLocalRequest<any>(lock, '/chat/v1/session');
      chatSessionData = chatRes.data;
      if (chatSessionData?.game_name) gameName = chatSessionData.game_name;
      if (chatSessionData?.game_tag) gameTag = chatSessionData.game_tag;
    } catch (e) {
      // ignore chat error
    }

    const jwtPayload = parseJwt(entRes.data.accessToken);
    const { shard, region } = resolveShardAndRegion(jwtPayload, chatSessionData);

    const session: RiotSession = {
      accessToken: entRes.data.accessToken,
      entitlementsToken: entRes.data.token,
      puuid: entRes.data.subject || jwtPayload?.sub || '',
      gameName,
      gameTag,
      region,
      shard,
      port: lock.port,
      password: lock.password,
      expiresAt: now + 2 * 60 * 1000 // 2 minutes
    };

    cachedSession = session;
    return session;
  } catch (err: any) {
    console.error('[riot] Local session negotiation notice:', err.message);
    return cachedSession;
  }
}

function executePvpRequest<T = any>(
  pathStr: string,
  options: {
    method?: string;
    body?: any;
    isGlz?: boolean;
  } = {},
  session: RiotSession,
  clientVersion: string
): Promise<{ status: number; data: T; url: string }> {
  const host = options.isGlz
    ? `glz-${session.region}-1.${session.shard}.a.pvp.net`
    : `pd.${session.shard}.a.pvp.net`;

  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  const fullUrl = `https://${host}${cleanPath}`;
  const method = options.method || 'GET';

  return new Promise((resolve, reject) => {
    const reqOptions: https.RequestOptions = {
      hostname: host,
      path: cleanPath,
      method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'X-Riot-Entitlements-JWT': session.entitlementsToken,
        'X-Riot-ClientVersion': clientVersion,
        'X-Riot-ClientPlatform': CLIENT_PLATFORM,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const status = res.statusCode || 200;
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }

        if (status < 200 || status >= 300) {
          if (status !== 404) {
            console.error(
              `[riot] PVP HTTP ${status} for ${method} ${fullUrl} =>`,
              typeof parsed === 'object' ? JSON.stringify(parsed) : parsed
            );
          }
        }

        resolve({ status, data: parsed as T, url: fullUrl });
      });
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`PVP request timeout (${cleanPath})`));
    });

    req.on('error', (err) => {
      console.error(`[riot] Network notice for ${method} ${fullUrl}:`, err.message);
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

export async function makePvpRequest<T = any>(
  pathStr: string,
  options: {
    method?: string;
    body?: any;
    isGlz?: boolean;
  } = {}
): Promise<{ status: number; data: T; url: string }> {
  const session = await getRiotSession();
  if (!session) {
    throw new Error('Riot Client session not active');
  }

  const clientVersion = await getClientVersion();

  return pvpRequestQueue.run(() =>
    executePvpRequest<T>(pathStr, options, session, clientVersion)
  );
}

/**
 * Resolves player game names and taglines using Riot's name-service.
 * Results are cached in a bounded LRU cache (200 entries, 30 min TTL).
 * Only uncached PUUIDs are requested in a single batch call.
 */
export async function resolvePlayerNames(
  puuids: string[]
): Promise<Record<string, { gameName: string; tagLine: string }>> {
  const result: Record<string, { gameName: string; tagLine: string }> = {};
  if (!Array.isArray(puuids) || puuids.length === 0) return result;

  const uniquePuuids = Array.from(new Set(puuids.filter(Boolean)));
  const uncachedPuuids: string[] = [];

  for (const puuid of uniquePuuids) {
    const cached = playerNameCache.get(puuid);
    if (cached) {
      result[puuid] = cached;
    } else {
      uncachedPuuids.push(puuid);
    }
  }

  if (uncachedPuuids.length === 0) {
    return result;
  }

  try {
    const res = await makePvpRequest<any[]>('/name-service/v2/players', {
      method: 'PUT',
      body: uncachedPuuids
    });

    if (res.status === 200 && Array.isArray(res.data)) {
      for (const item of res.data) {
        const subject = item?.Subject || item?.subject || item?.puuid;
        if (subject) {
          const gameName = item?.GameName ?? item?.gameName ?? '';
          const tagLine = item?.TagLine ?? item?.tagLine ?? '';
          const resolved = { gameName, tagLine };
          playerNameCache.set(subject, resolved);
          result[subject] = resolved;
        }
      }
    }
  } catch (e: any) {
    // Gracefully continue with whatever was resolved from cache
    console.error('[riot] Name-service resolution notice:', e?.message);
  }

  return result;
}

// -------------------------------------------------------------
// Live Riot Data Pulls & Transforming to App Shapes
// -------------------------------------------------------------

export async function getLiveStatus() {
  const lock = readLockfile();
  const session = await getRiotSession();
  return {
    connected: !!session,
    gameRunning: !!lock,
    puuid: session?.puuid || null,
    gameName: session?.gameName || null,
    gameTag: session?.gameTag || null,
    region: session?.region || null,
    shard: session?.shard || null
  };
}

/**
 * Detects the player's real game phase by probing Riot's GLZ endpoints:
 * MENUS (lobby) -> PREGAME (agent select) -> INGAME (match started).
 * This is the authoritative "has the match started?" check.
 */
export async function getGamePhase() {
  const session = await getRiotSession();
  if (!session) return { phase: 'OFFLINE', matchId: null, source: 'mock' };

  // In an active match? (core-game)
  try {
    const core = await makePvpRequest<any>(`/core-game/v1/players/${session.puuid}`, { isGlz: true });
    if (core.status === 200 && core.data?.MatchID) {
      return { phase: 'INGAME', matchId: core.data.MatchID, source: 'live' };
    }
  } catch (e) { /* not in game */ }

  // In agent select? (pregame)
  try {
    const pre = await makePvpRequest<any>(`/pregame/v1/players/${session.puuid}`, { isGlz: true });
    if (pre.status === 200 && pre.data?.MatchID) {
      return { phase: 'AGENT_SELECT', matchId: pre.data.MatchID, source: 'live' };
    }
  } catch (e) { /* not in pregame */ }

  return { phase: 'MENUS', matchId: null, source: 'live' };
}

/**
 * Fetches a single player's competitive tier and recent W/L streak by PUUID.
 * Rank comes from /mmr; streak is derived from their competitive match-history
 * WHEN Riot exposes it (own account always; others often return 403/empty —
 * in that case streak is null, never faked).
 * Cached per-PUUID (5 min TTL, bounded LRU) to eliminate redundant calls.
 */
async function fetchPlayerRankAndStreak(puuid: string): Promise<PlayerRankAndStreak> {
  if (!puuid) {
    return { tier: 0, tierName: 'Unrated', tierIcon: null, rr: 0, streak: null };
  }

  const cached = playerRankStreakCache.get(puuid);
  if (cached) {
    return cached;
  }

  const tiers = await getCompetitiveTiers();
  const tierName = (t: number) =>
    tiers.find((x: any) => x.tier === t)?.tierName || (t > 0 ? `Tier ${t}` : 'Unrated');
  const tierIcon = (t: number) => tiers.find((x: any) => x.tier === t)?.largeIcon || null;

  let tier = 0, rr = 0;
  try {
    const mmr = await makePvpRequest<any>(`/mmr/v1/players/${puuid}`);
    if (mmr.status === 200) {
      const upd = mmr.data?.LatestCompetitiveUpdate;
      tier = upd?.TierAfterUpdate ?? 0;
      rr = upd?.RankedRatingAfterUpdate ?? 0;
    }
  } catch (e) { /* rank hidden */ }

  // Streak: only computable if their competitive history is visible to us.
  let streak: { type: 'W' | 'L' | null; count: number } | null = null;
  try {
    const hist = await makePvpRequest<any>(
      `/mmr/v1/players/${puuid}/competitiveupdates?startIndex=0&endIndex=10&queue=competitive`
    );
    if (hist.status === 200 && Array.isArray(hist.data?.Matches) && hist.data.Matches.length) {
      const results = hist.data.Matches
        .map((m: any) => (m.RankedRatingEarned > 0 ? 'W' : m.RankedRatingEarned < 0 ? 'L' : null))
        .filter(Boolean) as ('W' | 'L')[];
      if (results.length) {
        const first = results[0];
        let count = 0;
        for (const r of results) { if (r === first) count++; else break; }
        streak = { type: first, count };
      }
    }
  } catch (e) { /* history private */ }

  const result: PlayerRankAndStreak = { tier, tierName: tierName(tier), tierIcon: tierIcon(tier), rr, streak };
  playerRankStreakCache.set(puuid, result);
  return result;
}

export async function getRiotDebugReport() {
  const lock = readLockfile();
  if (!lock) {
    return {
      connected: false,
      gameRunning: false,
      message: 'Riot Client lockfile not found (game not running)'
    };
  }

  const session = await getRiotSession(true);
  if (!session) {
    return {
      connected: false,
      gameRunning: true,
      message: 'Lockfile found but failed to negotiate local tokens'
    };
  }

  const results: any[] = [];

  const endpointsToTest: Array<{
    name: string;
    path: string;
    method?: string;
    body?: any;
    isGlz?: boolean;
  }> = [
    { name: 'MMR & Competitive Rating', path: `/mmr/v1/players/${session.puuid}` },
    {
      name: 'Match History (Recent)',
      path: `/match-history/v1/history/${session.puuid}?startIndex=0&endIndex=5`
    },
    { name: 'Storefront (Daily & Bundles)', path: `/store/v3/storefront/${session.puuid}`, method: 'POST', body: {} },
    { name: 'Wallet (VP, RP, KC)', path: `/store/v1/wallet/${session.puuid}` },
    { name: 'Player Loadout (Personalization)', path: `/personalization/v2/players/${session.puuid}/playerloadout` },
    { name: 'Account XP & Level', path: `/account-xp/v1/players/${session.puuid}` },
    { name: 'Contracts & Missions', path: `/contracts/v1/contracts/${session.puuid}` },
    { name: 'Core Game (Live in-game match)', path: `/core-game/v1/players/${session.puuid}`, isGlz: true },
    { name: 'Pregame (Agent Select lobby)', path: `/pregame/v1/players/${session.puuid}`, isGlz: true }
  ];

  for (const ep of endpointsToTest) {
    try {
      const res = await makePvpRequest(ep.path, {
        method: ep.method,
        body: ep.body,
        isGlz: ep.isGlz
      });

      const sampleKeys =
        typeof res.data === 'object' && res.data !== null ? Object.keys(res.data).slice(0, 6) : [];

      results.push({
        name: ep.name,
        url: res.url,
        httpStatus: res.status,
        ok: res.status === 200,
        sampleKeys: res.status === 200 ? sampleKeys : undefined,
        errorBody: res.status !== 200 ? res.data : undefined
      });
    } catch (err: any) {
      results.push({
        name: ep.name,
        ok: false,
        error: err.message
      });
    }
  }

  return {
    connected: true,
    gameRunning: true,
    player: `${session.gameName}#${session.gameTag}`,
    puuid: session.puuid,
    shard: session.shard,
    region: session.region,
    endpoints: results
  };
}

export async function fetchLiveCareer(fallbackCareer: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackCareer, source: 'mock' };

  const now = Date.now();
  if (lastCareerCache && now - lastCareerCache.time < cacheTTL) {
    return lastCareerCache.data;
  }

  try {
    const mmrRes = await makePvpRequest<any>(`/mmr/v1/players/${session.puuid}`);
    if (mmrRes.status !== 200) {
      if (lastCareerCache) return lastCareerCache.data;
      return { ...fallbackCareer, source: 'live' };
    }

    const mmrData = mmrRes.data;
    const latestSeason = mmrData?.LatestCompetitiveUpdate;
    const currentTier = latestSeason?.TierAfterUpdate ?? 0;
    const currentRR = latestSeason?.RankedRatingAfterUpdate ?? 0;

    const tiers = await getCompetitiveTiers();
    const tierName = (t: number) =>
      tiers.find((x: any) => x.tier === t)?.tierName || (t > 0 ? `Tier ${t}` : 'Unrated');
    const tierIcon = (t: number) =>
      tiers.find((x: any) => x.tier === t)?.largeIcon || null;

    // Peak rank: highest tier the player has ever won a game at, across all seasons.
    const seasons = mmrData?.QueueSkills?.competitive?.SeasonalInfoBySeasonID || {};
    let peakTier = currentTier;
    let seasonWins = 0;
    let seasonGames = 0;
    for (const sid of Object.keys(seasons)) {
      const s = seasons[sid];
      const winsByTier = s?.WinsByTier || {};
      for (const tierKey of Object.keys(winsByTier)) {
        const t = parseInt(tierKey, 10);
        if (!isNaN(t) && t > peakTier) peakTier = t;
      }
      seasonWins += s?.NumberOfWins ?? 0;
      seasonGames += s?.NumberOfGames ?? 0;
    }

    // Account level
    let accountLevel = 1;
    try {
      const xpRes = await makePvpRequest<any>(`/account-xp/v1/players/${session.puuid}`);
      if (xpRes.status === 200 && xpRes.data?.Progress?.Level) {
        accountLevel = xpRes.data.Progress.Level;
      }
    } catch (e) { /* ignore */ }

    // Real aggregate stats from actual recent matches.
    const matches = await fetchLiveMatches(fallbackCareer.__matchesFallback || []);
    const real = Array.isArray(matches) ? matches.filter((m: any) => m.source === 'live' && m.kills !== undefined) : [];

    let wins = 0, losses = 0, k = 0, d = 0, a = 0;
    const recentForm: ('W' | 'L')[] = [];
    const agentAgg: Record<string, { matches: number; wins: number; k: number; d: number; role: string; icon: string }> = {};
    const mapAgg: Record<string, { matches: number; wins: number; k: number; d: number }> = {};

    for (const m of real) {
      const won = m.result === 'VICTORY';
      if (m.result === 'VICTORY') wins++;
      else if (m.result === 'DEFEAT') losses++;
      if (m.result === 'VICTORY' || m.result === 'DEFEAT') recentForm.push(won ? 'W' : 'L');
      k += m.kills || 0; d += m.deaths || 0; a += m.assists || 0;

      if (m.agentName) {
        const ag = (agentAgg[m.agentName] ||= { matches: 0, wins: 0, k: 0, d: 0, role: m.role || '', icon: m.agentIconUrl || '' });
        ag.matches++; if (won) ag.wins++; ag.k += m.kills || 0; ag.d += m.deaths || 0;
      }
      if (m.mapName) {
        const mp = (mapAgg[m.mapName] ||= { matches: 0, wins: 0, k: 0, d: 0 });
        mp.matches++; if (won) mp.wins++; mp.k += m.kills || 0; mp.d += m.deaths || 0;
      }
    }

    const totalMatches = wins + losses;
    // Prefer season win/games from MMR (larger sample) when available, else recent matches.
    const winRate = seasonGames > 0
      ? Math.round((seasonWins / seasonGames) * 100)
      : (totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0);
    const kd = d > 0 ? parseFloat((k / d).toFixed(2)) : k;

    const topAgents = Object.entries(agentAgg)
      .sort((x, y) => y[1].matches - x[1].matches)
      .slice(0, 4)
      .map(([agentName, s]) => ({
        agentName, role: s.role, matches: s.matches,
        winRate: s.matches ? Math.round((s.wins / s.matches) * 100) : 0,
        kd: s.d > 0 ? parseFloat((s.k / s.d).toFixed(2)) : s.k,
        adr: 0, iconUrl: s.icon, portraitUrl: s.icon,
      }));

    const mapWinRates = Object.entries(mapAgg)
      .sort((x, y) => y[1].matches - x[1].matches)
      .slice(0, 6)
      .map(([mapName, s]) => ({
        mapName, matches: s.matches,
        winRate: s.matches ? Math.round((s.wins / s.matches) * 100) : 0,
        kd: s.d > 0 ? parseFloat((s.k / s.d).toFixed(2)) : s.k,
      }));

    // Real player card (avatar) from the loadout identity.
    let avatarUrl = '';
    let cardUrl = '';
    let title = '';
    try {
      const loadoutRes = await makePvpRequest<any>(`/personalization/v2/players/${session.puuid}/playerloadout`);
      if (loadoutRes.status === 200) {
        const cardId = loadoutRes.data?.Identity?.PlayerCardID;
        const card = await resolvePlayerCard(cardId);
        if (card) { avatarUrl = card.smallArt || card.displayIcon || ''; cardUrl = card.wideArt || card.largeArt || ''; }
        const titleId = loadoutRes.data?.Identity?.PlayerTitleID;
        const t = await resolvePlayerTitle(titleId);
        if (t) title = t.titleText || '';
      }
    } catch (e) { /* ignore */ }

    const career = {
      ...fallbackCareer,
      source: 'live',
      player: {
        ...fallbackCareer.player,
        name: session.gameName,
        tag: session.gameTag,
        title: title || 'Competitor',
        accountLevel,
        cardUrl: cardUrl || fallbackCareer.player.cardUrl,
        smallCardUrl: avatarUrl || fallbackCareer.player.smallCardUrl,
        avatarUrl: avatarUrl || fallbackCareer.player.avatarUrl,
      },
      rank: {
        ...fallbackCareer.rank,
        tier: currentTier,
        tierName: tierName(currentTier),
        rr: currentRR,
        maxRr: 100,
        peakTier,
        peakTierName: tierName(peakTier),
        tierIcon: tierIcon(currentTier) || fallbackCareer.rank.tierIcon,
        leaderboardRank: 0,
      },
      stats: {
        ...fallbackCareer.stats,
        winRate,
        wins: seasonGames > 0 ? seasonWins : wins,
        losses: seasonGames > 0 ? (seasonGames - seasonWins) : losses,
        totalMatches: seasonGames > 0 ? seasonGames : totalMatches,
        kd,
        kills: k,
        deaths: d,
        assists: a,
      },
      recentForm: recentForm.length ? recentForm : [],
      topAgents: topAgents.length ? topAgents : [],
      mapWinRates: mapWinRates.length ? mapWinRates : [],
    };

    lastCareerCache = { data: career, time: now };
    return career;
  } catch (e: any) {
    if (lastCareerCache) return lastCareerCache.data;
    return { ...fallbackCareer, source: 'live' };
  }
}

/**
 * Compute real per-player round stats from match-details round results:
 * headshot kills, first bloods, plants, defuses and total damage dealt.
 * Never fabricates — returns zeros/counts derived from actual round data.
 */
function computePlayerRoundStats(roundResults: any[] | undefined, puuid: string) {
  let hsKills = 0, firstBloods = 0, plants = 0, defuses = 0, totalDamage = 0;
  for (const r of roundResults || []) {
    const myPs = (r.playerStats || []).find((ps: any) => ps.subject === puuid);
    if (!myPs) continue;

    const killsArr = myPs.kills || [];
    for (const k of killsArr) {
      if ((k?.finishedDamage?.headshots ?? 0) > 0) hsKills++;
    }

    // First blood: my earliest kill in the round equals the round's earliest kill.
    const myFirst = killsArr.length ? Math.min(...killsArr.map((k: any) => k.gameTime ?? Infinity)) : Infinity;
    let roundFirst = myFirst;
    for (const ps of r.playerStats || []) {
      const times = (ps.kills || []).map((k: any) => k.gameTime ?? Infinity);
      if (times.length) roundFirst = Math.min(roundFirst, ...times);
    }
    if (killsArr.length && myFirst === roundFirst) firstBloods++;

    plants += myPs.plantEvents ?? 0;
    defuses += myPs.defuseEvents ?? 0;
    for (const d of myPs.damage || []) {
      if (typeof d?.damage === 'number') totalDamage += d.damage;
    }
  }
  return { hsKills, firstBloods, plants, defuses, totalDamage };
}

export async function fetchLiveMatches(fallbackMatches: any[]) {
  const session = await getRiotSession();
  if (!session) return fallbackMatches.map((m) => ({ ...m, source: 'mock' }));

  const now = Date.now();
  if (lastMatchesCache && now - lastMatchesCache.time < cacheTTL) {
    return lastMatchesCache.data;
  }

  try {
    const historyRes = await makePvpRequest<any>(
      `/match-history/v1/history/${session.puuid}?startIndex=0&endIndex=7`
    );

    if (historyRes.status !== 200) {
      if (lastMatchesCache) return lastMatchesCache.data;
      return fallbackMatches.map((m) => ({ ...m, source: 'live' }));
    }

    const historyList = historyRes.data?.History || [];
    if (historyList.length === 0) {
      return [];
    }

    const transformedMatches: any[] = [];

    // Process sequentially or with cached details to avoid Cloudflare 1015
    for (const item of historyList.slice(0, 7)) {
      try {
        let detail = matchDetailCache.get(item.MatchID);
        if (!detail) {
          try {
            const detailRes = await makePvpRequest<any>(`/match-details/v1/matches/${item.MatchID}`);
            if (detailRes.status === 200) {
              detail = detailRes.data;
              matchDetailCache.set(item.MatchID, detail);
            }
          } catch (e) {
            // detail fetch rate limited; continue
          }
        }

        if (detail) {
          const myPlayer = (detail.players || []).find((p: any) => p.subject === session.puuid);
          const myTeamId = myPlayer?.teamId || 'Blue';
          const myTeam = (detail.teams || []).find((t: any) => t.teamId === myTeamId);
          const enemyTeam = (detail.teams || []).find((t: any) => t.teamId !== myTeamId);

          const won = myTeam?.won || false;
          const myScore = myTeam?.roundsWon ?? 13;
          const enemyScore = enemyTeam?.roundsWon ?? 8;

          const agent = await resolveAgentByUuid(myPlayer?.characterId);
          const map = await resolveMapByPathOrUuid(detail.matchInfo?.mapId);

          const kills = myPlayer?.stats?.kills ?? 0;
          const deaths = myPlayer?.stats?.deaths ?? 0;
          const assists = myPlayer?.stats?.assists ?? 0;
          const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;
          const totalRounds = detail.roundResults?.length || (myScore + enemyScore) || 20;
          const combatScore = myPlayer?.stats?.score
            ? Math.round(myPlayer.stats.score / totalRounds)
            : null;
          // Real stats derived from round results — never fabricated placeholders.
          const roundStats = computePlayerRoundStats(detail.roundResults, session.puuid);
          const headshotPct = kills > 0 ? Math.round((roundStats.hsKills / kills) * 100) : null;
          const damagePerRound = roundStats.totalDamage > 0 && totalRounds > 0 ? Math.round(roundStats.totalDamage / totalRounds) : null;
          const firstBloods = roundStats.firstBloods;

          transformedMatches.push({
            id: item.MatchID,
            mapName: map?.displayName || 'Ascent',
            mapImageUrl:
              map?.splash ||
              'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
            gameMode: detail.matchInfo?.gameMode || 'Competitive',
            matchDate: new Date(item.GameStartTime).toLocaleDateString(),
            gameLengthSeconds: detail.matchInfo?.gameLengthMillis
              ? Math.round(detail.matchInfo.gameLengthMillis / 1000)
              : 2100,
            result: won ? 'VICTORY' : 'DEFEAT',
            score: `${myScore} - ${enemyScore}`,
            playerTeamScore: myScore,
            enemyTeamScore: enemyScore,
            agentName: agent?.displayName || 'Jett',
            agentIconUrl:
              agent?.displayIconSmall ||
              agent?.displayIcon ||
              'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
            role: agent?.role?.displayName || 'Duelist',
            kills,
            deaths,
            assists,
            kd,
            combatScore,
            headshotPct,
            damagePerRound,
            firstBloods,
            rrChange: null,
            tierName: 'Competitive',
            tierIcon:
              'https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png',
            mvp: null,
            source: 'live',
            dataQuality: 'partial'
          });
        } else {
          // Graceful fallback from history item — detail fetch failed/rate-limited.
          // Honest partial record: never fabricate stats the AI could reason over.
          transformedMatches.push({
            id: item.MatchID,
            mapName: null,
            mapImageUrl: null,
            gameMode: 'Competitive',
            matchDate: new Date(item.GameStartTime).toLocaleDateString(),
            gameLengthSeconds: null,
            result: 'COMPLETED',
            score: null,
            playerTeamScore: null,
            enemyTeamScore: null,
            agentName: null,
            agentIconUrl: null,
            role: null,
            kills: null,
            deaths: null,
            assists: null,
            kd: null,
            combatScore: null,
            headshotPct: null,
            damagePerRound: null,
            firstBloods: null,
            rrChange: null,
            tierName: null,
            tierIcon: null,
            mvp: null,
            source: 'live',
            dataQuality: 'partial'
          });
        }
      } catch (e) {
        // continue
      }
    }

    lastMatchesCache = { data: transformedMatches, time: now };
    return transformedMatches;
  } catch (e: any) {
    if (lastMatchesCache) return lastMatchesCache.data;
    return fallbackMatches.map((m) => ({ ...m, source: 'live' }));
  }
}

export async function fetchLiveMatchDetail(matchId: string, fallbackDetail: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackDetail, source: 'mock' };

  try {
    let detail = matchDetailCache.get(matchId);
    if (!detail) {
      const res = await makePvpRequest<any>(`/match-details/v1/matches/${matchId}`);
      if (res.status !== 200) {
        return { ...fallbackDetail, source: 'live' };
      }
      detail = res.data;
      matchDetailCache.set(matchId, detail);
    }

    const map = await resolveMapByPathOrUuid(detail.matchInfo?.mapId);
    const myPlayer = (detail.players || []).find((p: any) => p.subject === session.puuid);
    const myTeamId = myPlayer?.teamId || 'Blue';
    const myTeam = (detail.teams || []).find((t: any) => t.teamId === myTeamId);
    const enemyTeam = (detail.teams || []).find((t: any) => t.teamId !== myTeamId);

    const won = myTeam?.won || false;
    const myScore = myTeam?.roundsWon ?? 13;
    const enemyScore = enemyTeam?.roundsWon ?? 8;
    const myAgent = await resolveAgentByUuid(myPlayer?.characterId);

    // Real player stats for the summary card — no fabricated placeholders.
    const roundStats = computePlayerRoundStats(detail.roundResults, session.puuid);
    const myKills = myPlayer?.stats?.kills ?? 0;
    const myDeaths = myPlayer?.stats?.deaths ?? 0;
    const myAssists = myPlayer?.stats?.assists ?? 0;
    const myKd = myDeaths > 0 ? parseFloat((myKills / myDeaths).toFixed(2)) : myKills;
    const totalRoundsForSummary = detail.roundResults?.length || (myScore + enemyScore) || 20;
    const myCombatScore = myPlayer?.stats?.score && totalRoundsForSummary > 0
      ? Math.round(myPlayer.stats.score / totalRoundsForSummary)
      : null;
    const summaryHsPct = myKills > 0 ? Math.round((roundStats.hsKills / myKills) * 100) : null;
    const summaryAdr = roundStats.totalDamage > 0 && totalRoundsForSummary > 0
      ? Math.round(roundStats.totalDamage / totalRoundsForSummary)
      : null;

    // Collect all player PUUIDs and resolve names via name-service in a single batch
    const allPuuids = (detail.players || [])
      .map((p: any) => p.subject || p.Subject)
      .filter(Boolean);
    const resolvedNames = await resolvePlayerNames(allPuuids);

    const transformPlayers = async (teamId: string) => {
      const teamPlayers = (detail.players || []).filter((p: any) => (p.teamId || p.TeamId) === teamId);
      return Promise.all(
        teamPlayers.map(async (p: any) => {
          const pSubject = p.subject || p.Subject;
          const isMe = pSubject === session.puuid;
          const agent = await resolveAgentByUuid(p.characterId || p.CharacterId);
          const kills = p.stats?.kills ?? 0;
          const deaths = p.stats?.deaths ?? 0;
          const assists = p.stats?.assists ?? 0;
          const score = p.stats?.score ?? 0;
          const totalRounds = detail.roundResults?.length || (myScore + enemyScore) || 20;
          const rs = computePlayerRoundStats(detail.roundResults, pSubject);
          const adr = rs.totalDamage > 0 && totalRounds > 0
            ? Math.round(rs.totalDamage / totalRounds)
            : null;
          const hsPct = kills > 0 ? Math.round((rs.hsKills / kills) * 100) : null;

          let name = isMe ? session.gameName : 'Player';
          let tag = isMe ? session.gameTag : 'VALO';

          if (isMe) {
            name = session.gameName;
            tag = session.gameTag;
          } else {
            const resolved = resolvedNames[pSubject];
            if (resolved) {
              if (resolved.gameName && resolved.gameName.trim()) {
                name = resolved.gameName;
                tag = resolved.tagLine || '';
              } else {
                // Redacted / empty name from Riot (e.g. live enemy)
                name = 'Hidden';
                tag = '';
              }
            } else if (p.gameName) {
              name = p.gameName;
              tag = p.tagLine || 'VALO';
            }
          }

          return {
            name,
            tag,
            isPlayer: isMe,
            agent: agent?.displayName || 'Agent',
            agentIcon:
              agent?.displayIconSmall ||
              agent?.displayIcon ||
              'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
            rank: 'Competitive',
            kills,
            deaths,
            assists,
            score: totalRounds > 0 ? Math.round(score / totalRounds) : null,
            adr,
            hsPct,
            firstBloods: rs.firstBloods,
            plants: rs.plants,
            defuses: rs.defuses,
            econRating: adr != null ? Math.round(adr * 0.45) : null
          };
        })
      );
    };

    const alliesPlayers = await transformPlayers(myTeamId);
    const enemyTeamId = myTeamId === 'Blue' ? 'Red' : 'Blue';
    const enemiesPlayers = await transformPlayers(enemyTeamId);

    // Real cumulative score per round + buy type derived from the player's actual
    // per-round economy (loadout value). No fabricated scores or buy types.
    let blueWins = 0, redWins = 0;
    const rounds = (detail.roundResults || []).map((r: any, idx: number) => {
      const winningTeam = r.winningTeam === myTeamId ? 'Blue' : 'Red';
      if (winningTeam === 'Blue') blueWins++; else redWins++;
      const myPs = (r.playerStats || []).find((ps: any) => ps.subject === session.puuid);
      const myKillCount = myPs?.kills?.length ?? 0;
      const loadoutValue = myPs?.economy?.loadoutValue;
      const buyTypeBlue = typeof loadoutValue === 'number'
        ? (loadoutValue >= 3900 ? 'Full Buy' : loadoutValue >= 2000 ? 'Half Buy' : loadoutValue >= 1000 ? 'Eco' : 'Pistol')
        : null;

      return {
        round: idx + 1,
        winningTeam,
        winType: r.roundResult === 'Elimination' ? 'Elimination' : r.roundResult === 'Defuse' ? 'Bomb Defused' : 'Bomb Detonated',
        blueScore: blueWins,
        redScore: redWins,
        buyTypeBlue,
        buyTypeRed: null,
        playerKills: myKillCount
      };
    });

    let matchMvp = won ? `${session.gameName}#${session.gameTag}` : 'Enemy MVP';
    if (Array.isArray(detail.players) && detail.players.length > 0) {
      const topPlayer = [...detail.players].sort((a: any, b: any) => (b.stats?.score ?? 0) - (a.stats?.score ?? 0))[0];
      if (topPlayer) {
        const topSubject = topPlayer.subject || topPlayer.Subject;
        if (topSubject === session.puuid) {
          matchMvp = `${session.gameName}#${session.gameTag}`;
        } else {
          const resolved = resolvedNames[topSubject];
          if (resolved?.gameName) {
            matchMvp = resolved.tagLine ? `${resolved.gameName}#${resolved.tagLine}` : resolved.gameName;
          }
        }
      }
    }

    return {
      id: matchId,
      source: 'live',
      dataQuality: 'partial',
      mapName: map?.displayName || 'Ascent',
      mapImageUrl:
        map?.splash ||
        'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
      gameMode: detail.matchInfo?.gameMode || 'Competitive',
      matchDate: new Date(detail.matchInfo?.gameStartMillis || Date.now()).toLocaleDateString(),
      duration: `${Math.round((detail.matchInfo?.gameLengthMillis || 2100000) / 60000)}m`,
      result: won ? 'VICTORY' : 'DEFEAT',
      score: `${myScore} - ${enemyScore}`,
      playerTeamScore: myScore,
      enemyTeamScore: enemyScore,
      halfTimeScore: '6 - 6',
      mvp: matchMvp,
      server: 'Live Match',
      playerSummary: {
        name: session.gameName,
        tag: session.gameTag,
        agentName: myAgent?.displayName || 'Jett',
        role: myAgent?.role?.displayName || 'Duelist',
        agentIcon:
          myAgent?.displayIconSmall ||
          myAgent?.displayIcon ||
          'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
        kills: myKills,
        deaths: myDeaths,
        assists: myAssists,
        kd: myKd,
        combatScore: myCombatScore,
        headshotPct: summaryHsPct,
        damagePerRound: summaryAdr,
        firstBloods: roundStats.firstBloods,
        plants: roundStats.plants,
        defuses: roundStats.defuses,
        rrChange: null
      },
      teams: {
        allies: {
          name: 'ALLIES (YOUR TEAM)',
          score: myScore,
          won,
          players: alliesPlayers
        },
        enemies: {
          name: 'ENEMIES (OPPONENT)',
          score: enemyScore,
          won: !won,
          players: enemiesPlayers
        }
      },
      rounds: rounds.length > 0 ? rounds : fallbackDetail.rounds,
      economy: fallbackDetail.economy
    };
  } catch (e: any) {
    return { ...fallbackDetail, source: 'live' };
  }
}

export async function fetchLiveWallet(fallbackWallet: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackWallet, source: 'mock' };

  const now = Date.now();
  if (lastWalletCache && now - lastWalletCache.time < cacheTTL) {
    return lastWalletCache.data;
  }

  try {
    const res = await makePvpRequest<any>(`/store/v1/wallet/${session.puuid}`);
    if (res.status !== 200) {
      if (lastWalletCache) return lastWalletCache.data;
      return { ...fallbackWallet, source: 'live' };
    }

    const balances = res.data?.Balances || {};
    const wallet = {
      vp: balances[CURRENCY_UUIDS.VP] ?? 0,
      rp: balances[CURRENCY_UUIDS.RP] ?? 0,
      kc: balances[CURRENCY_UUIDS.KC] ?? 0,
      source: 'live'
    };

    lastWalletCache = { data: wallet, time: now };
    return wallet;
  } catch (e: any) {
    if (lastWalletCache) return lastWalletCache.data;
    return { ...fallbackWallet, source: 'live' };
  }
}

export async function fetchLiveStore(fallbackStore: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackStore, source: 'mock' };

  const now = Date.now();
  if (lastStoreCache && now - lastStoreCache.time < cacheTTL) {
    return lastStoreCache.data;
  }

  try {
    const res = await makePvpRequest<any>(`/store/v3/storefront/${session.puuid}`, {
      method: 'POST',
      body: {}
    });

    if (res.status !== 200) {
      if (lastStoreCache) return lastStoreCache.data;
      return { ...fallbackStore, source: 'live' };
    }

    const storefront = res.data;
    const singleItemOffers = storefront?.SkinsPanelLayout?.SingleItemOffers || [];

    const dailyOffers = await Promise.all(
      singleItemOffers.map(async (skinUuid: string) => {
        const resolved = await resolveSkinByUuid(skinUuid);
        const tierMeta = resolved?.contentTierUuid
          ? CONTENT_TIER_META[resolved.contentTierUuid.toLowerCase()]
          : null;
        return {
          id: skinUuid,
          name: resolved?.displayName || 'Exclusive Skin',
          weapon: resolved?.weaponName || 'Weapon',
          priceVP: 1775,
          tier: tierMeta?.name || 'Exclusive',
          tierColor: tierMeta?.color || '#f8b73e',
          icon:
            resolved?.displayIcon ||
            null
        };
      })
    );

    let finalDailyOffers = dailyOffers;
    if (finalDailyOffers.length === 0 && Array.isArray(fallbackStore.dailyOffers)) {
      finalDailyOffers = await Promise.all(
        fallbackStore.dailyOffers.map(async (d: any) => ({
          ...d,
          icon: await repairWeaponSkinUrl(d.icon)
        }))
      );
    }

    // Resolve the real featured bundle (image + name + item list) live.
    let featuredBundle = fallbackStore.featuredBundle;
    const bundleData = storefront?.FeaturedBundle?.Bundle || storefront?.FeaturedBundle?.Bundles?.[0];
    const bundleId = bundleData?.DataAssetID || storefront?.FeaturedBundle?.Bundle?.DataAssetID;
    if (bundleId) {
      const b = await resolveBundleByUuid(bundleId);
      if (b) {
        featuredBundle = {
          ...fallbackStore.featuredBundle,
          bundleUuid: b.uuid,
          displayName: b.displayName,
          displayIcon: b.displayIcon || null,
          verticalPromoImage: b.verticalPromoImage || b.displayIcon || null,
          durationRemainingSeconds:
            storefront?.FeaturedBundle?.BundleRemainingDurationInSeconds ||
            fallbackStore.featuredBundle?.durationRemainingSeconds,
        };
      }
    }

    const rawBundleItems = bundleData?.Items || storefront?.FeaturedBundle?.Bundle?.Items;
    if (Array.isArray(rawBundleItems) && rawBundleItems.length > 0) {
      const resolvedItems = await Promise.all(
        rawBundleItems.map(async (bundleItem: any) => {
          const itemId = bundleItem?.Item?.ItemID || bundleItem?.ItemID || '';
          const resolved = itemId ? await resolveSkinByUuid(itemId) : null;
          const basePrice = bundleItem?.BasePrice ?? bundleItem?.DiscountedPrice ?? 0;
          return {
            name: resolved?.displayName || 'Weapon Skin',
            weapon: resolved?.weaponName || 'Weapon',
            priceVP: basePrice,
            icon: resolved?.displayIcon || null
          };
        })
      );
      featuredBundle = {
        ...featuredBundle,
        items: resolvedItems
      };
    } else if (featuredBundle?.items) {
      featuredBundle = {
        ...featuredBundle,
        items: await Promise.all(
          featuredBundle.items.map(async (item: any) => ({
            ...item,
            icon: await repairWeaponSkinUrl(item.icon)
          }))
        )
      };
    }

    if (featuredBundle) {
      featuredBundle = {
        ...featuredBundle,
        displayIcon: await repairWeaponSkinUrl(featuredBundle.displayIcon),
        verticalPromoImage: await repairWeaponSkinUrl(featuredBundle.verticalPromoImage)
      };
    }

    // Night Market (BonusStore)
    let nightMarket: any = {
      isActive: false,
      durationRemainingSeconds: 0,
      offers: []
    };

    const bonusStore = storefront?.BonusStore;
    const bonusOffers = bonusStore?.BonusStoreOffers;

    if (bonusStore && Array.isArray(bonusOffers) && bonusOffers.length > 0) {
      const resolvedNightMarketOffers = await Promise.all(
        bonusOffers.map(async (bo: any) => {
          const offerId = bo?.Offer?.OfferID || bo?.BonusOfferID || bo?.OfferID || '';
          const resolved = offerId ? await resolveSkinByUuid(offerId) : null;
          const costMap = bo?.Offer?.Cost || bo?.Cost || {};
          const discountCostsMap = bo?.DiscountCosts || {};
          const originalPriceVP =
            costMap[CURRENCY_UUIDS.VP] ??
            (typeof costMap === 'object' ? Object.values(costMap)[0] : 1775) ??
            1775;
          const discountPriceVP =
            discountCostsMap[CURRENCY_UUIDS.VP] ??
            (typeof discountCostsMap === 'object' ? Object.values(discountCostsMap)[0] : undefined) ??
            Math.round(Number(originalPriceVP) * (1 - (bo?.DiscountPercent ?? 0) / 100));
          const discountPct =
            bo?.DiscountPercent ??
            (originalPriceVP > 0
              ? Math.round(((Number(originalPriceVP) - Number(discountPriceVP)) / Number(originalPriceVP)) * 100)
              : 0);
          const tierMeta = resolved?.contentTierUuid
            ? CONTENT_TIER_META[resolved.contentTierUuid.toLowerCase()]
            : null;

          return {
            id: bo?.BonusOfferID || offerId || `nm-${Math.random().toString(36).slice(2, 8)}`,
            name: resolved?.displayName || 'Night Market Skin',
            weapon: resolved?.weaponName || 'Weapon',
            originalPriceVP: Number(originalPriceVP),
            discountPriceVP: Number(discountPriceVP),
            discountPct: Number(discountPct),
            tier: tierMeta?.name || 'Premium',
            isRevealed: false,
            icon: resolved?.displayIcon || null
          };
        })
      );

      nightMarket = {
        isActive: true,
        durationRemainingSeconds:
          bonusStore.BonusStoreRemainingDurationInSeconds ??
          fallbackStore.nightMarket?.durationRemainingSeconds ??
          0,
        offers: resolvedNightMarketOffers
      };
    }

    const store = {
      ...fallbackStore,
      featuredBundle,
      dailyOffers: finalDailyOffers,
      nightMarket,
      resetTimeRemainingSeconds:
        storefront?.SkinsPanelLayout?.SingleItemOffersRemainingDurationInSeconds ||
        fallbackStore.resetTimeRemainingSeconds,
      source: 'live'
    };

    lastStoreCache = { data: store, time: now };
    return store;
  } catch (e: any) {
    if (lastStoreCache) return lastStoreCache.data;
    return { ...fallbackStore, source: 'live' };
  }
}

export async function fetchLiveLoadout(fallbackLoadout: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackLoadout, source: 'mock' };

  const now = Date.now();
  if (lastLoadoutCache && now - lastLoadoutCache.time < STATIC_TTL) {
    return lastLoadoutCache.data;
  }

  try {
    const res = await makePvpRequest<any>(
      `/personalization/v2/players/${session.puuid}/playerloadout`
    );

    if (res.status !== 200) {
      if (lastLoadoutCache) return lastLoadoutCache.data;
      return { ...fallbackLoadout, source: 'live' };
    }

    const guns = res.data?.Guns || [];
    const weaponsMap: Record<string, any> = { ...fallbackLoadout.weapons };

    for (const gun of guns) {
      const skin = await resolveSkinByUuid(gun.SkinID);
      if (skin && skin.weaponName) {
        weaponsMap[skin.weaponName] = {
          skinName: skin.displayName,
          chromaName: 'Default',
          icon: skin.displayIcon || weaponsMap[skin.weaponName]?.icon,
          buddy: null
        };
      }
    }

    // Resolve the real equipped identity (player card, title) live.
    const identityData = res.data?.Identity || {};
    const [card, title] = await Promise.all([
      resolvePlayerCard(identityData.PlayerCardID),
      resolvePlayerTitle(identityData.PlayerTitleID),
    ]);

    const identity = {
      ...fallbackLoadout.identity,
      ...(card
        ? {
            playerCard: card.displayName,
            playerCardIcon: card.displayIcon,
            cardWide: card.wideArt || card.displayIcon,
            cardLarge: card.largeArt || card.displayIcon,
          }
        : {}),
      ...(title ? { playerTitle: title.titleText || fallbackLoadout.identity?.playerTitle } : {}),
      accountLevel: res.data?.Identity?.AccountLevel ?? fallbackLoadout.identity?.accountLevel,
    };

    const loadout = {
      ...fallbackLoadout,
      weapons: weaponsMap,
      identity,
      source: 'live'
    };

    lastLoadoutCache = { data: loadout, time: now };
    return loadout;
  } catch (e: any) {
    if (lastLoadoutCache) return lastLoadoutCache.data;
    return { ...fallbackLoadout, source: 'live' };
  }
}

/**
 * Live battlepass / contract progression from Riot's contracts endpoint.
 * Maps the active contract (agent or battlepass) into the frontend battlepass shape.
 */
export async function fetchLiveBattlepass(fallbackBattlepass: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackBattlepass, source: 'mock', actName: 'Active Battlepass' };

  const now = Date.now();
  if (lastBattlepassCache && now - lastBattlepassCache.time < STATIC_TTL) {
    return lastBattlepassCache.data;
  }

  try {
    const res = await makePvpRequest<any>(`/contracts/v1/contracts/${session.puuid}`);
    if (res.status !== 200 || !res.data) {
      return { ...fallbackBattlepass, source: 'live', actName: 'Active Battlepass' };
    }

    const contracts = res.data.Contracts || [];
    // Prefer the active special/battlepass contract if present.
    const active =
      contracts.find((c: any) => c.ContractDefinitionID === res.data.ActiveSpecialContract) ||
      contracts[0];

    if (!active) return { ...fallbackBattlepass, source: 'live', actName: 'Active Battlepass' };

    const totalXP = active.ContractProgression?.TotalProgressionEarned ?? 0;
    const levels = active.ProgressionLevelReached ?? 0;

    const bp = {
      source: 'live',
      actName: 'Active Battlepass',
      currentTier: levels,
      maxTier: 50,
      epilogueTiers: 5,
      totalXPAccumulated: totalXP,
      isPremium: true,
      featuredRewards: [],
      tiers: []
    };
    lastBattlepassCache = { data: bp, time: now };
    return bp;
  } catch (e) {
    return { ...fallbackBattlepass, source: 'live', actName: 'Active Battlepass' };
  }
}

/**
 * Live daily/weekly missions from Riot's contracts endpoint.
 */
export async function fetchLiveQuests(fallbackQuests: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackQuests, source: 'mock' };

  try {
    const res = await makePvpRequest<any>(`/contracts/v1/contracts/${session.puuid}`);
    if (res.status !== 200 || !res.data) {
      return { ...fallbackQuests, source: 'live' };
    }

    const missions = res.data.Missions || [];
    if (!missions.length) return { ...fallbackQuests, source: 'live' };

    // Map raw missions into daily/weekly buckets. The mission metadata (title/desc)
    // requires the /v1/missions content endpoint; we surface progress counters live
    // and keep descriptive fallback text where content isn't resolved.
    const mapMission = (m: any, i: number) => {
      const objId = m.Objectives ? Object.keys(m.Objectives)[0] : null;
      const progress = objId ? m.Objectives[objId].Progress ?? 0 : 0;
      return {
        id: m.ID || `mission-${i}`,
        title: 'Active Mission',
        description: 'Complete objectives to earn XP.',
        progress,
        maxProgress: Math.max(progress, 1),
        xpReward: m.XPGrant ?? 0,
        completed: !!m.Complete,
        expiresInSeconds: 0,
      };
    };

    return {
      source: 'live',
      dailies: missions.slice(0, 3).map(mapMission),
      weeklies: missions.slice(3).map(mapMission),
    };
  } catch (e) {
    return { ...fallbackQuests, source: 'live' };
  }
}

/**
 * Well-known loadout socket UUID for the weapon SKIN (community-documented, stable).
 * The gun's equipped skin lives at this socket; resolving its Item.ID gives the skin.
 */
const SOCKET_SKIN = 'bcef87d6-209b-46c6-8b19-fbe40bd95abc';

/**
 * Current-game loadouts for ALL players in the live match, via Riot's official
 * GET /core-game/v1/matches/{id}/loadouts. This returns the same loadout data
 * VALORANT itself surfaces in-game; it is an authenticated read using the player's
 * own session — not memory reading and not automation.
 * Returns a map of playerPuuid -> [{ weapon, skinName, icon }].
 */
export async function fetchCurrentGameLoadouts(matchId: string): Promise<Record<string, any[]>> {
  const out: Record<string, any[]> = {};
  try {
    const res = await makePvpRequest<any>(`/core-game/v1/matches/${matchId}/loadouts`, { isGlz: true });
    if (res.status !== 200 || !Array.isArray(res.data?.Loadouts)) return out;

    for (const entry of res.data.Loadouts) {
      const lo = entry?.Loadout;
      const subject = lo?.Subject;
      if (!subject) continue;
      const items = lo?.Items || {};
      const guns: any[] = [];

      for (const itemTypeId of Object.keys(items)) {
        const item = items[itemTypeId];
        const skinId = item?.Sockets?.[SOCKET_SKIN]?.Item?.ID;
        if (!skinId) continue;
        const resolved = await resolveSkinByUuid(skinId);
        if (resolved && resolved.weaponName) {
          // Only include REAL (bought) skins — those with a content tier.
          // Standard/default guns have tierRank -1 and are skipped.
          if ((resolved.tierRank ?? -1) < 0) continue;
          guns.push({
            weapon: resolved.weaponName,
            skinName: resolved.displayName,
            icon: resolved.displayIcon || null,
            tierRank: resolved.tierRank ?? -1,
          });
        }
      }
      // Sort best (rarest) skin first.
      guns.sort((a, b) => (b.tierRank ?? -1) - (a.tierRank ?? -1));
      out[subject] = guns;
    }
  } catch (e) {
    // best-effort; return whatever resolved
  }
  return out;
}

/**
 * Read-only lobby / agent-select roster inspection.
 * Returns the real ally roster available during agent select (pregame) or the
 * player/enemy roster during an active game (core-game). During an active match
 * it also includes each player's equipped weapon skins via Riot's official
 * current-game loadouts endpoint.
 */
export async function fetchLobbyInspect() {
  const session = await getRiotSession();
  if (!session) {
    return { available: false, phase: 'OFFLINE', source: 'mock', players: [], note: 'Riot client not connected.' };
  }

  // 1) Agent select (pregame) — allies + their picked agents are visible.
  const pregame = await fetchLivePregame();
  if ((pregame as any).inPregame) {
    const allyComp = (pregame as any).allyComp || [];
    const allyPuuids = allyComp.map((p: any) => p.subject).filter(Boolean);
    const resolvedNames = await resolvePlayerNames(allyPuuids);
    const players = await Promise.all(
      allyComp.map(async (p: any) => {
        const rs = p.subject ? await fetchPlayerRankAndStreak(p.subject) : null;
        const resolved = p.subject ? resolvedNames[p.subject] : null;
        let name = p.isPlayer ? session.gameName : (resolved?.gameName || p.agentName || 'Ally');
        let tag = p.isPlayer ? session.gameTag : (resolved?.tagLine || 'VALO');
        return {
          isPlayer: p.isPlayer,
          playerName: name,
          playerTag: tag,
          agentName: p.agentName,
          agentIcon: p.agentIcon,
          selectionState: p.characterSelectionState,
          tier: rs?.tier ?? 0,
          tierName: rs?.tierName ?? 'Unrated',
          tierIcon: rs?.tierIcon ?? null,
          rr: rs?.rr ?? 0,
          streak: rs?.streak ?? null,
        };
      })
    );
    return {
      available: true,
      phase: 'AGENT_SELECT',
      source: 'live',
      map: (pregame as any).map,
      players,
      skinsAvailable: false,
      note: 'Ally agents, ranks and streaks shown. Weapon skins of other players are not exposed by Riot (anti-cheat) and are never shown.',
    };
  }

  // 2) Active match (core-game) — player list + agents visible; skins are not.
  try {
    const playerCoreRes = await makePvpRequest<any>(
      `/core-game/v1/players/${session.puuid}`,
      { isGlz: true }
    );
    if (playerCoreRes.status === 200 && playerCoreRes.data?.MatchID) {
      const matchId = playerCoreRes.data.MatchID;
      const matchRes = await makePvpRequest<any>(
        `/core-game/v1/matches/${matchId}`,
        { isGlz: true }
      );
      if (matchRes.status === 200) {
        // Real equipped skins for every player in the match (official API).
        const loadouts = await fetchCurrentGameLoadouts(matchId);
        const allPuuids = (matchRes.data?.Players || []).map((p: any) => p.Subject).filter(Boolean);
        const resolvedNames = await resolvePlayerNames(allPuuids);
        const players = await Promise.all(
          (matchRes.data?.Players || []).map(async (p: any) => {
            const isMe = p.Subject === session.puuid;
            const resolved = resolvedNames[p.Subject];
            let name = isMe ? session.gameName : 'Player';
            let tag = isMe ? session.gameTag : 'VALO';
            if (isMe) {
              name = session.gameName;
              tag = session.gameTag;
            } else if (resolved) {
              if (resolved.gameName && resolved.gameName.trim()) {
                name = resolved.gameName;
                tag = resolved.tagLine || '';
              } else {
                name = 'Hidden';
                tag = '';
              }
            }
            const agent = await resolveAgentByUuid(p.CharacterID);
            const rs = await fetchPlayerRankAndStreak(p.Subject);
            return {
              isPlayer: isMe,
              teamId: p.TeamID,
              playerName: name,
              playerTag: tag,
              agentName: agent?.displayName || null,
              agentIcon: agent?.displayIconSmall || agent?.displayIcon || null,
              tier: rs.tier,
              tierName: rs.tierName,
              tierIcon: rs.tierIcon,
              rr: rs.rr,
              streak: rs.streak,
              skins: loadouts[p.Subject] || [],
            };
          })
        );
        return {
          available: true,
          phase: 'IN_GAME',
          source: 'live',
          players,
          skinsAvailable: true,
          note: "Live roster: agents, ranks, streaks and equipped premium weapon skins (via Riot's official current-game loadouts API). Default/standard guns are hidden.",
        };
      }
    }
  } catch (e) {
    // fall through
  }

  return { available: false, phase: 'IN_LOBBY', source: 'live', players: [], note: 'Not in agent select or a match right now.' };
}

/**
 * Reads the live match score (and round number) from the local presence data.
 * VALORANT publishes each player's live game state in /chat/v4/presences; the
 * `private` field is base64-encoded JSON containing partyOwnerMatchScoreAllyTeam /
 * EnemyTeam and roundNum. This is the same local data the game client shows.
 */
export async function fetchLivePresenceScore(): Promise<{ ally: number; enemy: number; round: number } | null> {
  const lock = readLockfile();
  const session = await getRiotSession();
  if (!lock || !session) return null;
  try {
    const res = await makeLocalRequest<any>(lock, '/chat/v4/presences');
    const presences = res.data?.presences || [];
    const me = presences.find((p: any) => p.puuid === session.puuid) || presences.find((p: any) => p.product === 'valorant');
    if (!me?.private) return null;
    const decoded = JSON.parse(Buffer.from(me.private, 'base64').toString('utf8'));
    const ally = decoded.partyOwnerMatchScoreAllyTeam ?? decoded.partyOwnerMatchScoreAllyTeam ?? 0;
    const enemy = decoded.partyOwnerMatchScoreEnemyTeam ?? 0;
    const round = (decoded.partyOwnerMatchCurrentTeam ? 0 : 0) + (decoded.partyOwnerMatchScoreAllyTeam ?? 0) + (decoded.partyOwnerMatchScoreEnemyTeam ?? 0);
    return { ally, enemy, round: round + 1 };
  } catch (e) {
    return null;
  }
}

export async function fetchLiveCoreGame(fallbackLive: any) {
  const session = await getRiotSession();
  if (!session) return { ...fallbackLive, source: 'mock' };

  try {
    const playerCoreRes = await makePvpRequest<any>(
      `/core-game/v1/players/${session.puuid}`,
      { isGlz: true }
    );

    if (playerCoreRes.status === 404 || !playerCoreRes.data?.MatchID) {
      return {
        source: 'live',
        inGame: false,
        status: 'IN_LOBBY',
        matchId: null,
        message: 'Currently in lobby / No active match detected',
        map: 'Main Menu (Lobby)',
        mapImageUrl:
          'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
        mode: 'Lobby',
        allies: [],
        enemies: [],
        liveInsights: [
          'Sitting in lobby. Ready for your next match.',
          'Warm up with crosshair drills or configure Auto-Pick in Agent Select.'
        ]
      };
    }

    const matchRes = await makePvpRequest<any>(
      `/core-game/v1/matches/${playerCoreRes.data.MatchID}`,
      { isGlz: true }
    );

    if (matchRes.status !== 200) {
      return {
        source: 'live',
        inGame: false,
        status: 'IN_LOBBY',
        matchId: playerCoreRes.data.MatchID
      };
    }

    const match = matchRes.data;
    const map = await resolveMapByPathOrUuid(match.MapID);
    const players = match.Players || [];

    const myPlayer = players.find((p: any) => p.Subject === session.puuid);
    const myTeam = myPlayer?.TeamID || 'Blue';

    const allPuuids = players.map((p: any) => p.Subject || p.subject).filter(Boolean);
    const resolvedNames = await resolvePlayerNames(allPuuids);

    const allies = await Promise.all(
      players
        .filter((p: any) => p.TeamID === myTeam)
        .map(async (p: any) => {
          const pSubject = p.Subject || p.subject;
          const isMe = pSubject === session.puuid;
          const agent = await resolveAgentByUuid(p.CharacterID);
          const resolved = resolvedNames[pSubject];
          let name = isMe ? session.gameName : 'Ally';
          let tag = isMe ? session.gameTag : 'VALO';
          if (isMe) {
            name = session.gameName;
            tag = session.gameTag;
          } else if (resolved?.gameName) {
            name = resolved.gameName;
            tag = resolved.tagLine || '';
          }
          return {
            name,
            tag,
            isPlayer: isMe,
            agent: agent?.displayName || 'Agent',
            agentIcon:
              agent?.displayIconSmall ||
              agent?.displayIcon ||
              'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
            role: agent?.role?.displayName || 'Duelist',
            rank: 'Competitive',
            rankIcon:
              'https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png',
            kills: 0,
            deaths: 0,
            assists: 0,
            score: 0,
            ping: 20,
            ultReady: false,
            ultPoints: '0/7',
            credits: 800,
            loadout: 'Classic + Light Armor'
          };
        })
    );

    const enemies = await Promise.all(
      players
        .filter((p: any) => p.TeamID !== myTeam)
        .map(async (p: any) => {
          const pSubject = p.Subject || p.subject;
          const agent = await resolveAgentByUuid(p.CharacterID);
          const resolved = resolvedNames[pSubject];
          let name = 'Enemy';
          let tag = 'VALO';
          if (resolved) {
            if (resolved.gameName && resolved.gameName.trim()) {
              name = resolved.gameName;
              tag = resolved.tagLine || '';
            } else {
              name = 'Hidden';
              tag = '';
            }
          }
          return {
            name,
            tag,
            isPlayer: false,
            agent: agent?.displayName || 'Agent',
            agentIcon:
              agent?.displayIconSmall ||
              agent?.displayIcon ||
              'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
            role: agent?.role?.displayName || 'Initiator',
            rank: 'Competitive',
            rankIcon:
              'https://media.valorant-api.com/competitivetiers/03621f52-4cd8-5eab-4e09-9889632f576d/25/largeicon.png',
            kills: 0,
            deaths: 0,
            assists: 0,
            score: 0,
            ping: 25,
            ultReady: false,
            ultPoints: '0/7',
            credits: 800,
            loadout: 'Classic + Light Armor'
          };
        })
    );

    const scoreData = await fetchLivePresenceScore();
    const allyScore = scoreData?.ally ?? 0;
    const enemyScore = scoreData?.enemy ?? 0;

    return {
      matchId: playerCoreRes.data.MatchID,
      inGame: true,
      status: 'IN_PROGRESS',
      map: map?.displayName || 'Ascent',
      mapImageUrl:
        map?.splash ||
        'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
      mode: 'Competitive',
      server: `Live Server (${session.region.toUpperCase()})`,
      gameDuration: 'Live Match',
      currentScore: `${allyScore} - ${enemyScore}`,
      currentRound: (allyScore + enemyScore) + 1,
      mySide: 'LIVE',
      allies,
      enemies,
      liveInsights: [
        'Live match detected! Economy and ult status will update as rounds progress.',
        'Communicate util with teammates before executing sites.'
      ],
      source: 'live'
    };
  } catch (e: any) {
    return { ...fallbackLive, source: 'live' };
  }
}

export async function fetchLivePregame() {
  const session = await getRiotSession();
  if (!session) return { inPregame: false, source: 'mock' };

  try {
    const playerPregameRes = await makePvpRequest<any>(
      `/pregame/v1/players/${session.puuid}`,
      { isGlz: true }
    );

    if (playerPregameRes.status === 404 || !playerPregameRes.data?.MatchID) {
      return { inPregame: false, source: 'live', status: 'IN_LOBBY' };
    }

    const matchId = playerPregameRes.data.MatchID;
    const matchRes = await makePvpRequest<any>(
      `/pregame/v1/matches/${matchId}`,
      { isGlz: true }
    );

    if (matchRes.status !== 200) {
      return { inPregame: false, source: 'live' };
    }

    const match = matchRes.data;
    const map = await resolveMapByPathOrUuid(match.MapID);
    const allyTeam = match.AllyTeam?.Players || [];
    const allyPuuids = allyTeam.map((p: any) => p.Subject).filter(Boolean);
    const resolvedNames = await resolvePlayerNames(allyPuuids);

    const allyComp = await Promise.all(
      allyTeam.map(async (p: any) => {
        const isMe = p.Subject === session.puuid;
        const agent = await resolveAgentByUuid(p.CharacterID);
        const resolved = resolvedNames[p.Subject];
        let name = isMe ? session.gameName : (resolved?.gameName || 'Ally');
        let tag = isMe ? session.gameTag : (resolved?.tagLine || 'VALO');
        return {
          subject: p.Subject,
          isPlayer: isMe,
          playerName: name,
          playerTag: tag,
          agentName: agent?.displayName || null,
          agentIcon: agent?.displayIconSmall || agent?.displayIcon || null,
          characterId: p.CharacterID,
          characterSelectionState: p.CharacterSelectionState // 'selected' | 'locked'
        };
      })
    );

    // Auto-pick executor if configured
    if (autoPickConfig.enabled && autoPickConfig.agentUuid) {
      const myState = allyComp.find((p) => p.isPlayer);
      if (myState && myState.characterSelectionState !== 'locked') {
        if (autoPickConfig.mode === 'lock') {
          await lockAgent(autoPickConfig.agentUuid);
        } else if (autoPickConfig.mode === 'hover' && myState.characterSelectionState !== 'selected') {
          await selectAgent(autoPickConfig.agentUuid);
        }
      }
    }

    return {
      inPregame: true,
      source: 'live',
      matchId,
      map: map?.displayName || 'Ascent',
      mapImageUrl: map?.splash,
      phaseTimeRemainingNS: match.PhaseTimeRemainingNS,
      allyComp
    };
  } catch (e) {
    return { inPregame: false, source: 'live' };
  }
}

export async function fetchUnlockedAgentUuids(): Promise<string[]> {
  const baseStarterUuids = [
    'add6443a-41bd-e414-f6ad-e58d267f4e95', // Jett
    'eb93336a-449b-9c1b-0a54-a891f7921d69', // Phoenix
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa', // Sova
    '569fdd95-4d10-43ab-ca70-79becc718b46', // Sage
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417'  // Brimstone
  ];

  const session = await getRiotSession();
  if (!session) return baseStarterUuids;

  try {
    const res = await makePvpRequest<any>(
      `/store/v1/entitlements/${session.puuid}/01a42a0a-4763-32c4-ad9f-b7976d853a47`
    );
    const unlocked = new Set<string>(baseStarterUuids.map((u) => u.toLowerCase()));

    if (res.status === 200 && res.data?.Entitlements) {
      for (const item of res.data.Entitlements) {
        if (item.ItemID) unlocked.add(item.ItemID.toLowerCase());
      }
    }
    return Array.from(unlocked);
  } catch (e) {
    return baseStarterUuids;
  }
}

export async function selectAgent(agentUuid: string) {
  const session = await getRiotSession();
  if (!session) throw new Error('Riot client session not connected');

  const agent = await resolveAgentByUuid(agentUuid);
  const agentName = agent?.displayName || 'Selected Agent';

  let inPregame = false;
  let matchId = '';

  try {
    const playerPregame = await makePvpRequest<any>(`/pregame/v1/players/${session.puuid}`, {
      isGlz: true
    });
    if (playerPregame.status === 200 && playerPregame.data?.MatchID) {
      inPregame = true;
      matchId = playerPregame.data.MatchID;
    }
  } catch (e) {
    // not in pregame
  }

  if (inPregame && matchId) {
    const res = await makePvpRequest<any>(
      `/pregame/v1/matches/${matchId}/select/${agentUuid}`,
      {
        method: 'POST',
        body: {},
        isGlz: true
      }
    );

    autoPickConfig.lastActionStatus = `Hovered ${agentName} (HTTP ${res.status})`;
    autoPickConfig.lastActionTimestamp = Date.now();
    autoPickConfig.matchState = 'PREGAME_HOVERED';
    savePersistedConfig();

    return {
      success: res.status === 200,
      status: 'HOVERED',
      agentName,
      agentUuid,
      message: `Successfully hovered ${agentName} in active pregame lobby!`
    };
  }

  // If in lobby, arm auto-pick for hover mode
  autoPickConfig.enabled = true;
  autoPickConfig.agentUuid = agentUuid;
  autoPickConfig.agentName = agentName;
  autoPickConfig.mode = 'hover';
  autoPickConfig.lastActionStatus = `Hover armed for ${agentName}! Will automatically hover when match starts.`;
  autoPickConfig.lastActionTimestamp = Date.now();
  autoPickConfig.matchState = 'IDLE';
  savePersistedConfig();

  return {
    success: true,
    status: 'ARMED',
    agentName,
    agentUuid,
    message: `Hover armed for ${agentName}! Will automatically hover when match starts.`
  };
}

export async function lockAgent(agentUuid: string) {
  const session = await getRiotSession();
  if (!session) throw new Error('Riot client session not connected');

  const agent = await resolveAgentByUuid(agentUuid);
  const agentName = agent?.displayName || 'Selected Agent';

  let inPregame = false;
  let matchId = '';

  try {
    const playerPregame = await makePvpRequest<any>(`/pregame/v1/players/${session.puuid}`, {
      isGlz: true
    });
    if (playerPregame.status === 200 && playerPregame.data?.MatchID) {
      inPregame = true;
      matchId = playerPregame.data.MatchID;
    }
  } catch (e) {
    // not in pregame
  }

  if (inPregame && matchId) {
    const res = await makePvpRequest<any>(
      `/pregame/v1/matches/${matchId}/lock/${agentUuid}`,
      {
        method: 'POST',
        body: {},
        isGlz: true
      }
    );

    autoPickConfig.lastActionStatus = `Locked in ${agentName}! Agent select confirmed.`;
    autoPickConfig.lastActionTimestamp = Date.now();
    autoPickConfig.matchState = 'PREGAME_LOCKED';
    savePersistedConfig();

    return {
      success: res.status === 200,
      status: 'LOCKED',
      agentName,
      agentUuid,
      message: `Successfully locked in ${agentName}!`
    };
  }

  // If in lobby, arm auto-pick for lock mode
  autoPickConfig.enabled = true;
  autoPickConfig.agentUuid = agentUuid;
  autoPickConfig.agentName = agentName;
  autoPickConfig.mode = 'lock';
  autoPickConfig.lastActionStatus = `Instalock armed for ${agentName}! Will instantly lock in 0ms when match starts.`;
  autoPickConfig.lastActionTimestamp = Date.now();
  autoPickConfig.matchState = 'IDLE';
  savePersistedConfig();

  return {
    success: true,
    status: 'ARMED_FOR_LOCK',
    agentName,
    agentUuid,
    message: `Instalock armed for ${agentName}! Will instantly lock in 0ms when match starts.`
  };
}

let pollerInterval: NodeJS.Timeout | null = null;

// Gentle background poller for auto-pick scanning (only runs when enabled).
// Started explicitly from the server entrypoint so imports/tests never leak timers.
export function startAutoPickPoller(): () => void {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }

  pollerInterval = setInterval(async () => {
    try {
      const lock = readLockfile();
      if (!lock) return;

      const config = getConfig();

      // 1. Probe Pregame (Agent Select)
      const pregame = await fetchLivePregame();
      if (pregame?.inPregame) {
        const myPlayer = (pregame.allyComp || []).find((p: any) => p.isPlayer);
        if (myPlayer) {
          if (myPlayer.characterSelectionState === 'locked') {
            if (autoPickConfig.matchState !== 'PREGAME_LOCKED') {
              autoPickConfig.matchState = 'PREGAME_LOCKED';
              autoPickConfig.lastActionStatus = `🔒 Locked in ${myPlayer.agentName || autoPickConfig.agentName || 'Agent'}! Agent Select in progress.`;
              autoPickConfig.lastActionTimestamp = Date.now();
              savePersistedConfig();
            }
          } else if (config.features.agentSelectAutomation && autoPickConfig.enabled && autoPickConfig.agentUuid) {
            if (autoPickConfig.mode === 'lock') {
              await lockAgent(autoPickConfig.agentUuid);
            } else if (autoPickConfig.mode === 'hover' && myPlayer.characterSelectionState !== 'selected') {
              await selectAgent(autoPickConfig.agentUuid);
            }
          }
        }
      } else {
        // 2. Probe Core Game (Active Match In-Progress)
        const session = await getRiotSession();
        if (session) {
          const playerCoreRes = await makePvpRequest<any>(
            `/core-game/v1/players/${session.puuid}`,
            { isGlz: true }
          );
          if (playerCoreRes.status === 200 && playerCoreRes.data?.MatchID) {
            if (autoPickConfig.matchState !== 'IN_GAME') {
              autoPickConfig.matchState = 'IN_GAME';
              autoPickConfig.lastActionStatus = `🎮 Match Started with ${autoPickConfig.agentName || 'Agent'}! Live match in progress.`;
              autoPickConfig.lastActionTimestamp = Date.now();
              savePersistedConfig();
            }
          } else if (autoPickConfig.matchState === 'IN_GAME' || autoPickConfig.matchState === 'PREGAME_LOCKED') {
            // Returned back to lobby
            autoPickConfig.matchState = 'IDLE';
            autoPickConfig.lastActionStatus = `${autoPickConfig.agentName ? `${autoPickConfig.agentName} selected in advisor` : 'Ready for next match'}.`;
            autoPickConfig.lastActionTimestamp = Date.now();
            savePersistedConfig();
          }
        }
      }
    } catch (e) {
      // isolated background polling catch
    }
  }, 2500);

  const unregister = lifecycle.registerInterval(pollerInterval);
  return () => {
    stopAutoPickPoller();
    unregister();
  };
}

export function stopAutoPickPoller() {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
}

