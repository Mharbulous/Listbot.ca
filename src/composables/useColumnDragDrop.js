import { ref, computed, onMounted } from 'vue';
import { COLUMNS, getDefaultColumnOrder, getColumnByKey } from '@/utils/columnConfig';

const STORAGE_KEY = 'analyze-column-order';

/**
 * Composable for managing column drag-and-drop reordering
 * Handles column order state, drag operations, and persistence
 */
export function useColumnDragDrop() {
  // Column order state (array of column keys)
  const columnOrder = ref(getDefaultColumnOrder());

  // Drag state
  const dragState = ref({
    isDragging: false,
    draggedColumnKey: null,
    hoverColumnKey: null,
    hoverDropZone: false, // True when hovering over far-right drop zone
    insertionIndex: null
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
   * Show insertion indicator line
   */
  const showInsertionIndicator = computed(() => {
    return dragState.value.isDragging &&
           (dragState.value.hoverColumnKey !== null || dragState.value.hoverDropZone);
  });

  /**
   * Get insertion indicator position index
   */
  const insertionIndicatorIndex = computed(() => {
    if (dragState.value.hoverDropZone) {
      return columnOrder.value.length; // After last column
    }
    if (dragState.value.hoverColumnKey) {
      // Insert to the LEFT of the hovered column
      return columnOrder.value.indexOf(dragState.value.hoverColumnKey);
    }
    return null;
  });

  /**
   * Handle drag start
   */
  const onDragStart = (columnKey, event) => {
    dragState.value = {
      isDragging: true,
      draggedColumnKey: columnKey,
      hoverColumnKey: null,
      hoverDropZone: false,
      insertionIndex: null
    };

    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnKey);

    // Create ghost image (browser will use this semi-transparently)
    const headerCell = event.target.closest('.header-cell');
    if (headerCell) {
      // Clone the header cell for the drag image
      const ghost = headerCell.cloneNode(true);
      ghost.style.opacity = '0.8';
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, event.offsetX, event.offsetY);
      // Remove ghost after drag starts
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  /**
   * Handle drag over column header
   */
  const onDragOver = (columnKey, event) => {
    if (!dragState.value.isDragging) return;
    if (columnKey === dragState.value.draggedColumnKey) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    dragState.value.hoverColumnKey = columnKey;
    dragState.value.hoverDropZone = false;
  };

  /**
   * Handle drag over the far-right drop zone
   */
  const onDragOverDropZone = (event) => {
    if (!dragState.value.isDragging) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    dragState.value.hoverColumnKey = null;
    dragState.value.hoverDropZone = true;
  };

  /**
   * Handle drag leave
   */
  const onDragLeave = () => {
    // Clear hover state when leaving a column
    dragState.value.hoverColumnKey = null;
    dragState.value.hoverDropZone = false;
  };

  /**
   * Handle drop
   */
  const onDrop = (event) => {
    event.preventDefault();

    const draggedKey = dragState.value.draggedColumnKey;
    if (!draggedKey) return;

    const currentIndex = columnOrder.value.indexOf(draggedKey);
    let newIndex;

    if (dragState.value.hoverDropZone) {
      // Drop at far right (last position)
      newIndex = columnOrder.value.length - 1;
    } else if (dragState.value.hoverColumnKey) {
      // Insert to the LEFT of hovered column
      newIndex = columnOrder.value.indexOf(dragState.value.hoverColumnKey);
      // Adjust index if dragging from left to right
      if (currentIndex < newIndex) {
        newIndex--;
      }
    } else {
      // No valid drop target
      resetDragState();
      return;
    }

    // Reorder the array
    const newOrder = [...columnOrder.value];
    newOrder.splice(currentIndex, 1); // Remove from current position
    newOrder.splice(newIndex, 0, draggedKey); // Insert at new position

    columnOrder.value = newOrder;
    saveColumnOrder();
    resetDragState();
  };

  /**
   * Handle drag end (cleanup)
   */
  const onDragEnd = () => {
    resetDragState();
  };

  /**
   * Reset drag state
   */
  const resetDragState = () => {
    dragState.value = {
      isDragging: false,
      draggedColumnKey: null,
      hoverColumnKey: null,
      hoverDropZone: false,
      insertionIndex: null
    };
  };

  /**
   * Check if a column is currently being dragged
   */
  const isColumnDragging = (columnKey) => {
    return dragState.value.isDragging && dragState.value.draggedColumnKey === columnKey;
  };

  // Load saved column order on mount
  onMounted(() => {
    loadColumnOrder();
  });

  return {
    columnOrder,
    orderedColumns,
    dragState,
    showInsertionIndicator,
    insertionIndicatorIndex,
    onDragStart,
    onDragOver,
    onDragOverDropZone,
    onDragLeave,
    onDrop,
    onDragEnd,
    isColumnDragging
  };
}
