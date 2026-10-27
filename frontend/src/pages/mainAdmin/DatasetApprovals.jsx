import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  Download,
  FileText,
  Info
} from 'lucide-react';
import { downloadDatasetCSV, downloadDatasetCSVDirect, downloadDatasetPDF } from '../../utils/exportDataset';

const DatasetApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // 'main' or a requestId
  const [editData, setEditData] = useState([]);
  const [totalDatasetRows, setTotalDatasetRows] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [editSearch, setEditSearch] = useState('');

  // Pagination state for dataset editor
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
    setCurrentPage(1);
    setEditSearch('');
    try {
      const url = isMain
        ? '/datasets/main/content?limit=2000&stats=true'
        : `/datasets/${reqId}/content?limit=2000&stats=true`;
      const res = await api.get(url);
      const rows = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const total = res.data?.totalRows || rows.length;
      setEditData(rows);
      setTotalDatasetRows(total);
    } catch (err) {
      alert('Failed to load dataset content');
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDataset = async (reqId, isMain = false, type = 'csv') => {
    const title = isMain ? 'Global Main Dataset' : `Organization Dataset (${reqId})`;
    const filename = isMain ? 'global_main_dataset.csv' : `dataset_${reqId}.csv`;

    if (type === 'csv') {
      await downloadDatasetCSVDirect(api, reqId, isMain, filename);
    } else {
      try {
        const url = isMain
          ? '/datasets/main/content?limit=1000&stats=true'
          : `/datasets/${reqId}/content?limit=1000&stats=true`;
        const res = await api.get(url);
        const rows = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const stats = res.data?.stats || null;
        downloadDatasetPDF(rows, title, stats);
      } catch (err) {
        alert('Failed to download dataset report.');
      }
    }
  };

  const addRow = () => {
    setEditData(prev => [{ complaint: '', priority: 'Medium' }, ...prev]);
    setCurrentPage(1);
    const container = document.getElementById('edit-table-container');
    if (container) container.scrollTop = 0;
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

  const filteredEditData = useMemo(() => {
    if (!editSearch.trim()) return editData;
    const searchLower = editSearch.toLowerCase();
    return editData.filter(row =>
      (row.complaint || '').toLowerCase().includes(searchLower)
    );
  }, [editData, editSearch]);

  if (editingId) {
    const totalFiltered = filteredEditData.length;
    const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (validCurrentPage - 1) * pageSize;
    const pageRows = filteredEditData.slice(startIndex, startIndex + pageSize);

    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              onClick={() => setEditingId(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Back to Datasets
            </button>
            <h2 className="dashboard-title" style={{ margin: 0 }}>
              {editingId === 'main' ? 'Global Dataset' : 'Organization Dataset'}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '12px' }}>
                ({totalDatasetRows.toLocaleString()} total entries)
              </span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => handleDownloadDataset(editingId, editingId === 'main', 'csv')}
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
              title="Export dataset as CSV file"
            >
              <Download size={16} /> CSV
            </button>
            <button
              className="btn-primary"
              onClick={() => handleDownloadDataset(editingId, editingId === 'main', 'pdf')}
              style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
              title="Export dataset report as PDF document"
            >
              <FileText size={16} /> PDF
            </button>
            <button className="btn-primary" onClick={addRow} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--low)', border: '1px solid var(--low)' }}>
              <Plus size={18} /> Add Entry
            </button>
            <button className="btn-primary" onClick={saveChanges} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Training...' : 'Save & Retrain'}
            </button>
          </div>
        </div>

        {totalDatasetRows > editData.length && (
          <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', color: '#60A5FA', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>Displaying first <strong>{editData.length.toLocaleString()}</strong> records in interactive editor (out of <strong>{totalDatasetRows.toLocaleString()}</strong> total records). Download the CSV file to view or export all records.</span>
          </div>
        )}

        <div className="card">
          <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search in dataset..."
              style={{ paddingLeft: '40px' }}
              value={editSearch}
              onChange={(e) => {
                setEditSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div id="edit-table-container" className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
                {pageRows.length > 0 ? (
                  pageRows.map((row, idx) => {
                    const globalIndex = startIndex + idx;
                    return (
                      <tr key={globalIndex}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{globalIndex + 1}</td>
                        <td>
                          <textarea
                            className="form-control"
                            style={{ height: 'auto', minHeight: '40px', padding: '8px', fontSize: '0.9rem' }}
                            value={row.complaint || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditData(prev => {
                                const copy = [...prev];
                                copy[globalIndex] = { ...copy[globalIndex], complaint: val };
                                return copy;
                              });
                            }}
                          />
                        </td>
                        <td>
                          <select
                            className="form-control"
                            value={(row.priority || 'MEDIUM').toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditData(prev => {
                                const copy = [...prev];
                                copy[globalIndex] = { ...copy[globalIndex], priority: val };
                                return copy;
                              });
                            }}
                          >
                            <option value="HIGH">HIGH</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="LOW">LOW</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setEditData(prev => prev.filter((_, i) => i !== globalIndex));
                            }}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--high)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                            title="Remove entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No dataset records found matching "{editSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{totalFiltered > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong>{Math.min(startIndex + pageSize, totalFiltered)}</strong> of{' '}
              <strong>{totalFiltered.toLocaleString()}</strong> entries
              {editData.length !== totalFiltered && (
                <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>
                  (filtered from {editData.length.toLocaleString()} total)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Rows per page:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', opacity: validCurrentPage === 1 ? 0.4 : 1 }}
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', opacity: validCurrentPage === 1 ? 0.4 : 1 }}
                >
                  Prev
                </button>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
                  Page <strong>{validCurrentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', opacity: validCurrentPage >= totalPages ? 0.4 : 1 }}
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', opacity: validCurrentPage >= totalPages ? 0.4 : 1 }}
                >
                  Last
                </button>
              </div>
            </div>
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

      {/* Global Dataset Card with CSV and PDF Download buttons */}
      <div className="card" style={{ marginBottom: '3rem', borderLeft: '6px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(224, 109, 67, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Globe size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>Global Main Dataset</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Trains the default system-wide AI model.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => handleDownloadDataset('main', true, 'csv')}
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
              title="Download Global Dataset as CSV file"
            >
              <Download size={16} /> Download CSV
            </button>
            <button
              className="btn-primary"
              onClick={() => handleDownloadDataset('main', true, 'pdf')}
              style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
              title="Download Global Dataset report as PDF file"
            >
              <FileText size={16} /> Download PDF
            </button>
            <button className="btn-primary" onClick={() => startEditing('main', true)}>
              <Edit2 size={16} /> Edit Data Pool
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '2rem' }}>
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
                      <td>{r.rows?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={() => handleDownloadDataset(r.requestId, false, 'csv')} title="Download CSV">
                            <Download size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid rgba(168, 85, 247, 0.3)' }} onClick={() => handleDownloadDataset(r.requestId, false, 'pdf')} title="Download PDF">
                            <FileText size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px' }} onClick={() => startEditing(r.requestId)} title="Edit / View">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'var(--low)' }} onClick={() => handleAction(r.requestId, 'approve')} title="Approve">
                            <CheckCircle size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'var(--high)' }} onClick={() => handleAction(r.requestId, 'reject')} title="Reject">
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={() => handleDownloadDataset(r.requestId, false, 'csv')} title="Download CSV">
                            <Download size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid rgba(168, 85, 247, 0.3)' }} onClick={() => handleDownloadDataset(r.requestId, false, 'pdf')} title="Download PDF">
                            <FileText size={14} />
                          </button>
                          <button className="btn-primary" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => startEditing(r.requestId)} title="Edit / View">
                            <Edit2 size={14} />
                          </button>
                        </div>
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