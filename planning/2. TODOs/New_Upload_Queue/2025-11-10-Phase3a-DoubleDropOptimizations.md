# Phase 3a: Double-Drop Optimizations via Metadata Pre-filtering

## Overview

Optimize duplicate detection performance by pre-filtering based on metadata (filename, size, modified timestamp) and folder path hierarchy **before** hash calculation. Hash verification is deferred to three trigger points: tooltip hover, deletion attempt, and upload stage.

**Performance Goal**: Reduce initial processing time from ~10 seconds to <2 seconds for 1000-file second upload by eliminating unnecessary hash calculations.

**Safety Goal**: Maintain zero false positives by hash-verifying all duplicates before critical operations (deletion, upload).

---

## Key Architecture Decisions

### 1. Metadata Pre-filter Criteria

Files are considered "tentative duplicates/copies" when:
- **Filename** matches (case-sensitive)
- **Size** (bytes) matches exactly
- **Modified timestamp** matches exactly

Then apply folder path hierarchy logic to determine status.

### 2. Folder Path Hierarchy Logic

**CRITICAL**: Root-level files (shorter paths) are **children** of deeper paths.
- Example: `/file.pdf` is CHILD of `/2017/file.pdf`

```javascript
function comparePaths(newFolderPath, existingFolderPath) {
  // Case 1: Identical paths → NEW is "duplicate"
  if (newFolderPath === existingFolderPath) {
    return 'duplicate';
  }

  // Case 2: NEW is parent of EXISTING (NEW path ends with EXISTING path)
  // Example: NEW="/2017/2017-06/Invoices" contains EXISTING="/Invoices"
  // → Promote NEW to best (more specific), demote EXISTING to duplicate
  if (newFolderPath.endsWith(existingFolderPath)) {
    return 'promote_new';
  }

  // Case 3: EXISTING is parent of NEW (EXISTING path ends with NEW path)
  // Example: EXISTING="/2017/Statements" contains NEW="/Statements"
  // → Keep EXISTING as best, mark NEW as duplicate
  if (existingFolderPath.endsWith(newFolderPath)) {
    return 'keep_existing';
  }

  // Case 4: Different paths (siblings, cousins, unrelated)
  // → Mark NEW as "copy" (different metadata that IS meaningful)
  return 'copy';
}
```

**Edge Case**: Paths must be normalized (forward slashes, case-sensitive comparison).

### 3. State Management via `queueItem.hash`

- **No hash** (`!queueItem.hash`) → Tentative status, not hash-verified
- **Has hash** (`queueItem.hash`) → Hash-verified, status is confirmed

**CRITICAL**: When a file is marked as "duplicate" or "copy" during pre-filter, it has NO hash yet. Hash calculation is deferred until verification is needed.

### 4. Hash Verification Trigger Points

Hash verification occurs at **three points**:

#### A. **Tooltip Hover** (on status column)
- User hovers over status → show "Verifying hash..." in tooltip
- Calculate hash for hovered file
- Find best/primary copy reference (tracked elsewhere in codebase)
- Compare hashes:
  - **Match** → Display hash in tooltip, status confirmed
  - **Mismatch** → Auto-promote to "ready", display hash, show warning toast

#### B. **Deletion Attempt**
- User attempts to delete file with status "duplicate" and no hash
- Calculate hash before allowing deletion
- Compare to best/primary copy:
  - **Match** → Allow deletion
  - **Mismatch** → BLOCK deletion, auto-promote to "ready", show warning toast

**CRITICAL ERROR**: If best/primary copy has no hash, this indicates architectural failure. Output descriptive console error and show toast: "Cannot verify duplicate status - best copy has no hash. Please report this issue."

#### C. **Upload Stage**
- Before upload, check if file has no hash
- Calculate hash (required for Firestore document ID)
- If status is "duplicate" or "copy", compare to best/primary copy:
  - **Match** → Skip upload (confirmed duplicate/copy)
  - **Mismatch** → Auto-promote to "ready", proceed with upload

---

## Implementation Steps

### Step 1: Create Pre-filter Function in `useQueueCore.js`

Add new function: `preFilterByMetadataAndPath(newFiles, existingQueue)`

**Non-obvious details**:
- Extract folder path using: `path.substring(0, path.lastIndexOf('/'))`
- Normalize paths: `path.replace(/\\/g, '/')` (Windows backslash → forward slash)
- Comparison is **case-sensitive**
- Return structure: `{ readyFiles, duplicateFiles, copyFiles, promotions }`
  - `promotions`: Array of existing files to demote when NEW is promoted

**Key logic**:
1. Group new files by metadata key: `${filename}_${size}_${lastModified}`
2. For each metadata group, compare against existing queue files with same metadata
3. Apply `comparePaths()` logic to determine status
4. Track promotions (when NEW becomes best, EXISTING is demoted to duplicate)

### Step 2: Integrate Pre-filter into `deduplicateAgainstExisting()`

**Location**: `src/features/upload/composables/useUploadTable.js` (around line 90)

**Current flow**:
1. Combine `existingQueueSnapshot` + `newQueueItems`
2. Group by size
3. Hash files with duplicate sizes
4. Compare hashes

**New flow**:
1. Pre-filter: `preFilterByMetadataAndPath(newQueueItems, existingQueueSnapshot)`
2. Mark files based on pre-filter results (NO hashing yet)
3. For remaining files (marked as "ready" by pre-filter), continue with existing hash-based logic
4. Handle promotions (update existing queue items' status)

**Non-obvious detail**: Files marked as "duplicate" or "copy" during pre-filter should NOT enter the hash calculation phase. They remain in queue with tentative status and `hash: null`.

### Step 3: Add Hash Verification on Hover

**Location**: Status column tooltip in upload table component (need to identify component)

**Implementation**:
```javascript
async function onStatusHover(queueItem) {
  if (!queueItem.hash && (queueItem.status === 'duplicate' || queueItem.status === 'copy')) {
    // Show "Verifying hash..." in tooltip immediately
    tooltipContent.value = 'Verifying hash...';

    // Calculate hash
    const hash = await queueCore.generateFileHash(queueItem.sourceFile);
    queueItem.hash = hash;

    // Find best/primary copy (function exists elsewhere in codebase)
    const bestCopy = findBestCopyForItem(queueItem); // TODO: Identify this function

    // ERROR CHECK: Best copy MUST have hash
    if (!bestCopy.hash) {
      console.error('[HASH-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        bestCopyFile: bestCopy.name,
        bestCopyStatus: bestCopy.status,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      tooltipContent.value = 'Verification failed';
      return;
    }

    // Compare hashes
    if (queueItem.hash !== bestCopy.hash) {
      // Mismatch! Auto-promote to ready
      queueItem.status = 'ready';
      queueItem.canUpload = true;
      console.warn('[HASH-VERIFY] Hash mismatch - promoting to ready', {
        file: queueItem.name,
        tentativeHash: queueItem.hash,
        bestCopyHash: bestCopy.hash,
      });
      showToast(`File "${queueItem.name}" was incorrectly marked as duplicate. Status changed to Ready.`, 'warning');
    }
  }

  // Display hash
  tooltipContent.value = queueItem.hash || 'No hash';
}
```

**Non-obvious detail**: Need to identify the function that finds the best/primary copy for a given queue item. This logic exists elsewhere in the codebase (likely in `useUploadTable.js` or `useQueueCore.js`).

### Step 4: Add Hash Verification on Deletion

**Location**: Delete handler in upload table component

**Implementation**:
```javascript
async function beforeDelete(queueItem) {
  if (queueItem.status === 'duplicate' && !queueItem.hash) {
    // Show loading indicator
    showLoadingToast('Verifying duplicate before deletion...');

    // Calculate hash
    const hash = await queueCore.generateFileHash(queueItem.sourceFile);
    queueItem.hash = hash;

    // Find best/primary copy
    const bestCopy = findBestCopyForItem(queueItem);

    // ERROR CHECK: Best copy MUST have hash
    if (!bestCopy.hash) {
      console.error('[DELETE-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        bestCopyFile: bestCopy.name,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      return { allowDeletion: false };
    }

    // Compare hashes
    if (queueItem.hash !== bestCopy.hash) {
      // ABORT deletion! This is unique content
      queueItem.status = 'ready';
      queueItem.canUpload = true;
      console.warn('[DELETE-VERIFY] Hash mismatch - blocking deletion', {
        file: queueItem.name,
      });
      showToast(`File "${queueItem.name}" is actually unique content, not a duplicate. Deletion blocked and status changed to Ready.`, 'error');
      return { allowDeletion: false };
    }
  }

  return { allowDeletion: true };
}
```

### Step 5: Add Hash Verification on Upload

**Location**: Upload processing logic (likely in `useUploadTable.js` or separate upload composable)

**Implementation**:
```javascript
async function beforeUpload(queueItem) {
  // Always calculate hash if missing (required for Firestore document ID)
  if (!queueItem.hash) {
    queueItem.hash = await queueCore.generateFileHash(queueItem.sourceFile);
  }

  // If this was tentatively marked as duplicate/copy, verify now
  if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
    const bestCopy = findBestCopyForItem(queueItem);

    // ERROR CHECK
    if (!bestCopy.hash) {
      console.error('[UPLOAD-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        bestCopyFile: bestCopy.name,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      queueItem.status = 'ready'; // Fail-safe: treat as ready to avoid data loss
    } else if (queueItem.hash !== bestCopy.hash) {
      // Mismatch! Promote to ready and upload
      queueItem.status = 'ready';
      queueItem.canUpload = true;
      console.warn('[UPLOAD-VERIFY] Hash mismatch - promoting to ready and uploading', {
        file: queueItem.name,
      });
    }
  }

  // Proceed with normal upload logic
  if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
    return { shouldSkip: true }; // Confirmed duplicate/copy - don't upload
  }

  return { shouldSkip: false };
}
```

### Step 6: Update Planning Document for Phase 3b

**Location**: `planning/2. TODOs/New_Upload_Queue/2025-11-10-Phase3b-UploadingDeDup.md`

**Add section**:
```markdown
## Hash Verification During Upload

Files marked as "duplicate" or "copy" during Phase 3a pre-filtering may not have hash values yet. The upload stage MUST:

1. Calculate hash for all files (required for Firestore document ID)
2. Verify tentative duplicates/copies by comparing to best/primary copy
3. Auto-promote to "ready" if hash mismatch detected
4. Skip upload for confirmed duplicates/copies

This ensures zero false positives while hiding hash calculation time within upload processing.
```

---

## Testing Strategy

### Unit Tests

1. **Path comparison logic**:
   - Parent/child detection (including root-level files)
   - Sibling detection
   - Unrelated paths
   - Path normalization (backslash → forward slash)

2. **Pre-filter function**:
   - Metadata matching (filename, size, modified)
   - Promotion logic (NEW becomes best, EXISTING demoted)
   - Copy detection (different paths)

3. **Hash verification**:
   - Hash match → status confirmed
   - Hash mismatch → auto-promote to ready
   - Best copy missing hash → error handling

### Integration Tests

1. **Double-drop scenario**:
   - Upload 1000 files
   - Upload same 1000 files again
   - Verify: Pre-filter marks all as duplicates
   - Verify: Hash calculation skipped
   - Verify: Performance <2 seconds

2. **Hash mismatch scenario**:
   - Upload file A (path: `/2017/invoice.pdf`)
   - Upload file B (path: `/invoice.pdf`, same metadata, DIFFERENT content)
   - Verify: Pre-filter marks B as duplicate
   - Hover over B status → hash calculated → mismatch detected → promoted to ready

3. **Deletion safety**:
   - Pre-filter marks file as duplicate (no hash)
   - Attempt deletion
   - Verify: Hash calculated before deletion allowed

---

## Non-Obvious Implementation Details

### 1. Finding Best/Primary Copy

**CONFIRMED**: Best/primary copy is identified by status, NOT by explicit reference tracking.

**Logic** (from `useUploadTable.js` lines 614-619):
```javascript
// Find all files with the same hash
const sameHashFiles = uploadQueue.value.filter((f) => f.hash === targetFile.hash);

// Find the current primary file (status = 'ready' or 'skip')
let primaryFile = sameHashFiles.find((f) => f.status === 'ready');
if (!primaryFile) {
  primaryFile = sameHashFiles.find((f) => f.status === 'skip');
}
```

**Key insight**: The primary file is the one with `status === 'ready'` (or `status === 'skip'` if entire group is skipped). No explicit `primaryCopyId` field exists.

**Implementation for hash verification**:
```javascript
function findBestCopyForItem(queueItem) {
  // Find all files with the same hash
  const sameHashFiles = uploadQueue.value.filter((f) => f.hash === queueItem.hash);

  // Primary file has status 'ready' or 'skip'
  let primaryFile = sameHashFiles.find((f) => f.status === 'ready');
  if (!primaryFile) {
    primaryFile = sameHashFiles.find((f) => f.status === 'skip');
  }

  return primaryFile; // May be undefined if no primary found (error case)
}
```

**Edge case**: If pre-filter marks NEW file as duplicate, the EXISTING file must be the primary (with status 'ready'). The hash comparison verifies this assumption.

### 2. Path Normalization Edge Cases

**Windows path handling**:
- Convert backslashes: `path.replace(/\\/g, '/')`
- Case sensitivity: Use exact match (no `.toLowerCase()`)

**Custom paths** (from user renaming):
- `queueItem.customPath` may override `file.path` or `file.webkitRelativePath`
- Pre-filter must use same path source as rest of system

**Root-level files**:
- Path might be just filename (no folder)
- `path.lastIndexOf('/')` returns -1 → folder path is empty string
- Empty string is child of any non-empty path (by definition)

### 3. State Transitions

Files can transition through these states:

1. **Pre-filter**: `ready` | `duplicate` | `copy` (no hash)
2. **Hash verification**: Confirms status OR promotes to `ready`
3. **Upload**: Uses hash for document ID, skips confirmed duplicates/copies

**Important**: Once a file is promoted from `duplicate`/`copy` to `ready` due to hash mismatch, it CANNOT be demoted back. The hash proves it's unique content.

### 4. Performance Considerations

**Pre-filter complexity**:
- O(N × M) where N = new files, M = existing queue files
- For 1000 new + 1000 existing = 1,000,000 comparisons
- Each comparison is metadata string compare + path `endsWith()` check
- Expected time: <100ms (string operations are fast)

**Hash calculation deferral**:
- First upload: Hash ~200 files → ~2 sec
- Second upload: Pre-filter marks ~1000 as duplicates → hash 0 files → <0.1 sec
- On hover: Hash 1 file on-demand → ~20ms per file
- On upload: Hash files marked ready → variable time

**Net performance gain**:
- Second upload: 10 sec → <2 sec (80% improvement)
- Third upload: 30 sec → <2 sec (93% improvement)

---

## Rollback Plan

If pre-filtering introduces issues:

1. **Feature flag**: Add `ENABLE_METADATA_PREFILTER` flag (default: true)
2. **Fallback**: When disabled, skip pre-filter and use existing hash-based logic
3. **Monitoring**: Track hash mismatch rate (should be near-zero)

**Metrics to monitor**:
- Hash mismatch count (should be ~0)
- Pre-filter false positive rate (hash mismatch = false positive)
- Performance improvement (time saved)

---

## Success Criteria

- ✅ Second upload of 1000 files completes in <2 seconds (vs 10 seconds currently)
- ✅ Zero false positives (confirmed by hash verification)
- ✅ All duplicates hash-verified before deletion
- ✅ Tooltip shows "Verifying hash..." → hash value on hover
- ✅ Files with hash mismatches auto-promoted to "ready" with warning toast
- ✅ Best copy missing hash triggers descriptive error
