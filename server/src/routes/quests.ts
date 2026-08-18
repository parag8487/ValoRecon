import { Router, Request, Response } from 'express';
import questsData from '../data/quests.json';
import { fetchLiveQuests } from '../services/riotClient';

const router = Router();

router.get('/quests', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveQuests(questsData);
    res.json(data);
  } catch (e) {
    res.json({ ...questsData, source: 'mock' });
  }
});

export default router;
