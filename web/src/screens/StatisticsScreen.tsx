import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getCareer, getMatches, CareerData, MatchSummary } from '../api/client';

export const StatisticsScreen: React.FC = () => {
  const [career, setCareer] = useState<CareerData | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCareer(), getMatches()])
      .then(([careerData, matchesData]) => {
        setCareer(careerData);
        setMatches(matchesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !career) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  // Build trendData from real recent matches (up to 10, oldest first)
  const recentMatches = matches.slice(0, 10).reverse();
  let runningWins = 0;
  const trendData = recentMatches.map((m, index) => {
    if (m.result === 'VICTORY') {
      runningWins++;
    }
    const kd = m.deaths > 0 ? Math.round((m.kills / m.deaths) * 100) / 100 : m.kills;
    const wr = Math.round((runningWins / (index + 1)) * 100);
    return {
      match: `M${index + 1}`,
      kd,
      acs: m.combatScore,
      wr
    };
  });

  // Hit precision breakdown
  const hitData = [
    { name: 'Headshots', value: career.stats.headshotPct, color: '#ff4655' },
    { name: 'Body Hits', value: career.stats.bodyPct, color: '#00f0ff' },
    { name: 'Leg Hits', value: career.stats.legPct, color: '#949ca8' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Combat Metrics Banner */}
      <div className="home-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '14px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
            OVERALL K/D
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#fff', lineHeight: 1.1, marginTop: '4px' }}>
            {career.stats.kd}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {career.stats.kills}K / {career.stats.deaths}D
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
            WIN RATE
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent-green)', lineHeight: 1.1, marginTop: '4px' }}>
            {career.stats.winRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {career.stats.wins}W / {career.stats.losses}L
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
            HEADSHOT %
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent-red)', lineHeight: 1.1, marginTop: '4px' }}>
            {career.stats.headshotPct}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {career.stats.totalMatches} Matches
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
            AVG COMBAT SCORE
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent-gold)', lineHeight: 1.1, marginTop: '4px' }}>
            {career.stats.combatScore}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {career.stats.damagePerRound} ADR
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
            CLUTCH RATE
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent-cyan)', lineHeight: 1.1, marginTop: '4px' }}>
            {career.stats.clutchSuccessPct}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {career.stats.aces} Aces / {career.stats.flawlessRounds} Flawless
          </div>
        </div>
      </div>

      {/* Charts Row: Trend Line & Aim Distribution */}
      <div className="stats-charts-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Performance Trend Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              PERFORMANCE OVER TIME (RECENT SESSIONS)
            </span>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
              <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● Win Rate %
              </span>
              <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● ACS
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trendData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-heading)' }}>
                No recent match data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="match" stroke="#5e6675" fontSize={11} tickLine={false} />
                  <YAxis stroke="#5e6675" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131924', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                    labelStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                  <Line type="monotone" dataKey="wr" stroke="var(--accent-green)" strokeWidth={2} dot={{ fill: 'var(--accent-green)' }} />
                  <Line type="monotone" dataKey="acs" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ fill: 'var(--accent-cyan)' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Aim Accuracy Donut Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            HIT ACCURACY BREAKDOWN
          </span>

          <div style={{ width: '100%', height: '180px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {hitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#131924', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '6px' }}>
            {hitData.map((h) => (
              <div key={h.name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                  {h.name}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: h.color, fontFamily: 'var(--font-mono)' }}>
                  {h.value}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Map Win Rates & Agent Performance */}
      <div className="stats-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Map Performance Matrix */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            MAP WIN RATE MATRIX
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {career.mapWinRates.map((m) => (
              <div key={m.mapName}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{m.mapName}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: m.winRate >= 60 ? 'var(--accent-green)' : '#fff' }}>
                    {m.winRate}% WR <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({m.matches} matches)</span>
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${m.winRate}%`,
                    height: '100%',
                    backgroundColor: m.winRate >= 60 ? 'var(--accent-green)' : m.winRate >= 50 ? 'var(--accent-cyan)' : 'var(--accent-red)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Performance Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            AGENT MASTERY COMPARISON
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {career.topAgents.map((a) => (
              <div
                key={a.agentName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={a.iconUrl} alt={a.agentName} style={{ width: '36px', height: '36px', borderRadius: '4px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{a.agentName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.role} • {a.matches} Matches</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: a.winRate >= 60 ? 'var(--accent-green)' : '#fff' }}>
                    {a.winRate}% WR
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {a.kd} K/D // {a.adr} ADR
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
