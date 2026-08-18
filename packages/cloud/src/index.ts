import express from 'express';
import cors from 'cors';
import { CloudDatabase } from './db';
import { handleEnroll } from './enrollment';
import { generatePairingCode, claimPairingCode } from './pairing';
import { handleTelemetry } from './telemetry';

export function createCloudApp(customDb?: CloudDatabase) {
  const db = customDb || new CloudDatabase();
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Health
  app.get('/api/cloud/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'valorecon-cloud',
      status: 'ready',
      version: '1.0.0'
    });
  });

  // Device Enrollment
  app.post('/api/cloud/enroll', (req, res) => {
    try {
      const result = handleEnroll(db, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Generate Pairing Code
  app.post('/api/cloud/pair/generate', (req, res) => {
    const { deviceId, ttlMs } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: 'deviceId is required' });
      return;
    }
    const code = generatePairingCode(db, deviceId, ttlMs);
    res.json({ ok: true, pairingCode: code });
  });

  // Claim Pairing Code
  app.post('/api/cloud/pair/claim', (req, res) => {
    const { code, clientDeviceId } = req.body;
    if (!code || !clientDeviceId) {
      res.status(400).json({ error: 'code and clientDeviceId are required' });
      return;
    }
    const result = claimPairingCode(db, code, clientDeviceId);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  // Telemetry Ingestion
  app.post('/api/cloud/telemetry', (req, res) => {
    try {
      const result = handleTelemetry(db, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return { app, db };
}

export { CloudDatabase } from './db';
export { RelayServer } from './relay';
