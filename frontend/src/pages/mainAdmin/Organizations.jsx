import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (err) {
      console.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post('/organizations/approve', { organizationId: id });
      fetchOrgs();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.post('/organizations/suspend', { organizationId: id });
      fetchOrgs();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post('/organizations/activate', { organizationId: id });
      fetchOrgs();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization? This will also remove the organization admin account.')) return;
    try {
      await api.delete(`/organizations/${id}`);
      fetchOrgs();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-low';
      case 'PENDING': return 'badge-medium';
      case 'SUSPENDED': return 'badge-high';
      default: return 'badge-medium';
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Organizations</h2>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.organizationId}>
                  <td>{org.name}</td>
                  <td>{org.category}</td>
                  <td>{org.ownerName}</td>
                  <td>{org.email}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(org.status)}`}>
                      {org.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {org.status === 'PENDING' && (
                        <button
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                          onClick={() => handleApprove(org.organizationId)}
                        >
                          Approve
                        </button>
                      )}
                      {org.status === 'APPROVED' && (
                        <button
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: '32px', background: 'var(--warning)' }}
                          onClick={() => handleSuspend(org.organizationId)}
                        >
                          Suspend
                        </button>
                      )}
                      {org.status === 'SUSPENDED' && (
                        <button
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: '32px', background: 'var(--low)' }}
                          onClick={() => handleActivate(org.organizationId)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="btn-primary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: '32px', background: 'var(--high)' }}
                        onClick={() => handleDelete(org.organizationId)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

};

export default Organizations;
