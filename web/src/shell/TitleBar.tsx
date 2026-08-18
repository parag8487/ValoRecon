import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { getWallet, getRiotStatus, getLiveMatch, WalletData, RiotStatusData } from '../api/client';
import { ValoReconMonogram } from '../components/ValoReconLogo';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'COMMAND DASHBOARD', subtitle: 'TACTICAL OVERVIEW & PERFORMANCE' },
  '/coach': { title: 'RADIANT AI COACH', subtitle: 'LIVE STRATEGIC & TACTICAL ASSISTANT' },
  '/analysis': { title: 'MATCH ANALYSIS', subtitle: 'AI-POWERED POST-GAME BREAKDOWN' },
  '/match-detail': { title: 'MATCH DETAIL & SCOREBOARD', subtitle: 'ROUNDS, ECONOMY & COMBAT METRICS' },
  '/live-match': { title: 'LIVE MATCH TRACKER', subtitle: 'REAL-TIME ULTIMATE & ECONOMY RADAR' },
  '/agent-select': { title: 'AGENT SELECT ADVISOR', subtitle: 'MAP META SYNERGY & INSTANT PICK AID' },
  '/statistics': { title: 'PERFORMANCE STATISTICS', subtitle: 'AGENT, MAP & COMBAT ANALYTICS' },
  '/store': { title: 'FEATURED STORE & NIGHT MARKET', subtitle: 'DAILY ROTATION & SPECIAL OFFERS' },
  '/loadout': { title: 'WEAPON ARSENAL & LOADOUT', subtitle: 'EQUIPPED SKINS, CHROMAS & BUDDIES' },
  '/battlepass': { title: 'BATTLEPASS PROGRESSION', subtitle: 'SEASON REWARDS & QUESTS' },
  '/settings': { title: 'SYSTEM SETTINGS', subtitle: 'APP CONFIGURATION & PREFERENCES' },
};

interface LiveState {
  inGame: boolean;
  map: string;
  score: string;
}

export const TitleBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [riotStatus, setRiotStatus] = useState<RiotStatusData>({ connected: false, gameRunning: false });
  const [live, setLive] = useState<LiveState>({ inGame: false, map: '', score: '' });

  const pollStatus = () => {
    getRiotStatus().then(setRiotStatus).catch(() => setRiotStatus({ connected: false, gameRunning: false }));
    getWallet().then(setWallet).catch(() => setWallet(null));
    getLiveMatch()
      .then((m) => setLive({ inGame: !!m.inGame, map: m.map || '', score: m.currentScore || '' }))
      .catch(() => setLive({ inGame: false, map: '', score: '' }));
  };

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const routeInfo = ROUTE_TITLES[location.pathname] || {
    title: 'VALORECON',
    subtitle: 'YOUR AI VALORANT COACH'
  };

  return (
    <header className="app-topbar" style={{
      minHeight: '56px',
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      userSelect: 'none',
      zIndex: 90,
      flexShrink: 0
    }}>
      {/* Title & Subtitle with Monogram */}
      <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <ValoReconMonogram size={20} />
        <div style={{ display: 'flex', alignItems: 'baseline', minWidth: 0, gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap'
          }}>
            {routeInfo.title}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            paddingLeft: '8px',
            whiteSpace: 'nowrap'
          }}>
            {routeInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Riot Account Connection Indicator & Match Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Riot Account Status Pill */}
        <div
          title={riotStatus.connected ? `Connected to ${riotStatus.gameName}#${riotStatus.gameTag} (${riotStatus.region?.toUpperCase()})` : 'Local Riot Client lockfile offline'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: riotStatus.connected
              ? 'rgba(16, 185, 129, 0.12)'
              : riotStatus.gameRunning
              ? 'rgba(248, 183, 62, 0.12)'
              : 'rgba(255, 70, 85, 0.08)',
            border: `1px solid ${
              riotStatus.connected
                ? 'rgba(16, 185, 129, 0.35)'
                : riotStatus.gameRunning
                ? 'rgba(248, 183, 62, 0.35)'
                : 'rgba(255, 70, 85, 0.2)'
            }`,
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            color: riotStatus.connected
              ? 'var(--accent-green)'
              : riotStatus.gameRunning
              ? 'var(--accent-gold)'
              : 'var(--text-muted)'
          }}
        >
          <span
            className={riotStatus.connected ? 'pulse-dot' : ''}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: riotStatus.connected
                ? 'var(--accent-green)'
                : riotStatus.gameRunning
                ? 'var(--accent-gold)'
                : 'var(--accent-red)',
              display: 'inline-block'
            }}
          />
          {riotStatus.connected ? (
            <span>
              CONNECTED: {riotStatus.gameName}#{riotStatus.gameTag}
            </span>
          ) : riotStatus.gameRunning ? (
            <span>RIOT CLIENT DETECTED</span>
          ) : (
            <span>RIOT CLIENT OFFLINE</span>
          )}
        </div>

        {/* Live Match Indicator — only shown when actually in a game */}
        {live.inGame && (
          <div
            onClick={() => navigate('/live-match')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 70, 85, 0.12)',
              border: '1px solid rgba(255, 70, 85, 0.3)',
              padding: '3px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="pulse-dot" style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-red)'
            }} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-red)',
              letterSpacing: '0.05em'
            }}>
              MATCH: {live.map?.toUpperCase()} {live.score ? `(${live.score})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Right Currencies + connection-gated */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Currencies — only when live wallet data is available */}
        {wallet && wallet.source === 'live' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {[
              { label: 'V', val: wallet.vp, bg: 'rgba(255, 70, 85, 0.2)', col: 'var(--accent-red)' },
              { label: 'R', val: wallet.rp, bg: 'rgba(248, 183, 62, 0.2)', col: 'var(--accent-gold)' },
              { label: 'K', val: wallet.kc, bg: 'rgba(0, 240, 255, 0.2)', col: 'var(--accent-cyan)' },
            ].map((c) => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  backgroundColor: c.bg, color: c.col, fontSize: '10px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)'
                }}>{c.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {c.val.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{
            fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em'
          }}>
            {riotStatus.connected ? 'SYNCING WALLET…' : 'WALLET UNAVAILABLE — CLIENT OFFLINE'}
          </span>
        )}
      </div>
    </header>
  );
};
