/**
 * Upload Processor Composable
 * Handles single file upload processing pipeline
 * Pipeline: Hash → Check Exists → Upload → Create Metadata
 */

import { useAuthStore } from '../../../core/stores/auth/authStore.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { useFileProcessor } from './useFileProcessor.js';
import { useFileMetadata } from './useFileMetadata.js';
import { isNetworkError } from '../utils/networkUtils.js';
import { safeMetadata } from '../utils/uploadHelpers.js';
import { ref } from 'vue';
import { db } from '../../../services/firebase.js';
import { doc, getDoc, updateDoc, setDoc, Timestamp, increment } from 'firebase/firestore';
import { updateFolderPaths } from '../utils/folderPathUtils.js';

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

  /**
   * Create copy metadata record (metadata-only upload for files with same hash but different metadata)
   * Assumes Evidence document already exists from primary file upload
   * @param {Object} queueFile - File from upload queue with status='copy'
   * @returns {Object} Result with success status
   */
  const createCopyMetadataRecord = async (queueFile) => {
    try {
      const authStore = useAuthStore();
      const matterStore = useMatterViewStore();
      const { generateMetadataHash } = useFileMetadata();

      const firmId = authStore.currentFirm;
      const matterId = matterStore.currentMatterId;

      if (!firmId || !matterId) {
        throw new Error('Missing firmId or matterId for copy metadata record');
      }

      // Generate metadata hash for this variant
      const metadataHash = await generateMetadataHash(
        queueFile.name,
        queueFile.sourceLastModified,
        queueFile.hash
      );

      // Extract folder path
      let currentFolderPath = '';
      if (queueFile.folderPath) {
        currentFolderPath = queueFile.folderPath;
      }

      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', queueFile.hash);

      // Check if Evidence doc exists (should exist from primary upload)
      const evidenceSnap = await getDoc(evidenceRef);

      if (!evidenceSnap.exists()) {
        // Evidence doc doesn't exist - this shouldn't happen in normal flow
        // Fall back to creating full metadata record
        console.warn(`[COPY] Evidence doc doesn't exist for copy file, creating full record: ${queueFile.name}`);
        await createMetadataRecord({
          sourceFileName: queueFile.name,
          lastModified: queueFile.sourceLastModified,
          fileHash: queueFile.hash,
          size: queueFile.size,
          originalPath: queueFile.folderPath
            ? `${queueFile.folderPath}/${queueFile.name}`
            : queueFile.name,
          sourceFileType: queueFile.sourceFile.type,
          storageCreatedTimestamp: undefined, // No storage upload for copy
        });
        return { success: true };
      }

      // Get existing folder paths for pattern recognition
      let existingFolderPaths = '';
      try {
        const metadataRef = doc(evidenceRef, 'sourceMetadata', metadataHash);
        const existingDoc = await getDoc(metadataRef);
        if (existingDoc.exists()) {
          existingFolderPaths = existingDoc.data().sourceFolderPath || '';
        }
      } catch (error) {
        // Silently catch errors when retrieving existing folder paths
      }

      // Update folder paths using pattern recognition
      const pathUpdate = updateFolderPaths(currentFolderPath, existingFolderPaths);

      // Create sourceMetadata subcollection document
      const metadataRecord = {
        sourceFileName: queueFile.name,
        sourceLastModified: Timestamp.fromMillis(queueFile.sourceLastModified),
        fileHash: queueFile.hash,
        sourceFolderPath: pathUpdate.folderPaths,
      };

      const metadataRef = doc(evidenceRef, 'sourceMetadata', metadataHash);
      await setDoc(metadataRef, metadataRecord);

      // Update Evidence document with embedded metadata variant
      await updateDoc(evidenceRef, {
        [`sourceMetadataVariants.${metadataHash}`]: {
          sourceFileName: queueFile.name,
          sourceLastModified: Timestamp.fromMillis(queueFile.sourceLastModified),
          sourceFolderPath: pathUpdate.folderPaths,
          uploadDate: Timestamp.now(),
        },
        sourceMetadataCount: increment(1),
      });

      console.log(`[COPY] Metadata variant created for: ${queueFile.name} (hash: ${metadataHash})`);

      return { success: true };
    } catch (error) {
      console.error(`[COPY] Error creating copy metadata for ${queueFile.name}:`, error);
      return { success: false, error };
    }
  };

  return {
    processSingleFile,
    createCopyMetadataRecord,
  };
}
