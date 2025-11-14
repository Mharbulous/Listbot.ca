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

**useUploadAdapter.js - Critical non-obvious details:**

```javascript
// Evidence doc ID = fileHash (not auto-generated)
const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);

// Check existence DURING upload (not before)
const evidenceSnap = await getDoc(evidenceRef);

if (evidenceSnap.exists()) {
  // Metadata-only update pattern
  await updateDoc(evidenceRef, {
    [`sourceMetadataVariants.${metadataHash}`]: { /* metadata */ },
    sourceMetadataCount: increment(1)
  });
  // ALSO create subcollection doc for detailed queries
  await createMetadataRecord({...});
}
```

**uploadCopyMetadata() - NEW FUNCTIONALITY NEEDED:**
- Loop files with `status='copy'` and same hash
- Each copy gets unique metadataHash
- Update sourceMetadataVariants map + create subcollection doc
- Call AFTER main file uploads

**Why sourceMetadataVariants map (not array)?**
- O(1) lookup vs O(n) array scan
- Atomic updates: `sourceMetadataVariants.${hash}`
- Already integrated with DigitalFileTab.vue dropdown

## UX Modal Wiring (CRITICAL)

**Preview Modal (UploadPreviewModal.vue):**
- Show AFTER Phase 3a dedup, BEFORE upload
- Wire in Testing.vue handleUpload() before calling uploadAdapter.uploadQueueFiles()
- Display-only (no user override)
- Disable ALL checkboxes during upload

**Completion Modal (UploadCompletionModal.vue):**
- Show AFTER upload finishes
- Wire in useUploadAdapter.js after uploadQueueFiles() completes
- Metrics: filesUploaded, filesCopies, storageSaved, deduplicationRate

**StatusCell.vue enhancements:**
- Add support for "Uploading X%" when status='uploading'
- Read uploadProgress from file object
- Status progression: ready → uploading → uploaded

**Checkbox disabling:**
- Add :disabled="isUploading" to UploadTableRow.vue
- Pass isUploading prop from Testing.vue

## TODO: Implementation Tasks

**Components already exist:**
- UploadPreviewModal.vue, UploadCompletionModal.vue
- Hash-based Evidence ID logic
- sourceMetadataVariants map structure
- Upload progress tracking (queueFile.uploadProgress)

**Still needed:**
1. **uploadCopyMetadata()** in useUploadAdapter.js (CRITICAL)
   - Loop files with status='copy' + same hash
   - Add to sourceMetadataVariants map + create subcollection doc
   - Call AFTER main file uploads
2. **Wire preview modal** in Testing.vue handleUpload()
   - Show before uploadAdapter.uploadQueueFiles()
3. **Wire completion modal** in useUploadAdapter.js
   - Show after uploadQueueFiles() completes
4. **StatusCell.vue**: Add "Uploading X%" display
5. **UploadTableRow.vue**: Add :disabled="isUploading" to checkbox

## Critical Test Scenarios

**Manual tests (non-obvious cases):**
1. **Upload with existing files** - Verify metadata-only updates, new variants appear in DigitalFileTab dropdown
2. **Concurrent uploads** (2 users, same file) - Verify no duplicate Evidence docs, both metadata variants saved
3. **Large files (50MB+)** - Verify query latency hidden in upload time
4. **Copy metadata** - Verify ALL copies get entries in sourceMetadataVariants map

## Key Success Criteria (non-obvious)
- [ ] Database queries <100ms (hidden in upload time, user perceives zero latency)
- [ ] Copy metadata uploads work for ALL copies (not just first)
- [ ] Concurrent uploads don't create duplicate Evidence docs (hash-based ID prevents)
- [ ] New variants appear in DigitalFileTab dropdown immediately

## Dependencies (project-specific)
- Phase 3a: Provides hashes and copy groups
- useFileMetadata.js: Provides createMetadataRecord() and metadataHash generation
- DigitalFileTab.vue: Already consumes sourceMetadataVariants map

## Architecture Notes

**2025-11-13:** Pivoted from planned `sources` array to existing `sourceMetadataVariants` map (Evidence.md). Rationale: O(1) lookups, atomic updates, already integrated with DigitalFileTab.vue. Duration reduced to 1-2 days due to existing infrastructure.

---

**Status:** 🟡 Partially Implemented | **Last Updated:** 2025-11-13
