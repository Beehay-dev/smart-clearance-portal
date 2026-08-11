import React, { useState, useEffect } from 'react';
import { StudentRowSkeleton, StudentCardSkeleton, StatCardSkeleton } from "../../../Component/Common/Skeletons/Skeletons";
import { db } from "../../../firebase";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { 
  FaUser,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFileExport,
  FaUserPlus,
  FaChartPie,
  FaTable
} from 'react-icons/fa';
import './studentsManagement.css';

const DEPARTMENTS = ['bursary', 'hod', 'library', 'buth', 'security'];

const StudentsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [users, setUsers] = useState([]);
  const [clearances, setClearances] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [clearancesLoaded, setClearancesLoaded] = useState(false);
  const loading = !usersLoaded || !clearancesLoaded;

  // Live users
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUsersLoaded(true);
    });
    return () => unsub();
  }, []);

  // Live clearances
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clearances'), (snap) => {
      setClearances(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClearancesLoaded(true);
    });
    return () => unsub();
  }, []);

  // ── Build enriched student list by joining users + clearances ──
  const students = users.map(user => {
    const userClearances = clearances.filter(c => c.studentId === user.id);

    const clearanceStatus = {};
    DEPARTMENTS.forEach(dept => {
      const deptClearance = userClearances.find(c => c.department === dept);
      clearanceStatus[dept] = deptClearance?.status || 'not_started';
    });

    const statuses = Object.values(clearanceStatus);
    const approvedCount = statuses.filter(s => s === 'approved').length;
    const hasRejected = statuses.some(s => s === 'rejected');
    const hasPending = statuses.some(s => s === 'pending');
    const allNotStarted = statuses.every(s => s === 'not_started');

    let overall = 'not_started';
    if (approvedCount === DEPARTMENTS.length) overall = 'completed';
    else if (hasRejected) overall = 'rejected';
    else if (hasPending || approvedCount > 0) overall = 'in_progress';
    else if (allNotStarted) overall = 'not_started';

    const completionPercentage = Math.round((approvedCount / DEPARTMENTS.length) * 100);

    return {
      id: user.id,
      name: user.fullName || 'Unknown',
      matricNumber: user.matricNumber || '—',
      email: user.email || '—',
      phoneNumber: user.phoneNumber || '—',
      department: user.department || '—',
      level: user.level || '—',
      cgpa: user.cgpa || '—',
      registrationDate: user.createdAt?.toDate
        ? user.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—',
      clearanceStatus: { overall, ...clearanceStatus },
      completionPercentage,
    };
  });

  const uniqueDepartments = ['all', ...new Set(users.map(u => u.department).filter(Boolean))];
  const statusOptions = ['all', 'completed', 'in_progress', 'rejected', 'not_started'];

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.matricNumber.includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'all' || student.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || student.clearanceStatus.overall === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = {
    total: students.length,
    completed: students.filter(s => s.clearanceStatus.overall === 'completed').length,
    inProgress: students.filter(s => s.clearanceStatus.overall === 'in_progress').length,
    rejected: students.filter(s => s.clearanceStatus.overall === 'rejected').length,
    notStarted: students.filter(s => s.clearanceStatus.overall === 'not_started').length,
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleExportData = () => {
    const csv = [
      ['Name', 'Matric', 'Email', 'Department', 'Level', 'CGPA', 'Status', 'Progress'],
      ...students.map(s => [
        s.name, s.matricNumber, s.email, s.department,
        s.level, s.cgpa, s.clearanceStatus.overall, `${s.completionPercentage}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_clearance_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOverallStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', class: 'status-completed', icon: <FaCheckCircle /> },
      in_progress: { label: 'In Progress', class: 'status-in-progress', icon: <FaClock /> },
      rejected: { label: 'Rejected', class: 'status-rejected', icon: <FaTimesCircle /> },
      not_started: { label: 'Not Started', class: 'status-not-started', icon: <FaExclamationTriangle /> }
    };
    const config = statusConfig[status] || statusConfig.not_started;
    return (
      <span className={`overall-status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getDepartmentStatusIcon = (status) => {
    const icons = {
      approved: <FaCheckCircle className="dept-status-approved" />,
      pending: <FaClock className="dept-status-pending" />,
      rejected: <FaTimesCircle className="dept-status-rejected" />,
      not_started: <FaExclamationTriangle className="dept-status-not-started" />
    };
    return icons[status] || icons.not_started;
  };

  return (
    <div className="students-management-page">

      {/* Page Header */}
      <div className="students-page-header">
        <div>
          <h1><FaUser /> Students Management</h1>
          <p>View, search and manage all registered students</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportData}>
            <FaFileExport /> Export CSV
          </button>
          <button className="btn-primary">
            <FaUserPlus /> Add Student
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="students-stats">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <div className="student-stat-card stat-total">
              <div className="stat-icon"><FaUser /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>
            <div className="student-stat-card stat-completed">
              <div className="stat-icon"><FaCheckCircle /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="student-stat-card stat-in-progress">
              <div className="stat-icon"><FaClock /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            <div className="student-stat-card stat-rejected">
              <div className="stat-icon"><FaTimesCircle /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.rejected}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>
            <div className="student-stat-card stat-not-started">
              <div className="stat-icon"><FaExclamationTriangle /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.notStarted}</div>
                <div className="stat-label">Not Started</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="students-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, matric number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <FaFilter />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FaChartPie />
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <FaTable />
            </button>
          </div>
        </div>
      </div>

      {/* Students Display */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="students-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Matric Number</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>CGPA</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <StudentRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filteredStudents.length === 0 ? (
        <div className="empty-state">
          <FaUser className="empty-icon" />
          <h3>No students found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="students-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="student-card">
              <div className="student-card-header">
                <div className="student-avatar-large">
                  {student.name.charAt(0)}
                </div>
                {getOverallStatusBadge(student.clearanceStatus.overall)}
              </div>

              <div className="student-card-body">
                <h3>{student.name}</h3>
                <div className="student-card-info">
                  <p><strong>Matric:</strong> {student.matricNumber}</p>
                  <p><strong>Department:</strong> {student.department}</p>
                  <p><strong>Level:</strong> {student.level}</p>
                  <p><strong>CGPA:</strong> {student.cgpa}</p>
                </div>

                <div className="clearance-progress">
                  <div className="progress-header">
                    <span>Clearance Progress</span>
                    <span className="progress-percentage">{student.completionPercentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${student.completionPercentage}%` }} />
                  </div>
                </div>

                <div className="department-statuses">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept} className="dept-status" title={dept.charAt(0).toUpperCase() + dept.slice(1)}>
                      {getDepartmentStatusIcon(student.clearanceStatus[dept])}
                    </div>
                  ))}
                </div>
              </div>

              <div className="student-card-footer">
                <button className="card-action-btn" onClick={() => handleViewDetails(student)}>
                  <FaEye /> View Details
                </button>
                <button className="card-action-btn">
                  <FaEdit /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Matric Number</th>
                <th>Department</th>
                <th>Level</th>
                <th>CGPA</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>
                    <div className="table-student-info">
                      <div className="student-avatar-small">{student.name.charAt(0)}</div>
                      <div>
                        <div className="table-student-name">{student.name}</div>
                        <div className="table-student-email">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.matricNumber}</td>
                  <td>{student.department}</td>
                  <td>{student.level}</td>
                  <td><span className="cgpa-badge">{student.cgpa}</span></td>
                  <td>
                    <div className="table-progress">
                      <div className="table-progress-bar">
                        <div className="table-progress-fill" style={{ width: `${student.completionPercentage}%` }} />
                      </div>
                      <span className="table-progress-text">{student.completionPercentage}%</span>
                    </div>
                  </td>
                  <td>{getOverallStatusBadge(student.clearanceStatus.overall)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" onClick={() => handleViewDetails(student)} title="View Details">
                        <FaEye />
                      </button>
                      <button className="table-action-btn" title="Edit">
                        <FaEdit />
                      </button>
                      <button className="table-action-btn delete-btn" title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaUser /> Student Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="details-header">
                <div className="details-avatar">{selectedStudent.name.charAt(0)}</div>
                <div className="details-info">
                  <h2>{selectedStudent.name}</h2>
                  <p>{selectedStudent.matricNumber} • {selectedStudent.department}</p>
                  {getOverallStatusBadge(selectedStudent.clearanceStatus.overall)}
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedStudent.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{selectedStudent.phoneNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Level</span>
                  <span className="detail-value">{selectedStudent.level}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CGPA</span>
                  <span className="detail-value">{selectedStudent.cgpa}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registration Date</span>
                  <span className="detail-value">{selectedStudent.registrationDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Completion</span>
                  <span className="detail-value">{selectedStudent.completionPercentage}%</span>
                </div>
              </div>

              <div className="clearance-status-details">
                <h4>Clearance Status by Department</h4>
                <div className="status-details-grid">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept} className="status-detail-card">
                      <span className="status-dept-name">{dept.toUpperCase()}</span>
                      {getDepartmentStatusIcon(selectedStudent.clearanceStatus[dept])}
                      <span className="status-dept-label">{selectedStudent.clearanceStatus[dept].replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              <button className="btn-primary">
                <FaDownload /> Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;