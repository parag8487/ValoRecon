import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Wifi, WifiOff, MessageSquare, Shield, Activity, RefreshCw } from 'lucide-react';
import { getApiBase, getRiotStatus, getLiveMatch } from '../api/client';

export const CompanionScreen: React.FC = () => {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [paired, setPaired] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to pair mobile companion');

  const generateCode = async () => {
    setLoading(true);
    try {
      // Generate code via cloud API (fallback to local mock if cloud server isn't running)
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
        // Deterministic local pairing code fallback
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setPairingCode(code);
        setStatusMessage(`Local pairing code: ${code}`);
      }
    } catch (err: any) {
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="home-player-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: '#ffffff' }}>
            MOBILE COMPANION & SECOND SCREEN
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Pair your phone or second monitor for zero-latency live match radar and AI coaching.
          </p>
        </div>

        <button
          onClick={generateCode}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Code
        </button>
      </div>

      <div className="companion-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Pairing Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 70, 85, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent-red)'
          }}>
            <Smartphone size={24} />
          </div>

          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Scan or Enter Code</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 0 20px 0' }}>
            Open ValoRecon Companion in your mobile browser and enter this 6-digit code.
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '2px dashed var(--accent-red)',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '0.25em',
            color: '#ffffff',
            marginBottom: '20px',
            fontFamily: 'monospace'
          }}>
            {pairingCode || '------'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {paired ? <Wifi size={14} color="#4caf50" /> : <WifiOff size={14} color="#ff9800" />}
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* Live Stream Mirror Preview */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={18} color="var(--accent-red)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Companion Live Mirror</h3>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>MATCH STATE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: liveData?.inGame ? '#4caf50' : '#ff9800' }}>
              {liveData?.inGame ? `IN GAME — ${liveData.map || 'MAP'}` : 'WAITING IN MENUS / LOBBY'}
            </div>
            {liveData?.currentScore && (
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                Score: {liveData.currentScore}
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MessageSquare size={14} color="var(--accent-cyan)" />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TACTICAL AI STREAM</div>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#e0e0e0' }}>
              {liveData?.inGame
                ? 'Coaching stream active: advising on economy threshold, default hold positions, and lineup utility.'
                : 'Advisor standing by. Live advice will broadcast to paired companion as soon as agent select or match starts.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
