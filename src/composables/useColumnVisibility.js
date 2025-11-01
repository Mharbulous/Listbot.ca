import { ref, onMounted } from 'vue';
import { LogService } from '../services/logService';

const STORAGE_KEY = 'analyze-column-visibility';

// Default visible columns (first 6 as shown in mockup)
const DEFAULT_VISIBLE_COLUMNS = [
  'fileType',
  'fileName',
  'size',
  'date',
  'privilege',
  'description'
];

/**
 * Composable for managing column visibility in the Analyze table
 * Handles showing/hiding columns via checkbox toggles with localStorage persistence
 */
export function useColumnVisibility() {
  // Track which column keys are currently visible
  const visibleColumnKeys = ref([...DEFAULT_VISIBLE_COLUMNS]);

  /**
   * Load visibility state from localStorage
   */
  const loadVisibility = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          visibleColumnKeys.value = parsed;
        }
      }
    } catch (error) {
      LogService.error('Error loading column visibility', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Save visibility state to localStorage
   */
  const saveVisibility = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumnKeys.value));
    } catch (error) {
      LogService.error('Error saving column visibility', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Check if a column is currently visible
   * @param {string} columnKey - The column key to check
   * @returns {boolean} - True if column is visible
   */
  const isColumnVisible = (columnKey) => {
    return visibleColumnKeys.value.includes(columnKey);
  };

  /**
   * Toggle visibility of a column
   * @param {string} columnKey - The column key to toggle
   */
  const toggleColumnVisibility = (columnKey) => {
    const index = visibleColumnKeys.value.indexOf(columnKey);
    if (index > -1) {
      // Column is visible, hide it
      visibleColumnKeys.value = visibleColumnKeys.value.filter(key => key !== columnKey);
    } else {
      // Column is hidden, show it
      visibleColumnKeys.value = [...visibleColumnKeys.value, columnKey];
    }
    saveVisibility();
  };

  /**
   * Reset visibility to default columns
   */
  const resetToDefaults = () => {
    visibleColumnKeys.value = [...DEFAULT_VISIBLE_COLUMNS];
    saveVisibility();
  };

  /**
   * Filter an ordered columns array to only include visible columns
   * @param {Array} orderedColumns - Array of column objects with {key, label}
   * @returns {Array} - Filtered array containing only visible columns
   */
  const getVisibleColumns = (orderedColumns) => {
    return orderedColumns.filter(col => isColumnVisible(col.key));
  };

  // Load saved visibility state on mount
  onMounted(() => {
    loadVisibility();
  });

  return {
    visibleColumnKeys,
    isColumnVisible,
    toggleColumnVisibility,
    resetToDefaults,
    getVisibleColumns
  };
}
