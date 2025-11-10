# Phase 1: Virtual Upload Queue - Table Structure Implementation

**Phase:** 1 of 8
**Status:** Not Started
**Priority:** Critical
**Estimated Duration:** 3-4 days
**Dependencies:** None

---

## Overview

Transform the upload queue from a card-based list layout into a high-performance table with virtual scrolling. This phase establishes the foundation for all subsequent improvements.

**Goal:** Replace card-based list with performant table layout
**Deliverable:** Working table with basic columns and virtual scrolling
**User Impact:** Dramatically faster queue display (2-5s → <100ms), smoother scrolling (15-30 FPS → 60 FPS)

---

## Table Structure

### Column Layout
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ Actions      │ File Name         │ Size     │ Status          │ Folder Path  │ Cancel │
│ (100px)      │ (300px)           │ (100px)  │ (180px)         │ (300px)      │ (80px) │
├──────────────┼───────────────────┼──────────┼─────────────────┼──────────────┼────────┤
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
│ [👁️] [⬆️]   │ report.docx       │ 890 KB   │ 🟡 Uploading... │ /Reports     │  [❌]  │
│ [—] [—]     │ form.pdf          │ 1.2 MB   │ 🟢 Uploaded     │ /Forms       │  [🗑️]  │
│ [—] [—]     │ contract.pdf      │ 1.2 MB   │ 🟠 Duplicate    │ /Forms       │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

### Column Definitions

| Column | Key | Width | Resizable | Sortable | Description |
|--------|-----|-------|-----------|----------|-------------|
| Actions | `actions` | 100px | No | No | Peek and Upload Now buttons |
| File Name | `fileName` | 300px | Yes | Yes | Source file name |
| Size | `size` | 100px | Yes | Yes | Formatted file size |
| Status | `status` | 180px | Yes | Yes | Colored dot + status text |
| Folder Path | `folderPath` | 300px | Yes | Yes | webkitRelativePath |
| Cancel | `cancel` | 80px | No | No | Cancel/Undo button |

---

## Status System

### 7-Color Status Indicators

Each status displays as: `[dot] [text]`

| Dot | Color Code | Status Key | Display Text | Meaning |
|-----|-----------|-----------|--------------|---------|
| 🔵 | Blue | `ready` | Ready | Queued, ready for upload |
| 🟡 | Yellow | `uploading` | Uploading... | Currently being uploaded |
| 🟢 | Green | `completed` | Uploaded | Successfully uploaded |
| 🟠 | Orange | `skipped` | Duplicate | Detected as duplicate |
| 🔴 | Red | `error` | Failed | Upload failed with error |
| ⚪ | White | `uploadMetadataOnly` | Metadata Only | Uploaded metadata only |
| ⚫ | Gray | `unknown` | Unknown | Unknown status (fallback) |

### Status Component
```vue
<!-- StatusCell.vue -->
<template>
  <div class="status-cell">
    <span class="status-dot" :class="`status-${status}`"></span>
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<style>
.status-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}
.status-ready { background-color: #2196F3; } /* Blue */
.status-uploading { background-color: #FFC107; } /* Yellow */
.status-completed { background-color: #4CAF50; } /* Green */
.status-skipped { background-color: #9C27B0; } /* Purple */
.status-error { background-color: #F44336; } /* Red */
.status-uploadMetadataOnly { background-color: #FFFFFF; border: 1px solid #ccc; }
.status-unknown { background-color: #9E9E9E; } /* Gray */
</style>
```

---

## Footer Status Bar

### Layout
```
┌────────────────────────────────────────────────────────────────────────┐
│ Total: 720 files (380.3 MB) • Ready: 715 • Duplicates: 5 • Failed: 0  │
│ • Uploaded: 0/715                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Reactive Counts
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

---

## Virtual Scrolling Implementation

### TanStack Virtual Integration

```vue
<script setup>
import { useVirtualizer } from '@tanstack/vue-virtual';

const scrollContainer = ref(null);
const ROW_HEIGHT = 48; // pixels

// Initialize virtualizer
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

### Performance Targets
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
│   ├── UploadTable.vue              # Main table container
│   ├── UploadTableHeader.vue        # Sticky header
│   ├── UploadTableRow.vue           # Individual row (virtualized)
│   ├── UploadTableFooter.vue        # Status footer bar
│   ├── StatusCell.vue               # Status dot + text
│   └── ActionButtons.vue            # Peek + Upload Now buttons
└── composables/
    ├── useUploadTable.js            # Table state management
    └── useVirtualScroll.js          # Virtual scrolling logic
```

### UploadTable.vue Structure
```vue
<template>
  <div class="upload-table">
    <UploadTableHeader :columns="columns" />

    <div ref="scrollContainer" class="table-body">
      <!-- Virtual rows rendered here -->
    </div>

    <UploadTableFooter :stats="footerStats" />
  </div>
</template>
```

---

## Implementation Tasks

### Task Checklist

#### 1.1 Core Table Structure
- [ ] Create `UploadTable.vue` main component
- [ ] Create `UploadTableHeader.vue` with sticky positioning
- [ ] Create `UploadTableRow.vue` with column cells
- [ ] Create `UploadTableFooter.vue` with status bar
- [ ] Set up column definitions array
- [ ] Implement basic table styling matching DocumentTable

#### 1.2 Status System
- [ ] Create `StatusCell.vue` component
- [ ] Define 7 status colors in CSS variables
- [ ] Implement status dot rendering
- [ ] Implement status text mapping
- [ ] Add status transition animations
- [ ] Test all 7 status states

#### 1.3 Virtual Scrolling
- [ ] Install `@tanstack/vue-virtual` package
- [ ] Create `useVirtualScroll.js` composable
- [ ] Integrate virtualizer with table rows
- [ ] Implement row height estimation
- [ ] Configure overscan settings
- [ ] Test with 100, 1000, 10000 files

#### 1.4 Footer Status Bar
- [ ] Create `UploadTableFooter.vue`
- [ ] Implement reactive stats computation
- [ ] Add real-time count updates
- [ ] Format file sizes with `formatBytes()`
- [ ] Style footer to match DocumentTable
- [ ] Test stats accuracy with various file states

#### 1.5 Styling & Polish
- [ ] Import DocumentTable.css as base
- [ ] Create UploadTable.css for overrides
- [ ] Match header styling (sticky, borders, spacing)
- [ ] Match row styling (hover, alternating colors)
- [ ] Match footer styling (background, padding)
- [ ] Ensure responsive layout
- [ ] Test dark mode compatibility (if applicable)

#### 1.6 Integration
- [ ] Replace old FileUploadQueue component
- [ ] Connect to existing `uploadQueue` reactive array
- [ ] Map file objects to table row data
- [ ] Ensure backward compatibility with upload logic
- [ ] Test with existing file selection methods
- [ ] Verify all file metadata displays correctly

---

## Testing Requirements

### Unit Tests
```javascript
// UploadTable.spec.js
describe('UploadTable', () => {
  it('renders all columns', () => { /* ... */ });
  it('displays correct number of rows', () => { /* ... */ });
  it('updates footer stats reactively', () => { /* ... */ });
  it('handles empty queue gracefully', () => { /* ... */ });
});

// StatusCell.spec.js
describe('StatusCell', () => {
  it('renders correct dot color for each status', () => { /* ... */ });
  it('displays correct status text', () => { /* ... */ });
  it('updates when status changes', () => { /* ... */ });
});
```

### Component Tests
```javascript
describe('Virtual Scrolling', () => {
  it('renders only visible rows', () => { /* ... */ });
  it('maintains 60 FPS during scroll', () => { /* ... */ });
  it('handles large datasets (10000+ files)', () => { /* ... */ });
  it('updates correctly when queue changes', () => { /* ... */ });
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
1. **Small Queue (10 files):** Verify all features work
2. **Medium Queue (500 files):** Check performance, scrolling
3. **Large Queue (5000 files):** Stress test virtual scrolling
4. **Empty Queue:** Verify empty state displays
5. **Status Changes:** Rapidly change file statuses
6. **Browser Compatibility:** Test Chrome, Firefox, Safari, Edge

---

## Performance Benchmarks

### Before (Card-Based List)
| Metric | Value |
|--------|-------|
| Initial Render (1000 files) | 2-5 seconds |
| Scroll FPS | 15-30 FPS |
| Memory Usage | O(n) - 150MB for 1000 files |
| Max Practical Files | ~1000 |

### After (Virtual Table)
| Metric | Target | Actual |
|--------|--------|--------|
| Initial Render (1000 files) | <100ms | _TBD_ |
| Scroll FPS | 60 FPS | _TBD_ |
| Memory Usage | O(1) - ~50MB constant | _TBD_ |
| Max Supported Files | 100,000+ | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 1 - Table render: Xms');
console.log('[PERFORMANCE] Phase 1 - Virtual scroll FPS: X');
console.log('[PERFORMANCE] Phase 1 - Memory usage: XMB');
```

---

## Success Criteria

### Functional Requirements
- [x] Table displays with all 6 columns
- [x] Virtual scrolling works smoothly (60 FPS)
- [x] Status dots display with correct colors
- [x] Status text displays correctly
- [x] Footer shows live counts
- [x] Sticky header stays visible during scroll
- [x] Alternating row colors for readability
- [x] Empty state displays when queue is empty

### Performance Requirements
- [x] 1000 files load in <100ms
- [x] Scrolling maintains 60 FPS
- [x] Memory usage stays constant O(1)
- [x] No frame drops during status updates

### Visual Requirements
- [x] Matches DocumentTable design system
- [x] Column widths are appropriate
- [x] Spacing and padding consistent
- [x] Hover states work correctly
- [x] Typography matches DocumentTable

---

## Dependencies

### NPM Packages
```bash
npm install @tanstack/vue-virtual
```

### Internal Dependencies
- `DocumentTable.css` - Base styling reference
- `useColumnResize.js` - For Phase 5 (not needed yet)
- `useColumnSort.js` - For Phase 5 (not needed yet)

---

## Rollout Plan

### Development Steps
1. **Day 1:** Create component structure, basic table layout
2. **Day 2:** Implement virtual scrolling, status system
3. **Day 3:** Build footer, styling to match DocumentTable
4. **Day 4:** Testing, performance optimization, integration

### Testing Steps
1. Unit tests for all components
2. Component tests for virtual scrolling
3. Performance benchmarks
4. Manual testing with various queue sizes
5. Browser compatibility testing

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
| Memory leaks with large queues | Low | High | Proper cleanup in onUnmounted |
| FPS drops on low-end devices | Medium | Medium | Reduce overscan, optimize rendering |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by new table layout | Low | Medium | Clear migration communication |
| Empty action buttons look broken | Low | Low | Add disabled state styling |

---

## Next Phase Preview

**Phase 2:** Core Actions (cancel, undo, immediate upload)
- Cancel button implementation
- Undo functionality
- Upload Now button
- Duplicate promotion algorithm

This phase builds directly on Phase 1's table structure.

---

## Notes

- Keep old FileUploadQueue.vue as backup during development
- Document any deviations from plan
- Track actual performance metrics vs targets
- Capture screenshots for documentation

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
