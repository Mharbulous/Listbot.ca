# IndexedDB Matter Caching Implementation Plan

**Created:** 2025-10-27
**Status:** Planning
**Priority:** High - Performance & Cost Optimization

## Executive Summary

Implement IndexedDB-based caching for the Cloud table (DocumentTable.vue) to solve performance and scalability issues. Current Firestore fetches take 4-5 seconds for 223 documents and will become prohibitively slow at the planned 10,000 document limit per matter.

**Key Metrics:**
- Current: 223 docs = 140.78 KB, 4.5 seconds fetch time
- Projected: 10,000 docs = 6.17 MB, ~200 seconds fetch time
- Multi-matter: 20-50 matters = 12-31 MB typical, 308 MB worst case

**Solution:** Per-matter IndexedDB cache with LRU eviction, enabling instant loads for recently viewed matters while supporting client-side filtering and multi-matter workflows.

---

## 1. Problem Statement

### Current Pain Points

1. **Slow Data Fetching**
   - 223 documents: 4,494ms (4.5 seconds)
   - 10,000 documents: Estimated ~200 seconds (3+ minutes)
   - Complex queries: Each file requires 2+ Firestore reads for metadata and tags

2. **Firestore Cost Scaling**
   - Current: 223 docs × 10 reads/doc = 2,230 reads
   - At 10k: 10,000 × 10 = 100,000 reads per matter load
   - Cost: Negligible now, but scales with usage

3. **User Experience**
   - Long wait times when switching matters
   - No offline support
   - Re-fetching same data repeatedly

4. **Future Requirements**
   - Client-side filtering/querying requires all data in memory
   - Multi-matter workflows (lawyers handle 10-50 matters simultaneously)
   - Need to support rapid matter switching

### Why Not localStorage?

| Constraint | localStorage | IndexedDB |
|------------|-------------|-----------|
| **Safari limit** | 5 MB | 1 GB |
| **Large matter (10k files)** | ❌ 6.17 MB exceeds limit | ✅ Fits easily |
| **Multi-matter (20 matters)** | ❌ 12.6 MB exceeds limit | ✅ Fits easily |
| **Async operations** | ❌ Blocks UI thread | ✅ Non-blocking |
| **Query support** | ❌ Must parse all data | ✅ Built-in indexes |

**Verdict:** localStorage cannot handle our scale requirements.

---

## 2. Storage Analysis

### Data Size Calculations

**Single Matter:**
```
Small matter (1,000 files):  140.78 KB × (1,000/223)  = 631 KB
Medium matter (5,000 files): 140.78 KB × (5,000/223)  = 3.16 MB
Large matter (10,000 files): 140.78 KB × (10,000/223) = 6.17 MB
```

**Multi-Matter Scenarios:**
```
Typical lawyer (20 matters × 1,000 files avg): 12.6 MB
Heavy user (50 matters × 1,000 files avg):     31.5 MB
Worst case (50 matters × 10,000 files max):    308 MB
```

### Cache Strategy: LRU with Size Limits

**Constraints:**
- Cache last 5-10 most recently viewed matters
- Max cache size: 50 MB (leaves plenty of headroom)
- Auto-evict oldest matter when limits exceeded

**Typical Usage Pattern:**
```
Lawyer actively working on 3-5 matters → ~15-30 MB cached
All cached matters load instantly (< 100ms)
Older matters evicted automatically, re-fetch from Firestore when needed
```

---

## 3. Architecture Design

### High-Level Data Flow

```
┌─────────────┐
│  Cloud.vue  │
│  (View)     │
└──────┬──────┘
       │
       ├──> Check matterCacheService.get(matterId)
       │
       ├──> IF cached & fresh
       │    └──> Return cached data (< 100ms)
       │
       └──> ELSE fetch from Firestore
            ├──> Call fetchFiles(firmId, matterId, ...)
            └──> Save to matterCacheService.set(matterId, data)
```

### IndexedDB Schema (via Dexie.js)

```javascript
// Database name: BookkeeperCache
// Version: 1

const db = new Dexie('BookkeeperCache');

db.version(1).stores({
  // Matter cache table
  matters: 'matterId, firmId, timestamp, dataSize',

  // Optional: Metadata for cache management
  metadata: 'key'
});

// Data structure:
{
  matterId: 'matter-abc-123',           // Primary key
  firmId: 'firm-xyz-789',               // For multi-firm support
  data: [...file objects],              // Actual cached data
  timestamp: 1698765432000,             // Last fetch time (ms)
  dataSize: 6170,                       // Size in KB
  documentCount: 10000,                 // Number of files
  categoryCount: 8                      // Number of system categories
}
```

### Cache Key Strategy

**Primary Key:** `matterId`
- Each matter's data is stored separately
- Allows granular invalidation (clear specific matter)
- Supports multi-matter caching

**Secondary Index:** `firmId`
- Enable "clear all matters for this firm" on logout
- Support future multi-firm workflows

---

## 4. Implementation Steps

### Phase 1: Core Infrastructure (Days 1-2)

#### Step 1.1: Install Dependencies

```bash
npm install dexie
```

#### Step 1.2: Create Database Service

**File:** `src/services/matterCacheService.js`

```javascript
import Dexie from 'dexie';

class MatterCacheService {
  constructor() {
    this.db = new Dexie('BookkeeperCache');

    this.db.version(1).stores({
      matters: 'matterId, firmId, timestamp, dataSize'
    });
  }

  /**
   * Get cached matter data
   * @param {string} matterId - Matter ID
   * @param {number} maxAgeMs - Max cache age in milliseconds (default: 24h)
   * @returns {Promise<Object|null>} Cached data or null if not found/stale
   */
  async get(matterId, maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const cached = await this.db.matters.get(matterId);

      if (!cached) {
        console.log(`[Cache] Miss: ${matterId} (not found)`);
        return null;
      }

      const age = Date.now() - cached.timestamp;
      if (age > maxAgeMs) {
        console.log(`[Cache] Miss: ${matterId} (stale: ${(age / 1000 / 60).toFixed(0)}min old)`);
        await this.delete(matterId); // Clean up stale entry
        return null;
      }

      console.log(`[Cache] Hit: ${matterId} (${cached.documentCount} docs, ${cached.dataSize} KB)`);
      return cached.data;
    } catch (error) {
      console.error('[Cache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Save matter data to cache
   * @param {string} matterId - Matter ID
   * @param {string} firmId - Firm ID
   * @param {Array} data - File data array
   * @returns {Promise<void>}
   */
  async set(matterId, firmId, data) {
    try {
      // Calculate data size
      const dataSize = Math.round(
        new Blob([JSON.stringify(data)]).size / 1024
      ); // KB

      await this.db.matters.put({
        matterId,
        firmId,
        data,
        timestamp: Date.now(),
        dataSize,
        documentCount: data.length,
        categoryCount: data[0] ? Object.keys(data[0]).length : 0
      });

      console.log(`[Cache] Saved: ${matterId} (${data.length} docs, ${dataSize} KB)`);

      // Check cache limits and evict if needed
      await this.enforceStorageLimits();
    } catch (error) {
      console.error('[Cache] Error saving cache:', error);
      // Non-fatal - app continues working without cache
    }
  }

  /**
   * Delete specific matter from cache
   * @param {string} matterId - Matter ID
   */
  async delete(matterId) {
    try {
      await this.db.matters.delete(matterId);
      console.log(`[Cache] Deleted: ${matterId}`);
    } catch (error) {
      console.error('[Cache] Error deleting cache:', error);
    }
  }

  /**
   * Clear all cached matters for a firm
   * @param {string} firmId - Firm ID
   */
  async clearFirm(firmId) {
    try {
      const count = await this.db.matters.where('firmId').equals(firmId).delete();
      console.log(`[Cache] Cleared ${count} matters for firm ${firmId}`);
    } catch (error) {
      console.error('[Cache] Error clearing firm cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      await this.db.matters.clear();
      console.log('[Cache] Cleared all cached matters');
    } catch (error) {
      console.error('[Cache] Error clearing all cache:', error);
    }
  }

  /**
   * Enforce storage limits (LRU eviction)
   * - Keep last 10 matters
   * - Max 50 MB total
   */
  async enforceStorageLimits() {
    const MAX_MATTERS = 10;
    const MAX_SIZE_KB = 50 * 1024; // 50 MB

    try {
      // Get all matters sorted by timestamp (oldest first)
      const allMatters = await this.db.matters
        .orderBy('timestamp')
        .toArray();

      const totalSize = allMatters.reduce((sum, m) => sum + m.dataSize, 0);
      const totalCount = allMatters.length;

      // Evict by count
      if (totalCount > MAX_MATTERS) {
        const toDelete = totalCount - MAX_MATTERS;
        const oldestMatters = allMatters.slice(0, toDelete);

        for (const matter of oldestMatters) {
          await this.delete(matter.matterId);
        }
        console.log(`[Cache] Evicted ${toDelete} old matters (count limit)`);
      }

      // Evict by size (if still over limit)
      if (totalSize > MAX_SIZE_KB) {
        let currentSize = totalSize;
        let evicted = 0;

        for (const matter of allMatters) {
          if (currentSize <= MAX_SIZE_KB) break;

          await this.delete(matter.matterId);
          currentSize -= matter.dataSize;
          evicted++;
        }
        console.log(`[Cache] Evicted ${evicted} old matters (size limit)`);
      }
    } catch (error) {
      console.error('[Cache] Error enforcing storage limits:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    try {
      const matters = await this.db.matters.toArray();
      const totalSize = matters.reduce((sum, m) => sum + m.dataSize, 0);
      const totalDocs = matters.reduce((sum, m) => sum + m.documentCount, 0);

      return {
        matterCount: matters.length,
        totalSizeKB: totalSize,
        totalSizeMB: (totalSize / 1024).toFixed(2),
        totalDocuments: totalDocs,
        matters: matters.map(m => ({
          matterId: m.matterId,
          documentCount: m.documentCount,
          sizeKB: m.dataSize,
          age: Date.now() - m.timestamp,
          timestamp: new Date(m.timestamp).toISOString()
        }))
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const matterCache = new MatterCacheService();
```

---

### Phase 2: Integration (Days 3-4)

#### Step 2.1: Update Cloud.vue

**File:** `src/views/Cloud.vue`

```javascript
import { matterCache } from '@/services/matterCacheService';

// Add loading state refs
const isLoadingFromCache = ref(false);
const isLoadingFromFirestore = ref(false);
const loadSource = ref(null); // 'cache' | 'firestore'

// Modified onMounted
onMounted(async () => {
  const mountStart = performance.now();

  try {
    // ... auth checks (keep existing code) ...

    const firmId = authStore.currentFirm;
    const matterId = matterViewStore.currentMatterId;

    // ... (keep existing validation) ...

    // Load categories (keep existing code)
    perfMonitor.start('System Categories Fetch');
    // ... fetch categories ...
    perfMonitor.end('System Categories Fetch');

    // TRY CACHE FIRST
    perfMonitor.start('Cache Check');
    const cachedData = await matterCache.get(matterId);
    perfMonitor.end('Cache Check');

    if (cachedData) {
      // Cache hit - instant load
      isLoadingFromCache.value = true;
      mockData.value = cachedData;
      loadSource.value = 'cache';
      isLoading.value = false;

      const totalMountTime = performance.now() - mountStart;
      console.log(`✅ Table Ready (from cache): ${totalMountTime.toFixed(0)}ms | ${mockData.value.length} documents`);
      return;
    }

    // Cache miss - fetch from Firestore
    isLoadingFromFirestore.value = true;
    loadSource.value = 'firestore';

    perfMonitor.start('Data Fetch');
    mockData.value = await fetchFiles(firmId, matterId, systemCategories.value, 10000);
    perfMonitor.end('Data Fetch');

    // Save to cache for next time
    perfMonitor.start('Cache Save');
    await matterCache.set(matterId, firmId, mockData.value);
    perfMonitor.end('Cache Save');

    isLoading.value = false;

    const totalMountTime = performance.now() - mountStart;
    console.log(`✅ Table Ready (from Firestore): ${totalMountTime.toFixed(0)}ms | ${mockData.value.length} documents | ${allColumns.value.length} columns`);
  } catch (err) {
    console.error('[Cloud Table] Error loading data:', err);
    error.value = `Failed to load files: ${err.message}`;
    isLoading.value = false;
  }
});
```

#### Step 2.2: Add Manual Refresh Button

**Template addition in Cloud.vue:**

```vue
<DocumentTable
  :data="mockData"
  :columns="allColumns"
  :loading="isLoading"
  :error="error"
  @retry="handleRetry"
>
  <template #footer="{ rowCount }">
    <div class="table-footer-content">
      <span>Total Documents: {{ rowCount }}</span>

      <!-- Cache status indicator -->
      <span v-if="loadSource === 'cache'" class="cache-badge">
        📦 Loaded from cache
      </span>
      <span v-else-if="loadSource === 'firestore'" class="cache-badge">
        🔄 Loaded from server
      </span>

      <!-- Refresh button -->
      <button
        @click="handleRefresh"
        class="refresh-btn"
        :disabled="isLoading"
      >
        🔄 Refresh
      </button>
    </div>
  </template>
</DocumentTable>
```

**Methods:**

```javascript
const handleRefresh = async () => {
  const matterId = matterViewStore.currentMatterId;
  const firmId = authStore.currentFirm;

  // Clear cache for this matter
  await matterCache.delete(matterId);

  // Reload page to re-fetch
  window.location.reload();
};
```

---

### Phase 3: Cache Management (Day 5)

#### Step 3.1: Clear Cache on Logout

**File:** `src/core/stores/auth.js` (or wherever logout logic exists)

```javascript
import { matterCache } from '@/services/matterCacheService';

async function logout() {
  const firmId = this.currentFirm;

  // Clear cached matters for this firm
  await matterCache.clearFirm(firmId);

  // ... existing logout logic ...
}
```

#### Step 3.2: Cache Invalidation Rules

| Event | Action |
|-------|--------|
| **User logs out** | Clear all cached matters for that firm |
| **Matter deleted** | Delete that matter from cache |
| **File uploaded** | Invalidate cache for that matter |
| **Tag updated** | Invalidate cache for that matter |
| **Cache age > 24h** | Auto-delete on next access |
| **Storage limit exceeded** | LRU eviction (oldest matters first) |

#### Step 3.3: Invalidate Cache on File Upload

**File:** `src/services/uploadService.js` or upload component

```javascript
import { matterCache } from '@/services/matterCacheService';

async function handleFileUpload(files, matterId) {
  // ... upload logic ...

  // Invalidate cache since data changed
  await matterCache.delete(matterId);

  console.log(`[Upload] Cache invalidated for matter ${matterId}`);
}
```

---

## 5. Testing Strategy

### Unit Tests

**File:** `tests/unit/services/matterCacheService.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { matterCache } from '@/services/matterCacheService';

describe('MatterCacheService', () => {
  beforeEach(async () => {
    await matterCache.clearAll();
  });

  it('should save and retrieve cached data', async () => {
    const matterId = 'test-matter-1';
    const firmId = 'test-firm-1';
    const testData = [
      { id: '1', fileName: 'test.pdf', size: '100KB' },
      { id: '2', fileName: 'doc.docx', size: '50KB' }
    ];

    await matterCache.set(matterId, firmId, testData);
    const retrieved = await matterCache.get(matterId);

    expect(retrieved).toEqual(testData);
  });

  it('should return null for stale cache (> 24h)', async () => {
    const matterId = 'test-matter-2';
    const firmId = 'test-firm-1';
    const testData = [{ id: '1', fileName: 'test.pdf' }];

    await matterCache.set(matterId, firmId, testData);

    // Mock stale timestamp (25 hours ago)
    const staleTimestamp = Date.now() - (25 * 60 * 60 * 1000);
    await matterCache.db.matters.update(matterId, { timestamp: staleTimestamp });

    const retrieved = await matterCache.get(matterId);
    expect(retrieved).toBeNull();
  });

  it('should enforce LRU eviction when limit exceeded', async () => {
    // Create 11 matters (exceeds MAX_MATTERS = 10)
    for (let i = 1; i <= 11; i++) {
      await matterCache.set(`matter-${i}`, 'firm-1', [{ id: i }]);
      // Small delay to ensure timestamp ordering
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const stats = await matterCache.getStats();
    expect(stats.matterCount).toBe(10); // Oldest evicted
  });

  it('should clear all matters for a firm', async () => {
    await matterCache.set('matter-1', 'firm-1', [{ id: 1 }]);
    await matterCache.set('matter-2', 'firm-1', [{ id: 2 }]);
    await matterCache.set('matter-3', 'firm-2', [{ id: 3 }]);

    await matterCache.clearFirm('firm-1');

    const stats = await matterCache.getStats();
    expect(stats.matterCount).toBe(1); // Only firm-2 matter remains
  });
});
```

### Integration Tests

**Scenario:** Load Cloud.vue with cached data

```javascript
import { mount } from '@vue/test-utils';
import Cloud from '@/views/Cloud.vue';
import { matterCache } from '@/services/matterCacheService';

it('should load cached data without Firestore fetch', async () => {
  const matterId = 'test-matter';
  const firmId = 'test-firm';
  const mockData = [
    { id: '1', fileName: 'cached.pdf', size: '100KB' }
  ];

  // Pre-populate cache
  await matterCache.set(matterId, firmId, mockData);

  // Mount component
  const wrapper = mount(Cloud, {
    global: {
      stubs: ['DocumentTable']
    }
  });

  await wrapper.vm.$nextTick();

  // Verify data loaded from cache (not Firestore)
  expect(wrapper.vm.loadSource).toBe('cache');
  expect(wrapper.vm.mockData).toEqual(mockData);
});
```

### Manual Testing Checklist

- [ ] Fresh load (no cache) fetches from Firestore and saves to cache
- [ ] Second load uses cache (< 100ms load time)
- [ ] Stale cache (> 24h) is invalidated and re-fetched
- [ ] Logout clears all cached matters for that firm
- [ ] File upload invalidates cache for that matter
- [ ] LRU eviction works when 11+ matters cached
- [ ] Cache survives browser refresh
- [ ] Cache cleared when explicitly requested
- [ ] Cache stats display correctly in dev tools

---

## 6. Performance Expectations

### Before (Current State)

| Operation | Time | Firestore Reads |
|-----------|------|-----------------|
| Load 223 docs | 4,494ms | 2,230 |
| Load 10,000 docs | ~200,000ms (est) | ~100,000 |
| Switch matters | Full re-fetch | Full reads |

### After (With IndexedDB Cache)

| Operation | First Load | Cached Load | Firestore Reads (cached) |
|-----------|------------|-------------|--------------------------|
| Load 223 docs | 4,500ms | **< 100ms** | 0 |
| Load 10,000 docs | ~200s (first time) | **< 500ms** | 0 |
| Switch matters | 4-200s (if not cached) | **< 500ms** | 0 (if cached) |

### ROI Analysis

**Typical workflow:** Lawyer switches between 5 matters per day, viewing each 3 times

**Before:**
```
5 matters × 3 views × 4.5s = 67.5 seconds/day wasted
```

**After:**
```
5 matters × (1 fetch @ 4.5s + 2 cached @ 0.1s) = 23.5 seconds/day
Savings: 44 seconds/day (65% reduction)
```

**Firestore cost savings:**
```
Before: 5 matters × 3 views × 2,230 reads = 33,450 reads/day
After: 5 matters × 1 fetch × 2,230 reads = 11,150 reads/day
Savings: 22,300 reads/day (67% reduction)
```

---

## 7. Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Background Sync**
   - Detect when data changes in Firestore (via listeners)
   - Auto-refresh cache in background
   - Show toast notification: "New files available, click to refresh"

2. **Advanced Querying**
   - Add IndexedDB indexes for common filters:
     - `[matterId+fileType]` - Filter by file type within matter
     - `[matterId+date]` - Sort by date within matter
   - Enable client-side queries without loading all data

3. **Offline Mode**
   - App works fully offline with cached data
   - Queue file uploads when offline
   - Sync when connection restored

4. **Compression**
   - Use LZ-string to compress cached data
   - Reduce storage by 50-70%
   - Enable caching of 20+ matters

5. **Prefetching**
   - When user opens matter list, prefetch top 3 matters in background
   - Instant load when user clicks matter

6. **Smart Invalidation**
   - Only invalidate cache when data actually changes
   - Use Firestore document version/timestamp to detect changes
   - Skip re-fetch if data unchanged

---

## 8. Migration Path

### Rollout Strategy

**Step 1: Silent Deployment (Week 1)**
- Deploy cache layer behind feature flag
- Monitor for errors/issues
- No user-facing changes yet

**Step 2: Opt-In Beta (Week 2)**
- Enable for test users
- Collect feedback on performance
- Monitor IndexedDB usage metrics

**Step 3: Gradual Rollout (Week 3)**
- Enable for 25% of users
- Monitor error rates
- Expand to 50%, then 100%

**Step 4: Full Deployment (Week 4)**
- Enable for all users
- Remove old code paths
- Document final implementation

### Rollback Plan

If issues arise:
1. Disable cache via feature flag (falls back to Firestore)
2. Clear all user caches: `await matterCache.clearAll()`
3. Investigate and fix issue
4. Re-enable cache

### Monitoring

Track these metrics:
- Cache hit rate (target: > 70%)
- Average load time (cache vs Firestore)
- IndexedDB errors
- Storage usage per user
- LRU eviction frequency

---

## 9. Open Questions

1. **Cache expiry strategy:**
   - 24h is arbitrary - should it be configurable?
   - Different expiry for small vs large matters?

2. **Manual refresh UX:**
   - Should refresh clear cache and reload, or just reload?
   - Show "last updated" timestamp?

3. **Multi-tab behavior:**
   - If user has 2 tabs open, how to sync cache updates?
   - Use BroadcastChannel API?

4. **Cache warming:**
   - Pre-cache matters on login?
   - Prefetch related matters?

5. **Error handling:**
   - If IndexedDB fails (full disk, private mode), graceful degradation?
   - Show error toast and fall back to Firestore?

---

## 10. References

### Documentation

- [Dexie.js Documentation](https://dexie.org/)
- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Using IndexedDB (MDN Guide)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

### Related Files

- `src/services/uploadService.js` - Current Firestore fetching logic
- `src/views/Cloud.vue` - Main table view
- `src/components/base/DocumentTable.vue` - Table component
- `docs/architecture/file-lifecycle.md` - File terminology reference

### Performance Baseline

Current metrics (from console log):
```
📊 Data Fetch Complete: 4494ms | 223 docs | 8 categories | 2230 Firestore reads | 140.78 KB data
```

---

## Appendix A: Code Checklist

### Files to Create

- [ ] `src/services/matterCacheService.js` - Cache service
- [ ] `tests/unit/services/matterCacheService.test.js` - Unit tests

### Files to Modify

- [ ] `src/views/Cloud.vue` - Add cache integration
- [ ] `src/core/stores/auth.js` - Clear cache on logout
- [ ] `src/services/uploadService.js` - Invalidate cache on upload
- [ ] `package.json` - Add Dexie dependency

### Dependencies

- [ ] `npm install dexie`

---

## Appendix B: Sample Console Output

**First load (Firestore fetch):**
```
[Cache] Miss: matter-abc-123 (not found)
📊 Data Fetch Complete: 4494ms | 223 docs | 8 categories | 2230 Firestore reads | 140.78 KB data
[Cache] Saved: matter-abc-123 (223 docs, 140 KB)
✅ Table Ready (from Firestore): 4582ms | 223 documents | 15 columns
```

**Second load (cache hit):**
```
[Cache] Hit: matter-abc-123 (223 docs, 140 KB)
✅ Table Ready (from cache): 87ms | 223 documents | 15 columns
```

**Eviction (11th matter added):**
```
[Cache] Saved: matter-new-456 (5000 docs, 3160 KB)
[Cache] Evicted 1 old matters (count limit)
[Cache] Deleted: matter-old-789
```

---

**End of Implementation Plan**
