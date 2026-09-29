import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Search, Filter, Trash2, CheckCircle, MessageSquare } from 'lucide-react';

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

  const fetchComplaints = async () => {
    try {
      const response = await api.get(`/complaints/user/${user.userId}`);
      setComplaints(response.data.reverse());
    } catch (err) {
      console.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user.userId]);

  const handleDelete = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      await api.delete(`/complaints/${complaintId}`);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint');
    }
  };

  const handleResolve = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}/resolve`);
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.locationDetails || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || c.priority?.toUpperCase() === filterPriority?.toUpperCase();
    return matchesSearch && matchesPriority;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title">My Complaints</h2>
        <p className="dashboard-subtitle">Track and manage all your submitted issues.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <span className="stat-label">Total Submissions</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Pending Issues</span>
          <span className="stat-value" style={{ color: 'var(--status-pending)' }}>{stats.pending}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Resolved</span>
          <span className="stat-value" style={{ color: 'var(--status-resolved)' }}>{stats.resolved}</span>
        </div>
      </div>

      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search complaints or locations..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Description</th>
                <th>Date & Time</th>
                <th>AI Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem' }}>
                        {c.locationDetails}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>{c.complaint}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{c.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.time}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-text status-${c.status.toLowerCase().replace(' ', '-')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {c.status !== 'Resolved' && (
                          <button
                            onClick={() => handleResolve(c.complaintId)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              color: '#10B981',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <CheckCircle size={14} /> Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.complaintId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      'Fetching records...'
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <MessageSquare size={32} opacity={0.2} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>No complaints found</div>
                          <div style={{ fontSize: '0.9rem' }}>You haven't submitted any complaints that match your current filters.</div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;
