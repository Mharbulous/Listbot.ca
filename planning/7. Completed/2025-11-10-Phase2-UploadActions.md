# Phase 2: Batch Upload Implementation

**Phase:** 2 of 7
**Status:** Not Started
**Priority:** Critical
**Estimated Duration:** 4-5 days
**Dependencies:** Phase 1.0 (Foundation), Phase 1.5 (Virtualization)

---

## Overview

Implement the core batch upload functionality that actually uploads files to Firebase Storage and Firestore. This phase transforms the upload queue from a display-only table into a fully functional upload system by **integrating existing upload infrastructure** from the old `/upload` route.

**Goal:** Complete upload pipeline from queue to Firebase with progress tracking
**Deliverable:** Working "Upload X files" button that processes the entire queue
**User Impact:** Users can finally upload their queued files to the cloud

---

## CRITICAL CONTEXT: What's Already Implemented

### Phase 1.0/1.5 Already Provides:
✅ **Skip/Undo System** - Checkbox-based file skipping (no separate cancel button needed)
✅ **File Selection** - Three upload methods (files, folder, folder+subfolders, drag-and-drop)
✅ **Queue Management** - Virtual scrolling table with all files displayed
✅ **Status Display** - 9 status types with colored dots (ready, uploading, completed, skip, skipped, error, n/a, uploadMetadataOnly, unknown)
✅ **Footer Stats** - Real-time counts (total, skipped, duplicates, failed, uploaded)
✅ **Select All/None** - Checkbox in header for bulk selection
✅ **Empty State** - Integrated drag-and-drop zone when queue is empty
✅ **File Preview** - Eyeball icon (👁️) on hover to open file locally

### Existing Upload Infrastructure (from `/upload` route):
✅ **File Hashing Worker** - `src/features/upload/workers/fileHashWorker.js` (335 lines)
  - Uses `hash-wasm` library with BLAKE3 (128-bit = 32 hex chars)
  - Size-based pre-filtering (only hashes files with matching sizes)
  - "One-and-the-same" detection (same file selected twice)
  - "Duplicate" detection (different files, same content)
  - Best file selection algorithm (earliest mod date → longest path → shortest name)
  - Progress updates, health checks, error handling
  - Marks shortcut files (.lnk) with `skipReason: 'shortcut'`

✅ **Worker Communication** - `useWebWorker.js` - Generic worker management
  - Message passing, error recovery, health monitoring
  - Registry integration, timeout handling

✅ **Worker Manager** - `useWorkerManager.js` - High-level worker lifecycle
  - Auto-restart, retry logic, performance monitoring

✅ **File Processing** - `useFileProcessor.js` - Core file operations
  - `calculateFileHash()` - BLAKE3 hashing with network error detection
  - `checkFileExists()` - Checks if fileHash exists in Firestore
  - `uploadSingleFile()` - Uploads to Firebase Storage with retry logic
  - `generateStoragePath()` - Creates storage path

✅ **File Metadata** - `useFileMetadata.js` - Firestore metadata management
  - `createMetadataRecord()` - Creates Evidence + sourceMetadata documents
  - `generateMetadataHash()` - xxHash 64-bit of `fileName|modified|hash`
  - `metadataRecordExists()` - Checks embedded sourceMetadataVariants map

✅ **Upload Orchestration** - `useUploadOrchestration.js` - Upload control
  - Pause/resume state management
  - Session ID tracking
  - Abort controller management

✅ **Upload Handlers** - `useFileUploadHandlers.js` - Upload workflow
  - `continueUpload()` - Main upload loop
  - `processDuplicateFile()` - Skips upload, records metadata only
  - `processExistingFile()` - Skips if already in Firestore
  - `processNewFileUpload()` - Uploads new file
  - Network error handling with retry logic

### What's Missing (This Phase):
❌ **Connect new queue to existing upload infrastructure**
❌ **Adapt existing composables for new queue structure**
❌ **Wire up "Upload X files" button in Testing.vue**
❌ **Update file statuses in real-time during upload**
❌ **Handle upload progress tracking in virtualized table**

---

## CRITICAL: Actual Firestore Structure

**⚠️ The planning document's Firestore structure was outdated. Use this ACTUAL implementation:**

### Evidence Document (Parent)
**Path:** `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}`
**Document ID:** BLAKE3 hash (32 hex characters)

```javascript
{
  // Display configuration
  sourceID: metadataHash, // xxHash 64-bit (16 hex chars)

  // Source file properties (for quick access)
  fileSize: 2458624, // bytes
  fileType: "application/pdf", // MIME type

  // Processing status (for future Document Processing Workflow)
  isProcessed: false,
  hasAllPages: null, // null = unknown, true/false after processing
  processingStage: "uploaded", // uploaded|splitting|merging|complete

  // Tag counters (for subcollection)
  tagCount: 0,
  autoApprovedCount: 0,
  reviewRequiredCount: 0,

  // Embedded tags (denormalized for performance)
  tags: {},

  // Embedded source metadata (denormalized for performance)
  sourceMetadata: {},
  sourceMetadataVariants: {
    // Map of metadataHash -> metadata for fast duplicate checking
    "a1b2c3d4e5f6g7h8": {
      sourceFileName: "invoice.pdf",
      sourceLastModified: Timestamp(1705334400000),
      sourceFolderPath: "/2024/Tax",
      uploadDate: Timestamp(1705420800000)
    }
  },
  sourceMetadataCount: 1, // Incremented with each variant

  // Primary source metadata (embedded for fast table rendering without subcollection queries)
  sourceFileName: "invoice.pdf",
  sourceLastModified: Timestamp(1705334400000),
  sourceFolderPath: "/2024/Tax",

  // Timestamps
  uploadDate: Timestamp(1705420800000),
}
```

### sourceMetadata Subcollection Document
**Path:** `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}`
**Document ID:** xxHash 64-bit of `sourceFileName|lastModified|fileHash` (16 hex chars)

```javascript
{
  // Core file metadata (only what varies between identical files)
  sourceFileName: "invoice.pdf",
  sourceLastModified: Timestamp(1705334400000),
  fileHash: "a1b2c3d4...", // BLAKE3 hash (32 hex chars)

  // File path information
  sourceFolderPath: "/2024/Tax", // Smart pattern recognition, comma-separated if multiple
}
```

### Firebase Storage Path
**Format:** `firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{extension}`

**Example:**
```
firms/firm123/matters/matter456/uploads/a1b2c3d4e5f6....pdf
```

**Custom Metadata:**
```javascript
{
  firmId: "firm123",
  userId: "user789",
  originalName: "invoice.pdf",
  hash: "a1b2c3d4e5f6..."
}
```

### Key Differences from Planning Doc:
1. **Evidence document must be created FIRST** before sourceMetadata subcollection (Firestore requirement)
2. **sourceMetadataVariants map** embedded in Evidence for fast duplicate checking (no subcollection query)
3. **Primary source metadata** embedded in Evidence for fast table rendering
4. **Storage path** uses `matters/{matterId}/uploads/` (not just `{documentId}/` as in plan)
5. **Metadata hash** uses xxHash 64-bit (16 hex chars), not BLAKE3
6. **Hash library** is `hash-wasm`, not `@noble/hashes`

---

## Current UI Architecture (NO CHANGES NEEDED)

**Column Structure (Already Implemented):**
```
┌────────┬───────────────────────────────┬──────────┬──────────────┬─────────┐
│ Select │ File Name                     │ Size     │ Folder Path  │ Status  │
│ (60px) │ (flex: 1, max 500px)          │ (100px)  │ (flex: 1)    │ (100px) │
├────────┼───────────────────────────────┼──────────┼──────────────┼─────────┤
│  [✓]   │ invoice.pdf 👁️                │ 2.4 MB   │ /2024/Tax    │ 🔵 Ready│
│  [✓]   │ report.docx 👁️                │ 890 KB   │ /Reports     │ 🔵 Ready│
│  [ ]   │ form.pdf 👁️                   │ 1.2 MB   │ /Forms       │ ⚪ Skip  │
├────────┴───────────────────────────────┴──────────┴──────────────┴─────────┤
│ Footer:                                                                    │
│ Total: 715 | Skipped: 1 | Duplicates: 5 | Failed: 0 | Uploaded: 0/710    │
│ [Clear 1 skipped file]  [Upload 710 files (380.3 MB)]                     │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- **Checkbox (Select column):** Check = include in upload, Uncheck = skip file
- **Eyeball icon (👁️):** Appears on hover, opens file for local preview
- **Status dot:** Colored circle with text label (see StatusCell.vue)
- **Footer buttons:** "Clear X skipped files" (white) + "Upload X files (size)" (green)

**No Actions Column** - The original plan had an Actions column with ⬆️ Upload Now and ❌ Cancel buttons, but this was not implemented. Skip/undo is handled via checkboxes instead.

---

## Features

### 2.1 Integrate Existing File Hashing Worker
### 2.2 Adapt File Upload Composables for New Queue
### 2.3 Create Upload Pipeline in Testing.vue
### 2.4 Upload Progress Tracking & Status Updates
### 2.5 Error Handling & Retry Logic (Already Exists)
### 2.6 Pause/Resume Upload (Already Exists)
### 2.7 Upload Complete Summary

---

## 2.1 Integrate Existing File Hashing Worker

### Why Integration, Not Creation?

The `fileHashWorker.js` already exists with sophisticated deduplication logic:
- **Size-based pre-filtering:** Only hashes files with matching sizes (performance optimization)
- **One-and-the-same detection:** Filters out the same file selected multiple times
- **Duplicate detection:** Identifies different files with identical content
- **Best file selection:** Chooses which duplicate to upload based on priority rules

**Location:** `src/features/upload/workers/fileHashWorker.js` (335 lines)

### Worker Message Types

```javascript
const MESSAGE_TYPES = {
  PROCESS_FILES: 'PROCESS_FILES',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  PROCESSING_COMPLETE: 'PROCESSING_COMPLETE',
  ERROR: 'ERROR',
  HEALTH_CHECK: 'HEALTH_CHECK',
  HEALTH_CHECK_RESPONSE: 'HEALTH_CHECK_RESPONSE',
};
```

### Worker Input/Output

**Input Message:**
```javascript
self.postMessage({
  type: 'PROCESS_FILES',
  files: [
    {
      id: 'file_123',
      file: File, // Actual File object
      originalIndex: 0,
      customPath: '/2024/Tax/invoice.pdf' // Optional
    }
  ],
  batchId: 'batch_456',
  options: {}
});
```

**Output Message (Success):**
```javascript
{
  type: 'PROCESSING_COMPLETE',
  batchId: 'batch_456',
  result: {
    readyFiles: [
      {
        id: 'file_123',
        originalIndex: 0,
        path: '/2024/Tax/invoice.pdf',
        metadata: {
          sourceFileName: 'invoice.pdf',
          sourceFileSize: 2458624,
          sourceFileType: 'application/pdf',
          lastModified: 1705334400000
        },
        hash: 'a1b2c3d4...', // BLAKE3 32-char hash (only if file had size duplicate)
        status: 'ready',
        skipReason: 'shortcut' // Present if .lnk file
      }
    ],
    duplicateFiles: [
      {
        id: 'file_124',
        originalIndex: 1,
        path: '/2024/Tax/invoice-copy.pdf',
        metadata: { /* same as above */ },
        hash: 'a1b2c3d4...', // Same hash as readyFiles entry
        isDuplicate: true,
        status: 'uploadMetadataOnly'
      }
    ]
  }
}
```

### Using Existing useWebWorker.js

**Don't create new composable - use existing one:**

```javascript
// In Testing.vue or new useNewUploadQueue.js composable
import { useWebWorker } from '@/features/upload/composables/useWebWorker.js';

const hashWorker = useWebWorker('../features/upload/workers/fileHashWorker.js');

// Initialize worker
onMounted(() => {
  hashWorker.initializeWorker();
});

// Send files to worker
const processFiles = async (files) => {
  const filesData = files.map((file, index) => ({
    id: file.id,
    file: file.sourceFile,
    originalIndex: index,
    customPath: file.folderPath ? `${file.folderPath}/${file.name}` : file.name
  }));

  const response = await hashWorker.sendMessage({
    type: 'PROCESS_FILES',
    files: filesData,
    batchId: `batch_${Date.now()}`,
  }, {
    timeout: 300000 // 5 minutes for large batches
  });

  return response.result;
};

// Cleanup
onUnmounted(() => {
  hashWorker.terminateWorker();
});
```

### Integration Strategy

**Option 1: Hash on Upload (Recommended)**
- Keep Phase 1.0/1.5 queue as-is (no hashing in queue phase)
- When "Upload X files" clicked, send batch to hashWorker
- Worker returns `{ readyFiles, duplicateFiles }`
- Upload readyFiles, skip duplicateFiles (metadata only)

**Option 2: Hash During Queue (Complex)**
- Integrate hashWorker into queue addition phase
- Files get hashed before appearing in table
- More complex, may slow down queue display

**Recommendation:** Use Option 1 for Phase 2 - simpler, cleaner separation of concerns.

---

## 2.2 Adapt File Upload Composables for New Queue

### Existing Composables (From `/upload` Route)

**File Processor:** `useFileProcessor.js`
```javascript
const {
  calculateFileHash,     // BLAKE3 hashing
  checkFileExists,       // Check if fileHash exists in Firestore
  uploadSingleFile,      // Upload to Firebase Storage
  generateStoragePath,   // Create storage path
} = useFileProcessor({
  authStore,
  matterStore,
  queueDeduplication,
  timeWarning,
  updateUploadQueue,
  updateAllFilesToReady,
  analysisTimedOut,
  skippedFolders,
  allFilesAnalysis,
  mainFolderAnalysis,
});
```

**File Metadata:** `useFileMetadata.js`
```javascript
const {
  generateMetadataHash,    // xxHash of fileName|modified|hash
  createMetadataRecord,    // Create Evidence + sourceMetadata
  metadataRecordExists,    // Check embedded sourceMetadataVariants map
} = useFileMetadata();
```

**Upload Orchestration:** `useUploadOrchestration.js`
```javascript
const {
  isStartingUpload,
  isPaused,
  pauseRequested,
  currentUploadIndex,
  getCurrentSessionId,
  resetSessionId,
  getUploadAbortController,
  setUploadAbortController,
  handlePauseUpload,
  handleResumeUpload,
  handleStartUpload,
} = useUploadOrchestration();
```

**Upload Handlers:** `useFileUploadHandlers.js`
```javascript
const {
  continueUpload,           // Main upload loop
  processDuplicateFile,     // Skip upload, metadata only
  processExistingFile,      // Skip if already exists
  processNewFileUpload,     // Upload new file
} = useFileUploadHandlers({
  uploadQueue,
  uploadStatus,
  pauseRequested,
  isPaused,
  updateUploadStatus,
  updateFileStatus,
  showNotification,
  calculateFileHash,
  checkFileExists,
  uploadSingleFile,
  populateExistingHash,
  logUploadEvent,
  updateUploadEvent,
  createMetadata: createMetadataRecord,
  generateMetadataHash,
  getCurrentSessionId,
  getUploadAbortController,
  setUploadAbortController,
});
```

### Adaptation Strategy

**Option 1: Adapter Pattern (Recommended)**
Create a thin adapter layer that translates between new queue structure and existing composables:

```javascript
// src/features/upload/composables/useUploadAdapter.js
export function useUploadAdapter() {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  // Import existing composables
  const fileProcessor = useFileProcessor({ /* params */ });
  const fileMetadata = useFileMetadata();
  const uploadOrchestration = useUploadOrchestration();
  const uploadHandlers = useFileUploadHandlers({ /* params */ });

  // Adapter methods that translate new queue format to old format
  const uploadQueueFiles = async (newQueueFiles) => {
    // Convert new queue structure to old queue structure
    const oldQueueFormat = newQueueFiles.map(file => ({
      sourceName: file.name,
      sourceFile: file.sourceFile,
      hash: file.hash,
      status: file.status,
      skipReason: file.skipReason,
      // ... other mappings
    }));

    // Use existing upload handlers
    return await uploadHandlers.continueUpload();
  };

  return {
    uploadQueueFiles,
    // Expose other adapted methods
  };
}
```

**Option 2: Refactor Composables (Complex)**
- Modify existing composables to work with both queue structures
- Risk breaking old `/upload` route
- Not recommended for Phase 2

**Recommendation:** Use Option 1 - keep old system working, add adapter for new queue.

---

## 2.3 Create Upload Pipeline in Testing.vue

### Current State (Phase 1.5)

```javascript
// Testing.vue - Line 122
const handleUpload = () => {
  console.log('[TESTING] Upload clicked');
  // TODO: Implement upload logic
};
```

### Updated Implementation (Phase 2)

```javascript
// Testing.vue
import { useUploadAdapter } from '../features/upload/composables/useUploadAdapter.js';
import { useWebWorker } from '../features/upload/composables/useWebWorker.js';
import { useAuthStore } from '../core/stores/auth.js';
import { useMatterViewStore } from '../stores/matterView.js';

// In setup:
const authStore = useAuthStore();
const matterStore = useMatterViewStore();
const uploadAdapter = useUploadAdapter();
const hashWorker = useWebWorker('../features/upload/workers/fileHashWorker.js');

// Initialize hash worker
onMounted(() => {
  hashWorker.initializeWorker();
});

onUnmounted(() => {
  hashWorker.terminateWorker();
});

const handleUpload = async () => {
  try {
    // Step 1: Validate matter is selected
    if (!matterStore.currentMatterId) {
      console.error('[TESTING] No matter selected');
      // TODO: Show user notification
      return;
    }

    // Step 2: Filter uploadable files
    const uploadableFiles = uploadQueue.value.filter(file =>
      file.status === 'ready' &&
      !file.skipReason // Exclude .lnk files
    );

    if (uploadableFiles.length === 0) {
      console.log('[TESTING] No files to upload');
      return;
    }

    console.log(`[TESTING] Starting upload of ${uploadableFiles.length} files`);

    // Step 3: Send files to hash worker
    const filesData = uploadableFiles.map((file, index) => ({
      id: file.id,
      file: file.sourceFile,
      originalIndex: index,
      customPath: file.folderPath ? `${file.folderPath}/${file.name}` : file.name
    }));

    // Update status to show hashing in progress
    uploadableFiles.forEach(file => {
      file.status = 'hashing'; // Add this status if not in Phase 1
    });

    const hashResult = await hashWorker.sendMessage({
      type: 'PROCESS_FILES',
      files: filesData,
      batchId: `batch_${Date.now()}`,
    }, {
      timeout: 300000 // 5 minutes
    });

    // Step 4: Process hash results
    const { readyFiles, duplicateFiles } = hashResult.result;

    // Update files with hashes
    readyFiles.forEach(readyFile => {
      const queueFile = uploadQueue.value.find(f => f.id === readyFile.id);
      if (queueFile) {
        queueFile.hash = readyFile.hash;
        queueFile.status = 'ready';
      }
    });

    // Mark duplicates
    duplicateFiles.forEach(dupFile => {
      const queueFile = uploadQueue.value.find(f => f.id === dupFile.id);
      if (queueFile) {
        queueFile.hash = dupFile.hash;
        queueFile.status = 'uploadMetadataOnly';
        queueFile.isDuplicate = true;
      }
    });

    // Step 5: Use upload adapter to upload files
    await uploadAdapter.uploadQueueFiles(uploadQueue.value);

    console.log('[TESTING] Upload complete');

  } catch (error) {
    console.error('[TESTING] Upload failed:', error);
    // TODO: Show user notification
  }
};
```

---

## 2.4 Upload Progress Tracking & Status Updates

### Status Flow

```
ready → hashing → uploading → completed
  ↓                              ↑
 skip                         error
```

**Status Transitions:**
1. **ready**: File queued and ready to upload
2. **hashing**: Calculating BLAKE3 hash (worker processing)
3. **uploading**: Uploading to Firebase Storage (shows progress %)
4. **completed**: Successfully uploaded and metadata created
5. **error**: Upload failed (shows error message)
6. **network_error**: Network failure (retryable)
7. **skip**: User manually skipped via checkbox
8. **skipped**: Duplicate detected or already exists
9. **uploadMetadataOnly**: Duplicate within queue (metadata record only)

### Progress Tracking

The existing `uploadSingleFile()` in `useFileProcessor.js` uses `uploadBytesResumable` which provides progress:

```javascript
uploadTask.on(
  'state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    // TODO: Update file.uploadProgress in queue
  },
  (error) => { /* error handling */ },
  async () => { /* success handling */ }
);
```

**Integration with New Queue:**
```javascript
// In adapter, pass progress callback
const uploadWithProgress = async (queueFile, fileHash) => {
  const progressCallback = (progress) => {
    // Update queue file
    queueFile.uploadProgress = progress;
  };

  // Modify uploadSingleFile to accept progress callback (or use existing implementation)
  await fileProcessor.uploadSingleFile(
    queueFile.sourceFile,
    fileHash,
    queueFile.name,
    abortSignal,
    progressCallback
  );
};
```

### Real-Time Status Updates

The virtualized table (Phase 1.5) uses reactive refs, so status changes automatically update the UI:

```javascript
// Just update the file object, Vue reactivity handles the rest
file.status = 'uploading';
file.uploadProgress = 45;

// StatusCell.vue will automatically show updated dot color and text
// Footer will automatically update counts
```

---

## 2.5 Error Handling & Retry Logic (Already Exists)

### Existing Implementation

The old upload system has robust error handling:

**Network Error Detection:** `src/features/upload/utils/networkUtils.js`
```javascript
const isNetworkError = (error) => {
  return (
    error.message.includes('network') ||
    error.message.includes('offline') ||
    error.code === 'storage/retry-limit-exceeded' ||
    // ... more checks
  );
};
```

**Retry Logic:**
```javascript
const retryOnNetworkError = async (operation, options = {}) => {
  const { maxRetries = 4, onRetry } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isNetworkError(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = getRetryDelay(attempt); // Exponential backoff
      if (onRetry) await onRetry(attempt, delay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

**Used in:**
- `checkFileExists()` - 4 retries
- `uploadSingleFile()` - 4 retries with exponential backoff

### Integration Strategy

**No changes needed** - existing error handling works with new queue. The adapter passes through retry callbacks.

**Display Network Errors:**
```javascript
// In upload adapter
try {
  await uploadSingleFile(/* ... */);
} catch (error) {
  if (error.isNetworkError) {
    queueFile.status = 'network_error';
    queueFile.error = 'Network error - check connection';
  } else {
    queueFile.status = 'error';
    queueFile.error = error.message;
  }
}
```

**Retry Failed Button (Already Exists):**
```javascript
// From FileUpload.vue - Line 351
const onRetryFailed = () => {
  // Reset network error files back to ready status
  uploadQueue.value.forEach((file) => {
    if (file.status === 'network_error') {
      file.status = 'ready';
    }
  });

  // Reset upload status counters
  resetUploadStatus();

  // Show notification
  showNotification('Retrying failed uploads. Please ensure you have a stable connection.', 'info');

  // Start upload
  onStartUpload();
};
```

**Adapt for new queue** - add "Retry Failed" button to UploadTableFooter.vue when errors exist.

---

## 2.6 Pause/Resume Upload (Already Exists)

### Existing Implementation

**State Management:** `useUploadOrchestration.js`
```javascript
const isPaused = ref(false);
const pauseRequested = ref(false);
const currentUploadIndex = ref(0);

const handlePauseUpload = (updateUploadStatus) => {
  pauseRequested.value = true;
  updateUploadStatus('requestPause');
};

const handleResumeUpload = (updateUploadStatus, continueUpload) => {
  isPaused.value = false;
  updateUploadStatus('resume');
  continueUpload();
};
```

**Upload Loop:** `useFileUploadHandlers.js` - Line 172
```javascript
const continueUpload = async () => {
  const startIndex = uploadStatus.value.currentUploadIndex || 0;

  for (let i = startIndex; i < filesToProcess.length; i++) {
    // Check for pause request
    if (pauseRequested.value) {
      updateUploadStatus('setUploadIndex', i);
      updateUploadStatus('pause');
      isPaused.value = true;
      pauseRequested.value = false;
      return; // Exit loop, preserving index
    }

    // Process file...
  }
};
```

### UI Integration

**Footer Buttons During Upload:**
```vue
<!-- UploadTableFooter.vue -->
<template>
  <div class="footer-actions">
    <!-- Show pause/resume based on upload state -->
    <v-btn
      v-if="isUploading && !isPaused"
      @click="$emit('pause-upload')"
      color="warning"
    >
      ⏸️ Pause Upload
    </v-btn>

    <v-btn
      v-if="isUploading && isPaused"
      @click="$emit('resume-upload')"
      color="success"
    >
      ▶️ Resume Upload
    </v-btn>

    <v-btn
      v-if="isUploading"
      @click="$emit('cancel-upload')"
      color="error"
    >
      ❌ Cancel Upload
    </v-btn>
  </div>
</template>
```

**Testing.vue Handlers:**
```javascript
const handlePauseUpload = () => {
  uploadOrchestration.handlePauseUpload(updateUploadStatus);
};

const handleResumeUpload = () => {
  uploadOrchestration.handleResumeUpload(updateUploadStatus, continueUpload);
};

const handleCancelUpload = () => {
  // Abort controller cancels in-flight upload
  const controller = uploadOrchestration.getUploadAbortController();
  controller.abort();

  // Reset state
  uploadOrchestration.resetSessionId();
  // ... other cleanup
};
```

---

## 2.7 Upload Complete Summary

### Summary Stats

**Calculate from queue after upload:**
```javascript
const getUploadSummary = () => {
  const completed = uploadQueue.value.filter(f => f.status === 'completed').length;
  const skipped = uploadQueue.value.filter(f => f.status === 'skipped' || f.status === 'uploadMetadataOnly').length;
  const failed = uploadQueue.value.filter(f => f.status === 'error' || f.status === 'network_error').length;
  const total = uploadQueue.value.length;

  return {
    completed,
    skipped,
    failed,
    total,
    duration: uploadEndTime - uploadStartTime
  };
};
```

### Console Logging

```javascript
console.log('[UPLOAD] ========================================');
console.log('[UPLOAD] BATCH UPLOAD COMPLETE');
console.log('[UPLOAD] ========================================');
console.log(`[UPLOAD] Total files: ${summary.total}`);
console.log(`[UPLOAD] Successfully uploaded: ${summary.completed}`);
console.log(`[UPLOAD] Duplicates skipped: ${summary.skipped}`);
console.log(`[UPLOAD] Failed: ${summary.failed}`);
console.log(`[UPLOAD] Duration: ${summary.duration}ms`);
console.log('[UPLOAD] ========================================');
```

### Optional: Summary Modal

```vue
<!-- UploadCompleteModal.vue (Optional for Phase 2) -->
<template>
  <v-dialog v-model="show" max-width="600px">
    <v-card>
      <v-card-title class="text-h5 bg-success">
        <v-icon start>mdi-check-circle</v-icon>
        Upload Complete
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="summary-stats">
          <div class="stat-item">
            <v-icon color="success">mdi-cloud-upload</v-icon>
            <span class="stat-label">Uploaded:</span>
            <span class="stat-value">{{ summary.completed }}</span>
          </div>

          <div class="stat-item">
            <v-icon color="purple">mdi-content-duplicate</v-icon>
            <span class="stat-label">Duplicates Skipped:</span>
            <span class="stat-value">{{ summary.skipped }}</span>
          </div>

          <div v-if="summary.failed > 0" class="stat-item">
            <v-icon color="error">mdi-alert-circle</v-icon>
            <span class="stat-label">Failed:</span>
            <span class="stat-value">{{ summary.failed }}</span>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="summary.failed > 0" color="warning" @click="$emit('retry-failed')">
          Retry Failed
        </v-btn>
        <v-btn color="primary" @click="$emit('close')">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

## Implementation Tasks

### Task Checklist

#### 2.1 Hash Worker Integration
- [ ] Verify `fileHashWorker.js` works with new queue structure
- [ ] Test hash worker with `useWebWorker.js` composable
- [ ] Implement progress updates during hashing
- [ ] Handle hash worker errors gracefully
- [ ] Test with various file sizes (1MB, 10MB, 100MB)

#### 2.2 Upload Adapter Creation
- [ ] Create `useUploadAdapter.js` composable
- [ ] Map new queue structure to old upload format
- [ ] Integrate with `useFileProcessor.js`
- [ ] Integrate with `useFileMetadata.js`
- [ ] Integrate with `useUploadOrchestration.js`
- [ ] Integrate with `useFileUploadHandlers.js`
- [ ] Test adapter with both queue structures

#### 2.3 Testing.vue Integration
- [ ] Update `handleUpload()` with complete pipeline
- [ ] Add hash worker initialization
- [ ] Implement upload state management
- [ ] Connect pause/resume handlers
- [ ] Add error handling and notifications
- [ ] Test complete upload flow
- [ ] Verify footer updates correctly

#### 2.4 Upload Progress Tracking
- [ ] Add progress callback to upload adapter
- [ ] Update file status in real-time
- [ ] Update upload progress percentage
- [ ] Verify virtualized table updates smoothly
- [ ] Test with large files (>100MB)

#### 2.5 Error Handling (Verify Existing)
- [ ] Verify retry logic works with new queue
- [ ] Add network error display in StatusCell
- [ ] Add "Retry Failed" button to footer
- [ ] Test various error scenarios
- [ ] Verify exponential backoff works

#### 2.6 Pause/Resume (Verify Existing)
- [ ] Verify pause/resume state management works
- [ ] Add pause/resume buttons to footer
- [ ] Test pause during upload
- [ ] Test resume after pause
- [ ] Verify upload index preservation

#### 2.7 Upload Complete Summary
- [ ] Calculate summary stats after upload
- [ ] Add console logging
- [ ] (Optional) Create UploadCompleteModal.vue
- [ ] Test with various scenarios

---

## Testing Requirements

### Integration Tests

```javascript
describe('Phase 2: Complete Upload Flow', () => {
  it('uploads files from new queue to Firestore', async () => {
    // Queue files → Hash → Upload to storage → Create Evidence → Create sourceMetadata
  });

  it('detects and skips duplicate files', async () => {
    // Upload file A → Try to upload file A again → Should skip storage, create metadata only
  });

  it('handles upload errors with retry', async () => {
    // Simulate network error → Retry → Success
  });

  it('updates footer stats in real-time', async () => {
    // Start upload → Verify counts update as files complete
  });

  it('pauses and resumes upload correctly', async () => {
    // Start upload → Pause after 10 files → Resume → Verify continues from correct index
  });
});
```

### Manual Testing Scenarios

1. **Single File Upload:**
   - Queue 1 file
   - Click "Upload X files"
   - Verify: ready → hashing → uploading → completed
   - Check Firebase Storage for file
   - Check Firestore for Evidence + sourceMetadata

2. **Batch Upload (100 files):**
   - Queue 100 files
   - Click upload
   - Verify footer stats update correctly
   - Verify all files complete
   - Check Firestore has 100 Evidence documents

3. **Duplicate Detection:**
   - Queue same file twice
   - Click upload
   - Verify: First upload succeeds, second shows "Metadata Only"
   - Check Firestore: Evidence exists with sourceMetadataCount = 2

4. **Network Error Handling:**
   - Start upload
   - Disconnect network mid-upload
   - Verify status shows "Network Error"
   - Reconnect network
   - Click "Retry Failed"
   - Verify success

5. **Pause/Resume:**
   - Start upload of 50 files
   - Click Pause after 10 complete
   - Verify upload stops
   - Click Resume
   - Verify upload continues from file 11

6. **Large Files:**
   - Upload 200MB file
   - Verify progress tracking works
   - Verify no timeout errors

---

## Success Criteria

### Functional Requirements
- [ ] "Upload X files" button triggers batch upload
- [ ] Files are hashed via existing worker before upload
- [ ] Duplicates are detected and skipped (metadata only)
- [ ] Files upload to Firebase Storage at correct path
- [ ] Evidence documents created in Firestore
- [ ] sourceMetadata subcollection documents created
- [ ] File status updates in real-time (ready → hashing → uploading → completed)
- [ ] Upload progress shown for each file (optional for Phase 2)
- [ ] Footer stats update as uploads complete
- [ ] Errors are caught and displayed
- [ ] Failed uploads can be retried
- [ ] Pause/resume works correctly
- [ ] Upload completes with summary

### Compatibility Requirements
- [ ] Old upload system at `/upload` still works
- [ ] Both systems share same Firestore structure
- [ ] Both systems use same hash worker
- [ ] No breaking changes to existing composables

### Performance Requirements
- [ ] Hash calculation <2s for 10MB file (via worker)
- [ ] 100 files (1MB each) upload in <60s
- [ ] No memory leaks during long upload sessions
- [ ] UI remains responsive during upload
- [ ] Virtualized table updates smoothly (60 FPS)

---

## Dependencies

### NPM Packages (Already Installed)
- `hash-wasm` - BLAKE3 hashing (used by fileHashWorker.js)
- `xxhash-wasm` - xxHash for metadata hash (used by useFileMetadata.js)
- `firebase` - Storage and Firestore SDKs

**Verify Installation:**
```bash
npm list hash-wasm
npm list xxhash-wasm
```

### Internal Dependencies
- Phase 1.0: Upload Queue Foundation (table structure, skip/undo system)
- Phase 1.5: Virtualization (performance for large queues)
- Existing upload infrastructure from `/upload` route:
  - `src/features/upload/workers/fileHashWorker.js`
  - `src/features/upload/composables/useWebWorker.js`
  - `src/features/upload/composables/useFileProcessor.js`
  - `src/features/upload/composables/useFileMetadata.js`
  - `src/features/upload/composables/useUploadOrchestration.js`
  - `src/features/upload/composables/useFileUploadHandlers.js`
- `useAuthStore` - For userId and firmId
- `useMatterViewStore` - For currentMatterId
- `firebase/config.js` - Firebase initialization
- `EvidenceService` - For creating Evidence documents

---

## Performance Benchmarks

**Target Performance:**
| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Hash 1MB file | <100ms | Web worker |
| Hash 10MB file | <2s | Web worker |
| Upload 1MB file | <5s | Network dependent |
| Create Evidence | <500ms | Firestore write |
| Create sourceMetadata | <500ms | Firestore write |
| 100 files (1MB each) | <60s | Sequential with concurrency |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 2 - Hash calculation: Xms');
console.log('[PERFORMANCE] Phase 2 - Check file exists: Xms');
console.log('[PERFORMANCE] Phase 2 - Storage upload: Xms');
console.log('[PERFORMANCE] Phase 2 - Evidence creation: Xms');
console.log('[PERFORMANCE] Phase 2 - sourceMetadata creation: Xms');
console.log('[PERFORMANCE] Phase 2 - Total upload time: Xms');
console.log('[PERFORMANCE] Phase 2 - Average time per file: Xms');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Adapter complexity breaks upload | Medium | High | Thorough testing, keep old system working |
| Storage quota exceeded | Medium | High | Check quota before upload, show warning |
| Network timeout for large files | Medium | Medium | Already has retry logic with exponential backoff |
| Hash worker not compatible | Low | Medium | Test early with new queue structure |
| Firestore rate limits | Low | Medium | Use batch writes where possible |
| Matter not selected | Medium | High | Validate before upload, show error |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Upload takes too long for large batches | Medium | Medium | Show progress, allow pause/resume |
| Duplicate detection confusing | Low | Low | Clear status labels ("Metadata Only") |
| Error messages not helpful | Medium | Medium | Provide actionable error messages |
| User closes tab during upload | Medium | High | Add "Are you sure?" warning if upload in progress |

---

## Rollback Plan

If Phase 2 upload fails or has critical bugs:
1. "Upload X files" button continues to log "Upload clicked" (no harm)
2. Users can still use old upload system at `/upload` route
3. Phase 1.0/1.5 queue system remains fully functional
4. Can deploy fixes without reverting entire phase
5. No breaking changes to existing upload infrastructure

---

## Next Phase Preview

**Phase 3:** File Copy Management (Deduplication UI)
- Visual grouping of copies (same hash, different metadata)
- Checkbox-based copy swap (promote copy to primary)
- Left border + bold/non-bold styling for copy hierarchy
- Duplicate filtering with warning popup

Phase 3 builds on Phase 2's upload system by adding intelligent copy management UI.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12 (Complete rewrite to align with actual implementation)
**Assignee:** TBD

---

## Summary of Changes from Original Plan

**Original Phase 2 Focus:**
- Create fileHashWorker.js from scratch
- Create useFileHashing.js composable
- Create useUploadOrchestrator.js from scratch
- Create Firestore structure from scratch
- Cancel action (❌ button in Actions column)
- Undo action (🔄 button)
- Immediate upload (⬆️ Upload Now button)

**Why These Changes Were Made:**
1. **Hash Worker Already Exists** - `fileHashWorker.js` (335 lines) with sophisticated deduplication
2. **Worker Infrastructure Already Exists** - `useWebWorker.js` and `useWorkerManager.js`
3. **Upload Infrastructure Already Exists** - Complete upload pipeline from old `/upload` route
4. **Firestore Structure Already Defined** - Evidence + sourceMetadata with embedded variants
5. **No Actions Column** - Phase 1.0/1.5 used checkboxes for skip/undo, not action buttons

**New Phase 2 Focus:**
1. **Integration Over Creation** - Leverage existing infrastructure, don't rebuild
2. **Adapter Pattern** - Create thin adapter between new queue and existing composables
3. **Maintain Compatibility** - Keep old `/upload` route working
4. **Use Actual Firestore Structure** - Evidence (parent) → sourceMetadata (subcollection)
5. **Correct Dependencies** - `hash-wasm` and `xxhash-wasm`, not `@noble/hashes`

**Rationale:**
- Phase 1.0/1.5 provided UI and queue management
- Old `/upload` route provided battle-tested upload infrastructure
- Phase 2 should **connect** the two systems, not rebuild from scratch
- This minimizes risk, reduces development time, and maintains existing functionality
- The actual Firestore structure is more sophisticated than the planning doc assumed
