import React from 'react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  className?: string;
}

export const ValoReconMonogram: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = 'var(--accent)'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >

      {/* Left Wing of V */}
      <path
        d="M4 6 L12 6 L16 22 L13 22 L4 6 Z"
        fill={color}
      />
      {/* Right Wing of V with Tactical Notch */}
      <path
        d="M28 6 L20 6 L16 22 L19 22 L28 6 Z"
        fill="var(--text)"
      />
      {/* Center Tactical Chevron / Core */}
      <path
        d="M16 14 L20 6 L24 6 L17.5 19 L16 14 Z"
        fill="var(--text-2)"
      />
      {/* Bottom Apex Dot */}
      <polygon
        points="14.5,25 17.5,25 16,28"
        fill={color}
      />
    </svg>
  );
};

export const ValoReconWordmark: React.FC<LogoProps> = ({
  size = 32,
  showWordmark = true,
  tagline = 'YOUR AI VALORANT COACH'
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none', minWidth: 0 }}>
      <div style={{
        width: `${size + 8}px`,
        height: `${size + 8}px`,
        backgroundColor: 'var(--accent-weak)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
        flexShrink: 0
      }}>
        <ValoReconMonogram size={size} />
      </div>

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '17px',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text)',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap'
          }}>
            VALORECON
          </div>
          {tagline && (
            <div style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginTop: '2px',
              whiteSpace: 'nowrap'
            }}>
              {tagline}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
