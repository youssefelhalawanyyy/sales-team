import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, TrendingUp } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationsPanel = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      'deal': '🤝',
      'task': '✅',
      'commission': '💰',
      'user': '👤',
      'system': '⚙️'
    };
    return icons[type] || '📢';
  };

  const getNotificationBgColor = (type, isRead) => {
    const colors = {
      'deal': isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-blue-100 border-l-4 border-l-blue-600',
      'task': isRead ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-green-100 border-l-4 border-l-green-600',
      'commission': isRead ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : 'bg-yellow-100 border-l-4 border-l-yellow-600',
      'user': isRead ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'bg-purple-100 border-l-4 border-l-purple-600',
      'system': isRead ? 'bg-gray-50 border-l-4 border-l-gray-500' : 'bg-gray-100 border-l-4 border-l-gray-600'
    };
    return colors[type] || 'bg-gray-50 border-l-4 border-l-gray-500';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'deal': 'Deal',
      'task': 'Task',
      'commission': 'Commission',
      'user': 'User',
      'system': 'System'
    };
    return labels[type] || 'Notification';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications (Ctrl+Shift+N)"
      >
        <Bell size={20} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 animate-slideDown overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bell size={20} />
                  Notifications
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {unreadCount === 0 ? 'All caught up!' : `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 shadow-md hover:shadow-lg"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="bg-blue-50 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Bell size={32} className="text-blue-600 dark:text-blue-400 opacity-60" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Check back later for updates</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`${getNotificationBgColor(notif.type, notif.read)} px-6 py-4 hover:opacity-80 transition-all cursor-pointer group`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-gray-900 dark:text-white truncate ${!notif.read ? 'font-bold' : ''}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="flex-shrink-0 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                            notif.type === 'deal' && 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            || notif.type === 'task' && 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                            || notif.type === 'commission' && 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            || 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notif.createdAt).toLocaleString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {!notif.read && (
                            <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="flex-shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <X size={16} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
              <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
