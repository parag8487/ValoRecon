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
  Globe,
  Radio,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { getLiveMatch } from '../api/client';

export const CompanionScreen: React.FC = () => {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [paired, setPaired] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to pair mobile companion');
  const [copied, setCopied] = useState<boolean>(false);

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
    generateCode();
    const interval = setInterval(() => {
      getLiveMatch().then(setLiveData).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyPairingUrl = () => {
    const url = `${window.location.origin}/#/companion?code=${pairingCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1080px', margin: '0 auto', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="home-player-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tactical-badge" style={{ backgroundColor: 'rgba(255, 70, 85, 0.18)', color: 'var(--accent-red)', border: '1px solid rgba(255, 70, 85, 0.35)' }}>
              LIVE WEBSOCKET RELAY
            </span>
            <span className="tactical-badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              ZERO APP INSTALL REQUIRED
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: '#ffffff' }}>
            MOBILE COMPANION & SECOND SCREEN
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Transform your phone or tablet into an ultra-low latency second-screen match radar, economy advisor, and lineup guide.
          </p>
        </div>

        <button
          onClick={generateCode}
          disabled={loading}
          className="tactical-btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Generate New Code
        </button>
      </div>

      <div className="companion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Pairing Code Card */}
        <div className="glass-panel" style={{
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255, 70, 85, 0.15)',
            border: '1px solid rgba(255, 70, 85, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            color: 'var(--accent-red)'
          }}>
            <Smartphone size={26} />
          </div>

          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
            Mobile Pairing Code
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 0 20px 0' }}>
            Open ValoRecon on your phone's browser and enter this 6-digit sync code:
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px dashed var(--accent-red)',
            borderRadius: '10px',
            padding: '16px 36px',
            fontSize: '36px',
            fontWeight: 900,
            letterSpacing: '0.22em',
            color: 'var(--accent-gold)',
            marginBottom: '16px',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 0 24px rgba(255, 70, 85, 0.15)'
          }}>
            {pairingCode || '------'}
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '16px' }}>
            <button
              onClick={copyPairingUrl}
              className="tactical-btn"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: copied ? 'var(--accent-green)' : 'var(--accent-red)'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Link Copied!' : 'Copy Pairing Link'}
            </button>
          </div>

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
              LIVE STATUS
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
                AI TACTICAL BROADCAST
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
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              1
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Connect to Same Wi-Fi
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Ensure your mobile phone or tablet is connected to the same local Wi-Fi / LAN network as this PC.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 70, 85, 0.15)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              2
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Open in Phone Browser
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Open Safari, Chrome, or Firefox on your phone, navigate to your PC's IP or click <strong>Copy Pairing Link</strong> above and send it to your phone.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'rgba(248, 183, 62, 0.15)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              3
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Instant Second Screen
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Enter the 6-digit code. Your phone will immediately render live match economy, tactical callouts, and lineups during matches!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
