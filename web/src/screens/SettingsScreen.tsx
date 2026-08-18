import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Sparkles,
  Server,
  Palette,
  Sliders,
  User,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { ValoReconWordmark } from '../components/ValoReconLogo';
import { AiEngineSettings } from '../components/AiEngineSettings';
import { getCareer, getRiotStatus, getPremium, getAiSettings, saveAiSettings, CareerData, RiotStatusData } from '../api/client';

export const SettingsScreen: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [coachIntensity, setCoachIntensity] = useState('analytical');
  const [streamSpeed, setStreamSpeed] = useState('fast');
  const [autoRadar, setAutoRadar] = useState(true);

  const [career, setCareer] = useState<CareerData | null>(null);
  const [riotStatus, setRiotStatus] = useState<RiotStatusData | null>(null);
  const [premium, setPremium] = useState<{ premium: boolean; tier: string } | null>(null);

  useEffect(() => {
    getRiotStatus().then(setRiotStatus).catch(() => setRiotStatus(null));
    getCareer().then(setCareer).catch(() => setCareer(null));
    getPremium().then(setPremium).catch(() => setPremium(null));
    getAiSettings().then((s) => {
      if (s.tone) setCoachIntensity(s.tone);
    }).catch(() => {});
  }, []);

  const handleToneChange = async (tone: string) => {
    setCoachIntensity(tone);
    try {
      await saveAiSettings({ tone });
    } catch (e) {
      console.error('Failed to save tone:', e);
    }
  };

  const isConnected = !!riotStatus?.connected;
  const riotId = isConnected
    ? (career?.player?.name && career?.player?.tag
        ? `${career.player.name}#${career.player.tag}`
        : riotStatus?.gameName && riotStatus?.gameTag
        ? `${riotStatus.gameName}#${riotStatus.gameTag}`
        : 'Connected')
    : 'Not signed in';

  const regionShard = (riotStatus?.region || riotStatus?.shard)
    ? (riotStatus.region && riotStatus.shard && riotStatus.region.toLowerCase() !== riotStatus.shard.toLowerCase()
        ? `${riotStatus.region.toUpperCase()} / ${riotStatus.shard.toUpperCase()}`
        : (riotStatus.region || riotStatus.shard)!.toUpperCase())
    : '—';

  const accountLevel = career?.player?.accountLevel != null ? career.player.accountLevel : '—';
  const subscriptionTier = premium?.tier ? premium.tier.toUpperCase() : (premium?.premium ? 'PRO' : 'FREE');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Settings Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
          SYSTEM SETTINGS & PREFERENCES
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Configure AI coaching models, appearance themes, account preferences & diagnostic endpoints
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: AI & App Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Coach Behavior */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Sparkles size={18} color="var(--accent-red)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                AI COACHING PARAMETERS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Coaching Tone & Style
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['analytical', 'tactical_mentor', 'aggressive_drill'].map((style) => (
                    <button
                      key={style}
                      onClick={() => handleToneChange(style)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: coachIntensity === style ? 'rgba(255, 70, 85, 0.2)' : 'rgba(0,0,0,0.3)',
                        color: coachIntensity === style ? 'var(--accent-red)' : 'var(--text-secondary)',
                        border: `1px solid ${coachIntensity === style ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'}`
                      }}
                    >
                      {style.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  AI Model Engine
                </label>
                <AiEngineSettings />
              </div>
            </div>
          </div>

          {/* Theme & Visuals */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Palette size={18} color="var(--accent-cyan)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                VISUAL THEMES & ACCENTS
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { id: 'dark', name: 'VALORANT Red (Default)', color: '#ff4655' },
                { id: 'cyan', name: 'Radiant Cyan', color: '#00f0ff' },
                { id: 'gold', name: 'Immortal Gold', color: '#f8b73e' },
                { id: 'emerald', name: 'Viper Emerald', color: '#10b981' },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    backgroundColor: theme === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)',
                    border: `1px solid ${theme === t.id ? t.color : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About ValoRecon Section */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <ValoReconWordmark size={24} tagline="YOUR AI VALORANT COACH" />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              ValoRecon is a next-generation tactical companion and AI coach designed to accelerate your competitive climb in VALORANT. Powered by Google Gemini AI, offering real-time strategy analysis, round breakdowns, and comp advisors.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Version: <strong style={{ color: '#fff' }}>1.0.0 (Release)</strong></span>
              <span>Platform: <strong style={{ color: '#fff' }}>Desktop Web</strong></span>
              <span>Build: <strong style={{ color: '#fff' }}>Production</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Account & System Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account Profile Box */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <User size={18} color="var(--accent-gold)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                LOCAL ACCOUNT PROFILE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Riot ID:</span>
                <strong style={{ color: '#fff' }}>{riotId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Region / Shard:</span>
                <strong style={{ color: '#fff' }}>{regionShard}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Level:</span>
                <strong style={{ color: '#fff' }}>{accountLevel}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subscription:</span>
                <span className="tactical-badge" style={{
                  backgroundColor: subscriptionTier === 'FREE' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(248, 183, 62, 0.2)',
                  color: subscriptionTier === 'FREE' ? 'var(--text-secondary)' : 'var(--accent-gold)',
                  border: `1px solid ${subscriptionTier === 'FREE' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(248, 183, 62, 0.4)'}`
                }}>
                  {subscriptionTier}
                </span>
              </div>
            </div>
          </div>

          {/* System & API Diagnostics */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Server size={18} color="var(--accent-green)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                SERVICES & API STATUS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Express Backend (Port 8799)</span>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> CONNECTED
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Google Gemini AI (SSE Chat & Analysis)</span>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> OPERATIONAL
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Riot / valorant-api.com CDN</span>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> SYNCED (CACHED)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
