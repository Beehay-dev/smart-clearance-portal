import React, { useState, useEffect } from 'react';
import { ClearanceCardSkeleton, StatCardSkeleton } from "../../../../Component/Common/Skeletons/Skeletons";
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaComments,
  FaFileAlt
} from 'react-icons/fa';
import './bursaryReview.css';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  getDepartmentClearances, 
  updateClearanceStatus,
  getClearanceDocuments,
  createNotification
} from '../../../../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-toastify';

const BursaryReview = () => {
  const { currentUser, userData } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load clearances on component mount
  useEffect(() => {
    loadBursaryClearances();
  }, []);

  const loadBursaryClearances = async () => {
    setLoading(true);
    try {
      // Get all bursary clearances
      const result = await getDepartmentClearances('bursary');
      
      if (result.success) {
        // Fetch student details and documents for each clearance
        const enrichedClearances = await Promise.all(
          result.clearances.map(async (clearance) => {
            // Get student data
            const studentDoc = await getDoc(doc(db, 'users', clearance.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : {};

            // Get documents for this clearance
            const docsResult = await getClearanceDocuments(clearance.id);
            const documents = docsResult.success ? docsResult.documents : [];

            // Calculate days waiting
            const createdDate = clearance.createdAt?.toDate() || new Date();
            const daysWaiting = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

            return {
              id: clearance.id,
              name: studentData.fullName || 'Unknown Student',
              matricNumber: studentData.matricNumber || 'N/A',
              department: studentData.department || 'N/A',
              email: studentData.email || 'N/A',
              bursaryNumber: studentData.bursaryNumber || 'N/A',
              status: clearance.status,
              accountBalance: 0, // This should come from your bursary system
              documents: documents,
              submittedDate: clearance.createdAt?.toDate().toLocaleDateString() || 'N/A',
              daysWaiting: daysWaiting,
              lastComment: clearance.reviewComment || null,
              reviewedBy: clearance.reviewedBy || null,
              reviewedDate: clearance.reviewedAt?.toDate().toLocaleDateString() || null,
              studentId: clearance.studentId
            };
          })
        );

        setStudents(enrichedClearances);
      }
    } catch (error) {
      toast.error('Failed to load clearances. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.matricNumber.includes(searchQuery) ||
                          student.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const stats = {
    total: students.length,
    pending: students.filter(s => s.status === 'pending').length,
    approved: students.filter(s => s.status === 'approved').length,
    rejected: students.filter(s => s.status === 'rejected').length
  };

  const handleReview = (student, action) => {
    setSelectedStudent(student);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewAction === 'rejected' && !adminComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);

    try {
      // Update clearance status in Firestore — this also updates the
      // student's profile status atomically (see updateClearanceStatus)
      const updateResult = await updateClearanceStatus(
        selectedStudent.id,
        reviewAction,
        adminComment,
        userData?.fullName || 'Admin'
      );

      if (!updateResult.success) {
        throw new Error('Failed to update clearance status');
      }

      // Create notification for student
      await createNotification(selectedStudent.studentId, {
        title: `Bursary Clearance ${reviewAction === 'approved' ? 'Approved' : 'Rejected'}`,
        message: reviewAction === 'approved' 
          ? 'Your bursary clearance has been approved!' 
          : `Your bursary clearance was rejected. Reason: ${adminComment}`,
        type: reviewAction === 'approved' ? 'success' : 'error'
      });

      toast.success(`Bursary clearance ${reviewAction} for ${selectedStudent.name}`);
      
      // Close modal and refresh data
      setShowReviewModal(false);
      setAdminComment('');
      setSelectedStudent(null);
      
      // Reload clearances
      await loadBursaryClearances();
    } catch (error) {
      toast.error(`Failed to ${reviewAction} clearance. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'status-pending', icon: <FaClock /> },
      approved: { label: 'Approved', class: 'status-approved', icon: <FaCheckCircle /> },
      rejected: { label: 'Rejected', class: 'status-rejected', icon: <FaTimesCircle /> }
    };
    const config = statusConfig[status];
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-page-header">
          <div>
            <h1><FaMoneyBillWave /> Bursary Clearance Review</h1>
            <p>Review and approve student payment clearances</p>
          </div>
        </div>

        {/* Statistics Skeleton */}
        <div className="review-stats">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        {/* Clearances Skeleton */}
        <div className="students-review-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <ClearanceCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="review-page">
      {/* Page Header */}
      <div className="review-page-header">
        <div>
          <h1><FaMoneyBillWave /> Bursary Clearance Review</h1>
          <p>Review and approve student payment clearances</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="review-stats">
        <div className="review-stat-card">
          <div className="review-stat-value">{stats.total}</div>
          <div className="review-stat-label">Total Submissions</div>
        </div>
        <div className="review-stat-card stat-pending">
          <div className="review-stat-value">{stats.pending}</div>
          <div className="review-stat-label">Pending Review</div>
        </div>
        <div className="review-stat-card stat-approved">
          <div className="review-stat-value">{stats.approved}</div>
          <div className="review-stat-label">Approved</div>
        </div>
        <div className="review-stat-card stat-rejected">
          <div className="review-stat-value">{stats.rejected}</div>
          <div className="review-stat-label">Rejected</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="review-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, matric number, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({students.length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved ({stats.approved})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="students-review-list">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt className="empty-icon" />
            <h3>No clearances found</h3>
            <p>
              {filterStatus === 'all' 
                ? 'No bursary clearance submissions yet' 
                : `No ${filterStatus} clearances`}
            </p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div key={student.id} className="student-review-card">
              <div className="student-review-header">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3>{student.name}</h3>
                    <div className="student-meta">
                      <span>{student.matricNumber}</span>
                      <span className="separator">•</span>
                      <span>{student.department}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(student.status)}
              </div>

              <div className="student-review-body">
                {/* Student Details */}
                <div className="bursary-details">
                  <div className="detail-item">
                    <span className="detail-label">Bursary Account:</span>
                    <span className="detail-value">{student.bursaryNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Balance:</span>
                    <span className={`detail-value ${student.accountBalance === 0 ? 'text-success' : 'text-danger'}`}>
                      ₦{student.accountBalance.toLocaleString()}
                      {student.accountBalance === 0 && ' (Cleared)'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">{student.submittedDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Days Waiting:</span>
                    <span className="detail-value">{student.daysWaiting} days</span>
                  </div>
                </div>

                {/* Documents */}
                {student.documents.length > 0 && (
                  <div className="documents-section">
                    <h4><FaFileAlt /> Uploaded Documents ({student.documents.length})</h4>
                    <div className="documents-grid">
                      {student.documents.map(doc => (
                        <div key={doc.id} className="document-card">
                          <div className="doc-icon">
                            <FaFileAlt />
                          </div>
                          <div className="doc-info">
                            <div className="doc-name">{doc.fileName}</div>
                            <div className="doc-meta">
                              {formatFileSize(doc.fileSize)} • {doc.uploadDate?.toDate().toLocaleDateString()}
                            </div>
                          </div>
                          <div className="doc-actions">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="doc-action-btn"
                              title="View"
                            >
                              <FaEye />
                            </a>

                            <a
                            
                              href={doc.fileUrl}
                              download
                              className="doc-action-btn"
                              title="Download"
                            >
                              <FaDownload />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Comment */}
                {student.lastComment && (
                  <div className={`last-comment comment-${student.status}`}>
                    <FaComments />
                    <div>
                      <strong>Admin Feedback:</strong> {student.lastComment}
                      {student.reviewedBy && (
                        <div className="comment-meta">
                          By {student.reviewedBy} on {student.reviewedDate}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {student.status === 'pending' && (
                <div className="student-review-actions">
                  <button 
                    className="btn-reject"
                    onClick={() => handleReview(student, 'rejected')}
                  >
                    <FaTimesCircle /> Reject
                  </button>
                  <button 
                    className="btn-approve"
                    onClick={() => handleReview(student, 'approved')}
                  >
                    <FaCheckCircle /> Approve Clearance
                  </button>
                </div>
              )}

              {student.status === 'approved' && (
                <div className="approval-info">
                  <FaCheckCircle className="approval-icon" />
                  <span>Approved by {student.reviewedBy} on {student.reviewedDate}</span>
                </div>
              )}

              {student.status === 'rejected' && (
                <div className="rejection-info">
                  <FaExclamationTriangle className="rejection-icon" />
                  <span>Rejected by {student.reviewedBy} on {student.reviewedDate}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => !submitting && setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {reviewAction === 'approved' ? (
                  <>
                    <FaCheckCircle /> Approve Bursary Clearance
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Reject Bursary Clearance
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={() => !submitting && setShowReviewModal(false)} disabled={submitting}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-student-info">
                <p><strong>Student:</strong> {selectedStudent.name}</p>
                <p><strong>Matric Number:</strong> {selectedStudent.matricNumber}</p>
                <p><strong>Department:</strong> {selectedStudent.department}</p>
                <p><strong>Documents:</strong> {selectedStudent.documents.length} uploaded</p>
              </div>

              <div className="form-group">
                <label htmlFor="admin-comment">
                  {reviewAction === 'approved' ? 'Comment (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  id="admin-comment"
                  rows="4"
                  placeholder={reviewAction === 'approved' 
                    ? 'Add any additional comments...' 
                    : 'Specify the reason for rejection...'}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  required={reviewAction === 'rejected'}
                  disabled={submitting}
                />
              </div>

              {reviewAction === 'approved' && (
                <div className="approval-notice">
                  <FaCheckCircle />
                  <p>This will approve the bursary clearance and notify the student.</p>
                </div>
              )}

              {reviewAction === 'rejected' && (
                <div className="rejection-notice">
                  <FaExclamationTriangle />
                  <p>The student will be notified and can resubmit after addressing the issues.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button 
                className={reviewAction === 'approved' ? 'btn-approve' : 'btn-reject'}
                onClick={submitReview}
                disabled={(reviewAction === 'rejected' && !adminComment.trim()) || submitting}
              >
                {submitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    Processing...
                  </>
                ) : reviewAction === 'approved' ? (
                  <>
                    <FaCheckCircle /> Confirm Approval
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BursaryReview;
