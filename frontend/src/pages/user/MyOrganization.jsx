import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, ShieldCheck, MapPin, Tags } from 'lucide-react';

const MyOrganization = () => {
  const { user } = useAuth();
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgDetails = async () => {
      try {
        const response = await api.get('/organizations');
        const org = response.data.find(o => o.organizationId === user.organizationId);
        setOrgDetails(org);
      } catch (err) {
        console.error('Failed to fetch organization details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgDetails();
  }, [user.organizationId]);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title">My Organization</h2>
        <p className="dashboard-subtitle">Official details of your registered organization.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(to right, rgba(242, 166, 117, 0.1), transparent)',
          margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
          padding: '2rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Building2 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{user.organizationName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              <ShieldCheck size={16} color="var(--low)" />
              Verified Organization
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tags size={14} /> Category
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.category}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Location
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {loading ? 'Loading...' : orgDetails?.address || 'Main Campus / Building'}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '2.5rem',
          padding: '1.25rem',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--low)' }}></div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--low)' }}>
            STATUS: APPROVED & ACTIVE
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '600px' }}>
        If organization details are incorrect, please contact your organization administrator or the system administrator.
      </div>
    </div>
  );
};

export default MyOrganization;
