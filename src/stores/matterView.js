import { defineStore } from 'pinia';

const STORAGE_KEY = 'bookkeeper_active_matter';

/**
 * Matter View Store
 *
 * Manages the state for the currently selected/active matter.
 * Used to provide reactive matter information to the header display.
 * Persists selection to localStorage to survive page refreshes.
 */
export const useMatterViewStore = defineStore('matterView', {
  state: () => ({
    currentMatter: null, // { id, matterNumber, description }
  }),

  getters: {
    /**
     * Get the current active matter
     * @returns {Object|null} The active matter object or null if no matter is selected
     */
    activeMatter: (state) => state.currentMatter,

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
      return `Matter #${state.currentMatter.matterNumber}: ${state.currentMatter.description}`;
    },
  },

  actions: {
    /**
     * Set the current active matter and persist to localStorage
     * @param {Object} matter - The matter object with id, matterNumber, and description
     */
    setMatter(matter) {
      const matterData = {
        id: matter.id,
        matterNumber: matter.matterNumber,
        description: matter.description,
      };

      this.currentMatter = matterData;

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matterData));
      } catch (error) {
        console.error('Failed to save matter to localStorage:', error);
      }
    },

    /**
     * Clear the current active matter and remove from localStorage
     */
    clearMatter() {
      this.currentMatter = null;

      // Remove from localStorage
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to remove matter from localStorage:', error);
      }
    },

    /**
     * Load matter from localStorage (call on app initialization)
     */
    loadMatterFromStorage() {
      try {
        const storedMatter = localStorage.getItem(STORAGE_KEY);
        if (storedMatter) {
          this.currentMatter = JSON.parse(storedMatter);
        }
      } catch (error) {
        console.error('Failed to load matter from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});
