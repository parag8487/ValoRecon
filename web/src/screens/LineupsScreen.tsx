import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Search, Shield, RefreshCw, Copy, Check } from 'lucide-react';
import { getLineups, getLineupsMeta, Lineup } from '../api/client';

export const LineupsScreen: React.FC = () => {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [meta, setMeta] = useState<{ maps: string[]; agents: string[]; abilities: string[]; sides: string[]; note: string } | null>(null);
  const [map, setMap] = useState('');
  const [agent, setAgent] = useState('');
  const [ability, setAbility] = useState('');
  const [side, setSide] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getLineupsMeta().then(setMeta).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getLineups({
      map: map || undefined,
      agent: agent || undefined,
      ability: ability || undefined,
      side: side || undefined,
    });
    setLineups(search.trim() ? data.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    ) : data);
    setLoading(false);
  }, [map, agent, ability, side, search]);

  useEffect(() => {
    const t = setTimeout(load, 120);
    return () => clearTimeout(t);
  }, [load]);

  const copyLineup = (l: Lineup) => {
    const text = `[${l.map}] ${l.agent} ${l.ability} — ${l.title}\n${l.description}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(l.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const selectStyle = {
    padding: '8px 10px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '4px',
    fontSize: '12.5px',
    fontFamily: 'var(--font-mono)',
    color: '#fff',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 100px)' }}>
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color="var(--accent-cyan)" />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            LINEUP KNOWLEDGE BASE
          </h1>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {meta?.note || 'Community-standard utility lineups — verify in a custom game before using in ranked.'}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel lineups-filters-grid" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <select value={map} onChange={(e) => setMap(e.target.value)} style={selectStyle}>
          <option value="">All Maps</option>
          {(meta?.maps || []).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} style={selectStyle}>
          <option value="">All Agents</option>
          {(meta?.agents || []).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={ability} onChange={(e) => setAbility(e.target.value)} style={selectStyle}>
          <option value="">All Abilities</option>
          {(meta?.abilities || []).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={side} onChange={(e) => setSide(e.target.value)} style={selectStyle}>
          <option value="">All Sides</option>
          {(meta?.sides || []).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lineups..."
            aria-label="Search lineups"
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              fontSize: '12.5px',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button onClick={load} className="tactical-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={13} /> {loading ? 'LOADING...' : 'REFRESH'}
        </button>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px', alignContent: 'start' }}>
        {loading && lineups.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="pulse-dot" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
          </div>
        ) : lineups.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No lineups match these filters. Try clearing a filter.
          </div>
        ) : (
          lineups.map((l) => (
            <div key={l.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    {l.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                    {l.map} · {l.agent} · {l.ability} · {l.side.toUpperCase()}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-heading)', fontWeight: 700, flexShrink: 0,
                  color: l.difficulty === 'Easy' ? 'var(--accent-green)' : l.difficulty === 'Medium' ? 'var(--accent-gold)' : 'var(--accent-red)',
                  backgroundColor: 'rgba(255,255,255,0.05)', padding: '3px 7px', borderRadius: '3px'
                }}>
                  {l.difficulty.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {l.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {l.source === 'community-standard' ? 'COMMUNITY-STANDARD' : l.source.toUpperCase()}
                </span>
                <button
                  onClick={() => copyLineup(l)}
                  className="tactical-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {copied === l.id ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                  {copied === l.id ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
