/**
 * Auth Store - Core Pinia Store
 *
 * Main entry point for authentication state management.
 * Implements the auth state machine: uninitialized → initializing → authenticated|unauthenticated|error
 *
 * Architecture:
 * - Composed from authFirmSetup and authStateHandlers modules
 * - State machine ensures proper initialization before auth checks
 * - Solo Firm architecture: firmId === userId for solo users
 *
 * Usage:
 * ```js
 * const authStore = useAuthStore()
 * await authStore.initialize()
 * if (authStore.isAuthenticated) { ... }
 * ```
 */

import { defineStore } from 'pinia';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';
import { _initializeFirebase } from './authStateHandlers';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Explicit auth states for the state machine
    authState: 'uninitialized', // uninitialized -> initializing -> authenticated | unauthenticated | error
    user: null,
    userRole: null,
    firmId: null,
    error: null,

    // Internal tracking
    _unsubscribe: null,
    _initialized: false,
  }),

  getters: {
    // State machine status getters
    isUninitialized: (state) => state.authState === 'uninitialized',
    isInitializing: (state) => state.authState === 'initializing',
    isAuthenticated: (state) => state.authState === 'authenticated',
    isUnauthenticated: (state) => state.authState === 'unauthenticated',
    isError: (state) => state.authState === 'error',
    isInitialized: (state) =>
      state.authState !== 'uninitialized' && state.authState !== 'initializing',

    // User display getters
    userDisplayName: (state) => {
      if (!state.user) return null;
      return state.user.displayName || state.user.email?.split('@')[0] || 'User';
    },

    // Firm getters
    currentFirm: (state) => state.firmId,

    userInitials: (state) => {
      if (!state.user) return 'loading';

      let name = state.user.displayName || state.user.email || 'User';

      // If it's an email, use the part before @
      if (name.includes('@')) {
        name = name.split('@')[0];
      }

      // Get initials from full name (first + last)
      const words = name.trim().split(/\s+/);

      if (words.length >= 2) {
        // Use first letter of first word + first letter of last word
        const firstInitial = words[0].charAt(0);
        const lastInitial = words[words.length - 1].charAt(0);
        return (firstInitial + lastInitial).toUpperCase();
      } else {
        // Single word - use first two characters
        const firstName = words[0] || name;
        return firstName.substring(0, 2).toUpperCase();
      }
    },
  },

  actions: {
    /**
     * Initialize the auth system
     *
     * Sets up Firebase persistence and auth listener.
     * Must be called once at app startup.
     */
    async initialize() {
      if (this._initialized) {
        return;
      }

      this._initialized = true;
      this.authState = 'initializing';
      this.error = null;

      // Enable cross-domain persistence for SSO
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error('[Auth] Failed to set auth persistence', error);
      }

      // Initialize Firebase listener (imported from authStateHandlers)
      this._unsubscribe = _initializeFirebase(this);
    },

    /**
     * Fetch user data from Firestore (preferences only)
     *
     * Note: firmId and role come from firm check, not user doc
     *
     * @param {string} userId - User ID
     */
    async fetchUserData(userId) {
      if (!userId) {
        this.userRole = null;
        this.firmId = null;
        return;
      }

      try {
        // Just get user preferences - that's all we store there
        const userDoc = await getDoc(doc(db, 'users', userId));

        // Preferences are optional, don't fail if missing
        if (userDoc.exists()) {
          // Store any user preferences in the store if needed
          // But DON'T store firmId or role here - those come from firm check
        }
      } catch (error) {
        console.error('[Auth] Error fetching user data', error, { userId });
        // Don't fail auth for this
      }
    },

    /**
     * Login action - delegates to auth service
     *
     * @param {string} email - User email
     * @param {string} password - User password
     * @throws {Error} If login fails
     */
    async login(email, password) {
      try {
        this.error = null;
        // Import auth service dynamically to avoid circular imports
        const { authService } = await import('../../../services/authService');
        await authService.signIn(email, password);
        // The onAuthStateChanged listener will handle the state transition
      } catch (error) {
        this.error = error.message;
        this.authState = 'error';
        throw error;
      }
    },

    /**
     * Logout action
     *
     * @throws {Error} If logout fails
     */
    async logout() {
      try {
        this.error = null;
        // Import auth service dynamically to avoid circular imports
        const { authService } = await import('../../../services/authService');
        await authService.signOut();
        // The onAuthStateChanged listener will handle the state transition
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Wait for auth initialization
     *
     * Useful for route guards and components that need to wait
     * for auth state to be determined.
     *
     * @returns {Promise<void>}
     */
    async waitForInit() {
      return new Promise((resolve) => {
        if (this.isInitialized) {
          resolve();
          return;
        }

        const unwatch = this.$subscribe((mutation, state) => {
          if (state.authState !== 'uninitialized' && state.authState !== 'initializing') {
            unwatch();
            resolve();
          }
        });
      });
    },

    /**
     * Cleanup - called when store is destroyed
     *
     * Unsubscribes from Firebase listener and resets state.
     */
    cleanup() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      this._initialized = false;
      this.authState = 'uninitialized';
    },
  },
});
