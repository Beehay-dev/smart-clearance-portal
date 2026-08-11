import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import {
  collection, onSnapshot, query, where,
  doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import {
  FaCheckCircle, FaClock, FaExclamationTriangle,
  FaFileAlt, FaEye, FaCheck, FaTimes, FaUser,
  FaSearch, FaFilter, FaInbox
} from 'react-icons/fa';
import './deptOverview.css';
import { updateClearanceStatus, createNotification } from '../../../firebase/firestore';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const DEPT_CONFIG = {
  bursary:  { label: 'Bursary',  color: '#3b82f6' },
  hod:      { label: 'HOD',      color: '#8b5cf6' },
  library:  { label: 'Library',  color: '#10b981' },
  buth:     { label: 'BUTH',     color: '#ef4444' },
  security: { label: 'Security', color: '#f59e0b' },
};

const DeptOverview = ({ dept, filter = 'all' }) => {
  const [clearances, setClearances] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = DEPT_CONFIG[dept] || {};
  const adminData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Live clearances for this department
  useEffect(() => {
    const q = query(
      collection(db, 'clearances'),
      where('department', '==', dept)
    );
    const unsub = onSnapshot(q, (snap) => {
      setClearances(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [dept]);

  // Live documents for this department
  useEffect(() => {
    const q = query(
      collection(db, 'documents'),
      where('department', '==', dept)
    );
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [dept]);

  // ── Stats ──
  const stats = {
    total:    clearances.length,
    pending:  clearances.filter(c => c.status === 'pending').length,
    approved: clearances.filter(c => c.status === 'approved').length,
    rejected: clearances.filter(c => c.status === 'rejected').length,
  };

  // ── Filter clearances based on sidebar route ──
  const getFilteredClearances = () => {
    let filtered = [...clearances];

    if (filter === 'pending')  filtered = filtered.filter(c => c.status === 'pending');
    if (filter === 'approved') filtered = filtered.filter(c => c.status === 'approved');

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.matricNumber?.includes(searchQuery)
      );
    }

    // Sort — pending oldest first, others newest first
    filtered.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date();
      const bTime = b.createdAt?.toDate?.() || new Date();
      return filter === 'pending' ? aTime - bTime : bTime - aTime;
    });

    return filtered;
  };

  const filteredClearances = getFilteredClearances();

  // Get documents for a specific clearance
  const getStudentDocs = (clearanceId) => {
    return documents.filter(d => d.clearanceId === clearanceId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getDaysWaiting = (timestamp) => {
    if (!timestamp) return 0;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
  };

  // ── Open review modal ──
  const handleOpenReview = (clearance, action) => {
    setSelectedClearance(clearance);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  // ── Submit approve/reject ──
  const handleSubmitReview = async () => {
    if (!selectedClearance) return;
    if (reviewAction === 'rejected' && !reviewComment.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setSubmitting(true);
    try {
      // Uses updateClearanceStatus so the clearance doc AND the student's
      // profile (clearanceStatus/completionPercentage) update together,
      // instead of writing directly to the clearance doc only.
      const updateResult = await updateClearanceStatus(
        selectedClearance.id,
        reviewAction,
        reviewComment.trim(),
        adminData.fullName || 'Admin'
      );

      if (!updateResult.success) {
        throw new Error('Failed to update clearance status');
      }

      // Also update all documents for this clearance
      const studentDocs = getStudentDocs(selectedClearance.id);
      await Promise.all(
        studentDocs.map(d =>
          updateDoc(doc(db, 'documents', d.id), {
            status: reviewAction,
            updatedAt: serverTimestamp(),
          })
        )
      );

      // Notify the student — the modal tells the admin this happens, so make it actually happen
      await createNotification(selectedClearance.studentId, {
        title: `${config.label} Clearance ${reviewAction === 'approved' ? 'Approved' : 'Rejected'}`,
        message: reviewAction === 'approved'
          ? `Your ${config.label} clearance has been approved!`
          : `Your ${config.label} clearance was rejected. Reason: ${reviewComment.trim()}`,
        type: reviewAction === 'approved' ? 'success' : 'error'
      });

      toast.success(
        reviewAction === 'approved' ? 'Clearance approved.' : 'Clearance rejected.'
      );

      setShowReviewModal(false);
      setSelectedClearance(null);
      setReviewComment('');
    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (filter === 'pending')  return 'Pending Reviews';
    if (filter === 'approved') return 'Approved Clearances';
    return `${config.label} Dashboard`;
  };

  if (loading) {
    return (
      <div className="dept-overview-page">
        <div className="dept-loading">
          <div className="dept-spinner" />
          <p>Loading {config.label} clearances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dept-overview-page">

      {/* Page Header */}
      <div className="dept-page-header">
        <div>
          <h1 style={{ color: config.color }}>{getPageTitle()}</h1>
          <p>
            {filter === 'pending'
              ? 'Students awaiting your review and approval'
              : filter === 'approved'
              ? 'Students you have cleared'
              : `Manage all ${config.label} clearance requests`}
          </p>
        </div>
      </div>

      {/* Stats — only show on main dashboard view */}
      {filter === 'all' && (
        <div className="dept-stats-grid">
          <div className="dept-stat-card" style={{ borderLeftColor: '#2c3e50' }}>
            <div className="dept-stat-icon" style={{ background: '#f1f5f9', color: '#2c3e50' }}>
              <FaUser />
            </div>
            <div className="dept-stat-content">
              <div className="dept-stat-value">{stats.total}</div>
              <div className="dept-stat-label">Total Requests</div>
            </div>
          </div>
          <div className="dept-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="dept-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FaClock />
            </div>
            <div className="dept-stat-content">
              <div className="dept-stat-value">{stats.pending}</div>
              <div className="dept-stat-label">Pending</div>
            </div>
          </div>
          <div className="dept-stat-card" style={{ borderLeftColor: '#10b981' }}>
            <div className="dept-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <FaCheckCircle />
            </div>
            <div className="dept-stat-content">
              <div className="dept-stat-value">{stats.approved}</div>
              <div className="dept-stat-label">Approved</div>
            </div>
          </div>
          <div className="dept-stat-card" style={{ borderLeftColor: '#ef4444' }}>
            <div className="dept-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
              <FaExclamationTriangle />
            </div>
            <div className="dept-stat-content">
              <div className="dept-stat-value">{stats.rejected}</div>
              <div className="dept-stat-label">Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="dept-controls">
        <div className="dept-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name or matric number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="dept-results-count">
          <FaFilter />
          <span>{filteredClearances.length} student{filteredClearances.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Clearances List */}
      {filteredClearances.length === 0 ? (
        <div className="dept-empty-state">
          <FaInbox className="dept-empty-icon" />
          <h3>
            {filter === 'pending' ? 'No pending reviews!' :
             filter === 'approved' ? 'No approved clearances yet' :
             'No clearance requests yet'}
          </h3>
          <p>
            {filter === 'pending'
              ? '🎉 You are all caught up!'
              : 'Requests will appear here once students submit.'}
          </p>
        </div>
      ) : (
        <div className="dept-clearances-list">
          {filteredClearances.map(clearance => {
            const studentDocs = getStudentDocs(clearance.id);
            const daysWaiting = getDaysWaiting(clearance.createdAt);

            return (
              <div
                key={clearance.id}
                className={`dept-clearance-card ${clearance.status}`}
              >
                {/* Card Header */}
                <div className="dept-clearance-header">
                  <div className="dept-student-info">
                    <div className="dept-student-avatar">
                      {clearance.studentName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3>{clearance.studentName || 'Unknown Student'}</h3>
                      <p>{clearance.matricNumber || '—'} • {clearance.studentDepartment || '—'}</p>
                    </div>
                  </div>
                  <div className="dept-clearance-meta">
                    <span className={`dept-status-badge status-${clearance.status}`}>
                      {clearance.status === 'approved' && <><FaCheckCircle /> Approved</>}
                      {clearance.status === 'pending'  && <><FaClock /> Pending</>}
                      {clearance.status === 'rejected' && <><FaExclamationTriangle /> Rejected</>}
                    </span>
                    {clearance.status === 'pending' && (
                      <span className={`dept-days-waiting ${daysWaiting >= 3 ? 'urgent' : ''}`}>
                        {daysWaiting === 0 ? 'Today' : `${daysWaiting} day${daysWaiting > 1 ? 's' : ''} waiting`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="dept-clearance-body">
                  <p className="dept-docs-label">
                    <FaFileAlt /> {studentDocs.length} Document{studentDocs.length !== 1 ? 's' : ''} Submitted
                  </p>
                  {studentDocs.length > 0 && (
                    <div className="dept-docs-list">
                      {studentDocs.map(docItem => (
                        <div key={docItem.id} className="dept-doc-item">
                          <FaFileAlt className="dept-doc-icon" />
                          <span className="dept-doc-name">{docItem.fileName}</span>
                          <span className="dept-doc-size">
                            {docItem.fileSize ? `${Math.round(docItem.fileSize / 1024)} KB` : ''}
                          </span>
                          <Link 
                            to={docItem.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dept-doc-view"
                          > 
                            <FaEye /> View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review comment if exists */}
                  {clearance.reviewComment && (
                    <div className={`dept-review-comment ${clearance.status}`}>
                      <strong>Comment:</strong> {clearance.reviewComment}
                      <span className="dept-reviewed-by">
                        — {clearance.reviewedBy} on {formatDate(clearance.reviewedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {clearance.status === 'pending' && (
                  <div className="dept-clearance-footer">
                    <button
                      className="dept-btn-approve"
                      onClick={() => handleOpenReview(clearance, 'approved')}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      className="dept-btn-reject"
                      onClick={() => handleOpenReview(clearance, 'rejected')}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}

                {clearance.status === 'rejected' && (
                  <div className="dept-clearance-footer">
                    <button
                      className="dept-btn-approve"
                      onClick={() => handleOpenReview(clearance, 'approved')}
                    >
                      <FaCheck /> Approve Instead
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedClearance && (
        <div className="dept-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="dept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h3>
                {reviewAction === 'approved'
                  ? <><FaCheck /> Approve Clearance</>
                  : <><FaTimes /> Reject Clearance</>}
              </h3>
              <button
                className="dept-modal-close"
                onClick={() => setShowReviewModal(false)}
              >×</button>
            </div>

            <div className="dept-modal-body">
              {/* Student summary */}
              <div className="dept-modal-student">
                <div className="dept-student-avatar">
                  {selectedClearance.studentName?.charAt(0) || '?'}
                </div>
                <div>
                  <h4>{selectedClearance.studentName}</h4>
                  <p>{selectedClearance.matricNumber} • {selectedClearance.studentDepartment}</p>
                </div>
              </div>

              {reviewAction === 'approved' && (
                <div className="dept-modal-info approved">
                  <FaCheckCircle />
                  <p>You are about to approve this student's {config.label} clearance. This will notify the student immediately.</p>
                </div>
              )}

              {reviewAction === 'rejected' && (
                <div className="dept-modal-info rejected">
                  <FaExclamationTriangle />
                  <p>You are about to reject this clearance. Please provide a clear reason so the student knows what to fix.</p>
                </div>
              )}

              <div className="dept-modal-comment">
                <label>
                  {reviewAction === 'approved'
                    ? 'Add a comment (optional)'
                    : 'Reason for rejection (required)'}
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAction === 'approved'
                      ? 'e.g. All documents verified and in order.'
                      : 'e.g. Payment receipt is unclear. Please resubmit a clearer scan.'
                  }
                />
              </div>
            </div>

            <div className="dept-modal-footer">
              <button
                className="dept-modal-cancel"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button
                className={`dept-modal-submit ${reviewAction}`}
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <><div className="dept-btn-spinner" /> Submitting...</>
                ) : reviewAction === 'approved' ? (
                  <><FaCheck /> Confirm Approval</>
                ) : (
                  <><FaTimes /> Confirm Rejection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptOverview;
