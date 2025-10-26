# File → Upload Terminology Migration Checklist

**Created**: 2025-10-26
**Status**: Planning
**Purpose**: Checklist for migrating tier 3 terminology from "File" to "Upload"

## Overview

This document tracks all variables, constants, functions, and properties that use "File" terminology when referring to tier 3 (deduplicated files in the `/uploads` folder). These should be renamed to use "Upload" terminology for consistency with the three-tier file lifecycle:

1. **Document** - Original real-world artifact (paper receipt)
2. **Source** - Digital file from user's device (scanned PDF)
3. **Upload** - Deduplicated file in `/uploads` folder (BLAKE3 hash-based)

**Rationale**: "Upload" clearly distinguishes the raw uploaded files from derivatives:

- `/uploads` - Raw deduplicated uploads (tier 3) ← **THIS**
- `/PDFs` - Standardized PDF conversions
- `/bates` - Single-page Bates-numbered PDFs
- `/redacted` - Redacted versions

## Migration Table

| Current Name                                       | New Name                                             | Found In                                                        |
| -------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| **Composables - useFilePreview.js**                |                                                      |                                                                 |
| `selectedUpload` (ref)                             | `selectedUpload`                                     | `src/features/organizer/composables/useFilePreview.js:13`       |
| `selectUpload(file)` (function)                    | `selectUpload(upload)`                               | `src/features/organizer/composables/useFilePreview.js:55`       |
| `generateUploadPreview(file)` (function)           | `generateUploadPreview(upload)`                      | `src/features/organizer/composables/useFilePreview.js:22`       |
| **Composables - useFileViewer.js**                 |                                                      |                                                                 |
| `files` (ref)                                      | `uploads`                                            | `src/features/organizer/composables/useFileViewer.js:13`        |
| `loadFiles()` (function)                           | `loadUploads()`                                      | `src/features/organizer/composables/useFileViewer.js:20`        |
| `totalFiles` (computed)                            | `totalUploads`                                       | `src/features/organizer/composables/useFileViewer.js:32`        |
| **Utility Functions - fileUtils.js**               |                                                      |                                                                 |
| `getFileExtension(filename)`                       | `getUploadExtension(filename)`                       | `src/features/organizer/utils/fileUtils.js:16`                  |
| `getFileIcon(filename)`                            | `getUploadIcon(filename)`                            | `src/features/organizer/utils/fileUtils.js:25`                  |
| `getFileIconColor(filename)`                       | `getUploadIconColor(filename)`                       | `src/features/organizer/utils/fileUtils.js:51`                  |
| `formatFileSize(bytes)`                            | `formatUploadSize(bytes)`                            | `src/features/organizer/utils/fileUtils.js:75`                  |
| **Components - FileListItemContent.vue**           |                                                      |                                                                 |
| `displayName` (computed)                           | `uploadFileName`                                     | `src/features/organizer/components/FileListItemContent.vue:102` |
| `fileExtension` (computed)                         | `uploadExtension`                                    | `src/features/organizer/components/FileListItemContent.vue:106` |
| `formattedFileSize` (computed)                     | `uploadSizeFormatted`                                | `src/features/organizer/components/FileListItemContent.vue:115` |
| `fileIcon` (computed)                              | `uploadIcon`                                         | `src/features/organizer/components/FileListItemContent.vue:132` |
| `fileIconColor` (computed)                         | `uploadIconColor`                                    | `src/features/organizer/components/FileListItemContent.vue:153` |
| **Components - FileItem.vue**                      |                                                      |                                                                 |
| `fileExtension` (computed)                         | `uploadExtension`                                    | `src/features/organizer/components/FileItem.vue:98`             |
| `fileIcon` (computed)                              | `uploadIcon`                                         | `src/features/organizer/components/FileItem.vue:99`             |
| `fileIconColor` (computed)                         | `uploadIconColor`                                    | `src/features/organizer/components/FileItem.vue:100`            |
| `formattedFileSize` (computed)                     | `uploadSizeFormatted`                                | `src/features/organizer/components/FileItem.vue:101`            |
| **Components - ViewDocument.vue**                  |                                                      |                                                                 |
| `formatFileSize(bytes)`                            | `formatUploadSize(bytes)`                            | `src/features/organizer/views/ViewDocument.vue:374`             |
| `isPdfFile` (computed)                             | `isUploadPdf`                                        | `src/features/organizer/views/ViewDocument.vue:474`             |
| **Configuration - columnConfig.js**                |                                                      |                                                                 |
| `fileName` (column key)                            | `uploadFileName`                                     | `src/utils/columnConfig.js:8`                                   |
| `fileType` (column key)                            | `uploadFileType`                                     | `src/utils/columnConfig.js:7`                                   |
| **Services - fileProcessingService.js**            |                                                      |                                                                 |
| `getFileForProcessing(evidence, firmId, matterId)` | `getUploadForProcessing(evidence, firmId, matterId)` | `src/features/organizer/services/fileProcessingService.js:20`   |
| `getFileDownloadURL(evidence, firmId, matterId)`   | `getUploadDownloadURL(evidence, firmId, matterId)`   | `src/features/organizer/services/fileProcessingService.js:75`   |
| **Services - aiProcessingService.js**              |                                                      |                                                                 |
| `validateFileSize(evidence)`                       | `validateUploadSize(evidence)`                       | `src/features/organizer/services/aiProcessingService.js:26`     |
| **Stores - organizerCore.js**                      |                                                      |                                                                 |
| `displayInfoCache` (ref)                           | `uploadDisplayCache`                                 | `src/features/organizer/stores/organizerCore.js:30`             |
| **Type Definitions - viewer.types.js**             |                                                      |                                                                 |
| `FileItem` (typedef)                               | `UploadFile`                                         | `src/features/organizer/types/viewer.types.js:7-19`             |
| `FileItem.name` (property)                         | `UploadFile.uploadName`                              | `src/features/organizer/types/viewer.types.js:9`                |
| `FileItem.path` (property)                         | `UploadFile.uploadPath`                              | `src/features/organizer/types/viewer.types.js:10`               |
| `FileItem.size` (property)                         | `UploadFile.uploadSize`                              | `src/features/organizer/types/viewer.types.js:11`               |
| `FileItem.type` (property)                         | `UploadFile.uploadType`                              | `src/features/organizer/types/viewer.types.js:12`               |
| `FileItem.dateUploaded` (property)                 | `UploadFile.uploadedAt`                              | `src/features/organizer/types/viewer.types.js:16`               |
| `FileItem.dateModified` (property)                 | `UploadFile.lastModified`                            | `src/features/organizer/types/viewer.types.js:17`               |
| `NavigationState.currentFile` (property)           | `NavigationState.currentUpload`                      | `src/features/organizer/types/viewer.types.js:53`               |
| `ViewerState.selectedUpload` (property)            | `ViewerState.selectedUpload`                         | `src/features/organizer/types/viewer.types.js:35`               |

## Items to Keep As-Is

The following items use "file" terminology but should **NOT** be renamed:

| Item                        | Reason                                                       | Found In        |
| --------------------------- | ------------------------------------------------------------ | --------------- |
| `fileHash`                  | Database property representing BLAKE3 hash document ID       | Multiple files  |
| `fileSize`                  | Database property name in Firestore                          | Multiple files  |
| `fileCreated`               | Database timestamp property                                  | Multiple files  |
| `displayName`               | Semantically clear; represents source metadata               | Multiple files  |
| `evidence` objects          | Semantically accurate for business domain                    | Multiple files  |
| CSS class names (`.file-*`) | Serve as accessibility aids; renaming provides minimal value | Component files |

## Implementation Strategy

### Phase 1: Type Definitions & Utilities (Foundation)

Update base types and utility functions first since other code depends on them:

1. `src/features/organizer/types/viewer.types.js` - Update `FileItem` typedef → `UploadFile`
2. `src/features/organizer/utils/fileUtils.js` - Update 4 utility functions
3. `src/utils/columnConfig.js` - Update column keys

### Phase 2: Services (Business Logic)

Update service layer that depends on types and utilities:

1. `src/features/organizer/services/fileProcessingService.js` - Update 2 methods
2. `src/features/organizer/services/aiProcessingService.js` - Update 1 method

### Phase 3: Stores (State Management)

Update stores that use services:

1. `src/features/organizer/stores/organizerCore.js` - Update cache naming

### Phase 4: Composables (Reusable Logic)

Update composables that depend on stores and services:

1. `src/features/organizer/composables/useFilePreview.js` - Update 3 items
2. `src/features/organizer/composables/useFileViewer.js` - Update 3 items

### Phase 5: Components (UI Layer)

Update components last since they depend on everything else:

1. `src/features/organizer/components/FileListItemContent.vue` - Update 5 computed properties
2. `src/features/organizer/components/FileItem.vue` - Update 4 computed properties
3. `src/features/organizer/views/ViewDocument.vue` - Update 2 functions

### Phase 6: Verification

1. Run linter on all modified files
2. Run test suite
3. Manual testing of organizer views
4. Verify no broken references

## Progress Tracking

**Total Items**: 39 renamings across 13 files

- [ ] Phase 1: Type Definitions & Utilities (3 files, 7 items)
- [ ] Phase 2: Services (2 files, 3 items)
- [ ] Phase 3: Stores (1 file, 1 item)
- [ ] Phase 4: Composables (2 files, 6 items)
- [ ] Phase 5: Components (3 files, 11 items)
- [ ] Phase 6: Verification

## Notes

- This migration is **non-breaking** at the database level (database field names remain unchanged)
- Focus is on **code clarity** and **internal consistency**
- Components and templates will require careful search-and-replace to update all references
- Update corresponding tests after each phase
- Use beautifier agent after each file update to ensure code quality

## Related Documentation

- `CLAUDE.md` - "Data Model & Naming Conventions" section
- `planning/7. Completed/terminologyStandardization.md` - Original terminology standardization
- `docs/architecture/FileMetadata.md` - Metadata architecture
- `docs/architecture/Evidence.md` - Evidence collection structure
