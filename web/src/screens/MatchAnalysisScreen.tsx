import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Award,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';
import { getMatches, analyzeMatchAI, MatchSummary, AIMatchAnalysis } from '../api/client';

export const MatchAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const [analysisMap, setAnalysisMap] = useState<Record<string, AIMatchAnalysis['analysis']>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatches()
      .then((data) => {
        setMatches(data);
        if (data.length > 0) {
          setSelectedMatch(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (match: MatchSummary) => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await analyzeMatchAI(match.id, match, focus || undefined);
      setAnalysisMap((prev) => ({
        ...prev,
        [match.id]: res.analysis
      }));
    } catch (err: any) {
      console.error('Failed to analyze match:', err);
      setAnalysisError(err?.message || 'Failed to analyze match. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  const currentAnalysis = selectedMatch ? analysisMap[selectedMatch.id] : null;

  return (
    <div className="animate-fade-in analysis-split-grid" style={{
      display: 'grid',
      gridTemplateColumns: '360px 1fr',
      gap: '20px',
      height: 'calc(100vh - 100px)'
    }}>
      {/* Master List: Recent Matches */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            SELECT MATCH TO ANALYZE
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {matches.length} MATCHES
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {matches.map((m) => {
            const isSelected = selectedMatch?.id === m.id;
            const hasAnalysis = !!analysisMap[m.id];
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'rgba(255, 70, 85, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isSelected ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="glass-panel-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={m.agentIconUrl}
                      alt={m.agentName}
                      style={{ width: '34px', height: '34px', borderRadius: '4px', backgroundColor: '#111' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                          {m.mapName}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          color: m.result === 'VICTORY' ? 'var(--accent-green)' : 'var(--accent-red)'
                        }}>
                          {m.result}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {m.agentName} • {m.score}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                      {m.kills}/{m.deaths}/{m.assists}
                    </div>
                    {hasAnalysis ? (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        backgroundColor: 'rgba(0, 240, 255, 0.15)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        AI ANALYZED
                      </span>
                    ) : (
                      <span style={{
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
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Pane: Match AI Breakdown */}
      {selectedMatch ? (
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Match Banner Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <img
                src={selectedMatch.agentIconUrl}
                alt={selectedMatch.agentName}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: '#111'
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#fff', lineHeight: 1 }}>
                    {selectedMatch.mapName} // {selectedMatch.score}
                  </h2>
                  <span className="tactical-badge" style={{
                    backgroundColor: selectedMatch.result === 'VICTORY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 70, 85, 0.2)',
                    color: selectedMatch.result === 'VICTORY' ? 'var(--accent-green)' : 'var(--accent-red)',
                    border: `1px solid ${selectedMatch.result === 'VICTORY' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 70, 85, 0.4)'}`
                  }}>
                    {selectedMatch.result}
                  </span>
                  {selectedMatch.mvp && (
                    <span className="tactical-badge" style={{
                      backgroundColor: 'rgba(248, 183, 62, 0.2)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(248, 183, 62, 0.4)'
                    }}>
                      {selectedMatch.mvp}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Agent: <strong style={{ color: '#fff' }}>{selectedMatch.agentName}</strong></span>
                  <span>Combat Score: <strong style={{ color: '#fff' }}>{selectedMatch.combatScore}</strong></span>
                  <span>K/D: <strong style={{ color: '#fff' }}>{selectedMatch.kd}</strong> ({selectedMatch.kills}/{selectedMatch.deaths}/{selectedMatch.assists})</span>
                  <span>Headshot: <strong style={{ color: 'var(--accent-red)' }}>{selectedMatch.headshotPct}%</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => navigate('/match-detail')}
                className="tactical-btn-secondary"
                style={{ padding: '8px 14px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={14} /> Full Scoreboard
              </button>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                aria-label="Analysis focus"
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: '#fff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">FOCUS: FULL ANALYSIS</option>
                <option value="economy">ECONOMY</option>
                <option value="aim">AIM & MECHANICS</option>
                <option value="positioning">POSITIONING</option>
                <option value="rounds">ROUND-BY-ROUND</option>
              </select>
              <button
                onClick={() => handleAnalyze(selectedMatch)}
                disabled={analyzing}
                className="tactical-btn"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <Sparkles size={16} />
                {analyzing ? 'ANALYZING MATCH...' : 'ANALYZE WITH AI'}
              </button>
            </div>
          </div>

          {/* Analysis error + retry */}
          {analysisError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: 'rgba(255, 70, 85, 0.1)',
              border: '1px solid rgba(255, 70, 85, 0.35)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '16px',
              fontSize: '13px',
              color: 'var(--accent-red)'
            }}>
              <span>{analysisError}</span>
              <button
                onClick={() => handleAnalyze(selectedMatch)}
                disabled={analyzing}
                className="tactical-btn"
                style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
              >
                RETRY
              </button>
            </div>
          )}

          {/* AI Analysis Content */}
          {currentAnalysis ? (
            currentAnalysis.needsApiKey ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '60px 20px',
                gap: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(248, 183, 62, 0.12)',
                  border: '1px solid rgba(248, 183, 62, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={32} color="var(--accent-gold)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#fff' }}>
                  AI POST-GAME ANALYSIS NEEDS AN API KEY
                </h3>
                <p style={{ maxWidth: '460px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentAnalysis.summary || 'Add your free Google Gemini API key in Settings to unlock tactical breakdowns, round-by-round coaching tips, and aim ratings.'}
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="tactical-btn"
                  style={{
                    marginTop: '8px',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Go to Settings
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Verdict Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 70, 85, 0.08)',
                  border: '1px solid rgba(255, 70, 85, 0.25)',
                  borderRadius: '8px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--accent-red)',
                      fontWeight: 700,
                      letterSpacing: '0.08em'
                    }}>
                      COACH VERDICT // GEMINI 2.5 FLASH
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#fff',
                      marginTop: '2px'
                    }}>
                      {currentAnalysis.overallVerdict}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                      {currentAnalysis.summary}
                    </p>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      MATCH SCORE
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', color: 'var(--accent-gold)', lineHeight: 1 }}>
                      {currentAnalysis.rating || '8.5'}<span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  </div>
                </div>

                {/* Strengths & Mistakes Two Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Strengths */}
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '16px 18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle2 size={18} color="var(--accent-green)" />
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)' }}>
                        TACTICAL STRENGTHS
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(currentAnalysis.strengths || []).map((s, i) => (
                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>•</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Mistakes */}
                  <div style={{
                    backgroundColor: 'rgba(255, 70, 85, 0.06)',
                    border: '1px solid rgba(255, 70, 85, 0.2)',
                    borderRadius: '8px',
                    padding: '16px 18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <AlertTriangle size={18} color="var(--accent-red)" />
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-red)' }}>
                        MISTAKES & LEAKS TO FIX
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(currentAnalysis.mistakes || []).map((m, i) => (
                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                          <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>•</span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coaching Tips */}
                <div style={{
                  backgroundColor: 'rgba(0, 240, 255, 0.06)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lightbulb size={18} color="var(--accent-cyan)" />
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      ACTIONABLE COACHING TIPS TO RANK UP
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(currentAnalysis.coachingTips || []).map((tip, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{i + 1}.</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Rounds Breakdown */}
                {currentAnalysis.keyRoundBreakdown && currentAnalysis.keyRoundBreakdown.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px 18px'
                  }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                      KEY SWING ROUNDS BREAKDOWN
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {currentAnalysis.keyRoundBreakdown.map((r, i) => (
                        <div key={i} style={{
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                            <span>ROUND {r.round}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{r.type}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {r.verdict}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px 20px',
              gap: '14px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 70, 85, 0.1)',
                border: '1px solid rgba(255, 70, 85, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={32} color="var(--accent-red)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#fff' }}>
                AI POST-GAME ANALYSIS READY
              </h3>
              <p style={{ maxWidth: '440px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Click <strong>Analyze with AI</strong> above to get an instant tactical breakdown of this {selectedMatch.mapName} match, including round conversions, aim mechanics, and actionable rank-up tips from Gemini.
              </p>
              <button
                onClick={() => handleAnalyze(selectedMatch)}
                disabled={analyzing}
                className="tactical-btn"
                style={{ marginTop: '8px' }}
              >
                <Sparkles size={16} /> ANALYZE NOW
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
