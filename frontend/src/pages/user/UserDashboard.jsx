import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Send, Building2, Tags, CheckCircle } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getLocationPlaceholder = () => {
    switch (user.category) {
      case 'Hostel':
      case 'College Hostel':
        return 'Room Number or Location (e.g. 302 or your location like c block)';
      case 'Apartment':
      case 'Residential Building':
        return 'Flat / Unit Number or Location (e.g. 302 or your location like c block)';
      case 'Office':
        return 'Cabin / Floor or Location (e.g. 302 or your location like c block)';
      default:
        return 'e.g. 302 or your location like c block';
    }
  };

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

  const [reporterName, setReporterName] = useState(user.fullName);
  const [reporterPhone, setReporterPhone] = useState(user.phone || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint.trim() || !locationDetails.trim() || !reporterName.trim() || !reporterPhone.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        userId: user.userId,
        userName: reporterName,
        userPhone: reporterPhone,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        category: user.category,
        locationDetails: locationDetails,
        complaint: complaint
      });
      setComplaint('');
      setLocationDetails('');
      fetchComplaints();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Welcome back, {user.fullName} 👋</h2>
        <p className="dashboard-subtitle">Here is what's happening with your complaints.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <Building2 size={20} />
            <span className="stat-label">Organization</span>
          </div>
          <span className="stat-value">{user.organizationName}</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your registered organization</p>
        </div>
        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <Tags size={20} />
            <span className="stat-label">Category</span>
          </div>
          <span className="stat-value">{user.category}</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organization type</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(224, 109, 67, 0.05) 0%, transparent 70%)',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>REPORT A NEW PROBLEM</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Describe the issue clearly. Our system will automatically analyze and assign its priority.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="responsive-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>REPORTER NAME</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your Full Name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>PHONE NUMBER</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contact Number"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>LOCATION DETAILS</label>
              <input
                type="text"
                className="form-control"
                placeholder={getLocationPlaceholder()}
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>DESCRIBE YOUR PROBLEM CORRECTLY</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describe your problem correctly..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                required
              ></textarea>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Analyzing...' : <>Submit Complaint <Send size={18} /></>}
              </button>

              {showSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--low)', fontSize: '0.875rem', fontWeight: 600 }}>
                  <CheckCircle size={18} />
                  Complaint submitted successfully!
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>RECENT HISTORY</h3>
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
                    <td style={{ fontWeight: 500, maxWidth: '400px' }}>{c.complaint}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.date}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div className="loading-spinner"></div>
                        <span>Fetching your complaint records...</span>
                      </div>
                    ) : 'No recent complaints found.'}
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
