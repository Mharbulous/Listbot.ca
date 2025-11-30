import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'matters-column-sort';
const MAX_SORT_COLUMNS = 3; // Maximum number of columns that can be sorted simultaneously

/**
 * Column metadata for type-aware sorting
 * Defines how each column should be sorted
 */
const COLUMN_TYPES = {
  // String columns (default)
  matterNumber: 'string',
  clients: 'array-string',
  description: 'string',
  adverseParties: 'array-string',

  // Numeric columns
  documents: 'number',

  // Date columns
  lastAccessed: 'date',
};

/**
 * Column order for visual priority (left to right as displayed in table)
 */
const COLUMN_ORDER = [
  'matterNumber',
  'clients',
  'description',
  'adverseParties',
  'documents',
  'lastAccessed',
];

/**
 * Composable for managing multi-column table sorting for matters
 * Provides type-aware sorting for different data types (strings, numbers, dates, arrays)
 * Supports sorting by multiple columns with priority based on visual left-to-right order
 * Implements 3-state sorting cycle per column: unsorted → ascending → descending → unsorted
 * Persists sort state to localStorage
 * Automatically rotates out the 3rd priority column when a 4th column is selected
 *
 * @param {Ref<Array>} data - Reactive array of matters data
 */
export function useMattersSort(data) {
  // Sort state - array of {key: string, direction: 'asc'|'desc'}
  const sortColumns = ref([]);

  // Legacy refs for backward compatibility (deprecated)
  const sortColumn = computed(() => sortColumns.value[0]?.key || null);
  const sortDirection = computed(() => sortColumns.value[0]?.direction || null);

  /**
   * Parse date/timestamp to Date object for chronological comparison
   * Handles Firestore Timestamps, Date objects, and date strings
   */
  const parseDate = (value) => {
    if (!value) return new Date(0); // Epoch for missing dates

    // Handle Firestore Timestamp
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // Handle JavaScript Date
    if (value instanceof Date) {
      return value;
    }

    // Handle date string
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date(0) : date;
    } catch (error) {
      return new Date(0);
    }
  };

  /**
   * Convert array to string for comparison
   * Handles both arrays and single values
   */
  const arrayToString = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ').toLowerCase();
    }
    return (value || '').toString().toLowerCase();
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
        return parseFloat(value) || 0;

      case 'date':
        return parseDate(value);

      case 'array-string':
        return arrayToString(value);

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
    const sortMap = new Map(sortColumns.value.map((s) => [s.key, s.direction]));

    // Filter column order to only include sorted columns, maintaining visual order
    return COLUMN_ORDER.filter((key) => sortMap.has(key)).map((key) => ({
      key,
      direction: sortMap.get(key),
    }));
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
      const columnNames = columnsToSort.map((s) => `${s.key}:${s.direction}`).join(', ');
      console.log(
        `⚡ Multi-column sorted ${data.value.length} matters by [${columnNames}]: ${sortDuration.toFixed(2)}ms`
      );
    }

    return sorted;
  });

  /**
   * Get sort info for a column
   * @returns {{direction: 'asc'|'desc', priority: number} | null}
   */
  const getSortInfo = (columnKey) => {
    const sortIndex = sortColumns.value.findIndex((s) => s.key === columnKey);
    if (sortIndex === -1) return null;

    // Calculate priority based on visual column order
    const visualOrder = orderedSortColumns.value;
    const visualIndex = visualOrder.findIndex((s) => s.key === columnKey);

    return {
      direction: sortColumns.value[sortIndex].direction,
      priority: visualIndex + 1, // 1-indexed for display
    };
  };

  /**
   * Toggle sort state for a column
   * Implements 3-state cycle per column: unsorted → asc → desc → unsorted
   * Supports multi-column sorting with max limit of 3
   * When 4th column is selected, automatically removes the 3rd priority column
   */
  const toggleSort = (columnKey) => {
    const existingIndex = sortColumns.value.findIndex((s) => s.key === columnKey);

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
        // Max columns reached - remove the lowest priority (last in visual order)
        const visualOrder = orderedSortColumns.value;
        const lowestPriorityKey = visualOrder[visualOrder.length - 1].key;
        const removeIndex = sortColumns.value.findIndex((s) => s.key === lowestPriorityKey);
        if (removeIndex !== -1) {
          sortColumns.value.splice(removeIndex, 1);
        }
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
    return sortColumns.value.some((s) => s.key === columnKey);
  };

  /**
   * Save sort state to localStorage
   */
  const saveSortState = () => {
    try {
      const state = {
        columns: sortColumns.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving matters sort state', error);
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

        // Handle multi-column format
        if (state.columns && Array.isArray(state.columns)) {
          sortColumns.value = state.columns;
        }
      }
    } catch (error) {
      console.error('Error loading matters sort state', error);
    }
  };

  /**
   * Remove a specific column from the sort state
   * Used when a column is hidden to clear its sort
   * @param {string} columnKey - The column key to remove from sort
   */
  const removeColumnFromSort = (columnKey) => {
    const index = sortColumns.value.findIndex((s) => s.key === columnKey);
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
    MAX_SORT_COLUMNS,
  };
}
