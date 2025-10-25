import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'analyze-column-sort';

/**
 * Column metadata for type-aware sorting
 * Defines how each column should be sorted
 */
const COLUMN_TYPES = {
  // Numeric columns
  size: 'number',

  // Date columns
  date: 'date',
  createdDate: 'date',
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
 * Composable for managing table column sorting
 * Provides type-aware sorting for different data types (strings, numbers, dates)
 * Implements 3-state sorting cycle: null → ascending → descending → null
 * Persists sort state to localStorage
 */
export function useColumnSort(data) {
  // Sort state
  const sortColumn = ref(null);
  const sortDirection = ref(null); // null | 'asc' | 'desc'

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
   * Sort data array by the current sort column and direction
   * Returns a new sorted array (does not mutate original)
   */
  const sortedData = computed(() => {
    // No sorting applied
    if (!sortColumn.value || !sortDirection.value) {
      return data.value;
    }

    // Create a shallow copy to avoid mutating the original array
    const sorted = [...data.value];

    sorted.sort((a, b) => {
      const aValue = getComparisonValue(a, sortColumn.value);
      const bValue = getComparisonValue(b, sortColumn.value);

      let comparison = 0;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // String comparison (already lowercased in getComparisonValue)
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      // Apply sort direction
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  /**
   * Toggle sort state for a column
   * Implements 3-state cycle: null → asc → desc → null
   */
  const toggleSort = (columnKey) => {
    if (sortColumn.value === columnKey) {
      // Same column - cycle through states
      if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc';
      } else if (sortDirection.value === 'desc') {
        // Return to default (no sort)
        sortColumn.value = null;
        sortDirection.value = null;
      }
    } else {
      // Different column - start with ascending
      sortColumn.value = columnKey;
      sortDirection.value = 'asc';
    }

    saveSortState();
  };

  /**
   * Get CSS classes for a column header based on sort state
   */
  const getSortClass = (columnKey) => {
    if (sortColumn.value !== columnKey) return '';

    return sortDirection.value === 'asc' ? 'sorted-asc' : 'sorted-desc';
  };

  /**
   * Check if a column is currently sorted
   */
  const isSorted = (columnKey) => {
    return sortColumn.value === columnKey;
  };

  /**
   * Save sort state to localStorage
   */
  const saveSortState = () => {
    try {
      const state = {
        column: sortColumn.value,
        direction: sortDirection.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving sort state:', error);
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
        sortColumn.value = state.column;
        sortDirection.value = state.direction;
      }
    } catch (error) {
      console.error('Error loading sort state:', error);
    }
  };

  /**
   * Reset sort to default (no sorting)
   */
  const resetSort = () => {
    sortColumn.value = null;
    sortDirection.value = null;
    saveSortState();
  };

  // Load saved sort state on mount
  onMounted(() => {
    loadSortState();
  });

  return {
    sortColumn,
    sortDirection,
    sortedData,
    toggleSort,
    getSortClass,
    isSorted,
    resetSort
  };
}
