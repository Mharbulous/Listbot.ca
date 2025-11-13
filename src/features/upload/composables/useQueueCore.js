import { createApplicationError } from '../../../utils/errorMessages';
import { blake3 } from 'hash-wasm';

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
  const generateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Generate BLAKE3 hash with 128-bit output (16 bytes = 32 hex characters)
    const hash = await blake3(uint8Array, 128);

    // Return BLAKE3 hash of source file content (32 hex characters)
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
        // Multiple files with same hash - check if they're one-and-the-same or duplicate files
        const oneAndTheSameGroups = new Map(); // metadata_key -> [file_references]

        fileRefs.forEach((fileRef) => {
          // Create metadata signature for one-and-the-same source file detection
          const metadataKey = `${fileRef.metadata.sourceFileName}_${fileRef.metadata.sourceFileSize}_${fileRef.metadata.lastModified}`;

          console.log('[DEDUP-METADATA] Creating metadata key for:', {
            fileName: fileRef.file.name,
            metadataKey,
            metadata: fileRef.metadata,
          });

          if (!oneAndTheSameGroups.has(metadataKey)) {
            oneAndTheSameGroups.set(metadataKey, []);
          }
          oneAndTheSameGroups.get(metadataKey).push(fileRef);
        });

        // Handle one-and-the-same files and duplicate files
        for (const [metadataKey, oneAndTheSameFiles] of oneAndTheSameGroups) {
          console.log('[DEDUP-GROUPS] Processing metadata group:', {
            metadataKey,
            fileCount: oneAndTheSameFiles.length,
            files: oneAndTheSameFiles.map((f) => ({ name: f.file.name, path: f.path })),
          });

          if (oneAndTheSameFiles.length === 1) {
            // Unique file (different metadata from others with same hash)
            finalFiles.push(oneAndTheSameFiles[0]);
          } else {
            // One-and-the-same file selected multiple times
            // Keep first instance as ready, mark others as duplicate (shown in queue but cannot be selected)
            const chosenFile = oneAndTheSameFiles[0];
            finalFiles.push(chosenFile);

            console.log('[DEDUP-MARK] Found one-and-the-same files:', {
              count: oneAndTheSameFiles.length,
              chosenFile: chosenFile.file.name,
              duplicates: oneAndTheSameFiles.slice(1).map((f) => f.file.name),
            });

            // Mark subsequent instances as same (one-and-the-same)
            for (let i = 1; i < oneAndTheSameFiles.length; i++) {
              const sameFile = oneAndTheSameFiles[i];
              sameFile.status = 'same';
              sameFile.canUpload = false; // Disable checkbox
              console.log('[DEDUP-MARK] Marking as same (one-and-the-same):', {
                fileName: sameFile.file.name,
                status: sameFile.status,
                canUpload: sameFile.canUpload,
              });
              finalFiles.push(sameFile); // Keep in queue for visibility
            }
          }
        }

        // If we have multiple distinct files with same hash (duplicate files), choose the best one
        if (oneAndTheSameGroups.size > 1) {
          const allUniqueFiles = Array.from(oneAndTheSameGroups.values()).map((group) => group[0]);
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
  };
}
