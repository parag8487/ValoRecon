import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErrorCodeEnum,
  AppErrorSchema,
  AgentSchema,
  CareerDataSchema,
  MatchSummarySchema,
  MatchDetailSchema,
  LiveMatchDataSchema,
  AnalysisReportSchema,
  AIMatchAnalysisSchema,
  ChatInputSchema,
  FeedbackInputSchema,
  ScreenshotInputSchema,
  HealthResponseSchema,
  WebSocketEnvelopeSchema,
  AutoPickSettingsSchema,
  LobbyInspectDataSchema
} from '../index.js';

test('ErrorCodeEnum validates known error codes and rejects unknown', () => {
  assert.equal(ErrorCodeEnum.parse('VR-AUTH-401'), 'VR-AUTH-401');
  assert.equal(ErrorCodeEnum.parse('VR-RIOT-403'), 'VR-RIOT-403');
  assert.throws(() => ErrorCodeEnum.parse('UNKNOWN-ERROR'));
});

test('AppErrorSchema parses structured errors', () => {
  const errorObj = {
    error: {
      code: 'VR-AUTH-401',
      message: 'Unauthorized launch token',
      requestId: 'req-1234',
      retryable: false
    }
  };
  const parsed = AppErrorSchema.parse(errorObj);
  assert.equal(parsed.error.code, 'VR-AUTH-401');
  assert.equal(parsed.error.requestId, 'req-1234');
});

test('CareerDataSchema validates live and mock provenance', () => {
  const sampleCareer = {
    source: 'mock' as const,
    player: {
      name: 'TenZ',
      tag: 'NA1',
      title: 'Radiant',
      accountLevel: 350,
      cardUrl: 'https://example.com/card.png',
      smallCardUrl: 'https://example.com/small.png',
      avatarUrl: 'https://example.com/avatar.png'
    },
    rank: {
      tier: 27,
      tierName: 'Radiant',
      tierDivision: 1,
      rr: 450,
      maxRr: 500,
      peakTier: 27,
      peakTierName: 'Radiant',
      tierIcon: 'https://example.com/tier.png',
      leaderboardRank: 12
    },
    stats: {
      winRate: 64.5,
      wins: 120,
      losses: 66,
      totalMatches: 186,
      kd: 1.45,
      kills: 3500,
      deaths: 2413,
      assists: 800,
      headshotPct: 32.5,
      bodyPct: 55.0,
      legPct: 12.5,
      damagePerRound: 168.4,
      combatScore: 285.2,
      clutchSuccessPct: 22.0,
      firstBloodsPerMatch: 3.5,
      aces: 4,
      flawlessRounds: 18
    },
    recentForm: ['W', 'W', 'L', 'W'] as ('W' | 'L')[],
    topAgents: [
      {
        agentName: 'Jett',
        role: 'Duelist',
        matches: 80,
        winRate: 68.0,
        kd: 1.52,
        adr: 175.0,
        iconUrl: 'https://example.com/jett.png',
        portraitUrl: 'https://example.com/jett-full.png'
      }
    ],
    mapWinRates: [
      {
        mapName: 'Ascent',
        matches: 40,
        winRate: 70.0,
        kd: 1.55
      }
    ]
  };

  const parsed = CareerDataSchema.parse(sampleCareer);
  assert.equal(parsed.source, 'mock');
  assert.equal(parsed.player.name, 'TenZ');
});

test('AnalysisReportSchema rejects invalid reports and validates compliant reports', () => {
  const goodReport = {
    overallVerdict: 'Outstanding play',
    rating: 8.5,
    summary: 'Great entry fragging and economy control',
    strengths: ['High headshot rate', 'First blood consistency'],
    mistakes: ['Dry peeking operator in round 12'],
    coachingTips: ['Use flash before peeking A long'],
    economyRating: 'A',
    clutchRating: 'B+'
  };

  const parsed = AnalysisReportSchema.parse(goodReport);
  assert.equal(parsed.rating, 8.5);

  assert.throws(() => AnalysisReportSchema.parse({
    overallVerdict: 'Missing fields'
  }));
});

test('FeedbackInputSchema enforces bounds and valid rating', () => {
  const valid = {
    messageId: 'msg-01',
    rating: 'up' as const,
    category: 'tactical',
    comment: 'Very helpful analysis'
  };
  assert.equal(FeedbackInputSchema.parse(valid).rating, 'up');

  assert.throws(() => FeedbackInputSchema.parse({
    messageId: '',
    rating: 'neutral'
  }));
});

test('HealthResponseSchema validates health envelope', () => {
  const health = {
    ok: true,
    status: 'ready' as const,
    agentVersion: '1.0.0',
    protocolVersion: 'v1',
    components: {
      agent: 'ready' as const,
      riot: 'available' as const,
      storage: 'ready' as const
    }
  };
  const parsed = HealthResponseSchema.parse(health);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.components?.agent, 'ready');
});

test('WebSocketEnvelopeSchema parses protocol envelopes', () => {
  const envelope = {
    version: 1,
    type: 'request' as const,
    id: 'env-1234',
    ts: new Date().toISOString(),
    deviceId: 'dev-5678',
    method: 'agent.health',
    payload: {}
  };
  const parsed = WebSocketEnvelopeSchema.parse(envelope);
  assert.equal(parsed.method, 'agent.health');
  assert.equal(parsed.version, 1);
});
