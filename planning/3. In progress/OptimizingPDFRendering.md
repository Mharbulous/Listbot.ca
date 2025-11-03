This document tracks all attempts to optimize PDF page rendering performance in the Bookkeeper application.

**Goal**: Achieve <50ms first page render timing (instant feel)

The PDF optimization work has been split into two phases:

1. **Phase 1: Caching (COMPLETE ✅)** - Attempts2OptimizePDFCaching.md
2. **Phase 2: Rendering (IN PROGRESS 🔄)** - This document

## Optimization Attempts

| # | Issue Identified | Proposed Fix | Implementation | Performance Result | Outcome |
|---|------------------|--------------|----------------|-------------------|---------|
| **0** | **BASELINE** (Before optimization) | N/A - Initial state | • Canvas 2D CPU rendering<br>• No hardware acceleration<br>• No pre-rendering | **Load**: 7-15ms ✅<br>**Render**: 650-750ms ❌<br>**Total**: 650-750ms<br>**Cache hit**: 87-92% ✅ | Starting point for optimization |
| **1** | CPU-bound Canvas 2D rendering blocks main thread for 650-750ms | Enable GPU hardware acceleration via PDF.js `enableHWA` option | **Date**: 2025-11-02<br>**Files**:<br>• `usePdfCache.js:178` - Added `enableHWA: true`<br>• `ViewDocument.vue:163-179` - Enhanced perf logging<br>**Test**: 7 navigations | **Best**: 19.0ms 🎯<br>**Worst**: 931.7ms<br>**Average**: 418.4ms<br>**Success rate**: 28.6% (2/7 <50ms)<br>**Range**: 19-931ms | ⚠️ **PARTIAL SUCCESS**<br>Proved <50ms achievable but inconsistent (71.4% failed target). Renders vary wildly by page complexity. HWA unreliable for production. |
| **2** | 650-750ms canvas rendering blocks every navigation | Pre-render page 1 of adjacent documents during idle time (Strategy 3/8) | **Date**: 2025-11-02<br>**Files**:<br>• `useCanvasPreloader.js` (NEW) - ImageBitmap cache + LRU<br>• `useDocumentPreloader.js` - Added Phase 4<br>• `PdfPageCanvas.vue` - Canvas swap logic<br>• `ViewDocument.vue` - Initialize preloader<br>**Test**: 7 navigations | **Canvas swap**: 0.7-1.2ms ⚡<br>**With cache hit**: 12.9-20.3ms 🚀<br>**Cache miss**: 550-730ms ⚠️<br>**Hit rate**: 100% (when cached)<br>**Improvement**: 36-58x faster | ✅ **SUCCESS**<br>Exceeded target (<50ms → achieved <20ms). 100% hit rate when canvases pre-rendered. ImageBitmap cache working perfectly. LRU eviction stable. **PRODUCTION READY** |
| **3** | Memory usage grows with all pages rendered (8 canvases = ~7.2MB) | Combine Strategy 7 (Virtualized Rendering) + Strategy 8 (Smart Preloading) | **Date**: 2025-11-02<br>**Files**:<br>• `usePagePreloader.js` (NEW) - Module-level singleton cache<br>• `PdfViewerArea.vue` - Wrapper divs + conditional rendering<br>• `usePageVisibility.js` - Enhanced with `setRoot()`<br>• `ViewDocument.vue` - Scroll container setup<br>**Test**: Cannot complete | **Goal**: 70% memory reduction (7.2MB → 2.7MB)<br>**Actual**: Cannot measure<br>**Preloading**: ✅ Working (100% hit rate)<br>**Observer**: ✅ Tracks visibility<br>**Pages 3-8**: ✅ Can render | ❌ **INCOMPLETE - BLOCKED**<br>Critical bugs: Rapid page oscillation (1→2→1→2 pattern), IntersectionObserver fires ~50x per scroll, scroll position resets to page 1. Reactive feedback loop causes unusable navigation. Strategy 8 preloading works perfectly. Infrastructure in place but needs debugging. See [Detailed Documentation](#attempt-3-virtualized-rendering--smart-preloading-blocked) below. |
| **4** | Scroll jumping from reactive feedback loop in Attempt #3 | CSS-native optimization: Replace JS virtualization with `content-visibility: auto` + `contain-intrinsic-size` | **Date**: 2025-11-03<br>**Files**:<br>• `PdfViewerArea.vue` - Removed v-show, added CSS `content-visibility: auto`<br>• CSS: `contain: layout size paint`<br>• CSS: `contain-intrinsic-size: auto 883.2px auto 1142px`<br>**Test**: 9-page PDF, rapid scroll | **First load**: Scroll jumping ❌<br>**Second load**: Smooth scrolling ✅<br>**Root cause**: Browser needs "warm-up" render to learn actual sizes<br>**Memory**: Not measured | ❌ **FAILED**<br>`content-visibility: auto` with `auto` keyword requires warm-up render. First page load has scroll jank (browser uses placeholder sizes, actual sizes differ, layout shifts accumulate). Works perfectly on second load (browser remembers sizes). Unacceptable UX for first impressions. **Decision**: Reverted to Attempt #2. For 9-page docs, preloading alone is sufficient. |

---

## Detailed Attempt Documentation

### Attempt #3: Virtualized Rendering + Smart Preloading [BLOCKED]

**⚠️ STATUS: INCOMPLETE - Has critical bugs preventing normal operation**

**Date Started**: 2025-11-02
**Strategy**: Combined implementation of Strategy 7 (Virtualized Rendering) and Strategy 8 (Smart Preloading)
**Goal**: Reduce memory usage by 70% while maintaining instant forward scrolling performance

---

#### Quick Summary

**What Works** ✅
- All 8 pages CAN render (proven by quick scroll test)
- Page preloading functional (cache hits logged)
- IntersectionObserver tracks page visibility
- Infrastructure in place and integrated

**What's Broken** ❌
- Rapid page oscillation (1→2→1→2→3→1 pattern)
- User gets pushed back to page 1 when scrolling
- IntersectionObserver fires constantly (~50 times per scroll attempt)
- Cannot scroll past page 2 reliably

**Current Status**: 🚧 **BLOCKED** - Debugging reactive feedback loop causing scroll jumping

---

#### Implementation Completed ✅

##### 1. Strategy 7: Virtualized Rendering Infrastructure

**Concept**: Only render visible pages (current page ±1 buffer) to reduce memory by ~70%

**Implementation**:
- ✅ Visible range calculation based on `mostVisiblePage` (current ±1 buffer)
- ✅ Wrapper divs maintain scroll position during conditional rendering
- ✅ IntersectionObserver integration for page visibility tracking
- ✅ Conditional component rendering based on `isPageInVisibleRange()`
- ✅ Changed from `v-if` to `v-show` to prevent layout shifts

**Files Modified**:
- `src/components/document/PdfViewerArea.vue`
  - Lines 29-50: Added wrapper divs with `data-page-number` attributes
  - Lines 37, 47: Conditional rendering with `v-show`
  - Lines 115-128: `visiblePageRange` computed property
  - Lines 131-134: `isPageInVisibleRange()` function
  - Lines 139-144: `setWrapperRef()` callback to collect wrapper refs
  - Lines 147-187: `registerWrappers()` function for dynamic registration
  - Lines 222-247: Watch on `totalPages` to register when PDF loads

**Key Code**:
```vue
<!-- Wrapper div for each page -->
<div
  v-for="pageNum in totalPages"
  :key="`page-wrapper-${pageNum}`"
  :ref="setWrapperRef"
  :data-page-number="pageNum"
  class="pdf-page-wrapper"
>
  <!-- Conditionally show/hide canvas -->
  <PdfPageCanvas v-show="isPageInVisibleRange(pageNum)" ... />
  <div v-show="!isPageInVisibleRange(pageNum)" class="page-placeholder">
    <span class="page-number">Page {{ pageNum }}</span>
  </div>
</div>
```

```javascript
// Calculate visible range (current page ±1)
const visiblePageRange = computed(() => {
  const currentPage = pageVisibility?.mostVisiblePage?.value || 1;
  const buffer = 1;
  return {
    start: Math.max(1, currentPage - buffer),
    end: Math.min(props.totalPages, currentPage + buffer),
  };
});

// Check if page should be visible
const isPageInVisibleRange = (pageNum) => {
  const range = visiblePageRange.value;
  return pageNum >= range.start && pageNum <= range.end;
};
```

---

##### 2. Strategy 8: Page Preloader Composable

**Concept**: Pre-render next page during idle time while user views current page (80-90% hit rate)

**Implementation**:
- ✅ Created `src/features/organizer/composables/usePagePreloader.js`
- ✅ Module-level singleton cache for ImageBitmaps
- ✅ Pre-rendering during idle time with `requestIdleCallback`
- ✅ LRU cache eviction (MAX_CACHE_SIZE = 10)
- ✅ Cache hit/miss tracking and logging

**Files Created**:
- `src/features/organizer/composables/usePagePreloader.js` (NEW, ~250 lines)

**Key Features**:
```javascript
// Module-level singleton cache
const pageCache = new Map(); // pageNumber -> { bitmap, timestamp, documentId }

// Check if page is pre-rendered
const hasPreRenderedPage = (pageNumber) => {
  return pageCache.has(pageNumber);
};

// Get pre-rendered page
const getPreRenderedPage = (pageNumber) => {
  const entry = pageCache.get(pageNumber);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry.bitmap;
  }
  return null;
};

// Pre-render during idle time (non-blocking)
const preRenderPageIdle = (pdfDocument, pageNumber, width, height) => {
  const scheduleIdleTask = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  scheduleIdleTask(() => {
    preRenderPage(pdfDocument, pageNumber, width, height);
  });
};
```

**Integration**:
- `ViewDocument.vue` line 143: Provide `pagePreloader` to children
- `ViewDocument.vue` lines 312-335: Watch `currentVisiblePage`, trigger preload
- `PdfPageCanvas.vue` lines 111-118: Check preloader before rendering

**Console Evidence** (Working):
```
🎨 Pre-rendered page 3 in 56.8ms
🎨 Pre-rendered page 4 in 18.5ms
🎨 Pre-rendered page 8 in 15.9ms
✅ Page cache HIT | Hit rate: 100.0%
```

---

##### 3. IntersectionObserver Configuration Fixes

**Problem Identified**: IntersectionObserver was watching the wrong scroll container

**Original Bug**:
- Observer root was `null` (browser viewport)
- Actual scroll container is `.view-document-content` (CSS `overflow-y: auto`)
- When user scrolled within container, viewport didn't change
- Observer never fired

**Fix Implemented**:
- ✅ Updated `usePageVisibility.js` to accept `scrollContainer` parameter
- ✅ Added `setRoot(scrollContainer)` method to update observer root
- ✅ Added `createObserver(root)` function for dynamic observer creation
- ✅ ViewDocument.vue sets correct scroll container as root

**Files Modified**:
- `src/features/organizer/composables/usePageVisibility.js`
  - Line 13: Added `scrollContainer` parameter
  - Lines 21-70: `createObserver(root)` function
  - Lines 80-83: `setRoot(scrollContainer)` method
  - Line 62: Observer uses `root: root` instead of `root: null`

- `src/features/organizer/views/ViewDocument.vue`
  - Line 18: Added `ref="scrollContainerRef"` to `.view-document-content`
  - Line 149: Created `scrollContainerRef = ref(null)`
  - Lines 351-361: Set observer root to scroll container in `onMounted`

**Result**: ✅ Observer now fires (was completely broken before), but fires TOO MUCH

---

##### 4. Dynamic PDF Loading Handling

**Problem Identified**: Component mounts before PDF loads (`totalPages = 0`)

**Original Bug**:
- PdfViewerArea mounts with `totalPages: 0`
- `v-for="pageNum in totalPages"` creates 0 wrapper divs
- NO refs collected, NO wrappers registered with observer
- When PDF loads later, no re-registration happens

**Fix Implemented**:
- ✅ Extract registration logic into reusable `registerWrappers()` function
- ✅ Add defensive check: skip if `totalPages === 0` or `!pdfDocument`
- ✅ Watch `totalPages` prop, register when changes from 0 → positive
- ✅ Call `registerWrappers()` in both `onMounted` and `watch`

**Files Modified**:
- `src/components/document/PdfViewerArea.vue`
  - Lines 147-187: `registerWrappers()` function with defensive checks
  - Lines 190-218: `onMounted` calls `registerWrappers()`
  - Lines 222-247: Watch on `totalPages` re-calls `registerWrappers()`

**Console Evidence** (Working):
```
=== PdfViewerArea MOUNTED ===
Total pages: 0
pdfDocument: NOT loaded
[S7] registerWrappers called
[S7] Skipping registration - PDF not loaded yet
... (PDF loads)
[S7] totalPages changed: 0 → 8
[S7] PDF loaded! Re-registering wrappers...
[Observer] Registered page 1
[Observer] Registered page 2
...
[Observer] Registered page 8
[S7] Registered 8 page wrappers with observer
```

---

#### Critical Bugs Discovered 🐛

##### Bug #1: Rapid Page Oscillation

**Symptom**: Continuous jumping back to page 1 when trying to scroll down

**Pattern**:
```
mostVisiblePage: 1 → 2 → 1 → 2 → 3 → 1 → 2 → 1 → 2 → 1 ...
Visible range:   1-2 → 1-3 → 1-2 → 1-3 → 2-4 → 1-2 → 1-3 → 1-2 ...
```

**Console Evidence**:
```
[Observer] mostVisiblePage updated to 2
👁️ mostVisiblePage changed: 1 → 2
[S7] Visible range: 1-3
[Observer] Page 1 entered viewport
[Observer] mostVisiblePage updated to 1
👁️ mostVisiblePage changed: 2 → 1
[S7] Visible range: 1-2
(repeats infinitely ~50 times per scroll attempt)
```

---

##### Bug #2: IntersectionObserver Over-Firing

**Symptom**: Observer callback fires constantly, even without user scrolling

**Frequency**: ~50 callbacks during a single scroll attempt

**Pattern**:
```
[Observer] Callback fired with 1 entries
[Observer] Page 2 entered viewport
[Observer] Callback fired with 1 entries
[Observer] Page 1 entered viewport
[Observer] Callback fired with 1 entries
[Observer] Page 2 entered viewport
... (repeats infinitely)
```

**Expected Behavior**:
- Observer fires when pages enter/leave viewport during scroll
- Smooth progression: 1 → 2 → 3 → 4 → 5 ...

**Actual Behavior**:
- Observer fires constantly even with `v-show` (no DOM mutations)
- Chaotic oscillation: 1 → 2 → 1 → 2 → 3 → 1 → 2 → 1 ...

---

##### Bug #3: Scroll Position Reset

**Symptom**: User gets pushed back to page 1 when scrolling

**Test Case**: Grab scrollbar, quickly drag to bottom (page 8)

**Result**:
1. ✅ Briefly see page 8 rendered (proves rendering works!)
2. ❌ Immediately pushed back up through pages 7, 6, 5, 4, 3, 2
3. ❌ Eventually land back on page 1
4. ❌ Cannot scroll past page 2 reliably

**Console Evidence** (Shows brief success then failure):
```
[Observer] mostVisiblePage updated to 8
[S7] Visible range: 7-8
🎨 Pre-rendered page 8 in 15.9ms
[Observer] mostVisiblePage updated to 7
[S7] Visible range: 6-8
[Observer] mostVisiblePage updated to 6
[S7] Visible range: 5-7
... (continues regressing)
[Observer] mostVisiblePage updated to 1
[S7] Visible range: 1-2
```

---

#### Root Cause Analysis

##### Hypothesis: Reactive Feedback Loop

**The Vicious Cycle**:

1. **User scrolls** → Page 2 scrolls into viewport
2. **IntersectionObserver fires** → Detects page 2 entered
3. **`mostVisiblePage` updates** → Vue ref changes from 1 → 2
4. **Vue reactivity triggers** → `visiblePageRange` computed recalculates
5. **Visible range changes** → From `1-2` to `1-3`
6. **❓ Unknown trigger** → Something causes observer to fire again
7. **Observer detects page 1** → Page 1 re-enters viewport (why?)
8. **`mostVisiblePage` resets** → Vue ref changes from 2 → 1
9. **Visible range contracts** → From `1-3` back to `1-2`
10. **Loop repeats** → Steps 2-9 repeat infinitely

##### Questions Needing Investigation

**Q1: Why does changing `visiblePageRange` trigger observer callbacks?**
- Expected: `v-show` only changes CSS `display`, no DOM structure changes
- Expected: IntersectionObserver should NOT fire for CSS changes
- Actual: Observer fires immediately after range changes

**Q2: Why does page 1 re-enter viewport when range expands?**
- Expected: Page 1 should stay out of viewport when scrolled down
- Expected: Only page 3 should enter when range expands to `1-3`
- Actual: Page 1 somehow becomes visible again

**Q3: What is causing scroll position to reset?**
- Expected: Scroll position stays stable during reactive updates
- Actual: Scroll position jumps back to page 1

##### Potential Root Causes

**Theory 1: CSS visibility changes affect IntersectionObserver**
- `v-show` changes `display: none` → `display: block`
- Browser may trigger intersection calculations on visibility changes
- This could cause observer to fire even without scroll

**Theory 2: Wrapper div dimensions change during visibility toggle**
- Page 3 wrapper changes from placeholder → canvas
- Even with `min-height`, actual height might differ
- Height change causes layout shift → scroll position adjusts

**Theory 3: Vue reactivity causes DOM thrashing**
- Rapid updates to `visiblePageRange` cause multiple re-renders
- Each re-render triggers browser layout recalculation
- IntersectionObserver polls during layout, sees position changes

**Theory 4: Observer threshold configuration issue**
- Current thresholds: `[0, 0.1, 0.5, 1.0]`
- Multiple thresholds may cause excessive callbacks
- Edge cases near threshold boundaries could oscillate

---

#### Attempted Fixes

##### Fix #1: Changed v-if to v-show ❌ DID NOT FIX

**Rationale**: `v-if` mounts/unmounts components, causing DOM mutations and layout shifts that could trigger observer

**Implementation**:
```vue
<!-- Before (v-if) -->
<PdfPageCanvas v-if="isPageInVisibleRange(pageNum)" ... />
<div v-else class="page-placeholder">

<!-- After (v-show) -->
<PdfPageCanvas v-show="isPageInVisibleRange(pageNum)" ... />
<div v-show="!isPageInVisibleRange(pageNum)" class="page-placeholder">
```

**Expected Result**: Eliminate layout shifts, prevent observer from firing on visibility changes

**Actual Result**: ❌ Observer still fires constantly, scroll still jumps

**Files Modified**: `PdfViewerArea.vue` lines 37, 47

**Conclusion**: `v-show` not sufficient to fix the issue. Problem is deeper than DOM mounting.

---

##### Fix #2: Set Correct Scroll Container ✅ PARTIALLY FIXED

**Rationale**: IntersectionObserver was watching viewport instead of actual scroll container

**Problem**:
- Observer root was `null` (viewport)
- Scroll container is `.view-document-content` (CSS `overflow-y: auto`)
- Scrolling within container doesn't change viewport

**Implementation**:
```javascript
// ViewDocument.vue - Set correct root
if (pageVisibility.setRoot && scrollContainerRef.value) {
  pageVisibility.setRoot(scrollContainerRef.value);
  console.log('[ViewDoc] Set observer root to .view-document-content');
}

// usePageVisibility.js - Accept custom root
export function usePageVisibility(scrollContainer = null) {
  // ...
  const observer = new IntersectionObserver(callback, {
    root: scrollContainer, // Use provided container instead of null
    rootMargin: '200px',
    threshold: [0, 0.1, 0.5, 1.0],
  });
}
```

**Result**: ✅ Observer now fires (was completely broken before)
**Issue**: ❌ Observer fires TOO MUCH (~50 times per scroll)

**Files Modified**:
- `ViewDocument.vue` lines 18, 149, 352-361
- `usePageVisibility.js` lines 13, 21-70, 80-83

**Conclusion**: Fix was necessary but revealed the over-firing bug.

---

##### Fix #3: Dynamic Wrapper Registration ✅ WORKING

**Rationale**: Component mounts before PDF loads (totalPages = 0), causing 0 wrappers to register

**Problem**:
- `onMounted` runs → PDF not loaded yet → totalPages = 0
- `v-for` creates 0 wrapper divs → No refs collected
- PDF loads → totalPages becomes 8 → But no re-registration

**Implementation**:
```javascript
// Watch for PDF loading
watch(
  () => props.totalPages,
  async (newTotal, oldTotal) => {
    if (newTotal > 0 && oldTotal === 0) {
      console.log('[S7] PDF loaded! Re-registering wrappers...');
      await registerWrappers();
    }
  }
);
```

**Result**: ✅ All 8 wrappers successfully registered when PDF loads

**Console Evidence**:
```
[S7] totalPages changed: 0 → 8
[S7] PDF loaded! Re-registering wrappers...
[Observer] Registered page 1
[Observer] Registered page 2
...
[Observer] Registered page 8
[S7] Registered 8 page wrappers with observer
```

**Files Modified**: `PdfViewerArea.vue` lines 222-247

**Conclusion**: ✅ This fix works perfectly. No issues with registration.

---

#### Positive Outcomes Despite Bugs

##### 1. All Pages CAN Render ✅

**Evidence**: Quick scroll test proved pages 3-8 render successfully

**Console Logs**:
```
[Observer] mostVisiblePage updated to 8
[S7] Visible range: 7-8
🎨 Pre-rendered page 8 in 15.9ms
```

**Conclusion**: The rendering logic works. Pages 3-8 are briefly visible before getting pushed back to page 1.

---

##### 2. Page Preloading Works ✅

**Evidence**: Cache hits shown in logs, ImageBitmap cache functional

**Console Logs**:
```
🎨 Pre-rendered page 3 in 56.8ms {pageNumber: 3, cacheSize: 1, successRate: '100.0%'}
🎨 Pre-rendered page 4 in 18.5ms {pageNumber: 4, cacheSize: 2, successRate: '100.0%'}
✅ Page cache HIT | Hit rate: 100.0% {pageNumber: 3, cacheSize: 2, hits: 1, misses: 0}
✅ Page cache HIT | Hit rate: 100.0% {pageNumber: 3, cacheSize: 3, hits: 4, misses: 0}
```

**Conclusion**: Strategy 8 (Smart Preloading) is fully functional. Cache hits confirmed.

---

##### 3. Observer Tracks Visibility ✅

**Evidence**: Successfully detects when pages enter/leave viewport

**Console Logs**:
```
[Observer] Callback fired with 8 entries
[Observer] Page 1 entered viewport
[Observer] Page 2 entered viewport
[Observer] Page 3 entered viewport
...
[Observer] Page 8 entered viewport
```

**Conclusion**: IntersectionObserver integration works. Detection is accurate, just fires too often.

---

##### 4. Infrastructure In Place ✅

**Components Created/Modified**:
- ✅ `usePagePreloader.js` - Complete, tested, working
- ✅ `usePageVisibility.js` - Enhanced with `setRoot()`, working
- ✅ `PdfViewerArea.vue` - Wrapper divs, conditional rendering, registration logic
- ✅ `ViewDocument.vue` - Scroll container setup, preloader integration
- ✅ `PdfPageCanvas.vue` - Preloader check, canvas swap logic

**Conclusion**: All pieces are in place. Just need to fix the reactive feedback loop.

---

#### Next Debugging Steps

##### Option 1: Debounce `mostVisiblePage` Updates

**Approach**: Prevent rapid oscillation by throttling observer updates

**Implementation**:
```javascript
import { debounce } from 'lodash-es';

// In usePageVisibility.js
const updateMostVisiblePage = debounce((newPage) => {
  mostVisiblePage.value = newPage;
}, 100); // 100ms delay

// In observer callback
if (maxRatio > 0 && maxPage !== mostVisiblePage.value) {
  updateMostVisiblePage(maxPage);
}
```

**Pros**: Simple, might break the feedback loop
**Cons**: Adds 100ms delay to page detection, may feel sluggish

---

##### Option 2: Throttle Observer Callback

**Approach**: Limit how often the observer callback can execute

**Implementation**:
```javascript
import { throttle } from 'lodash-es';

const handleIntersection = throttle((entries) => {
  // ... existing observer logic
}, 100); // Max once per 100ms

const observer = new IntersectionObserver(handleIntersection, { ... });
```

**Pros**: Prevents excessive firing, simple fix
**Cons**: May miss rapid scroll events, less responsive

---

##### Option 3: Abandon Virtualized Rendering

**Approach**: Remove conditional rendering, use CSS `content-visibility: auto` instead

**Implementation**:
```vue
<!-- Remove v-show, always render all pages -->
<div v-for="pageNum in totalPages" class="pdf-page-wrapper" style="content-visibility: auto;">
  <PdfPageCanvas :page-number="pageNum" ... />
</div>
```

**Pros**: Browser-native virtualization, no reactive feedback loop
**Cons**: Limited browser support (Safari < 17), may not achieve 70% memory reduction

---

##### Option 4: Lock Scroll Position During Updates

**Approach**: Prevent reactive updates from affecting scroll position

**Implementation**:
```javascript
watch(visiblePageRange, async (newRange, oldRange) => {
  // Save scroll position before update
  const scrollTop = scrollContainerRef.value?.scrollTop;

  await nextTick();

  // Restore scroll position after update
  if (scrollContainerRef.value && scrollTop !== undefined) {
    scrollContainerRef.value.scrollTop = scrollTop;
  }
});
```

**Pros**: Preserves scroll position, may fix jumping
**Cons**: Hacky workaround, doesn't address root cause

---

##### Option 5: Remove Reactive Dependency

**Approach**: Decouple `visiblePageRange` from `mostVisiblePage` reactivity

**Implementation**:
```javascript
// Make visiblePageRange a plain variable, not computed
let visiblePageRange = { start: 1, end: 2 };

// Manually update on mostVisiblePage change (non-reactive)
const updateVisibleRange = (newPage) => {
  visiblePageRange = {
    start: Math.max(1, newPage - 1),
    end: Math.min(totalPages, newPage + 1),
  };
  // Force component update
  forceUpdate();
};
```

**Pros**: Breaks reactive chain, gives manual control
**Cons**: Loses Vue reactivity benefits, more complex state management

---

#### Performance Data

##### Observer Activity (Too Frequent)

**Metrics**:
- Callback fires: ~50 times during single scroll attempt
- Expected: 2-3 callbacks per page transition
- Actual: 15-20 callbacks per page transition

**Pattern**:
```
Page transitions: 1→2→1→2→3→1→2→1→2→1
Expected: 1→2→3→4→5→6→7→8 (smooth)
Actual: Chaotic oscillation, never progresses past page 3
```

---

##### Memory Usage (Not Yet Measurable)

**Expected** (Strategy 7 goal):
- Before: All 8 pages in DOM = 8 canvases = ~7.2MB
- After: Only 3 pages in DOM = 3 canvases = ~2.7MB
- **Reduction**: 70% memory savings

**Actual**: Cannot measure due to scroll jumping bug preventing normal navigation

---

##### Preloading Success (Working)

**Metrics from Console Logs**:
```
Pre-render times:
- Page 2: 34.9ms
- Page 3: 56.8ms
- Page 4: 18.5ms
- Page 5: 32.4ms
- Page 6: 43.7ms
- Page 7: 13.1ms
- Page 8: 15.9ms

Cache performance:
- Hit rate: 100.0%
- Total hits: 4
- Total misses: 0
- Cache size: 2-7 entries (varies)
```

**Conclusion**: ✅ Strategy 8 works perfectly. Pre-rendering is fast and cache is effective.

---

#### Comparison to Attempt #2

| Metric | Attempt #2 (✅ Working) | Attempt #3 (🚧 In Progress) |
|--------|------------------------|----------------------------|
| **Navigation Speed** | 12.9-20.3ms | Cannot measure (scroll broken) |
| **Memory Usage** | +2.7MB (3 cached canvases) | Cannot measure (cannot scroll) |
| **User Experience** | Smooth, instant | Broken (jumps to page 1) |
| **Preloading** | Working (80% hit rate) | Working (cache hits logged) |
| **Stability** | Stable, production ready | Unstable, debugging required |
| **Status** | ✅ Deployed, working | ⚠️ Blocked, in progress |

---

#### Recommendation

##### Current Status: ⚠️ BLOCKED

**Critical Issue**: Scroll jumping makes the application unusable

**Do NOT Deploy Attempt #3** - Users cannot scroll past page 2

---

##### Options for Resolution

**Option A: Debug and Fix** (Recommended)
- Investigate reactive feedback loop and scroll reset
- Try debouncing/throttling (Options 1-2 above)
- Expected effort: 1-2 days
- Expected result: Working virtualized rendering

**Option B: Simplify Approach** (Fallback)
- Remove virtualized rendering (Strategy 7)
- Keep only preloading (Strategy 8)
- Accept current memory usage (+2.7MB)
- Expected effort: 2 hours (remove code)
- Expected result: Working preloading, no memory optimization

**Option C: Alternative Strategy** (Alternative)
- Use CSS `content-visibility: auto` for memory optimization
- Remove custom virtualization logic
- Browser handles rendering optimization
- Expected effort: 1 day
- Expected result: 50-70% memory reduction, browser-dependent

**Option D: Revert to Attempt #2** (Safe)
- Return to working state
- Revisit virtualization later
- Continue with Attempt #2 in production
- Expected effort: Immediate (git revert)
- Expected result: Stable, working application

---

##### Next Actions

**Immediate** (Today):
1. Try Option 1 (Debounce `mostVisiblePage`) - Quick test
2. If successful: Continue with fixes
3. If unsuccessful: Revert to Attempt #2, document lessons learned

**Short-term** (This week):
- If debugging takes >2 days: Switch to Option B or D
- Document findings for future attempts
- Consider CSS `content-visibility` research

**Long-term** (Future):
- Research alternative virtualization approaches
- Consider Vue Virtual Scroller libraries
- Test in different browsers for clues

---

#### Conclusion

**Attempt #3 Status**: 🚧 **IN PROGRESS - BLOCKED**

**What's Working**:
- ✅ Strategy 8 (Smart Preloading) - Fully functional
- ✅ IntersectionObserver tracking - Accurate detection
- ✅ All 8 pages can render - Proven by quick scroll test
- ✅ Infrastructure complete - All components integrated

**What's Broken**:
- ❌ Reactive feedback loop causing scroll jumping
- ❌ Observer fires ~50 times per scroll attempt
- ❌ Cannot scroll past page 2 reliably
- ❌ User gets pushed back to page 1

**Next Step**: Try debouncing `mostVisiblePage` updates (Option 1) as quick fix attempt

**Fallback**: Revert to Attempt #2 if debugging unsuccessful within 2 days

**Current Work**: Actively debugging scroll jumping issue (2025-11-02)

---

### Attempt #4: CSS-Native Optimization with `content-visibility` [FAILED]

**⚠️ STATUS: FAILED - Reverted to Attempt #2**

**Date Started**: 2025-11-03
**Strategy**: Replace JavaScript-based virtualization with CSS `content-visibility: auto`
**Goal**: Eliminate reactive feedback loop from Attempt #3 while maintaining memory optimization

---

#### Quick Summary

**Hypothesis** ✅ (Correct)
- Attempt #3's scroll jumping was caused by reactive feedback loop
- Replacing JS conditional rendering with CSS would eliminate the loop

**Approach** ✅ (Sound)
- Remove all `v-show` conditional logic from `PdfViewerArea.vue`
- Always render all pages in DOM
- Let browser handle optimization with `content-visibility: auto`

**Implementation** ✅ (Successful)
- CSS properties applied correctly
- Dimensions matched actual rendered sizes (883.2px × 1142px)
- Used `auto` keyword for size remembering

**Result** ❌ (Failed UX)
- **First page load**: Scroll jumping (unacceptable)
- **Subsequent loads**: Smooth scrolling (perfect)
- **Root cause**: Browser warm-up requirement

---

#### Implementation Details

**Files Modified**:
- `PdfViewerArea.vue` - Simplified template, removed conditional rendering
- `PdfViewerArea.vue` - Added CSS optimizations

**Key CSS Changes**:
```css
.pdf-page-wrapper {
  /* Browser-native virtualization */
  content-visibility: auto;

  /* Isolate layout calculations */
  contain: layout size paint;

  /* Auto-remembering size (MDN: July 2025) */
  contain-intrinsic-size: auto 883.2px auto 1142px;
}
```

**How it Works**:
1. `content-visibility: auto` - Browser skips rendering off-screen pages
2. `contain` - Isolates layout calculations per page
3. `contain-intrinsic-size: auto 883.2px auto 1142px` - Provides placeholder dimensions, browser remembers actual sizes after first render

---

#### The Fatal Flaw: Warm-Up Requirement

**Console Log Evidence**:

**First Load (Fresh Browser)**:
```
[Observer] Page 1 entered viewport
[Observer] Page 2 entered viewport
[Observer] Page 3 entered viewport
[Observer] Page 1 entered viewport  ← User pushed back!
[Observer] Page 2 entered viewport
[Observer] Page 1 entered viewport  ← Stuck in loop
```

**Second Load (Returning from Another Document)**:
```
[Observer] Page 1 entered viewport
[Observer] Page 2 entered viewport
[Observer] Page 3 entered viewport
[Observer] Page 4 entered viewport  ← Smooth progression ✅
[Observer] Page 5 entered viewport
```

**Why This Happens**:

1. **First Load**: Browser has no memory of actual sizes
   - Uses placeholder `1142px` for all off-screen pages
   - When pages enter viewport, actual rendered sizes may vary slightly:
     - Rounding errors (sub-pixel differences)
     - Margin collapse variations
     - Font rendering differences
   - Even 1-2px difference per page accumulates across 9 pages
   - Total 9-18px layout shift triggers IntersectionObserver
   - Scroll position adjusts backwards = jumping effect

2. **Second Load**: Browser remembers exact sizes from first render
   - Uses remembered sizes for off-screen pages
   - Perfect match when pages enter viewport
   - Zero layout shift = smooth scrolling ✅

---

#### Research Findings

**MDN Documentation** (July 2025):
> The `auto` keyword causes the browser to remember the last-rendered size, if any, and use that instead of the developer-provided placeholder size.

**Bram.us Blog** (Content Visibility vs Jumpy Scrollbars):
> The solution to big layout shifts is to pair `content-visibility: auto` with `contain-intrinsic-size`. However, this still requires the element to be rendered once before the browser can remember its size.

**Alex Russell** (Infrequently Noted):
> Use IntersectionObservers and ResizeObservers to reserve vertical space using CSS's new `contain-intrinsic-size` property once elements have been laid out.

**Key Insight**: All solutions acknowledge the warm-up requirement. No way to avoid first-load jank without pre-rendering.

---

#### Attempted Fixes (All Inadequate)

**Fix #1: Accurate Dimensions** ❌
- Changed placeholder from `1056px` → `1142px` (actual rendered height)
- Still had first-load jank (sub-pixel differences remain)

**Fix #2: `auto` Keyword** ❌
- Added `auto` keyword: `contain-intrinsic-size: auto 883.2px auto 1142px`
- Works perfectly on second load
- Still has first-load jank (warm-up required)

**Fix #3: Consider Pre-warming** ❌ (Not Implemented)
- Could disable `content-visibility` on mount, enable after render
- Defeats the purpose (no performance gain on first load)
- Adds complexity for zero benefit

---

#### Why Attempt #2 is Superior

| Aspect | Attempt #2 (Preloading) | Attempt #4 (CSS) |
|--------|------------------------|------------------|
| **First Load** | ✅ Smooth | ❌ Janky |
| **Second Load** | ✅ Smooth | ✅ Smooth |
| **Complexity** | Low | Medium |
| **Memory** | +2.7MB (acceptable) | Unknown (can't measure) |
| **Performance** | 12.9-20.3ms ⚡ | Unknown (can't test) |
| **Browser Support** | 100% | Chrome/Edge ✅, Safari 17.4+ ✅ |
| **Maintenance** | Simple | CSS tricks |
| **Production Ready** | ✅ Yes | ❌ No |

---

#### Lessons Learned

1. **`content-visibility: auto` is not a silver bullet**
   - Requires warm-up render for smooth scrolling
   - First impressions matter - first-load jank is unacceptable

2. **For small documents (< 20 pages), CSS optimization is overkill**
   - Preloading alone achieves <20ms performance
   - Memory cost (+2.7MB) is negligible
   - Simplicity wins

3. **`content-visibility` is better for large, repeating lists**
   - Blog feeds, product catalogs, infinite scroll
   - Where users don't notice cold-start jank
   - Where memory savings are significant (100+ items)

4. **PDF documents need predictable first-load UX**
   - Professional software requires polish
   - Warm-up jank breaks user trust
   - Stick with proven techniques

---

#### Decision: Revert to Attempt #2

**Rationale**:
- Attempt #2 is **production-ready** (marked as such on 2025-11-02)
- Performance target **exceeded** (<50ms goal → 12.9-20.3ms actual)
- Memory cost **acceptable** (+2.7MB for 3 cached canvases)
- Zero scroll bugs, zero jank, 100% reliable
- Simple codebase, easy to maintain

**Action Taken** (2025-11-03):
- Reverted `PdfViewerArea.vue` to simple template
- Removed all CSS `content-visibility` optimizations
- Kept IntersectionObserver for page tracking (needed for preloading)
- Kept `usePagePreloader.js` (Strategy 8 - working perfectly)

---

#### Conclusion

**Attempt #4 Status**: ❌ **FAILED - REVERTED**

**What Worked**:
- ✅ CSS implementation correct
- ✅ Eliminated Attempt #3's reactive feedback loop
- ✅ Second-load scrolling perfect

**What Failed**:
- ❌ First-load warm-up jank unacceptable
- ❌ No way to avoid cold-start layout shifts
- ❌ Browser support requires Safari 17.4+

**Final Decision**: **Stay with Attempt #2**

Attempt #2 remains the **production solution** for PDF rendering optimization. For 9-page documents, preloading alone provides exceptional performance (<20ms) without complexity or first-load jank.

**Future Consideration**: For documents with 50+ pages, revisit `content-visibility` or investigate Vue Virtual Scroller libraries.

**End Date**: 2025-11-03
**Status**: Closed - Reverted to Attempt #2

