import React from 'react';

export const LogoIcon = ({ size = 32, color = 'var(--primary)', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0 }}
  >
    {/* Outer orbital rings forming C */}
    <path
      d="M 65 20 A 38 38 0 1 0 65 80"
      stroke={color}
      strokeWidth="6.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M 58 32 A 26 26 0 1 0 58 68"
      stroke={color}
      strokeWidth="5.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow heads at ends */}
    <path d="M 60 11 L 74 20 L 60 29 Z" fill={color} />
    <path d="M 60 71 L 74 80 L 60 89 Z" fill={color} />
    {/* Intersecting orbital ellipses */}
    <ellipse
      cx="44"
      cy="50"
      rx="32"
      ry="15"
      stroke={color}
      strokeWidth="4.5"
      fill="none"
      transform="rotate(-30 44 50)"
    />
    <ellipse
      cx="44"
      cy="50"
      rx="32"
      ry="15"
      stroke={color}
      strokeWidth="4.5"
      fill="none"
      transform="rotate(30 44 50)"
    />
    {/* Node dots */}
    <circle cx="50" cy="12" r="4.5" fill={color} />
    <circle cx="50" cy="88" r="4.5" fill={color} />
    <circle cx="12" cy="50" r="4.5" fill={color} />
    <circle cx="21" cy="28" r="3.5" fill={color} />
    <circle cx="21" cy="72" r="3.5" fill={color} />
  </svg>
);

export const Logo = ({ height = 36, color = 'var(--primary)', textColor = 'var(--text-main)', showTagline = true, className = '' }) => (
  <div className={`logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
    <LogoIcon size={height} color={color} />
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          fontWeight: 900,
          fontSize: `${height * 0.65}px`,
          letterSpacing: '0.04em',
          color: textColor,
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1
        }}>
          COMPLA
          <span style={{ position: 'relative', display: 'inline-block' }}>
            X
            <svg
              viewBox="0 0 24 24"
              style={{
                width: `${height * 0.45}px`,
                height: `${height * 0.45}px`,
                position: 'absolute',
                top: '-25%',
                right: '-35%',
                fill: 'none',
                stroke: color,
                strokeWidth: 4,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
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
          fontSize: `${Math.max(8, height * 0.22)}px`,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          marginTop: '4px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          CONNECTING ORGANIZATIONS. RESOLVING ISSUES.
        </span>
      )}
    </div>
  </div>
);

export default Logo;
