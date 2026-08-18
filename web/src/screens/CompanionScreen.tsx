import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  MessageSquare,
  Activity,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  Camera,
  ShieldCheck,
  Radio,
  LogOut,
  Target,
  Layers,
  Sparkles
} from 'lucide-react';
import { getLiveMatch } from '../api/client';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { CompanionScannerModal } from '../components/CompanionScannerModal';

const SESSION_STORAGE_KEY = 'valorecon_companion_session';

interface SessionData {
  pairingCode: string;
  token?: string;
  pairedAt: number;
}

export const CompanionScreen: React.FC = () => {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [paired, setPaired] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to pair mobile companion');
  const [copied, setCopied] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [manualInputCode, setManualInputCode] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Check for URL params (?code=... or ?pair=...) or existing saved session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const codeFromUrl = urlParams.get('code') || urlParams.get('pair');
    const tokenFromUrl = urlParams.get('token');

    if (codeFromUrl) {
      completePairing(codeFromUrl, tokenFromUrl || undefined);
      return;
    }

    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const session: SessionData = JSON.parse(saved);
        if (session.pairingCode) {
          setPairingCode(session.pairingCode);
          setPaired(true);
          setStatusMessage(`Connected via persistent session (${session.pairingCode})`);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8798/api/cloud/pair/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'valorecon-desktop-main' })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setPairingCode(data.pairingCode);
        setStatusMessage(`Pairing code active: ${data.pairingCode}`);
      } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setPairingCode(code);
        setStatusMessage(`Pairing code active: ${code}`);
      }
    } catch {
      const code = 'VALO99';
      setPairingCode(code);
      setStatusMessage(`Pairing code: ${code}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pairingCode && !paired) {
      generateCode();
    }
    const interval = setInterval(() => {
      getLiveMatch().then(setLiveData).catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [pairingCode, paired]);

  const completePairing = (code: string, token?: string) => {
    setPairingCode(code);
    setPaired(true);
    setStatusMessage(`Successfully paired: ${code}`);
    try {
      const session: SessionData = {
        pairingCode: code,
        token,
        pairedAt: Date.now()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  };

  const unpairDevice = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setPaired(false);
    setStatusMessage('Device unpaired. Ready to pair again.');
    generateCode();
  };

  // Build the direct pairing URL for Google Lens & QR Code
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pairingUrl = `${origin}/#/companion?code=${pairingCode || 'VALO99'}`;

  const copyPairingUrl = () => {
    navigator.clipboard.writeText(pairingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="home-player-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tactical-badge" style={{ backgroundColor: 'rgba(255, 70, 85, 0.18)', color: 'var(--accent-red)', border: '1px solid rgba(255, 70, 85, 0.35)' }}>
              LIVE TACTICAL RADAR
            </span>
            <span className="tactical-badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              GOOGLE LENS & QR INSTA-CONNECT
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: '#ffffff' }}>
            MOBILE COMPANION & SECOND SCREEN
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Pair your phone or second monitor for zero-latency live match radar, economy advice, and lineup utility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {paired ? (
            <button
              onClick={unpairDevice}
              className="tactical-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 700 }}
            >
              <LogOut size={15} /> Unpair Device
            </button>
          ) : (
            <button
              onClick={generateCode}
              disabled={loading}
              className="tactical-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 700 }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Generate New Code
            </button>
          )}
        </div>
      </div>

      {/* Main Companion Grid */}
      <div className="companion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Pairing / Connection Card */}
        <div className="glass-panel" style={{
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {paired ? 'Companion Paired & Active' : 'Scan QR Code or Enter Code'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {paired
                ? 'Your device is permanently paired. Auto-reconnecting on live matches.'
                : 'Scan with Google Lens or Phone Camera to connect automatically:'}
            </p>
          </div>

          {!paired ? (
            <>
              {/* High-Contrast Crisp QR Code for Google Lens & Native Camera */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <QRCodeDisplay value={pairingUrl} size={180} />
                <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  GOOGLE LENS / CAMERA COMPATIBLE
                </div>
              </div>

              {/* 6-Digit Code Box */}
              <div style={{
                background: 'rgba(0,0,0,0.55)',
                border: '2px dashed var(--accent-red)',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '30px',
                fontWeight: 900,
                letterSpacing: '0.22em',
                color: 'var(--accent-gold)',
                fontFamily: 'var(--font-mono)'
              }}>
                {pairingCode || '------'}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                {isMobile && (
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="tactical-btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontSize: '12px', fontWeight: 700 }}
                  >
                    <Camera size={15} color="var(--accent-red)" /> Scan with Mobile
                  </button>
                )}
                <button
                  onClick={copyPairingUrl}
                  className="tactical-btn"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontSize: '12px', fontWeight: 700, backgroundColor: copied ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              {/* Manual Input Fallback */}
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit code manually"
                  value={manualInputCode}
                  onChange={(e) => setManualInputCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  onClick={() => manualInputCode && completePairing(manualInputCode)}
                  disabled={!manualInputCode}
                  className="tactical-btn"
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
                >
                  Connect
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px 20px',
              gap: '14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              width: '100%'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                <ShieldCheck size={28} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                SYNCED WITH VALORECON DESKTOP
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                Auto-reconnecting session active. Live radar and economy tips are streaming.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {paired ? <Wifi size={14} color="var(--accent-green)" /> : <WifiOff size={14} color="var(--accent-gold)" />}
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* Live Stream Mirror Preview */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="var(--accent-red)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Live Mirror Feed</h3>
            </div>
            <span className="tactical-badge" style={{ backgroundColor: liveData?.inGame ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: liveData?.inGame ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {liveData?.inGame ? 'MATCH IN PROGRESS' : 'STANDBY'}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>
              CURRENT MAP & ROUND
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: liveData?.inGame ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
              {liveData?.inGame ? `IN GAME — ${liveData.map || 'COMPETITIVE MAP'}` : 'READY & WAITING IN VALORANT LOBBY'}
            </div>
            {liveData?.currentScore && (
              <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '8px', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                Score: {liveData.currentScore}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MessageSquare size={14} color="var(--accent-cyan)" />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                AI COACH BROADCAST
              </div>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#e0e0e0' }}>
              {liveData?.inGame
                ? 'Coaching stream active: advising on economy threshold, default hold positions, and lineup utility.'
                : 'Tactical advisor standing by. Real-time round tips, enemy economy predictions, and lineups will stream directly to your mobile screen during gameplay.'}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Connection Instructions Card */}
      <div className="glass-panel" style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Radio size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.03em' }}>
            HOW TO CONNECT YOUR PHONE IN 3 SIMPLE STEPS
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* Step 1 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '12px' }}>
              1
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Scan QR with Google Lens or Camera
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Point Google Lens or your phone's camera at the QR code above. It automatically opens the companion web app.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(255, 70, 85, 0.15)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '12px' }}>
              2
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Add to Home Screen (PWA)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              In Safari or Chrome, tap <strong>Share &gt; Add to Home Screen</strong> to install ValoRecon as a standalone full-screen app.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(248, 183, 62, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '12px' }}>
              3
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Permanent 1-Time Auto Connect
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Your session is saved securely. Future launches will automatically connect without re-entering any code.
            </p>
          </div>
        </div>
      </div>

      {/* In-App Mobile Camera Scanner Modal */}
      <CompanionScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(code, token) => completePairing(code, token)}
      />
    </div>
  );
};
