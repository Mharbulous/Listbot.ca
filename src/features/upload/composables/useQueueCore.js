import { createApplicationError } from '../../../utils/errorMessages';
import xxhash from 'xxhash-wasm';

// Initialize xxHash hasher (singleton pattern for performance)
let xxhashInstance = null;
const getXxHash = async () => {
  if (!xxhashInstance) {
    xxhashInstance = await xxhash();
  }
  return xxhashInstance;
};

/**
 * Queue Core Composable
 *
 * TERMINOLOGY - Source Files:
 * ============================
 * This composable provides core queue deduplication logic for SOURCE FILES.
 * Source files are digital files from the user's device BEFORE upload to Firebase Storage.
 *
 * It works with file reference objects containing Browser File objects and metadata
 * from the user's filesystem.
 *
 * NOTE: Switched from BLAKE3 to XXH128 for performance comparison
 */
export function useQueueCore() {
  // Helper function to get source file path consistently from various file reference formats
  const getFilePath = (fileRef) => {
    // Handle direct file objects
    if (fileRef instanceof File) {
      return fileRef.path || fileRef.webkitRelativePath || fileRef.name;
    }
    // Handle file reference objects
    return (
      fileRef.path ||
      fileRef.file?.webkitRelativePath ||
      fileRef.file?.path ||
      fileRef.file?.name ||
      fileRef.name
    );
  };

  // Legacy hash generation (kept for fallback compatibility)
  // NOTE: Switched from BLAKE3 to XXH128 for performance comparison
  const generateFileHash = async (file) => {
    const hashStartTime = performance.now();
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Get xxHash instance and generate XXH128 hash with 128-bit output (16 bytes = 32 hex characters)
    const hasher = await getXxHash();
    const hashValue = hasher.h128(uint8Array); // Returns BigInt (128-bit hash)
    const hash = hashValue.toString(16).padStart(32, '0'); // Convert to 32-char hex string

    const hashDuration = performance.now() - hashStartTime;
    console.log(`[HASH-PERF-FALLBACK] ${file.name}: ${hashDuration.toFixed(2)}ms (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Return XXH128 hash of source file content (32 hex characters)
    return hash;
  };

  // Legacy chooseBestFile (kept for fallback compatibility)
  const chooseBestFile = (fileRefs) => {
    return fileRefs.sort((a, b) => {
      // Priority 1: Earliest modification date
      if (a.metadata.lastModified !== b.metadata.lastModified) {
        return a.metadata.lastModified - b.metadata.lastModified;
      }

      // Priority 2: Longest folder path
      const aFolderPath = a.path.substring(0, a.path.lastIndexOf('/') + 1);
      const bFolderPath = b.path.substring(0, b.path.lastIndexOf('/') + 1);
      if (aFolderPath.length !== bFolderPath.length) {
        return bFolderPath.length - aFolderPath.length; // Descending (longest first)
      }

      // Priority 3: Shortest filename
      if (a.metadata.sourceFileName.length !== b.metadata.sourceFileName.length) {
        return a.metadata.sourceFileName.length - b.metadata.sourceFileName.length;
      }

      // Priority 4: Alphanumeric filename sort
      if (a.metadata.sourceFileName !== b.metadata.sourceFileName) {
        return a.metadata.sourceFileName.localeCompare(b.metadata.sourceFileName);
      }

      // Priority 5: Initial selection order (stable sort)
      return a.originalIndex - b.originalIndex;
    })[0];
  };

  // Helper function to check if file is in a skipped folder
  const isFileInSkippedFolder = (filePath, skippedFolders = []) => {
    if (!skippedFolders || skippedFolders.length === 0) {
      return false;
    }

    return skippedFolders.some((skippedPath) => {
      // Normalize paths for comparison
      const normalizedFilePath = filePath.replace(/\\/g, '/').toLowerCase();
      const normalizedSkippedPath = skippedPath.replace(/\\/g, '/').toLowerCase();

      return normalizedFilePath.startsWith(normalizedSkippedPath);
    });
  };

  // Filter files to exclude those from skipped folders
  const filterFilesFromSkippedFolders = (files, skippedFolders = []) => {
    if (!skippedFolders || skippedFolders.length === 0) {
      console.log('No skipped folders - processing all files');
      return { processableFiles: files, skippedFiles: [] };
    }

    const processableFiles = [];
    const skippedFiles = [];

    files.forEach((file) => {
      const filePath = getFilePath(file);

      if (isFileInSkippedFolder(filePath, skippedFolders)) {
        skippedFiles.push(file);
        console.log(`Skipping file from cloud folder: ${filePath}`);
      } else {
        processableFiles.push(file);
      }
    });

    console.log(
      `File filtering complete: ${processableFiles.length} processable, ${skippedFiles.length} skipped`
    );
    return { processableFiles, skippedFiles };
  };

  // Core deduplication logic extracted from main thread processing
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
          sourceFileType: file.type,
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
   * Find best matching file based on folder path hierarchy
   * Longer paths are "more specific" and win over shorter paths
   * @param {Object} newFile - New queue item to compare
   * @param {Array} existingMatches - Array of existing queue items with matching metadata
   * @returns {Object} - { file, type } where type is 'duplicate', 'promote_new', 'keep_existing', or 'copy'
   */
  const findBestMatchingFile = (newFile, existingMatches) => {
    const newFolderPath = newFile.folderPath;
    let bestMatch = null;
    let bestMatchScore = -1;
    let bestMatchType = null;

    for (const existing of existingMatches) {
      const existingFolderPath = existing.folderPath;

      // STOP immediately on exact match (highest priority)
      if (newFolderPath === existingFolderPath) {
        return { file: existing, type: 'duplicate' };
      }

      // NEW is more specific (longer) - ends with EXISTING path
      if (newFolderPath.endsWith(existingFolderPath)) {
        const score = existingFolderPath.length; // Longer suffix = better match
        if (score > bestMatchScore) {
          bestMatch = existing;
          bestMatchScore = score;
          bestMatchType = 'promote_new'; // Demote EXISTING, NEW becomes primary
        }
      }
      // EXISTING is more specific (longer) - ends with NEW path
      else if (existingFolderPath.endsWith(newFolderPath)) {
        const score = newFolderPath.length;
        if (score > bestMatchScore) {
          bestMatch = existing;
          bestMatchScore = score;
          bestMatchType = 'keep_existing'; // NEW is duplicate of EXISTING
        }
      }
    }

    // No parent/child match found → mark as copy of first match
    return {
      file: bestMatch || existingMatches[0],
      type: bestMatch ? bestMatchType : 'copy',
    };
  };

  /**
   * Pre-filter files by metadata and folder path hierarchy BEFORE hash calculation
   * Phase 3a optimization: Reduces initial processing time from ~10s to <2s for 1000-file double drop
   *
   * @param {Array} newQueueItems - New queue items to filter
   * @param {Array} existingQueue - Existing queue items (snapshot from BEFORE new items added)
   * @returns {Object} - { readyFiles, duplicateFiles, copyFiles, promotions }
   */
  const preFilterByMetadataAndPath = (newQueueItems, existingQueue) => {
    const t0 = performance.now();
    console.log('[PREFILTER] Starting metadata pre-filter:', {
      newFiles: newQueueItems.length,
      existingFiles: existingQueue.length,
    });

    const readyFiles = [];
    const duplicateFiles = [];
    const copyFiles = [];
    const promotions = [];

    // OPTIMIZATION: Build size map first (O(M) - one-time cost)
    // This groups existing files by size to reduce metadata comparisons from O(N×M) to O(N×k)
    // where k = avg files per size bucket (typically 3-5, not M which could be 1000+)
    const existingSizeMap = new Map();
    existingQueue.forEach((item) => {
      if (!existingSizeMap.has(item.size)) {
        existingSizeMap.set(item.size, []);
      }
      existingSizeMap.get(item.size).push(item);
    });

    // CRITICAL FIX: Pre-build metadata indices for EACH size group (O(M) total)
    // Previously this was built inside the new file loop = O(N×k) bug!
    // Now: Build once per size group, lookup O(1) per new file
    const metadataIndicesBySize = new Map();
    for (const [size, items] of existingSizeMap) {
      const metadataIndex = new Map();
      items.forEach((item) => {
        const metadataKey = `${item.name}_${item.size}_${item.sourceLastModified}`;
        if (!metadataIndex.has(metadataKey)) {
          metadataIndex.set(metadataKey, []);
        }
        metadataIndex.get(metadataKey).push(item);
      });
      metadataIndicesBySize.set(size, metadataIndex);
    }

    // Process each new file (O(N) with O(1) metadata lookups)
    newQueueItems.forEach((newFile) => {
      // EARLY EXIT: If size is unique, skip all metadata checks
      const existingSizeGroup = existingSizeMap.get(newFile.size);
      if (!existingSizeGroup || existingSizeGroup.length === 0) {
        readyFiles.push(newFile);
        return;
      }

      // Lookup pre-built metadata index for this size group (O(1))
      const metadataIndex = metadataIndicesBySize.get(newFile.size);

      // Check for metadata matches within same-size group
      const metadataKey = `${newFile.name}_${newFile.size}_${newFile.sourceLastModified}`;
      const existingMatches = metadataIndex.get(metadataKey);

      // No metadata matches → mark as ready
      if (!existingMatches || existingMatches.length === 0) {
        readyFiles.push(newFile);
        return;
      }

      // Find best match using folder path hierarchy
      const { file: bestMatch, type } = findBestMatchingFile(newFile, existingMatches);

      if (type === 'duplicate') {
        // Exact folder path match → NEW is duplicate of EXISTING
        duplicateFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      } else if (type === 'promote_new') {
        // NEW is more specific → promote NEW to ready, demote EXISTING to duplicate
        readyFiles.push(newFile);
        promotions.push({
          existingFileId: bestMatch.id,
          newPrimaryId: newFile.id,
        });
      } else if (type === 'keep_existing') {
        // EXISTING is more specific → NEW is duplicate of EXISTING
        duplicateFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      } else {
        // type === 'copy' - Different folder paths (not parent/child) → mark as copy
        copyFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      }
    });

    const preFilterTime = performance.now() - t0;
    console.log('[PREFILTER] Pre-filter complete:', {
      ready: readyFiles.length,
      duplicates: duplicateFiles.length,
      copies: copyFiles.length,
      promotions: promotions.length,
      preFilterTimeMs: preFilterTime.toFixed(2),
    });

    return { readyFiles, duplicateFiles, copyFiles, promotions };
  };

  // Process hash groups to identify true duplicates
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
        for (const [metadataKey, duplicateFiles] of duplicateGroups) {
          console.log('[DEDUP-GROUPS] Processing metadata group:', {
            metadataKey,
            fileCount: duplicateFiles.length,
            files: duplicateFiles.map((f) => ({ name: f.file.name, path: f.path })),
          });

          if (duplicateFiles.length === 1) {
            // Unique file (different metadata from others with same hash)
            finalFiles.push(duplicateFiles[0]);
          } else {
            // Duplicate file selected multiple times (same hash AND same metadata)
            // Keep first instance as ready, mark others as duplicate (shown in queue but cannot be selected)
            const chosenFile = duplicateFiles[0];
            finalFiles.push(chosenFile);

            console.log('[DEDUP-MARK] Found duplicate files:', {
              count: duplicateFiles.length,
              chosenFile: chosenFile.file.name,
              duplicates: duplicateFiles.slice(1).map((f) => f.file.name),
            });

            // Mark subsequent instances as duplicates
            for (let i = 1; i < duplicateFiles.length; i++) {
              const duplicateFile = duplicateFiles[i];
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
    // Core deduplication methods
    getFilePath,
    generateFileHash,
    chooseBestFile,
    processMainThreadDeduplication,
    processDuplicateGroups,

    // File filtering methods
    isFileInSkippedFolder,
    filterFilesFromSkippedFolders,

    // Phase 3a: Metadata pre-filter optimization
    preFilterByMetadataAndPath,
    findBestMatchingFile,
  };
}
