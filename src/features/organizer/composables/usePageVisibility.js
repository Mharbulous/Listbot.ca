import { ref, shallowRef, onBeforeUnmount } from 'vue';

/**
 * Shared IntersectionObserver for tracking visible PDF pages
 *
 * More efficient than creating one observer per page.
 * Tracks which pages are currently visible and which page is most visible
 * for thumbnail highlighting and navigation.
 *
 * @param {HTMLElement} scrollContainer - The scroll container element (default: viewport)
 * @returns {Object} Page visibility state and functions
 */
export function usePageVisibility(scrollContainer = null) {
  const visiblePages = shallowRef(new Set());
  const mostVisiblePage = ref(1);
  let currentObserver = null;

  console.log('[Observer] Creating observer with root:', scrollContainer ? 'custom container' : 'viewport');

  // Create the IntersectionObserver
  const createObserver = (root) => {
    // Disconnect existing observer if any
    if (currentObserver) {
      currentObserver.disconnect();
    }

    // Create a new observer with the specified root
    currentObserver = new IntersectionObserver(
      (entries) => {
        console.log(`[Observer] Callback fired with ${entries.length} entries`);

        // Track intersection changes
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.dataset.pageNumber);

          if (entry.isIntersecting) {
            visiblePages.value.add(pageNum);
            console.log(`[Observer] Page ${pageNum} entered viewport`);
          } else {
            visiblePages.value.delete(pageNum);
            console.log(`[Observer] Page ${pageNum} left viewport`);
          }
        });

        // Find most visible page (highest intersection ratio)
        let maxRatio = 0;
        let maxPage = mostVisiblePage.value;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            maxPage = parseInt(entry.target.dataset.pageNumber);
          }
        });

        if (maxRatio > 0 && maxPage !== mostVisiblePage.value) {
          mostVisiblePage.value = maxPage;
          console.log(`[Observer] mostVisiblePage updated to ${maxPage}`);
        }
      },
      {
        root: root, // Use provided scroll container, or null for viewport
        rootMargin: '200px', // Start loading 200px before visible
        threshold: [0, 0.1, 0.5, 1.0], // Track visibility levels
      }
    );

    console.log('[Observer] Observer created/updated with root:', root ? 'custom container' : 'viewport');
    return currentObserver;
  };

  // Create initial observer
  createObserver(scrollContainer);

  /**
   * Set or update the scroll container root element
   *
   * @param {HTMLElement} scrollContainer - The new scroll container element
   */
  const setRoot = (scrollContainer) => {
    console.log('[Observer] Updating root to:', scrollContainer ? 'custom container' : 'viewport');
    createObserver(scrollContainer);
  };

  /**
   * Observe a page element for visibility tracking
   *
   * @param {HTMLElement} element - Page container element to observe
   */
  const observePage = (element) => {
    if (element && currentObserver) {
      const pageNum = parseInt(element.dataset.pageNumber);
      console.log(`[Observer] Registered page ${pageNum}`);
      currentObserver.observe(element);
    }
  };

  /**
   * Stop observing a page element
   *
   * @param {HTMLElement} element - Page container element to unobserve
   */
  const unobservePage = (element) => {
    if (element && currentObserver) {
      currentObserver.unobserve(element);
    }
  };

  // Cleanup observer when component unmounts
  onBeforeUnmount(() => {
    if (currentObserver) {
      currentObserver.disconnect();
    }
  });

  return {
    // State
    visiblePages,
    mostVisiblePage,

    // Methods
    observePage,
    unobservePage,
    setRoot,
  };
}
