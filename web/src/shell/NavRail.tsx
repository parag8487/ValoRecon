import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Crosshair,
  FileText,
  Radio,
  UserCheck,
  TrendingUp,
  ShoppingBag,
  Shield,
  Award,
  Settings,
  ChevronRight,
  User,
  MapPin,
  Activity,
  Smartphone
} from 'lucide-react';
import { ValoReconWordmark } from '../components/ValoReconLogo';
import { getCareer, getRiotStatus, CareerData } from '../api/client';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
  live?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/coach', label: 'AI Coach', icon: Sparkles, badge: 'AI' },
  { path: '/analysis', label: 'Match Analysis', icon: Crosshair },
  { path: '/match-detail', label: 'Match Detail', icon: FileText },
  { path: '/live-match', label: 'Live Match', icon: Radio, live: true },
  { path: '/agent-select', label: 'Agent Advisor', icon: UserCheck },
  { path: '/lineups', label: 'Lineups', icon: MapPin },
  { path: '/trends', label: 'Trends & Plan', icon: Activity, badge: 'NEW' },
  { path: '/companion', label: 'Companion', icon: Smartphone, badge: 'SYNC' },
  { path: '/statistics', label: 'Statistics', icon: TrendingUp },
  { path: '/store', label: 'Store', icon: ShoppingBag },
  { path: '/loadout', label: 'Loadout', icon: Shield },
  { path: '/battlepass', label: 'Battlepass', icon: Award },
  { path: '/settings', label: 'Settings', icon: Settings },
];


export const NavRail: React.FC = () => {
  const [career, setCareer] = useState<CareerData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const load = () => {
      getRiotStatus().then((s) => setConnected(!!s.connected)).catch(() => setConnected(false));
      getCareer()
        .then((c) => setCareer(c.source === 'live' ? c : null))
        .catch(() => setCareer(null));
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="app-nav" style={{
      width: '232px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      zIndex: 100,
      flexShrink: 0
    }}>
      {/* Brand Header with ValoRecon Logo */}
      <div style={{
        padding: '16px 16px 14px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        minWidth: 0
      }}>
        <ValoReconWordmark size={22} tagline="YOUR AI VALORANT COACH" />
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
      }}>
        <div style={{
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          fontWeight: 700,
          padding: '0 8px 6px 8px'
        }}>
          MAIN TACTICS
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--surface-2)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon
                      size={18}
                      color={isActive ? 'var(--accent-red)' : 'var(--text-secondary)'}
                    />
                    <span style={{ letterSpacing: '0.02em' }}>{item.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.live && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'var(--accent-red)',
                        backgroundColor: 'rgba(255, 70, 85, 0.18)',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        <span className="pulse-dot" style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-red)',
                          display: 'inline-block'
                        }} />
                        LIVE
                      </span>
                    )}

                    {item.badge && !item.live && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: item.badge === 'AI' ? 'var(--accent-cyan)' : 'var(--accent-gold)',
                        backgroundColor: item.badge === 'AI' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(248, 183, 62, 0.12)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {isActive && <ChevronRight size={14} style={{ color: 'var(--accent-red)' }} />}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Status — live from connected account */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {career && connected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {career.player.avatarUrl ? (
                <img
                  src={career.player.avatarUrl}
                  alt="Avatar"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                />
              ) : (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}><User size={16} color="var(--text-muted)" /></div>
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>
                  {career.player.name}<span style={{ color: 'var(--text-muted)' }}>#{career.player.tag}</span>
                </div>
                <div style={{
                  fontSize: '10px', color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)', fontWeight: 700
                }}>
                  {career.rank.tierName?.toUpperCase()} // {career.rank.rr} RR
                </div>
              </div>
            </div>
            {career.rank.tierIcon && (
              <img
                src={career.rank.tierIcon}
                alt={career.rank.tierName}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '28px', height: '28px' }}
              />
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><User size={16} color="var(--text-muted)" /></div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                Not signed in
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                LAUNCH RIOT CLIENT
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
