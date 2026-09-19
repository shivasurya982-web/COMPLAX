import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, User, Building, Mail, Phone, MapPin, Lock, FileUp, Zap, CheckCircle } from 'lucide-react';

const SecondaryAdminRegister = () => {
  const [formData, setFormData] = useState({
    ownerFullName: '',
    organizationName: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setDataset(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (dataset) data.append('dataset', dataset);

    try {
      await api.post('/organizations/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="card auth-card animate-fade" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--low)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={64} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Registration Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Your organization details have been received.<br />
            A system administrator will review your request shortly.
          </p>
          <Link to="/" className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Return to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-fade" style={{ maxWidth: '700px' }}>
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Organization Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Set up a managed environment for your organization.</p>
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
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px'
          }}>
            Organization Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Owner Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="ownerFullName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Organization Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="organizationName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Category</label>
              <select name="category" className="form-control" onChange={handleChange} required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Location / Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="address" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '1rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px'
          }}>
            Admin Account & Data
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="phone" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
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

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              CSV Training Dataset <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional but recommended)</span>
            </label>
            <div style={{
              position: 'relative',
              border: '2px dashed var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.01)',
              transition: 'var(--transition)'
            }} className="file-upload-zone">
              <FileUp size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {dataset ? dataset.name : 'Drop your CSV here or click to browse'}
              </div>
              <input
                type="file"
                accept=".csv"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Register Organization'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Back to <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </div>
      </div>

      <style>{`
        .file-upload-zone:hover {
          border-color: var(--primary);
          background: rgba(242, 166, 117, 0.05);
        }
      `}</style>
    </div>
  );
};

export default SecondaryAdminRegister;
