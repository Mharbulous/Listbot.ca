# High-Level Architecture

**Reconciled up to**: 2025-11-19

This document provides a high-level overview of ListBot's architecture, focusing on the authentication system, file upload & processing system, and overall component organization.

## Key Files

**Authentication System:**
- `src/core/stores/auth/` - Auth store decomposed into 4 focused modules
  - `authStore.js` - Core Pinia store, state, getters, actions
  - `authFirmSetup.js` - Firm management (Solo Firm architecture)
  - `authStateHandlers.js` - Auth lifecycle (state machine handlers)
  - `index.js` - Entry point for backward compatibility
- `src/services/authService.js` - Firebase Auth operations
- `src/router/guards/auth.js` - Route protection
- `src/components/features/auth/LoginForm.vue` - Login interface

**File Upload System:**
- `src/features/upload/FileUpload.vue` - Main upload view
- `src/features/upload/components/` - Upload UI components (27 components)
- `src/features/upload/composables/` - Upload logic composables (53+ composables)
- `src/features/upload/workers/fileHashWorker.js` - Background BLAKE3 hash calculation
- `src/features/upload/utils/fileAnalysis.js` - 3-phase time estimation and file metrics

**Layout:**
- `src/components/layout/AppSideBar.vue` - Main navigation sidebar
- `src/components/layout/AppHeader.vue` - Application header

---

## Authentication System

The app uses a sophisticated Firebase Auth system with explicit state machine pattern to handle timing issues common in Firebase Auth integrations:

**Auth States**: `uninitialized` → `initializing` → `authenticated` | `unauthenticated` | `error`

**Key Components**:

- `src/core/stores/auth/` - Pinia store with state machine, decomposed into:
  - **authStore.js** - Core state, getters, actions
  - **authFirmSetup.js** - Solo Firm architecture (firmId === userId)
  - **authStateHandlers.js** - State machine transitions
  - **index.js** - Backward-compatible exports
- `src/services/authService.js` - Firebase Auth operations
- `src/router/guards/auth.js` - Route protection
- `src/components/features/auth/LoginForm.vue` - Login interface

**Solo Firm Architecture**: Every user automatically gets a "solo firm" where `firmId === userId`, providing consistent data patterns and easy upgrade path to multi-user firms.

**State Machine Pattern**: Always check `authStore.isInitialized` before `authStore.isAuthenticated` to prevent Firebase race conditions.

---

## File Upload & Processing System

Core feature for uploading and processing files with sophisticated time estimation and hash-based deduplication.

### File Processing Terminology

The application uses precise terminology for file lifecycle stages and deduplication. See:
- **File lifecycle**: `@docs/Features/Upload/Processing/file-lifecycle.md` for canonical definitions (Original → Source → Upload → Batesed → etc.)
- **Deduplication terms** (per `@CLAUDE.md` Section 4):
  - **duplicate** - Identical hash + metadata, no informational value (not uploaded, metadata not copied)
  - **redundant** - Hash-verified duplicates awaiting removal (two-phase cleanup)
  - **copy** - Same hash but meaningful metadata differences (not uploaded to storage, but metadata recorded)
  - **best/primary** - File with most meaningful metadata (uploaded to storage)

### Key Components

**Feature-Based Organization** (`src/features/upload/`):

- `FileUpload.vue` - Main upload view with drag/drop interface
- `components/` - Upload UI components:
  - `FileUploadQueue.vue` - Queue management and progress display
  - `FolderOptionsDialog.vue` - Upload configuration with time estimates
  - `ProcessingProgressModal.vue` - Real-time progress tracking
  - `UploadDropzone.vue` - Drag/drop interface
  - `UploadTable.vue` - Virtual scrolling upload table
  - `UploadTableVirtualizer.vue` - Virtualized table rendering
  - `StatusCell.vue`, `SelectCell.vue`, `FileNameCell.vue` - Table cells
  - `UploadPreviewModal.vue`, `UploadCompletionModal.vue` - Modals
  - ...and 17 more specialized components
- `composables/` - Reusable upload logic (53+ composables):
  - Core queue management: `useFileQueue.js`, `useQueueState.js`, `useQueueCore.js`
  - Deduplication: `useQueueDeduplication.js`, `useUploadTable-deduplication.js`, `useSequentialVerification.js`
  - Folder analysis: `useFolderOptions.js`, `useFolderAnalysis.js`, `useFolderProgress.js`
  - Worker management: `useWebWorker.js`, `useWorkerManager.js`, `useSequentialHashWorker.js`, `useQueueWorkers.js`
  - Upload orchestration: `useUploadOrchestrator.js`, `useUploadProcessor.js`, `useUploadState.js`
  - Utilities: `useFileFormatters.js`, `useFileTypeIcons.js`, `useFileMetadata.js`
  - ...and 30+ more specialized composables
- `workers/fileHashWorker.js` - Background BLAKE3 hash calculation
- `utils/` - Upload utilities:
  - `fileAnalysis.js` - 3-phase time estimation with directory complexity
  - `folderPathUtils.js` - Path parsing and analysis
  - `hardwareCalibration.js` - Performance calibration
  - `fileTypeChecker.js`, `fileTypeIcons.js` - File type utilities

### Processing Pipeline

The upload system uses a multi-stage pipeline with two-phase deduplication:

1. **File Selection** → User drops files or selects folder
2. **Folder Analysis** (if folder):
   - Single-pass path parsing for all files
   - Directory statistics calculation (depth, count)
   - 3-phase time estimation with directory complexity
3. **Queue Management** → Files added to upload queue with metadata
4. **Two-Stage Deduplication** (Phase 3b architecture):
   - **Stage 1 Pre-filter**: Remove redundant files from previous batches
   - **Stage 2 Hash Processing**:
     - Size-based pre-filtering (unique sizes skip hashing)
     - Sequential hash verification for duplicate candidates
     - Copy metadata extraction and recording
     - Best/primary file selection
5. **Upload Process** → Transfer queued files to Firebase Storage
   - Primary files uploaded to storage
   - Copy metadata recorded in Firestore (no storage upload)
   - Duplicates skipped entirely

**Key architectural patterns**:
- **Hash-based deduplication**: BLAKE3 hash used as document ID for automatic database-level deduplication
- **Web Worker processing**: CPU-intensive hashing runs in background worker to avoid blocking UI
- **Two-phase cleanup**: Files marked "redundant" after hash verification, removed in next batch's Stage 1
- **Copy metadata handling**: Files with same hash but meaningful metadata differences have metadata recorded

---

## Component Architecture

**Feature-Based Structure**: Components organized by feature domain, not by type.

- **Layout**: `src/components/layout/`
  - `AppSideBar.vue` - Main navigation sidebar
  - `AppHeader.vue` - Application header
- **Base Components**: Reusable UI components in `src/components/base/`
- **Feature Components**: Domain-specific components grouped by feature:
  - **Auth**: `src/components/features/auth/`
  - **Upload**: `src/features/upload/components/` (feature-complete module)
  - **Organizer**: Document table, viewer, categories
  - **Matters**: Matter/case management
- **Views**: Page-level components (many migrated to feature modules)

---

## Data Flow Patterns

1. **Authentication**: Firebase Auth → Auth Store (state machine) → Route Guards → Components
2. **File Processing**:
   - **Queue workflow**: File Selection → Folder Analysis → Time Estimation → Upload Queue (local staging)
   - **Upload process**: Queue → Two-Stage Deduplication → Hash Processing → Upload to Storage
   - **Lifecycle stages**: Source (local) → Upload (Storage) → Batesed → Pages → Redacted → Production
3. **State Management**:
   - **Global state**: Pinia stores (auth, firm, team, document, etc.)
   - **Component logic**: Feature-specific composables (especially upload feature)
   - **Worker communication**: Web Workers for CPU-intensive tasks (hashing)

---

## Upload Workflow Terminology

The application distinguishes between **workflow actions** (queue, upload process) and **lifecycle stages** (Upload files in Storage). See `@docs/Features/Upload/Processing/file-lifecycle.md` for complete definitions.

**Workflow Actions** (process of moving files):
- **Queue** (verb) / **upload queue** (noun) - Staging Source files locally before upload
- **Upload process** - The operation transferring queued files to Firebase Storage
- **Uploading** - Actively performing the upload operation

**Lifecycle Stage** (files at rest in Storage):
- **Upload file** / **Upload stage** - Files stored in Firebase Storage `../uploads` subfolder

**Key distinction**: Use compound terms for workflow ("upload queue", "upload process") to avoid confusion with the Upload lifecycle stage.

---

## Architecture Notes

- **Solo Firm**: All data scoped by `firmId`. For solo users, `firmId === userId` (fundamental data model rule).
- **Auth State Machine**: Explicit state tracking prevents Firebase timing race conditions. Always check `isInitialized` before `isAuthenticated`.
- **Feature Modules**: Upload system is self-contained in `src/features/upload/` with all components, composables, workers, and utils co-located.
- **Web Worker Pattern**: BLAKE3 hashing is CPU-intensive and MUST run in web worker to avoid blocking UI.
- **Hash-Based Deduplication**: BLAKE3 hash serves as Firestore document ID, providing automatic database-level deduplication.
- **Two-Stage Deduplication**: Redundant files marked in current batch, removed in next batch (prevents immediate re-upload).
