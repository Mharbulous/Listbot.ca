# Transaction Boundary Implementation Plan
## Upload System & Email Extraction

**Created:** 2025-11-28
**Status:** Planning
**Priority:** High (Prerequisite for Email Extraction feature)

---

## 📋 Executive Summary

This plan implements **transaction boundary tracking** using a hybrid approach:
- **Fast state queries:** Add `uploadStatus` field to Evidence documents
- **Audit trail:** Implement `uploadEvents` collection for historical records
- **Pattern replication:** Apply same pattern to Email Extraction feature

**Why This Matters:**
- Detects orphaned files from interrupted uploads
- Enables cleanup of partial/failed operations
- Provides debugging audit trail
- Establishes pattern for all async operations (email extraction, document processing, etc.)

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
- [ ] Batch writes ensure metadata consistency
- [ ] Upload events provide complete audit trail
- [ ] Pattern documented for email extraction reuse

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

### Target State (Hybrid Approach)

```
Upload Flow (with tracking):
├─ Create Evidence doc (uploadStatus: 'in_progress')
├─ Log uploadEvent (eventType: 'upload_started')
├─ Upload to Storage
├─ Batch Write (atomic):
│   ├─ Create Evidence document
│   ├─ Create sourceMetadata subcollection
│   └─ Update Evidence with embedded metadata + uploadStatus: 'completed'
└─ Log uploadEvent (eventType: 'upload_success')

✅ Solution: Status field tracks completion, events provide audit trail
```

---

## 🔧 Implementation Phases

### Phase 1: Schema Updates (30 min)

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

  // Upload completion tracking (NEW - upload workflow)
  uploadStatus: 'in_progress',  // 'in_progress' | 'completed' | 'failed'
  uploadStartedAt: serverTimestamp(),
  uploadCompletedAt: null,
  uploadError: null,  // Error message if failed
  uploadSessionId: uploadMetadata.sessionId || null,  // Link to uploadEvents

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
```

**Changes:**
- Add `uploadStatus: 'in_progress'` (marks upload as incomplete initially)
- Add `uploadStartedAt: serverTimestamp()` (track when upload started)
- Add `uploadCompletedAt: null` (set when upload completes)
- Add `uploadError: null` (store error message if upload fails)
- Add `uploadSessionId` (link to uploadEvents for audit trail)

#### 1.2 Create uploadEvents Collection Schema

**File:** `docs/Data/25-11-18-data-structures.md`

Document the uploadEvents collection:

```javascript
/**
 * Upload Events Collection
 * Path: /firms/{firmId}/matters/{matterId}/uploadEvents/{eventId}
 *
 * Purpose: Immutable audit trail of upload operations
 * Pattern: Event sourcing (append-only, never update)
 */
{
  // Event identification
  eventId: string,          // Auto-generated Firestore ID
  sessionId: string,        // UUID to correlate related events

  // Event type and status
  eventType: string,        // 'upload_started' | 'storage_uploaded' |
                           // 'metadata_created' | 'upload_success' |
                           // 'upload_error' | 'upload_interrupted'

  // File information
  fileHash: string,         // BLAKE3 hash (null for upload_started)
  metadataHash: string,     // xxHash metadata hash
  fileName: string,         // Source file name
  fileSize: number,         // File size in bytes

  // Context
  firmId: string,           // Firm context
  matterId: string,         // Matter context
  userId: string,           // User who initiated upload

  // Timing
  timestamp: Timestamp,     // When event occurred

  // Error tracking (only for upload_error events)
  errorMessage: string,     // Error description
  errorStage: string,       // Which stage failed: 'hashing' | 'storage' | 'metadata'

  // Performance metrics (optional)
  duration: number,         // Milliseconds (for completed uploads)
  retryCount: number        // Number of retries before success/failure
}
```

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

      // Upload tracking (NEW)
      uploadStatus: 'completed',  // Mark as completed in batch
      uploadStartedAt: uploadDateTimestamp,
      uploadCompletedAt: serverTimestamp(),
      uploadError: null,
      uploadSessionId: sessionId || null,

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

      // Mark upload as completed
      uploadStatus: 'completed',
      uploadCompletedAt: serverTimestamp()
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

### Phase 3: Implement uploadEvents Service (60 min)

#### 3.1 Create Upload Events Service

**File:** `src/features/upload/services/uploadEventService.js` (NEW)

```javascript
import { db } from '../../../services/firebase.js';
import { collection, addDoc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';

/**
 * Upload Event Service
 * Manages immutable audit trail of upload operations
 *
 * Event Types:
 * - upload_started: Upload session initiated
 * - storage_uploaded: File successfully uploaded to Firebase Storage
 * - metadata_created: Firestore metadata created successfully
 * - upload_success: Complete upload success
 * - upload_error: Upload failed with error
 * - upload_interrupted: Upload interrupted (browser closed, network lost)
 */
export class UploadEventService {
  constructor(firmId, matterId) {
    this.firmId = firmId;
    this.matterId = matterId;

    if (!this.firmId || !this.matterId) {
      throw new Error('UploadEventService requires firmId and matterId');
    }

    this.eventsRef = collection(db, 'firms', this.firmId, 'matters', this.matterId, 'uploadEvents');
  }

  /**
   * Log upload started event
   * @param {Object} data - Upload session data
   * @returns {Promise<string>} - Event document ID
   */
  async logUploadStarted({ sessionId, fileName, fileSize, userId }) {
    try {
      const eventData = {
        sessionId,
        eventType: 'upload_started',
        fileName,
        fileSize: fileSize || 0,
        fileHash: null,  // Not yet calculated
        metadataHash: null,
        firmId: this.firmId,
        matterId: this.matterId,
        userId,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(this.eventsRef, eventData);
      console.log('[UploadEvents] Upload started logged:', sessionId);
      return docRef.id;

    } catch (error) {
      console.error('[UploadEvents] Failed to log upload_started:', error);
      // Don't throw - audit logging failures shouldn't block upload
      return null;
    }
  }

  /**
   * Log storage upload complete event
   * @param {Object} data - Storage upload data
   * @returns {Promise<string>} - Event document ID
   */
  async logStorageUploaded({ sessionId, fileName, fileHash, fileSize, userId, duration }) {
    try {
      const eventData = {
        sessionId,
        eventType: 'storage_uploaded',
        fileName,
        fileHash,
        fileSize,
        firmId: this.firmId,
        matterId: this.matterId,
        userId,
        timestamp: serverTimestamp(),
        duration: duration || null,
      };

      const docRef = await addDoc(this.eventsRef, eventData);
      console.log('[UploadEvents] Storage upload logged:', fileHash);
      return docRef.id;

    } catch (error) {
      console.error('[UploadEvents] Failed to log storage_uploaded:', error);
      return null;
    }
  }

  /**
   * Log metadata creation complete event
   * @param {Object} data - Metadata creation data
   * @returns {Promise<string>} - Event document ID
   */
  async logMetadataCreated({ sessionId, fileName, fileHash, metadataHash, userId, duration }) {
    try {
      const eventData = {
        sessionId,
        eventType: 'metadata_created',
        fileName,
        fileHash,
        metadataHash,
        firmId: this.firmId,
        matterId: this.matterId,
        userId,
        timestamp: serverTimestamp(),
        duration: duration || null,
      };

      const docRef = await addDoc(this.eventsRef, eventData);
      console.log('[UploadEvents] Metadata creation logged:', metadataHash);
      return docRef.id;

    } catch (error) {
      console.error('[UploadEvents] Failed to log metadata_created:', error);
      return null;
    }
  }

  /**
   * Log upload success event
   * @param {Object} data - Upload completion data
   * @returns {Promise<string>} - Event document ID
   */
  async logUploadSuccess({ sessionId, fileName, fileHash, metadataHash, userId, duration, retryCount }) {
    try {
      const eventData = {
        sessionId,
        eventType: 'upload_success',
        fileName,
        fileHash,
        metadataHash,
        firmId: this.firmId,
        matterId: this.matterId,
        userId,
        timestamp: serverTimestamp(),
        duration: duration || null,
        retryCount: retryCount || 0,
      };

      const docRef = await addDoc(this.eventsRef, eventData);
      console.log('[UploadEvents] Upload success logged:', sessionId);
      return docRef.id;

    } catch (error) {
      console.error('[UploadEvents] Failed to log upload_success:', error);
      return null;
    }
  }

  /**
   * Log upload error event
   * @param {Object} data - Upload error data
   * @returns {Promise<string>} - Event document ID
   */
  async logUploadError({ sessionId, fileName, fileHash, userId, errorMessage, errorStage, retryCount }) {
    try {
      const eventData = {
        sessionId,
        eventType: 'upload_error',
        fileName,
        fileHash: fileHash || null,
        firmId: this.firmId,
        matterId: this.matterId,
        userId,
        timestamp: serverTimestamp(),
        errorMessage,
        errorStage,  // 'hashing' | 'storage' | 'metadata'
        retryCount: retryCount || 0,
      };

      const docRef = await addDoc(this.eventsRef, eventData);
      console.log('[UploadEvents] Upload error logged:', sessionId, errorMessage);
      return docRef.id;

    } catch (error) {
      console.error('[UploadEvents] Failed to log upload_error:', error);
      return null;
    }
  }

  /**
   * Get all events for a specific upload session
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<Array>} - Array of events sorted by timestamp
   */
  async getSessionEvents(sessionId) {
    try {
      const q = query(this.eventsRef, where('sessionId', '==', sessionId));
      const snapshot = await getDocs(q);

      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp (oldest first)
      events.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

      return events;

    } catch (error) {
      console.error('[UploadEvents] Failed to get session events:', error);
      return [];
    }
  }

  /**
   * Find incomplete upload sessions
   * Sessions that have 'upload_started' but no completion event
   * @param {number} olderThanMinutes - Find sessions older than this (default: 60)
   * @returns {Promise<Array>} - Array of incomplete session IDs
   */
  async findIncompleteUploads(olderThanMinutes = 60) {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

      // Get all started sessions
      const startedQuery = query(
        this.eventsRef,
        where('eventType', '==', 'upload_started'),
        where('timestamp', '<', Timestamp.fromDate(cutoffTime))
      );
      const startedSnapshot = await getDocs(startedQuery);

      const startedSessions = new Set();
      startedSnapshot.docs.forEach(doc => {
        startedSessions.add(doc.data().sessionId);
      });

      // Get all completed sessions (success or error)
      const completedQuery = query(
        this.eventsRef,
        where('eventType', 'in', ['upload_success', 'upload_error'])
      );
      const completedSnapshot = await getDocs(completedQuery);

      const completedSessions = new Set();
      completedSnapshot.docs.forEach(doc => {
        completedSessions.add(doc.data().sessionId);
      });

      // Find sessions that started but never completed
      const incompleteSessions = Array.from(startedSessions).filter(
        sessionId => !completedSessions.has(sessionId)
      );

      console.log('[UploadEvents] Found incomplete sessions:', incompleteSessions.length);

      return incompleteSessions;

    } catch (error) {
      console.error('[UploadEvents] Failed to find incomplete uploads:', error);
      return [];
    }
  }
}

export default UploadEventService;
```

---

### Phase 4: Integrate Events into Upload Flow (45 min)

#### 4.1 Update useUploadProcessor

**File:** `src/features/upload/composables/useUploadProcessor.js`

```javascript
import { UploadEventService } from '../services/uploadEventService.js';

/**
 * Process single file upload with event logging
 */
const processSingleFile = async (queueFile, abortSignal) => {
  // Generate session ID for this upload
  const sessionId = crypto.randomUUID();
  const startTime = Date.now();

  // Initialize event service
  const eventService = new UploadEventService(
    authStore.currentFirm,
    matterStore.currentMatterId
  );

  try {
    // Log upload started
    await eventService.logUploadStarted({
      sessionId,
      fileName: queueFile.name,
      fileSize: queueFile.size,
      userId: authStore.user.uid
    });

    // Step 1: Hash file
    updateFileStatus(queueFile.id, 'hashing');
    console.log(`[UPLOAD] Hashing file: ${queueFile.name}`);

    const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
    queueFile.hash = fileHash;

    // Step 2: Check existence
    updateFileStatus(queueFile.id, 'checking');
    const existsResult = await fileProcessor.checkFileExists(fileHash, queueFile.name);

    const needsStorageUpload = !existsResult.existsInStorage;
    const needsMetadataOnly = existsResult.existsInFirestore && existsResult.existsInStorage;

    if (needsMetadataOnly) {
      // File already exists - create metadata only
      console.log(`[UPLOAD] File exists, creating metadata only: ${queueFile.name}`);
      updateFileStatus(queueFile.id, 'skipped');

      const metadataStartTime = Date.now();

      await safeMetadata(
        async () => {
          await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
            sourceFileType: queueFile.sourceFile.type,
            sessionId  // Pass sessionId to link Evidence doc
          });
        },
        `for existing file ${queueFile.name}`
      );

      const metadataDuration = Date.now() - metadataStartTime;

      // Log metadata created
      await eventService.logMetadataCreated({
        sessionId,
        fileName: queueFile.name,
        fileHash,
        metadataHash: queueFile.metadataHash,
        userId: authStore.user.uid,
        duration: metadataDuration
      });

      // Log success
      await eventService.logUploadSuccess({
        sessionId,
        fileName: queueFile.name,
        fileHash,
        metadataHash: queueFile.metadataHash,
        userId: authStore.user.uid,
        duration: Date.now() - startTime,
        retryCount: 0
      });

      return { success: true, skipped: true, uploaded: false };
    }

    if (needsStorageUpload) {
      // Upload to Storage
      updateFileStatus(queueFile.id, 'uploading');
      queueFile.uploadProgress = 0;

      const storageStartTime = Date.now();

      const uploadResult = await fileProcessor.uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => {
          queueFile.uploadProgress = progress;
        }
      );

      const storageDuration = Date.now() - storageStartTime;

      // Log storage uploaded
      await eventService.logStorageUploaded({
        sessionId,
        fileName: queueFile.name,
        fileHash,
        fileSize: queueFile.size,
        userId: authStore.user.uid,
        duration: storageDuration
      });

      // Create metadata
      updateFileStatus(queueFile.id, 'creating_metadata');
      console.log(`[UPLOAD] Creating metadata for: ${queueFile.name}`);

      const metadataStartTime = Date.now();

      const metadataHash = await safeMetadata(
        async () => {
          return await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath ? `${queueFile.folderPath}/${queueFile.name}` : queueFile.name,
            sourceFileType: queueFile.sourceFile.type,
            storageCreatedTimestamp: uploadResult.timeCreated,
            sessionId  // Link to uploadEvents
          });
        },
        `for new file ${queueFile.name}`
      );

      const metadataDuration = Date.now() - metadataStartTime;

      // Log metadata created
      await eventService.logMetadataCreated({
        sessionId,
        fileName: queueFile.name,
        fileHash,
        metadataHash,
        userId: authStore.user.uid,
        duration: metadataDuration
      });

      // Mark as completed
      updateFileStatus(queueFile.id, 'completed');
      console.log(`[UPLOAD] Completed: ${queueFile.name}`);

      // Log success
      await eventService.logUploadSuccess({
        sessionId,
        fileName: queueFile.name,
        fileHash,
        metadataHash,
        userId: authStore.user.uid,
        duration: Date.now() - startTime,
        retryCount: 0
      });

      return { success: true, skipped: false, uploaded: true };
    }

    throw new Error('Unexpected state in file upload logic');

  } catch (error) {
    console.error(`[UPLOAD] Error uploading ${queueFile.name}:`, error);

    // Determine error stage
    let errorStage = 'unknown';
    if (queueFile.status === 'hashing') errorStage = 'hashing';
    else if (queueFile.status === 'uploading') errorStage = 'storage';
    else if (queueFile.status === 'creating_metadata') errorStage = 'metadata';

    // Log error event
    await eventService.logUploadError({
      sessionId,
      fileName: queueFile.name,
      fileHash: queueFile.hash || null,
      userId: authStore.user.uid,
      errorMessage: error.message,
      errorStage,
      retryCount: 0
    });

    // Update file status
    if (isNetworkError(error)) {
      updateFileStatus(queueFile.id, 'network_error');
      queueFile.error = 'Network error - check connection';
    } else {
      updateFileStatus(queueFile.id, 'error');
      queueFile.error = error.message;
    }

    return { success: false, error };
  }
};
```

---

### Phase 5: Cleanup Job (60 min)

#### 5.1 Create Cleanup Service

**File:** `src/features/upload/services/uploadCleanupService.js` (NEW)

```javascript
import { db, storage } from '../../../services/firebase.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, deleteObject, getMetadata } from 'firebase/storage';
import { UploadEventService } from './uploadEventService.js';

/**
 * Upload Cleanup Service
 * Detects and resolves incomplete uploads, orphaned files
 */
export class UploadCleanupService {
  constructor(firmId, matterId) {
    this.firmId = firmId;
    this.matterId = matterId;
    this.eventService = new UploadEventService(firmId, matterId);
  }

  /**
   * Find evidence documents with incomplete uploads
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
        where('uploadStartedAt', '<', Timestamp.fromDate(cutoffTime))
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
      const incompleteSessions = await this.eventService.findIncompleteUploads(0);

      return {
        incompleteEvidenceDocs: incompleteDocs.length,
        incompleteSessions: incompleteSessions.length,
        oldestIncompleteUpload: incompleteDocs.length > 0
          ? incompleteDocs.reduce((oldest, doc) => {
              const docTime = doc.uploadStartedAt.toMillis();
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

### Phase 6: Admin UI for Cleanup (30 min)

#### 6.1 Add Cleanup Button to Settings

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
        <div><strong>Incomplete Sessions:</strong> {{ cleanupStats.incompleteSessions }}</div>
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

### Phase 7: Apply Pattern to Email Extraction (90 min)

#### 7.1 Email Extraction Upload Status

When implementing email extraction, apply the same pattern:

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

  // Extraction status (NEW - same pattern)
  extractionStatus: 'in_progress' | 'completed' | 'failed',
  extractionStartedAt: Timestamp,
  extractionCompletedAt: Timestamp,
  extractionError: string,
  extractionSessionId: string,  // Link to extractionEvents

  // Message type
  messageType: 'native' | 'quoted',

  // Timestamps
  createdAt: Timestamp
}
```

#### 7.2 Extraction Events Collection

```javascript
// /firms/{firmId}/matters/{matterId}/extractionEvents/{eventId}
{
  sessionId: string,
  eventType: 'extraction_started' | 'attachments_uploaded' |
            'messages_created' | 'extraction_success' | 'extraction_error',

  sourceFileHash: string,  // .msg file hash
  messagesExtracted: number,
  attachmentsExtracted: number,

  timestamp: Timestamp,
  errorMessage: string,
  errorStage: string,

  firmId: string,
  matterId: string,
  userId: string
}
```

#### 7.3 Email Extraction with Events

```javascript
// Extract email with event logging
async function extractEmail(msgFile) {
  const sessionId = crypto.randomUUID();
  const eventService = new ExtractionEventService(firmId, matterId);

  try {
    // Log extraction started
    await eventService.logExtractionStarted({
      sessionId,
      sourceFileHash: msgFile.hash,
      fileName: msgFile.name,
      userId: authStore.user.uid
    });

    // Parse .msg file
    const parsed = await parseMsg(msgFile);

    // Upload attachments to Storage
    const attachments = await uploadAttachments(parsed.attachments);

    // Log attachments uploaded
    await eventService.logAttachmentsUploaded({
      sessionId,
      sourceFileHash: msgFile.hash,
      attachmentCount: attachments.length,
      userId: authStore.user.uid
    });

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

      // Extraction tracking
      extractionStatus: 'completed',
      extractionStartedAt: serverTimestamp(),
      extractionCompletedAt: serverTimestamp(),
      extractionError: null,
      extractionSessionId: sessionId,

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
        extractionCompletedAt: serverTimestamp(),
        extractionSessionId: sessionId,

        createdAt: serverTimestamp()
      });
    }

    // Update source .msg file
    const uploadRef = doc(db, 'firms', firmId, 'matters', matterId, 'uploads', msgFile.id);
    batch.update(uploadRef, {
      hasBeenParsed: true,
      parseStatus: 'completed',
      parseCompletedAt: serverTimestamp()
    });

    // Commit atomic batch
    await batch.commit();

    // Log success
    await eventService.logExtractionSuccess({
      sessionId,
      sourceFileHash: msgFile.hash,
      messagesExtracted: 1 + parsed.quotedMessages.length,
      attachmentsExtracted: attachments.length,
      userId: authStore.user.uid,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('[EmailExtraction] Extraction failed:', error);

    // Log error
    await eventService.logExtractionError({
      sessionId,
      sourceFileHash: msgFile.hash,
      errorMessage: error.message,
      errorStage: 'message_creation',  // or 'attachment_upload', etc.
      userId: authStore.user.uid
    });

    throw error;
  }
}
```

---

## 📋 Testing Strategy

### Unit Tests

```javascript
// tests/unit/services/uploadEventService.test.js
describe('UploadEventService', () => {
  it('should log upload started event', async () => {
    const service = new UploadEventService('firm1', 'matter1');
    const eventId = await service.logUploadStarted({
      sessionId: 'session1',
      fileName: 'test.pdf',
      fileSize: 1000,
      userId: 'user1'
    });

    expect(eventId).toBeTruthy();
  });

  it('should find incomplete uploads', async () => {
    const service = new UploadEventService('firm1', 'matter1');

    // Create started event
    await service.logUploadStarted({ sessionId: 'session1', ... });

    // Don't create success event

    // Should find incomplete session
    const incomplete = await service.findIncompleteUploads(0);
    expect(incomplete).toContain('session1');
  });
});

// tests/unit/services/uploadCleanupService.test.js
describe('UploadCleanupService', () => {
  it('should find incomplete evidence docs', async () => {
    const service = new UploadCleanupService('firm1', 'matter1');

    // Create evidence doc with uploadStatus: 'in_progress'
    await createTestEvidenceDoc({ uploadStatus: 'in_progress' });

    const incomplete = await service.findIncompleteEvidenceDocs(0);
    expect(incomplete.length).toBeGreaterThan(0);
  });

  it('should clean up incomplete upload', async () => {
    const service = new UploadCleanupService('firm1', 'matter1');

    const evidenceDoc = {
      id: 'hash123',
      fileType: 'application/pdf',
      uploadStatus: 'in_progress'
    };

    const result = await service.cleanupIncompleteUpload(evidenceDoc);
    expect(result.action).toBe('deleted_evidence_doc');
  });
});
```

### Integration Tests

```javascript
// tests/integration/upload-transaction-boundaries.test.js
describe('Upload Transaction Boundaries', () => {
  it('should create evidence with uploadStatus=in_progress initially', async () => {
    // Upload file
    const result = await uploadFile(testFile);

    // Check Evidence doc
    const evidenceDoc = await getDoc(evidenceRef);
    expect(evidenceDoc.data().uploadStatus).toBe('in_progress');
  });

  it('should mark upload complete after metadata creation', async () => {
    // Complete upload
    await completeFileUpload(testFile);

    // Check Evidence doc
    const evidenceDoc = await getDoc(evidenceRef);
    expect(evidenceDoc.data().uploadStatus).toBe('completed');
    expect(evidenceDoc.data().uploadCompletedAt).toBeTruthy();
  });

  it('should log upload events', async () => {
    const sessionId = crypto.randomUUID();

    // Upload file with session ID
    await uploadFile(testFile, { sessionId });

    // Check events
    const events = await getSessionEvents(sessionId);
    expect(events).toHaveLength(3); // started, storage_uploaded, success
    expect(events[0].eventType).toBe('upload_started');
    expect(events[2].eventType).toBe('upload_success');
  });

  it('should use batch writes for atomic metadata creation', async () => {
    // Spy on Firestore batch
    const batchSpy = jest.spyOn(firestore, 'writeBatch');

    // Upload file
    await uploadFile(testFile);

    // Verify batch was used
    expect(batchSpy).toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

- [ ] Upload file successfully → Check uploadStatus='completed'
- [ ] Upload file, close browser mid-upload → Check uploadStatus='in_progress'
- [ ] Run cleanup job → Incomplete uploads cleaned up
- [ ] View uploadEvents in Firestore → Events logged correctly
- [ ] Retry failed upload → Works correctly
- [ ] Upload duplicate file → Metadata created, uploadStatus='completed'
- [ ] Check Firm Settings → Cleanup stats display correctly

---

## 🚀 Rollout Plan

### Step 1: Schema Migration (Non-Breaking)
- Add new fields to Evidence schema (uploadStatus, etc.)
- Existing uploads continue to work (fields optional)
- No data migration needed (existing docs don't have uploadStatus field)

### Step 2: Deploy Event Logging (Audit Only)
- Deploy uploadEventService
- Enable event logging in upload flow
- Monitor for errors, but don't rely on events yet
- Existing uploads work without events

### Step 3: Enable Batch Writes
- Deploy batch write refactor
- Test atomic operations
- Rollback if issues detected

### Step 4: Deploy Cleanup Job
- Deploy cleanup service
- Test manually in staging
- Enable in production with admin UI

### Step 5: Apply Pattern to Email Extraction
- Implement extraction events
- Use same batch write pattern
- Deploy email extraction feature

---

## 📊 Success Metrics

### Performance Metrics
- Upload success rate: >99%
- Batch write success rate: >99.5%
- Cleanup job success rate: >95%
- Average upload duration: <5 seconds per file

### Reliability Metrics
- Incomplete uploads: <0.1% of total uploads
- Orphaned files: <0.01% of storage
- Event logging success rate: >98%

### Monitoring
- Alert if incomplete uploads > 10
- Alert if cleanup job fails
- Alert if batch write errors > 1%

---

## 🔄 Maintenance

### Daily
- Monitor uploadEvents for errors
- Check incomplete upload count

### Weekly
- Run cleanup job manually
- Review cleanup results
- Check for orphaned files

### Monthly
- Archive old uploadEvents (> 90 days)
- Review upload success metrics
- Analyze failure patterns

---

## 📚 Documentation Updates

### Code Documentation
- [ ] Document uploadStatus field in schema docs
- [ ] Add JSDoc comments to all new services
- [ ] Update architecture diagrams

### User Documentation
- [ ] Add "Upload Maintenance" section to admin guide
- [ ] Document cleanup job procedure
- [ ] Add troubleshooting guide for failed uploads

### Developer Documentation
- [ ] Document batch write pattern
- [ ] Add event logging best practices
- [ ] Create guide for applying pattern to new features

---

## 🎯 Next Steps After Completion

1. **Email Extraction Implementation**
   - Apply same transaction boundary pattern
   - Implement extractionEvents collection
   - Add cleanup job for failed extractions

2. **Document Processing Workflow**
   - Apply pattern to PDF splitting
   - Apply pattern to page merging
   - Centralized async operation monitoring

3. **Unified Async Operation Dashboard**
   - Show all incomplete operations (uploads, extractions, processing)
   - One-click cleanup for all operation types
   - Historical analytics

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No automatic retry**: Failed uploads require manual retry
2. **No progress persistence**: If browser closes, upload progress lost
3. **No bandwidth throttling**: Large uploads can saturate connection

### Future Enhancements
1. **Automatic retry with exponential backoff**
2. **Resumable uploads** (using Firebase Storage resumable API)
3. **Background upload worker** (Service Worker for offline support)
4. **Rate limiting** (prevent simultaneous large uploads)

---

## 📞 Support & Questions

For questions about this implementation:
- **Architecture questions:** Review email extraction architecture doc
- **Code issues:** Check JSDoc comments in service files
- **Testing issues:** See testing strategy section above

---

**End of Plan**
