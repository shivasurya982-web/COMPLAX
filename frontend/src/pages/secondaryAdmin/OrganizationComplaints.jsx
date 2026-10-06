import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Search, Filter, MessageSquare, User, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { formatTime12Hour } from '../../utils/formatDate';

const OrganizationComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

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

  useEffect(() => { fetchComplaints(); }, [user.organizationId]);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.locationDetails || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || c.priority?.toUpperCase() === filterPriority?.toUpperCase();
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title">Organization Complaints</h2>
        <p className="dashboard-subtitle">Manage all issues submitted by residents and users in {user.organizationName}.</p>
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
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by complaint, user or location..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
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
                <th>Complaint Details</th>
                <th>Reporter</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td style={{ maxWidth: '350px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ color: 'var(--primary)', marginTop: '4px' }}><MessageSquare size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>{c.complaint}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {c.date} {c.time ? `at ${formatTime12Hour(c.time)}` : ''}</span>
                            <span>ID: {c.complaintId}</span>
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
                        {c.locationDetails}
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
                      {c.status === 'Analyzed' && (
                        <button
                          onClick={async () => {
                            await api.put(`/complaints/${c.complaintId}/acknowledge`);
                            fetchComplaints();
                          }}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          Notice
                        </button>
                      )}
                      {c.status === 'Seen' && (
                        <div style={{ color: 'var(--low)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} /> NOTICED
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
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
    </div>
  );
};

export default OrganizationComplaints;
