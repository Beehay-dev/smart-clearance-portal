import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { 
  FaUsers, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaUserTie,
  FaBook,
  FaHeartbeat,
  FaShieldAlt,
  FaChartLine,
  FaArrowRight,
  FaUpload
} from 'react-icons/fa';
import './adminOverview.css';
import { 
  StatCardSkeleton, 
  OverviewCardSkeleton, 
  ActivitySkeleton,
  ClearanceCardSkeleton 
} from '../../../../Component/Common/Skeletons/Skeletons';

const AdminOverview = () => {
  const navigate = useNavigate();

  const [clearances, setClearances] = useState([]);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const unsub = onSnapshot(q, (snap) => {
    setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  });
  return () => unsub();
}, []);

  
  useEffect(() => {
  const q = query(collection(db, 'clearances'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    setClearances(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  return () => unsub();
}, []);

  // Listen to documents collection
  useEffect(() => {
  const q = query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    setDocuments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  return () => unsub();
}, []);

  // ── Computed Stats ──
  const stats = {
    totalStudents: users.length,
    pendingClearances: clearances.filter(c => c.status === 'pending').length,
    approvedClearances: clearances.filter(c => c.status === 'approved').length,
    rejectedClearances: clearances.filter(c => c.status === 'rejected').length,
  };

  // ── Department Stats ──
  const departmentConfig = [
    { id: 1, name: 'Bursary', key: 'bursary', icon: <FaMoneyBillWave />, color: '#3b82f6', path: 'bursary-review' },
    { id: 2, name: 'HOD', key: 'hod', icon: <FaUserTie />, color: '#8b5cf6', path: 'hod-review' },
    { id: 3, name: 'Library', key: 'library', icon: <FaBook />, color: '#10b981', path: 'library-review' },
    { id: 4, name: 'BUTH', key: 'buth', icon: <FaHeartbeat />, color: '#ef4444', path: 'buth-review' },
    { id: 5, name: 'Security', key: 'security', icon: <FaShieldAlt />, color: '#f59e0b', path: 'security-review' },
  ];

  const departmentStats = departmentConfig.map(dept => {
    const deptClearances = clearances.filter(c => c.department === dept.key);
    return {
      ...dept,
      pending: deptClearances.filter(c => c.status === 'pending').length,
      approved: deptClearances.filter(c => c.status === 'approved').length,
      total: deptClearances.length,
    };
  });

  // ── Recent Activities from real documents + clearances ──
  const recentActivities = [
    // Recent document uploads
    ...documents.slice(0, 3).map(doc => ({
      id: `doc-${doc.id}`,
      student: `${doc.studentName || 'Unknown'} (${doc.matricNumber || '—'})`,
      action: `uploaded ${doc.fileName || 'a document'}`,
      department: doc.department ? doc.department.charAt(0).toUpperCase() + doc.department.slice(1) : '—',
      timestamp: doc.uploadDate?.toDate
        ? doc.uploadDate.toDate().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : 'Recently',
      type: 'upload',
    })),
    // Recent approved clearances
    ...clearances
      .filter(c => c.status === 'approved')
      .slice(0, 2)
      .map(c => ({
        id: `clr-approved-${c.id}`,
        student: `${c.studentName || 'Unknown'} (${c.matricNumber || '—'})`,
        action: 'clearance approved',
        department: c.department ? c.department.charAt(0).toUpperCase() + c.department.slice(1) : '—',
        timestamp: c.updatedAt?.toDate
          ? c.updatedAt.toDate().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : 'Recently',
        type: 'approved',
      })),
    // Recent rejected clearances
    ...clearances
      .filter(c => c.status === 'rejected')
      .slice(0, 2)
      .map(c => ({
        id: `clr-rejected-${c.id}`,
        student: `${c.studentName || 'Unknown'} (${c.matricNumber || '—'})`,
        action: `clearance declined — ${c.reviewComment || 'see admin comments'}`,
        department: c.department ? c.department.charAt(0).toUpperCase() + c.department.slice(1) : '—',
        timestamp: c.updatedAt?.toDate
          ? c.updatedAt.toDate().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : 'Recently',
        type: 'rejected',
      })),
  ].slice(0, 5); // cap at 5

  // ── Urgent Reviews — pending clearances sorted by oldest ──
  const urgentReviews = clearances
    .filter(c => c.status === 'pending')
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date();
      const bTime = b.createdAt?.toDate?.() || new Date();
      return aTime - bTime; // oldest first
    })
    .slice(0, 3)
    .map(c => {
      const created = c.createdAt?.toDate?.() || new Date();
      const daysWaiting = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
      return {
        id: c.id,
        student: c.studentName || 'Unknown',
        matricNumber: c.matricNumber || '—',
        department: c.department ? c.department.charAt(0).toUpperCase() + c.department.slice(1) : '—',
        deptPath: departmentConfig.find(d => d.key === c.department)?.path || 'overview',
        documentType: c.description || 'Clearance Document',
        daysWaiting: daysWaiting || 0,
      };
    });

  if (loading) {
    return (
      <div className="admin-overview">
        {/* Header */}
        <div className="overview-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Monitor clearance system performance</p>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="overview-content">
          <div className="overview-main">
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
          </div>
          <div className="overview-sidebar">
            {Array.from({ length: 3 }).map((_, index) => (
              <ActivitySkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overview-page">

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Monitor and manage all clearance activities in real time</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admindashboard/students')}>
          <FaUsers /> View All Students
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card stat-total">
          <div className="stat-icon"><FaUsers /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="admin-stat-card stat-pending">
          <div className="stat-icon"><FaClock /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingClearances}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>

        <div className="admin-stat-card stat-approved">
          <div className="stat-icon"><FaCheckCircle /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.approvedClearances}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>

        <div className="admin-stat-card stat-rejected">
          <div className="stat-icon"><FaExclamationTriangle /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.rejectedClearances}</div>
            <div className="stat-label">Requires Action</div>
          </div>
        </div>
      </div>

      <div className="admin-overview-content">
        {/* Left Column */}
        <div className="admin-overview-main">

          {/* Department Overview */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3><FaChartLine /> Department Overview</h3>
                <p className="card-subtitle">Live clearance status by department</p>
              </div>
            </div>

            <div className="department-overview-grid">
              {departmentStats.map(dept => (
                <div
                  key={dept.id}
                  className="dept-overview-card"
                  onClick={() => navigate(`/admindashboard/${dept.path}`)}
                  style={{ borderLeftColor: dept.color }}
                >
                  <div className="dept-overview-header">
                    <div className="dept-overview-icon" style={{ backgroundColor: `${dept.color}20`, color: dept.color }}>
                      {dept.icon}
                    </div>
                    <h4>{dept.name}</h4>
                  </div>

                  <div className="dept-overview-stats">
                    <div className="dept-stat">
                      <span className="dept-stat-value pending">{dept.pending}</span>
                      <span className="dept-stat-label">Pending</span>
                    </div>
                    <div className="dept-stat">
                      <span className="dept-stat-value approved">{dept.approved}</span>
                      <span className="dept-stat-label">Approved</span>
                    </div>
                    <div className="dept-stat">
                      <span className="dept-stat-value total">{dept.total}</span>
                      <span className="dept-stat-label">Total</span>
                    </div>
                  </div>

                  <div className="dept-progress-bar">
                    <div
                      className="dept-progress-fill"
                      style={{
                        width: dept.total > 0 ? `${(dept.approved / dept.total) * 100}%` : '0%',
                        backgroundColor: dept.color
                      }}
                    />
                  </div>

                  <button className="dept-view-btn">
                    View Details <FaArrowRight />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3>Recent Activities</h3>
                <p className="card-subtitle">Latest clearance updates</p>
              </div>
            </div>

            <div className="activities-list">
              {recentActivities.length === 0 ? (
                <p style={{ color: '#7f8c8d', textAlign: 'center', padding: '2rem' }}>No recent activities</p>
              ) : (
                recentActivities.map(activity => (
                  <div key={activity.id} className={`activity-item activity-${activity.type}`}>
                    <div className="activity-icon">
                      {activity.type === 'upload' && <FaUpload />}
                      {activity.type === 'approved' && <FaCheckCircle />}
                      {activity.type === 'rejected' && <FaExclamationTriangle />}
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">
                        <strong>{activity.student}</strong> {activity.action}
                      </p>
                      <div className="activity-meta">
                        <span className="activity-department">{activity.department}</span>
                        <span className="activity-time">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-overview-sidebar">

          {/* Urgent Reviews */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Urgent Reviews</h3>
              <span className="urgent-badge">{urgentReviews.length}</span>
            </div>

            <div className="pending-reviews-list">
              {urgentReviews.length === 0 ? (
                <p style={{ color: '#7f8c8d', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                   No urgent reviews!
                </p>
              ) : (
                urgentReviews.map(review => (
                  <div key={review.id} className="pending-review-item">
                    <div className="review-student-info">
                      <div className="review-avatar">{review.student.charAt(0)}</div>
                      <div>
                        <div className="review-student-name">{review.student}</div>
                        <div className="review-matric">{review.matricNumber}</div>
                      </div>
                    </div>

                    <div className="review-details">
                      <span className="review-department">{review.department}</span>
                      <span className="review-document">{review.documentType}</span>
                    </div>

                    <div className="review-footer">
                      <span className="review-days">
                        {review.daysWaiting === 0 ? 'Today' : `${review.daysWaiting} day${review.daysWaiting > 1 ? 's' : ''} waiting`}
                      </span>
                      <button
                        className="btn-review-now"
                        onClick={() => navigate(`/admindashboard/${review.deptPath}`)}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Quick Actions</h3>
            </div>

            <div className="quick-actions-list">
              <button className="quick-action-btn" onClick={() => navigate('/admindashboard/students')}>
                <FaUsers />
                <span>Manage Students</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admindashboard/bursary-review')}>
                <FaMoneyBillWave />
                <span>Bursary Reviews</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admindashboard/library-review')}>
                <FaBook />
                <span>Library Reviews</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admindashboard/hod-review')}>
                <FaUserTie />
                <span>HOD Reviews</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOverview;