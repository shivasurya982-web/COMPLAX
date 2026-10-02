import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  User,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Mail,
  Phone,
  Building2,
  Hash,
  UserCheck
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspend = async (id) => {
    try {
      await api.post('/auth/users/suspend', { userId: id });
      fetchUsers();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post('/auth/users/activate', { userId: id });
      fetchUsers();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.studentResidentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="dashboard-title">User Management</h2>
          <p className="dashboard-subtitle">Manage all registered residents and users across organizations.</p>
        </div>
        <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--primary)' }}><User size={20} /></div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Registered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{users.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, org or ID..."
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Organization</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)'
                        }}>
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Hash size={10} /> {u.studentResidentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                        <Building2 size={14} color="var(--primary)" />
                        {u.organizationName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.category}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} color="var(--text-muted)" /> {u.email}
                      </div>
                      <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} color="var(--text-muted)" /> {u.phone}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status === 'SUSPENDED' ? 'high' : 'low'}`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {u.status !== 'SUSPENDED' ? (
                          <button
                            className="btn-primary"
                            style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--medium)', border: '1px solid var(--medium)' }}
                            onClick={() => handleSuspend(u.userId)}
                            title="Suspend User"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)' }}
                            onClick={() => handleActivate(u.userId)}
                            title="Activate User"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        <button
                          className="btn-primary"
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--high)', border: '1px solid var(--high)' }}
                          onClick={() => handleDelete(u.userId)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      'Fetching users...'
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <User size={32} opacity={0.2} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>No users found</div>
                          <div style={{ fontSize: '0.9rem' }}>No resident or user accounts match your current search query.</div>
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

export default Users;
