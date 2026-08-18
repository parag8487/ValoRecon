import React, { useEffect, useRef, useState } from 'react';
import { getLobbyInspect, getGamePhase, getLiveScore, LobbyInspectData, LobbyInspectPlayer } from '../api/client';
import { SafeImage } from './SafeImage';

/**
 * Live roster during agent select or an active match: two columns (your team |
 * enemy team). Each player shows agent, rank, W/L streak, and their REAL
 * (bought, non-default) equipped weapon skins in a horizontal grab-to-slide row
 * (scrollbar hidden). Data via Riot's official current-game loadouts API.
 */

// Horizontal skin strip you drag with the cursor; no visible scrollbar.
const SkinRow: React.FC<{ skins: NonNullable<LobbyInspectPlayer['skins']> }> = ({ skins }) => {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, scroll: 0 });

  const onDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    drag.current = { down: true, moved: false, startX: e.pageX, scroll: ref.current.scrollLeft };
  };
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current.down || !ref.current) return;
    e.preventDefault();
    drag.current.moved = true;
    ref.current.scrollLeft = drag.current.scroll - (e.pageX - drag.current.startX);
  };
  const stop = () => { drag.current.down = false; };

  return (
    <div
      ref={ref}
      className="skin-row"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onWheel={(e) => { if (ref.current) ref.current.scrollLeft += e.deltaY; }}
      style={{
        display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '9px',
        cursor: 'grab', userSelect: 'none', paddingBottom: '2px',
      }}
    >
      {skins.map((s, j) => (
        <div key={j} title={`${s.weapon}: ${s.skinName}`} style={{
          flex: '0 0 auto', width: '116px', padding: '6px',
          background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '6px',
        }}>
          <SafeImage src={s.icon} alt={s.skinName} fallbackLabel={s.weapon}
            style={{ width: '100%', height: '28px', objectFit: 'contain', pointerEvents: 'none' }} />
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em', marginTop: '3px' }}>
            {s.weapon.toUpperCase()}
          </div>
          <div style={{ fontSize: '10px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.skinName}
          </div>
        </div>
      ))}
    </div>
  );
};

const streakBadge = (s: LobbyInspectPlayer['streak']) => {
  if (!s || !s.type || s.count < 1) return <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>;
  const win = s.type === 'W';
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-heading)',
      color: win ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ff4655)',
      background: win ? 'rgba(16,185,129,0.12)' : 'rgba(255,70,85,0.12)',
      border: `1px solid ${win ? 'rgba(16,185,129,0.35)' : 'rgba(255,70,85,0.3)'}`,
      borderRadius: '4px', padding: '1px 5px'
    }}>
      {s.count}{s.type}
    </span>
  );
};

const PlayerCard: React.FC<{ p: LobbyInspectPlayer }> = ({ p }) => {
  const skins = p.skins || [];
  return (
    <div style={{
      borderRadius: '8px', marginBottom: '8px', padding: '10px',
      background: p.isPlayer ? 'rgba(255,70,85,0.08)' : 'rgba(255,255,255,0.02)',
      border: p.isPlayer ? '1px solid rgba(255,70,85,0.25)' : '1px solid var(--border-color)',
    }}>
      {/* Header: agent + name + rank + streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SafeImage src={p.agentIcon} alt={p.agentName || 'Agent'} fallbackLabel="?" style={{ width: '34px', height: '34px', borderRadius: '6px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.agentName || 'Selecting…'} {p.isPlayer && <span style={{ color: 'var(--accent-red)', fontSize: '10px' }}>(YOU)</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            {p.tierIcon && <SafeImage src={p.tierIcon} alt={p.tierName || ''} style={{ width: '18px', height: '18px' }} />}
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)' }}>{p.tierName || 'Unrated'}</span>
            {streakBadge(p.streak)}
          </div>
        </div>
      </div>

      {/* Real bought skins — horizontal grab-to-slide row */}
      {skins.length > 0 ? (
        <SkinRow skins={skins} />
      ) : (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
          No premium skins equipped
        </div>
      )}
    </div>
  );
};

const RosterColumn: React.FC<{ title: string; color: string; list: LobbyInspectPlayer[] }> = ({ title, color, list }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{
      fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
      color, padding: '0 2px 8px 2px'
    }}>{title}</div>
    {list.map((p, i) => <PlayerCard key={i} p={p} />)}
  </div>
);

export const LobbyRoster: React.FC = () => {
  const [data, setData] = useState<LobbyInspectData | null>(null);
  const [score, setScore] = useState<{ ally: number | null; enemy: number | null } | null>(null);
  const lastMatchId = useRef<string | null>(null);

  useEffect(() => {
    let stopped = false;

    // Heavy roster (agents/ranks/streaks/skins) — fetch ONCE per match, refetch
    // only when the match (or phase) actually changes. Skins don't change mid-game.
    const syncRoster = async () => {
      try {
        const phase = await getGamePhase();
        if (stopped) return;
        const key = `${phase.phase}:${phase.matchId ?? ''}`;
        if (key === lastMatchId.current) return; // same match — don't refetch skins
        if (phase.phase === 'AGENT_SELECT' || phase.phase === 'INGAME') {
          const roster = await getLobbyInspect();
          if (stopped) return;
          setData(roster);
          lastMatchId.current = key; // commit only after data applied
        } else {
          setData({ available: false, phase: phase.phase as any, players: [], note: 'Not in agent select or a match right now.' });
          lastMatchId.current = key;
        }
      } catch { /* keep last roster */ }
    };

    // Lightweight score — poll frequently (local presence read only).
    const syncScore = async () => {
      try {
        const s = await getLiveScore();
        if (!stopped) setScore({ ally: s.ally, enemy: s.enemy });
      } catch { /* ignore */ }
    };

    syncRoster();
    syncScore();
    const rosterTimer = setInterval(syncRoster, 20000); // check for match change every 20s (cheap phase probe)
    const scoreTimer = setInterval(syncScore, 5000);     // score refresh every 5s
    return () => {
      stopped = true;
      lastMatchId.current = null; // reset so a remount (e.g. StrictMode/navigation) refetches
      clearInterval(rosterTimer);
      clearInterval(scoreTimer);
    };
  }, []);

  if (!data || !data.available) {
    return (
      <div style={{
        padding: '18px', borderRadius: '10px', background: 'var(--bg-card, rgba(255,255,255,0.03))',
        border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '13px'
      }}>
        {data?.note || 'Waiting for agent select or an active match…'}
      </div>
    );
  }

  const players = data.players || [];
  const myTeamId = players.find((p) => p.isPlayer)?.teamId;
  const hasTeams = players.some((p) => p.teamId);
  const allies = hasTeams ? players.filter((p) => p.teamId === myTeamId) : players;
  const enemies = hasTeams ? players.filter((p) => p.teamId && p.teamId !== myTeamId) : [];

  return (
    <div style={{
      borderRadius: '10px', background: 'var(--bg-card, rgba(255,255,255,0.03))',
      border: '1px solid var(--border-color)', overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff', fontSize: '13px', letterSpacing: '0.04em' }}>
          {data.phase === 'AGENT_SELECT' ? 'AGENT SELECT — YOUR TEAM' : 'MATCH ROSTER'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {score && score.ally !== null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: '#fff' }}>
              <span style={{ color: 'var(--accent-cyan, #00f0ff)' }}>{score.ally}</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
              <span style={{ color: 'var(--accent-red, #ff4655)' }}>{score.enemy}</span>
            </span>
          )}
          <span style={{
            fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-heading)',
            color: 'var(--accent-green, #10b981)', background: 'rgba(16,185,129,0.12)',
            padding: '2px 7px', borderRadius: '10px'
          }}>LIVE</span>
        </div>
      </div>

      {/* Team Columns (2 columns on desktop, stacked on mobile) */}
      <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: enemies.length > 0 ? '1fr 1fr' : '1fr', gap: '16px', padding: '14px' }}>
        <RosterColumn title="◆ YOUR TEAM" color="var(--accent-cyan, #00f0ff)" list={allies} />
        {enemies.length > 0 && <RosterColumn title="◆ ENEMY TEAM" color="var(--accent-red, #ff4655)" list={enemies} />}
      </div>


      <div style={{
        padding: '9px 16px', borderTop: '1px solid var(--border-color)',
        fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4
      }}>
        {data.note}
      </div>
    </div>
  );
};
