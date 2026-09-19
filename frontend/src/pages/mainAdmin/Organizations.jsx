import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Tags
} from 'lucide-react';

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);

  const fetchOrgs = async () => {
    setLoading(true);
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
      if (selectedOrg?.organizationId === id) setSelectedOrg(null);
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.post('/organizations/suspend', { organizationId: id });
      fetchOrgs();
      if (selectedOrg?.organizationId === id) setSelectedOrg(null);
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post('/organizations/activate', { organizationId: id });
      fetchOrgs();
      if (selectedOrg?.organizationId === id) setSelectedOrg(null);
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization? This will also remove the organization admin account.')) return;
    try {
      await api.delete(`/organizations/${id}`);
      fetchOrgs();
      if (selectedOrg?.organizationId === id) setSelectedOrg(null);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Organizations</h2>
        <p className="dashboard-subtitle">Monitor and manage all registered organizations on the platform.</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search organizations, owners, or email..."
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org.organizationId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(242, 166, 117, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{org.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{org.category}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{org.ownerName}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{org.email}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${org.status === 'APPROVED' ? 'low' : org.status === 'PENDING' ? 'medium' : 'high'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                          onClick={() => setSelectedOrg(org)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                          <button
                            className="btn-primary"
                            style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)' }}
                            onClick={() => handleApprove(org.organizationId)}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>

                        {org.status === 'APPROVED' && (
                          <button
                            className="btn-primary"
                            style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--medium)', border: '1px solid var(--medium)' }}
                            onClick={() => handleSuspend(org.organizationId)}
                            title="Suspend"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        )}

                        {org.status === 'SUSPENDED' && (
                          <button
                            className="btn-primary"
                            style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)' }}
                            onClick={() => handleActivate(org.organizationId)}
                            title="Activate"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}

                        <button
                          className="btn-primary"
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--high)', border: '1px solid var(--high)' }}
                          onClick={() => handleDelete(org.organizationId)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Fetching records...' : 'No organizations found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem'
        }} onClick={() => setSelectedOrg(null)}>
          <div className="card animate-fade" style={{ width: '100%', maxWidth: '600px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setSelectedOrg(null)}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(242, 166, 117, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Building2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem' }}>{selectedOrg.name}</h3>
              </div>
              <span className={`badge badge-${selectedOrg.status === 'APPROVED' ? 'low' : selectedOrg.status === 'PENDING' ? 'medium' : 'high'}`}>
                {selectedOrg.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <DetailItem label="Owner Name" value={selectedOrg.ownerName} icon={<User size={14} />} />
                <DetailItem label="Category" value={selectedOrg.category} icon={<Tags size={14} />} />
                <DetailItem label="Email Address" value={selectedOrg.email} icon={<Mail size={14} />} />
              </div>
              <div>
                <DetailItem label="Phone Number" value={selectedOrg.phone || 'Not provided'} icon={<Phone size={14} />} />
                <DetailItem label="Office Address" value={selectedOrg.address || 'Not provided'} icon={<MapPin size={14} />} />
                <DetailItem label="Registration ID" value={selectedOrg.organizationId} icon={<ShieldCheck size={14} />} />
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
              {selectedOrg.status === 'PENDING' && (
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleApprove(selectedOrg.organizationId)}>
                  Approve Organization
                </button>
              )}
              {selectedOrg.status === 'APPROVED' && (
                <button className="btn-primary" style={{ flex: 1, background: 'var(--warning)' }} onClick={() => handleSuspend(selectedOrg.organizationId)}>
                  Suspend
                </button>
              )}
              <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setSelectedOrg(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <div style={{
      color: 'var(--text-muted)',
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{value}</div>
  </div>
);

export default Organizations;
