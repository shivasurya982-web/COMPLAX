import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <div className="navbar">
      <button className="mobile-toggle" onClick={onToggleSidebar}>
        <Menu size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.fullName}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user?.role === 'SECONDARY_ADMIN' ? 'ORGANIZATION' : user?.role.replace('_', ' ')}
          </div>
        </div>
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          padding: '0.6rem',
          borderRadius: '12px',
          color: 'var(--accent)'
        }}>
          <User size={20} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
