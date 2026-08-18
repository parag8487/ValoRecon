import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { getLiveMatch, LiveMatchData } from '../api/client';
import { LobbyRoster } from '../components/LobbyRoster';

export const LiveMatchScreen: React.FC = () => {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState<LiveMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLive = () => {
    setRefreshing(true);
    getLiveMatch()
      .then(setLiveData)
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchLive();
    // Heavy core-game fetch (rosters/agents) — poll slowly. The LobbyRoster
    // component above handles the fast-updating live score on its own.
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !liveData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  const isLobby = liveData?.status === 'IN_LOBBY' || liveData?.inGame === false;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Real API-available roster: agents, ranks, streaks */}
      <LobbyRoster />

      {/* Live Match Header Banner */}
      <div style={{
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid ${isLobby ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 70, 85, 0.4)'}`,
        backgroundColor: 'var(--surface)',
        backgroundImage: liveData?.mapImageUrl ? `url(${liveData.mapImageUrl})` : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLobby ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 70, 85, 0.2)',
              border: `1px solid ${isLobby ? 'var(--accent-cyan)' : 'var(--accent-red)'}`,
              color: isLobby ? 'var(--accent-cyan)' : 'var(--accent-red)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <span className="pulse-dot" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isLobby ? 'var(--accent-cyan)' : 'var(--accent-red)'
              }} />
              {isLobby ? 'LIVE RADAR ACTIVE (LOBBY)' : 'LIVE MATCH IN-PROGRESS'}
            </span>
            {liveData?.matchId && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ID: {liveData.matchId}
              </span>
            )}
            <span className="tactical-badge" style={{
              backgroundColor: liveData?.source === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(248, 183, 62, 0.15)',
              color: liveData?.source === 'live' ? 'var(--accent-green)' : 'var(--accent-gold)',
              border: `1px solid ${liveData?.source === 'live' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 183, 62, 0.3)'}`
            }}>
              {liveData?.source === 'live' ? 'LIVE GAME DATA' : 'TACTICAL RADAR'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', color: '#fff', lineHeight: 1 }}>
              {liveData?.map || 'Ascent'}
            </h1>
            <span style={{
              fontSize: '14px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: isLobby ? 'var(--accent-green)' : 'var(--accent-cyan)',
              borderLeft: '1px solid rgba(255,255,255,0.2)',
              paddingLeft: '12px'
            }}>
              {isLobby ? 'READY TO QUEUE' : liveData?.mySide || 'Defenders'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>Status: <strong>{isLobby ? 'Waiting in Menu' : 'In Game'}</strong></span>
            <span>Polling: <strong style={{ color: 'var(--accent-green)' }}>Auto-Sync (30s)</strong></span>
            <span>Mode: <strong>{liveData?.mode || 'Competitive'}</strong></span>
          </div>
        </div>

        {/* Live Scoreboard or Lobby Action */}
        {isLobby ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => navigate('/agent-select')}
              className="tactical-btn"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <UserCheck size={16} /> OPEN AGENT ADVISOR
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Auto-detects Agent Select when queue pops
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '14px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                CURRENT ROUND: {liveData?.currentRound || 0}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '44px',
                lineHeight: 1,
                color: '#fff',
                marginTop: '4px'
              }}>
                {liveData?.currentScore || '0 - 0'}
              </div>
            </div>

            <button
              onClick={fetchLive}
              disabled={refreshing}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Refresh radar"
            >
              <RefreshCw size={18} className={refreshing ? 'pulse-dot' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Lobby State Info Card */}
      {isLobby && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="var(--accent-green)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              RIOT CLIENT ONLINE & READY
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ValoRecon is actively connected to your local VALORANT client. When you enter Matchmaking, this screen will automatically transition into the <strong>Agent Select Helper</strong>, and once the match begins, live economy, ultimate charge states, and mid-round AI cues will stream right here in real time.
          </p>
        </div>
      )}

      {/* Live AI Coach Tactical Tips */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Sparkles size={18} color="var(--accent-red)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            TACTICAL AI RADAR ALERTS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(liveData?.liveInsights || []).map((insight, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
