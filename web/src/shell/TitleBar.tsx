import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu } from 'lucide-react';
import { getWallet, getRiotStatus, getLiveMatch, WalletData, RiotStatusData } from '../api/client';
import { ValoReconMonogram } from '../components/ValoReconLogo';

interface TitleBarProps {
  onOpenDrawer?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'COMMAND DASHBOARD', subtitle: 'TACTICAL OVERVIEW & PERFORMANCE' },
  '/coach': { title: 'RADIANT AI COACH', subtitle: 'LIVE STRATEGIC & TACTICAL ASSISTANT' },
  '/analysis': { title: 'MATCH ANALYSIS', subtitle: 'AI-POWERED POST-GAME BREAKDOWN' },
  '/match-detail': { title: 'MATCH DETAIL & SCOREBOARD', subtitle: 'ROUNDS, ECONOMY & COMBAT METRICS' },
  '/live-match': { title: 'LIVE MATCH TRACKER', subtitle: 'REAL-TIME ULTIMATE & ECONOMY RADAR' },
  '/agent-select': { title: 'AGENT SELECT ADVISOR', subtitle: 'MAP META SYNERGY & INSTANT PICK AID' },
  '/lineups': { title: 'LINEUPS & UTILITY', subtitle: 'SOVA, VIPER, BRIMSTONE & MORE' },
  '/trends': { title: 'TRENDS & BENCHMARKS', subtitle: 'PERFORMANCE DELTAS & DRILLS' },
  '/statistics': { title: 'PERFORMANCE STATISTICS', subtitle: 'AGENT, MAP & COMBAT ANALYTICS' },
  '/store': { title: 'FEATURED STORE & NIGHT MARKET', subtitle: 'DAILY ROTATION & SPECIAL OFFERS' },
  '/loadout': { title: 'WEAPON ARSENAL & LOADOUT', subtitle: 'EQUIPPED SKINS, CHROMAS & BUDDIES' },
  '/battlepass': { title: 'BATTLEPASS PROGRESSION', subtitle: 'SEASON REWARDS & QUESTS' },
  '/companion': { title: 'SECOND SCREEN COMPANION', subtitle: 'LIVE RADAR & RADIANITE SYNC' },
  '/settings': { title: 'SYSTEM SETTINGS', subtitle: 'APP CONFIGURATION & PREFERENCES' },
};

interface LiveState {
  inGame: boolean;
  map: string;
  score: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [riotStatus, setRiotStatus] = useState<RiotStatusData>({ connected: false, gameRunning: false });
  const [live, setLive] = useState<LiveState>({ inGame: false, map: '', score: '' });

  const pollStatus = () => {
    getRiotStatus()
      .then((status) => {
        if (status.connected) {
          setRiotStatus(status);
        } else {
          try {
            const savedSession = localStorage.getItem('valorecon_companion_session');
            if (savedSession) {
              const parsed = JSON.parse(savedSession);
              if (parsed.connected && parsed.gameName) {
                setRiotStatus({
                  connected: true,
                  gameRunning: true,
                  gameName: parsed.gameName,
                  gameTag: parsed.gameTag || 'help'
                });
                return;
              }
            }
          } catch {}
          setRiotStatus({ connected: false, gameRunning: false });
        }
      })
      .catch(() => {
        try {
          const savedSession = localStorage.getItem('valorecon_companion_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.connected && parsed.gameName) {
              setRiotStatus({
                connected: true,
                gameRunning: true,
                gameName: parsed.gameName,
                gameTag: parsed.gameTag || 'help'
              });
              return;
            }
          }
        } catch {}
        setRiotStatus({ connected: false, gameRunning: false });
      });
    getWallet().then(setWallet).catch(() => setWallet(null));
    getLiveMatch()
      .then((m) => setLive({ inGame: !!m.inGame, map: m.map || '', score: m.currentScore || '' }))
      .catch(() => setLive({ inGame: false, map: '', score: '' }));
  };

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 4000);
    window.addEventListener('valorecon_sync', pollStatus);
    window.addEventListener('storage', pollStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('valorecon_sync', pollStatus);
      window.removeEventListener('storage', pollStatus);
    };
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
      padding: '0 20px',
      userSelect: 'none',
      zIndex: 90,
      flexShrink: 0,
      gap: '12px'
    }}>
      {/* Left: Title & Subtitle with Monogram */}
      <div className="topbar-left-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 1 }}>
        {onOpenDrawer && (
          <button
            className="mobile-header-menu-btn"
            onClick={onOpenDrawer}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '6px',
              cursor: 'pointer',
              display: 'none'
            }}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <ValoReconMonogram size={20} />

        <div style={{ display: 'flex', alignItems: 'baseline', minWidth: 0, gap: '8px' }}>
          <span className="topbar-title-heading" style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '14.5px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {routeInfo.title}
          </span>
          <span className="topbar-subtitle-text" style={{
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

      {/* Right Container: Riot Status Pill + Live Match + Currencies */}
      <div className="topbar-right-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Riot Account Status Pill */}
        <div
          className="topbar-riot-pill"
          title={riotStatus.connected ? `Connected to ${riotStatus.gameName}#${riotStatus.gameTag} (${riotStatus.region?.toUpperCase() || 'AP'})` : 'Local Riot Client lockfile offline'}
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
              : 'var(--text-muted)',
            whiteSpace: 'nowrap',
            flexShrink: 0
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
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          {riotStatus.connected ? (
            <span className="riot-status-text">
              CONNECTED: {riotStatus.gameName}#{riotStatus.gameTag}
            </span>
          ) : riotStatus.gameRunning ? (
            <span>RIOT DETECTED</span>
          ) : (
            <span>CLIENT OFFLINE</span>
          )}
        </div>

        {/* Live Match Indicator */}
        {live.inGame && (
          <div
            onClick={() => navigate('/live-match')}
            className="topbar-live-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 70, 85, 0.12)',
              border: '1px solid rgba(255, 70, 85, 0.3)',
              padding: '3px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span className="pulse-dot" style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-red)',
              flexShrink: 0
            }} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-red)',
              letterSpacing: '0.05em'
            }}>
              LIVE: {live.map?.toUpperCase() || 'MATCH'} {live.score ? `(${live.score})` : ''}
            </span>
          </div>
        )}

        {/* Currencies — hidden on small mobile view */}
        <div className="topbar-wallet-section" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {wallet && wallet.source === 'live' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {[
                { label: 'V', val: wallet.vp, bg: 'rgba(255, 70, 85, 0.2)', col: 'var(--accent-red)' },
                { label: 'R', val: wallet.rp, bg: 'rgba(248, 183, 62, 0.2)', col: 'var(--accent-gold)' },
                { label: 'K', val: wallet.kc, bg: 'rgba(0, 240, 255, 0.2)', col: 'var(--accent-cyan)' },
              ].map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: c.bg, color: c.col, fontSize: '9.5px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)'
                  }}>{c.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                    {c.val.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
