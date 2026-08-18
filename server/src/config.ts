import path from 'path';
import os from 'os';
import fs from 'fs';
import { z } from 'zod';

export const ConfigSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().min(1024).max(65535).default(8799),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  geminiModel: z.string().default('gemini-3.5-flash'),
  geminiApiKey: z.string().default(''),
  dataDir: z.string(),
  devBootstrap: z.boolean().default(true),
  features: z.object({
    agentSelectAutomation: z.boolean().default(false)
  }).default({})
});

export type AppConfig = z.infer<typeof ConfigSchema>;

function resolveDataDir(): string {
  if (process.env.VALORECON_DATA_DIR) {
    return path.resolve(process.env.VALORECON_DATA_DIR);
  }
  if (process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'ValoRecon');
  }
  return path.join(os.homedir(), '.valorecon');
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const dataDir = overrides.dataDir || resolveDataDir();
  
  // Ensure data directories exist
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const reportsDir = path.join(dataDir, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const logsDir = path.join(dataDir, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    // In restricted test environments, fallback safely
  }

  const isTest = process.env.VALORECON_TEST === '1';
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || (isTest ? 'test' : 'development');

  return ConfigSchema.parse({
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT || '8799', 10),
    nodeEnv,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    dataDir,
    devBootstrap: process.env.VALORECON_DEV_BOOTSTRAP !== '0' && nodeEnv !== 'production',
    features: {
      agentSelectAutomation: process.env.VALORECON_ENABLE_AUTOMATION === '1'
    },
    ...overrides
  });
}

let activeConfig = loadConfig();

export function getConfig(): AppConfig {
  return activeConfig;
}

export function setConfig(newConfig: AppConfig) {
  activeConfig = newConfig;
}
