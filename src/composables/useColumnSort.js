import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'analyze-column-sort';
const MAX_SORT_COLUMNS = 5; // Maximum number of columns that can be sorted simultaneously

/**
 * Column metadata for type-aware sorting
 * Defines how each column should be sorted
 */
const COLUMN_TYPES = {
  // Numeric columns
  size: 'number',

  // Date columns
  date: 'date',
  modifiedDate: 'date',

  // String columns (default)
  fileType: 'string',
  fileName: 'string',
  privilege: 'string',
  description: 'string',
  documentType: 'string',
  author: 'string',
  custodian: 'string',
  status: 'string'
};

/**
 * Composable for managing multi-column table sorting
 * Provides type-aware sorting for different data types (strings, numbers, dates)
 * Supports sorting by multiple columns with priority based on visual left-to-right order
 * Implements 3-state sorting cycle per column: unsorted → ascending → descending → unsorted
 * Persists sort state to localStorage
 *
 * @param {Ref<Array>} data - Reactive array of table data
 * @param {Ref<Array>} columnOrder - Reactive array of column keys in visual left-to-right order
 * @param {Function} onMaxColumnsExceeded - Callback when user tries to sort more than MAX_SORT_COLUMNS
 */
export function useColumnSort(data, columnOrder = ref([]), onMaxColumnsExceeded = null) {
  // Sort state - array of {key: string, direction: 'asc'|'desc'}
  const sortColumns = ref([]);

  // Legacy refs for backward compatibility (deprecated)
  const sortColumn = computed(() => sortColumns.value[0]?.key || null);
  const sortDirection = computed(() => sortColumns.value[0]?.direction || null);

  /**
   * Parse size string to bytes for numeric comparison
   * Examples: "1.2 MB" → 1258291, "500 KB" → 512000, "5 GB" → 5368709120
   */
  const parseSizeToBytes = (sizeStr) => {
    if (!sizeStr || typeof sizeStr !== 'string') return 0;

    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
  };

  /**
   * Parse date string to Date object for chronological comparison
   * Handles various date formats and edge cases
   */
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown') return new Date(0); // Epoch for unknown dates

    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date(0) : date;
    } catch (error) {
      return new Date(0);
    }
  };

  /**
   * Get the appropriate comparison value for a given column and row
   * Handles type conversion based on column type
   */
  const getComparisonValue = (row, columnKey) => {
    const value = row[columnKey];
    const columnType = COLUMN_TYPES[columnKey] || 'string';

    switch (columnType) {
      case 'number':
        if (columnKey === 'size') {
          return parseSizeToBytes(value);
        }
        return parseFloat(value) || 0;

      case 'date':
        return parseDate(value);

      case 'string':
      default:
        // Case-insensitive string comparison
        return (value || '').toString().toLowerCase();
    }
  };

  /**
   * Get ordered sort columns based on visual left-to-right column order
   * This ensures sort priority matches column position, not click order
   */
  const orderedSortColumns = computed(() => {
    if (sortColumns.value.length === 0) return [];

    // Create lookup map of sorted columns
    const sortMap = new Map(sortColumns.value.map(s => [s.key, s.direction]));

    // Filter column order to only include sorted columns, maintaining visual order
    return columnOrder.value
      .filter(key => sortMap.has(key))
      .map(key => ({ key, direction: sortMap.get(key) }));
  });

  /**
   * Compare two values based on their type
   */
  const compareValues = (aValue, bValue) => {
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      return aValue.getTime() - bValue.getTime();
    } else {
      // String comparison (already lowercased in getComparisonValue)
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  };

  /**
   * Sort data array by multiple columns in order of visual priority
   * Returns a new sorted array (does not mutate original)
   */
  const sortedData = computed(() => {
    // No sorting applied
    if (sortColumns.value.length === 0) {
      return data.value;
    }

    const sortStart = performance.now();

    // Create a shallow copy to avoid mutating the original array
    const sorted = [...data.value];

    // Get columns in visual order for multi-column sorting
    const columnsToSort = orderedSortColumns.value;

    sorted.sort((a, b) => {
      // Compare by each column in priority order
      for (const { key: columnKey, direction } of columnsToSort) {
        const aValue = getComparisonValue(a, columnKey);
        const bValue = getComparisonValue(b, columnKey);

        const comparison = compareValues(aValue, bValue);

        // If values are different, return the comparison result
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison;
        }

        // Values are equal, continue to next sort column
      }

      // All sort columns had equal values
      return 0;
    });

    const sortDuration = performance.now() - sortStart;

    // Only log if sort takes a noticeable amount of time (>50ms)
    if (sortDuration > 50) {
      const columnNames = columnsToSort.map(s => `${s.key}:${s.direction}`).join(', ');
      console.log(
        `⚡ Multi-column sorted ${data.value.length} rows by [${columnNames}]: ${sortDuration.toFixed(2)}ms`,
        { rowCount: data.value.length, columns: columnsToSort }
      );
    }

    return sorted;
  });

  /**
   * Get sort info for a column
   * @returns {{direction: 'asc'|'desc', priority: number} | null}
   */
  const getSortInfo = (columnKey) => {
    const sortIndex = sortColumns.value.findIndex(s => s.key === columnKey);
    if (sortIndex === -1) return null;

    // Calculate priority based on visual column order
    const visualOrder = orderedSortColumns.value;
    const visualIndex = visualOrder.findIndex(s => s.key === columnKey);

    return {
      direction: sortColumns.value[sortIndex].direction,
      priority: visualIndex + 1 // 1-indexed for display
    };
  };

  /**
   * Toggle sort state for a column
   * Implements 3-state cycle per column: unsorted → asc → desc → unsorted
   * Supports multi-column sorting with max limit
   */
  const toggleSort = (columnKey) => {
    const existingIndex = sortColumns.value.findIndex(s => s.key === columnKey);

    if (existingIndex !== -1) {
      // Column already sorted - cycle through states
      const currentDirection = sortColumns.value[existingIndex].direction;

      if (currentDirection === 'asc') {
        // Change to descending
        sortColumns.value[existingIndex].direction = 'desc';
      } else {
        // Remove from sort (desc → unsorted)
        sortColumns.value.splice(existingIndex, 1);
      }
    } else {
      // Column not sorted - add to sort array
      if (sortColumns.value.length >= MAX_SORT_COLUMNS) {
        // Max columns reached - notify user
        if (onMaxColumnsExceeded) {
          onMaxColumnsExceeded();
        }
        return; // Don't add the column
      }

      // Add new column with ascending sort
      sortColumns.value.push({ key: columnKey, direction: 'asc' });
    }

    saveSortState();
  };

  /**
   * Get CSS classes for a column header based on sort state
   */
  const getSortClass = (columnKey) => {
    const sortInfo = getSortInfo(columnKey);
    if (!sortInfo) return '';

    return sortInfo.direction === 'asc' ? 'sorted-asc' : 'sorted-desc';
  };

  /**
   * Check if a column is currently sorted
   */
  const isSorted = (columnKey) => {
    return sortColumns.value.some(s => s.key === columnKey);
  };

  /**
   * Save sort state to localStorage
   */
  const saveSortState = () => {
    try {
      const state = {
        columns: sortColumns.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving sort state', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Load sort state from localStorage
   */
  const loadSortState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);

        // Handle legacy single-column format
        if (state.column && state.direction) {
          sortColumns.value = [{ key: state.column, direction: state.direction }];
        }
        // Handle new multi-column format
        else if (state.columns && Array.isArray(state.columns)) {
          sortColumns.value = state.columns;
        }
      }
    } catch (error) {
      console.error('Error loading sort state', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Remove a specific column from the sort state
   * Used when a column is hidden to clear its sort
   * @param {string} columnKey - The column key to remove from sort
   */
  const removeColumnFromSort = (columnKey) => {
    const index = sortColumns.value.findIndex(s => s.key === columnKey);
    if (index !== -1) {
      sortColumns.value.splice(index, 1);
      saveSortState();
    }
  };

  /**
   * Reset sort to default (no sorting)
   */
  const resetSort = () => {
    sortColumns.value = [];
    saveSortState();
  };

  // Load saved sort state on mount
  onMounted(() => {
    loadSortState();
  });

  return {
    // Multi-column sort state
    sortColumns,
    orderedSortColumns,

    // Legacy single-column compatibility
    sortColumn,
    sortDirection,

    // Data
    sortedData,

    // Actions
    toggleSort,
    resetSort,
    removeColumnFromSort,

    // Getters
    getSortClass,
    isSorted,
    getSortInfo,

    // Constants
    MAX_SORT_COLUMNS
  };
}
