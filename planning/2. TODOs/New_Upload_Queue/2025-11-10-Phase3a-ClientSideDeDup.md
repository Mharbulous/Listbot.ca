# Phase 3a: Client-Side Deduplication

**Phase:** 3a of 7
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 2-3 days
**Dependencies:** Phase 1 (Foundation), Phase 1.5 (Virtualization)

---

## Overview

Implement client-side file deduplication that runs BEFORE upload to provide instant feedback to users. This phase uses size-based pre-filtering and BLAKE3 hashing to detect duplicates and copies without database queries.

**Goal:** Instant client-side feedback on file copies and duplicates
**Deliverable:** Size-based pre-filtering, hash-based deduplication, one-and-the-same detection, best file selection, visual grouping
**User Impact:** Users see instant deduplication feedback and understand what will be uploaded

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
  - System automatically selects "best file" using priority rules (see 3a.2)
  - Users CANNOT override which copy is uploaded

- **"One-and-the-Same"**: The exact same file selected multiple times (same hash, same metadata, same location)
  - Example: User drags the same folder twice, resulting in `invoice.pdf` appearing twice in queue
  - The first instance remains with status "ready"
  - Subsequent instances are marked with status **"duplicate"** (white dot, checkbox disabled)
  - Duplicates are shown in queue but cannot be selected for upload

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

### 3a.1 Client-Side Deduplication (Phase 1: Instant Feedback)
### 3a.2 Best File Selection & Visual Grouping

---

## 3a.1 Client-Side Deduplication (Phase 1: Instant Feedback)

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
        // Keep first instance as ready, mark others as duplicate
        finalFiles.push(oneAndTheSameFiles[0]);

        // Mark subsequent instances as duplicates (shown in queue but cannot be selected)
        for (let i = 1; i < oneAndTheSameFiles.length; i++) {
          oneAndTheSameFiles[i].status = 'duplicate';
          oneAndTheSameFiles[i].canUpload = false; // Disable checkbox
          finalFiles.push(oneAndTheSameFiles[i]);
        }

        console.log(`[DEDUP] Marked ${oneAndTheSameFiles.length - 1} duplicates: ${oneAndTheSameFiles[0].metadata.sourceFileName}`);
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

## 3a.2 Best File Selection & Visual Grouping

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
// Status text mapping (add 'copy' and 'duplicate' statuses)
const statusTextMap = {
  ready: 'Ready',
  uploading: 'Uploading...',
  uploaded: 'Uploaded',
  copy: 'Copy',        // NEW: Purple dot for copies (metadata only)
  duplicate: 'Duplicate', // NEW: White dot for one-and-the-same files (checkbox disabled)
  skip: 'Skip',
  'read error': 'Read Error',
  failed: 'Failed',
  unknown: 'Unknown',
  'n/a': 'N/A',
};

// CSS for copy and duplicate statuses
.status-copy {
  background-color: #9C27B0; /* Purple */
}
.status-duplicate {
  background-color: #9E9E9E; /* Gray/White - same as skip */
}
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
- Checkbox is disabled (same as .lnk, .tmp files, and duplicate files)
- No special UI modal needed - the status and disabled checkbox are sufficient feedback

**Rationale:** Files without hashes cannot be uploaded (no document ID). Blocking with disabled checkbox prevents upload attempts that would fail.

**Checkbox Behavior Summary:**
- **Disabled checkboxes** (always unchecked, unaffected by Select All/None):
  - `duplicate` - One-and-the-same files (already queued)
  - `read error` - Hash/read failures (cannot generate document ID)
  - `n/a` - Unsupported file types (.lnk, .tmp, etc.)
- **Enabled checkboxes** (affected by Select All/None):
  - All other statuses (`ready`, `copy`, `skip`, etc.)

---

## Implementation Tasks

**For complete user stories and requirements, see:** `@docs/architecture/client-deduplication-stories.md`

### Task Checklist

#### 3a.1 Client-Side Deduplication
- [ ] Create `useClientDeduplication.js` composable
- [ ] Implement `groupBySize()` - size-based pre-filtering
- [ ] Implement `hashDuplicateCandidates()` - hash only matching sizes
- [ ] Implement `detectOneAndTheSame()` - mark duplicate selections with 'duplicate' status
- [ ] Set `canUpload: false` for duplicate files (disable checkbox)
- [ ] Add progress callback during hashing phase
- [ ] Integrate with BLAKE3 web worker (`fileHashWorker.js`)
- [ ] Handle hash failures (set `read error` status, disable checkbox)
- [ ] Sort queue by folder path (NOT size)
- [ ] Test with various file size distributions

#### 3a.2 Best File Selection & Grouping
- [ ] Create `useBestFileSelection.js` composable
- [ ] Implement `chooseBestFile()` with priority rules
- [ ] Add 'copy' status to StatusCell.vue (purple dot)
- [ ] Add 'duplicate' status to StatusCell.vue (gray/white dot)
- [ ] Add left border styling for copy groups
- [ ] Add bold/non-bold filename styling (best file vs copies)
- [ ] Implement checkbox behavior (include/exclude groups, not swap)
- [ ] Disable checkboxes for 'duplicate', 'read error', and 'n/a' statuses
- [ ] Add copy group classes (best-file, copy-file)
- [ ] Test priority rules with edge cases
- [ ] Verify visual grouping clarity

#### 3a.3 Integration
- [ ] Integrate client-side deduplication with queue addition
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

// useBestFileSelection.spec.js
describe('Best File Selection', () => {
  it('selects earliest modified date', () => {});
  it('prioritizes longest folder path on date tie', () => {});
  it('prioritizes shortest filename on path tie', () => {});
  it('uses alphanumeric sort on filename tie', () => {});
  it('uses original order as final tiebreaker', () => {});
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
describe('Copy Row Rendering', () => {
  it('applies left border to copy group rows', () => {});
  it('applies bold to primary copy filename', () => {});
  it('applies normal font to secondary copy filenames', () => {});
  it('groups copies below primary', () => {});
  it('does not apply border to unique files', () => {});
});

describe('StatusCell - Copy/Duplicate Status', () => {
  it('renders purple dot for copy status', () => {});
  it('renders gray dot for duplicate status', () => {});
  it('displays "Copy" text label', () => {});
  it('displays "Duplicate" text label', () => {});
});
```

### Integration Tests

```javascript
describe('Client-Side Deduplication Integration', () => {
  it('size pre-filtering skips unique files', () => {});
  it('hashes only duplicate candidates', () => {});
  it('detects one-and-the-same files', () => {});
  it('groups copies correctly', () => {});
  it('selects best file using priority rules', () => {});
  it('visual grouping displays correctly', () => {});
  it('checkbox behavior works for copy groups', () => {});
  it('virtual scrolling works with copy groups', () => {});
  it('Select All checks only primaries', () => {});
  it('footer counts exclude secondary copies', () => {});
});
```

### Manual Testing Scenarios

1. **Basic Copy Grouping:**
   - Upload 5 files with 2 copies of same file
   - Verify primary shows first with bold name and checked checkbox
   - Verify copies show below with normal font and checked checkboxes
   - Verify left border on all rows in group

2. **One-and-the-Same Detection:**
   - Drag same folder twice to queue
   - Verify first instance has "ready" status
   - Verify subsequent instances have "duplicate" status with disabled checkbox
   - Verify duplicates appear in queue but cannot be selected

3. **Skip Entire Group:**
   - Uncheck primary copy checkbox
   - Verify entire group status changes to Skip
   - Verify all checkboxes unchecked
   - Verify group still visible

4. **Select All / Deselect All:**
   - Use Select All checkbox
   - Verify only primary copies are checked
   - Verify secondary copies remain checked
   - Verify duplicates remain disabled
   - Use Deselect All
   - Verify all enabled checkboxes are unchecked

5. **Large Copy Groups:**
   - Upload file with 5 copies
   - Verify grouping, ordering, and styling
   - Verify footer counts remain accurate

6. **Mixed Scenario:**
   - Upload 1000 files with 50 copy groups and 20 duplicates
   - Verify virtual scrolling performance
   - Verify copy groups display correctly
   - Verify duplicate files shown with disabled checkboxes

---

## Success Criteria

### Functional Requirements
- [ ] Size pre-filtering correctly identifies unique files
- [ ] Hashing only processes duplicate candidates
- [ ] One-and-the-same files marked with 'duplicate' status
- [ ] Duplicate checkboxes are disabled
- [ ] Copies display below primary with visual distinction
- [ ] Left border clearly shows copy grouping
- [ ] Bold/non-bold filename indicates primary vs copies
- [ ] Only one file per copy group will upload (the "best file")
- [ ] Unchecking primary skips entire group
- [ ] Checking any copy in skipped group restores it
- [ ] Select All affects only enabled checkboxes
- [ ] Deselect All skips all groups (except duplicates)

### Performance Requirements
- [ ] Size pre-filtering <10ms for 1000 files
- [ ] Hashing 50-70% faster than hashing all files
- [ ] Copy grouping calculation <50ms for 1000 files
- [ ] Virtual scrolling unaffected by copy grouping
- [ ] Hash failure handling doesn't block other files

### Visual Requirements
- [ ] Copy rows clearly distinguishable with left border
- [ ] Bold vs non-bold filename distinction clear
- [ ] Primary always at top of copy group
- [ ] Purple Copy status visible and distinct
- [ ] Gray Duplicate status visible and distinct
- [ ] Disabled checkboxes clearly indicate non-selectable files
- [ ] Copy group visual hierarchy intuitive

---

## Dependencies

### Internal Dependencies
- Phase 1.0: Upload Queue Foundation (table structure, status system)
- Phase 1.5: Virtualization (virtual scrolling must work with copy groups)
- `useUploadTable.js` - For queue management integration
- `StatusCell.vue` - Add 'copy' and 'duplicate' statuses
- `fileHashWorker.js` - BLAKE3 hashing in web worker

### New Status Types
- Add `copy` to status validator in StatusCell.vue (purple dot + "Copy" text)
- Add `duplicate` to status validator in StatusCell.vue (gray dot + "Duplicate" text)

---

## Performance Benchmarks

**Client-Side Operations:**
| Operation | Target | Actual |
|-----------|--------|--------|
| Size pre-filtering (1000 files) | <10ms | _TBD_ |
| Hash 500 duplicate candidates | <3s | _TBD_ |
| One-and-the-same detection | <20ms | _TBD_ |
| Group 1000 files | <50ms | _TBD_ |
| Best file selection | <10ms per group | _TBD_ |
| Render grouped display | <100ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 3a - Size pre-filtering: Xms');
console.log('[PERFORMANCE] Phase 3a - Unique by size: X files, Need hashing: Y files');
console.log('[PERFORMANCE] Phase 3a - Hashing duplicate candidates: Xms');
console.log('[PERFORMANCE] Phase 3a - One-and-the-same detection: Xms');
console.log('[PERFORMANCE] Phase 3a - Copy grouping: Xms');
console.log('[PERFORMANCE] Phase 3a - Copy groups: X groups with Y total copies');
console.log('[PERFORMANCE] Phase 3a - Duplicates marked: X files');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with dynamic copy groups | Low | High | Test extensively with various group sizes |
| BLAKE3 hashing blocks UI thread | Low | High | Already using web worker - verify non-blocking |
| Hash failures cascade to other files | Low | Medium | Isolated try/catch per file |
| Large duplicate lists slow grouping | Low | Low | Optimize Map operations |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Left border not noticeable enough | Low | Medium | User testing, adjust color/width if needed |
| Bold vs non-bold not obvious | Medium | Low | Add additional visual cue if needed |
| Checkbox behavior unclear | Medium | Medium | Add tooltip/help text explaining behavior |
| Duplicate status confusing | Low | Low | Clear labeling and disabled checkbox |

---

## Next Phase Preview

**Phase 3b:** Upload Phase Deduplication
- Database-level deduplication using hash-based document IDs
- Hidden database queries during upload
- Metadata-only updates for existing files
- Preview and completion modals

This phase handles the actual upload and database operations.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12
**Assignee:** TBD
