import { Router, Request, Response } from 'express';
import loadoutData from '../data/loadout.json';
import { fetchLiveLoadout } from '../services/riotClient';

const router = Router();

router.get('/loadout', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveLoadout(loadoutData);
    res.json(data);
  } catch (e) {
    res.json({ ...loadoutData, source: 'mock' });
  }
});

export default router;
