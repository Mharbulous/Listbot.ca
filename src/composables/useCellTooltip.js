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
   * Calculate tooltip position (aligned with cell, extending down and to the left)
   * @param {HTMLElement} cellElement - The cell element
   * @returns {Object} Position object with top and left
   */
  const calculatePosition = (cellElement) => {
    if (!cellElement) {
      return { top: '0px', left: '0px' };
    }

    const rect = cellElement.getBoundingClientRect();

    // Get the computed style to match padding
    const computedStyle = window.getComputedStyle(cellElement);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

    // Position tooltip to align with the cell's text content
    // This accounts for the cell's padding to align text perfectly
    const left = rect.left + paddingLeft;
    const top = rect.top + paddingTop;

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
      return;
    }

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
  const handleCellMouseLeave = () => {
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
