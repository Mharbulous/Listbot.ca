/**
 * useAutoScroll.js
 *
 * Auto-scrolls the upload queue table to center files that change status during upload.
 * Only scrolls when the user is NOT hovering over the table.
 * Uses TanStack Virtual's scrollToIndex API for proper virtualized scrolling.
 */

import { ref, watch, onMounted, onUnmounted } from 'vue';

/**
 * @param {Ref<Array>} files - The files array to watch for status changes
 * @param {Ref<Object>} virtualizerRef - The virtualizer ref that exposes rowVirtualizer and scrollContainerRef
 * @param {Ref<boolean>} isUploading - Whether upload is in progress
 * @returns {Object} - { isHovering: Ref<boolean> }
 */
export function useAutoScroll(files, virtualizerRef, isUploading) {
  const isHovering = ref(false);
  const previousStatuses = ref(new Map());

  // Statuses that trigger auto-scroll
  const SCROLL_TRIGGER_STATUSES = ['completed', 'copied', 'duplicate', 'error'];

  /**
   * Scroll to center a file in the viewport using TanStack Virtual's scrollToIndex
   */
  const scrollToCenter = (fileIndex) => {
    const rowVirtualizer = virtualizerRef.value?.rowVirtualizer;

    if (!rowVirtualizer) {
      console.warn('[AUTO-SCROLL] Row virtualizer not available');
      return;
    }

    // Use TanStack Virtual's scrollToIndex method
    // This is the correct way to scroll with virtualized content
    rowVirtualizer.value.scrollToIndex(fileIndex, {
      align: 'center',
      behavior: 'smooth'
    });

    console.log('[AUTO-SCROLL] Scrolling to file at index', fileIndex);
  };

  /**
   * Watch for file status changes
   */
  watch(
    () => files.value,
    (newFiles) => {
      // Only auto-scroll during upload
      if (!isUploading.value) return;

      // Check each file for status changes
      newFiles.forEach((file, index) => {
        const previousStatus = previousStatuses.value.get(file.id);
        const currentStatus = file.status;

        // If status changed to a trigger status
        if (
          previousStatus &&
          previousStatus !== currentStatus &&
          SCROLL_TRIGGER_STATUSES.includes(currentStatus)
        ) {
          // Only scroll if not hovering
          if (!isHovering.value) {
            console.log('[AUTO-SCROLL] Status change detected', {
              fileId: file.id,
              fileName: file.name,
              previousStatus,
              currentStatus,
              isHovering: isHovering.value
            });

            scrollToCenter(index);
          } else {
            console.log('[AUTO-SCROLL] Skipping scroll (user hovering)', {
              fileId: file.id,
              fileName: file.name,
              currentStatus
            });
          }
        }

        // Update status tracking
        previousStatuses.value.set(file.id, currentStatus);
      });
    },
    { deep: true }
  );

  /**
   * Initialize status tracking when files first load
   */
  watch(
    () => files.value,
    (newFiles) => {
      if (newFiles && newFiles.length > 0) {
        newFiles.forEach(file => {
          if (!previousStatuses.value.has(file.id)) {
            previousStatuses.value.set(file.id, file.status);
          }
        });
      }
    },
    { immediate: true }
  );

  /**
   * Setup hover tracking
   */
  const handleMouseEnter = () => {
    isHovering.value = true;
  };

  const handleMouseLeave = () => {
    isHovering.value = false;
  };

  onMounted(() => {
    // Wait for next tick to ensure scrollContainerRef is available
    setTimeout(() => {
      const scrollContainer = virtualizerRef.value?.scrollContainerRef;
      if (scrollContainer) {
        scrollContainer.addEventListener('mouseenter', handleMouseEnter);
        scrollContainer.addEventListener('mouseleave', handleMouseLeave);
        console.log('[AUTO-SCROLL] Hover tracking initialized');
      } else {
        console.warn('[AUTO-SCROLL] Scroll container not available for hover tracking');
      }
    }, 100);
  });

  onUnmounted(() => {
    const scrollContainer = virtualizerRef.value?.scrollContainerRef;
    if (scrollContainer) {
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    }
  });

  return {
    isHovering
  };
}
