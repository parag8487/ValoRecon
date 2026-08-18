import { Router, Request, Response } from 'express';
import {
  getLiveStatus,
  getGamePhase,
  fetchLivePresenceScore,
  getRiotDebugReport,
  fetchLivePregame,
  fetchLobbyInspect,
  fetchUnlockedAgentUuids,
  selectAgent,
  lockAgent,
  getAutoPickConfig,
  setAutoPickConfig
} from '../services/riotClient';

const router = Router();

router.get('/riot/unlocked-agents', async (_req: Request, res: Response) => {
  try {
    const list = await fetchUnlockedAgentUuids();
    res.json(list);
  } catch (err: any) {
    res.json([]);
  }
});

router.get('/riot/status', async (_req: Request, res: Response) => {
  try {
    const status = await getLiveStatus();
    res.json(status);
  } catch (err: any) {
    res.json({
      connected: false,
      gameRunning: false,
      error: err.message
    });
  }
});

router.get('/riot/debug', async (_req: Request, res: Response) => {
  try {
    const report = await getRiotDebugReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authoritative game-phase probe: OFFLINE | MENUS | AGENT_SELECT | INGAME
router.get('/riot/phase', async (_req: Request, res: Response) => {
  try {
    const phase = await getGamePhase();
    res.json(phase);
  } catch (err: any) {
    res.json({ phase: 'OFFLINE', matchId: null, error: err.message });
  }
});

// Lightweight live score (reads local presence only) — safe to poll frequently.
router.get('/riot/score', async (_req: Request, res: Response) => {
  try {
    const s = await fetchLivePresenceScore();
    res.json(s || { ally: null, enemy: null, round: null });
  } catch (err: any) {
    res.json({ ally: null, enemy: null, round: null });
  }
});

router.get('/riot/pregame', async (_req: Request, res: Response) => {
  try {
    const pregame = await fetchLivePregame();
    res.json(pregame);
  } catch (err: any) {
    res.json({ inPregame: false, error: err.message });
  }
});

// Read-only lobby / agent-select roster inspection (allies' agents; opponent skins
// are never fabricated — Riot's anti-cheat does not expose them).
router.get('/riot/lobby-inspect', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLobbyInspect();
    res.json(data);
  } catch (err: any) {
    res.json({ available: false, phase: 'ERROR', players: [], error: err.message });
  }
});

router.get('/riot/autopick', (_req: Request, res: Response) => {
  res.json(getAutoPickConfig());
});

router.post('/riot/autopick', (req: Request, res: Response) => {
  const updated = setAutoPickConfig(req.body);
  res.json(updated);
});

import { getConfig } from '../config';

router.post('/riot/select', async (req: Request, res: Response) => {
  const config = getConfig();
  if (!config.features.agentSelectAutomation) {
    res.status(403).json({
      error: {
        code: 'VR-RIOT-403',
        message: 'Agent-select automation is disabled by policy. ValoRecon operates as a compliant companion and does not automate game inputs.',
        requestId: req.id,
        retryable: false
      }
    });
    return;
  }
  const { agentUuid } = req.body;
  if (!agentUuid) {
    res.status(400).json({ error: { code: 'VR-VALIDATION-400', message: 'Missing agentUuid', requestId: req.id } });
    return;
  }
  try {
    const result = await selectAgent(agentUuid);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'VR-RIOT-400', message: err.message, requestId: req.id } });
  }
});

router.post('/riot/lock', async (req: Request, res: Response) => {
  const config = getConfig();
  if (!config.features.agentSelectAutomation) {
    res.status(403).json({
      error: {
        code: 'VR-RIOT-403',
        message: 'Agent-select automation is disabled by policy. ValoRecon operates as a compliant companion and does not automate game inputs.',
        requestId: req.id,
        retryable: false
      }
    });
    return;
  }
  const { agentUuid } = req.body;
  if (!agentUuid) {
    res.status(400).json({ error: { code: 'VR-VALIDATION-400', message: 'Missing agentUuid', requestId: req.id } });
    return;
  }
  try {
    const result = await lockAgent(agentUuid);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'VR-RIOT-400', message: err.message, requestId: req.id } });
  }
});


export default router;
