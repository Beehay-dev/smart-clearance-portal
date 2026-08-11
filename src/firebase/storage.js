// src/firebase/storage.js
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { saveDocumentMetadata } from './firestore';
import { toast } from 'react-toastify';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} studentId - The student's user ID
 * @param {string} clearanceId - The clearance request ID
 * @param {string} department - Department name (bursary, hod, library, buth, security)
 * @param {function} onProgress - Callback for upload progress (optional)
 */
export const uploadDocument = async (file, studentId, clearanceId, department, onProgress) => {
  try {
    // Validate file
    if (!file) {
      toast.error('No file provided');
      return {
        success: false,
        error: 'No file provided'
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit');
      return {
        success: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, JPG, PNG, and DOC files are allowed.');
      return {
        success: false,
        error: 'Invalid file type. Only PDF, JPG, PNG, and DOC files are allowed.'
      };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Create storage path: departments/{department}/{studentId}/{fileName}
    const storagePath = `departments/${department}/${studentId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle error
          toast.error(error.message || 'Upload failed.');
          reject({
            success: false,
            error: error.message
          });
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save document metadata to Firestore
            const metadataResult = await saveDocumentMetadata(studentId, clearanceId, {
              fileName: file.name,
              fileUrl: downloadURL,
              fileSize: file.size,
              fileType: file.type,
              storagePath: storagePath,
              department: department
            });

            if (metadataResult.success) {
              resolve({
                success: true,
                downloadURL: downloadURL,
                documentId: metadataResult.documentId,
                fileName: file.name
              });
            } else {
              // File is already uploaded to Storage at this point, but its
              // metadata failed to save — clean it up so it doesn't become
              // an orphaned, untracked file with no Firestore record.
              try {
                await deleteObject(storageRef);
              } catch (cleanupError) {
                // Cleanup failed too — log for manual removal later.
                console.error('Failed to clean up orphaned upload:', cleanupError);
              }
              toast.error('Failed to save document metadata');
              reject({
                success: false,
                error: 'Failed to save document metadata'
              });
            }
          } catch (error) {
            toast.error(error.message || 'Upload failed.');
            reject({
              success: false,
              error: error.message
            });
          }
        }
      );
    });
  } catch (error) {
    toast.error(error.message || 'Upload failed.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} storagePath - The path to the file in storage
 */
export const deleteDocument = async (storagePath) => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    return {
      success: true
    };
  } catch (error) {
    toast.error(error.message || 'Failed to delete document.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  return '📎';
};
