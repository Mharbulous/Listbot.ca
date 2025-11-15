# New Upload Queue - Development Overview

**Created:** 2025-11-10
**Status:** Planning
**Route:** `/testing` (coexists with old `/upload` during development)

---

## Executive Summary

Transform the upload queue from a card-based list into a high-performance table-based interface matching the DocumentTable design system. Each phase delivers incremental, user-visible improvements while maintaining full functionality.

---

## Core Design Principles

These principles apply across all 8 phases:

1. **Visual Consistency:** Match DocumentTable design language exactly
2. **Performance First:** Virtual scrolling, batch updates, worker parallelization
3. **Incremental Delivery:** Each phase is shippable and testable
4. **User Control:** Cancel/undo, file prioritization, immediate uploads
5. **Smart Defaults:** Simplified upload initiation, intelligent duplicate handling

---

## Target Performance Metrics

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Initial Queue Display | 2-5s (1000 files) | <100ms | Virtual scrolling |
| Scroll FPS | 15-30 FPS | 60 FPS | TanStack Virtual |
| Hash Processing | Sequential | Parallel | Worker pool |
| Duplicate Detection | N queries | 1 bulk query | Prefetch cache |
| Memory Usage | O(n) | O(1) | Virtual rows |
| Max Files Supported | ~1000 | 100,000+ | All optimizations |

---

## Phase Overview & Detailed Documents

### **Incremental Value Delivery**

Each phase delivers a demonstrable improvement to users:

1. **"Look, I can upload files and see them in a table!"**
2. **"Now I can cancel uploads and undo mistakes!"**
3. **"Now duplicates are grouped together intelligently!"**
4. **"Now I can sort and organize my columns!"**
5. **"Now I can see real-time progress metrics!"**
6. **"Look how much faster it is now - watch the dashboard metrics!"**
7. **"Now I can preview files before they finish uploading!"**

---

### **Phase 1.0: Foundation - Upload + Basic Table**
**Duration:** 3-4 days | **Priority:** Critical | **Dependencies:** None

**Deliverable:** Complete upload-to-display pipeline with two upload buttons, drag-and-drop, standard table rendering, status system, and footer.

**Key Features:**
- Two upload buttons (Files, Folder + Subfolders) - root-only option removed per research/2025-11-11-RemoveExcludeSubfoldersOption.md
- Drag-and-drop zone with recursive folder traversal
- DocumentTable-based component structure with standard rendering
- 9-status system (Ready, Uploading, Uploaded, Skip, Duplicate, Failed, N/A, Metadata Only, Unknown)
- Sticky header and reactive footer status bar
- Non-blocking queue progress indicator for large batches (>500 files)
- Works well for <500 files (performance optimization in Phase 1.5)
- Unsupported file type handling (N/A status with ⛔ emoji)
- Eyeball icon (👁️) file preview (implemented early - opens in browser tab)

**📄 Detailed Implementation:** See `2025-11-10-Phase1.0-Foundation.md`
- Two-button upload system with file input types (files, folder-recursive)
- Drag-and-drop with recursive folder extraction (matches "Folder + Subfolders" behavior)
- ~~Root-only filtering logic for "Upload Folder" button~~ (removed - see research doc)
- Column specifications and widths
- Status system implementation (colors, dots, text)
- Footer reactive counts calculation
- Standard table rendering (no virtualization yet)
- Component structure and file organization

---

### **Phase 1.5: Virtualization with TanStack**
**Duration:** 2-3 days | **Priority:** High | **Dependencies:** Phase 1.0 complete and bug-free

**Deliverable:** Virtualized table with constant O(1) memory usage and 60 FPS scrolling for 1000+ files.

**Why separate:** Ensures core functionality works before adding virtualization complexity. Provides clear before/after performance metrics.

**Key Features:**
- TanStack Vue Virtual integration
- Handle 100,000+ files with <100ms load time
- Constant memory usage regardless of file count
- Smooth 60 FPS scrolling
- All Phase 1.0 functionality preserved

**📄 Detailed Implementation:** See `2025-11-10-Phase1.5-Virtualization.md`
- Virtual scrolling setup with TanStack Virtual
- useVirtualScroll composable
- Performance benchmarks and comparisons
- Regression testing requirements

---

### **Phase 2: Core Actions - Cancel, Undo, Immediate Upload**
**Duration:** 3-4 days | **Priority:** High | **Dependencies:** Phase 1

**Deliverable:** Working cancel/undo functionality, duplicate promotion, and immediate upload button.

**Key Features:**
- Cancel button with visual crossed-out state and undo capability
- Duplicate promotion algorithm (promotes next oldest when original cancelled)
- Immediate upload button (⬆️) to bypass batch queue
- All actions update footer counts in real-time

**📄 Detailed Implementation:** See `2025-11-10-Phase2-UploadActions.md`
- Cancel/undo state management and CSS styling
- Duplicate promotion algorithm (by sourceLastModified)
- Immediate upload logic and error handling
- Integration with upload orchestration

---

### **Phase 3: Duplicate Management - Smart Display & Swapping**
**Duration:** 3-4 days | **Priority:** High | **Dependencies:** Phases 1, 2

**Deliverable:** Visual grouping of duplicates with "Use this file" swap functionality.

**Key Features:**
- Duplicates displayed immediately below originals with indentation
- "Use This File" button (↔️) swaps original/duplicate roles
- Visual hierarchy with purple tint and arrow prefix
- Smooth swap animation with row position changes

**📄 Detailed Implementation:** See `2025-11-10-Phase3-DuplicateManagement.md`
- Grouping algorithm (by hash) and display order
- Swap logic with position reordering
- Visual styling (indentation, colors, animations)
- Integration with Phase 2 cancel/promotion

---

### **Phase 4: Column Management - Sort, Reorder, Resize**
**Duration:** 3-4 days | **Priority:** Medium | **Dependencies:** Phase 1

**Deliverable:** Sortable, reorderable, resizable columns matching DocumentTable.

**Key Features:**
- Click column headers to sort (asc → desc → clear)
- Drag-and-drop column reordering (except Actions and Cancel columns)
- Resize columns with mouse drag (min width 80px)
- Files upload in currently sorted order
- Column state persisted to localStorage

**📄 Detailed Implementation:** See `2025-11-10-Phase4-ColumnManagement.md`
- Sort algorithm for alphabetical, numerical, and status types
- Drag-and-drop reordering with restrictions
- Resize implementation with mouse handlers
- Upload order respects current sort
- Mid-upload sort change handling

---

### **Phase 5: Real-Time Dashboard - Queue & Upload Progress** ⬆️ **MOVED UP**
**Duration:** 3-4 days | **Priority:** High | **Dependencies:** Phase 1

**Why moved earlier:** Creates measurement baseline for Phase 6 optimizations. Users can see "before" performance metrics, making the "after" improvements in Phase 6 quantifiable and dramatic.

**Deliverable:** Unified progress dashboard with real-time metrics.

**Key Features:**
- Persistent header showing current operation (queueing/uploading/paused/complete)
- Real-time metrics: files/s or MB/s, time remaining, progress percentage
- Non-blocking design (sticky at top, allows table interaction)
- Four states with distinct visuals and action buttons
- Auto-hide on completion after 5 seconds

**📄 Detailed Implementation:** See `2025-11-10-Phase5-RealTimeDashboard.md`
- Dashboard component with four state designs
- Metrics calculation (rolling averages for speed)
- Time remaining estimation algorithms
- State transition management
- Update frequency optimization (500ms intervals)

---

### **Phase 6: Performance Optimizations - Speed & Scale** ⬇️ **MOVED DOWN**
**Duration:** 3-4 days | **Priority:** High | **Dependencies:** Phases 1-5

**Why moved after dashboard:** Users can now SEE the performance improvement. Dashboard shows "47 files/s" before optimization, then "183 files/s (4 workers active)" after - creating a compelling before/after narrative.

**Deliverable:** Optimized performance infrastructure for large batches.

**Key Features:**
- Batch status updates using requestAnimationFrame (60 FPS maintenance)
- Web worker hash parallelization (2-4x speedup on multi-core)
- Smart deduplication cache (1 bulk query vs N queries)
- Progressive queue loading for 5000+ files (<100ms perceived load)

**📄 Detailed Implementation:** See `2025-11-10-Phase6-PerformanceOptimizations.md`
- Batch update queue with requestAnimationFrame
- Worker pool implementation matching CPU cores
- Deduplication cache with O(1) lookups
- Progressive loading strategy (instant + chunks)
- Performance benchmarks and logging

---

### **Phase 7: File Preview Integration** *(Low Priority - Optional)*
**Duration:** 3-4 days | **Priority:** Low | **Dependencies:** Phase 1

**Deliverable:** Preview modal with PDF thumbnails, image previews, and metadata.

**Key Features:**
- Eye button (👁️) in Actions column
- PDF preview with page navigation (using PDF.js)
- Image preview with optional zoom controls
- Metadata display for unsupported file types
- Reuses DocumentTable peek modal design

**📄 Detailed Implementation:** See `2025-11-10-Phase7-FilePreview.md`
- Preview modal component structure
- PDF thumbnail generation with PDF.js
- Image loading with FileReader API
- Metadata display for unsupported types
- Performance optimization (lazy loading, caching)

---

## Code Organization

All phases follow this structure:

```
src/features/upload/
├── components/
│   ├── UploadTable.vue              (Phase 1)
│   ├── UploadTableRow.vue           (Phase 1)
│   ├── UploadButtons.vue            (Phase 1)
│   ├── UploadFooter.vue             (Phase 1)
│   ├── UploadDashboard.vue          (Phase 5)
│   └── FilePreviewModal.vue         (Phase 7)
├── composables/
│   ├── useUploadTable.js            (Phase 1)
│   ├── useFileActions.js            (Phase 2)
│   ├── useDuplicateManagement.js    (Phase 3)
│   ├── useColumnManagement.js       (Phase 4)
│   ├── useUploadProgress.js         (Phase 5)
│   └── useFilePreview.js            (Phase 7)
└── utils/
    ├── fileProcessing.js            (Phase 6)
    ├── duplicateDetection.js        (Phase 6)
    └── uploadHelpers.js             (All phases)
```

---

## Testing Strategy

Each phase must include:

1. **Unit Tests:** Individual functions and composables
2. **Component Tests:** Vue component interactions
3. **Integration Tests:** Full workflow end-to-end
4. **Performance Tests:** Load time, FPS, memory benchmarks
5. **Manual Testing:** Real-world usage with test files

### Performance Monitoring

Log performance metrics for each operation:
```javascript
console.log('[PERFORMANCE] Queue initialization: 87ms');
console.log('[PERFORMANCE] Hash processing: 1.2s (4 workers, 720 files)');
console.log('[PERFORMANCE] Duplicate detection: 43ms (1 query, 720 files)');
console.log('[PERFORMANCE] Upload completion: 3m 24s (715 files, 380 MB)');
```

---

## Styling Consistency

- **Reuse DocumentTable.css** as base
- Create UploadTable.css for upload-specific styles
- Maintain same color palette, spacing, typography
- Match header, footer, row styling exactly

---

## Phase Delivery Schedule

### Week 1: Foundation
- **Phase 1.0:** Foundation - Upload + Basic Table (3-4 days)
- **Phase 1.5:** Virtualization with TanStack (2-3 days)

### Week 2: Core Actions & Duplicate Management
- **Phase 2:** Core actions (cancel, undo, upload now) (3-4 days)
- **Phase 3:** Duplicate grouping and swapping (3-4 days)

### Week 3: Column Management & Dashboard
- **Phase 4:** Column management (3-4 days)
- **Phase 5:** Real-time dashboard (3-4 days)

### Week 4: Performance & Optional Features
- **Phase 6:** Performance optimizations (3-4 days)
- **Phase 7:** File preview integration (optional, 3-4 days)

---

## Success Metrics

### Performance KPIs
- [ ] Queue displays 1000 files in <100ms
- [ ] Scrolling maintains 60 FPS
- [ ] Hash processing 2-4x faster with worker pool
- [ ] Duplicate detection <50ms for 1000 files
- [ ] Memory usage constant O(1) regardless of file count

### User Experience KPIs
- [ ] Upload initiation: 2 clicks (from 4+ clicks)
- [ ] File cancellation: 1 click + undo capability
- [ ] Duplicate management: Visual grouping + swap
- [ ] Column sorting: Instant feedback
- [ ] Progress visibility: Always visible, non-blocking

### Code Quality KPIs
- [ ] Test coverage >80%
- [ ] Zero console errors in normal operation
- [ ] All phases independently shippable
- [ ] DocumentTable visual consistency 100%
- [ ] Accessibility: WCAG 2.1 AA compliant

---

## Risk Mitigation

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with complex rows | Medium | High | Extensive testing with varying row heights |
| Worker pool browser compatibility | Low | Medium | Feature detection, fallback to single worker |
| Large file hash memory issues | Low | High | Stream-based hashing, memory monitoring |
| Sort mid-upload causes errors | Medium | Medium | Queue snapshot on upload start |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by duplicate grouping | Low | Medium | Clear visual hierarchy, tooltips |
| Cancel/undo not discoverable | Low | Medium | User testing, onboarding tooltips |
| Two-button system not intuitive | Low | Low | Clear button labels, matches industry standards |

---

## Backwards Compatibility

- Old upload page remains at `/upload` route
- New upload page at `/testing` route
- Both pages functional during development
- Migration strategy defined before deprecating old page

---

## Related Documentation

- **Old Upload Page:** `/docs/2025-11-10-Old-Upload-Page.md`
- **DocumentTable Architecture:** `/docs/front-end/DocumentTable.md`
- **File Lifecycle:** `/docs/architecture/file-lifecycle.md`
- **File Processing:** `/docs/architecture/file-processing.md`
- **Performance Analysis:** `/docs/testing/performance-analysis.md`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-10 | Initial planning document | Claude |
| 1.1 | 2025-11-10 | Restructured with phase references | Claude |
| 2.0 | 2025-11-10 | Reordered phases for optimal demonstrability | Claude |
| 2.1 | 2025-11-10 | Split Phase 1 into 1.0 and 1.5, added drag-and-drop documentation | Claude |

**Version 2.1 Changes:**
- **Phase 1.0:** Foundation with standard table rendering (new split from Phase 1)
- **Phase 1.5:** Virtualization layer added separately (new)
- **Drag-and-Drop:** Documented recursive folder traversal behavior (matches "Folder + Subfolders")
- **Rationale:** Splitting Phase 1 ensures core functionality works before virtualization complexity. Provides clear performance baseline for comparison.

**Version 2.0 Changes:**
- **Phase 1:** Merged old Phase 1 + Phase 4 into "Foundation (Upload + Table)"
- **Phase 4:** Column Management moved from Phase 5
- **Phase 5:** Real-Time Dashboard moved UP from Phase 7 (before optimizations)
- **Phase 6:** Performance Optimizations moved DOWN (after dashboard)
- **Phase 7:** File Preview (was Phase 8)
- **Rationale:** Each phase now demonstrates immediate value. Dashboard creates measurement baseline before optimizations, making performance improvements quantifiable.

---

**Next Steps:**
1. ✅ Review and approve this overview
2. Review individual phase documents for implementation details
3. Set up development branch: `claude/new-upload-queue`
4. Begin Phase 1 implementation
