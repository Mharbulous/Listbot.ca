# PDF Document Viewer Performance Optimization

**Route:** `/matters/:matterId/documents/view/:fileHash`
**Main Component:** `src/features/organizer/views/ViewDocument.vue`

---

## Architecture Overview

### Key Files
- `src/features/organizer/views/ViewDocument.vue` - Main orchestrator (304 lines)
- `src/features/organizer/composables/useDocumentNavigation.js` - Navigation state/methods
- `src/features/organizer/composables/useEvidenceLoader.js` - Firestore/Storage loading with caching
- `src/features/organizer/composables/useDocumentPreloader.js` - Background pre-loading pipeline
- `src/features/organizer/composables/useCanvasPreloader.js` - Canvas pre-rendering cache
- `src/features/organizer/composables/usePdfCache.js` - PDF document cache (LRU, MAX_SIZE=3)
- `src/features/organizer/composables/useThumbnailRenderer.js` - Thumbnail cache (Blob URLs)
- `src/features/organizer/components/PdfPageCanvas.vue` - Individual page rendering with cache swap
- `src/components/document/PdfViewerArea.vue` - CSS virtualization (`content-visibility: auto`)

---

## Three-Level Caching System

| Cache | Purpose | Performance | Cache Type | Notes |
|-------|---------|-------------|------------|-------|
| **PDF Document** | Avoid network fetches | 0ms (no network) | LRU, MAX_SIZE=3, module-level singleton | Stores PDFDocumentProxy + metadata |
| **Canvas Pre-render** | Skip page 1 render | 0.7-1.2ms vs 650-750ms | LRU, MAX_SIZE=3, module-level singleton | ImageBitmap (3.3x more efficient than Canvas elements) |
| **Thumbnail** | Sidebar display | Instant | Map (fileHash → Blob URLs), component-level | 2x more efficient than data URLs |

**Critical:** All caches are **module-level singletons** to persist across component unmount/remount during navigation.

---

## Performance Optimization Strategy

### Primary Optimization: Canvas Pre-rendering
**Impact:** 36-58x faster navigation (12.9-20.3ms vs 650-750ms)

**How it works:**
1. User views document (spends 1-3 seconds before navigating)
2. Background pipeline pre-renders page 1 of adjacent documents during idle time
3. Stores as ImageBitmap in cache (memory efficient)
4. On navigation: canvas swap (0.7-1.2ms) instead of fresh render (650-750ms)

**Key insight:** Re-renders are 10x faster (74ms vs 757ms) due to PDF.js resource caching. Focus on caching strategy, not algorithm optimization.

### CSS Virtualization
**Impact:** 40% performance boost for large documents

**Implementation** (`PdfViewerArea.vue:151-153`):
```css
.pdf-page {
  content-visibility: auto;
  contain-intrinsic-size: 883.2px 1056px; /* Fixed dimensions - critical! */
}
```

**Critical:** Must use **fixed dimensions**, NOT `auto` keyword (causes first-load scroll jank).

### Background Pre-loading Pipeline
**Timing:** Starts AFTER first page renders (avoids race conditions)

**Phases** (sequential):
1. **PDF Loading** - Pre-load previous/next PDFs into cache
2. **Metadata Loading** - Parallel fetch of Firestore/Storage metadata
3. **Canvas Pre-rendering** - `requestIdleCallback` to pre-render page 1 as ImageBitmap

**Why sequential:** Eliminates race conditions where metadata loads before PDF, creating invalid cache entries.

### Deferred Rendering
**Impact:** 15.7x faster (754ms → 48ms best-case)

Thumbnails (500-700ms) and metadata extraction (50-150ms) are deferred with `setTimeout()` to avoid blocking first page render.

---

## Lessons Learned & Pitfalls

### 🚫 Failed Approaches (Do NOT Pursue)

#### 1. WebGL/GPU Rendering Optimization
**Why:** PDF.js WebGL only accelerates pattern fills/soft masks, NOT text. Our docs are 99% text (200-321 elements/page).

**Test result:** 28.6% success rate, 48x performance variance (19ms-931ms) - unusable.

**Conclusion:** Keep `enableHWA: true` but don't invest further effort.

---

#### 2. JavaScript-based Virtualization (v-show/v-if)
**Why:** Creates reactive feedback loops → infinite page oscillation.

**Symptoms:**
- IntersectionObserver fires ~50x per scroll
- Pages oscillate: 1→2→1→2→1→2 (infinite loop)
- Scroll position resets to page 1

**Root cause:** Vue reactivity + DOM mutations → observer callbacks → more mutations → infinite loop

**Solution:** Use CSS `content-visibility: auto` instead (zero JavaScript).

---

### ✅ Critical Success Patterns

#### 1. Sequential Pre-loading (After First Page Renders)
```javascript
// ❌ WRONG - Race conditions
onMounted(() => {
  loadPDF();           // Async
  loadMetadata();      // Async, may complete before PDF
  extractPDFMetadata(); // Needs PDF - FAILS if parallel
});

// ✅ CORRECT - Sequential after first render
handleFirstPageRendered(async () => {
  await preloadPDF();           // Wait for completion
  await preloadMetadata();      // Wait for completion
  await extractPDFMetadata();   // Safe - PDF guaranteed loaded
});
```

**Why:** Users spend 1-3 seconds viewing pages. Use this time for background work without race conditions.

---

#### 2. Preserve Existing Cache Fields
```javascript
// ❌ WRONG - Overwrites entire entry, loses metadata
cache.set(id, { pdfDocument, timestamp });

// ✅ CORRECT - Preserves existing fields
const existing = cache.get(id);
cache.set(id, {
  pdfDocument,
  timestamp,
  metadata: existing?.metadata || null  // Preserve!
});
```

**Why:** PDF pre-load completing AFTER metadata pre-load would overwrite the entire cache entry.

---

#### 3. Cache Metadata AFTER PDF Loads
```javascript
// ❌ WRONG - Creates invalid entry with pdfDocument: null
async function loadEvidence() {
  cacheMetadata({ /* no pdfDocument yet */ });
  await loadPDF();
}

// ✅ CORRECT - Complete entry
async function loadEvidence() {
  const pdf = await loadPDF();
  cacheMetadata({ pdfDocument: pdf, /* other metadata */ });
}
```

**Why:** Invalid entries get evicted by cache invalidation checks, causing re-fetches.

---

### ⚠️ Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| **Premature caching** | Console: "Invalid cache entry found, evicting" | Cache metadata AFTER PDF loads |
| **Parallel pre-loading overwrites** | Metadata lost on navigation | Preserve existing cache fields |
| **`contain-intrinsic-size: auto`** | Scroll jank on first load (perfect on second) | Use fixed dimensions: `883.2px 1056px` |

---

### 📚 Key Research Findings

#### enableHWA ≠ enableWebGL
- `enableHWA`: Canvas2D hardware acceleration (browser-managed, unpredictable)
- `enableWebGL`: WebGL rendering (NOT available in PDF.js library mode)

**Source:** PDF.js GitHub Issues #5161, #8880, #18199

---

#### PDF.js Worker Threading
**What it does:** Offloads PDF parsing (non-blocking)
**What it doesn't do:** Offload canvas rendering (still blocks main thread)

**Implication:** 650-750ms render time is canvas drawing, not parsing.

---

#### ImageBitmap vs Canvas Element
- Canvas element: ~3MB per page (full DOM node + context)
- ImageBitmap: ~900KB per page (transferable pixel buffer)
- **Result:** 3.3x more memory efficient

---

### 🏗️ Architectural Decisions

#### Composable Architecture (70% Code Reduction)
**Before:** ViewDocument.vue = 1000 lines (monolithic)
**After:** ViewDocument.vue = 304 lines (orchestrator)

**Benefits:**
- Single Responsibility Principle
- Both bugs in Attempt #10 fixed in minutes (vs hours in monolithic)
- Unit testable in isolation
- Reusable across views

---

#### Module-Level Singleton Caches
**Why:** Cache must persist across component unmount/remount.

```javascript
// Module-level (outside composable function)
const canvasCache = shallowRef(new Map());

export function useCanvasPreloader() {
  return { /* methods operate on shared cache */ };
}
```

---

## Performance Metrics

| Scenario | Timing | Notes |
|----------|--------|-------|
| **First document load** | 650-750ms | Unavoidable (network + parse + render) |
| **Subsequent navigation (cache hit)** | 12.9-20.3ms | 0.7-1.2ms canvas swap + 10-16ms PDF load |
| **Subsequent navigation (cache miss)** | 550-730ms | Normal render path |
| **Overall speedup** | 36-58x faster | For cached documents |
| **Cache hit rate** | 80-100% | When canvases pre-rendered |

**Performance thresholds** (from code):
- Optimal cache hit: <20ms
- Good cache hit: <50ms
- Optimal cold start: <100ms
- Good cold start: <250ms

---

## Debugging Tips

### Check Performance Tracker Logs
```
⚡ 📦 PDF document loaded into memory: 8.5ms
⚡ 🎨 First page rendered on screen: 717.7ms
```
**Gap between logs = actual bottleneck location**

### Inspect Cache State
```javascript
canvasPreloader.getCacheStats()
// Returns: { size, hits, misses, hitRate, cachedPages }
```

### Monitor Cache Invalidation
```
"Invalid cache entry found, evicting"
```
Indicates cache corruption (premature caching or race conditions).

---

## Quick Reference: When to Apply Each Optimization

| Scenario | Apply | Avoid | Reasoning |
|----------|-------|-------|-----------|
| **Text-heavy PDFs** | Canvas pre-rendering | WebGL/GPU acceleration | WebGL doesn't accelerate text |
| **Large documents (50+ pages)** | CSS `content-visibility` | JS virtualization | Native CSS avoids reactive feedback loops |
| **Pre-loading adjacent docs** | Sequential after render | Parallel on mount | Eliminates race conditions |
| **Cache structure changes** | Preserve existing fields | Overwrite entire entry | Prevents data loss |
| **Background work** | `requestIdleCallback` | Immediate execution | Non-blocking |
| **Memory optimization** | LRU eviction (MAX_SIZE=3) | Unlimited cache | Balances hit rate vs memory |

---

## Related Documentation

**Detailed attempt history:**
- `planning/3. In progress/Attempts2OptimizePDFRendering.md` - Rendering optimization (4 attempts)
- `planning/7. Completed/Attempts2OptimizePDFCaching.md` - Caching optimization (10 attempts)

---

**Last Updated:** 2025-11-06
**Based on:** 14 optimization attempts across 2 phases (caching + rendering)
