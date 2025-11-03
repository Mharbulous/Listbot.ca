/**
 * Memory Usage Tracking Utility
 *
 * Monitors JavaScript heap memory usage to:
 * - Detect memory leaks in PDF caching
 * - Track memory overhead of rendered canvases
 * - Correlate memory usage with performance
 *
 * Note: performance.memory is only available in Chrome/Edge.
 * Other browsers will return { supported: false }.
 */

/**
 * Get current memory usage statistics
 *
 * @returns {Object} Memory usage information
 */
export function getMemoryStats() {
  // Check if performance.memory is available (Chrome/Edge only)
  if (!performance.memory) {
    return {
      supported: false,
      browser: 'Memory API not supported (use Chrome/Edge for memory tracking)',
    };
  }

  const usedMB = performance.memory.usedJSHeapSize / 1048576;
  const totalMB = performance.memory.totalJSHeapSize / 1048576;
  const limitMB = performance.memory.jsHeapSizeLimit / 1048576;
  const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;

  return {
    supported: true,
    usedHeap: `${usedMB.toFixed(1)} MB`,
    totalHeap: `${totalMB.toFixed(1)} MB`,
    limit: `${limitMB.toFixed(1)} MB`,
    usagePercent: `${usagePercent.toFixed(1)}%`,
    // Raw values for programmatic use
    raw: {
      usedBytes: performance.memory.usedJSHeapSize,
      totalBytes: performance.memory.totalJSHeapSize,
      limitBytes: performance.memory.jsHeapSizeLimit,
    },
  };
}

/**
 * Check if memory usage is approaching the limit
 *
 * @param {number} threshold - Warning threshold percentage (default: 80)
 * @returns {Object} Memory warning status
 */
export function getMemoryWarning(threshold = 80) {
  const stats = getMemoryStats();

  if (!stats.supported) {
    return {
      warning: false,
      message: 'Memory tracking not supported',
    };
  }

  const usagePercent = (stats.raw.usedBytes / stats.raw.limitBytes) * 100;

  if (usagePercent >= threshold) {
    return {
      warning: true,
      level: usagePercent >= 90 ? 'critical' : 'high',
      usagePercent: usagePercent.toFixed(1) + '%',
      message: `Memory usage ${usagePercent.toFixed(1)}% of limit`,
    };
  }

  return {
    warning: false,
    usagePercent: usagePercent.toFixed(1) + '%',
  };
}

/**
 * Format memory stats for console logging (compact format)
 *
 * @param {Object} stats - Memory stats object from getMemoryStats()
 * @param {number} cacheSize - Optional cache size to include
 * @returns {string} Compact string representation
 */
export function formatMemoryForLog(stats, cacheSize = null) {
  if (!stats.supported) {
    return 'Memory tracking unavailable';
  }

  const parts = [`heap: ${stats.usedHeap}`];

  if (cacheSize !== null) {
    parts.push(`cache: ${cacheSize} docs`);
  }

  const usage = parseFloat(stats.usagePercent);
  if (usage >= 80) {
    parts.push(`⚠️ ${stats.usagePercent} used`);
  }

  return parts.join(', ');
}

/**
 * Create a memory snapshot for comparison
 *
 * @param {string} label - Label for this snapshot
 * @returns {Object} Memory snapshot with timestamp and stats
 */
export function createMemorySnapshot(label) {
  return {
    label,
    timestamp: Date.now(),
    stats: getMemoryStats(),
  };
}

/**
 * Compare two memory snapshots
 *
 * @param {Object} before - Earlier snapshot
 * @param {Object} after - Later snapshot
 * @returns {Object} Memory delta information
 */
export function compareMemorySnapshots(before, after) {
  if (!before.stats.supported || !after.stats.supported) {
    return {
      supported: false,
      message: 'Memory tracking not supported',
    };
  }

  const deltaBytes = after.stats.raw.usedBytes - before.stats.raw.usedBytes;
  const deltaMB = deltaBytes / 1048576;
  const deltaTime = after.timestamp - before.timestamp;

  return {
    supported: true,
    deltaBytes,
    deltaMB: `${deltaMB >= 0 ? '+' : ''}${deltaMB.toFixed(1)} MB`,
    deltaTimeMs: deltaTime,
    fromLabel: before.label,
    toLabel: after.label,
    increased: deltaBytes > 0,
  };
}
