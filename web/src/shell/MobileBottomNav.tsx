import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Radio,
  Smartphone,
  Menu
} from 'lucide-react';
import { getRiotStatus } from '../api/client';

interface Props {
  onOpenDrawer: () => void;
  drawerOpen: boolean;
}

export const MobileBottomNav: React.FC<Props> = ({ onOpenDrawer, drawerOpen }) => {
  const location = useLocation();
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    const checkSync = () => {
      try {
        const saved = localStorage.getItem('valorecon_companion_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.connected) {
            setPaired(true);
            return;
          }
        }
      } catch {}
      getRiotStatus().then(s => setPaired(!!s.connected)).catch(() => setPaired(false));
    };

    checkSync();
    const interval = setInterval(checkSync, 4000);
    return () => clearInterval(interval);
  }, []);

  const isMoreActive = ![
    '/',
    '/coach',
    '/live-match',
    '/companion'
  ].includes(location.pathname);

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 990,
        userSelect: 'none',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 1. Dashboard / Home */}
      <NavLink
        to="/"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          transition: 'color 0.15s ease'
        })}
      >
        <LayoutDashboard size={20} />
        <span>HOME</span>
      </NavLink>

      {/* 2. AI Coach */}
      <NavLink
        to="/coach"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          position: 'relative',
          transition: 'color 0.15s ease'
        })}
      >
        <Sparkles size={20} />
        <span>COACH</span>
      </NavLink>

      {/* 3. Live Match */}
      <NavLink
        to="/live-match"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          position: 'relative',
          transition: 'color 0.15s ease'
        })}
      >
        <Radio size={20} />
        <span>LIVE</span>
      </NavLink>

      {/* 4. Companion Sync */}
      <NavLink
        to="/companion"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-red)' : paired ? 'var(--accent-green)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          position: 'relative',
          transition: 'color 0.15s ease'
        })}
      >
        <div style={{ position: 'relative' }}>
          <Smartphone size={20} />
          {paired && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -4,
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                boxShadow: '0 0 6px var(--accent-green)'
              }}
            />
          )}
        </div>
        <span>SYNC</span>
      </NavLink>

      {/* 5. More / Menu Drawer */}
      <button
        onClick={onOpenDrawer}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isMoreActive || drawerOpen ? 'var(--accent-red)' : 'var(--text-muted)',
          background: 'none',
          border: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          cursor: 'pointer',
          transition: 'color 0.15s ease'
        }}
      >
        <Menu size={20} />
        <span>MORE</span>
      </button>
    </nav>
  );
};
