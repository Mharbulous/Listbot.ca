import { ref } from 'vue';

/**
 * Performance monitoring composable for tracking render times and DOM metrics
 * Tracks initial render time, DOM node count, and memory usage
 */
export function usePerformanceMonitor(componentName = 'Component') {
  const renderTime = ref(0);
  const domNodeCount = ref(0);
  const memoryUsage = ref(0);
  const isMonitoring = ref(false);
  const renderStartTime = ref(0);

  /**
   * Start performance monitoring
   */
  function startMonitoring() {
    renderStartTime.value = performance.now();
    isMonitoring.value = true;
  }

  /**
   * End performance monitoring and log results
   */
  function endMonitoring() {
    if (!isMonitoring.value) return;

    renderTime.value = performance.now() - renderStartTime.value;
    isMonitoring.value = false;

    // Count DOM nodes
    domNodeCount.value = document.getElementsByTagName('*').length;

    // Get memory usage if available
    if (performance.memory) {
      memoryUsage.value = performance.memory.usedJSHeapSize;
    }

    logPerformance();
  }

  /**
   * Log performance metrics to console
   */
  function logPerformance() {
    // Performance logging disabled
  }

  /**
   * Measure a specific operation
   */
  function measureOperation(name, operation) {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    return result;
  }

  /**
   * Measure an async operation
   */
  async function measureAsyncOperation(name, operation) {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    return result;
  }

  /**
   * Count visible DOM nodes in a container
   */
  function countVisibleNodes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return 0;

    return container.getElementsByTagName('*').length;
  }

  /**
   * Measure scrolling FPS
   */
  function measureScrollFPS(scrollContainer, duration = 2000) {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      let isScrolling = false;

      const container =
        typeof scrollContainer === 'string'
          ? document.querySelector(scrollContainer)
          : scrollContainer;

      if (!container) {
        resolve(0);
        return;
      }

      function countFrame() {
        if (isScrolling) {
          frameCount++;
          requestAnimationFrame(countFrame);
        }
      }

      function handleScroll() {
        if (!isScrolling) {
          isScrolling = true;
          frameCount = 0;
          lastTime = performance.now();
          requestAnimationFrame(countFrame);

          setTimeout(() => {
            isScrolling = false;
            const elapsed = performance.now() - lastTime;
            const fps = Math.round((frameCount / elapsed) * 1000);

            resolve(fps);
          }, duration);
        }
      }

      container.addEventListener('scroll', handleScroll, { once: true });
    });
  }

  /**
   * Get performance summary
   */
  function getSummary() {
    return {
      renderTime: renderTime.value,
      domNodeCount: domNodeCount.value,
      memoryUsage: memoryUsage.value,
      memoryMB: (memoryUsage.value / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Reset all metrics
   */
  function reset() {
    renderTime.value = 0;
    domNodeCount.value = 0;
    memoryUsage.value = 0;
    isMonitoring.value = false;
    renderStartTime.value = 0;
  }

  return {
    // State
    renderTime,
    domNodeCount,
    memoryUsage,
    isMonitoring,

    // Methods
    startMonitoring,
    endMonitoring,
    measureOperation,
    measureAsyncOperation,
    countVisibleNodes,
    measureScrollFPS,
    getSummary,
    reset,
  };
}

/**
 * Log performance comparison between two measurements
 */
export function comparePerformance(label, before, after) {
  console.group(`📊 Performance Comparison: ${label}`);

  const renderTimeDiff = after.renderTime - before.renderTime;
  const renderTimePercent = ((renderTimeDiff / before.renderTime) * 100).toFixed(1);

  console.log(`⏱️  Render Time:`);
  console.log(`   Before: ${before.renderTime.toFixed(2)}ms`);
  console.log(`   After: ${after.renderTime.toFixed(2)}ms`);
  console.log(
    `   Change: ${renderTimeDiff > 0 ? '+' : ''}${renderTimeDiff.toFixed(2)}ms (${renderTimePercent > 0 ? '+' : ''}${renderTimePercent}%)`
  );

  const nodeCountDiff = after.domNodeCount - before.domNodeCount;
  const nodeCountPercent = ((nodeCountDiff / before.domNodeCount) * 100).toFixed(1);

  console.log(`🔢 DOM Nodes:`);
  console.log(`   Before: ${before.domNodeCount.toLocaleString()}`);
  console.log(`   After: ${after.domNodeCount.toLocaleString()}`);
  console.log(
    `   Change: ${nodeCountDiff > 0 ? '+' : ''}${nodeCountDiff.toLocaleString()} (${nodeCountPercent > 0 ? '+' : ''}${nodeCountPercent}%)`
  );

  if (before.memoryUsage > 0 && after.memoryUsage > 0) {
    const memoryDiff = after.memoryUsage - before.memoryUsage;
    const memoryDiffMB = (memoryDiff / (1024 * 1024)).toFixed(2);

    console.log(`💾 Memory Usage:`);
    console.log(`   Before: ${before.memoryMB} MB`);
    console.log(`   After: ${after.memoryMB} MB`);
    console.log(`   Change: ${memoryDiff > 0 ? '+' : ''}${memoryDiffMB} MB`);
  }

  console.groupEnd();
}
