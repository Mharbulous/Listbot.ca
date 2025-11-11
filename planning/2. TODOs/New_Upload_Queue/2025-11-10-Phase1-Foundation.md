# Phase 1: Foundation - Upload + Table (MERGED)

**Phase:** 1 of 7
**Status:** Not Started
**Priority:** Critical
**Estimated Duration:** 5-6 days
**Dependencies:** None

---

## Overview

Create a complete upload-to-display pipeline by combining upload initiation with a high-performance virtual scrolling table. This merged phase establishes the foundation for all subsequent improvements and delivers a fully functional feature loop from day one.

**Goal:** Self-contained upload system with immediate visual feedback
**Deliverable:** Three upload buttons + virtual scrolling table + status system + footer
**User Impact:** "Look, I can upload files and see them in a table!" - Complete feature demonstration without relying on old upload system.

---

## Why Merge Phases?

**Problem with separate phases:**
- Building table first means nothing to display (Phases 1-3 wouldn't be demonstrable)
- Building upload first means temporary UI that gets replaced
- Requires using old system for testing

**Benefits of merging:**
✅ **Complete Feature Loop:** Upload → Display → Interact (fully demonstrable)
✅ **No Dependencies:** All testing happens at `/testing` route
✅ **Better UX:** Users see working product immediately
✅ **No Throwaway Code:** Everything built is final
✅ **Clear Value:** Phase 1 delivers real, usable functionality

---

## Part A: Upload Initiation (Three-Button System)

### A.1 Three Upload Buttons

**Button Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Drag and drop files or folders here, or:                      │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐│
│  │ Upload Files │  │ Upload Folder │  │ Upload Folder +      ││
│  │              │  │               │  │ Subfolders           ││
│  └──────────────┘  └───────────────┘  └──────────────────────┘│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Button Specifications

#### Button 1: Upload Files
**Icon:** 📄
**Label:** "Upload Files"
**Behavior:** Multi-select file picker, any files from any location

```html
<input
  ref="fileInput"
  type="file"
  multiple
  accept="*/*"
  style="display: none"
  @change="handleFileSelect"
/>
<button @click="$refs.fileInput.click()">
  📄 Upload Files
</button>
```

#### Button 2: Upload Folder
**Icon:** 📁
**Label:** "Upload Folder"
**Behavior:** Root folder only (no recursion)

```javascript
const handleFolderSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  const rootPath = allFiles[0].webkitRelativePath.split('/')[0];
  const rootFiles = allFiles.filter(file => {
    const parts = file.webkitRelativePath.split('/');
    return parts.length === 2 && parts[0] === rootPath;
  });

  console.log(`[FOLDER] Root only: ${rootFiles.length} files from ${rootPath}`);
  addFilesToQueue(rootFiles);
};
```

#### Button 3: Upload Folder + Subfolders
**Icon:** 📂
**Label:** "Upload Folder + Subfolders"
**Behavior:** Full recursive upload

```javascript
const handleFolderRecursiveSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  const folderName = allFiles[0].webkitRelativePath.split('/')[0];

  console.log(`[FOLDER+] Recursive: ${allFiles.length} files from ${folderName}`);
  addFilesToQueue(allFiles);
};
```

### A.2 Non-Blocking Queue Progress

**For large batches (>500 files):**
```
┌────────────────────────────────────────────────────────────┐
│  Queueing files... (324/720 analyzed)                      │
│  ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░                          │
└────────────────────────────────────────────────────────────┘
```

```javascript
const addFilesToQueue = async (files) => {
  const BATCH_SIZE = 100;
  const queueProgress = ref({
    isQueueing: true,
    processed: 0,
    total: files.length
  });

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await processBatch(batch);
    queueProgress.value.processed = Math.min(i + BATCH_SIZE, files.length);
    await nextTick();
  }

  queueProgress.value.isQueueing = false;
};
```

---

## Part B: Virtual Scrolling Table

### B.1 Table Structure

**Column Layout:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ Actions      │ File Name         │ Size     │ Status          │ Folder Path  │ Cancel │
│ (100px)      │ (300px)           │ (100px)  │ (180px)         │ (300px)      │ (80px) │
├──────────────┼───────────────────┼──────────┼─────────────────┼──────────────┼────────┤
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
│ [👁️] [⬆️]   │ report.docx       │ 890 KB   │ 🟡 Uploading... │ /Reports     │  [❌]  │
│ [—] [—]     │ form.pdf          │ 1.2 MB   │ 🟢 Uploaded     │ /Forms       │  [🗑️]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

### B.2 Status System (7 Colors)

| Dot | Color | Status Key | Display Text | Meaning |
|-----|-------|-----------|--------------|---------|
| 🔵 | Blue | `ready` | Ready | Queued, ready for upload |
| 🟡 | Yellow | `uploading` | Uploading... | Currently being uploaded |
| 🟢 | Green | `completed` | Uploaded | Successfully uploaded |
| ⚪ | White | `skipped` | Duplicate | Detected as duplicate |
| 🔴 | Red | `error` | Failed | Upload failed with error |
| 🟠 | Orange | `uploadMetadataOnly` | Metadata Only | Uploaded metadata only |
| ⚫ | Gray | `unknown` | Unknown | Unknown status (fallback) |

```css
.status-ready { background-color: #2196F3; }
.status-uploading { background-color: #FFC107; }
.status-completed { background-color: #4CAF50; }
.status-skipped { background-color: #9C27B0; }
.status-error { background-color: #F44336; }
.status-uploadMetadataOnly { background-color: #FFFFFF; border: 1px solid #ccc; }
.status-unknown { background-color: #9E9E9E; }
```

### B.3 Footer Status Bar

**Layout:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ Total: 720 files (380.3 MB) • TOTAL: 715 • Duplicates: 5 • Failed: 0  │
│ • Uploaded: 0/715                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

```javascript
const footerStats = computed(() => {
  const total = uploadQueue.value.length;
  const totalSize = uploadQueue.value.reduce((sum, f) => sum + f.size, 0);
  const ready = uploadQueue.value.filter(f => f.status === 'ready').length;
  const duplicates = uploadQueue.value.filter(f => f.status === 'skipped').length;
  const failed = uploadQueue.value.filter(f => f.status === 'error').length;
  const uploaded = uploadQueue.value.filter(f => f.status === 'completed').length;
  const uploadable = total - duplicates;

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
    duplicates,
    failed,
    uploaded,
    uploadable
  };
});
```

### B.4 Virtual Scrolling Implementation

```vue
<script setup>
import { useVirtualizer } from '@tanstack/vue-virtual';

const scrollContainer = ref(null);
const ROW_HEIGHT = 48;

const rowVirtualizer = useVirtualizer({
  count: uploadQueue.value.length,
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
  enableSmoothScroll: true
});

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());
</script>

<template>
  <div ref="scrollContainer" class="table-scroll-container">
    <div class="virtual-container" :style="{ height: totalSize + 'px' }">
      <div
        v-for="virtualRow in virtualItems"
        :key="virtualRow.key"
        class="table-row"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          height: virtualRow.size + 'px',
          transform: `translateY(${virtualRow.start}px)`
        }"
      >
        <UploadTableRow :file="uploadQueue[virtualRow.index]" />
      </div>
    </div>
  </div>
</template>
```

**Performance Targets:**
- Render only visible rows + 5 overscan
- Constant O(1) memory usage
- 60 FPS scrolling
- <100ms initial render for 1000 files
- Support 100,000+ files

---

## Component Structure

### File Organization
```
src/features/upload/
├── components/
│   ├── UploadButtons.vue            # Three upload buttons
│   ├── UploadTable.vue              # Main table container
│   ├── UploadTableHeader.vue        # Sticky header
│   ├── UploadTableRow.vue           # Individual row (virtualized)
│   ├── UploadTableFooter.vue        # Status footer bar
│   ├── StatusCell.vue               # Status dot + text
│   ├── ActionButtons.vue            # Peek + Upload Now buttons (Phase 2)
│   └── QueueProgressIndicator.vue   # Non-blocking progress bar
└── composables/
    ├── useUploadButtons.js          # Upload button logic
    ├── useUploadTable.js            # Table state management
    └── useVirtualScroll.js          # Virtual scrolling logic
```

### Main Component: FileUpload.vue

```vue
<template>
  <div class="file-upload-page">
    <!-- Upload Buttons Section -->
    <UploadButtons
      @files-selected="handleFileSelect"
      @folder-selected="handleFolderSelect"
      @folder-recursive-selected="handleFolderRecursiveSelect"
    />

    <!-- Queue Progress (if queueing large batch) -->
    <QueueProgressIndicator
      v-if="queueProgress.isQueueing"
      :processed="queueProgress.processed"
      :total="queueProgress.total"
    />

    <!-- Upload Table -->
    <UploadTable
      v-if="uploadQueue.length > 0"
      :files="uploadQueue"
      @cancel="handleCancelFile"
    />

    <!-- Footer -->
    <UploadTableFooter :stats="footerStats" />
  </div>
</template>
```

---

## Implementation Tasks

### Day 1-2: Upload Buttons & Queue Management

#### 1.1 Upload Buttons
- [ ] Create `UploadButtons.vue` component
- [ ] Implement three file input types (files, folder, folder-recursive)
- [ ] Add root-only filtering logic for Button 2
- [ ] Style buttons with icons and hover states
- [ ] Test file selection workflows

#### 1.2 Queue Management
- [ ] Create `QueueProgressIndicator.vue`
- [ ] Implement batch processing with progress updates
- [ ] Add queue state management (queueing, ready)
- [ ] Test with various file counts (10, 500, 5000)

#### 1.3 File Processing
- [ ] Implement `addFilesToQueue()` function
- [ ] Parse file metadata (name, size, path, modified date)
- [ ] Create file objects with unique IDs
- [ ] Set initial status to 'ready'

### Day 3-4: Table Structure & Virtual Scrolling

#### 1.4 Table Components
- [ ] Create `UploadTable.vue` main component
- [ ] Create `UploadTableHeader.vue` with sticky positioning
- [ ] Create `UploadTableRow.vue` with column cells
- [ ] Create `UploadTableFooter.vue` with status bar
- [ ] Set up column definitions array

#### 1.5 Virtual Scrolling
- [ ] Install `@tanstack/vue-virtual` package
- [ ] Create `useVirtualScroll.js` composable
- [ ] Integrate virtualizer with table rows
- [ ] Configure overscan and row height
- [ ] Test with 100, 1000, 10000 files

#### 1.6 Status System
- [ ] Create `StatusCell.vue` component
- [ ] Define 7 status colors in CSS variables
- [ ] Implement status dot rendering
- [ ] Implement status text mapping
- [ ] Test all 7 status states

### Day 5: Footer & Integration

#### 1.7 Footer Status Bar
- [ ] Implement reactive stats computation
- [ ] Add real-time count updates
- [ ] Format file sizes with `formatBytes()`
- [ ] Style footer to match DocumentTable
- [ ] Test stats accuracy with various file states

#### 1.8 Integration
- [ ] Connect upload buttons to table display
- [ ] Ensure files appear in table immediately after selection
- [ ] Verify footer updates when files added
- [ ] Test complete flow: upload → display → status
- [ ] Verify backward compatibility with existing upload logic

### Day 6: Styling & Testing

#### 1.9 Styling & Polish
- [ ] Import DocumentTable.css as base
- [ ] Create UploadTable.css for overrides
- [ ] Match header styling (sticky, borders, spacing)
- [ ] Match row styling (hover, alternating colors)
- [ ] Match footer styling (background, padding)
- [ ] Ensure responsive layout
- [ ] Test dark mode compatibility (if applicable)

#### 1.10 Testing
- [ ] Unit tests for all components
- [ ] Component tests for virtual scrolling
- [ ] Performance benchmarks
- [ ] Manual testing with various queue sizes
- [ ] Browser compatibility testing

---

## Testing Requirements

### Unit Tests

```javascript
describe('Upload Buttons', () => {
  it('files button opens file picker', () => {});
  it('folder button opens folder picker', () => {});
  it('folder recursive button opens folder picker', () => {});
  it('filters root-only files correctly', () => {});
  it('handles empty selection gracefully', () => {});
});

describe('UploadTable', () => {
  it('renders all columns', () => {});
  it('displays correct number of rows', () => {});
  it('updates footer stats reactively', () => {});
  it('handles empty queue gracefully', () => {});
});

describe('Virtual Scrolling', () => {
  it('renders only visible rows', () => {});
  it('maintains 60 FPS during scroll', () => {});
  it('handles large datasets (10000+ files)', () => {});
  it('updates correctly when queue changes', () => {});
});

describe('StatusCell', () => {
  it('renders correct dot color for each status', () => {});
  it('displays correct status text', () => {});
  it('updates when status changes', () => {});
});
```

### Integration Tests

```javascript
describe('Upload to Display Flow', () => {
  it('files appear in table immediately after selection', () => {});
  it('footer counts update when files added', () => {});
  it('queue progress shows for large batches', () => {});
  it('virtual scrolling works with newly added files', () => {});
});
```

### Performance Tests

```javascript
describe('Performance Benchmarks', () => {
  it('renders 1000 files in <100ms', async () => {
    const start = performance.now();
    await loadQueue(generateFiles(1000));
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('maintains constant memory usage', () => {
    // Monitor memory across different queue sizes
  });
});
```

### Manual Testing Scenarios

1. **Upload Files:**
   - Click "Upload Files" → Select 10 files
   - Verify files appear in table immediately
   - Verify footer shows correct counts

2. **Upload Folder (Root Only):**
   - Click "Upload Folder" → Select folder with subfolders
   - Verify only root-level files appear
   - Verify folder path displays correctly

3. **Upload Folder + Subfolders:**
   - Click "Upload Folder + Subfolders" → Select folder
   - Verify all nested files appear
   - Verify folder paths show full hierarchy

4. **Large Batch:**
   - Upload 5000 files
   - Verify queue progress indicator appears
   - Verify table displays smoothly after load
   - Verify scrolling maintains 60 FPS

5. **Empty State:**
   - Load page with no files
   - Verify empty state displays
   - Upload files → verify transition to table

---

## Success Criteria

### Functional Requirements
- [x] Three upload buttons display and work correctly
- [x] Files appear in table immediately after selection
- [x] Table displays with all 6 columns
- [x] Virtual scrolling works smoothly (60 FPS)
- [x] Status dots display with correct colors
- [x] Status text displays correctly
- [x] Footer shows live counts
- [x] Sticky header stays visible during scroll
- [x] Queue progress shows for large batches (>500 files)
- [x] No folder options modal appears
- [x] Root-only folder filtering works correctly

### Performance Requirements
- [x] 1000 files load in <100ms
- [x] Scrolling maintains 60 FPS
- [x] Memory usage stays constant O(1)
- [x] No frame drops during status updates
- [x] Files queue immediately after selection (<500ms)

### Visual Requirements
- [x] Matches DocumentTable design system
- [x] Column widths are appropriate
- [x] Spacing and padding consistent
- [x] Hover states work correctly
- [x] Typography matches DocumentTable
- [x] Upload buttons styled attractively
- [x] Progress bar animates smoothly

---

## Performance Benchmarks

### Before (Card-Based List + Old Upload)
| Metric | Value |
|--------|-------|
| Initial Render (1000 files) | 2-5 seconds |
| Scroll FPS | 15-30 FPS |
| Memory Usage | O(n) - 150MB for 1000 files |
| Upload initiation | 4+ clicks, 3-5 seconds |

### After (Phase 1: Virtual Table + Three Buttons)
| Metric | Target | Actual |
|--------|--------|--------|
| Initial Render (1000 files) | <100ms | _TBD_ |
| Scroll FPS | 60 FPS | _TBD_ |
| Memory Usage | O(1) - ~50MB constant | _TBD_ |
| Upload initiation | 1 click, <500ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 1 - Upload initiation: Xms');
console.log('[PERFORMANCE] Phase 1 - Files queued: X files in Xms');
console.log('[PERFORMANCE] Phase 1 - Table render: Xms');
console.log('[PERFORMANCE] Phase 1 - Virtual scroll FPS: X');
console.log('[PERFORMANCE] Phase 1 - Memory usage: XMB');
```

---

## Dependencies

### NPM Packages
```bash
npm install @tanstack/vue-virtual
```

### Internal Dependencies
- `DocumentTable.css` - Base styling reference
- Existing upload orchestration logic (from old FileUpload.vue)

---

## Rollout Plan

### Development Schedule

**Day 1:** Upload buttons + basic queue management
**Day 2:** Queue progress indicator + file processing
**Day 3:** Table structure + column definitions
**Day 4:** Virtual scrolling integration + status system
**Day 5:** Footer + complete upload-to-display flow
**Day 6:** Styling polish + comprehensive testing

### Testing Steps
1. Unit tests for all components
2. Component tests for virtual scrolling
3. Integration tests for upload-to-display flow
4. Performance benchmarks
5. Manual testing with various queue sizes
6. Browser compatibility testing

### Deployment
- Merge to `/testing` route (coexists with old `/upload`)
- Announce to test users
- Gather feedback
- Monitor performance metrics
- Address any issues before Phase 2

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with dynamic row heights | Low | Medium | Use fixed row height (48px) |
| Large folder selection causes browser hang | Medium | High | Progressive loading with batches |
| Memory leaks with large queues | Low | High | Proper cleanup in onUnmounted |
| FPS drops on low-end devices | Medium | Medium | Reduce overscan, optimize rendering |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by new table layout | Low | Medium | Clear migration communication |
| Three-button system not intuitive | Low | High | Clear button labels, hover descriptions |
| Root-only folder filtering unexpected | Medium | Low | Clear button label, test user feedback |

---

## Next Phase Preview

**Phase 2:** Core Actions (cancel, undo, immediate upload)
- Cancel button implementation
- Undo functionality
- Upload Now button
- Duplicate promotion algorithm

Phase 2 builds on Phase 1's foundation by adding file management actions.

---

## Notes

- Phase 1 is intentionally larger (5-6 days) to create complete feature loop
- Can be split into 1a (Upload) + 1b (Table) if too large, but recommended as single phase
- All testing happens at `/testing` route - no dependency on old system
- Document actual performance metrics as they're measured
- Capture screenshots for documentation

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
