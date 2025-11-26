import { ref, computed } from 'vue';

/**
 * Composable for managing cell content tooltips
 * Shows tooltip on single click
 * Closes on click outside, click on same cell, or 1-second hover outside tooltip
 *
 * @returns {Object} Tooltip state and methods
 */
export function useCellTooltip() {
  // Tooltip state
  const isVisible = ref(false);
  const content = ref('');
  const position = ref({ top: '0px', left: '0px' });
  const opacity = ref(0);
  const backgroundColor = ref('white');

  // Timing
  const HOVER_DELAY = 1000; // 1 second (not used for showing, kept for compatibility)
  const FADE_DURATION = 150; // milliseconds
  const HOVER_AWAY_DELAY = 3000; // 3 seconds - delay before closing when hovering away

  // Timers
  let showTimer = null;
  let fadeTimer = null;
  let hideTimer = null;

  // Current cell element
  let currentCellElement = null;

  // Track if tooltip is being hovered
  let isTooltipHovered = false;
  let isCellHovered = false;

  // Track how tooltip was opened (hover vs click)
  let openedByClick = false;

  /**
   * Check if an element's content is truncated
   * @param {HTMLElement} element - The element to check
   * @returns {boolean} True if content is truncated
   */
  const isTruncated = (element) => {
    if (!element) return false;

    // Check if content is wider than the container (horizontal overflow)
    const isHorizontallyTruncated = element.scrollWidth > element.clientWidth;

    // Check if content has multiple lines (vertical overflow)
    const isVerticallyTruncated = element.scrollHeight > element.clientHeight;

    return isHorizontallyTruncated || isVerticallyTruncated;
  };

  /**
   * Get the text content from an element, handling different content types
   * @param {HTMLElement} element - The element to extract text from
   * @returns {string} The text content
   */
  const getTextContent = (element) => {
    if (!element) return '';

    // Get the first text-containing child element
    const textElement = element.querySelector('span') || element;
    return textElement.textContent || textElement.innerText || '';
  };

  /**
   * Calculate tooltip position (aligned with cell text, extending down and to the left)
   * @param {HTMLElement} cellElement - The cell element
   * @returns {Object} Position object with top and left
   */
  const calculatePosition = (cellElement) => {
    if (!cellElement) {
      return { top: '0px', left: '0px' };
    }

    // Get the actual text element inside the cell (span)
    const textElement = cellElement.querySelector('span') || cellElement;
    const textRect = textElement.getBoundingClientRect();
    const cellRect = cellElement.getBoundingClientRect();

    // Get cell padding for horizontal alignment
    const computedStyle = window.getComputedStyle(cellElement);
    const cellPaddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

    // Tooltip padding (must match CSS padding in CellContentTooltip.vue)
    const TOOLTIP_PADDING_LEFT = 16; // px
    const TOOLTIP_PADDING_TOP = 12; // px

    // Horizontal alignment: align tooltip text with cell text
    // Cell text starts at: cellRect.left + cellPaddingLeft
    // Tooltip text starts at: tooltip.left + TOOLTIP_PADDING_LEFT
    // Therefore: tooltip.left = cellRect.left + cellPaddingLeft - TOOLTIP_PADDING_LEFT
    const left = cellRect.left + cellPaddingLeft - TOOLTIP_PADDING_LEFT;

    // Vertical alignment: align tooltip text with the actual text element position
    // The text element is vertically centered in the cell due to flex
    // Tooltip text starts at: tooltip.top + TOOLTIP_PADDING_TOP
    // Text element is at: textRect.top
    // Therefore: tooltip.top = textRect.top - TOOLTIP_PADDING_TOP
    const top = textRect.top - TOOLTIP_PADDING_TOP;

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  /**
   * Handle mouse enter on cell
   * Hover no longer triggers tooltip display - only manages hover state for closing logic
   * @param {MouseEvent} event - The mouse event
   * @param {HTMLElement} cellElement - The cell element
   * @param {string} bgColor - The background color of the row
   */
  const handleCellMouseEnter = (event, cellElement, bgColor = 'white') => {
    // Mark that cell is being hovered
    isCellHovered = true;

    // Clear hide timer if hovering over the cell that has the tooltip
    if (hideTimer && isVisible.value && currentCellElement === cellElement) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    // Clear any pending show timers from previous hover events
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
  };

  /**
   * Handle click on cell
   * If tooltip is visible for same cell, closes it
   * If tooltip is visible for different cell, closes it and opens new one
   * If no tooltip is visible, opens new one
   * @param {MouseEvent} event - The mouse event
   * @param {HTMLElement} cellElement - The cell element
   * @param {string} bgColor - The background color of the row
   */
  const handleCellClick = (event, cellElement, bgColor = 'white') => {
    // Get the text content
    const text = getTextContent(cellElement);
    if (!text || text.trim() === '' || text.trim() === 't.b.d.') {
      return;
    }

    // If clicking the same cell that has the tooltip, just close it
    if (isVisible.value && currentCellElement === cellElement) {
      hideTooltip();
      return;
    }

    // Clear any pending timers
    clearTimers();

    // Store cell element and background color
    currentCellElement = cellElement;
    backgroundColor.value = bgColor;

    // Set content
    content.value = text;

    // Calculate position based on cell element
    position.value = calculatePosition(currentCellElement);

    // Show tooltip immediately (no delay)
    isVisible.value = true;
    opacity.value = 1;
    openedByClick = true;
  };

  /**
   * Handle mouse leave from cell
   */
  const handleCellMouseLeave = (cellElement) => {
    // Mark that cell is no longer being hovered
    isCellHovered = false;

    // Clear any pending show timers
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }

    // If tooltip is visible, start the hide timer (1 second delay)
    // But only if neither the cell nor the tooltip is being hovered
    if (isVisible.value && !isTooltipHovered) {
      // Clear any existing hide timer
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      // Start new hide timer
      hideTimer = setTimeout(() => {
        // Only hide if still not hovering over cell or tooltip
        if (!isCellHovered && !isTooltipHovered) {
          hideTooltip();
        }
      }, HOVER_AWAY_DELAY);
    }
  };

  /**
   * Hide the tooltip
   */
  const hideTooltip = () => {
    isVisible.value = false;
    opacity.value = 0;
    content.value = '';
    backgroundColor.value = 'white';
    currentCellElement = null;
    isTooltipHovered = false;
    isCellHovered = false;
    openedByClick = false;
  };

  /**
   * Handle mouse enter on tooltip
   */
  const handleTooltipMouseEnter = () => {
    isTooltipHovered = true;

    // Clear hide timer if it exists
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  /**
   * Handle mouse leave from tooltip
   */
  const handleTooltipMouseLeave = () => {
    isTooltipHovered = false;

    // Start hide timer if not hovering over cell either
    if (!isCellHovered) {
      // Clear any existing hide timer
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      // Start new hide timer
      hideTimer = setTimeout(() => {
        // Only hide if still not hovering over cell or tooltip
        if (!isCellHovered && !isTooltipHovered) {
          hideTooltip();
        }
      }, HOVER_AWAY_DELAY);
    }
  };

  /**
   * Handle click on tooltip
   * This allows text selection without closing the tooltip
   */
  const handleTooltipClick = (event) => {
    // Don't do anything - allow text selection
    // The tooltip should stay open for text selection
  };

  /**
   * Handle clicks outside tooltip and cells
   * Used to close tooltip when clicking elsewhere
   */
  const handleOutsideClick = (event) => {
    // Only close if tooltip is visible
    if (!isVisible.value) {
      return;
    }

    // Check if click is outside both the tooltip and the current cell
    const clickedElement = event.target;

    // Don't close if clicking on the current cell
    if (currentCellElement && currentCellElement.contains(clickedElement)) {
      return;
    }

    // Don't close if clicking on the tooltip
    // (This is handled by the tooltip component's @click.stop)

    // Close the tooltip
    hideTooltip();
  };

  /**
   * Clear all timers
   */
  const clearTimers = () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (fadeTimer) {
      clearTimeout(fadeTimer);
      fadeTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  /**
   * Cleanup method
   */
  const cleanup = () => {
    clearTimers();
    hideTooltip();
  };

  return {
    // State
    isVisible,
    content,
    position,
    opacity,
    backgroundColor,

    // Cell event handlers
    handleCellMouseEnter,
    handleCellMouseLeave,
    handleCellClick,

    // Tooltip event handlers
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
    handleTooltipClick,

    // Global handlers
    handleOutsideClick,

    // Cleanup
    cleanup,
  };
}
