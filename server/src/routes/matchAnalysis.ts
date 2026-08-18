import { Router, Request, Response } from 'express';
import { analyzeMatchWithAI, getCachedAnalysis, effectiveModel } from '../services/gemini';
import { fetchLiveMatchDetail } from '../services/riotClient';
import matchDetails from '../data/matchDetails.json';
import matches from '../data/matches.json';

const router = Router();

function isSummary(data: any): boolean {
  // A full detail has rounds/teams/economy; a summary is a flat list item.
  return !!data && !data.rounds && !data.teams;
}

router.post('/match-analysis/ai', async (req: Request, res: Response) => {
  try {
    const { matchId, matchData, focus } = req.body;

    let targetData = matchData;

    // If the client sent only a match summary (no rounds/teams), fetch the full
    // detail server-side so the AI actually sees rounds, economy and buy types.
    if (targetData && isSummary(targetData) && matchId) {
      try {
        const fallbackDetail = (matchDetails as any)[matchId] || (matches as any[]).find((m) => m.id === matchId);
        targetData = await fetchLiveMatchDetail(matchId, fallbackDetail || matches[0]);
      } catch (e) {
        // Keep the summary if detail fetch failed.
      }
    }

    if (!targetData && matchId) {
      targetData = (matchDetails as any)[matchId] || (matches as any[]).find((m) => m.id === matchId);
    }

    if (!targetData) {
      // Default to the first match if matchId is not found
      targetData = (matchDetails as any)['match-9801'] || matches[0];
    }

    const finalMatchId = targetData?.id || matchId || 'match-9801';

    // Serve cached analyses without re-billing the user.
    const cached = getCachedAnalysis(finalMatchId, effectiveModel());
    if (cached) {
      res.json({ matchId: finalMatchId, analysis: cached, cached: true });
      return;
    }

    const analysis = await analyzeMatchWithAI(targetData, { matchId: finalMatchId, focus });
    res.json({
      matchId: finalMatchId,
      analysis,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error analyzing match:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze match' });
  }
});

export default router;
