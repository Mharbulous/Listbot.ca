# File → Upload File Renaming Plan (Pending Only)

**Status**: 3 of 20 files renamed | 17 remaining

## Pending File Renames

| Current Path | New Path | Phase |
|-------------|----------|-------|
| `src/features/organizer/utils/fileUtils.js` | `src/features/organizer/utils/uploadUtils.js` | Phase 1: Utilities |
| `src/features/organizer/services/fileProcessingService.js` | `src/features/organizer/services/uploadProcessingService.js` | Phase 1: Services |
| `src/features/organizer/composables/useFilePreview.js` | `src/features/organizer/composables/useUploadPreview.js` | Phase 2: Composables |
| `src/features/organizer/composables/useFileViewer.js` | `src/features/organizer/composables/useUploadViewer.js` | Phase 2: Composables |
| `src/features/organizer/composables/useFileSearch.js` | `src/features/organizer/composables/useUploadSearch.js` | Phase 2: Composables |
| `src/features/organizer/components/cells/FileSizeCell.vue` | `src/features/organizer/components/cells/UploadSizeCell.vue` | Phase 3: Cells |
| `src/features/organizer/components/FileDetails.vue` | `src/features/organizer/components/UploadDetails.vue` | Phase 3: UI Components |
| `src/features/organizer/components/FilePreview.vue` | `src/features/organizer/components/UploadPreview.vue` | Phase 3: UI Components |
| `src/features/organizer/components/FileTypeFilters.vue` | `src/features/organizer/components/UploadTypeFilters.vue` | Phase 3: UI Components |
| `src/features/organizer/components/FileSearch.vue` | `src/features/organizer/components/UploadSearch.vue` | Phase 3: UI Components |
| `src/features/organizer/components/FileListItemActions.vue` | `src/features/organizer/components/UploadListItemActions.vue` | Phase 4: List Items |
| `src/features/organizer/components/FileListItemContent.vue` | `src/features/organizer/components/UploadListItemContent.vue` | Phase 4: List Items |
| `src/features/organizer/components/FileItem.vue` | `src/features/organizer/components/UploadItem.vue` | Phase 4: List Items |
| `src/features/organizer/components/FileListItem.vue` | `src/features/organizer/components/UploadListItem.vue` | Phase 5: Containers |
| `src/features/organizer/components/FileGrid.vue` | `src/features/organizer/components/UploadGrid.vue` | Phase 5: Containers |
| `src/features/organizer/components/FileListDisplay.vue` | `src/features/organizer/components/UploadListDisplay.vue` | Phase 6: Main Display |
| `src/features/organizer/views/FileViewer.vue` | `src/features/organizer/views/UploadViewer.vue` | Phase 7: Views |
| `tests/unit/features/organizer/components/FileListItemTags.spec.js` | `tests/unit/features/organizer/components/UploadListItemTags.spec.js` | Phase 8: Tests |

## Completed Renames

✓ `src/services/fileService.js` → `src/services/uploadService.js`
✓ `src/features/organizer/utils/fileViewerUtils.js` → `src/features/organizer/utils/uploadViewerUtils.js`

## Verification After Each Rename

1. Search for old filename in imports
2. Update all import paths
3. Update component tags in templates (for Vue files)
4. Run `npm run lint`
5. Check dev server console for errors
