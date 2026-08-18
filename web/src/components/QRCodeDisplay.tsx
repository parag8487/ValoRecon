import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<Props> = ({ value, size = 180 }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(setDataUrl)
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700 }}>GENERATING QR...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '8px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      <img
        src={dataUrl}
        alt="ValoRecon Mobile Pairing QR Code"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block'
        }}
      />
    </div>
  );
};
