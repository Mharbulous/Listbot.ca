# Client-Side Deduplication Logic

**Date:** 2025-11-16
**Status:** Production
**Original Plan:** `planning/1. Ideas/BrahmClientDeDupeLogic.txt`

---

## Table of Contents

1. [Overview](#overview)
2. [Workflow Diagram](#workflow-diagram)
3. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
4. [Comparison: Original Plan vs Current Implementation](#comparison-original-plan-vs-current-implementation)
5. [Key Evolution Points](#key-evolution-points)
6. [Critical Terminology](#critical-terminology)
7. [Code References](#code-references)

---

## Overview

The client-side deduplication system uses a **two-stage algorithm** with **six execution phases** to efficiently identify and handle duplicate files before upload:

- **Stage 1 (Pre-filter)**: Fast metadata-based comparison to identify potential duplicates
- **Stage 2 (Hash verification)**: BLAKE3 hashing to verify true duplicates vs. meaningful copies

The system evolved from the original plan to handle **timing mismatches**, **UI grouping requirements**, and **two-phase cleanup lifecycle** constraints.

### Core Optimization

**Only 10-20% of files get hashed** because Stage 1 metadata comparison eliminates most unique files before expensive BLAKE3 hashing begins.

---

## Workflow Diagram

```json
{
  "deduplication_workflow": {
    "trigger": "User drops files into upload zone",
    "phases": [
      {
        "id": "phase_1",
        "name": "Quick Feedback",
        "location": "useUploadTable-addition.js:48-86",
        "thread": "main",
        "timing": "0-50ms",
        "actions": [
          "Sort files by folder path",
          "Process first 200 files",
          "Create queue items with metadata"
        ],
        "output": "Initial batch ready for deduplication"
      },
      {
        "id": "phase_1.5",
        "name": "Deduplication Check",
        "location": "useUploadTable-addition.js:76-86",
        "thread": "main",
        "timing": "50-150ms",
        "actions": [
          "Call deduplicateAgainstExisting()",
          "Triggers Stage 1 + Stage 2 pipeline"
        ],
        "note": "CRITICAL: Runs BEFORE Stage 2 hashing",
        "output": "Files marked with statuses (using metadata only)"
      },
      {
        "id": "phase_1.6",
        "name": "Group Timestamp Update (Tentative)",
        "location": "useUploadTable-addition.js:88-114",
        "thread": "main",
        "timing": "150-200ms",
        "challenge": "⚠️ TIMING MISMATCH: Runs before Stage 2 hashes are available",
        "actions": [
          "Collect hashes from new batch (if available)",
          "Collect referenceFileIds from tentative duplicates (no hash yet)",
          "Update groupTimestamp for ALL files in matching groups",
          "This moves duplicate groups to top of queue"
        ],
        "workaround": "Uses referenceFileId to group tentative duplicates",
        "output": "Tentative grouping applied (refined later in Stage 2 wrapper)"
      },
      {
        "id": "stage_1",
        "name": "Stage 1: Pre-filter (Metadata)",
        "location": "useSequentialPrefilter.js:65-234",
        "thread": "main",
        "timing": "Concurrent with Phase 1.5",
        "actions": [
          "Remove files with status='redundant' (from previous batch)",
          "Sort ALL files: size (asc) → date (asc) → name (alpha)",
          "Sequential comparison with previous file",
          "Folder path relationship analysis",
          "Mark files: 'ready' (primary), 'copy', or 'duplicate'"
        ],
        "output": {
          "primary_files": "Unique files ready to upload",
          "copy_files": "Same content, different meaningful metadata",
          "duplicate_files": "Same content, folder path variations only",
          "referenceFileId": "Points to file for hash comparison in Stage 2"
        }
      },
      {
        "id": "stage_2",
        "name": "Stage 2: Hash Verification",
        "location": "useSequentialPrefilter.js:249-391",
        "thread": "main (or web worker)",
        "timing": "After Stage 1 complete",
        "actions": [
          "Wait for pre-filter completion (max 10 attempts)",
          "Hash ONLY 'copy' and 'duplicate' files",
          "Use referenceFileId to find comparison file",
          "Compare BLAKE3 hashes",
          "If hashes differ → upgrade to 'ready' (primary)",
          "If hashes match + status='duplicate' → mark as 'redundant'"
        ],
        "note": "Uses referenceFileId (not just previous file) for flexibility",
        "output": {
          "verified_copies": "Hash matches, metadata differs",
          "redundant_files": "Hash matches, marked for removal in NEXT batch",
          "upgraded_primaries": "Hash mismatch, actually unique"
        }
      },
      {
        "id": "stage_2_wrapper",
        "name": "Stage 2 Wrapper: Auto-verification + Grouping Fix",
        "location": "useSequentialVerification.js:102-211",
        "thread": "main",
        "timing": "After queue addition complete",
        "actions": [
          "Auto-trigger Stage 2 when queue addition completes",
          "Call verifyHashesForCopiesAndDuplicates()",
          "⭐ CRITICAL FIX: Update groupTimestamp AFTER hash verification",
          "Collect verified hashes from redundant + verified copy files",
          "Update groupTimestamp for ALL files in verified groups",
          "Sort queue to move groups to top"
        ],
        "purpose": "Fixes timing mismatch from Phase 1.6",
        "output": "Accurate grouping based on actual hash values"
      }
    ],
    "lifecycle": {
      "name": "Two-Phase Cleanup Lifecycle",
      "stages": [
        {
          "status": "duplicate",
          "description": "Metadata indicates likely duplicate (no hash yet)"
        },
        {
          "status": "redundant",
          "description": "Hash verified duplicate (marked in Stage 2)",
          "timing": "NOT removed immediately"
        },
        {
          "status": "removed",
          "description": "Deleted in Stage 1 of NEXT batch",
          "timing": "Next batch's Stage 1 (step 3)"
        }
      ],
      "rationale": "Prevents race conditions between batches"
    }
  }
}
```

---

## Phase-by-Phase Breakdown

### Phase 1: Quick Feedback (0-50ms)

**File:** `src/features/upload/composables/useUploadTable-addition.js:48-86`

```javascript
// Sort files by folder path WITHIN each batch
const sortedFiles = [...files].sort((a, b) => {
  const pathA = extractFolderPath(a);
  const pathB = extractFolderPath(b);
  return pathA.localeCompare(pathB);
});

// Process first 200 files for immediate UI feedback
const phase1Files = sortedFiles.slice(0, 200);
```

**Purpose:** Render initial table quickly (<100ms target) while larger batches process in background.

---

### Phase 1.5: Deduplication Check (50-150ms)

**File:** `src/features/upload/composables/useUploadTable-addition.js:76-86`

```javascript
// Capture queue snapshot BEFORE running deduplication
const existingQueueSnapshot = [...uploadQueue.value];

// Run deduplication BEFORE adding to queue
await deduplicateAgainstExisting(phase1Batch, existingQueueSnapshot);
```

**Purpose:** Ensure files have correct statuses when first rendered. Triggers Stage 1 + 2 pipeline.

---

### Phase 1.6: Group Timestamp Update (Tentative) (150-200ms)

**File:** `src/features/upload/composables/useUploadTable-addition.js:88-114`

```javascript
// Collect hashes AND referenceFileIds (for tentative duplicates without hashes)
const newHashes = new Set(phase1Batch.filter(f => f.hash).map(f => f.hash));
const newReferenceIds = new Set(
  phase1Batch.filter(f => f.referenceFileId && !f.hash).map(f => f.referenceFileId)
);

// Update groupTimestamp for matching files
uploadQueue.value.forEach(file => {
  const matchesHash = file.hash && newHashes.has(file.hash);
  const matchesReferenceId = file.id && newReferenceIds.has(file.id);
  const isTentativeInGroup = file.referenceFileId && newReferenceIds.has(file.referenceFileId);

  if (matchesHash || matchesReferenceId || isTentativeInGroup) {
    file.groupTimestamp = currentTimestamp; // Move group to top
  }
});
```

**Challenge:** This runs BEFORE Stage 2 hashing, so it must use `referenceFileId` to group tentative duplicates.

**Workaround:** Stage 2 wrapper (Phase 6) updates groupTimestamp AGAIN after hash verification.

---

### Stage 1: Pre-filter (Metadata Comparison)

**File:** `src/features/upload/composables/useSequentialPrefilter.js:65-234`

#### Step 1-2: Sort and Initialize

```javascript
// Sort: size (asc) → date (asc) → name (alpha)
const sortedFiles = [...allFiles].sort((a, b) => {
  if (a.size !== b.size) return a.size - b.size;
  if (a.sourceLastModified !== b.sourceLastModified) {
    return a.sourceLastModified - b.sourceLastModified;
  }
  return a.name.localeCompare(b.name);
});

// First file is always primary
sortedFiles[0].status = 'ready';
sortedFiles[0].isPrimary = true;
```

#### Step 3: Remove Redundant Files (NEW)

```javascript
// Remove files marked as 'redundant' from previous Stage 2 processing
const redundantFiles = sortedFiles.filter(file => file.status === 'redundant');
const filteredFiles = sortedFiles.filter(file => file.status !== 'redundant');
```

**Evolution:** This step was added to implement the two-phase cleanup lifecycle.

#### Steps 4-9: Sequential Comparison

```javascript
for (let i = 1; i < sortedFiles.length; i++) {
  const currentFile = sortedFiles[i];
  const previousFile = sortedFiles[i - 1];

  // Step 4: Different size → Primary
  if (currentFile.size !== previousFile.size) {
    currentFile.status = 'ready';
    currentFile.isPrimary = true;
    continue;
  }

  // Step 5: Tentatively mark as Copy
  currentFile.status = 'copy';
  currentFile.referenceFileId = previousFile.id; // For Stage 2 comparison

  // Step 6: Different date → Keep as Copy
  if (currentFile.sourceLastModified !== previousFile.sourceLastModified) continue;

  // Step 7: Different name → Keep as Copy
  if (currentFile.name !== previousFile.name) continue;

  // Step 8: Folder path comparison
  const pathComparison = compareFolderPaths(currentFile.folderPath, previousFile.folderPath);

  switch (pathComparison) {
    case 'identical':
    case 'path1_longer':
    case 'path2_longer':
      // Folder path variations only → Duplicate
      currentFile.status = 'duplicate';
      currentFile.isDuplicate = true;
      break;
    case 'different':
      // Different paths → Keep as Copy
      break;
  }
}
```

**Output:** Files marked as `ready`, `copy`, or `duplicate` based on metadata alone.

---

### Stage 2: Hash Verification

**File:** `src/features/upload/composables/useSequentialPrefilter.js:249-391`

#### Steps 11-13: Wait for Pre-filter

```javascript
// Wait for pre-filter to complete (max 10 attempts × 1000ms)
while (!preFilterCompleteCheck() && attempts < 10) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  attempts++;
}
```

#### Steps 14-16: Hash and Compare

```javascript
for (let i = 1; i < sortedFiles.length; i++) {
  const currentFile = sortedFiles[i];

  // Only process 'copy' or 'duplicate' files
  if (currentFile.status !== 'duplicate' && currentFile.status !== 'copy') {
    continue;
  }

  // Find reference file (not necessarily previous in array)
  const referenceFile = fileIndex.get(currentFile.referenceFileId);

  // Calculate hashes (if not already done)
  if (!currentFile.hash) {
    currentFile.hash = await hashFunction(currentFile.sourceFile);
  }
  if (!referenceFile.hash) {
    referenceFile.hash = await hashFunction(referenceFile.sourceFile);
  }

  // Compare hashes
  if (currentFile.hash !== referenceFile.hash) {
    // Hashes differ → Upgrade to Primary
    currentFile.status = 'ready';
    currentFile.isPrimary = true;
  } else if (currentFile.status === 'duplicate') {
    // Hashes match + Duplicate status → Mark as Redundant
    currentFile.status = 'redundant';
    currentFile.isRedundant = true;
  }
  // else: status='copy' + hash match → Keep as Copy
}
```

**Key Evolution:** Uses `referenceFileId` instead of always comparing with previous file, providing flexibility for future optimizations.

---

### Stage 2 Wrapper: Auto-verification + Grouping Fix

**File:** `src/features/upload/composables/useSequentialVerification.js:102-211`

#### Fix for Timing Mismatch (Lines 146-188)

```javascript
// Collect hashes from verified files (NOW we have actual hash values)
const verifiedHashes = new Set();

// Redundant files (hash-verified duplicates)
redundantFiles.forEach(file => {
  if (file.hash) verifiedHashes.add(file.hash);
});

// Verified copies (files that stayed as 'copy' after hash verification)
const verifiedCopies = uploadQueue.value.filter(
  file => file.status === 'copy' && file.hash && filesNeedingVerification.some(f => f.id === file.id)
);
verifiedCopies.forEach(file => {
  if (file.hash) verifiedHashes.add(file.hash);
});

// Update groupTimestamp for ALL files with verified hashes
if (verifiedHashes.size > 0) {
  const currentTimestamp = Date.now();
  uploadQueue.value.forEach(file => {
    if (file.hash && verifiedHashes.has(file.hash)) {
      file.groupTimestamp = currentTimestamp; // Accurate grouping now!
    }
  });

  // Sort queue to move groups to top
  sortQueueByGroupTimestamp();
}
```

**Purpose:** This is the SECOND groupTimestamp update, using actual hash values instead of tentative referenceFileIds.

---

## Comparison: Original Plan vs Current Implementation

| Aspect | Original Plan | Current Implementation | Rationale for Change |
|--------|---------------|------------------------|----------------------|
| **Stage 1 Steps** | 1-10 (Pre-filter) | 1-10 + Step 3 (Remove redundant) | Two-phase cleanup lifecycle |
| **Stage 2 Steps** | 11-16 (Hash verification) | 11-16 (Same logic) | ✅ Implemented as designed |
| **Duplicate Status** | Mark as "Duplicate" | Mark as "Duplicate" → "Redundant" | Lifecycle: Duplicate → Redundant → Removed |
| **Deletion Timing** | Not specified | Delayed to next batch (Stage 1 step 3) | Prevents race conditions |
| **Folder Path Logic** | 8a, 8b, 8c (identical/endsWith) | ✅ Exact implementation | Matches original design |
| **Hash Comparison** | "Compare with previous file" | "Compare with referenceFileId" | Flexibility for future optimization |
| **UI Grouping** | Not in plan | Phase 1.6 + Stage 2 wrapper | UX requirement: group duplicates at top |
| **Timing Coordination** | Not addressed | Phase 1.6 (tentative) + Stage 2 wrapper (final) | Solves timing mismatch problem |
| **Web Worker** | Specified for Stage 2 | Currently main thread (web worker ready) | Performance adequate for now |

---

## Key Evolution Points

### 1. Two-Phase Cleanup Lifecycle

**Problem:** Immediate deletion during Stage 2 could cause race conditions when multiple batches are dropped rapidly.

**Solution:**
```
Duplicate → (hash match in Stage 2) → Redundant → (next batch Stage 1) → Removed
```

**Code:**
- **Stage 2** marks files as `redundant`: `useSequentialPrefilter.js:356-363`
- **Stage 1** removes `redundant` files: `useSequentialPrefilter.js:95-111`

---

### 2. Group Timestamp Management

**Problem:** UI requirement to group duplicate files together and move groups to top when new duplicates added.

**Challenge:** Phase 1.6 runs BEFORE Stage 2 hashing, so hash values aren't available yet.

**Solution (Two-Step Approach):**

1. **Phase 1.6** (tentative grouping): Uses `referenceFileId` to group files that MIGHT be duplicates
   - Location: `useUploadTable-addition.js:88-114`
   - Uses: `newReferenceIds` to identify tentative duplicate groups

2. **Stage 2 Wrapper** (accurate grouping): Updates groupTimestamp AFTER hash verification
   - Location: `useSequentialVerification.js:146-188`
   - Uses: `verifiedHashes` from actual BLAKE3 hash values

**Recent Fix (2025-11-16):** PR #386 added Stage 2 wrapper groupTimestamp update to fix duplicate file grouping issues.

---

### 3. Reference File ID Pattern

**Evolution:** Original plan said "compare with previous file" (implying array index i-1).

**Current:** Uses `referenceFileId` to explicitly track which file to compare with.

**Benefits:**
- Decouples comparison logic from array order
- Enables future optimizations (e.g., skip-ahead for unique sizes)
- More explicit and easier to debug

**Code:** `useSequentialPrefilter.js:148` (Stage 1 sets it), `useSequentialPrefilter.js:309` (Stage 2 uses it)

---

### 4. Pre-filter Complete Check

**Problem:** Stage 2 (hash verification) must wait for Stage 1 (pre-filter) to finish.

**Solution:** Added explicit completion flag with timeout protection.

**Code:**
```javascript
// Orchestrator (useUploadTableDeduplicationSequential.js:21-25)
let preFilterComplete = false;

// Stage 1 marks complete (line 62)
preFilterComplete = true;

// Stage 2 checks with timeout (useSequentialPrefilter.js:256-271)
while (!preFilterCompleteCheck() && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  attempts++;
}
```

---

## Critical Terminology

Per `CLAUDE.md` section 4 (DEDUPLICATION TERMINOLOGY):

| Term | Definition | Upload Behavior | Metadata Recorded |
|------|------------|-----------------|-------------------|
| **Primary** | Files with unique content OR best version in a group | ✅ Uploaded to storage | ✅ Yes |
| **Copy** | Same hash, different meaningful metadata | ❌ NOT uploaded (storage deduped) | ✅ Yes (informational value) |
| **Duplicate** | Same hash, same core metadata (folder path variations only) | ❌ NOT uploaded | ❌ No (no informational value) |
| **Redundant** | Hash-verified duplicates awaiting removal in next batch | ❌ NOT uploaded | ❌ No (marked for deletion) |

**File Metadata:** Filesystem attributes (name, size, modified date, path) that do NOT affect hash value.

---

## Code References

### Primary Implementation Files

| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| `useSequentialPrefilter.js` | Stage 1 & 2 algorithms | 1-392 | `applySequentialPrefilter()`, `verifyWithHashing()` |
| `useUploadTable-addition.js` | Phase 1, 1.5, 1.6 logic | 29-272 | `addFilesToQueue()` (lines 88-114: Phase 1.6) |
| `useSequentialVerification.js` | Stage 2 wrapper + auto-trigger | 1-273 | `startVerification()` (lines 146-188: groupTimestamp fix) |
| `useUploadTableDeduplicationSequential.js` | Orchestrator | 1-107 | `deduplicateAgainstExisting()`, `verifyHashesForCopiesAndDuplicates()` |

### Key Logic Sections

| Description | File | Lines |
|-------------|------|-------|
| **Remove redundant files (Step 3)** | `useSequentialPrefilter.js` | 95-111 |
| **Sequential metadata comparison (Steps 4-9)** | `useSequentialPrefilter.js` | 126-208 |
| **Folder path comparison logic (Step 8)** | `useSequentialPrefilter.js` | 37-53, 164-205 |
| **Hash verification loop (Steps 14-16)** | `useSequentialPrefilter.js` | 285-368 |
| **Mark as redundant (Step 15)** | `useSequentialPrefilter.js` | 356-363 |
| **Phase 1.6 tentative grouping** | `useUploadTable-addition.js` | 88-114 |
| **Stage 2 wrapper groupTimestamp fix** | `useSequentialVerification.js` | 146-188 |

### Tests

| Test File | Coverage | Status |
|-----------|----------|--------|
| `tests/unit/features/upload/composables/useSequentialPrefilter.test.js` | Stage 1 & 2 algorithms | ✅ 12 tests passing |

---

## Next Steps / Future Optimizations

1. **Web Worker Migration:** Move Stage 2 hashing to web worker for true background processing
2. **Incremental Hashing:** Start hashing Copy/Duplicate files during Stage 1 (speculative)
3. **Skip-Ahead Optimization:** Use size-based grouping to skip files with unique sizes entirely
4. **Parallel Hashing:** Hash multiple files concurrently (worker pool)
5. **Persistent Hash Cache:** Store hashes in IndexedDB for cross-session deduplication

---

## References

- **Original Plan:** `planning/1. Ideas/BrahmClientDeDupeLogic.txt`
- **Architecture Docs:** `docs/architecture/file-processing.md` (File Deduplication Strategy)
- **Terminology Reference:** `CLAUDE.md` (DEDUPLICATION TERMINOLOGY section)
- **Recent Fix PR:** #386 - Fix duplicate file grouping by updating groupTimestamp in Stage 2
