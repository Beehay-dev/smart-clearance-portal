import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaUpload, FaFileAlt, FaMoneyBillWave, FaHistory, FaClock, FaDownload, FaReceipt, FaTrash } from 'react-icons/fa';
import './bursary.css';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadDocument } from '../../../firebase/storage';
import { createClearanceRequest, getStudentClearances, getClearanceDocuments } from '../../../firebase/firestore';
import { toast } from 'react-toastify';

const Bursary = () => {
  const { currentUser, userData } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('receipt');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clearanceRequest, setClearanceRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load existing clearance request and documents
  useEffect(() => {
    loadBursaryClearance();
  }, [currentUser]);

    const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

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

  const loadBursaryClearance = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await getStudentClearances(currentUser.uid);
      
      if (result.success) {
        const bursaryClearance = result.clearances.find(c => c.department === 'bursary');
        
        if (bursaryClearance) {
          setClearanceRequest(bursaryClearance);
          
          const docsResult = await getClearanceDocuments(bursaryClearance.id);
          if (docsResult.success) {
            setDocuments(docsResult.documents);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load your bursary clearance. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock payment history - this would come from backend in real app
  const paymentHistory = [
    {
      id: 1,
      description: "Tuition Fee - 2024/2025",
      amount: 850000,
      date: "2024-09-15",
      receipt: "RCPT-2024-001",
      status: "verified"
    },
    {
      id: 2,
      description: "Acceptance Fee",
      amount: 50000,
      date: "2024-08-20",
      receipt: "RCPT-2024-002",
      status: "verified"
    }
  ];

  const adminComments = clearanceRequest?.reviewComment ? [
    {
      id: 1,
      author: "Bursary Admin",
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
  if (selectedFiles.length === 0 || !currentUser) {
    toast.error('Please select at least one file to upload');
    return;
  }

  setUploading(true);
  setUploadProgress(0);

  try {
    // Create clearance request if it doesn't exist
    let clearanceId = clearanceRequest?.id;
    
    if (!clearanceId) {
      const clearanceResult = await createClearanceRequest(
        currentUser.uid,
        'bursary',  // ✅ This is the clearance department
        {
          studentName: userData?.fullName,
          matricNumber: userData?.matricNumber,
          studentDepartment: userData?.department,  // ✅ Student's academic department
          description: 'Bursary payment clearance'
        }
      );

      if (clearanceResult.success) {
        clearanceId = clearanceResult.clearanceId;
      } else {
        throw new Error('Failed to create clearance request');
      }
    }

    // Upload each file
    const uploadPromises = selectedFiles.map(file =>
      uploadDocument(
        file,
        currentUser.uid,
        clearanceId,
        'bursary',
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
      
      // Reload clearance data
      await loadBursaryClearance();
    } else {
      toast.error('Some files failed to upload. Please try again.');
    }
  } catch (error) {
    toast.error(`An error occurred: ${error.message}`);
  } finally {
    setUploading(false);
  }
};

  const openUploadModal = (type) => {
    setUploadType(type);
    setShowUploadModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'status-pending', icon: <FaClock /> },
      approved: { label: 'Cleared', class: 'status-approved', icon: <FaCheckCircle /> },
      rejected: { label: 'Requires Action', class: 'status-rejected', icon: <FaExclamationCircle /> }
    };
    const config = statusConfig[status || 'pending'];
    return (
      <div className={`status-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bursary-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading bursary clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bursary-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Bursary Clearance</h1>
          <p>Manage your payment records and clearance status</p>
        </div>
        {getStatusBadge(clearanceRequest?.status)}
      </div>

      {/* Account Overview */}
      <div className="account-overview">
        <div className="overview-card balance-card">
          <div className="card-icon">
            <FaMoneyBillWave />
          </div>
          <div className="card-content">
            <span className="card-label">Account Balance</span>
            <h2 className="amount-cleared">
              {formatCurrency(0)}
            </h2>
            <p className="status-text success">✓ No outstanding balance</p>
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
            <span className="info-label">Bursary Account:</span>
            <span className="info-value">{userData?.bursaryNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Documents Uploaded:</span>
            <span className="info-value">{documents.length}</span>
          </div>
        </div>
      </div>

      <div className="bursary-content">
        {/* Left Section */}
        <div className="bursary-main">
          
          {/* Student Receipts - Primary Upload Section */}
          <div className="card receipts-card">
            <div className="card-header">
              <div>
                <h3><FaReceipt /> Payment Receipts</h3>
                <p className="card-subtitle">Upload your student receipts from the portal</p>
              </div>
              {(!clearanceRequest || clearanceRequest.status === 'pending' || clearanceRequest.status === 'rejected') && (
                <button className="btn-primary" onClick={() => openUploadModal('receipt')}>
                  <FaUpload /> Upload Receipt
                </button>
              )}
            </div>

            <div className="receipts-info-box">
              <p><strong>Important:</strong> Upload clear, legible copies of your payment receipts. Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
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

            <div className="receipts-list">
              {documents.map((doc) => (
                <div key={doc.id} className="receipt-item">
                  <div className="receipt-left">
                    <div className={`receipt-icon ${doc.status}`}>
                      <FaReceipt />
                    </div>
                    <div className="receipt-info">
                      <h4>{doc.fileName}</h4>
                      <div className="receipt-details">
                        <span className="receipt-number">
                          {formatDate(doc.uploadDate)}
                        </span>
                      </div>
                      <p className="receipt-meta">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="separator">•</span>
                        <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="receipt-right">
                    <span className={`receipt-status ${doc.status}`}>
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
                    <div className="receipt-actions">
                      <a 
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
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
                <FaReceipt className="empty-icon" />
                <p>No receipts uploaded yet</p>
                <button className="btn-primary" onClick={() => openUploadModal('receipt')}>
                  <FaUpload /> Upload Your First Receipt
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3><FaHistory /> Payment History</h3>
                <p className="card-subtitle">All verified transactions in your account</p>
              </div>
            </div>
            
            <div className="payment-list">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-left">
                    <div className="payment-icon verified">
                      <FaCheckCircle />
                    </div>
                    <div className="payment-info">
                      <h4>{payment.description}</h4>
                      <p className="payment-meta">
                        <span>{payment.date}</span>
                        <span className="separator">•</span>
                        <span>Receipt: {payment.receipt}</span>
                      </p>
                    </div>
                  </div>
                  <div className="payment-right">
                    <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                    <span className="payment-status verified">Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="bursary-sidebar">
          
          {/* Clearance Checklist */}
          <div className="card">
            <div className="card-header">
              <h3>Clearance Checklist</h3>
            </div>
            
            <div className="checklist">
              <div className={`checklist-item ${documents.length > 0 ? 'completed' : ''}`}>
                {documents.length > 0 ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>Payment receipts uploaded</span>
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
                <span>Admin verification</span>
              </div>
              <div className={`checklist-item ${clearanceRequest?.status === 'approved' ? 'completed' : ''}`}>
                {clearanceRequest?.status === 'approved' ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  <div className="check-icon empty"></div>
                )}
                <span>Final clearance approval</span>
              </div>
            </div>
          </div>

          {/* Admin Comments */}
          {adminComments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Admin Feedback</h3>
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
            <p>Contact the Bursary department for assistance with payments or clearance.</p>
            <div className="help-contacts">
              <p><strong>Email:</strong> bursary@babcock.edu.ng</p>
              <p><strong>Phone:</strong> +234 812 345 6789</p>
              <p><strong>Office:</strong> Admin Block, Room 205</p>
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
                <FaReceipt /> Upload Payment Receipt
              </h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                <strong>Upload your student receipt from the bank.</strong> Ensure the receipt clearly shows:
              </p>
              <ul className="requirements-list">
                <li>Your name and bursary account number</li>
                <li>Payment amount and date</li>
                <li>Receipt/transaction reference number</li>
                <li>Bank stamp or official marking</li>
              </ul>
              
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
                  <span className="upload-hint">PDF, JPG, PNG - Max 10MB per file</span>
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

export default Bursary;
