import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTrends,
  buildSuggestions,
  buildWeeklyPlan,
  analyzeQuestion,
  buildRetrievalContext,
} from '../services/coachService';
import { windowMessages, buildMatchContext } from '../services/gemini';
import { AnalysisReportSchema } from '../services/gemini';

function fakeMatches(n: number): any[] {
  const out: any[] = [];
  for (let i = 0; i < n; i++) {
    const won = i % 2 === 0;
    out.push({
      id: `m${i}`,
      mapName: i % 2 ? 'Bind' : 'Ascent',
      agentName: 'Jett',
      result: won ? 'VICTORY' : 'DEFEAT',
      score: won ? '13-8' : '8-13',
      kills: won ? 20 + i : 14,
      deaths: 15,
      assists: 5,
      kd: 1.2,
      combatScore: 240 + i,
      damagePerRound: 150 + i,
      headshotPct: 22 + (i % 5),
      firstBloods: 2,
      rounds: [
        { round: 1, winType: 'Elimination', buyTypeBlue: 'Pistol', playerKills: 2 },
        { round: 2, winType: 'Elimination', buyTypeBlue: 'Full Buy', playerKills: 1 },
      ],
    });
  }
  return out;
}

const fakeCareer = {
  player: { name: 'T', tag: 'VALO' },
  rank: { tierName: 'Gold 2' },
  stats: { winRate: 52, wins: 26, losses: 24, totalMatches: 50, kd: 1.05 },
  recentForm: ['W', 'L', 'W'],
  topAgents: [
    { agentName: 'Jett', matches: 20, winRate: 55, kd: 1.2 },
    { agentName: 'Sova', matches: 12, winRate: 48, kd: 1.0 },
  ],
  mapWinRates: [
    { mapName: 'Bind', matches: 10, winRate: 35, kd: 0.9 },
    { mapName: 'Ascent', matches: 12, winRate: 60, kd: 1.3 },
  ],
};

test('computeTrends produces windows and deltas', () => {
  const t = computeTrends(fakeCareer, fakeMatches(16));
  assert.ok(t.windows.length > 0, 'windows should exist');
  const w10 = t.windows.find((w) => w.window === 10);
  assert.ok(w10, '10-game window exists');
  assert.ok(typeof w10.kd === 'number');
  assert.ok(w10.winRate !== null && w10.winRate >= 0 && w10.winRate <= 100);
  assert.ok(t.deltas.length > 0, 'deltas exist');
  assert.ok(t.percentiles.length > 0, 'percentiles exist');
});

test('computeTrends handles empty input', () => {
  const t = computeTrends(fakeCareer, []);
  assert.equal(t.windows.length, 0);
});

test('buildSuggestions surfaces weakest map and low K/D', () => {
  const s = buildSuggestions(fakeCareer, fakeMatches(6));
  const labels = s.map((x) => x.label).join(' | ');
  assert.ok(labels.includes('Bind'), 'weakest map suggested');
  assert.ok(s.length <= 5);
});

test('buildWeeklyPlan detects weak map and produces goals + drills', () => {
  const t = computeTrends(fakeCareer, fakeMatches(16));
  const plan = buildWeeklyPlan(fakeCareer, fakeMatches(16), t);
  assert.ok(plan.weaknesses.length > 0, 'weaknesses found');
  assert.ok(plan.goals.length > 0, 'goals exist');
  assert.ok(plan.drills.length > 0, 'drills exist');
  assert.ok(plan.weaknesses.some((w) => w.area.includes('Bind')));
});

test('analyzeQuestion detects map, agent and topics', () => {
  const q = analyzeQuestion('How am I doing on Bind with Jett and my economy?');
  assert.deepEqual(q.maps, ['Bind']);
  assert.ok(q.agents.includes('Jett'));
  assert.ok(q.topics.includes('economy'));
});

test('buildRetrievalContext filters by map and economy', () => {
  const ctx = buildRetrievalContext('How am I on Bind?', fakeCareer, fakeMatches(10));
  assert.ok(ctx, 'context returned');
  assert.ok(ctx.includes('Bind'), 'map stats included');
  assert.ok(ctx.includes('Recent Bind games'), 'recent map games included');

  const eco = buildRetrievalContext('should I force buy or save?', fakeCareer, fakeMatches(6));
  assert.ok(eco && eco.includes('Recent economy'), 'economy line included');
});

test('buildRetrievalContext returns null for irrelevant questions', () => {
  const ctx = buildRetrievalContext('what is the meaning of life', fakeCareer, fakeMatches(6));
  assert.equal(ctx, null);
});

test('windowMessages trims long conversations with a note', () => {
  const msgs = Array.from({ length: 30 }, (_, i) => ({ role: 'user' as const, content: `m${i}` }));
  const { contents, dropped } = windowMessages(msgs);
  assert.equal(dropped, 10);
  assert.ok(contents.length <= 20 + 1, 'kept window + note');
  assert.ok(contents[0].content.includes('omitted'), 'note mentions omitted messages');
});

test('windowMessages passes short conversations through', () => {
  const msgs = [{ role: 'user' as const, content: 'a' }, { role: 'assistant' as const, content: 'b' }];
  const { contents, dropped } = windowMessages(msgs);
  assert.equal(dropped, 0);
  assert.equal(contents.length, 2);
});

test('buildMatchContext is compact and never fabricates', () => {
  const ctx = buildMatchContext({
    mapName: 'Ascent', agentName: 'Jett', result: 'VICTORY', score: '13-8',
    kills: 20, deaths: 10, assists: 5, kd: 2.0, combatScore: 250,
    rounds: [{ round: 1, winType: 'Elimination', buyTypeBlue: 'Pistol', playerKills: 2 }],
    source: 'live', dataQuality: 'partial',
  });
  assert.equal(ctx.map, 'Ascent');
  assert.equal(ctx.kda.kills, 20);
  assert.equal(ctx.hsPct, null, 'unknown HS stays null');
  assert.equal(ctx.dataQuality, 'partial (some stats may be missing)');
  assert.ok(!('teams' in ctx), 'PII/teams stripped');
});

test('AnalysisReportSchema validates a good report and rejects a bad one', () => {
  const good = AnalysisReportSchema.safeParse({
    overallVerdict: 'Solid', rating: 8, summary: 'x', strengths: ['a'], mistakes: ['b'], coachingTips: ['c'],
  });
  assert.ok(good.success);
  const bad = AnalysisReportSchema.safeParse({ rating: 'not-a-number' });
  assert.ok(!bad.success);
});
