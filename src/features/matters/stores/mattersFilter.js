import { defineStore } from 'pinia';

/**
 * Matters Filter Store
 *
 * Manages the state for filtering and searching matters in the Matters view.
 * This state is shared between AppHeader (where controls are displayed)
 * and Matters.vue (where filtering is applied).
 */
export const useMattersFilterStore = defineStore('mattersFilter', {
  state: () => ({
    searchText: '',
    showMyMattersOnly: false,
    caseSensitive: false,
    wholeWord: false,
    statusDropdownOpen: false,
    statusFilter: 'active', // 'active' | 'archived' | 'all'
  }),

  getters: {
    /**
     * Get status filter label for display
     * @returns {string} Formatted status label
     */
    statusFilterLabel: (state) => {
      const labels = {
        active: 'Active',
        archived: 'Archived',
        all: 'All',
      };
      return labels[state.statusFilter] || 'Active';
    },

    /**
     * Check if search is active
     * @returns {boolean} True if search text is not empty
     */
    hasSearchText: (state) => state.searchText.length > 0,
  },

  actions: {
    /**
     * Set the search text
     * @param {string} text - The search text
     */
    setSearchText(text) {
      this.searchText = text;
    },

    /**
     * Clear the search text
     */
    clearSearchText() {
      this.searchText = '';
    },

    /**
     * Toggle case sensitive search
     */
    toggleCaseSensitive() {
      this.caseSensitive = !this.caseSensitive;
    },

    /**
     * Toggle whole word search
     */
    toggleWholeWord() {
      this.wholeWord = !this.wholeWord;
    },

    /**
     * Set the status filter and close dropdown
     * @param {string} status - 'active' | 'archived' | 'all'
     */
    setStatusFilter(status) {
      this.statusFilter = status;
      this.statusDropdownOpen = false;
    },

    /**
     * Toggle status dropdown open/closed
     */
    toggleStatusDropdown() {
      this.statusDropdownOpen = !this.statusDropdownOpen;
    },

    /**
     * Close status dropdown
     */
    closeStatusDropdown() {
      this.statusDropdownOpen = false;
    },

    /**
     * Toggle between My Matters and Firm Matters
     * @param {boolean} showMyMatters - True for My Matters, false for Firm Matters
     */
    setShowMyMatters(showMyMatters) {
      this.showMyMattersOnly = showMyMatters;
    },

    /**
     * Reset all filters to default values
     */
    resetFilters() {
      this.searchText = '';
      this.showMyMattersOnly = false;
      this.caseSensitive = false;
      this.wholeWord = false;
      this.statusFilter = 'active';
      this.statusDropdownOpen = false;
    },
  },
});
