# Email Extraction Implementation Plan (v4 - Simplified)

**Date**: 2025-11-28  
**Status**: Ready for Implementation  
**Priority**: High  

---

## Changes from v3

| Change | Rationale |
|--------|-----------|
| Removed `files` collection | Use `uploads` only with `hasEmailAttachments` flag |
| Removed `emailValidation.js` | Never implemented |
| Removed `verifyHash()` | Never used |
| Removed lazy parser loading | Premature optimization |
| Removed granular progress updates | Server-side doesn't need them |
| Removed scheduled retry function | Manual retry sufficient for v1 |
| Removed search denormalization fields | Defer until search is built |
| Flattened file structure | Fewer files, same functionality |
| Added `hasEmailAttachments` flag | Enables simple recursive extraction |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                               │
├─────────────────────────────────────────────────────────────────┤
│  1. User drops .msg/.eml file                                   │
│  2. Client hashes with BLAKE3                                   │
│  3. Client uploads to Storage                                   │
│  4. Client creates Firestore doc (fileType: 'email')            │
│  5. Client listens for status updates                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUD FUNCTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│  onUploadCreated (Firestore trigger)                            │
│    ├── Claim processing lock (transaction)                      │
│    ├── Download and parse email                                 │
│    ├── Hash attachments with BLAKE3                             │
│    ├── Deduplicate and upload new attachments                   │
│    ├── Create emails collection doc                             │
│    ├── Set hasEmailAttachments flag on nested .msg/.eml         │
│    └── Mark complete (triggers cascade for nested emails)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design: `hasEmailAttachments` Flag

The `hasEmailAttachments` field on `uploads` documents enables recursive extraction:

| Value | Meaning |
|-------|---------|
| `true` | This is an email file that needs extraction |
| `false` | This email has been extracted (no more work) |
| `null` | Not an email file (PDF, image, etc.) |

**Extraction loop:**
1. Firestore trigger fires on new upload with `hasEmailAttachments: true`
2. Extract email, upload attachments
3. For any `.msg/.eml` attachments: create upload doc with `hasEmailAttachments: true`
4. Mark parent as `hasEmailAttachments: false`
5. Trigger fires again for nested emails → repeat until none left

---

## File Structure

```
functions/
├── index.js                    # Entry point + exports
├── emailExtraction.js          # All extraction logic (~250 lines)
├── parsers.js                  # .msg and .eml parsers combined
└── constants.js                # Shared constants
```

---

## Firestore Schema

### `uploads` Collection

```javascript
{
  // Identity
  id: string,                           // BLAKE3 hash
  firmId: string,
  userId: string,
  matterId: string,
  
  // File info
  sourceFileName: string,
  fileType: string,                     // 'email' | 'pdf' | 'image' | etc.
  fileSize: number,
  storagePath: string,
  uploadedAt: Timestamp,
  
  // Email extraction (null for non-emails)
  hasEmailAttachments: boolean | null,  // true=needs extraction, false=done, null=not email
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed' | null,
  parseError: string | null,
  parsedAt: Timestamp | null,
  
  // Retry
  retryCount: number,                   // Default: 0, max: 3
  
  // Results (populated after extraction)
  extractedMessageId: string | null,    // ID in emails collection
  extractedAttachmentHashes: string[],  // BLAKE3 hashes of attachments
  
  // Attachment tracking (for files extracted FROM emails)
  isEmailAttachment: boolean,           // true if extracted from an email
  extractedFromEmails: string[],        // Array of parent email hashes
  
  // Nesting (for recursive .msg/.eml)
  nestingDepth: number                  // 0 for user uploads, 1+ for nested
}
```

### `emails` Collection

```javascript
{
  // Identity
  id: string,                           // Auto-generated
  firmId: string,
  userId: string,
  matterId: string,
  
  // Source
  sourceFileHash: string,               // BLAKE3 hash of .msg/.eml
  extractedAt: Timestamp,
  
  // Email metadata
  subject: string,
  from: { name: string | null, email: string },
  to: Array<{ name: string | null, email: string }>,
  cc: Array<{ name: string | null, email: string }>,
  date: Timestamp,
  
  // Bodies (stored in Firebase Storage)
  bodyTextPath: string,
  bodyHtmlPath: string | null,
  bodyPreview: string,                  // First 500 chars
  
  // Attachments
  hasAttachments: boolean,
  attachmentCount: number,
  attachments: Array<{
    fileHash: string,
    fileName: string,
    size: number,
    mimeType: string,
    isDuplicate: boolean
  }>,
  
  createdAt: Timestamp
}
```

---

## Implementation

### constants.js

```javascript
module.exports = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,    // 100MB
  MAX_DEPTH: 10,
  MAX_RETRY: 3,
  MAX_BODY_PREVIEW: 500,
  MAX_BODY_SIZE: 1024 * 1024,          // 1MB
  
  PARSE_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
};
```

### parsers.js

```javascript
const MsgReader = require('@kenjiuno/msgreader').default;
const { simpleParser } = require('mailparser');

async function parseMsgFile(buffer) {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();
  
  const recipients = data.recipients || [];
  
  return {
    subject: data.subject || '(No Subject)',
    from: {
      name: data.senderName || null,
      email: data.senderEmail || data.senderSmtpAddress || ''
    },
    to: recipients.filter(r => r.recipType === 1).map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    })),
    cc: recipients.filter(r => r.recipType === 2).map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    })),
    date: data.creationTime ? new Date(data.creationTime) 
        : data.messageDeliveryTime ? new Date(data.messageDeliveryTime) 
        : new Date(),
    bodyHtml: data.bodyHTML || null,
    bodyText: data.body || '',
    attachments: (data.attachments || []).map(att => {
      let content = att.content;
      if (!content && att.dataId !== undefined) {
        content = reader.getAttachment(att.dataId).content;
      }
      return {
        fileName: att.fileName || att.name || 'unnamed',
        data: content ? Buffer.from(content) : Buffer.alloc(0),
        size: content?.length || 0,
        mimeType: att.mimeType || 'application/octet-stream'
      };
    })
  };
}

async function parseEmlFile(buffer) {
  const parsed = await simpleParser(buffer);
  
  return {
    subject: parsed.subject || '(No Subject)',
    from: {
      name: parsed.from?.value?.[0]?.name || null,
      email: parsed.from?.value?.[0]?.address || ''
    },
    to: (parsed.to?.value || []).map(a => ({ name: a.name || null, email: a.address || '' })),
    cc: (parsed.cc?.value || []).map(a => ({ name: a.name || null, email: a.address || '' })),
    date: parsed.date || new Date(),
    bodyHtml: parsed.html || null,
    bodyText: parsed.text || '',
    attachments: (parsed.attachments || []).map(att => ({
      fileName: att.filename || 'unnamed',
      data: att.content,
      size: att.size || att.content?.length || 0,
      mimeType: att.contentType || 'application/octet-stream'
    }))
  };
}

function parseEmail(buffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'msg') return parseMsgFile(buffer);
  if (ext === 'eml') return parseEmlFile(buffer);
  throw new Error(`Unsupported format: ${ext}`);
}

function isEmailFile(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'msg' || ext === 'eml';
}

module.exports = { parseEmail, isEmailFile };
```

### emailExtraction.js

```javascript
const admin = require('firebase-admin');
const blake3 = require('blake3');
const { parseEmail, isEmailFile } = require('./parsers');
const { MAX_FILE_SIZE, MAX_DEPTH, MAX_BODY_PREVIEW, MAX_BODY_SIZE, PARSE_STATUS } = require('./constants');

const db = admin.firestore();
const storage = admin.storage();

function hashBlake3(data) {
  const hasher = blake3.createHash();
  hasher.update(data);
  return hasher.digest('hex');
}

// Claim processing lock via transaction
async function claimLock(fileHash) {
  const ref = db.collection('uploads').doc(fileHash);
  
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return { success: false, reason: 'not found' };
    
    const data = doc.data();
    if (data.hasEmailAttachments === false) return { success: false, reason: 'already processed' };
    if (data.parseStatus === PARSE_STATUS.PROCESSING) return { success: false, reason: 'already processing' };
    
    tx.update(ref, { parseStatus: PARSE_STATUS.PROCESSING });
    return { success: true, data };
  });
}

// Main extraction function
async function processEmailFile(fileHash, uploadData) {
  const { firmId, userId, matterId, sourceFileName, storagePath, nestingDepth = 0 } = uploadData;
  const ref = db.collection('uploads').doc(fileHash);
  
  try {
    if (nestingDepth >= MAX_DEPTH) {
      throw new Error(`Exceeded max nesting depth of ${MAX_DEPTH}`);
    }
    
    const lock = await claimLock(fileHash);
    if (!lock.success) {
      console.log(`Skipping ${fileHash}: ${lock.reason}`);
      return { success: false, reason: lock.reason };
    }
    
    // Download and parse
    const bucket = storage.bucket();
    const [buffer] = await bucket.file(storagePath).download();
    
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error('File exceeds 100MB limit');
    }
    
    const parsed = await parseEmail(buffer, sourceFileName);
    
    // Process attachments
    const attachmentResults = [];
    const attachmentHashes = [];
    
    for (const att of parsed.attachments) {
      if (att.size > MAX_FILE_SIZE) {
        throw new Error(`Attachment "${att.fileName}" exceeds 100MB limit`);
      }
      
      const attHash = hashBlake3(att.data);
      attachmentHashes.push(attHash);
      const isNested = isEmailFile(att.fileName);
      
      // Check for duplicate
      const existing = await db.collection('uploads').doc(attHash).get();
      const isDuplicate = existing.exists;
      
      if (!isDuplicate) {
        // Upload to storage
        const attPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
        await bucket.file(attPath).save(att.data);
        
        // Create upload document
        await db.collection('uploads').doc(attHash).set({
          id: attHash,
          firmId,
          userId,
          matterId,
          sourceFileName: att.fileName,
          fileType: isNested ? 'email' : detectFileType(att.fileName),
          fileSize: att.size,
          storagePath: attPath,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          
          // Email fields
          hasEmailAttachments: isNested ? true : null,
          parseStatus: isNested ? PARSE_STATUS.PENDING : null,
          parseError: null,
          parsedAt: null,
          retryCount: 0,
          extractedMessageId: null,
          extractedAttachmentHashes: [],
          
          // Track lineage
          isEmailAttachment: true,
          extractedFromEmails: [fileHash],
          nestingDepth: nestingDepth + 1
        });
      } else {
        // Update existing with additional source
        await db.collection('uploads').doc(attHash).update({
          extractedFromEmails: admin.firestore.FieldValue.arrayUnion(fileHash)
        });
      }
      
      attachmentResults.push({
        fileHash: attHash,
        fileName: att.fileName,
        size: att.size,
        mimeType: att.mimeType,
        isDuplicate
      });
    }
    
    // Save email message
    const messageRef = db.collection('emails').doc();
    const messageId = messageRef.id;
    
    // Save bodies to storage
    let bodyText = parsed.bodyText;
    if (bodyText.length > MAX_BODY_SIZE) {
      bodyText = bodyText.substring(0, MAX_BODY_SIZE) + '\n\n[Truncated]';
    }
    
    const bodyTextPath = `firms/${firmId}/emails/${messageId}/body.txt`;
    await bucket.file(bodyTextPath).save(Buffer.from(bodyText, 'utf-8'));
    
    let bodyHtmlPath = null;
    if (parsed.bodyHtml) {
      let html = parsed.bodyHtml;
      if (html.length > MAX_BODY_SIZE) {
        html = html.substring(0, MAX_BODY_SIZE);
      }
      bodyHtmlPath = `firms/${firmId}/emails/${messageId}/body.html`;
      await bucket.file(bodyHtmlPath).save(Buffer.from(html, 'utf-8'));
    }
    
    await messageRef.set({
      id: messageId,
      firmId,
      userId,
      matterId,
      sourceFileHash: fileHash,
      extractedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      cc: parsed.cc,
      date: admin.firestore.Timestamp.fromDate(parsed.date),
      
      bodyTextPath,
      bodyHtmlPath,
      bodyPreview: parsed.bodyText.replace(/\s+/g, ' ').trim().substring(0, MAX_BODY_PREVIEW),
      
      hasAttachments: attachmentResults.length > 0,
      attachmentCount: attachmentResults.length,
      attachments: attachmentResults,
      
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark complete
    await ref.update({
      hasEmailAttachments: false,
      parseStatus: PARSE_STATUS.COMPLETED,
      parseError: null,
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      extractedMessageId: messageId,
      extractedAttachmentHashes: attachmentHashes
    });
    
    console.log(`Extracted ${fileHash}: ${attachmentResults.length} attachments`);
    return { success: true, messageId };
    
  } catch (error) {
    console.error(`Extraction failed for ${fileHash}:`, error);
    
    await ref.update({
      parseStatus: PARSE_STATUS.FAILED,
      parseError: error.message,
      retryCount: admin.firestore.FieldValue.increment(1)
    });
    
    throw error;
  }
}

function detectFileType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  const map = {
    pdf: 'pdf', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
    doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel',
    msg: 'email', eml: 'email'
  };
  return map[ext] || 'other';
}

module.exports = { processEmailFile };
```

### index.js

```javascript
const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const { processEmailFile } = require('./emailExtraction');
const { PARSE_STATUS, MAX_RETRY } = require('./constants');

// Primary trigger: fires when upload document created
exports.onUploadCreated = onDocumentCreated({
  document: 'uploads/{fileHash}',
  memory: '2GiB',
  timeoutSeconds: 300,
  maxInstances: 10,
}, async (event) => {
  const fileHash = event.params.fileHash;
  const data = event.data.data();
  
  // Only process emails that need extraction
  if (data.hasEmailAttachments !== true) {
    return null;
  }
  
  try {
    await processEmailFile(fileHash, data);
    return { success: true };
  } catch (error) {
    console.error(`Extraction failed for ${fileHash}:`, error);
    return { success: false, error: error.message };
  }
});

// Manual retry from UI
exports.retryEmailExtraction = onCall({
  memory: '2GiB',
  timeoutSeconds: 300,
}, async (request) => {
  const { fileHash } = request.data;
  const uid = request.auth?.uid;
  
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');
  if (!fileHash) throw new HttpsError('invalid-argument', 'fileHash required');
  
  const doc = await admin.firestore().collection('uploads').doc(fileHash).get();
  if (!doc.exists) throw new HttpsError('not-found', 'File not found');
  
  const data = doc.data();
  if (data.userId !== uid) throw new HttpsError('permission-denied', 'Not your file');
  if (data.hasEmailAttachments !== true && data.parseStatus !== PARSE_STATUS.FAILED) {
    throw new HttpsError('failed-precondition', 'Cannot retry');
  }
  if (data.retryCount >= MAX_RETRY) {
    throw new HttpsError('failed-precondition', 'Max retries exceeded');
  }
  
  // Reset status
  await doc.ref.update({
    hasEmailAttachments: true,
    parseStatus: PARSE_STATUS.PENDING,
    parseError: null
  });
  
  try {
    const result = await processEmailFile(fileHash, data);
    return { success: true, ...result };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});
```

---

## Client-Side Integration

### Upload Flow Update

```javascript
// In upload composable
async function uploadFile(file, fileHash, matterId) {
  const isEmail = ['msg', 'eml'].includes(
    file.name.toLowerCase().split('.').pop()
  );
  
  await setDoc(doc(db, 'uploads', fileHash), {
    id: fileHash,
    firmId: currentFirmId,
    userId: currentUserId,
    matterId,
    sourceFileName: file.name,
    fileType: isEmail ? 'email' : detectFileType(file.name),
    fileSize: file.size,
    storagePath: `firms/${currentFirmId}/matters/${matterId}/uploads/${fileHash}`,
    uploadedAt: serverTimestamp(),
    
    // Email extraction
    hasEmailAttachments: isEmail ? true : null,
    parseStatus: isEmail ? 'pending' : null,
    parseError: null,
    parsedAt: null,
    retryCount: 0,
    extractedMessageId: null,
    extractedAttachmentHashes: [],
    
    // Not from email
    isEmailAttachment: false,
    extractedFromEmails: [],
    nestingDepth: 0
  });
}
```

### Status Composable

```javascript
import { ref, watch, onUnmounted } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';

export function useEmailExtractionStatus(fileHashRef) {
  const status = ref(null);
  const error = ref(null);
  const canRetry = ref(false);
  
  let unsubscribe = null;
  
  watch(fileHashRef, (hash) => {
    if (unsubscribe) unsubscribe();
    if (!hash) return;
    
    unsubscribe = onSnapshot(doc(db, 'uploads', hash), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      
      status.value = data.parseStatus;
      error.value = data.parseError;
      canRetry.value = data.parseStatus === 'failed' && data.retryCount < 3;
    });
  }, { immediate: true });
  
  async function retry() {
    if (!fileHashRef.value || !canRetry.value) return;
    const fn = httpsCallable(functions, 'retryEmailExtraction');
    await fn({ fileHash: fileHashRef.value });
  }
  
  onUnmounted(() => unsubscribe?.());
  
  return { status, error, canRetry, retry };
}
```

### Status Component

```vue
<template>
  <div v-if="fileType === 'email'" class="flex items-center gap-2 text-sm">
    <template v-if="status === 'processing'">
      <v-progress-circular indeterminate size="14" width="2" />
      <span class="text-gray-600">Processing...</span>
    </template>
    
    <template v-else-if="status === 'completed'">
      <v-icon size="small" color="success">mdi-check-circle</v-icon>
      <span class="text-gray-600">Extracted</span>
    </template>
    
    <template v-else-if="status === 'failed'">
      <v-icon size="small" color="error">mdi-alert-circle</v-icon>
      <span class="text-red-600">{{ error || 'Failed' }}</span>
      <v-btn v-if="canRetry" size="x-small" variant="text" @click="retry">
        Retry
      </v-btn>
    </template>
    
    <template v-else>
      <v-icon size="small" color="gray">mdi-clock-outline</v-icon>
      <span class="text-gray-500">Pending</span>
    </template>
  </div>
</template>

<script setup>
import { toRef } from 'vue';
import { useEmailExtractionStatus } from '../composables/useEmailExtractionStatus';

const props = defineProps({
  fileHash: { type: String, required: true },
  fileType: { type: String, required: true }
});

const { status, error, canRetry, retry } = useEmailExtractionStatus(toRef(props, 'fileHash'));
</script>
```

---

## Security Rules

### Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /emails/{messageId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    match /uploads/{fileHash} {
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.userId || isCloudFunctionUpdate());
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    function isCloudFunctionUpdate() {
      return request.resource.data.diff(resource.data)
        .affectedKeys()
        .hasOnly([
          'hasEmailAttachments', 'parseStatus', 'parseError', 'parsedAt',
          'retryCount', 'extractedMessageId', 'extractedAttachmentHashes',
          'isEmailAttachment', 'extractedFromEmails'
        ]);
    }
  }
}
```

### Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /firms/{firmId}/emails/{messageId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == firmId;
    }
    
    match /firms/{firmId}/matters/{matterId}/uploads/{fileHash} {
      allow read, write: if request.auth != null && request.auth.uid == firmId;
    }
  }
}
```

---

## Setup & Deployment

```bash
# Initialize
firebase init functions
cd functions
npm install blake3 @kenjiuno/msgreader mailparser firebase-admin firebase-functions

# Deploy
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## Implementation Order

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Create `constants.js`, `parsers.js` | 30 min | ✅ **DONE** (2025-11-28) |
| 2 | Create `emailExtraction.js` | 1.5 hours | ✅ **DONE** (2025-11-28) |
| 3 | Create `index.js` with triggers | 30 min | Pending |
| 4 | Test with emulator | 45 min | Pending |
| 5 | Client upload flow update | 30 min | Pending |
| 6 | Client status composable + component | 30 min | Pending |
| 7 | Deploy and verify | 30 min | Pending |

**Total: ~5 hours**

---

## Success Criteria

- [ ] .msg and .eml files upload and trigger extraction
- [ ] Attachments deduplicated via BLAKE3
- [ ] Nested .msg/.eml files cascade correctly
- [ ] `hasEmailAttachments` transitions: `true` → `false`
- [ ] Files >100MB rejected
- [ ] Depth >10 rejected
- [ ] Failed extractions show error + retry button
- [ ] Manual retry works
- [ ] BLAKE3 hashes match client/server

---

## Progress Tracking

### Step 1: Create `constants.js`, `parsers.js` ✅ COMPLETED (2025-11-28)

**Commit**: `1cd29c5` - "STEP 1: Create constants.js and parsers.js for email extraction"

**Files Created**:
- `functions/constants.js` (300 bytes)
- `functions/parsers.js` (2,649 bytes)
- `functions/package.json` (678 bytes)
- `functions/.gitignore`
- `functions/package-lock.json` (153KB)

**Dependencies Installed**:
- `firebase-admin` ^12.0.0
- `firebase-functions` ^4.5.0
- `blake3` ^2.1.7
- `@kenjiuno/msgreader` ^1.2.2
- `mailparser` ^3.6.5

**Implementation Notes**:
- Implementation matched the plan exactly with no deviations
- All modules load and test successfully
- Email file detection (.msg/.eml) working correctly
- Node engine set to v18 (running on v22 with warnings, but functional)

**What's Next**:
- Step 2: Create `emailExtraction.js` with main extraction logic (~250 lines)

---

### Step 2: Create `emailExtraction.js` ✅ COMPLETED (2025-11-28)

**Files Created**:
- `functions/emailExtraction.js` (6,446 bytes)

**Implementation Details**:
- Core extraction logic with BLAKE3 hashing
- Transaction-based processing lock to prevent duplicate processing
- Recursive extraction support with nesting depth limit (MAX_DEPTH=10)
- File size validation (MAX_FILE_SIZE=100MB)
- Attachment deduplication with hash-based checking
- Email body storage (text and HTML) with truncation support
- Creates both `uploads` and `emails` collection documents
- Proper error handling with retry count tracking

**Key Functions**:
- `hashBlake3(data)` - BLAKE3 hashing for attachments
- `claimLock(fileHash)` - Transaction-based processing lock
- `processEmailFile(fileHash, uploadData)` - Main extraction orchestrator
- `detectFileType(fileName)` - File type detection helper

**Testing**:
- Module syntax verified successfully
- All dependencies (constants.js, parsers.js) verified
- Firebase Admin initialization handled properly (deferred to index.js)

**What's Next**:
- Step 3: Create `index.js` with Firestore triggers and callable functions