import { ref, computed, onMounted } from 'vue';
import { COLUMNS, getDefaultColumnOrder, getColumnByKey } from '@/utils/columnConfig';

const STORAGE_KEY = 'analyze-column-order';

/**
 * Composable for managing column drag-and-drop reordering with live reshuffling
 * Uses static drop zones frozen at drag start to prevent oscillation with variable-width columns
 * Implements directional insertion logic for intuitive left/right drag behavior
 */
export function useColumnDragDrop() {
  // Column order state (array of column keys)
  const columnOrder = ref(getDefaultColumnOrder());

  // Drag state with static drop zones
  const dragState = ref({
    isDragging: false,
    draggedColumnKey: null,
    draggedColumnWidth: 0,
    draggedStartIndex: null, // Original index when drag started
    currentInsertionIndex: null, // Current position in the reordered array
    staticZones: [] // Frozen drop zones captured at drag start: [{key, rect, originalIndex}]
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
   * Calculate insertion index using static drop zones ONLY
   * Zones are frozen at drag start and never move, preventing all flickering
   *
   * Key insight: We calculate the target index by counting how many zones should
   * appear to the LEFT of the dragged column, based purely on ORIGINAL positions.
   * This count never changes while hovering over the same zone, ensuring stability.
   *
   * @param {number} mouseX - Current mouse X position
   * @param {Array} staticZones - Frozen zones captured at drag start: [{key, rect, originalIndex}]
   * @returns {number} - Target insertion index (stable, won't oscillate)
   */
  const calculateInsertionIndex = (mouseX, staticZones) => {
    const draggedStartIndex = dragState.value.draggedStartIndex;

    // Find which static zone contains the mouse
    const hoveredZone = staticZones.find(zone =>
      mouseX >= zone.rect.left && mouseX <= zone.rect.right
    );

    if (!hoveredZone) {
      // Mouse outside all zones - stay at current position
      return dragState.value.currentInsertionIndex ?? draggedStartIndex;
    }

    // Special case: hovering over the dragged column's original position
    if (hoveredZone.originalIndex === draggedStartIndex) {
      // Restore to initial position
      return draggedStartIndex;
    }

    const hoveredOriginalIndex = hoveredZone.originalIndex;

    // Calculate target index by counting zones based on ORIGINAL positions only
    // This count is STATIC and won't change when columns reorder
    let targetIndex;

    if (hoveredOriginalIndex < draggedStartIndex) {
      // Dragging LEFT: Insert BEFORE hovered zone
      // Count zones with originalIndex < hoveredOriginalIndex (excluding dragged column)
      targetIndex = staticZones.filter(zone =>
        zone.originalIndex < hoveredOriginalIndex
      ).length;
    } else {
      // Dragging RIGHT: Insert AFTER hovered zone
      // Count zones with originalIndex <= hoveredOriginalIndex (excluding dragged column)
      targetIndex = staticZones.filter(zone =>
        zone.originalIndex <= hoveredOriginalIndex && zone.originalIndex !== draggedStartIndex
      ).length;
    }

    return targetIndex;
  };

  /**
   * Handle drag start - captures static drop zones that remain fixed during drag
   */
  const onDragStart = (columnKey, event) => {
    const headerCell = event.target.closest('.header-cell');
    const startIndex = columnOrder.value.indexOf(columnKey);

    // Capture all column positions BEFORE any reordering
    // These zones will remain static throughout the drag operation
    const headers = document.querySelectorAll('.header-cell[data-column-key]');
    const staticZones = Array.from(headers).map((header, index) => ({
      key: header.getAttribute('data-column-key'),
      rect: header.getBoundingClientRect(),
      originalIndex: index
    }));

    dragState.value = {
      isDragging: true,
      draggedColumnKey: columnKey,
      draggedColumnWidth: headerCell ? headerCell.offsetWidth : 0,
      draggedStartIndex: startIndex,
      currentInsertionIndex: startIndex,
      staticZones: staticZones
    };

    // === DEBUGGING: Log column positions and drop zones ===
    console.log('=== DRAG START DEBUG ===');
    console.log('\nVisible Column Borders:');
    headers.forEach((header, index) => {
      const rect = header.getBoundingClientRect();
      const key = header.getAttribute('data-column-key');
      console.log(`  [${index}] ${key}: left=${rect.left.toFixed(1)}px, right=${rect.right.toFixed(1)}px`);
    });

    console.log('\nStatic Drop Zones (frozen at drag start):');
    staticZones.forEach((zone, index) => {
      console.log(`  [${index}] ${zone.key}: left=${zone.rect.left.toFixed(1)}px, right=${zone.rect.right.toFixed(1)}px (originalIndex: ${zone.originalIndex})`);
    });
    console.log('========================\n');

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
   * Handle drag over - uses static zones for stable, flicker-free reordering
   */
  const onDragOver = (event) => {
    if (!dragState.value.isDragging) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const mouseX = event.clientX;

    // Calculate new insertion index using static zones
    const newIndex = calculateInsertionIndex(
      mouseX,
      dragState.value.staticZones
    );

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
      currentInsertionIndex: null,
      staticZones: []
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
