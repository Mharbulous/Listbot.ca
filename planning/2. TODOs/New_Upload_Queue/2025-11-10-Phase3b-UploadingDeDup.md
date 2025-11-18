# Phase 3b: Upload Phase Deduplication

**Status:** Partially Implemented (Infrastructure exists, needs copy upload logic & modal wiring)
**Estimated Duration:** 1-2 days
**Dependencies:** Phase 3a (Client-Side Deduplication)

## Architecture References
- **`@docs/architecture/Evidence.md`** ⭐ PRIMARY - sourceMetadataVariants map structure (already in production)
- **`@docs/architecture/client-deduplication-logic.md`** - Implementation guide
- **`@docs/architecture/client-deduplication-stories.md`** - Full requirements checklist

---

## Critical Implementation Details

**Terminology (must use in code/UI):**
- **"Copy"**: Same hash, different metadata → Upload metadata only to `sourceMetadataVariants` map
- **"Duplicate"**: Same hash AND metadata → Skip entirely
- **Evidence ID = BLAKE3 fileHash** → Automatic DB-level deduplication, path: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}`
- **sourceMetadataVariants map key = metadataHash** (xxHash, 16 hex chars)

**Timing Strategy (NON-OBVIOUS):**
- Query Firestore DURING upload, NOT before
- Rationale: Query (~100ms) hidden in upload time (5-15s)
- User never perceives database latency

## Key Implementation Patterns

### 1. Copy Evidence Creation (CRITICAL DECISION)

**Do NOT use `createEvidenceFromUpload()` for copies** - Evidence doc already exists from primary upload.

**NEW FUNCTION REQUIRED:** `createCopyMetadataRecord()`

```javascript
// useUploadAdapter.js - NEW FUNCTION
async function createCopyMetadataRecord(queueFile, firmId, matterId) {
  const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', queueFile.fileHash);
  const metadataHash = queueFile.metadataHash;

  // Update sourceMetadataVariants map atomically
  await updateDoc(evidenceRef, {
    [`sourceMetadataVariants.${metadataHash}`]: {
      fileName: queueFile.fileName,
      filePath: queueFile.filePath,
      fileSize: queueFile.fileSize,
      lastModified: queueFile.lastModified,
      addedAt: serverTimestamp()
    },
    sourceMetadataCount: increment(1)
  });

  // Create subcollection doc for detailed queries (DigitalFileTab.vue)
  const variantRef = doc(evidenceRef, 'sourceMetadataVariants', metadataHash);
  await setDoc(variantRef, {
    fileName: queueFile.fileName,
    filePath: queueFile.filePath,
    fileSize: queueFile.fileSize,
    lastModified: queueFile.lastModified,
    addedAt: serverTimestamp()
  });
}
```

### 2. Copy Upload Architecture (INLINE, NOT SEPARATE LOOP)

**Handle copies INLINE during `processSingleFile()`, not in separate loop after primaries.**

```javascript
// useUploadAdapter.js - uploadQueueFiles() pattern
async function uploadQueueFiles(firmId, matterId, files) {
  // PRE-BUILD copy group map for O(n) efficiency
  const copyGroupMap = new Map(); // key: fileHash, value: array of copy queueFiles
  for (const file of files) {
    if (file.status === 'copy') {
      if (!copyGroupMap.has(file.fileHash)) {
        copyGroupMap.set(file.fileHash, []);
      }
      copyGroupMap.get(file.fileHash).push(file);
    }
  }

  // Upload loop
  for (const file of files) {
    if (file.status === 'ready') {
      try {
        // Upload primary file
        await processSingleFile(file, firmId, matterId);

        // IMMEDIATELY upload metadata for ALL copies in this hash group
        const copies = copyGroupMap.get(file.fileHash) || [];
        for (const copyFile of copies) {
          try {
            await createCopyMetadataRecord(copyFile, firmId, matterId);
            copyFile.status = 'uploaded';
          } catch (error) {
            // Copy metadata failure is NON-BLOCKING
            copyFile.status = 'error';
            copyFile.errorMessage = `Copy metadata failed: ${error.message}`;
          }
        }
      } catch (error) {
        // Primary upload failed - mark ALL copies as error
        file.status = 'error';
        const copies = copyGroupMap.get(file.fileHash) || [];
        for (const copyFile of copies) {
          copyFile.status = 'error';
          copyFile.errorMessage = 'Primary file upload failed';
        }
      }
    }
  }
}
```

### 3. Error Handling Patterns

**Primary Upload Fails:**
- Mark primary as 'error'
- Mark ALL copies in that hash group as 'error'
- Skip all metadata uploads for that group
- Prevents orphaned subcollection docs

**Copy Metadata Fails:**
- Mark that specific copy as 'error'
- Continue with other copies (non-blocking)
- Primary file and other copies unaffected

**Example:**
```javascript
try {
  await processSingleFile(primaryFile, firmId, matterId);
  // Upload copy metadata...
} catch (error) {
  primaryFile.status = 'error';
  // Mark ALL copies as error
  const copies = copyGroupMap.get(primaryFile.fileHash) || [];
  for (const copyFile of copies) {
    copyFile.status = 'error';
    copyFile.errorMessage = 'Primary file upload failed';
  }
}
```

### 4. Copy Group Filtering (User Skips Primary)

**When user unchecks a primary file, filter ENTIRE copy group from uploadable files.**

```javascript
// useUploadQueue.js - getUploadableFiles() enhancement
function getUploadableFiles() {
  // Build set of excluded fileHashes (user unchecked)
  const excludedHashes = new Set();
  for (const file of queueFiles.value) {
    if (!file.selected && file.status === 'ready') {
      excludedHashes.add(file.fileHash);
    }
  }

  // Filter: exclude unchecked primaries AND their entire copy groups
  return queueFiles.value.filter(file => {
    if (!file.selected) return false;
    if (excludedHashes.has(file.fileHash)) return false; // Primary unchecked, skip all copies
    return file.status === 'ready' || file.status === 'copy';
  });
}
```

### 5. Status Progression Patterns

**Primary Files:**
```
ready → uploading → uploaded
ready → uploading → error (if upload fails)
```

**Copy Files:**
```
copy → uploading → uploaded
copy → uploading → error (if metadata upload fails)
```

**Duplicate Files:**
```
duplicate (stays duplicate, never uploaded)
```

**uploadProgress updates:**
- **Primary files**: Update `uploadProgress` 0-100% during Storage upload
- **Copy files**: NO progress updates (metadata upload too fast). Status goes directly: `copy → uploading → uploaded`

### 6. Metadata Progress (NO PROGRESS BAR FOR COPIES)

**Primary files:**
- Show upload progress bar (0-100%)
- Status: "Uploading 45%"

**Copy files:**
- NO progress bar (metadata upload <100ms)
- Status: "Uploading..." (no percentage)
- Transition directly: copy → uploading → uploaded

```javascript
// StatusCell.vue pattern
if (file.status === 'uploading') {
  if (file.uploadProgress !== undefined && file.uploadProgress > 0) {
    // Primary file - show progress
    return `Uploading ${file.uploadProgress}%`;
  } else {
    // Copy file - no progress
    return 'Uploading...';
  }
}
```

### 7. Evidence Doc Existence Check Pattern

```javascript
// useUploadAdapter.js - processSingleFile()
const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);

// Check existence DURING upload (not before)
const evidenceSnap = await getDoc(evidenceRef);

if (evidenceSnap.exists()) {
  // File already uploaded by another user/session - treat as copy
  await createCopyMetadataRecord(queueFile, firmId, matterId);
} else {
  // New file - full upload
  await createEvidenceFromUpload(queueFile, firmId, matterId);
}
```

**Why sourceMetadataVariants map (not array)?**
- O(1) lookup vs O(n) array scan
- Atomic updates: `sourceMetadataVariants.${hash}`
- Already integrated with DigitalFileTab.vue dropdown

---

## UX Modal Wiring (ARCHITECTURAL DECISIONS)

### Modal Logic Location
**ALL modal logic in Testing.vue** (not split between component/composable)
- Clean separation: composable returns data, component handles UI
- Testing.vue owns: modal state, show/hide, user interactions
- useUploadAdapter.js: returns metrics, does NOT control modals

### Preview Modal (UploadPreviewModal.vue)

**When:** Show AFTER Phase 3a dedup, BEFORE upload
**Where:** Wire in Testing.vue `handleUpload()` before calling `uploadAdapter.uploadQueueFiles()`
**User Control:** Display-only (no override checkboxes)

```javascript
// Testing.vue - handleUpload() pattern
async function handleUpload() {
  // Show preview modal
  showPreviewModal.value = true;
  await waitForUserConfirmation(); // User clicks "Start Upload"

  // Start upload
  isUploading.value = true; // Disable all checkboxes, buttons
  const result = await uploadAdapter.uploadQueueFiles(firmId, matterId, uploadableFiles);
  isUploading.value = false;

  // Show completion modal
  completionMetrics.value = result.metrics;
  showCompletionModal.value = true;
}
```

### Completion Modal (UploadCompletionModal.vue)

**When:** Show AFTER upload finishes
**Where:** Wire in Testing.vue after `uploadQueueFiles()` completes
**Metrics (STORAGE SAVED REMOVED):**
- `filesUploaded` (primaries only)
- `filesCopies` (copies uploaded as metadata)
- `totalFiles` (primaries + copies)
- `failedFiles` (errors)

**REMOVED METRIC:** `storageSaved`
- Rationale: Bytes tracking is for progress estimation only, not user-facing metrics
- Modal shows file counts, not storage savings

```javascript
// useUploadAdapter.js - return metrics
return {
  metrics: {
    filesUploaded: primaryCount,
    filesCopies: copyCount,
    totalFiles: primaryCount + copyCount,
    failedFiles: errorCount
    // NO storageSaved - removed from completion modal
  }
};
```

### Upload Lock (Disable All Interactions)

**During upload (`isUploading === true`):**
- Disable ALL checkboxes (primary, copy, duplicate)
- Disable "Select All" / "Select None" buttons
- Disable "Clear Queue" button
- Disable modal close buttons (use `persistent: true` on modals)

```vue
<!-- Testing.vue pattern -->
<UploadTableRow
  :file="file"
  :disabled="isUploading"
/>

<v-btn @click="clearQueue" :disabled="isUploading">Clear Queue</v-btn>
<v-btn @click="selectAll" :disabled="isUploading">Select All</v-btn>

<!-- Modals with persistent during upload -->
<UploadPreviewModal
  v-model="showPreviewModal"
  :persistent="isUploading"
/>
```

### StatusCell.vue Enhancements

**Add support for "Uploading X%" when `status='uploading'`:**
```vue
<!-- StatusCell.vue pattern -->
<template>
  <v-chip :color="statusColor">
    {{ statusText }}
  </v-chip>
</template>

<script setup>
const statusText = computed(() => {
  if (file.status === 'uploading') {
    // Primary file - show progress
    if (file.uploadProgress !== undefined && file.uploadProgress > 0) {
      return `Uploading ${file.uploadProgress}%`;
    }
    // Copy file - no progress
    return 'Uploading...';
  }
  // ... other statuses
});
</script>
```

---

## TODO: Implementation Tasks

**Components/Infrastructure Already Exist:**
- ✅ UploadPreviewModal.vue, UploadCompletionModal.vue
- ✅ Hash-based Evidence ID logic
- ✅ sourceMetadataVariants map structure
- ✅ Upload progress tracking (queueFile.uploadProgress)

**Still Needed:**

### 1. **createCopyMetadataRecord()** in useUploadAdapter.js (CRITICAL)
   - NEW function (not createEvidenceFromUpload)
   - Updates sourceMetadataVariants map + creates subcollection doc
   - Called inline during processSingleFile() for each copy

### 2. **Inline Copy Handling** in uploadQueueFiles()
   - Pre-build copyGroupMap before upload loop
   - When primary uploads, immediately upload all copy metadata
   - Handle primary failure: mark all copies as error

### 3. **Error Handling** in uploadQueueFiles()
   - Primary fails: mark all copies as error, skip metadata uploads
   - Copy metadata fails: mark copy as error, continue with others

### 4. **Copy Group Filtering** in getUploadableFiles()
   - Build excludedHashes set from unchecked primaries
   - Filter copies with same hash as excluded primaries

### 5. **Wire Preview Modal** in Testing.vue handleUpload()
   - Show before uploadAdapter.uploadQueueFiles()
   - Wait for user confirmation

### 6. **Wire Completion Modal** in Testing.vue
   - Show after uploadQueueFiles() completes
   - Display metrics (NO storageSaved)

### 7. **StatusCell.vue**: Add "Uploading X%" display
   - Show progress for primaries
   - Show "Uploading..." for copies (no progress)

### 8. **UploadTableRow.vue**: Add :disabled="isUploading" to checkbox
   - Pass isUploading prop from Testing.vue

### 9. **Upload Lock in Testing.vue**
   - Disable checkboxes, Select All/None, Clear Queue during upload
   - Add persistent: true to modals during upload

---

## Critical Test Scenarios

**Manual tests (non-obvious cases):**

1. **Upload with existing files**
   - Verify metadata-only updates, new variants appear in DigitalFileTab dropdown

2. **Concurrent uploads** (2 users, same file)
   - Verify no duplicate Evidence docs, both metadata variants saved

3. **Large files (50MB+)**
   - Verify query latency hidden in upload time

4. **Copy metadata**
   - Verify ALL copies get entries in sourceMetadataVariants map

5. **Primary upload fails**
   - Verify ALL copies in that hash group marked as error
   - Verify no orphaned subcollection docs

6. **User skips primary**
   - Verify ALL copies in that hash group excluded from upload

7. **Copy metadata fails**
   - Verify only that copy marked as error
   - Verify primary and other copies unaffected

8. **Modal interactions during upload**
   - Verify all checkboxes disabled
   - Verify Select All/None, Clear Queue disabled
   - Verify modal close buttons disabled

---

## Key Success Criteria (non-obvious)

- [ ] Database queries <100ms (hidden in upload time, user perceives zero latency)
- [ ] Copy metadata uploads work for ALL copies (not just first)
- [ ] Concurrent uploads don't create duplicate Evidence docs (hash-based ID prevents)
- [ ] New variants appear in DigitalFileTab dropdown immediately
- [ ] Primary upload failure marks ALL copies as error
- [ ] User skipping primary excludes ALL copies from upload
- [ ] Copy metadata failure is non-blocking (other copies continue)
- [ ] No storage savings metric in completion modal (bytes tracking internal only)
- [ ] All UI interactions locked during upload (checkboxes, buttons, modals)

---

## Dependencies (project-specific)

- Phase 3a: Provides hashes and copy groups
- useFileMetadata.js: Provides createMetadataRecord() and metadataHash generation
- DigitalFileTab.vue: Already consumes sourceMetadataVariants map

---

## Architecture Notes

**2025-11-13:** Pivoted from planned `sources` array to existing `sourceMetadataVariants` map (Evidence.md). Rationale: O(1) lookups, atomic updates, already integrated with DigitalFileTab.vue. Duration reduced to 1-2 days due to existing infrastructure.

**2025-11-17:** Finalized 10 architectural decisions:
1. Copy evidence creation: New createCopyMetadataRecord() function (not createEvidenceFromUpload)
2. Copy upload architecture: Inline handling during processSingleFile() with pre-built copyGroupMap
3. Primary upload fails: Mark all copies as error, skip metadata uploads
4. Copy metadata fails: Non-blocking, mark only that copy as error
5. User skips primary: Filter entire copy group from uploadable files
6. Metadata progress: No uploadProgress updates for copies
7. Storage saved metric: Removed from completion modal
8. Modal wiring: ALL logic in Testing.vue (not split with composable)
9. Upload lock: Disable all checkboxes, buttons, modal close during upload
10. Status progression: Primary (ready→uploading→uploaded), Copy (copy→uploading→uploaded), Duplicate (stays duplicate)

---

**Status:** 🟡 Partially Implemented | **Last Updated:** 2025-11-17
