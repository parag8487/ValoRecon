import { Router, Request, Response } from 'express';
import battlepassData from '../data/battlepass.json';
import { fetchLiveBattlepass } from '../services/riotClient';

const router = Router();

router.get('/battlepass', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveBattlepass(battlepassData);
    res.json(data);
  } catch (e) {
    res.json({ ...battlepassData, source: 'mock' });
  }
});

export default router;
