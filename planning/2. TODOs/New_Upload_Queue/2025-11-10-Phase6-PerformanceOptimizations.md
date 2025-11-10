# Phase 6: Performance Optimizations - Speed & Scale

**Phase:** 6 of 8
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 3-4 days
**Dependencies:** Phases 1-5

---

## Overview

Maximize performance for large batches through batch updates, parallel hash processing, and smart caching.

**Goal:** Sub-second queue loads, parallel processing
**Deliverable:** Optimized performance infrastructure
**User Impact:** Handle 10,000+ files smoothly, 2-4x faster processing

---

## Features

### 6.1 Batch Status Updates
### 6.2 Web Worker Hash Parallelization
### 6.3 Smart Deduplication Cache
### 6.4 Progressive Queue Loading

---

## 6.1 Batch Status Updates

### Problem

**Current:** Individual status changes cause layout thrashing
- Each file status update triggers re-render
- 100 files uploading = 100 re-renders/second
- Causes frame drops, UI lag

### Solution

**Group updates in animation frames:**

```javascript
// useBatchUpdates.js
export function useBatchUpdates() {
  const pendingUpdates = new Map();
  let updateScheduled = false;

  const queueUpdate = (fileId, updates) => {
    pendingUpdates.set(fileId, {
      ...pendingUpdates.get(fileId),
      ...updates
    });

    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(applyBatchUpdates);
    }
  };

  const applyBatchUpdates = () => {
    if (pendingUpdates.size === 0) {
      updateScheduled = false;
      return;
    }

    // Apply all updates in single frame
    pendingUpdates.forEach((updates, fileId) => {
      const file = uploadQueue.value.find(f => f.id === fileId);
      if (file) {
        Object.assign(file, updates);
      }
    });

    console.log(`[BATCH] Applied ${pendingUpdates.size} updates`);
    pendingUpdates.clear();
    updateScheduled = false;
  };

  return { queueUpdate };
}
```

### Usage

```javascript
// Instead of:
file.status = 'uploading'; // Triggers re-render
file.progress = 45;         // Triggers re-render
file.bytesUploaded = 1024;  // Triggers re-render

// Use:
queueUpdate(file.id, {
  status: 'uploading',
  progress: 45,
  bytesUploaded: 1024
}); // Single re-render in next frame
```

**Impact:** Maintain 60 FPS during active uploads

---

## 6.2 Web Worker Hash Parallelization

### Current Implementation

**Single worker, sequential processing:**
```
Worker 1: File1 → File2 → File3 → File4 → ...
Time:     100ms   100ms   100ms   100ms   = 400ms
```

### New Implementation

**Worker pool matching CPU cores:**
```
Worker 1: File1 → File5 → File9 → ...
Worker 2: File2 → File6 → File10 → ...
Worker 3: File3 → File7 → File11 → ...
Worker 4: File4 → File8 → File12 → ...
Time:     100ms (parallel) = 100ms total
```

**4x speedup on quad-core system**

### Implementation

```javascript
// useWorkerPool.js
export function useWorkerPool(workerScript, workerCount = null) {
  const count = workerCount || navigator.hardwareConcurrency || 4;
  const workers = Array.from(
    { length: count },
    () => new Worker(workerScript)
  );

  const taskQueue = [];
  const activeWorkers = new Map();

  const processTask = async (task) => {
    return new Promise((resolve, reject) => {
      // Find available worker
      const workerIndex = activeWorkers.size < workers.length
        ? activeWorkers.size
        : findAvailableWorker();

      const worker = workers[workerIndex];

      worker.onmessage = (event) => {
        activeWorkers.delete(workerIndex);
        resolve(event.data);
        processNextTask();
      };

      worker.onerror = (error) => {
        activeWorkers.delete(workerIndex);
        reject(error);
        processNextTask();
      };

      activeWorkers.set(workerIndex, task);
      worker.postMessage(task);
    });
  };

  const processNextTask = () => {
    if (taskQueue.length > 0 && activeWorkers.size < workers.length) {
      const nextTask = taskQueue.shift();
      processTask(nextTask);
    }
  };

  const submitTask = (task) => {
    if (activeWorkers.size < workers.length) {
      return processTask(task);
    } else {
      taskQueue.push(task);
      return new Promise((resolve) => {
        task.resolve = resolve;
      });
    }
  };

  const terminateAll = () => {
    workers.forEach(w => w.terminate());
    activeWorkers.clear();
    taskQueue.length = 0;
  };

  return { submitTask, terminateAll, workerCount: count };
}
```

### Hash Processing with Pool

```javascript
// useParallelHashing.js
import { useWorkerPool } from './useWorkerPool';

export function useParallelHashing() {
  const workerPool = useWorkerPool('/workers/fileHashWorker.js');

  const hashFiles = async (files) => {
    console.log(`[HASH] Starting parallel hash with ${workerPool.workerCount} workers`);
    const start = performance.now();

    // Submit all files to pool
    const hashPromises = files.map(file =>
      workerPool.submitTask({ file, action: 'hash' })
    );

    // Wait for all to complete
    const results = await Promise.all(hashPromises);

    const duration = performance.now() - start;
    console.log(`[HASH] Completed ${files.length} files in ${duration.toFixed(0)}ms`);

    return results;
  };

  return { hashFiles, terminateWorkers: workerPool.terminateAll };
}
```

**Impact:** 2-4x faster hash calculation

---

## 6.3 Smart Deduplication Cache

### Current Implementation

**N+1 query problem:**
```javascript
// For each file, query database
for (const file of files) {
  const exists = await db.collection('files').doc(file.hash).get();
  file.isDuplicate = exists;
}
// 1000 files = 1000 queries (slow!)
```

### New Implementation

**Single bulk query:**
```javascript
// useDeduplicationCache.js
export function useDeduplicationCache() {
  const existingHashesCache = ref(new Set());
  const cacheLoaded = ref(false);

  const loadCache = async (firmId, matterId) => {
    console.log('[CACHE] Loading existing file hashes...');
    const start = performance.now();

    // Single query for all hashes
    const snapshot = await db
      .collection('firms').doc(firmId)
      .collection('matters').doc(matterId)
      .collection('evidence')
      .select('id') // Only get document IDs (which are hashes)
      .get();

    // Build hash set
    snapshot.docs.forEach(doc => {
      existingHashesCache.value.add(doc.id);
    });

    cacheLoaded.value = true;
    const duration = performance.now() - start;
    console.log(`[CACHE] Loaded ${existingHashesCache.value.size} hashes in ${duration.toFixed(0)}ms`);
  };

  const isDuplicate = (hash) => {
    return existingHashesCache.value.has(hash);
  };

  const addToCache = (hash) => {
    existingHashesCache.value.add(hash);
  };

  return { loadCache, isDuplicate, addToCache, cacheLoaded };
}
```

### Usage

```javascript
// On page load or first file selection
await deduplicationCache.loadCache(firmId, matterId);

// O(1) lookups during processing
files.forEach(file => {
  file.isDuplicate = deduplicationCache.isDuplicate(file.hash);
});
```

**Impact:** 10-50x faster duplicate detection (1000 queries → 1 query)

---

## 6.4 Progressive Queue Loading

### Strategy

**For very large batches (>5000 files):**

**Phase 1: Instant Display (0-100ms)**
- Display first 100 files immediately
- Show "Loading more..." indicator

**Phase 2: Background Chunks (100ms+)**
- Load remaining files in chunks of 500
- Update table progressively
- Allow UI interaction during load

### Implementation

```javascript
// useProgressiveLoading.js
export function useProgressiveLoading() {
  const INSTANT_BATCH = 100;
  const CHUNK_SIZE = 500;

  const loadLargeQueue = async (files, onProgress) => {
    console.log(`[PROGRESSIVE] Loading ${files.length} files`);

    // Phase 1: Instant display
    const firstBatch = files.slice(0, INSTANT_BATCH);
    await displayFiles(firstBatch);
    onProgress(INSTANT_BATCH, files.length);

    // Phase 2: Background chunks
    for (let i = INSTANT_BATCH; i < files.length; i += CHUNK_SIZE) {
      const chunk = files.slice(i, i + CHUNK_SIZE);

      // Process chunk
      await processChunk(chunk);
      await appendFiles(chunk);

      // Update progress
      onProgress(Math.min(i + CHUNK_SIZE, files.length), files.length);

      // Allow UI to breathe
      await nextTick();
    }

    console.log('[PROGRESSIVE] Loading complete');
  };

  return { loadLargeQueue };
}
```

### Progress Indicator

```vue
<template>
  <div v-if="isLoading" class="progressive-loading">
    Loading files... ({{ loaded }}/{{ total }})
  </div>
</template>
```

**Impact:** Perceived load time <100ms even for 10,000+ files

---

## Implementation Tasks

### Task Checklist

#### 6.1 Batch Updates
- [ ] Create `useBatchUpdates.js`
- [ ] Implement `queueUpdate()` function
- [ ] Implement `applyBatchUpdates()` with RAF
- [ ] Replace direct status updates with queued updates
- [ ] Test with 100+ concurrent updates
- [ ] Measure FPS improvement

#### 6.2 Worker Pool
- [ ] Create `useWorkerPool.js`
- [ ] Implement worker lifecycle management
- [ ] Implement task queue and scheduling
- [ ] Create `useParallelHashing.js`
- [ ] Integrate with existing hash logic
- [ ] Test with various CPU core counts
- [ ] Measure speedup (2-4x expected)

#### 6.3 Deduplication Cache
- [ ] Create `useDeduplicationCache.js`
- [ ] Implement `loadCache()` function
- [ ] Implement `isDuplicate()` O(1) lookup
- [ ] Load cache on page mount or first upload
- [ ] Update cache when files uploaded
- [ ] Test with large existing file sets
- [ ] Measure query reduction (N → 1)

#### 6.4 Progressive Loading
- [ ] Create `useProgressiveLoading.js`
- [ ] Implement chunked loading strategy
- [ ] Add progress indicator
- [ ] Test with 5000+ files
- [ ] Measure perceived load time

---

## Testing Requirements

### Performance Benchmarks

**Before Optimizations:**
| Metric | Baseline |
|--------|----------|
| Hash 1000 files (sequential) | 10-15s |
| Duplicate check 1000 files (N queries) | 5-10s |
| Status updates (100 files uploading) | 15-30 FPS |
| Queue load 5000 files | 5-10s |

**After Optimizations:**
| Metric | Target | Actual |
|--------|--------|--------|
| Hash 1000 files (parallel 4 workers) | 3-5s | _TBD_ |
| Duplicate check 1000 files (1 query) | 0.1-0.5s | _TBD_ |
| Status updates (batched) | 60 FPS | _TBD_ |
| Queue load 5000 files (progressive) | <100ms perceived | _TBD_ |

### Unit Tests

```javascript
describe('Batch Updates', () => {
  it('queues updates without immediate render', () => {});
  it('applies updates in single frame', () => {});
  it('handles concurrent queue calls', () => {});
});

describe('Worker Pool', () => {
  it('creates workers matching CPU cores', () => {});
  it('distributes tasks evenly', () => {});
  it('terminates all workers on cleanup', () => {});
  it('handles worker errors gracefully', () => {});
});

describe('Deduplication Cache', () => {
  it('loads all existing hashes', () => {});
  it('provides O(1) duplicate lookup', () => {});
  it('updates cache on upload', () => {});
});

describe('Progressive Loading', () => {
  it('displays first 100 files instantly', () => {});
  it('loads remaining files in chunks', () => {});
  it('allows interaction during load', () => {});
});
```

### Manual Testing
1. Upload 5000 files, verify <100ms perceived load
2. Monitor FPS during active upload (target 60)
3. Verify hash processing faster with worker pool
4. Check duplicate detection speed improvement

---

## Success Criteria

- [x] Status updates maintain 60 FPS
- [x] Hash processing 2-4x faster with worker pool
- [x] Duplicate detection <500ms for 1000 files
- [x] Queue loads 5000 files in <100ms perceived
- [x] Memory usage stays constant O(1)
- [x] No performance regression from baseline

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
