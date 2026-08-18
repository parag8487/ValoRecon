import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Crosshair,
  FileText,
  MapPin,
  Activity,
  TrendingUp,
  ShoppingBag,
  Shield,
  Award,
  Smartphone,
  Settings,
  ChevronRight,
  ShieldCheck,
  Coins,
  Sparkles
} from 'lucide-react';
import { getWallet, getRiotStatus, WalletData, RiotStatusData } from '../api/client';
import { ValoReconWordmark } from '../components/ValoReconLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface DrawerSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<any>;
    badge?: string;
  }[];
}

const SECTIONS: DrawerSection[] = [
  {
    title: 'COMBAT & ANALYSIS',
    items: [
      { path: '/analysis', label: 'Match Analysis', icon: Crosshair },
      { path: '/match-detail', label: 'Match Detail & Scoreboard', icon: FileText },
      { path: '/lineups', label: 'Lineups & Utility', icon: MapPin },
      { path: '/trends', label: 'Trends & Weekly Plan', icon: Activity, badge: 'NEW' },
      { path: '/statistics', label: 'Performance Statistics', icon: TrendingUp },
    ]
  },
  {
    title: 'ARSENAL & PROGRESSION',
    items: [
      { path: '/store', label: 'Featured Store & Night Market', icon: ShoppingBag },
      { path: '/loadout', label: 'Weapons & Loadout', icon: Shield },
      { path: '/battlepass', label: 'Battlepass & Quests', icon: Award },
    ]
  },
  {
    title: 'COMPANION & SYSTEM',
    items: [
      { path: '/companion', label: 'Second Screen Companion', icon: Smartphone, badge: 'SYNC' },
      { path: '/settings', label: 'Settings & AI Tone', icon: Settings },
    ]
  }
];

export const MobileDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [riotStatus, setRiotStatus] = useState<RiotStatusData>({ connected: false, gameRunning: false });

  useEffect(() => {
    if (isOpen) {
      getRiotStatus().then(setRiotStatus).catch(() => {});
      getWallet().then(setWallet).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border-strong)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <ValoReconWordmark size={18} />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-2)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status / Wallet Bar */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: riotStatus.connected ? 'var(--win)' : '#ff9800'
              }}
            />
            <span>{riotStatus.connected ? `${riotStatus.gameName || 'Riot Live'}` : 'Offline Mode'}</span>
          </div>

          {wallet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{(wallet.vp || 0).toLocaleString()} VP</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{(wallet.rp || 0).toLocaleString()} RP</span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {SECTIONS.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-3)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: '8px'
                }}
              >
                {sec.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: isActive ? '#fff' : 'var(--text-2)',
                        backgroundColor: isActive ? 'var(--surface-3)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent'
                      })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} color="var(--accent)" />
                        <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{item.label}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(255, 70, 85, 0.15)',
                              color: 'var(--accent)',
                              fontWeight: 700
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={16} color="var(--text-3)" />
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
