import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
          high: complaints.filter(c => c.priority === 'High').length,
          medium: complaints.filter(c => c.priority === 'Medium').length,
          low: complaints.filter(c => c.priority === 'Low').length,
          pending: complaints.filter(c => c.status !== 'Resolved').length,
          resolved: complaints.filter(c => c.status === 'Resolved').length
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, [user.organizationId]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Organization Dashboard</h2>
      <div className="stats-grid">
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Complaints</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>High Priority</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--danger)' }}>{stats.high}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--warning)' }}>{stats.pending}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Resolved</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--success)' }}>{stats.resolved}</div>
        </div>
      </div>
    </div>
  );
};

export default SecondaryAdminDashboard;
