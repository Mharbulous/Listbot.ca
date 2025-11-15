import { useQueueHelpers } from './useQueueHelpers';
import { useQueueMetadataFilter } from './useQueueMetadataFilter';
import { useQueueHashProcessing } from './useQueueHashProcessing';

/**
 * Queue Core Composable - Main Entry Point
 *
 * TERMINOLOGY - Source Files:
 * ============================
 * This composable provides core queue deduplication logic for SOURCE FILES.
 * Source files are digital files from the user's device BEFORE upload to Firebase Storage.
 *
 * It works with file reference objects containing Browser File objects and metadata
 * from the user's filesystem.
 *
 * NOTE: Switched from BLAKE3 to XXH32 for performance comparison
 *
 * ARCHITECTURE:
 * =============
 * This composable has been decomposed into focused modules:
 * - useQueueHelpers: Utility functions (path extraction, filtering, hashing, file selection)
 * - useQueueMetadataFilter: Metadata pre-filtering and path hierarchy optimization
 * - useQueueHashProcessing: Hash-based deduplication logic
 *
 * This main file combines all sub-composables and exports a unified interface
 * for backward compatibility with existing code.
 */
export function useQueueCore() {
  // Initialize sub-composables
  const helpers = useQueueHelpers();
  const metadataFilter = useQueueMetadataFilter();
  const hashProcessing = useQueueHashProcessing();

  // Return unified interface (maintains backward compatibility)
  return {
    // Core deduplication methods
    getFilePath: helpers.getFilePath,
    generateFileHash: helpers.generateFileHash,
    chooseBestFile: helpers.chooseBestFile,
    processMainThreadDeduplication: hashProcessing.processMainThreadDeduplication,
    processDuplicateGroups: hashProcessing.processDuplicateGroups,

    // File filtering methods
    isFileInSkippedFolder: helpers.isFileInSkippedFolder,
    filterFilesFromSkippedFolders: helpers.filterFilesFromSkippedFolders,

    // Phase 3a: Metadata pre-filter optimization
    preFilterByMetadataAndPath: metadataFilter.preFilterByMetadataAndPath,
    findBestMatchingFile: metadataFilter.findBestMatchingFile,
  };
}
