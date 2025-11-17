/**
 * Shared Queue State Composable
 * Provides reactive state for queue addition completion tracking
 *
 * This composable replaces the global window.queueAdditionComplete flag
 * with a Vue 3 reactive ref to eliminate polling and enable reactive patterns.
 *
 * State lifecycle:
 * 1. Reset to false when file selection starts (Testing.vue)
 * 2. Set to true when all files are added to queue (useUploadTable-addition.js)
 * 3. Watched by verification composable to trigger auto-verification (useSequentialVerification.js)
 * 4. Reset to false after metrics logging (UploadTableVirtualizer.vue)
 */

import { ref } from 'vue';

// Shared reactive state for queue addition completion
// This ref is shared across all component instances
const queueAdditionComplete = ref(false);

/**
 * Composable for accessing queue state
 * @returns {Object} Queue state and controls
 */
export function useQueueState() {
  return {
    queueAdditionComplete,
  };
}
