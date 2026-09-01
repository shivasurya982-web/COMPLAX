import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';

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
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Registration Successful</h2>
          <p style={{ marginBottom: '2rem' }}>
            Registration submitted successfully.<br />
            Waiting for Main Admin approval.
          </p>
          <Link to="/" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card" style={{ maxWidth: '600px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Register Your Organization</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Owner Full Name</label>
              <input type="text" name="ownerFullName" className="form-control" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Organization Name</label>
              <input type="text" name="organizationName" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <div className="responsive-grid">
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
              <label>Email</label>
              <input type="email" name="email" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" className="form-control" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" className="form-control" onChange={handleChange} required />
            </div>
          </div>
          <div className="responsive-grid">
            <div className="form-group">
              <label>Password</label>
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  style={{ paddingRight: '48px' }}
                  onChange={handleChange}
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
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-control"
                  style={{ paddingRight: '48px' }}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>CSV Dataset (Optional)</label>
            <input type="file" accept=".csv" className="form-control" onChange={handleFileChange} />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Submitting...' : 'REGISTER ORGANIZATION'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );

};

export default SecondaryAdminRegister;
