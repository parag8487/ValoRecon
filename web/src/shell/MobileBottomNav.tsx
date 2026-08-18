import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Radio,
  UserCheck,
  Menu
} from 'lucide-react';

interface Props {
  onOpenDrawer: () => void;
  drawerOpen: boolean;
}

export const MobileBottomNav: React.FC<Props> = ({ onOpenDrawer, drawerOpen }) => {
  const location = useLocation();

  const isMoreActive = ![
    '/',
    '/coach',
    '/live-match',
    '/agent-select'
  ].includes(location.pathname);

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 990,
        userSelect: 'none'
      }}
    >
      {/* Dashboard */}
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
          color: isActive ? 'var(--accent)' : 'var(--text-3)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%'
        })}
      >
        <LayoutDashboard size={20} />
        <span>HOME</span>
      </NavLink>

      {/* AI Coach */}
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
          color: isActive ? 'var(--accent)' : 'var(--text-3)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          position: 'relative'
        })}
      >
        <Sparkles size={20} />
        <span>COACH</span>
      </NavLink>

      {/* Live Match */}
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
          color: isActive ? 'var(--accent)' : 'var(--text-3)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          position: 'relative'
        })}
      >
        <Radio size={20} />
        <span>LIVE</span>
      </NavLink>

      {/* Agent Advisor */}
      <NavLink
        to="/agent-select"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent)' : 'var(--text-3)',
          textDecoration: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%'
        })}
      >
        <UserCheck size={20} />
        <span>ADVISOR</span>
      </NavLink>

      {/* More / Menu */}
      <button
        onClick={onOpenDrawer}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isMoreActive || drawerOpen ? 'var(--accent)' : 'var(--text-3)',
          background: 'none',
          border: 'none',
          fontSize: '10px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          height: '100%',
          cursor: 'pointer'
        }}
      >
        <Menu size={20} />
        <span>MORE</span>
      </button>
    </nav>
  );
};
