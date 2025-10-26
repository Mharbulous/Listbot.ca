/**
 * Performance Monitor Utility
 * Provides consistent performance measurement and logging for Cloud Table
 */

export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.metrics = {};
  }

  start(operation) {
    this.metrics[operation] = {
      startTime: performance.now(),
      startMemory: performance.memory?.usedJSHeapSize || 0
    };
  }

  end(operation, meta = {}) {
    const metric = this.metrics[operation];
    if (!metric) return;

    const duration = performance.now() - metric.startTime;
    const memoryDelta = (performance.memory?.usedJSHeapSize || 0) - metric.startMemory;

    return { duration, memoryDelta };
  }

  measure(operation, fn) {
    this.start(operation);
    const result = fn();
    this.end(operation);
    return result;
  }

  async measureAsync(operation, fn) {
    this.start(operation);
    const result = await fn();
    this.end(operation);
    return result;
  }
}
