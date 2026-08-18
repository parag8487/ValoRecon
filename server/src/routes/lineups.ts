import { Router, Request, Response } from 'express';
import lineupsData from '../data/lineups.json';

const router = Router();

export interface Lineup {
  id: string;
  map: string;
  agent: string;
  ability: string;
  side: 'Attack' | 'Defense';
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source: string;
}

/** Filtered lineup list: ?map=Ascent&agent=Sova&ability=Recon+Bolt&side=Attack */
router.get('/lineups', (req: Request, res: Response) => {
  const { map, agent, ability, side, difficulty } = req.query as Record<string, string | undefined>;
  let result = lineupsData as any[];

  if (map) result = result.filter((l) => l.map.toLowerCase() === map.toLowerCase());
  if (agent) result = result.filter((l) => l.agent.toLowerCase() === agent.toLowerCase());
  if (ability) result = result.filter((l) => l.ability.toLowerCase().includes(ability.toLowerCase()));
  if (side) result = result.filter((l) => l.side.toLowerCase() === side.toLowerCase());
  if (difficulty) result = result.filter((l) => l.difficulty.toLowerCase() === difficulty.toLowerCase());

  res.json({ lineups: result, total: result.length });
});

/** Free-text search across title/description. */
router.get('/lineups/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  if (!q) {
    res.json({ lineups: [], total: 0 });
    return;
  }
  const result = (lineupsData as any[]).filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.map.toLowerCase().includes(q) ||
      l.agent.toLowerCase().includes(q) ||
      l.ability.toLowerCase().includes(q)
  );
  res.json({ lineups: result, total: result.length });
});

/** Metadata for filter dropdowns. */
router.get('/lineups/meta', (_req: Request, res: Response) => {
  const maps = Array.from(new Set((lineupsData as any[]).map((l) => l.map))).sort();
  const agents = Array.from(new Set((lineupsData as any[]).map((l) => l.agent))).sort();
  const abilities = Array.from(new Set((lineupsData as any[]).map((l) => l.ability))).sort();
  res.json({ maps, agents, abilities, sides: ['Attack', 'Defense'], note: 'Community-standard lineups — verify in a custom game before using in ranked.' });
});

export default router;
