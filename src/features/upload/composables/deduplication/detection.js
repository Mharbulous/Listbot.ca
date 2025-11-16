/**
 * Duplicate and copy detection logic for upload queue
 * Handles detection within hash groups using metadata comparison
 * Marks redundant files as duplicates and identifies copies
 */

/**
 * Group files by metadata within a hash group
 * MUST include folderPath to distinguish copies in different folders
 * @param {Array} items - Array of { queueItem, isExisting } with same hash
 * @returns {Map} - Map of metadataKey -> array of { queueItem, isExisting }
 */
function groupByMetadata(items) {
  const metadataGroups = new Map();

  items.forEach(({ queueItem, isExisting }) => {
    const metadataKey = `${queueItem.name}_${queueItem.size}_${queueItem.sourceLastModified}_${queueItem.folderPath}`;

    if (!metadataGroups.has(metadataKey)) {
      metadataGroups.set(metadataKey, []);
    }
    metadataGroups.get(metadataKey).push({ queueItem, isExisting });
  });

  return metadataGroups;
}

/**
 * Mark redundant files as duplicates
 * Within each metadata group, keep first instance and mark others as duplicate
 * @param {Map} metadataGroups - Groups from groupByMetadata
 */
function markRedundantFiles(metadataGroups) {
  for (const [, metadataItems] of metadataGroups) {
    if (metadataItems.length === 1) continue; // No redundant files

    // Keep first instance, mark others as duplicate
    for (let i = 1; i < metadataItems.length; i++) {
      const { queueItem } = metadataItems[i];
      queueItem.status = 'duplicate';
      queueItem.canUpload = false;
      queueItem.isDuplicate = true;
    }
  }
}

/**
 * Choose best file from unique files and mark others as copies
 * @param {Array} uniqueFiles - Array of first file from each metadata group
 * @param {Object} queueCore - Queue core utilities (for chooseBestFile)
 */
function markCopies(uniqueFiles, queueCore) {
  // Choose best file using priority rules
  const bestFile = queueCore.chooseBestFile(
    uniqueFiles.map(({ queueItem }) => ({
      metadata: {
        sourceFileName: queueItem.name,
        sourceFileSize: queueItem.size,
        lastModified: queueItem.sourceLastModified,
      },
      path: queueItem.folderPath + queueItem.name,
      originalIndex: queueItem.id,
    }))
  );

  // Mark all others as copies
  uniqueFiles.forEach(({ queueItem }) => {
    const filePath = queueItem.folderPath + queueItem.name;
    if (filePath !== bestFile.path) {
      queueItem.status = 'copy';
      queueItem.isCopy = true;
    }
  });
}

/**
 * Process a single hash group for duplicates and copies
 * @param {Array} items - Array of { queueItem, isExisting } with same hash
 * @param {Object} queueCore - Queue core utilities
 */
function processHashGroup(items, queueCore) {
  if (items.length === 1) return; // No duplicates

  // Group by metadata key (filename_size_modified_path)
  const metadataGroups = groupByMetadata(items);

  // Mark redundant files (exact same metadata + path)
  markRedundantFiles(metadataGroups);

  // Handle copies (same hash, different metadata - e.g., different folders)
  if (metadataGroups.size > 1) {
    // Get first file from each metadata group (excluding redundant files)
    const uniqueFiles = Array.from(metadataGroups.values()).map((group) => group[0]);

    // Choose best file and mark others as copies
    markCopies(uniqueFiles, queueCore);
  }
}

/**
 * Detect duplicates and copies within hash groups
 * @param {Map} hashGroups - Map of hash -> array of { queueItem, isExisting }
 * @param {Object} queueCore - Queue core utilities
 */
export function detectDuplicatesAndCopies(hashGroups, queueCore) {
  for (const [, items] of hashGroups) {
    processHashGroup(items, queueCore);
  }

  console.log(`  └─ [GROUPING] Identified duplicates and copies`);
}
