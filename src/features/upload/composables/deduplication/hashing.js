/**
 * Hash calculation logic for upload queue deduplication
 * Handles hash calculation with web worker and fallback to main thread
 * Optimizes by grouping files by size first (files with unique sizes can't be duplicates)
 */

/**
 * Group files by size for optimization
 * Files with unique sizes can't be duplicates, so they skip hashing
 * @param {Array} allFiles - Combined array of existing + ready new files
 * @param {number} existingCount - Number of existing files (for isExisting flag)
 * @returns {Map} - Map of size -> array of { queueItem, isExisting, index }
 */
function groupFilesBySize(allFiles, existingCount) {
  const sizeGroups = new Map();
  allFiles.forEach((item, index) => {
    if (!sizeGroups.has(item.size)) {
      sizeGroups.set(item.size, []);
    }
    sizeGroups.get(item.size).push({
      queueItem: item,
      isExisting: index < existingCount,
      index,
    });
  });
  return sizeGroups;
}

/**
 * Extract files that need hashing from size groups
 * Only files with duplicate sizes need hashing
 * @param {Map} sizeGroups - Size groups from groupFilesBySize
 * @returns {Array} - Array of { queueItem, isExisting } for files needing hashing
 */
function extractFilesToHash(sizeGroups) {
  const filesToHash = [];
  for (const [, items] of sizeGroups) {
    if (items.length > 1) {
      filesToHash.push(...items);
    }
  }
  return filesToHash;
}

/**
 * Prepare files for worker hashing
 * Creates array of files and mapping for results
 * @param {Array} filesToHash - Files that need hashing
 * @returns {Object} - { filesToHashArray, fileIndexMap }
 */
function prepareFilesForWorker(filesToHash) {
  const filesToHashArray = [];
  const fileIndexMap = new Map(); // Maps array index -> { queueItem, isExisting }

  filesToHash.forEach(({ queueItem, isExisting }) => {
    if (!queueItem.hash) {
      // Store file with index for mapping results back
      const fileWithPath = queueItem.sourceFile;
      // Preserve custom path property if it exists
      if (queueItem.folderPath || queueItem.name) {
        fileWithPath.path = queueItem.folderPath + queueItem.name;
      }
      // Map the array index to queue item (worker returns originalIndex = position in array)
      const arrayIndex = filesToHashArray.length;
      fileIndexMap.set(arrayIndex, { queueItem, isExisting });
      filesToHashArray.push(fileWithPath);
    }
  });

  return { filesToHashArray, fileIndexMap };
}

/**
 * Hash files using web worker
 * @param {Array} filesToHashArray - Array of files to hash
 * @param {Map} fileIndexMap - Mapping of array index to queue item
 * @param {Object} queueWorkers - Queue workers utilities
 * @returns {Promise<number>} - Number of files successfully hashed
 */
async function hashWithWorker(filesToHashArray, fileIndexMap, queueWorkers) {
  const workerResult = await queueWorkers.processFilesWithWorker(filesToHashArray);

  if (!workerResult.success) {
    return 0;
  }

  // Map worker results back to queue items
  const allWorkerFiles = [
    ...workerResult.result.readyFiles,
    ...workerResult.result.duplicateFiles,
  ];

  let hashedCount = 0;
  allWorkerFiles.forEach((fileResult) => {
    // Find the corresponding queue item by originalIndex
    const mappingEntry = fileIndexMap.get(fileResult.originalIndex);
    if (mappingEntry && fileResult.hash) {
      mappingEntry.queueItem.hash = fileResult.hash;
      hashedCount++;
    }
  });

  return hashedCount;
}

/**
 * Hash files on main thread (fallback when worker unavailable)
 * @param {Map} fileIndexMap - Mapping of array index to queue item
 * @param {Object} queueCore - Queue core utilities (for generateFileHash)
 * @returns {Promise<number>} - Number of files successfully hashed
 */
async function hashOnMainThread(fileIndexMap, queueCore) {
  let hashedCount = 0;

  for (const { queueItem } of fileIndexMap.values()) {
    try {
      const hash = await queueCore.generateFileHash(queueItem.sourceFile);
      queueItem.hash = hash;
      hashedCount++;
    } catch (error) {
      console.error('  │  [HASH-ERROR]', queueItem.name, error.message);
      queueItem.status = 'read error';
      queueItem.canUpload = false;
    }
  }

  return hashedCount;
}

/**
 * Build hash groups from all files (both newly hashed and already hashed)
 * @param {Array} filesToHash - All files that were checked for hashing
 * @returns {Map} - Map of hash -> array of { queueItem, isExisting }
 */
function buildHashGroups(filesToHash) {
  const hashGroups = new Map();

  for (const { queueItem, isExisting } of filesToHash) {
    if (queueItem.hash) {
      // Use existing or newly generated hash
      const hash = queueItem.hash;

      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash).push({
        queueItem,
        isExisting,
      });
    } else if (queueItem.status !== 'read error') {
      // File wasn't hashed and isn't marked as error - this shouldn't happen
      console.error('  │  [HASH-ERROR]', queueItem.name, 'No hash generated');
      queueItem.status = 'read error';
      queueItem.canUpload = false;
    }
  }

  return hashGroups;
}

/**
 * Calculate hash groups for files that need deduplication
 * @param {Array} readyFiles - Files marked as ready by prefilter
 * @param {Array} existingQueueSnapshot - Snapshot of existing queue
 * @param {Object} queueCore - Queue core utilities
 * @param {Object} queueWorkers - Queue workers utilities
 * @returns {Promise<Object>} - { hashGroups: Map, hashTime: number, hashedCount: number, sizeGroupTime: number }
 */
export async function calculateHashGroups(
  readyFiles,
  existingQueueSnapshot,
  queueCore,
  queueWorkers
) {
  // Get all files that need to be checked (existing + ready new files)
  const allFiles = [...existingQueueSnapshot, ...readyFiles];

  // Group by size first (optimization - files with unique sizes can't be duplicates)
  const sizeGroupT0 = performance.now();
  const sizeGroups = groupFilesBySize(allFiles, existingQueueSnapshot.length);
  const sizeGroupTime = performance.now() - sizeGroupT0;

  // Find files that need hashing (multiple files with same size)
  const filesToHash = extractFilesToHash(sizeGroups);

  if (filesToHash.length === 0) {
    return { hashGroups: new Map(), hashTime: 0, hashedCount: 0, sizeGroupTime };
  }

  // Count how many files actually need hashing (don't already have a hash)
  const filesNeedingHash = filesToHash.filter(({ queueItem }) => !queueItem.hash).length;

  // Hash all files that need it
  if (filesNeedingHash > 0) {
    console.log(`  ├─ [HASH] Hashing ${filesNeedingHash} files using Web Worker...`);
  }

  const hashT0 = performance.now();
  const { filesToHashArray, fileIndexMap } = prepareFilesForWorker(filesToHash);

  // Try web worker first
  let hashedCount = 0;
  if (filesToHashArray.length > 0) {
    hashedCount = await hashWithWorker(filesToHashArray, fileIndexMap, queueWorkers);

    // Fallback to main thread if worker failed
    if (hashedCount === 0) {
      console.log(`  │  [HASH] Worker unavailable, falling back to main thread...`);
      hashedCount = await hashOnMainThread(fileIndexMap, queueCore);
    }
  }

  // Build hash groups from all files (both newly hashed and already hashed)
  const hashGroups = buildHashGroups(filesToHash);

  const hashTime = performance.now() - hashT0;

  return { hashGroups, hashTime, hashedCount, sizeGroupTime };
}
