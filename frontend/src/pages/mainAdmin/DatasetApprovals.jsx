import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit2, X, Save, Plus, Trash2, Globe } from 'lucide-react';

const DatasetApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // 'main' or a requestId
  const [editData, setEditData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
    // Add to the START of the list so it is immediately visible
    setEditData([{ complaint: '', priority: 'Medium' }, ...editData]);
    // Scroll table to top
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
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>
              {editingId === 'main' ? 'Editing Global Main Dataset' : 'Editing Organization Dataset'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Note: Added rows appear at the top.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={addRow} style={{ background: 'var(--low)', display: 'flex', gap: '8px' }}>
              <Plus size={18} /> Add Row
            </button>
            <button className="btn-primary" onClick={saveChanges} disabled={isSaving} style={{ display: 'flex', gap: '8px' }}>
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn-primary" onClick={() => setEditingId(null)} style={{ background: 'var(--secondary)', display: 'flex', gap: '8px' }}>
              <X size={18} /> Cancel
            </button>
          </div>
        </div>

        <div className="card">
          <div id="edit-table-container" className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th style={{ width: '65%' }}>Complaint Text</th>
                  <th style={{ width: '20%' }}>Priority</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {editData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td>
                      <textarea
                        className="form-control"
                        style={{ background: 'rgba(0,0,0,0.2)', height: 'auto', minHeight: '40px', padding: '8px' }}
                        value={row.complaint}
                        onChange={(e) => handleEditChange(idx, 'complaint', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                        value={row.priority}
                        onChange={(e) => handleEditChange(idx, 'priority', e.target.value)}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--high)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
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
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Dataset Management</h2>

      {/* Main Global Dataset Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={20} /> GLOBAL MAIN DATASET
        </h3>
        <div className="card" style={{ background: 'linear-gradient(to right, rgba(127, 90, 240, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>complaint_priority_dataset.csv</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Location: COMPLAX/dataset/ | This dataset trains the default ML model.
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '0 24px', background: 'var(--primary)' }}
              onClick={() => startEditing('main', true)}
            >
              <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Main Dataset
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--accent)' }}>PENDING REQUESTS</h3>
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Dataset File</th>
                  <th>Rows</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r) => (
                  <tr key={r.requestId}>
                    <td>{r.organizationName}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.datasetName}</td>
                    <td>{r.rows}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '0 12px', height: '32px', fontSize: '0.75rem', background: 'var(--primary-light)' }}
                          onClick={() => startEditing(r.requestId)}
                        >
                          <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: '0 12px', height: '32px', fontSize: '0.75rem' }}
                          onClick={() => handleAction(r.requestId, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: '0 12px', height: '32px', fontSize: '0.75rem', background: 'var(--high)' }}
                          onClick={() => handleAction(r.requestId, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No pending dataset requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--low)' }}>APPROVED DATASETS</h3>
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Dataset ID</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedDatasets.map((r) => (
                  <tr key={r.requestId}>
                    <td>{r.organizationName}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.organizationId}.csv</td>
                    <td>{r.rows}</td>
                    <td>
                      <span className="badge badge-low">Active Model</span>
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: '0 12px', height: '32px', fontSize: '0.75rem', background: 'var(--primary-light)' }}
                        onClick={() => startEditing(r.requestId)}
                      >
                        <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit Content
                      </button>
                    </td>
                  </tr>
                ))}
                {approvedDatasets.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No approved datasets found.
                    </td>
                  </tr>
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
