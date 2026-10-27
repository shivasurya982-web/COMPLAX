import React from 'react';
import { Calendar, MapPin, MessageSquare } from 'lucide-react';
import { formatTime12Hour } from '../utils/formatDate';

const ComplaintCard = ({ complaint, onClick }) => {
  if (!complaint) return null;
  return (
    <div
      className="card hover-action"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1.25rem',
        borderLeft: `5px solid var(--${(complaint.priority || 'medium').toLowerCase()})`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge badge-${(complaint.priority || 'medium').toLowerCase()}`}>
            {complaint.priority}
          </span>
          <span className={`status-text status-${(complaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
            {complaint.status}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {complaint.complaintId}
        </span>
      </div>

      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', lineHeight: 1.4 }}>
        {complaint.complaint}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {complaint.locationDetails && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
            <MapPin size={13} /> {complaint.locationDetails}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Calendar size={13} /> {complaint.date} {complaint.time ? `at ${formatTime12Hour(complaint.time)}` : ''}
        </span>
      </div>
    </div>
  );
};

export default ComplaintCard;
