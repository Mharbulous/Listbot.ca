# High-Level Architecture

## Authentication System

The app uses a sophisticated Firebase Auth system with explicit state machine pattern to handle timing issues common in Firebase Auth integrations:

**Auth States**: `uninitialized` → `initializing` → `authenticated` | `unauthenticated` | `error`

**Key Components**:

- `stores/auth.js` - Pinia store with state machine for auth
- `services/authService.js` - Firebase Auth operations
- `router/guards/auth.js` - Route protection
- `components/features/auth/LoginForm.vue` - Login interface

**Solo Firm Architecture**: Every user automatically gets a "solo firm" where `firmId === userId`, providing consistent data patterns and easy upgrade path to multi-user firms.

## File Upload & Processing System

Core feature for uploading and processing files with sophisticated time estimation and deduplication:

**Key Components**:

- `views/FileUpload.vue` - Main upload interface
- `components/features/upload/` - Upload-related components
  - `FileUploadQueue.vue` - Queue management and progress display
  - `FolderOptionsDialog.vue` - Upload configuration with time estimates
  - `ProcessingProgressModal.vue` - Real-time progress tracking
  - `UploadDropzone.vue` - Drag/drop interface
- `composables/` - Reusable logic
  - `useFileQueue.js` - File queue management and processing coordination
  - `useQueueDeduplication.js` - Duplicate detection and hash processing
  - `useFolderOptions.js` - Folder analysis and path parsing optimization
  - `useWebWorker.js` & `useWorkerManager.js` - Worker management
- `workers/fileHashWorker.js` - Background BLAKE3 hash calculation
- `utils/fileAnalysis.js` - 3-phase time estimation and file metrics

**Processing Pipeline**:

1. **File Selection** → Folder analysis and preprocessing
2. **Estimation** → 3-phase time prediction with directory complexity
3. **Queueing** → Size-based filtering and duplicate detection
4. **Processing** → Background hash calculation with progress tracking
5. **Upload** → Firebase storage with deduplication

## Component Architecture

- **Layout**: `AppSidebar.vue`, `AppHeader.vue` provide main navigation
- **Base Components**: Reusable UI components in `components/base/`
- **Feature Components**: Domain-specific components in `components/features/`
- **Views**: Page-level components in `views/`

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
