# Terminology Standardization Plan

**Created**: 2025-10-25
**Status**: Planning
**Reference**: See `CLAUDE.md` - "Data Model & Naming Conventions" section

## Overview

This plan establishes a systematic approach to standardize terminology across documentation and code to align with the three-tier file lifecycle naming conventions:

1. **Document** - Original real-world artifact (e.g., paper receipt)
2. **Source** - Digital file created by user for upload (e.g., scanned PDF)
3. **File** - Digital file stored in Firebase Storage (deduplicated, hash-named)

## What to Look For

When reviewing files, update:

- **Variable names**: `documentDate`, `sourceModifiedDate`, `fileUploadDate`
- **Field names**: Database/Firestore field names should reflect the convention
- **Comments**: Code comments should use consistent terminology
- **UI text**: User-facing labels and descriptions
- **Documentation**: Explanations, examples, and references

## Phase 1: Documentation Files

### Priority 1: Core File System Documentation

- [ ] `docs/uploading.md`
  - **Focus**: Update references to "original files" vs "storage files"
  - **Key sections**: Upload Process Flow, Metadata Management, API Reference
  - **Search for**: "original file", "uploaded file", references to dates/timestamps

- [ ] `docs/architecture/FileMetadata.md`
  - **Focus**: Critical - already uses "Source File" terminology, ensure consistency
  - **Key sections**: UI Metadata Presentation, sourceMetadata Subcollection
  - **Search for**: Any ambiguous "file" references that should specify source/storage

- [ ] `docs/architecture/firebase-storage.md`
  - **Focus**: Storage paths and deduplication examples
  - **Key sections**: File Storage Paths, Deduplication Examples
  - **Search for**: "original file", "uploaded file", clarify which tier

- [ ] `docs/Document-Processing-Workflow.md`
  - **Focus**: Distinguish between document (paper) and source (digital scan)
  - **Key sections**: Workflow diagrams and descriptions
  - **Search for**: Document vs file references, especially in split/merge contexts

- [ ] `docs/data-structures.md`
  - **Focus**: Field definitions and data structure schemas
  - **Key sections**: All field definitions related to files/metadata
  - **Search for**: Date field definitions, filename references

### Priority 2: Architecture Documentation

- [ ] `docs/architecture/Evidence.md`
  - **Focus**: Evidence collection field definitions
  - **Search for**: File reference terminology, date fields

- [ ] `docs/architecture/MetadataSpecs.md`
  - **Focus**: Embedded metadata specifications
  - **Search for**: References to "file" dates vs "document" dates

- [ ] `docs/architecture/Settings.md`
  - **Focus**: Any file-related settings or preferences
  - **Search for**: Date format settings, file handling preferences

- [ ] `docs/architecture/SoloFirmMatters.md`
  - **Focus**: File organization and matter structure
  - **Search for**: File storage and organization terminology

- [ ] `docs/architecture/CategoryTags.md`
  - **Focus**: Tag application to files/documents
  - **Search for**: What tags are applied to (documents vs files)

- [ ] `docs/architecture/security-rules.md`
  - **Focus**: Access control for files
  - **Search for**: File access terminology

### Priority 3: Process Documentation

- [ ] `docs/firebase-storage-plan.md`
  - **Focus**: Storage architecture and planning
  - **Search for**: File upload and storage terminology

- [ ] `docs/AsyncProcessesTable.md`
  - **Focus**: Async processes related to file handling
  - **Search for**: Process descriptions involving files

- [ ] `docs/authentication.md`
  - **Focus**: User context for file uploads
  - **Search for**: File-related user actions (if any)

### Priority 4: Development Documentation

- [ ] `docs/design-guidelines.md`
  - **Focus**: UI patterns for displaying file information
  - **Search for**: File display patterns and terminology

- [ ] `docs/vitest-test-suites.md`
  - **Focus**: Test descriptions and assertions
  - **Search for**: File-related test cases

- [ ] `docs/TanStackAndVue3.md`
  - **Focus**: Table display of file data
  - **Search for**: Column definitions, data display patterns

- [ ] `docs/FAQ.md`
  - **Focus**: User-facing explanations
  - **Search for**: Questions about files, uploads, dates

### Priority 5: Agent Instructions

- [ ] `docs/agent-instructions/file-relocator.md`
  - **Focus**: File operations and refactoring
  - **Search for**: File terminology in instructions

## Phase 2: Code Files

### Services Layer

- [ ] `src/services/fileService.js`
  - **Focus**: Core file operations service
  - **Review**: Function names, parameters, comments
  - **Key areas**: File upload logic, metadata extraction, date handling

- [ ] `src/features/organizer/services/evidenceService.js`
  - **Focus**: Evidence document CRUD operations
  - **Review**: Field name references, especially dates
  - **Key areas**: Evidence creation, metadata linking

- [ ] `src/features/organizer/services/evidenceQueryService.js`
  - **Focus**: Evidence querying and filtering
  - **Review**: Query field names, filter terminology

- [ ] `src/features/organizer/services/aiProcessingService.js`
  - **Focus**: AI document processing
  - **Review**: Document vs file references in processing logic

### Upload Feature Composables

- [ ] `src/features/upload/composables/useFileQueue.js`
  - **Focus**: Queue management and file processing
  - **Review**: Variable names for file objects, dates, metadata
  - **Key areas**: Queue items should clearly indicate "source" stage

- [ ] `src/features/upload/composables/useFileQueueCore.js`
  - **Focus**: Core queue functionality
  - **Review**: File state management, status tracking

- [ ] `src/features/upload/composables/useFileMetadata.js`
  - **Focus**: CRITICAL - metadata generation and hashing
  - **Review**: Field names like `sourceFileName`, `lastModified`
  - **Key areas**: Metadata hash generation, field mapping

- [ ] `src/features/upload/composables/useQueueDeduplication.js`
  - **Focus**: Duplicate detection logic
  - **Review**: Hash comparison, metadata comparison terminology

- [ ] `src/features/upload/composables/useFolderOptions.js`
  - **Focus**: Folder analysis and path handling
  - **Review**: Source folder path extraction and parsing

- [ ] `src/features/upload/composables/useFolderAnalysis.js`
  - **Focus**: Folder structure analysis
  - **Review**: Path parsing, file metadata extraction

- [ ] `src/features/upload/composables/useQueueCore.js`
  - **Focus**: Queue state management
  - **Review**: File state transitions, metadata handling

- [ ] `src/features/upload/composables/useQueueWorkers.js`
  - **Focus**: Worker coordination
  - **Review**: Worker message passing, file references

### Organizer Feature Composables

- [ ] `src/features/organizer/composables/useFilePreview.js`
  - **Focus**: File preview generation
  - **Review**: What's being previewed (storage file)

- [ ] `src/features/organizer/composables/useFileViewer.js`
  - **Focus**: File viewing logic
  - **Review**: File vs document terminology in viewer context

- [ ] `src/features/organizer/composables/useEvidenceDeduplication.js`
  - **Focus**: Evidence-level deduplication
  - **Review**: Hash references, metadata comparison

### Upload Feature Components

- [ ] `src/features/upload/FileUpload.vue`
  - **Focus**: Main upload interface
  - **Review**: UI labels, error messages, progress text
  - **Key areas**: "Drop files here" vs "Upload documents"

- [ ] `src/features/upload/components/FileUploadQueue.vue`
  - **Focus**: Queue display
  - **Review**: Column headers, status messages
  - **Key areas**: File name display, date display

- [ ] `src/features/upload/components/FolderOptionsDialog.vue`
  - **Focus**: Folder upload options
  - **Review**: Dialog text explaining what's being uploaded

- [ ] `src/features/upload/components/ProcessingProgressModal.vue`
  - **Focus**: Progress display during processing
  - **Review**: Progress message terminology

- [ ] `src/features/upload/components/LazyFileItem.vue`
  - **Focus**: Individual file item display
  - **Review**: File metadata display, tooltip text

- [ ] `src/features/upload/components/UploadDropzone.vue`
  - **Focus**: Drag-and-drop interface
  - **Review**: Instructions and prompts to user

- [ ] `src/features/upload/components/QueueTimeProgress.vue`
  - **Focus**: Time estimation display
  - **Review**: Progress labels and descriptions

- [ ] `src/features/upload/components/CloudFileWarningModal.vue`
  - **Focus**: Cloud file detection warning
  - **Review**: Warning message terminology

### Organizer Feature Components

- [ ] `src/features/organizer/views/ViewDocument.vue`
  - **Focus**: CRITICAL - document metadata display
  - **Review**: "Source File" section labels, embedded metadata labels
  - **Key areas**: Clearly distinguish document date from source date from upload date

- [ ] `src/features/organizer/components/FileListDisplay.vue`
  - **Focus**: File list rendering
  - **Review**: Column headers, cell content

- [ ] `src/features/organizer/components/FileItem.vue`
  - **Focus**: Individual file display
  - **Review**: File metadata display

- [ ] `src/features/organizer/components/FileDetails.vue`
  - **Focus**: File detail panel
  - **Review**: Detail labels and values

- [ ] `src/features/organizer/components/FilePreview.vue`
  - **Focus**: File preview component
  - **Review**: Preview title/caption text

### Configuration Files

- [ ] `src/features/organizer/config/fileListColumns.js`
  - **Focus**: CRITICAL - column definitions for file lists
  - **Review**: Column labels, field accessors, tooltips
  - **Key areas**: Date columns should specify which date type

- [ ] `src/features/organizer/utils/fileUtils.js`
  - **Focus**: File utility functions
  - **Review**: Function names and comments

- [ ] `src/features/upload/utils/fileAnalysis.js`
  - **Focus**: File analysis utilities
  - **Review**: Function parameters and return values

### Stores

- [ ] `src/features/organizer/stores/organizer.js`
  - **Focus**: Main organizer state
  - **Review**: State property names, getters, actions

- [ ] `src/features/organizer/stores/organizerCore.js`
  - **Focus**: Core organizer logic
  - **Review**: Evidence and metadata handling
  - **Key areas**: Display name resolution, metadata variant selection

- [ ] `src/features/organizer/stores/virtualFolderStore.js`
  - **Focus**: Virtual folder state
  - **Review**: Folder path references

- [ ] `src/stores/documentView.js`
  - **Focus**: Document viewing state
  - **Review**: State properties for document/file display

### Workers

- [ ] `src/features/upload/workers/fileHashWorker.js`
  - **Focus**: Hash calculation worker
  - **Review**: Message passing terminology, comments
  - **Key areas**: What's being hashed (source file content)

### Test Files

- [ ] `src/test-utils/mockFileAPI.js`
  - **Focus**: File API mocking
  - **Review**: Mock object properties and methods

- [ ] `src/test-utils/virtualFolderTestUtils.js`
  - **Focus**: Test utilities for folder handling
  - **Review**: Test data structure and assertions

- [ ] `src/composables/useMockFileData.js`
  - **Focus**: Mock file data generation
  - **Review**: Mock data field names and values

### Demo Files

- [ ] `src/dev-demos/views/LazyLoadingDemo.vue`
  - **Focus**: Demo file display
  - **Review**: Demo labels and descriptions

- [ ] `src/dev-demos/utils/mockDataFactories.js`
  - **Focus**: Mock data factories
  - **Review**: Factory function parameter names

### Deprecated Files (Low Priority)

- [ ] `src/deprecated/uploadService.js`
  - **Focus**: Legacy upload service (reference only)
  - **Note**: May not need updating if truly deprecated

- [ ] `src/deprecated/useUploadManager.js`
  - **Focus**: Legacy upload manager (reference only)
  - **Note**: May not need updating if truly deprecated

## Implementation Strategy

### Recommended Order

1. **Start with CLAUDE.md** (already completed)
2. **Phase 1, Priority 1**: Core file system docs (highest impact)
3. **Phase 2, Services**: Update backend field names first
4. **Phase 2, Stores**: Update state management
5. **Phase 2, Composables**: Update business logic
6. **Phase 2, Components**: Update UI and user-facing text
7. **Phase 1, Remaining**: Complete other documentation
8. **Testing**: Verify all changes work together

### Verification Steps

After each file update:

1. **Code files**: Run linter and ensure no broken references
2. **Components**: Check for UI text consistency
3. **Documentation**: Verify cross-references still work
4. **Test files**: Update corresponding test assertions

### Key Terminology Reminders

**When referring to dates:**
- ✅ `documentDate` - Date on the business transaction (receipt date, invoice date)
- ✅ `sourceModifiedDate` or `sourceCreatedDate` - File system timestamp
- ✅ `fileUploadDate` or `uploadTimestamp` - When uploaded to Firebase
- ❌ `fileDate` - Too ambiguous!
- ❌ `date` - Way too ambiguous!

**When referring to objects:**
- ✅ `sourceFile` - File object from user's device (File API)
- ✅ `storageFile` - Reference to Firebase Storage file
- ✅ `documentMetadata` - Metadata about the real-world document
- ✅ `sourceMetadata` - Metadata about the source file (Firestore subcollection)
- ❌ `file` alone - Specify which tier!

**Database field names (existing schema):**
- `sourceFileName` - Name of source file (in sourceMetadata subcollection)
- `lastModified` - Source file's modified timestamp
- `sourceFolderPath` - Path from source file system
- `sourceFileType` - MIME type from source file

## Notes

- This is a **non-breaking change** - primarily affects naming clarity, not functionality
- Database schema field names are already mostly aligned
- Main focus is code comments, variable names, and UI text
- Some files may already be compliant - mark as reviewed and move on
- Priority is consistency and clarity, not perfection

## Tracking Progress

Use checkboxes above to track completion. Update this document as you work through each file.

**Estimated effort**: 2-4 days of focused work, depending on thoroughness
