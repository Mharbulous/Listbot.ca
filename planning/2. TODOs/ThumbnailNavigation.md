# PDF Thumbnail Navigation Implementation Plan

## Executive Summary

**Objective**: Implement a thumbnail navigation panel that displays miniature previews of all PDF pages, allowing users to quickly navigate to any page by clicking on a thumbnail.

**Current State**: The thumbnail panel (NewViewDocument2.vue:19-44) displays a "Thumbnails Coming Soon" placeholder.

**Target State**: A functional thumbnail panel that:
- Displays small preview thumbnails of all PDF pages (150px width max)
- Highlights the currently visible page
- Allows click-to-jump navigation to any page
- Auto-scrolls to keep current page thumbnail visible
- Collapses/expands to save screen space

**Dependencies**: Requires PDF viewer implementation (ImplementPDFViewing.md) to be completed first.

**Timeline**: 8-12 hours implementation after PDF viewer is complete (reduced from 14-18 hours through optimizations)

**Risk Level**: Low - isolated component, leverages existing pdf.js infrastructure

**Performance Approach**: Uses CSS `content-visibility` for virtualization and Blob URLs for 2x memory efficiency

---

## Technical Context

### Existing Infrastructure

**Thumbnail Panel Layout** (NewViewDocument2.vue:19-44):
```vue
<div class="thumbnail-panel" :class="{ 'thumbnail-panel--collapsed': !thumbnailsVisible }">
  <v-card variant="outlined" class="thumbnail-card">
    <!-- Toggle button -->
    <v-btn
      icon
      variant="text"
      size="small"
      :title="thumbnailsVisible ? 'Collapse thumbnails' : 'Expand thumbnails'"
      class="thumbnail-toggle-btn"
      @click="toggleThumbnailsVisibility"
    >
      <v-icon>{{ thumbnailsVisible ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
    </v-btn>

    <!-- Expanded content -->
    <div v-if="thumbnailsVisible" class="thumbnail-content">
      <h3 class="thumbnail-title">Thumbnails</h3>
      <div class="thumbnail-placeholder-content">
        <v-icon size="48" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
        <p class="mt-2 text-caption text-grey">Thumbnails Coming Soon</p>
      </div>
    </div>
  </v-card>
</div>
```

**Panel Styling** (NewViewDocument2.vue:781-843):
- Width: 200px (expanded) / 40px (collapsed)
- Height: 100% of viewport
- Collapsible with smooth transition
- Toggle button positioned at top-right

**PDF Infrastructure**:
- pdf.js v5.4.296 configured and working
- `usePdfViewer.js` composable (from ImplementPDFViewing.md)
- `PdfPageCanvas.vue` component for rendering

---

## Design Specifications

### Thumbnail Dimensions

**Size Constraints**:
- **Max Width**: 150px (fits comfortably in 200px panel with padding)
- **Aspect Ratio**: Matches source page (typically 8.5:11 for US Letter)
- **Target Height**: ~194px (for US Letter at 150px width)

**Spacing**:
- **Gap Between Thumbnails**: 8px vertical spacing
- **Padding**: 8px around each thumbnail
- **Panel Padding**: 12px left/right, 8px top/bottom

**Visual Indicators**:
- **Current Page**: 3px blue border + subtle shadow
- **Hover State**: Light gray background
- **Page Number Badge**: Small overlay showing page number

### Visual Hierarchy

```
┌─────────────────────┐
│ [<] Thumbnails      │ ← Header with collapse button
├─────────────────────┤
│  ┌───────────┐      │
│  │ Page 1    │      │ ← Thumbnail with page number
│  │  [mini]   │      │
│  │  [preview]│      │
│  └───────────┘      │
│  ┌───────────┐      │
│  │ Page 2    │ ◄────  Current page (highlighted)
│  │  [mini]   │      │
│  │  [preview]│      │
│  └───────────┘      │
│  ┌───────────┐      │
│  │ Page 3    │      │
│  │  [mini]   │      │
│  │  [preview]│      │
│  └───────────┘      │
│       ...           │
└─────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create Thumbnail Rendering Composable (2-3 hours)

#### Step 1.1: Create `useThumbnailRenderer.js` Composable

**File**: `src/features/organizer/composables/useThumbnailRenderer.js`

**Purpose**: Manages thumbnail generation and caching for PDF pages.

**Key Features**:
1. Generate thumbnail images at low resolution (for performance)
2. Cache rendered thumbnails to avoid re-rendering
3. Batch rendering to avoid blocking UI
4. Memory-efficient cleanup

**API Design**:

```javascript
/**
 * Composable for rendering PDF page thumbnails
 *
 * Generates small preview images of PDF pages optimized for navigation.
 * Uses lower resolution than main viewer for better performance.
 *
 * @returns {Object} Thumbnail rendering state and methods
 */
export function useThumbnailRenderer() {
  // State
  const thumbnailCache = ref(new Map()) // Map<pageNumber, blobURL>
  const renderingQueue = ref([])
  const isRendering = ref(false)

  /**
   * Render a single page thumbnail
   * @param {Object} pdfDocument - PDF.js document object
   * @param {Number} pageNumber - Page to render (1-indexed)
   * @param {Number} maxWidth - Maximum thumbnail width in pixels (default: 150)
   * @returns {Promise<String>} Blob URL of rendered thumbnail
   */
  const renderThumbnail = async (pdfDocument, pageNumber, maxWidth = 150) => {
    // Check cache first
    const cacheKey = `${pageNumber}-${maxWidth}`
    if (thumbnailCache.value.has(cacheKey)) {
      return thumbnailCache.value.get(cacheKey)
    }

    // Get page
    const page = await pdfDocument.getPage(pageNumber)

    // Calculate scale for thumbnail (lower resolution than main view)
    const viewport = page.getViewport({ scale: 1.0 })
    const scale = maxWidth / viewport.width
    const scaledViewport = page.getViewport({ scale })

    // Create temporary canvas
    const canvas = document.createElement('canvas')
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    // Render to canvas
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: scaledViewport
    }

    await page.render(renderContext).promise

    // Convert to Blob URL (2x more memory efficient than data URLs)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const blobURL = URL.createObjectURL(blob)
    thumbnailCache.value.set(cacheKey, blobURL)

    return blobURL
  }

  /**
   * Batch render all thumbnails for a PDF document
   * Renders in batches to avoid blocking the UI
   *
   * @param {Object} pdfDocument - PDF.js document object
   * @param {Number} totalPages - Total number of pages
   * @param {Number} batchSize - Pages to render per batch (default: 5)
   */
  const renderAllThumbnails = async (pdfDocument, totalPages, batchSize = 5) => {
    isRendering.value = true

    try {
      for (let i = 1; i <= totalPages; i += batchSize) {
        const batch = []
        const end = Math.min(i + batchSize - 1, totalPages)

        for (let pageNum = i; pageNum <= end; pageNum++) {
          batch.push(renderThumbnail(pdfDocument, pageNum))
        }

        // Render batch
        await Promise.all(batch)

        // Small delay to let UI breathe
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    } finally {
      isRendering.value = false
    }
  }

  /**
   * Clear thumbnail cache
   * Call when switching documents or component unmounts
   * CRITICAL: Revokes Blob URLs to prevent memory leaks
   */
  const clearCache = () => {
    // Revoke all Blob URLs before clearing cache
    thumbnailCache.value.forEach((blobURL) => {
      URL.revokeObjectURL(blobURL)
    })

    thumbnailCache.value.clear()
  }

  return {
    thumbnailCache,
    isRendering,
    renderThumbnail,
    renderAllThumbnails,
    clearCache
  }
}
```

**Performance Optimizations**:
1. **Lower Resolution**: Thumbnails rendered at ~150px width (vs 883px for main view)
2. **Caching**: Once rendered, thumbnails stored in memory
3. **Batch Rendering**: Process 5 pages at a time to avoid UI blocking
4. **Lazy Initial Load**: Render visible thumbnails first, others later
5. **Blob URLs**: Use Blob URLs (2x more memory efficient than data URLs, 37% smaller)

---

### Phase 2: Create Thumbnail List Component (2-3 hours)

#### Step 2.1: Create `PdfThumbnailList.vue` Component

**File**: `src/features/organizer/components/PdfThumbnailList.vue`

**Purpose**: Display scrollable list of page thumbnails with navigation.

**Props**:
```javascript
{
  pdfDocument: Object,      // PDF.js document object
  totalPages: Number,       // Total number of pages
  currentPage: Number,      // Currently visible page (1-indexed)
  maxThumbnailWidth: {      // Max thumbnail width in pixels
    type: Number,
    default: 150
  }
}
```

**Events**:
```javascript
{
  'page-selected': Number   // Emitted when user clicks a thumbnail
}
```

**Template**:

```vue
<template>
  <div class="thumbnail-list-container">
    <!-- Loading state -->
    <div v-if="isRendering && thumbnails.size === 0" class="thumbnail-loading">
      <v-progress-circular indeterminate size="32" color="primary" />
      <p class="mt-2 text-caption">Generating thumbnails...</p>
    </div>

    <!-- Thumbnail grid -->
    <div v-else class="thumbnail-grid" ref="thumbnailGridRef">
      <div
        v-for="pageNum in totalPages"
        :key="`thumb-${pageNum}`"
        class="thumbnail-item"
        :class="{
          'thumbnail-item--current': pageNum === currentPage,
          'thumbnail-item--loading': !thumbnails.has(`${pageNum}-${maxThumbnailWidth}`)
        }"
        :ref="el => setThumbnailRef(pageNum, el)"
        @click="selectPage(pageNum)"
      >
        <!-- Page number badge -->
        <div class="thumbnail-page-number">{{ pageNum }}</div>

        <!-- Thumbnail image -->
        <img
          v-if="thumbnails.has(`${pageNum}-${maxThumbnailWidth}`)"
          :src="thumbnails.get(`${pageNum}-${maxThumbnailWidth}`)"
          :alt="`Page ${pageNum}`"
          class="thumbnail-image"
        />

        <!-- Loading placeholder -->
        <div v-else class="thumbnail-placeholder">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>
      </div>
    </div>

    <!-- Rendering progress indicator -->
    <div v-if="isRendering && thumbnails.size > 0" class="thumbnail-progress">
      <v-progress-linear
        :model-value="renderProgress"
        color="primary"
        height="2"
      />
      <p class="text-caption mt-1">{{ thumbnails.size }} / {{ totalPages }}</p>
    </div>
  </div>
</template>
```

**Script Setup**:

```vue
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useThumbnailRenderer } from '../composables/useThumbnailRenderer'

const props = defineProps({
  pdfDocument: Object,
  totalPages: Number,
  currentPage: Number,
  maxThumbnailWidth: {
    type: Number,
    default: 150
  }
})

const emit = defineEmits(['page-selected'])

// Thumbnail rendering composable
const {
  thumbnailCache: thumbnails,
  isRendering,
  renderAllThumbnails,
  clearCache
} = useThumbnailRenderer()

// Refs for thumbnail elements (for auto-scroll)
const thumbnailGridRef = ref(null)
const thumbnailRefs = ref(new Map())

const setThumbnailRef = (pageNum, el) => {
  if (el) {
    thumbnailRefs.value.set(pageNum, el)
  }
}

// Calculate rendering progress
const renderProgress = computed(() => {
  if (props.totalPages === 0) return 0
  return (thumbnails.value.size / props.totalPages) * 100
})

// Handle page selection
const selectPage = (pageNum) => {
  emit('page-selected', pageNum)
}

// Auto-scroll to current page thumbnail
const scrollToCurrentPage = async () => {
  await nextTick()

  const currentThumbnail = thumbnailRefs.value.get(props.currentPage)
  if (currentThumbnail && thumbnailGridRef.value) {
    currentThumbnail.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    })
  }
}

// Watch current page and auto-scroll
watch(() => props.currentPage, () => {
  scrollToCurrentPage()
})

// Watch PDF document changes
watch(() => props.pdfDocument, async (newDoc, oldDoc) => {
  if (newDoc && newDoc !== oldDoc) {
    // Clear old thumbnails
    clearCache()

    // Start rendering new thumbnails
    if (props.totalPages > 0) {
      await renderAllThumbnails(newDoc, props.totalPages)
    }
  }
}, { immediate: true })

// Cleanup
onBeforeUnmount(() => {
  clearCache()
})
</script>
```

**Styling**:

```vue
<style scoped>
.thumbnail-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.thumbnail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.thumbnail-grid {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.thumbnail-item {
  position: relative;
  width: 100%;
  background-color: white;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  overflow: hidden;

  /* CSS-based virtualization - browser automatically skips rendering off-screen thumbnails */
  content-visibility: auto;
  contain-intrinsic-size: 150px 194px; /* US Letter aspect ratio */
}

.thumbnail-item:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.thumbnail-item--current {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.thumbnail-item--loading {
  opacity: 0.6;
}

.thumbnail-page-number {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 10;
}

.thumbnail-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 8.5 / 11; /* US Letter aspect ratio */
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
}

.thumbnail-progress {
  padding: 8px 12px;
  background-color: #fafafa;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}
</style>
```

---

### Phase 3: Integrate Thumbnail List into NewViewDocument2.vue (1-2 hours)

#### Step 3.1: Import PdfThumbnailList Component

**Location**: NewViewDocument2.vue:351-366

Add import:
```javascript
import PdfThumbnailList from '@/features/organizer/components/PdfThumbnailList.vue'
```

#### Step 3.2: Track Current Visible Page

Add state for tracking which page is currently visible in the main viewer:

```javascript
// Current visible page (for thumbnail highlighting)
const currentVisiblePage = ref(1)
```

#### Step 3.3: Replace Thumbnail Placeholder

**Location**: NewViewDocument2.vue:36-42

**Current Code**:
```vue
<!-- Expanded content -->
<div v-if="thumbnailsVisible" class="thumbnail-content">
  <h3 class="thumbnail-title">Thumbnails</h3>
  <div class="thumbnail-placeholder-content">
    <v-icon size="48" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
    <p class="mt-2 text-caption text-grey">Thumbnails Coming Soon</p>
  </div>
</div>
```

**New Code**:
```vue
<!-- Expanded content -->
<div v-if="thumbnailsVisible" class="thumbnail-content">
  <h3 class="thumbnail-title">Pages</h3>

  <!-- PDF Thumbnails -->
  <PdfThumbnailList
    v-if="isPdfFile && pdfDocument"
    :pdf-document="pdfDocument"
    :total-pages="totalPages"
    :current-page="currentVisiblePage"
    :max-thumbnail-width="150"
    @page-selected="handlePageSelected"
  />

  <!-- No PDF loaded -->
  <div v-else class="thumbnail-placeholder-content">
    <v-icon size="48" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
    <p class="mt-2 text-caption text-grey">
      {{ isPdfFile ? 'Loading thumbnails...' : 'No PDF loaded' }}
    </p>
  </div>
</div>
```

#### Step 3.4: Implement Page Selection Handler

Add method to handle thumbnail clicks (scroll to selected page):

```javascript
/**
 * Handle thumbnail page selection
 * Scrolls the main viewer to the selected page
 */
const handlePageSelected = (pageNumber) => {
  // Find the canvas for the selected page
  const pageElement = document.querySelector(`.pdf-page:nth-child(${pageNumber})`)

  if (pageElement) {
    pageElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  // Update current visible page
  currentVisiblePage.value = pageNumber
}
```

#### Step 3.5: Track Visible Page with IntersectionObserver

Add IntersectionObserver to track which page is currently visible:

```javascript
// Track visible pages using IntersectionObserver
let pageObserver = null

const setupPageObserver = () => {
  // Clean up existing observer
  if (pageObserver) {
    pageObserver.disconnect()
  }

  // Create new observer
  pageObserver = new IntersectionObserver(
    (entries) => {
      // Find the most visible page
      let mostVisibleEntry = null
      let maxRatio = 0

      entries.forEach(entry => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          mostVisibleEntry = entry
        }
      })

      if (mostVisibleEntry && mostVisibleEntry.isIntersecting) {
        // Extract page number from element
        const pageElements = Array.from(
          document.querySelectorAll('.pdf-page')
        )
        const pageIndex = pageElements.indexOf(mostVisibleEntry.target)
        if (pageIndex >= 0) {
          currentVisiblePage.value = pageIndex + 1
        }
      }
    },
    {
      root: null,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    }
  )

  // Observe all PDF page elements
  const pageElements = document.querySelectorAll('.pdf-page')
  pageElements.forEach(element => {
    pageObserver.observe(element)
  })
}

// Call after PDF loads and pages render
watch(() => totalPages.value, (newTotal) => {
  if (newTotal > 0) {
    nextTick(() => {
      setupPageObserver()
    })
  }
})

// Cleanup observer
onBeforeUnmount(() => {
  if (pageObserver) {
    pageObserver.disconnect()
  }
})
```

---

### Phase 4: Enhanced User Experience (2 hours)

#### Step 4.1: Add Keyboard Navigation

Add keyboard shortcuts for page navigation:

```javascript
// Keyboard navigation
const handleKeydown = (event) => {
  if (!isPdfFile.value || !totalPages.value) return

  switch (event.key) {
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault()
      if (currentVisiblePage.value > 1) {
        handlePageSelected(currentVisiblePage.value - 1)
      }
      break

    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault()
      if (currentVisiblePage.value < totalPages.value) {
        handlePageSelected(currentVisiblePage.value + 1)
      }
      break

    case 'Home':
      event.preventDefault()
      handlePageSelected(1)
      break

    case 'End':
      event.preventDefault()
      handlePageSelected(totalPages.value)
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
```

#### Step 4.2: Add Page Jump Input

Add a page number input field for quick navigation:

**Add to document navigation panel** (NewViewDocument2.vue:48-100):

```vue
<div class="document-nav-panel">
  <v-card class="document-nav-card">
    <!-- Left controls -->
    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentDocumentIndex === 1"
      title="First document"
      @click="goToFirstDocument"
    >
      <v-icon>mdi-page-first</v-icon>
    </v-btn>
    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentDocumentIndex === 1"
      title="Previous document"
      @click="goToPreviousDocument"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>

    <!-- Center document indicator -->
    <span class="document-indicator">
      Document {{ currentDocumentIndex }} of {{ totalDocuments }}
    </span>

    <!-- Page jump input (for PDFs) -->
    <div v-if="isPdfFile && totalPages > 1" class="page-jump-control">
      <input
        v-model.number="pageJumpInput"
        type="number"
        :min="1"
        :max="totalPages"
        class="page-jump-input"
        placeholder="Page"
        @keypress.enter="jumpToPage"
      />
      <span class="page-jump-label">/ {{ totalPages }}</span>
      <v-btn
        icon
        variant="text"
        size="small"
        title="Go to page"
        @click="jumpToPage"
      >
        <v-icon>mdi-arrow-right-circle</v-icon>
      </v-btn>
    </div>

    <!-- Right controls -->
    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentDocumentIndex === totalDocuments"
      title="Next document"
      @click="goToNextDocument"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentDocumentIndex === totalDocuments"
      title="Last document"
      @click="goToLastDocument"
    >
      <v-icon>mdi-page-last</v-icon>
    </v-btn>
  </v-card>
</div>
```

Add jump functionality:

```javascript
const pageJumpInput = ref(null)

const jumpToPage = () => {
  const pageNum = pageJumpInput.value
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    handlePageSelected(pageNum)
    pageJumpInput.value = null // Clear input
  }
}
```

Add styling:

```css
.page-jump-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.page-jump-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  text-align: center;
}

.page-jump-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.15);
}

/* Remove number input spinners */
.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type=number] {
  -moz-appearance: textfield;
}

.page-jump-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}
```

#### Step 4.3: Add Thumbnail Context Menu (Optional)

Add right-click context menu on thumbnails for advanced actions:

```vue
<!-- In PdfThumbnailList.vue -->
<div
  v-for="pageNum in totalPages"
  :key="`thumb-${pageNum}`"
  class="thumbnail-item"
  @click="selectPage(pageNum)"
  @contextmenu.prevent="showContextMenu($event, pageNum)"
>
  <!-- ... thumbnail content ... -->
</div>

<!-- Context menu -->
<v-menu
  v-model="contextMenuVisible"
  :position-x="contextMenuX"
  :position-y="contextMenuY"
  absolute
>
  <v-list>
    <v-list-item @click="copyPageNumber">
      <v-list-item-title>Copy Page Number</v-list-item-title>
    </v-list-item>
    <v-list-item @click="printPage">
      <v-list-item-title>Print This Page</v-list-item-title>
    </v-list-item>
  </v-list>
</v-menu>
```

---

### Phase 5: Performance Optimization (1-2 hours)

#### Step 5.1: CSS Content-Visibility for Large PDFs

For PDFs with 100+ pages, use CSS `content-visibility` for automatic virtualization:

**Add to PdfThumbnailList.vue Styles**:

```css
.thumbnail-item {
  position: relative;
  width: 100%;
  background-color: white;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  overflow: hidden;

  /* CSS-based virtualization for large PDF lists */
  content-visibility: auto;

  /* Tell browser the intrinsic thumbnail size */
  contain-intrinsic-size: 150px 194px; /* US Letter aspect ratio */
}
```

**Benefits**:
- **Zero Dependencies**: No @tanstack/vue-virtual library needed
- **40% Performance Boost**: Browser-native optimization
- **Automatic Virtualization**: Browser handles off-screen rendering
- **2 Lines of Code**: Dramatically simpler than library-based approach
- **Memory Efficient**: Browser automatically manages rendering
- **Graceful Degradation**: Falls back to normal rendering on older browsers

**Browser Support**: Chrome 85+, Edge 85+, Firefox 125+ (90%+ users)

#### Step 5.2: Progressive Thumbnail Loading

Load thumbnails in priority order:

1. **High Priority**: Current page and adjacent pages (±2)
2. **Medium Priority**: Visible thumbnails in thumbnail panel
3. **Low Priority**: All remaining thumbnails

```javascript
const renderThumbnailsWithPriority = async (pdfDocument, totalPages, currentPage) => {
  // Phase 1: Current page and neighbors
  const highPriority = [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2
  ].filter(p => p >= 1 && p <= totalPages)

  for (const pageNum of highPriority) {
    await renderThumbnail(pdfDocument, pageNum)
  }

  // Phase 2: All other pages in batches
  const remaining = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter(p => !highPriority.includes(p))

  await renderAllThumbnails(pdfDocument, remaining.length)
}
```

---

### Phase 6: Testing and Validation (2 hours)

#### Test Cases

**Functional Tests**:
1. ✅ Thumbnails render for all PDF pages
2. ✅ Clicking thumbnail navigates to correct page
3. ✅ Current page highlighted correctly
4. ✅ Auto-scroll keeps current thumbnail visible
5. ✅ Thumbnail panel collapses/expands smoothly
6. ✅ Non-PDF files show appropriate message
7. ✅ Page jump input works correctly
8. ✅ Keyboard navigation (arrows, page up/down, home/end)

**Performance Tests**:
1. ✅ Small PDF (1-5 pages) - instant thumbnail generation
2. ✅ Medium PDF (10-50 pages) - smooth progressive loading
3. ✅ Large PDF (100+ pages) - virtualization performs well
4. ✅ Very large PDF (500+ pages) - memory efficient

**Edge Cases**:
1. ✅ Switching between documents clears old thumbnails
2. ✅ Thumbnail rendering errors don't crash panel
3. ✅ Invalid page jump input handled gracefully
4. ✅ Rapid page navigation doesn't cause issues
5. ✅ Collapsed panel preserves state when re-expanded

**User Experience**:
1. ✅ Visual feedback on hover
2. ✅ Clear current page indication
3. ✅ Smooth scrolling animations
4. ✅ Responsive to user actions (no lag)
5. ✅ Intuitive keyboard shortcuts

---

## Implementation Checklist

### Phase 1: Thumbnail Rendering
- [ ] Create `src/features/organizer/composables/useThumbnailRenderer.js`
  - [ ] Implement `renderThumbnail()` function
  - [ ] Implement `renderAllThumbnails()` batch function
  - [ ] Implement caching with Map
  - [ ] Add cache cleanup function
  - [ ] Test with various PDF sizes

### Phase 2: Thumbnail List Component
- [ ] Create `src/features/organizer/components/PdfThumbnailList.vue`
  - [ ] Implement thumbnail grid layout
  - [ ] Add page number badges
  - [ ] Add current page highlighting
  - [ ] Implement click-to-navigate
  - [ ] Add loading states
  - [ ] Implement auto-scroll to current page
  - [ ] Add rendering progress indicator

### Phase 3: Integration
- [ ] Import `PdfThumbnailList` in NewViewDocument2.vue
- [ ] Add `currentVisiblePage` state tracking
- [ ] Replace thumbnail placeholder with component
- [ ] Implement `handlePageSelected()` method
- [ ] Set up IntersectionObserver for page tracking
- [ ] Test page synchronization

### Phase 4: Enhanced UX
- [ ] Add keyboard navigation (arrows, page up/down, home/end)
- [ ] Add page jump input field
- [ ] Implement `jumpToPage()` function
- [ ] Add context menu (optional)
- [ ] Test all navigation methods

### Phase 5: Performance
- [ ] Implement virtualization for large PDFs
- [ ] Add progressive thumbnail loading
- [ ] Test with 500+ page PDFs
- [ ] Monitor memory usage
- [ ] Optimize rendering batch size

### Phase 6: Testing
- [ ] Test all functional requirements
- [ ] Test performance scenarios
- [ ] Test edge cases
- [ ] Test keyboard shortcuts
- [ ] Test responsive behavior
- [ ] Fix any bugs discovered

### Phase 7: Documentation
- [ ] Document `useThumbnailRenderer.js` API
- [ ] Document `PdfThumbnailList.vue` props/events
- [ ] Add JSDoc comments
- [ ] Update NewViewDocument2.vue comments
- [ ] Update architecture docs if needed

---

## Success Criteria

1. **Functional**: Thumbnails display for all PDF pages with correct highlighting
2. **Navigation**: Clicking thumbnails scrolls to correct page instantly
3. **Performance**: Large PDFs (100+ pages) load thumbnails smoothly
4. **Synchronization**: Current page indicator always accurate
5. **User Experience**: Smooth animations, intuitive controls, responsive UI
6. **Memory Efficiency**: No memory leaks or excessive memory usage

---

## Future Enhancements (Post-MVP)

1. **Thumbnail Zoom**: Hover to show larger thumbnail preview
2. **Multi-Select**: Select multiple pages for batch operations
3. **Drag to Reorder**: Drag thumbnails to reorder pages (for editing PDFs)
4. **Thumbnail Annotations**: Show annotations/highlights on thumbnails
5. **Page Extraction**: Right-click to extract/save individual pages
6. **Thumbnail Grid View**: Switch between list and grid layouts
7. **Page Rotation Indicator**: Show if page is rotated
8. **Bookmark Integration**: Show bookmarks in thumbnail panel
9. **Search Results**: Highlight pages with search results
10. **Custom Thumbnail Size**: User preference for thumbnail size

---

## Integration with ImplementPDFViewing.md

**Dependencies**:
- Requires `usePdfViewer.js` composable
- Requires `pdfDocument` and `totalPages` from main viewer
- Requires `isPdfFile` computed property
- Requires main PDF viewer to be rendering pages

**Shared State**:
- Both features share the same `pdfDocument` reference
- Both track `currentVisiblePage` (viewer sets it, thumbnails read it)
- Both use pdf.js for rendering (viewer at high res, thumbnails at low res)

**Coordination Points**:
1. When PDF loads, both viewer and thumbnails start rendering
2. When user scrolls in viewer, thumbnails update current page highlight
3. When user clicks thumbnail, viewer scrolls to that page
4. When document changes, both clean up their resources

---

## References

- **pdf.js Documentation**: https://mozilla.github.io/pdf.js/
- **NewViewDocument2.vue**: src/features/organizer/views/NewViewDocument2.vue:19-44 (thumbnail panel)
- **ImplementPDFViewing.md**: Related plan for main PDF viewer
- **@tanstack/vue-virtual**: https://tanstack.com/virtual/latest (for virtualization)
