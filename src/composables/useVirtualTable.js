/**
 * Virtual Table Composable
 * Wraps TanStack Virtual for vertical row virtualization
 */

import { computed, ref } from 'vue';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/vue-virtual';

/**
 * Setup virtual scrolling for table rows
 * @param {Object} options - Configuration options
 * @param {Ref<Array>} options.data - Reactive array of data items
 * @param {Ref<HTMLElement>} options.scrollContainer - Ref to scrollable container element (optional for window mode)
 * @param {number} options.estimateSize - Estimated row height in pixels (default: 48)
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @param {boolean} options.enableSmoothScroll - Enable smooth scrolling (default: true)
 * @param {boolean} options.useWindowScrolling - Use window scrolling instead of container (default: false)
 * @param {number} options.scrollMargin - Margin at top for fixed headers (default: 0, typically 80px for AppHeader)
 * @returns {Object} Virtualizer instance and helper computed properties
 */
export function useVirtualTable(options) {
  const {
    data,
    scrollContainer,
    estimateSize = 48,
    overscan = 5,
    enableSmoothScroll = true,
    useWindowScrolling = false,
    scrollMargin = 0
  } = options;

  // Create virtualizer options as a computed (this makes all options reactive)
  const virtualizerOptions = computed(() => {
    const baseOptions = {
      // Total number of rows (plain value, reactivity comes from computed wrapper)
      count: data.value?.length || 0,

      // Estimated size of each row (must be consistent for smooth scrolling)
      estimateSize: () => estimateSize,

      // Number of items to render outside the visible viewport (improves scroll performance)
      overscan,

      // Enable smooth scrolling behavior
      enableSmoothScroll
    };

    // Add scroll element configuration based on mode
    if (useWindowScrolling) {
      // Window scrolling mode: use browser's main scrollbar
      // Don't set getScrollElement - useWindowVirtualizer handles this automatically
      baseOptions.scrollMargin = scrollMargin;
    } else {
      // Container scrolling mode: use a specific element's scrollbar
      baseOptions.getScrollElement = () => scrollContainer.value;
      baseOptions.scrollPaddingStart = 0;
      baseOptions.scrollPaddingEnd = 0;
    }

    return baseOptions;
  });

  // Create the virtualizer instance with reactive options
  // Use the appropriate virtualizer based on scrolling mode
  const rowVirtualizer = useWindowScrolling
    ? useWindowVirtualizer(virtualizerOptions)
    : useVirtualizer(virtualizerOptions);

  // Virtual items that should be rendered
  const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());

  // Total size of all items (for container height)
  const virtualTotalSize = computed(() => rowVirtualizer.value.getTotalSize());

  // Current scroll offset
  const scrollOffset = computed(() => rowVirtualizer.value.scrollOffset || 0);

  // Helper to get virtual range for debugging
  const virtualRange = computed(() => {
    const items = virtualItems.value;
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, totalRendered: 0 };
    }
    return {
      startIndex: items[0].index,
      endIndex: items[items.length - 1].index,
      totalRendered: items.length
    };
  });

  // Helper to get scroll metrics for debugging
  const scrollMetrics = computed(() => {
    const total = virtualTotalSize.value;
    const offset = scrollOffset.value;
    return {
      scrollOffset: offset,
      totalSize: total,
      visibleRatio: total > 0 ? ((offset / total) * 100).toFixed(1) + '%' : '0%'
    };
  });

  return {
    rowVirtualizer,
    virtualItems,
    virtualTotalSize,
    scrollOffset,
    virtualRange,
    scrollMetrics,
    scrollMargin,
    useWindowScrolling
  };
}
