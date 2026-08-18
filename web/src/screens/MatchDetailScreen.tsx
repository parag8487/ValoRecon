import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Target,
  Crosshair,
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { getMatchDetail, getMatches, MatchDetail, MatchSummary } from '../api/client';

export const MatchDetailScreen: React.FC = () => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatches().then((m) => {
      setMatches(m);
      // Default to the most recent REAL match, not a hardcoded mock id.
      if (m.length > 0 && !selectedMatchId) {
        setSelectedMatchId(m[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    setLoading(true);
    getMatchDetail(selectedMatchId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMatchId]);

  if (loading || !detail) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Selector & Summary */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              MATCH ARCHIVE
            </div>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '4px',
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id} style={{ backgroundColor: '#131924' }}>
                  {m.mapName} ({m.score}) — {m.result} [{m.agentName}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#fff', lineHeight: 1 }}>
                {detail.mapName}
              </h1>
              <span className="tactical-badge" style={{
                backgroundColor: detail.result === 'VICTORY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 70, 85, 0.2)',
                color: detail.result === 'VICTORY' ? 'var(--accent-green)' : 'var(--accent-red)',
                border: `1px solid ${detail.result === 'VICTORY' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 70, 85, 0.4)'}`
              }}>
                {detail.result}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '14px', marginTop: '2px' }}>
              <span>Mode: <strong>{detail.gameMode}</strong></span>
              <span>Duration: <strong>{detail.duration}</strong></span>
              <span>Halftime: <strong>{detail.halfTimeScore}</strong></span>
              <span>Server: <strong>{detail.server}</strong></span>
            </div>
          </div>
        </div>

        {/* Big Score Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              ALLIES (BLUE)
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--accent-cyan)', lineHeight: 1 }}>
              {detail.playerTeamScore}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text-muted)' }}>:</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-heading)', color: 'var(--accent-red)', fontWeight: 700 }}>
              ENEMIES (RED)
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--accent-red)', lineHeight: 1 }}>
              {detail.enemyTeamScore}
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboards (Allies & Enemies) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Allies Scoreboard */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
              BLUE TEAM (ALLIES) — {detail.teams.allies.score} ROUNDS WON
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              COMBAT SCOREBOARD
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px' }}>PLAYER</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>RANK</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACS</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>K</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>D</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>A</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>+/-</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ADR</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>HS%</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>FB</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>PLANTS</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ECON</th>
                </tr>
              </thead>
              <tbody>
                {detail.teams.allies.players.map((p, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      backgroundColor: p.isPlayer ? 'rgba(255, 70, 85, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={p.agentIcon} alt={p.agent} style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: '#111' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: p.isPlayer ? 'var(--accent-red)' : '#fff', fontSize: '13px' }}>
                          {p.name}<span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>#{p.tag}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.agent}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '11px' }}>{p.rank}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{p.score}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-green)' }}>{p.kills}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>{p.deaths}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{p.assists}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: p.kills - p.deaths >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {p.kills - p.deaths >= 0 ? `+${p.kills - p.deaths}` : p.kills - p.deaths}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.adr}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.hsPct}%</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.firstBloods}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.plants}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>{p.econRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enemies Scoreboard */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 70, 85, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: 'var(--accent-red)', letterSpacing: '0.04em' }}>
              RED TEAM (ENEMIES) — {detail.teams.enemies.score} ROUNDS WON
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              OPPONENT STATS
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px' }}>PLAYER</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>RANK</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACS</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>K</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>D</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>A</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>+/-</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ADR</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>HS%</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>FB</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>PLANTS</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ECON</th>
                </tr>
              </thead>
              <tbody>
                {detail.teams.enemies.players.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={p.agentIcon} alt={p.agent} style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: '#111' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                          {p.name}<span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>#{p.tag}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.agent}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '11px' }}>{p.rank}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{p.score}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-green)' }}>{p.kills}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>{p.deaths}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{p.assists}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: p.kills - p.deaths >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {p.kills - p.deaths >= 0 ? `+${p.kills - p.deaths}` : p.kills - p.deaths}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.adr}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.hsPct}%</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.firstBloods}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.plants}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>{p.econRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Round-by-Round Timeline */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            ROUND-BY-ROUND PROGRESSION & WIN CONDITIONS
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            21 TOTAL ROUNDS PLAYED
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {detail.rounds.map((r) => {
            const isBlue = r.winningTeam === 'Blue';
            return (
              <div
                key={r.round}
                style={{
                  backgroundColor: isBlue ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 70, 85, 0.08)',
                  border: `1px solid ${isBlue ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 70, 85, 0.3)'}`,
                  borderRadius: '6px',
                  padding: '10px 12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    ROUND {r.round}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isBlue ? 'var(--accent-cyan)' : 'var(--accent-red)'
                  }}>
                    {r.blueScore} - {r.redScore}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: isBlue ? 'var(--accent-cyan)' : 'var(--accent-red)', fontWeight: 600, marginTop: '4px' }}>
                  {r.winType}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Buy: {r.buyTypeBlue ?? '—'}
                </div>

                {r.playerKills > 0 && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--accent-gold)',
                    backgroundColor: 'rgba(248, 183, 62, 0.12)',
                    padding: '2px 5px',
                    borderRadius: '3px',
                    display: 'inline-block'
                  }}>
                    +{r.playerKills} KILLS (YOU)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
