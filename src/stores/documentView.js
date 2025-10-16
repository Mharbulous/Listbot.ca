import { defineStore } from 'pinia';

/**
 * Document View Store
 *
 * Manages the state for the current document being viewed.
 * Used to provide reactive document information to the header breadcrumb.
 */
export const useDocumentViewStore = defineStore('documentView', {
  state: () => ({
    currentDocumentName: null,
  }),

  getters: {
    /**
     * Get the current document name for display
     * @returns {string|null} The document name or null if no document is loaded
     */
    documentName: (state) => state.currentDocumentName,
  },

  actions: {
    /**
     * Set the current document name
     * @param {string} name - The document name to display
     */
    setDocumentName(name) {
      this.currentDocumentName = name;
    },

    /**
     * Clear the current document name (call when leaving the view)
     */
    clearDocumentName() {
      this.currentDocumentName = null;
    },
  },
});
