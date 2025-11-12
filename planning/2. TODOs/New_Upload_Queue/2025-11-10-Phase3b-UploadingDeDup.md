# Phase 3b: Upload Phase Deduplication

**Phase:** 3b of 7
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 2 days
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
  - During upload: Only ONE file content is uploaded to Storage
  - ALL metadata from ALL copies is saved to Firestore `sources` array
  - Each copy adds a new entry to the `sources` array

- **"Hash-Based Document ID"**: BLAKE3 hash is used as Firestore document ID
  - Provides automatic database-level deduplication
  - Same file always gets same ID (deterministic)
  - No race conditions possible

- **"Metadata-Only Update"**: When file already exists in database
  - File content is NOT uploaded to Storage (already exists)
  - New source metadata is appended to `sources` array
  - Saves storage space and upload time

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

### Hash-Based Document IDs

**BLAKE3 hash is used as Firestore document ID** - provides automatic database-level deduplication.

```javascript
// useUploadPhaseDeduplication.js
const uploadFile = async (fileRef) => {
  // Hash was already calculated in client-side phase (3a)
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
- [ ] Create `useUploadPhaseDeduplication.js` composable
- [ ] Implement hash-based document ID logic
- [ ] Implement Firestore existence check (during upload)
- [ ] Handle existing files (metadata-only update)
- [ ] Handle new files (Storage upload + Firestore create)
- [ ] Save all source metadata in `sources` array
- [ ] Implement copy metadata uploads (arrayUnion)
- [ ] Test database-level deduplication
- [ ] Test with concurrent uploads (same file)
- [ ] Verify latency is hidden during upload
- [ ] Handle upload errors gracefully

#### 3b.2 UX Enhancements
- [ ] Create preview modal component (`UploadPreviewModal.vue`)
- [ ] Create completion modal component (`UploadCompletionModal.vue`)
- [ ] Add deduplication metrics calculation (include duplicate count)
- [ ] Display storage saved calculations
- [ ] Add upload progress tracking (per-file)
- [ ] Display upload progress in status column
- [ ] Disable all checkboxes during upload phase
- [ ] Show preview modal before upload starts
- [ ] Show completion modal after upload finishes
- [ ] Test modals with large file counts (1000+)

#### 3b.3 Integration
- [ ] Integrate upload phase deduplication with upload logic
- [ ] Connect preview modal to upload start
- [ ] Connect completion modal to upload finish
- [ ] Ensure status progression works correctly
- [ ] Verify virtual scrolling works during upload
- [ ] Verify footer counts update during upload
- [ ] Test with Phase 3a client-side deduplication

---

## Testing Requirements

### Unit Tests

```javascript
// useUploadPhaseDeduplication.spec.js
describe('Upload Phase Deduplication', () => {
  it('uses hash as document ID', () => {});
  it('checks document existence before upload', () => {});
  it('uploads new files to Storage and Firestore', () => {});
  it('updates existing files metadata-only', () => {});
  it('appends copy metadata to sources array', () => {});
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
  it('creates new document for new file', () => {});
  it('updates existing document for duplicate', () => {});
  it('saves all copy metadata', () => {});
  it('handles race condition (concurrent uploads)', () => {});
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
   - Verify new source entries added to `sources` array
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
   - Verify no duplicate documents created
   - Verify both users' metadata saved in `sources` array

---

## Success Criteria

### Functional Requirements
- [ ] Preview modal shows accurate deduplication summary
- [ ] Upload uses hash-based document IDs
- [ ] Database queries hidden during upload (no perceived latency)
- [ ] New files uploaded to Storage and Firestore
- [ ] Existing files get metadata-only updates
- [ ] All copy metadata saved to `sources` array
- [ ] Upload progress displayed per file
- [ ] Checkboxes disabled during upload
- [ ] Completion modal shows accurate metrics
- [ ] Upload errors handled gracefully

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
- `StatusCell.vue` - For status display during upload
- Firebase Firestore - For document storage and queries
- Firebase Storage - For file storage

### External Dependencies
- Firebase SDK (`firebase/firestore`, `firebase/storage`)
- BLAKE3 hash (already computed in Phase 3a)

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
| Concurrent uploads create duplicate docs | Low | High | Hash-based IDs prevent duplicates |
| Network errors during upload | Medium | Medium | Implement retry logic |
| Large metadata arrays slow queries | Low | Low | Monitor Firestore performance |
| BLAKE3 collision | Extremely Low | High | Acceptable risk (2^-128 probability) |

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

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12
**Assignee:** TBD
