import React, { useEffect, useState } from 'react';
import {
  Shield,
  Crosshair,
  Sparkles,
  Award,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { getLoadout, getCareer, LoadoutData } from '../api/client';
import { SafeImage } from '../components/SafeImage';

const WEAPON_CATEGORIES: Record<string, string[]> = {
  Sidearms: ['Classic', 'Shorty', 'Frenzy', 'Ghost', 'Sheriff'],
  SMGs: ['Stinger', 'Spectre'],
  Shotguns: ['Bucky', 'Judge'],
  Rifles: ['Bulldog', 'Guardian', 'Phantom', 'Vandal'],
  Snipers: ['Marshal', 'Outlaw', 'Operator'],
  Heavies: ['Ares', 'Odin'],
  Melee: ['Melee']
};

export const LoadoutScreen: React.FC = () => {
  const [loadout, setLoadout] = useState<LoadoutData | null>(null);
  const [accountLevel, setAccountLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Rifles');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLoadout(),
      getCareer().catch(() => null)
    ])
      .then(([loadoutData, careerData]) => {
        setLoadout(loadoutData);
        if (loadoutData.identity?.accountLevel != null) {
          setAccountLevel(loadoutData.identity.accountLevel);
        } else if (careerData?.player?.accountLevel != null) {
          setAccountLevel(careerData.player.accountLevel);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !loadout) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  const categoryWeapons = WEAPON_CATEGORIES[selectedCategory] || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category Tabs */}
      <div className="glass-panel" style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(WEAPON_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '4px',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? 'var(--accent-red)' : 'rgba(0,0,0,0.3)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.15s ease'
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="tactical-badge" style={{
            backgroundColor: loadout.source === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(248, 183, 62, 0.15)',
            color: loadout.source === 'live' ? 'var(--accent-green)' : 'var(--accent-gold)',
            border: `1px solid ${loadout.source === 'live' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 183, 62, 0.3)'}`
          }}>
            {loadout.source === 'live' ? 'LIVE LOADOUT' : 'DEMO ARSENAL'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            18 TOTAL WEAPONS EQUIPPED
          </span>
        </div>
      </div>

      {/* Weapons in Selected Category Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {categoryWeapons.map((weaponName) => {
          const weaponData = loadout.weapons[weaponName] || {
            skinName: `Standard ${weaponName}`,
            chromaName: 'Default',
            icon: 'https://media.valorant-api.com/weaponskins/f4a0c8ce-4122-38d0-062a-dc853efaa76f/displayicon.png',
            buddy: null
          };

          return (
            <div
              key={weaponName}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                minHeight: '220px',
                position: 'relative'
              }}
            >
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)'
                }}>
                  {weaponName.toUpperCase()}
                </span>
                {weaponData.buddy && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--accent-gold)',
                    backgroundColor: 'rgba(248, 183, 62, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}>
                    {weaponData.buddy}
                  </span>
                )}
              </div>

              <SafeImage
                src={weaponData.icon}
                alt={weaponData.skinName}
                fallbackLabel={weaponData.skinName}
                style={{
                  width: '220px',
                  height: '90px',
                  objectFit: 'contain',
                  filter: 'none',
                  margin: '10px 0'
                }}
              />

              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  {weaponData.skinName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {weaponData.chromaName}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Identity & Player Profile Showcase */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            EQUIPPED PLAYER IDENTITY & COSMETICS
          </span>
          <span className="tactical-badge" style={{ backgroundColor: 'rgba(255, 70, 85, 0.15)', color: 'var(--accent-red)' }}>
            ACTIVE PROFILE
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {/* Player Card Wide */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
              PLAYER CARD
            </div>
            <SafeImage
              src={loadout.identity.cardWide}
              alt="Player Card"
              fallbackLabel="PLAYER CARD"
              style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginTop: '10px' }}
            />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '8px' }}>
              {loadout.identity.playerCard}
            </div>
          </div>

          {/* Title */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
              EQUIPPED TITLE
            </div>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)', marginTop: '8px' }}>
              {loadout.identity.playerTitle}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Equipped Player Title
            </div>
          </div>

          {/* Spray */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
              EQUIPPED SPRAY
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '8px' }}>
              {loadout.identity.spray}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '4px' }}>
              Equipped Mid-Round Spray
            </div>
          </div>

          {/* Level Border */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
              LEVEL BORDER
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '8px' }}>
              {loadout.identity.levelBorder}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {accountLevel != null ? `Account Level ${accountLevel}` : 'Account Level —'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
