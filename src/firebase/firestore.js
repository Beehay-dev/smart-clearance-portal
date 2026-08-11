// src/firebase/firestore.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

// ============================================
// CLEARANCES FUNCTIONS
// ============================================

/**
 * Create a new clearance request for a student
 */
export const createClearanceRequest = async (studentId, department, data) => {
  try {
    const clearanceRef = await addDoc(collection(db, 'clearances'), {
      ...data,
      // These fields are spread AFTER data on purpose — they must always
      // win over anything a caller passes in, so a crafted `data` object
      // can never set its own studentId/department/status.
      studentId: studentId,
      department: department, // 'bursary', 'hod', 'library', 'buth', 'security'
      status: 'pending', // 'pending', 'approved', 'rejected'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      clearanceId: clearanceRef.id
    };
  } catch (error) {
    toast.error(error.message || 'Failed to create clearance request.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all clearances for a specific student
 */
export const getStudentClearances = async (studentId) => {
  try {
    const q = query(
      collection(db, 'clearances'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const allClearances = [];

    querySnapshot.forEach((doc) => {
      allClearances.push({ id: doc.id, ...doc.data() });
    });

    // Keep only the LATEST record per department
    const latestByDepartment = {};
    allClearances.forEach((clearance) => {
      if (!latestByDepartment[clearance.department]) {
        latestByDepartment[clearance.department] = clearance;
      }
    });

    return {
      success: true,
      clearances: Object.values(latestByDepartment)
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load clearances.');
    return { success: false, error: error.message };
  }
};

/**
 * Get all clearances for a specific department (for admin review)
 */
export const getDepartmentClearances = async (department, status = null) => {
  try {
    let q;
    
    if (status) {
      q = query(
        collection(db, 'clearances'),
        where('department', '==', department),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'clearances'),
        where('department', '==', department),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const clearances = [];
    
    querySnapshot.forEach((doc) => {
      clearances.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      clearances: clearances
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load department clearances.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Pure helper: computes the new clearanceStatus/completionPercentage for a
 * user given a department update. Does NOT write anything — lets callers
 * batch the write together with other writes atomically.
 */
const computeUpdatedClearanceStatus = (currentStatus, department, status) => {
  const base = currentStatus || {
    overall: 'not_started',
    bursary: 'not_started',
    hod: 'not_started',
    library: 'not_started',
    buth: 'not_started',
    security: 'not_started'
  };

  const updated = { ...base, [department]: status };

  const departments = ['bursary', 'hod', 'library', 'buth', 'security'];
  const approvedCount = departments.filter(dept => updated[dept] === 'approved').length;
  const completionPercentage = Math.round((approvedCount / departments.length) * 100);

  let overallStatus = 'in_progress';
  if (approvedCount === departments.length) {
    overallStatus = 'completed';
  } else if (approvedCount === 0) {
    overallStatus = 'not_started';
  } else if (departments.some(dept => updated[dept] === 'rejected')) {
    overallStatus = 'rejected';
  }
  updated.overall = overallStatus;

  return { clearanceStatus: updated, completionPercentage };
};

/**
 * Update clearance status (approve/reject).
 * Uses a writeBatch so the clearance doc and the user's profile doc update
 * atomically — either both succeed or neither does, so they can't drift
 * out of sync if the connection drops mid-write.
 */
export const updateClearanceStatus = async (clearanceId, status, comment, reviewedBy) => {
  try {
    const clearanceRef = doc(db, 'clearances', clearanceId);
    const clearanceSnap = await getDoc(clearanceRef);
    if (!clearanceSnap.exists()) {
      toast.error('Clearance not found');
      return { success: false, error: 'Clearance not found' };
    }
    const { studentId, department } = clearanceSnap.data();

    const userRef = doc(db, 'users', studentId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      toast.error('Student profile not found');
      return { success: false, error: 'Student profile not found' };
    }

    const { clearanceStatus, completionPercentage } = computeUpdatedClearanceStatus(
      userSnap.data().clearanceStatus,
      department,
      status
    );

    const batch = writeBatch(db);
    batch.update(clearanceRef, {
      status,
      reviewComment: comment,
      reviewedBy,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.update(userRef, {
      clearanceStatus,
      completionPercentage,
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    return { success: true, clearanceStatus, completionPercentage };
  } catch (error) {
    toast.error(error.message || 'Failed to update clearance status.');
    return { success: false, error: error.message };
  }
};

// ============================================
// DOCUMENTS FUNCTIONS
// ============================================

/**
 * Save document metadata to Firestore
 */
export const saveDocumentMetadata = async (studentId, clearanceId, documentData) => {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      studentId: studentId,
      clearanceId: clearanceId,
      fileName: documentData.fileName,
      fileUrl: documentData.fileUrl,
      fileSize: documentData.fileSize,
      fileType: documentData.fileType,
      // Previously dropped — needed so deleteDocument() can find the file
      // later, and so Firestore rules can scope /documents reads/writes
      // by department without an extra lookup on the parent clearance.
      storagePath: documentData.storagePath,
      department: documentData.department,
      uploadDate: serverTimestamp(),
      status: 'pending', // 'pending', 'approved', 'rejected'
    });

    return {
      success: true,
      documentId: docRef.id
    };
  } catch (error) {
    toast.error(error.message || 'Failed to save document.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all documents for a clearance, scoped to the owning student.
 * studentId is required (not just clearanceId) so the Firestore query has
 * a direct equality filter matching what the security rule checks
 * (resource.data.studentId == request.auth.uid) — without it, Firestore
 * can't prove the rule holds for the whole result set and rejects the
 * entire query, even for the student who actually owns the documents.
 */
export const getClearanceDocuments = async (studentId, clearanceId) => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('studentId', '==', studentId),
      where('clearanceId', '==', clearanceId),
      orderBy('uploadDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      documents: documents
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load documents.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all documents for a student
 */
export const getStudentDocuments = async (studentId) => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('studentId', '==', studentId),
      orderBy('uploadDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      documents: documents
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load your documents.');
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// NOTIFICATIONS FUNCTIONS
// ============================================

/**
 * Create a notification
 */
export const createNotification = async (userId, notificationData) => {
  try {
    const notifRef = await addDoc(collection(db, 'notifications'), {
      userId: userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info', // 'success', 'warning', 'info', 'error'
      read: false,
      createdAt: serverTimestamp()
    });

    return {
      success: true,
      notificationId: notifRef.id
    };
  } catch (error) {
    // Silent by default — notification creation is usually a side-effect of
    // another action; surfacing this toast could confuse the user about
    // what actually failed. Uncomment if you want it visible.
    // toast.error(error.message || 'Failed to create notification.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      notifications: notifications
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load notifications.');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notifRef, {
      read: true
    });

    return {
      success: true
    };
  } catch (error) {
    // Silent — a failed "mark as read" isn't worth interrupting the user.
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));

    return {
      success: true
    };
  } catch (error) {
    toast.error(error.message || 'Failed to delete notification.');
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// STUDENT PROFILE FUNCTIONS
// ============================================

/**
 * Update student clearance status in user profile
 * NOTE: this is an internal helper called by updateClearanceStatus and
 * getOrCreateClearanceRequest — deliberately does NOT toast, so the caller's
 * toast is the only one the user sees.
 */
export const updateStudentClearanceStatus = async (userId, department, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const currentStatus = userDoc.data().clearanceStatus || {
      overall: 'not_started',
      bursary: 'not_started',
      hod: 'not_started',
      library: 'not_started',
      buth: 'not_started',
      security: 'not_started'
    };

    // Update the specific department status
    currentStatus[department] = status;

    // Calculate overall completion
    const departments = ['bursary', 'hod', 'library', 'buth', 'security'];
    const approvedCount = departments.filter(dept => currentStatus[dept] === 'approved').length;
    const completionPercentage = Math.round((approvedCount / departments.length) * 100);

    // Determine overall status
    let overallStatus = 'in_progress';
    if (approvedCount === departments.length) {
      overallStatus = 'completed';
    } else if (approvedCount === 0) {
      overallStatus = 'not_started';
    } else if (departments.some(dept => currentStatus[dept] === 'rejected')) {
      overallStatus = 'rejected';
    }

    currentStatus.overall = overallStatus;

    // Update user document
    await updateDoc(userRef, {
      clearanceStatus: currentStatus,
      completionPercentage: completionPercentage,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      clearanceStatus: currentStatus,
      completionPercentage: completionPercentage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get student profile with clearance status
 */
export const getStudentProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      toast.error('User not found');
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      data: userDoc.data()
    };
  } catch (error) {
    toast.error(error.message || 'Failed to load profile.');
    return {
      success: false,
      error: error.message
    };
  }
};

export const getOrCreateClearanceRequest = async (studentId, department, data) => {
  try {
    const q = query(
      collection(db, 'clearances'),
      where('studentId', '==', studentId),
      where('department', '==', department)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Already exists — reset it to pending for re-review.
      // Batched so the clearance reset and the user profile reset happen
      // atomically together.
      const existingId = snapshot.docs[0].id;
      const clearanceRef = doc(db, 'clearances', existingId);
      const userRef = doc(db, 'users', studentId);

      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        toast.error('Student profile not found');
        return { success: false, error: 'Student profile not found' };
      }

      const { clearanceStatus, completionPercentage } = computeUpdatedClearanceStatus(
        userSnap.data().clearanceStatus,
        department,
        'pending'
      );

      const batch = writeBatch(db);
      batch.update(clearanceRef, {
        ...data,
        // Spread first, protected fields set after — same rule as
        // createClearanceRequest: a re-submit payload must never be able
        // to smuggle its own status/reviewedBy/reviewComment through.
        status: 'pending',
        reviewComment: null,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: serverTimestamp()
      });
      batch.update(userRef, {
        clearanceStatus,
        completionPercentage,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      return { success: true, clearanceId: existingId };
    }

    // None exists, create fresh
    return await createClearanceRequest(studentId, department, data);
  } catch (error) {
    toast.error(error.message || 'Failed to submit clearance request.');
    return { success: false, error: error.message };
  }
};
