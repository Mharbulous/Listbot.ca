# PDF Caching Optimization Attempts

This document tracks all attempts to optimize PDF document navigation performance in the Bookkeeper application.

**Goal**: Achieve <50ms navigation timing for cached documents (instant feel)

**Current Status**: Inconsistent - 10-12ms when fully cached, but 188-255ms most of the time due to race condition

---

## Optimization Attempts

| # | Possible Issue | Proposed Fix | Result Reported by Human Tester |
|---|----------------|--------------|----------------------------------|
| 1 | **Lazy URL Fetching** <br><br>Firebase Storage `getDownloadURL()` was called BEFORE checking cache, adding 200-300ms network latency for authentication token refresh even when PDF was already cached. | - Made `downloadUrl` parameter optional in `usePdfCache.getDocument()` and `usePdfViewer.loadPdf()` <br>- Added `isDocumentCached()` check in ViewDocument.vue <br>- Only fetch URL on cache miss <br><br>**Files Modified**: <br>- `usePdfCache.js` (lines 60, 102-105) <br>- `usePdfViewer.js` (lines 33-35, 43) <br>- `ViewDocument.vue` (lines 779-787) | Navigation still slow (~280-320ms). Documents loading twice. Cache hits occurring but timing not improving. |
| 2 | **Metadata Cache Missing** <br><br>Multiple expensive network calls on every navigation: <br>1. Firestore evidence query <br>2. Firestore sourceMetadata variants query <br>3. Firebase Storage `getMetadata()` call <br>4. Firebase Storage `getDownloadURL()` call (fixed in Attempt #1) <br><br>Only PDF was cached, not the associated metadata. | - Expanded cache structure to include metadata object with: <br>&nbsp;&nbsp;- `evidenceData` (Firestore document) <br>&nbsp;&nbsp;- `sourceVariants` (Firestore variants) <br>&nbsp;&nbsp;- `storageMetadata` (Firebase Storage) <br>- Added `getMetadata()` and `setMetadata()` methods to cache <br>- Check metadata cache FIRST in `loadEvidence()` before network calls <br><br>**Files Modified**: <br>- `usePdfCache.js` (cache structure, new methods) <br>- `usePdfViewer.js` (export metadata methods) <br>- `ViewDocument.vue` (check cache before Firestore queries) | No human results reported (discovered race condition before testing). |
| 3 | **Metadata Cache Race Condition** <br><br>Metadata was cached in `loadEvidence()` BEFORE PDF loaded in `fetchStorageMetadata()`, creating cache entries with `pdfDocument: null`. These invalid entries were immediately evicted, losing the metadata. <br><br>Console showed: <br>- "Invalid cache entry found, evicting" <br>- "Metadata cache MISS" for pre-loaded documents | - Removed premature `cacheMetadata()` call from `loadEvidence()` <br>- Moved metadata caching to `fetchStorageMetadata()` AFTER PDF loads successfully <br>- Expanded cache to include `pdfMetadata` field (extracted PDF metadata) <br>- Skip `extractMetadata()` call for cached PDF metadata <br>- Fixed duplicate `getMetadata()` call <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 927-928 removed, 814-822 added, 802-808 conditional extraction) <br>- `usePdfCache.js` (line 21 added pdfMetadata to cache structure) | **Forward navigation** (to pre-loaded doc): <br>- 220-294ms <br>- Shows "Metadata cache MISS" <br>- Shows "PDF cache HIT" <br>- Still extracts PDF metadata <br><br>**Backward navigation** (to previously visited doc): <br>- **13ms** (INSTANT!) <br>- Shows "Metadata cache HIT" <br>- Shows "PDF metadata cache HIT" <br>- Skips all network calls <br><br>**Issue**: Pre-loading only caches PDF, not metadata. Forward navigation requires metadata fetch, backward navigation has everything cached. |
| 4 | **Pre-load Metadata Race Condition** <br><br>Implemented background metadata pre-loading, but PDF pre-load **overwrites** cached metadata. <br><br>**Sequence**: <br>1. Metadata pre-loads quickly (Firestore queries) <br>2. Metadata cached via `setMetadata()` ✓ <br>3. PDF pre-load completes later (slow download) <br>4. PDF pre-load calls `cache.value.set()` creating new entry WITHOUT metadata field ❌ <br>5. Cached metadata gets overwritten/lost <br><br>**Console showed**: <br>- "Pre-loaded and cached metadata" ✓ <br>- But then "Metadata cache MISS" on navigation ❌ <br>- Rare cache hits when navigating back show 10-12ms ⚡ | - Created `fetchAndCacheMetadata()` helper in ViewDocument.vue <br>- Calls `cacheMetadata()` to store metadata for adjacent documents <br>- Runs in parallel with PDF pre-loading <br>- Non-blocking error handling <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 658-736 new helper function, lines 920-930 parallel pre-loading) <br><br>**Bug in usePdfCache.js line 183-191**: <br>PDF pre-load creates entry without preserving existing metadata: <br>```javascript <br>const entry = { <br>&nbsp;&nbsp;loadingTask, pdfDocument, <br>&nbsp;&nbsp;downloadUrl, timestamp <br>&nbsp;&nbsp;// NO metadata field! <br>}; <br>cache.value.set(documentId, entry); <br>// ← Overwrites entire entry <br>``` | **Most navigations**: <br>- 188-255ms ❌ (SLOW) <br>- Shows "Pre-loaded and cached metadata" earlier ✓ <br>- But "Metadata cache MISS" on navigation ❌ <br>- PDF cache HIT ✓ <br>- Metadata was overwritten by PDF pre-load <br><br>**Occasional full cache hits** (when navigating to recently viewed doc still in cache): <br>- **10-12ms** ✅ (INSTANT!) <br>- Shows "Metadata cache HIT" ✓ <br>- Shows "PDF metadata cache HIT" ✓ <br>- Zero network calls <br><br>**Issue**: PDF pre-load overwrites metadata. Pre-loading works, but cache retrieval fails due to race condition in cache entry management. Metadata completes first, then PDF pre-load creates fresh entry that doesn't preserve the metadata field. |

---

## Current State Analysis (After Attempt #4)

### What's Working ✅
- **Metadata pre-loading IS functioning**
  - "Pre-loaded and cached metadata" appears in console
  - Background fetch completes quickly

- **Occasional instant navigation** (10-12ms)
  - Happens when navigating to recently *viewed* documents
  - Full cache hits: PDF + metadata + PDF metadata
  - Zero network calls

### What's Broken ❌
- **Most navigations are slow** (188-255ms)
  - Metadata shows as "MISS" even after being pre-loaded
  - PDF pre-load overwrites the metadata cache entry
  - Forces re-fetch of all metadata on navigation

### Root Cause: Cache Entry Overwrite
In `usePdfCache.js` line 183-191, the `loadAndCacheDocument()` function creates a new cache entry WITHOUT preserving existing metadata:

```javascript
const entry = {
  loadingTask,
  pdfDocument,
  downloadUrl,
  timestamp: Date.now(),
  // ← metadata field is missing!
};

cache.value.set(documentId, entry);  // ← Overwrites entire entry
```

**The Race**:
1. Metadata pre-loads fast (completes in ~50-100ms)
2. `setMetadata()` creates/updates cache entry with metadata
3. PDF pre-loads slower (downloading PDF takes 200-500ms)
4. `loadAndCacheDocument()` calls `cache.value.set()` with NEW entry
5. New entry has no `metadata` field → previous metadata lost

---

## Potential Next Steps

### Option A: Preserve Metadata During PDF Pre-load (RECOMMENDED)
Fix `loadAndCacheDocument()` in usePdfCache.js to preserve existing metadata:

```javascript
const entry = {
  loadingTask,
  pdfDocument,
  downloadUrl,
  timestamp: Date.now(),
  metadata: existingEntry?.metadata || null,  // ← Preserve existing metadata
};
```

**Pros**:
- Simple fix (one line change)
- Metadata pre-loading will work correctly
- Consistent instant navigation in all directions
- Achieves <50ms goal

**Cons**:
- None identified

### Option B: Synchronize Pre-loading
Make PDF and metadata pre-load wait for each other, then cache atomically.

**Pros**:
- Guarantees atomicity

**Cons**:
- More complex
- Slower pre-loading (sequential instead of parallel)
- Unnecessary complexity for a simple fix

### Option C: Abandon Metadata Pre-loading
Revert to Attempt #3 state where only backward navigation is instant.

**Pros**:
- Stable current state
- No new bugs

**Cons**:
- Doesn't meet <50ms goal for forward navigation
- Inconsistent performance

---

## Performance Summary

| Scenario | Original | After Attempt #1 | After Attempt #3 | After Attempt #4 |
|----------|----------|------------------|------------------|------------------|
| First view | ~300ms | ~300ms | ~300ms | ~300ms |
| Forward nav (pre-loaded) | ~280-320ms | ~280-320ms | **220-294ms** | **188-255ms** (metadata overwritten) OR **10-12ms** (rare) |
| Backward nav (fully cached) | ~280-320ms | ~280-320ms | **13ms** ✅ | **10-12ms** ✅ (when metadata survives) |

**Improvement**: Can achieve 10-12ms (instant), but only works occasionally due to race condition. Fix needed: preserve metadata during PDF pre-load.

---

## Recommended Action

Implement **Option A**: Modify `usePdfCache.js` line 183-191 to preserve existing metadata when caching PDF documents.

This single-line fix will make metadata pre-loading work correctly and achieve consistent <50ms navigation for all cached documents.
