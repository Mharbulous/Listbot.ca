# Phase 1 Constraint-Based Deduplication - Implementation Plan

**Goal:** Replace current BLAKE3-based deduplication in `/constraint` page with Phase 1 constraint-based logic using **direct string comparison** (not hashing) for metadata checks.

**Context:** Virtual scrolling already copied from Uploadv2 and working. Only deduplication logic needs replacement.

**Key Insight:** Direct string comparison is 10-50x faster than metadata hashing while achieving the same result.

---

## 1. Core Logic Differences

### Current (useConstraintTable.js)
```
Layer 1: Size grouping
Layer 2: Metadata pre-filter (tentative dup/copy based on metadata+path)
Layer 3: BLAKE3 content hash (for ready files)
```

### Phase 1 Target (REVISED)
```
Layer 1: Size-based index (O(1) grouping)
Layer 3: Direct string comparison (firmID + modDate + name + ext + folderPath)  ← ~1-2μs
Layer 2: Content hash via XXH3 or BLAKE3 (only if Layer 3 finds no exact match)
```

**Critical Optimization:** Layer 3 before Layer 2 catches "same folder twice" with direct string comparison (~1-2μs), avoiding expensive content hashes (~1-5ms each).

---

## 2. Implementation Scope

### Files to Modify

1. **`src/features/constraint/composables/useConstraintTable.js`**
   - Replace `deduplicateAgainstExisting()` function only
   - Keep everything else unchanged

2. **`src/features/constraint/composables/useQueueCore.js`**
   - Add `findBestMatchingFile()` for folder path hierarchy (copy from Uploadv2)
   - Add `generateContentHash()` (XXH3 or BLAKE3 - decision point)

3. **DO NOT TOUCH:**
   - `ConstraintTableVirtualizer.vue` - virtual scrolling working perfectly
   - Any virtualization code

---

## 3. Deduplication Algorithm (Phase 1 - REVISED)

### Core Logic (Direct String Comparison)
```javascript
async function deduplicateAgainstExisting(newQueueItems, existingQueueSnapshot) {
  const authStore = useAuthStore();
  const firmId = authStore.currentUser?.uid; // Solo Firm: firmId === userId

  // LAYER 1: Size-based grouping (O(1))
  const existingSizeMap = new Map();
  existingQueueSnapshot.forEach(file => {
    if (!existingSizeMap.has(file.size)) {
      existingSizeMap.set(file.size, []);
    }
    existingSizeMap.get(file.size).push(file);
  });

  // Pre-build metadata indices for O(1) lookups
  const metadataIndicesBySize = new Map();
  for (const [size, items] of existingSizeMap) {
    const metadataIndex = new Map();
    items.forEach(item => {
      const ext = item.name.substring(item.name.lastIndexOf('.'));
      // CRITICAL: Order matters for consistency
      const metadataKey = `${firmId}|${item.sourceLastModified}|${item.name}|${ext}`;
      
      if (!metadataIndex.has(metadataKey)) {
        metadataIndex.set(metadataKey, []);
      }
      metadataIndex.get(metadataKey).push(item);
    });
    metadataIndicesBySize.set(size, metadataIndex);
  }

  // Process new files: Layer 1 → Layer 3 → Layer 2
  for (const newFile of newQueueItems) {
    // LAYER 1: Check for unique size (O(1))
    const existingSizeGroup = existingSizeMap.get(newFile.size);
    if (!existingSizeGroup) {
      newFile.status = 'ready';
      newFile.canUpload = true;
      continue;
    }

    // LAYER 3: Direct string comparison (NO hashing)
    const ext = newFile.name.substring(newFile.name.lastIndexOf('.'));
    const metadataKey = `${firmId}|${newFile.sourceLastModified}|${newFile.name}|${ext}`;
    
    const metadataIndex = metadataIndicesBySize.get(newFile.size);
    const existingMatches = metadataIndex.get(metadataKey);

    if (!existingMatches) {
      // No metadata matches → needs content hash (Layer 2)
      filesToHash.push(newFile);
      continue;
    }

    // FOLDER PATH HIERARCHY: Use Uploadv2 logic
    const { file: bestMatch, type } = findBestMatchingFile(newFile, existingMatches);
    
    if (type === 'duplicate') {
      // Exact duplicate → skip Layer 2
      newFile.status = 'duplicate';
      newFile.canUpload = false;
      newFile.primaryFileId = bestMatch.id;
    } else {
      // Different paths → need content hash (Layer 2)
      filesToHash.push(newFile);
    }
  }

  // LAYER 2: Content hash (only for files that passed Layer 3)
  // [Standard content hashing logic here]
}
```

### Folder Path Hierarchy Helper (from Uploadv2)
```javascript
function findBestMatchingFile(newFile, existingMatches) {
  for (const existing of existingMatches) {
    // EXACT MATCH: Same folder path → duplicate
    if (newFile.folderPath === existing.folderPath) {
      return { file: existing, type: 'duplicate' };
    }
    
    // Parent/child relationship logic...
    // (Copy full implementation from Uploadv2)
  }
  
  return { file: existingMatches[0], type: 'copy' };
}
```

---

## 4. Content Hash Implementation

**Decision Point:** XXH3 (2-3x faster) vs BLAKE3 (cryptographic)

### Option A: XXH3 (Recommended)
```javascript
import { h64 } from 'xxhash-wasm';

async function generateContentHash(file) {
  const hasher = await h64();
  const buffer = await file.arrayBuffer();
  return hasher(new Uint8Array(buffer));
}
```

### Option B: BLAKE3 (Current)
```javascript
import { blake3 } from 'hash-wasm';

async function generateContentHash(file) {
  const buffer = await file.arrayBuffer();
  return await blake3(new Uint8Array(buffer), 128);
}
```

---

## 5. Performance Expectations

### Scenario: Upload same 5,000-file folder twice

**Current (BLAKE3):** ~5-25 seconds
**Phase 1 (String comparison):** 
- Layer 3: 10,000 × ~1-2μs = **~10-20ms**
- Layer 2: 0 files (caught by Layer 3) = 0ms
- **Total: ~10-20ms** (500-2500x faster)

---

## 6. Critical Non-Obvious Implementation Details

### FirmId Integration (Multi-tenant)
```javascript
// MUST use Solo Firm architecture
const firmId = authStore.currentUser?.uid; // firmId === userId
```

### Metadata Key String Format
```javascript
// Order MUST be consistent for Map lookups
const metadataKey = `${firmId}|${modDate}|${name}|${ext}`;
// NOT: `${name}|${firmId}|...` ← breaks deduplication
```

### Layer Processing Order
```
CRITICAL: Layer 1 → Layer 3 → Layer 2
NOT:      Layer 1 → Layer 2 → Layer 3  ← defeats optimization
```

### Queue Item Schema Changes
```javascript
{
  // ADD:
  contentHash: string,    // Layer 2 result (XXH3 or BLAKE3)
  primaryFileId: string,  // Reference for duplicates/copies
  
  // REMOVE: (Phase 3a tentative verification fields)
  referenceFileId: string,     // No longer needed
  tentativeGroupId: string,    // No longer needed
  hash: string,                // Replace with contentHash
}
```

### Remove Tentative Verification System
- **Delete:** `useTentativeVerification` composable usage
- **Delete:** `verificationState` tracking
- **Delete:** Verification triggers (hover, delete, upload)
- **Result:** Files have final status immediately (no lazy evaluation)

---

## 7. What NOT to Touch (Fragile Systems)

### Virtual Scrolling (CRITICAL - DO NOT MODIFY)
```vue
<!-- This CSS transform coupling breaks easily -->
<div :style="{ transform: `translateY(${virtualRow.start}px)` }">
```
- `ConstraintTableVirtualizer.vue` - working perfectly
- Any TanStack Virtual integration code

### Queue Management (Keep As-Is)
- `sortQueueByGroupTimestamp()` - but remove tentativeGroupId logic
- `swapCopyToPrimary()` - unchanged
- Phase 1/Phase 2 batch processing - unchanged

---

## 8. Implementation Checklist

- [ ] Copy `findBestMatchingFile()` from Uploadv2 → useQueueCore
- [ ] Choose content hash algorithm (XXH3 vs BLAKE3)
- [ ] Replace `deduplicateAgainstExisting()` with string comparison logic
- [ ] Update queue item schema (add contentHash, primaryFileId)
- [ ] Remove tentative verification composable and triggers
- [ ] Simplify `sortQueueByGroupTimestamp()` (no tentativeGroupId)
- [ ] Test: Same folder twice (should complete in ~10-20ms)
- [ ] Test: Different folders (should mark as 'copy')
- [ ] Verify virtual scrolling unchanged

---

## 9. Success Criteria

✅ Same folder uploaded twice → Layer 3 catches all duplicates in ~10-20ms
✅ No tentative states - files have final status immediately
✅ FirmID integration working (multi-tenant ready)
✅ Virtual scrolling performance unchanged
✅ 500-2500x performance improvement over current approach

---

## Performance Reality Check: Why String Comparison > Hashing

**String concatenation + Map lookup:**
```javascript
const key = `${firmId}|${modDate}|${name}|${ext}`;  // ~0.1μs
const match = metadataIndex.get(key);              // ~1-2μs
// Total: ~1-2μs
```

**XXH3 metadata hash (original plan):**
```javascript
const hash = await XXH3(`${firmId}|${modDate}|${name}|${ext}`);  // ~10-50μs
const match = metadataIndex.get(hash);                          // ~1-2μs
// Total: ~11-52μs
```

**Winner: Direct string comparison** (5-50x faster)

The hash adds overhead without benefit since we're doing the same comparison either way.