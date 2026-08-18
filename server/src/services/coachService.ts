import lineupsData from '../data/lineups.json';
import liveMatchData from '../data/liveMatch.json';
import { fetchLiveCoreGame, getGamePhase } from './riotClient';

// ---------------------------------------------------------------------------
// Static knowledge lists used for question-aware retrieval (no LLM needed).
// ---------------------------------------------------------------------------
export const ALL_MAPS = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Lotus', 'Icebox', 'Breeze', 'Pearl', 'Sunset', 'Abyss', 'Fracture',
];

export const ALL_AGENTS = [
  'Brimstone', 'Viper', 'Omen', 'Killjoy', 'Cypher', 'Sova', 'Sage', 'Phoenix', 'Jett', 'Reyna', 'Raze',
  'Breach', 'Skye', 'Yoru', 'Astra', 'KAY/O', 'Chamber', 'Neon', 'Fade', 'Harbor', 'Gekko', 'Deadlock',
  'Iso', 'Clove', 'Vyse', 'Tejo', 'Waylay',
];

const TOPICS: Record<string, RegExp> = {
  economy: /econom|force ?buy|eco|save|buy round|credits|full buy|bonus round|rifle/i,
  aim: /aim|crosshair|headshot|hs[%\s]|spray|recoil|flick|first bullet|hs rate/i,
  movement: /counter[- ]?strafe|peek|jiggle|movement|strafe|slice/i,
  positioning: /position|post[- ]?plant|retake|anchor|holding|site (hold|take)|angle/i,
  lineups: /lineup|one[- ]?way|recon|nano|molly|smoke line|utility line/i,
  trend: /improv|trend|declin|streak|losing|win rate|form/i,
  comp: /comp|composition|team comp|double controller|pick (an )?agent/i,
};

export interface WindowStat {
  window: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kd: number | null;
  acs: number | null;
  adr: number | null;
  hsPct: number | null;
  firstBloodsPerMatch: number | null;
}

export interface TrendReport {
  windows: WindowStat[];
  deltas: {
    window: number;
    kd: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    winRate: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    acs: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    adr: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
    hsPct: { direction: 'improving' | 'declining' | 'stable'; delta: number | null };
  }[];
  percentiles: { metric: string; current: number | null; percentile: number | null; sample: number }[];
}

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === 'number' && isFinite(n));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function direction(delta: number | null): 'improving' | 'declining' | 'stable' {
  if (delta == null) return 'stable';
  if (delta > 0.04) return 'improving';
  if (delta < -0.04) return 'declining';
  return 'stable';
}

/** Compute performance windows (last 5 / 10 / 15) from recent matches. */
export function computeTrends(career: any, matches: any[]): TrendReport {
  const list = (Array.isArray(matches) ? matches : []).filter(
    (m: any) => m.result === 'VICTORY' || m.result === 'DEFEAT'
  );

  const windows: WindowStat[] = [];
  for (const n of [5, 10, 15]) {
    if (list.length < 2 || list.length < Math.min(n, 3)) continue;
    const slice = list.slice(0, n);
    const wins = slice.filter((m: any) => m.result === 'VICTORY').length;
    const kSum = slice.reduce((a: number, m: any) => a + (m.kills ?? 0), 0);
    const dSum = slice.reduce((a: number, m: any) => a + (m.deaths ?? 0), 0);
    windows.push({
      window: n,
      matches: slice.length,
      wins,
      losses: slice.length - wins,
      winRate: Math.round((wins / slice.length) * 100),
      kd: dSum > 0 ? Math.round((kSum / dSum) * 100) / 100 : (kSum > 0 ? kSum : null),
      acs: avg(slice.map((m: any) => m.combatScore)),
      adr: avg(slice.map((m: any) => m.damagePerRound)),
      hsPct: avg(slice.map((m: any) => m.headshotPct)),
      firstBloodsPerMatch: avg(slice.map((m: any) => m.firstBloods)),
    });
  }

  const deltas: TrendReport['deltas'] = [];
  for (const w of windows) {
    const n = w.window;
    const half = Math.ceil(n / 2);
    const late = list.slice(0, half);
    const early = list.slice(half, n);
    if (early.length === 0 || late.length === 0) continue;

    const winRate = (arr: any[]) => arr.filter((m: any) => m.result === 'VICTORY').length / arr.length;
    const kd = (arr: any[]) => {
      const k = arr.reduce((a: number, m: any) => a + (m.kills ?? 0), 0);
      const d = arr.reduce((a: number, m: any) => a + (m.deaths ?? 0), 0);
      return d > 0 ? k / d : null;
    };
    const avgOf = (arr: any[], key: string) => avg(arr.map((m: any) => m[key]));

    const kdDelta = (() => { const a = kd(early), b = kd(late); return a != null && b != null ? b - a : null; })();
    const wrDelta = winRate(early) - winRate(late);
    const acsDelta = (() => { const a = avgOf(early, 'combatScore'), b = avgOf(late, 'combatScore'); return a != null && b != null ? b - a : null; })();
    const adrDelta = (() => { const a = avgOf(early, 'damagePerRound'), b = avgOf(late, 'damagePerRound'); return a != null && b != null ? b - a : null; })();
    const hsDelta = (() => { const a = avgOf(early, 'headshotPct'), b = avgOf(late, 'headshotPct'); return a != null && b != null ? b - a : null; })();

    deltas.push({
      window: n,
      kd: { direction: direction(kdDelta), delta: kdDelta != null ? Math.round(kdDelta * 100) / 100 : null },
      winRate: { direction: direction(wrDelta * 100), delta: Math.round(wrDelta * 100) },
      acs: { direction: direction(acsDelta), delta: acsDelta != null ? Math.round(acsDelta) : null },
      adr: { direction: direction(adrDelta), delta: adrDelta != null ? Math.round(adrDelta) : null },
      hsPct: { direction: direction(hsDelta), delta: hsDelta != null ? Math.round(hsDelta * 10) / 10 : null },
    });
  }

  // Percentile of the player's own recent value vs their full history (own-history
  // benchmarking — avoids inventing external rank averages).
  const percentiles: TrendReport['percentiles'] = [];
  const recent = list.slice(0, 5);
  const sample = list;
  const percentileOf = (current: number | null, values: (number | null | undefined)[]): number | null => {
    const valid = values.filter((v): v is number => typeof v === 'number' && isFinite(v));
    if (current == null || valid.length < 3) return null;
    const below = valid.filter((v) => v < current).length;
    return Math.round((below / valid.length) * 100);
  };
  const recentKd = avg(recent.map((m: any) => (m.deaths ?? 0) > 0 ? (m.kills ?? 0) / (m.deaths ?? 1) : null));
  percentiles.push({
    metric: 'K/D', current: recentKd,
    percentile: percentileOf(recentKd, sample.map((m: any) => (m.deaths ?? 0) > 0 ? (m.kills ?? 0) / (m.deaths ?? 1) : null)),
    sample: sample.length,
  });
  for (const key of ['combatScore', 'damagePerRound', 'headshotPct'] as const) {
    const label = key === 'combatScore' ? 'ACS' : key === 'damagePerRound' ? 'ADR' : 'HS%';
    const cur = avg(recent.map((m: any) => m[key]));
    percentiles.push({
      metric: label, current: cur,
      percentile: percentileOf(cur, sample.map((m: any) => m[key])),
      sample: sample.length,
    });
  }

  return { windows, deltas, percentiles };
}

// ---------------------------------------------------------------------------
// Deterministic contextual suggestions (data-driven, no LLM).
// ---------------------------------------------------------------------------
export interface CoachSuggestion {
  label: string;
  prompt: string;
  reason: string;
}

export function buildSuggestions(career: any, matches: any[]): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = [];

  const maps = Array.isArray(career?.mapWinRates) ? career.mapWinRates : [];
  const weakestMap = [...maps]
    .filter((m: any) => (m.matches ?? 0) >= 2)
    .sort((a: any, b: any) => (a.winRate ?? 0) - (b.winRate ?? 0))[0];
  if (weakestMap) {
    suggestions.push({
      label: `My weakest map is ${weakestMap.mapName}`,
      prompt: `Why am I struggling on ${weakestMap.mapName}? Give me a tactical plan to improve there.`,
      reason: `Lowest win rate (${weakestMap.winRate}%) on ${weakestMap.mapName}`,
    });
  }

  const agents = Array.isArray(career?.topAgents) ? career.topAgents : [];
  const bestAgent = [...agents]
    .filter((a: any) => (a.matches ?? 0) >= 2)
    .sort((a: any, b: any) => (b.winRate ?? 0) - (a.winRate ?? 0))[0];
  if (bestAgent) {
    suggestions.push({
      label: `Should I main ${bestAgent.agentName}?`,
      prompt: `I play ${bestAgent.agentName} with ${bestAgent.winRate}% win rate over ${bestAgent.matches} matches. Should I main them, and how do I get better?`,
      reason: `Best win rate (${bestAgent.winRate}%) on ${bestAgent.agentName}`,
    });
  }

  const form = Array.isArray(career?.recentForm) ? career.recentForm : [];
  if (form.length >= 3 && form.slice(0, 3).every((r: any) => r === 'L')) {
    suggestions.push({
      label: `I'm on a ${form.length} loss streak`,
      prompt: `I've lost my last ${form.length} games. What should I change to break the streak?`,
      reason: `Recent form: ${form.join('-')}`,
    });
  }

  const kd = career?.stats?.kd;
  if (typeof kd === 'number') {
    if (kd < 1.0) {
      suggestions.push({
        label: `My K/D is ${kd} — how do I fix it?`,
        prompt: `My K/D is ${kd}. What are the highest-impact habits to improve it?`,
        reason: `K/D ${kd} is below 1.0`,
      });
    } else if (kd >= 1.3) {
      suggestions.push({
        label: `How do I convert my K/D into wins?`,
        prompt: `My K/D is ${kd} but I want more wins. What should I focus on?`,
        reason: `K/D ${kd} — fragging isn't converting to wins`,
      });
    }
  }

  const realMatches = (Array.isArray(matches) ? matches : []).filter((m: any) => m.result === 'VICTORY' || m.result === 'DEFEAT');
  if (realMatches.length >= 6) {
    const half = Math.ceil(realMatches.length / 2);
    const win = (arr: any[]) => arr.filter((m: any) => m.result === 'VICTORY').length;
    const earlyPct = Math.round((win(realMatches.slice(0, half)) / half) * 100);
    const latePct = Math.round((win(realMatches.slice(half)) / (realMatches.length - half)) * 100);
    if (latePct < earlyPct - 15) {
      suggestions.push({
        label: 'My form is declining',
        prompt: `My win rate dropped from ${earlyPct}% to ${latePct}% over recent games. What changed and how do I recover?`,
        reason: `Win rate declined ${earlyPct}% → ${latePct}%`,
      });
    } else if (latePct > earlyPct + 15) {
      suggestions.push({
        label: 'My form is improving — what next?',
        prompt: `My win rate improved from ${earlyPct}% to ${latePct}% recently. What should I keep doing and what's the next level?`,
        reason: `Win rate improved ${earlyPct}% → ${latePct}%`,
      });
    }
  }

  if (suggestions.length < 3) {
    const fallbacks = [
      { label: 'Analyze my recent form', prompt: 'Analyze my recent matches and tell me what I should focus on.', reason: 'General form review' },
      { label: 'How do I raise my K/D?', prompt: 'What habits have the biggest impact on raising my K/D?', reason: 'General improvement' },
      { label: 'What should I drill today?', prompt: 'Give me a 30-minute training plan based on my weakest areas.', reason: 'Training plan' },
    ];
    for (const f of fallbacks) {
      if (suggestions.length >= 3) break;
      if (!suggestions.some((s) => s.prompt === f.prompt)) suggestions.push(f);
    }
  }

  return suggestions.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Weekly improvement plan + drills, derived from detected weaknesses.
// ---------------------------------------------------------------------------
export interface WeeklyPlan {
  weaknesses: { area: string; evidence: string; severity: 'high' | 'medium' | 'low' }[];
  goals: { goal: string; target: string; metric: string }[];
  drills: { drill: string; duration: string; focus: string; tiesTo: string }[];
}

export function buildWeeklyPlan(career: any, matches: any[], trends: TrendReport): WeeklyPlan {
  const weaknesses: WeeklyPlan['weaknesses'] = [];
  const goals: WeeklyPlan['goals'] = [];
  const drills: WeeklyPlan['drills'] = [];

  const maps = Array.isArray(career?.mapWinRates) ? career.mapWinRates : [];
  const weakestMap = [...maps]
    .filter((m: any) => (m.matches ?? 0) >= 2)
    .sort((a: any, b: any) => (a.winRate ?? 0) - (b.winRate ?? 0))[0];
  if (weakestMap && (weakestMap.winRate ?? 0) < 50) {
    weaknesses.push({ area: `Map: ${weakestMap.mapName}`, evidence: `${weakestMap.winRate}% WR over ${weakestMap.matches} games`, severity: 'high' });
    goals.push({ goal: `Improve ${weakestMap.mapName} fundamentals`, target: `+5% round win rate`, metric: 'round win rate' });
    drills.push({
      drill: `${weakestMap.mapName} custom-game defaults`, duration: '20 min',
      focus: `Practice attack defaults + one execute on ${weakestMap.mapName}`,
      tiesTo: weakestMap.mapName,
    });
  }

  const w10 = trends.windows.find((w) => w.window === 10) || trends.windows[0];
  if (w10 && typeof w10.kd === 'number' && w10.kd < 1.0) {
    weaknesses.push({ area: 'Fragging consistency', evidence: `${w10.kd} K/D over last ${w10.matches} games`, severity: 'medium' });
    goals.push({ goal: 'Trade more & survive longer', target: 'K/D ≥ 1.0', metric: 'K/D' });
    drills.push({
      drill: 'Deathmatch trade practice', duration: '15 min',
      focus: 'Play off teammates: peek together, trade each kill',
      tiesTo: 'K/D',
    });
  }

  if (w10 && w10.hsPct != null && w10.hsPct < 18) {
    weaknesses.push({ area: 'First-bullet accuracy', evidence: `${w10.hsPct}% HS rate`, severity: 'medium' });
    goals.push({ goal: 'Raise headshot rate', target: '+3% HS', metric: 'HS%' });
    drills.push({
      drill: 'Aim Lab micro-adjustment', duration: '10 min',
      focus: 'Sixshot + microshot, then 2 deathmatches on first-bullet accuracy',
      tiesTo: 'HS%',
    });
  }

  if (w10 && w10.winRate != null && w10.winRate < 45) {
    weaknesses.push({ area: 'Closing out rounds', evidence: `${w10.winRate}% WR`, severity: 'high' });
    goals.push({ goal: 'Win more rounds from winning positions', target: 'WR ≥ 50%', metric: 'win rate' });
    drills.push({
      drill: 'Post-plant + retake drills', duration: '15 min',
      focus: 'Practice 1v1/2v2 post-plant scenarios in a custom',
      tiesTo: 'win rate',
    });
  }

  const form = Array.isArray(career?.recentForm) ? career.recentForm : [];
  if (form.length >= 3 && form.slice(0, 3).every((r: any) => r === 'L')) {
    weaknesses.push({ area: 'Mental reset / consistency', evidence: `Losing streak (${form.slice(0, 5).join('-')})`, severity: 'medium' });
    goals.push({ goal: 'Break the streak with a reset routine', target: 'Win next session opener', metric: 'streak' });
    drills.push({
      drill: 'Pre-game warmup ritual', duration: '10 min',
      focus: 'Consistent warmup (DM → Aim Lab → one custom) before queueing',
      tiesTo: 'streak',
    });
  }

  if (weaknesses.length === 0) {
    goals.push({ goal: 'Keep your current form', target: 'Maintain ≥50% WR', metric: 'win rate' });
    drills.push({
      drill: 'Fundamentals refresh', duration: '20 min',
      focus: 'Deathmatch + one map default practice per session',
      tiesTo: 'maintenance',
    });
  }

  return { weaknesses, goals, drills };
}

// ---------------------------------------------------------------------------
// Question-aware retrieval: intent detection -> filtered context (no vectors).
// ---------------------------------------------------------------------------
export interface QuestionIntent {
  maps: string[];
  agents: string[];
  topics: string[];
}

export function analyzeQuestion(question: string): QuestionIntent {
  const q = question.toLowerCase();
  const maps = ALL_MAPS.filter((m) => q.includes(m.toLowerCase()));
  const agents = ALL_AGENTS.filter((a) => q.includes(a.toLowerCase()));
  const topics = Object.keys(TOPICS).filter((t) => TOPICS[t].test(q));
  return { maps, agents, topics };
}

/** Build a filtered context block for the current question, or null. */
export function buildRetrievalContext(question: string, career: any, matches: any[]): string | null {
  const { maps, agents, topics } = analyzeQuestion(question);
  if (maps.length === 0 && agents.length === 0 && topics.length === 0) return null;

  const lines: string[] = ['RETRIEVED CONTEXT (for this question only):'];
  const list = (Array.isArray(matches) ? matches : []).filter((m: any) => m.result === 'VICTORY' || m.result === 'DEFEAT');

  if (maps.length > 0) {
    for (const map of maps) {
      const mapStat = (Array.isArray(career?.mapWinRates) ? career.mapWinRates : []).find((m: any) => m.mapName === map);
      if (mapStat) lines.push(`- ${map}: ${mapStat.matches} matches, ${mapStat.winRate}% WR, ${mapStat.kd} K/D`);
      const mapMatches = list.filter((m: any) => (m.mapName || '').toLowerCase() === map.toLowerCase()).slice(0, 4);
      if (mapMatches.length > 0) {
        lines.push(`  Recent ${map} games:`);
        for (const m of mapMatches) {
          lines.push(`    ${m.mapName} | ${m.agentName || '?'} | ${m.result} ${m.score || ''} | KDA ${m.kills ?? '?'}/${m.deaths ?? '?'}/${m.assists ?? '?'}${m.kd != null ? ` (${m.kd})` : ''}`);
        }
      } else if (!mapStat) {
        lines.push(`- ${map}: no recent games found for this map`);
      }
    }
  }

  if (agents.length > 0) {
    for (const agent of agents) {
      const agentStat = (Array.isArray(career?.topAgents) ? career.topAgents : []).find((a: any) => a.agentName === agent);
      if (agentStat) {
        lines.push(`- ${agent}: ${agentStat.matches} matches, ${agentStat.winRate}% WR, ${agentStat.kd} K/D${agentStat.adr ? `, ${agentStat.adr} ADR` : ''}`);
      }
      const agentMatches = list.filter((m: any) => (m.agentName || '').toLowerCase() === agent.toLowerCase()).slice(0, 3);
      if (agentMatches.length > 0) {
        lines.push(`  Recent ${agent} games:`);
        for (const m of agentMatches) {
          lines.push(`    ${m.mapName} | ${m.result} ${m.score || ''} | KDA ${m.kills ?? '?'}/${m.deaths ?? '?'}/${m.assists ?? '?'}`);
        }
      } else if (!agentStat) {
        lines.push(`- ${agent}: not in recent data`);
      }
    }
  }

  if (topics.includes('economy')) {
    const buys = list.slice(0, 3).map((m: any) => {
      const rounds = Array.isArray(m.rounds) ? m.rounds : null;
      return rounds ? `${m.mapName}: ${rounds.slice(0, 6).map((r: any) => `${r.round}#${r.buyTypeBlue || r.buy || '?'}`).join(' ')}` : null;
    }).filter(Boolean);
    if (buys.length) lines.push(`- Recent economy: ${buys.join(' | ')}`);
  }

  if (topics.includes('trend')) {
    const t = computeTrends(career, list);
    const w10 = t.windows.find((w) => w.window === 10) || t.windows[0];
    if (w10) {
      const d = t.deltas.find((x) => x.window === w10.window);
      lines.push(`- 10-game window: ${w10.winRate}% WR, ${w10.kd} K/D, ${w10.acs ?? '?'} ACS, ${w10.hsPct ?? '?'}% HS`);
      if (d) {
        lines.push(`- Recent direction: K/D ${d.kd.direction}${d.kd.delta != null ? ` (${d.kd.delta > 0 ? '+' : ''}${d.kd.delta})` : ''} | WR ${d.winRate.direction}${d.winRate.delta != null ? ` (${d.winRate.delta > 0 ? '+' : ''}${d.winRate.delta}pp)` : ''} | ACS ${d.acs.direction}`);
      }
    }
  }

  if (topics.includes('lineups')) {
    const lineupMatches = (lineupsData as any[]).filter((l) =>
      (maps.length === 0 || maps.includes(l.map)) &&
      (agents.length === 0 || agents.includes(l.agent))
    ).slice(0, 3);
    for (const l of lineupMatches) {
      lines.push(`- Lineup: [${l.map} · ${l.agent} · ${l.ability} · ${l.side}] ${l.title}: ${l.description}`);
    }
  }

  if (lines.length === 1) return null;
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Live-match coaching context (in-game state for "force or save?" advice).
// ---------------------------------------------------------------------------
export async function buildLiveMatchContext(): Promise<string | null> {
  try {
    const phase = await getGamePhase();
    if (!phase || phase.phase !== 'INGAME') return null;

    const live = await fetchLiveCoreGame(liveMatchData as any);
    if (!live || !live.inGame) return null;

    const myPlayer = (Array.isArray(live.allies) ? live.allies : []).find((p: any) => p.isPlayer);
    const allyAgents = (Array.isArray(live.allies) ? live.allies : []).map((p: any) => p.agent).filter(Boolean).join(', ');

    return [
      'LIVE MATCH CONTEXT (in-game right now):',
      `- Map: ${live.map || '?'} | Score: ${live.currentScore || '?'} | Round: ${live.currentRound ?? '?'} | Mode: ${live.mode || '?'}`,
      myPlayer ? `- You are playing ${myPlayer.agent || '?'} (side: ${live.mySide || '?'})` : '- You are in the live match',
      allyAgents ? `- Your team: ${allyAgents}` : null,
      '- Give advice for the CURRENT round and the NEXT round (economy: force / save / full buy). Be concise — the player is mid-game.',
    ].filter(Boolean).join('\n');
  } catch (e) {
    return null;
  }
}
