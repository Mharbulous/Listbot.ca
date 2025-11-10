import { ref, computed } from 'vue';

/**
 * Composable for managing cell content tooltips
 * Shows tooltip for truncated cell content after 1-second hover
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
  const HOVER_DELAY = 1000; // 1 second
  const FADE_DURATION = 150; // milliseconds

  // Timers
  let showTimer = null;
  let fadeTimer = null;

  // Current cell element
  let currentCellElement = null;

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
   * @param {MouseEvent} event - The mouse event
   * @param {HTMLElement} cellElement - The cell element
   * @param {string} bgColor - The background color of the row
   */
  const handleCellMouseEnter = (event, cellElement, bgColor = 'white') => {
    // Clear any existing timers
    clearTimers();

    // Check if content is truncated
    if (!isTruncated(cellElement)) {
      // Reset cursor for non-truncated cells
      cellElement.style.cursor = '';
      return;
    }

    // Set eye cursor to indicate truncated content can be viewed
    cellElement.style.cursor = 'help';

    // Get the text content
    const text = getTextContent(cellElement);
    if (!text || text.trim() === '') {
      return;
    }

    // Store cell element and background color
    currentCellElement = cellElement;
    backgroundColor.value = bgColor;

    // Set content
    content.value = text;

    // Start timer to show tooltip after delay
    showTimer = setTimeout(() => {
      // Calculate position based on cell element
      position.value = calculatePosition(currentCellElement);

      // Show tooltip
      isVisible.value = true;

      // Fade in
      opacity.value = 0;
      fadeTimer = setTimeout(() => {
        opacity.value = 1;
      }, 10);
    }, HOVER_DELAY);
  };

  /**
   * Handle mouse leave from cell
   */
  const handleCellMouseLeave = (cellElement) => {
    // Reset cursor
    if (cellElement) {
      cellElement.style.cursor = '';
    }

    clearTimers();
    hideTooltip();
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

    // Methods
    handleCellMouseEnter,
    handleCellMouseLeave,
    cleanup,
  };
}
