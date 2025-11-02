# PDF Caching Optimization Attempts

This document tracks all attempts to optimize PDF document navigation performance in the Bookkeeper application.

**Goal**: Achieve <50ms navigation timing for cached documents (instant feel)

**Current Status**: **48ms best case (GOAL ACHIEVED!)** but inconsistent (48-741ms) due to cache invalidation bug

---

## Optimization Attempts

| # | Possible Issue | Proposed Fix | Result Reported by Human Tester |
|---|----------------|--------------|----------------------------------|
| 1 | **Lazy URL Fetching** <br><br>Firebase Storage `getDownloadURL()` was called BEFORE checking cache, adding 200-300ms network latency for authentication token refresh even when PDF was already cached. | - Made `downloadUrl` parameter optional in `usePdfCache.getDocument()` and `usePdfViewer.loadPdf()` <br>- Added `isDocumentCached()` check in ViewDocument.vue <br>- Only fetch URL on cache miss <br><br>**Files Modified**: <br>- `usePdfCache.js` (lines 60, 102-105) <br>- `usePdfViewer.js` (lines 33-35, 43) <br>- `ViewDocument.vue` (lines 779-787) | Navigation still slow (~280-320ms). Documents loading twice. Cache hits occurring but timing not improving. |
| 2 | **Metadata Cache Missing** <br><br>Multiple expensive network calls on every navigation: <br>1. Firestore evidence query <br>2. Firestore sourceMetadata variants query <br>3. Firebase Storage `getMetadata()` call <br>4. Firebase Storage `getDownloadURL()` call (fixed in Attempt #1) <br><br>Only PDF was cached, not the associated metadata. | - Expanded cache structure to include metadata object with: <br>&nbsp;&nbsp;- `evidenceData` (Firestore document) <br>&nbsp;&nbsp;- `sourceVariants` (Firestore variants) <br>&nbsp;&nbsp;- `storageMetadata` (Firebase Storage) <br>- Added `getMetadata()` and `setMetadata()` methods to cache <br>- Check metadata cache FIRST in `loadEvidence()` before network calls <br><br>**Files Modified**: <br>- `usePdfCache.js` (cache structure, new methods) <br>- `usePdfViewer.js` (export metadata methods) <br>- `ViewDocument.vue` (check cache before Firestore queries) | No human results reported (discovered race condition before testing). |
| 3 | **Metadata Cache Race Condition** <br><br>Metadata was cached in `loadEvidence()` BEFORE PDF loaded in `fetchStorageMetadata()`, creating cache entries with `pdfDocument: null`. These invalid entries were immediately evicted, losing the metadata. <br><br>Console showed: <br>- "Invalid cache entry found, evicting" <br>- "Metadata cache MISS" for pre-loaded documents | - Removed premature `cacheMetadata()` call from `loadEvidence()` <br>- Moved metadata caching to `fetchStorageMetadata()` AFTER PDF loads successfully <br>- Expanded cache to include `pdfMetadata` field (extracted PDF metadata) <br>- Skip `extractMetadata()` call for cached PDF metadata <br>- Fixed duplicate `getMetadata()` call <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 927-928 removed, 814-822 added, 802-808 conditional extraction) <br>- `usePdfCache.js` (line 21 added pdfMetadata to cache structure) | **Forward navigation** (to pre-loaded doc): <br>- 220-294ms <br>- Shows "Metadata cache MISS" <br>- Shows "PDF cache HIT" <br>- Still extracts PDF metadata <br><br>**Backward navigation** (to previously visited doc): <br>- **13ms** (INSTANT!) <br>- Shows "Metadata cache HIT" <br>- Shows "PDF metadata cache HIT" <br>- Skips all network calls <br><br>**Issue**: Pre-loading only caches PDF, not metadata. Forward navigation requires metadata fetch, backward navigation has everything cached. |
| 4 | **Pre-load Metadata Race Condition** <br><br>Implemented background metadata pre-loading, but PDF pre-load **overwrites** cached metadata. <br><br>**Sequence**: <br>1. Metadata pre-loads quickly (Firestore queries) <br>2. Metadata cached via `setMetadata()` ✓ <br>3. PDF pre-load completes later (slow download) <br>4. PDF pre-load calls `cache.value.set()` creating new entry WITHOUT metadata field ❌ <br>5. Cached metadata gets overwritten/lost <br><br>**Console showed**: <br>- "Pre-loaded and cached metadata" ✓ <br>- But then "Metadata cache MISS" on navigation ❌ <br>- Rare cache hits when navigating back show 10-12ms ⚡ | - Created `fetchAndCacheMetadata()` helper in ViewDocument.vue <br>- Calls `cacheMetadata()` to store metadata for adjacent documents <br>- Runs in parallel with PDF pre-loading <br>- Non-blocking error handling <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 658-736 new helper function, lines 920-930 parallel pre-loading) <br><br>**Bug in usePdfCache.js line 183-191**: <br>PDF pre-load creates entry without preserving existing metadata: <br>```javascript <br>const entry = { <br>&nbsp;&nbsp;loadingTask, pdfDocument, <br>&nbsp;&nbsp;downloadUrl, timestamp <br>&nbsp;&nbsp;// NO metadata field! <br>}; <br>cache.value.set(documentId, entry); <br>// ← Overwrites entire entry <br>``` | **Most navigations**: <br>- 188-255ms ❌ (SLOW) <br>- Shows "Pre-loaded and cached metadata" earlier ✓ <br>- But "Metadata cache MISS" on navigation ❌ <br>- PDF cache HIT ✓ <br>- Metadata was overwritten by PDF pre-load <br><br>**Occasional full cache hits** (when navigating to recently viewed doc still in cache): <br>- **10-12ms** ✅ (INSTANT!) <br>- Shows "Metadata cache HIT" ✓ <br>- Shows "PDF metadata cache HIT" ✓ <br>- Zero network calls <br><br>**Issue**: PDF pre-load overwrites metadata. Pre-loading works, but cache retrieval fails due to race condition in cache entry management. Metadata completes first, then PDF pre-load creates fresh entry that doesn't preserve the metadata field. |
| 5 | **Cache Entry Overwrite Fixed, PDF Metadata Not Pre-loaded** <br><br>Implemented the fix from Attempt #4 analysis to preserve existing metadata when PDF pre-load completes. <br><br>**Results**: <br>- Metadata cache now working perfectly ✅ <br>- PDF cache working consistently (8-16ms) ✅ <br>- But PDF metadata extraction still happens on EVERY navigation ❌ <br>- First page rendering varies wildly (39-831ms) ❌ <br><br>**New bottleneck identified**: <br>PDF metadata is only cached AFTER viewing a document, not during pre-load. When navigating back to a previously viewed doc, get full cache hit (39ms). When navigating forward to pre-loaded doc, still need to extract PDF metadata. | - Modified `usePdfCache.js` line 181-193 to preserve existing metadata <br>- Retrieves existing cache entry before creating new one <br>- Preserves `metadata` field from existing entry <br><br>**Code change**: <br>```javascript <br>const existingEntry = cache.value.get(documentId); <br>const entry = { <br>&nbsp;&nbsp;loadingTask, pdfDocument, downloadUrl, <br>&nbsp;&nbsp;timestamp: Date.now(), <br>&nbsp;&nbsp;metadata: existingEntry?.metadata \|\| null <br>}; <br>``` <br><br>**Files Modified**: <br>- `usePdfCache.js` (lines 181-193) | **Forward navigation** (to pre-loaded doc): <br>- PDF load: 8-16ms ✅ (FAST!) <br>- Metadata cache: **HIT** ✅ (FIXED!) <br>- PDF cache: **HIT** ✅ <br>- PDF metadata: Extraction still required ❌ <br>- First render: 110-831ms ❌ (varies) <br><br>**Backward navigation** (to previously viewed doc): <br>- PDF load: 11.7ms ✅ <br>- Metadata cache: **HIT** ✅ <br>- PDF cache: **HIT** ✅ <br>- PDF metadata: **HIT** ✅ (cached from previous view!) <br>- First render: **39ms** ✅ (INSTANT!) <br><br>**Analysis**: Metadata preservation fix works! New bottleneck is PDF metadata extraction during pre-load. Only fully instant when navigating to documents that were previously VIEWED (not just pre-loaded). |
| 6 | **PDF Metadata Pre-load Implementation** <br><br>Completes the caching pipeline by extracting and caching PDF metadata during background pre-load. <br><br>**Solution**: <br>- Created `extractAndCachePdfMetadata()` helper function <br>- Chains after `fetchAndCacheMetadata()` completes <br>- Retrieves pre-loaded PDF from cache <br>- Extracts PDF metadata in background <br>- Updates cache entry with `pdfMetadata` field <br><br>**Safety features**: <br>- Checks if PDF is cached before extraction <br>- Skips if PDF metadata already cached <br>- Skips if basic metadata not available yet <br>- Non-blocking error handling <br>- 100ms setTimeout to allow PDF pre-load to complete | - Added import for `usePdfCache` composable <br>- Created `extractAndCachePdfMetadata()` function (lines 766-821) <br>- Modified pre-load flow to chain PDF metadata extraction: <br>&nbsp;&nbsp;1. Pre-load PDF (existing) <br>&nbsp;&nbsp;2. Pre-load metadata (existing) <br>&nbsp;&nbsp;3. Extract PDF metadata (NEW) <br>- Uses 100ms setTimeout to handle race conditions <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 438, 457, 766-821, 1015-1043) <br><br>**Expected Flow**: <br>```javascript <br>fetchAndCacheMetadata(docId) <br>&nbsp;&nbsp;.then(() => { <br>&nbsp;&nbsp;&nbsp;&nbsp;setTimeout(() => { <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;extractAndCachePdfMetadata(docId); <br>&nbsp;&nbsp;&nbsp;&nbsp;}, 100); <br>&nbsp;&nbsp;}); <br>``` | **FAILED - Race Condition** ❌ <br><br>**Actual Results**: <br>- PDF metadata pre-load **NEVER ran** <br>- Zero instances of "📄 Pre-loaded and cached PDF metadata" <br>- Only 2 PDF metadata cache hits (backward nav to previously viewed docs) <br>- Most navigations: 57-804ms (still extracting metadata) ❌ <br><br>**Root Cause**: <br>Race condition - 100ms timeout insufficient. PDF pre-load runs async in parallel with metadata pre-load. PDF not cached within 100ms of metadata completing. Function returns early from safety check `if (!isDocumentCached(documentId))`. |
| 7 | **Sequential Pre-load After First Page Render** <br><br>Eliminates race conditions by delaying ALL pre-loading until AFTER first page renders. <br><br>**Key Insight**: <br>Users spend 1-3 seconds viewing a page before navigating. Pre-loading has plenty of time to complete sequentially without rushing. <br><br>**Solution**: <br>- Move pre-load trigger from `fetchStorageMetadata()` to `handleFirstPageRendered()` <br>- Created `startBackgroundPreload()` with sequential await flow <br>- Guarantees PDFs are cached before metadata extraction <br>- No timeouts, no guessing, no race conditions | - Created `startBackgroundPreload()` function (lines 827-893) <br>&nbsp;&nbsp;- Sequential flow with explicit awaits: <br>&nbsp;&nbsp;&nbsp;&nbsp;1. `await preloadAdjacentDocuments()` ✅ <br>&nbsp;&nbsp;&nbsp;&nbsp;2. `await fetchAndCacheMetadata()` ✅ <br>&nbsp;&nbsp;&nbsp;&nbsp;3. `await extractAndCachePdfMetadata()` ✅ <br>- Removed 100ms setTimeout (not needed) <br>- Added to `handleFirstPageRendered()` (line 652) <br>- Removed old pre-load logic from `fetchStorageMetadata()` <br><br>**Files Modified**: <br>- `ViewDocument.vue` (lines 634-656, 827-893, 1075-1077) <br><br>**Actual Flow**: <br>```javascript <br>First page renders → <br>startBackgroundPreload() → <br>&nbsp;&nbsp;await PDFs → <br>&nbsp;&nbsp;await metadata → <br>&nbsp;&nbsp;await extractPdfMetadata() <br>``` | **SUCCESS!** ✅🎯 <br><br>**All Navigations Show Full Cache Hits**: <br>- 📋 Metadata cache HIT ✅ <br>- ✅ PDF cache HIT ✅ <br>- 📄 PDF metadata cache HIT ✅ <br>- 📄 Pre-loaded and cached PDF metadata ✅ <br><br>**Performance**: <br>- PDF cache hit rate: **92.6%** ✅ <br>- PDF load: **8-18ms** ✅ (instant!) <br>- Best case render: **52ms** 🎯 (near goal!) <br>- Typical render: **62-101ms** ✅ (feels instant) <br>- Outliers: 245-753ms (Vue overhead, NOT caching) <br><br>**Caching Pipeline COMPLETE**: <br>- Zero race conditions ✅ <br>- Zero PDF metadata extraction on navigation ✅ <br>- Sequential flow guarantees correctness ✅ <br>- <50ms goal nearly achieved (52ms best) 🎯 |
| 8 | **Deferred Rendering (Thumbnails + Metadata Extraction)** <br><br>Identified that thumbnail rendering (500-700ms) and metadata extraction (50-150ms) were blocking first page render even with full cache hits. <br><br>**Root Cause**: <br>- Watcher in `PdfThumbnailList.vue` triggered immediately when `pdfDocument` changed <br>- `renderAllThumbnails()` blocked main thread with CPU-intensive canvas operations <br>- `extractMetadata()` called synchronously before page render <br>- Gap of 743ms between PDF load (10ms) and first page render (754ms) <br><br>**Solution**: <br>- Defer thumbnail rendering with `setTimeout(..., 50)` <br>- Defer PDF metadata extraction with `setTimeout(..., 0)` <br>- Let first page render complete before background tasks start | - Modified `PdfThumbnailList.vue` watcher (lines 112-146): <br>&nbsp;&nbsp;- Wrapped `renderAllThumbnails()` in `setTimeout(..., 50)` <br>&nbsp;&nbsp;- Changed from `async` watcher to sync with deferred execution <br>&nbsp;&nbsp;- Added error handling for fire-and-forget rendering <br><br>- Modified `ViewDocument.vue` metadata extraction (lines 1050-1090): <br>&nbsp;&nbsp;- Cache metadata immediately (without pdfMetadata field) <br>&nbsp;&nbsp;- Wrapped `extractMetadata()` in `setTimeout(..., 0)` <br>&nbsp;&nbsp;- Update cache with pdfMetadata after background extraction <br><br>**Files Modified**: <br>- `PdfThumbnailList.vue` (lines 112-146) <br>- `ViewDocument.vue` (lines 1050-1090) | **PARTIAL SUCCESS** ⚠️ <br><br>**Goal Achieved (Sometimes)**: <br>- **Best case**: **48ms** 🎯 (GOAL MET! <50ms) <br>- Good cases: 67-162ms (majority of navigations) <br>- Cache hit rate: **90%** ✅ <br><br>**CRITICAL BUG - Cache Invalidation** ❌: <br>- Console shows "Invalid cache entry found, evicting" <br>- Cache entries being evicted and reloaded from Firebase <br>- Example: Doc loaded in 409ms instead of 8ms <br>- Regression to 1047ms render time <br><br>**Root Cause**: <br>Premature `cacheMetadata()` call creates entries with `pdfMetadata: null` but NO `pdfDocument` field yet. When navigation occurs before PDF loads, cache check finds `entry.pdfDocument` is null and evicts the entry as invalid. This is the SAME bug as Attempt #3. <br><br>**Performance Variance**: <br>- Best: 48ms (when cache valid) ✅ <br>- Typical: 67-162ms (acceptable) ⚠️ <br>- Bad: 267-741ms (cache invalidated) ❌ <br>- Worst: 1047ms (cache miss + reload) ❌ <br><br>**Status**: Rendering optimization works, but introduced cache invalidation regression. Need to fix metadata caching order. |

---

## Current State Analysis (After Attempt #8)

### ⚠️ GOAL ACHIEVED BUT UNSTABLE

**Attempt #8 - Deferred Rendering** successfully achieved the <50ms goal (**48ms best case**) but introduced a critical cache invalidation bug causing inconsistent performance.

### What's Working ✅

1. **Rendering Optimization Successful**
   - ✅ Thumbnail rendering deferred (no longer blocks first page)
   - ✅ PDF metadata extraction deferred (background processing)
   - ✅ **Goal achieved**: 48ms best case (<50ms target!) 🎯
   - ✅ Majority of navigations: 67-162ms (acceptable performance)

2. **Cache Pipeline Still Operational**
   - ✅ PDF caching: 90% hit rate, 8-12ms loads when valid
   - ✅ Metadata caching: Working for pre-loaded documents
   - ✅ PDF metadata caching: Working for pre-loaded documents
   - ✅ Background pre-loading: Still functioning

### Critical Bug Introduced ❌

**CACHE INVALIDATION BUG**:
- Console shows "Invalid cache entry found, evicting"
- Cache entries being marked invalid and evicted
- Forces reload from Firebase Storage (409ms instead of 8ms)
- Regression to 1047ms render time

**Root Cause**:
Premature `cacheMetadata()` call in `ViewDocument.vue` lines 1062-1069:
```javascript
cacheMetadata(fileHash.value, {
  evidenceData: evidence.value,
  sourceVariants: sourceMetadataVariants.value,
  storageMetadata: storageMetadata.value,
  displayName: evidence.value.displayName,
  selectedMetadataHash: selectedMetadataHash.value,
  pdfMetadata: null, // Will be populated after extraction
});
```

**Problem**: This creates a cache entry with metadata but NO `pdfDocument` field yet. When `usePdfCache.getDocument()` later checks the entry (line 122), it finds `entry.pdfDocument` is null and evicts it as "invalid". This is **the exact same bug as Attempt #3**.

**Sequence of Events**:
1. PDF starts loading asynchronously
2. `cacheMetadata()` called immediately (before PDF loads)
3. Cache entry created: `{ pdfDocument: null, metadata: {...} }`
4. User navigates quickly to that document
5. Cache check: `if (entry.pdfDocument)` → false
6. Entry evicted as "invalid cache entry"
7. PDF must be reloaded from Firebase Storage

### Performance Variance ⚠️

**Inconsistent Results**:
- **Best**: 48ms (when cache entry remains valid) 🎯 ✅
- **Good**: 67-162ms (majority of navigations) ⚠️
- **Bad**: 267-741ms (when cache invalidated) ❌
- **Worst**: 1047ms (cache miss + Firebase reload) ❌

**Analysis**: The rendering optimization works perfectly, but the cache invalidation bug creates unpredictable performance. Same document can render in 48ms or 741ms depending on timing.

### Optimization Journey Progress

| Metric | Original | After Attempt #7 | After Attempt #8 | Best Improvement |
|--------|----------|------------------|------------------|------------------|
| **Cache Hit Rate** | 0% | 92.6% | 90% | ♾️ |
| **PDF Load Time** | 200-300ms | 8-18ms | 8-12ms (when valid) | **16-37x faster** |
| **Best Case Navigation** | ~300ms | 52ms | **48ms** 🎯 | **6.25x faster** |
| **Typical Navigation** | 280-320ms | 62-101ms | 67-162ms | **2-5x faster** |
| **Worst Case** | ~300ms | 753ms | 1047ms (cache bug) | **Regression** ❌ |
| **Goal (<50ms)** | ❌ | 🎯 (near!) | ✅ **ACHIEVED** | **48ms!** |

### Architecture Highlights

**Key Innovations**:

1. **Sequential Pre-loading** (Attempt #7):
   - Delays pre-load until AFTER first page renders
   - Eliminates all race conditions by design
   - Leverages user viewing time (1-3 seconds before navigation)
   - Sequential flow guarantees correctness

2. **Deferred Rendering** (Attempt #8):
   - Thumbnails render in background (`setTimeout(..., 50)`)
   - PDF metadata extracted in background (`setTimeout(..., 0)`)
   - First page renders immediately without blocking
   - **Achieved <50ms goal** when working correctly

**Caching Layers**:
1. **PDF Document Cache**: PDFDocumentProxy objects (memory-intensive)
2. **Metadata Cache**: Firestore + Storage metadata (lightweight)
3. **PDF Metadata Cache**: Extracted PDF info/XMP (lightweight)

All three layers work together, but cache invalidation bug causes instability.

### Critical Bug to Fix

**Issue**: Premature `cacheMetadata()` creates entries without `pdfDocument` field

**Location**: `ViewDocument.vue` lines 1062-1069

**Fix Needed**:
- Remove the premature `cacheMetadata()` call before PDF loads
- Only cache metadata AFTER `loadPdf()` completes successfully
- Restore Attempt #7 behavior: cache everything together after PDF loads
- Keep the deferred rendering optimizations (thumbnails, PDF metadata extraction)

**Expected Result After Fix**:
- 48ms best case navigation (goal achieved) ✅
- Consistent 48-162ms performance (no cache invalidation) ✅
- No regression to 1047ms worst case ✅

---

## Historical Context: Previous State (After Attempt #5)

This section preserved for historical reference showing the state before Attempts #6 and #7.

### What's Working ✅
- **Metadata pre-loading FIXED!** ✅
  - "Pre-loaded and cached metadata" appears in console
  - "Metadata cache HIT" on every navigation
  - Cache entry preservation working perfectly

- **PDF caching working consistently** ✅
  - All navigations show "PDF cache HIT"
  - PDF loads from cache in 8-16ms
  - No more cache overwrites

- **Best case performance achieved** ✅
  - When navigating to previously *viewed* document: **39ms total**
  - Full cache hits: PDF + metadata + PDF metadata
  - Zero network calls, zero extraction

### What's Still Slow ❌
- **PDF metadata extraction on each navigation** (110-831ms)
  - PDF metadata is only cached AFTER viewing a document
  - Not extracted during background pre-load
  - Causes variable rendering performance

- **First page rendering varies wildly**
  - 39ms: Best case (all caches hit, including PDF metadata)
  - 110-235ms: Typical (need to extract PDF metadata)
  - 831ms: Worst case (first navigation, possible Vue overhead)

### New Root Cause: PDF Metadata Not Pre-loaded
The PDF metadata extraction (`usePdfMetadata.extractMetadata()`) only happens when viewing a document, not during background pre-load:

**Current flow**:
1. Pre-load PDF document → cached ✅
2. Pre-load Firestore metadata → cached ✅
3. Navigate to document
4. Extract PDF metadata → **NOT cached, happens on every navigation** ❌
5. Cache the PDF metadata for future use

**What we need**:
- Extract and cache PDF metadata during background pre-load
- Achieves full cache hit on first navigation to pre-loaded document

---

## Potential Next Steps

After PDF pre-load completes, extract and cache the PDF metadata:

```javascript
// In ViewDocument.vue preloadAdjacentDocuments()
// After PDF pre-loads, extract its metadata
const pdfDocument = await pdfCache.getDocument(nextId, url);
const pdfMetadata = await extractMetadata(pdfDocument);
// Update cache entry to include pdfMetadata
```

**Pros**:
- Completes the caching pipeline
- Achieves 39ms navigation consistently
- Meets <50ms goal in all directions
- Natural extension of current architecture

**Cons**:
- Slightly more CPU usage during pre-load (background, won't affect UX)
- Need to handle case where metadata extraction fails

## Performance Summary

| Attempt | First View | Forward Nav (Pre-loaded) | Backward Nav (Fully Cached) | Best Case (All Cached) |
|---------|------------|--------------------------|----------------------------|------------------------|
| **Original** | ~300ms | ~280-320ms | ~280-320ms | N/A |
| **After Attempt #1**<br>Lazy URL fetching | ~300ms | ~280-320ms | ~280-320ms | N/A |
| **After Attempt #3**<br>Metadata cache + race fix | ~300ms | **220-294ms** | **13ms** ✅ | N/A |
| **After Attempt #4**<br>Pre-load metadata (race condition) | ~300ms | **188-255ms** (metadata overwritten)<br>OR **10-12ms** (rare) | **10-12ms** ✅<br>(when metadata survives) | **10-12ms** (rare) |
| **After Attempt #5**<br>Cache entry preservation | ~300ms | **110-235ms** ✅<br>(PDF metadata extraction) | **39ms** ✅<br>(consistent) | **39ms** ✅<br>(when revisiting) |
| **After Attempt #6**<br>PDF metadata pre-load (failed) | ~300ms | **57-804ms** ❌<br>(race condition - never ran) | N/A | N/A |
| **After Attempt #7**<br>Sequential pre-load after render | ~300ms | **52-101ms** 🎯<br>(full cache hits!) | **52-101ms** 🎯<br>(full cache hits!) | **52ms** 🎯<br>(BEST CASE - near goal!) |
| **After Attempt #8**<br>Deferred rendering | ~300ms | **48-162ms** ⚠️<br>(cache sometimes invalid) | **48-162ms** ⚠️<br>(cache sometimes invalid) | **48ms** ✅<br>(GOAL ACHIEVED! but unstable) |
