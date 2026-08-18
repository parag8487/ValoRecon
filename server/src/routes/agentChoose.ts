import { Router, Request, Response } from 'express';
import { recommendAgents } from '../services/agentAdvisor';
import { getAgents } from '../services/valorantApi';

const router = Router();

router.post('/agent/choose', async (req: Request, res: Response) => {
  try {
    const { map, allyComp, role } = req.body;
    let allAgents: any[] = [];
    try {
      allAgents = await getAgents();
    } catch (e) {
      console.warn('Could not fetch agents for recommendation icons:', e);
    }

    const result = recommendAgents(map || 'Ascent', allyComp || [], role, allAgents);
    res.json(result);
  } catch (error: any) {
    console.error('Error in agent recommendation:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

export default router;
