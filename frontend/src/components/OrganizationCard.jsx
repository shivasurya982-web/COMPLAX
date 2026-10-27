import React from 'react';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const OrganizationCard = ({ organization, onClick }) => {
  if (!organization) return null;
  return (
    <div
      className="card hover-action"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(224, 109, 67, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{organization.name}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{organization.category}</span>
          </div>
        </div>
        <span className={`status-text status-${(organization.status || 'pending').toLowerCase()}`}>
          {organization.status}
        </span>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={14} color="var(--text-muted)" /> {organization.email}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={14} color="var(--text-muted)" /> {organization.phone}
        </div>
        {organization.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} color="var(--text-muted)" /> {organization.address}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationCard;
