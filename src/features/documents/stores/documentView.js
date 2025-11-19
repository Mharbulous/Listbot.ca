import { defineStore } from 'pinia';

/**
 * Document View Store
 *
 * Manages the state for the current evidence document being viewed.
 * The "document name" is the display name derived from source metadata
 * (sourceFileName from the source file that was uploaded).
 * Used to provide reactive document information to the header breadcrumb.
 */
export const useDocumentViewStore = defineStore('documentView', {
  state: () => ({
    currentDocumentName: null, // Display name from source metadata
  }),

  getters: {
    /**
     * Get the current evidence document display name
     * @returns {string|null} The display name (from source metadata) or null if no document is loaded
     */
    documentName: (state) => state.currentDocumentName,
  },

  actions: {
    /**
     * Set the current evidence document display name
     * @param {string} name - The display name to show (from source metadata)
     */
    setDocumentName(name) {
      this.currentDocumentName = name;
    },

    /**
     * Clear the current evidence document display name (call when leaving the view)
     */
    clearDocumentName() {
      this.currentDocumentName = null;
    },
  },
});
