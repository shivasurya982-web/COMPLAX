import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AlertCircle, Clock, CheckCircle, ListFilter, ArrowRight, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecondaryAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    pending: 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/complaints/org/${user.organizationId}`);
        const complaints = response.data;
        setStats({
          total: complaints.length,
          high: complaints.filter(c => c.priority === 'HIGH').length,
          medium: complaints.filter(c => c.priority === 'MEDIUM').length,
          low: complaints.filter(c => c.priority === 'LOW').length,
          pending: complaints.filter(c => c.status !== 'Resolved').length,
          resolved: complaints.filter(c => c.status === 'Resolved').length
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, [user.organizationId]);

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: <ListFilter />, color: 'var(--text-main)' },
    { label: 'High Priority', value: stats.high, icon: <AlertCircle />, color: 'var(--high)' },
    { label: 'Pending', value: stats.pending, icon: <Clock />, color: 'var(--status-pending)' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle />, color: 'var(--status-resolved)' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">{user.organizationName} Admin 👋</h2>
        <p className="dashboard-subtitle">Monitor and manage complaints for your organization.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="card stat-card">
            <div style={{ color: card.color, marginBottom: '4px' }}>
              {React.cloneElement(card.icon, { size: 24 })}
            </div>
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>QUICK ACTIONS</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Common management tasks for your organization.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/secondary-admin/queue" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'var(--transition)'
              }} className="hover-action">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)' }}><AlertCircle size={20} /></div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>View Priority Queue</div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/secondary-admin/complaints" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'var(--transition)'
              }} className="hover-action">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)' }}><ListFilter size={20} /></div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Manage All Complaints</div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/secondary-admin/dataset" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'var(--transition)'
              }} className="hover-action">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--ai-accent)' }}><Database size={20} /></div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Upload Training Data</div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>PRIORITY BREAKDOWN</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span>High Priority</span>
                <span style={{ fontWeight: 700, color: 'var(--high)' }}>{stats.high}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%`,
                  background: 'var(--high)'
                }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span>Medium Priority</span>
                <span style={{ fontWeight: 700, color: 'var(--medium)' }}>{stats.medium}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%`,
                  background: 'var(--medium)'
                }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span>Low Priority</span>
                <span style={{ fontWeight: 700, color: 'var(--low)' }}>{stats.low}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${stats.total > 0 ? (stats.low / stats.total) * 100 : 0}%`,
                  background: 'var(--low)'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hover-action:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(242, 166, 117, 0.3) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};

export default SecondaryAdminDashboard;
