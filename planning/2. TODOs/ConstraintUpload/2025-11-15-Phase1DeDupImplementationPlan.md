# Phase 1 Constraint-Based Deduplication - Implementation Plan

**Goal:** Replace current BLAKE3-based deduplication in `/constraint` page with Phase 1 constraint-based logic using XXH3 hashing.

**Context:** Virtual scrolling already copied from Uploadv2 and working. Only deduplication logic needs replacement.

---

## 1. Core Logic Differences

### Current (useConstraintTable.js)
```
Layer 1: Size grouping
Layer 2: Metadata pre-filter (tentative dup/copy based on metadata+path)
Layer 3: BLAKE3 content hash (for ready files)
```

### Phase 1 Target (from diagram)
```
Layer 1: Size-based index (O(1) grouping)
Layer 3: XXH3 Metadata hash (firmID + modDate + name + ext)  ← BEFORE content
Layer 2: XXH3 Content hash (only if metadata hash is new)
```

**Critical Optimization:** Layer 3 before Layer 2 catches "same folder twice" with cheap metadata hash (~10-50μs), avoiding 5,000+ expensive content hashes (~1-5ms each).

---

## 2. Implementation Scope

### Files to Modify

1. **`src/features/constraint/composables/useConstraintTable.js`**
   - Replace `deduplicateAgainstExisting()` function
   - Keep everything else (sorting, queue management, etc.)

2. **`src/features/constraint/composables/useQueueCore.js`** (NEW)
   - Add `generateXXH3Hash()` for content hashing
   - Add `generateMetadataHash()` for firmID+modDate+name+ext
   - Keep existing `chooseBestFile()` logic

3. **DO NOT TOUCH:**
   - `ConstraintTableVirtualizer.vue` - virtual scrolling working perfectly
   - `ConstraintTable.vue` - just passes props to virtualizer
   - `Constraint.vue` - view orchestration unchanged

---

## 3. Deduplication Algorithm (Phase 1)

### Input: `addFilesToQueue(files)`
```javascript
// EXISTING: Phase 1 batch processing (first 200 files)
const phase1Files = sortedFiles.slice(0, 200);

// EXISTING: Create queue items
const phase1Batch = phase1Files.map(file => ({
  id: `${Date.now()}-${index}`,
  name: file.name,
  size: file.size,
  status: 'ready',
  folderPath: extractFolderPath(file),
  sourceFile: file,
  sourceLastModified: file.lastModified,
  // ... existing fields
}));
```

### NEW: Phase 1 Deduplication Logic
```javascript
async function deduplicateAgainstExisting(newQueueItems, existingQueueSnapshot) {
  // ════════════════════════════════════════════════════════════════
  // LAYER 1: Size-Based Index (O(1) grouping)
  // ════════════════════════════════════════════════════════════════
  const sizeIndex = new Map();
  const allFiles = [...existingQueueSnapshot, ...newQueueItems];

  allFiles.forEach(file => {
    if (!sizeIndex.has(file.size)) {
      sizeIndex.set(file.size, []);
    }
    sizeIndex.get(file.size).push(file);
  });

  // Files with unique sizes → mark 'ready', skip layers 2 & 3
  for (const [size, filesWithSize] of sizeIndex) {
    if (filesWithSize.length === 1) {
      filesWithSize[0].status = 'ready';
      filesWithSize[0].canUpload = true;
      // Skip to next size group
      continue;
    }

    // Multiple files with same size → proceed to Layer 3
    await processSizeCollisions(filesWithSize);
  }
}
```

### Layer 3: Metadata Hash (BEFORE content hash)
```javascript
async function processSizeCollisions(filesWithSize) {
  // firmId MUST come from auth store (Solo Firm: firmId === userId)
  const firmId = authStore.currentUser?.uid; // or firm store

  const metadataIndex = new Map();

  for (const file of filesWithSize) {
    // ────────────────────────────────────────────────────────────
    // XXH3 Metadata Hash = XXH3(firmID + modDate + name + ext)
    // ────────────────────────────────────────────────────────────
    const metadataHash = await generateMetadataHash({
      firmId: firmId,
      modDate: file.sourceLastModified,
      name: file.name,
      extension: getFileExtension(file.name)
    });

    if (metadataIndex.has(metadataHash)) {
      // Metadata collision → mark 'duplicate'
      file.status = 'duplicate';
      file.canUpload = false;
      file.metadataHash = metadataHash;
      // Purpose: Catch "same folder twice" scenario
      continue; // Skip Layer 2
    }

    // New metadata hash → proceed to Layer 2 (content hash)
    metadataIndex.set(metadataHash, file);
    file.metadataHash = metadataHash;
    await processContentHash(file, metadataIndex);
  }
}
```

### Layer 2: Content Hash (only if metadata hash is new)
```javascript
async function processContentHash(file, contentHashIndex) {
  // ────────────────────────────────────────────────────────────
  // XXH3 Content Hash = XXH3(file content)
  // ────────────────────────────────────────────────────────────
  const contentHash = await generateXXH3Hash(file.sourceFile);
  file.xxh3Hash = contentHash; // Store for comparison

  if (contentHashIndex.has(contentHash)) {
    // Same content, different metadata → mark 'copy'
    file.status = 'copy';
    file.canUpload = false; // Don't upload (content exists)
    file.isCopy = true;
    // Metadata IS stored (meaningful difference)
  } else {
    // Unique content → mark 'ready'
    file.status = 'ready';
    file.canUpload = true;
    contentHashIndex.set(contentHash, file);
  }
}
```

---

## 4. XXH3 Hashing Implementation

### Option A: Use existing xxhash-wasm library
```javascript
import { h64 } from 'xxhash-wasm';

async function generateMetadataHash({ firmId, modDate, name, extension }) {
  const metadataString = `${firmId}|${modDate}|${name}|${extension}`;
  const hasher = await h64(); // Initialize once, reuse
  return hasher(metadataString);
}

async function generateXXH3Hash(file) {
  const buffer = await file.arrayBuffer();
  const hasher = await h64(); // Or h128 for XXH3
  return hasher(buffer);
}
```

### Option B: Use Web Worker for content hashing
```javascript
// src/features/constraint/workers/xxh3Worker.js
// Similar to existing fileHashWorker.js but with XXH3
```

**Decision Point:** Start with Option A (direct calls). Add Worker if >500 files cause UI jank.

---

## 5. Output Statuses (same as diagram)

| Status | Description | Upload? | Store Metadata? |
|--------|-------------|---------|-----------------|
| `ready` | Primary/unique file | ✅ Yes | ✅ Yes |
| `copy` | Same content, meaningful metadata | ❌ No | ✅ Yes |
| `duplicate` | Exact duplicate (same metadata+content) | ❌ No | ❌ No |

---

## 6. Performance Expectations

### Scenario: Upload same 5,000-file folder twice

**Current (BLAKE3):**
- 5,000 files × ~1-5ms BLAKE3 = ~5,000-25,000ms (5-25 seconds)

**Phase 1 (XXH3 with Layer 3 optimization):**
- Layer 1: 5,000 files × O(1) size index = ~0ms
- Layer 3: 5,000 files × ~10-50μs metadata hash = ~50-250ms
- Layer 2: 0 files (all caught by Layer 3) = 0ms
- **Total: ~50-250ms** (100x faster)

---

## 7. Migration Strategy

### Step 1: Implement XXH3 hashing utilities
- Create `generateXXH3Hash()` in useQueueCore
- Create `generateMetadataHash()` in useQueueCore
- Add xxhash-wasm dependency if not present

### Step 2: Replace deduplication logic
- Copy current `deduplicateAgainstExisting()` to backup
- Implement Phase 1 3-layer algorithm
- Keep same function signature (inputs/outputs)

### Step 3: Update queue item schema
```javascript
{
  // Existing fields...
  xxh3Hash: string,      // Layer 2 content hash
  metadataHash: string,  // Layer 3 metadata hash
  // Remove: hash (BLAKE3) - not used in Phase 1
}
```

### Step 4: Testing
- Test with same folder uploaded twice
- Test with copies in different folders
- Test with 5,000+ file batches
- Verify virtual scrolling still works (it should - no touching virtualizer)

---

## 8. What NOT to Touch

### Virtual Scrolling (FRAGILE - DO NOT MODIFY)
- `ConstraintTableVirtualizer.vue` - working perfectly
- TanStack Virtual integration
- Row positioning CSS transforms
- Scroll container management

### Why it's fragile:
```vue
<!-- CRITICAL: Tight coupling between scroll position, visible items, DOM positioning -->
<div :style="{ transform: `translateY(${virtualRow.start}px)` }">
  <!-- Any change here breaks virtualization performance -->
</div>
```

### Queue Management (KEEP AS-IS)
- `sortQueueByGroupTimestamp()` - unchanged
- `swapCopyToPrimary()` - unchanged
- `clearQueue()`, `clearDuplicates()` - unchanged
- Phase 1/Phase 2 batch processing - unchanged

---

## 9. Key Non-Obvious Details

### FirmId Source
```javascript
// MUST use Solo Firm architecture (firmId === userId)
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const firmId = authStore.currentUser?.uid;
```

### Metadata Hash String Format
```javascript
// Order matters for consistency
const metadataString = `${firmId}|${modDate}|${name}|${extension}`;
// NOT: `${name}|${firmId}|...` ← wrong order breaks deduplication
```

### Layer Processing Order
```
MUST be: Layer 1 → Layer 3 → Layer 2
NOT:     Layer 1 → Layer 2 → Layer 3  ← defeats optimization
```

### Hash Storage
```javascript
// Store BOTH hashes on file object
file.xxh3Hash = contentHash;      // Layer 2
file.metadataHash = metadataHash; // Layer 3
// Don't overwrite - both needed for swap/verification
```

### Tentative Verification (Phase 3a)
- Current implementation uses `referenceFileId` for lazy hash verification
- **Phase 1 does NOT use lazy hashing** - all hashes calculated immediately
- **Remove tentative verification logic** - files are either 'ready', 'copy', or 'duplicate' from the start
- Remove: `verifyHashOnHover()`, `verifyHashBeforeDelete()`, `verifyHashBeforeUpload()`

---

## 10. Implementation Checklist

- [ ] Add xxhash-wasm dependency
- [ ] Implement `generateXXH3Hash()` in useQueueCore
- [ ] Implement `generateMetadataHash()` in useQueueCore
- [ ] Update queue item schema (add xxh3Hash, metadataHash fields)
- [ ] Replace `deduplicateAgainstExisting()` with Phase 1 logic
- [ ] Remove tentative verification functions (Phase 3a logic)
- [ ] Update file status to 'ready'/'copy'/'duplicate' immediately (no tentative states)
- [ ] Test: Same folder uploaded twice (should catch via Layer 3)
- [ ] Test: Copies in different folders (should mark as 'copy')
- [ ] Test: 5,000+ file batch (verify performance <1 second)
- [ ] Verify virtual scrolling unaffected (it should be - no changes to virtualizer)

---

## 11. Risk Mitigation

### Virtual Scrolling Breakage
- **Risk:** Accidentally modify virtualizer, break performance
- **Mitigation:** DO NOT touch ConstraintTableVirtualizer.vue
- **Verification:** Test with 10,000 files, ensure smooth scrolling

### Hash Collision
- **Risk:** XXH3 false positives (duplicate detection when content differs)
- **Mitigation:** XXH3 128-bit hash has ~1 in 10^38 collision chance (negligible)
- **Fallback:** Add BLAKE3 verification on upload if needed (Phase 2)

### Performance Regression
- **Risk:** XXH3 slower than expected
- **Mitigation:** Benchmark before/after with 5,000 files
- **Threshold:** Phase 1 should complete in <1 second (current: 5-25 seconds)

---

## 12. Success Criteria

✅ Same 5,000-file folder uploaded twice → all duplicates caught via Layer 3 (metadata hash)
✅ Deduplication completes in <1 second (100x faster than BLAKE3)
✅ Virtual scrolling remains smooth (60 FPS with 10,000+ files)
✅ Status labels correct: 'ready' (primary), 'copy' (same content), 'duplicate' (exact match)
✅ No tentative states - all files have final status after queue processing
✅ UI unchanged - user sees same table, same interactions, just faster

---

## Appendix: Why Layer 3 Before Layer 2?

**Performance Insight from Diagram:**

When user uploads same 5,000-file folder twice:

**Without Layer 3 (metadata hash first):**
- Must content-hash all 10,000 files
- 10,000 × 1-5ms = 10-50 seconds

**With Layer 3 (metadata hash first):**
- Layer 3: 10,000 × 10-50μs = 100-500ms (metadata hash)
- Layer 2: 0 files (second batch all caught by Layer 3) = 0ms
- **Total: ~100-500ms** (100x faster)

The diagram's Layer 3 → Layer 2 ordering is the critical optimization for this use case.
