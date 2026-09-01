import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PriorityQueuePage = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    const response = await api.get(`/complaints/org/${user.organizationId}/queue`);
    setQueue(response.data);
  };

  useEffect(() => { fetchQueue(); }, [user.organizationId]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Priority Queue (DSA Implementation)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {queue.length > 0 ? (
          queue.map((c) => (
            <div key={c.complaintId} className="card" style={{ borderLeft: `6px solid var(--${c.priority.toLowerCase()})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{c.complaintId}</span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>{c.complaint}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    User: {c.userName} | Date: {c.date} | Time: {c.time}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>No complaints in priority queue.</div>
        )}
      </div>
    </div>
  );
};

export default PriorityQueuePage;
