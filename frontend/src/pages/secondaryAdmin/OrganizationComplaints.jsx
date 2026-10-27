import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Search,
  Filter,
  MessageSquare,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  Send,
  Edit3
} from 'lucide-react';
import { formatTime12Hour } from '../../utils/formatDate';

const OrganizationComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State for viewing/updating complaint
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalAssignedTo, setModalAssignedTo] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [savingModal, setSavingModal] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/complaints/org/${user.organizationId}`);
      setComplaints(response.data.reverse());
    } catch (err) {
      console.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchComplaints();
    }
  }, [user?.organizationId]);

  const openComplaintModal = (c) => {
    setSelectedComplaint(c);
    setModalStatus(c.status || 'Pending');
    setModalAssignedTo(c.assignedTo || '');
    setModalNotes(c.resolutionNotes || '');
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setSavingModal(true);
    try {
      await api.put(`/complaints/${selectedComplaint.complaintId}/status`, {
        status: modalStatus,
        assignedTo: modalAssignedTo,
        resolutionNotes: modalNotes
      });
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update complaint');
    } finally {
      setSavingModal(false);
    }
  };

  const handleQuickStatus = async (complaintId, nextStatus) => {
    try {
      await api.put(`/complaints/${complaintId}/status`, { status: nextStatus });
      fetchComplaints();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.locationDetails || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.complaintId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || c.priority?.toUpperCase() === filterPriority?.toUpperCase();
    const matchesStatus = filterStatus === 'All' || c.status?.toUpperCase() === filterStatus?.toUpperCase();
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title">Organization Complaints</h2>
        <p className="dashboard-subtitle">Manage, assign, and resolve all issues submitted for {user.organizationName}.</p>
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
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, text, user or room..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
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

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Analyzed">Analyzed</option>
              <option value="Seen">Seen</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Complaint Details</th>
                <th>Reporter</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ color: 'var(--primary)', marginTop: '4px' }}><MessageSquare size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>{c.complaint}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> {c.date} {c.time ? `at ${formatTime12Hour(c.time)}` : ''}
                            </span>
                            <span style={{ fontFamily: 'monospace' }}>ID: {c.complaintId}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          <User size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.userName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.userPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <MapPin size={14} />
                        {c.locationDetails || 'Not specified'}
                      </div>
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
                    <td>
                      <span style={{ fontSize: '0.85rem', color: c.assignedTo && c.assignedTo !== 'Unassigned' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {c.assignedTo || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => openComplaintModal(c)}
                          style={{
                            background: 'rgba(224, 109, 67, 0.1)',
                            border: '1px solid rgba(224, 109, 67, 0.25)',
                            color: 'var(--primary)',
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
                          <Edit3 size={13} /> Manage
                        </button>

                        {c.status !== 'Resolved' && (
                          <button
                            onClick={() => handleQuickStatus(c.complaintId, 'Resolved')}
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      'Fetching organization complaints...'
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <MessageSquare size={32} opacity={0.2} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>No organization records</div>
                          <div style={{ fontSize: '0.9rem' }}>There are no complaints matching your current search or filter criteria.</div>
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

      {/* Complaint Detail & Status Management Modal */}
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
            maxWidth: '620px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={`badge badge-${selectedComplaint.priority?.toLowerCase()}`}>
                  {selectedComplaint.priority} Priority
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {selectedComplaint.complaintId}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Manage Complaint</h3>
            </div>

            {/* Read-Only Info Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid var(--border)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>PROBLEM DESCRIPTION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>{selectedComplaint.complaint}</div>
              </div>

              <div className="responsive-grid" style={{ marginTop: '4px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>LOCATION</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{selectedComplaint.locationDetails || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>REPORTER</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedComplaint.userName} ({selectedComplaint.userPhone})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>SUBMITTED ON</div>
                  <div style={{ fontSize: '0.85rem' }}>{selectedComplaint.date} at {formatTime12Hour(selectedComplaint.time)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>AI CONFIDENCE</div>
                  <div style={{ fontSize: '0.85rem' }}>{Math.round((selectedComplaint.confidence || 0.85) * 100)}% Match</div>
                </div>
              </div>
            </div>

            {/* Status & Assignment Form */}
            <form onSubmit={handleSaveModal}>
              <div className="responsive-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>UPDATE STATUS</label>
                  <select
                    className="form-control"
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Seen">Seen (Acknowledged)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>ASSIGN TO STAFF / SUPERVISOR</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Electrical Staff, Dave"
                    value={modalAssignedTo}
                    onChange={(e) => setModalAssignedTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label>RESOLUTION NOTES / COMMENTS</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Record resolution details, inspection updates, or actions taken..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn-primary"
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
                <button type="submit" className="btn-primary" disabled={savingModal}>
                  {savingModal ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationComplaints;
