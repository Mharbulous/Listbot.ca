import { defineStore } from 'pinia';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

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
    // Initialize the auth system
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
        console.error('Failed to set auth persistence:', error);
      }

      this._initializeFirebase();
    },

    // Firebase initialization
    _initializeFirebase() {
      this._unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            await this._handleUserAuthenticated(firebaseUser);
          } else {
            await this._handleUserUnauthenticated();
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          this.error = error.message;
          this.authState = 'error';
        }
      });
    },

    // Handle authenticated user
    async _handleUserAuthenticated(firebaseUser) {
      try {
        // 1. Set user identity from Firebase Auth (single source of truth)
        this.user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL,
        };

        // 2. Check for existing firm (one simple check)
        const firmId = await this._getUserFirmId(firebaseUser.uid);

        if (firmId) {
          // Existing user with firm
          this.firmId = firmId;
          this.userRole = await this._getUserRole(firmId, firebaseUser.uid);
        } else {
          // New user - create solo firm ONCE
          await this._createSoloFirm(firebaseUser);
          this.firmId = firebaseUser.uid;
          this.userRole = 'admin';
        }

        // 3. Initialize user preferences
        await this._initializeUserPreferences(firebaseUser.uid);

        // 4. Update state
        this.authState = 'authenticated';
        this.error = null;
      } catch (error) {
        console.error('Error handling authenticated user:', error);
        // Still authenticate even if firm setup fails
        this.authState = 'authenticated';
        this.firmId = firebaseUser.uid; // Fallback to userId
        this.userRole = 'admin'; // Fallback to admin
      }
    },

    // Handle unauthenticated user
    async _handleUserUnauthenticated() {
      this.user = null;
      this.userRole = null;
      this.firmId = null;
      this.authState = 'unauthenticated';
      this.error = null;

      // Clear user preferences on logout
      try {
        const { useUserPreferencesStore } = await import('./userPreferences');
        const preferencesStore = useUserPreferencesStore();
        preferencesStore.clear();
      } catch (error) {
        console.error('Error clearing preferences:', error);
      }
    },

    // Initialize user preferences
    async _initializeUserPreferences(userId) {
      try {
        const { useUserPreferencesStore } = await import('./userPreferences');
        const preferencesStore = useUserPreferencesStore();
        await preferencesStore.initialize(userId);
      } catch (error) {
        console.error('Error initializing user preferences:', error);
        // Don't fail auth for this - preferences are not critical
      }
    },

    // Simple check for existing firm
    async _getUserFirmId(userId) {
      try {
        // Check if user has a solo firm
        const firmDoc = await getDoc(doc(db, 'firms', userId));
        if (firmDoc.exists()) {
          return userId; // Solo firm exists
        }

        // In the future, check for firm memberships here
        // For now, return null if no solo firm
        return null;
      } catch (error) {
        console.error('Error checking firm:', error);
        return null;
      }
    },

    // Get user's role in firm
    async _getUserRole(firmId, userId) {
      try {
        const firmDoc = await getDoc(doc(db, 'firms', firmId));
        if (firmDoc.exists()) {
          const members = firmDoc.data().members || {};
          return members[userId]?.role || 'member';
        }
        return 'member';
      } catch (error) {
        console.error('Error getting role:', error);
        return 'member';
      }
    },

    // Create solo firm - ONE TIME ONLY
    async _createSoloFirm(firebaseUser) {
      const { db } = await import('../../services/firebase');
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      try {
        // 1. Create firm document
        const firmRef = doc(db, 'firms', firebaseUser.uid);
        batch.set(firmRef, {
          name: `${firebaseUser.displayName || 'User'}'s Workspace`,
          description: 'Personal workspace',
          members: {
            [firebaseUser.uid]: {
              email: firebaseUser.email,
              role: 'admin',
              isLawyer: false,
              joinedAt: serverTimestamp(),
            },
          },
          isPersonal: true,
          createdAt: serverTimestamp(),
        });

        // 2. Create default matter
        const matterRef = doc(db, 'firms', firebaseUser.uid, 'matters', 'general');
        batch.set(matterRef, {
          title: 'General Documents',
          description: 'Non-client documents and resources',
          clientId: null,
          matterNumber: 'GEN-001',
          status: 'active',
          priority: 'low',
          assignedTo: [firebaseUser.uid],
          createdAt: serverTimestamp(),
          createdBy: firebaseUser.uid,
          isSystemMatter: true,
        });

        // 3. Create user document with preferences (including new display preferences)
        const { UserService } = await import('../../services/userService');
        await UserService.createOrUpdateUserDocument(firebaseUser, {
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en',
            dateFormat: 'YYYY-MM-DD', // Default date format
            timeFormat: 'HH:mm', // Default time format
            darkMode: false, // Default dark mode
          },
        });

        await batch.commit();
      } catch (error) {
        console.error('Error creating solo firm:', error);
        throw error;
      }
    },

    // Fetch user data from Firestore (preferences only)
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
        console.error('Error fetching user data:', error);
        // Don't fail auth for this
      }
    },

    // Login action - delegates to auth service
    async login(email, password) {
      try {
        this.error = null;
        // Import auth service dynamically to avoid circular imports
        const { authService } = await import('../../services/authService');
        await authService.signIn(email, password);
        // The onAuthStateChanged listener will handle the state transition
      } catch (error) {
        this.error = error.message;
        this.authState = 'error';
        throw error;
      }
    },

    // Logout action
    async logout() {
      try {
        this.error = null;
        // Import auth service dynamically to avoid circular imports
        const { authService } = await import('../../services/authService');
        await authService.signOut();
        // The onAuthStateChanged listener will handle the state transition
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    // Wait for auth initialization
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

    // Cleanup - called when store is destroyed
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
