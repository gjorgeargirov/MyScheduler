import React from 'react';
import { X, Bell, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, notifications, onMarkAsRead, onClearAll, onDismiss }) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-600 dark:text-red-400" />;
      case 'info':
        return <Info size={18} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Info size={18} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Clear all"
              >
                <Trash2 size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-4">
                <Bell size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all ${
                  notification.read
                    ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70'
                    : `${getTypeColor(notification.type)} border-2`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Mark as read"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </button>
                    )}
                    <button
                      onClick={() => onDismiss(notification.id)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Dismiss"
                    >
                      <X size={14} className="text-slate-400 dark:text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                notifications.filter(n => !n.read).forEach(n => onMarkAsRead(n.id));
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
