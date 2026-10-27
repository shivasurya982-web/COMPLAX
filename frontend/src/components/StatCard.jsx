import React from 'react';

const StatCard = ({ title, value, icon, color = 'var(--primary)', subtitle = '' }) => {
  return (
    <div className="card stat-card">
      {icon && (
        <div style={{ color, marginBottom: '4px' }}>
          {icon}
        </div>
      )}
      <span className="stat-label">{title}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
      {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
    </div>
  );
};

export default StatCard;
