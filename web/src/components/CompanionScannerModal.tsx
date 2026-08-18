import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string, token?: string) => void;
}

export const CompanionScannerModal: React.FC<Props> = ({ isOpen, onClose, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    setScannedResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or connection is not secure (HTTPS/localhost required).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestScanFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(err?.message || 'Unable to access camera. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const requestScanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(requestScanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(requestScanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      const scannedData = code.data.trim();
      setScannedResult(scannedData);
      setScanning(false);

      // Parse code / URL
      let pairingCode = scannedData;
      let token = '';

      try {
        if (scannedData.includes('?') || scannedData.startsWith('http')) {
          const url = new URL(scannedData, window.location.origin);
          const c = url.searchParams.get('code') || url.searchParams.get('pair');
          const t = url.searchParams.get('token');
          if (c) pairingCode = c;
          if (t) token = t;
        } else if (scannedData.includes(':')) {
          const parts = scannedData.split(':');
          pairingCode = parts[0];
          if (parts[1]) token = parts[1];
        }
      } catch {
        // use raw string
      }

      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      setTimeout(() => {
        onScanSuccess(pairingCode, token);
        onClose();
      }, 500);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(requestScanFrame);
  };

  if (!isOpen) return null;

  return (
    <div className="inspect-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '460px',
        width: '95%',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255, 70, 85, 0.4)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--accent-red)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
              SCAN DESKTOP QR CODE
            </h3>
          </div>
          <button onClick={onClose} className="tactical-btn-secondary" style={{ padding: '6px 10px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          Point your phone camera at the QR code displayed on your PC screen to pair instantly.
        </p>

        {/* Video Viewport Container */}
        <div style={{
          width: '100%',
          aspectRatio: '4/3',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          {error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={32} />
              <div style={{ fontSize: '13px' }}>{error}</div>
              <button onClick={startCamera} className="tactical-btn" style={{ padding: '6px 14px', fontSize: '12px', marginTop: '8px' }}>
                <RefreshCw size={14} /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Scanning Target Grid Overlay */}
              <div style={{
                position: 'absolute',
                inset: '18%',
                border: '2px dashed var(--accent-cyan)',
                borderRadius: '12px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  width: '18px',
                  height: '18px',
                  borderTop: '3px solid var(--accent-red)',
                  borderLeft: '3px solid var(--accent-red)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '18px',
                  height: '18px',
                  borderTop: '3px solid var(--accent-red)',
                  borderRight: '3px solid var(--accent-red)'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-2px',
                  width: '18px',
                  height: '18px',
                  borderBottom: '3px solid var(--accent-red)',
                  borderLeft: '3px solid var(--accent-red)'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '18px',
                  height: '18px',
                  borderBottom: '3px solid var(--accent-red)',
                  borderRight: '3px solid var(--accent-red)'
                }} />
              </div>

              {scannedResult && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(16, 185, 129, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#fff',
                  fontWeight: 800
                }}>
                  <CheckCircle2 size={40} />
                  <span>QR CODE MATCHED!</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Scan automatically handshakes the 6-digit cryptographic pair token.
        </div>
      </div>
    </div>
  );
};
