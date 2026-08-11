import React, { useState, useEffect } from 'react';
import { NotificationSkeleton, StatCardSkeleton } from '../../../Component/Common/Skeletons/Skeletons';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaTrash,
  FaCheck,
  FaFilter,
  FaClock
} from 'react-icons/fa';
import './notification.css';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  deleteNotification 
} from '../../../firebase/firestore';
import { toast } from 'react-toastify';

const Notification = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState([]);
const loadNotifications = async () => {
  if (!currentUser) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    const result = await getUserNotifications(currentUser.uid);
    
    if (result.success) {
      setNotifications(result.notifications);
    } else {
      toast.error('Failed to load notifications.');
    }
  } catch (error) {
    toast.error('Failed to load notifications.');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadNotifications();
}, [currentUser]);
  if (loading) { 
    return (
      <div className="notification-page">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1><FaBell /> Notifications</h1>
            <p>Stay updated on your clearance progress</p>
          </div>
        </div>

        {/* Statistics Skeleton */}
        <div className="notif-stats">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Notifications Skeleton */}
        <div className="notifications-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      </div>
    );
 }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      
      if (result.success) {
        // Update local state
        setNotifications(notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        ));
      }
    } catch (error) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const result = await deleteNotification(notificationId);
      
      if (result.success) {
        setNotifications(notifications.filter(notif => notif.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      toast.error('No unread notifications');
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map(notif => markNotificationAsRead(notif.id))
      );

      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('No notifications selected');
      return;
    }

    if (!confirm(`Delete ${selectedNotifications.length} notification(s)?`)) return;

    try {
      await Promise.all(
        selectedNotifications.map(id => deleteNotification(id))
      );

      setNotifications(notifications.filter(notif => !selectedNotifications.includes(notif.id)));
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    } catch (error) {
      toast.error('Failed to delete selected notifications.');
    }
  };

  const toggleSelectNotification = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      success: { icon: <FaCheckCircle />, class: 'notif-success' },
      error: { icon: <FaExclamationTriangle />, class: 'notif-error' },
      warning: { icon: <FaExclamationTriangle />, class: 'notif-warning' },
      info: { icon: <FaInfoCircle />, class: 'notif-info' }
    };
    return icons[type] || icons.info;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  // Statistics
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  };

  if (loading) {
    return (
      <div className="notification-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><FaBell /> Notifications</h1>
          <p>Stay updated on your clearance progress</p>
        </div>
        <div className="header-badge">
          {stats.unread > 0 && (
            <span className="unread-count">{stats.unread} Unread</span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="notif-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card stat-unread">
          <div className="stat-value">{stats.unread}</div>
          <div className="stat-label">Unread</div>
        </div>
        <div className="stat-card stat-read">
          <div className="stat-value">{stats.read}</div>
          <div className="stat-label">Read</div>
        </div>
      </div>

      {/* Controls */}
      <div className="notif-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({stats.unread})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({stats.read})
          </button>
        </div>

        <div className="action-buttons">
          {selectedNotifications.length > 0 && (
            <button className="btn-delete-selected" onClick={handleDeleteSelected}>
              <FaTrash /> Delete Selected ({selectedNotifications.length})
            </button>
          )}
          {stats.unread > 0 && (
            <button className="btn-mark-all-read" onClick={handleMarkAllAsRead}>
              <FaCheck /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Bulk Selection */}
      {filteredNotifications.length > 0 && (
        <div className="bulk-select">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedNotifications.length === filteredNotifications.length}
              onChange={toggleSelectAll}
            />
            <span>Select All</span>
          </label>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No notifications</h3>
            <p>
              {filter === 'all' 
                ? "You don't have any notifications yet" 
                : filter === 'unread'
                ? "You don't have any unread notifications"
                : "You don't have any read notifications"}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const iconConfig = getNotificationIcon(notif.type);
            return (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.read ? 'unread' : ''} ${iconConfig.class}`}
              >
                <div className="notif-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notif.id)}
                    onChange={() => toggleSelectNotification(notif.id)}
                  />
                </div>

                <div className="notif-icon">
                  {iconConfig.icon}
                </div>

                <div className="notif-content" onClick={() => !notif.read && handleMarkAsRead(notif.id)}>
                  <div className="notif-header">
                    <h4>{notif.title}</h4>
                    {!notif.read && <span className="unread-dot"></span>}
                  </div>
                  <p className="notif-message">{notif.message}</p>
                  <div className="notif-meta">
                    <span className="notif-time">
                      <FaClock /> {formatTimestamp(notif.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="notif-actions">
                  {!notif.read && (
                    <button 
                      className="btn-icon" 
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button 
                    className="btn-icon btn-delete" 
                    onClick={() => handleDelete(notif.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notification;
