# High-Level Architecture

**Reconciled up to**: 2025-11-19

## Key Files

### Authentication System
- `src/core/stores/auth/` - Auth state machine (authStore.js, authFirmSetup.js, authStateHandlers.js)
- `src/services/authService.js` - Firebase Auth operations
- `src/router/guards/auth.js` - Route protection
- `src/components/features/auth/LoginForm.vue` - Login interface

### Upload & Processing System
- `src/features/upload/FileUpload.vue` - Main upload interface
- `src/features/upload/components/` - Upload-related components (30+ components)
- `src/features/upload/composables/` - Reusable upload logic (40+ composables)
- `src/features/upload/workers/fileHashWorker.js` - Background BLAKE3 hash calculation
- `src/features/upload/utils/fileAnalysis.js` - 3-phase time estimation and file metrics

### Layout Components
- `src/components/layout/AppHeader.vue` - Main header
- `src/components/layout/AppSideBar.vue` - Main navigation sidebar

### Related Documentation
- `@docs/Features/Authentication/CLAUDE.md` - Authentication system details
- `@docs/Features/Upload/CLAUDE.md` - Upload system details
- `@docs/Features/Upload/Processing/file-lifecycle.md` - File lifecycle terminology

---

## Authentication System

The app uses a sophisticated Firebase Auth system with explicit state machine pattern to handle timing issues common in Firebase Auth integrations.

For detailed authentication documentation, see `@docs/Features/Authentication/CLAUDE.md`.

**Auth States**: `uninitialized` → `initializing` → `authenticated` | `unauthenticated` | `error`

**Key Components**:

- `src/core/stores/auth/` - Pinia store with state machine for auth (decomposed from auth.js)
  - `authStore.js` - Core Pinia store with state machine
  - `authFirmSetup.js` - Solo Firm architecture implementation
  - `authStateHandlers.js` - Auth lifecycle and state transitions
- `src/services/authService.js` - Firebase Auth operations
- `src/router/guards/auth.js` - Route protection
- `src/components/features/auth/LoginForm.vue` - Login interface

**Solo Firm Architecture**: Every user automatically gets a "solo firm" where `firmId === userId`, providing consistent data patterns and easy upgrade path to multi-user firms.

## File Upload & Processing System

Core feature for uploading and processing files with sophisticated time estimation and deduplication.

For detailed upload documentation and file lifecycle terminology, see:
- `@docs/Features/Upload/CLAUDE.md` - Upload system architecture
- `@docs/Features/Upload/Processing/file-lifecycle.md` - File lifecycle terminology

**Key Components**:

- `src/features/upload/FileUpload.vue` - Main upload interface
- `src/features/upload/components/` - Upload-related components
  - `FileUploadQueue.vue` - Queue management and progress display
  - `FolderOptionsDialog.vue` - Upload configuration with time estimates
  - `ProcessingProgressModal.vue` - Real-time progress tracking
  - `UploadDropzone.vue` - Drag/drop interface
  - `UploadTable.vue` - Virtual table with deduplication status
  - `StatusCell.vue`, `SelectCell.vue` - Table cells for status and selection
  - `UploadCompletionModal.vue` - Upload completion summary
  - 20+ additional specialized components
- `src/features/upload/composables/` - Reusable logic
  - `useFileQueue.js` - File queue management and processing coordination
  - `useQueueDeduplication.js` - Duplicate detection and hash processing
  - `useFolderOptions.js` - Folder analysis and path parsing optimization
  - `useWebWorker.js` & `useWorkerManager.js` - Worker management
  - `useUploadOrchestrator.js` - Upload workflow coordination
  - `useUploadProcessor.js` - File processing and upload logic
  - `useUploadState.js` - Upload state management
  - `useSequentialHashWorker.js` - Sequential hash calculation
  - 30+ additional specialized composables
- `src/features/upload/workers/fileHashWorker.js` - Background BLAKE3 hash calculation
- `src/features/upload/utils/fileAnalysis.js` - 3-phase time estimation and file metrics

**Processing Pipeline**:

1. **File Selection** → Folder analysis and preprocessing
2. **Estimation** → 3-phase time prediction with directory complexity
3. **Queueing** → Size-based filtering and duplicate detection
4. **Processing** → Background hash calculation with progress tracking
5. **Upload** → Firebase storage with deduplication

## Component Architecture

- **Layout**: `src/components/layout/AppSideBar.vue`, `src/components/layout/AppHeader.vue` provide main navigation
- **Base Components**: Reusable UI components in `src/components/base/`
- **Feature Components**: Domain-specific components in `src/components/features/`
- **Views**: Page-level components in `src/views/`

## Data Flow Patterns

1. **Authentication**: Firebase Auth → Auth Store → Route Guards → Components
2. **File Processing**: File Selection → Folder Analysis → Time Estimation → Queue → Deduplication → Worker Processing → Upload
3. **State Management**: Pinia stores manage global state, composables handle component-level logic

## File Processing Flow Details

1. **File/Folder Selection**: User drops files or selects folder
2. **Folder Options Analysis** (if folder):
   - Single-pass path parsing for all files
   - Directory statistics calculation (depth, count)
   - Size-based duplicate candidate identification
   - 3-phase time estimation with directory complexity
3. **Queue Management**: Files added to processing queue with metadata
4. **Deduplication Processing**:
   - Size-based pre-filtering (unique sizes skip hashing)
   - Web Worker hash calculation for duplicate candidates
   - Progress tracking with phase-based updates
5. **Upload Coordination**: Processed files uploaded to Firebase Storage
