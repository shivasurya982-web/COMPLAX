import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OrganizationDataset = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);

  const fetchDatasetStatus = async () => {
    try {
      const response = await api.get('/datasets');
      const myRequest = response.data.find(r => r.organizationId === user.organizationId);
      setDatasetInfo(myRequest);
    } catch (err) {
      console.error('Failed to fetch dataset status');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDatasetStatus();
  }, [user.organizationId]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('dataset', file);
    formData.append('organizationId', user.organizationId);
    formData.append('organizationName', user.organizationName);
    formData.append('category', user.category);
    formData.append('ownerFullName', user.fullName);
    formData.append('email', user.email);
    formData.append('phone', user.phone || '');
    formData.append('address', user.address || '');
    formData.append('password', user.password);

    try {
      await api.post('/organizations/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Dataset uploaded successfully and waiting for approval.');
      fetchDatasetStatus();
    } catch (err) {
      setMessage('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Organization Dataset</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--accent)' }}>Upload New Dataset</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Upload a CSV file with "complaint" and "priority" columns to train your custom AI model.
          </p>
          {message && <div style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '0.9rem' }}>{message}</div>}
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Select CSV Dataset</label>
              <input type="file" accept=".csv" className="form-control" onChange={handleFileChange} required />
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? 'Uploading...' : 'UPLOAD DATASET'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Dataset Status</h3>
          {datasetInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</label>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${datasetInfo.status === 'APPROVED' ? 'badge-low' : 'badge-medium'}`}>
                    {datasetInfo.status}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>File Name</label>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{datasetInfo.datasetName}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Records</label>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{datasetInfo.rows} rows detected</div>
              </div>
              {datasetInfo.status === 'APPROVED' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(44, 182, 125, 0.1)',
                  border: '1px solid rgba(44, 182, 125, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--low)',
                  fontSize: '0.85rem'
                }}>
                  ✓ Your custom AI model is now active and prioritizing new complaints.
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {fetching ? 'Checking status...' : 'No dataset has been uploaded yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDataset;
