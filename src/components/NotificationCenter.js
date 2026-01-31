import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setDisplayNotifications(notifications.slice(0, 3));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  const handleDelete = (id) => {
    deleteNotification(id);
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'urgent': return 'notification-urgent';
      case 'high': return 'notification-high';
      case 'medium': return 'notification-medium';
      case 'low': return 'notification-low';
      default: return 'notification-medium';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      deal_created: '📊',
      deal_updated: '✏️',
      deal_closed: '🎉',
      follow_up_due: '📞',
      follow_up_completed: '✅',
      commission_earned: '💰',
      achievement_unlocked: '🏆',
      settlement_ready: '📋',
      client_profile_updated: '👤',
      team_member_added: '👥'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-center">
      {/* Notification Bell Icon */}
      <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        <button className="bell-button">
          🔔
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="close-button" 
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${getPriorityClass(notif.priority)} ${!notif.read ? 'unread' : ''}`}
                >
                  <div className="notification-icon">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  <div className="notification-actions">
                    {!notif.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(notif.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <div className="notification-toasts">
        {displayNotifications.slice(0, 3).map((notif) => (
          <div 
            key={notif.id}
            className={`notification-toast ${getPriorityClass(notif.priority)}`}
          >
            <span className="toast-icon">{getTypeIcon(notif.type)}</span>
            <span className="toast-message">{notif.message}</span>
            <button 
              className="toast-close"
              onClick={() => handleDelete(notif.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;
