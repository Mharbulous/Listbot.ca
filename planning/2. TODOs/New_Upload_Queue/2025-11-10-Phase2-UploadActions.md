# Phase 2: Batch Upload Implementation

**Phase:** 2 of 7
**Status:** Not Started
**Priority:** Critical
**Estimated Duration:** 4-5 days
**Dependencies:** Phase 1.0 (Foundation), Phase 1.5 (Virtualization)

---

## Overview

Implement the core batch upload functionality that actually uploads files to Firebase Storage and Firestore. This phase transforms the upload queue from a display-only table into a fully functional upload system.

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

### What's Missing (This Phase):
❌ **Upload Button Implementation** - Currently just logs "Upload clicked"
❌ **File Hashing** - BLAKE3 hash calculation for deduplication
❌ **Firebase Storage Upload** - Actual file upload to cloud storage
❌ **Firestore Metadata** - Document creation with file metadata
❌ **Upload Progress** - Real-time status updates (ready → uploading → completed/error)
❌ **Error Handling** - Retry logic, error display, graceful failures
❌ **Concurrent Upload Management** - Queue orchestration with configurable concurrency
❌ **Pause/Resume** - Ability to pause and resume upload process

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

### 2.1 File Hashing with BLAKE3 (Web Worker)
### 2.2 Upload to Firebase Storage
### 2.3 Create Firestore Metadata Records
### 2.4 Upload Progress Tracking & Status Updates
### 2.5 Concurrent Upload Management
### 2.6 Error Handling & Retry Logic
### 2.7 Pause/Resume Upload
### 2.8 Upload Complete Summary

---

## 2.1 File Hashing with BLAKE3 (Web Worker)

### Why Hashing First?

**Deduplication Strategy:**
- Files are identified by their BLAKE3 hash (used as Firestore document ID)
- Before uploading, check if hash already exists in storage
- If exists: skip upload, create metadata-only record
- If new: upload file + create metadata record

### Web Worker Implementation

**Location:** `src/workers/fileHashWorker.js` (may already exist from old upload system)

```javascript
// fileHashWorker.js
importScripts('https://unpkg.com/@noble/hashes@1.3.1/blake3.min.js');

self.onmessage = async (event) => {
  const { file, fileId } = event.data;

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Calculate BLAKE3 hash
    const hashArray = blake3.hash(new Uint8Array(arrayBuffer));
    const hash = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Send hash back to main thread
    self.postMessage({
      fileId,
      hash,
      success: true
    });
  } catch (error) {
    self.postMessage({
      fileId,
      error: error.message,
      success: false
    });
  }
};
```

### Hashing Logic (Phase 1 of Upload Process)

```javascript
// useFileHashing.js
export function useFileHashing() {
  const hashWorker = ref(null);
  const hashQueue = ref(new Map()); // fileId -> { resolve, reject }

  onMounted(() => {
    hashWorker.value = new Worker('/src/workers/fileHashWorker.js');
    hashWorker.value.onmessage = handleHashResult;
  });

  onUnmounted(() => {
    hashWorker.value?.terminate();
  });

  const calculateHash = (file) => {
    return new Promise((resolve, reject) => {
      const fileId = file.id;

      // Store promise callbacks
      hashQueue.value.set(fileId, { resolve, reject });

      // Post to worker
      hashWorker.value.postMessage({
        file: file.sourceFile,
        fileId
      });

      console.log(`[HASH] Calculating hash for: ${file.name}`);
    });
  };

  const handleHashResult = (event) => {
    const { fileId, hash, success, error } = event.data;
    const callbacks = hashQueue.value.get(fileId);

    if (!callbacks) return;

    if (success) {
      console.log(`[HASH] ✓ Hash calculated: ${hash.substring(0, 8)}... for file ${fileId}`);
      callbacks.resolve(hash);
    } else {
      console.error(`[HASH] ✗ Hash failed for file ${fileId}:`, error);
      callbacks.reject(new Error(error));
    }

    hashQueue.value.delete(fileId);
  };

  return {
    calculateHash
  };
}
```

### Batched Hashing for Performance

```javascript
// Hash files in batches of 5 concurrently
const hashFiles = async (files) => {
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    // Update status to "hashing" or similar
    batch.forEach(f => f.status = 'hashing');

    // Hash batch concurrently
    const hashes = await Promise.all(
      batch.map(file => calculateHash(file))
    );

    // Store hashes
    batch.forEach((file, index) => {
      file.hash = hashes[index];
      file.status = 'ready'; // Back to ready after hashing
    });

    results.push(...hashes);
  }

  return results;
};
```

---

## 2.2 Upload to Firebase Storage

### Storage Path Structure

```
/uploads/{firmId}/{documentId}/{documentId}.{ext}
```

**Example:**
```
/uploads/firm123/a1b2c3d4e5f6.../a1b2c3d4e5f6....pdf
```

**Why use hash as filename?**
- Automatic deduplication at storage level
- No filename collisions
- Consistent references in Firestore

### Upload Function

```javascript
// useFirebaseUpload.js
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config.js';

export function useFirebaseUpload(firmId) {

  /**
   * Upload file to Firebase Storage
   * @param {Object} file - File object from queue
   * @returns {Promise<Object>} - { downloadURL, storagePath }
   */
  const uploadToStorage = async (file) => {
    try {
      // Extract file extension
      const ext = file.name.split('.').pop();

      // Build storage path
      const storagePath = `uploads/${firmId}/${file.hash}/${file.hash}.${ext}`;

      // Create storage reference
      const fileRef = storageRef(storage, storagePath);

      // Create upload task
      const uploadTask = uploadBytesResumable(fileRef, file.sourceFile, {
        contentType: file.sourceFile.type || 'application/octet-stream'
      });

      // Return promise that resolves when upload completes
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',

          // Progress callback
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            file.uploadProgress = progress;
            console.log(`[UPLOAD] ${file.name}: ${progress.toFixed(1)}%`);
          },

          // Error callback
          (error) => {
            console.error(`[UPLOAD] ✗ Failed: ${file.name}`, error);
            reject(error);
          },

          // Success callback
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[UPLOAD] ✓ Success: ${file.name}`);

            resolve({
              downloadURL,
              storagePath,
              uploadedAt: Date.now()
            });
          }
        );
      });

    } catch (error) {
      console.error(`[UPLOAD] ✗ Error: ${file.name}`, error);
      throw error;
    }
  };

  return {
    uploadToStorage
  };
}
```

---

## 2.3 Create Firestore Metadata Records

### Document Structure

**Collection:** `/firms/{firmId}/documents`
**Document ID:** BLAKE3 hash (same as file identifier)

```javascript
{
  // Core identification
  id: "a1b2c3d4e5f6...", // BLAKE3 hash
  hash: "a1b2c3d4e5f6...", // Same as id

  // Source file metadata (from original file on user's computer)
  sourceFileName: "invoice.pdf",
  sourceFolderPath: "/2024/Tax",
  sourceFileSize: 2458624, // bytes
  sourceLastModified: 1705334400000, // timestamp

  // Storage metadata
  storagePath: "uploads/firm123/a1b2c3d4e5f6.../a1b2c3d4e5f6....pdf",
  downloadURL: "https://storage.googleapis.com/...",

  // Upload metadata
  uploadedAt: 1705420800000,
  uploadedBy: "user123",
  firmId: "firm123",

  // File processing metadata (for future phases)
  status: "uploaded", // uploaded, processing, ready
  fileType: "application/pdf",
  pageCount: null, // Will be set after processing

  // Timestamps
  createdAt: 1705420800000,
  updatedAt: 1705420800000,
}
```

### Metadata Creation Function

```javascript
// useFirestoreMetadata.js
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { useAuthStore } from '@/stores/auth.js';

export function useFirestoreMetadata(firmId) {
  const authStore = useAuthStore();

  /**
   * Check if file hash already exists in Firestore
   * @param {string} hash - BLAKE3 hash
   * @returns {Promise<boolean>}
   */
  const checkFileExists = async (hash) => {
    const docRef = doc(db, `firms/${firmId}/documents`, hash);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };

  /**
   * Create metadata record in Firestore
   * @param {Object} file - File object from queue
   * @param {Object} uploadResult - Result from uploadToStorage (optional if duplicate)
   * @returns {Promise<void>}
   */
  const createMetadataRecord = async (file, uploadResult = null) => {
    try {
      const docRef = doc(db, `firms/${firmId}/documents`, file.hash);

      const metadata = {
        // Core identification
        id: file.hash,
        hash: file.hash,

        // Source file metadata
        sourceFileName: file.name,
        sourceFolderPath: file.folderPath || '/',
        sourceFileSize: file.size,
        sourceLastModified: file.sourceLastModified || Date.now(),

        // Upload metadata
        uploadedAt: serverTimestamp(),
        uploadedBy: authStore.userId,
        firmId: firmId,

        // File type
        fileType: file.sourceFile.type || 'application/octet-stream',

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add storage metadata if file was uploaded (not duplicate)
      if (uploadResult) {
        metadata.storagePath = uploadResult.storagePath;
        metadata.downloadURL = uploadResult.downloadURL;
        metadata.status = 'uploaded';
      } else {
        // Duplicate - file already in storage, just adding new metadata record
        metadata.status = 'uploadMetadataOnly';
      }

      await setDoc(docRef, metadata);

      console.log(`[FIRESTORE] ✓ Metadata created: ${file.name} (${file.hash.substring(0, 8)}...)`);

    } catch (error) {
      console.error(`[FIRESTORE] ✗ Metadata failed: ${file.name}`, error);
      throw error;
    }
  };

  return {
    checkFileExists,
    createMetadataRecord
  };
}
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
2. **hashing**: Calculating BLAKE3 hash (if not already done)
3. **uploading**: Uploading to Firebase Storage (shows progress %)
4. **completed**: Successfully uploaded and metadata created
5. **error**: Upload failed (shows error message)
6. **skip**: User manually skipped via checkbox
7. **skipped**: Duplicate detected (will be set in Phase 3)

### Progress Tracking

```javascript
// Add to file object during upload
file.uploadProgress = 0; // 0-100
file.uploadStartedAt = Date.now();
file.uploadCompletedAt = null;
file.error = null;
```

### Real-Time Status Updates

```vue
<!-- StatusCell.vue - Already Exists, No Changes Needed -->
<!-- Shows colored dot + text based on file.status -->
<!-- Uploading status has pulsing animation -->
```

**Footer Updates During Upload:**
- Uploaded count increases as files complete
- Ready count decreases as files start uploading
- Error count increases if uploads fail
- Progress percentage: `(uploaded / total) * 100`

---

## 2.5 Concurrent Upload Management

### Upload Queue Orchestration

```javascript
// useUploadOrchestrator.js
export function useUploadOrchestrator(firmId) {
  const { calculateHash } = useFileHashing();
  const { uploadToStorage } = useFirebaseUpload(firmId);
  const { checkFileExists, createMetadataRecord } = useFirestoreMetadata(firmId);

  const uploadQueue = ref([]);
  const isUploading = ref(false);
  const isPaused = ref(false);
  const concurrency = ref(3); // Upload 3 files concurrently
  const activeUploads = ref(0);

  /**
   * Process entire upload queue
   * @param {Array} files - Files to upload
   */
  const processQueue = async (files) => {
    // Filter out skipped files and already completed files
    uploadQueue.value = files.filter(f =>
      f.status !== 'skip' &&
      f.status !== 'completed' &&
      f.status !== 'n/a'
    );

    if (uploadQueue.value.length === 0) {
      console.log('[UPLOAD] No files to upload');
      return;
    }

    isUploading.value = true;
    console.log(`[UPLOAD] Starting batch upload: ${uploadQueue.value.length} files`);

    // Process files with concurrency control
    const results = await processWithConcurrency(uploadQueue.value, concurrency.value);

    isUploading.value = false;

    // Log summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.skipped).length;

    console.log(`[UPLOAD] Batch complete: ${successful} uploaded, ${failed} failed, ${skipped} skipped (duplicates)`);

    return {
      successful,
      failed,
      skipped,
      results
    };
  };

  /**
   * Process files with concurrency limit
   */
  const processWithConcurrency = async (files, limit) => {
    const results = [];
    let index = 0;

    const processNext = async () => {
      if (index >= files.length || isPaused.value) return;

      const file = files[index++];
      activeUploads.value++;

      try {
        const result = await uploadSingleFile(file);
        results.push(result);
      } catch (error) {
        results.push({
          file,
          success: false,
          error: error.message
        });
      } finally {
        activeUploads.value--;

        // Continue processing if not paused
        if (!isPaused.value && index < files.length) {
          await processNext();
        }
      }
    };

    // Start initial batch of concurrent uploads
    const initialBatch = Array(Math.min(limit, files.length))
      .fill(0)
      .map(() => processNext());

    await Promise.all(initialBatch);

    return results;
  };

  /**
   * Upload a single file through the entire pipeline
   * @param {Object} file - File from queue
   * @returns {Promise<Object>} - Upload result
   */
  const uploadSingleFile = async (file) => {
    try {
      console.log(`[UPLOAD] Processing: ${file.name}`);

      // STEP 1: Calculate hash if not already done
      if (!file.hash) {
        file.status = 'hashing';
        file.hash = await calculateHash(file);
      }

      // STEP 2: Check if file already exists
      const exists = await checkFileExists(file.hash);

      if (exists) {
        // File is a duplicate - skip storage upload, just create metadata
        console.log(`[UPLOAD] Duplicate detected: ${file.name} (${file.hash.substring(0, 8)}...)`);

        file.status = 'uploadMetadataOnly';
        await createMetadataRecord(file, null);
        file.status = 'completed';

        return {
          file,
          success: true,
          skipped: true,
          reason: 'duplicate'
        };
      }

      // STEP 3: Upload to storage
      file.status = 'uploading';
      file.uploadProgress = 0;
      file.uploadStartedAt = Date.now();

      const uploadResult = await uploadToStorage(file);

      // STEP 4: Create metadata record
      await createMetadataRecord(file, uploadResult);

      // STEP 5: Mark as completed
      file.status = 'completed';
      file.uploadCompletedAt = Date.now();
      file.uploadProgress = 100;

      console.log(`[UPLOAD] ✓ Complete: ${file.name}`);

      return {
        file,
        success: true,
        skipped: false
      };

    } catch (error) {
      console.error(`[UPLOAD] ✗ Failed: ${file.name}`, error);

      file.status = 'error';
      file.error = error.message;

      return {
        file,
        success: false,
        error: error.message
      };
    }
  };

  const pauseUpload = () => {
    isPaused.value = true;
    console.log('[UPLOAD] Paused');
  };

  const resumeUpload = () => {
    isPaused.value = false;
    console.log('[UPLOAD] Resumed');
    // Trigger processNext for remaining files
    processQueue(uploadQueue.value);
  };

  return {
    processQueue,
    uploadSingleFile,
    pauseUpload,
    resumeUpload,
    isUploading,
    isPaused,
    activeUploads,
    concurrency
  };
}
```

---

## 2.6 Error Handling & Retry Logic

### Error Types

1. **Network Errors:** Connection lost during upload
2. **Storage Errors:** Firebase Storage quota exceeded, permission denied
3. **Firestore Errors:** Document creation failed
4. **Hash Errors:** File hashing failed (corrupt file, unsupported format)

### Retry Strategy

```javascript
// useRetryLogic.js
export function useRetryLogic() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const retryWithBackoff = async (operation, maxRetries = MAX_RETRIES) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  };

  return {
    retryWithBackoff
  };
}
```

### Error Display

```javascript
// Add to file object on error
file.status = 'error';
file.error = error.message;
file.retryCount = attempt;

// Show error icon in status cell (already handled by StatusCell.vue)
// Red dot + "Failed" text
```

### Manual Retry

**Future Enhancement (Optional for Phase 2):**
- Add a "Retry Failed" button in footer
- Filters failed files and re-adds them to queue
- Resets error status to 'ready'

---

## 2.7 Pause/Resume Upload

### UI Controls

**Footer Buttons During Upload:**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Uploading: 23/100 | Failed: 2 | Uploaded: 75                                   │
│                                              [⏸️ Pause]  [❌ Cancel Remaining]  │
└────────────────────────────────────────────────────────────────────────────────┘
```

**When Paused:**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Upload Paused | Uploaded: 75/100 | Failed: 2 | Remaining: 23                   │
│                                              [▶️ Resume]  [❌ Cancel Remaining]  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
// Pause: Set isPaused flag
const pauseUpload = () => {
  isPaused.value = true;
  console.log('[UPLOAD] Paused - current uploads will complete');
};

// Resume: Clear flag and continue processing
const resumeUpload = () => {
  isPaused.value = false;
  console.log('[UPLOAD] Resumed');
  processQueue(uploadQueue.value);
};

// Cancel: Mark all remaining files as cancelled
const cancelRemaining = () => {
  const remaining = uploadQueue.value.filter(f =>
    f.status === 'ready' || f.status === 'hashing'
  );

  remaining.forEach(f => {
    f.status = 'skip';
  });

  isPaused.value = true;
  console.log(`[UPLOAD] Cancelled ${remaining.length} remaining files`);
};
```

---

## 2.8 Upload Complete Summary

### Summary Modal (Optional Enhancement)

```vue
<!-- UploadCompleteModal.vue -->
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
            <span class="stat-value">{{ summary.successful }}</span>
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

        <div v-if="summary.failed > 0" class="failed-files-section">
          <p class="text-subtitle-2 mb-2">Failed files:</p>
          <div class="failed-files-list">
            <div v-for="file in failedFiles" :key="file.id" class="failed-file-item">
              <v-icon size="small" color="error">mdi-file-alert</v-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="error-text">{{ file.error }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="summary.failed > 0" color="warning" @click="retryFailed">
          Retry Failed
        </v-btn>
        <v-btn color="primary" @click="close">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

### Console Logging

```javascript
console.log('[UPLOAD] ========================================');
console.log('[UPLOAD] BATCH UPLOAD COMPLETE');
console.log('[UPLOAD] ========================================');
console.log(`[UPLOAD] Total files: ${uploadQueue.length}`);
console.log(`[UPLOAD] Successfully uploaded: ${successful}`);
console.log(`[UPLOAD] Duplicates skipped: ${skipped}`);
console.log(`[UPLOAD] Failed: ${failed}`);
console.log(`[UPLOAD] Duration: ${duration}ms`);
console.log('[UPLOAD] ========================================');
```

---

## Implementation Tasks

### Task Checklist

#### 2.1 File Hashing
- [ ] Create/update `fileHashWorker.js` with BLAKE3
- [ ] Create `useFileHashing.js` composable
- [ ] Implement `calculateHash()` function
- [ ] Add hash result handler
- [ ] Test with various file sizes (1MB, 10MB, 100MB)
- [ ] Add batched hashing for performance
- [ ] Handle hash errors gracefully

#### 2.2 Firebase Storage Upload
- [ ] Create `useFirebaseUpload.js` composable
- [ ] Implement `uploadToStorage()` function
- [ ] Add upload progress tracking
- [ ] Handle storage errors (quota, permissions)
- [ ] Test with various file types
- [ ] Test with large files (>100MB)

#### 2.3 Firestore Metadata
- [ ] Create `useFirestoreMetadata.js` composable
- [ ] Implement `checkFileExists()` function
- [ ] Implement `createMetadataRecord()` function
- [ ] Define document schema
- [ ] Test duplicate detection
- [ ] Handle Firestore errors

#### 2.4 Upload Orchestration
- [ ] Create `useUploadOrchestrator.js` composable
- [ ] Implement `processQueue()` function
- [ ] Implement `uploadSingleFile()` function
- [ ] Add concurrent upload management
- [ ] Update file status in real-time
- [ ] Update footer stats reactively

#### 2.5 Error Handling
- [ ] Create `useRetryLogic.js` composable
- [ ] Implement retry with exponential backoff
- [ ] Add error display in StatusCell
- [ ] Log errors to console
- [ ] Test various error scenarios

#### 2.6 Pause/Resume
- [ ] Add pause/resume state management
- [ ] Update footer buttons during upload
- [ ] Implement `pauseUpload()` function
- [ ] Implement `resumeUpload()` function
- [ ] Implement `cancelRemaining()` function
- [ ] Test pause/resume behavior

#### 2.7 Testing.vue Integration
- [ ] Update `handleUpload()` in Testing.vue
- [ ] Connect to `useUploadOrchestrator`
- [ ] Pass firmId from authStore
- [ ] Test complete upload flow
- [ ] Verify footer updates correctly

#### 2.8 Upload Complete Summary (Optional)
- [ ] Create `UploadCompleteModal.vue` component
- [ ] Show summary after upload completes
- [ ] Display success/error stats
- [ ] Add "Retry Failed" button
- [ ] Test with various scenarios

---

## Testing Requirements

### Unit Tests

```javascript
// useFileHashing.spec.js
describe('File Hashing', () => {
  it('calculates BLAKE3 hash correctly', async () => {});
  it('handles hash errors gracefully', async () => {});
  it('processes batches concurrently', async () => {});
});

// useFirebaseUpload.spec.js
describe('Firebase Upload', () => {
  it('uploads file to correct storage path', async () => {});
  it('tracks upload progress', async () => {});
  it('handles storage quota errors', async () => {});
  it('handles network errors', async () => {});
});

// useFirestoreMetadata.spec.js
describe('Firestore Metadata', () => {
  it('checks if file exists by hash', async () => {});
  it('creates metadata record with correct schema', async () => {});
  it('handles duplicate files correctly', async () => {});
});

// useUploadOrchestrator.spec.js
describe('Upload Orchestrator', () => {
  it('processes queue with concurrency limit', async () => {});
  it('updates file status during upload', async () => {});
  it('handles mixed success/failure', async () => {});
  it('pauses and resumes correctly', async () => {});
});
```

### Integration Tests

```javascript
describe('Complete Upload Flow', () => {
  it('uploads file from queue to Firestore', async () => {
    // Select files → Calculate hash → Upload to storage → Create metadata
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
});
```

### Manual Testing Scenarios

1. **Single File Upload:**
   - Queue 1 file
   - Click "Upload X files"
   - Verify: hashing → uploading → completed
   - Check Firebase Storage for file
   - Check Firestore for metadata record

2. **Batch Upload (100 files):**
   - Queue 100 files
   - Click upload
   - Verify concurrency (max 3 uploading at once)
   - Verify footer stats update correctly
   - Verify all files complete

3. **Duplicate Detection:**
   - Upload file A
   - Queue file A again
   - Upload
   - Verify: Second upload skips storage, creates metadata only
   - Verify status shows "Metadata Only"

4. **Error Handling:**
   - Disconnect network mid-upload
   - Verify status shows "Failed"
   - Reconnect network
   - Retry failed files
   - Verify success

5. **Pause/Resume:**
   - Start upload of 50 files
   - Click Pause after 10 complete
   - Verify upload stops
   - Click Resume
   - Verify upload continues from where it left off

6. **Large Files:**
   - Upload 200MB file
   - Verify progress tracking works
   - Verify no timeout errors

---

## Success Criteria

### Functional Requirements
- [ ] "Upload X files" button triggers batch upload
- [ ] Files are hashed with BLAKE3 before upload
- [ ] Duplicates are detected and skipped (metadata only)
- [ ] Files upload to Firebase Storage at correct path
- [ ] Metadata records created in Firestore
- [ ] File status updates in real-time (ready → hashing → uploading → completed)
- [ ] Upload progress shown for each file
- [ ] Footer stats update as uploads complete
- [ ] Concurrent uploads limited to 3 at a time
- [ ] Errors are caught and displayed
- [ ] Failed uploads can be retried
- [ ] Pause/resume works correctly
- [ ] Upload completes with summary

### Performance Requirements
- [ ] Hash calculation <2s for 10MB file
- [ ] 100 files (1MB each) upload in <60s
- [ ] Concurrent uploads improve overall speed
- [ ] No memory leaks during long upload sessions
- [ ] UI remains responsive during upload

### Visual Requirements
- [ ] Status dots update smoothly
- [ ] Uploading status shows pulsing animation
- [ ] Progress % displayed during upload (optional)
- [ ] Footer buttons change during upload (Pause/Resume)
- [ ] Error status clearly visible (red dot + Failed text)

---

## Dependencies

### Internal Dependencies
- Phase 1.0: Upload Queue Foundation (table structure, skip/undo system)
- Phase 1.5: Virtualization (performance for large queues)
- `useAuthStore` - For userId and firmId
- `fileHashWorker.js` - May exist from old upload system
- `firebase/config.js` - Firebase initialization

### External Dependencies
- Firebase Storage SDK (`firebase/storage`)
- Firebase Firestore SDK (`firebase/firestore`)
- BLAKE3 hashing library (`@noble/hashes`)

### NPM Packages
```bash
# May already be installed
npm install firebase
npm install @noble/hashes
```

---

## Performance Benchmarks

**Target Performance:**
| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Hash 1MB file | <100ms | Web worker |
| Hash 10MB file | <2s | Web worker |
| Upload 1MB file | <5s | Network dependent |
| Create metadata | <500ms | Firestore write |
| 100 files (1MB each) | <60s | 3 concurrent uploads |
| 1000 files (1MB each) | <600s | 3 concurrent uploads |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 2 - Hash calculation: Xms');
console.log('[PERFORMANCE] Phase 2 - Storage upload: Xms');
console.log('[PERFORMANCE] Phase 2 - Metadata creation: Xms');
console.log('[PERFORMANCE] Phase 2 - Total upload time: Xms');
console.log('[PERFORMANCE] Phase 2 - Average time per file: Xms');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Storage quota exceeded | Medium | High | Check quota before upload, show warning |
| Network timeout for large files | Medium | Medium | Implement resume from partial upload |
| Web worker not supported | Low | High | Fallback to main thread hashing (slower) |
| Firestore rate limits | Low | Medium | Batch writes, add delay if needed |
| Race condition with concurrent uploads | Low | Medium | Use proper locking/state management |

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

---

## Next Phase Preview

**Phase 3:** File Copy Management (Deduplication)
- Visual grouping of copies (same hash, different metadata)
- Checkbox-based copy swap (promote copy to primary)
- Left border + bold/non-bold styling for copy hierarchy
- Duplicate filtering with warning popup

Phase 3 builds on Phase 2's upload system by adding intelligent copy management.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12 (Complete rewrite to align with Phase 1.0/1.5 implementation)
**Assignee:** TBD

---

## Summary of Changes from Original Plan

**Original Phase 2 Focus:**
- Cancel action (❌ button in Actions column)
- Undo action (🔄 button)
- Duplicate promotion on cancel
- Immediate upload (⬆️ Upload Now button for individual files)

**Why These Are No Longer Needed:**
1. **Skip/Undo via Checkboxes** - Already implemented in Phase 1.0 (no separate cancel button needed)
2. **No Actions Column** - The actual implementation uses checkboxes only, no action buttons
3. **No Immediate Upload** - Batch upload is simpler and more intuitive for this use case
4. **Duplicate Promotion** - Phase 3 will handle copy management with checkbox-based swap

**New Phase 2 Focus:**
1. **Batch Upload Implementation** - The actual upload process (hash → upload → metadata)
2. **Upload Progress Tracking** - Real-time status updates during upload
3. **Error Handling & Retry** - Graceful failure handling
4. **Pause/Resume** - Upload control for long batch operations
5. **Concurrent Upload Management** - Queue orchestration with configurable concurrency

**Rationale:**
- Phase 1.0/1.5 already provides the UI and file management (skip/undo, select all, footer stats)
- Phase 2 should focus on making the "Upload X files" button actually work
- This aligns with the natural progression: Display → Upload → Advanced Features (copies, sorting, etc.)
- The original Phase 2 plan assumed an Actions column that was never implemented
