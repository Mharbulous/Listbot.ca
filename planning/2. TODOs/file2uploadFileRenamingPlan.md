# File → Upload File Renaming Plan

**Created**: 2025-10-26
**Status**: Planning
**Purpose**: Systematic plan for renaming files from "File" to "Upload" terminology and updating all path references

## Overview

This plan covers renaming 20 files that deal with tier 3 (uploads in `/uploads` folder) and updating all import/reference paths throughout the codebase. This plan does **NOT** cover variable/constant renaming (already completed via find/replace).

**Three-tier terminology:**
1. **Document** - Original real-world artifact
2. **Source** - Digital file from user's device
3. **Upload** - Deduplicated file in `/uploads` folder ← **FILES BEING RENAMED**

## Renaming Strategy

Files will be renamed in **reverse dependency order**:
- **Phase 1**: Leaf files (no dependencies on other organizer files)
- **Phase 2**: Mid-level files (depend on Phase 1 files)
- **Phase 3**: Root files (depend on multiple other files)

This minimizes cascading path updates.

## Phase 1: Utilities & Services (No Dependencies)

These files are imported by others but don't import other organizer files.

### 1.1 Utility Files

| Current Path | New Path | Files That Import This |
|-------------|----------|----------------------|
| `src/features/organizer/utils/fileUtils.js` | `src/features/organizer/utils/uploadUtils.js` | FileListItemContent.vue, FileItem.vue, ViewDocument.vue, uploadViewerUtils.js, FileGrid.vue, FileSizeCell.vue, and likely others |
| `src/features/organizer/utils/fileViewerUtils.js` | `src/features/organizer/utils/uploadViewerUtils.js` | Need to search for imports |

**Action Items:**
- [ ] Rename `fileUtils.js` → `uploadUtils.js`
- [ ] Search codebase for `from './utils/fileUtils'` or `from '@/features/organizer/utils/fileUtils'`
- [ ] Update all import paths to `uploadUtils.js`
- [x] Rename `fileViewerUtils.js` → `uploadViewerUtils.js`
- [x] Search codebase for imports and update paths

### 1.2 Service Files

| Current Path | New Path | Files That Import This |
|-------------|----------|----------------------|
| `src/services/fileService.js` | `src/services/uploadService.js` | Cloud.vue |
| `src/features/organizer/services/fileProcessingService.js` | `src/features/organizer/services/uploadProcessingService.js` | Need to search - likely used in views and composables |

**Action Items:**
- [x] Rename `fileService.js` → `uploadService.js`
- [x] Search for `from '@/services/fileService'` or similar
- [x] Update all import paths (Cloud.vue updated)
- [ ] Rename `fileProcessingService.js` → `uploadProcessingService.js`
- [ ] Search for imports and update paths

## Phase 2: Composables (Depend on Phase 1)

These composables likely import utilities and services from Phase 1.

| Current Path | New Path | Files That Import This |
|-------------|----------|----------------------|
| `src/features/organizer/composables/useFilePreview.js` | `src/features/organizer/composables/useUploadPreview.js` | FilePreview.vue, ViewDocument.vue, or other views |
| `src/features/organizer/composables/useFileViewer.js` | `src/features/organizer/composables/useUploadViewer.js` | FileViewer.vue, or other views |
| `src/features/organizer/composables/useFileSearch.js` | `src/features/organizer/composables/useUploadSearch.js` | FileSearch.vue, or views with search functionality |

**Action Items:**
- [ ] Rename `useFilePreview.js` → `useUploadPreview.js`
- [ ] Search for `from './composables/useFilePreview'` or similar patterns
- [ ] Update all import paths
- [ ] Rename `useFileViewer.js` → `useUploadViewer.js`
- [ ] Search and update import paths
- [ ] Rename `useFileSearch.js` → `useUploadSearch.js`
- [ ] Search and update import paths

## Phase 3: Leaf Components (Minimal Dependencies)

These components are used by other components but have minimal dependencies themselves.

### 3.1 Cell Components

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/components/cells/FileSizeCell.vue` | `src/features/organizer/components/cells/UploadSizeCell.vue` | FileListDisplay.vue, table configurations |

**Action Items:**
- [ ] Rename `FileSizeCell.vue` → `UploadSizeCell.vue`
- [ ] Search for `<FileSizeCell` component usage in templates
- [ ] Search for `import FileSizeCell from` in scripts
- [ ] Update all component imports and template tags

### 3.2 Small UI Components

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/components/FileDetails.vue` | `src/features/organizer/components/UploadDetails.vue` | Parent views/components |
| `src/features/organizer/components/FilePreview.vue` | `src/features/organizer/components/UploadPreview.vue` | Parent views/components |
| `src/features/organizer/components/FileTypeFilters.vue` | `src/features/organizer/components/UploadTypeFilters.vue` | FileListDisplay or views |
| `src/features/organizer/components/FileSearch.vue` | `src/features/organizer/components/UploadSearch.vue` | Views with search |

**Action Items:**
- [ ] For each component above:
  - [ ] Rename the file
  - [ ] Search for component tag usage in templates (e.g., `<FileDetails`)
  - [ ] Search for import statements (e.g., `import FileDetails from`)
  - [ ] Update all references

## Phase 4: List Item Components (Used by Display Components)

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/components/FileListItemActions.vue` | `src/features/organizer/components/UploadListItemActions.vue` | FileListItem.vue, FileListItemContent.vue |
| `src/features/organizer/components/FileListItemContent.vue` | `src/features/organizer/components/UploadListItemContent.vue` | FileListItem.vue |
| `src/features/organizer/components/FileItem.vue` | `src/features/organizer/components/UploadItem.vue` | FileGrid.vue, other layouts |

**Action Items:**
- [ ] Rename `FileListItemActions.vue` → `UploadListItemActions.vue`
- [ ] Search for `<FileListItemActions` and `import FileListItemActions`
- [ ] Update all references
- [ ] Rename `FileListItemContent.vue` → `UploadListItemContent.vue`
- [ ] Search for `<FileListItemContent` and `import FileListItemContent`
- [ ] Update all references (especially in FileListItem.vue)
- [ ] Rename `FileItem.vue` → `UploadItem.vue`
- [ ] Search for `<FileItem` and `import FileItem`
- [ ] Update all references

## Phase 5: Container/List Components (Use List Item Components)

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/components/FileListItem.vue` | `src/features/organizer/components/UploadListItem.vue` | FileListDisplay.vue |
| `src/features/organizer/components/FileGrid.vue` | `src/features/organizer/components/UploadGrid.vue` | Views |

**Action Items:**
- [ ] Rename `FileListItem.vue` → `UploadListItem.vue`
- [ ] Search for `<FileListItem` and `import FileListItem`
- [ ] Update all references (especially in FileListDisplay.vue)
- [ ] Rename `FileGrid.vue` → `UploadGrid.vue`
- [ ] Search for `<FileGrid` and `import FileGrid`
- [ ] Update all references

## Phase 6: Main Display Component (Uses Container Components)

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/components/FileListDisplay.vue` | `src/features/organizer/components/UploadListDisplay.vue` | FileViewer.vue, other views |

**Action Items:**
- [ ] Rename `FileListDisplay.vue` → `UploadListDisplay.vue`
- [ ] Search for `<FileListDisplay` and `import FileListDisplay`
- [ ] Update all references (especially in FileViewer.vue and router)

## Phase 7: Top-Level View (Uses Everything)

| Current Path | New Path | Used By |
|-------------|----------|---------|
| `src/features/organizer/views/FileViewer.vue` | `src/features/organizer/views/UploadViewer.vue` | Router configuration, navigation components |

**Action Items:**
- [ ] Rename `FileViewer.vue` → `UploadViewer.vue`
- [ ] Search for `<FileViewer` and `import FileViewer`
- [ ] Update router configuration (`src/router/index.js` or similar)
- [ ] Update any navigation links or route references
- [ ] Update any breadcrumb or title references

## Phase 8: Tests

| Current Path | New Path | Tests What |
|-------------|----------|------------|
| `tests/unit/features/organizer/components/FileListItemTags.spec.js` | `tests/unit/features/organizer/components/UploadListItemTags.spec.js` | Component that may also need renaming |

**Action Items:**
- [ ] Rename test file
- [ ] Update import paths inside the test file
- [ ] Verify test still runs correctly
- [ ] Check if the component being tested (FileListItemTags) also needs renaming

## Search Patterns for Each Phase

For each file being renamed, use these search patterns:

### JavaScript/Vue Script Imports
```
Search: from './[old-filename]'
Search: from '@/features/organizer/[path]/[old-filename]'
Search: from '@/services/[old-filename]'
```

### Vue Template Component Tags
```
Search: <FileComponentName
Search: </FileComponentName>
```

### Router Definitions
```
Search: component: () => import('@/features/organizer/views/FileViewer')
Search: name: 'FileViewer'
```

### Dynamic Imports
```
Search: const FileComponent = defineAsyncComponent
```

## Verification Checklist

After each phase:
- [ ] Run `npm run lint` to catch any broken imports
- [ ] Search for remaining references to old filename
- [ ] Verify dev server starts without errors
- [ ] Check browser console for import errors

After all phases:
- [ ] Run full test suite
- [ ] Manually test affected features in browser
- [ ] Search entire codebase for any remaining "File" references that should be "Upload"

## Critical Files to Check

These files are likely to import many of the renamed files:

- [ ] `src/router/index.js` - View imports and route definitions
- [ ] `src/features/organizer/views/ViewDocument.vue` - Likely uses multiple composables and components
- [ ] `src/features/organizer/views/UploadViewer.vue` (after rename) - Main view
- [ ] `src/App.vue` - May have navigation references
- [ ] Component index files (if any exist)

## Notes

- **Git tracking**: Git should automatically track file renames if done correctly
- **Case sensitivity**: Be careful with filename case on Windows vs Linux/Mac
- **Backup**: Consider committing before starting or working on a branch
- **Incremental**: Can do one phase at a time and test between phases
- **Import aliases**: Watch for both relative imports (`./`) and alias imports (`@/`)

## Related Documentation

After completing renames, update:
- [ ] `planning/2. TODOs/file2storagechecklist.md` - Mark file renames complete
- [ ] `docs/architecture/` - Update any architecture diagrams or file structure docs
- [ ] README files that reference specific file paths

## Progress Summary

**Total Files to Rename**: 20 files

- [x] Phase 1: Utilities & Services - PARTIAL (1 of 4 files renamed: fileService.js → uploadService.js)
- [ ] Phase 2: Composables (3 files)
- [ ] Phase 3: Leaf Components (5 files)
- [ ] Phase 4: List Item Components (3 files)
- [ ] Phase 5: Container Components (2 files)
- [ ] Phase 6: Main Display Component (1 file)
- [ ] Phase 7: Top-Level View (1 file)
- [ ] Phase 8: Tests (1 file)
