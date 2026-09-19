import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'MAIN_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SECONDARY_ADMIN') {
        navigate('/secondary-admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password, requestedRole: role });
      login(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (authLoading || (isAuthenticated && user)) {
    return null;
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-fade">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '0.75rem',
            color: 'var(--primary)'
          }}>
            <Zap size={32} fill="var(--primary)" />
            <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>COMPLAX</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Smart Complaints. Right Priority.</p>
        </div>

        <div className="role-selector">
          <button
            className={`role-btn ${role === 'USER' ? 'active' : ''}`}
            onClick={() => setRole('USER')}
          >
            USER
          </button>
          <button
            className={`role-btn ${role === 'SECONDARY_ADMIN' ? 'active' : ''}`}
            onClick={() => setRole('SECONDARY_ADMIN')}
          >
            ORGANIZATION
          </button>
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
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '48px' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {role === 'USER' ? (
            <span>New user? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link></span>
          ) : (
            <span>New organization? <Link to="/register-org" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Register organization</Link></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
