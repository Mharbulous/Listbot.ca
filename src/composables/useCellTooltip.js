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

  // Timing
  const HOVER_DELAY = 1000; // 1 second
  const FADE_DURATION = 150; // milliseconds

  // Timers
  let showTimer = null;
  let fadeTimer = null;

  // Current mouse position
  let mouseX = 0;
  let mouseY = 0;

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
   * Calculate tooltip position (above and to the left of cursor)
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position
   * @returns {Object} Position object with top and left
   */
  const calculatePosition = (x, y) => {
    const OFFSET_X = 15; // pixels to the left of cursor
    const OFFSET_Y = 15; // pixels above cursor
    const BUFFER = 10; // minimum distance from viewport edge

    // Calculate position above and to the left
    let left = x - OFFSET_X;
    let top = y - OFFSET_Y;

    // Ensure tooltip stays within viewport bounds
    left = Math.max(BUFFER, left);
    top = Math.max(BUFFER, top);

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  /**
   * Handle mouse enter on cell
   * @param {MouseEvent} event - The mouse event
   * @param {HTMLElement} cellElement - The cell element
   */
  const handleCellMouseEnter = (event, cellElement) => {
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

    // Store initial mouse position
    mouseX = event.clientX;
    mouseY = event.clientY;

    // Set content
    content.value = text;

    // Start timer to show tooltip after delay
    showTimer = setTimeout(() => {
      // Calculate position based on mouse position
      position.value = calculatePosition(mouseX, mouseY);

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
   * Handle mouse move on cell (update cursor position)
   * @param {MouseEvent} event - The mouse event
   */
  const handleCellMouseMove = (event) => {
    // Update mouse position
    mouseX = event.clientX;
    mouseY = event.clientY;

    // If tooltip is visible, update its position
    if (isVisible.value) {
      position.value = calculatePosition(mouseX, mouseY);
    }
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

    // Methods
    handleCellMouseEnter,
    handleCellMouseMove,
    handleCellMouseLeave,
    cleanup,
  };
}
