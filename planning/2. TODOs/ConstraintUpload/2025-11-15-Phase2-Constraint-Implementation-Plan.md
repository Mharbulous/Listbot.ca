# Phase 2: Server-Side Deduplication Implementation Plan for Constraint Page

**Status:** Implementation Plan
**Created:** 2025-11-15
**Target Page:** `http://localhost:5173/#/constraint` (`src/views/Constraint.vue`)
**Related:**
- Phase 1 Diagram: `2025-11-15-Phase1-Deduplication-Diagram.md`
- Phase 2 Diagram: `2025-11-15-Phase2-Deduplication-Diagram.md`
- Reference UI: `http://localhost:5173/#/dev/Uploadv2` (`src/dev-demos/views/Uploadv2.vue`)
- Reference Server Logic: `http://localhost:5173/#/upload` (legacy implementation)

---

## Executive Summary

This plan outlines the implementation of Phase 2 server-side deduplication for the Constraint page. The goal is to:

1. **Preserve the working virtual scrolling UI** from Uploadv2 (do NOT modify unless absolutely necessary)
2. **Implement Phase 2 deduplication logic** as diagrammed in `2025-11-15-Phase2-Deduplication-Diagram.md`
3. **Use proven data structures** from the legacy upload page and documented in `docs/architecture/FileMetadata.md`

**Critical Constraint:** The virtual scrolling table is working perfectly but is fragile. Avoid touching it unless absolutely necessary.

---

## Current State Analysis

### Constraint Page (`src/views/Constraint.vue`)

**Composables:**
- `useConstraintTable.js` - Manages queue state (Phase 1 client-side deduplication)
- `useConstraintAdapter.js` - Handles upload logic (needs Phase 2 updates)
- `useTentativeVerification.js` - Post-queue verification

**Upload Flow:**
```javascript
// Current: Only uploads files with status 'ready'
const getUploadableFiles = () => {
  return uploadQueue.value.filter(
    (file) => file.status === 'ready' && !file.skipReason
  );
};
```

**Phase 2 Gap:**
- ❌ Does NOT process files with status `copy` (Phase 2 should handle these)
- ❌ BLAKE3 hash calculated server-side but missing copy detection logic
- ❌ Does NOT append to `sources` array when file already exists

### Uploadv2 Page (`src/dev-demos/views/Uploadv2.vue`)

**Status:** Reference implementation with working virtual scrolling

**Virtual Scrolling Components:**
- `UploadTable.vue` - Main table container
- `UploadTableVirtualizer.vue` - Virtual scrolling logic (⚠️ FRAGILE - DO NOT TOUCH)
- `UploadTableRow.vue` - Row rendering
- `UploadTableHeader.vue` - Header with controls
- `UploadTableFooter.vue` - Footer with summary

**UI Features to Copy:**
- Queue progress indicator
- Duplicates visibility toggle
- Upload controls (pause/resume/cancel)
- Status filtering

### Data Structures (from `docs/architecture/FileMetadata.md`)

**Firestore Collections:**

1. **evidence Collection:**
   ```
   Path: /firms/{firmId}/matters/{matterId}/evidence/{fileHash}
   Document ID: fileHash (BLAKE3 hash - 32 hex chars)

   Fields:
   - sourceID: string (metadataHash pointing to primary sourceMetadata)
   - fileSize: number
   - processingStage: string
   - isProcessed: boolean
   - hasAllPages: boolean|null
   - tagCount: number
   - autoApprovedCount: number
   - reviewRequiredCount: number
   - updatedAt: timestamp
   - tags: { [categoryId]: { ... } }
   ```

2. **sourceMetadata Subcollection:**
   ```
   Path: /firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}
   Document ID: metadataHash (xxHash 64-bit - 16 hex chars)

   Fields:
   - sourceFileName: string (ORIGINAL CASE PRESERVED)
   - sourceLastModified: Timestamp
   - fileHash: string (BLAKE3 - 32 hex chars)
   - sourceFolderPath: string (pipe-delimited paths)
   ```

3. **uploadEvents Collection:**
   ```
   Path: /firms/{firmId}/matters/{matterId}/uploadEvents/{eventId}
   Document ID: Auto-generated Firestore ID

   Fields:
   - eventType: 'upload_success' | 'upload_duplicate' | 'upload_error' | 'upload_interrupted'
   - timestamp: timestamp
   - fileName: string
   - fileHash: string (BLAKE3)
   - metadataHash: string (xxHash)
   - firmId: string
   - userId: string
   - errorMessage: string (optional)
   ```

**Firebase Storage:**
```
Path: /firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{ext}
Note: Extension is ALWAYS lowercase in storage
```

---

## Implementation Plan

### Phase 1: Analysis & Setup (No Code Changes)

**✅ Tasks:**
1. Document current constraint adapter flow
2. Identify all differences from Phase 2 diagram
3. Map data structure fields to queue file properties
4. Identify all composables that need updates

**📁 Files to Review:**
- ✅ `src/features/constraint/composables/useConstraintAdapter.js`
- ✅ `src/dev-demos/upload/composables/useUploadAdapter.js` (reference)
- ✅ `src/features/upload/composables/useFileProcessor.js` (legacy reference)
- ✅ `src/features/upload/composables/useFileMetadata.js` (legacy reference)
- ✅ `docs/architecture/FileMetadata.md`

---

### Phase 2: Update useConstraintAdapter.js

**Goal:** Implement Phase 2 server-side deduplication logic

#### 2.1 Update `getUploadableFiles()`

**Current:**
```javascript
const getUploadableFiles = () => {
  return uploadQueue.value.filter(
    (file) => file.status === 'ready' && !file.skipReason
  );
};
```

**Phase 2:**
```javascript
const getUploadableFiles = () => {
  // Phase 2: Process BOTH 'ready' and 'copy' files
  // - ready: Files to upload (unique or best from copy group)
  // - copy: Same content as ready file, metadata-only upload
  return uploadQueue.value.filter(
    (file) =>
      (file.status === 'ready' || file.status === 'copy') &&
      !file.skipReason // Exclude .lnk files
  );
};
```

**Rationale:** Phase 2 must process both `ready` and `copy` files. `copy` files skip storage upload but metadata is saved.

#### 2.2 Update `processSingleFile()` - Add BLAKE3 Always

**CRITICAL:** BLAKE3 must ALWAYS be calculated at Phase 2, even for files marked `copy` in Phase 1.

**Reason:** Phase 1 uses XXH3 (non-cryptographic). Cannot rely on it for server decisions due to potential false positives.

**Current Flow:**
```javascript
async processSingleFile(queueFile, abortSignal) {
  // Step 1: Update status to hashing
  updateFileStatus(queueFile.id, 'hashing');

  // Step 2: Calculate BLAKE3 hash
  const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
  queueFile.hash = fileHash;

  // Step 3: Check if file exists in Firestore
  updateFileStatus(queueFile.id, 'checking');
  const existsResult = await fileProcessor.checkFileExists(fileHash);

  if (existsResult.exists) {
    // File exists - metadata only
    updateFileStatus(queueFile.id, 'skipped');
    await createMetadataRecord({ ... });
    return { success: true, skipped: true };
  }

  // Step 4: Upload file to storage
  updateFileStatus(queueFile.id, 'uploading');
  await fileProcessor.uploadSingleFile(...);

  // Step 5: Create metadata record
  updateFileStatus(queueFile.id, 'creating_metadata');
  await createMetadataRecord({ ... });

  // Step 6: Mark completed
  updateFileStatus(queueFile.id, 'completed');
  return { success: true, skipped: false };
}
```

**Phase 2 Updates:**

1. **NEVER skip BLAKE3 calculation** (already implemented correctly)
2. **When file exists:** Append to `sources` array instead of creating new metadata record
3. **Add logging:** Distinguish between "new primary file" vs "copy detected"

**Updated Logic:**
```javascript
// Step 3: Check if file exists in Firestore
updateFileStatus(queueFile.id, 'checking');
const evidenceRef = doc(db, `firms/${firmId}/matters/${matterId}/evidence`, fileHash);
const evidenceSnap = await getDoc(evidenceRef);

if (evidenceSnap.exists()) {
  // ✅ COPY DETECTED: File content already in database
  console.log(`[PHASE2] Copy detected: ${queueFile.name} (hash: ${fileHash.substring(0, 8)}...)`);
  updateFileStatus(queueFile.id, 'copy_detected');

  // Create sourceMetadata record in subcollection
  const metadataHash = generateMetadataHash(queueFile.name, queueFile.sourceLastModified, fileHash);
  const sourceMetadataRef = doc(
    db,
    `firms/${firmId}/matters/${matterId}/evidence/${fileHash}/sourceMetadata`,
    metadataHash
  );

  await setDoc(sourceMetadataRef, {
    sourceFileName: queueFile.name, // PRESERVE ORIGINAL CASE
    sourceLastModified: Timestamp.fromDate(new Date(queueFile.sourceLastModified)),
    fileHash: fileHash,
    sourceFolderPath: queueFile.folderPath || '',
  });

  console.log(`[PHASE2] Copy metadata saved: ${queueFile.name}`);
  updateFileStatus(queueFile.id, 'completed');

  return { success: true, copy: true, uploaded: false };
} else {
  // ✅ NEW PRIMARY FILE: Upload to storage + create evidence document
  console.log(`[PHASE2] New primary file: ${queueFile.name} (hash: ${fileHash.substring(0, 8)}...)`);

  // Upload to storage (current implementation is correct)
  updateFileStatus(queueFile.id, 'uploading');
  const uploadResult = await fileProcessor.uploadSingleFile(...);

  // Create evidence document
  updateFileStatus(queueFile.id, 'creating_metadata');
  const metadataHash = generateMetadataHash(queueFile.name, queueFile.sourceLastModified, fileHash);

  // Create evidence document
  await setDoc(evidenceRef, {
    sourceID: metadataHash,
    fileSize: queueFile.size,
    processingStage: 'uploaded',
    isProcessed: false,
    hasAllPages: null,
    tagCount: 0,
    autoApprovedCount: 0,
    reviewRequiredCount: 0,
    updatedAt: serverTimestamp(),
    tags: {},
  });

  // Create sourceMetadata record in subcollection
  const sourceMetadataRef = doc(
    db,
    `firms/${firmId}/matters/${matterId}/evidence/${fileHash}/sourceMetadata`,
    metadataHash
  );

  await setDoc(sourceMetadataRef, {
    sourceFileName: queueFile.name, // PRESERVE ORIGINAL CASE
    sourceLastModified: Timestamp.fromDate(new Date(queueFile.sourceLastModified)),
    fileHash: fileHash,
    sourceFolderPath: queueFile.folderPath || '',
  });

  console.log(`[PHASE2] Primary file uploaded and metadata saved: ${queueFile.name}`);
  updateFileStatus(queueFile.id, 'completed');

  return { success: true, copy: false, uploaded: true };
}
```

#### 2.3 Create `generateMetadataHash()` Helper

**Purpose:** Generate xxHash 64-bit hash for sourceMetadata document ID

**Implementation:**
```javascript
import { xxh64 } from 'xxhash-wasm';

let xxhashInstance = null;

async function initXXHash() {
  if (!xxhashInstance) {
    xxhashInstance = await xxh64();
  }
  return xxhashInstance;
}

async function generateMetadataHash(fileName, lastModified, fileHash) {
  const xxhash = await initXXHash();
  const input = `${fileName}|${lastModified}|${fileHash}`;
  const hash = xxhash.h64(input);
  return hash.toString(16).padStart(16, '0'); // 16 hex characters
}
```

**Add to:** `src/features/constraint/composables/useConstraintAdapter.js`

#### 2.4 Update Upload Summary Logic

**Current:**
```javascript
if (result.success) {
  if (result.skipped) {
    skippedCount++;
  } else {
    uploadedCount++;
  }
}
```

**Phase 2:**
```javascript
if (result.success) {
  if (result.copy) {
    // Copy detected - metadata saved, storage upload skipped
    copiesCount++;
  } else if (result.uploaded) {
    // New primary file - full upload
    uploadedCount++;
  }
}

// Update completion message
console.log('[UPLOAD] ========================================');
console.log('[UPLOAD] BATCH UPLOAD COMPLETE (PHASE 2)');
console.log('[UPLOAD] ========================================');
console.log(`[UPLOAD] Total files: ${filesToUpload.length}`);
console.log(`[UPLOAD] New primary files uploaded: ${uploadedCount}`);
console.log(`[UPLOAD] Copies detected (metadata only): ${copiesCount}`);
console.log(`[UPLOAD] Failed: ${failedCount}`);
console.log(`[UPLOAD] Duration: ${durationSeconds}s`);
console.log('[UPLOAD] ========================================');
```

#### 2.5 Add uploadEvents Logging

**Purpose:** Create audit trail for all upload attempts

**Implementation:**
```javascript
import { collection, addDoc } from 'firebase/firestore';

async function logUploadEvent(eventType, queueFile, fileHash, metadataHash, error = null) {
  const uploadEventsRef = collection(
    db,
    `firms/${authStore.firmId}/matters/${matterStore.currentMatterId}/uploadEvents`
  );

  await addDoc(uploadEventsRef, {
    eventType, // 'upload_success' | 'upload_duplicate' | 'upload_error'
    timestamp: serverTimestamp(),
    fileName: queueFile.name,
    fileHash: fileHash,
    metadataHash: metadataHash,
    firmId: authStore.firmId,
    userId: authStore.userId,
    errorMessage: error ? error.message : null,
  });
}
```

**Call locations:**
1. After successful primary upload: `logUploadEvent('upload_success', ...)`
2. After copy detection: `logUploadEvent('upload_duplicate', ...)`
3. After upload error: `logUploadEvent('upload_error', ..., error)`

---

### Phase 3: Update UI Components (Minimal Changes)

**Goal:** Display Phase 2 status updates without breaking virtual scrolling

#### 3.1 Update Status Labels

**File:** `src/features/constraint/components/ConstraintTableRow.vue`

**Add new status:**
- `copy_detected` - "Copy (Metadata Saved)"
- `checking` - "Checking Database..."
- `creating_metadata` - "Saving Metadata..."

**Color coding:**
- `copy_detected`: Blue (informational)
- `checking`: Yellow (in-progress)
- `creating_metadata`: Yellow (in-progress)

#### 3.2 Update Summary Card

**File:** `src/features/constraint/components/UploadSummaryCard.vue` (if exists, otherwise create)

**Display:**
- Primary files uploaded: `{uploadedCount}`
- Copies detected: `{copiesCount}`
- Total bandwidth saved: `{totalBytesSaved}` (sum of copy file sizes)

**Example:**
```
✅ Upload Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 Primary files uploaded: 150
📋 Copies (metadata only): 75
💾 Bandwidth saved: 2.3 GB
⏱️ Duration: 45.2s
```

---

### Phase 4: Testing & Validation

#### 4.1 Unit Tests

**Test Cases:**

1. **Single new file:**
   - Upload 1 file with status `ready`
   - Verify: BLAKE3 calculated, evidence created, sourceMetadata created, storage uploaded

2. **Duplicate content (copy):**
   - Upload file A (status `ready`)
   - Upload file B (same content, different name, status `copy`)
   - Verify: File A uploaded, File B metadata-only, both sourceMetadata records exist

3. **Same folder twice:**
   - Upload folder with 100 files
   - Upload same folder again
   - Verify: Phase 1 marks as `duplicate`, Phase 2 never sees them

4. **Network error during upload:**
   - Simulate network failure
   - Verify: File marked `network_error`, uploadEvent logged with error

5. **Firestore query failure:**
   - Simulate Firestore error
   - Verify: Retry with exponential backoff, eventually fail gracefully

#### 4.2 Integration Tests

**Scenarios:**

1. **Large batch (1,000+ files):**
   - Upload 1,000 files with mix of ready/copy statuses
   - Verify: Progress updates correctly, virtual scrolling still smooth
   - Verify: All evidence documents created, all sourceMetadata records exist

2. **Resume after pause:**
   - Upload 500 files, pause at file 250
   - Resume upload
   - Verify: Continues from file 251, no duplicates created

3. **Cancel during upload:**
   - Upload 100 files, cancel at file 50
   - Verify: First 50 completed, files 51-100 still in queue with `ready` status

#### 4.3 Performance Validation

**Metrics to Track:**

1. **BLAKE3 hash time:** Should be hidden in network upload time (~5-15s)
2. **Firestore query time:** ~100ms (acceptable during upload)
3. **UI responsiveness:** Virtual scrolling should remain at 60fps
4. **Memory usage:** Should not grow unbounded with large queues

**Performance Test:**
- Upload 5,000 files (mix of 2,500 unique, 2,500 copies)
- Expected results:
  - 2,500 storage uploads
  - 5,000 sourceMetadata records
  - 2,500 evidence documents
  - Zero UI lag during processing

---

### Phase 5: Documentation Updates

#### 5.1 Update Architecture Docs

**Files to update:**
1. `docs/architecture/FileMetadata.md`
   - Add Phase 2 implementation notes
   - Update code location references

2. `docs/architecture/client-deduplication-logic.md`
   - Document constraint page implementation
   - Add performance metrics

#### 5.2 Add Code Comments

**Add to `useConstraintAdapter.js`:**
```javascript
/**
 * Phase 2 Server-Side Deduplication
 *
 * This composable implements Phase 2 of the two-phase deduplication system.
 * Phase 2 happens DURING network upload after the user clicks "Upload".
 *
 * Key Steps:
 * 1. Calculate BLAKE3 hash (ALWAYS - even for files marked 'copy' in Phase 1)
 * 2. Query Firestore to check if evidence document exists
 * 3. If exists: Create sourceMetadata record only (copy detected)
 * 4. If not exists: Upload to storage + create evidence + sourceMetadata
 *
 * Performance Insight:
 * - BLAKE3 hash (~50ms) + Firestore query (~100ms) = ~150ms total
 * - Hidden behind network upload time (~5-15s per file)
 * - Users experience zero additional latency from deduplication
 *
 * Related:
 * - Phase 1: Client-side queue organization (useConstraintTable.js)
 * - Phase 2 Diagram: planning/1. Ideas/2025-11-15-Phase2-Deduplication-Diagram.md
 * - Data Structures: docs/architecture/FileMetadata.md
 */
```

---

## Implementation Checklist

### Before Starting
- [ ] Review Phase 1 & Phase 2 diagrams thoroughly
- [ ] Understand current constraint adapter flow
- [ ] Map data structures to queue file properties
- [ ] Identify all affected composables

### Code Changes
- [ ] Update `getUploadableFiles()` to include `copy` status
- [ ] Add `generateMetadataHash()` helper function
- [ ] Update `processSingleFile()` to handle copy detection
- [ ] Implement sourceMetadata subcollection creation
- [ ] Add uploadEvents logging
- [ ] Update upload summary logic
- [ ] Add Phase 2 status labels to UI components

### Data Structure Alignment
- [ ] Verify evidence collection schema matches docs
- [ ] Verify sourceMetadata subcollection schema matches docs
- [ ] Verify uploadEvents collection schema matches docs
- [ ] Verify Firebase Storage path matches docs
- [ ] Test metadataHash generation (xxHash 64-bit)

### Testing
- [ ] Unit test: Single new file upload
- [ ] Unit test: Copy detection (file already exists)
- [ ] Unit test: Error handling (network, Firestore)
- [ ] Integration test: Large batch (1,000+ files)
- [ ] Integration test: Pause/resume functionality
- [ ] Integration test: Cancel upload
- [ ] Performance test: 5,000 files (2,500 unique + 2,500 copies)
- [ ] UI test: Virtual scrolling remains smooth
- [ ] UI test: Status updates display correctly

### Validation
- [ ] Verify BLAKE3 ALWAYS calculated (never skipped)
- [ ] Verify copy files create sourceMetadata only
- [ ] Verify primary files upload to storage
- [ ] Verify evidence documents use fileHash as ID
- [ ] Verify sourceMetadata uses metadataHash as ID
- [ ] Verify uploadEvents logged for all attempts
- [ ] Verify original filename case preserved

### Documentation
- [ ] Add code comments to useConstraintAdapter.js
- [ ] Update FileMetadata.md with implementation notes
- [ ] Update client-deduplication-logic.md
- [ ] Document any edge cases discovered during testing

---

## Risk Mitigation

### High Risk: Breaking Virtual Scrolling

**Mitigation:**
- Make ZERO changes to `ConstraintTableVirtualizer.vue` unless absolutely critical
- If changes needed, create backup branch first
- Test scrolling performance after every change
- Keep changes isolated to adapter composable (business logic only)

### Medium Risk: Data Structure Mismatch

**Mitigation:**
- Cross-reference all field names with `docs/architecture/FileMetadata.md`
- Use exact paths from documentation
- Test with single file first before batch uploads
- Add validation to ensure metadataHash format is correct (16 hex chars)

### Medium Risk: Performance Degradation

**Mitigation:**
- Monitor BLAKE3 hash time (should be ~50ms for 10MB file)
- Monitor Firestore query time (should be ~100ms)
- Ensure hash + query happens DURING upload (not before)
- Profile UI frame rate during large uploads

### Low Risk: Audit Trail Incomplete

**Mitigation:**
- Log uploadEvents for ALL upload attempts (success, duplicate, error)
- Include error messages in uploadEvents when failures occur
- Test that uploadEvents are created even when uploads fail

---

## Success Criteria

✅ **Phase 2 Implementation Complete When:**

1. Files with status `ready` and `copy` are both processed during upload
2. BLAKE3 hash is ALWAYS calculated at server-side (never skipped)
3. Copy detection works: Files with existing fileHash create sourceMetadata only
4. Primary files work: New fileHash uploads to storage + creates evidence + sourceMetadata
5. Data structures match documentation exactly
6. uploadEvents logged for all upload attempts
7. Virtual scrolling remains smooth (60fps) during uploads
8. Upload summary shows primary uploads vs. copies detected
9. All unit and integration tests pass
10. Performance metrics meet targets (hash + query hidden in upload time)

---

## Non-Negotiable Requirements

Per Phase 2 diagram and `docs/architecture/client-deduplication-logic.md`:

1. ✅ **ALL metadata from ALL copies MUST be saved** - Litigation discovery requirement
2. ✅ **BLAKE3 hash ALWAYS calculated at Phase 2** - Security requirement (cannot trust Phase 1 XXH3)
3. ✅ **Hash + query DURING upload** - Performance requirement (hidden latency)
4. ✅ **BLAKE3 hash as evidence document ID** - Database-level deduplication
5. ✅ **Process ready/copy, NOT duplicate** - Duplicates filtered in Phase 1
6. ✅ **Original filename case preserved** - Only in sourceMetadata.sourceFileName
7. ✅ **No user override** - Legal compliance (can't suppress metadata)

---

## Implementation Order

**Recommended sequence to minimize risk:**

1. **Week 1: Adapter Updates (Backend Logic)**
   - Day 1-2: Add `generateMetadataHash()` helper
   - Day 2-3: Update `processSingleFile()` for copy detection
   - Day 3-4: Add uploadEvents logging
   - Day 4-5: Update upload summary logic

2. **Week 2: Testing & Validation**
   - Day 1-2: Unit tests for single file uploads
   - Day 2-3: Integration tests for large batches
   - Day 3-4: Performance testing
   - Day 4-5: Bug fixes and edge cases

3. **Week 3: UI Updates & Polish**
   - Day 1-2: Update status labels
   - Day 2-3: Add upload summary card
   - Day 3-4: Final UI polish
   - Day 4-5: Documentation updates

---

## Future Enhancements (Post-MVP)

These are NOT part of this implementation plan but should be considered later:

1. **Parallel Uploads:** Process multiple files concurrently (queue limit: 5-10)
2. **Progress Streaming:** Real-time progress updates during hash + upload
3. **Bandwidth Optimization:** Adaptive chunk sizes based on connection speed
4. **Resume Capability:** Handle interrupted uploads gracefully
5. **Batch Firestore Writes:** Use batched writes to reduce Firestore costs
6. **Smart Retry:** Exponential backoff with jitter for network errors

---

## Appendix A: Code Snippets

### A.1 Complete `generateMetadataHash()` Implementation

```javascript
import { h64 } from 'xxhash-wasm';

// Singleton instance
let xxhashInstance = null;

/**
 * Initialize xxHash instance (call once, reuse)
 */
async function initXXHash() {
  if (!xxhashInstance) {
    xxhashInstance = await h64();
  }
  return xxhashInstance;
}

/**
 * Generate metadataHash for sourceMetadata document ID
 *
 * @param {string} fileName - Source filename (with ORIGINAL CASE)
 * @param {number} lastModified - File last modified timestamp (milliseconds)
 * @param {string} fileHash - BLAKE3 hash of file content (32 hex chars)
 * @returns {string} xxHash 64-bit hash (16 hex characters)
 *
 * @example
 * const metadataHash = await generateMetadataHash(
 *   'Contract.PDF',
 *   1699000000000,
 *   'abc123...def'
 * );
 * // Returns: '0123456789abcdef' (16 hex chars)
 */
export async function generateMetadataHash(fileName, lastModified, fileHash) {
  const xxhash = await initXXHash();
  const input = `${fileName}|${lastModified}|${fileHash}`;
  const hash = xxhash.h64ToString(input);
  return hash.padStart(16, '0'); // Ensure 16 hex characters
}
```

### A.2 Complete Copy Detection Logic

```javascript
/**
 * Phase 2: Process single file upload
 * Implements server-side deduplication per Phase 2 diagram
 */
async function processSingleFile(queueFile, abortSignal) {
  try {
    const sessionId = orchestration.getCurrentSessionId();

    // ========================================
    // STEP 1: BLAKE3 Hash (ALWAYS CALCULATE)
    // ========================================
    // CRITICAL: NEVER skip BLAKE3 at Phase 2
    // Phase 1 uses XXH3 (non-cryptographic) - cannot rely on it for server decisions
    updateFileStatus(queueFile.id, 'hashing');
    console.log(`[PHASE2] Hashing file: ${queueFile.name}`);

    const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
    queueFile.hash = fileHash;
    console.log(`[PHASE2] Hash calculated: ${fileHash.substring(0, 8)}... (${queueFile.name})`);

    // ========================================
    // STEP 2: Query Firestore for Existence
    // ========================================
    updateFileStatus(queueFile.id, 'checking');
    const firmId = authStore.firmId;
    const matterId = matterStore.currentMatterId;
    const evidenceRef = doc(
      db,
      `firms/${firmId}/matters/${matterId}/evidence`,
      fileHash
    );
    const evidenceSnap = await getDoc(evidenceRef);

    // Generate metadataHash for sourceMetadata document ID
    const metadataHash = await generateMetadataHash(
      queueFile.name,
      queueFile.sourceLastModified,
      fileHash
    );

    // ========================================
    // STEP 3: Branch on Document Existence
    // ========================================
    if (evidenceSnap.exists()) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ COPY DETECTED
      // File content already in database
      // Action: Create sourceMetadata ONLY
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log(`[PHASE2] 🔷 COPY DETECTED: ${queueFile.name}`);
      console.log(`[PHASE2]    Hash: ${fileHash.substring(0, 8)}...`);
      console.log(`[PHASE2]    Action: Metadata only (skip storage upload)`);

      updateFileStatus(queueFile.id, 'copy_detected');

      // Create sourceMetadata record in subcollection
      const sourceMetadataRef = doc(
        db,
        `firms/${firmId}/matters/${matterId}/evidence/${fileHash}/sourceMetadata`,
        metadataHash
      );

      await setDoc(sourceMetadataRef, {
        sourceFileName: queueFile.name, // PRESERVE ORIGINAL CASE
        sourceLastModified: Timestamp.fromDate(new Date(queueFile.sourceLastModified)),
        fileHash: fileHash,
        sourceFolderPath: queueFile.folderPath || '',
      });

      // Log upload event
      await logUploadEvent('upload_duplicate', queueFile, fileHash, metadataHash);

      console.log(`[PHASE2] ✅ Copy metadata saved: ${queueFile.name}`);
      updateFileStatus(queueFile.id, 'completed');

      return {
        success: true,
        copy: true,
        uploaded: false,
        bytesSaved: queueFile.size, // Track bandwidth savings
      };

    } else {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ NEW PRIMARY FILE
      // File content NOT in database
      // Action: Upload to Storage + Create Evidence + sourceMetadata
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log(`[PHASE2] 📤 NEW PRIMARY FILE: ${queueFile.name}`);
      console.log(`[PHASE2]    Hash: ${fileHash.substring(0, 8)}...`);
      console.log(`[PHASE2]    Action: Full upload (storage + metadata)`);

      // Upload to Firebase Storage
      updateFileStatus(queueFile.id, 'uploading');
      queueFile.uploadProgress = 0;

      const uploadResult = await fileProcessor.uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => {
          queueFile.uploadProgress = progress;
        }
      );

      // Create evidence document
      updateFileStatus(queueFile.id, 'creating_metadata');
      await setDoc(evidenceRef, {
        sourceID: metadataHash,
        fileSize: queueFile.size,
        processingStage: 'uploaded',
        isProcessed: false,
        hasAllPages: null,
        tagCount: 0,
        autoApprovedCount: 0,
        reviewRequiredCount: 0,
        updatedAt: serverTimestamp(),
        tags: {},
      });

      // Create sourceMetadata record in subcollection
      const sourceMetadataRef = doc(
        db,
        `firms/${firmId}/matters/${matterId}/evidence/${fileHash}/sourceMetadata`,
        metadataHash
      );

      await setDoc(sourceMetadataRef, {
        sourceFileName: queueFile.name, // PRESERVE ORIGINAL CASE
        sourceLastModified: Timestamp.fromDate(new Date(queueFile.sourceLastModified)),
        fileHash: fileHash,
        sourceFolderPath: queueFile.folderPath || '',
      });

      // Log upload event
      await logUploadEvent('upload_success', queueFile, fileHash, metadataHash);

      console.log(`[PHASE2] ✅ Primary file uploaded and metadata saved: ${queueFile.name}`);
      updateFileStatus(queueFile.id, 'completed');

      return {
        success: true,
        copy: false,
        uploaded: true,
        bytesSaved: 0,
      };
    }

  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    console.error(`[PHASE2] ❌ Error uploading ${queueFile.name}:`, error);

    // Log upload error event
    await logUploadEvent('upload_error', queueFile, queueFile.hash, null, error);

    // Determine error type
    if (isNetworkError(error)) {
      updateFileStatus(queueFile.id, 'network_error');
      queueFile.error = 'Network error - check connection';
    } else {
      updateFileStatus(queueFile.id, 'error');
      queueFile.error = error.message;
    }

    return { success: false, error };
  }
}
```

### A.3 Upload Summary with Phase 2 Metrics

```javascript
// Update upload summary logic
let uploadedCount = 0;
let copiesCount = 0;
let failedCount = 0;
let totalBytesSaved = 0;

for (let i = 0; i < filesToUpload.length; i++) {
  const result = await processSingleFile(filesToUpload[i], abortController.signal);

  if (result.success) {
    if (result.copy) {
      copiesCount++;
      totalBytesSaved += result.bytesSaved;
    } else if (result.uploaded) {
      uploadedCount++;
    }
  } else {
    failedCount++;
  }
}

// Phase 2 completion summary
const bytesSavedGB = (totalBytesSaved / (1024 * 1024 * 1024)).toFixed(2);
console.log('[UPLOAD] ========================================');
console.log('[UPLOAD] PHASE 2 UPLOAD COMPLETE');
console.log('[UPLOAD] ========================================');
console.log(`[UPLOAD] Total files processed: ${filesToUpload.length}`);
console.log(`[UPLOAD] 📤 New primary files: ${uploadedCount}`);
console.log(`[UPLOAD] 📋 Copies (metadata only): ${copiesCount}`);
console.log(`[UPLOAD] 💾 Bandwidth saved: ${bytesSavedGB} GB`);
console.log(`[UPLOAD] ❌ Failed: ${failedCount}`);
console.log(`[UPLOAD] ⏱️ Duration: ${durationSeconds}s`);
console.log('[UPLOAD] ========================================');
```

---

## Appendix B: Testing Scenarios

### B.1 Test Case: Copy Detection

**Setup:**
1. Create test file: `test.pdf` (1 MB)
2. Upload file as `test.pdf`
3. Rename to `test_copy.pdf` (same content)
4. Upload `test_copy.pdf`

**Expected Results:**
- First upload:
  - Status: `hashing` → `checking` → `uploading` → `creating_metadata` → `completed`
  - Evidence document created with fileHash as ID
  - sourceMetadata created with metadataHash for `test.pdf`
  - File uploaded to storage
  - uploadEvent: `upload_success`

- Second upload:
  - Status: `hashing` → `checking` → `copy_detected` → `completed`
  - Evidence document already exists (same fileHash)
  - sourceMetadata created with different metadataHash for `test_copy.pdf`
  - NO file uploaded to storage
  - uploadEvent: `upload_duplicate`

**Firestore Structure:**
```
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/
  - evidence document (sourceID points to first metadataHash)
  /sourceMetadata/
    - {metadataHash1}: { sourceFileName: "test.pdf", ... }
    - {metadataHash2}: { sourceFileName: "test_copy.pdf", ... }
```

### B.2 Test Case: Large Batch with Mix

**Setup:**
1. Create 100 unique files (file1.pdf ... file100.pdf)
2. Create 100 copies (file1_copy.pdf ... file100_copy.pdf, same content as originals)
3. Upload all 200 files in Phase 1 queue
4. Phase 1 should mark:
   - 100 files as `ready` (originals)
   - 100 files as `copy` (copies)

**Expected Results:**
- Phase 2 processes all 200 files
- 100 storage uploads (primary files)
- 200 sourceMetadata records (100 + 100)
- 100 evidence documents
- Upload summary:
  - Primary files: 100
  - Copies detected: 100
  - Bandwidth saved: ~100 MB (assuming 1MB per file)

**Performance:**
- Virtual scrolling remains smooth (60fps)
- No UI lag during processing
- All status updates display correctly

---

## Appendix C: Troubleshooting Guide

### Issue: Virtual Scrolling Breaks

**Symptoms:**
- Table becomes unresponsive
- Rows not rendering correctly
- Scroll position jumps

**Diagnosis:**
1. Check if `ConstraintTableVirtualizer.vue` was modified
2. Check if file object structure changed
3. Check if status updates are mutating objects incorrectly

**Solution:**
- Revert any changes to virtualizer component
- Ensure queue updates are immutable
- Use Vue's `markRaw()` for File objects if needed

### Issue: Metadata Hash Collisions

**Symptoms:**
- Files with different metadata overwrite each other
- sourceMetadata count doesn't match upload count

**Diagnosis:**
1. Check metadataHash generation logic
2. Verify input includes fileName + lastModified + fileHash
3. Check xxHash implementation

**Solution:**
- Ensure xxHash 64-bit is used (not 32-bit)
- Verify input string format: `fileName|lastModified|fileHash`
- Add collision detection logging

### Issue: BLAKE3 Not Calculated

**Symptoms:**
- Copy detection fails
- Files uploaded that should be skipped

**Diagnosis:**
1. Check if BLAKE3 hash step is being skipped
2. Verify file.hash property is set
3. Check for early returns in processSingleFile()

**Solution:**
- Ensure BLAKE3 is ALWAYS calculated (no conditionals)
- Add logging before and after hash calculation
- Verify fileProcessor.calculateFileHash() is called

### Issue: Performance Degradation

**Symptoms:**
- UI becomes sluggish during upload
- Upload takes longer than expected
- Browser freezes

**Diagnosis:**
1. Check if BLAKE3 is running in web worker
2. Verify hash + query happens during upload (not before)
3. Profile using Chrome DevTools

**Solution:**
- Ensure fileHashWorker.js is being used
- Check that Firestore queries are not blocking main thread
- Add performance.now() logging to identify bottlenecks

---

## Final Notes

This implementation plan is comprehensive but should be treated as a living document. Update it as you discover edge cases or encounter implementation challenges.

**Key Principle:** Phase 2 deduplication must be invisible to users. The ~150ms overhead (BLAKE3 + Firestore query) should be completely hidden behind the unavoidable network upload time (~5-15 seconds).

**Remember:**
- BLAKE3 is ALWAYS calculated at Phase 2 (never skip)
- Copy files create sourceMetadata only (no storage upload)
- Primary files do full upload (storage + evidence + sourceMetadata)
- All metadata from all copies MUST be saved (litigation compliance)

Good luck with the implementation!
