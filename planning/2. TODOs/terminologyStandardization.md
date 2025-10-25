# Terminology Standardization Plan

**Created**: 2025-10-25
**Status**: In Progress - Phase 1 Documentation Updates
**Progress**: Priority 1 ✅ (5/5 files) | Priority 2 ✅ (6/6 files) | Priority 3 ✅ (3/3 files) | Priority 4 ⏳ (0/4 files)
**Last Updated**: 2025-10-25
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

- [x] `docs/uploading.md` ✅ **COMPLETED**
  - **Focus**: Update references to "original files" vs "storage files"
  - **Key sections**: Upload Process Flow, Metadata Management, API Reference
  - **Changes made**: Updated metadata hash field from "originalName" to "sourceFileName", added clarifying comments to API examples

- [x] `docs/architecture/FileMetadata.md` ✅ **COMPLETED**
  - **Focus**: Critical - already uses "Source File" terminology, ensure consistency
  - **Key sections**: UI Metadata Presentation, sourceMetadata Subcollection
  - **Changes made**: Changed "Original Files vs Storage Files" to "Source Files vs Storage Files", replaced all instances of "original file" with "source file" throughout document (~8 changes)

- [x] `docs/architecture/firebase-storage.md` ✅ **COMPLETED**
  - **Focus**: Storage paths and deduplication examples
  - **Key sections**: File Storage Paths, Deduplication Examples
  - **Changes made**: Updated "Original file extensions" to "source file extensions" in two locations

- [x] `docs/Document-Processing-Workflow.md` ✅ **COMPLETED**
  - **Focus**: Distinguish between document (paper) and source (digital scan)
  - **Key sections**: Workflow diagrams and descriptions
  - **Changes made**: Added comprehensive "Three-Tier File Lifecycle" section explaining Document → Source → File progression

- [x] `docs/data-structures.md` ✅ **COMPLETED**
  - **Focus**: Field definitions and data structure schemas
  - **Key sections**: All field definitions related to files/metadata
  - **Changes made**: Verified cross-references align with updated terminology, no direct changes needed (hub document)

### Priority 2: Architecture Documentation

- [x] `docs/architecture/Evidence.md` ✅ **COMPLETED**
  - **Focus**: Evidence collection field definitions
  - **Changes made**: Updated 7 instances of "original" terminology to "source" terminology (section headings, field comments, and descriptions)

- [x] `docs/architecture/MetadataSpecs.md` ✅ **COMPLETED**
  - **Focus**: Embedded metadata specifications (forensic metadata like EXIF, XMP)
  - **Changes made**: No changes needed - document describes forensic metadata standards, not our application terminology

- [x] `docs/architecture/Settings.md` ✅ **COMPLETED**
  - **Focus**: User preferences system
  - **Changes made**: No changes needed - no file-related terminology

- [x] `docs/architecture/SoloFirmMatters.md` ✅ **COMPLETED**
  - **Focus**: Firm and matter architecture
  - **Changes made**: No changes needed - no file-related terminology

- [x] `docs/architecture/CategoryTags.md` ✅ **COMPLETED**
  - **Focus**: Tagging system
  - **Changes made**: No changes needed - no file-related terminology

- [x] `docs/architecture/security-rules.md` ✅ **COMPLETED**
  - **Focus**: Access control rules
  - **Changes made**: No changes needed - no file-related terminology

### Priority 3: Process Documentation

- [x] `docs/firebase-storage-plan.md` ✅ **COMPLETED**
  - **Focus**: Storage architecture and planning
  - **Changes made**: Updated 6 instances of "original" terminology to "source" terminology (section heading, comments, descriptions)

- [x] `docs/AsyncProcessesTable.md` ✅ **COMPLETED**
  - **Focus**: Async processes related to file handling
  - **Changes made**: No changes needed - no file-related terminology

- [x] `docs/authentication.md` ✅ **COMPLETED**
  - **Focus**: User context for file uploads
  - **Changes made**: No changes needed - no file-related terminology

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

**PRINCIPLE**: Complete all documentation FIRST (non-breaking changes), then update code in REVERSE DEPENDENCY ORDER (leaf nodes → root nodes) to minimize breaking changes.

#### Phase 1: Complete ALL Documentation (Non-Breaking Changes)

Documentation updates are pure text changes with zero breaking changes. Completing all docs first creates a complete reference for code updates.

1. **CLAUDE.md** ✅ (already completed)
2. **Phase 1, Priority 1** ✅ (already completed)
   - Core file system docs (uploading.md, FileMetadata.md, firebase-storage.md, Document-Processing-Workflow.md, data-structures.md)
3. **Phase 1, Priority 2**: Architecture Documentation
   - Evidence.md, MetadataSpecs.md, Settings.md, SoloFirmMatters.md, CategoryTags.md, security-rules.md
4. **Phase 1, Priority 3**: Process Documentation
   - firebase-storage-plan.md, AsyncProcessesTable.md, authentication.md
5. **Phase 1, Priority 4**: Development Documentation
   - design-guidelines.md, vitest-test-suites.md, TanStackAndVue3.md, FAQ.md
6. **Phase 1, Priority 5**: Agent Instructions
   - file-relocator.md

#### Phase 2: Code Updates (Reverse Dependency Order)

Update files in reverse dependency order - files with NO dependencies first, files that DEPEND on others last. This ensures dependencies are already updated before dependents.

**Layer 1: Workers** (Isolated, No Dependencies)
- workers/fileHashWorker.js

**Layer 2: Test Utilities** (Low-level, Used by Tests)
- test-utils/mockFileAPI.js, virtualFolderTestUtils.js
- composables/useMockFileData.js

**Layer 3: Services** (Core Business Logic)
- services/fileService.js
- features/organizer/services/ (evidenceService, evidenceQueryService, aiProcessingService)

**Layer 4: Upload Composables** (Depend on Services)
- features/upload/composables/ (useFileMetadata, useQueueDeduplication, useFolderOptions, etc.)

**Layer 5: Organizer Composables** (Depend on Services)
- features/organizer/composables/ (useFilePreview, useFileViewer, useEvidenceDeduplication)

**Layer 6: Stores** (Depend on Services/Composables)
- features/organizer/stores/ (organizerCore, organizer, virtualFolderStore)
- stores/documentView.js

**Layer 7: Utility Files** (Used by Components)
- features/organizer/utils/fileUtils.js
- features/upload/utils/fileAnalysis.js

**Layer 8: Configuration Files** (Used by Components)
- features/organizer/config/fileListColumns.js (CRITICAL - column labels)

**Layer 9: Upload Components** (Depend on Composables/Stores)
- features/upload/ (FileUpload.vue and all upload components)

**Layer 10: Organizer Components** (Depend on Everything)
- features/organizer/views/ViewDocument.vue (CRITICAL - metadata display)
- features/organizer/components/ (all organizer components)

**Layer 11: Demo Files** (Isolated, Low Priority)
- dev-demos/

**Layer 12: Deprecated Files** (Reference Only, Optional)
- deprecated/

#### Phase 3: Verification and Testing

After completing all updates:
1. **Linting**: Run beautifier agent on all modified code files
2. **Type Checking**: Verify no broken references
3. **Testing**: Run test suite to ensure no regressions
4. **Manual Testing**: Verify UI text consistency across the application

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

### Progress Summary

**Phase 1: Documentation Files** (In Progress)
- ✅ Priority 1: Core File System Documentation (5/5 files - 100% complete)
  - Updated 4 files with terminology changes (FileMetadata.md, firebase-storage.md, uploading.md, Document-Processing-Workflow.md)
  - Verified 1 file as compliant (data-structures.md)
  - All core file system documentation now uses consistent Source/File terminology
- ✅ Priority 2: Architecture Documentation (6/6 files - 100% complete)
  - Updated 1 file with terminology changes (Evidence.md - 7 changes)
  - Verified 5 files require no changes (already compliant or not applicable)
- ✅ Priority 3: Process Documentation (3/3 files - 100% complete)
  - Updated 1 file with terminology changes (firebase-storage-plan.md - 6 changes)
  - Verified 2 files require no changes (AsyncProcessesTable.md, authentication.md)
- ⏳ Priority 4: Development Documentation (0/4 files - 0% complete)
- ⏳ Priority 5: Agent Instructions (0/1 files - 0% complete)

**Phase 2: Code Files** (Not Started)

**Phase 3: Verification and Testing** (Not Started)

**Overall Progress**: 14/95 files reviewed (14.7%)
- Documentation changes: 6 files updated with terminology changes
  - Priority 1: 4 files (FileMetadata.md, firebase-storage.md, uploading.md, Document-Processing-Workflow.md)
  - Priority 2: 1 file (Evidence.md)
  - Priority 3: 1 file (firebase-storage-plan.md)
- Files verified as compliant: 8 files
  - Priority 1: 1 file (data-structures.md)
  - Priority 2: 5 files (MetadataSpecs.md, Settings.md, SoloFirmMatters.md, CategoryTags.md, security-rules.md)
  - Priority 3: 2 files (AsyncProcessesTable.md, authentication.md)
- Remaining documentation: 5 files (Phase 1 Priority 4-5)
- Code files: 84 files (Phase 2)

**Estimated effort**: 2-4 days of focused work, depending on thoroughness

## Change Log

### Session 1 - 2025-10-25
**Completed**: Phase 1, Priority 1 (Core File System Documentation)
- Updated `docs/architecture/FileMetadata.md` - Changed "Original Files vs Storage Files" section heading, updated ~8 instances
- Updated `docs/architecture/firebase-storage.md` - Changed "Original file extensions" to "source file extensions" (2 locations)
- Updated `docs/uploading.md` - Updated metadata hash field and API examples (3 changes)
- Updated `docs/Document-Processing-Workflow.md` - Added comprehensive three-tier file lifecycle section
- Verified `docs/data-structures.md` - No changes needed (hub document with cross-references)

### Session 2 - 2025-10-25
**Completed**: Phase 1, Priority 2 (Architecture Documentation)
- Updated `docs/architecture/Evidence.md` - Updated 7 instances (section headings, field comments, descriptions)
  - Changed "Original Metadata Subcollection" → "Source Metadata Subcollection"
  - Updated field comments to use "source file" terminology
  - Updated description text to reference "source file contexts"
- Verified 5 files require no changes:
  - `MetadataSpecs.md` - Forensic metadata standards (not our terminology)
  - `Settings.md` - User preferences (no file terminology)
  - `SoloFirmMatters.md` - Firm architecture (no file terminology)
  - `CategoryTags.md` - Tagging system (no file terminology)
  - `security-rules.md` - Access control (no file terminology)

### Session 3 - 2025-10-25
**Completed**: Phase 1, Priority 3 (Process Documentation)
- Updated `docs/firebase-storage-plan.md` - Updated 6 instances of "original" terminology to "source" terminology
  - Changed "Original Case Preservation Exception" → "Source File Name Case Preservation"
  - Updated section description to reference "source file's name as it existed on user's device"
  - Updated example text to clarify "source file was named"
  - Updated comment: "Preserves source file name case"
  - Updated rationale bullet points to reference "source filenames" and "source files"
  - Changed "original desktop file metadata" → "source file metadata"
  - Changed "Original metadata records" → "Source metadata records"
- Verified 2 files require no changes:
  - `AsyncProcessesTable.md` - Async processes tracking (no file terminology)
  - `authentication.md` - Authentication system (no file terminology)
