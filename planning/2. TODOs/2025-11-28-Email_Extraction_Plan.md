# Transaction Boundary Implementation Plan
## Upload System & Email Extraction

**Created:** 2025-11-28
**Status:** Planning
**Priority:** High (Prerequisite for Email Extraction feature)

---

## 📋 Executive Summary

This plan implements **transaction boundary tracking** using a minimal approach:
- **Fast state queries:** Add `uploadStatus` field to Evidence documents (1 new field)
- **Error tracking:** Add `uploadError` field for failed uploads (1 new field)
- **Atomic operations:** Use batch writes to ensure metadata consistency
- **Pattern replication:** Apply same minimal pattern to Email Extraction feature

**Why This Matters:**
- Detects orphaned files from interrupted uploads
- Enables cleanup of partial/failed operations
- Establishes simple, maintainable pattern for all async operations
- Minimizes schema complexity and Firestore write costs (83% fewer writes vs event sourcing)

---

## 🎯 Goals

### Primary Goals
1. ✅ Add transaction boundary tracking to existing upload system
2. ✅ Implement cleanup mechanism for incomplete uploads
3. ✅ Create reusable pattern for email extraction feature
4. ✅ Ensure atomic metadata creation (batch writes)

### Success Criteria
- [ ] Can query for incomplete uploads: `where('uploadStatus', '==', 'in_progress')`
- [ ] Cleanup job finds and resolves orphaned files
- [ ] Batch writes ensure metadata consistency (all 3 operations succeed or fail together)
- [ ] Pattern documented for email extraction reuse
- [ ] Minimal schema complexity (only 2 new fields per document)

---

## 📐 Architecture Overview

### Current State (Upload System)

```
Upload Flow (3 separate transactions):
├─ Transaction 1: Upload to Storage
├─ Transaction 2: Create Evidence document
├─ Transaction 3: Create sourceMetadata subcollection
└─ Transaction 4: Update Evidence with embedded metadata

❌ Problem: If any transaction fails, partial state exists
```

### Target State (Minimal Approach)

```
Upload Flow (with tracking):
├─ Upload to Storage
├─ Batch Write (atomic):
│   ├─ Create Evidence document (uploadStatus: 'in_progress')
│   ├─ Create sourceMetadata subcollection
│   └─ Update Evidence with embedded metadata + uploadStatus: 'completed'

✅ Solution:
   - uploadStatus field enables cleanup queries
   - Batch write ensures all-or-nothing consistency
   - If batch fails, Evidence doc never created (no orphaned state)
```

---

## 🔧 Implementation Phases

### Phase 1: Schema Updates (15 min)

#### 1.1 Update Evidence Schema

**File:** `src/features/documents/services/evidenceService.js`

Add new fields to `createEvidenceFromUpload` method:

```javascript
// Lines 57-85: Modify evidenceData object

const evidenceData = {
  // Display configuration
  sourceID: metadataHash,

  // Source file properties
  fileSize: uploadMetadata.size || 0,
  fileType: uploadMetadata.fileType || '',

  // Processing status (EXISTING - document workflow)
  isProcessed: false,
  hasAllPages: null,
  processingStage: 'uploaded', // uploaded|splitting|merging|complete

  // Upload completion tracking (NEW - 2 fields only)
  uploadStatus: 'in_progress',  // 'in_progress' | 'completed' | 'failed'
  uploadError: null,  // Error message if failed (only populated on failure)

  // Tag counters
  tagCount: 0,
  autoApprovedCount: 0,
  reviewRequiredCount: 0,

  // Embedded data
  tags: {},
  sourceMetadata: {},
  sourceMetadataVariants: {},

  // Timestamps
  uploadDate: uploadDateTimestamp,  // EXISTING - reuse for age queries
};
```

**Changes:**
- Add `uploadStatus: 'in_progress'` (marks upload as incomplete initially)
- Add `uploadError: null` (store error message if upload fails)
- **Note:** Reuse existing `uploadDate` field for age-based cleanup queries

---

### Phase 2: Implement Batch Writes (45 min)

#### 2.1 Refactor createMetadataRecord to Use Batch Writes

**File:** `src/features/upload/composables/useFileMetadata.js`

**Current Code (Lines 134-207):**
```javascript
// STEP 1: Create Evidence document
const evidenceId = await evidenceService.createEvidenceFromUpload(uploadMetadata)

// STEP 2: Create sourceMetadata subcollection
await setDoc(docRef, metadataRecord)

// STEP 3: Update evidence with embedded metadata
await updateDoc(evidenceRef, { ... })
```

**New Code (Atomic Batch Write):**
```javascript
/**
 * Create metadata record with atomic batch write
 * All Firestore operations succeed or fail together
 */
const createMetadataRecord = async (fileData) => {
  try {
    const { sourceFileName, lastModified, fileHash, size, originalPath,
            sourceFileType, storageCreatedTimestamp, sessionId } = fileData;

    if (!sourceFileName || !lastModified || !fileHash) {
      throw new Error('Missing required metadata fields');
    }

    const firmId = authStore.currentFirm;
    const matterId = matterStore.currentMatterId;

    if (!firmId || !matterId) {
      throw new Error('Missing firmId or matterId');
    }

    // Extract folder path
    let currentFolderPath = '';
    if (originalPath) {
      const pathParts = originalPath.split('/');
      if (pathParts.length > 1) {
        currentFolderPath = pathParts.slice(0, -1).join('/');
      }
    }

    // Generate metadata hash
    const metadataHash = await generateMetadataHash(
      sourceFileName,
      lastModified,
      fileHash,
      currentFolderPath
    );

    // Get existing folder paths for pattern recognition
    let existingFolderPaths = '';
    try {
      const metadataDocRef = doc(db, 'firms', firmId, 'matters', matterId,
                                 'evidence', fileHash, 'sourceMetadata', metadataHash);
      const existingDoc = await getDoc(metadataDocRef);
      if (existingDoc.exists()) {
        existingFolderPaths = existingDoc.data().sourceFolderPath || '';
      }
    } catch (error) {
      // Silently catch - new metadata record
    }

    // Update folder paths using pattern recognition
    const pathUpdate = updateFolderPaths(currentFolderPath, existingFolderPaths);

    // Convert Storage timestamp
    let uploadDateTimestamp;
    if (storageCreatedTimestamp) {
      try {
        uploadDateTimestamp = Timestamp.fromDate(new Date(storageCreatedTimestamp));
      } catch (error) {
        console.warn('[MetadataService] Failed to convert timestamp, using serverTimestamp');
        uploadDateTimestamp = serverTimestamp();
      }
    } else {
      uploadDateTimestamp = serverTimestamp();
    }

    // ═══════════════════════════════════════════════════════════
    // ATOMIC BATCH WRITE - All operations succeed or fail together
    // ═══════════════════════════════════════════════════════════

    const batch = writeBatch(db);

    // Define document references
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);
    const metadataDocRef = doc(db, 'firms', firmId, 'matters', matterId,
                               'evidence', fileHash, 'sourceMetadata', metadataHash);

    // Operation 1: Create/Update Evidence document
    const evidenceData = {
      sourceID: metadataHash,
      fileSize: size || 0,
      fileType: sourceFileType || '',

      // Processing status
      isProcessed: false,
      hasAllPages: null,
      processingStage: 'uploaded',

      // Upload tracking (NEW - simplified)
      uploadStatus: 'completed',  // Mark as completed in batch
      uploadError: null,

      // Tag counters
      tagCount: 0,
      autoApprovedCount: 0,
      reviewRequiredCount: 0,

      // Embedded data
      tags: {},
      sourceMetadata: {},
      sourceMetadataVariants: {},

      // Timestamps
      uploadDate: uploadDateTimestamp,
    };

    batch.set(evidenceRef, evidenceData, { merge: true });

    // Operation 2: Create sourceMetadata subcollection document
    const metadataRecord = {
      sourceFileName: sourceFileName,
      sourceLastModified: Timestamp.fromMillis(lastModified),
      fileHash: fileHash,
      sourceFolderPath: pathUpdate.folderPaths,
    };

    batch.set(metadataDocRef, metadataRecord);

    // Operation 3: Update Evidence with embedded metadata
    batch.update(evidenceRef, {
      // Primary source metadata (for fast table rendering)
      sourceFileName: sourceFileName,
      sourceLastModified: Timestamp.fromMillis(lastModified),
      sourceFolderPath: pathUpdate.folderPaths,

      // Add to sourceMetadataVariants map
      [`sourceMetadataVariants.${metadataHash}`]: {
        sourceFileName: sourceFileName,
        sourceLastModified: Timestamp.fromMillis(lastModified),
        sourceFolderPath: pathUpdate.folderPaths,
        uploadDate: Timestamp.now()
      },

      // Increment variant count
      sourceMetadataCount: increment(1),

      // Mark upload as completed (already set in Operation 1, but update here for clarity)
      uploadStatus: 'completed'
    });

    // Commit atomic batch
    await batch.commit();

    console.log('[MetadataService] Metadata created atomically:', {
      fileHash,
      metadataHash,
      operationsCount: 3
    });

    return metadataHash;

  } catch (error) {
    console.error('[MetadataService] Batch write failed:', error);

    // Mark upload as failed in Evidence doc (best effort)
    try {
      const evidenceRef = doc(db, 'firms', authStore.currentFirm, 'matters',
                             matterStore.currentMatterId, 'evidence', fileData.fileHash);
      await updateDoc(evidenceRef, {
        uploadStatus: 'failed',
        uploadError: error.message,
        uploadCompletedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('[MetadataService] Failed to mark upload as failed:', updateError);
    }

    throw error;
  }
};
```

**Key Changes:**
- All 3 Firestore operations in single `writeBatch()`
- Atomic commit - all succeed or all fail
- Set `uploadStatus: 'completed'` in the batch
- Error handling marks upload as 'failed' if batch fails

---

### Phase 3: Integrate Batch Writes into Upload Flow (30 min)

#### 3.1 Update Error Handling in useUploadProcessor

**File:** `src/features/upload/composables/useUploadProcessor.js`

**Key Changes:**
- Batch write already handles atomic operations (no changes needed to upload flow)
- Add error handling to populate `uploadError` field on failures

```javascript
/**
 * Process single file upload
 * Note: Batch writes in createMetadataRecord handle uploadStatus automatically
 */
const processSingleFile = async (queueFile, abortSignal) => {
  try {
    // Step 1: Hash file
    updateFileStatus(queueFile.id, 'hashing');
    const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
    queueFile.hash = fileHash;

    // Step 2: Check existence
    updateFileStatus(queueFile.id, 'checking');
    const existsResult = await fileProcessor.checkFileExists(fileHash, queueFile.name);

    const needsStorageUpload = !existsResult.existsInStorage;
    const needsMetadataOnly = existsResult.existsInFirestore && existsResult.existsInStorage;

    if (needsMetadataOnly) {
      // File already exists - create metadata only
      updateFileStatus(queueFile.id, 'skipped');

      await safeMetadata(
        async () => {
          await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
            sourceFileType: queueFile.sourceFile.type
          });
        },
        `for existing file ${queueFile.name}`
      );

      return { success: true, skipped: true, uploaded: false };
    }

    if (needsStorageUpload) {
      // Upload to Storage
      updateFileStatus(queueFile.id, 'uploading');
      queueFile.uploadProgress = 0;

      const uploadResult = await fileProcessor.uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => {
          queueFile.uploadProgress = progress;
        }
      );

      // Create metadata (batch write handles uploadStatus automatically)
      updateFileStatus(queueFile.id, 'creating_metadata');

      await safeMetadata(
        async () => {
          return await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
            sourceFileType: queueFile.sourceFile.type,
            storageCreatedTimestamp: uploadResult.timeCreated
          });
        },
        `for new file ${queueFile.name}`
      );

      updateFileStatus(queueFile.id, 'completed');
      return { success: true, skipped: false, uploaded: true };
    }

    throw new Error('Unexpected state in file upload logic');

  } catch (error) {
    console.error(`[UPLOAD] Error uploading ${queueFile.name}:`, error);

    // Update file status
    if (isNetworkError(error)) {
      updateFileStatus(queueFile.id, 'network_error');
      queueFile.error = 'Network error - check connection';
    } else {
      updateFileStatus(queueFile.id, 'error');
      queueFile.error = error.message;
    }

    // Note: uploadError field is set in createMetadataRecord error handler
    return { success: false, error };
  }
};
```

**What Changed:**
- Removed all event logging calls (no uploadEventService)
- Batch write in `createMetadataRecord` handles `uploadStatus` automatically
- Error handling in `createMetadataRecord` sets `uploadError` field
- Simplified code: ~200 lines → ~70 lines

---

### Phase 4: Cleanup Service (30 min)

#### 4.1 Create Simplified Cleanup Service

**File:** `src/features/upload/services/uploadCleanupService.js` (NEW)

```javascript
import { db, storage } from '../../../services/firebase.js';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, getMetadata } from 'firebase/storage';

/**
 * Upload Cleanup Service (Simplified)
 * Detects and resolves incomplete uploads using uploadStatus field
 */
export class UploadCleanupService {
  constructor(firmId, matterId) {
    this.firmId = firmId;
    this.matterId = matterId;
  }

  /**
   * Find evidence documents with incomplete uploads
   * Uses uploadStatus field and uploadDate (reusing existing field)
   * @param {number} olderThanMinutes - Find uploads older than this (default: 60)
   * @returns {Promise<Array>} - Array of incomplete evidence docs
   */
  async findIncompleteEvidenceDocs(olderThanMinutes = 60) {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

      const evidenceRef = collection(db, 'firms', this.firmId, 'matters', this.matterId, 'evidence');
      const q = query(
        evidenceRef,
        where('uploadStatus', '==', 'in_progress'),
        where('uploadDate', '<', Timestamp.fromDate(cutoffTime))
      );

      const snapshot = await getDocs(q);
      const incompleteDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('[Cleanup] Found incomplete evidence docs:', incompleteDocs.length);
      return incompleteDocs;

    } catch (error) {
      console.error('[Cleanup] Failed to find incomplete evidence docs:', error);
      return [];
    }
  }

  /**
   * Check if file exists in Storage
   * @param {string} fileHash - File hash
   * @param {string} fileType - File MIME type
   * @returns {Promise<boolean>}
   */
  async checkStorageExists(fileHash, fileType) {
    try {
      const extension = fileType.split('/').pop() || 'bin';
      const storagePath = `firms/${this.firmId}/matters/${this.matterId}/uploads/${fileHash}.${extension}`;
      const storageReference = storageRef(storage, storagePath);

      await getMetadata(storageReference);
      return true;

    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete orphaned file from Storage
   * @param {string} fileHash - File hash
   * @param {string} fileType - File MIME type
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteOrphanedStorageFile(fileHash, fileType) {
    try {
      const extension = fileType.split('/').pop() || 'bin';
      const storagePath = `firms/${this.firmId}/matters/${this.matterId}/uploads/${fileHash}.${extension}`;
      const storageReference = storageRef(storage, storagePath);

      await deleteObject(storageReference);
      console.log('[Cleanup] Deleted orphaned storage file:', fileHash);
      return true;

    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log('[Cleanup] Storage file not found (already deleted):', fileHash);
        return false;
      }
      throw error;
    }
  }

  /**
   * Clean up incomplete upload
   * Strategy:
   * 1. If storage exists but metadata incomplete → Delete evidence doc (will retry on next upload)
   * 2. If storage missing and metadata incomplete → Delete evidence doc
   *
   * @param {Object} evidenceDoc - Incomplete evidence document
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupIncompleteUpload(evidenceDoc) {
    try {
      const { id: fileHash, fileType, uploadSessionId } = evidenceDoc;

      console.log('[Cleanup] Processing incomplete upload:', fileHash);

      // Check if storage file exists
      const storageExists = await this.checkStorageExists(fileHash, fileType);

      if (storageExists) {
        // Storage exists but metadata incomplete
        // Strategy: Delete Evidence doc, keep Storage file
        // Next upload will detect existing storage and complete metadata
        console.log('[Cleanup] Storage exists, deleting incomplete Evidence doc:', fileHash);

        const evidenceRef = doc(db, 'firms', this.firmId, 'matters', this.matterId, 'evidence', fileHash);
        await deleteDoc(evidenceRef);

        return {
          fileHash,
          action: 'deleted_evidence_doc',
          reason: 'storage_exists_metadata_incomplete',
          storageKept: true
        };

      } else {
        // Storage missing and metadata incomplete
        // Strategy: Delete Evidence doc (nothing to keep)
        console.log('[Cleanup] Storage missing, deleting Evidence doc:', fileHash);

        const evidenceRef = doc(db, 'firms', this.firmId, 'matters', this.matterId, 'evidence', fileHash);
        await deleteDoc(evidenceRef);

        return {
          fileHash,
          action: 'deleted_evidence_doc',
          reason: 'storage_missing_metadata_incomplete',
          storageKept: false
        };
      }

    } catch (error) {
      console.error('[Cleanup] Failed to clean up incomplete upload:', error);
      return {
        fileHash: evidenceDoc.id,
        action: 'error',
        error: error.message
      };
    }
  }

  /**
   * Run cleanup job
   * Finds and resolves all incomplete uploads
   * @param {number} olderThanMinutes - Process uploads older than this (default: 60)
   * @returns {Promise<Object>} - Cleanup summary
   */
  async runCleanupJob(olderThanMinutes = 60) {
    try {
      console.log('[Cleanup] Starting cleanup job...');
      const startTime = Date.now();

      // Find incomplete uploads
      const incompleteDocs = await this.findIncompleteEvidenceDocs(olderThanMinutes);

      if (incompleteDocs.length === 0) {
        console.log('[Cleanup] No incomplete uploads found');
        return {
          totalFound: 0,
          totalCleaned: 0,
          results: [],
          duration: Date.now() - startTime
        };
      }

      console.log('[Cleanup] Found incomplete uploads:', incompleteDocs.length);

      // Clean up each incomplete upload
      const results = [];
      for (const doc of incompleteDocs) {
        const result = await this.cleanupIncompleteUpload(doc);
        results.push(result);
      }

      const summary = {
        totalFound: incompleteDocs.length,
        totalCleaned: results.filter(r => r.action !== 'error').length,
        totalErrors: results.filter(r => r.action === 'error').length,
        results,
        duration: Date.now() - startTime
      };

      console.log('[Cleanup] Cleanup job completed:', summary);
      return summary;

    } catch (error) {
      console.error('[Cleanup] Cleanup job failed:', error);
      throw error;
    }
  }

  /**
   * Get cleanup job statistics
   * @returns {Promise<Object>} - Statistics about incomplete uploads
   */
  async getCleanupStats() {
    try {
      const incompleteDocs = await this.findIncompleteEvidenceDocs(0); // All time

      return {
        incompleteEvidenceDocs: incompleteDocs.length,
        oldestIncompleteUpload: incompleteDocs.length > 0
          ? incompleteDocs.reduce((oldest, doc) => {
              const docTime = doc.uploadDate.toMillis();
              return docTime < oldest ? docTime : oldest;
            }, Date.now())
          : null
      };

    } catch (error) {
      console.error('[Cleanup] Failed to get cleanup stats:', error);
      return null;
    }
  }
}

export default UploadCleanupService;
```

---

### Phase 5: Admin UI for Cleanup (20 min)

#### 5.1 Add Cleanup Button to Settings

**File:** `src/core/firm/views/FirmSettings.vue`

Add a new section for upload maintenance:

```vue
<template>
  <!-- Existing settings sections -->

  <!-- Upload Maintenance Section -->
  <v-card class="mb-4">
    <v-card-title>Upload Maintenance</v-card-title>
    <v-card-text>
      <v-alert v-if="cleanupStats" type="info" variant="tonal" class="mb-4">
        <div><strong>Incomplete Uploads:</strong> {{ cleanupStats.incompleteEvidenceDocs }}</div>
        <div v-if="cleanupStats.oldestIncompleteUpload">
          <strong>Oldest:</strong> {{ formatDate(cleanupStats.oldestIncompleteUpload) }}
        </div>
      </v-alert>

      <v-btn
        color="warning"
        variant="elevated"
        :loading="cleanupLoading"
        :disabled="cleanupLoading"
        @click="runCleanup"
      >
        <v-icon start>mdi-broom</v-icon>
        Clean Up Incomplete Uploads
      </v-btn>

      <v-alert v-if="cleanupResult" type="success" variant="tonal" class="mt-4">
        <div><strong>Cleanup Complete</strong></div>
        <div>Found: {{ cleanupResult.totalFound }}</div>
        <div>Cleaned: {{ cleanupResult.totalCleaned }}</div>
        <div>Duration: {{ cleanupResult.duration }}ms</div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/core/auth/stores/authStore.js';
import { useMatterViewStore } from '@/features/matters/stores/matterView.js';
import { UploadCleanupService } from '@/features/upload/services/uploadCleanupService.js';

const authStore = useAuthStore();
const matterStore = useMatterViewStore();

const cleanupStats = ref(null);
const cleanupLoading = ref(false);
const cleanupResult = ref(null);

const loadCleanupStats = async () => {
  try {
    const cleanupService = new UploadCleanupService(
      authStore.currentFirm,
      matterStore.currentMatterId
    );
    cleanupStats.value = await cleanupService.getCleanupStats();
  } catch (error) {
    console.error('Failed to load cleanup stats:', error);
  }
};

const runCleanup = async () => {
  try {
    cleanupLoading.value = true;
    cleanupResult.value = null;

    const cleanupService = new UploadCleanupService(
      authStore.currentFirm,
      matterStore.currentMatterId
    );

    const result = await cleanupService.runCleanupJob(60); // Clean up > 1 hour old
    cleanupResult.value = result;

    // Reload stats
    await loadCleanupStats();

  } catch (error) {
    console.error('Cleanup failed:', error);
    alert(`Cleanup failed: ${error.message}`);
  } finally {
    cleanupLoading.value = false;
  }
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadCleanupStats();
});
</script>
```

---

### Phase 6: Apply Minimal Pattern to Email Extraction (30 min)

#### 6.1 Email Message Schema (Simplified)

When implementing email extraction, apply the same minimal pattern:

```javascript
// Email message document schema
{
  messageId: string,  // Auto-generated
  extractedFromFile: string,  // Hash of .msg file

  // Message content
  subject: string,
  from: string,
  to: string,
  body: string,

  // Extraction status (NEW - minimal, 2 fields only)
  extractionStatus: 'pending' | 'completed' | 'failed',
  extractionError: string,  // Only populated on failure

  // Message type
  messageType: 'native' | 'quoted',

  // Timestamps
  createdAt: Timestamp  // EXISTING - reuse for age queries
}
```

**Changes from upload pattern:**
- Only 2 new fields: `extractionStatus` and `extractionError`
- Reuse `createdAt` for age-based cleanup queries
- No event sourcing collection
- Batch writes ensure atomicity

#### 6.2 Email Extraction with Batch Writes (Simplified)

```javascript
/**
 * Extract email with atomic batch writes
 * All operations succeed or fail together
 */
async function extractEmail(msgFile) {
  try {
    // Parse .msg file
    const parsed = await parseMsg(msgFile);

    // Upload attachments to Storage
    const attachments = await uploadAttachments(parsed.attachments);

    // Create messages in Firestore (ATOMIC BATCH)
    const batch = writeBatch(db);

    // Create native message
    const nativeMessageRef = doc(collection(db, 'firms', firmId, 'matters', matterId, 'emails'));
    batch.set(nativeMessageRef, {
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      body: parsed.body,
      extractedFromFile: msgFile.hash,
      messageType: 'native',

      // Extraction tracking (minimal)
      extractionStatus: 'completed',
      extractionError: null,

      createdAt: serverTimestamp()
    });

    // Create quoted messages (if any)
    for (const quotedMsg of parsed.quotedMessages) {
      const quotedRef = doc(collection(db, 'firms', firmId, 'matters', matterId, 'emails'));
      batch.set(quotedRef, {
        subject: quotedMsg.subject,
        from: quotedMsg.from,
        to: quotedMsg.to,
        body: quotedMsg.body,
        extractedFromFile: msgFile.hash,
        messageType: 'quoted',

        extractionStatus: 'completed',
        extractionError: null,

        createdAt: serverTimestamp()
      });
    }

    // Update source .msg file
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', msgFile.hash);
    batch.update(evidenceRef, {
      hasBeenParsed: true,
      parseStatus: 'completed',
      parseCompletedAt: serverTimestamp()
    });

    // Commit atomic batch
    await batch.commit();

    console.log('[EmailExtraction] Extraction completed:', {
      fileHash: msgFile.hash,
      messagesExtracted: 1 + parsed.quotedMessages.length,
      attachmentsExtracted: attachments.length
    });

  } catch (error) {
    console.error('[EmailExtraction] Extraction failed:', error);

    // Mark as failed (best effort)
    try {
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', msgFile.hash);
      await updateDoc(evidenceRef, {
        parseStatus: 'failed',
        extractionError: error.message,
        parseCompletedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('[EmailExtraction] Failed to mark as failed:', updateError);
    }

    throw error;
  }
}
```

**Key Simplifications:**
- No event logging service (removed ~200 lines)
- Batch write ensures atomicity
- Error handling sets `extractionError` field
- Same cleanup pattern as uploads

---

## 📋 Testing Strategy

### Unit Tests (Simplified)

```javascript
// tests/unit/services/uploadCleanupService.test.js
describe('UploadCleanupService', () => {
  it('should find incomplete evidence docs using uploadStatus field', async () => {
    const service = new UploadCleanupService('firm1', 'matter1');

    // Create evidence doc with uploadStatus: 'in_progress'
    await createTestEvidenceDoc({
      uploadStatus: 'in_progress',
      uploadDate: Timestamp.now()
    });

    const incomplete = await service.findIncompleteEvidenceDocs(0);
    expect(incomplete.length).toBeGreaterThan(0);
    expect(incomplete[0].uploadStatus).toBe('in_progress');
  });

  it('should clean up incomplete upload by deleting Evidence doc', async () => {
    const service = new UploadCleanupService('firm1', 'matter1');

    const evidenceDoc = {
      id: 'hash123',
      fileType: 'application/pdf',
      uploadStatus: 'in_progress'
    };

    const result = await service.cleanupIncompleteUpload(evidenceDoc);
    expect(result.action).toBe('deleted_evidence_doc');
  });

  it('should get cleanup stats', async () => {
    const service = new UploadCleanupService('firm1', 'matter1');
    const stats = await service.getCleanupStats();

    expect(stats).toHaveProperty('incompleteEvidenceDocs');
    expect(stats).toHaveProperty('oldestIncompleteUpload');
  });
});
```

### Integration Tests (Simplified)

```javascript
// tests/integration/upload-transaction-boundaries.test.js
describe('Upload Transaction Boundaries (Simplified)', () => {
  it('should mark upload complete with batch write', async () => {
    // Complete upload
    await completeFileUpload(testFile);

    // Check Evidence doc - should be completed immediately
    const evidenceDoc = await getDoc(evidenceRef);
    expect(evidenceDoc.data().uploadStatus).toBe('completed');
    expect(evidenceDoc.data().uploadError).toBeNull();
  });

  it('should use batch writes for atomic metadata creation', async () => {
    // Spy on Firestore batch
    const batchSpy = jest.spyOn(firestore, 'writeBatch');

    // Upload file
    await uploadFile(testFile);

    // Verify batch was used (all 3 operations in one batch)
    expect(batchSpy).toHaveBeenCalled();
    const batchCommit = batchSpy.mock.results[0].value;
    expect(batchCommit).toBeTruthy(); // Batch committed
  });

  it('should mark upload failed if batch write fails', async () => {
    // Mock batch write failure
    jest.spyOn(firestore, 'writeBatch').mockImplementationOnce(() => {
      throw new Error('Firestore error');
    });

    // Attempt upload
    await expect(uploadFile(testFile)).rejects.toThrow();

    // Check Evidence doc marked as failed
    const evidenceDoc = await getDoc(evidenceRef);
    expect(evidenceDoc.data().uploadStatus).toBe('failed');
    expect(evidenceDoc.data().uploadError).toContain('Firestore error');
  });

  it('should query for incomplete uploads', async () => {
    // Create incomplete upload
    await createEvidenceDoc({
      uploadStatus: 'in_progress',
      uploadDate: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2 hours ago
    });

    // Query for incomplete
    const q = query(
      evidenceRef,
      where('uploadStatus', '==', 'in_progress'),
      where('uploadDate', '<', Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)))
    );
    const snapshot = await getDocs(q);

    expect(snapshot.docs.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing Checklist (Simplified)

- [ ] Upload file successfully → Check uploadStatus='completed', uploadError=null
- [ ] Simulate batch write failure → Check uploadStatus='failed', uploadError populated
- [ ] Run cleanup job → Incomplete uploads cleaned up
- [ ] Check Firm Settings → Cleanup stats display correctly (incomplete count, oldest upload)
- [ ] Upload duplicate file → Metadata created, uploadStatus='completed'
- [ ] Query Firestore for 'uploadStatus==in_progress' → Returns only incomplete uploads

---

## 🚀 Rollout Plan (Simplified)

### Step 1: Schema Migration (Non-Breaking)
- Add 2 new fields to Evidence schema: `uploadStatus`, `uploadError`
- Existing uploads continue to work (fields optional)
- No data migration needed (you're in pre-alpha, can wipe data anytime)

### Step 2: Deploy Batch Writes
- Deploy batch write refactor in `createMetadataRecord`
- Test atomic operations (all 3 writes succeed or fail together)
- Rollback if issues detected

### Step 3: Deploy Cleanup Service
- Deploy simplified cleanup service (no event sourcing)
- Test manually in staging
- Enable in production with admin UI

### Step 4: Apply Pattern to Email Extraction
- Use same minimal pattern (2 fields: extractionStatus, extractionError)
- Use same batch write approach
- Deploy email extraction feature

**Total Implementation Time:** ~2.5 hours (down from ~5 hours)

---

## 📊 Success Metrics (Simplified)

### Performance Metrics
- Upload success rate: >99%
- Batch write success rate: >99.5%
- Cleanup job success rate: >95%

### Reliability Metrics
- Incomplete uploads: <0.1% of total uploads
- Orphaned files: <0.01% of storage

### Monitoring (Manual in Pre-Alpha)
- Check incomplete uploads weekly via Firm Settings UI
- Run cleanup job manually if needed
- Monitor console logs for batch write errors

**Note:** Automated monitoring can be added later if/when needed

---

## 🔄 Maintenance (Simplified)

### Weekly (Manual in Pre-Alpha)
- Check Firm Settings → Upload Maintenance section
- Review incomplete upload count
- Run cleanup job if needed (button in UI)

### When Issues Occur
- Check console logs for error messages
- Review `uploadError` field in Evidence docs
- Re-upload failed files if necessary

**Note:** Daily/automated maintenance can be added later when scaling

---

## 📚 Documentation Updates (Simplified)

### Code Documentation
- [ ] Document `uploadStatus` and `uploadError` fields in `docs/Data/25-11-18-data-structures.md`
- [ ] Add JSDoc comments to UploadCleanupService

### Developer Documentation
- [ ] Document batch write pattern (atomic operations)
- [ ] Create guide for applying minimal pattern to new features (email extraction, etc.)

---

## 🎯 Next Steps After Completion

1. **Email Extraction Implementation**
   - Apply same minimal pattern (2 fields: extractionStatus, extractionError)
   - Use batch writes for atomicity
   - Reuse cleanup service pattern

2. **Consider Later (If Needed)**
   - Event sourcing collection (if compliance requires audit trail)
   - Automated monitoring/alerts (if scaling requires it)
   - Unified async operation dashboard (if managing multiple async features)

---

## 🐛 Known Issues & Limitations

### Current Limitations (Acceptable for Pre-Alpha)
1. **No automatic retry**: Failed uploads require manual retry
2. **No detailed audit trail**: Console logs only (no event sourcing)
3. **Manual cleanup**: Requires admin to click button in UI

### Future Enhancements (Add Only If Needed)
1. **Event sourcing** (if compliance requires detailed audit trail)
2. **Automatic retry with exponential backoff** (if upload failures become common)
3. **Resumable uploads** (if large file uploads frequently interrupted)
4. **Automated cleanup job** (if incomplete uploads accumulate)

---

## 📊 Comparison: Original vs Simplified

| Metric | Original Plan | Simplified Plan |
|--------|---------------|-----------------|
| **Evidence fields added** | 5 fields | 2 fields |
| **Collections added** | 2 (uploadEvents, extractionEvents) | 0 |
| **Firestore writes/upload** | ~6 writes | ~1 write |
| **Lines of code** | ~800 lines | ~300 lines |
| **Implementation time** | ~5 hours | ~2.5 hours |
| **Achieves core goals** | ✅ Yes | ✅ Yes |
| **Firestore cost savings** | Baseline | **83% fewer writes** |

---

## 📞 Support & Questions

For questions about this implementation:
- **Schema questions:** See Phase 1 (Evidence schema with 2 fields)
- **Batch writes:** See Phase 2 (atomic operations)
- **Cleanup:** See Phase 4 (UploadCleanupService)

---

**End of Simplified Plan**
