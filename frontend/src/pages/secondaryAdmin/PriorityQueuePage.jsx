import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AlertCircle, User, MapPin, Calendar, Clock, Layers, ShieldCheck } from 'lucide-react';

const PriorityQueuePage = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/complaints/org/${user.organizationId}/queue`);
      setQueue(response.data);
    } catch (err) {
      console.error('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, [user.organizationId]);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">Priority Queue</h2>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {queue.length > 0 ? (
            queue.map((c, index) => (
              <div
                key={c.complaintId}
                className="card animate-fade"
                style={{
                  borderLeft: `6px solid var(--${c.priority.toLowerCase()})`,
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)'
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {c.complaintId}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {c.date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {c.time}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                    {c.complaint}
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Location:</span> {c.locationDetails}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <User size={14} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>Reporter:</span> {c.userName} ({c.userPhone})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  {c.status === 'Analyzed' && (
                    <button
                      onClick={async () => {
                        await api.put(`/complaints/${c.complaintId}/acknowledge`);
                        fetchQueue();
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Notice
                    </button>
                  )}
                  {c.status === 'Seen' && (
                    <div style={{ color: 'var(--low)', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                      <ShieldCheck size={16} /> USER NOTIFIED
                    </div>
                  )}

                  {index === 0 && (
                    <div style={{
                      alignSelf: 'center',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--high)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <AlertCircle size={14} /> HIGHEST PRIORITY
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              {loading ? 'Processing Queue...' : 'No complaints currently in the priority queue.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriorityQueuePage;
