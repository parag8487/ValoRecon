import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UserCheck,
  Radio,
  Crosshair,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldAlert,
  Flame,
  Target
} from 'lucide-react';
import { getCareer, getMatches, CareerData, MatchSummary } from '../api/client';
import { SafeImage } from '../components/SafeImage';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [career, setCareer] = useState<CareerData | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCareer(), getMatches()])
      .then(([careerData, matchesData]) => {
        setCareer(careerData);
        setMatches(matchesData);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !career) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-red)',
            margin: '0 auto 16px auto'
          }} />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', letterSpacing: '0.1em' }}>
            CONNECTING TO TACTICAL RADAR...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Player Banner */}
      <div className="home-player-banner" style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'var(--surface)',
        backgroundImage: `url(${career.player.cardUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 2 }}>
          <div style={{ position: 'relative' }}>
            <SafeImage
              src={career.player.avatarUrl}
              alt="Player Avatar"
              fallbackLabel={career.player.name?.slice(0, 2).toUpperCase()}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                border: '2px solid var(--accent-red)',
                boxShadow: 'none'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '1px 4px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}>
              LVL {career.player.accountLevel}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '38px',
                color: '#fff',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>
                {career.player.name}
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '18px',
                color: 'var(--text-muted)'
              }}>
                #{career.player.tag}
              </span>
              <span className="tactical-badge" style={{
                backgroundColor: 'rgba(255, 70, 85, 0.15)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(255, 70, 85, 0.3)'
              }}>
                {career.player.title}
              </span>
              <span className="tactical-badge" style={{
                backgroundColor: career.source === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(248, 183, 62, 0.15)',
                color: career.source === 'live' ? 'var(--accent-green)' : 'var(--accent-gold)',
                border: `1px solid ${career.source === 'live' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 183, 62, 0.3)'}`
              }}>
                {career.source === 'live' ? 'LIVE RIOT DATA' : 'DEMO DATA'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <span>Peak: <strong style={{ color: '#fff' }}>{career.rank.peakTierName}</strong></span>
              <span>Leaderboard: <strong style={{ color: 'var(--accent-gold)' }}>#{career.rank.leaderboardRank.toLocaleString()}</strong></span>
              <span>Total Competitive Wins: <strong style={{ color: 'var(--accent-green)' }}>{career.stats.wins}</strong></span>
            </div>
          </div>
        </div>

        {/* Rank & RR Progress Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '12px 20px',
          zIndex: 2
        }}>
          <img
            src={career.rank.tierIcon}
            alt={career.rank.tierName}
            style={{ width: '56px', height: '56px' }}
          />
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              letterSpacing: '0.04em'
            }}>
              {career.rank.tierName}
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginTop: '2px'
            }}>
              {career.rank.rr} / 100 RR
            </div>
            {/* Progress Bar */}
            <div style={{
              width: '120px',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              marginTop: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${career.rank.rr}%`,
                height: '100%',
                backgroundColor: 'var(--accent-gold)',
                borderRadius: '3px'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="home-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {/* Win Rate */}
        <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
              WIN RATE
            </span>
            <TrendingUp size={16} color="var(--accent-green)" />
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            color: 'var(--accent-green)',
            lineHeight: 1.1,
            marginTop: '6px'
          }}>
            {career.stats.winRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {career.stats.wins}W - {career.stats.losses}L ({career.stats.totalMatches} matches)
          </div>
        </div>

        {/* K/D Ratio */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
              K/D RATIO
            </span>
            <Target size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            color: '#fff',
            lineHeight: 1.1,
            marginTop: '6px'
          }}>
            {career.stats.kd}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {career.stats.kills} Kills / {career.stats.deaths} Deaths
          </div>
        </div>

        {/* Headshot % */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
              HEADSHOT PRECISION
            </span>
            <Crosshair size={16} color="var(--accent-red)" />
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            color: 'var(--accent-red)',
            lineHeight: 1.1,
            marginTop: '6px'
          }}>
            {career.stats.headshotPct}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Avg Damage/Round: <strong style={{ color: '#fff' }}>{career.stats.damagePerRound}</strong>
          </div>
        </div>

        {/* Recent Form */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
              RECENT FORM (LAST 8)
            </span>
            <Flame size={16} color="var(--accent-gold)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
            {career.recentForm.map((res, i) => (
              <span
                key={i}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  backgroundColor: res === 'W' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 70, 85, 0.2)',
                  color: res === 'W' ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${res === 'W' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 70, 85, 0.4)'}`
                }}
              >
                {res}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '8px', fontWeight: 600 }}>
            6 Wins / 2 Losses (75% Form)
          </div>
        </div>
      </div>

      {/* Tactical Quick Links */}
      <div className="home-quick-actions" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div
          onClick={() => navigate('/coach')}
          className="glass-panel glass-panel-hover"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--accent-red)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              AI TACTICAL COACH
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            Ask real-time lineup queries, economy timing, or map strategies with Gemini.
          </p>
        </div>

        <div
          onClick={() => navigate('/agent-select')}
          className="glass-panel glass-panel-hover"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={20} color="var(--accent-cyan)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              AGENT ADVISOR
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            Get instant meta synergy recommendations based on your map and team composition.
          </p>
        </div>

        <div
          onClick={() => navigate('/live-match')}
          className="glass-panel glass-panel-hover"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={20} color="var(--accent-gold)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              LIVE RADAR
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            Track in-progress round economy, ultimate counters, and live tactical coach cues.
          </p>
        </div>

        <div
          onClick={() => navigate('/analysis')}
          className="glass-panel glass-panel-hover"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crosshair size={20} color="var(--accent-purple)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              MATCH ANALYSIS
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            Deep post-game breakdown of opening duels, bonus rounds, and mechanical habits.
          </p>
        </div>
      </div>

      {/* Main Grid: Top Agents & Recent Matches */}
      <div className="home-content-split" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>

        {/* Top Agents */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              TOP AGENT MASTERY
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              COMPETITIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {career.topAgents.map((agent) => (
              <div
                key={agent.agentName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={agent.iconUrl}
                    alt={agent.agentName}
                    style={{ width: '38px', height: '38px', borderRadius: '4px' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      {agent.agentName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                      {agent.role} // {agent.matches} MATCHES
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: agent.winRate >= 60 ? 'var(--accent-green)' : '#fff'
                  }}>
                    {agent.winRate}% WR
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {agent.kd} KD // {agent.adr} ADR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              RECENT COMPETITIVE MATCHES
            </span>
            <button
              onClick={() => navigate('/analysis')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-red)',
                fontSize: '12px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              VIEW ALL <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {matches.slice(0, 5).map((m) => (
              <div
                key={m.id}
                onClick={() => navigate('/analysis')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',

                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                className="glass-panel-hover"
              >
                {/* Left Map & Agent */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={m.agentIconUrl}
                    alt={m.agentName}
                    style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#111' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {m.mapName}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        color: m.result === 'VICTORY' ? 'var(--accent-green)' : 'var(--accent-red)',
                        backgroundColor: m.result === 'VICTORY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 70, 85, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}>
                        {m.result}
                      </span>
                      {m.mvp && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          color: 'var(--accent-gold)',
                          backgroundColor: 'rgba(248, 183, 62, 0.15)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          {m.mvp}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {m.agentName} • {m.gameMode}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  color: '#fff',
                  letterSpacing: '0.04em'
                }}>
                  {m.score}
                </div>

                {/* Stats K/D/A */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {m.kills}/{m.deaths}/{m.assists} <span style={{ color: 'var(--text-muted)' }}>({m.kd} KD)</span>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: m.rrChange == null ? 'var(--text-muted)' : (String(m.rrChange).startsWith('-') ? 'var(--accent-red)' : 'var(--accent-green)'),
                    fontWeight: 700
                  }}>
                    {m.rrChange == null
                      ? '—'
                      : (String(m.rrChange).startsWith('+') || String(m.rrChange).startsWith('-')
                        ? `${m.rrChange} RR`
                        : `+${m.rrChange} RR`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
