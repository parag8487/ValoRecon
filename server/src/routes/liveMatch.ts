import { Router, Request, Response } from 'express';
import liveMatchData from '../data/liveMatch.json';
import { fetchLiveCoreGame } from '../services/riotClient';

const router = Router();

router.get('/live-match', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveCoreGame(liveMatchData);
    res.json(data);
  } catch (e) {
    res.json({ ...liveMatchData, source: 'mock' });
  }
});

export default router;
