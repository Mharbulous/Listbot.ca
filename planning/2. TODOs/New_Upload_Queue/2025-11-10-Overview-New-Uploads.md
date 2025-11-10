# New Upload Queue - Development Overview

**Created:** 2025-11-10
**Status:** Planning
**Route:** `/testing` (coexists with old `/upload` during development)

---

## Executive Summary

Transform the upload queue from a card-based list into a high-performance table-based interface matching the DocumentTable design system. Each phase delivers incremental, user-visible improvements while maintaining full functionality.

---

## Core Design Principles

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

## Phase Breakdown

### **Phase 1: Foundation - Table Structure with Virtual Scrolling**
**Goal:** Replace card-based list with performant table layout
**Deliverable:** Working table with basic columns and virtual scrolling
**User Impact:** Dramatically faster queue display, smoother scrolling

#### 1.1 Core Table Structure
- Implement DocumentTable-based component structure
- TanStack Vue Virtual integration for row virtualization
- Sticky header with consistent styling
- Footer status bar

#### 1.2 Column Definitions
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ Actions      │ File Name         │ Size     │ Status          │ Folder Path  │ Cancel │
├──────────────┼───────────────────┼──────────┼─────────────────┼──────────────┼────────┤
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
│ [👁️] [⬆️]   │ report.docx       │ 890 KB   │ 🟡 Uploading... │ /Reports     │  [❌]  │
│ [—] [—]     │ form.pdf          │ 1.2 MB   │ 🟢 Uploaded     │ /Forms       │  [—]  │
│ [—] [—]     │ contract.pdf      │ 1.2 MB   │ 🟠 Duplicate    │ /Forms       │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

**Columns:**
1. **Actions** (100px) - Functional actions (Peek, Upload Now)
2. **File Name** (300px) - Primary identifier
3. **Size** (100px) - File size formatted
4. **Status** (180px) - Colored dot + text label
5. **Folder Path** (300px) - Source folder from webkitRelativePath
6. **Cancel** (80px) - Destructive action isolated on far right

#### 1.3 Status System
**7-Color Status Indicators** (dot + text):
- 🔵 **Ready** - Queued, ready for upload
- 🟡 **Uploading...** - Currently being uploaded
- 🟢 **Uploaded** - Successfully uploaded to storage
- 🟠 **Duplicate** - Detected as duplicate, will be skipped
- 🔴 **Failed** - Upload failed with error
- ⚪ **Metadata Only** - Upload metadata only (no storage)
- ⚫ **Unknown** - Unknown status (fallback)

#### 1.4 Footer Status Bar
Replace badge system with compact footer:
```
┌────────────────────────────────────────────────────────────────────────┐
│ Total: 720 files (380.3 MB) • Ready: 715 • Duplicates: 5 • Failed: 0  │
│ • Uploaded: 0/715                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

Updates in real-time without DOM thrashing.

#### 1.5 Virtual Scrolling Implementation
- Only render visible rows + 5 overscan
- Constant memory usage O(1)
- Smooth 60 FPS scrolling
- Handle 100,000+ files

**Success Criteria:**
- ✅ Table displays with all columns
- ✅ Virtual scrolling works smoothly (60 FPS)
- ✅ Status footer shows live counts
- ✅ Basic styling matches DocumentTable
- ✅ 1000+ files load in <100ms

---

### **Phase 2: Core Actions - Cancel, Undo, Immediate Upload**
**Goal:** Implement essential file management actions
**Deliverable:** Full file control with cancel/undo and immediate uploads
**User Impact:** Users can manage individual files in queue

#### 2.1 Cancel Action (Far Right Column)
**Behavior:**
1. User clicks ❌ Cancel button in far right column
2. Row displays with crossed-out faded text
3. All action buttons disabled (—)
4. Cancel button replaced with 🔄 Undo button
5. Status changes to "Cancelled" (grayed out dot)
6. File excluded from upload count in footer

**Visual State:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [—] [—]     │ ~~invoice.pdf~~   │ 2.4 MB   │ ⚪ Cancelled    │ /2024/Tax    │  [🔄]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

**CSS Implementation:**
```css
.cancelled-row {
  opacity: 0.5;
  text-decoration: line-through;
}
.cancelled-row .action-button {
  cursor: not-allowed;
  pointer-events: none;
}
```

#### 2.2 Undo Action
**Behavior:**
1. User clicks 🔄 Undo button
2. Row returns to normal state
3. Action buttons re-enabled
4. Status returns to previous state
5. Undo button replaced with ❌ Cancel button
6. File re-included in upload count

#### 2.3 Duplicate Promotion on Cancel
**Algorithm:**
When a file is cancelled:
1. Check if file has duplicates (same hash)
2. If duplicates exist, find next oldest (earliest sourceLastModified)
3. Promote oldest duplicate to "original" status
4. Update status from 🟠 Duplicate → 🔵 Ready
5. Move promoted file to position where cancelled file was
6. Update footer counts accordingly

**Example:**
```
Before Cancel:
Row 5: original.pdf    [Status: Ready]     ← User cancels this
Row 6: original (1).pdf [Status: Duplicate]
Row 7: original (2).pdf [Status: Duplicate]

After Cancel:
Row 5: ~~original.pdf~~     [Status: Cancelled]  [Undo]
Row 6: original (1).pdf      [Status: Ready]      ← Promoted
Row 7: original (2).pdf      [Status: Duplicate]
```

#### 2.4 Immediate Upload Action (⬆️ Button)
**Behavior:**
1. User clicks ⬆️ Upload Now button in Actions column
2. File immediately begins upload (jumps queue)
3. Status changes to 🟡 Uploading...
4. Upload Now button disabled during upload
5. On completion: Status → 🟢 Uploaded
6. On failure: Status → 🔴 Failed (can retry)

**Use Case:** Upload critical documents first without waiting for full queue.

**Implementation Notes:**
- Uses same upload logic as batch upload
- Respects pause state (if paused, queues for next resume)
- Updates footer counts in real-time

**Success Criteria:**
- ✅ Cancel button works, shows crossed-out row
- ✅ Undo button restores row to original state
- ✅ Cancelling original promotes next duplicate
- ✅ Upload Now button uploads single file immediately
- ✅ Footer counts update correctly for all actions

---

### **Phase 3: Duplicate Management - Smart Display & Swapping**
**Goal:** Intelligent duplicate handling with "Use this file" functionality
**Deliverable:** Duplicates grouped below originals with swap capability
**User Impact:** Users can choose which version of duplicate files to upload

#### 3.1 Duplicate Grouping
**Display Logic:**
- Duplicates displayed immediately below their original
- Indentation or visual indicator shows grouping
- Original marked with 🔵 Ready, duplicates with 🟠 Duplicate

**Example:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
│ [👁️] [↔️]   │   ↳ invoice (1).pdf│ 2.4 MB   │ 🟠 Duplicate    │ /2024/Backup │  [❌]  │
│ [👁️] [↔️]   │   ↳ invoice (2).pdf│ 2.4 MB   │ 🟠 Duplicate    │ /Archive     │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

#### 3.2 "Use This File" Action (↔️ Button)
**Behavior:**
1. Duplicate has ↔️ "Use this file" button in Actions column
2. User clicks ↔️ button on duplicate
3. Files swap roles:
   - Clicked duplicate becomes 🔵 Ready (new original)
   - Previous original becomes 🟠 Duplicate
4. Rows swap positions in table
5. Smooth animation for swap transition

**Swap Algorithm:**
```javascript
function swapOriginalWithDuplicate(duplicateFile, originalFile) {
  // 1. Swap statuses
  originalFile.status = 'duplicate';
  duplicateFile.status = 'ready';

  // 2. Swap positions in array
  const originalIndex = files.indexOf(originalFile);
  const duplicateIndex = files.indexOf(duplicateFile);
  [files[originalIndex], files[duplicateIndex]] =
    [files[duplicateIndex], files[originalIndex]];

  // 3. Update footer counts (no change, just swapped roles)

  // 4. Trigger re-render with animation
}
```

**Use Case:** User realizes the "duplicate" has a better folder path or more recent modified date than the original.

#### 3.3 Visual Hierarchy
- Original file: Standard row styling
- Duplicate file: Slightly indented with "↳" prefix or subtle background color
- Group border: Light border around duplicate group

**Success Criteria:**
- ✅ Duplicates display immediately below original
- ✅ Visual grouping is clear and intuitive
- ✅ "Use this file" button swaps original/duplicate roles
- ✅ Rows swap positions smoothly with animation
- ✅ Footer counts remain accurate after swap

---

### **Phase 4: Simplified Upload Initiation - Three-Button System**
**Goal:** Remove folder options modal, streamline upload initiation
**Deliverable:** Direct upload actions with no blocking dialogs
**User Impact:** Faster workflow, fewer clicks to start uploads

#### 4.1 Replace Folder Options Modal
**Current:** Drag folder → Modal appears → Select option → Click Continue → Queue loads

**New:** Direct initiation with three buttons

**UI Changes:**
```
Current Buttons:
┌─────────────────┬─────────────────┐
│  Browse Files   │  Browse Folder  │
└─────────────────┴─────────────────┘

New Buttons:
┌──────────────┬───────────────┬─────────────────────────────┐
│ Upload Files │ Upload Folder │ Upload Folder + Subfolders  │
└──────────────┴───────────────┴─────────────────────────────┘
```

**Button Behaviors:**

**1. Upload Files**
- Opens file picker (multi-select enabled)
- User selects multiple individual files
- Files immediately added to queue
- No modal, no confirmation

**2. Upload Folder**
- Opens folder picker (webkitdirectory)
- Processes **root folder only** (no recursion)
- Files immediately added to queue
- No modal, no confirmation

**3. Upload Folder + Subfolders**
- Opens folder picker (webkitdirectory)
- Processes **all subfolders recursively**
- Files immediately added to queue
- No modal, no confirmation

#### 4.2 Remove Time Estimate from UI
- Time estimates calculated for performance monitoring
- Log to console: `console.log('[PERFORMANCE] Estimated queue time: 1.6s')`
- User sees instant queue population instead of estimate
- Focus on speed rather than prediction

#### 4.3 Queueing Progress Indicator
**For large folders (>500 files):**
Show non-blocking progress at top of table:
```
┌────────────────────────────────────────────────────────────┐
│  Queueing files... (324/720 analyzed)                      │
│  ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░                          │
└────────────────────────────────────────────────────────────┘
```

- Does not block interaction
- Can scroll through already-queued files
- Disappears when complete

#### 4.4 Drag-and-Drop Simplification
- Detect if dropped item is folder structure
- If single file or flat files → add to queue
- If folder structure detected:
  - Show inline choice: "○ Folder only  ● Include subfolders"
  - Default to "Include subfolders" (pre-selected)
  - User can change before continuing
  - Non-modal, appears above table

**Success Criteria:**
- ✅ Three distinct upload buttons work correctly
- ✅ No modal blocks user workflow
- ✅ Time estimate logged to console only
- ✅ Queueing progress shown for large batches
- ✅ Drag-and-drop simplified with inline option

---

### **Phase 5: Column Management - Sort & Reorder**
**Goal:** Add DocumentTable column management features
**Deliverable:** Sortable, reorderable, resizable columns
**User Impact:** Users can organize queue view to their preference

#### 5.1 Column Sorting
**Behavior:**
- Click column header to sort
- First click: Ascending (↑)
- Second click: Descending (↓)
- Third click: Clear sort (return to original order)
- Visual indicator shows sort direction

**Sortable Columns:**
- File Name (alphabetical)
- Size (numerical)
- Status (by status priority)
- Folder Path (alphabetical)

**Upload Order Consideration:**
When user starts upload, files upload **in currently displayed order** (respecting sort).

**Algorithm:**
```javascript
// On "Start Upload" button click:
function startUpload() {
  // 1. Get current displayed order (after sort applied)
  const uploadOrder = getVisibleRowOrder();

  // 2. Upload files in this order
  for (const file of uploadOrder) {
    if (file.status === 'ready') {
      await uploadFile(file);
    }
  }
}
```

**Edge Case:** User changes sort mid-upload
- Maintain current upload sequence
- Show warning: "Sort order change will apply to remaining files"
- Files already uploaded/uploading continue unchanged
- Remaining files reorder per new sort

#### 5.2 Column Drag-and-Drop Reordering
**Implementation:**
- Drag handle icon in column headers (like DocumentTable)
- Drag column header to new position
- Visual feedback during drag (placeholder, drag ghost)
- Drop to reorder columns
- Persist order in localStorage

**Restrictions:**
- Actions column: Fixed left position (cannot move)
- Cancel column: Fixed right position (cannot move)
- Other columns: Freely reorderable

#### 5.3 Column Resizing
**Implementation:**
- Resize handle on column borders
- Drag to resize column width
- Minimum width: 80px
- Persist widths in localStorage

#### 5.4 Column Visibility Toggle
**Deferred to Future Phase** (YAGNI for upload queue with only 6 columns)
- All columns always visible
- No "Cols" button needed (unlike DocumentTable with 50+ columns)

**Success Criteria:**
- ✅ Clicking column headers sorts table
- ✅ Sort indicator shows direction
- ✅ Files upload in currently sorted order
- ✅ Columns can be reordered via drag-and-drop
- ✅ Column widths resizable and persisted
- ✅ Actions and Cancel columns stay fixed

---

### **Phase 6: Performance Optimizations - Speed & Scale**
**Goal:** Maximize performance for large batches
**Deliverable:** Sub-second queue loads, parallel processing
**User Impact:** Handle 10,000+ files smoothly

#### 6.1 Batch Status Updates
**Problem:** Individual status changes cause layout thrashing

**Solution:** Group updates in animation frames
```javascript
// Instead of updating each file immediately
const pendingUpdates = [];

function updateFileStatus(file, newStatus) {
  file.status = newStatus;
  pendingUpdates.push(file);
}

// Batch apply in next frame
requestAnimationFrame(() => {
  if (pendingUpdates.length > 0) {
    // Trigger single re-render for all changes
    updateTable(pendingUpdates);
    pendingUpdates.length = 0;
  }
});
```

**Impact:** Maintain 60 FPS during active uploads

#### 6.2 Web Worker Hash Parallelization
**Current:** Single worker hashes files sequentially

**New:** Worker pool matching CPU cores
```javascript
const workerCount = navigator.hardwareConcurrency || 4;
const workerPool = Array.from(
  { length: workerCount },
  () => new Worker('fileHashWorker.js')
);

// Round-robin distribution
files.forEach((file, i) => {
  const worker = workerPool[i % workerCount];
  worker.postMessage({ file });
});
```

**Impact:** 2-4x faster hash calculation on multi-core systems

#### 6.3 Smart Deduplication Cache
**Current:** Query database for each file's hash individually (N queries)

**New:** Bulk prefetch all hashes for matter (1 query)
```javascript
// On page load or queue initialization:
const existingHashes = await fetchAllHashesForMatter(firmId, matterId);
const hashSet = new Set(existingHashes);

// O(1) lookups during processing:
files.forEach(file => {
  file.isDuplicate = hashSet.has(file.hash);
});
```

**Impact:** 10-50x faster duplicate detection

#### 6.4 Progressive Queue Loading
**For very large batches (>5000 files):**

**Strategy:**
1. Display first 100 files instantly (<50ms)
2. Load remaining files in background (chunks of 500)
3. Update table progressively as chunks complete
4. User can start reviewing while loading continues

**Implementation:**
```javascript
async function loadLargeQueue(files) {
  // Phase 1: Instant display
  const firstBatch = files.slice(0, 100);
  displayFiles(firstBatch);

  // Phase 2: Background chunks
  for (let i = 100; i < files.length; i += 500) {
    const chunk = files.slice(i, i + 500);
    await processChunk(chunk);
    appendFiles(chunk);
    await nextTick(); // Allow UI to breathe
  }
}
```

**Success Criteria:**
- ✅ Status updates batched in animation frames
- ✅ Multiple web workers hash files in parallel
- ✅ Duplicate detection uses single bulk query
- ✅ Large queues (5000+ files) load progressively
- ✅ 60 FPS maintained during all operations
- ✅ Memory usage stays constant O(1)

---

### **Phase 7: Real-Time Dashboard - Queue & Upload Progress**
**Goal:** Unified progress display for queueing and uploading
**Deliverable:** Live dashboard showing current operation status
**User Impact:** Always know what's happening and how long it will take

#### 7.1 Dashboard Header Component
**Persistent header above table showing current operation:**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Queueing files... (45% complete)                                      │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░                            │
│  324/720 files • 5.2 files/s • 1m 23s remaining                        │
│  [Cancel]                                                               │
└────────────────────────────────────────────────────────────────────────┘
```

**States:**

**1. Queueing State** (during file analysis & hashing)
```
Queueing files... (45% complete)
━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░
324/720 files • 5.2 files/s • 1m 23s remaining
[Cancel Queue]
```

**2. Uploading State** (during file upload)
```
Uploading... (62% complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░
446/720 files • 2.3 MB/s • 3m 45s remaining
[Pause Upload]
```

**3. Paused State**
```
Upload paused (62% complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░
446/720 files uploaded • 274 remaining
[Resume Upload]
```

**4. Complete State** (auto-hide after 5 seconds)
```
Upload complete! ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
720/720 files • 715 uploaded, 5 duplicates skipped
[Clear Queue]
```

#### 7.2 Real-Time Metrics
**Calculations:**

**Queueing:**
- Files/second: Rolling average over last 10 files
- Time remaining: (remaining files) / (files/second)
- Progress: (processed files) / (total files)

**Uploading:**
- MB/second: Rolling average over last 5 uploads
- Time remaining: (remaining MB) / (MB/second)
- Progress: (uploaded files) / (uploadable files)

**Update Frequency:**
- Progress bar: Every 100ms
- Text metrics: Every 500ms
- Use debouncing to prevent excessive re-renders

#### 7.3 Non-Blocking Design
**Key Principles:**
- Dashboard does not block interaction with table
- Can scroll, sort, cancel files while operations run
- Dashboard sticks to top of viewport
- Collapsible option for more screen space

#### 7.4 Error Handling Display
**If errors occur during queue/upload:**
```
Upload in progress... (45% complete) — 3 errors
━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░
324/720 files • 2.1 MB/s • 3 failed uploads
[Pause] [View Errors]
```

**Success Criteria:**
- ✅ Dashboard shows during queueing operations
- ✅ Dashboard shows during upload operations
- ✅ Real-time metrics update smoothly
- ✅ Progress bar accurately reflects completion
- ✅ Non-blocking, user can interact with table
- ✅ Auto-hides on completion after 5 seconds

---

### **Phase 8: File Preview Integration (Low Priority)**
**Goal:** Add document peek functionality from DocumentTable
**Deliverable:** Hover/click preview of files before upload
**User Impact:** Verify file contents before committing to upload

#### 8.1 Peek Button Implementation
**Add 👁️ Eye button to Actions column:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

**Behavior:**
- Click 👁️ button → Preview modal opens
- Shows thumbnail/first page for PDFs
- Shows preview for images
- Shows metadata for other file types
- Uses DocumentTable's DocumentPeekTooltip component

#### 8.2 Preview Modal Features
**For PDFs:**
- First page thumbnail
- Page navigation arrows
- Page count display
- "View Full Document" button

**For Images:**
- Full image preview
- Zoom controls
- Image metadata (dimensions, format)

**For Other Files:**
- File icon
- Metadata: Size, type, modified date
- "Cannot preview this file type" message

#### 8.3 Performance Considerations
**Lazy Loading:**
- Generate thumbnails only when requested
- Cache thumbnails in memory during session
- Use FileReader API for local file access
- No server upload needed for preview

**Implementation:**
```javascript
async function generateThumbnail(file) {
  if (file.type === 'application/pdf') {
    // Use PDF.js to render first page
    return await renderPDFThumbnail(file);
  } else if (file.type.startsWith('image/')) {
    // Use FileReader to load image
    return await loadImagePreview(file);
  } else {
    // Return file icon
    return getFileIcon(file.type);
  }
}
```

#### 8.4 Reuse DocumentTable Components
- Import DocumentPeekTooltip component
- Adapt for local File objects (not Firestore documents)
- Reuse all styling and interactions
- Maintain visual consistency

**Success Criteria:**
- ✅ Eye button appears in Actions column
- ✅ Clicking eye button opens preview modal
- ✅ PDFs show first page thumbnail
- ✅ Images show full preview
- ✅ Other files show metadata
- ✅ Previews load quickly (<500ms)
- ✅ Modal design matches DocumentTable peek

---

## Implementation Guidelines

### Code Organization
```
src/features/upload/
├── components/
│   ├── UploadTable.vue              (Main table component)
│   ├── UploadTableRow.vue           (Individual row)
│   ├── UploadDashboard.vue          (Progress header)
│   ├── UploadFooter.vue             (Status footer)
│   ├── FilePreviewModal.vue         (Phase 8)
│   └── UploadButtons.vue            (Three-button system)
├── composables/
│   ├── useUploadTable.js            (Table state & logic)
│   ├── useFileActions.js            (Cancel, undo, swap, upload now)
│   ├── useDuplicateManagement.js    (Grouping, promotion)
│   ├── useColumnManagement.js       (Sort, reorder, resize)
│   ├── useUploadProgress.js         (Dashboard metrics)
│   └── useFilePreview.js            (Phase 8)
└── utils/
    ├── fileProcessing.js            (Hash, analyze)
    ├── duplicateDetection.js        (Cache, grouping)
    └── uploadHelpers.js             (Formatting, validation)
```

### Styling Consistency
- **Reuse DocumentTable.css** as base
- Create UploadTable.css for upload-specific styles
- Maintain same color palette, spacing, typography
- Match header, footer, row styling exactly

### Testing Strategy
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

### Backwards Compatibility
- Old upload page remains at `/upload` route
- New upload page at `/testing` route
- Both pages functional during development
- Migration strategy defined before deprecating old page

---

## Phase Delivery Schedule

### Week 1: Foundation
- **Phase 1:** Table structure with virtual scrolling
- **Phase 2:** Core actions (cancel, undo, upload now)

### Week 2: Duplicate Management & Simplification
- **Phase 3:** Duplicate grouping and swapping
- **Phase 4:** Simplified upload initiation (three buttons)

### Week 3: Polish & Performance
- **Phase 5:** Column management (sort, reorder, resize)
- **Phase 6:** Performance optimizations (workers, cache, batching)
- **Phase 7:** Real-time dashboard

### Week 4: Preview (Optional)
- **Phase 8:** File preview integration

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
| Three-button system not intuitive | Low | High | Clear button labels, hover descriptions |

---

## Open Questions

1. **Column Persistence:** Should column order/widths persist globally or per-user?
   - **Decision:** Per-user (same as DocumentTable)

2. **Upload Order:** Should we allow manual row drag-to-reorder?
   - **Decision:** No (YAGNI), rely on column sort instead

3. **Duplicate Threshold:** What constitutes "oldest" for promotion?
   - **Decision:** Earliest sourceLastModified timestamp

4. **Preview Scope:** Include video/audio preview?
   - **Decision:** Phase 8 (low priority), start with PDFs and images only

5. **Cancel Persistence:** Should cancelled files stay in view or be hidden?
   - **Decision:** Stay in view with visual state, removable via "Clear Queue"

---

## Related Documentation

- **Old Upload Page:** `/docs/2025-11-10-Old-Upload-Page.md`
- **New Upload Page Plan:** `/docs/2025-11-10-New-Upload-Page.md`
- **DocumentTable Architecture:** `/docs/front-end/DocumentTable.md`
- **File Lifecycle:** `/docs/architecture/file-lifecycle.md`
- **File Processing:** `/docs/architecture/file-processing.md`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-10 | Initial planning document | Claude |

---

**Next Steps:**
1. Review and approve this overview
2. Break down each phase into individual implementation files
3. Set up development branch: `claude/new-upload-queue`
4. Begin Phase 1 implementation
