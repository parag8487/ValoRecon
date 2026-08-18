interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BASE_URL = 'https://valorant-api.com/v1';

const cache: {
  agents?: CacheEntry<any[]>;
  maps?: CacheEntry<any[]>;
  weapons?: CacheEntry<any[]>;
  version?: CacheEntry<string>;
  competitiveTiers?: CacheEntry<any[]>;
  skinLevelIndex?: CacheEntry<Record<string, any>>;
  allSkins?: CacheEntry<any[]>;
  bundles?: CacheEntry<any[]>;
  contentTiers?: CacheEntry<any[]>;
} = {};

export async function getClientVersion(): Promise<string> {
  const now = Date.now();
  if (cache.version && now - cache.version.timestamp < CACHE_TTL_MS) {
    return cache.version.data;
  }
  try {
    const res = await fetch(`${BASE_URL}/version`);
    if (res.ok) {
      const json = await res.json();
      const version = json.data?.riotClientVersion || 'release-09.08-shipping-14-2938174';
      cache.version = { data: version, timestamp: now };
      return version;
    }
  } catch (e) {
    // fallback
  }
  return 'release-09.08-shipping-14-2938174';
}

export async function getCompetitiveTiers(): Promise<any[]> {
  const now = Date.now();
  if (cache.competitiveTiers && now - cache.competitiveTiers.timestamp < CACHE_TTL_MS) {
    return cache.competitiveTiers.data;
  }
  try {
    const res = await fetch(`${BASE_URL}/competitivetiers`);
    if (res.ok) {
      const json = await res.json();
      const tiers = json.data?.[json.data.length - 1]?.tiers || [];
      cache.competitiveTiers = { data: tiers, timestamp: now };
      return tiers;
    }
  } catch (e) {
    // fallback
  }
  return [];
}

export async function getAgents(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.agents && now - cache.agents.timestamp < CACHE_TTL_MS) {
    return cache.agents.data;
  }

  const res = await fetch(`${BASE_URL}/agents?isPlayableCharacter=true`);
  if (!res.ok) {
    throw new Error(`Failed to fetch agents from valorant-api: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status: number; data: any[] };
  const agents = (json.data || []).filter((agent: any) => agent.isPlayableCharacter !== false);
  cache.agents = { data: agents, timestamp: now };
  return agents;
}

export async function getMaps(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.maps && now - cache.maps.timestamp < CACHE_TTL_MS) {
    return cache.maps.data;
  }

  const res = await fetch(`${BASE_URL}/maps`);
  if (!res.ok) {
    throw new Error(`Failed to fetch maps from valorant-api: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status: number; data: any[] };
  const maps = json.data || [];
  cache.maps = { data: maps, timestamp: now };
  return maps;
}

export async function getWeapons(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.weapons && now - cache.weapons.timestamp < CACHE_TTL_MS) {
    return cache.weapons.data;
  }

  const res = await fetch(`${BASE_URL}/weapons`);
  if (!res.ok) {
    throw new Error(`Failed to fetch weapons from valorant-api: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status: number; data: any[] };
  const weapons = json.data || [];
  cache.weapons = { data: weapons, timestamp: now };
  return weapons;
}

export async function resolveAgentByUuid(uuid: string): Promise<any | null> {
  const agents = await getAgents();
  const lower = (uuid || '').toLowerCase();
  return agents.find((a) => a.uuid.toLowerCase() === lower) || null;
}

export async function resolveMapByPathOrUuid(mapUrlOrUuid: string): Promise<any | null> {
  const maps = await getMaps();
  const target = (mapUrlOrUuid || '').toLowerCase();
  return (
    maps.find(
      (m) =>
        m.mapUrl?.toLowerCase() === target ||
        m.uuid?.toLowerCase() === target ||
        m.displayName?.toLowerCase() === target
    ) || null
  );
}

export async function resolveSkinByUuid(skinUuid: string): Promise<any | null> {
  const index = await getSkinLevelIndex();
  const lower = (skinUuid || '').toLowerCase();
  return index[lower] || null;
}

/**
 * Builds a flat index mapping EVERY skin-related UUID (base skin, skin level, and
 * skin chroma) to a resolved object with a real displayIcon URL. Riot player-loadout
 * and storefront payloads reference skinLEVEL / chroma UUIDs — not base skin UUIDs —
 * so indexing all three is what prevents 404s from string-built media URLs.
 */
// Content-tier rarity rank (higher = rarer/better) for sorting skins best-first.
// Values are Riot's own content-tier `rank` from /v1/contenttiers. Standard (no tier) = -1.
const CONTENT_TIER_RANK: Record<string, number> = {
  '12683d76-48d7-84a3-4e09-6985794f0445': 0, // Select
  '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 1, // Deluxe
  '60bca009-4182-7998-dee7-b8a2558dc369': 2, // Premium
  'e046854e-406c-37f4-6607-19a9ba8426fc': 3, // Exclusive
  '411e4a55-4e59-7757-41f0-86a53f101bb5': 4, // Ultra
};

async function getSkinLevelIndex(): Promise<Record<string, any>> {
  const now = Date.now();
  if (cache.skinLevelIndex && now - cache.skinLevelIndex.timestamp < CACHE_TTL_MS) {
    return cache.skinLevelIndex.data;
  }

  const index: Record<string, any> = {};
  try {
    const res = await fetch(`${BASE_URL}/weapons/skins`);
    if (res.ok) {
      const json = (await res.json()) as { data: any[] };
      for (const skin of json.data || []) {
        // A skin's own icon: prefer the first level's icon, then the skin's displayIcon.
        const baseIcon =
          skin.levels?.[0]?.displayIcon ||
          skin.displayIcon ||
          skin.chromas?.[0]?.displayIcon ||
          skin.chromas?.[0]?.fullRender ||
          null;
        const weaponName = deriveWeaponName(skin.displayName);
        const entry = {
          uuid: skin.uuid,
          displayName: skin.displayName,
          weaponName,
          displayIcon: baseIcon,
          contentTierUuid: skin.contentTierUuid || null,
          tierRank: skin.contentTierUuid ? (CONTENT_TIER_RANK[skin.contentTierUuid.toLowerCase()] ?? 0) : -1,
        };
        if (skin.uuid) index[skin.uuid.toLowerCase()] = entry;

        // Index each level UUID → its own icon (falls back to base skin icon).
        for (const level of skin.levels || []) {
          if (level.uuid) {
            index[level.uuid.toLowerCase()] = {
              ...entry,
              displayIcon: level.displayIcon || baseIcon,
            };
          }
        }
        // Index each chroma UUID → its render (falls back to base skin icon).
        for (const chroma of skin.chromas || []) {
          if (chroma.uuid) {
            index[chroma.uuid.toLowerCase()] = {
              ...entry,
              chromaName: chroma.displayName,
              displayIcon: chroma.displayIcon || chroma.fullRender || baseIcon,
            };
          }
        }
      }
    }
  } catch (e) {
    // leave index as-is (possibly empty) on failure
  }

  cache.skinLevelIndex = { data: index, timestamp: now };
  return index;
}

function deriveWeaponName(skinDisplayName: string): string {
  // valorant-api skin names end with the weapon, e.g. "Prime Vandal", "Reaver Sheriff".
  const KNOWN = [
    'Vandal', 'Phantom', 'Operator', 'Sheriff', 'Ghost', 'Classic', 'Spectre', 'Bulldog',
    'Guardian', 'Marshal', 'Outlaw', 'Ares', 'Odin', 'Judge', 'Bucky', 'Frenzy', 'Shorty',
    'Stinger', 'Melee', 'Knife'
  ];
  const name = skinDisplayName || '';
  for (const w of KNOWN) {
    if (name.includes(w)) return w === 'Knife' ? 'Melee' : w;
  }
  return name.split(' ').pop() || 'Weapon';
}

export async function getBundles(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.bundles && now - cache.bundles.timestamp < CACHE_TTL_MS) {
    return cache.bundles.data;
  }
  try {
    const res = await fetch(`${BASE_URL}/bundles`);
    if (res.ok) {
      const json = (await res.json()) as { data: any[] };
      cache.bundles = { data: json.data || [], timestamp: now };
      return json.data || [];
    }
  } catch (e) {
    // fallback
  }
  return [];
}

export async function resolveBundleByUuid(bundleUuid: string): Promise<any | null> {
  const bundles = await getBundles();
  const lower = (bundleUuid || '').toLowerCase();
  return bundles.find((b) => b.uuid?.toLowerCase() === lower) || null;
}

async function fetchContentItem(endpoint: string, uuid: string): Promise<any | null> {
  if (!uuid) return null;
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/${uuid}`);
    if (res.ok) {
      const json = (await res.json()) as { data: any };
      return json.data || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function resolvePlayerCard(uuid: string): Promise<any | null> {
  return fetchContentItem('playercards', uuid);
}

export async function resolvePlayerTitle(uuid: string): Promise<any | null> {
  return fetchContentItem('playertitles', uuid);
}

export async function getAllSkins(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache.allSkins && now - cache.allSkins.timestamp < CACHE_TTL_MS) {
    return cache.allSkins.data;
  }
  const res = await fetch(`${BASE_URL}/weapons/skins`);
  if (!res.ok) throw new Error(`Failed to fetch skins: ${res.status}`);
  const json = (await res.json()) as { data?: any[] };
  const skins = json.data || [];
  cache.allSkins = { data: skins, timestamp: now };
  return skins;
}

export async function resolveSkinMedia(uuidOrName: string): Promise<{
  videoUrl: string | null;
  imageUrl: string | null;
  displayName: string | null;
} | null> {
  if (!uuidOrName) return null;
  const skins = await getAllSkins().catch(() => []);
  const target = uuidOrName.toLowerCase().trim();

  const skin = skins.find((s: any) =>
    s.uuid?.toLowerCase() === target ||
    s.displayName?.toLowerCase() === target ||
    s.levels?.some((lvl: any) => lvl.uuid?.toLowerCase() === target || lvl.displayName?.toLowerCase() === target) ||
    s.chromas?.some((c: any) => c.uuid?.toLowerCase() === target || c.displayName?.toLowerCase() === target)
  );

  if (!skin) return null;

  const levels = Array.isArray(skin.levels) ? skin.levels : [];
  const chromas = Array.isArray(skin.chromas) ? skin.chromas : [];

  const videoUrl =
    levels.slice().reverse().find((l: any) => l.streamedVideo)?.streamedVideo ||
    chromas.find((c: any) => c.streamedVideo)?.streamedVideo ||
    null;

  const imageUrl =
    chromas.find((c: any) => c.fullRender)?.fullRender ||
    chromas.find((c: any) => c.displayIcon)?.displayIcon ||
    skin.displayIcon ||
    levels.find((l: any) => l.displayIcon)?.displayIcon ||
    null;

  return {
    videoUrl,
    imageUrl,
    displayName: skin.displayName || null,
  };
}
