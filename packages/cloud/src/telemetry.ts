import { CloudDatabase } from './db';

export interface TelemetryEvent {
  deviceId: string;
  eventType: string;
  payload: Record<string, any>;
}

export function handleTelemetry(db: CloudDatabase, event: TelemetryEvent) {
  if (!event.deviceId || !event.eventType) {
    throw new Error('deviceId and eventType are required');
  }

  // Scrub any sensitive fields from telemetry payload
  const safePayload = { ...event.payload };
  delete safePayload.apiKey;
  delete safePayload.token;
  delete safePayload.password;
  delete safePayload.accessToken;

  db.insertTelemetry(event.deviceId, event.eventType, safePayload);
  return { ok: true };
}
