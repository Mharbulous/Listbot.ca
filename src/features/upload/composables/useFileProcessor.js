/**
 * File Processor Composable
 * Handles core file processing operations including hashing, uploading, and deduplication
 */

import { blake3 } from 'hash-wasm';
import { storage, db } from '../../../services/firebase.js';
import {
  ref as storageRef,
  getDownloadURL,
  getMetadata,
  uploadBytesResumable,
} from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import {
  calculateCalibratedProcessingTime,
  getStoredHardwarePerformanceFactor,
} from '../utils/hardwareCalibration.js';
import { startProcessingTimer, resetProcessingTimer } from '../utils/processingTimer.js';

/**
 * File Processor Composable
 * @param {Object} params - Configuration parameters
 * @returns {Object} File processing functions
 */
export const useFileProcessor = ({
  authStore,
  matterStore,
  queueDeduplication,
  timeWarning,
  updateUploadQueue,
  updateAllFilesToReady,
  analysisTimedOut,
  skippedFolders,
  allFilesAnalysis,
  mainFolderAnalysis,
}) => {
  /**
   * Calculate BLAKE3 hash for a file
   * Uses 128-bit output (32 hex characters)
   */
  const calculateFileHash = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Generate BLAKE3 hash with 128-bit output (16 bytes = 32 hex characters)
      const hash = await blake3(uint8Array, 128);

      // Return BLAKE3 hash of file content (32 hex characters)
      return hash;
    } catch (error) {
      throw new Error(`Failed to generate hash for file ${file.name}: ${error.message}`);
    }
  };

  /**
   * Generate storage path for uploaded file
   * Format: firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{extension}
   */
  const generateStoragePath = (fileHash, originalFileName) => {
    const extension = originalFileName.split('.').pop().toLowerCase();
    const matterId = matterStore.currentMatterId;
    if (!matterId) {
      throw new Error('No matter selected. Please select a matter before uploading files.');
    }
    return `firms/${authStore.currentFirm}/matters/${matterId}/uploads/${fileHash}.${extension}`;
  };

  /**
   * Check if file already exists in Firestore
   * Uses direct document lookup with fileHash as document ID
   */
  const checkFileExists = async (fileHash) => {
    try {
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before checking files.');
      }

      // Direct document lookup using fileHash as document ID
      const evidenceRef = doc(
        db,
        'firms',
        authStore.currentFirm,
        'matters',
        matterId,
        'evidence',
        fileHash
      );
      const docSnap = await getDoc(evidenceRef);
      return docSnap.exists();
    } catch {
      return false;
    }
  };

  /**
   * Upload single file to Firebase Storage
   * Returns download URL and storage created timestamp on success
   */
  const uploadSingleFile = async (file, fileHash, originalFileName, abortSignal = null) => {
    const storagePath = generateStoragePath(fileHash, originalFileName);
    const storageReference = storageRef(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageReference, file, {
      customMetadata: {
        firmId: authStore.currentFirm,
        userId: authStore.user.uid,
        originalName: originalFileName,
        hash: fileHash,
      },
    });

    return new Promise((resolve, reject) => {
      // Handle abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          uploadTask.cancel();
          reject(new Error('AbortError'));
        });
      }

      uploadTask.on(
        'state_changed',
        () => {
          if (abortSignal && abortSignal.aborted) {
            uploadTask.cancel();
            reject(new Error('AbortError'));
          }
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(uploadTask.snapshot.ref);
            const storageCreatedTimestamp = metadata.timeCreated;
            resolve({ success: true, downloadURL, storageCreatedTimestamp });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  /**
   * Helper function to check if processing was aborted
   */
  const isAborted = () => analysisTimedOut.value;

  /**
   * Generate hardware-calibrated time estimate for file processing
   * Uses H-Factor system for accurate predictions
   */
  const generateHardwareCalibratedEstimate = (files) => {
    let hardwarePerformanceFactor = getStoredHardwarePerformanceFactor();
    if (!hardwarePerformanceFactor || hardwarePerformanceFactor <= 0) {
      hardwarePerformanceFactor = 1.61; // Baseline H-factor
    }

    const sizeMap = new Map();
    files.forEach((file) => {
      const size = file.size || 0;
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
    });
    const duplicateCandidates = files.filter((file) => sizeMap.get(file.size || 0) > 1);
    const duplicateCandidatesSizeMB =
      duplicateCandidates.reduce((sum, file) => sum + (file.size || 0), 0) / (1024 * 1024);

    const folderData = {
      totalUploads: files.length,
      duplicateCandidates: duplicateCandidates.length,
      duplicateCandidatesSizeMB: Math.round(duplicateCandidatesSizeMB * 10) / 10,
      avgDirectoryDepth: 2.5,
      totalDirectoryCount: 1,
    };

    const calibratedPrediction = calculateCalibratedProcessingTime(
      folderData,
      hardwarePerformanceFactor
    );
    return calibratedPrediction.totalTimeMs;
  };

  /**
   * Process files with queue integration and deduplication
   * Main entry point for file processing workflow
   */
  const processFilesWithQueue = async (files) => {
    if (isAborted() || !files || files.length === 0) {
      return;
    }

    // Start time monitoring if not already started
    if (files.length > 0 && !timeWarning.startTime.value) {
      const folderAnalysis = allFilesAnalysis.value || mainFolderAnalysis.value;
      let estimatedTime = 0;

      if (folderAnalysis && folderAnalysis.timeMs && folderAnalysis.timeMs > 0) {
        estimatedTime = folderAnalysis.timeMs;
      } else {
        estimatedTime = generateHardwareCalibratedEstimate(files);
      }

      if (estimatedTime > 0) {
        timeWarning.startMonitoring(estimatedTime);
      }
    }

    if (isAborted()) {
      return;
    }

    // Safety filter: exclude any files from skipped folders
    let filesToProcess = files;
    if (skippedFolders.value && skippedFolders.value.length > 0) {
      filesToProcess = files.filter((file) => {
        const filePath = file.path || file.webkitRelativePath || file.name;
        const isInSkippedFolder = skippedFolders.value.some((skippedPath) => {
          const normalizedFilePath = filePath.replace(/\\/g, '/').toLowerCase();
          const normalizedSkippedPath = skippedPath.replace(/\\/g, '/').toLowerCase();
          return normalizedFilePath.startsWith(normalizedSkippedPath);
        });

        if (isInSkippedFolder) {
          return false;
        }
        return true;
      });
    }

    if (isAborted()) {
      return;
    }

    try {
      if (isAborted()) {
        return;
      }

      // Start processing timer for performance tracking
      startProcessingTimer();

      await queueDeduplication.processFiles(filesToProcess, updateUploadQueue);

      if (isAborted()) {
        return;
      }

      updateAllFilesToReady();
      timeWarning.resetMonitoring();
      queueDeduplication.clearTimeMonitoringCallback();
      resetProcessingTimer();
    } catch (error) {
      if (isAborted()) {
        return;
      }

      timeWarning.resetMonitoring();
      queueDeduplication.clearTimeMonitoringCallback();
      resetProcessingTimer();
      throw error;
    }
  };

  return {
    calculateFileHash,
    generateStoragePath,
    checkFileExists,
    uploadSingleFile,
    generateHardwareCalibratedEstimate,
    processFilesWithQueue,
    isAborted,
  };
};
