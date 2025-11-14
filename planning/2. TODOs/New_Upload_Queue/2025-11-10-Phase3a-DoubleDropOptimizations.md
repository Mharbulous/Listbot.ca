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

**CRITICAL**: Longer paths are "more specific" and win over shorter paths.
- Example: `/2017/2017-06/invoice.pdf` is MORE specific than `/2017/invoice.pdf`

**Best Match Algorithm**: When NEW file matches metadata of multiple EXISTING files, find the one with the **longest matching path suffix**.

```javascript
function findBestMatchingFile(newFile, existingMatches) {
  const newFolderPath = extractFolderPath(newFile.path);
  let bestMatch = null;
  let bestMatchScore = -1;
  let bestMatchType = null;

  for (const existing of existingMatches) {
    const existingFolderPath = extractFolderPath(existing.path);

    // STOP immediately on exact match (highest priority)
    if (newFolderPath === existingFolderPath) {
      return { file: existing, type: 'duplicate' };
    }

    // NEW is more specific (longer) - ends with EXISTING path
    if (newFolderPath.endsWith(existingFolderPath)) {
      const score = existingFolderPath.length; // Longer suffix = better match
      if (score > bestMatchScore) {
        bestMatch = existing;
        bestMatchScore = score;
        bestMatchType = 'promote_new'; // Demote EXISTING, NEW becomes primary
      }
    }
    // EXISTING is more specific (longer) - ends with NEW path
    else if (existingFolderPath.endsWith(newFolderPath)) {
      const score = newFolderPath.length;
      if (score > bestMatchScore) {
        bestMatch = existing;
        bestMatchScore = score;
        bestMatchType = 'keep_existing'; // NEW is duplicate of EXISTING
      }
    }
  }

  // No parent/child match found → mark as copy of first match
  return {
    file: bestMatch || existingMatches[0],
    type: bestMatch ? bestMatchType : 'copy'
  };
}
```

**Non-obvious**: Must check ALL metadata matches, not just first one. Example: NEW `/2017/2017-06/Invoices/file.pdf` might match EXISTING `/file.pdf`, `/Invoices/file.pdf`, and `/2017-06/Invoices/file.pdf` - the longest suffix wins.
n**Tie-breaking**: When multiple EXISTING files have equal-length path suffixes, the first match encountered wins. This simple rule preserves existing primary/best status without requiring complex tie-breaking logic.

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
- Return structure:
  ```javascript
  {
    readyFiles: [],
    duplicateFiles: [{ file, referenceFileId }], // Track which EXISTING file it matches
    copyFiles: [{ file, referenceFileId }],      // Track which EXISTING file it matches
    promotions: [] // EXISTING files to demote when NEW promoted
  }
  ```
- **CRITICAL**: Store `referenceFileId` because tentative duplicates/copies have no hash yet, so can't use hash-based lookup to find best copy during verification.

**Key logic**:
1. Group new files by metadata key: `${filename}_${size}_${lastModified}`
2. For each NEW file with metadata matches, find ALL matching EXISTING files
3. Use `findBestMatchingFile()` to pick the one with longest path suffix
4. Track `referenceFileId` for later hash verification

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


**Promotions handling code**:
```javascript
const result = preFilterByMetadataAndPath(newQueueItems, existingQueueSnapshot);

// Add new ready files
result.readyFiles.forEach(newFile => {
  newFile.status = 'ready';
  uploadQueue.value.push(newFile);
});

// Add new duplicates
result.duplicateFiles.forEach(item => {
  item.file.status = 'duplicate';
  item.file.referenceFileId = item.referenceFileId;
  uploadQueue.value.push(item.file);
});

// Add new copies
result.copyFiles.forEach(item => {
  item.file.status = 'copy';
  item.file.referenceFileId = item.referenceFileId;
  uploadQueue.value.push(item.file);
});

// Handle promotions - demote existing files
result.promotions.forEach(promo => {
  const existingFile = uploadQueue.value.find(f => f.id === promo.existingFileId);
  if (existingFile) {
    existingFile.status = 'duplicate';              // Demote from 'ready' to 'duplicate'
    existingFile.referenceFileId = promo.newPrimaryId;  // Point to new primary
  }
});
```

**Promotions array structure**:
- `existingFileId`: ID of EXISTING file to demote from 'ready' to 'duplicate'
- `newPrimaryId`: ID of NEW file that's becoming the primary (used to set `referenceFileId`)

### Step 3: Add Hash Verification on Hover

**Location**: Status column tooltip in upload table component (need to identify component)

**Implementation**:
```javascript
async function onStatusHover(queueItem) {
  if (!queueItem.hash && (queueItem.status === 'duplicate' || queueItem.status === 'copy')) {
    tooltipContent.value = 'Verifying hash...';

    // Race condition check: Hash might have been calculated by another trigger
    if (queueItem.hash) {
      tooltipContent.value = queueItem.hash;
      return;
    }

    // Calculate hash with error handling
    try {
      const hash = await queueCore.generateFileHash(queueItem.sourceFile);
      queueItem.hash = hash;
    } catch (error) {
      console.error('[HASH-VERIFY] Hash calculation failed:', { file: queueItem.name, error: error.message });
      showToast(`Cannot verify file "${queueItem.name}": ${error.message}`, 'error');
      queueItem.status = 'error';
      queueItem.errorMessage = error.message;
      return;
    }

    // Find best/primary copy using referenceFileId (set during pre-filter)
    const bestCopy = uploadQueue.value.find(f => f.id === queueItem.referenceFileId);

    // ERROR CHECK: Best copy MUST have hash
    if (!bestCopy?.hash) {
      console.error('[HASH-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        referenceFileId: queueItem.referenceFileId,
        bestCopyFound: !!bestCopy,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      tooltipContent.value = 'Verification failed';
      return;
    }

    // Compare hashes
    if (queueItem.hash !== bestCopy.hash) {
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

**Non-obvious details**:
- Use `referenceFileId` (set during pre-filter) to find best copy, NOT hash-based lookup
- Check if hash was already calculated (race condition: deletion handler might have calculated it first)
- Error handling prevents UI from hanging on corrupted/inaccessible files

### Step 4: Add Hash Verification on Deletion

**Location**: Delete handler in upload table component

**Implementation**:
```javascript
async function beforeDelete(queueItem) {
  if (queueItem.status === 'duplicate' && !queueItem.hash) {
    showLoadingToast('Verifying duplicate before deletion...');

    // Race condition check
    if (queueItem.hash) {
      return { allowDeletion: true };
    }

    // Calculate hash with error handling
    try {
      const hash = await queueCore.generateFileHash(queueItem.sourceFile);
      queueItem.hash = hash;
    } catch (error) {
      console.error('[DELETE-VERIFY] Hash calculation failed:', { file: queueItem.name, error: error.message });
      showToast(`Cannot verify file "${queueItem.name}": ${error.message}`, 'error');
      return { allowDeletion: false };
    }

    // Find best/primary copy using referenceFileId
    const bestCopy = uploadQueue.value.find(f => f.id === queueItem.referenceFileId);

    if (!bestCopy?.hash) {
      console.error('[DELETE-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        referenceFileId: queueItem.referenceFileId,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      return { allowDeletion: false };
    }

    if (queueItem.hash !== bestCopy.hash) {
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
    try {
      queueItem.hash = await queueCore.generateFileHash(queueItem.sourceFile);
    } catch (error) {
      console.error('[UPLOAD-VERIFY] Hash calculation failed:', { file: queueItem.name, error: error.message });
      queueItem.status = 'error';
      queueItem.errorMessage = error.message;
      return { shouldSkip: true }; // Don't upload files that can't be hashed
    }
  }

  // If this was tentatively marked as duplicate/copy, verify now
  if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
    const bestCopy = uploadQueue.value.find(f => f.id === queueItem.referenceFileId);

    if (!bestCopy?.hash) {
      console.error('[UPLOAD-VERIFY] CRITICAL: Best copy has no hash', {
        tentativeFile: queueItem.name,
        referenceFileId: queueItem.referenceFileId,
      });
      showToast('Cannot verify duplicate status - best copy has no hash. Please report this issue.', 'error');
      queueItem.status = 'ready'; // Fail-safe: treat as ready to avoid data loss
    } else if (queueItem.hash !== bestCopy.hash) {
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

### 1. Finding Best/Primary Copy During Pre-filter

**CRITICAL**: During pre-filter, tentative duplicates/copies have NO hash yet, so can't use existing hash-based lookup (`uploadQueue.filter(f => f.hash === targetFile.hash)`).

**Solution**: Pre-filter stores `referenceFileId` on each tentative duplicate/copy, pointing to the EXISTING file it matched against. During hash verification, use:

```javascript
const bestCopy = uploadQueue.value.find(f => f.id === queueItem.referenceFileId);
```

**No cascading updates needed**: When EXISTING file is demoted (due to NEW promotion), don't need to update OTHER files that referenced EXISTING. At upload time, the system finds current primary by `status === 'ready'`, not by stored references. Old references are harmless - hash verification will find the correct primary.

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

### 5. UI Status Display

**Unverified status indicator**: Show "Duplicate?" or "Copy?" (with `?`) until hash verified.

```javascript
function getStatusDisplay(queueItem) {
  const base = queueItem.status.charAt(0).toUpperCase() + queueItem.status.slice(1);
  if ((queueItem.status === 'duplicate' || queueItem.status === 'copy') && !queueItem.hash) {
    return base + '?';
  }
  return base;
}
```

**Remove "?" after verification**: All three hash verification points (hover, delete, upload) confirm the status, so subsequent displays show "Duplicate" or "Copy" without "?".

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
