# File → Upload Variable/Constant Renaming (Pending)

**Purpose**: Rename variables, constants, and functions within files (not the filenames themselves)

**Total Items**: 39 renamings across 13 files

## Pending Variable/Constant Renames

| Current Name | New Name | File Location |
|-------------|----------|---------------|
| `selectUpload(file)` parameter | `selectUpload(upload)` | `src/features/organizer/composables/useFilePreview.js:55` |
| `generateUploadPreview(file)` parameter | `generateUploadPreview(upload)` | `src/features/organizer/composables/useFilePreview.js:22` |
| `files` ref | `uploads` | `src/features/organizer/composables/useFileViewer.js:13` |
| `loadFiles()` function | `loadUploads()` | `src/features/organizer/composables/useFileViewer.js:20` |
| `totalFiles` computed | `totalUploads` | `src/features/organizer/composables/useFileViewer.js:32` |
| `getFileExtension(filename)` | `getUploadExtension(filename)` | `src/features/organizer/utils/fileUtils.js:16` |
| `getFileIcon(filename)` | `getUploadIcon(filename)` | `src/features/organizer/utils/fileUtils.js:25` |
| `getFileIconColor(filename)` | `getUploadIconColor(filename)` | `src/features/organizer/utils/fileUtils.js:51` |
| `formatFileSize(bytes)` | `formatUploadSize(bytes)` | `src/features/organizer/utils/fileUtils.js:75` |
| `displayName` computed | `uploadFileName` | `src/features/organizer/components/FileListItemContent.vue:102` |
| `fileExtension` computed | `uploadExtension` | `src/features/organizer/components/FileListItemContent.vue:106` |
| `formattedFileSize` computed | `uploadSizeFormatted` | `src/features/organizer/components/FileListItemContent.vue:115` |
| `fileIcon` computed | `uploadIcon` | `src/features/organizer/components/FileListItemContent.vue:132` |
| `fileIconColor` computed | `uploadIconColor` | `src/features/organizer/components/FileListItemContent.vue:153` |
| `fileExtension` computed | `uploadExtension` | `src/features/organizer/components/FileItem.vue:98` |
| `fileIcon` computed | `uploadIcon` | `src/features/organizer/components/FileItem.vue:99` |
| `fileIconColor` computed | `uploadIconColor` | `src/features/organizer/components/FileItem.vue:100` |
| `formattedFileSize` computed | `uploadSizeFormatted` | `src/features/organizer/components/FileItem.vue:101` |
| `formatFileSize(bytes)` | `formatUploadSize(bytes)` | `src/features/organizer/views/NewViewDocument2.vue:374` |
| `isPdfFile` computed | `isUploadPdf` | `src/features/organizer/views/NewViewDocument2.vue:474` |
| `fileName` column key | `uploadFileName` | `src/utils/columnConfig.js:8` |
| `fileType` column key | `uploadFileType` | `src/utils/columnConfig.js:7` |
| `getFileForProcessing(evidence, firmId, matterId)` | `getUploadForProcessing(evidence, firmId, matterId)` | `src/features/organizer/services/fileProcessingService.js:20` |
| `getFileDownloadURL(evidence, firmId, matterId)` | `getUploadDownloadURL(evidence, firmId, matterId)` | `src/features/organizer/services/fileProcessingService.js:75` |
| `validateFileSize(evidence)` | `validateUploadSize(evidence)` | `src/features/organizer/services/aiProcessingService.js:26` |
| `displayInfoCache` ref | `uploadDisplayCache` | `src/features/organizer/stores/organizerCore.js:30` |
| `FileItem` typedef | `UploadFile` | `src/features/organizer/types/viewer.types.js:7-19` |
| `FileItem.name` property | `UploadFile.uploadName` | `src/features/organizer/types/viewer.types.js:9` |
| `FileItem.path` property | `UploadFile.uploadPath` | `src/features/organizer/types/viewer.types.js:10` |
| `FileItem.size` property | `UploadFile.uploadSize` | `src/features/organizer/types/viewer.types.js:11` |
| `FileItem.type` property | `UploadFile.uploadType` | `src/features/organizer/types/viewer.types.js:12` |
| `FileItem.dateUploaded` property | `UploadFile.uploadedAt` | `src/features/organizer/types/viewer.types.js:16` |
| `FileItem.dateModified` property | `UploadFile.lastModified` | `src/features/organizer/types/viewer.types.js:17` |
| `NavigationState.currentFile` property | `NavigationState.currentUpload` | `src/features/organizer/types/viewer.types.js:53` |

## Implementation Order (Dependency-Based)

1. **Phase 1**: Types & Utilities (7 items in 3 files)
2. **Phase 2**: Services (3 items in 2 files)
3. **Phase 3**: Stores (1 item in 1 file)
4. **Phase 4**: Composables (5 items in 2 files)
5. **Phase 5**: Components (12 items in 3 files)

## Items to Keep Unchanged

These use "file" but should NOT be renamed:

| Item | Reason |
|------|--------|
| `fileHash` | Database property name |
| `fileSize` | Database property name |
| `fileCreated` | Database timestamp property |
| `displayName` (in some contexts) | Source metadata representation |
| CSS class names `.file-*` | Accessibility aids |
