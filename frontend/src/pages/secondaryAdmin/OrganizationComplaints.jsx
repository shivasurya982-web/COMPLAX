import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OrganizationComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);

  const fetchComplaints = async () => {
    const response = await api.get(`/complaints/org/${user.organizationId}`);
    setComplaints(response.data.reverse());
  };

  useEffect(() => { fetchComplaints(); }, [user.organizationId]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Organization Complaints</h2>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Location</th>
                <th>Complaint</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaintId}>
                  <td style={{ fontSize: '0.75rem' }}>{c.complaintId}</td>
                  <td>{c.userName}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{c.locationDetails}</td>
                  <td>{c.complaint}</td>
                  <td>
                    <span className={`badge badge-${c.priority.toLowerCase()}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td>{c.status}</td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizationComplaints;
