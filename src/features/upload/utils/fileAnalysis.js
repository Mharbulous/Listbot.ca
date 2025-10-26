/**
 * Source File Analysis Utility
 *
 * Analyzes source files from user's device (tier 2) for:
 * - Processing time estimation
 * - Duplication detection before upload
 * - Hardware-calibrated performance predictions
 *
 * Extracted from worker logic for reuse in UI components
 */

import {
  calculateCalibratedProcessingTime,
  getStoredHardwarePerformanceFactor,
} from './hardwareCalibration.js';

/**
 * Analyze source files from user's device to provide count, size, duplication estimates,
 * and hardware-calibrated time predictions before upload
 * @param {File[]} files - Array of File objects from user's device (source files)
 * @param {number} totalDirectoryCount - Total number of unique directories (optional)
 * @param {number} avgDirectoryDepth - Average directory nesting depth (optional)
 * @param {number} avgFileDepth - Average file nesting depth (optional)
 * @returns {Object} Analysis results with hardware-calibrated predictions
 */
export function analyzeFiles(
  files,
  totalDirectoryCount = 0,
  avgDirectoryDepth = 0,
  avgFileDepth = 0
) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      totalUploads: 0,
      totalSizeMB: 0,
      uniqueFiles: 0,
      duplicateCandidates: 0,
      estimatedDuplicationPercent: 0,
      timeMs: 0,
      timeSeconds: 0,
      totalDirectoryCount: totalDirectoryCount,
    };
  }

  // Step 1: Group source files by size to identify unique-sized files
  const fileSizeGroups = new Map(); // file_size -> [source files]

  files.forEach((file) => {
    const fileSize = file.size;

    if (!fileSizeGroups.has(fileSize)) {
      fileSizeGroups.set(fileSize, []);
    }
    fileSizeGroups.get(fileSize).push(file);
  });

  const uniqueFiles = [];
  const duplicateCandidates = [];

  // Step 2: Separate unique-sized source files from potential duplicates
  for (const [, fileGroup] of fileSizeGroups) {
    if (fileGroup.length === 1) {
      // Unique source file size - definitely not a duplicate
      uniqueFiles.push(...fileGroup);
    } else {
      // Multiple source files with same size - need hash verification
      duplicateCandidates.push(...fileGroup);
    }
  }

  // Calculate total size for source files requiring hash calculation
  const totalSizeForHashing = duplicateCandidates.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = totalSizeForHashing / (1024 * 1024);
  const totalUploadsSizeMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

  // Estimate duplication percentage based on source files needing hash verification
  // Use +1 buffer to avoid "less than 0%" scenarios and provide conservative estimate
  const bufferedDuplicateCandidates = duplicateCandidates.length + 1;
  const bufferedTotalFiles = files.length + 1;
  const estimatedDuplicationPercent = Math.round(
    (bufferedDuplicateCandidates / bufferedTotalFiles) * 100
  );

  // Hardware-calibrated predictions (always available)
  let hardwarePerformanceFactor = getStoredHardwarePerformanceFactor();
  let usedHardwareCalibration = false;

  if (!hardwarePerformanceFactor || hardwarePerformanceFactor <= 0) {
    // Use baseline H-factor for new users or invalid stored values
    hardwarePerformanceFactor = 1.61; // Standard baseline from performance analysis
  } else {
    usedHardwareCalibration = true;
  }

  const folderData = {
    totalUploads: files.length,
    duplicateCandidates: duplicateCandidates.length,
    duplicateCandidatesSizeMB: Math.round(totalSizeMB * 10) / 10,
    avgDirectoryDepth,
    totalDirectoryCount,
  };

  // Always generate calibrated prediction - never null
  const calibratedPrediction = calculateCalibratedProcessingTime(
    folderData,
    hardwarePerformanceFactor
  );

  // Calculate unique source file size (source files that can skip hash calculation)
  const uniqueFilesSizeMB = uniqueFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

  return {
    totalUploads: files.length,
    totalSizeMB: Math.round(totalFilesSizeMB * 10) / 10, // Round to 1 decimal
    uniqueFiles: uniqueFiles.length,
    uniqueFilesSizeMB: Math.round(uniqueFilesSizeMB * 10) / 10,
    duplicateCandidates: duplicateCandidates.length,
    duplicateCandidatesSizeMB: Math.round(totalSizeMB * 10) / 10,
    estimatedDuplicationPercent,

    // Hardware-calibrated predictions (always available)
    timeMs: calibratedPrediction.totalTimeMs,
    timeSeconds: calibratedPrediction.totalTimeSeconds,
    isHardwareCalibrated: usedHardwareCalibration,
    totalDirectoryCount: totalDirectoryCount,

    // Hardware-calibrated phase breakdown
    phases: calibratedPrediction.phases,
    calibration: calibratedPrediction.calibration,
  };
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatUploadSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format time duration in human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
export function formatDuration(seconds) {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}
