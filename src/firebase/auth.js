// src/firebase/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-toastify';

// Register new user
export const registerUser = async (userData) => {
  try {
    const { 
      email, password, fullName, matricNumber, department, 
      phoneNumber, bursaryNumber, buthPhoneNumber, role, adminType  // ← added adminType
    } = userData;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const userDoc = {
      uid: user.uid,
      email: email,
      fullName: fullName,
      role: role || 'student',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (role === 'student' || !role) {
      userDoc.matricNumber = matricNumber;
      userDoc.department = department;
      userDoc.phoneNumber = phoneNumber;
      userDoc.bursaryNumber = bursaryNumber;
      userDoc.buthPhoneNumber = buthPhoneNumber;
      userDoc.level = '400 Level';
      userDoc.cgpa = '0.00';
      userDoc.clearanceStatus = {
        overall: 'not_started',
        bursary: 'not_started',
        hod: 'not_started',
        library: 'not_started',
        buth: 'not_started',
        security: 'not_started'
      };
      userDoc.completionPercentage = 0;
    }

    if (role === 'admin') {
      userDoc.adminType = adminType || 'super_admin';  // ← fixed
      userDoc.department = department;
      userDoc.phoneNumber = phoneNumber;
    }

    await setDoc(doc(db, 'users', user.uid), userDoc);

    return { success: true, user, data: userDoc };

  } catch (error) {
    toast.error(error.message || 'Failed to register. Please try again.');
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      return {
        success: true,
        user: user,
        data: userData
      };
    } else {
      toast.error('User data not found');
      return {
        success: false,
        error: 'User data not found'
      };
    }
  } catch (error) {
    // Provide user-friendly error messages
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    }

    toast.error(errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true
    };
  } catch (error) {
    toast.error(error.message || 'Failed to log out. Please try again.');
    return {
      success: false,
      error: error.message
    };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent!'
    };
  } catch (error) {
    let errorMessage = 'Failed to send reset email.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }

    toast.error(errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Get current user data
export const getCurrentUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return {
        success: true,
        data: userDocSnap.data()
      };
    } else {
      return {
        success: false,
        error: 'User data not found'
      };
    }
  } catch (error) {
    toast.error(error.message || 'Failed to load user data.');
    return {
      success: false,
      error: error.message
    };
  }
};
