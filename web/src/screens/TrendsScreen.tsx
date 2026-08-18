import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, Dumbbell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCoachTrends, getWeeklyPlan, TrendReport, WeeklyPlan } from '../api/client';

function directionColor(d: string): string {
  if (d === 'improving') return 'var(--accent-green)';
  if (d === 'declining') return 'var(--accent-red)';
  return 'var(--text-muted)';
}
function directionArrow(d: string): string {
  if (d === 'improving') return '▲';
  if (d === 'declining') return '▼';
  return '■';
}

export const TrendsScreen: React.FC = () => {
  const [trends, setTrends] = useState<TrendReport | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCoachTrends(), getWeeklyPlan()])
      .then(([t, p]) => {
        setTrends(t);
        setPlan(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  const windows = trends?.windows || [];
  const deltas = trends?.deltas || [];
  const percentiles = trends?.percentiles || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={18} color="var(--accent-green)" />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            PERFORMANCE TRENDS & BENCHMARKS
          </h1>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Windows over your last 5 / 10 / 15 games · direction of change · percentile vs your own history
        </div>
      </div>

      {/* Windows table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>
          WINDOW COMPARISON
        </div>
        {windows.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Not enough match data yet. Play more games to unlock trend analysis.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>Window</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>W/L</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>WR%</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>K/D</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>ACS</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>ADR</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>HS%</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>First Bloods/M</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w.window} style={{ color: '#fff' }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)' }}>Last {w.window}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.wins}W-{w.losses}L</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: (w.winRate ?? 0) >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{w.winRate}%</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.kd ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.acs ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.adr ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.hsPct != null ? `${w.hsPct}%` : '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{w.firstBloodsPerMatch ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {deltas.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              DIRECTION OF CHANGE (recent vs earlier in window)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {deltas.map((d) => (
                <div key={d.window} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '10px 14px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>LAST {d.window}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: directionColor(d.kd.direction) }}>{directionArrow(d.kd.direction)} K/D {d.kd.delta != null ? `(${d.kd.delta > 0 ? '+' : ''}${d.kd.delta})` : ''}</span>
                    <span style={{ color: directionColor(d.winRate.direction) }}>{directionArrow(d.winRate.direction)} WR {d.winRate.delta != null ? `(${d.winRate.delta > 0 ? '+' : ''}${d.winRate.delta}pp)` : ''}</span>
                    <span style={{ color: directionColor(d.acs.direction) }}>{directionArrow(d.acs.direction)} ACS {d.acs.delta != null ? `(${d.acs.delta > 0 ? '+' : ''}${d.acs.delta})` : ''}</span>
                    <span style={{ color: directionColor(d.adr.direction) }}>{directionArrow(d.adr.direction)} ADR {d.adr.delta != null ? `(${d.adr.delta > 0 ? '+' : ''}${d.adr.delta})` : ''}</span>
                    <span style={{ color: directionColor(d.hsPct.direction) }}>{directionArrow(d.hsPct.direction)} HS% {d.hsPct.delta != null ? `(${d.hsPct.delta > 0 ? '+' : ''}${d.hsPct.delta})` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Percentiles vs own history */}
      {percentiles.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '12px' }}>
            YOUR RECENT VALUE VS YOUR OWN HISTORY
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {percentiles.map((p) => (
              <div key={p.metric} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px 16px', minWidth: '150px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{p.metric}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{p.current ?? '—'}</div>
                <div style={{ fontSize: '11px', color: p.percentile != null && p.percentile >= 60 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {p.percentile != null ? `Better than ${p.percentile}% of your own last ${p.sample} games` : 'Not enough data'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly plan */}
      {plan && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Target size={18} color="var(--accent-gold)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              THIS WEEK'S IMPROVEMENT PLAN
            </span>
          </div>

          {plan.weaknesses.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                DETECTED WEAKNESSES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {plan.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={13} color={w.severity === 'high' ? 'var(--accent-red)' : 'var(--accent-gold)'} />
                    <strong style={{ color: '#fff' }}>{w.area}</strong> — {w.evidence}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              GOALS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {plan.goals.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={13} color="var(--accent-green)" />
                  <span>{g.goal} → <strong style={{ color: 'var(--accent-gold)' }}>{g.target}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              DRILLS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.drills.map((d, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Dumbbell size={15} color="var(--accent-cyan)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{d.drill}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{d.focus}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>{d.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
