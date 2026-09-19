import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, UserCheck, Database, Tags, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const statItems = [
    { label: 'Total Organizations', value: stats.totalOrgs, icon: <Building2 />, color: 'var(--primary)', link: '/admin/organizations' },
    { label: 'Pending Approvals', value: stats.pendingOrgs, icon: <UserCheck />, color: 'var(--status-pending)', link: '/admin/requests' },
    { label: 'Dataset Requests', value: stats.pendingDatasets, icon: <Database />, color: 'var(--ai-accent)', link: '/admin/datasets' },
    { label: 'Categories', value: stats.totalCategories, icon: <Tags />, color: 'var(--text-main)', link: '/admin/categories' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">System Overview 👋</h2>
        <p className="dashboard-subtitle">Manage organizations, datasets and global configurations.</p>
      </div>

      <div className="stats-grid">
        {statItems.map((item, idx) => (
          <Link key={idx} to={item.link} style={{ textDecoration: 'none' }}>
            <div className="card stat-card" style={{ cursor: 'pointer', position: 'relative' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
                marginBottom: '8px'
              }}>
                {item.icon}
              </div>
              <span className="stat-label">{item.label}</span>
              <span className="stat-value">{item.value}</span>
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}>
                <ArrowUpRight size={18} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>SYSTEM STATUS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>API Server</span>
              <span className="badge badge-low">Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>ML Model Service</span>
              <span className="badge badge-low">Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>Database Connection</span>
              <span className="badge badge-low">Stable</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(242, 166, 117, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Database size={30} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Global Training Data</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
              The system is currently using the global seed dataset for priority predictions.
            </p>
          </div>
          <Link to="/admin/datasets" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Manage Datasets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
