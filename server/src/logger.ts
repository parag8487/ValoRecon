import fs from 'fs';
import path from 'path';
import { getConfig } from './config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]+/gi,                             // Google API keys
  /Bearer\s+[A-Za-z0-9._-]+/gi,                        // Bearer tokens
  /Basic\s+[A-Za-z0-9+/=]+/gi,                          // Basic auth
  /x-valorecon-token:\s*[A-Za-z0-9_-]+/gi,              // Launch tokens
  /"apiKey":\s*"[^"]+"/gi,                              // API key in JSON
  /"accessToken":\s*"[^"]+"/gi,                         // Riot accessToken
  /"entitlementsToken":\s*"[^"]+"/gi,                   // Riot entitlements
  /"password":\s*"[^"]+"/gi,                            // Passwords
  /password=[^&;\s]+/gi                                 // Query param password
];


export function redactString(str: string): string {
  let redacted = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted;
}

export function redactObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return redactString(obj) as unknown as T;
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('key') ||
      lowerKey.includes('token') ||
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('auth')
    ) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value);
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  service: string;
  component: string;
  event: string;
  message?: string;
  requestId?: string;
  traceId?: string;
  durationMs?: number;
  errorCode?: string;
  data?: any;
}

export class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  private emit(level: LogLevel, event: string, message?: string, meta: { requestId?: string; traceId?: string; durationMs?: number; errorCode?: string; data?: any } = {}) {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: 'valorecon-agent',
      component: this.component,
      event,
      message: message ? redactString(message) : undefined,
      requestId: meta.requestId,
      traceId: meta.traceId,
      durationMs: meta.durationMs,
      errorCode: meta.errorCode,
      data: meta.data ? redactObject(meta.data) : undefined
    };

    const serialized = JSON.stringify(entry);

    if (process.env.VALORECON_TEST !== '1') {
      if (level === 'error') {
        console.error(serialized);
      } else if (level === 'warn') {
        console.warn(serialized);
      } else {
        console.log(serialized);
      }
    }

    // Append to file sink if available
    try {
      const logDir = path.join(getConfig().dataDir, 'logs');
      if (fs.existsSync(logDir)) {
        const today = new Date().toISOString().slice(0, 10);
        const logFile = path.join(logDir, `agent-${today}.log`);
        fs.appendFileSync(logFile, serialized + '\n', 'utf8');
      }
    } catch (err) {
      // Avoid recursive logger error
    }
  }

  info(event: string, message?: string, meta?: any) {
    this.emit('info', event, message, meta);
  }

  warn(event: string, message?: string, meta?: any) {
    this.emit('warn', event, message, meta);
  }

  error(event: string, message?: string, meta?: any) {
    this.emit('error', event, message, meta);
  }

  debug(event: string, message?: string, meta?: any) {
    this.emit('debug', event, message, meta);
  }
}

export function createLogger(component: string): Logger {
  return new Logger(component);
}
