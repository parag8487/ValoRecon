import { Router, Request, Response } from 'express';
import careerData from '../data/career.json';
import { fetchLiveCareer } from '../services/riotClient';

const router = Router();

router.get('/player-career', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLiveCareer(careerData);
    res.json(data);
  } catch (e) {
    res.json({ ...careerData, source: 'mock' });
  }
});

export default router;
