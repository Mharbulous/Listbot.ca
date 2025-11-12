# Phase 3: File Copy Management (Deduplication)

**Phase:** 3 of 7
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 4-5 days
**Dependencies:** Phase 1 (Foundation), Phase 1.5 (Virtualization)

---

## Overview

Implement intelligent file copy/duplicate handling using a **two-phase deduplication approach** that hides expensive operations (hashing, database queries) behind unavoidable upload time. This architecture provides instant client-side feedback while minimizing CPU usage and database load.

**Goal:** Automatic copy detection and deduplication with optimal performance and UX feedback
**Deliverable:** Two-phase deduplication (client-side + upload), visual grouping, preview/completion modals, one-and-the-same filtering
**User Impact:** Users see instant deduplication feedback, understand what will be uploaded, and save storage space without manual intervention

**Architecture Reference:** This phase implements `@docs/architecture/client-deduplication-logic.md`

---

## Related Documentation

**IMPORTANT:** This planning document implements the architecture described in:

1. **`@docs/architecture/client-deduplication-logic.md`**
   - Complete architectural rationale and design philosophy
   - Detailed implementation guide with code examples
   - Performance optimization strategies
   - Common questions & answers

2. **`@docs/architecture/client-deduplication-stories.md`**
   - User stories and implementation requirements
   - Complete checklist of features to implement
   - UX enhancement requirements
   - Anti-requirements (what NOT to do)

3. **`@docs/architecture/file-lifecycle.md`**
   - Definitive guide to file terminology
   - File processing lifecycle stages
   - Required terminology for all code and UI

**Before implementing this phase, read all three documents above.**

---

## Terminology (CRITICAL)

**This phase uses precise deduplication terminology (from file-lifecycle.md):**

- **"Copy"** or **"Copies"**: Files with the same hash value but different file metadata
  - Example: `invoice.pdf` in `/2024/Tax` and `invoice (1).pdf` in `/2024/Backup` with same content
  - **Only ONE file content is uploaded** (to save storage)
  - **ALL metadata from ALL copies is saved** (for litigation discovery)
  - System automatically selects "best file" using priority rules (see 3.2)
  - Users CANNOT override which copy is uploaded

- **"One-and-the-Same"**: The exact same file selected multiple times (same hash, same metadata, same location)
  - Example: User drags the same folder twice, resulting in `invoice.pdf` appearing twice in queue
  - These are **silently filtered** from the queue (no user notification needed)
  - Only one instance remains in the queue

- **"Best File"**: The copy chosen for upload when multiple copies exist
  - Selected automatically using priority rules (earliest modified date, longest path, etc.)
  - This is a **UI-only decision** - identical hash = identical content
  - All other copies' metadata is still saved to database

**Visual Note:** Throughout this document, status emojis (🔵 🟡 🟢 🟣 ⚪ 🔴 🟠) are visual shorthand for planning purposes. The actual implementation uses CSS-styled colored dots (circles) with text labels. See `StatusCell.vue` for implementation details.

**Non-Negotiable Requirements:**
1. Users CANNOT cherry-pick which copy to upload (but CAN exclude entire copy groups from queue)
2. ALL metadata from ALL copies MUST be saved to database
3. Hash-based document IDs provide database-level deduplication

---

## Features

### 3.1 Client-Side Deduplication (Phase 1: Instant Feedback)
### 3.2 Best File Selection & Visual Grouping
### 3.3 Upload Phase Deduplication (Phase 2: Hidden During Upload)
### 3.4 UX Enhancements (Progress, Preview, Completion Modals)

---

## 3.1 Client-Side Deduplication (Phase 1: Instant Feedback)

This phase runs BEFORE user clicks upload and provides instant feedback without database queries.

### Step 1: Size-Based Pre-Filtering

**Optimization:** Files with unique sizes cannot be duplicates, so skip hashing them (saves 50-70% of CPU time).

```javascript
// useClientDeduplication.js - Step 1
const groupBySize = (files) => {
  const fileSizeGroups = new Map(); // size -> [file_references]

  files.forEach((file, index) => {
    const fileRef = {
      file,
      originalIndex: index,
      path: getFilePath(file),
      metadata: {
        sourceFileName: file.name,
        sourceFileSize: file.size,
        sourceFileType: file.type,
        lastModified: file.lastModified,
      },
    };

    if (!fileSizeGroups.has(file.size)) {
      fileSizeGroups.set(file.size, []);
    }
    fileSizeGroups.get(file.size).push(fileRef);
  });

  // Separate unique from potential duplicates
  const uniqueFiles = [];
  const duplicateCandidates = [];

  for (const [, fileRefs] of fileSizeGroups) {
    if (fileRefs.length === 1) {
      uniqueFiles.push(fileRefs[0]); // Definitely unique - skip hashing
    } else {
      duplicateCandidates.push(...fileRefs); // Need to hash these
    }
  }

  console.log(`[DEDUP] Unique by size: ${uniqueFiles.length}, Need hashing: ${duplicateCandidates.length}`);

  return { uniqueFiles, duplicateCandidates };
};
```

**Queue Sorting:** Sort by **folder path** (NOT size) for better UX. Sorting by size provides no performance benefit (grouping is O(n) regardless) and adds O(n log n) overhead.

```javascript
// Sort queue by folder path for better UX (group related files)
files.sort((a, b) => {
  const aPath = getFilePath(a);
  const bPath = getFilePath(b);
  return aPath.localeCompare(bPath);
});
```

### Step 2: Hash Duplicate Candidates (with Progress Feedback)

**Only hash files with matching sizes.**

```javascript
// useClientDeduplication.js - Step 2
const hashDuplicateCandidates = async (duplicateCandidates, onProgress) => {
  const hashGroups = new Map(); // hash -> [file_references]
  let processedCount = 0;
  const totalFiles = duplicateCandidates.length;

  for (const fileRef of duplicateCandidates) {
    try {
      // Hash using BLAKE3 in web worker (non-blocking)
      const hash = await generateFileHash(fileRef.file);
      fileRef.hash = hash;
      fileRef.status = 'ready';

      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash).push(fileRef);
    } catch (error) {
      // Hash failure - mark as read error
      fileRef.status = 'read error';
      fileRef.canUpload = false; // Disable checkbox
      console.error(`[DEDUP] Hash failed for ${fileRef.metadata.sourceFileName}:`, error);
    }

    processedCount++;

    // Update progress UI
    onProgress({
      phase: 'analyzing',
      current: processedCount,
      total: totalFiles,
      percentage: Math.round((processedCount / totalFiles) * 100),
      currentFile: fileRef.metadata.sourceFileName,
    });
  }

  return hashGroups;
};
```

**UI Display During Hashing:**
```
Analyzing files: 45 / 100 (45%)
Current: report_2024.pdf
```

### Step 3: One-and-the-Same Detection & Grouping

**Filter out files selected multiple times (silently, no popup).**

```javascript
// useClientDeduplication.js - Step 3
const detectOneAndTheSame = (hashGroups) => {
  const finalFiles = [];

  for (const [hash, fileRefs] of hashGroups) {
    if (fileRefs.length === 1) {
      finalFiles.push(fileRefs[0]); // Unique hash
      continue;
    }

    // Multiple files with same hash - check metadata
    const oneAndTheSameGroups = new Map(); // metadata_key -> [file_references]

    fileRefs.forEach((fileRef) => {
      // Metadata signature for detecting one-and-the-same
      const metadataKey = `${fileRef.metadata.sourceFileName}_${fileRef.metadata.sourceFileSize}_${fileRef.metadata.lastModified}`;

      if (!oneAndTheSameGroups.has(metadataKey)) {
        oneAndTheSameGroups.set(metadataKey, []);
      }
      oneAndTheSameGroups.get(metadataKey).push(fileRef);
    });

    // Process each metadata group
    for (const [, oneAndTheSameFiles] of oneAndTheSameGroups) {
      if (oneAndTheSameFiles.length > 1) {
        // One-and-the-same: User selected same file multiple times
        // Keep only first instance (others are silently filtered)
        finalFiles.push(oneAndTheSameFiles[0]);
        console.log(`[DEDUP] Filtered ${oneAndTheSameFiles.length - 1} one-and-the-same: ${oneAndTheSameFiles[0].metadata.sourceFileName}`);
      } else {
        // Unique metadata (copy with different name/date)
        finalFiles.push(oneAndTheSameFiles[0]);
      }
    }
  }

  return finalFiles;
};
```

---

## 3.2 Best File Selection & Visual Grouping

When multiple copies exist (same hash, different metadata), the system automatically selects the "best file" using priority rules.

### Priority Rules for Best File Selection

When multiple copies exist, choose the best file using these rules **in order**:

1. **Earliest modification date** - Older file is likely the original
2. **Longest folder path** - Deeper nesting suggests more organized structure
3. **Shortest filename** - Concise names preferred over verbose ones
4. **Alphanumeric sort** - Alphabetically first for consistency
5. **Original selection order** - First selected wins (stable sort)

```javascript
// useBestFileSelection.js
const chooseBestFile = (fileRefs) => {
  return fileRefs.sort((a, b) => {
    // Priority 1: Earliest modification date
    if (a.metadata.lastModified !== b.metadata.lastModified) {
      return a.metadata.lastModified - b.metadata.lastModified;
    }

    // Priority 2: Longest folder path
    const aFolderPath = a.path.substring(0, a.path.lastIndexOf('/') + 1);
    const bFolderPath = b.path.substring(0, b.path.lastIndexOf('/') + 1);
    if (aFolderPath.length !== bFolderPath.length) {
      return bFolderPath.length - aFolderPath.length; // Descending
    }

    // Priority 3: Shortest filename
    if (a.metadata.sourceFileName.length !== b.metadata.sourceFileName.length) {
      return a.metadata.sourceFileName.length - b.metadata.sourceFileName.length;
    }

    // Priority 4: Alphanumeric filename sort
    if (a.metadata.sourceFileName !== b.metadata.sourceFileName) {
      return a.metadata.sourceFileName.localeCompare(b.metadata.sourceFileName);
    }

    // Priority 5: Original selection order
    return a.originalIndex - b.originalIndex;
  })[0];
};
```

**Rationale:** Earliest modified date trumps all other factors. In document workflows, the earliest version is typically the original, and later versions are copies.

### Visual Grouping

**Copy groups display in queue with visual hierarchy:**

```
┌────────┬───────────────────┬──────────┬──────────────┬─────────┐
│ Select │ File Name         │ Size     │ Folder Path  │ Status  │
├────────┼───────────────────┼──────────┼──────────────┼─────────┤
│  [✓]   │ invoice.pdf       │ 2.4 MB   │ /2024/Tax    │ 🔵 Ready│  ← Best file (bold, left border)
│  [✓]   │ invoice (1).pdf   │ 2.4 MB   │ /2024/Backup │ 🟣 Copy │  ← Copy (normal font, left border)
│  [✓]   │ invoice (2).pdf   │ 2.4 MB   │ /Archive     │ 🟣 Copy │  ← Copy (normal font, left border)
│  [✓]   │ report.docx       │ 890 KB   │ /Reports     │ 🔵 Ready│  ← Unique file (bold, no border)
└────────┴───────────────────┴──────────┴──────────────┴─────────┘
```

**Visual Indicators:**

- **Best File (Will Upload):**
  - **Bold filename**
  - 🔵 Ready status (blue dot + "Ready" text)
  - Checkbox **checked** by default
  - Colored left border (3px solid purple) on entire row
  - Located at **top** of copy group

- **Copies (Metadata Only):**
  - **Normal filename** (regular font weight)
  - 🟣 Copy status (purple dot + "Copy" text)
  - Checkbox **checked** by default (can be unchecked to exclude from upload entirely)
  - Colored left border (3px solid purple) on entire row
  - Located **below** best file in group

- **Unique Files (No Copies):**
  - **Bold filename**
  - 🔵 Ready status
  - Checkbox checked by default
  - **No left border**

**Important:** Checkboxes on copies control whether to include/exclude the ENTIRE copy group from upload. Users CANNOT cherry-pick which copy to upload - they can only include or exclude all copies together.

### Checkbox Behavior

```javascript
// useCopyGrouping.js
const handleCopyGroupCheckbox = (file, isChecked, copyGroup) => {
  if (file.status === 'copy') {
    // User unchecked a copy - skip that individual copy's metadata
    file.status = isChecked ? 'copy' : 'skip';
  } else {
    // User unchecked the best file - skip entire group
    if (!isChecked) {
      copyGroup.forEach(f => f.status = 'skip');
    } else {
      // Restore group
      copyGroup.forEach((f, index) => {
        f.status = index === 0 ? 'ready' : 'copy';
      });
    }
  }
};
```

### CSS Styling

```css
/* Copy group left border (applies to ALL files in a copy group) */
.table-row.copy-group {
  border-left: 3px solid #9C27B0; /* Purple left border */
}

/* Best file - bold filename */
.table-row.best-file .filename-text {
  font-weight: 700; /* Bold */
}

/* Copy - normal filename */
.table-row.copy-file .filename-text {
  font-weight: 400; /* Normal */
}

/* Unique files (no copies) - bold by default */
.table-row .filename-text {
  font-weight: 700; /* Bold by default */
}
```

### StatusCell.vue - Add Copy Status

```javascript
// Status text mapping (add 'copy' status)
const statusTextMap = {
  ready: 'Ready',
  uploading: 'Uploading...',
  uploaded: 'Uploaded',
  copy: 'Copy',        // NEW: Purple dot for copies (metadata only)
  skip: 'Skip',
  'read error': 'Read Error',
  failed: 'Failed',
  unknown: 'Unknown',
  'n/a': 'N/A',
};

// CSS for copy status
.status-copy {
  background-color: #9C27B0; /* Purple */
}
```

---

## 3.3 Upload Phase Deduplication (Phase 2: Hidden During Upload)

This phase runs DURING upload and hides expensive operations (database queries) behind unavoidable file upload time.

**Key Principle:** Upload time is ~100x longer than hash+query time. By performing database operations DURING upload, users never notice the latency.

- Hashing a 10MB file: ~50ms
- Querying Firestore: ~100ms
- Uploading 10MB file: ~5-15 seconds

**Total overhead: ~150ms hidden in 5-15 seconds of upload time.**

### Hash-Based Document IDs

**BLAKE3 hash is used as Firestore document ID** - provides automatic database-level deduplication.

```javascript
// useUploadPhaseDeduplication.js
const uploadFile = async (fileRef) => {
  // Hash was already calculated in client-side phase (3.1)
  const documentId = fileRef.hash; // BLAKE3 hash is the document ID

  try {
    // Check if document exists (happens DURING upload, not before)
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // File already exists in database
      // Update metadata to add new source reference
      console.log(`[UPLOAD] File exists in DB: ${fileRef.metadata.sourceFileName}`);

      await updateDoc(docRef, {
        sources: arrayUnion({
          fileName: fileRef.metadata.sourceFileName,
          path: fileRef.path,
          lastModified: fileRef.metadata.lastModified,
          uploadedAt: serverTimestamp(),
        })
      });

      fileRef.status = 'uploaded';
    } else {
      // New file - upload to Storage and create Firestore document
      console.log(`[UPLOAD] New file, uploading: ${fileRef.metadata.sourceFileName}`);

      const storageRef = ref(storage, `documents/${documentId}`);
      await uploadBytes(storageRef, fileRef.file);

      await setDoc(docRef, {
        hash: documentId,
        size: fileRef.metadata.sourceFileSize,
        type: fileRef.metadata.sourceFileType,
        sources: [{
          fileName: fileRef.metadata.sourceFileName,
          path: fileRef.path,
          lastModified: fileRef.metadata.lastModified,
          uploadedAt: serverTimestamp(),
        }]
      });

      fileRef.status = 'uploaded';
    }

    // Upload copies (metadata only)
    for (const copy of fileRef.copies || []) {
      await updateDoc(docRef, {
        sources: arrayUnion({
          fileName: copy.metadata.sourceFileName,
          path: copy.path,
          lastModified: copy.metadata.lastModified,
          uploadedAt: serverTimestamp(),
        })
      });

      copy.status = 'uploaded';
    }
  } catch (error) {
    console.error(`[UPLOAD] Failed: ${fileRef.metadata.sourceFileName}:`, error);
    fileRef.status = 'failed';
    throw error;
  }
};
```

### Rationale

**Why hash-based document IDs?**
1. **Automatic deduplication** - Firestore prevents duplicate document IDs
2. **Deterministic** - Same file always gets same ID
3. **No race conditions** - Multiple users uploading same file won't create duplicates
4. **Fast lookups** - Direct document access by hash (no queries needed)

**Why query during upload, not before?**
1. **Hidden latency** - Query time is tiny compared to upload time
2. **Reduced database load** - No queries for files user might cancel
3. **Faster start** - Upload can begin immediately after client-side deduplication
4. **Simpler logic** - No need to coordinate database state with queue state

**BLAKE3 Collision Probability:**
- Probability: ~2^-128 (1 in 340 undecillion)
- Equivalent to hashing every atom in 100 Earth's worth of data
- **ACCEPTABLE RISK** - Far more likely that cosmic rays corrupt RAM during hashing

---

## 3.4 UX Enhancements (Progress, Preview, Completion Modals)

### Preview Modal (Before Upload)

**Show summary AFTER client-side deduplication, BEFORE upload begins.**

```javascript
const summary = {
  totalSelected: files.length,
  uniqueFiles: uniqueFiles.length,
  copies: files.filter(f => f.status === 'copy').length,
  oneAndTheSame: /* count of silently filtered files */,
  toUpload: files.filter(f => f.status === 'ready').length,
  metadataOnly: files.filter(f => f.status === 'copy').length,
  estimatedStorageSaved: /* calculate size of copies */,
};
```

**UI Display (Modal):**
```
┌─────────────────────────────────────┐
│ Upload Preview                      │
├─────────────────────────────────────┤
│ Files Selected:        150          │
│ Unique Files:          120          │
│ Copies Detected:       25           │
│ One-and-the-Same:      5 (filtered) │
├─────────────────────────────────────┤
│ To Upload:             120 files    │
│ Metadata Only:         25 files     │
│ Storage Saved:         ~450 MB      │
├─────────────────────────────────────┤
│         [Cancel]  [Confirm Upload]  │
└─────────────────────────────────────┘
```

**Important:**
- Display-only modal - no user override of deduplication decisions
- ALL file checkboxes should be DISABLED during upload phase to prevent unpredictable behavior
- Modal focuses user attention before upload begins

### Completion Modal (After Upload)

**Show summary AFTER upload completes.**

```javascript
const metrics = {
  filesUploaded: 120,
  filesCopies: 25,
  totalFiles: 145,
  storageSaved: calculateSize(copies),
  timeSaved: estimateTimeSaved(copies),
  deduplicationRate: (25 / 145 * 100).toFixed(1) + '%',
};
```

**UI Display (Modal after completion):**
```
┌─────────────────────────────────────┐
│ Upload Complete!                    │
├─────────────────────────────────────┤
│ 120 files uploaded                  │
│ 25 copies detected (metadata saved) │
├─────────────────────────────────────┤
│ Storage saved: 450 MB               │
│ Deduplication: 17.2%                │
├─────────────────────────────────────┤
│                [Close]              │
└─────────────────────────────────────┘
```

**Rationale:** Modal ensures users see the completion summary and understand what was accomplished.

### Status Names & Visual Indicators

**Status Progression:**

```javascript
const statusTextMap = {
  'pending': 'Pending',        // ⚪ Gray - Not yet analyzed
  'ready': 'Ready',            // 🔵 Blue - Ready to upload (unique or best file)
  'copy': 'Copy',              // 🟣 Purple - Copy detected (metadata only)
  'uploading': 'Uploading...',  // 🔵 Blue - Currently uploading
  'uploaded': 'Uploaded',      // 🟢 Green - Successfully uploaded
  'read error': 'Read Error',  // 🔴 Red - Hash/read failure (checkbox disabled)
  'failed': 'Failed',          // 🟠 Orange - Upload failed
  'skip': 'Skip',              // ⚪ Gray - User skipped
};
```

**Visual Icons & Colors:**
```javascript
const statusIcons = {
  'pending': '○',       // Gray circle - not yet analyzed
  'ready': '✓',         // Green checkmark - ready to upload
  'copy': '⚌',          // Blue parallel lines - copy detected
  'uploading': '↑',     // Up arrow - currently uploading
  'uploaded': '✓',      // Green checkmark - successfully uploaded
  'read error': '✗',    // Red X - hash/read failure
  'failed': '⚠',        // Orange warning - upload failed
  'skip': '○',          // Gray circle - skipped
};

const statusColors = {
  'pending': 'gray',
  'ready': 'green',
  'copy': 'blue',
  'uploading': 'blue',
  'uploaded': 'green',
  'read error': 'red',
  'failed': 'orange',
  'skip': 'gray',
};
```

### Error Handling for Hash Failures

```javascript
try {
  const hash = await generateFileHash(fileRef.file);
  fileRef.hash = hash;
} catch (error) {
  fileRef.status = 'read error';
  fileRef.canUpload = false; // Disable checkbox
  // Continue processing other files
}
```

**Behavior:**
- File status changes to `read error`
- Checkbox is disabled (same as .lnk and .tmp files)
- No special UI modal needed - the status and disabled checkbox are sufficient feedback

**Rationale:** Files without hashes cannot be uploaded (no document ID). Blocking with disabled checkbox prevents upload attempts that would fail.

---

## Implementation Tasks

**For complete user stories and requirements, see:** `@docs/architecture/client-deduplication-stories.md`

### Task Checklist

#### 3.1 Client-Side Deduplication
- [ ] Create `useClientDeduplication.js` composable
- [ ] Implement `groupBySize()` - size-based pre-filtering
- [ ] Implement `hashDuplicateCandidates()` - hash only matching sizes
- [ ] Implement `detectOneAndTheSame()` - filter duplicate selections
- [ ] Add progress callback during hashing phase
- [ ] Integrate with BLAKE3 web worker (`fileHashWorker.js`)
- [ ] Handle hash failures (set `read error` status, disable checkbox)
- [ ] Sort queue by folder path (NOT size)
- [ ] Test with various file size distributions

#### 3.2 Best File Selection & Grouping
- [ ] Create `useBestFileSelection.js` composable
- [ ] Implement `chooseBestFile()` with priority rules
- [ ] Add 'copy' status to StatusCell.vue (purple dot)
- [ ] Add left border styling for copy groups
- [ ] Add bold/non-bold filename styling (best file vs copies)
- [ ] Implement checkbox behavior (include/exclude groups, not swap)
- [ ] Add copy group classes (best-file, copy-file)
- [ ] Test priority rules with edge cases
- [ ] Verify visual grouping clarity

#### 3.3 Upload Phase Deduplication
- [ ] Create `useUploadPhaseDeduplication.js` composable
- [ ] Implement hash-based document ID logic
- [ ] Implement Firestore existence check (during upload)
- [ ] Handle existing files (metadata-only update)
- [ ] Handle new files (Storage upload + Firestore create)
- [ ] Save all source metadata in `sources` array
- [ ] Test database-level deduplication
- [ ] Test with concurrent uploads (same file)
- [ ] Verify latency is hidden during upload

#### 3.4 UX Enhancements
- [ ] Create preview modal component (`UploadPreviewModal.vue`)
- [ ] Create completion modal component (`UploadCompletionModal.vue`)
- [ ] Add deduplication metrics calculation
- [ ] Display storage saved calculations
- [ ] Add status progression (pending, ready, copy, uploading, uploaded, read error, failed)
- [ ] Add visual indicators (icons, colors)
- [ ] Disable all checkboxes during upload phase
- [ ] Test modals with large file counts (1000+)

#### 3.5 Integration
- [ ] Integrate client-side deduplication with queue addition
- [ ] Integrate upload phase deduplication with upload logic
- [ ] Ensure virtual scrolling works with copy groups
- [ ] Verify footer counts are accurate with copies
- [ ] Test with Phase 1.5 virtualization
- [ ] Test Select All/None behavior with copy groups

---

## Testing Requirements

### Unit Tests

```javascript
// useCopyGrouping.spec.js
describe('Copy Grouping', () => {
  it('groups files by hash', () => {});
  it('identifies primary as first ready file', () => {});
  it('identifies copies as files with copy status', () => {});
  it('sorts copies by modified date', () => {});
  it('flattens groups in correct display order', () => {});
  it('handles files with no copies', () => {});
  it('handles multiple copy groups', () => {});
});

// useCopySwap.spec.js
describe('Copy Swap (Checkbox-Based)', () => {
  it('promotes copy to primary when checkbox checked', () => {});
  it('swaps positions in queue (new primary to top)', () => {});
  it('demotes old primary to copy status', () => {});
  it('skips entire group when primary unchecked', () => {});
  it('restores group when any copy checked', () => {});
  it('enforces mutual exclusivity (one checked per group)', () => {});
  it('Select All affects only primary copies', () => {});
  it('Deselect All skips all groups', () => {});
});

// useDuplicateFilter.spec.js
describe('Duplicate Filtering', () => {
  it('detects duplicates with same hash and metadata', () => {});
  it('keeps first occurrence of duplicate', () => {});
  it('filters subsequent duplicates', () => {});
  it('distinguishes duplicates from copies', () => {});
  it('handles edge case: no duplicates', () => {});
  it('handles edge case: all duplicates', () => {});
});
```

### Component Tests

```javascript
describe('DuplicateWarningPopup', () => {
  it('renders duplicate count correctly', () => {});
  it('displays scrollable list of duplicates', () => {});
  it('formats file sizes correctly', () => {});
  it('emits close event on OK button', () => {});
  it('handles singular vs plural text', () => {});
});

describe('Copy Row Rendering', () => {
  it('applies left border to copy group rows', () => {});
  it('applies bold to primary copy filename', () => {});
  it('applies normal font to secondary copy filenames', () => {});
  it('groups copies below primary', () => {});
  it('does not apply border to unique files', () => {});
});
```

### Integration Tests

```javascript
describe('Copy Management Integration', () => {
  it('checkbox swap updates primary and copies correctly', () => {});
  it('skip primary skips entire group', () => {});
  it('restore from skip promotes checked copy', () => {});
  it('multiple swaps maintain group integrity', () => {});
  it('virtual scrolling works with copy groups', () => {});
  it('Select All checks only primaries', () => {});
  it('footer counts exclude secondary copies', () => {});
});

describe('Duplicate Filtering Integration', () => {
  it('filters duplicates during queue addition', () => {});
  it('shows popup when duplicates detected', () => {});
  it('popup does not show when no duplicates', () => {});
  it('queue contains only unique files after filtering', () => {});
});
```

### Manual Testing Scenarios

1. **Basic Copy Grouping:**
   - Upload 5 files with 2 copies of same file
   - Verify primary shows first with bold name and checked checkbox
   - Verify copies show below with normal font and unchecked checkboxes
   - Verify left border on all rows in group

2. **Checkbox Swap:**
   - Check a secondary copy's checkbox
   - Verify it becomes primary (moves to top, bold, Ready status)
   - Verify old primary becomes copy (normal font, Copy status)
   - Verify only one checkbox checked in group

3. **Skip Entire Group:**
   - Uncheck primary copy checkbox
   - Verify entire group status changes to Skip
   - Verify all checkboxes unchecked
   - Verify group still visible

4. **Restore from Skip:**
   - Check any copy in skipped group
   - Verify that copy becomes new primary
   - Verify group restored from skip state
   - Verify other copies remain unchecked

5. **Select All / Deselect All:**
   - Use Select All checkbox
   - Verify only primary copies are checked
   - Verify secondary copies remain unchecked
   - Use Deselect All
   - Verify all groups go to skip state

6. **Duplicate Filtering:**
   - Drag same folder twice to queue
   - Verify popup appears with duplicate count
   - Verify scrollable list shows duplicate filenames
   - Verify queue contains only one copy of each file
   - Dismiss popup with OK button

7. **Large Copy Groups:**
   - Upload file with 5 copies
   - Swap multiple times (check different copies)
   - Verify each swap maintains correct order and styling
   - Verify footer counts remain accurate

8. **Mixed Scenario:**
   - Upload 1000 files with 50 copy groups and 20 duplicates
   - Verify virtual scrolling performance
   - Verify duplicate popup shows 20 filtered
   - Verify copy groups display correctly
   - Verify checkbox swaps are responsive

---

## Success Criteria

### Functional Requirements
- [ ] Copies display below primary with visual distinction
- [ ] Left border clearly shows copy grouping
- [ ] Bold/non-bold filename indicates primary vs copies
- [ ] Checkbox swap changes primary and swaps positions
- [ ] Only one checkbox checked per copy group
- [ ] Unchecking primary skips entire group
- [ ] Checking any copy in skipped group restores it
- [ ] Select All affects only primary copies
- [ ] Deselect All skips all groups
- [ ] Duplicates filtered during queue addition
- [ ] Popup shows when duplicates detected
- [ ] Popup displays accurate count and scrollable list
- [ ] Popup dismisses with OK button

### Performance Requirements
- [ ] Copy grouping calculation <50ms for 1000 files
- [ ] Checkbox swap responds in <100ms
- [ ] Virtual scrolling unaffected by copy grouping
- [ ] Duplicate filtering <100ms for 1000 files
- [ ] Popup renders in <200ms

### Visual Requirements
- [ ] Copy rows clearly distinguishable with left border
- [ ] Bold vs non-bold filename distinction clear
- [ ] Primary always at top of copy group
- [ ] Purple Copy status visible and distinct
- [ ] Copy group visual hierarchy intuitive
- [ ] Popup warning clear and actionable

---

## Dependencies

### Internal Dependencies
- Phase 1.0: Upload Queue Foundation (table structure, status system)
- Phase 1.5: Virtualization (virtual scrolling must work with copy groups)
- `useUploadTable.js` - For queue management integration
- `StatusCell.vue` - Add 'copy' status (purple dot)

### New Status Type
- Add `copy` to status validator in StatusCell.vue
- Purple dot + "Copy" text label

---

## Performance Benchmarks

**Copy Operations:**
| Operation | Target | Actual |
|-----------|--------|--------|
| Group 1000 files | <50ms | _TBD_ |
| Checkbox swap | <100ms | _TBD_ |
| Render grouped display | <100ms | _TBD_ |
| Filter duplicates | <100ms | _TBD_ |
| Show popup | <200ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 3 - Copy grouping: Xms');
console.log('[PERFORMANCE] Phase 3 - Checkbox swap: Xms');
console.log('[PERFORMANCE] Phase 3 - Duplicate filtering: Xms');
console.log('[PERFORMANCE] Phase 3 - Copy groups: X groups with Y total copies');
console.log('[PERFORMANCE] Phase 3 - Duplicates filtered: X files');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with dynamic copy groups | Low | High | Test extensively with various group sizes |
| Checkbox swap causes position jump in scroll | Medium | Low | Use key-based rendering for stability |
| Multiple rapid swaps cause race condition | Low | Medium | Debounce checkbox change events |
| Duplicate detection misses edge cases | Medium | Medium | Comprehensive testing with varied metadata |
| Large duplicate lists crash popup | Low | Low | Virtualize popup list if needed |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Left border not noticeable enough | Low | Medium | User testing, adjust color/width if needed |
| Bold vs non-bold not obvious | Medium | Low | Add additional visual cue if needed |
| Checkbox swap behavior unclear | Medium | Medium | Add tooltip/help text explaining behavior |
| Duplicate popup ignored by users | Low | Low | Make popup more prominent, require explicit dismiss |

---

## Next Phase Preview

**Phase 4:** Column Management (sort, reorder, resize)
- Sortable columns (click header to sort)
- Drag-and-drop column reordering
- Column resizing with mouse drag
- Upload order respects current sort
- Copy groups maintained during sorting

This phase adds table customization capabilities.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12 (Updated for actual Phase 1.0/1.5 implementation, checkbox-based swap, duplicate filtering)
**Assignee:** TBD

---

## Summary of Changes from Original Plan

**Major Changes:**
1. **Terminology:** Clarified "copies" vs "duplicates" - copies have same hash but different metadata; duplicates are the same file queued multiple times
2. **Swap Mechanism:** Changed from dedicated swap button (↔️) to checkbox-based swap for simplicity and consistency
3. **Column Order:** Updated to match actual implementation: Select | File Name | Size | Folder Path | Status
4. **Visual Hierarchy:** Changed from indentation + arrow to left border + bold/non-bold text
5. **Duplicate Handling:** Added duplicate filtering with warning popup (new feature)
6. **Select All Behavior:** Clarified that Select All affects only primary copies, not secondary copies
7. **Status Display:** Added note that emojis are visual shorthand; actual implementation uses CSS dots
8. **Terminology:** Replaced "Cancel" with "Skip" throughout to match Phase 1.0 implementation

**Rationale:**
- Checkbox-based swap is more intuitive and consistent with existing UI
- Left border + font weight provides clearer visual hierarchy
- Duplicate filtering prevents user error and provides helpful feedback
- Aligns with actual Phase 1.0/1.5 architecture and components
