import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, User, Mail, Phone, Building, Hash, Lock, Zap } from 'lucide-react';

const UserRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    studentResidentId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizations/approved');
        setOrganizations(response.data);
      } catch (err) {
        console.error('Failed to fetch organizations');
      }
    };
    fetchOrgs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'organizationId') {
      const org = organizations.find(o => o.organizationId === value);
      setSelectedOrg(org);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/user/register', formData);
      alert('Registration successful! Please login.');
      navigate('/');
    } catch (err) {
      const serverError = err.response?.data?.error;
      setError(serverError || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-fade" style={{ maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '0.75rem',
            color: 'var(--primary)'
          }}>
            <Zap size={28} fill="var(--primary)" />
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>COMPLAX</h1>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>User Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Create your account to start reporting issues.</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="fullName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Student / Resident ID</label>
              <div style={{ position: 'relative' }}>
                <Hash size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="studentResidentId" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="phone" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Organization</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select name="organizationId" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required>
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input type="text" className="form-control" value={selectedOrg?.category || 'Auto-filled from org'} disabled />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-control"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Registering Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
