// Deterministic tests: never hit the real Gemini API or the live Riot client.
process.env.VALORECON_TEST = '1';
process.env.GEMINI_API_KEY = '';
process.env.GEMINI_MODEL = '';
// Point LOCALAPPDATA at an empty dir so the Riot lockfile is never found
// (forces the fast mock-data path even if the game is running).
process.env.LOCALAPPDATA = require('path').join(require('os').tmpdir(), 'valorecon-test-nolockfile');

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import { createApp } from '../index';

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

function get(path: string, useToken = true) {
  return fetch(`${base}${path}`, {
    headers: useToken ? { 'x-valorecon-token': token } : {},
  });
}

test('GET /api/health is open (no token)', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('API requires the launch token', async () => {
  const res = await get('/api/coach/suggestions', false);
  assert.equal(res.status, 401);
});

test('GET /api/auth/token returns the launch token', async () => {
  const res = await fetch(`${base}/api/auth/token`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.token, token);
});

test('POST /api/chat rejects bad body', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('POST /api/chat streams SSE (meta event + [DONE])', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
  });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes('data: {"meta":'), 'meta event present');
  assert.ok(text.includes('data: [DONE]'), 'stream terminates');
  assert.ok(text.includes('data: {"text":'), 'text events streamed');
});

test('GET /api/coach/suggestions returns chips', async () => {
  const res = await get('/api/coach/suggestions');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.suggestions) && body.suggestions.length > 0);
});

test('GET /api/coach/trends returns windows', async () => {
  const res = await get('/api/coach/trends');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.trends.windows));
});

test('GET /api/coach/plan returns goals + drills', async () => {
  const res = await get('/api/coach/plan');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.plan.goals));
  assert.ok(Array.isArray(body.plan.drills));
});

test('GET /api/lineups filters by map', async () => {
  const res = await get('/api/lineups?map=Ascent');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.lineups) && body.lineups.length > 0);
  assert.ok(body.lineups.every((l: any) => l.map === 'Ascent'));
});

test('GET /api/lineups/search finds Sova recons', async () => {
  const res = await get('/api/lineups/search?q=sova');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.lineups.length > 0);
  assert.ok(body.lineups.every((l: any) => l.agent === 'Sova'));
});

test('POST /api/match-analysis/ai returns a valid rule-based report without a key', async () => {
  const res = await fetch(`${base}/api/match-analysis/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ matchId: 'match-9801' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.matchId, 'match-9801');
  assert.ok(typeof body.analysis.overallVerdict === 'string');
  assert.ok(Array.isArray(body.analysis.strengths));
  assert.ok(Array.isArray(body.analysis.coachingTips));
});

test('POST /api/feedback validates input and saves', async () => {
  const bad = await fetch(`${base}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ messageId: 'x' }),
  });
  assert.equal(bad.status, 400);

  const good = await fetch(`${base}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ messageId: 'test-msg', rating: 'down', category: 'Too generic' }),
  });
  assert.equal(good.status, 200);
  const body = await good.json();
  assert.equal(body.ok, true);
});

test('GET /api/ai/usage returns counters', async () => {
  const res = await get('/api/ai/usage');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(typeof body.calls === 'number');
  assert.ok(typeof body.totalTokens === 'number');
});
