import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const response = await api.get('/organizations');
    setRequests(response.data.filter(o => o.status === 'PENDING'));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, action) => {
    await api.post(`/organizations/${action}`, { organizationId: id });
    fetchRequests();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Organization Requests</h2>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Owner</th>
                <th>Organization</th>
                <th>Category</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.organizationId}>
                  <td>{r.ownerName}</td>
                  <td>{r.name}</td>
                  <td>{r.category}</td>
                  <td>{r.email}</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleAction(r.organizationId, 'approve')}>Approve</button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleAction(r.organizationId, 'reject')}>Reject</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No pending requests</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
