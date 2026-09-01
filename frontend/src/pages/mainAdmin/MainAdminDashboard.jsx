import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MainAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    pendingOrgs: 0,
    pendingDatasets: 0,
    totalCategories: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orgs, datasets, categories] = await Promise.all([
          api.get('/organizations'),
          api.get('/datasets/pending'),
          api.get('/categories')
        ]);

        setStats({
          totalOrgs: orgs.data.length,
          pendingOrgs: orgs.data.filter(o => o.status === 'PENDING').length,
          pendingDatasets: datasets.data.length,
          totalCategories: categories.data.length
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Organizations</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.totalOrgs}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Approvals</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--warning)' }}>{stats.pendingOrgs}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Dataset Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent)' }}>{stats.pendingDatasets}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Categories</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.totalCategories}</div>
        </div>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
