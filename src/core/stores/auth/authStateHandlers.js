/**
 * Auth State Handlers Module
 *
 * Handles Firebase authentication lifecycle events.
 * Part of the auth state machine: uninitialized → initializing → authenticated|unauthenticated|error
 *
 * These handlers are called by Firebase's onAuthStateChanged listener
 * and manage the transition between auth states.
 */

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { _getUserFirmId, _getUserRole, _createSoloFirm, _initializeUserPreferences } from './authFirmSetup';

/**
 * Initialize Firebase auth listener
 *
 * Sets up onAuthStateChanged listener and returns unsubscribe function.
 * This is called once during auth initialization.
 *
 * @param {Object} store - Pinia store instance (this)
 * @returns {Function} Unsubscribe function
 */
export function _initializeFirebase(store) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        await _handleUserAuthenticated(store, firebaseUser);
      } else {
        await _handleUserUnauthenticated(store);
      }
    } catch (error) {
      console.error('[Auth] Error in auth state change handler', error);
      store.error = error.message;
      store.authState = 'error';
    }
  });
}

/**
 * Handle authenticated user
 *
 * Auth flow:
 * 1. Set user identity from Firebase Auth (single source of truth)
 * 2. Check for existing firm (one simple check)
 * 3. If no firm exists, create solo firm ONCE
 * 4. Initialize user preferences
 * 5. Update state to 'authenticated'
 *
 * @param {Object} store - Pinia store instance
 * @param {Object} firebaseUser - Firebase user object
 */
export async function _handleUserAuthenticated(store, firebaseUser) {
  try {
    // 1. Set user identity from Firebase Auth (single source of truth)
    store.user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      photoURL: firebaseUser.photoURL,
    };

    // 2. Check for existing firm (one simple check)
    const firmId = await _getUserFirmId(firebaseUser.uid);

    if (firmId) {
      // Existing user with firm
      store.firmId = firmId;
      store.userRole = await _getUserRole(firmId, firebaseUser.uid);
    } else {
      // New user - create solo firm ONCE
      await _createSoloFirm(firebaseUser);
      store.firmId = firebaseUser.uid;
      store.userRole = 'admin';
    }

    // 3. Initialize user preferences
    await _initializeUserPreferences(firebaseUser.uid);

    // 4. Update state
    store.authState = 'authenticated';
    store.error = null;
  } catch (error) {
    console.error('[Auth] Error handling authenticated user', error, { userId: firebaseUser?.uid });
    // Still authenticate even if firm setup fails
    store.authState = 'authenticated';
    store.firmId = firebaseUser.uid; // Fallback to userId
    store.userRole = 'admin'; // Fallback to admin
  }
}

/**
 * Handle unauthenticated user
 *
 * Clears all auth state and user preferences.
 * Transitions state machine to 'unauthenticated'.
 *
 * @param {Object} store - Pinia store instance
 */
export async function _handleUserUnauthenticated(store) {
  store.user = null;
  store.userRole = null;
  store.firmId = null;
  store.authState = 'unauthenticated';
  store.error = null;

  // Clear user preferences on logout
  try {
    const { useUserPreferencesStore } = await import('../userPreferences');
    const preferencesStore = useUserPreferencesStore();
    preferencesStore.clear();
  } catch (error) {
    console.error('[Auth] Error clearing preferences', error);
  }
}
