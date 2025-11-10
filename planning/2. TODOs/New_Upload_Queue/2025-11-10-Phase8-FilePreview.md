# Phase 8: File Preview Integration (Low Priority)

**Phase:** 8 of 8
**Status:** Not Started
**Priority:** Low (Optional Enhancement)
**Estimated Duration:** 3-4 days
**Dependencies:** Phases 1-7

---

## Overview

Add document peek functionality from DocumentTable allowing users to preview file contents before upload.

**Goal:** Hover/click preview of files before upload
**Deliverable:** Preview modal with PDF thumbnails, image previews, and metadata
**User Impact:** Verify file contents before committing to upload

---

## Features

### 8.1 Peek Button in Actions Column
### 8.2 Preview Modal Component
### 8.3 PDF Thumbnail Generation
### 8.4 Image Preview
### 8.5 Metadata Display for Other Files

---

## 8.1 Peek Button Implementation

### Visual Design

**Actions Column with Peek:**
```
┌──────────────┐
│ [👁️] [⬆️]   │  ← Eye button for preview
└──────────────┘
```

### Component

```vue
<!-- PeekButton.vue -->
<template>
  <button
    class="peek-button"
    @click="handlePeek"
    title="Preview file"
  >
    👁️
  </button>
</template>

<script setup>
const props = defineProps({
  file: { type: Object, required: true }
});

const emit = defineEmits(['peek']);

const handlePeek = () => {
  emit('peek', props.file);
};
</script>

<style scoped>
.peek-button {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.peek-button:hover {
  transform: scale(1.2);
}
</style>
```

---

## 8.2 Preview Modal Component

### Modal Design

```
┌────────────────────────────────────────────────────┐
│  invoice.pdf                                   [X] │
├────────────────────────────────────────────────────┤
│                                                     │
│            [PDF Thumbnail Preview]                 │
│                                                     │
│                                                     │
├────────────────────────────────────────────────────┤
│  Page 1 of 5                      [<] [>]          │
│                                                     │
│  Size: 2.4 MB                                      │
│  Modified: Apr 3, 2024 10:38 AM                    │
│  Folder: /2024/Tax                                 │
│                                                     │
│                          [View Full Document]      │
└────────────────────────────────────────────────────┘
```

### Component Structure

```vue
<!-- FilePreviewModal.vue -->
<template>
  <div v-if="visible" class="preview-modal-overlay" @click.self="close">
    <div class="preview-modal">
      <!-- Header -->
      <div class="modal-header">
        <span class="file-name">{{ file.name }}</span>
        <button class="close-button" @click="close">✕</button>
      </div>

      <!-- Preview Area -->
      <div class="preview-area">
        <template v-if="isLoading">
          <div class="loading-spinner">Loading preview...</div>
        </template>

        <template v-else-if="previewType === 'pdf'">
          <img :src="thumbnailUrl" alt="PDF Preview" class="pdf-thumbnail" />
        </template>

        <template v-else-if="previewType === 'image'">
          <img :src="imageUrl" alt="Image Preview" class="image-preview" />
        </template>

        <template v-else>
          <div class="file-icon">
            {{ getFileIcon(file.type) }}
          </div>
          <p class="no-preview-text">Cannot preview this file type</p>
        </template>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <!-- Page Navigation (for PDFs) -->
        <div v-if="previewType === 'pdf'" class="page-navigation">
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="previousPage" :disabled="currentPage === 1">‹</button>
          <button @click="nextPage" :disabled="currentPage === totalPages">›</button>
        </div>

        <!-- Metadata -->
        <div class="file-metadata">
          <div class="metadata-item">
            <strong>Size:</strong> {{ formatSize(file.size) }}
          </div>
          <div class="metadata-item">
            <strong>Modified:</strong> {{ formatDate(file.lastModified) }}
          </div>
          <div class="metadata-item">
            <strong>Folder:</strong> {{ file.webkitRelativePath }}
          </div>
        </div>

        <!-- Action Button -->
        <button class="view-full-button" @click="viewFull">
          View Full Document
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: Object, required: true }
});

const emit = defineEmits(['close', 'view-full']);

const isLoading = ref(false);
const thumbnailUrl = ref('');
const imageUrl = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const previewType = computed(() => {
  if (props.file.type === 'application/pdf') return 'pdf';
  if (props.file.type.startsWith('image/')) return 'image';
  return 'unsupported';
});

watch(() => props.visible, async (visible) => {
  if (visible) {
    await loadPreview();
  }
});

const loadPreview = async () => {
  isLoading.value = true;

  try {
    if (previewType.value === 'pdf') {
      await generatePDFThumbnail();
    } else if (previewType.value === 'image') {
      await loadImagePreview();
    }
  } catch (error) {
    console.error('[PREVIEW] Error loading preview:', error);
  } finally {
    isLoading.value = false;
  }
};

const close = () => emit('close');
const viewFull = () => emit('view-full', props.file);
const previousPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
</script>
```

---

## 8.3 PDF Thumbnail Generation

### Using PDF.js

```javascript
// useFilePreview.js
import * as pdfjsLib from 'pdfjs-dist';

export function useFilePreview() {
  const generatePDFThumbnail = async (file, pageNumber = 1) => {
    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Get page
    const page = await pdf.getPage(pageNumber);

    // Set scale for thumbnail (adjust for quality/size)
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert to data URL
    const thumbnailUrl = canvas.toDataURL('image/png');

    return {
      thumbnailUrl,
      totalPages: pdf.numPages
    };
  };

  return { generatePDFThumbnail };
}
```

### Performance Considerations

**Lazy Generation:**
- Generate thumbnails only when preview button clicked
- Cache thumbnails in memory during session
- Use lower resolution for faster generation

**Implementation:**
```javascript
const thumbnailCache = new Map();

const getThumbnail = async (file) => {
  if (thumbnailCache.has(file.name)) {
    return thumbnailCache.get(file.name);
  }

  const thumbnail = await generatePDFThumbnail(file);
  thumbnailCache.set(file.name, thumbnail);

  return thumbnail;
};
```

---

## 8.4 Image Preview

### Using FileReader API

```javascript
const loadImagePreview = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = (e) => {
      reject(e);
    };

    reader.readAsDataURL(file);
  });
};
```

### Image Zoom (Optional)

```vue
<template>
  <div class="image-preview-container">
    <img
      :src="imageUrl"
      :style="{ transform: `scale(${zoomLevel})` }"
      class="image-preview"
    />
    <div class="zoom-controls">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">-</button>
      <button @click="resetZoom">Reset</button>
    </div>
  </div>
</template>

<script setup>
const zoomLevel = ref(1);
const zoomIn = () => { zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3); };
const zoomOut = () => { zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5); };
const resetZoom = () => { zoomLevel.value = 1; };
</script>
```

---

## 8.5 Metadata Display for Other Files

### For Non-Previewable Files

**Display file icon and metadata:**

```vue
<template>
  <div class="unsupported-preview">
    <div class="file-icon-large">
      {{ getFileIcon(file.type) }}
    </div>
    <p class="file-type-label">{{ formatFileType(file.type) }}</p>
    <p class="no-preview-message">Preview not available for this file type</p>

    <div class="metadata-grid">
      <div class="metadata-row">
        <span class="label">File Name:</span>
        <span class="value">{{ file.name }}</span>
      </div>
      <div class="metadata-row">
        <span class="label">File Type:</span>
        <span class="value">{{ file.type }}</span>
      </div>
      <div class="metadata-row">
        <span class="label">Size:</span>
        <span class="value">{{ formatSize(file.size) }}</span>
      </div>
      <div class="metadata-row">
        <span class="label">Modified:</span>
        <span class="value">{{ formatDate(file.lastModified) }}</span>
      </div>
      <div class="metadata-row">
        <span class="label">Folder:</span>
        <span class="value">{{ getFolderPath(file) }}</span>
      </div>
    </div>
  </div>
</template>
```

### File Icon Mapping

```javascript
const getFileIcon = (mimeType) => {
  const iconMap = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'image/': '🖼️',
    'video/': '🎥',
    'audio/': '🎵',
    'application/zip': '🗜️',
    'text/': '📋'
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (mimeType.startsWith(key)) return icon;
  }

  return '📁'; // Default
};
```

---

## 8.6 Reuse DocumentTable Components

### Component Reuse Strategy

**DocumentTable components to leverage:**
- `DocumentPeekTooltip.vue` - Modal structure and styling
- `useDocumentTablePeek.js` - Peek state management logic
- Tooltip positioning algorithms
- Keyboard navigation (arrow keys for pages)

**Adaptations needed:**
- Replace Firestore document fetch with local File object
- Replace storage URL fetch with FileReader/PDF.js
- Maintain same visual design and interactions

---

## Implementation Tasks

### Task Checklist

#### 8.1 Peek Button
- [ ] Add peek button to Actions column
- [ ] Implement click handler
- [ ] Test button visibility and interactions

#### 8.2 Preview Modal
- [ ] Create `FilePreviewModal.vue`
- [ ] Implement modal overlay and close behavior
- [ ] Style modal to match DocumentTable peek
- [ ] Test modal open/close

#### 8.3 PDF Preview
- [ ] Install `pdfjs-dist` package
- [ ] Create `useFilePreview.js` composable
- [ ] Implement `generatePDFThumbnail()`
- [ ] Add page navigation (previous/next)
- [ ] Cache thumbnails in memory
- [ ] Test with various PDF files

#### 8.4 Image Preview
- [ ] Implement `loadImagePreview()` with FileReader
- [ ] Add zoom controls (optional)
- [ ] Test with various image formats (JPG, PNG, GIF)

#### 8.5 Metadata Display
- [ ] Create unsupported file type layout
- [ ] Implement file icon mapping
- [ ] Display metadata grid
- [ ] Test with various file types

#### 8.6 Integration
- [ ] Integrate modal with upload table
- [ ] Ensure non-blocking behavior
- [ ] Test performance with large files
- [ ] Add error handling for preview failures

---

## Testing Requirements

### Unit Tests
```javascript
describe('File Preview', () => {
  it('generates PDF thumbnail', async () => {});
  it('loads image preview', async () => {});
  it('displays metadata for unsupported files', () => {});
  it('caches thumbnails', () => {});
  it('handles preview errors gracefully', () => {});
});
```

### Manual Testing
1. Click peek button on PDF → verify thumbnail
2. Navigate PDF pages → verify page changes
3. Click peek on image → verify preview
4. Click peek on unsupported file → verify metadata
5. Test with large files (>10MB) → verify performance
6. Test preview error handling

---

## Success Criteria

- [x] Eye button appears in Actions column
- [x] Clicking eye button opens preview modal
- [x] PDFs show first page thumbnail
- [x] PDF page navigation works (previous/next)
- [x] Images show full preview
- [x] Unsupported files show metadata
- [x] Previews load quickly (<500ms)
- [x] Modal design matches DocumentTable peek
- [x] Modal is non-blocking and closeable

---

## Dependencies

### NPM Packages
```bash
npm install pdfjs-dist
```

### Internal Dependencies
- `DocumentPeekTooltip.vue` (for design reference)
- `useDocumentTablePeek.js` (for state management patterns)

---

## Performance Considerations

**Optimization Targets:**
| Operation | Target | Notes |
|-----------|--------|-------|
| PDF thumbnail generation | <500ms | First page only, 1.5x scale |
| Image preview load | <300ms | Use FileReader |
| Thumbnail caching | Memory only | Clear on page unmount |
| Modal open animation | 60 FPS | CSS transitions |

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large PDF causes browser lag | Medium | Medium | Lower thumbnail resolution |
| High-res images cause memory issues | Low | Medium | Scale down before display |
| PDF.js library size impact | Low | Low | Lazy load only when needed |

---

## Next Steps After Phase 8

**Post-Phase 8 Enhancements (Future):**
- Video preview (first frame thumbnail)
- Audio preview (waveform visualization)
- Document content search before upload
- OCR preview for scanned documents
- Collapsible duplicate groups

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
