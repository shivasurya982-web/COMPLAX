import React, { useState } from 'react';
import logoPng from '../assets/logo.png';

export const LogoIcon = ({ size = 48, color = '#E06D43', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
  >
    {/* Bright white/faint orbital C background rings */}
    <path
      d="M 68 20 A 36 36 0 1 0 68 80"
      stroke="rgba(255, 255, 255, 0.85)"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M 60 30 A 25 25 0 1 0 60 70"
      stroke="rgba(255, 255, 255, 0.65)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />

    {/* Intersecting orbital loops */}
    <ellipse
      cx="45"
      cy="50"
      rx="32"
      ry="15"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="5"
      fill="none"
      transform="rotate(-30 45 50)"
    />
    <ellipse
      cx="45"
      cy="50"
      rx="32"
      ry="15"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="5"
      fill="none"
      transform="rotate(30 45 50)"
    />

    {/* Bright Orange Arrow Heads on opening */}
    <polygon points="68,26 82,20 68,14" fill={color} />
    <polygon points="68,74 82,80 68,86" fill={color} />

    {/* Bright Orange Node Dots */}
    <circle cx="45" cy="12" r="8" fill={color} />
    <circle cx="45" cy="88" r="8" fill={color} />
    <circle cx="12" cy="50" r="8" fill={color} />
  </svg>
);

export const Logo = ({
  height = 52,
  color = '#E06D43',
  textColor = '#FFFFFF',
  showTagline = true,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  // If user places logo.png in src/assets/logo.png, render the uploaded image directly
  if (!imgError && logoPng) {
    return (
      <img
        src={logoPng}
        alt="COMPLAX Logo"
        onError={() => setImgError(true)}
        style={{
          height: `${height * 1.2}px`,
          maxHeight: `${Math.max(72, height * 1.3)}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
        className={className}
      />
    );
  }

  // Fallback high-visibility vector logo matching Image 2
  return (
    <div
      className={`logo-container ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}
    >
      <LogoIcon size={height * 1.25} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            fontWeight: 900,
            fontSize: `${height * 0.75}px`,
            letterSpacing: '0.05em',
            color: textColor,
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            COMPLA
            <span style={{ position: 'relative', display: 'inline-block' }}>
              X
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: `${height * 0.52}px`,
                  height: `${height * 0.52}px`,
                  position: 'absolute',
                  top: '-28%',
                  right: '-42%',
                  fill: 'none',
                  stroke: color,
                  strokeWidth: 4.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  filter: 'drop-shadow(0 2px 4px rgba(224,109,67,0.4))'
                }}
              >
                <line x1="6" y1="18" x2="18" y2="6" />
                <polyline points="8 6 18 6 18 16" />
              </svg>
            </span>
          </span>
        </div>
        {showTagline && (
          <span style={{
            fontSize: `${Math.max(9, height * 0.22)}px`,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: color,
            marginTop: '6px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            CONNECTING ORGANIZATIONS. RESOLVING ISSUES.
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
