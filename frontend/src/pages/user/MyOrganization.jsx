import React from 'react';
import { useAuth } from '../../context/AuthContext';

const MyOrganization = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>My Organization</h2>
      <div className="card" style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Organization Name</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.organizationName}</div>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Category</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.category}</div>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status</label>
          <div>
            <span className="badge badge-low" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
              Approved & Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrganization;
