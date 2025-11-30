import { createApplicationError } from '../../../utils/errorMessages';
import { useQueueHelpers } from './useQueueHelpers';
import { getMimeType } from '../../../utils/mimeTypeDetector';

/**
 * Queue Hash Processing Composable
 *
 * Provides core hash-based deduplication logic for SOURCE FILES.
 * Handles size-based pre-filtering and BLAKE3 hash calculation for duplicate detection.
 *
 * DEDUPLICATION TERMINOLOGY:
 * - "duplicate": Files with identical content (hash) and core metadata where folder path variations
 *                have no informational value. Duplicates are not uploaded and their metadata is not copied.
 * - "copy": Files with the same hash value but different file metadata that IS meaningful.
 *           Copies are not uploaded to storage, but their metadata is recorded for informational value.
 * - "best" or "primary": The file with the most meaningful metadata that will be uploaded to storage.
 */
export function useQueueHashProcessing() {
  const { getFilePath, generateFileHash, chooseBestFile, filterFilesFromSkippedFolders } =
    useQueueHelpers();

  /**
   * Core deduplication logic extracted from main thread processing
   * @param {Array} files - Array of File objects to process
   * @param {Function} onProgress - Optional progress callback
   * @param {Array<string>} skippedFolders - Array of folder paths to skip
   * @returns {Promise<Object>} - { uniqueFiles, hashGroups, skippedFiles }
   */
  const processMainThreadDeduplication = async (files, onProgress = null, skippedFolders = []) => {
    // Filter out files from skipped folders before processing
    const { processableFiles, skippedFiles } = filterFilesFromSkippedFolders(files, skippedFolders);

    if (skippedFiles.length > 0) {
      console.log(`Excluded ${skippedFiles.length} files from skipped cloud folders`);
    }

    // Track progress for main thread processing
    // Note: Shortcut files (.lnk) go through normal deduplication but are marked for skipping later
    let processedCount = 0;
    const totalUploads = processableFiles.length;

    const sendProgress = () => {
      if (onProgress) {
        onProgress({
          current: processedCount,
          total: totalUploads,
          percentage: Math.round((processedCount / totalUploads) * 100),
          currentFile: processedCount < totalUploads ? processableFiles[processedCount]?.name : '',
        });
      }
    };

    // Send initial progress
    sendProgress();

    // Step 1: Group files by size to identify unique-sized files
    const fileSizeGroups = new Map(); // file_size -> [file_references]

    processableFiles.forEach((file, index) => {
      const fileSize = file.size;
      const fileRef = {
        file,
        originalIndex: index,
        path: getFilePath(file),
        metadata: {
          sourceFileName: file.name,
          sourceFileSize: file.size,
          sourceFileType: getMimeType(file), // Use MIME type with extension fallback
          lastModified: file.lastModified,
        },
      };

      if (!fileSizeGroups.has(fileSize)) {
        fileSizeGroups.set(fileSize, []);
      }
      fileSizeGroups.get(fileSize).push(fileRef);
    });

    const uniqueFiles = [];
    const duplicateCandidates = [];

    // Step 2: Separate unique-sized files from potential duplicates
    for (const [, fileRefs] of fileSizeGroups) {
      if (fileRefs.length === 1) {
        // Unique file size - definitely not a duplicate
        uniqueFiles.push(fileRefs[0]);
      } else {
        // Multiple files with same size - need hash verification
        duplicateCandidates.push(...fileRefs);
      }
    }

    // Step 3: Hash potential duplicates and group by hash
    const hashGroups = new Map(); // hash_value -> [file_references]

    for (const fileRef of duplicateCandidates) {
      try {
        const hash = await generateFileHash(fileRef.file);
        fileRef.hash = hash;

        if (!hashGroups.has(hash)) {
          hashGroups.set(hash, []);
        }
        hashGroups.get(hash).push(fileRef);

        // Update progress
        processedCount++;
        sendProgress();
      } catch (error) {
        const appError = createApplicationError(error, {
          fileProcessing: true,
          fileName: fileRef.file.name,
          fileSize: fileRef.file.size,
          processingMode: 'fallback',
        });

        console.error(`Failed to hash file ${fileRef.file.name}:`, appError);
        // Include file anyway without hash to avoid data loss - will be handled in final processing
        processedCount++;
        sendProgress();
      }
    }

    return { uniqueFiles, hashGroups, skippedFiles };
  };

  /**
   * Process hash groups to identify true duplicates
   * @param {Map} hashGroups - Map of hash values to file reference arrays
   * @returns {Object} - { finalFiles, duplicateFiles }
   */
  const processDuplicateGroups = (hashGroups) => {
    const finalFiles = [];
    const duplicateFiles = [];

    console.log('[DEDUP] Processing hash groups:', hashGroups.size, 'groups');

    for (const [hash, fileRefs] of hashGroups) {
      console.log('[DEDUP-HASH] Processing hash group:', {
        hash: hash.substring(0, 8) + '...',
        fileCount: fileRefs.length,
        files: fileRefs.map((f) => f.file.name),
      });

      if (fileRefs.length === 1) {
        // Unique hash - not a duplicate
        finalFiles.push(fileRefs[0]);
      } else {
        // Multiple files with same hash - check if they're duplicates or copy files
        const duplicateGroups = new Map(); // metadata_key -> [file_references]

        fileRefs.forEach((fileRef) => {
          // Create metadata signature for duplicate source file detection
          //
          // Files are considered duplicates when:
          //   - They have identical content (hash value) AND core metadata (name, size, modified date)
          //   - Folder path variations have no informational value
          //
          // Files are considered copies when:
          //   - They have identical content (hash value) BUT different file metadata that IS meaningful
          //
          // Do NOT include path in metadata key - path variations alone don't make files copies
          const metadataKey = `${fileRef.metadata.sourceFileName}_${fileRef.metadata.sourceFileSize}_${fileRef.metadata.lastModified}`;

          console.log('[DEDUP-METADATA] Creating metadata key for:', {
            fileName: fileRef.file.name,
            path: fileRef.path,
            metadataKey,
            metadata: fileRef.metadata,
          });

          if (!duplicateGroups.has(metadataKey)) {
            duplicateGroups.set(metadataKey, []);
          }
          duplicateGroups.get(metadataKey).push(fileRef);
        });

        // Handle duplicate files and copy files
        for (const [metadataKey, duplicates] of duplicateGroups) {
          console.log('[DEDUP-GROUPS] Processing metadata group:', {
            metadataKey,
            fileCount: duplicates.length,
            files: duplicates.map((f) => ({ name: f.file.name, path: f.path })),
          });

          if (duplicates.length === 1) {
            // Unique file (different metadata from others with same hash)
            finalFiles.push(duplicates[0]);
          } else {
            // Duplicate file selected multiple times (same hash AND same metadata)
            // Keep first instance as ready, mark others as duplicate (shown in queue but cannot be selected)
            const chosenFile = duplicates[0];
            finalFiles.push(chosenFile);

            console.log('[DEDUP-MARK] Found duplicate files:', {
              count: duplicates.length,
              chosenFile: chosenFile.file.name,
              duplicates: duplicates.slice(1).map((f) => f.file.name),
            });

            // Mark subsequent instances as duplicates
            for (let i = 1; i < duplicates.length; i++) {
              const duplicateFile = duplicates[i];
              duplicateFile.status = 'duplicate';
              duplicateFile.canUpload = false; // Disable checkbox
              console.log('[DEDUP-MARK] Marking as duplicate:', {
                fileName: duplicateFile.file.name,
                status: duplicateFile.status,
                canUpload: duplicateFile.canUpload,
              });
              finalFiles.push(duplicateFile); // Keep in queue for visibility
            }
          }
        }

        // If we have multiple distinct files with same hash (copy files), choose the best one
        if (duplicateGroups.size > 1) {
          const allUniqueFiles = Array.from(duplicateGroups.values()).map((group) => group[0]);
          if (allUniqueFiles.length > 1) {
            const bestFile = chooseBestFile(allUniqueFiles);

            // Remove best file from finalFiles and add back with priority
            const bestIndex = finalFiles.findIndex((f) => f === bestFile);
            if (bestIndex > -1) {
              finalFiles.splice(bestIndex, 1);
            }
            finalFiles.push(bestFile);

            // Mark others as copies (Phase 3 terminology)
            allUniqueFiles.forEach((fileRef) => {
              if (fileRef !== bestFile) {
                const index = finalFiles.findIndex((f) => f === fileRef);
                if (index > -1) {
                  finalFiles.splice(index, 1);
                }
                fileRef.isCopy = true; // Mark as copy
                fileRef.status = 'copy'; // Set status for UI display
                finalFiles.push(fileRef); // Keep in queue for visibility (below best file)
                duplicateFiles.push(fileRef); // Also track separately for metadata processing
              }
            });
          }
        }
      }
    }

    console.log('[DEDUP-RESULT] Final results:', {
      totalFiles: finalFiles.length,
      statuses: finalFiles.map((f) => ({ name: f.file.name, status: f.status, canUpload: f.canUpload })),
    });

    return { finalFiles, duplicateFiles };
  };

  return {
    processMainThreadDeduplication,
    processDuplicateGroups,
  };
}
