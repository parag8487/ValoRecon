import { Router, Request, Response } from 'express';

const router = Router();

// ValoRecon's OWN entitlement (local, not from Riot). This is a free/open build,
// so it honestly reports FREE rather than fabricating a paid VIP tier.
router.get('/premium/sync', (_req: Request, res: Response) => {
  res.json({
    premium: false,
    tier: 'FREE',
    status: 'ACTIVE',
    features: [
      'ai_coach',
      'match_analysis',
      'agent_select_advisor',
      'live_match_tracker',
      'statistics'
    ]
  });
});

export default router;
