import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Building, Phone, Mail, MapPin, ShieldCheck, Save, Clock, Lock, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    userId: user.userId,
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    organizationName: user.organizationName || '',
    recoveryHint: user.recoveryHint || '',
    password: '',
    role: user.role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/auth/profile/update', formData);
      if (user.role === 'USER') {
        login(res.data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'info', text: 'Update request submitted to admin.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Account Profile</h2>
        <p className="dashboard-subtitle">Manage your personal and security information.</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(224, 109, 67, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            border: '1px solid var(--border)'
          }}>
            {user.role === 'SECONDARY_ADMIN' ? <Building size={40} /> : <User size={40} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem' }}>{user.fullName}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <ShieldCheck size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : message.type === 'info' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--low)' : message.type === 'info' ? 'var(--status-progress)' : 'var(--high)',
            border: '1px solid currentColor',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'info' ? <Clock size={18} /> : <Save size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-control" style={{ paddingLeft: '40px' }} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" style={{ paddingLeft: '40px' }} required disabled={user.role === 'SECONDARY_ADMIN'} />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" style={{ paddingLeft: '40px' }} required />
              </div>
            </div>
            {user.role === 'SECONDARY_ADMIN' && (
              <div className="form-group">
                <label>Organization Name</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} className="form-control" style={{ paddingLeft: '40px' }} required />
                </div>
              </div>
            )}
            {user.role === 'SECONDARY_ADMIN' && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Office Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-control" style={{ paddingLeft: '40px' }} required />
                </div>
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Password Recovery Hint</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="recoveryHint"
                  value={formData.recoveryHint}
                  onChange={handleChange}
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. Favorite pet, birth city, secret word"
                />
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Used to verify your identity if you ever forget your password.
              </small>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Update Password (Leave blank to keep current)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  style={{ paddingLeft: '40px', paddingRight: '45px' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : user.role === 'USER' ? 'Save Changes' : 'Request Profile Update'}
            </button>
          </div>
        </form>
      </div>

      {user.role === 'SECONDARY_ADMIN' && (
        <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          * Organization profile changes require verification by a system administrator and may take up to 24 hours.
        </div>
      )}
    </div>
  );
};

export default Profile;
