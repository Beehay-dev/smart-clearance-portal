import React, { useState } from 'react';
import { FaUpload, FaFile, FaTimes, FaCheckCircle } from 'react-icons/fa';
import './fileUpload.css';

const FileUpload = ({ onFileSelect, accept, maxSize = 10, department }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file) => {
    // Check if file exists
    if (!file) {
      setError('Please select a file');
      return false;
    }

    // Check file size (in MB)
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const allowedTypes = accept || '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = allowedTypes.split(',').map(ext => ext.replace('.', '').trim());
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Only ${allowedTypes} files are allowed`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    onFileSelect(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      {!selectedFile ? (
        <div
          className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            className="file-input"
            onChange={handleFileChange}
            accept={accept}
          />
          <label htmlFor="file-input" className="file-upload-label">
            <FaUpload className="upload-icon" />
            <div className="upload-text">
              <p className="upload-title">Drop your file here or click to browse</p>
              <p className="upload-subtitle">
                {accept || 'PDF, JPG, PNG, DOC'} • Max {maxSize}MB
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="file-selected">
          <FaFile className="file-icon" />
          <div className="file-info">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <FaCheckCircle className="success-icon" />
          <button className="remove-file-btn" onClick={handleRemoveFile}>
            <FaTimes />
          </button>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default FileUpload;