# Legacy Constraint Files - Migration Summary

**Date:** 2025-11-15  
**Purpose:** Move Uploadv2-style legacy code from `/features/constraint` to `/dev-demos/legacy-constraint`

## What Was Moved

These files were copied to the constraint folder from the Uploadv2 interface but are **NOT used** by the new constraint page (`/constraint`).

### Main Component
- `FileUpload.vue` - Old Uploadv2-style upload interface (unused by constraint page)

### Vue Components (12 files)
- `CloudFileWarningModal.vue`
- `FileUploadQueue.vue`
- `FileUploadStatus.vue`
- `FolderOptionsDialog.vue`
- `LazyFileItem.vue`
- `ProcessingProgressModal.vue`
- `QueueTimeProgress.vue`
- `UploadCompletionModal.vue`
- `UploadDropzone.vue`
- `UploadPreviewModal.vue`
- `UploadSummaryCard.vue`

### Composables (18 files)
Worker-based deduplication infrastructure:
- `useQueueDeduplication.js` - Worker coordination
- `useQueueWorkers.js` - Worker management
- `useQueueProgress.js` - Progress tracking
- `useWorkerManager.js` - Worker lifecycle
- `useWebWorker.js` - Web worker wrapper

Folder analysis and upload queue:
- `useFileQueue.js` - Old queue management
- `useFileQueueCore.js` - Queue utilities
- `useFolderOptions.js` - Folder selection dialog
- `useFolderAnalysis.js` - Folder scanning
- `useFolderProgress.js` - Folder progress tracking
- `useFolderTimeouts.js` - Timeout management

Upload handlers and utilities:
- `useFileUploadHandlers.js` - Upload orchestration
- `useUploadOrchestration.js` - Upload state management
- `useUploadLogger.js` - Upload event logging
- `useFileDragDrop.js` - Drag & drop handling
- `useTimeBasedWarning.js` - Cloud file warnings
- `useLazyHashTooltip.js` - BLAKE3 hash tooltips (legacy)
- `useLazyFileList.js` - Lazy file list rendering
- `useHashVerification.js` - Hash verification utilities

### Workers (1 file)
- `workers/fileHashWorker.js` - BLAKE3 web worker (legacy)

## What Remains in `/features/constraint`

### Active Constraint Page Components
**Used by the new constraint page:**
- `Constraint.vue` - Main view
- `ConstraintTable.vue` + sub-components:
  - `ConstraintTableVirtualizer.vue`
  - `ConstraintTableHeader.vue`
  - `ConstraintTableFooter.vue`
  - `ConstraintTableRow.vue`
  - `ConstraintTableDropzone.vue`
- `QueueProgressIndicator.vue`
- Shared components: `FileNameCell.vue`, `FileQueueChips.vue`, `SelectCell.vue`, `StatusCell.vue`, etc.

### Active Composables
**Phase 1 deduplication (XXH3-based):**
- `useConstraintTable.js` - Main Phase 1 deduplication logic
- `useConstraintAdapter.js` - Upload adapter
- `useQueueCore.js` - **Shared file** (contains both Phase 1 XXH3 functions AND legacy BLAKE3 functions)
- `useTentativeVerification.js` - **Should be removed** per Phase 1 plan
- `useLazyXXH3Tooltip.js` - XXH3 hash tooltips

**Shared utilities (used by both):**
- `useFileProcessor.js`
- `useFileMetadata.js`
- `useWebWorker.js` - Used by `useConstraintAdapter`
- `useFileTypeIcons.js`
- `useGroupStyling.js`

### Utils (Shared)
All utils remain in `/features/constraint/utils/` since both old and new code use them:
- `fileAnalysis.js`
- `filePathExtractor.js`
- `fileTypeChecker.js`
- `fileTypeIcons.js`
- `folderPathUtils.js`
- `hardwareCalibration.js`
- `networkUtils.js`
- `processingTimer.js`
- `uploadHelpers.js`

## Import Updates Made

The moved files now reference:
1. **Store imports:** `../../../core/stores/` (up 3 levels from legacy-constraint)
2. **Shared utils:** `../../../features/constraint/utils/`
3. **Shared composables:** `../../../features/constraint/composables/` (for useWebWorker, useFileProcessor, useFileMetadata, useQueueCore)
4. **Local imports:** `./composables/`, `./components/` (within legacy-constraint folder)

## Recommendations

### For Complete Phase 1 Migration
Per the Phase 1 implementation plan, the following should still be removed from `/features/constraint`:

1. **useTentativeVerification.js** - Phase 1 doesn't use lazy hashing
2. **useQueueCore.js legacy functions:**
   - `processMainThreadDeduplication()` (uses BLAKE3, lines 159-255)
   - `preFilterByMetadataAndPath()` (Phase 3a logic, lines 313-415)
   - `findBestMatchingFile()` (Phase 3a logic, lines 264-303)
   - `processDuplicateGroups()` (uses BLAKE3 logic)

These functions are duplicated and NOT used by the constraint page's Phase 1 deduplication.

## Status

✅ **Migration Complete** - All Uploadv2-style legacy code moved to `dev-demos/legacy-constraint`  
✅ **Constraint Page Active** - Uses Phase 1 XXH3-based deduplication  
✅ **Old Upload Interface Preserved** - Files preserved in case `/upload` route still depends on them  

The constraint page at `http://localhost:5173/#/constraint` now only uses Phase 1 deduplication logic with no dependency on the moved files.
