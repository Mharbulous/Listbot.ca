import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LogService } from './logService';

// Get current user
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); // Important: unsubscribe immediately after first call
        resolve(user);
      },
      reject
    );
  });
};

// Helper to fetch user role from Firestore
const getUserRole = async (userId) => {
  if (!userId) {
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data().role || null;
    }
    return null; // User document not found
  } catch (error) {
    LogService.error('Error fetching user role', error, { userId });
    throw error; // Re-throw to be handled by the caller
  }
};

// Sign in with email and password
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    return firebaseUser;
  } catch (error) {
    LogService.error('Firebase sign-in error', error, { email });
    throw error;
  }
};

// Sign out the current user
const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    // The onAuthStateChanged listener in useAuth will handle clearing the state
  } catch (error) {
    LogService.error('Firebase sign-out error', error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const authService = {
  signIn,
  signOut,
  getCurrentUser,
  getUserRole,
};
