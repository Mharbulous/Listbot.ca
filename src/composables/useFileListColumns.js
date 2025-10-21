import { ref, computed, watch } from 'vue';
import {
  FILE_LIST_COLUMNS,
  getDefaultVisibleColumns,
  getRequiredColumns,
} from '@/features/organizer/config/fileListColumns';

const STORAGE_KEY = 'fileListColumnPreferences';

/**
 * Composable for managing file list column visibility and preferences
 */
export function useFileListColumns() {
  // All available columns
  const allColumns = ref([...FILE_LIST_COLUMNS]);

  // Keys of currently visible columns
  const visibleColumnKeys = ref([]);

  // Initialize from localStorage or defaults
  const initialized = ref(false);

  /**
   * Computed list of visible column configurations
   */
  const visibleColumns = computed(() => {
    return allColumns.value.filter((col) => visibleColumnKeys.value.includes(col.key));
  });

  /**
   * Computed list of hidden column configurations
   */
  const hiddenColumns = computed(() => {
    return allColumns.value.filter((col) => !visibleColumnKeys.value.includes(col.key));
  });

  /**
   * Required column keys that cannot be hidden
   */
  const requiredColumnKeys = computed(() => {
    return getRequiredColumns().map((col) => col.key);
  });

  /**
   * Check if a column is visible
   */
  function isColumnVisible(columnKey) {
    return visibleColumnKeys.value.includes(columnKey);
  }

  /**
   * Check if a column is required (cannot be hidden)
   */
  function isColumnRequired(columnKey) {
    return requiredColumnKeys.value.includes(columnKey);
  }

  /**
   * Toggle column visibility
   */
  function toggleColumn(columnKey) {
    // Don't allow toggling required columns
    if (isColumnRequired(columnKey)) {
      console.warn(`Column "${columnKey}" is required and cannot be hidden`);
      return;
    }

    if (isColumnVisible(columnKey)) {
      hideColumn(columnKey);
    } else {
      showColumn(columnKey);
    }
  }

  /**
   * Show a column
   */
  function showColumn(columnKey) {
    if (!isColumnVisible(columnKey)) {
      const column = allColumns.value.find((col) => col.key === columnKey);
      if (column) {
        // Insert in original order
        const originalIndex = allColumns.value.findIndex((col) => col.key === columnKey);
        const insertIndex = visibleColumnKeys.value.findIndex((key) => {
          const idx = allColumns.value.findIndex((col) => col.key === key);
          return idx > originalIndex;
        });

        if (insertIndex === -1) {
          visibleColumnKeys.value.push(columnKey);
        } else {
          visibleColumnKeys.value.splice(insertIndex, 0, columnKey);
        }

        savePreferences();
      }
    }
  }

  /**
   * Hide a column
   */
  function hideColumn(columnKey) {
    // Don't allow hiding required columns
    if (isColumnRequired(columnKey)) {
      console.warn(`Column "${columnKey}" is required and cannot be hidden`);
      return;
    }

    const index = visibleColumnKeys.value.indexOf(columnKey);
    if (index !== -1) {
      visibleColumnKeys.value.splice(index, 1);
      savePreferences();
    }
  }

  /**
   * Reset to default visible columns
   */
  function resetToDefaults() {
    const defaults = getDefaultVisibleColumns();
    visibleColumnKeys.value = defaults.map((col) => col.key);
    savePreferences();
  }

  /**
   * Save column preferences to localStorage
   */
  function savePreferences() {
    try {
      const preferences = {
        visibleColumns: visibleColumnKeys.value,
        version: 1,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save column preferences:', error);
    }
  }

  /**
   * Load column preferences from localStorage
   */
  function loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);

        // Validate stored preferences
        if (preferences.visibleColumns && Array.isArray(preferences.visibleColumns)) {
          // Filter out any invalid column keys
          const validKeys = preferences.visibleColumns.filter((key) =>
            allColumns.value.some((col) => col.key === key)
          );

          // Ensure all required columns are included
          const requiredKeys = requiredColumnKeys.value;
          const missingRequired = requiredKeys.filter((key) => !validKeys.includes(key));

          visibleColumnKeys.value = [...validKeys, ...missingRequired];
          initialized.value = true;
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load column preferences:', error);
    }

    // Fall back to defaults
    resetToDefaults();
    initialized.value = true;
    return false;
  }

  /**
   * Clear saved preferences
   */
  function clearPreferences() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      resetToDefaults();
    } catch (error) {
      console.error('Failed to clear column preferences:', error);
    }
  }

  /**
   * Get column configuration by key
   */
  function getColumnByKey(columnKey) {
    return allColumns.value.find((col) => col.key === columnKey);
  }

  /**
   * Reorder columns (for future use)
   */
  function reorderColumns(fromIndex, toIndex) {
    const column = visibleColumnKeys.value[fromIndex];

    // Don't allow moving if it would separate required columns
    visibleColumnKeys.value.splice(fromIndex, 1);
    visibleColumnKeys.value.splice(toIndex, 0, column);

    savePreferences();
  }

  // Initialize on first use
  if (!initialized.value) {
    loadPreferences();
  }

  // Auto-save when visibility changes (debounced via watch)
  watch(
    visibleColumnKeys,
    () => {
      if (initialized.value) {
        savePreferences();
      }
    },
    { deep: true }
  );

  return {
    // State
    allColumns: computed(() => allColumns.value),
    visibleColumns,
    hiddenColumns,
    visibleColumnKeys: computed(() => visibleColumnKeys.value),
    requiredColumnKeys,

    // Methods
    isColumnVisible,
    isColumnRequired,
    toggleColumn,
    showColumn,
    hideColumn,
    resetToDefaults,
    savePreferences,
    loadPreferences,
    clearPreferences,
    getColumnByKey,
    reorderColumns,
  };
}
