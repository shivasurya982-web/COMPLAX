import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Users, Search, UserCheck, UserX, Trash2, Building, ShieldCheck, Mail, Phone, Hash } from 'lucide-react';

const MyOrganization = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const orgId = user?.organizationId || user?.userId;

  const fetchUsers = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await api.get(`/organizations/${orgId}/users`);
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch organization users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [orgId]);

  const handleSuspend = async (userId) => {
    try {
      await api.post('/organizations/users/suspend', { userId, organizationId: orgId });
      setStatusMessage({ type: 'info', text: 'User access suspended successfully.' });
      fetchUsers();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to suspend user.' });
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.post('/organizations/users/activate', { userId, organizationId: orgId });
      setStatusMessage({ type: 'success', text: 'User access activated successfully.' });
      fetchUsers();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to activate user.' });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from your organization?')) return;
    try {
      await api.delete(`/organizations/users/${userId}`);
      setStatusMessage({ type: 'success', text: 'User removed successfully.' });
      fetchUsers();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to remove user.' });
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.studentResidentId?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = usersList.filter(u => u.status === 'ACTIVE').length;
  const suspendedCount = usersList.filter(u => u.status === 'SUSPENDED').length;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title">Organization Users</h2>
        <p className="dashboard-subtitle">Manage user accounts and login access for {user?.organizationName || 'your organization'}.</p>
      </div>

      {statusMessage && (
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: statusMessage.type === 'success' ? 'var(--low)' : 'var(--high)',
          border: '1px solid currentColor',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Stats row */}
      <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{usersList.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Organization Users</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)' }}>
            <UserCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{activeCount}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Accounts</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--high)' }}>
            <UserX size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{suspendedCount}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Suspended Accounts</div>
          </div>
        </div>
      </div>

      {/* Search and User List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registered Users</h3>
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '40px', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {search ? 'No users match your search criteria.' : 'No users have registered under your organization yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>User Details</th>
                  <th style={{ padding: '12px 16px' }}>Resident/Student ID</th>
                  <th style={{ padding: '12px 16px' }}>Contact</th>
                  <th style={{ padding: '12px 16px' }}>Access Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.fullName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {u.email}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={14} color="var(--primary)" /> {u.studentResidentId || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> {u.phone || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.status === 'SUSPENDED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: u.status === 'SUSPENDED' ? 'var(--high)' : 'var(--low)',
                        border: '1px solid currentColor'
                      }}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {u.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleActivate(u.userId)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--low)', borderColor: 'rgba(16,185,129,0.3)' }}
                          >
                            Activate Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(u.userId)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--high)', borderColor: 'rgba(239,68,68,0.3)' }}
                          >
                            Suspend Access
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.userId)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                          title="Remove User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrganization;
