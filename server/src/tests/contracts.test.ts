// Contract conformance and endpoint characterization tests
process.env.VALORECON_TEST = '1';
process.env.GEMINI_API_KEY = '';
process.env.GEMINI_MODEL = '';
process.env.LOCALAPPDATA = require('path').join(require('os').tmpdir(), 'valorecon-test-contracts');

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import { createApp } from '../index';
import {
  CareerDataSchema,
  MatchSummarySchema,
  MatchDetailSchema,
  LiveMatchDataSchema,
  StoreDataSchema,
  WalletDataSchema,
  LoadoutDataSchema,
  BattlepassDataSchema,
  QuestsDataSchema,
  RiotStatusDataSchema,
  GamePhaseDataSchema,
  LiveScoreDataSchema,
  LobbyInspectDataSchema,
  AutoPickSettingsSchema,
  AiSettingsSchema,
  AiUsageSchema,
  AgentAdvisorResponseSchema
} from '../../../packages/contracts/src/index';

let server: Server;
let base = '';
let token = '';

before(async () => {
  const app = createApp();
  token = app.locals.launchToken as string;
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 8799}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

function get(path: string) {
  return fetch(`${base}${path}`, {
    headers: { 'x-valorecon-token': token },
  });
}

test('GET /api/player-career conforms to CareerDataSchema with mock provenance', async () => {
  const res = await get('/api/player-career');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = CareerDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.player.name);
});

test('GET /api/matches conforms to MatchSummarySchema array with mock provenance', async () => {
  const res = await get('/api/matches');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  for (const m of data) {
    const validated = MatchSummarySchema.parse(m);
    assert.equal(validated.source, 'mock');
  }
});

test('GET /api/match/:id conforms to MatchDetailSchema', async () => {
  const res = await get('/api/match/match-001');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = MatchDetailSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.teams.allies.players.length > 0);
});

test('GET /api/live-match conforms to LiveMatchDataSchema', async () => {
  const res = await get('/api/live-match');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = LiveMatchDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.allies.length > 0);
});

test('GET /api/store conforms to StoreDataSchema', async () => {
  const res = await get('/api/store');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = StoreDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.featuredBundle.displayName);
});

test('GET /api/wallet conforms to WalletDataSchema', async () => {
  const res = await get('/api/wallet');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = WalletDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(typeof validated.vp === 'number');
});

test('GET /api/loadout conforms to LoadoutDataSchema', async () => {
  const res = await get('/api/loadout');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = LoadoutDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.identity.playerCard);
});

test('GET /api/battlepass conforms to BattlepassDataSchema', async () => {
  const res = await get('/api/battlepass');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = BattlepassDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
});

test('GET /api/quests conforms to QuestsDataSchema', async () => {
  const res = await get('/api/quests');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = QuestsDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
  assert.ok(validated.dailies.length > 0);
});

test('GET /api/riot/status conforms to RiotStatusDataSchema', async () => {
  const res = await get('/api/riot/status');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = RiotStatusDataSchema.parse(data);
  assert.equal(validated.connected, false);
});

test('GET /api/riot/phase conforms to GamePhaseDataSchema', async () => {
  const res = await get('/api/riot/phase');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = GamePhaseDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
});

test('GET /api/riot/score conforms to LiveScoreDataSchema', async () => {
  const res = await get('/api/riot/score');
  assert.equal(res.status, 200);
  const data = await res.json();
  LiveScoreDataSchema.parse(data);
});

test('GET /api/riot/lobby-inspect conforms to LobbyInspectDataSchema', async () => {
  const res = await get('/api/riot/lobby-inspect');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = LobbyInspectDataSchema.parse(data);
  assert.equal(validated.source, 'mock');
});

test('GET /api/riot/autopick conforms to AutoPickSettingsSchema', async () => {
  const res = await get('/api/riot/autopick');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = AutoPickSettingsSchema.parse(data);
  assert.equal(typeof validated.enabled, 'boolean');
});

test('GET /api/ai/settings conforms to AiSettingsSchema', async () => {
  const res = await get('/api/ai/settings');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = AiSettingsSchema.parse(data);
  assert.equal(typeof validated.hasKey, 'boolean');
});

test('GET /api/ai/usage conforms to AiUsageSchema', async () => {
  const res = await get('/api/ai/usage');
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = AiUsageSchema.parse(data);
  assert.equal(typeof validated.calls, 'number');
});

test('POST /api/agent/choose conforms to AgentAdvisorResponseSchema', async () => {
  const res = await fetch(`${base}/api/agent/choose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ map: 'Ascent', allyComp: ['Jett', 'Sova'] }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  const validated = AgentAdvisorResponseSchema.parse(data);
  assert.ok(validated.recommendations.length > 0);
  assert.ok(validated.compAnalysis.hasDuelist);
});
