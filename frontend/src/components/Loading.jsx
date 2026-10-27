import React from 'react';

export default function Loading({ message = 'Loading records...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '1rem',
      color: 'var(--text-muted)'
    }}>
      <div className="loading-spinner"></div>
      <span style={{ fontSize: '0.9rem' }}>{message}</span>
    </div>
  );
}
