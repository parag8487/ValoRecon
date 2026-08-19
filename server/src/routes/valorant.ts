import { Router, Request, Response } from 'express';
import { getAgents, getMaps, getWeapons } from '../services/valorantApi';
import { fetchUnlockedAgentUuids } from '../services/riotClient';

const router = Router();

router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const agents = await getAgents();
    const unlockedUuids = await fetchUnlockedAgentUuids().catch(() => []);
    const unlockedSet = new Set(unlockedUuids.map((u: string) => u.toLowerCase()));
    const CORE_UNLOCKED = new Set([
      'jett', 'phoenix', 'sova', 'sage', 'brimstone',
      'reyna', 'omen', 'cypher', 'raze', 'killjoy'
    ]);

    const enriched = agents.map((a: any) => ({
      ...a,
      unlocked: a.isBaseContent ||
                unlockedSet.has(a.uuid.toLowerCase()) ||
                CORE_UNLOCKED.has(a.displayName?.toLowerCase())
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch agents' });
  }
});

router.get('/maps', async (_req: Request, res: Response) => {
  try {
    const maps = await getMaps();
    res.json(maps);
  } catch (error: any) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch maps' });
  }
});

router.get('/weapons', async (_req: Request, res: Response) => {
  try {
    const weapons = await getWeapons();
    res.json(weapons);
  } catch (error: any) {
    console.error('Error fetching weapons:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weapons' });
  }
});

router.get('/skin-media', async (req: Request, res: Response) => {
  try {
    const query = (req.query.id as string) || (req.query.name as string) || (req.query.uuid as string) || '';
    const { resolveSkinMedia } = await import('../services/valorantApi');
    const media = await resolveSkinMedia(query);
    res.json(media || { videoUrl: null, imageUrl: null, displayName: null });
  } catch (error: any) {
    console.error('Error resolving skin media:', error);
    res.json({ videoUrl: null, imageUrl: null, displayName: null });
  }
});

export default router;
