/**
 * Upload Processor Composable
 * Handles single file upload processing pipeline
 * Pipeline: Hash → Check Exists → Upload → Create Metadata
 */

import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { useFileProcessor } from './useFileProcessor.js';
import { useFileMetadata } from './useFileMetadata.js';
import { isNetworkError } from '../utils/networkUtils.js';
import { safeMetadata } from '../utils/uploadHelpers.js';
import { ref } from 'vue';

/**
 * Upload Processor Composable
 * @param {Function} updateFileStatus - Function to update file status
 * @returns {Object} Upload processor functions
 */
export function useUploadProcessor({ updateFileStatus }) {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();
  const { createMetadataRecord } = useFileMetadata();

  // Initialize file processor (with minimal params for adapter use)
  const fileProcessor = useFileProcessor({
    authStore,
    matterStore,
    queueDeduplication: ref([]), // Not used in new queue
    timeWarning: ref(null), // Not used in new queue
    updateUploadQueue: () => {}, // Not used in new queue
    updateAllFilesToReady: () => {}, // Not used in new queue
    analysisTimedOut: ref(false), // Not used in new queue
    skippedFolders: ref([]), // Not used in new queue
    allFilesAnalysis: ref({}), // Not used in new queue
    mainFolderAnalysis: ref({}), // Not used in new queue
  });

  /**
   * Process single file upload
   * Handles: Hash → Check Exists → Upload → Create Metadata
   * @param {Object} queueFile - File from upload queue
   * @param {AbortSignal} abortSignal - Abort signal for cancellation
   * @returns {Object} Result with success status
   */
  const processSingleFile = async (queueFile, abortSignal) => {
    try {
      // Step 1: Update status to hashing
      updateFileStatus(queueFile.id, 'hashing');
      console.log(`[UPLOAD] Hashing file: ${queueFile.name}`);

      // Step 2: Calculate file hash
      const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
      queueFile.hash = fileHash;

      // Step 3: Check if file exists in Firestore
      updateFileStatus(queueFile.id, 'checking');
      const existsResult = await fileProcessor.checkFileExists(fileHash);

      if (existsResult.exists) {
        // File already exists - create metadata only
        console.log(`[UPLOAD] File already exists, creating metadata only: ${queueFile.name}`);
        updateFileStatus(queueFile.id, 'skipped');

        await safeMetadata(
          async () => {
            await createMetadataRecord({
              sourceFileName: queueFile.name,
              lastModified: queueFile.sourceLastModified,
              fileHash,
              size: queueFile.size,
              originalPath: queueFile.folderPath
                ? `${queueFile.folderPath}/${queueFile.name}`
                : queueFile.name,
              sourceFileType: queueFile.sourceFile.type,
            });
          },
          `for existing file ${queueFile.name}`
        );

        return { success: true, skipped: true };
      }

      // Step 4: Upload file to storage
      updateFileStatus(queueFile.id, 'uploading');
      queueFile.uploadProgress = 0;

      console.log(`[UPLOAD] Uploading file: ${queueFile.name}`);

      // Upload with progress tracking
      const uploadResult = await fileProcessor.uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => {
          // Update progress in queue
          queueFile.uploadProgress = progress;
        }
      );

      // Step 5: Create metadata record
      updateFileStatus(queueFile.id, 'creating_metadata');
      console.log(`[UPLOAD] Creating metadata for: ${queueFile.name}`);

      await safeMetadata(
        async () => {
          await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath
              ? `${queueFile.folderPath}/${queueFile.name}`
              : queueFile.name,
            sourceFileType: queueFile.sourceFile.type,
            storageCreatedTimestamp: uploadResult.timeCreated,
          });
        },
        `for new file ${queueFile.name}`
      );

      // Step 6: Mark as completed
      updateFileStatus(queueFile.id, 'completed');
      console.log(`[UPLOAD] Completed: ${queueFile.name}`);

      return { success: true, skipped: false };
    } catch (error) {
      // Handle errors
      console.error(`[UPLOAD] Error uploading ${queueFile.name}:`, error);

      // Check if it's a network error
      if (isNetworkError(error)) {
        updateFileStatus(queueFile.id, 'network_error');
        queueFile.error = 'Network error - check connection';
      } else {
        updateFileStatus(queueFile.id, 'error');
        queueFile.error = error.message;
      }

      return { success: false, error };
    }
  };

  return {
    processSingleFile,
  };
}
