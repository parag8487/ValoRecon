import { Router, Request, Response } from 'express';
import matches from '../data/matches.json';
import matchDetails from '../data/matchDetails.json';
import { fetchLiveMatches, fetchLiveMatchDetail } from '../services/riotClient';

const router = Router();

router.get('/matches', async (_req: Request, res: Response) => {
  try {
    const list = await fetchLiveMatches(matches);
    res.json(list);
  } catch (e) {
    res.json(matches.map((m) => ({ ...m, source: 'mock' })));
  }
});

router.get('/match/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // 1. If it's a numeric index e.g. /api/match/1 -> find from live or mock matches list
  let targetId = id;
  if (!isNaN(Number(id))) {
    const idx = Number(id) <= 0 ? 0 : Number(id) - 1;
    try {
      const liveList = await fetchLiveMatches(matches);
      if (Array.isArray(liveList) && liveList[idx]) {
        targetId = liveList[idx].id;
      }
    } catch (e) {
      if ((matches as any[])[idx]) {
        targetId = (matches as any[])[idx].id;
      }
    }
  }

  // 2. Try fetching real live match detail from Riot PVP
  try {
    const liveDetail = await fetchLiveMatchDetail(targetId, (matchDetails as any)['match-9801']);
    if (liveDetail && liveDetail.source === 'live') {
      res.json(liveDetail);
      return;
    }
  } catch (e) {
    // continue to mock fallback
  }

  // 3. Fallback for mock IDs
  const detail = (matchDetails as any)[targetId] || (matchDetails as any)['match-9801'];
  res.json({ ...detail, source: detail.source || 'mock' });
});

export default router;
