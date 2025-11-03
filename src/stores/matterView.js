import { defineStore } from 'pinia';

const STORAGE_KEY = 'bookkeeper_selected_matter';
const LEGACY_STORAGE_KEY = 'bookkeeper_active_matter'; // For migration

/**
 * Matter View Store
 *
 * Manages the state for the currently selected matter.
 * Used to provide reactive matter information to the header display.
 * Persists selection to localStorage to survive page refreshes.
 */
export const useMatterViewStore = defineStore('matterView', {
  state: () => ({
    currentMatter: null, // { id, matterNumber, description, archived }
  }),

  getters: {
    /**
     * Get the currently selected matter
     * @returns {Object|null} The selected matter object or null if no matter is selected
     */
    selectedMatter: (state) => state.currentMatter,

    /**
     * Check if a matter is currently selected
     * @returns {boolean} True if a matter is selected
     */
    hasMatter: (state) => state.currentMatter !== null,

    /**
     * Get formatted matter display string
     * @returns {string|null} Formatted matter string or null
     */
    matterDisplay: (state) => {
      if (!state.currentMatter) return null;
      return `${state.currentMatter.matterNumber}: ${state.currentMatter.description}`;
    },

    /**
     * Get the ID of the currently selected matter
     * @returns {string|null} Matter ID or null if no matter is selected
     */
    currentMatterId: (state) => state.currentMatter?.id ?? null,

    /**
     * Check if the selected matter is archived
     * @returns {boolean} True if selected matter is archived
     */
    isArchivedMatter: (state) => state.currentMatter?.archived ?? false,

    /**
     * Check if the selected matter allows uploads
     * Must have a matter selected AND it must not be archived
     * @returns {boolean} True if uploads are allowed
     */
    canUploadToMatter: (state) => {
      if (!state.currentMatter) return false;
      return state.currentMatter.archived === false;
    },
  },

  actions: {
    /**
     * Set the currently selected matter and persist to localStorage
     * @param {Object} matter - The matter object with id, matterNumber, description, and archived
     */
    setMatter(matter) {
      const matterData = {
        id: matter.id,
        matterNumber: matter.matterNumber,
        description: matter.description,
        archived: matter.archived || false,
      };

      this.currentMatter = matterData;

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matterData));
      } catch (error) {
        console.error('[MatterView] Failed to save matter to localStorage', error, { storageKey: STORAGE_KEY, matterId: matter?.id });
      }
    },

    /**
     * Clear the currently selected matter and remove from localStorage
     */
    clearMatter() {
      this.currentMatter = null;

      // Remove from localStorage
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('[MatterView] Failed to remove matter from localStorage', error, { storageKey: STORAGE_KEY });
      }
    },

    /**
     * Load matter from localStorage (call on app initialization)
     */
    loadMatterFromStorage() {
      try {
        // Try new key first
        let storedMatter = localStorage.getItem(STORAGE_KEY);

        // Migration: Check legacy key if new key doesn't exist
        if (!storedMatter) {
          storedMatter = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (storedMatter) {
            // Migrate to new key
            localStorage.setItem(STORAGE_KEY, storedMatter);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        }

        if (storedMatter) {
          const matterData = JSON.parse(storedMatter);

          // Handle legacy data without archived field
          if (matterData.archived === undefined) {
            matterData.archived = false; // Default to false for legacy data
          }

          this.currentMatter = matterData;
        }
      } catch (error) {
        console.error('[MatterView] Failed to load matter from localStorage', error, { storageKey: STORAGE_KEY });
        // Clear corrupted data from both keys
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    },
  },
});
