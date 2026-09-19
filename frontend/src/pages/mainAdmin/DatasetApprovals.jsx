import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Edit2,
  X,
  Save,
  Plus,
  Trash2,
  Globe,
  CheckCircle,
  Database,
  ArrowLeft,
  Search,
  ShieldCheck
} from 'lucide-react';

const DatasetApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // 'main' or a requestId
  const [editData, setEditData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editSearch, setEditSearch] = useState('');

  const fetchRequests = async () => {
    try {
      const response = await api.get('/datasets');
      setRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/datasets/${action}`, { requestId: id });
      fetchRequests();
    } catch (err) {
      alert('Action failed');
    }
  };

  const startEditing = async (reqId, isMain = false) => {
    setEditingId(reqId);
    setLoading(true);
    try {
      const url = isMain ? '/datasets/main/content' : `/datasets/${reqId}/content`;
      const res = await api.get(url);
      setEditData(res.data);
    } catch (err) {
      alert('Failed to load dataset content');
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (index, field, value) => {
    const newData = [...editData];
    newData[index][field] = value;
    setEditData(newData);
  };

  const addRow = () => {
    setEditData([{ complaint: '', priority: 'Medium' }, ...editData]);
    const container = document.getElementById('edit-table-container');
    if (container) container.scrollTop = 0;
  };

  const removeRow = (index) => {
    setEditData(editData.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const url = editingId === 'main' ? '/datasets/main/content' : `/datasets/${editingId}/content`;
      await api.post(url, editData);
      alert('Dataset updated successfully and ML model retrained.');
      setEditingId(null);
      fetchRequests();
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (editingId) {
    const filteredEditData = editData.filter(row =>
      (row.complaint || '').toLowerCase().includes(editSearch.toLowerCase())
    );

    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button
              onClick={() => setEditingId(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Back to Datasets
            </button>
            <h2 className="dashboard-title" style={{ margin: 0 }}>
              {editingId === 'main' ? 'Global Dataset' : 'Organization Dataset'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={addRow} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)' }}>
              <Plus size={18} /> Add Entry
            </button>
            <button className="btn-primary" onClick={saveChanges} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Training...' : 'Save & Retrain'}
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search in dataset..."
              style={{ paddingLeft: '40px' }}
              value={editSearch}
              onChange={(e) => setEditSearch(e.target.value)}
            />
          </div>

          <div id="edit-table-container" className="table-container" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Complaint Description</th>
                  <th style={{ width: '200px' }}>Assigned Priority</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEditData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td>
                      <textarea
                        className="form-control"
                        style={{ height: 'auto', minHeight: '40px', padding: '8px', fontSize: '0.9rem' }}
                        value={row.complaint}
                        onChange={(e) => handleEditChange(idx, 'complaint', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.priority.toUpperCase()}
                        onChange={(e) => handleEditChange(idx, 'priority', e.target.value)}
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => removeRow(idx)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--high)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const approvedDatasets = requests.filter(r => r.status === 'APPROVED');

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Dataset Management</h2>
        <p className="dashboard-subtitle">Manage the data used to train the TF-IDF and Decision Tree models.</p>
      </div>

      {/* Global Dataset */}
      <div className="card" style={{ marginBottom: '3rem', borderLeft: '6px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(242, 166, 117, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Globe size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>Global Main Dataset</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Trains the default system-wide AI model.</div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => startEditing('main', true)}>
            <Edit2 size={16} /> Edit Data Pool
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Pending Requests */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-pending)', marginBottom: '1.5rem' }}>
            <Database size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Queue</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Samples</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((r) => (
                    <tr key={r.requestId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.organizationName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.datasetName}</div>
                      </td>
                      <td>{r.rows}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="btn-primary" style={{ padding: '8px' }} onClick={() => startEditing(r.requestId)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '8px', background: 'var(--low)' }} onClick={() => handleAction(r.requestId, 'approve')} title="Approve">
                            <CheckCircle size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '8px', background: 'var(--high)' }} onClick={() => handleAction(r.requestId, 'reject')} title="Reject">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No pending requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approved Models */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--low)', marginBottom: '1.5rem' }}>
            <ShieldCheck size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Models</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {approvedDatasets.length > 0 ? (
                  approvedDatasets.map((r) => (
                    <tr key={r.requestId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.organizationName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {r.organizationId}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--low)', fontSize: '0.75rem', fontWeight: 700 }}>
                          <CheckCircle size={14} /> ACTIVE
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-primary" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => startEditing(r.requestId)}>
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active custom models</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetApprovals;
