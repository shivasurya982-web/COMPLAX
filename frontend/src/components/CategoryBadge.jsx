import React from 'react';

const CategoryBadge = ({ category, label }) => {
  const text = label || category || 'General';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: 'rgba(224, 109, 67, 0.12)',
      color: 'var(--primary)',
      border: '1px solid rgba(224, 109, 67, 0.25)'
    }}>
      {text}
    </span>
  );
};

export default CategoryBadge;
