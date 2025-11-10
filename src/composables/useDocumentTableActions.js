import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/stores/auth';
import { useDocumentPeek } from '@/composables/useDocumentPeek';
import { useTooltipTiming } from '@/composables/useTooltipTiming';

/**
 * Composable for handling all DocumentTable actions
 * - Document peek interactions (click, double-click, hover)
 * - Tooltip positioning
 * - Navigation to document view
 * - AI processing
 * - Outside click and scroll detection
 */
export function useDocumentTableActions() {
  // Router and route for navigation
  const route = useRoute();
  const router = useRouter();

  // Auth store for firm ID
  const authStore = useAuthStore();

  // Document peek functionality
  const documentPeek = useDocumentPeek();
  const tooltipTiming = useTooltipTiming();

  // Refs for peek button positioning
  const peekButtonRefs = ref(new Map());
  const tooltipPosition = ref({ top: '0px', left: '0px' });

  // Handle view document double-click
  const handleViewDocument = (row) => {
    if (!row || !row.id) return;

    // If peek is active and this is NOT the peeked row, do nothing
    if (isPeekActive.value && !isRowPeeked(row)) {
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

  // Check if a document row is currently selected (being viewed or peeked)
  const isDocumentSelected = (row) => {
    if (!row || !row.id) return false;

    // Selected if currently viewing this document
    const isViewing = route.params.fileHash === row.id;

    // Selected if currently peeking this document and tooltip is visible
    const isPeeking = tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value === row.id;

    return isViewing || isPeeking;
  };

  // Check if peek is currently active
  const isPeekActive = computed(() => {
    return tooltipTiming.isVisible.value;
  });

  // Check if a specific row is the currently peeked document
  const isRowPeeked = (row) => {
    return row && row.id && documentPeek.currentPeekDocument.value === row.id;
  };

  // Handle process with AI button click
  const handleProcessWithAI = (row) => {
    // TODO: Implement AI processing logic
    console.log('Process with AI:', row);
  };

  // Handle peek button click
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

  // Handle peek button double-click (navigate to document view)
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

  // Handle peek button mouse enter
  const handlePeekMouseEnter = (row) => {
    if (!row || !row.id) return;

    // Only show tooltip if this document is already being peeked
    if (documentPeek.currentPeekDocument.value === row.id) {
      tooltipTiming.handleMouseEnter();
    }
  };

  // Handle peek button mouse leave
  const handlePeekMouseLeave = () => {
    tooltipTiming.handleMouseLeave();
  };

  // Handle tooltip mouse enter (cancel hide timer)
  const handleTooltipMouseEnter = () => {
    tooltipTiming.cancelHideTimer();
  };

  // Handle tooltip mouse leave (start hide timer)
  const handleTooltipMouseLeave = () => {
    tooltipTiming.startHideTimer();
  };

  // Handle thumbnail generation request
  const handleThumbnailNeeded = async ({ fileHash, pageNumber }) => {
    await documentPeek.generateThumbnail(fileHash, pageNumber);
  };

  // Handle previous page click on thumbnail
  const handlePreviousPage = async () => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    documentPeek.previousPage();

    // Generate thumbnail for new page
    await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
  };

  // Handle next page click on thumbnail
  const handleNextPage = async () => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    documentPeek.nextPage();

    // Generate thumbnail for new page
    await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
  };

  // Handle view document from thumbnail middle-click
  const handleViewDocumentFromPeek = (sortedData) => {
    if (!documentPeek.currentPeekDocument.value) return;

    const fileHash = documentPeek.currentPeekDocument.value;

    // Find the row in sortedData that matches the fileHash
    const row = sortedData.find((r) => r.id === fileHash);

    if (row) {
      handleViewDocument(row);
    }
  };

  // Update tooltip position based on peek button
  const updateTooltipPosition = (fileHash) => {
    const button = peekButtonRefs.value.get(fileHash);
    if (!button) return;

    const rect = button.getBoundingClientRect();

    // Estimate tooltip dimensions (based on DocumentPeekTooltip styles)
    const TOOLTIP_WIDTH = 350;
    const TOOLTIP_HEIGHT = 380;
    const BUFFER = 10;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate available space in each direction
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    // Determine vertical position
    let top;
    if (spaceBelow < TOOLTIP_HEIGHT && spaceAbove > spaceBelow) {
      // Not enough space below and more space above - position above button
      top = Math.max(BUFFER, rect.top - TOOLTIP_HEIGHT - BUFFER);
    } else {
      // Default: position at button top (aligns with button)
      top = Math.max(BUFFER, Math.min(rect.top, viewportHeight - TOOLTIP_HEIGHT - BUFFER));
    }

    // Determine horizontal position
    let left;
    if (spaceRight >= TOOLTIP_WIDTH + BUFFER) {
      // Enough space on right - position to right of button (default)
      left = rect.right + BUFFER;
    } else if (spaceLeft >= TOOLTIP_WIDTH + BUFFER) {
      // Not enough space on right but enough on left - position to left of button
      left = rect.left - TOOLTIP_WIDTH - BUFFER;
    } else {
      // Constrain to viewport with buffer
      left = Math.max(BUFFER, Math.min(rect.right + BUFFER, viewportWidth - TOOLTIP_WIDTH - BUFFER));
    }

    tooltipPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  // Set ref for peek button
  const setPeekButtonRef = (el, fileHash) => {
    if (el) {
      peekButtonRefs.value.set(fileHash, el);
    } else {
      peekButtonRefs.value.delete(fileHash);
    }
  };

  // Handle window resize - update tooltip position if visible
  const handleWindowResize = () => {
    if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
      updateTooltipPosition(documentPeek.currentPeekDocument.value);
    }
  };

  // Handle scroll - update tooltip position if visible
  const handleScrollForPeek = () => {
    if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
      updateTooltipPosition(documentPeek.currentPeekDocument.value);
    }
  };

  return {
    // State
    documentPeek,
    tooltipTiming,
    tooltipPosition,
    peekButtonRefs,

    // Computed
    isPeekActive,

    // Methods
    isDocumentSelected,
    isRowPeeked,
    handleViewDocument,
    handleProcessWithAI,
    handlePeekClick,
    handlePeekDoubleClick,
    handlePeekMouseEnter,
    handlePeekMouseLeave,
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
    handleThumbnailNeeded,
    handlePreviousPage,
    handleNextPage,
    handleViewDocumentFromPeek,
    updateTooltipPosition,
    setPeekButtonRef,
    handleWindowResize,
    handleScrollForPeek,
  };
}
