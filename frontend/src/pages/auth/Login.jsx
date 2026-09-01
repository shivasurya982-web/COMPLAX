import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
      const response = await api.post('/auth/login', { email, password });
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
      <div className="glass-card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>COMPLAX</h1>
          <p className="tagline">Smart Complaints. Right Priority.</p>
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
            background: 'rgba(242, 95, 76, 0.1)',
            color: '#f25f4c',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'center',
            border: '1px solid rgba(242, 95, 76, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-container">
              <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
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
            <div className="input-container">
              <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
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
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'LOGIN'}
          </button>
        </form>

        <div className="auth-footer">
          {role === 'USER' ? (
            <span>New user? <Link to="/register">Register as User</Link></span>
          ) : (
            <span>New organization? <Link to="/register-org">Register Here</Link></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
