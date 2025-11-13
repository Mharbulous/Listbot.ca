# Phase 3b: Upload Phase Deduplication

**Phase:** 3b of 7
**Status:** Partially Implemented (Infrastructure exists, needs copy upload logic & modal wiring)
**Priority:** High
**Estimated Duration:** 1-2 days (reduced due to existing infrastructure)
**Dependencies:** Phase 3a (Client-Side Deduplication)

---

## Overview

Implement upload-phase deduplication that hides expensive operations (database queries, metadata updates) behind unavoidable file upload time. This architecture provides seamless database-level deduplication without user-perceived latency.

**Goal:** Database-level deduplication with zero user-perceived overhead
**Deliverable:** Hash-based document IDs, database existence checks during upload, metadata-only updates, preview/completion modals
**User Impact:** Users never notice database operations because they're hidden in upload time

**Architecture Reference:** This phase implements `@docs/architecture/client-deduplication-logic.md`

---

## Related Documentation

**IMPORTANT:** This planning document implements the architecture described in:

1. **`@docs/architecture/Evidence.md`** ⭐ **PRIMARY REFERENCE**
   - Evidence document structure with `sourceMetadataVariants` map
   - Hash-based document IDs for automatic deduplication
   - Embedded metadata architecture for performance
   - Already implemented and in production use

2. **`@docs/architecture/client-deduplication-logic.md`**
   - Complete architectural rationale and design philosophy
   - Detailed implementation guide with code examples
   - Performance optimization strategies
   - Common questions & answers

3. **`@docs/architecture/client-deduplication-stories.md`**
   - User stories and implementation requirements
   - Complete checklist of features to implement
   - UX enhancement requirements
   - Anti-requirements (what NOT to do)

4. **`@docs/architecture/file-lifecycle.md`**
   - Definitive guide to file terminology
   - File processing lifecycle stages
   - Required terminology for all code and UI

**Before implementing this phase, read `@docs/architecture/Evidence.md` to understand the existing metadata architecture.**

---

## Terminology (CRITICAL)

**This phase uses precise deduplication terminology (from file-lifecycle.md and Evidence.md):**

- **"Copy"** or **"Copies"**: Files with the same hash value but different file metadata
  - During upload: Only ONE file content is uploaded to Storage
  - ALL metadata from ALL copies is saved to Firestore `sourceMetadataVariants` map
  - Each copy adds a new entry to the map using its metadataHash as the key

- **"Hash-Based Document ID"**: BLAKE3 hash is used as Firestore Evidence document ID
  - Provides automatic database-level deduplication
  - Same file always gets same ID (deterministic)
  - No race conditions possible
  - Path: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}`

- **"Metadata-Only Update"**: When file already exists in database
  - File content is NOT uploaded to Storage (already exists)
  - New source metadata is added to `sourceMetadataVariants` map
  - Also creates a subcollection document at `evidence/{fileHash}/sourceMetadata/{metadataHash}`
  - Saves storage space and upload time

- **"sourceMetadataVariants Map"**: Embedded map in Evidence document for O(1) duplicate detection
  - Key: metadataHash (xxHash, 16 hex chars)
  - Value: Source file metadata (name, lastModified, folderPath, uploadDate)
  - Enables instant duplicate checking without subcollection queries
  - Performance: O(1) lookup vs O(n) array scan

**Visual Note:** Throughout this document, status emojis (🔵 🟡 🟢 🟣 ⚪ 🔴 🟠) are visual shorthand for planning purposes. The actual implementation uses CSS-styled colored dots (circles) with text labels.

---

## Features

### 3b.1 Upload Phase Deduplication (Phase 2: Hidden During Upload)
### 3b.2 UX Enhancements (Progress, Preview, Completion Modals)

---

## 3b.1 Upload Phase Deduplication (Phase 2: Hidden During Upload)

This phase runs DURING upload and hides expensive operations (database queries) behind unavoidable file upload time.

**Key Principle:** Upload time is ~100x longer than hash+query time. By performing database operations DURING upload, users never notice the latency.

- Hashing a 10MB file: ~50ms (already done in Phase 3a)
- Querying Firestore: ~100ms
- Uploading 10MB file: ~5-15 seconds

**Total overhead: ~100ms hidden in 5-15 seconds of upload time.**

### Hash-Based Document IDs with sourceMetadataVariants Map

**BLAKE3 hash is used as Evidence document ID** - provides automatic database-level deduplication.

**Architecture Note:** This implementation uses the existing `sourceMetadataVariants` map pattern (see `@docs/architecture/Evidence.md`). The map provides O(1) metadata lookups and is already integrated with production UI components like `DigitalFileTab.vue`.

```javascript
// useUploadAdapter.js (updated to handle copies)
const uploadFile = async (queueFile) => {
  // Hash was already calculated in client-side phase (3a)
  const fileHash = queueFile.hash; // BLAKE3 hash is the Evidence document ID
  const firmId = authStore.currentFirm;
  const matterId = matterStore.currentMatterId;

  try {
    // Check if Evidence document exists (happens DURING upload, not before)
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);
    const evidenceSnap = await getDoc(evidenceRef);

    if (evidenceSnap.exists()) {
      // File already exists in database - metadata-only update
      console.log(`[UPLOAD] File exists in DB, adding metadata: ${queueFile.name}`);

      // Generate metadataHash for this specific upload context
      const metadataHash = await generateMetadataHash(
        queueFile.name,
        queueFile.sourceLastModified,
        fileHash
      );

      // Check if this exact metadata already exists
      const existingVariants = evidenceSnap.data().sourceMetadataVariants || {};
      if (existingVariants[metadataHash]) {
        console.log(`[UPLOAD] Metadata already exists, skipping: ${queueFile.name}`);
        queueFile.status = 'skipped';
        return { success: true, skipped: true };
      }

      // Add new metadata variant to map (O(1) operation)
      await updateDoc(evidenceRef, {
        // Add to sourceMetadataVariants map for fast lookup
        [`sourceMetadataVariants.${metadataHash}`]: {
          sourceFileName: queueFile.name,
          sourceLastModified: Timestamp.fromMillis(queueFile.sourceLastModified),
          sourceFolderPath: queueFile.folderPath || '/',
          uploadDate: serverTimestamp()
        },
        // Increment variant count
        sourceMetadataCount: increment(1)
      });

      // Also create sourceMetadata subcollection document (for detailed queries)
      await createMetadataRecord({
        sourceFileName: queueFile.name,
        lastModified: queueFile.sourceLastModified,
        fileHash: fileHash,
        size: queueFile.size,
        originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
        sourceFileType: queueFile.sourceFile.type,
      });

      queueFile.status = 'uploaded';
      return { success: true, skipped: false };
    } else {
      // New file - upload to Storage and create Evidence document
      console.log(`[UPLOAD] New file, uploading to Storage: ${queueFile.name}`);

      // Upload file to Storage
      const uploadResult = await uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => { queueFile.uploadProgress = progress; }
      );

      // Create metadata record (creates both Evidence doc and sourceMetadata subcollection)
      await createMetadataRecord({
        sourceFileName: queueFile.name,
        lastModified: queueFile.sourceLastModified,
        fileHash: fileHash,
        size: queueFile.size,
        originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
        sourceFileType: queueFile.sourceFile.type,
        storageCreatedTimestamp: uploadResult.timeCreated,
      });

      queueFile.status = 'uploaded';
      return { success: true, skipped: false };
    }
  } catch (error) {
    console.error(`[UPLOAD] Failed: ${queueFile.name}:`, error);
    queueFile.status = 'failed';
    throw error;
  }
};

// Upload copies (metadata only) - NEW FUNCTIONALITY TO IMPLEMENT
const uploadCopyMetadata = async (queueFile) => {
  // Get all copies from queue (files with status='copy' and same hash)
  const copies = uploadQueue.value.filter(f =>
    f.hash === queueFile.hash &&
    f.status === 'copy' &&
    f.isSelected
  );

  if (copies.length === 0) return;

  console.log(`[UPLOAD] Uploading metadata for ${copies.length} copies of ${queueFile.name}`);

  for (const copy of copies) {
    try {
      // Generate unique metadataHash for this copy
      const metadataHash = await generateMetadataHash(
        copy.name,
        copy.sourceLastModified,
        queueFile.hash
      );

      // Add copy's metadata to sourceMetadataVariants map
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', queueFile.hash);

      await updateDoc(evidenceRef, {
        [`sourceMetadataVariants.${metadataHash}`]: {
          sourceFileName: copy.name,
          sourceLastModified: Timestamp.fromMillis(copy.sourceLastModified),
          sourceFolderPath: copy.folderPath || '/',
          uploadDate: serverTimestamp()
        },
        sourceMetadataCount: increment(1)
      });

      // Create sourceMetadata subcollection document
      await createMetadataRecord({
        sourceFileName: copy.name,
        lastModified: copy.sourceLastModified,
        fileHash: queueFile.hash,
        size: copy.size,
        originalPath: copy.folderPath ? `${copy.folderPath}/${copy.name}` : copy.name,
        sourceFileType: copy.sourceFile.type,
      });

      copy.status = 'uploaded';
      console.log(`[UPLOAD] Copy metadata uploaded: ${copy.name}`);
    } catch (error) {
      console.error(`[UPLOAD] Failed to upload copy metadata: ${copy.name}`, error);
      copy.status = 'failed';
    }
  }
};
```

### Rationale

**Why hash-based document IDs?**
1. **Automatic deduplication** - Firestore prevents duplicate document IDs
2. **Deterministic** - Same file always gets same ID
3. **No race conditions** - Multiple users uploading same file won't create duplicates
4. **Fast lookups** - Direct document access by hash (no queries needed)

**Why sourceMetadataVariants map instead of sources array?**
1. **O(1) duplicate detection** - Check `map[metadataHash]` vs O(n) array scan
2. **Atomic updates** - Update individual variants: `sourceMetadataVariants.${hash}`
3. **Production-tested** - Already used by DigitalFileTab.vue dropdown selector
4. **Performance** - Fast lookups without reading entire array
5. **Architecture alignment** - Matches existing Evidence.md design

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

## 3b.2 UX Enhancements (Progress, Preview, Completion Modals)

### Preview Modal (Before Upload)

**Show summary AFTER client-side deduplication (Phase 3a), BEFORE upload begins.**

```javascript
const summary = {
  totalSelected: files.length,
  uniqueFiles: uniqueFiles.length,
  copies: files.filter(f => f.status === 'copy').length,
  duplicates: files.filter(f => f.status === 'duplicate').length,
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
│ Duplicates Filtered:   5            │
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

### Status Progression During Upload

**Status Progression:**

```javascript
const statusTextMap = {
  'pending': 'Pending',        // ⚪ Gray - Not yet analyzed
  'ready': 'Ready',            // 🔵 Blue - Ready to upload (unique or best file)
  'copy': 'Copy',              // 🟣 Purple - Copy detected (metadata only)
  'duplicate': 'Duplicate',    // ⚪ Gray - One-and-the-same file (checkbox disabled)
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
  'duplicate': '○',     // Gray circle - one-and-the-same file
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
  'duplicate': 'gray',  // Same as skip
  'uploading': 'blue',
  'uploaded': 'green',
  'read error': 'red',
  'failed': 'orange',
  'skip': 'gray',
};
```

### Upload Progress Feedback

**Display upload progress for each file:**

```javascript
// Track upload progress
const uploadWithProgress = async (fileRef) => {
  const storageRef = ref(storage, `documents/${fileRef.hash}`);

  const uploadTask = uploadBytesResumable(storageRef, fileRef.file);

  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      fileRef.uploadProgress = progress;
      fileRef.status = 'uploading';
    },
    (error) => {
      fileRef.status = 'failed';
      console.error(`[UPLOAD] Error: ${fileRef.metadata.sourceFileName}`, error);
    },
    async () => {
      // Upload complete - create Firestore document
      fileRef.status = 'uploaded';
    }
  );
};
```

**UI Display During Upload:**
```
┌────────┬───────────────────┬──────────┬─────────────────┐
│ Select │ File Name         │ Size     │ Status          │
├────────┼───────────────────┼──────────┼─────────────────┤
│  [✓]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Uploading 45%│
│  [✓]   │ report.docx       │ 890 KB   │ 🟢 Uploaded     │
│  [✓]   │ contract.pdf      │ 1.2 MB   │ 🔵 Ready        │
└────────┴───────────────────┴──────────┴─────────────────┘
```

### Checkbox Disabling During Upload

**Prevent user interaction during upload:**

```javascript
// Disable ALL checkboxes when upload starts
const startUpload = () => {
  isUploading.value = true;
  // Checkbox component checks isUploading and disables all inputs
};

// Re-enable checkboxes when upload completes
const completeUpload = () => {
  isUploading.value = false;
  // Show completion modal
};
```

**Rationale:** Prevents users from changing selections mid-upload, which would cause unpredictable behavior.

---

## Implementation Tasks

**For complete user stories and requirements, see:** `@docs/architecture/client-deduplication-stories.md`

### Task Checklist

#### 3b.1 Upload Phase Deduplication

**✅ Already Implemented:**
- [x] Hash-based document ID logic (Evidence ID = fileHash)
- [x] Firestore existence check during upload (`checkFileExists()`)
- [x] Handle new files (Storage upload + Evidence creation)
- [x] sourceMetadataVariants map structure (Evidence.md)
- [x] createMetadataRecord() with map updates
- [x] Upload error handling with network retry logic

**❌ Still Needs Implementation:**
- [ ] **CRITICAL:** Implement `uploadCopyMetadata()` function in useUploadAdapter.js
  - Loop through files with status='copy' and same hash
  - For each copy, add entry to sourceMetadataVariants map
  - Call createMetadataRecord() for subcollection document
  - Update copy.status to 'uploaded'
- [ ] Call `uploadCopyMetadata()` after main file uploads successfully
- [ ] Handle existing file metadata variant checking (prevent duplicate metadataHash)
- [ ] Test database-level deduplication with multiple copies
- [ ] Test with concurrent uploads (same file, different users)
- [ ] Verify latency is hidden during upload

#### 3b.2 UX Enhancements

**✅ Already Implemented:**
- [x] Preview modal component exists (`UploadPreviewModal.vue`)
- [x] Completion modal component exists (`UploadCompletionModal.vue`)
- [x] Upload progress tracking in useUploadAdapter.js (queueFile.uploadProgress)

**❌ Still Needs Implementation:**
- [ ] **Wire preview modal to Testing.vue** - show before upload starts
  - Calculate metrics: totalSelected, uniqueFiles, copies, duplicates, storageSaved
  - Show modal in handleUpload() before calling uploadAdapter.uploadQueueFiles()
  - Handle confirm/cancel events
- [ ] **Wire completion modal to useUploadAdapter.js** - show after upload finishes
  - Calculate final metrics: filesUploaded, filesCopies, storageSaved, deduplicationRate
  - Show modal after uploadQueueFiles() completes
  - Handle close event
- [ ] **Display upload progress in StatusCell.vue**
  - Add support for "Uploading X%" text when status='uploading'
  - Read uploadProgress from file object
- [ ] **Disable checkboxes during upload** in UploadTableRow.vue
  - Add :disabled="isUploading" to checkbox component
  - Pass isUploading prop from parent components
- [ ] Test modals with large file counts (1000+)

#### 3b.3 Integration
- [ ] Connect preview modal to upload start in Testing.vue
- [ ] Connect completion modal to upload finish in useUploadAdapter.js
- [ ] Verify copy metadata uploads work end-to-end
- [ ] Ensure status progression works correctly (ready → uploading → uploaded)
- [ ] Verify virtual scrolling works during upload
- [ ] Verify footer counts update during upload
- [ ] Test full flow: client-side dedup (3a) → preview → upload → copies → completion

---

## Testing Requirements

### Unit Tests

```javascript
// useUploadAdapter.spec.js
describe('Upload Phase Deduplication', () => {
  it('uses hash as Evidence document ID', () => {});
  it('checks document existence during upload', () => {});
  it('uploads new files to Storage and creates Evidence document', () => {});
  it('updates existing files with metadata-only (no Storage upload)', () => {});
  it('adds copy metadata to sourceMetadataVariants map', () => {});
  it('prevents duplicate metadataHash entries', () => {});
  it('increments sourceMetadataCount correctly', () => {});
  it('creates sourceMetadata subcollection documents', () => {});
  it('handles upload failures gracefully', () => {});
  it('handles concurrent uploads of same file', () => {});
});
```

### Component Tests

```javascript
describe('UploadPreviewModal', () => {
  it('displays accurate file counts', () => {});
  it('calculates storage saved correctly', () => {});
  it('shows duplicate count', () => {});
  it('emits cancel event', () => {});
  it('emits confirm event', () => {});
});

describe('UploadCompletionModal', () => {
  it('displays upload metrics', () => {});
  it('shows deduplication percentage', () => {});
  it('calculates storage saved', () => {});
  it('emits close event', () => {});
});
```

### Integration Tests

```javascript
describe('Upload Phase Integration', () => {
  it('shows preview modal before upload', () => {});
  it('disables checkboxes during upload', () => {});
  it('updates status to uploading during upload', () => {});
  it('updates status to uploaded on success', () => {});
  it('updates status to failed on error', () => {});
  it('shows completion modal after upload', () => {});
  it('re-enables checkboxes after upload', () => {});
  it('tracks upload progress per file', () => {});
});

describe('Database Deduplication Integration', () => {
  it('creates new Evidence document for new file', () => {});
  it('updates existing Evidence document with new metadata variant', () => {});
  it('saves all copy metadata to sourceMetadataVariants map', () => {});
  it('prevents duplicate metadataHash in map', () => {});
  it('creates sourceMetadata subcollection documents for each variant', () => {});
  it('handles race condition (concurrent uploads of same file)', () => {});
  it('integrates with DigitalFileTab dropdown (UI test)', () => {});
});
```

### Manual Testing Scenarios

1. **Basic Upload:**
   - Upload 10 unique files
   - Verify preview modal shows correct counts
   - Verify all files upload successfully
   - Verify completion modal shows accurate metrics

2. **Upload with Copies:**
   - Upload files with 5 copy groups
   - Verify only best files upload to Storage
   - Verify all copy metadata saved to Firestore
   - Verify completion modal shows storage saved

3. **Upload with Existing Files:**
   - Upload files that already exist in database
   - Verify metadata-only updates (no Storage upload)
   - Verify new entries added to `sourceMetadataVariants` map
   - Verify sourceMetadataCount increments correctly
   - Verify new variants appear in DigitalFileTab dropdown
   - Verify completion modal reflects existing files

4. **Upload Progress:**
   - Upload large files (50MB+)
   - Verify progress percentage updates in real-time
   - Verify status changes from "Ready" → "Uploading X%" → "Uploaded"
   - Verify UI remains responsive during upload

5. **Cancel Upload:**
   - Start upload with preview modal
   - Click Cancel button
   - Verify upload doesn't start
   - Verify checkboxes remain enabled

6. **Upload Errors:**
   - Simulate network error during upload
   - Verify file status changes to "Failed"
   - Verify other files continue uploading
   - Verify completion modal shows partial results

7. **Concurrent Uploads:**
   - Have two users upload same file simultaneously
   - Verify no duplicate Evidence documents created (hash-based ID prevents this)
   - Verify both users' metadata saved in `sourceMetadataVariants` map
   - Verify sourceMetadataCount reflects all variants
   - Verify both variants appear in DigitalFileTab dropdown

---

## Success Criteria

### Functional Requirements
- [ ] Preview modal shows accurate deduplication summary
- [ ] Upload uses hash-based Evidence document IDs
- [ ] Database queries hidden during upload (no perceived latency)
- [ ] New files uploaded to Storage and Evidence document created
- [ ] Existing files get metadata-only updates (no Storage upload)
- [ ] All copy metadata saved to `sourceMetadataVariants` map
- [ ] sourceMetadataCount increments atomically
- [ ] sourceMetadata subcollection documents created for each variant
- [ ] Upload progress displayed per file (percentage in status column)
- [ ] Checkboxes disabled during upload
- [ ] Completion modal shows accurate metrics
- [ ] Upload errors handled gracefully with network retry logic

### Performance Requirements
- [ ] Database query <100ms (hidden in 5-15s upload)
- [ ] Preview modal renders in <200ms
- [ ] Completion modal renders in <200ms
- [ ] Upload progress updates in real-time (no lag)
- [ ] Concurrent uploads don't cause race conditions

### Visual Requirements
- [ ] Preview modal clear and informative
- [ ] Upload progress visible in status column
- [ ] Completion modal celebrates success
- [ ] Disabled checkboxes clearly indicate upload in progress
- [ ] Status transitions smooth and understandable

---

## Dependencies

### Internal Dependencies
- Phase 3a: Client-Side Deduplication (provides hashes and copy groups)
- `useUploadTable.js` - For upload orchestration
- `useUploadAdapter.js` - For upload processing (needs copy upload logic)
- `useFileMetadata.js` - For metadata creation and map updates
- `StatusCell.vue` - For status display during upload
- `DigitalFileTab.vue` - Dropdown selector uses sourceMetadataVariants map
- `Evidence.md` - Architecture reference for map structure
- Firebase Firestore - For Evidence document storage and queries
- Firebase Storage - For file storage

### External Dependencies
- Firebase SDK (`firebase/firestore`, `firebase/storage`)
- BLAKE3 hash (already computed in Phase 3a)
- xxHash (for metadataHash generation in useFileMetadata.js)

---

## Performance Benchmarks

**Upload Operations:**
| Operation | Target | Actual |
|-----------|--------|--------|
| Firestore document check | <100ms | _TBD_ |
| Metadata-only update | <50ms | _TBD_ |
| New document creation | <100ms | _TBD_ |
| Preview modal render | <200ms | _TBD_ |
| Completion modal render | <200ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 3b - Database check: Xms (hidden in upload)');
console.log('[PERFORMANCE] Phase 3b - Metadata update: Xms');
console.log('[PERFORMANCE] Phase 3b - New document: Xms');
console.log('[PERFORMANCE] Phase 3b - Files uploaded: X, Metadata-only: Y');
console.log('[PERFORMANCE] Phase 3b - Storage saved: X MB');
console.log('[PERFORMANCE] Phase 3b - Deduplication rate: X%');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Concurrent uploads create duplicate docs | Low | High | Hash-based IDs prevent duplicates automatically |
| Network errors during upload | Medium | Medium | Already implemented with exponential backoff retry |
| Large sourceMetadataVariants maps | Low | Low | Map structure allows efficient O(1) lookups |
| BLAKE3 collision | Extremely Low | High | Acceptable risk (2^-128 probability) |
| Copy metadata upload failures | Medium | Medium | Individual try/catch per copy, log errors |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by metadata-only updates | Low | Medium | Clear messaging in completion modal |
| Preview modal ignored | Medium | Low | Make modal prominent, require action |
| Upload progress not visible | Low | High | Ensure progress updates are smooth |

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

## Architecture Update History

### 2025-11-13: Updated to Use Existing sourceMetadataVariants Map Architecture

**Changes Made:**
- ✅ Updated from planned `sources` array to existing `sourceMetadataVariants` map
- ✅ Aligned with production architecture documented in `@docs/architecture/Evidence.md`
- ✅ Leverages existing `useFileMetadata.js` infrastructure
- ✅ Maintains compatibility with `DigitalFileTab.vue` dropdown selector
- ✅ Updated code examples to reflect actual implementation pattern
- ✅ Reduced estimated duration (1-2 days vs 2 days) due to existing infrastructure

**Rationale:**
The existing `sourceMetadataVariants` map architecture provides:
- **O(1) duplicate detection** vs O(n) array scans
- **Atomic updates** without reading entire collections
- **Production-tested** code already in use by multiple components
- **Better performance** for metadata variant lookups

**What Still Needs Implementation:**
1. Copy metadata upload logic in `useUploadAdapter.js`
2. Preview modal wiring in `Testing.vue`
3. Completion modal wiring in `useUploadAdapter.js`
4. Upload progress display in `StatusCell.vue`
5. Checkbox disabling during upload

---

**Phase Status:** 🟡 Partially Implemented
**Last Updated:** 2025-11-13
**Assignee:** TBD
