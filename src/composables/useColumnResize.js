import { ref, computed, onMounted, onUnmounted } from 'vue';
import { LogService } from '../services/logService';

// Column resize constants
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;
const STORAGE_KEY = 'analyze-column-widths';

/**
 * Composable for managing column resizing functionality
 * Handles column width storage, resize operations, and persistence
 * @param {Object} defaultColumnWidths - Object mapping column keys to default widths
 * @param {Ref} visibleColumns - Optional computed ref of visible columns array
 */
export function useColumnResize(defaultColumnWidths, visibleColumns = null) {
  // Reactive column widths
  const columnWidths = ref({ ...defaultColumnWidths });

  // Resize state
  const resizeState = ref({
    isResizing: false,
    columnKey: null,
    startX: 0,
    startWidth: 0,
    resizeCount: 0,
    resizeStartTime: 0
  });

  /**
   * Load column widths from localStorage
   */
  const loadColumnWidths = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        columnWidths.value = { ...defaultColumnWidths, ...parsed };
      }
    } catch (error) {
      LogService.error('Error loading column widths', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Save column widths to localStorage
   */
  const saveColumnWidths = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths.value));
    } catch (error) {
      LogService.error('Error saving column widths', error, { storageKey: STORAGE_KEY });
    }
  };

  /**
   * Start column resize operation
   * @param {string} columnKey - The key of the column being resized
   * @param {MouseEvent} event - The mousedown event
   */
  const startResize = (columnKey, event) => {
    const start = performance.now();
    resizeState.value = {
      isResizing: true,
      columnKey,
      startX: event.pageX,
      startWidth: columnWidths.value[columnKey],
      resizeCount: 0,
      resizeStartTime: start
    };

    // Prevent text selection during drag
    event.preventDefault();
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  /**
   * Handle column resize during drag
   * @param {MouseEvent} event - The mousemove event
   */
  const handleResize = (event) => {
    if (!resizeState.value.isResizing) return;

    resizeState.value.resizeCount++;

    const delta = event.pageX - resizeState.value.startX;
    const newWidth = resizeState.value.startWidth + delta;

    // Apply min/max constraints
    const constrainedWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.min(MAX_COLUMN_WIDTH, newWidth)
    );

    columnWidths.value[resizeState.value.columnKey] = constrainedWidth;
  };

  /**
   * End column resize operation
   */
  const endResize = () => {
    if (resizeState.value.isResizing) {
      saveColumnWidths();
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    resizeState.value = {
      isResizing: false,
      columnKey: null,
      startX: 0,
      startWidth: 0,
      resizeCount: 0,
      resizeStartTime: 0
    };
  };

  /**
   * Calculate total table width dynamically
   * Only sums visible columns if visibleColumns is provided
   */
  const totalTableWidth = computed(() => {
    if (visibleColumns && visibleColumns.value) {
      // Only sum widths of visible columns
      return visibleColumns.value.reduce((sum, col) => {
        return sum + (columnWidths.value[col.key] || 0);
      }, 0);
    }
    // Fallback for components not passing visibleColumns
    return Object.values(columnWidths.value).reduce((sum, width) => sum + width, 0);
  });

  // Lifecycle hooks
  onMounted(() => {
    loadColumnWidths();
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', endResize);
  });

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', endResize);
  });

  return {
    columnWidths,
    totalTableWidth,
    startResize
  };
}
