import { ref, shallowRef, onBeforeUnmount } from 'vue';

/**
 * Shared IntersectionObserver for tracking visible PDF pages
 *
 * More efficient than creating one observer per page.
 * Tracks which pages are currently visible and which page is most visible
 * for thumbnail highlighting and navigation.
 *
 * @returns {Object} Page visibility state and functions
 */
export function usePageVisibility() {
  const visiblePages = shallowRef(new Set());
  const mostVisiblePage = ref(1);

  // Create a shared observer for all pages
  const observer = new IntersectionObserver(
    (entries) => {
      // Track intersection changes
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.dataset.pageNumber);

        if (entry.isIntersecting) {
          visiblePages.value.add(pageNum);
        } else {
          visiblePages.value.delete(pageNum);
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

      if (maxRatio > 0) {
        mostVisiblePage.value = maxPage;
        console.debug('Most visible page changed', {
          pageNumber: maxPage,
          intersectionRatio: maxRatio,
        });
      }
    },
    {
      root: null,
      rootMargin: '200px', // Start loading 200px before visible
      threshold: [0, 0.1, 0.5, 1.0], // Track visibility levels
    }
  );

  /**
   * Observe a page element for visibility tracking
   *
   * @param {HTMLElement} element - Page container element to observe
   */
  const observePage = (element) => {
    if (element) {
      observer.observe(element);
    }
  };

  /**
   * Stop observing a page element
   *
   * @param {HTMLElement} element - Page container element to unobserve
   */
  const unobservePage = (element) => {
    if (element) {
      observer.unobserve(element);
    }
  };

  // Cleanup observer when component unmounts
  onBeforeUnmount(() => {
    console.debug('Disconnecting page visibility observer');
    observer.disconnect();
  });

  return {
    // State
    visiblePages,
    mostVisiblePage,

    // Methods
    observePage,
    unobservePage,
  };
}
