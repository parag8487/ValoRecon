import React, { useEffect, useState } from 'react';
import {
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Layers,
  Flame
} from 'lucide-react';
import { getBattlepass, getQuests, BattlepassData, QuestsData } from '../api/client';
import { SafeImage } from '../components/SafeImage';

export const BattlepassScreen: React.FC = () => {
  const [bp, setBp] = useState<BattlepassData | null>(null);
  const [quests, setQuests] = useState<QuestsData | null>(null);
  const [activeTab, setActiveTab] = useState<'tiers' | 'quests'>('tiers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBattlepass(), getQuests()])
      .then(([bpData, questsData]) => {
        setBp(bpData);
        setQuests(questsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !bp || !quests) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  const isLive = bp.source === 'live';
  const actTitle = bp.actName || 'Active Battlepass';
  const maxTier = bp.maxTier || 50;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="tactical-badge" style={{
              backgroundColor: isLive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(248, 183, 62, 0.2)',
              color: isLive ? 'var(--accent-green)' : 'var(--accent-gold)',
              border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 183, 62, 0.4)'}`
            }}>
              {isLive ? 'CONNECTED ACCOUNT' : 'BATTLEPASS'}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', color: '#fff', lineHeight: 1, marginTop: '4px' }}>
            {actTitle}
          </h1>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tier <strong style={{ color: '#fff' }}>{bp.currentTier}</strong> of <strong>{maxTier}</strong> • Total XP: <strong style={{ color: '#fff' }}>{bp.totalXPAccumulated.toLocaleString()}</strong>
          </div>
        </div>

        {/* Big Tier Progress Box */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '14px 22px',
          minWidth: '240px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-gold)' }}>TIER {bp.currentTier} PROGRESS</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>
              TIER {bp.currentTier} / {maxTier}
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, (bp.currentTier / maxTier) * 100))}%`,
              height: '100%',
              backgroundColor: 'var(--accent-gold)',
              borderRadius: '4px'
            }} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {bp.totalXPAccumulated.toLocaleString()} Total Contract XP
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Reward Tiers vs Quests */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('tiers')}
          style={{
            padding: '8px 20px',
            borderRadius: '4px',
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'tiers' ? 'var(--accent-red)' : 'rgba(0,0,0,0.3)',
            color: activeTab === 'tiers' ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'tiers' ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'}`
          }}
        >
          TIER PROGRESSION
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          style={{
            padding: '8px 20px',
            borderRadius: '4px',
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'quests' ? 'var(--accent-cyan)' : 'rgba(0,0,0,0.3)',
            color: activeTab === 'quests' ? '#090c10' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'quests' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)'}`
          }}
        >
          DAILY & WEEKLY QUESTS ({quests.dailies.filter((d) => d.completed).length + quests.weeklies.filter((w) => w.completed).length}/{quests.dailies.length + quests.weeklies.length} DONE)
        </button>
      </div>

      {activeTab === 'tiers' ? (
        /* TIERS VIEW */
        isLive ? (
          /* Live Connected Contract View */
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                ACTIVE CONTRACT TELEMETRY
              </span>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Progression and total experience synced directly from your active Riot client session.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '18px 20px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>CURRENT TIER REACHED</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                  Tier {bp.currentTier}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  of {maxTier} base contract tiers
                </div>
              </div>

              <div style={{ padding: '18px 20px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>TOTAL ACCUMULATED XP</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {bp.totalXPAccumulated.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Total contract XP earned
                </div>
              </div>

              <div style={{ padding: '18px 20px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>CONTRACT STATUS</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                  ACTIVE
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Riot client contracts API verified
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Offline / Sample Tiers Grid (no leaderboard) */
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              MILESTONE REWARDS (SAMPLE)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '16px' }}>
              {(bp.tiers || []).map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  className="glass-panel-hover"
                >
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--accent-gold)'
                  }}>
                    TIER {t.tier}
                  </span>

                  <SafeImage
                    src={t.icon}
                    alt={t.name}
                    fallbackLabel={t.name}
                    style={{
                      width: '90px',
                      height: '60px',
                      objectFit: 'contain',
                      margin: '12px 0'
                    }}
                  />

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t.type} {t.isFree && '• (Free Track)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* QUESTS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Daily Quests */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                DAILY CHECKPOINTS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {quests.dailies.length} ACTIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quests.dailies.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No active daily missions.</div>
              )}
              {quests.dailies.map((q) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: q.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${q.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{q.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{q.description}</div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: q.completed ? 'var(--accent-green)' : 'var(--accent-gold)'
                    }}>
                      {q.xpReward > 0 ? `+${q.xpReward} XP` : ''}
                    </span>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>PROGRESS</span>
                      <span>{q.progress} / {q.maxProgress} {q.completed && '(COMPLETED)'}</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(q.progress / q.maxProgress) * 100}%`,
                        height: '100%',
                        backgroundColor: q.completed ? 'var(--accent-green)' : 'var(--accent-cyan)'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Missions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                WEEKLY MISSIONS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                ACTIVE MISSIONS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quests.weeklies.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No active weekly missions.</div>
              )}
              {quests.weeklies.map((q) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: q.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${q.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{q.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{q.description}</div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: q.completed ? 'var(--accent-green)' : 'var(--accent-gold)'
                    }}>
                      {q.xpReward > 0 ? `+${q.xpReward} XP` : ''}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>PROGRESS</span>
                      <span>{q.progress} / {q.maxProgress} {q.completed && '(COMPLETED)'}</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(q.progress / q.maxProgress) * 100}%`,
                        height: '100%',
                        backgroundColor: q.completed ? 'var(--accent-green)' : 'var(--accent-gold)'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
