import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import { WebSocket } from 'ws';
import { createCloudApp, CloudDatabase, RelayServer } from '../index';

let server: Server;
let base = '';
let wsUrl = '';
let db: CloudDatabase;
let relay: RelayServer;

before(async () => {
  db = new CloudDatabase(':memory:');
  const { app } = createCloudApp(db);
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 8798;
      base = `http://127.0.0.1:${port}`;
      wsUrl = `ws://127.0.0.1:${port}/relay`;
      relay = new RelayServer(server, db);
      resolve();
    });
  });
});

after(() => {
  relay?.close();
  server?.close();
});

test('GET /api/cloud/health returns service status', async () => {
  const res = await fetch(`${base}/api/cloud/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.service, 'valorecon-cloud');
});

test('POST /api/cloud/enroll registers new device', async () => {
  const res = await fetch(`${base}/api/cloud/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'dev-001',
      publicKey: 'pubkey-abc-123',
      name: 'Main Gaming PC',
      platform: 'windows'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.deviceId, 'dev-001');

  const saved = db.getDevice('dev-001');
  assert.ok(saved);
  assert.equal(saved.name, 'Main Gaming PC');
});

test('Pairing workflow: generate -> claim -> sessionToken', async () => {
  // Generate
  const genRes = await fetch(`${base}/api/cloud/pair/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'dev-001' })
  });
  assert.equal(genRes.status, 200);
  const { pairingCode } = await genRes.json();
  assert.ok(pairingCode);
  assert.equal(pairingCode.length, 6);

  // Claim
  const claimRes = await fetch(`${base}/api/cloud/pair/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: pairingCode,
      clientDeviceId: 'mobile-001'
    })
  });
  assert.equal(claimRes.status, 200);
  const claimData = await claimRes.json();
  assert.equal(claimData.ok, true);
  assert.ok(claimData.sessionToken);

  // Claim again should fail
  const retryRes = await fetch(`${base}/api/cloud/pair/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: pairingCode,
      clientDeviceId: 'mobile-002'
    })
  });
  assert.equal(retryRes.status, 400);
});

test('POST /api/cloud/telemetry stores safe event', async () => {
  const res = await fetch(`${base}/api/cloud/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'dev-001',
      eventType: 'match_analyzed',
      payload: { matchId: 'm-99', durationMs: 1200, apiKey: 'secret-key-to-scrub' }
    })
  });
  assert.equal(res.status, 200);
  assert.ok(db.getTelemetryCount() > 0);
});

test('WebSocket Relay connects host and client and relays messages', async () => {
  const hostWs = new WebSocket(wsUrl);
  const clientWs = new WebSocket(wsUrl);

  await new Promise<void>((resolve) => hostWs.on('open', resolve));
  await new Promise<void>((resolve) => clientWs.on('open', resolve));

  // Authenticate host
  hostWs.send(JSON.stringify({ type: 'auth', deviceId: 'dev-001', isHost: true }));
  // Authenticate client
  clientWs.send(JSON.stringify({ type: 'auth', deviceId: 'dev-001', isHost: true }));

  // Wait briefly for auth
  await new Promise((r) => setTimeout(r, 50));

  // Host sends live update
  const receivedPromise = new Promise<any>((resolve) => {
    clientWs.on('message', (msg) => {
      resolve(JSON.parse(msg.toString()));
    });
  });

  hostWs.send(JSON.stringify({ type: 'match.update', score: '13-7', map: 'Ascent' }));

  const received = await receivedPromise;
  assert.equal(received.type, 'match.update');
  assert.equal(received.score, '13-7');

  hostWs.close();
  clientWs.close();
});
