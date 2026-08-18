"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("../index.js");
(0, node_test_1.test)('ErrorCodeEnum validates known error codes and rejects unknown', () => {
    strict_1.default.equal(index_js_1.ErrorCodeEnum.parse('VR-AUTH-401'), 'VR-AUTH-401');
    strict_1.default.equal(index_js_1.ErrorCodeEnum.parse('VR-RIOT-403'), 'VR-RIOT-403');
    strict_1.default.throws(() => index_js_1.ErrorCodeEnum.parse('UNKNOWN-ERROR'));
});
(0, node_test_1.test)('AppErrorSchema parses structured errors', () => {
    const errorObj = {
        error: {
            code: 'VR-AUTH-401',
            message: 'Unauthorized launch token',
            requestId: 'req-1234',
            retryable: false
        }
    };
    const parsed = index_js_1.AppErrorSchema.parse(errorObj);
    strict_1.default.equal(parsed.error.code, 'VR-AUTH-401');
    strict_1.default.equal(parsed.error.requestId, 'req-1234');
});
(0, node_test_1.test)('CareerDataSchema validates live and mock provenance', () => {
    const sampleCareer = {
        source: 'mock',
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
        recentForm: ['W', 'W', 'L', 'W'],
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
    const parsed = index_js_1.CareerDataSchema.parse(sampleCareer);
    strict_1.default.equal(parsed.source, 'mock');
    strict_1.default.equal(parsed.player.name, 'TenZ');
});
(0, node_test_1.test)('AnalysisReportSchema rejects invalid reports and validates compliant reports', () => {
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
    const parsed = index_js_1.AnalysisReportSchema.parse(goodReport);
    strict_1.default.equal(parsed.rating, 8.5);
    strict_1.default.throws(() => index_js_1.AnalysisReportSchema.parse({
        overallVerdict: 'Missing fields'
    }));
});
(0, node_test_1.test)('FeedbackInputSchema enforces bounds and valid rating', () => {
    const valid = {
        messageId: 'msg-01',
        rating: 'up',
        category: 'tactical',
        comment: 'Very helpful analysis'
    };
    strict_1.default.equal(index_js_1.FeedbackInputSchema.parse(valid).rating, 'up');
    strict_1.default.throws(() => index_js_1.FeedbackInputSchema.parse({
        messageId: '',
        rating: 'neutral'
    }));
});
(0, node_test_1.test)('HealthResponseSchema validates health envelope', () => {
    const health = {
        ok: true,
        status: 'ready',
        agentVersion: '1.0.0',
        protocolVersion: 'v1',
        components: {
            agent: 'ready',
            riot: 'available',
            storage: 'ready'
        }
    };
    const parsed = index_js_1.HealthResponseSchema.parse(health);
    strict_1.default.equal(parsed.ok, true);
    strict_1.default.equal(parsed.components?.agent, 'ready');
});
(0, node_test_1.test)('WebSocketEnvelopeSchema parses protocol envelopes', () => {
    const envelope = {
        version: 1,
        type: 'request',
        id: 'env-1234',
        ts: new Date().toISOString(),
        deviceId: 'dev-5678',
        method: 'agent.health',
        payload: {}
    };
    const parsed = index_js_1.WebSocketEnvelopeSchema.parse(envelope);
    strict_1.default.equal(parsed.method, 'agent.health');
    strict_1.default.equal(parsed.version, 1);
});
