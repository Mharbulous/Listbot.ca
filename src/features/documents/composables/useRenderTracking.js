/**
 * Track which documents have been rendered in the current session
 * to distinguish first-time renders from re-renders.
 *
 * Module-level Set persists across component instances but clears on page reload.
 * This allows us to measure:
 * - First render performance (cold start, nothing cached)
 * - Re-render performance (navigating back to already-viewed document)
 */

// Module-level singleton - persists per session
const renderedDocuments = new Set();

/**
 * Composable for tracking rendered documents
 *
 * @returns {Object} Render tracking functions
 */
export function useRenderTracking() {
  /**
   * Check if a document has been rendered before in this session
   *
   * @param {string} documentId - Unique document identifier
   * @returns {boolean} True if this is the first time rendering this document
   */
  const isFirstRender = (documentId) => {
    return !renderedDocuments.has(documentId);
  };

  /**
   * Mark a document as rendered
   *
   * @param {string} documentId - Unique document identifier
   */
  const markAsRendered = (documentId) => {
    renderedDocuments.add(documentId);
  };

  /**
   * Get the number of unique documents rendered in this session
   *
   * @returns {number} Count of rendered documents
   */
  const getRenderedCount = () => {
    return renderedDocuments.size;
  };

  /**
   * Clear all render tracking (useful for testing/debugging)
   */
  const clearTracking = () => {
    renderedDocuments.clear();
  };

  /**
   * Check if any documents have been rendered
   *
   * @returns {boolean} True if at least one document has been rendered
   */
  const hasRenderedDocuments = () => {
    return renderedDocuments.size > 0;
  };

  return {
    isFirstRender,
    markAsRendered,
    getRenderedCount,
    clearTracking,
    hasRenderedDocuments,
  };
}
