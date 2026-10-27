import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Search,
  Filter,
  Trash2,
  CheckCircle,
  MessageSquare,
  Eye,
  X,
  Calendar,
  MapPin,
  Building2,
  Clock,
  UserCheck,
  FileText
} from 'lucide-react';
import { formatTime12Hour } from '../../utils/formatDate';

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Selected complaint for viewing detail modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

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
    if (user?.userId) {
      fetchComplaints();
    }
  }, [user?.userId]);

  const handleDelete = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint record?')) return;

    try {
      await api.delete(`/complaints/${complaintId}`);
      if (selectedComplaint?.complaintId === complaintId) setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint');
    }
  };

  const handleResolve = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}/resolve`, {
        resolutionNotes: 'Confirmed resolved by resident'
      });
      if (selectedComplaint?.complaintId === complaintId) {
        setSelectedComplaint(prev => prev ? { ...prev, status: 'Resolved' } : null);
      }
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.locationDetails || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.complaintId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || c.priority?.toUpperCase() === filterPriority?.toUpperCase();
    const matchesStatus = filterStatus === 'All' || c.status?.toUpperCase() === filterStatus?.toUpperCase();
    return matchesSearch && matchesPriority && matchesStatus;
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
        <p className="dashboard-subtitle">Track, review, and manage all your submitted issues in real time.</p>
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
        {/* Search & Filter Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, description, or location..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Seen">Seen</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table */}
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
                        {c.locationDetails || 'N/A'}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '2px' }}>{c.complaint}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {c.complaintId}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{c.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime12Hour(c.time)}</div>
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                          title="View Details"
                        >
                          <Eye size={13} /> Details
                        </button>

                        {c.status !== 'Resolved' && (
                          <button
                            onClick={() => handleResolve(c.complaintId)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              color: '#10B981',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <CheckCircle size={13} /> Resolve
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(c.complaintId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#EF4444',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
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

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade" style={{
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedComplaint(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className={`badge badge-${selectedComplaint.priority?.toLowerCase()}`}>
                  {selectedComplaint.priority} Priority
                </span>
                <span className={`status-text status-${selectedComplaint.status?.toLowerCase().replace(' ', '-')}`}>
                  {selectedComplaint.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Complaint Details</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ID: {selectedComplaint.complaintId}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PROBLEM DESCRIPTION</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {selectedComplaint.complaint}
                </div>
              </div>

              <div className="responsive-grid">
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>LOCATION</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                    {selectedComplaint.locationDetails || 'N/A'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ORGANIZATION</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedComplaint.organizationName || user?.organizationName}
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>SUBMITTED AT</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {selectedComplaint.date} at {formatTime12Hour(selectedComplaint.time)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ASSIGNED STAFF</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selectedComplaint.assignedTo || 'Pending Assignment'}
                  </div>
                </div>
              </div>

              {selectedComplaint.resolutionNotes && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>
                    RESOLUTION NOTES / COMMENTS
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {selectedComplaint.resolutionNotes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {selectedComplaint.status !== 'Resolved' && (
                <button
                  onClick={() => handleResolve(selectedComplaint.complaintId)}
                  className="btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                >
                  <CheckCircle size={16} /> Mark as Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedComplaint(null)}
                className="btn-primary"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
