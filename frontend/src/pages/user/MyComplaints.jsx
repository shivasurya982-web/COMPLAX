import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const response = await api.get(`/complaints/user/${user.userId}`);
      setComplaints(response.data.reverse());
    } catch (err) {
      console.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user.userId]);

  const handleDelete = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this resolved complaint?')) return;

    try {
      await api.delete(`/complaints/${complaintId}`);
      alert('Complaint deleted successfully');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint');
    }
  };

  const handleResolve = async (complaintId) => {
    try {
      await api.put(`/complaints/${complaintId}/resolve`);
      alert('Complaint marked as resolved!');
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>My Complaints</h2>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Complaint</th>
                <th>Date</th>
                <th>Time</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td style={{ fontSize: '0.75rem' }}>{c.complaintId}</td>
                    <td>{c.complaint}</td>
                    <td>{c.date}</td>
                    <td>{c.time}</td>
                    <td>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>{c.status}</td>
                    <td>
                      {c.status !== 'Resolved' ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleResolve(c.complaintId)}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(c.complaintId)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading...' : 'No complaints found.'}
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

export default MyComplaints;
