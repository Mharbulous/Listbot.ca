/**
 * Sequential Pre-filter for File Deduplication
 *
 * Algorithm source: planning/1. Ideas/BrahmClientDeDupeLogic.txt
 * Implementation tests: tests/unit/features/upload/composables/useSequentialPrefilter.test.js
 * Documentation: docs/architecture/file-processing.md (File Deduplication Strategy)
 *
 * STAGE 1: Pre-filter (main thread)
 * - Remove files with status='redundant' from previous runs
 * - Sort files by size (ascending), modified date (ascending), name (alphabetically)
 * - Sequential comparison with previous file
 * - Mark files as "Primary", "Copy", or "Duplicate" based on metadata + path
 * - Linear complexity: O(n log n) for sorting + O(n) for sequential scan
 *
 * STAGE 2: Hash verification (web worker)
 * - Only hash files marked "Copy" or "Duplicate"
 * - Compare hash with previous file to verify
 * - Upgrade to "Primary" if hashes differ
 * - Mark hash-verified duplicates as "Redundant" for removal in next batch
 *
 * TWO-PHASE CLEANUP LIFECYCLE:
 * Duplicate → (hash match) → Redundant → (next batch Stage 1) → Removed
 *
 * DEDUPLICATION TERMINOLOGY:
 * - "Primary": Files that will be uploaded (unique or best version)
 * - "Copy": Files with same content but different meaningful metadata
 * - "Duplicate": Files with identical content and metadata (folder path variations only)
 * - "Redundant": Hash-verified duplicates awaiting removal in next batch
 */

/**
 * Compare two folder paths to determine their relationship
 * @param {string} path1 - First folder path
 * @param {string} path2 - Second folder path
 * @returns {string} - 'identical', 'path1_longer', 'path2_longer', or 'different'
 */
function compareFolderPaths(path1, path2) {
  if (path1 === path2) {
    return 'identical';
  }

  // Check if path1 ends with path2 (path1 is longer/more specific)
  if (path1.endsWith(path2)) {
    return 'path1_longer';
  }

  // Check if path2 ends with path1 (path2 is longer/more specific)
  if (path2.endsWith(path1)) {
    return 'path2_longer';
  }

  return 'different';
}

/**
 * Stage 1: Pre-filter files by metadata (main thread)
 * Sorts files and performs sequential comparison to mark duplicates/copies
 *
 * CRITICAL: Modifies files in-place to set status, referenceFileId, etc.
 * Returns modified files in sorted order for hash verification stage
 *
 * @param {Array} allFiles - All files (existing + new) to pre-filter
 * @returns {Object} - { preFilterComplete: boolean, sortedFiles: Array, stats: Object }
 */
export function applySequentialPrefilter(allFiles) {
  const t0 = performance.now();

  console.log('[SEQUENTIAL-PREFILTER] Starting Stage 1: Pre-filter by metadata');
  console.log(`[SEQUENTIAL-PREFILTER] Processing ${allFiles.length} files`);

  // Step 1: Sort files by size (ascending), then modified date (ascending), then name (alphabetically)
  const sortedFiles = [...allFiles].sort((a, b) => {
    // Sort by size first (smallest first)
    if (a.size !== b.size) {
      return a.size - b.size;
    }

    // Then by modified date (oldest first)
    if (a.sourceLastModified !== b.sourceLastModified) {
      return a.sourceLastModified - b.sourceLastModified;
    }

    // Then by name (alphabetically)
    return a.name.localeCompare(b.name);
  });

  // Step 1.5: Remove files marked as 'redundant' from previous Stage 2 processing
  const redundantFiles = sortedFiles.filter(file => file.status === 'redundant');
  if (redundantFiles.length > 0) {
    console.log(
      `[SEQUENTIAL-PREFILTER] Removing ${redundantFiles.length} redundant files from previous processing`
    );
    redundantFiles.forEach(file => {
      console.log(`  - Removing: ${file.name}`);
    });
  }

  // Filter out redundant files
  const filteredFiles = sortedFiles.filter(file => file.status !== 'redundant');

  // Replace sortedFiles with filtered list
  sortedFiles.length = 0;
  sortedFiles.push(...filteredFiles);

  // Step 2: Edge case - first file is always "Primary"
  if (sortedFiles.length > 0) {
    sortedFiles[0].status = 'ready'; // "Primary" files have status 'ready'
    sortedFiles[0].canUpload = true;
    sortedFiles[0].isPrimary = true;
    sortedFiles[0].preFilterComplete = true;
  }

  // Step 3-9: Sequential comparison with previous file
  let primaryCount = 1; // First file is already marked as primary
  let copyCount = 0;
  let duplicateCount = 0;

  for (let i = 1; i < sortedFiles.length; i++) {
    const currentFile = sortedFiles[i];
    const previousFile = sortedFiles[i - 1];

    // Mark pre-filter as complete for this file (will be set below based on comparison)
    currentFile.preFilterComplete = true;

    // Step 4: Compare size to previous file
    if (currentFile.size !== previousFile.size) {
      // Different size → mark as "Primary"
      currentFile.status = 'ready';
      currentFile.canUpload = true;
      currentFile.isPrimary = true;
      primaryCount++;
      continue; // Go to next file (step 9)
    }

    // Step 5: Set status to "Copy" (tentatively)
    // IMPORTANT: referenceFileId points to PREVIOUS file for hash comparison in Stage 2
    currentFile.status = 'copy';
    currentFile.canUpload = true;
    currentFile.isCopy = true;
    currentFile.referenceFileId = previousFile.id;
    copyCount++;

    // Step 6: Compare date modified to previous file
    if (currentFile.sourceLastModified !== previousFile.sourceLastModified) {
      // Different modified date → keep as "Copy" and continue to next file
      continue; // Go to next file (step 9)
    }

    // Step 7: Compare file name to previous file
    if (currentFile.name !== previousFile.name) {
      // Different name → keep as "Copy" and continue to next file
      continue; // Go to next file (step 9)
    }

    // Step 8: Compare folder paths (same size, date, and name - check if truly duplicate)
    const pathComparison = compareFolderPaths(currentFile.folderPath, previousFile.folderPath);

    switch (pathComparison) {
      case 'identical':
        // 8a: Identical folder paths → mark as "Duplicate"
        currentFile.status = 'duplicate';
        currentFile.canUpload = false;
        currentFile.isDuplicate = true;
        currentFile.isCopy = false; // No longer a copy, it's a duplicate
        duplicateCount++;
        copyCount--; // Adjust count (was tentatively marked as copy)
        break;

      case 'path1_longer':
        // 8b: Current path ends with previous path (current is more specific)
        // Update reference and mark current as "Duplicate"
        previousFile.folderPathReference = currentFile.folderPath;
        currentFile.status = 'duplicate';
        currentFile.canUpload = false;
        currentFile.isDuplicate = true;
        currentFile.isCopy = false;
        duplicateCount++;
        copyCount--;
        break;

      case 'path2_longer':
        // 8c: Previous path ends with current path (previous is more specific)
        // Update reference and mark current as "Duplicate"
        currentFile.folderPathReference = previousFile.folderPath;
        currentFile.status = 'duplicate';
        currentFile.canUpload = false;
        currentFile.isDuplicate = true;
        currentFile.isCopy = false;
        duplicateCount++;
        copyCount--;
        break;

      case 'different':
        // Different paths (not parent/child) → keep as "Copy"
        // Already set in step 5, so no change needed
        break;
    }

    // Step 9: Continue to next file (implicit in for loop)
  }

  const preFilterTime = performance.now() - t0;

  // Step 10: Log completion
  console.log('[SEQUENTIAL-PREFILTER] Stage 1 complete:', {
    totalFiles: sortedFiles.length,
    redundantFilesRemoved: redundantFiles.length,
    primaryFiles: primaryCount,
    copyFiles: copyCount,
    duplicateFiles: duplicateCount,
    preFilterTime: `${preFilterTime.toFixed(2)}ms`,
  });

  return {
    preFilterComplete: true,
    sortedFiles, // Return sorted files for hash verification stage
    stats: {
      totalFiles: sortedFiles.length,
      redundantFilesRemoved: redundantFiles.length,
      primaryCount,
      copyCount,
      duplicateCount,
      preFilterTime,
    },
  };
}

/**
 * Stage 2: Hash verification (main thread or web worker)
 * Only hashes files marked "Copy" or "Duplicate" to verify they truly match
 *
 * IMPORTANT: Uses referenceFileId to find the file to compare with (not necessarily previous in array)
 * IMPORTANT: Always check if file already has hash before calculating
 * IMPORTANT: Always save hash value after calculating
 *
 * @param {Array} sortedFiles - Files in sorted order from Stage 1
 * @param {Function} hashFunction - Function to generate hash for a file
 * @param {Function} preFilterCompleteCheck - Function to check if pre-filter is complete
 * @returns {Promise<Object>} - { verificationComplete: boolean, stats: Object }
 */
export async function verifyWithHashing(sortedFiles, hashFunction, preFilterCompleteCheck) {
  const t0 = performance.now();

  console.log('[HASH-VERIFICATION] Starting Stage 2: Hash verification');
  console.log(`[HASH-VERIFICATION] Processing ${sortedFiles.length} files`);

  // Step 12: Wait for pre-filter to complete (with timeout)
  let preFilterCheckAttempts = 0;
  const maxAttempts = 10;

  while (!preFilterCompleteCheck() && preFilterCheckAttempts < maxAttempts) {
    console.warn('[HASH-VERIFICATION] Pre-filter not complete, waiting 1000ms...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    preFilterCheckAttempts++;
  }

  if (preFilterCheckAttempts >= maxAttempts) {
    console.error('[HASH-VERIFICATION] Pre-filter did not complete after 10 attempts, aborting');
    return {
      verificationComplete: false,
      stats: { error: 'Pre-filter timeout' },
    };
  }

  // Build file index for O(1) lookups by ID
  const fileIndex = new Map();
  sortedFiles.forEach(file => {
    fileIndex.set(file.id, file);
  });

  // Step 11-15: Loop through files from top to bottom, starting from second file
  let verifiedCount = 0;
  let upgradedToPrimaryCount = 0;
  let hashedCount = 0;
  let redundantCount = 0;

  for (let i = 1; i < sortedFiles.length; i++) {
    const currentFile = sortedFiles[i];

    // Step 13: Check if file has empty status (shouldn't happen if pre-filter is complete)
    if (!currentFile.status || currentFile.status === '') {
      console.warn('[HASH-VERIFICATION] File has empty status, waiting 1000ms...', currentFile.name);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check again after wait
      if (!currentFile.status || currentFile.status === '') {
        console.error('[HASH-VERIFICATION] File still has empty status after wait, aborting');
        return {
          verificationComplete: false,
          stats: { error: 'File status not set', fileName: currentFile.name },
        };
      }
    }

    // Step 14: Only process files marked as "Duplicate" or "Copy" that don't have a hash yet
    if (currentFile.status !== 'duplicate' && currentFile.status !== 'copy') {
      continue;
    }

    // Find the reference file (file to compare with)
    const referenceFile = fileIndex.get(currentFile.referenceFileId);
    if (!referenceFile) {
      console.error('[HASH-VERIFICATION] Reference file not found:', {
        currentFileName: currentFile.name,
        referenceFileId: currentFile.referenceFileId,
      });
      continue;
    }

    // Check if we need to calculate hash for current file
    if (!currentFile.hash) {
      try {
        currentFile.hash = await hashFunction(currentFile.sourceFile);
        hashedCount++;
      } catch (error) {
        console.error(`[HASH-VERIFICATION] Hash failed for ${currentFile.name}:`, error);
        currentFile.status = 'read error';
        currentFile.canUpload = false;
        continue;
      }
    }

    // Check if we need to calculate hash for reference file
    if (!referenceFile.hash) {
      try {
        referenceFile.hash = await hashFunction(referenceFile.sourceFile);
        hashedCount++;
      } catch (error) {
        console.error(`[HASH-VERIFICATION] Hash failed for ${referenceFile.name}:`, error);
        referenceFile.status = 'read error';
        referenceFile.canUpload = false;
        continue;
      }
    }

    // Compare hashes
    if (currentFile.hash !== referenceFile.hash) {
      // Step 15: Hashes differ → upgrade current file to "Primary"
      currentFile.status = 'ready';
      currentFile.canUpload = true;
      currentFile.isPrimary = true;
      currentFile.isCopy = false;
      currentFile.isDuplicate = false;
      delete currentFile.referenceFileId;
      upgradedToPrimaryCount++;
    } else {
      // Step 15: Hashes match - check if we should mark as redundant
      if (currentFile.status === 'duplicate') {
        // Same hash + Duplicate status → mark as Redundant
        currentFile.status = 'redundant';
        currentFile.canUpload = false;
        currentFile.isDuplicate = false;
        currentFile.isRedundant = true;
        redundantCount++;
      }
      // else: Status is 'copy' - keep as is
    }

    verifiedCount++;
  }

  const verificationTime = performance.now() - t0;

  console.log('[HASH-VERIFICATION] Stage 2 complete:', {
    totalFiles: sortedFiles.length,
    verifiedCount,
    hashedCount,
    upgradedToPrimaryCount,
    redundantCount,
    verificationTime: `${verificationTime.toFixed(2)}ms`,
  });

  return {
    verificationComplete: true,
    stats: {
      verifiedCount,
      hashedCount,
      upgradedToPrimaryCount,
      redundantCount,
      verificationTime,
    },
  };
}
