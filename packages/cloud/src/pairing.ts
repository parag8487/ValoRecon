import crypto from 'crypto';
import { CloudDatabase, PairingRecord, SessionRecord } from './db';

export function generatePairingCode(db: CloudDatabase, deviceId: string, ttlMs = 300000): string {
  // Generate 6 character alphanumeric uppercase code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }

  const pairing: PairingRecord = {
    pairing_code: code,
    device_id: deviceId,
    expires_at: Date.now() + ttlMs,
    status: 'pending'
  };

  db.createPairing(pairing);
  return code;
}

export function claimPairingCode(
  db: CloudDatabase,
  code: string,
  clientDeviceId: string
): { ok: boolean; sessionToken?: string; error?: string } {
  const pairing = db.getPairing(code.toUpperCase());
  if (!pairing) {
    return { ok: false, error: 'Invalid pairing code' };
  }

  if (pairing.expires_at < Date.now() || pairing.status !== 'pending') {
    return { ok: false, error: 'Pairing code expired or already claimed' };
  }

  db.claimPairing(pairing.pairing_code);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const session: SessionRecord = {
    session_token: sessionToken,
    device_id: clientDeviceId,
    created_at: new Date().toISOString(),
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  db.createSession(session);

  return {
    ok: true,
    sessionToken
  };
}
