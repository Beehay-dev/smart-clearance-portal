import React, { useState, useEffect } from 'react';
import { 
  FaBook, 
  FaCheckCircle, 
  FaClock, 
  FaUpload, 
  FaEye, 
  FaDownload, 
  FaExclamationTriangle,
  FaFileAlt,
  FaUser,
  FaIdCard,
  FaBuilding
} from 'react-icons/fa';
import './library.css';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadDocument } from '../../../firebase/storage';
import { createClearanceRequest, getStudentClearances, getClearanceDocuments } from '../../../firebase/firestore';
import { toast } from 'react-toastify';

// Keep in sync with whatever Firebase Storage rules actually enforce —
// this is a UX convenience, not the real security boundary. Matches the
// same constants used in Bursary.jsx for consistency.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const Library = () => {
  const { currentUser, userData } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clearanceRequest, setClearanceRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'status-pending', icon: <FaClock /> },
      approved: { label: 'Cleared', class: 'status-approved', icon: <FaCheckCircle /> },
      rejected: { label: 'Requires Action', class: 'status-rejected', icon: <FaExclamationTriangle /> }
    };
    const config = statusConfig[status || 'pending'];
    return (
      <div className={`status-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  useEffect(() => {
    loadLibraryClearance();
  }, [currentUser]);

  const loadLibraryClearance = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const result = await getStudentClearances(currentUser.uid);
      if (result.success) {
        const libraryClearance = result.clearances.find(c => c.department === 'library');
        if (libraryClearance) {
          setClearanceRequest(libraryClearance);
          const docsResult = await getClearanceDocuments(libraryClearance.id);
          if (docsResult.success) {
            setDocuments(docsResult.documents);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load your library clearance. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validates each picked file against size + MIME type, matching the
  // same check in Bursary.jsx. Rejected files are dropped from the
  // selection with a toast explaining why, instead of silently failing
  // later during upload.
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" is larger than 10MB and was not added.`);
        continue;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported file type (PDF, JPG, PNG only).`);
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !currentUser) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let clearanceId = clearanceRequest?.id;

      if (!clearanceId) {
        const clearanceResult = await createClearanceRequest(
          currentUser.uid,
          'library',
          {
            studentName: userData?.fullName,
            matricNumber: userData?.matricNumber,
            studentDepartment: userData?.department,
            description: 'Library clearance - Book returns and fines',
            level: userData?.level || '400 Level'
          }
        );
        if (clearanceResult.success) {
          clearanceId = clearanceResult.clearanceId;
        } else {
          throw new Error('Failed to create clearance request');
        }
      }

      const uploadPromises = selectedFiles.map(file =>
        uploadDocument(file, currentUser.uid, clearanceId, 'library', (progress) => {
          setUploadProgress(progress);
        })
      );

      const results = await Promise.all(uploadPromises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        await loadLibraryClearance();
      } else {
        toast.error('Some files failed to upload. Please try again.');
      }
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const adminComments = clearanceRequest?.reviewComment ? [
    {
      id: 1,
      author: 'Library Admin',
      comment: clearanceRequest.reviewComment,
      timestamp: formatDate(clearanceRequest.reviewedAt),
      type: clearanceRequest.status === 'approved' ? 'success' : 'warning'
    }
  ] : [];

  if (loading) {
    return (
      <div className="library-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading library clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><FaBook /> Library Clearance</h1>
          <p>Ensure all borrowed books are returned and fines are cleared</p>
        </div>
        {getStatusBadge(clearanceRequest?.status)}
      </div>

      {/* Overview Cards */}
      <div className="library-overview">

        {/* Library Status Card */}
        <div className="overview-card library-info-card">
          <div className="card-icon library">
            <FaBook />
          </div>
          <div className="card-content">
            <span className="card-label">Library Status</span>
            <h2>{clearanceRequest?.status === 'approved' ? 'Cleared' : 'Pending'}</h2>
            <div className="library-details">
              <div className="detail-row">
                <span className={`status-text ${clearanceRequest?.status === 'approved' ? 'success' : ''}`}>
                  {clearanceRequest?.status === 'approved'
                    ? '✓ All books returned, no outstanding fines'
                    : 'Submit your clearance documents to proceed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="overview-card">
          <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Student Information</h3>
          </div>
          <div className="library-details">
            <div className="detail-row">
              <FaUser className="detail-icon" />
              <span className="detail-label">Name:</span>
              <span className="detail-value">{userData?.fullName || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <FaIdCard className="detail-icon" />
              <span className="detail-label">Matric No:</span>
              <span className="detail-value">{userData?.matricNumber || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <FaBuilding className="detail-icon" />
              <span className="detail-label">Department:</span>
              <span className="detail-value">{userData?.department || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <FaFileAlt className="detail-icon" />
              <span className="detail-label">Documents:</span>
              <span className="detail-value">{documents.length} Uploaded</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="overview-card stats-card">
          <h3>Clearance Progress</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className={`stat-icon ${documents.length > 0 ? 'success' : 'warning'}`}>
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <span className="stat-number">{documents.length}</span>
                <span className="stat-label">Documents</span>
              </div>
            </div>
            <div className="stat-box">
              <div className={`stat-icon ${clearanceRequest?.status === 'approved' ? 'success' : 'warning'}`}>
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <span className="stat-number">
                  {clearanceRequest?.status === 'approved' ? '100%' : documents.length > 0 ? '50%' : '0%'}
                </span>
                <span className="stat-label">Complete</span>
              </div>
            </div>
            <div className="stat-box">
              <div className={`stat-icon ${clearanceRequest?.status === 'approved' ? 'success' : 'paid'}`}>
                <FaClock />
              </div>
              <div className="stat-content">
                <span className="stat-number" style={{ fontSize: '0.95rem' }}>
                  {clearanceRequest?.status === 'approved' ? 'Done' : clearanceRequest ? 'Review' : 'Start'}
                </span>
                <span className="stat-label">Status</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="library-content">
        {/* Main Section */}
        <div className="library-main">

          {/* Documents Card */}
          <div className="card documents-card">
            <div className="card-header">
              <div>
                <h3> Library Clearance Documents</h3>
                {/* <p className="card-subtitle">Upload proof of book returns and fine payments</p> */}
              </div>
              {(!clearanceRequest || clearanceRequest.status !== 'approved') && (
                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                  <FaUpload /> Upload Document
                </button>
              )}
            </div>

            <div className="info-box" style={{
              padding: '0.875rem 1rem',
              background: 'var(--primary-gold-light)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary-gold)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--text-charcoal)',
              lineHeight: '1.5'
            }}>
              <strong>Required:</strong> Library clearance slip, proof of no outstanding books, fine payment receipts (if applicable)
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress-container">
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
              </div>
            )}

            {documents.length > 0 ? (
              <div className="documents-list">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="doc-left">
                      <div className={`doc-icon ${doc.status === 'approved' ? 'doc-verified' : 'doc-pending'}`}>
                        <FaFileAlt />
                      </div>
                      <div className="doc-info">
                        <span className="doc-type">
                          {doc.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                        </span>
                        <h4>{doc.fileName}</h4>
                        <p className="doc-meta">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span className="separator">•</span>
                          <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="doc-right">
                      <span className={`doc-status ${doc.status === 'approved' ? 'verified' : 'pending'}`}>
                        {doc.status === 'approved' ? (
                          <><FaCheckCircle /> Verified</>
                        ) : (
                          <><FaClock /> Pending</>
                        )}
                      </span>
                      <div className="doc-actions">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          title="View"
                        >
                          <FaEye />
                        </a>
                        <a
                          href={doc.fileUrl}
                          download
                          className="btn-icon"
                          title="Download"
                        >
                          <FaDownload />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <p>No documents uploaded yet</p>
                <br />
                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                  <FaUpload /> Upload Your First Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="library-sidebar">

          {/* Requirements Checklist */}
          <div className="card">
            <div className="card-header">
              <h3>Requirements Checklist</h3>
            </div>
            <div className="checklist">
              <div className={`checklist-item ${documents.length > 0 ? 'completed' : ''}`}>
                {documents.length > 0
                  ? <FaCheckCircle className="check-icon" />
                  : <div className="check-icon empty" />}
                <span>All books returned</span>
              </div>
              <div className={`checklist-item ${documents.length > 0 ? 'completed' : ''}`}>
                {documents.length > 0
                  ? <FaCheckCircle className="check-icon" />
                  : <div className="check-icon empty" />}
                <span>Fines cleared (if any)</span>
              </div>
              <div className={`checklist-item ${
                clearanceRequest?.status === 'approved' ? 'completed' :
                clearanceRequest?.status === 'pending' ? 'pending' : ''
              }`}>
                {clearanceRequest?.status === 'approved'
                  ? <FaCheckCircle className="check-icon" />
                  : clearanceRequest?.status === 'pending'
                  ? <FaClock className="check-icon" />
                  : <div className="check-icon empty" />}
                <span>Library verification</span>
              </div>
              <div className={`checklist-item ${clearanceRequest?.status === 'approved' ? 'completed' : ''}`}>
                {clearanceRequest?.status === 'approved'
                  ? <FaCheckCircle className="check-icon" />
                  : <div className="check-icon empty" />}
                <span>Clearance approved</span>
              </div>
            </div>
          </div>

          {/* Admin Comments */}
          {adminComments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Library Feedback</h3>
              </div>
              <div className="comments-list">
                {adminComments.map((comment) => (
                  <div key={comment.id} className={`comment-item comment-${comment.type}`}>
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-time">{comment.timestamp}</span>
                    </div>
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Card */}
          <div className="card contact-card">
            <h4>Need Help?</h4>
            <div className="contact-info">
              <p>Contact the library for assistance with book returns or fines.</p>
            </div>
            <div className="contact-info">
              <p><strong>Email:</strong> library@babcock.edu.ng</p>
              <p><strong>Phone:</strong> +234 812 345 6790</p>
              <p><strong>Location:</strong> Main Library Building</p>
            </div>
          </div>

        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaFileAlt /> Upload Library Clearance Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Upload your library clearance slip or proof of book returns and fine payments.
              </p>

              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="file-upload" className="upload-label">
                  <FaUpload />
                  <span>Click to browse or drag files here</span>
                  <span className="upload-hint">PDF, JPG, PNG — Max 10MB per file</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>
                        <FaFileAlt className="file-icon" />
                        <span>{file.name}</span>
                        <span className="file-size">({Math.round(file.size / 1024)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploading}
              >
                {uploading ? (
                  <><div className="btn-spinner"></div> Uploading...</>
                ) : (
                  <><FaUpload /> Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
