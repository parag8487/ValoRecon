import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

export interface DeviceRecord {
  device_id: string;
  public_key: string;
  name: string;
  platform: string;
  created_at: string;
  last_seen: string;
}

export interface PairingRecord {
  pairing_code: string;
  device_id: string;
  expires_at: number;
  status: 'pending' | 'claimed' | 'expired';
}

export interface SessionRecord {
  session_token: string;
  device_id: string;
  created_at: string;
  expires_at: number;
}

export interface TelemetryRecord {
  id: number;
  device_id: string;
  event_type: string;
  payload: string;
  timestamp: string;
}

export class CloudDatabase {
  public db: DatabaseSync;

  constructor(dbPath: string = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        public_key TEXT NOT NULL,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pairings (
        pairing_code TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);
  }

  public upsertDevice(device: DeviceRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO devices (device_id, public_key, name, platform, created_at, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        name = excluded.name,
        last_seen = excluded.last_seen
    `);
    stmt.run(device.device_id, device.public_key, device.name, device.platform, device.created_at, device.last_seen);
  }

  public getDevice(deviceId: string): DeviceRecord | null {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE device_id = ?');
    return (stmt.get(deviceId) as unknown as DeviceRecord) || null;
  }

  public createPairing(pairing: PairingRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO pairings (pairing_code, device_id, expires_at, status)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(pairing.pairing_code, pairing.device_id, pairing.expires_at, pairing.status);
  }

  public getPairing(code: string): PairingRecord | null {
    const stmt = this.db.prepare('SELECT * FROM pairings WHERE pairing_code = ?');
    return (stmt.get(code) as unknown as PairingRecord) || null;
  }

  public claimPairing(code: string) {
    const stmt = this.db.prepare("UPDATE pairings SET status = 'claimed' WHERE pairing_code = ?");
    stmt.run(code);
  }

  public createSession(session: SessionRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (session_token, device_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(session.session_token, session.device_id, session.created_at, session.expires_at);
  }

  public getSession(token: string): SessionRecord | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE session_token = ?');
    return (stmt.get(token) as unknown as SessionRecord) || null;
  }


  public insertTelemetry(deviceId: string, eventType: string, payload: any) {
    const stmt = this.db.prepare(`
      INSERT INTO telemetry (device_id, event_type, payload, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(deviceId, eventType, JSON.stringify(payload), new Date().toISOString());
  }

  public getTelemetryCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM telemetry');
    const res = stmt.get() as { count: number };
    return res.count;
  }
}
