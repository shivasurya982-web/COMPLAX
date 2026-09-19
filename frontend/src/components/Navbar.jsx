import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Menu, Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api.get(`/notifications/${user.userId}/unread-count`),
        api.get(`/notifications/${user.userId}`)
      ]);
      setUnreadCount(countRes.data.count);
      setNotifications(listRes.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
            <div className="card animate-fade" style={{
              position: 'absolute',
              top: '40px',
              right: '0',
              width: '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000,
              padding: '1rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem' }}>Notifications</h4>
                <X size={16} cursor="pointer" onClick={() => setShowNotifications(false)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.notificationId} style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ color: 'var(--text-main)', marginBottom: '4px' }}>{n.message}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.date} at {n.time}</div>
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
