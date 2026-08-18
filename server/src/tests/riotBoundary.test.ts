// Riot boundary, compliance, queue, and cache tests
process.env.VALORECON_TEST = '1';
process.env.GEMINI_API_KEY = '';
process.env.GEMINI_MODEL = '';
process.env.LOCALAPPDATA = require('path').join(require('os').tmpdir(), 'valorecon-test-riot-boundary');

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import { createApp } from '../index';
import { RequestQueue, TtlLruCache, startAutoPickPoller, stopAutoPickPoller } from '../services/riotClient';
import { setConfig, loadConfig } from '../config';

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
  stopAutoPickPoller();
  server?.close();
});

test('POST /api/riot/select is refused with VR-RIOT-403 when automation is disabled', async () => {
  const res = await fetch(`${base}/api/riot/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ agentUuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa' })
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, 'VR-RIOT-403');
  assert.ok(body.error.message.includes('automation is disabled'));
});

test('POST /api/riot/lock is refused with VR-RIOT-403 when automation is disabled', async () => {
  const res = await fetch(`${base}/api/riot/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-valorecon-token': token },
    body: JSON.stringify({ agentUuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa' })
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, 'VR-RIOT-403');
  assert.ok(body.error.message.includes('automation is disabled'));
});

test('RequestQueue enforces concurrency and sequential task execution', async () => {
  const queue = new RequestQueue(2, 20);
  let active = 0;
  let maxObserved = 0;
  const completed: number[] = [];

  const makeTask = (id: number, delayMs: number) => {
    return queue.run(async () => {
      active++;
      maxObserved = Math.max(maxObserved, active);
      await new Promise((r) => setTimeout(r, delayMs));
      active--;
      completed.push(id);
      return id;
    });
  };

  const results = await Promise.all([
    makeTask(1, 30),
    makeTask(2, 30),
    makeTask(3, 30),
    makeTask(4, 30)
  ]);

  assert.deepEqual(results, [1, 2, 3, 4]);
  assert.ok(maxObserved <= 2, `Max concurrency should be <= 2, observed ${maxObserved}`);
  assert.equal(completed.length, 4);
});

test('TtlLruCache handles TTL expiration and LRU eviction', async () => {
  const cache = new TtlLruCache<string, string>(3, 100); // 3 max entries, 100ms TTL

  
  cache.set('a', 'alpha');
  cache.set('b', 'beta');
  cache.set('c', 'gamma');
  
  assert.equal(cache.get('a'), 'alpha');
  assert.equal(cache.get('b'), 'beta');
  assert.equal(cache.get('c'), 'gamma');

  // Insert 4th to trigger LRU eviction (a was read most recently, then b, c)
  cache.set('d', 'delta');
  assert.equal(cache.size, 3);

  // Wait for TTL expiration
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(cache.get('d'), undefined);
});

test('Observer poller starts and stops cleanly without unhandled errors', () => {
  const stop = startAutoPickPoller();
  assert.equal(typeof stop, 'function');
  stop();
});
