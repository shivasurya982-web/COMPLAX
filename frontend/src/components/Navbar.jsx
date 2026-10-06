import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Menu, Bell, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatTime12Hour } from '../utils/formatDate';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/notifications/${user.userId}`);
      const list = response.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user?.userId]);

  const handleMarkAsRead = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await api.put(`/notifications/read-all/${user.userId}`);
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark read");
      }
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete(`/notifications/clear/${user.userId}`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications");
    }
  };

  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleMarkAsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--primary)',
                color: '#14141C',
                fontSize: '10px',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #14141C'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="animate-fade" style={{
              position: 'absolute',
              top: '48px',
              right: '-10px',
              width: '340px',
              minWidth: '280px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '420px',
              overflowY: 'auto',
              zIndex: 9999,
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              boxSizing: 'border-box',
              display: 'block',
              writingMode: 'horizontal-tb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Notifications</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  )}
                  <X size={16} cursor="pointer" onClick={() => setShowNotifications(false)} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.notificationId} style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.4' }}>{n.message}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.date} at {formatTime12Hour(n.time)}</div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(n.notificationId, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition)'
                        }}
                        title="Delete notification"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {user?.fullName}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--primary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {user?.role === 'SECONDARY_ADMIN' ? 'ORGANIZATION' : user?.role.replace('_', ' ')}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)'
            }}>
              <User size={20} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
