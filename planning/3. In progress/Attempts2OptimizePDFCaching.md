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
| 5 | **Cache Entry Overwrite Fixed, PDF Metadata Not Pre-loaded** <br><br>Implemented the fix from Attempt #4 analysis to preserve existing metadata when PDF pre-load completes. <br><br>**Results**: <br>- Metadata cache now working perfectly ✅ <br>- PDF cache working consistently (8-16ms) ✅ <br>- But PDF metadata extraction still happens on EVERY navigation ❌ <br>- First page rendering varies wildly (39-831ms) ❌ <br><br>**New bottleneck identified**: <br>PDF metadata is only cached AFTER viewing a document, not during pre-load. When navigating back to a previously viewed doc, get full cache hit (39ms). When navigating forward to pre-loaded doc, still need to extract PDF metadata. | - Modified `usePdfCache.js` line 181-193 to preserve existing metadata <br>- Retrieves existing cache entry before creating new one <br>- Preserves `metadata` field from existing entry <br><br>**Code change**: <br>```javascript <br>const existingEntry = cache.value.get(documentId); <br>const entry = { <br>&nbsp;&nbsp;loadingTask, pdfDocument, downloadUrl, <br>&nbsp;&nbsp;timestamp: Date.now(), <br>&nbsp;&nbsp;metadata: existingEntry?.metadata \|\| null <br>}; <br>``` <br><br>**Files Modified**: <br>- `usePdfCache.js` (lines 181-193) | **Forward navigation** (to pre-loaded doc): <br>- PDF load: 8-16ms ✅ (FAST!) <br>- Metadata cache: **HIT** ✅ (FIXED!) <br>- PDF cache: **HIT** ✅ <br>- PDF metadata: Extraction still required ❌ <br>- First render: 110-831ms ❌ (varies) <br><br>**Backward navigation** (to previously viewed doc): <br>- PDF load: 11.7ms ✅ <br>- Metadata cache: **HIT** ✅ <br>- PDF cache: **HIT** ✅ <br>- PDF metadata: **HIT** ✅ (cached from previous view!) <br>- First render: **39ms** ✅ (INSTANT!) <br><br>**Analysis**: Metadata preservation fix works! New bottleneck is PDF metadata extraction during pre-load. Only fully instant when navigating to documents that were previously VIEWED (not just pre-loaded). |

---

## Current State Analysis (After Attempt #5)

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
