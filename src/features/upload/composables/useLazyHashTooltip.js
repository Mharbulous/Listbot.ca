import { reactive, readonly } from 'vue';
import { blake3 } from 'hash-wasm';

export function useLazyHashTooltip() {
  // Cache for calculated hashes - maps fileId to hash value
  const hashCache = reactive(new Map());

  // Track pending hover timeouts - maps fileId to timeout ID
  const hoverTimeouts = reactive(new Map());

  // Track loading states - maps fileId to boolean
  const loadingStates = reactive(new Map());

  // No hover delay - calculate immediately on hover
  // const HOVER_DELAY = 0 // Removed delay

  // Hash generation function (extracted from useQueueDeduplication.js)
  const generateFileHash = async (file) => {
    try {
      const hashStartTime = performance.now();
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Generate BLAKE3 hash with 128-bit output (16 bytes = 32 hex characters)
      const hash = await blake3(uint8Array, 128);

      const hashDuration = performance.now() - hashStartTime;
      console.log(`[HASH-PERF-TOOLTIP] ${file.name}: ${hashDuration.toFixed(2)}ms (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Return BLAKE3 hash of file content (32 hex characters)
      return hash;
    } catch (error) {
      console.error('Error generating hash for tooltip:', error);
      return 'Error calculating hash';
    }
  };

  // Start hash calculation immediately on hover
  const onTooltipHover = async (fileId, file, queueFile = null) => {
    // If hash is already cached, no need to do anything
    if (hashCache.has(fileId)) {
      return;
    }

    // If already loading, don't start another calculation
    if (loadingStates.get(fileId)) {
      return;
    }

    // Set loading state immediately
    loadingStates.set(fileId, true);

    try {
      // Calculate hash immediately
      const hash = await generateFileHash(file);

      // Cache the result
      hashCache.set(fileId, hash);

      // IMPORTANT: Also store hash on the queue file object if provided
      // This prevents wasteful re-hashing during upload or verification
      if (queueFile && !queueFile.hash && hash !== 'Error calculating hash') {
        queueFile.hash = hash;
        console.log('[HASH-TOOLTIP] Stored hash on queue file:', {
          name: queueFile.name || queueFile.sourceName,
          hash: hash.substring(0, 8) + '...',
        });
      }
    } catch (error) {
      console.error(`Failed to calculate hash for file ${fileId}:`, error);
      hashCache.set(fileId, 'Hash calculation failed');
    } finally {
      // Clear loading state
      loadingStates.set(fileId, false);
    }
  };

  // Handle mouse leave (no longer needs to cancel timeouts)
  const onTooltipLeave = () => {
    // No timeouts to cancel since we calculate immediately
    // Loading state will clear naturally when calculation completes
  };

  // Get hash display text for tooltip
  const getHashDisplay = (fileId) => {
    if (hashCache.has(fileId)) {
      const fullHash = hashCache.get(fileId);
      // Show truncated hash (first 8 characters + ...)
      return fullHash.length > 8 ? `${fullHash.substring(0, 8)}...` : fullHash;
    }

    if (loadingStates.get(fileId)) {
      return 'Calculating hash...';
    }

    return '...calculating hash...';
  };

  // Get full hash (for debugging or advanced use)
  const getFullHash = (fileId) => {
    return hashCache.get(fileId) || null;
  };

  // Check if hash is cached
  const hasHash = (fileId) => {
    return hashCache.has(fileId);
  };

  // Clear cache (useful for cleanup)
  const clearCache = () => {
    // Clear all maps
    hashCache.clear();
    hoverTimeouts.clear(); // Still used for tracking, even though no timeouts
    loadingStates.clear();
  };

  // Pre-populate cache with existing hashes (for files that already have hashes from deduplication)
  const populateExistingHash = (fileId, existingHash) => {
    if (existingHash && !hashCache.has(fileId)) {
      hashCache.set(fileId, existingHash);
    }
  };

  return {
    // Main API
    onTooltipHover,
    onTooltipLeave,
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
