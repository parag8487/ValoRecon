import crypto from 'crypto';
import { CloudDatabase, DeviceRecord } from './db';

export interface EnrollRequest {
  deviceId?: string;
  publicKey: string;
  name: string;
  platform: string;
}

export function handleEnroll(db: CloudDatabase, req: EnrollRequest) {
  const deviceId = req.deviceId || crypto.randomUUID();
  const now = new Date().toISOString();

  const record: DeviceRecord = {
    device_id: deviceId,
    public_key: req.publicKey,
    name: req.name || 'ValoRecon Desktop',
    platform: req.platform || 'windows',
    created_at: now,
    last_seen: now
  };

  db.upsertDevice(record);

  return {
    ok: true,
    deviceId,
    enrolledAt: now
  };
}
