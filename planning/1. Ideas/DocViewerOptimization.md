# PDF Document Viewer Performance Optimization

This document explains the multi-layered performance optimization strategy used in the Bookkeeper document viewer.

**Route:** `/matters/:matterId/documents/view/:fileHash`
**Main Component:** `src/features/organizer/views/ViewDocument.vue`

---

## 1. Component Hierarchy

The document viewer is composed of several specialized components working together:

```mermaid
graph TD
    A[ViewDocument.vue<br/>Main Container] --> B[PdfThumbnailPanel.vue<br/>Left Sidebar]
    A --> C[DocumentNavigationBar.vue<br/>Top Navigation]
    A --> D[PdfViewerArea.vue<br/>Main Viewer]
    A --> E[DocumentMetadataPanel.vue<br/>Right Sidebar]

    B --> F[PdfThumbnailList.vue<br/>Thumbnail Grid]
    F --> G[useThumbnailRenderer<br/>Blob URL Cache]

    D --> H[PdfPageCanvas.vue<br/>Individual Pages<br/>v-for loop]
    H --> I[useCanvasPreloader<br/>ImageBitmap Cache]

    classDef mainComponent fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef viewComponent fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef pageComponent fill:#ffe1f5,stroke:#333,stroke-width:2px
    classDef cacheComposable fill:#e1ffe1,stroke:#333,stroke-width:2px

    class A mainComponent
    class B,C,D,E,F viewComponent
    class H pageComponent
    class G,I cacheComposable
```

**Key Files:**
- `src/features/organizer/views/ViewDocument.vue` - Main container
- `src/components/document/PdfViewerArea.vue` - Implements CSS virtualization
- `src/features/organizer/components/PdfPageCanvas.vue` - Individual page rendering
- `src/features/organizer/composables/useCanvasPreloader.js` - Pre-render cache
- `src/features/organizer/composables/useThumbnailRenderer.js` - Thumbnail cache

---

## 2. Three-Level Caching System

The viewer implements a sophisticated 3-level caching strategy:

```mermaid
graph LR
    subgraph "Level 1: PDF Document Cache"
        A1[usePdfCache.js<br/>Module-level Singleton]
        A2[LRU Cache: MAX_SIZE=3<br/>Previous, Current, Next]
        A3[Stores: PDFDocumentProxy<br/>+ Metadata]
        A1 --> A2 --> A3
    end

    subgraph "Level 2: Canvas Pre-render Cache"
        B1[useCanvasPreloader.js<br/>Module-level Singleton]
        B2[LRU Cache: MAX_SIZE=3<br/>Previous, Current, Next]
        B3[Stores: ImageBitmap<br/>Page 1 only]
        B1 --> B2 --> B3
    end

    subgraph "Level 3: Thumbnail Cache"
        C1[useThumbnailRenderer.js<br/>Component-level]
        C2[Map: fileHash to Blob URLs]
        C3[All pages<br/>Low resolution]
        C1 --> C2 --> C3
    end

    classDef composable fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef cacheStore fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef dataStore fill:#e1ffe1,stroke:#333,stroke-width:2px

    class A1,B1,C1 composable
    class A2,B2,C2 cacheStore
    class A3,B3,C3 dataStore
```

**Cache Benefits:**

| Cache | Purpose | Hit Performance | Memory Efficiency |
|-------|---------|----------------|-------------------|
| PDF Document | Instant PDF access | 0ms (no network) | Stores 3 full PDFs |
| Canvas Pre-render | Skip page 1 render | 5-15ms (vs 650-750ms) | ImageBitmap (optimal) |
| Thumbnail | Sidebar thumbnails | Instant display | Blob URLs (2x better than data URLs) |

**Key Files:**
- `src/features/organizer/composables/usePdfCache.js` - PDF document cache
- `src/features/organizer/composables/useCanvasPreloader.js` - Canvas cache
- `src/features/organizer/composables/useThumbnailRenderer.js` - Thumbnail cache

---

## 3. Complete Data Flow

This sequence diagram shows the entire flow from navigation to display:

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant ViewDocument
    participant PdfCache
    participant Storage
    participant PdfPageCanvas
    participant CanvasCache
    participant PreloadPipeline

    User->>Router: Navigate to /documents/view/:hash
    Router->>ViewDocument: Mount component

    ViewDocument->>PdfCache: Load document
    alt Cache Hit
        PdfCache-->>ViewDocument: Return cached PDF (0ms)
    else Cache Miss
        PdfCache->>Storage: Fetch PDF from Firebase
        Storage-->>PdfCache: PDF binary data
        PdfCache->>PdfCache: Load via PDF.js worker
        PdfCache-->>ViewDocument: Return loaded PDF
    end

    ViewDocument->>PdfPageCanvas: Render page 1
    PdfPageCanvas->>CanvasCache: Check for pre-rendered canvas

    alt Pre-rendered Available
        CanvasCache-->>PdfPageCanvas: Return ImageBitmap (5-15ms)
        PdfPageCanvas->>PdfPageCanvas: Display immediately
    else Not Pre-rendered
        PdfPageCanvas->>PdfPageCanvas: Render via PDF.js (650-750ms)
    end

    PdfPageCanvas-->>ViewDocument: Emit page-rendered event

    Note over ViewDocument,PreloadPipeline: First page rendered - start background work

    ViewDocument->>PreloadPipeline: Start 3-phase pipeline

    rect rgb(225, 245, 255)
        Note over PreloadPipeline: Phase 1: PDF Loading
        PreloadPipeline->>PdfCache: Pre-load previous document
        PreloadPipeline->>PdfCache: Pre-load next document
    end

    rect rgb(255, 244, 225)
        Note over PreloadPipeline: Phase 2: Metadata Loading
        PreloadPipeline->>Storage: Fetch Firestore + Storage metadata
        Note over PreloadPipeline: Parallel for previous & next
    end

    rect rgb(225, 255, 225)
        Note over PreloadPipeline: Phase 3: Canvas Pre-rendering
        PreloadPipeline->>CanvasCache: requestIdleCallback
        CanvasCache->>CanvasCache: Pre-render page 1 of adjacent docs
        CanvasCache->>CanvasCache: Store as ImageBitmap
    end

    Note over User,PreloadPipeline: User navigation now near-instant!
```

**Performance Impact:**
- **Cold start:** 650-750ms for first page
- **Subsequent navigation:** 5-15ms (pre-rendered) + 0ms (cached PDF) = **~43-150x faster**

---

## 4. CSS Virtualization Strategy

The **primary** optimization is browser-native lazy rendering using modern CSS:

```mermaid
graph TB
    subgraph "Browser Viewport"
        V1[Visible Area]
        V2[200px above viewport<br/>IntersectionObserver rootMargin]
        V3[200px below viewport<br/>IntersectionObserver rootMargin]
    end

    subgraph "PDF Pages with CSS Magic"
        P1[Page 1<br/>content-visibility: auto<br/>RENDERED]
        P2[Page 2<br/>content-visibility: auto<br/>RENDERED]
        P3[Page 3<br/>content-visibility: auto<br/>PRE-RENDERED]
        P4[Page 4<br/>content-visibility: auto<br/>PLACEHOLDER<br/>contain-intrinsic-size: 883px x 1056px]
        P5[Page 5<br/>content-visibility: auto<br/>PLACEHOLDER]
        P6[Page 10<br/>content-visibility: auto<br/>PLACEHOLDER]
    end

    V2 --> P1
    V1 --> P2
    V3 --> P3

    classDef viewport fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef rendered fill:#e1ffe1,stroke:#333,stroke-width:2px
    classDef preRendered fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef placeholder fill:#ffe1e1,stroke:#333,stroke-width:2px

    class V1,V2,V3 viewport
    class P1,P2 rendered
    class P3 preRendered
    class P4,P5,P6 placeholder
```

**Implementation** (`PdfViewerArea.vue` lines 151-153):

```css
.pdf-page {
  /* Modern CSS lazy rendering - 40% performance boost, zero dependencies */
  content-visibility: auto;
  contain-intrinsic-size: 883.2px 1056px; /* 9.2in x 11in at 96 DPI */
}
```

**How It Works:**
1. Browser **skips rendering** pages outside viewport entirely
2. Off-screen pages get **placeholder size** (883.2px x 1056px)
3. IntersectionObserver with **200px rootMargin** triggers loading slightly before visible
4. **Zero JavaScript** virtualization libraries needed
5. **40% performance boost** according to code comments

**Benefits:**
- Zero dependencies
- Automatic browser optimization
- Minimal memory footprint
- Smooth scrolling
- Works with native scrolling

---

## 5. Background Pre-loading Pipeline

After the first page renders, a sophisticated 3-phase pipeline runs in the background:

```mermaid
stateDiagram-v2
    [*] --> FirstPageRendered: User navigates to document

    FirstPageRendered --> Phase1_PDFLoading: Start pipeline

    state "Phase 1: PDF Document Loading" as Phase1_PDFLoading {
        [*] --> LoadPrevPDF: Sequential execution
        LoadPrevPDF --> LoadNextPDF: Wait for completion
        LoadNextPDF --> [*]

        note right of LoadPrevPDF
            Store in usePdfCache
            MAX_SIZE=3 with LRU eviction
            Skip if non-PDF
        end note
    }

    Phase1_PDFLoading --> Phase2_MetadataLoading: PDFs loaded

    state "Phase 2: Metadata Pre-fetch" as Phase2_MetadataLoading {
        [*] --> ParallelFetch

        state "Parallel Fetching" as ParallelFetch {
            state "Previous Doc" as PrevMeta {
                [*] --> FirestorePrev
                [*] --> SourceMetaPrev
                [*] --> StorageMetaPrev
            }

            state "Next Doc" as NextMeta {
                [*] --> FirestoreNext
                [*] --> SourceMetaNext
                [*] --> StorageMetaNext
            }
        }

        ParallelFetch --> [*]
    }

    Phase2_MetadataLoading --> Phase3_CanvasPrerender: Metadata loaded

    state "Phase 3: Canvas Pre-rendering" as Phase3_CanvasPrerender {
        [*] --> RequestIdleCallback: Use browser idle time
        RequestIdleCallback --> RenderPrevCanvas
        RenderPrevCanvas --> RenderNextCanvas
        RenderNextCanvas --> StoreImageBitmap
        StoreImageBitmap --> [*]

        note left of RequestIdleCallback
            Non-blocking execution
            Stores ImageBitmap in cache
            Page 1 only - most critical
        end note
    }

    Phase3_CanvasPrerender --> Ready: Pre-loading complete
    Ready --> [*]: Navigation now instant!
```

**Critical Timing:**
- Pipeline starts **AFTER** first page renders to prioritize user-visible content
- Each phase waits for previous phase to complete (sequential)
- Phase 2 internally uses parallel fetching for efficiency
- Phase 3 uses `requestIdleCallback` to avoid blocking user interaction

**Key File:** `src/features/organizer/composables/useDocumentPreloader.js`

---

## 6. Render Lifecycle Decision Tree

How each PDF page decides whether to use pre-rendered cache or render fresh:

```mermaid
flowchart TD
    Start([PdfPageCanvas.vue mounted]) --> CheckCache{Check Canvas<br/>Preloader Cache}

    CheckCache -->|Cache Hit| SwapCanvas[Swap Pre-rendered<br/>ImageBitmap to Canvas<br/>approx 5-15ms]
    CheckCache -->|Cache Miss| CheckPrevRender{Previous Render<br/>Task Running?}

    SwapCanvas --> EmitRendered[Emit page-rendered<br/>event immediately]
    EmitRendered --> Done([Done - Ultra Fast!])

    CheckPrevRender -->|Yes| CancelPrev[Cancel Previous<br/>Render Task]
    CheckPrevRender -->|No| StartRender
    CancelPrev --> StartRender[Start Fresh Render]

    StartRender --> GetPage[Get Page from<br/>PDF Document]
    GetPage --> CalcViewport[Calculate Viewport<br/>Scale & Dimensions]
    CalcViewport --> RenderToCanvas[Render via PDF.js<br/>approx 650-750ms]
    RenderToCanvas --> EmitRenderedSlow[Emit page-rendered<br/>event]
    EmitRenderedSlow --> DoneSlow([Done - Normal Speed])

    classDef fastPath fill:#e1ffe1,stroke:#333,stroke-width:2px
    classDef slowPath fill:#ffe1e1,stroke:#333,stroke-width:2px
    classDef decision fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef terminal fill:#e1f5ff,stroke:#333,stroke-width:2px

    class SwapCanvas,EmitRendered fastPath
    class RenderToCanvas,EmitRenderedSlow slowPath
    class CheckCache,CheckPrevRender decision
    class Start,Done,DoneSlow terminal
```

**Key Optimizations:**
1. **Cache check first** - fastest path if pre-rendered
2. **Render cancellation** - prevents "cannot use same canvas" errors
3. **Mount state tracking** - prevents race conditions on unmount
4. **Immediate event emission** - UI updates instantly on cache hit

**Performance Difference:**
- **Pre-rendered (cache hit):** 5-15ms (fast)
- **Fresh render (cache miss):** 650-750ms (slow)
- **Speedup:** ~43-150x faster

**Key File:** `src/features/organizer/components/PdfPageCanvas.vue`

---

## 7. Performance Metrics Comparison

Visual comparison of different rendering scenarios:

```mermaid
gantt
    title PDF Page Rendering Performance Comparison
    dateFormat X
    axisFormat %Lms

    section Cache Hit (Optimal)
    Pre-rendered ImageBitmap Swap :active, 0, 15
    Display Complete :milestone, 15, 0

    section Cache Hit (Good)
    Pre-rendered ImageBitmap Swap :active, 0, 50
    Display Complete :milestone, 50, 0

    section Cold Start (Optimal)
    Fresh PDF.js Render :crit, 0, 100
    Display Complete :milestone, 100, 0

    section Cold Start (Good)
    Fresh PDF.js Render :crit, 0, 250
    Display Complete :milestone, 250, 0

    section Typical Fresh Render
    Fresh PDF.js Render :crit, 0, 700
    Display Complete :milestone, 700, 0
```

**Performance Thresholds** (from code):

| Scenario | Optimal | Good | Typical |
|----------|---------|------|---------|
| **First Render (Cache Hit)** | <20ms | <50ms | - |
| **First Render (Cold Start)** | <100ms | <250ms | 650-750ms |
| **Canvas Swap** | 5-15ms | - | - |

**Real-World Impact:**
- **Initial load:** User waits 650-750ms for first document
- **Navigation to adjacent docs:** User waits only 5-15ms (pre-rendered + cached)
- **Navigation to any cached doc:** User waits 0ms (no network) + 5-15ms (pre-rendered)
- **Overall speedup:** ~43-150x faster for subsequent navigation

---

## 8. Memory Management Strategy

All caches implement proper cleanup to prevent memory leaks:

```mermaid
graph TD
    subgraph "PDF Document Cache Cleanup"
        A1[LRU Eviction Triggered] --> A2[Get Oldest Document]
        A2 --> A3[loadingTask.destroy]
        A3 --> A4[Remove from Cache Map]
    end

    subgraph "Canvas Preloader Cleanup"
        B1[LRU Eviction Triggered] --> B2[Get Oldest ImageBitmap]
        B2 --> B3[bitmap.close]
        B3 --> B4[Release GPU Memory]
        B4 --> B5[Remove from Cache Map]
    end

    subgraph "Thumbnail Cache Cleanup"
        C1[Component Unmount] --> C2[Iterate All Blob URLs]
        C2 --> C3[URL.revokeObjectURL]
        C3 --> C4[Release Memory]
        C4 --> C5[Clear Cache Map]
    end

    classDef destructiveAction fill:#ffe1e1,stroke:#333,stroke-width:2px
    classDef completeAction fill:#e1ffe1,stroke:#333,stroke-width:2px
    classDef processStep fill:#fff4e1,stroke:#333,stroke-width:2px

    class A3,B3,C3 destructiveAction
    class A4,B5,C5 completeAction
    class A1,A2,B1,B2,B4,C1,C2,C4 processStep
```

**Key Principles:**
1. **LRU Eviction:** Both PDF and canvas caches use Least Recently Used eviction with MAX_SIZE=3
2. **Proper Disposal:** Each cache type has specific cleanup methods
   - PDF.js: `loadingTask.destroy()` to release workers
   - ImageBitmap: `bitmap.close()` to free GPU memory
   - Blob URLs: `URL.revokeObjectURL()` to prevent memory leaks
3. **Component Lifecycle:** Thumbnail cache cleans up on component unmount
4. **Memory Efficiency:** ImageBitmap and Blob URLs are more efficient than alternatives

---

## 9. PDF.js Configuration

The viewer uses Mozilla's PDF.js library with performance-optimized settings:

**Key Configuration** (`src/config/pdfWorker.js`):

```javascript
{
  // Worker thread for non-blocking PDF processing
  workerSrc: '/pdf.worker.min.mjs',

  // GPU acceleration for faster rendering
  enableHWA: true,

  // Progressive loading for faster perceived performance
  disableStream: false,

  // WASM decoders for JPEG2000/JPX images
  standardFontDataUrl: '/standard_fonts/',

  // Image decoders
  imageResourcesPath: '/image_decoders/'
}
```

**Benefits:**
- **Web Worker:** PDF parsing doesn't block main thread
- **Hardware Acceleration:** Uses GPU for rendering (when available)
- **Streaming:** Start displaying pages before full PDF loads
- **WASM Decoders:** Faster image decoding than JavaScript

---

## 10. Viewport Tracking

IntersectionObserver tracks which pages are visible for navigation UI updates:

**Configuration** (`usePageVisibility.js`):
```javascript
{
  root: null,                    // Viewport as root
  rootMargin: '200px',           // Load 200px before visible
  threshold: [0, 0.1, 0.5, 1.0]  // Track visibility levels
}
```

**Benefits:**
- **Single Observer:** Shared across all pages (efficient)
- **Pre-loading:** 200px margin starts loading before user sees page
- **Visibility Tracking:** Knows which page is "most visible" for UI
- **Efficient:** Modern browser API, much faster than scroll listeners

---

## Summary: Key Optimizations

| Optimization | Technology | Performance Impact | Code Location |
|--------------|------------|-------------------|---------------|
| **CSS Virtualization** | `content-visibility: auto` | 40% boost | `PdfViewerArea.vue:151-153` |
| **PDF Document Cache** | Module-level LRU cache | 0ms network time | `usePdfCache.js` |
| **Canvas Pre-render** | ImageBitmap cache | 43-150x faster | `useCanvasPreloader.js` |
| **Thumbnail Cache** | Blob URLs | 2x memory efficiency | `useThumbnailRenderer.js` |
| **Background Pipeline** | 3-phase pre-loading | Instant navigation | `useDocumentPreloader.js` |
| **Viewport Tracking** | IntersectionObserver | Efficient visibility | `usePageVisibility.js` |
| **Worker Threading** | PDF.js Web Worker | Non-blocking parsing | `pdfWorker.js` |
| **GPU Acceleration** | PDF.js HWA | Faster rendering | `pdfWorker.js` |

**Overall Result:**
- First document load: 650-750ms (unavoidable - need to fetch & parse PDF)
- Subsequent navigation: 5-15ms (43-150x faster)
- Large PDFs: Only visible pages rendered (40% performance boost)
- Memory efficient: 3-document sliding window + proper cleanup

This multi-layered optimization strategy combines modern web APIs, intelligent caching, and background pre-loading to deliver near-instant document navigation after the initial load.
