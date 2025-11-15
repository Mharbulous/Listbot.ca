import { reactive, readonly } from 'vue';
import { xxhash128 } from 'hash-wasm';

/**
 * Lazy XXH3 Hash Tooltip Composable
 *
 * Provides on-hover XXH3 hash calculation for status tooltips.
 * Uses XXH128 for consistency with Phase 1 deduplication.
 */
export function useLazyXXH3Tooltip() {
  // Cache for calculated hashes - maps fileId to hash value
  const hashCache = reactive(new Map());

  // Track loading states - maps fileId to boolean
  const loadingStates = reactive(new Map());

  /**
   * Generate XXH3 content hash (XXH128)
   * Same algorithm as Phase 1 deduplication for consistency
   * @param {File} file - Browser File object to hash
   * @returns {Promise<string>} - XXH128 hash (32 hex characters)
   */
  const generateXXH3Hash = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Generate XXH128 hash (128-bit output = 32 hex characters)
      // XXH128 is ~10x faster than BLAKE3 for content hashing
      const hash = await xxhash128(uint8Array);

      return hash;
    } catch (error) {
      console.error('Error generating XXH3 hash for tooltip:', error);
      return 'Error calculating hash';
    }
  };

  /**
   * Start XXH3 hash calculation on hover
   * @param {string} fileId - Unique file identifier
   * @param {File} file - Browser File object to hash
   * @param {Object} queueFile - Queue file object to store hash on
   */
  const onTooltipHover = async (fileId, file, queueFile = null) => {
    // If hash is already cached, no need to do anything
    if (hashCache.has(fileId)) {
      return;
    }

    // If queueFile already has xxh3Hash, cache it and return
    if (queueFile?.xxh3Hash) {
      hashCache.set(fileId, queueFile.xxh3Hash);
      return;
    }

    // If already loading, don't start another calculation
    if (loadingStates.get(fileId)) {
      return;
    }

    // Set loading state immediately
    loadingStates.set(fileId, true);

    try {
      // Calculate XXH3 hash immediately
      const hash = await generateXXH3Hash(file);

      // Cache the result
      hashCache.set(fileId, hash);

      // IMPORTANT: Store hash on the queue file object
      // This prevents re-hashing and maintains consistency with Phase 1
      if (queueFile && !queueFile.xxh3Hash && hash !== 'Error calculating hash') {
        queueFile.xxh3Hash = hash;
        console.log('[XXH3-TOOLTIP] Stored hash on queue file:', {
          name: queueFile.name || queueFile.sourceName,
          hash: hash.substring(0, 8) + '...',
        });
      }
    } catch (error) {
      console.error(`Failed to calculate XXH3 hash for file ${fileId}:`, error);
      hashCache.set(fileId, 'Hash calculation failed');
    } finally {
      // Clear loading state
      loadingStates.set(fileId, false);
    }
  };

  /**
   * Get hash display text for tooltip
   * @param {string} fileId - Unique file identifier
   * @returns {string} - Hash display text (full hash or loading message)
   */
  const getHashDisplay = (fileId) => {
    if (hashCache.has(fileId)) {
      return hashCache.get(fileId);
    }

    if (loadingStates.get(fileId)) {
      return 'Calculating hash...';
    }

    return 'Hover to calculate hash';
  };

  /**
   * Get full hash value
   * @param {string} fileId - Unique file identifier
   * @returns {string|null} - Full hash or null if not cached
   */
  const getFullHash = (fileId) => {
    return hashCache.get(fileId) || null;
  };

  /**
   * Check if hash is cached
   * @param {string} fileId - Unique file identifier
   * @returns {boolean} - True if hash is cached
   */
  const hasHash = (fileId) => {
    return hashCache.has(fileId);
  };

  /**
   * Pre-populate cache with existing hash
   * @param {string} fileId - Unique file identifier
   * @param {string} existingHash - Existing XXH3 hash value
   */
  const populateExistingHash = (fileId, existingHash) => {
    if (existingHash && !hashCache.has(fileId)) {
      hashCache.set(fileId, existingHash);
    }
  };

  /**
   * Clear all cached data
   */
  const clearCache = () => {
    hashCache.clear();
    loadingStates.clear();
  };

  return {
    // Main API
    onTooltipHover,
    getHashDisplay,

    // Advanced API
    getFullHash,
    hasHash,
    populateExistingHash,
    clearCache,

    // State access (for debugging)
    hashCache: readonly(hashCache),
    loadingStates: readonly(loadingStates),
  };
}
