import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, Building, Check, X, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

const AdminRequests = () => {
  const [orgRequests, setOrgRequests] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orgRes, profileRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/auth/profile/requests')
      ]);
      setOrgRequests(orgRes.data.filter(o => o.status === 'PENDING'));
      setProfileRequests(profileRes.data);
    } catch (err) {
      console.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOrgAction = async (id, action) => {
    try {
      await api.post(`/organizations/${action}`, { organizationId: id });
      fetchData();
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleProfileApprove = async (requestId) => {
    try {
      await api.post('/auth/profile/requests/approve', { requestId });
      fetchData();
    } catch (err) {
      alert("Approve failed");
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Pending Requests</h2>
        <p className="dashboard-subtitle">Review and approve new organizations or profile update submissions.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {/* Organization Registration Requests */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <Building size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Registrations ({orgRequests.length})</h3>
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Organization / Category</th>
                    <th>Owner Details</th>
                    <th>Email Address</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgRequests.length > 0 ? (
                    orgRequests.map((r) => (
                      <tr key={r.organizationId}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.category}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem' }}>{r.ownerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {r.organizationId}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.email}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                              className="btn-primary"
                              style={{ padding: '8px 16px', background: 'var(--low)', fontSize: '0.8rem' }}
                              onClick={() => handleOrgAction(r.organizationId, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-primary"
                              style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--high)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem' }}
                              onClick={() => handleOrgAction(r.organizationId, 'reject')}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No pending registrations</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Profile Update Requests */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ai-accent)', marginBottom: '1.5rem' }}>
            <UserCheck size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Update Requests ({profileRequests.length})</h3>
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Requested Changes</th>
                    <th>Contact Info</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profileRequests.length > 0 ? (
                    profileRequests.map((r) => (
                      <tr key={r.requestId}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.organizationName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REQ: {r.requestId.split('-')[0]}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                              <ShieldCheck size={12} color="var(--primary)" />
                              <span style={{ color: 'var(--text-secondary)' }}>Owner:</span> {r.ownerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                              <MapPin size={12} color="var(--primary)" />
                              <span style={{ color: 'var(--text-secondary)' }}>Address:</span> {r.address}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} color="var(--text-muted)" /> {r.email}
                          </div>
                          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} color="var(--text-muted)" /> {r.phone}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '8px 20px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)', fontSize: '0.8rem' }}
                            onClick={() => handleProfileApprove(r.requestId)}
                          >
                            Approve Changes
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No pending profile updates</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
