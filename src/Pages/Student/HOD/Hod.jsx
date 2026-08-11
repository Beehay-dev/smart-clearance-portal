import React, { useState, useEffect } from 'react';
import { 
  FaUserTie, 
  FaCheckCircle, 
  FaClock, 
  FaUpload, 
  FaEye, 
  FaDownload, 
  FaExclamationTriangle,
  FaFileAlt 
} from 'react-icons/fa';
import './hod.css';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadDocument } from '../../../firebase/storage';
import { createClearanceRequest, getStudentClearances, getClearanceDocuments } from '../../../firebase/firestore';
import { toast } from 'react-toastify';

const Hod = () => {
  const { currentUser, userData } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clearanceRequest, setClearanceRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper functions
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

  // Load existing clearance
  useEffect(() => {
    loadHodClearance();
  }, [currentUser]);

  const loadHodClearance = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await getStudentClearances(currentUser.uid);
      
      if (result.success) {
        const hodClearance = result.clearances.find(c => c.department === 'hod');
        
        if (hodClearance) {
          setClearanceRequest(hodClearance);
          
          
          const docsResult = await getClearanceDocuments(currentUser.uid, hodClearance.id);
          if (docsResult.success) {
            setDocuments(docsResult.documents);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load your HOD clearance. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
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
          'hod',
          {
            studentName: userData?.fullName,
            matricNumber: userData?.matricNumber,
            studentDepartment: userData?.department,
            description: 'HOD academic clearance',
            level: userData?.level || '400 Level',
            cgpa: userData?.cgpa || '0.00'
          }
        );

        if (clearanceResult.success) {
          clearanceId = clearanceResult.clearanceId;
        } else {
          throw new Error('Failed to create clearance request');
        }
      }

      const uploadPromises = selectedFiles.map(file =>
        uploadDocument(
          file,
          currentUser.uid,
          clearanceId,
          'hod',
          (progress) => {
            setUploadProgress(progress);
          }
        )
      );

      const results = await Promise.all(uploadPromises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        await loadHodClearance();
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
      author: "HOD Admin",
      comment: clearanceRequest.reviewComment,
      timestamp: formatDate(clearanceRequest.reviewedAt),
      type: clearanceRequest.status === 'approved' ? 'success' : 'pending'
    }
  ] : [];

  if (loading) {
    return (
      <div className="hod-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading HOD clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hod-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><FaUserTie /> HOD Clearance</h1>
          <p>Submit your academic clearance documents</p>
        </div>
        {getStatusBadge(clearanceRequest?.status)}
      </div>

      {/* Academic Overview */}
      <div className="academic-overview">
        <div className="overview-card">
          <div className="card-icon academic">
            <FaUserTie />
          </div>
          <div className="card-content">
            <span className="card-label">Academic Status</span>
            <h2>{clearanceRequest?.status === 'approved' ? 'Cleared' : 'Pending'}</h2>
            <p className="status-text">
              {clearanceRequest?.status === 'approved' 
                ? '✓ All requirements met' 
                : 'Upload required documents'}
            </p>
          </div>
        </div>

        <div className="overview-card info-card">
          <div className="info-row">
            <span className="info-label">Student Name:</span>
            <span className="info-value">{userData?.fullName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Matric Number:</span>
            <span className="info-value">{userData?.matricNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Department:</span>
            <span className="info-value">{userData?.department || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Documents Uploaded:</span>
            <span className="info-value">{documents.length}</span>
          </div>
        </div>
      </div>

      <div className="hod-content">
        {/* Main Section */}
        <div className="hod-main">
          {/* Documents Upload */}
          <div className="card documents-card">
            <div className="card-header">
              <div>
                <h3><FaFileAlt /> Academic Documents</h3>
                <p className="card-subtitle">Upload project reports, certificates, and other academic documents</p>
              </div>
              {(!clearanceRequest || clearanceRequest.status === 'pending' || clearanceRequest.status === 'rejected') && (
                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                  <FaUpload /> Upload Document
                </button>
              )}
            </div>

            <div className="info-box">
              <p><strong>Required Documents:</strong> Final Year Project Report, Defense Certificate, Course Registration Form, Lab Clearance, Academic Records</p>
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
                        <>
                          <FaCheckCircle /> Verified
                        </>
                      ) : (
                        <>
                          <FaClock /> Pending
                        </>
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

            {documents.length === 0 && (
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <p>No documents uploaded yet</p>
                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                  <FaUpload /> Upload Your First Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hod-sidebar">
          {/* Requirements Checklist */}
          <div className="card">
            <div className="card-header">
              <h3>Requirements Checklist</h3>
            </div>
            
            <div className="checklist">
              <div className={`checklist-item ${documents.length > 0 ? 'completed' : ''}`}>
                {documents.length > 0 ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>Documents uploaded</span>
              </div>
              <div className={`checklist-item ${clearanceRequest ? 'completed' : ''}`}>
                {clearanceRequest ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>Clearance request submitted</span>
              </div>
              <div className={`checklist-item ${clearanceRequest?.status === 'approved' ? 'completed' : clearanceRequest?.status === 'pending' ? 'pending' : ''}`}>
                {clearanceRequest?.status === 'approved' ? (
                  <FaCheckCircle className="check-icon" />
                ) : clearanceRequest?.status === 'pending' ? (
                  <FaClock className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>HOD verification</span>
              </div>
              <div className={`checklist-item ${clearanceRequest?.status === 'approved' ? 'completed' : ''}`}>
                {clearanceRequest?.status === 'approved' ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>Final approval</span>
              </div>
            </div>
          </div>

          {/* Admin Comments */}
          {adminComments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>HOD Feedback</h3>
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

          {/* Help Section */}
          <div className="card help-card">
            <h4>Need Help?</h4>
            <p>Contact your Head of Department for assistance.</p>
            <div className="help-contacts">
              <p><strong>Email:</strong> hod@babcock.edu.ng</p>
              <p><strong>Office:</strong> Department Building</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaFileAlt /> Upload Academic Document
              </h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Upload your academic clearance documents including project reports, certificates, and forms.
              </p>
              
              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="file-upload" className="upload-label">
                  <FaUpload />
                  <span>Click to browse or drag files here</span>
                  <span className="upload-hint">PDF, JPG, PNG, DOC - Max 10MB per file</span>
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
                  <>
                    <div className="btn-spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload /> Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
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

export default Hod;
