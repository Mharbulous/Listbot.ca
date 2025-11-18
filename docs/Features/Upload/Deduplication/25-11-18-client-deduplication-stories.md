# Client-Side Deduplication: User Stories

**Reconciled up to**: 2025-11-18

This document contains all user stories and implementation requirements for the client-side deduplication feature.

---

## Key Files

This documentation references the following source files:

**UI Components (User Stories 6-10):**
- `src/features/upload/components/StatusCell.vue` - Status indicators (US-10)
- `src/features/upload/components/SelectCell.vue` - Copy grouping visual (US-9)
- `src/features/upload/components/UploadTableRow.vue` - Table row with visual grouping
- `src/features/upload/components/UploadProgressModal.vue` - Progress feedback (US-6)
- `src/features/upload/components/UploadPreviewModal.vue` - Preview before upload (US-7)
- `src/features/upload/components/UploadCompletionModal.vue` - Completion summary (US-8)

**Core Deduplication (User Stories 1-5):**
- `src/features/upload/composables/useSequentialPrefilter.js` - Stage 1 metadata filtering (US-2)
- `src/features/upload/composables/useSequentialVerification.js` - Stage 2 hash verification (US-1)
- `src/features/upload/composables/useSequentialHashWorker.js` - Web worker integration (US-12)
- `src/features/upload/workers/fileHashWorker.js` - BLAKE3 hashing worker (US-12)

**Upload Processing (User Stories 4-5, 11, 13):**
- `src/features/upload/composables/useUploadState.js` - Upload state and file filtering
- `src/features/upload/composables/useUploadProcessor.js` - Upload pipeline (US-11)
- `src/features/upload/composables/useQueueHelpers.js` - Best file selection (US-4)

---

## Related Documentation

This document is part of a three-document set for deduplication:

1. **`@docs/Features/Upload/Deduplication/25-11-18-client-deduplication-logic.md`**
   - Architectural rationale and design philosophy
   - Detailed implementation guide with code examples
   - Performance optimization strategies
   - **Read this first** to understand WHY each requirement exists

2. **This document (`client-deduplication-stories.md`)**
   - User stories and implementation requirements
   - Complete checklist of features to implement
   - Anti-requirements (what NOT to do)

3. **Implementation planning** (if needed, see `@planning/2. TODOs/New_Upload_Queue/` for related docs)

**Also see:** `@docs/Features/Upload/Processing/file-lifecycle.md` for definitive file terminology.

---

## User Stories

### Core Deduplication

**US-1: Automatic Copy Detection**
As a user uploading files, I want the system to automatically detect when I've selected multiple copies of the same file (same content, different names/paths), so that I don't waste time and storage uploading duplicates.

**US-2: Size-Based Pre-Filtering**
As a user uploading many files, I want files with unique sizes to skip the hashing step, so that the deduplication analysis completes quickly without unnecessary processing.

**US-3: Duplicate Filtering**
As a user who accidentally selected the same file multiple times, I want those duplicates to be silently filtered out, so that I don't have to manually identify and remove them.

**US-4: Best File Selection**
As a user with multiple copies of the same file, I want the system to automatically choose the best file to upload (earliest date, longest path, etc.), so that I don't have to decide which copy is the "original."

**US-5: All Metadata Preserved**
As a litigation attorney, I need ALL file metadata from ALL copies saved to the database, so that I can prove chain of custody and file locations for discovery purposes.

### User Experience

**US-6: Progress Feedback**
As a user waiting for deduplication analysis, I want to see progress (X of Y files analyzed) and the current file being processed, so that I know the system is working and how long it will take.

**US-7: Preview Before Upload**
As a user about to upload files, I want to see a summary of what will be uploaded (unique files, copies detected, storage saved), so that I can review and confirm before committing to the upload.

**US-8: Completion Summary**
As a user who just completed an upload, I want to see a summary of what was accomplished (files uploaded, storage saved, deduplication rate), so that I understand the results and benefits of deduplication.

**US-9: Visual Copy Grouping**
As a user reviewing the upload queue, I want to see copy groups visually distinguished (left border, bold/normal font), so that I can easily identify which files are copies and which is the "best file."

**US-10: Status Indicators**
As a user monitoring the upload queue, I want clear status indicators (Ready, Copy, Uploading, Uploaded, Read Error, Failed), so that I know what's happening with each file.

### Performance

**US-11: Hidden Database Queries**
As a user uploading files, I want database queries to happen during upload (not before), so that I don't experience unnecessary delays before upload begins.

**US-12: Non-Blocking Hashing**
As a user adding files to the queue, I want file hashing to run in a web worker, so that the UI remains responsive while files are being analyzed.

**US-13: Instant Client-Side Feedback**
As a user adding files to the queue, I want to see instant feedback about copies and unique files (without database queries), so that I can make decisions quickly.

### Error Handling

**US-14: Hash Failure Handling**
As a user with corrupted or inaccessible files, I want files that fail to hash to be marked with "Read Error" and have their checkboxes disabled, so that I can continue uploading other files without the process failing entirely.

**US-15: Upload Failure Recovery**
As a user experiencing network issues, I want failed uploads to be marked as "Failed" (not abort the entire upload), so that I can retry just the failed files rather than starting over.

### Constraints (Anti-Requirements)

**US-16: No Cherry-Picking Copies**
As a system enforcing litigation discovery rules, I must prevent users from cherry-picking which copy to upload, so that the automated selection is deterministic and auditable. (Users CAN exclude entire copy groups, but CANNOT swap which copy uploads.)

**US-17: No Metadata Suppression**
As a system enforcing litigation discovery rules, I must save metadata from ALL copies regardless of user preferences, so that no file locations or metadata are hidden from the legal record.

---

## Implementation Checklist

**NOTE:** Detailed implementation tasks may be in planning documents under `@planning/2. TODOs/New_Upload_Queue/`. This section contains high-level requirements only.

### Anti-Requirements (What NOT to Do)
- ❌ **No user override** of deduplication decisions (users CAN exclude files from queue, but CANNOT cherry-pick which copy to upload)
- ❌ **No database queries before upload** phase (queries happen during upload to hide latency)
- ❌ **No hashing before user clicks upload** button (only hash during queue analysis, not on file selection)
- ❌ **No metadata suppression** - ALL copy metadata MUST be saved
- ❌ **No priority rule changes** without documenting rationale in architecture doc
- ❌ **No expensive operations outside upload phase** where cost is hidden
- ❌ **No sorting by file size** (provides no benefit, adds O(n log n) overhead - sort by folder path instead)

---

## Related Documentation

For architectural context and implementation details, see:
- `@docs/Features/Upload/Deduplication/25-11-18-client-deduplication-logic.md` - Architecture rationale and detailed implementation guide
- `@docs/Features/Upload/Processing/file-lifecycle.md` - File terminology and lifecycle
- `@docs/Features/Upload/Processing/file-processing.md` - File processing and deduplication strategy
