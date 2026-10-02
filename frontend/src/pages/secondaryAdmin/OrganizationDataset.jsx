import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Database, FileUp, Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';

const OrganizationDataset = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);
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
    setMessage(null);
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
      setMessage({ type: 'success', text: 'Dataset uploaded successfully! Waiting for admin approval.' });
      setFile(null);
      fetchDatasetStatus();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload dataset. Please check the file format.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Organization Dataset</h2>
        <p className="dashboard-subtitle">Train your organization-specific AI model with custom data.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '1rem' }}>
            <FileUp size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Model Training</h3>
          </div>

          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Upload a CSV file containing <strong>"complaint"</strong> and <strong>"priority"</strong> columns.
            This data will be used to fine-tune the TF-IDF vectorizer and Decision Tree classifier for your specific needs.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '12px'
          }}>
            <Info size={20} color="var(--ai-accent)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Example CSV format:<br />
              <code style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary)' }}>
                complaint,priority<br />
                "No water in Block A","HIGH"<br />
                "Lights flickering","MEDIUM"
              </code>
            </div>
          </div>

          {message && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? 'var(--low)' : 'var(--high)',
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload} style={{ marginTop: 'auto' }}>
            <div className="form-group">
              <div style={{
                position: 'relative',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }} className="file-dropzone">
                <Database size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {file ? file.name : 'Select CSV Dataset'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supported format: .csv
                </div>
                <input
                  type="file"
                  accept=".csv"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !file}>
              {loading ? 'Processing Dataset...' : 'Initiate Model Training'}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '2rem' }}>
            <Sparkles size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dataset Status</h3>
          </div>

          {datasetInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Status</span>
                <span className={`badge ${datasetInfo.status === 'APPROVED' ? 'badge-low' : 'badge-medium'}`}>
                  {datasetInfo.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>File Source</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{datasetInfo.datasetName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Training Samples</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{datasetInfo.rows} Records</span>
              </div>

              {datasetInfo.status === 'APPROVED' ? (
                <div style={{
                  marginTop: '1rem',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{ color: 'var(--low)' }}><CheckCircle size={24} /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--low)', marginBottom: '4px' }}>Custom Model Active</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Priority predictions are now utilizing your organization's custom trained Decision Tree model.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  marginTop: '1rem',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{ color: 'var(--medium)' }}><Clock size={24} /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--medium)', marginBottom: '4px' }}>Approval Pending</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Your dataset is being validated by the system administrator. The default model will be used until approval.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Database size={30} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {fetching ? 'Syncing dataset status...' : 'No custom dataset found for your organization.'}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .file-dropzone:hover {
          border-color: var(--primary);
          background: rgba(224, 109, 67, 0.04) !important;
        }
      `}</style>
    </div>
  );
};

export default OrganizationDataset;
