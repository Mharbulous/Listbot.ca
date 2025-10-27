import { ref, computed, onMounted, onUnmounted } from 'vue';

// Column resize constants
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;
const STORAGE_KEY = 'analyze-column-widths';

/**
 * Composable for managing column resizing functionality
 * Handles column width storage, resize operations, and persistence
 * @param {Object} defaultColumnWidths - Object mapping column keys to default widths
 */
export function useColumnResize(defaultColumnWidths) {
  // Reactive column widths
  const columnWidths = ref({ ...defaultColumnWidths });

  // Resize state
  const resizeState = ref({
    isResizing: false,
    columnKey: null,
    startX: 0,
    startWidth: 0
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
      console.error('Error loading column widths:', error);
    }
  };

  /**
   * Save column widths to localStorage
   */
  const saveColumnWidths = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths.value));
    } catch (error) {
      console.error('Error saving column widths:', error);
    }
  };

  /**
   * Start column resize operation
   * @param {string} columnKey - The key of the column being resized
   * @param {MouseEvent} event - The mousedown event
   */
  const startResize = (columnKey, event) => {
    resizeState.value = {
      isResizing: true,
      columnKey,
      startX: event.pageX,
      startWidth: columnWidths.value[columnKey]
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
      startWidth: 0
    };
  };

  /**
   * Calculate total table width dynamically
   */
  const totalTableWidth = computed(() => {
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
