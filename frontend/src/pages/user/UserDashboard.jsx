import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Send } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/complaints/user/${user.userId}`);
      setRecentComplaints(response.data.slice(-5).reverse());
    } catch (err) {
      console.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        userId: user.userId,
        userName: user.fullName,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        category: user.category,
        complaint: complaint
      });
      setComplaint('');
      fetchComplaints();
      alert('Complaint submitted successfully!');
    } catch (err) {
      alert('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome back, {user.fullName}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Here is what's happening with your complaints at {user.organizationName}.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Organization</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{user.organizationName}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Category</span>
          <span className="stat-value">{user.category}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2.5rem', background: 'linear-gradient(to bottom right, #16161a, #1e1b2e)' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent)' }}>REPORT A NEW PROBLEM</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              className="form-control"
              rows="4"
              style={{ background: 'rgba(0,0,0,0.2)' }}
              placeholder="Describe your issue in detail. Our AI will prioritize it automatically..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={submitting}>
            {submitting ? 'Analyzing...' : <>Submit Complaint <Send size={18} /></>}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Recent History</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Complaint Description</th>
                <th>Date Submitted</th>
                <th>AI Priority</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.length > 0 ? (
                recentComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td style={{ fontWeight: 500 }}>{c.complaint}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.date}</td>
                    <td>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: c.status === 'Resolved' ? 'var(--low)' : 'var(--accent)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Fetching records...' : 'No recent complaints found.'}
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

export default UserDashboard;
