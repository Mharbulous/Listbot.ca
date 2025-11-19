/**
 * Virtual Table Composable
 * Wraps TanStack Virtual for vertical row virtualization
 */

import { computed, ref } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';

/**
 * Setup virtual scrolling for table rows
 * @param {Object} options - Configuration options
 * @param {Ref<Array>} options.data - Reactive array of data items
 * @param {Ref<HTMLElement>} options.scrollContainer - Ref to scrollable container element
 * @param {number} options.estimateSize - Estimated row height in pixels (default: 48)
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @param {boolean} options.enableSmoothScroll - Enable smooth scrolling (default: true)
 * @returns {Object} Virtualizer instance and helper computed properties
 */
export function useVirtualTable(options) {
  const {
    data,
    scrollContainer,
    estimateSize = 48,
    overscan = 5,
    enableSmoothScroll = true
  } = options;

  // Create virtualizer options as a computed (this makes all options reactive)
  const virtualizerOptions = computed(() => ({
    // Total number of rows (plain value, reactivity comes from computed wrapper)
    count: data.value?.length || 0,

    // Get the scrollable element (returns null initially, updates when ref attaches)
    getScrollElement: () => scrollContainer.value,

    // Estimated size of each row (must be consistent for smooth scrolling)
    estimateSize: () => estimateSize,

    // Number of items to render outside the visible viewport (improves scroll performance)
    overscan,

    // Enable smooth scrolling behavior
    enableSmoothScroll,

    // No padding at start of scroll area
    scrollPaddingStart: 0,

    // No padding at end of scroll area
    scrollPaddingEnd: 0
  }));

  // Create the virtualizer instance with reactive options
  const rowVirtualizer = useVirtualizer(virtualizerOptions);

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
    scrollMetrics
  };
}
