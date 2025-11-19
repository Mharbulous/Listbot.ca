/**
 * Document Table Peek Composable
 *
 * Handles all document preview/peek functionality for DocumentTable.
 * This includes:
 * - Showing/hiding document peek tooltips
 * - Managing peek button refs and tooltip positioning
 * - Handling thumbnail generation for PDFs
 * - Managing document selection state
 * - Lifecycle management (event listeners, cleanup)
 */

import { ref, computed } from 'vue';
import { useDocumentPeek } from '@/features/documents/composables/useDocumentPeek';
import { useTooltipTiming } from '@/features/documents/composables/useTooltipTiming';

/**
 * Tooltip dimensions and spacing constants
 */
const TOOLTIP_DIMENSIONS = {
  WIDTH: 350,
  HEIGHT: 380,
  BUFFER: 10
};

/**
 * Row background colors for zebra striping
 */
const ROW_COLORS = {
  EVEN: '#f9fafb',
  ODD: 'white'
};

/**
 * Get row background color based on index
 * @param {number} index - Row index
 * @returns {string} Background color hex value
 */
export const getRowBackgroundColor = (index) => {
  return index % 2 === 0 ? ROW_COLORS.EVEN : ROW_COLORS.ODD;
};

/**
 * Calculate vertical position for tooltip
 * @param {DOMRect} buttonRect - Peek button bounding rect
 * @param {number} tooltipHeight - Height of tooltip
 * @param {number} buffer - Spacing buffer
 * @returns {number} Top position in pixels
 */
const calculateVerticalPosition = (buttonRect, tooltipHeight, buffer) => {
  const spaceAbove = buttonRect.top;
  const spaceBelow = window.innerHeight - buttonRect.bottom;

  if (spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
    // Not enough space below and more space above - position above button
    return Math.max(buffer, buttonRect.top - tooltipHeight - buffer);
  }

  // Default: position at button top (aligns with button)
  return Math.max(buffer, Math.min(buttonRect.top, window.innerHeight - tooltipHeight - buffer));
};

/**
 * Calculate horizontal position for tooltip
 * @param {DOMRect} buttonRect - Peek button bounding rect
 * @param {number} tooltipWidth - Width of tooltip
 * @param {number} buffer - Spacing buffer
 * @returns {number} Left position in pixels
 */
const calculateHorizontalPosition = (buttonRect, tooltipWidth, buffer) => {
  const spaceRight = window.innerWidth - buttonRect.right;
  const spaceLeft = buttonRect.left;

  if (spaceRight >= tooltipWidth + buffer) {
    // Enough space on right - position to right of button (default)
    return buttonRect.right + buffer;
  }

  if (spaceLeft >= tooltipWidth + buffer) {
    // Not enough space on right but enough on left - position to left of button
    return buttonRect.left - tooltipWidth - buffer;
  }

  // Constrain to viewport with buffer
  return Math.max(buffer, Math.min(
    buttonRect.right + buffer,
    window.innerWidth - tooltipWidth - buffer
  ));
};

/**
 * Main composable for document table peek functionality
 * @param {Object} route - Vue Router route object
 * @param {Object} router - Vue Router instance
 * @param {Object} authStore - Authentication store
 * @param {Object} sortedData - Computed ref containing sorted table data
 * @returns {Object} Peek functionality interface
 */
export function useDocumentTablePeek(route, router, authStore, sortedData) {
  // Initialize core composables
  const documentPeek = useDocumentPeek();
  const tooltipTiming = useTooltipTiming();

  // Refs for peek button positioning
  const peekButtonRefs = ref(new Map());
  const tooltipPosition = ref({ top: '0px', left: '0px' });

  /**
   * Update tooltip position based on peek button location
   * Handles viewport constraints and collision detection
   * @param {string} fileHash - Document identifier to locate peek button
   */
  const updateTooltipPosition = (fileHash) => {
    const button = peekButtonRefs.value.get(fileHash);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const { WIDTH, HEIGHT, BUFFER } = TOOLTIP_DIMENSIONS;

    tooltipPosition.value = {
      top: `${calculateVerticalPosition(rect, HEIGHT, BUFFER)}px`,
      left: `${calculateHorizontalPosition(rect, WIDTH, BUFFER)}px`
    };
  };

  /**
   * Navigate to document view
   * @param {Object} row - Document row data
   */
  const handleViewDocument = (row) => {
    if (!row || !row.id) return;

    // If peek is active and this is NOT the peeked row, do nothing
    if (tooltipTiming.isVisible.value && !isRowPeeked(row)) {
      return;
    }

    // Navigate to document view (works for both peeked row and non-peek scenarios)
    router.push({
      name: 'view-document',
      params: {
        matterId: route.params.matterId,
        fileHash: row.id
      }
    });
  };

  /**
   * Check if a document row is currently selected (being viewed or peeked)
   * @param {Object} row - Document row data
   * @returns {boolean} True if row is selected
   */
  const isDocumentSelected = (row) => {
    if (!row || !row.id) return false;

    // Selected if currently viewing this document
    const isViewing = route.params.fileHash === row.id;

    // Selected if currently peeking this document and tooltip is visible
    const isPeeking = tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value === row.id;

    return isViewing || isPeeking;
  };

  /**
   * Check if peek is currently active
   */
  const isPeekActive = computed(() => {
    return tooltipTiming.isVisible.value;
  });

  /**
   * Check if a specific row is the currently peeked document
   * @param {Object} row - Document row data
   * @returns {boolean} True if this row is being peeked
   */
  const isRowPeeked = (row) => {
    return row && row.id && documentPeek.currentPeekDocument.value === row.id;
  };

  /**
   * Handle peek button click
   * @param {Object} row - Document row data
   */
  const handlePeekClick = async (row) => {
    if (!row || !row.id) return;

    const fileHash = row.id;
    const firmId = authStore.currentFirm;
    const matterId = route.params.matterId;

    if (!firmId || !matterId) {
      console.error('[Peek] Missing firmId or matterId');
      return;
    }

    const isPeekingThisDocument = documentPeek.currentPeekDocument.value === fileHash;
    const isPeekVisible = tooltipTiming.isVisible.value;

    if (isPeekingThisDocument && isPeekVisible) {
      // Second click on same document - close the peek
      tooltipTiming.closeImmediate();
      documentPeek.closePeek();
    } else {
      // First click or different document - open peek immediately
      await documentPeek.openPeek(firmId, matterId, fileHash);

      // Show tooltip
      tooltipTiming.showTooltip();

      // Calculate position
      updateTooltipPosition(fileHash);

      // Generate thumbnail if it's a PDF
      if (documentPeek.isCurrentDocumentPdf.value) {
        await documentPeek.generateThumbnail(fileHash, 1);
      }
    }
  };

  /**
   * Handle peek button double-click (navigate to document view)
   * @param {Object} row - Document row data
   */
  const handlePeekDoubleClick = (row) => {
    if (!row || !row.id) return;

    // Close any active peek
    if (tooltipTiming.isVisible.value) {
      tooltipTiming.closeImmediate();
      documentPeek.closePeek();
    }

    // Navigate to document view
    handleViewDocument(row);
  };

  /**
   * Handle peek button mouse enter
   * @param {Object} row - Document row data
   */
  const handlePeekMouseEnter = (row) => {
    if (!row || !row.id) return;

    // Only show tooltip if this document is already being peeked
    if (documentPeek.currentPeekDocument.value === row.id) {
      tooltipTiming.handleMouseEnter();
    }
  };

  /**
   * Handle peek button mouse leave
   */
  const handlePeekMouseLeave = () => {
    tooltipTiming.handleMouseLeave();
  };

  /**
   * Handle thumbnail generation request
   * @param {Object} params - Parameters object
   * @param {string} params.fileHash - Document file hash
   * @param {number} params.pageNumber - Page number to generate
   */
  const handleThumbnailNeeded = async ({ fileHash, pageNumber }) => {
    await documentPeek.generateThumbnail(fileHash, pageNumber);
  };

  /**
   * Handle previous page click on thumbnail
   */
  const handlePreviousPage = async () => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    documentPeek.previousPage();

    // Generate thumbnail for new page
    await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
  };

  /**
   * Handle next page click on thumbnail
   */
  const handleNextPage = async () => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    documentPeek.nextPage();

    // Generate thumbnail for new page
    await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
  };

  /**
   * Handle view document from thumbnail middle-click
   */
  const handleViewDocumentFromPeek = () => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    // Find the row in sortedData that matches the fileHash
    const row = sortedData.value.find((r) => r.id === fileHash);

    if (row) {
      handleViewDocument(row);
    }
  };

  /**
   * Set ref for peek button
   * @param {HTMLElement} el - Button element
   * @param {string} fileHash - Document file hash
   */
  const setPeekButtonRef = (el, fileHash) => {
    if (el) {
      peekButtonRefs.value.set(fileHash, el);
    } else {
      peekButtonRefs.value.delete(fileHash);
    }
  };

  /**
   * Handle click outside tooltip (close immediately)
   * @param {Event} event - Click event
   */
  const handleOutsideClick = (event) => {
    if (tooltipTiming.isVisible.value) {
      // Check if click is on peek button or tooltip
      const tooltipEl = event.target.closest('.document-peek-tooltip');
      const peekButtonEl = event.target.closest('.peek-button');

      if (!tooltipEl && !peekButtonEl) {
        tooltipTiming.closeImmediate();
        documentPeek.closePeek();
      }
    }
  };

  /**
   * Handle window resize - update tooltip position if visible
   */
  const handleWindowResize = () => {
    if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
      updateTooltipPosition(documentPeek.currentPeekDocument.value);
    }
  };

  /**
   * Handle scroll - update tooltip position if visible
   */
  const handleScroll = () => {
    if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
      updateTooltipPosition(documentPeek.currentPeekDocument.value);
    }
  };

  /**
   * Mount lifecycle - attach event listeners
   */
  const mount = () => {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleWindowResize);
  };

  /**
   * Unmount lifecycle - cleanup event listeners and state
   */
  const unmount = () => {
    document.removeEventListener('click', handleOutsideClick);
    window.removeEventListener('resize', handleWindowResize);
    documentPeek.cleanup();
  };

  // Return public interface
  return {
    // Core composables
    documentPeek,
    tooltipTiming,

    // Refs
    peekButtonRefs,
    tooltipPosition,

    // Computed state
    isPeekActive,

    // State checkers
    isDocumentSelected,
    isRowPeeked,

    // Event handlers
    handleViewDocument,
    handlePeekClick,
    handlePeekDoubleClick,
    handlePeekMouseEnter,
    handlePeekMouseLeave,
    handleThumbnailNeeded,
    handlePreviousPage,
    handleNextPage,
    handleViewDocumentFromPeek,
    setPeekButtonRef,
    handleScroll,

    // Lifecycle
    mount,
    unmount
  };
}
