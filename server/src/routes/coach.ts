import { Router, Request, Response } from 'express';
import careerData from '../data/career.json';
import matchesData from '../data/matches.json';
import { fetchLiveCareer, fetchLiveMatches } from '../services/riotClient';
import {
  buildSuggestions,
  buildWeeklyPlan,
  computeTrends,
  buildLiveMatchContext,
} from '../services/coachService';
import { analyzeScreenshotWithAI } from '../services/gemini';

const router = Router();

/**
 * Deterministic, data-driven suggestion chips — no LLM call, computed from the
 * player's real career + match data. Replaces the static welcome suggestions.
 */
router.get('/coach/suggestions', async (_req: Request, res: Response) => {
  try {
    const [career, matches] = await Promise.all([
      fetchLiveCareer(careerData),
      fetchLiveMatches(matchesData),
    ]);
    const suggestions = buildSuggestions(career, matches);
    res.json({ suggestions, playerTag: career?.player ? `${career.player.name}#${career.player.tag}` : null });
  } catch (err: any) {
    console.error('Error building suggestions:', err);
    res.status(500).json({ error: err.message || 'Failed to build suggestions' });
  }
});

/** Performance windows (last 5/10/15) + deltas + own-history percentiles. */
router.get('/coach/trends', async (_req: Request, res: Response) => {
  try {
    const [career, matches] = await Promise.all([
      fetchLiveCareer(careerData),
      fetchLiveMatches(matchesData),
    ]);
    res.json({ trends: computeTrends(career, matches), player: career?.player ? `${career.player.name}#${career.player.tag}` : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute trends' });
  }
});

/** Weekly improvement plan + drills tied to detected weaknesses. */
router.get('/coach/plan', async (_req: Request, res: Response) => {
  try {
    const [career, matches] = await Promise.all([
      fetchLiveCareer(careerData),
      fetchLiveMatches(matchesData),
    ]);
    const trends = computeTrends(career, matches);
    const plan = buildWeeklyPlan(career, matches, trends);
    res.json({ plan, trends });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to build plan' });
  }
});

/** Live in-game situation for the coach (phase, map, score, round, team). */
router.get('/coach/live', async (_req: Request, res: Response) => {
  try {
    const context = await buildLiveMatchContext();
    res.json({ inGame: !!context, context });
  } catch (err: any) {
    res.json({ inGame: false, context: null });
  }
});

/**
 * Screenshot / scoreboard image analysis via Gemini (multimodal).
 * Body: { image: <base64>, mimeType: 'image/png'|'image/jpeg' }.
 */
router.post('/coach/screenshot', async (req: Request, res: Response) => {
  const { image, mimeType } = req.body || {};
  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'image (base64 string) is required' });
    return;
  }
  try {
    const analysis = await analyzeScreenshotWithAI(image, mimeType || 'image/png');
    res.json({ analysis });
  } catch (err: any) {
    console.error('Screenshot analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze screenshot' });
  }
});

export default router;
