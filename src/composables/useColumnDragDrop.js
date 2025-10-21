import { ref, computed, onMounted } from 'vue';
import { COLUMNS, getDefaultColumnOrder, getColumnByKey } from '@/utils/columnConfig';

const STORAGE_KEY = 'analyze-column-order';

/**
 * Composable for managing column drag-and-drop reordering with live reshuffling
 * Uses edge-crossing logic to determine insertion point
 */
export function useColumnDragDrop() {
  // Column order state (array of column keys)
  const columnOrder = ref(getDefaultColumnOrder());

  // Drag state with swap threshold tracking
  const dragState = ref({
    isDragging: false,
    draggedColumnKey: null,
    draggedColumnWidth: 0,
    draggedStartIndex: null, // Original index when drag started
    currentInsertionIndex: null // Current position in the reordered array
  });

  /**
   * Load column order from localStorage
   */
  const loadColumnOrder = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that all expected columns are present
        const validOrder = parsed.filter(key => COLUMNS.some(col => col.key === key));
        if (validOrder.length === COLUMNS.length) {
          columnOrder.value = validOrder;
        }
      }
    } catch (error) {
      console.error('Error loading column order:', error);
    }
  };

  /**
   * Save column order to localStorage
   */
  const saveColumnOrder = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder.value));
    } catch (error) {
      console.error('Error saving column order:', error);
    }
  };

  /**
   * Get ordered column metadata
   */
  const orderedColumns = computed(() => {
    return columnOrder.value.map(key => getColumnByKey(key)).filter(Boolean);
  });

  /**
   * Calculate insertion index using swap threshold algorithm (50% overlap)
   * Prevents oscillation by requiring dragged center to be significantly
   * overlapping the target before swapping
   *
   * @param {number} mouseX - Current mouse X position (center of dragged column)
   * @param {DOMRect[]} columnRects - Array of column bounding rectangles
   * @returns {number} - New insertion index
   */
  const calculateInsertionIndex = (mouseX, columnRects) => {
    const draggedKey = dragState.value.draggedColumnKey;
    const SWAP_THRESHOLD = 0.5; // 50% - SortableJS default

    // Find which column's swap zone contains the dragged center
    for (let i = 0; i < columnRects.length; i++) {
      const rect = columnRects[i];
      const columnKey = columnOrder.value[i];

      // Skip the dragged column itself
      if (columnKey === draggedKey) continue;

      // Calculate swap zone (center 50% of the column)
      const columnWidth = rect.width;
      const swapZoneWidth = columnWidth * SWAP_THRESHOLD;
      const swapZoneStart = rect.left + (columnWidth - swapZoneWidth) / 2;
      const swapZoneEnd = swapZoneStart + swapZoneWidth;

      // Check if dragged center is inside this column's swap zone
      if (mouseX >= swapZoneStart && mouseX <= swapZoneEnd) {
        // Found the target - return this index
        return i;
      }
    }

    // No swap zone overlaps - stay at current position
    return columnOrder.value.indexOf(draggedKey);
  };

  /**
   * Handle drag start
   */
  const onDragStart = (columnKey, event) => {
    const headerCell = event.target.closest('.header-cell');
    const startIndex = columnOrder.value.indexOf(columnKey);

    dragState.value = {
      isDragging: true,
      draggedColumnKey: columnKey,
      draggedColumnWidth: headerCell ? headerCell.offsetWidth : 0,
      draggedStartIndex: startIndex,
      currentInsertionIndex: startIndex
    };

    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnKey);

    // Create ghost image (browser will use this semi-transparently)
    if (headerCell) {
      const ghost = headerCell.cloneNode(true);
      ghost.style.opacity = '0.8';
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, event.offsetX, event.offsetY);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  /**
   * Handle drag over - uses swap threshold to reorder in real-time
   * Prevents oscillation by requiring 50% overlap before swapping
   */
  const onDragOver = (event) => {
    if (!dragState.value.isDragging) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const mouseX = event.clientX;

    // Get all column header elements and their positions
    const headers = document.querySelectorAll('.header-cell[data-column-key]');
    const columnRects = Array.from(headers).map(header => header.getBoundingClientRect());

    // Calculate new insertion index using swap threshold
    const newIndex = calculateInsertionIndex(mouseX, columnRects);

    // Only reorder if the index actually changed
    if (newIndex !== dragState.value.currentInsertionIndex) {
      dragState.value.currentInsertionIndex = newIndex;

      // Reorder the array immediately for live preview
      const draggedKey = dragState.value.draggedColumnKey;
      const currentIndex = columnOrder.value.indexOf(draggedKey);

      if (currentIndex !== -1 && newIndex !== currentIndex) {
        const newOrder = [...columnOrder.value];
        newOrder.splice(currentIndex, 1); // Remove from current position
        newOrder.splice(newIndex, 0, draggedKey); // Insert at new position
        columnOrder.value = newOrder;
      }
    }
  };

  /**
   * Handle drop - save the already-reordered state
   */
  const onDrop = (event) => {
    event.preventDefault();

    // Column order was already updated during drag in onDragOver
    // Just save to localStorage and clean up
    saveColumnOrder();
    resetDragState();
  };

  /**
   * Handle drag end (cleanup)
   */
  const onDragEnd = () => {
    // If drag was cancelled or ended outside a valid drop zone
    // The column order is already in the final state from onDragOver
    // Just save and clean up
    saveColumnOrder();
    resetDragState();
  };

  /**
   * Reset drag state
   */
  const resetDragState = () => {
    dragState.value = {
      isDragging: false,
      draggedColumnKey: null,
      draggedColumnWidth: 0,
      draggedStartIndex: null,
      currentInsertionIndex: null
    };
  };

  /**
   * Check if a column is currently being dragged
   */
  const isColumnDragging = (columnKey) => {
    return dragState.value.isDragging && dragState.value.draggedColumnKey === columnKey;
  };

  /**
   * Check if this position should show as a gap (dragged column's current position)
   */
  const isDragGap = (columnKey) => {
    if (!dragState.value.isDragging) return false;
    return columnKey === dragState.value.draggedColumnKey;
  };

  // Load saved column order on mount
  onMounted(() => {
    loadColumnOrder();
  });

  return {
    columnOrder,
    orderedColumns,
    dragState,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isColumnDragging,
    isDragGap
  };
}
