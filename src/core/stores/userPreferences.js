import { defineStore } from 'pinia';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * User Preferences Store
 *
 * Manages user-specific display preferences that persist to Firestore
 * Stored at: /users/{userId}/preferences
 */
export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => ({
    // Display preferences
    dateFormat: 'YYYY-MM-DD', // Default date format
    timeFormat: 'HH:mm', // Default time format
    darkMode: false, // Dark mode toggle

    // Store state
    isInitialized: false,
    isLoading: false,
    error: null,

    // Current user ID for reference
    _userId: null,
  }),

  getters: {
    /**
     * Get the current date format preference
     */
    currentDateFormat: (state) => state.dateFormat,

    /**
     * Get the current time format preference
     */
    currentTimeFormat: (state) => state.timeFormat,

    /**
     * Check if dark mode is enabled
     */
    isDarkMode: (state) => state.darkMode,

    /**
     * Check if preferences are loaded and ready
     */
    isReady: (state) => state.isInitialized && !state.isLoading,
  },

  actions: {
    /**
     * Initialize preferences for a user
     * Loads from Firestore or sets defaults if not found
     * @param {string} userId - Firebase user UID
     */
    async initialize(userId) {
      if (!userId) {
        console.error('[UserPreferences] Cannot initialize without userId');
        return;
      }

      // Skip if already initialized for this user
      if (this.isInitialized && this._userId === userId) {
        return;
      }

      this.isLoading = true;
      this.error = null;
      this._userId = userId;

      try {
        await this._loadPreferences(userId);
        this.isInitialized = true;
      } catch (error) {
        console.error('[UserPreferences] Error initializing preferences:', error);
        this.error = error.message;
        // Set defaults on error
        this.dateFormat = 'YYYY-MM-DD';
        this.timeFormat = 'HH:mm';
        this.darkMode = false;
        this.isInitialized = true;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Update the date format preference
     * @param {string} format - Date format string (e.g., 'YYYY-MM-DD')
     */
    async updateDateFormat(format) {
      if (!this._userId) {
        console.error('[UserPreferences] Cannot update dateFormat without initialized user');
        return;
      }

      const previousFormat = this.dateFormat;
      this.dateFormat = format;

      try {
        await this._savePreferences(this._userId, {
          dateFormat: format,
          timeFormat: this.timeFormat,
          darkMode: this.darkMode,
        });
      } catch (error) {
        console.error('[UserPreferences] Error updating date format:', error);
        // Revert on error
        this.dateFormat = previousFormat;
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Update the time format preference
     * @param {string} format - Time format string (e.g., 'HH:mm')
     */
    async updateTimeFormat(format) {
      if (!this._userId) {
        console.error('[UserPreferences] Cannot update timeFormat without initialized user');
        return;
      }

      const previousFormat = this.timeFormat;
      this.timeFormat = format;

      try {
        await this._savePreferences(this._userId, {
          dateFormat: this.dateFormat,
          timeFormat: format,
          darkMode: this.darkMode,
        });
      } catch (error) {
        console.error('[UserPreferences] Error updating time format:', error);
        // Revert on error
        this.timeFormat = previousFormat;
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Update the dark mode preference
     * @param {boolean} enabled - Whether dark mode is enabled
     */
    async updateDarkMode(enabled) {
      if (!this._userId) {
        console.error('[UserPreferences] Cannot update darkMode without initialized user');
        return;
      }

      const previousMode = this.darkMode;
      this.darkMode = enabled;

      try {
        await this._savePreferences(this._userId, {
          dateFormat: this.dateFormat,
          timeFormat: this.timeFormat,
          darkMode: enabled,
        });
      } catch (error) {
        console.error('[UserPreferences] Error updating dark mode:', error);
        // Revert on error
        this.darkMode = previousMode;
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Load preferences from Firestore
     * @private
     * @param {string} userId - Firebase user UID
     */
    async _loadPreferences(userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const preferences = data.preferences || {};

          // Load preferences with defaults
          this.dateFormat = preferences.dateFormat || 'YYYY-MM-DD';
          this.timeFormat = preferences.timeFormat || 'HH:mm';
          this.darkMode = preferences.darkMode || false;
        } else {
          // No user document yet - use defaults
          this.dateFormat = 'YYYY-MM-DD';
          this.timeFormat = 'HH:mm';
          this.darkMode = false;
        }
      } catch (error) {
        console.error('[UserPreferences] Error loading preferences:', error);
        throw error;
      }
    },

    /**
     * Save preferences to Firestore
     * @private
     * @param {string} userId - Firebase user UID
     * @param {Object} preferences - Preferences object to save
     */
    async _savePreferences(userId, preferences) {
      try {
        const userDocRef = doc(db, 'users', userId);

        // Merge update to preserve other user data
        await setDoc(
          userDocRef,
          {
            preferences: {
              dateFormat: preferences.dateFormat,
              timeFormat: preferences.timeFormat,
              darkMode: preferences.darkMode,
              // Preserve other preference fields that might exist
              theme: 'light', // Legacy field - keep for backward compatibility
              notifications: true, // Legacy field - keep for backward compatibility
              language: 'en', // Legacy field - keep for backward compatibility
            },
          },
          { merge: true }
        );
      } catch (error) {
        console.error('[UserPreferences] Error saving preferences:', error);
        throw error;
      }
    },

    /**
     * Reset preferences to defaults
     */
    resetToDefaults() {
      this.dateFormat = 'YYYY-MM-DD';
      this.timeFormat = 'HH:mm';
      this.darkMode = false;
    },

    /**
     * Clear the store state (useful for logout)
     */
    clear() {
      this.dateFormat = 'YYYY-MM-DD';
      this.timeFormat = 'HH:mm';
      this.darkMode = false;
      this.isInitialized = false;
      this.isLoading = false;
      this.error = null;
      this._userId = null;
    },
  },
});
