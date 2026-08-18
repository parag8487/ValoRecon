// Security, hardening, and state migration test suite
process.env.VALORECON_TEST = '1';
process.env.GEMINI_API_KEY = '';
process.env.GEMINI_MODEL = '';
process.env.LOCALAPPDATA = require('path').join(require('os').tmpdir(), 'valorecon-test-security');

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';
import { createApp } from '../index';
import { timingSafeEqual } from '../middleware/auth';
import { redactString, redactObject } from '../logger';
import { StateStore } from '../storage/stateStore';
import { lifecycle } from '../lifecycle';
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
  server?.close();
});

test('timingSafeEqual compares identical strings and rejects different length or content', () => {
  assert.equal(timingSafeEqual('abcdef123456', 'abcdef123456'), true);
  assert.equal(timingSafeEqual('abcdef123456', 'abcdef123457'), false);
  assert.equal(timingSafeEqual('abcdef', 'abcdef123'), false);
});

test('Logger redacts sensitive API keys and tokens', () => {
  const secretKey = 'AIzaSyABC123456789012345678901234567';
  const redacted = redactString(`Configuring key ${secretKey}`);
  assert.ok(!redacted.includes(secretKey));
  assert.ok(redacted.includes('[REDACTED]'));

  const sensitiveObj = {
    apiKey: 'my-secret-key',
    accessToken: 'my-token',
    password: 'secret-pass',
    safeField: 'normal-value'
  };
  const redactedObj = redactObject(sensitiveObj);
  assert.equal(redactedObj.apiKey, '[REDACTED]');
  assert.equal(redactedObj.accessToken, '[REDACTED]');
  assert.equal(redactedObj.password, '[REDACTED]');
  assert.equal(redactedObj.safeField, 'normal-value');
});

test('404 routes return structured JSON with VR-REQUEST-400 and request ID', async () => {
  const res = await fetch(`${base}/api/nonexistent-route`, {
    headers: { 'x-valorecon-token': token }
  });
  assert.equal(res.status, 404);
  assert.ok(res.headers.get('x-request-id'));
  const body = await res.json();
  assert.equal(body.error.code, 'VR-REQUEST-400');
  assert.ok(body.error.message.includes('Route not found'));
  assert.ok(body.error.requestId);
});

test('Missing or invalid token returns structured JSON VR-AUTH-401', async () => {
  const res = await fetch(`${base}/api/matches`, {
    headers: { 'x-valorecon-token': 'wrong-token' }
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, 'VR-AUTH-401');
  assert.ok(body.error.requestId);
});

test('Production mode blocks /api/auth/token with VR-AUTH-403', async () => {
  const originalConfig = loadConfig();
  setConfig({ ...originalConfig, devBootstrap: false, nodeEnv: 'production' });

  try {
    const res = await fetch(`${base}/api/auth/token`);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'VR-AUTH-403');
    assert.ok(body.error.message.includes('disabled in production'));
  } finally {
    setConfig(originalConfig);
  }
});

test('GET /api/capabilities returns capabilities and features', async () => {
  const res = await fetch(`${base}/api/capabilities`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.capabilities));
  assert.ok(body.capabilities.includes('agent.health'));
  assert.equal(typeof body.features.agentSelectAutomation, 'boolean');
});

test('StateStore provides atomic writes and report retention limit', () => {
  const tmpDir = path.join(require('os').tmpdir(), `valorecon-statestore-test-${Date.now()}`);
  const store = new StateStore(tmpDir);

  // Atomic write & read
  store.writeJsonAtomic('test.json', { hello: 'world' });
  const read = store.readJson('test.json', {});
  assert.deepEqual(read, { hello: 'world' });

  // Save reports exceeding retention
  for (let i = 0; i < 55; i++) {
    store.saveReport(`match-${i}`, { id: `match-${i}`, score: '13-5' });
  }

  const reportsDir = path.join(tmpDir, 'reports');
  const files = fs.readdirSync(reportsDir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length <= 50, `Reports count ${files.length} should be <= 50`);
});

test('Lifecycle gracefully drains active streams and stops', async () => {
  assert.equal(lifecycle.getState(), 'BOOTING');
  let hookRan = false;
  lifecycle.onShutdown(() => {
    hookRan = true;
  });

  await lifecycle.shutdown(undefined, 1000);
  assert.equal(lifecycle.getState(), 'STOPPED');
  assert.equal(hookRan, true);
});
