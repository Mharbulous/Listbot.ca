import { ref } from 'vue';
import { useUploadTableSorting } from './useUploadTable-sorting.js';
import { useUploadTableDeduplication } from './useUploadTable-deduplication.js';
import { useUploadTableDeduplicationSequential } from './useUploadTable-deduplication-sequential.js';
import { useUploadTableAddition } from './useUploadTable-addition.js';
import { useUploadTableManagement } from './useUploadTable-management.js';
import { useUploadTableHashVerification } from './useUploadTable-hashVerification.js';

/**
 * Main composable for managing upload table state
 * Orchestrates queue management, file processing, status updates, and deduplication
 *
 * This composable has been decomposed into focused modules for better maintainability:
 * - Sorting: Multi-level queue sorting logic
 * - Deduplication: Metadata pre-filtering and hash-based deduplication
 * - Addition: Two-phase batch file processing
 * - Management: CRUD operations and bulk actions
 * - Hash Verification: Lazy verification on hover/delete/upload
 */
export function useUploadTable(options = {}) {
  // Options for deduplication strategy
  const useSequentialDedup = options.useSequentialDedup || false;

  // ========================================================================
  // Core State
  // ========================================================================

  // Upload queue
  const uploadQueue = ref([]);

  // Duplicates visibility state
  const duplicatesHidden = ref(false);

  // Queue progress (for large batches >500 files)
  const queueProgress = ref({
    isQueueing: false,
    processed: 0,
    total: 0,
    cancelled: false,
    filesReady: 0,
    filesCopies: 0,
    filesDuplicates: 0,
    filesUnsupported: 0,
    filesReadError: 0,
  });

  // ========================================================================
  // Initialize Sub-Composables
  // ========================================================================

  const sorting = useUploadTableSorting(uploadQueue);

  // Choose deduplication strategy based on options
  const deduplication = useSequentialDedup
    ? useUploadTableDeduplicationSequential(uploadQueue)
    : useUploadTableDeduplication(uploadQueue);

  const addition = useUploadTableAddition(
    uploadQueue,
    queueProgress,
    deduplication.deduplicateAgainstExisting,
    sorting.sortQueueByGroupTimestamp
  );

  const management = useUploadTableManagement(uploadQueue, duplicatesHidden);

  const hashVerification = useUploadTableHashVerification(uploadQueue);

  // ========================================================================
  // Public API
  // ========================================================================

  return {
    // State
    uploadQueue,
    duplicatesHidden,
    queueProgress,

    // File Addition
    addFilesToQueue: addition.addFilesToQueue,
    cancelQueue: addition.cancelQueue,

    // Queue Management
    removeFromQueue: management.removeFromQueue,
    clearQueue: management.clearQueue,
    clearDuplicates: management.clearDuplicates,
    clearSkipped: management.clearSkipped,
    updateFileStatus: management.updateFileStatus,
    skipFile: management.skipFile,
    undoSkip: management.undoSkip,
    selectAll: management.selectAll,
    deselectAll: management.deselectAll,
    swapCopyToPrimary: management.swapCopyToPrimary,
    toggleDuplicatesVisibility: management.toggleDuplicatesVisibility,

    // Sorting (exposed for external use)
    sortQueueByGroupTimestamp: sorting.sortQueueByGroupTimestamp,

    // Hash Verification
    verifyHashOnHover: hashVerification.verifyHashOnHover,
    verifyHashBeforeDelete: hashVerification.verifyHashBeforeDelete,
    verifyHashBeforeUpload: hashVerification.verifyHashBeforeUpload,
  };
}
