import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

import { loadConfig, getConfig, AppConfig } from './config';
import { createLogger } from './logger';
import { requestIdMiddleware } from './middleware/requestId';
import { securityHeadersMiddleware } from './middleware/securityHeaders';
import { createRateLimiter } from './middleware/rateLimiter';
import { createAuthMiddleware } from './middleware/auth';
import { notFoundMiddleware, errorHandlerMiddleware } from './middleware/errorHandler';
import { lifecycle } from './lifecycle';

import valorantRouter from './routes/valorant';
import chatRouter from './routes/chat';
import matchAnalysisRouter from './routes/matchAnalysis';
import aiRouter from './routes/ai';
import riotRouter from './routes/riot';
import careerRouter from './routes/career';
import matchesRouter from './routes/matches';
import liveMatchRouter from './routes/liveMatch';
import agentChooseRouter from './routes/agentChoose';
import storeRouter from './routes/store';
import loadoutRouter from './routes/loadout';
import battlepassRouter from './routes/battlepass';
import questsRouter from './routes/quests';
import premiumRouter from './routes/premium';
import coachRouter from './routes/coach';
import feedbackRouter from './routes/feedback';
import lineupsRouter from './routes/lineups';
import { startAutoPickPoller, stopAutoPickPoller } from './services/riotClient';

dotenv.config();

// ---------------------------------------------------------------------------
// App factory (exported so tests can boot an ephemeral instance).
// ---------------------------------------------------------------------------
export function createApp(customConfig?: Partial<AppConfig>) {
  const config = customConfig ? loadConfig(customConfig) : getConfig();
  const logger = createLogger('server');
  const app = express();

  const launchToken = crypto.randomBytes(32).toString('hex');
  app.locals.launchToken = launchToken;

  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'tauri://localhost',
    'http://tauri.localhost',
  ];

  app.use(requestIdMiddleware);
  app.use(securityHeadersMiddleware);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }));

  app.use(createRateLimiter({ windowMs: 60 * 1000, max: 600, keyPrefix: 'api-global' }));
  app.use(express.json({ limit: '5mb' }));

  // Auth middleware
  app.use('/api', createAuthMiddleware(() => app.locals.launchToken as string));

  // Token bootstrap (development-only)
  app.get('/api/auth/token', (_req, res) => {
    res.json({ token: launchToken });
  });

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      status: 'ready',
      agentVersion: '1.0.0',
      protocolVersion: 'v1',
      components: {
        agent: 'ready',
        storage: 'ready'
      }
    });
  });

  // Capabilities
  app.get('/api/capabilities', (_req, res) => {
    res.json({
      version: '1.0.0',
      protocolVersion: 'v1',
      capabilities: [
        'agent.health',
        'agent.capabilities',
        'game.public_data',
        'riot.local_reads',
        'coach.deterministic',
        'coach.chat_stream',
        'analysis.ai_report',
        'settings.local_state'
      ],
      features: {
        agentSelectAutomation: config.features.agentSelectAutomation
      }
    });
  });

  // Graceful shutdown endpoint
  app.post('/api/agent/shutdown', async (_req, res) => {
    res.json({ ok: true, message: 'Shutting down agent' });
    setTimeout(() => {
      lifecycle.shutdown();
    }, 50);
  });

  // Valorant API Proxies
  app.use('/api', valorantRouter);

  // AI Features
  app.use('/api', chatRouter);
  app.use('/api', matchAnalysisRouter);
  app.use('/api', aiRouter);

  // Coach extras (suggestions, trends, plan, live, screenshot, feedback)
  app.use('/api', coachRouter);
  app.use('/api', feedbackRouter);

  // Lineup knowledge base
  app.use('/api', lineupsRouter);

  // Riot Client Local API & Status
  app.use('/api', riotRouter);

  // Account & Gameplay Data (Live + Mock fallback)
  app.use('/api', careerRouter);
  app.use('/api', matchesRouter);
  app.use('/api', liveMatchRouter);
  app.use('/api', agentChooseRouter);
  app.use('/api', storeRouter);
  app.use('/api', loadoutRouter);
  app.use('/api', battlepassRouter);
  app.use('/api', questsRouter);
  app.use('/api', premiumRouter);

  // 404 handler for unknown routes
  app.use(notFoundMiddleware);

  // Error handler middleware (never leaks stack traces)
  app.use(errorHandlerMiddleware);

  return app;
}

// Only listen when run directly (not when imported by tests).
if (require.main === module && process.env.VALORECON_TEST !== '1') {
  const config = getConfig();
  const logger = createLogger('main');
  const app = createApp();
  startAutoPickPoller();
  
  const server = app.listen(config.port, config.host, () => {
    lifecycle.setState('SERVING');
    logger.info('Server started', `ValoRecon Agent listening on http://${config.host}:${config.port}`);
  });

  const handleSignal = async (signal: string) => {
    logger.info('Received shutdown signal', `Signal: ${signal}`);
    await lifecycle.shutdown(server);
    process.exit(0);
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
}

