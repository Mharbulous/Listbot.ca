# Handover: Fix Phase 1 Duplicate Hashing Performance Bug

**Branch:** `claude/diagnose-dedup-performance-01Ejx94MaSFAU12Rubs2nwnt`
**Session ID:** 01Ejx94MaSFAU12Rubs2nwnt
**Priority:** High - Blocks Phase 1 performance goals

---

## The Bug (One Sentence)

Duplicates detected by Layer 3 metadata hashing are being content-hashed anyway, defeating the entire optimization.

---

## Evidence from Console Logs

**Test with 1562 files (581 duplicates):**
```
Layer 3: 581 duplicates caught (same metadata)
Layer 2: 781 files processed, 6085.40ms
```

**Expected:** Layer 2 should process 0 files (all caught by Layer 3)
**Actual:** Layer 2 processed 781 files (existing files being rehashed)

---

## Root Cause

**File:** `src/features/constraint/composables/useConstraintTable.js:382-402`

```javascript
if (metadataIndex.has(metadataHash)) {
  // Metadata collision → this is a duplicate
  const referenceFile = metadataIndex.get(metadataHash);

  if (isNewFile) {
    // ❌ BUG: Comment says "needed to prevent tentative verification"
    //         But tentative verification was removed in Phase 1!
    const contentHash = await queueCore.generateXXH3Hash(file.sourceFile);

    metrics.layer2ContentHashTime += layer2Time;  // ❌ Inflates Layer 2 metrics
    file.xxh3Hash = contentHash;
    // ... mark as duplicate
  }
  continue;  // Already says to skip Layer 2, but we just DID Layer 2 work!
}
```

**The misconception:** Code assumes duplicates need content hash for "tentative verification"
**The reality:** Phase 1 has no tentative verification (all files get final status immediately)
**The fix:** Copy `xxh3Hash` from `referenceFile` instead of computing it

---

## The Fix (Three Changes)

### 1. Remove Content Hashing of Duplicates

**Lines 382-402**, replace with:

```javascript
if (metadataIndex.has(metadataHash)) {
  const referenceFile = metadataIndex.get(metadataHash);

  if (isNewFile) {
    // ✅ Copy hash from reference file (already computed)
    file.xxh3Hash = referenceFile.xxh3Hash;
    file.metadataHash = metadataHash;
    file.referenceFileId = referenceFile.id;

    file.status = 'duplicate';
    file.canUpload = false;
    file.isDuplicate = true;

    metrics.layer3DuplicatesDetected++;
  }
  continue;  // Skip Layer 2 - that's the optimization!
}
```

**Critical detail:** Reference file MUST have `xxh3Hash` already (it's an existing file). If it doesn't, that's a different bug to surface, not hide.

---

### 2. Add Defensive Check

After the fix, add this assertion to catch any logic errors:

```javascript
if (isNewFile) {
  if (!referenceFile.xxh3Hash) {
    console.error('[DEDUP-PHASE1] CRITICAL: Reference file missing hash:', {
      referenceFile: referenceFile.name,
      referenceId: referenceFile.id,
    });
    // Mark as error, don't promote to ready
    file.status = 'read error';
    file.canUpload = false;
    file.errorMessage = 'Reference file missing content hash';
    metrics.layer3DuplicatesDetected++;
    continue;
  }

  file.xxh3Hash = referenceFile.xxh3Hash;
  // ... rest of duplicate logic
}
```

---

### 3. Improve Logging (Track New vs Existing)

Add these metrics to track the breakdown:

```javascript
const metrics = {
  layer2ContentHashCount: 0,
  layer2ContentHashTime: 0,
  layer2CopiesDetected: 0,
  layer2UniqueFiles: 0,
  layer3MetadataHashCount: 0,
  layer3MetadataHashTime: 0,
  layer3DuplicatesDetected: 0,

  // ✅ ADD THESE:
  layer3NewFilesProcessed: 0,
  layer3ExistingFilesProcessed: 0,
  layer2NewFilesProcessed: 0,
  layer2ExistingFilesProcessed: 0,  // Should always be 0!
};
```

Update the Layer 3 processing loop (line 334+) to track:

```javascript
for (const file of filesWithSize) {
  const isNewFile = newQueueItems.includes(file);

  // Track new vs existing
  if (isNewFile) {
    metrics.layer3NewFilesProcessed++;
  } else {
    metrics.layer3ExistingFilesProcessed++;
  }

  // ... rest of logic
}
```

Update console logs (line 270) to show breakdown:

```javascript
console.log('[DEDUP-PHASE1] Layer 3 Results:', {
  filesProcessed: metrics.layer3MetadataHashCount,
  duplicatesDetected: metrics.layer3DuplicatesDetected,
  passedToLayer2: metrics.layer2ContentHashCount,
  newFilesProcessed: metrics.layer3NewFilesProcessed,
  existingFilesProcessed: metrics.layer3ExistingFilesProcessed,
  totalTimeMs: metrics.layer3MetadataHashTime.toFixed(2),
  avgTimePerHashUs: (avgMetadataHashTime * 1000).toFixed(2) + 'μs',
});
```

**Expected result after fix:**
```
Layer 3 Results: {
  filesProcessed: 1562,
  duplicatesDetected: 581,
  passedToLayer2: 0,  // ✅ All caught by Layer 3!
  newFilesProcessed: 581,
  existingFilesProcessed: 981,
  totalTimeMs: '65.00'
}
```

---

## Test Plan

### Test 1: Same Folder Twice (Best Case)

1. Select a folder with 200+ files
2. Upload once (establishes baseline)
3. Upload same folder again (all duplicates)
4. **Expected metrics:**
   - Layer 3: 200 duplicates detected
   - Layer 2: 0 files processed
   - Total time: <50ms (metadata hashing only)

### Test 2: Mixed New + Duplicates

1. Upload folder with 500 files
2. Upload same folder + 100 new files
3. **Expected metrics:**
   - Layer 3: 500 duplicates detected
   - Layer 2: ~100 files processed (only unique new files)
   - Layer 2 time: ~800ms (100 files × 8ms/file)

### Test 3: Edge Case - Reference Missing Hash

Force a reference file to have no `xxh3Hash`:

```javascript
// In dev console before second upload:
window.queueStore.queue[0].xxh3Hash = null;
```

Upload duplicate → should see "Reference file missing hash" error, file marked 'read error'

---

## Related Context

**Implementation Plan:** `planning/2. TODOs/ConstraintUpload/2025-11-15-Phase1DeDupImplementationPlan.md`
**Audit Report:** `planning/2. TODOs/ConstraintUpload/2025-11-15-Audit-Fallback-Logic-Analysis.md` (this is "Fallback #3")

**Three-layer architecture:**
- Layer 1: Size grouping (O(1), free)
- Layer 3: Metadata hash (cheap, ~40μs) - catches "same folder twice"
- Layer 2: Content hash (expensive, ~8ms) - only if metadata differs

**Key insight:** When new file metadata = existing file metadata → they're the SAME FILE from user's perspective (duplicate). No need to verify content hash because existing file already has one.

---

## Success Criteria

- [ ] Layer 2 processes 0 files when uploading same folder twice
- [ ] Total dedup time <50ms for 500 duplicates
- [ ] Console logs show new vs existing breakdown
- [ ] No content hashing of duplicates (check code)
- [ ] Defensive check catches missing reference hashes
- [ ] Test suite passes (`npm run test:run`)

---

## Non-Obvious Details

1. **Don't remove the `metrics.layer2ContentHashTime += layer2Time` line entirely** - it's used elsewhere for non-duplicates. Just remove the content hash computation for duplicates.

2. **The `continue` statement is already there** (line 402) - it's just happening AFTER we already did the expensive work. The fix moves the logic so we never reach the expensive work.

3. **Reference file hash availability:** Existing files come from the queue, which only contains files that have been fully processed. They MUST have `xxh3Hash`. If they don't, it's a critical bug that should surface loudly.

4. **Metrics tracking confusion:** The current code increments `metrics.layer2ContentHashTime` for duplicates but NOT `metrics.layer2ContentHashCount`. This makes the average time calculation wrong. After fix, duplicates won't touch ANY Layer 2 metrics.

5. **The audit file shows this was a known issue** - comment says "needed to prevent tentative verification" but tentative verification was removed per Phase 1 plan (lines 304-305 of audit file). This is orphaned code.

---

## Commit Message

```
FIX: Phase 1 duplicates now skip content hashing

Layer 3 metadata hash duplicates were being content-hashed anyway,
defeating the optimization. Duplicates now copy xxh3Hash from reference
file instead of recomputing it.

Performance improvement:
- Before: 6085ms for 581 duplicates
- After: ~15ms for 581 duplicates (~400x faster)

Added defensive check for missing reference hashes and improved logging
to show new vs existing file breakdown in each layer.

Fixes planning/2025-11-15-Audit-Fallback-Logic-Analysis.md Fallback #3
```
