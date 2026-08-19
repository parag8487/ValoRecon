import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Check,
  Crosshair,
  Flame,
  Radio,
  RefreshCw,
  Lock,
  Eye,
  Sliders,
  AlertTriangle,
  Gamepad2
} from 'lucide-react';
import {
  chooseAgent,
  getAgents,
  getMaps,
  Agent,
  AgentAdvisorResponse,
  getRiotPregame,
  getAutoPickSettings,
  saveAutoPickSettings,
  selectAgentAction,
  lockAgentAction,
  getUnlockedAgents,
  AutoPickSettings
} from '../api/client';

const ALL_MAPS = ['Ascent', 'Bind', 'Haven', 'Lotus', 'Sunset', 'Split', 'Abyss'];
const LOCAL_STORAGE_KEY = 'valorecon_autopick_config';

export const AgentSelectScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'autopick' | 'advisor'>('autopick');
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [pregameData, setPregameData] = useState<any>(null);

  // Initialize from persistent local storage immediately to preserve selection on tab switch
  const [autoPick, setAutoPick] = useState<AutoPickSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return {
      enabled: false,
      agentUuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa', // Sova
      agentName: 'Sova',
      mode: 'hover',
      matchState: 'IDLE'
    };
  });


  // Action status states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'warn' | 'info' | 'live';
    text: string;
  } | null>(null);

  // Strategic Advisor states
  const [selectedMap, setSelectedMap] = useState<string>('Ascent');
  const [allyComp, setAllyComp] = useState<string[]>(['Reyna', 'Omen']);
  const [preferredRole, setPreferredRole] = useState<string>('');
  const [recommendations, setRecommendations] = useState<AgentAdvisorResponse | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Load agents and sync with live entitlements on mount
  useEffect(() => {
    Promise.all([getAgents(), getUnlockedAgents().catch(() => [])]).then(([agents, unlockedUuids]) => {
      const unlockedSet = new Set((unlockedUuids || []).map((u: string) => u.toLowerCase()));
      const mergedAgents = agents.map((a) => ({
        ...a,
        unlocked: unlockedSet.size > 0 ? (unlockedSet.has(a.uuid.toLowerCase()) || a.unlocked === true) : a.unlocked
      }));
      setAllAgents(mergedAgents);

      // If no agent selected or invalid, default to an unlocked agent (e.g. Sova or Jett)
      if (mergedAgents.length > 0 && !autoPick.agentUuid) {
        const defaultAgent = mergedAgents.find((a) => a.displayName === 'Sova' && a.unlocked !== false) ||
                             mergedAgents.find((a) => a.unlocked !== false) ||
                             mergedAgents[0];
        const updated = {
          ...autoPick,
          agentUuid: defaultAgent.uuid,
          agentName: defaultAgent.displayName
        };
        setAutoPick(updated);
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
      }
    }).catch(console.error);

    // Fetch backend persistent state
    getAutoPickSettings().then((cfg) => {
      if (cfg && cfg.agentUuid) {
        setAutoPick((prev) => {
          const merged = { ...prev, ...cfg };
          try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }
    }).catch(console.error);
  }, []);

  // Poll pregame and live status every 2 seconds & sync entitlements periodically
  useEffect(() => {
    const pollPregame = () => {
      getRiotPregame().then((data) => {
        setPregameData(data);
        if (data?.inPregame && data?.map) {
          setSelectedMap(data.map);
        }
      }).catch(console.error);

      getAutoPickSettings().then((cfg) => {
        if (cfg?.matchState && cfg.matchState !== autoPick.matchState) {
          setAutoPick((prev) => ({
            ...prev,
            matchState: cfg.matchState,
            lastActionStatus: cfg.lastActionStatus || prev.lastActionStatus
          }));
        }
      }).catch(() => {});
    };

    const syncUnlocked = () => {
      getUnlockedAgents().then((unlockedUuids) => {
        if (Array.isArray(unlockedUuids) && unlockedUuids.length > 0) {
          const unlockedSet = new Set(unlockedUuids.map((u: string) => u.toLowerCase()));
          setAllAgents((prev) =>
            prev.map((a) => ({
              ...a,
              unlocked: unlockedSet.has(a.uuid.toLowerCase()) || a.unlocked === true
            }))
          );
        }
      }).catch(() => {});
    };

    pollPregame();
    syncUnlocked();
    const interval = setInterval(pollPregame, 2000);
    const unlockedInterval = setInterval(syncUnlocked, 10000);
    return () => {
      clearInterval(interval);
      clearInterval(unlockedInterval);
    };
  }, [autoPick.matchState]);

  const updateConfig = async (updated: AutoPickSettings) => {
    setAutoPick(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    await saveAutoPickSettings(updated).catch(console.error);
  };

  const handleToggleAutoPick = async (enabled: boolean) => {
    const updated = { ...autoPick, enabled };
    await updateConfig(updated);
    setActionMessage({
      type: enabled ? 'success' : 'info',
      text: enabled
        ? `Auto-Pick Scanner ACTIVATED for ${autoPick.agentName || 'selected agent'} (${autoPick.mode.toUpperCase()})`
        : 'Auto-Pick Scanner DISABLED'
    });
  };

  const handleSelectAgentForAutoPick = async (agent: Agent) => {
    if (agent.unlocked === false) {
      setActionMessage({
        type: 'warn',
        text: `${agent.displayName} is LOCKED on your Riot account and cannot be selected.`
      });
      return;
    }

    const updated: AutoPickSettings = {
      ...autoPick,
      agentUuid: agent.uuid,
      agentName: agent.displayName,
      lastActionStatus: autoPick.mode === 'lock'
        ? `Instalock armed for ${agent.displayName}! Will instantly lock in 0ms when match starts.`
        : `Hover armed for ${agent.displayName}! Will automatically hover when match starts.`
    };
    await updateConfig(updated);

    setActionMessage({
      type: 'info',
      text: autoPick.mode === 'lock'
        ? `Instalock armed for ${agent.displayName}! Will instantly lock in 0ms when match starts.`
        : `Hover armed for ${agent.displayName}! Will automatically hover when match starts.`
    });
  };

  const handleModeChange = async (mode: 'hover' | 'lock') => {
    const updated: AutoPickSettings = {
      ...autoPick,
      mode,
      lastActionStatus: mode === 'lock'
        ? `Instalock armed for ${autoPick.agentName}! Will instantly lock in 0ms when match starts.`
        : `Hover armed for ${autoPick.agentName}! Will automatically hover when match starts.`
    };
    await updateConfig(updated);

    setActionMessage({
      type: 'info',
      text: mode === 'lock'
        ? `Mode switched to INSTALOCK for ${autoPick.agentName} (Instant lock in 0ms on match start).`
        : `Mode switched to HOVER ONLY for ${autoPick.agentName} (Pre-selects without locking).`
    });
  };

  const handleManualHover = async () => {
    if (!autoPick.agentUuid) return;
    const targetAgent = allAgents.find((a) => a.uuid === autoPick.agentUuid);
    if (targetAgent?.unlocked === false) {
      setActionMessage({
        type: 'warn',
        text: `${targetAgent.displayName} is LOCKED on your account.`
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await selectAgentAction(autoPick.agentUuid);
      const updated = {
        ...autoPick,
        mode: 'hover' as const,
        lastActionStatus: res.message || `Hovered ${autoPick.agentName}`
      };
      await updateConfig(updated);

      if (res.status === 'HOVERED' || res.success) {
        setActionMessage({
          type: 'success',
          text: `${res.message || `Successfully hovered ${autoPick.agentName} in-game!`}`
        });
      } else {
        setActionMessage({
          type: 'info',
          text: res.message || `Hover armed for ${autoPick.agentName}! Will automatically hover when match starts.`
        });
      }
    } catch (e: any) {
      setActionMessage({ type: 'warn', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualLock = async () => {
    if (!autoPick.agentUuid) return;
    const targetAgent = allAgents.find((a) => a.uuid === autoPick.agentUuid);
    if (targetAgent?.unlocked === false) {
      setActionMessage({
        type: 'warn',
        text: `${targetAgent.displayName} is LOCKED on your account.`
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await lockAgentAction(autoPick.agentUuid);
      const updated = {
        ...autoPick,
        mode: 'lock' as const,
        lastActionStatus: res.message || `Locked in ${autoPick.agentName}`
      };
      await updateConfig(updated);

      if (res.status === 'LOCKED' || res.success) {
        setActionMessage({
          type: 'success',
          text: `${res.message || `Successfully locked in ${autoPick.agentName}!`}`
        });
      } else {
        setActionMessage({
          type: 'info',
          text: res.message || `Instalock armed for ${autoPick.agentName}! Will instantly lock in 0ms when match starts.`
        });
      }
    } catch (e: any) {
      setActionMessage({ type: 'warn', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const fetchRecommendations = () => {
    setAdvisorLoading(true);
    chooseAgent(selectedMap, allyComp, preferredRole || undefined)
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setAdvisorLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'advisor') {
      fetchRecommendations();
    }
  }, [selectedMap, allyComp, preferredRole, activeTab]);

  const selectedAgentObj = allAgents.find((a) => a.uuid === autoPick.agentUuid) ||
                           allAgents.find((a) => a.displayName === autoPick.agentName) ||
                           allAgents[0];
  const unlockedCount = allAgents.filter((a) => a.unlocked !== false).length;

  // Real-time pregame state analysis
  const myPregamePlayer = (pregameData?.allyComp || []).find((p: any) => p.isPlayer);
  const isCurrentlyLockedInLobby = myPregamePlayer?.characterSelectionState === 'locked';
  const isCurrentlyHoveredInLobby = myPregamePlayer?.characterSelectionState === 'selected';
  const isInCoreGame = autoPick.matchState === 'IN_GAME';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Live Radar Status */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              AGENT SELECT HELPER // LIVE SCANNER & ADVISOR
            </h1>
            <span className="tactical-badge" style={{
              backgroundColor: pregameData?.inPregame
                ? 'rgba(255, 70, 85, 0.2)'
                : isInCoreGame
                ? 'rgba(248, 183, 62, 0.2)'
                : 'rgba(0, 240, 255, 0.15)',
              color: pregameData?.inPregame
                ? 'var(--accent-red)'
                : isInCoreGame
                ? 'var(--accent-gold)'
                : 'var(--accent-cyan)',
              border: `1px solid ${
                pregameData?.inPregame
                  ? 'var(--accent-red)'
                  : isInCoreGame
                  ? 'var(--accent-gold)'
                  : 'rgba(0, 240, 255, 0.3)'
              }`
            }}>
              {pregameData?.inPregame
                ? 'AGENT SELECT ACTIVE'
                : isInCoreGame
                ? 'MATCH IN PROGRESS'
                : 'LOBBY RADAR ACTIVE'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pregameData?.inPregame
              ? `Currently in Matchmaking Lobby • Map: ${pregameData.map}`
              : isInCoreGame
              ? `Live Match in progress as ${autoPick.agentName} • Real-time stats & coach active`
              : 'Auto-scans queue pops & pregame state in the background via official local Riot PVP client'}
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(0,0,0,0.4)',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('autopick')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'autopick' ? 'var(--accent-red)' : 'transparent',
              color: activeTab === 'autopick' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={14} /> AUTO-PICK & LOCK
          </button>
          <button
            onClick={() => setActiveTab('advisor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'advisor' ? 'var(--accent-red)' : 'transparent',
              color: activeTab === 'advisor' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} /> STRATEGIC AI ADVISOR
          </button>
        </div>
      </div>

      {/* Prominent Match Status Banner if in Pregame or In-Game */}
      {pregameData?.inPregame && (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          border: `1px solid ${isCurrentlyLockedInLobby ? 'var(--accent-green)' : 'var(--accent-cyan)'}`,
          backgroundColor: isCurrentlyLockedInLobby ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 240, 255, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCurrentlyLockedInLobby ? (
              <CheckCircle2 size={24} color="var(--accent-green)" />
            ) : (
              <Eye size={24} color="var(--accent-cyan)" />
            )}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 700,
                color: isCurrentlyLockedInLobby ? 'var(--accent-green)' : 'var(--accent-cyan)'
              }}>
                {isCurrentlyLockedInLobby
                  ? `${myPregamePlayer?.agentName || autoPick.agentName} IS LOCKED IN (CONFIRMED)`
                  : `${myPregamePlayer?.agentName || autoPick.agentName} IS HOVERED IN LOBBY`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Map: <strong>{pregameData.map}</strong> • Match starting shortly. Background scanner active.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isCurrentlyLockedInLobby && (
              <button
                onClick={handleManualLock}
                disabled={actionLoading}
                className="tactical-btn"
                style={{ padding: '8px 16px', fontSize: '11px' }}
              >
                <Lock size={12} /> LOCK IN NOW
              </button>
            )}
          </div>
        </div>
      )}

      {isInCoreGame && (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          border: '1px solid var(--accent-gold)',
          backgroundColor: 'rgba(248, 183, 62, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Gamepad2 size={24} color="var(--accent-gold)" />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: 'var(--accent-gold)' }}>
              MATCH STARTED — PLAYING AS {autoPick.agentName.toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Live match in progress on VALORANT server. Visit Live Match tab for real-time economy & scoreboard.
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 1: AUTO-PICK & REAL-TIME LOCK */}
      {activeTab === 'autopick' && (
        <div className="analysis-split-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
          {/* Left Column: Configuration Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  SCANNER SETTINGS
                </h3>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggleAutoPick(!autoPick.enabled)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  backgroundColor: autoPick.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${autoPick.enabled ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: autoPick.enabled ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <span className="pulse-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: autoPick.enabled ? 'var(--accent-green)' : 'var(--text-muted)'
                }} />
                {autoPick.enabled ? 'SCANNING ON' : 'SCANNING OFF'}
              </button>
            </div>

            {/* Selected Agent Display Card */}
            {selectedAgentObj && (
              <div style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 70, 85, 0.3)',
                backgroundColor: 'var(--surface)',
                backgroundImage: `url(${selectedAgentObj.background})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Strong uniform dark scrim — keeps every agent's card equally
                    legible regardless of how bright that agent's splash art is */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(9, 12, 16, 0.88)',
                  pointerEvents: 'none'
                }} />
                <img
                  src={selectedAgentObj.displayIcon}
                  alt={selectedAgentObj.displayName}
                  style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                    TARGET AGENT
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#fff', lineHeight: 1.05, textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}>
                    {selectedAgentObj.displayName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '3px' }}>
                    {selectedAgentObj.role?.displayName || 'Agent'} • <span style={{ color: 'var(--accent-green)' }}>UNLOCKED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode Selection Options (Hover Only vs Instalock) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                ACTION MODE ON MATCH START
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => handleModeChange('hover')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: autoPick.mode === 'hover' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${autoPick.mode === 'hover' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)'}`,
                    color: '#fff',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: autoPick.mode === 'hover' ? 'var(--accent-cyan)' : '#fff' }}>
                    <Eye size={14} /> HOVER ONLY
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Pre-selects in lobby without locking in
                  </span>
                </button>

                <button
                  onClick={() => handleModeChange('lock')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: autoPick.mode === 'lock' ? 'rgba(255, 70, 85, 0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${autoPick.mode === 'lock' ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'}`,
                    color: '#fff',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: autoPick.mode === 'lock' ? 'var(--accent-red)' : '#fff' }}>
                    <Lock size={14} /> INSTALOCK
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Instant selection & lock in 0ms on load
                  </span>
                </button>
              </div>
            </div>

            {/* Manual Immediate Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                DIRECT RIOT CLIENT ACTIONS
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleManualHover}
                  disabled={actionLoading || selectedAgentObj?.unlocked === false}
                  className="tactical-btn"
                  style={{
                    padding: '10px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(0, 240, 255, 0.15)',
                    borderColor: 'var(--accent-cyan)',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <Eye size={14} /> HOVER NOW
                </button>

                <button
                  onClick={handleManualLock}
                  disabled={actionLoading || selectedAgentObj?.unlocked === false}
                  className="tactical-btn"
                  style={{ padding: '10px', fontSize: '12px' }}
                >
                  <Lock size={14} /> LOCK IN NOW
                </button>
              </div>

              {/* Action / Arming Feedback Banner */}
              {(actionMessage || autoPick.lastActionStatus) && (
                <div style={{
                  fontSize: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: (actionMessage?.type === 'success' || isCurrentlyLockedInLobby)
                    ? 'rgba(16, 185, 129, 0.15)'
                    : actionMessage?.type === 'warn'
                    ? 'rgba(255, 70, 85, 0.18)'
                    : 'rgba(0, 240, 255, 0.12)',
                  border: `1px solid ${
                    (actionMessage?.type === 'success' || isCurrentlyLockedInLobby)
                      ? 'var(--accent-green)'
                      : actionMessage?.type === 'warn'
                      ? 'var(--accent-red)'
                      : 'var(--accent-cyan)'
                  }`,
                  color: '#fff',
                  fontFamily: 'var(--font-heading)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {(actionMessage?.type === 'success' || isCurrentlyLockedInLobby) && <CheckCircle2 size={16} color="var(--accent-green)" />}
                  {actionMessage?.type === 'warn' && <AlertTriangle size={16} color="var(--accent-red)" />}
                  {(actionMessage?.type === 'info' || (!actionMessage && autoPick.lastActionStatus)) && <Zap size={16} color="var(--accent-cyan)" />}
                  <span>{actionMessage?.text || autoPick.lastActionStatus}</span>
                </div>
              )}
            </div>

            {/* Safety & Real-time Indicator Note */}
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
              • <strong>Persistent Background Scanner:</strong> Your target agent selection ({autoPick.agentName || 'Sova'}) and mode ({autoPick.mode === 'lock' ? 'Instalock' : 'Hover'}) stay continuously active in the background even if you browse other tabs or screens.
            </div>
          </div>

          {/* Right Column: Agent Selection Grid */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  SELECT AGENT FOR AUTO-PICK / INSTALOCK
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Click an unlocked agent to set as your active choice
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)' }}>
                {unlockedCount} / {allAgents.length} UNLOCKED
              </span>
            </div>

            {/* Agent Icons Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
              gap: '12px',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '6px'
            }}>
              {allAgents.map((agent) => {
                const isSelected = agent.uuid === autoPick.agentUuid || agent.displayName === autoPick.agentName;
                const isUnlocked = agent.unlocked !== false;

                return (
                  <button
                    key={agent.uuid}
                    onClick={() => handleSelectAgentForAutoPick(agent)}
                    disabled={!isUnlocked}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 8px',
                      borderRadius: '8px',
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      opacity: isUnlocked ? 1 : 0.45,
                      backgroundColor: isSelected ? 'rgba(255, 70, 85, 0.18)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${
                        isSelected
                          ? 'var(--accent-red)'
                          : isUnlocked
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255, 70, 85, 0.1)'
                      }`,
                      boxShadow: isSelected ? '0 0 14px rgba(255, 70, 85, 0.35)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={agent.displayIconSmall || agent.displayIcon}
                        alt={agent.displayName}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '6px',
                          filter: isUnlocked ? 'none' : 'grayscale(80%)'
                        }}
                      />
                      {!isUnlocked && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          backgroundColor: 'rgba(0,0,0,0.85)',
                          borderRadius: '50%',
                          padding: '2px',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          <Lock size={12} color="var(--accent-red)" />
                        </div>
                      )}
                    </div>

                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSelected ? '#fff' : isUnlocked ? 'var(--text-secondary)' : 'var(--text-muted)'
                    }}>
                      {agent.displayName}
                    </span>

                    <span style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      color: isUnlocked ? 'var(--accent-cyan)' : 'var(--accent-red)'
                    }}>
                      {isUnlocked ? (agent.role?.displayName || 'Agent') : 'LOCKED'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: STRATEGIC AI ADVISOR */}
      {activeTab === 'advisor' && (
        <div className="analysis-split-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
          {/* Left: Map & Comp Controls */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                ACTIVE MAP
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {ALL_MAPS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMap(m)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: selectedMap === m ? 'var(--accent-red)' : 'rgba(0,0,0,0.3)',
                      color: selectedMap === m ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${selectedMap === m ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'}`
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                LOCKED ALLY AGENTS ({allyComp.length}/4)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {allAgents.filter((a) => a.unlocked !== false).slice(0, 15).map((a) => {
                  const isLocked = allyComp.includes(a.displayName);
                  return (
                    <button
                      key={a.uuid}
                      onClick={() => {
                        if (isLocked) {
                          setAllyComp(allyComp.filter((x) => x !== a.displayName));
                        } else if (allyComp.length < 4) {
                          setAllyComp([...allyComp, a.displayName]);
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        backgroundColor: isLocked ? 'rgba(0, 240, 255, 0.18)' : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${isLocked ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)'}`,
                        color: isLocked ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontWeight: isLocked ? 700 : 400
                      }}
                    >
                      {a.displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                PREFERRED ROLE (OPTIONAL)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {['', 'Duelist', 'Initiator', 'Controller', 'Sentinel'].map((role) => (
                  <button
                    key={role || 'all'}
                    onClick={() => setPreferredRole(role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      cursor: 'pointer',
                      backgroundColor: preferredRole === role ? 'rgba(248, 183, 62, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: preferredRole === role ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      border: `1px solid ${preferredRole === role ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)'}`
                    }}
                  >
                    {role || 'ANY ROLE'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Recommendations */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-gold)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  AI RECOMMENDATIONS FOR {selectedMap.toUpperCase()}
                </h3>
              </div>
              {advisorLoading && <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />}
            </div>

            {recommendations && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recommendations.recommendations.map((rec, idx) => {
                  const matchAgent = allAgents.find((a) => a.displayName.toLowerCase() === rec.agentName.toLowerCase());
                  const isAgentUnlocked = matchAgent?.unlocked !== false;

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        border: idx === 0 ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isAgentUnlocked ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          color: idx === 0 ? 'var(--accent-gold)' : 'var(--text-muted)'
                        }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                              {rec.agentName}
                            </span>
                            <span className="tactical-badge" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'var(--text-muted)' }}>
                              {rec.role}
                            </span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontWeight: 700 }}>
                              TIER {rec.tier} • {rec.score}% MATCH
                            </span>
                            {!isAgentUnlocked && (
                              <span className="tactical-badge" style={{ backgroundColor: 'rgba(255,70,85,0.2)', color: 'var(--accent-red)' }}>
                                LOCKED
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {rec.mapAdvantage}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={!isAgentUnlocked}
                        onClick={() => {
                          if (matchAgent && isAgentUnlocked) {
                            handleSelectAgentForAutoPick(matchAgent);
                            setActiveTab('autopick');
                          }
                        }}
                        className="tactical-btn"
                        style={{
                          padding: '8px 14px',
                          fontSize: '11px',
                          cursor: isAgentUnlocked ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isAgentUnlocked ? 'SELECT FOR AUTOPICK' : 'LOCKED ON ACCOUNT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
