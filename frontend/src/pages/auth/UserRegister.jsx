import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

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
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card" style={{ maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>User Registration</h2>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" className="form-control" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Student / Resident ID</label>
              <input type="text" name="studentResidentId" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" className="form-control" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Organization</label>
            <select name="organizationId" className="form-control" onChange={handleChange} required>
              <option value="">Select Organization</option>
              {organizations.map(org => (
                <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
              ))}
            </select>
          </div>
          {selectedOrg && (
            <div className="form-group">
              <label>Category</label>
              <input type="text" className="form-control" value={selectedOrg.category} disabled />
            </div>
          )}
          <div className="responsive-grid">
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" className="form-control" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'REGISTER'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
