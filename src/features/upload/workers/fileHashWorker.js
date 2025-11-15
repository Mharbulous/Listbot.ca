/**
 * Web Worker for file hash processing
 * Handles XXH32 hash generation for file deduplication without blocking the main thread
 * NOTE: Switched from BLAKE3 to XXH32 for performance comparison
 */

import xxhash from 'xxhash-wasm';

// Initialize xxHash hasher (singleton pattern for performance)
let xxhashInstance = null;
const getXxHash = async () => {
  if (!xxhashInstance) {
    xxhashInstance = await xxhash();
  }
  return xxhashInstance;
};

// Worker-specific timing utility
let processingStartTime = null;

// Message types
const MESSAGE_TYPES = {
  PROCESS_FILES: 'PROCESS_FILES',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  PROCESSING_COMPLETE: 'PROCESSING_COMPLETE',
  ERROR: 'ERROR',
  HEALTH_CHECK: 'HEALTH_CHECK',
  HEALTH_CHECK_RESPONSE: 'HEALTH_CHECK_RESPONSE',
};

// Helper function to generate XXH32 hash (32-bit / 8 hex characters)
// NOTE: Switched from BLAKE3 to XXH32 for performance comparison
// XXH32 is significantly faster while maintaining good collision resistance
async function generateFileHash(file) {
  const hashStartTime = performance.now();
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Get xxHash instance and generate XXH32 hash with 32-bit output (4 bytes = 8 hex characters)
    const hasher = await getXxHash();
    const hash = hasher.h32ToString(uint8Array); // Returns zero-padded hex string

    const hashDuration = performance.now() - hashStartTime;
    if (hashDuration > 100) {
      // Log slow hashes for performance monitoring
      console.log(`[HASH-PERF] ${file.name}: ${hashDuration.toFixed(2)}ms (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }

    // Return XXH32 hash of source file content (8 hex characters)
    return hash;
  } catch (error) {
    throw new Error(`Failed to generate hash for file ${file.name}: ${error.message}`);
  }
}

// Helper function to get source file path consistently
function getFilePath(file) {
  return file.path || file.webkitRelativePath || file.name;
}

// Helper function to detect Windows shortcut files (.lnk)
// These files should be skipped as they contain no useful document content
function isShortcutFile(fileName) {
  if (!fileName) return false;
  return fileName.toLowerCase().endsWith('.lnk');
}

// Main source file processing logic
async function processFiles(files, batchId) {
  const totalUploads = files.length;
  let processedCount = 0;
  let lastProgressUpdate = 0;

  // Helper function to send throttled progress updates (max 1 per second)
  const sendProgressUpdate = () => {
    const now = Date.now();
    if (now - lastProgressUpdate >= 1000) {
      // 1 second throttle
      self.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        batchId,
        progress: {
          current: processedCount,
          total: totalUploads,
          percentage: Math.round((processedCount / totalUploads) * 100),
        },
      });
      lastProgressUpdate = now;
    }
  };

  try {
    // Initialize worker timing from first file processing
    if (processingStartTime === null) {
      processingStartTime = Date.now();
    }

    // Step 1: Group source files by size to identify unique-sized files
    // Note: Shortcut files (.lnk) go through normal deduplication but are marked for skipping
    const fileSizeGroups = new Map(); // file_size -> [file_references]

    files.forEach((fileData) => {
      const { id, file, originalIndex, customPath } = fileData;
      const fileSize = file.size;
      const fileRef = {
        id,
        file,
        originalIndex,
        path: customPath || getFilePath(file), // Use customPath first, fallback to getFilePath
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
        processedCount++;
        sendProgressUpdate();
      } else {
        // Multiple files with same size - need hash verification
        duplicateCandidates.push(...fileRefs);
      }
    }

    // Step 3: Hash potential duplicates and group by hash
    const hashGroups = new Map(); // hash_value -> [file_references]
    const hashFailures = []; // Track files that fail to hash

    // Performance tracking for hashing phase
    const hashingStartTime = performance.now();
    const totalHashBytes = duplicateCandidates.reduce((sum, f) => sum + f.file.size, 0);
    console.log(`[HASH-PERF] Starting hash of ${duplicateCandidates.length} files (${(totalHashBytes / 1024 / 1024).toFixed(2)} MB total)`);

    for (const fileRef of duplicateCandidates) {
      try {
        const hash = await generateFileHash(fileRef.file);
        fileRef.hash = hash;

        if (!hashGroups.has(hash)) {
          hashGroups.set(hash, []);
        }
        hashGroups.get(hash).push(fileRef);
      } catch (error) {
        // Hash failure - mark as read error
        fileRef.status = 'read error';
        fileRef.canUpload = false;
        hashFailures.push(fileRef);
        console.error(
          `[WORKER] Hash failed for ${fileRef.metadata.sourceFileName}:`,
          error.message
        );
      }

      processedCount++;
      sendProgressUpdate();
    }

    // Log hashing performance summary
    const hashingDuration = performance.now() - hashingStartTime;
    const throughputMBps = (totalHashBytes / 1024 / 1024) / (hashingDuration / 1000);
    console.log(`[HASH-PERF] Hashing complete: ${hashingDuration.toFixed(2)}ms for ${duplicateCandidates.length} files (${throughputMBps.toFixed(2)} MB/s)`);
    console.log(`[HASH-PERF] XXH32 Average: ${(hashingDuration / duplicateCandidates.length).toFixed(2)}ms per file`);

    const finalFiles = [];
    const duplicateFiles = [];

    // Step 4: Process hash groups to identify true duplicates vs identical source files selected twice
    for (const [, fileRefs] of hashGroups) {
      if (fileRefs.length === 1) {
        // Unique hash - not a duplicate
        finalFiles.push(fileRefs[0]);
      } else {
        // Multiple files with same hash - check if they're duplicates or copy files
        const duplicateGroups = new Map(); // metadata_key -> [file_references]

        fileRefs.forEach((fileRef) => {
          // Create metadata signature for duplicate file detection
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

          if (!duplicateGroups.has(metadataKey)) {
            duplicateGroups.set(metadataKey, []);
          }
          duplicateGroups.get(metadataKey).push(fileRef);
        });

        // Step 5: Handle duplicate files and copy files
        for (const [, duplicateFiles] of duplicateGroups) {
          if (duplicateFiles.length === 1) {
            // Unique file (different metadata from others with same hash)
            finalFiles.push(duplicateFiles[0]);
          } else {
            // Duplicate file selected multiple times (same hash AND same metadata)
            // Keep first instance as ready, mark others as duplicate (shown in queue but cannot be selected)
            const chosenFile = duplicateFiles[0];
            finalFiles.push(chosenFile);

            // Mark subsequent instances as duplicates (keep in queue for visibility)
            for (let i = 1; i < duplicateFiles.length; i++) {
              const duplicateFile = duplicateFiles[i];
              duplicateFile.status = 'duplicate';
              duplicateFile.canUpload = false;
              finalFiles.push(duplicateFile); // Keep in queue for visibility
            }
          }
        }

        // If we have multiple distinct source files with same hash (copy files), choose the best one
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

            // Mark others as copies (same hash, different metadata)
            allUniqueFiles.forEach((fileRef) => {
              if (fileRef !== bestFile) {
                const index = finalFiles.findIndex((f) => f === fileRef);
                if (index > -1) {
                  finalFiles.splice(index, 1);
                }
                fileRef.isCopy = true;
                duplicateFiles.push(fileRef);
              }
            });
          }
        }
      }
    }

    // Step 6: Combine unique and non-duplicate files
    const allFinalFiles = [...uniqueFiles, ...finalFiles];

    // Prepare result - remove File objects since they can't be transferred back
    // Mark shortcut files with skipReason for UI handling
    const readyFiles = allFinalFiles.map((fileRef) => {
      const result = {
        id: fileRef.id,
        originalIndex: fileRef.originalIndex,
        path: fileRef.path,
        metadata: fileRef.metadata,
        hash: fileRef.hash,
        status: fileRef.status || 'ready', // Preserve existing status (e.g., 'duplicate')
        canUpload: fileRef.canUpload !== undefined ? fileRef.canUpload : true, // Preserve canUpload flag
      };
      // Mark shortcut files so they can be skipped during upload
      if (isShortcutFile(fileRef.metadata.sourceFileName)) {
        result.skipReason = 'shortcut';
      }
      return result;
    });

    const copiesForQueue = duplicateFiles.map((fileRef) => {
      const result = {
        id: fileRef.id,
        originalIndex: fileRef.originalIndex,
        path: fileRef.path,
        metadata: fileRef.metadata,
        hash: fileRef.hash,
        isCopy: fileRef.isCopy, // Flag for copy files (same hash, different metadata)
        status: 'copy', // Use 'copy' status for files with meaningful metadata differences
      };
      // Mark shortcut files so they can be skipped during upload
      if (isShortcutFile(fileRef.metadata.sourceFileName)) {
        result.skipReason = 'shortcut';
      }
      return result;
    });

    const readErrorFiles = hashFailures.map((fileRef) => ({
      id: fileRef.id,
      originalIndex: fileRef.originalIndex,
      path: fileRef.path,
      metadata: fileRef.metadata,
      status: 'read error',
      canUpload: false,
    }));

    // Send completion message
    self.postMessage({
      type: MESSAGE_TYPES.PROCESSING_COMPLETE,
      batchId,
      result: {
        readyFiles,
        copyFiles: copiesForQueue, // Rename from duplicateFiles to copyFiles
        readErrorFiles, // Add hash failures
      },
    });
  } catch (error) {
    // Send error message
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      batchId,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

// Helper function to choose the best source file based on priority rules
function chooseBestFile(fileRefs) {
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

    // Priority 5: Original selection order (stable sort)
    return a.originalIndex - b.originalIndex;
  })[0];
}

// Worker message handler
self.onmessage = async function (event) {
  const { type, files, batchId, options, timestamp } = event.data;

  switch (type) {
    case MESSAGE_TYPES.PROCESS_FILES:
      await processFiles(files, batchId, options);
      break;

    case MESSAGE_TYPES.HEALTH_CHECK:
      // Respond to health check immediately
      self.postMessage({
        type: MESSAGE_TYPES.HEALTH_CHECK_RESPONSE,
        batchId,
        timestamp: timestamp,
        responseTime: Date.now(),
        status: 'healthy',
      });
      break;

    default:
      self.postMessage({
        type: MESSAGE_TYPES.ERROR,
        batchId,
        error: {
          message: `Unknown message type: ${type}`,
        },
      });
  }
};

// Export message types for use by main thread
self.MESSAGE_TYPES = MESSAGE_TYPES;
