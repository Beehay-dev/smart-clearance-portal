import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  FaCheckCircle, FaClock, FaTimesCircle, FaExclamationTriangle, 
  FaFileAlt, FaHeadset, FaChartLine, FaBell 
} from 'react-icons/fa';
import "./overview.css";
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getUserNotifications } from '../../../firebase/firestore';

const getStatusIcon = (status) => {
  const icons = {
    approved:    <FaCheckCircle />,
    pending:     <FaClock />,
    submitted:   <FaExclamationTriangle />,
    not_started: <FaTimesCircle />,
    rejected:    <FaTimesCircle />
  };
  return icons[status] || icons.not_started;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60)     return 'Just now';
  if (diffInSeconds < 3600)   return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)  return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    approved:    { label: 'Approved',    class: 'status-approved' },
    pending:     { label: 'Pending',     class: 'status-pending' },
    submitted:   { label: 'Submitted',   class: 'status-submitted' },
    not_started: { label: 'Not Started', class: 'status-not-started' },
    rejected:    { label: 'Rejected',    class: 'status-rejected' } 
  };
  const config = statusConfig[status] || statusConfig.not_started;
  return <span className={`status-badge ${config.class}`}>{config.label}</span>;
};

const Overview = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData]           = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        setLoading(true);
        const userDocRef  = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        } else {
          setError('User data not found');
        }
        const notifResult = await getUserNotifications(currentUser.uid);
        if (notifResult.success) {
          setNotifications(notifResult.notifications.slice(0, 4));
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const clearanceStatus = userData?.clearanceStatus || {};

  const clearanceData = [
    { department: 'Bursary',  status: clearanceStatus.bursary   || 'not_started', icon: getStatusIcon(clearanceStatus.bursary),  requiredDocs: 3 },
    { department: 'Library',  status: clearanceStatus.library   || 'not_started', icon: getStatusIcon(clearanceStatus.library),  requiredDocs: 2 },
    { department: 'HOD',      status: clearanceStatus.hod       || 'not_started', icon: getStatusIcon(clearanceStatus.hod),      requiredDocs: 2 },
    { department: 'BUTH',     status: clearanceStatus.buth      || 'not_started', icon: getStatusIcon(clearanceStatus.buth),     requiredDocs: 1 },
    { department: 'Security', status: clearanceStatus.security  || 'not_started', icon: getStatusIcon(clearanceStatus.security), requiredDocs: 1 }
  ];

  const stats = {
    approved:   clearanceData.filter(d => d.status === 'approved').length,
    pending:    clearanceData.filter(d => d.status === 'pending').length,
    submitted:  clearanceData.filter(d => d.status === 'submitted').length,
    notStarted: clearanceData.filter(d => d.status === 'not_started').length,
    rejected:   clearanceData.filter(d => d.status === 'rejected').length,
    total:      clearanceData.length
  };

  const completionPercentage = userData?.completionPercentage 
    ?? Math.round((stats.approved / stats.total) * 100);

  const displayName = userData?.fullName?.split(' ')[0] || 'Student';

  const chartData = [
    { name: 'Approved',    value: stats.approved,   color: '#10b981' },
    { name: 'Submitted',   value: stats.submitted,  color: '#c89b00' },
    { name: 'Pending',     value: stats.pending,    color: '#7f8c8d' },
    { name: 'Not Started', value: stats.notStarted, color: '#e5e7eb' },
    { name: 'Rejected',    value: stats.rejected,   color: '#ef4444' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="overview-page">
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back...</h1>
            <p>Loading your clearance data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page">
        <div className="error-state">
          <FaTimesCircle />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">

      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back, {displayName}</h1>
          <p>Track your clearance progress and manage your requirements seamlessly.</p>
        </div>
        <div className="stats-summary">
          <div className="stat-item">
            <div className="stat-value">{stats.approved}/{stats.total}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-value">{completionPercentage}%</div>
            <div className="stat-label">Progress</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="overview-content">

        {/* Left section */}
        <div className="overview-main">

          {/* Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <h3>Clearance Overview</h3>
              <span className="card-subtitle">Real-time status tracking</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: '#2c3e50', fontSize: '0.875rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Status */}
          <div className="card departments-card">
            <div className="card-header">
              <h3>Department Status</h3>
              <span className="card-subtitle">Monitor clearance across all departments</span>
            </div>
            <div className="department-list">
              {clearanceData.map((dept, index) => (
                <div key={index} className={`department-item dept-${dept.status}`}>
                  <div className="dept-left">
                    <div className="dept-icon-wrapper">{dept.icon}</div>
                    <div className="dept-info">
                      <h4>{dept.department}</h4>
                      <p className="dept-meta">
                        <span>{dept.requiredDocs} required docs</span>
                      </p>
                    </div>
                  </div>
                  <div className="dept-right">
                    <StatusBadge status={dept.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="overview-sidebar">

          {/* Recent Activity */}
          <div className="card notifications-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-activity">
                  <FaBell />
                  <p>No recent activity</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className={`notif-icon notif-${notif.type}`}>
                      {getStatusIcon(notif.type)}
                    </div>
                    <div className="notif-content">
                      <p className="notif-text">{notif.message}</p>
                      <span className="notif-time">{formatTimestamp(notif.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn-text">View all activity</button>
          </div>

          {/* Quick Actions */}
          <div className="card quick-actions-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="action-list">
              <button className="action-item">
                <FaFileAlt className="action-icon" />
                <span>Upload Documents</span>
              </button>
              <button className="action-item">
                <FaChartLine className="action-icon" />
                <span>View Full Report</span>
              </button>
              <button className="action-item">
                <FaHeadset className="action-icon" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Overview;
