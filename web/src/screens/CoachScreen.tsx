import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Shield,
  Zap,
  Target,
  Flame,
  HelpCircle,
  Square,
  History,
  Plus,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Paperclip,
  Pencil,
  Search
} from 'lucide-react';
import {
  streamCoachChat,
  getRiotStatus,
  getCareer,
  getAiSettings,
  getCoachSuggestions,
  submitFeedback,
  analyzeScreenshot,
  CoachSuggestion
} from '../api/client';
import { ValoReconMonogram } from '../components/ValoReconLogo';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = 'valorecon-sessions';
const MAX_SESSIONS = 10;

const STATIC_SUGGESTIONS: CoachSuggestion[] = [
  { label: 'What is my weakest map?', prompt: 'What is my weakest map?', reason: '' },
  { label: 'Which agent should I main?', prompt: 'Which agent should I main?', reason: '' },
  { label: 'Analyze my recent form', prompt: 'Analyze my recent form', reason: '' },
  { label: 'How do I raise my K/D?', prompt: 'How do I raise my K/D?', reason: '' },
];

function welcomeMessage(): Message {
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: `**Welcome to ValoRecon — Your AI VALORANT coach!**

I am your dedicated tactical coaching assistant powered by Gemini. Whether you want to master **agent utility**, drill down on **map executes**, fix **economic discipline**, or review **crosshair mechanics**, I've got your back.

### Quick Commands & Suggestions:
- How do I properly hold **Ascent A Site** against an aggressive push?
- What are the best **Sova Recon lineups** for Haven A Long?
- When should our team **force buy vs save** on Round 2 after losing pistol?
- How can I improve my **Jett entry timing** with my Initiator's flashes?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function newSession(): Session {
  return {
    id: `session-${Date.now()}`,
    title: 'Coach chat',
    messages: [welcomeMessage()],
    updatedAt: Date.now(),
  };
}

export const CoachScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const loaded = loadSessions();
    return loaded.length ? loaded : [newSession()];
  });
  const [currentId, setCurrentId] = useState<string>(() => sessions[0]?.id || '');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [playerTag, setPlayerTag] = useState<string>('');
  const [rankLabel, setRankLabel] = useState<string>('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [modelName, setModelName] = useState<string>('GEMINI 3.5 FLASH');
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>(STATIC_SUGGESTIONS);
  const [contextNote, setContextNote] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const abortRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserQueryRef = useRef<string>('');

  const current = sessions.find((s) => s.id === currentId) || sessions[0];
  const messages = current?.messages || [];

  // ---- Persist sessions (debounced) ----
  const persistTimer = useRef<number | null>(null);
  useEffect(() => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      try {
        const trimmed = sessions.slice(0, MAX_SESSIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (e) { /* storage full — ignore */ }
    }, 400);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [sessions]);

  // ---- Boot: player identity, model, dynamic suggestions ----
  useEffect(() => {
    getRiotStatus()
      .then((s) => {
        if (s.connected && s.gameName && s.gameTag) {
          setPlayerTag(`${s.gameName}#${s.gameTag}`);
        } else {
          getCareer().then((c) => {
            if (c.player?.name && c.player?.tag) setPlayerTag(`${c.player.name}#${c.player.tag}`);
          }).catch(() => {});
        }
      })
      .catch(() => {});

    getCareer().then((c) => {
      setRankLabel(c.rank?.tierName || '');
      setMatchCount(c.stats?.totalMatches ?? null);
    }).catch(() => {});

    getAiSettings().then((s) => {
      if (s.model) setModelName(s.model.toUpperCase());
    }).catch(() => {});

    refreshSuggestions();
  }, []);

  const refreshSuggestions = useCallback(async () => {
    const s = await getCoachSuggestions();
    if (s.length > 0) setSuggestions(s);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // ---- Session management ----
  const selectSession = (id: string) => {
    if (isStreaming) abortRef.current?.();
    setCurrentId(id);
    setContextNote(null);
    setLastError(null);
    setShowHistory(false);
  };

  const startNewChat = () => {
    if (isStreaming) abortRef.current?.();
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    setContextNote(null);
    setLastError(null);
    refreshSuggestions();
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setCurrentId(fresh.id);
        return [fresh];
      }
      if (currentId === id) setCurrentId(next[0].id);
      return next;
    });
  };

  const patchCurrent = (fn: (msgs: Message[]) => Message[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentId) return s;
        const msgs = fn(s.messages);
        const firstUser = msgs.find((m) => m.role === 'user');
        return {
          ...s,
          messages: msgs,
          title: firstUser ? firstUser.content.slice(0, 42) + (firstUser.content.length > 42 ? '…' : '') : 'Coach chat',
          updatedAt: Date.now(),
        };
      })
    );
  };

  // ---- Send / stream ----
  const handleSend = async (textToSend?: string, opts?: { retry?: boolean }) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;
    if (!opts?.retry) lastUserQueryRef.current = query;

    setInput('');
    setLastError(null);
    setIsStreaming(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Snapshot of messages for the API call (before appending the new pair).
    const historySnapshot = opts?.retry
      ? [...messages]
      : [...messages, userMsg];

    patchCurrent((msgs) => (opts?.retry ? [...msgs, initialAssistantMsg] : [...msgs, userMsg, initialAssistantMsg]));

    const historyForApi = historySnapshot
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const abortFn = await streamCoachChat(
        historyForApi,
        (chunk) => {
          patchCurrent((msgs) =>
            msgs.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        () => {
          setIsStreaming(false);
          abortRef.current = null;
          refreshSuggestions();
        },
        (error) => {
          console.error('Chat stream error:', error);
          setLastError('Stream failed. Check your connection or Gemini quota, then retry.');
          setIsStreaming(false);
          abortRef.current = null;
        },
        (meta) => {
          if (meta?.dropped > 0) {
            setContextNote(`Using the last ${meta.window} messages (${meta.dropped} older ones trimmed to control context).`);
          }
        }
      );
      abortRef.current = abortFn;
    } catch (err) {
      console.error('Failed to initiate stream:', err);
      setLastError('Could not reach the AI coach. Make sure the server is running.');
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  // Regenerate: truncate the conversation at an assistant message and re-ask.
  const handleRegenerate = (assistantMsgId: string) => {
    if (isStreaming) return;
    const idx = messages.findIndex((m) => m.id === assistantMsgId);
    if (idx <= 0) return;
    const priorUser = messages[idx - 1];
    if (!priorUser || priorUser.role !== 'user') return;
    patchCurrent((msgs) => msgs.slice(0, idx));
    lastUserQueryRef.current = priorUser.content;
    setLastError(null);
    handleSend(priorUser.content, { retry: true });
  };

  // Edit the last user message: load it into the input and truncate from there.
  const handleEditLast = (userMsgId: string) => {
    if (isStreaming) return;
    const idx = messages.findIndex((m) => m.id === userMsgId);
    if (idx < 0) return;
    const content = messages[idx].content;
    setInput(content);
    patchCurrent((msgs) => msgs.slice(0, idx));
    setLastError(null);
  };

  // Screenshot / scoreboard analysis via Gemini vision.
  const handleScreenshot = async (file: File) => {
    if (!file || isStreaming) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      const mime = file.type || 'image/png';
      const base64 = dataUrl.split(',')[1] || '';
      if (!base64) return;

      const assistantMsgId = `assistant-${Date.now()}`;
      const placeholder: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      patchCurrent((msgs) => [...msgs, placeholder]);
      setIsStreaming(true);
      setUploading(true);
      try {
        const analysis = await analyzeScreenshot(base64, mime);
        patchCurrent((msgs) => msgs.map((m) => m.id === assistantMsgId ? { ...m, content: analysis } : m));
      } catch (err: any) {
        patchCurrent((msgs) => msgs.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `**Screenshot analysis failed.** ${err?.message || ''}` } : m
        ));
      } finally {
        setIsStreaming(false);
        setUploading(false);
        refreshSuggestions();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFeedback = async (messageId: string, rating: 'up' | 'down') => {
    if (feedbackGiven.has(messageId)) return;
    setFeedbackGiven((prev) => new Set(prev).add(messageId));
    await submitFeedback({ messageId, rating });
  };

  const handleClear = () => {
    if (isStreaming) handleStop();
    startNewChat();
  };

  const ctxLine = [
    playerTag ? `Player: ${playerTag}` : null,
    rankLabel ? rankLabel : null,
    matchCount != null ? `${matchCount} matches analyzed` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="animate-fade-in coach-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 100px)',
      gap: '16px'
    }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 420px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 70, 85, 0.15)',
            border: '1px solid rgba(255, 70, 85, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ValoReconMonogram size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="coach-heading-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.02em'
              }}>
                VALORECON AI COACH
              </h2>
              <span className="tactical-badge" style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-2)',
                border: '1px solid var(--border-strong)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {modelName}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time streaming agent tactics, economy coaching & round breakdowns
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* History dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="tactical-btn-secondary"
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <History size={14} /> History
            </button>
            {showHistory && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: '300px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#131924',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                zIndex: 50,
                boxShadow: 'none'
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 700 }}>
                  CONVERSATIONS
                </div>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search conversations..."
                      aria-label="Search conversations"
                      style={{
                        width: '100%', padding: '6px 8px 6px 26px', fontSize: '12px', boxSizing: 'border-box',
                        backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                        color: '#fff', outline: 'none'
                      }}
                    />
                  </div>
                </div>
                {sessions.filter((s) => !historySearch.trim() || s.title.toLowerCase().includes(historySearch.toLowerCase())).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      backgroundColor: s.id === currentId ? 'rgba(0,240,255,0.06)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(s.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {s.messages.length} msgs
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={startNewChat}
            className="tactical-btn-secondary"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> New Chat
          </button>
        </div>
      </div>

      {/* Context transparency bar */}
      {ctxLine && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          padding: '4px 20px'
        }}>
          COACH CONTEXT: {ctxLine}{contextNote ? ` · ${contextNote}` : ''}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        className="glass-panel"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Coach conversation"
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          minWidth: 0,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          const isWelcome = idx === 0 && m.role === 'assistant' && m.id.startsWith('msg-');
          const showFeedback = !isUser && !isWelcome && !isStreaming && m.content.trim().length > 0;
          return (
            <div
              key={m.id}
              className="coach-message"
              style={{
                display: 'flex',
                gap: '14px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '75%' : '900px',
                width: isUser ? 'auto' : 'min(900px, 92%)',
                minWidth: 0,
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                flexShrink: 0,
                backgroundColor: isUser ? 'var(--accent-red)' : '#192233',
                border: `1px solid ${isUser ? 'rgba(255, 70, 85, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none'
              }}>
                {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="var(--accent-cyan)" />}
              </div>

              {/* Bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '100%', minWidth: 0, flex: 1 }}>
                <div style={{
                  backgroundColor: isUser ? 'var(--accent-weak)' : 'var(--surface-2)',
                  border: `1px solid ${isUser ? 'rgba(255, 70, 85, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '16px 18px',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: 1.65,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  minWidth: 0,
                  maxWidth: '100%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      color: isUser ? 'var(--accent-red)' : 'var(--accent-cyan)',
                      letterSpacing: '0.05em'
                    }}>
                      {isUser ? (playerTag ? `YOU (${playerTag.toUpperCase()})` : 'YOU') : 'VALORECON // RADIANT AI'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="markdown-content" style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, maxWidth: '100%' }}>
                    {m.content ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
                        <span>Formulating tactical breakdown...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback + regenerate/edit row */}
                {showFeedback && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                    {!isUser && idx === messages.length - 1 && (
                      <button
                        onClick={() => handleRegenerate(m.id)}
                        title="Regenerate response"
                        aria-label="Regenerate response"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    {isUser && idx === messages.length - 1 && (
                      <button
                        onClick={() => handleEditLast(m.id)}
                        title="Edit question"
                        aria-label="Edit question"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleFeedback(m.id, 'up')}
                      disabled={feedbackGiven.has(m.id)}
                      title="Helpful"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: feedbackGiven.has(m.id) ? 'var(--accent-green)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ThumbsUp size={13} />
                    </button>
                    <button
                      onClick={() => handleFeedback(m.id, 'down')}
                      disabled={feedbackGiven.has(m.id)}
                      title="Not helpful"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: feedbackGiven.has(m.id) ? 'var(--accent-red)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ThumbsDown size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {lastError && !isStreaming && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255, 70, 85, 0.1)',
            border: '1px solid rgba(255, 70, 85, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: 'var(--accent-red)'
          }}>
            <span>{lastError}</span>
            <button
              onClick={() => { if (lastUserQueryRef.current) handleSend(lastUserQueryRef.current, { retry: true }); }}
              className="tactical-btn"
              style={{ padding: '5px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={12} /> RETRY
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="touch-scroll" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-muted)',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          TACTICAL QUERIES:
        </span>
        {suggestions.map((s, i) => (
          <button
            key={`${s.prompt}-${i}`}
            onClick={() => handleSend(s.prompt)}
            disabled={isStreaming}
            title={s.reason || undefined}
            style={{
              whiteSpace: 'nowrap',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="glass-panel-hover"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="glass-panel" style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid rgba(255, 70, 85, 0.3)'
      }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleScreenshot(f);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || uploading}
          title="Analyze a screenshot / scoreboard with AI"
          aria-label="Attach screenshot for AI analysis"
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: uploading ? 'var(--accent-cyan)' : 'var(--text-muted)',
            padding: '7px 8px',
            cursor: isStreaming || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            flexShrink: 0
          }}
        >
          <Paperclip size={14} /> <span className="hide-on-mobile-tiny">{uploading ? '...' : 'IMG'}</span>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message the AI coach"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask coach for strategic lineups, attack defaults, or post-plant utility..."
          disabled={isStreaming}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '14px',
            padding: '8px 6px',
            fontFamily: 'var(--font-body)'
          }}
        />

        {isStreaming ? (
          <button
            onClick={handleStop}
            style={{
              backgroundColor: 'rgba(255, 70, 85, 0.2)',
              border: '1px solid var(--accent-red)',
              color: 'var(--accent-red)',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Square size={13} fill="var(--accent-red)" /> STOP
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="tactical-btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              opacity: input.trim() ? 1 : 0.5,
              cursor: input.trim() ? 'pointer' : 'default'
            }}
          >
            SEND <Send size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
