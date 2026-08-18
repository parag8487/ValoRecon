import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

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
import { startAutoPickPoller } from './services/riotClient';

dotenv.config();

// ---------------------------------------------------------------------------
// App factory (exported so tests can boot an ephemeral instance).
// ---------------------------------------------------------------------------
export function createApp() {
  const app = express();

  // Per-launch auth token: generated at boot, never persisted. The web app must
  // fetch it from /api/auth/token (protected by the CORS allowlist below) and
  // send it as `x-valorecon-token` on every API call. This blocks arbitrary local
  // pages/processes from driving the server (burning Gemini quota, reading Riot
  // data) even if they manage to reach the port.
  const launchToken = crypto.randomBytes(32).toString('hex');
  app.locals.launchToken = launchToken;

  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(cors({
    origin(origin, callback) {
      // Allow same-origin (no Origin header) and the Vite dev server.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }));
  app.use(express.json({ limit: '5mb' }));

  // Auth middleware — everything under /api except health + token bootstrap.
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/auth/token') return next();
    const token = req.headers['x-valorecon-token'] as string | undefined;
    if (!token || token !== launchToken) {
      res.status(401).json({ error: 'Unauthorized: missing or invalid x-valorecon-token header' });
      return;
    }
    next();
  });

  // Token bootstrap (CORS-protected — only the dev frontend can read it).
  app.get('/api/auth/token', (_req, res) => {
    res.json({ token: launchToken });
  });

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
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

  return app;
}

// Only listen when run directly (not when imported by tests).
if (require.main === module && process.env.VALORECON_TEST !== '1') {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '8799', 10);
  const HOST = process.env.HOST || '127.0.0.1';
  startAutoPickPoller();
  app.listen(PORT, HOST, () => {
    console.log(`ValoRecon server running on http://${HOST}:${PORT}`);
  });
}
