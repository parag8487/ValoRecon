import React, { useState } from 'react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallbackLabel?: string;
}

/**
 * Image that degrades gracefully: if src is missing or 404s, it renders a
 * neutral placeholder box (with optional label) instead of a broken-image icon.
 * Used everywhere Riot/valorant-api media URLs may be null or fail to resolve.
 */
export const SafeImage: React.FC<SafeImageProps> = ({ src, fallbackLabel, style, alt, ...rest }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
          fontSize: '9px',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.04em',
          overflow: 'hidden',
          textAlign: 'center',
        }}
        title={alt}
      >
        {fallbackLabel ?? ''}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
};
