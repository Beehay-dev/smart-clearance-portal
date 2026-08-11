import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadDocument } from '../../../firebase/storage';
import { getOrCreateClearanceRequest, getStudentClearances, getClearanceDocuments } from '../../../firebase/firestore';
import { 
  FaCheckCircle, 
  FaClock, 
  FaExclamationCircle, 
  FaUpload, 
  FaFileAlt, 
  FaShieldAlt,
  FaIdCard,
  FaDownload,
  FaUserShield,
  FaClipboardCheck,
  FaPhone,
  FaEye
} from 'react-icons/fa';
import './security.css';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Security = () => {
  const { currentUser, userData } = useAuth();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
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

  useEffect(() => {
    loadSecurityClearance();
  }, [currentUser]);

  const loadSecurityClearance = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const result = await getStudentClearances(currentUser.uid);
      if (result.success) {
        const securityClearance = result.clearances.find(c => c.department === 'security');
        if (securityClearance) {
          setClearanceRequest(securityClearance);
          const docsResult = await getClearanceDocuments(securityClearance.id);
          if (docsResult.success) {
            setDocuments(docsResult.documents);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load your security clearance. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const studentData = {
    fullName: userData?.fullName || 'Student',
    matricNumber: userData?.matricNumber || 'N/A',
    department: userData?.department || 'N/A',
    clearanceStatus: clearanceRequest?.status || 'pending',
    lastUpdated: clearanceRequest?.updatedAt ? formatDate(clearanceRequest.updatedAt) : 'Not yet updated',
  };

  const idCardStatus = () => {
  if (!clearanceRequest) return 'not_started';
  if (clearanceRequest.status === 'approved') return 'completed';
  if (clearanceRequest.status === 'rejected') return 'not_started';
  if (clearanceRequest.status === 'pending' && documents.length > 0) return 'pending';
  return 'not_started';
};

  const panelCheckStatus = () => {
  if (!clearanceRequest) return 'not_started'; // ← key fix
  if (clearanceRequest.status === 'approved') return 'completed';
  if (clearanceRequest.status === 'rejected') return 'not_started';
  return 'pending';
};

  const securityRequirements = [
    {
      id: 1,
      title: 'Student ID Card Return',
      description: 'Upload proof of returning your official student identification card to the security office.',
      icon: <FaIdCard />,
      status: idCardStatus(),
      documents: documents.length,
      requiredDocs: 1,
      dueDate: 'Before graduation',
      canUpload: true,
    },
    {
      id: 2,
      title: 'Community Service / Panel Check',
      description: 'The security office will verify that you have no outstanding disciplinary cases, violations, or unserved punishments before approving your clearance.',
      icon: <FaClipboardCheck />,
      status: panelCheckStatus(),
      documents: 0,
      requiredDocs: 0,
      dueDate: 'Before graduation',
      canUpload: false,
    }
  ];

  const securityComments = clearanceRequest?.reviewComment ? [
    {
      id: 1,
      author: 'Security Admin',
      comment: clearanceRequest.reviewComment,
      timestamp: formatDate(clearanceRequest.reviewedAt),
      type: clearanceRequest.status === 'approved' ? 'success' : 'pending'
    }
  ] : [];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!currentUser) {
      toast.error('User not authenticated. Please refresh the page.');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const clearanceResult = await getOrCreateClearanceRequest(
        currentUser.uid,
        'security',
        {
          studentName: userData?.fullName,
          matricNumber: userData?.matricNumber,
          studentDepartment: userData?.department,
          description: 'Security clearance - Student ID card return and community service/panel check',
        }
      );

      if (!clearanceResult.success) {
        throw new Error('Failed to create or update clearance request');
      }

      const clearanceId = clearanceResult.clearanceId;

      const uploadPromises = selectedFiles.map(file =>
        uploadDocument(
          file,
          currentUser.uid,
          clearanceId,
          'security',
          (progress) => setUploadProgress(progress)
        )
      );

      const results = await Promise.all(uploadPromises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        await loadSecurityClearance();
      } else {
        toast.error('Some files failed to upload. Please try again.');
      }
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = (category) => {
    setUploadCategory(category);
    setShowUploadModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'status-pending', icon: <FaClock /> },
      approved: { label: 'Cleared', class: 'status-approved', icon: <FaCheckCircle /> },
      rejected: { label: 'Requires Action', class: 'status-rejected', icon: <FaExclamationCircle /> },
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <div className={`status-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  const getRequirementStatus = (status) => {
    const statusConfig = {
      completed: { icon: <FaCheckCircle />, class: 'req-completed' },
      pending: { icon: <FaClock />, class: 'req-pending' },
      not_started: { icon: <FaExclamationCircle />, class: 'req-not-started' },
    };
    return statusConfig[status] || statusConfig['not_started'];
  };

  const completedCount = securityRequirements.filter(r => r.status === 'completed').length;
  const totalCount = securityRequirements.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  if (loading) {
    return (
      <div className="security-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading security clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="security-page">

      <div className="page-header">
        <div>
          <h1>Security Clearance</h1>
          <p>Complete your ID card return and community service / panel check</p>
        </div>
        {getStatusBadge(studentData.clearanceStatus)}
      </div>

      <div className="security-overview">
        <div className="overview-card student-info-card">
          <div className="card-icon">
            <FaShieldAlt />
          </div>
          <div className="card-content">
            <span className="card-label">Student Information</span>
            <h2>{studentData.fullName}</h2>
            <div className="student-details">
              <div className="detail-item">
                <span className="detail-label">Matric Number:</span>
                <span className="detail-value">{studentData.matricNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{studentData.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Documents Uploaded:</span>
                <span className="detail-value">{documents.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{studentData.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card progress-card">
          <div className="progress-header">
            <FaClipboardCheck className="progress-icon" />
            <div>
              <h3>Security Clearance Progress</h3>
              <p>Track your security requirements status</p>
            </div>
          </div>
          <div className="progress-stats">
            <div className="stat-item">
              <div className="stat-number">{completedCount}/{totalCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="stat-item">
              <div className="stat-number">{progressPercent}%</div>
              <div className="stat-label">Progress</div>
            </div>
          </div>
        </div>
      </div>

      <div className="security-content">
        <div className="security-main">

          <div className="card requirements-card">
            <div className="card-header">
              <div>
                <h3><FaShieldAlt /> Security Requirements</h3>
                <p className="card-subtitle">Complete both requirements to receive security clearance</p>
              </div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress-container">
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
              </div>
            )}

            <div className="requirements-list">
              {securityRequirements.map((requirement) => {
                const statusConfig = getRequirementStatus(requirement.status);
                return (
                  <div key={requirement.id} className={`requirement-item ${statusConfig.class}`}>
                    <div className="req-left">
                      <div className="req-icon-wrapper">
                        {requirement.icon}
                      </div>
                      <div className="req-status-indicator">
                        {statusConfig.icon}
                      </div>
                      <div className="req-info">
                        <h4>{requirement.title}</h4>
                        <p className="req-description">{requirement.description}</p>
                        {requirement.canUpload ? (
                          <div className="req-meta">
                            <span className="docs-count">
                              {requirement.documents}/{requirement.requiredDocs} document
                            </span>
                            <span className="separator">•</span>
                            <span className="due-date">Due: {requirement.dueDate}</span>
                          </div>
                        ) : (
                          <div className="req-meta">
                            <span className="due-date">Verified by security officer • Due: {requirement.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="req-right">
                     {requirement.canUpload && clearanceRequest?.status !== 'approved' && (
                        <button
                          className="btn-upload-small"
                          onClick={() => openUploadModal(requirement.title)}
                        >
                          <FaUpload /> Upload
                        </button>
                      )}
                      {!requirement.canUpload && (
                        <span className="officer-check-badge">
                          <FaUserShield /> Officer Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {documents.length > 0 && (
            <div className="card documents-card">
              <div className="card-header">
                <div>
                  <h3><FaFileAlt /> Uploaded Documents</h3>
                  <p className="card-subtitle">Your security clearance documents</p>
                </div>
              </div>
              <div className="documents-list">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="doc-left">
                      <div className={`doc-icon ${doc.status}`}>
                        <FaFileAlt />
                      </div>
                      <div className="doc-info">
                        <h4>{doc.fileName}</h4>
                        <p className="doc-meta">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span className="separator">•</span>
                          <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="doc-right">
                      <span className={`doc-status ${doc.status}`}>
                        {doc.status === 'approved' ? (
                          <><FaCheckCircle /> Verified</>
                        ) : doc.status === 'rejected' ? (
                          <><FaExclamationCircle /> Rejected</>
                        ) : (
                          <><FaClock /> Pending</>
                        )}
                      </span>
                      <div className="doc-actions">
                        <Link to={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" title="View">
                          <FaEye />
                        </Link>
                        <Link to={doc.fileUrl} download className="btn-icon" title="Download">
                          <FaDownload />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && (
            <div className="card empty-state-card">
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <p>No documents uploaded yet. Upload your Student ID Card return receipt to get started.</p>
                <button className="btn-primary" onClick={() => openUploadModal('Student ID Card Return')}>
                  <FaUpload /> Upload ID Card Receipt
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="security-sidebar">

          <div className="card contact-card">
            <div className="card-header">
              <h3><FaUserShield /> Security Office</h3>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <strong>Chief Security Officer:</strong>
                <p>Mr. Emmanuel Okon</p>
              </div>
              <div className="contact-item">
                <strong>Location:</strong>
                <p>Main Gate Security Post</p>
              </div>
              <div className="contact-item">
                <strong>Phone:</strong>
                <p><FaPhone /> +234 809 876 5432</p>
              </div>
              <div className="contact-item">
                <strong>Email:</strong>
                <p>security@babcock.edu.ng</p>
              </div>
              <div className="contact-item">
                <strong>Working Hours:</strong>
                <p>24/7 Available</p>
              </div>
            </div>
          </div>

          {securityComments.length > 0 && (
            <div className="card comments-card">
              <div className="card-header">
                <h3>Security Feedback</h3>
              </div>
              <div className="comments-list">
                {securityComments.map((comment) => (
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

          <div className="card notice-card">
            <h4>⚠️ Important Notice</h4>
            <div className="notice-content">
              <p><strong>Property Return Deadline:</strong></p>
              <p>Your student ID card must be returned and your community service / panel check must be cleared.</p>
              <p>Any outstanding disciplinary cases or unserved punishments will result in clearance rejection.</p>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaUpload /> Upload Document — {uploadCategory}</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Upload your return receipt or proof of ID card submission for <strong>{uploadCategory}</strong>.
                Accepted formats: PDF, JPG, PNG (Max 10MB)
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
                  <><div className="btn-spinner"></div>Uploading...</>
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

export default Security;
