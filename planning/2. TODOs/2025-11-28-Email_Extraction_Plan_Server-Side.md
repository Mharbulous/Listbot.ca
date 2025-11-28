# Email Extraction Implementation Plan (v2 - Server-Side)

**Date**: 2025-11-28
**Status**: Ready for Implementation
**Priority**: High
**Branch**: `claude/email-extraction-server-side-<session-id>`

**Architecture Document**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`

---

## 🔄 Revision History

**v2 (Server-Side)**:
- **CHANGED**: Server-side extraction using Firebase Cloud Functions (instead of client-side)
- **REASON**: Browser compatibility issues with email parsing libraries
- **BENEFIT**: Reliable Node.js libraries, better performance, no browser memory constraints

**v1 (Client-Side)**: ❌ Deprecated due to browser compatibility issues

---

## Decision Summary

### ✅ Finalized Decisions (2025-11-28)

1. **Processing Location**: **Server-side** using Firebase Cloud Functions (v2 change)
2. **Storage Strategy**: Email message bodies → Firebase Storage; Metadata → Firestore
3. **File Formats**: Both .msg and .eml
4. **Message Extraction**: Native messages only (skip quoted messages in v1)
5. **Failure Handling**: Upload as regular file, mark `hasBeenParsed: false` for manual retry
6. **Size Limits**: 100MB max for .msg/.eml files; fail extraction if any attachment >100MB
7. **Processing**: Async background processing with status updates via Firestore
8. **UI Detail**: Real-time status updates ("Processing email...", "Extracting attachments...")
9. **Depth Limit**: 10 levels for nested .msg files; mark `hasBeenParsed: false` if exceeded

### ⚙️ Implementation Approach

- **Server-side extraction** using Firebase Cloud Functions (Node.js 20)
- **100MB limit** prevents Cloud Functions memory issues
- **Deduplication BEFORE upload** (saves bandwidth and storage costs)
- **Async processing** with real-time status updates via Firestore listeners
- **Battle-tested libraries** (mailparser, @kenjiuno/msgreader - work flawlessly in Node.js)
- **Email bodies in Storage** (avoids Firestore 1MB document limit)

---

## 📦 Phase 1: Firebase Cloud Functions Setup

### Prerequisites

1. **Firebase Blaze Plan** (required for Cloud Functions)
2. **Firebase CLI** v11.18.0 or later
3. **Node.js 20** runtime

### Initialize Cloud Functions

```bash
# From project root
firebase init functions

# Select:
# - Use existing project
# - Language: JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

This creates:
```
functions/
├── package.json
├── index.js
├── .eslintrc.js
└── node_modules/
```

### Install Required Libraries

```bash
cd functions
npm install @kenjiuno/msgreader mailparser mime-types
npm install firebase-admin@latest firebase-functions@latest
```

**Library Purposes:**
- `@kenjiuno/msgreader` (~150KB) - Parse .msg files (Microsoft Outlook)
- `mailparser` (~200KB) - Parse .eml files (standard email format)
- `mime-types` (~50KB) - MIME type detection for attachments
- `firebase-admin` - Firestore & Storage access
- `firebase-functions` - Cloud Functions runtime

**Total Bundle Size Impact**: ~400KB (plus Firebase SDKs)

### Configure Function Runtime

**File**: `functions/package.json`

```json
{
  "name": "functions",
  "description": "Cloud Functions for ListBot",
  "engines": {
    "node": "20"
  },
  "main": "index.js",
  "dependencies": {
    "@kenjiuno/msgreader": "^1.27.0",
    "mailparser": "^3.7.1",
    "mime-types": "^2.1.35",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
```

---

## 📁 Phase 2: File Structure

### Cloud Functions Structure

```
functions/
├── index.js                              # Main entry point
├── package.json
│
├── email-extraction/
│   ├── index.js                          # Export all functions
│   │
│   ├── triggers/
│   │   └── onEmailFileUploaded.js        # Storage trigger function
│   │
│   ├── parsers/
│   │   ├── msgParser.js                  # .msg file parser
│   │   ├── emlParser.js                  # .eml file parser
│   │   └── emailParserFactory.js         # Router: .msg vs .eml
│   │
│   ├── services/
│   │   ├── emailExtractionService.js     # Core extraction logic
│   │   └── emailStorageService.js        # Firebase Storage operations
│   │
│   └── utils/
│       ├── emailValidation.js            # Size/depth validation
│       └── emailHelpers.js               # Common email utilities
│
└── shared/
    ├── config.js                         # Shared configuration
    └── constants.js                      # Constants (MAX_SIZE, MAX_DEPTH, etc.)
```

### Client-Side Updates (Minimal)

```
src/features/upload/
├── composables/
│   └── useEmailExtractionStatus.js       # NEW: Listen for extraction status
│
└── components/
    └── EmailExtractionStatus.vue         # NEW: Status display component
```

---

## 🗄️ Phase 3: Firestore Schema

### New Collections

#### `emails` Collection (Email message metadata)

```javascript
{
  // Document ID = Auto-generated unique ID
  id: string,                            // Auto-generated

  // Context
  firmId: string,                        // Solo firm = userId
  userId: string,
  matterId: string,                      // Current matter

  // Source tracking
  extractedFromFile: string,             // Hash of .msg/.eml file
  extractionDate: Timestamp,

  // Message type
  messageType: 'native',                 // Always 'native' in v1

  // Email metadata
  subject: string,
  from: {
    name: string | null,
    email: string
  },
  to: Array<{ name: string | null, email: string }>,
  cc: Array<{ name: string | null, email: string }>,
  date: Timestamp,

  // Storage paths (bodies in Firebase Storage)
  bodyTextPath: string,                  // 'firms/{firmId}/emails/{id}/body.txt'
  bodyHtmlPath: string | null,           // 'firms/{firmId}/emails/{id}/body.html'

  // Attachments (references)
  attachments: Array<{
    fileHash: string,                    // Hash in files collection
    fileName: string,
    size: number,
    mimeType: string,
    isDuplicate: boolean,
    storagePath: string | null           // null if duplicate
  }>,

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Update Existing Collections

#### `uploads` Collection (Add email extraction fields)

```javascript
{
  // Existing fields...
  id: string,                            // BLAKE3 hash
  firmId: string,
  sourceFileName: string,
  fileType: string,                      // 'email' for .msg/.eml
  // ... other existing fields

  // NEW: Email extraction status
  hasBeenParsed: boolean,                // false initially
  parsedAt: Timestamp | null,
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed',
  parseError: string | null,
  parseProgress: string | null,          // "Extracting 3 attachments..."

  // NEW: Extraction results
  extractedMessageCount: number,         // Always 1 in v1 (native only)
  extractedAttachmentCount: number,
  extractedMessages: Array<{
    messageId: string,                   // ID in emails collection
    subject: string,
    from: string,
    date: Timestamp
  }>,
  extractedAttachments: Array<{
    fileHash: string,
    fileName: string,
    size: number,
    wasUploaded: boolean,                // false if duplicate
    isDuplicate: boolean,
    nestedEmail: boolean                 // true if .msg/.eml attachment
  }>,

  // NEW: Nested email tracking
  isNestedEmail: boolean,                // true if extracted from another .msg
  parentEmailFile: string | null,        // hash of parent .msg
  nestingDepth: number                   // 0 for top-level, 1+ for nested
}
```

#### `files` Collection (Track extracted attachments)

```javascript
{
  // Existing fields...
  id: string,                            // BLAKE3 hash
  firmId: string,
  sourceFileName: string,
  // ... other existing fields

  // NEW: Email attachment tracking
  isEmailAttachment: boolean,            // true if from email
  extractedFromEmails: string[],         // Array of .msg hashes
  firstSeenInEmail: string | null        // Hash of first .msg
}
```

---

## 🔨 Phase 4: Server-Side Implementation

### Step 1: Constants & Configuration

**File**: `functions/shared/constants.js` (NEW)

```javascript
module.exports = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DEPTH: 10,                    // Max nested email depth
  EMAIL_EXTENSIONS: ['msg', 'eml'],

  PARSE_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
};
```

---

### Step 2: Email Parser Factory

**File**: `functions/email-extraction/parsers/emailParserFactory.js` (NEW)

```javascript
const { parseMsgFile } = require('./msgParser');
const { parseEmlFile } = require('./emlParser');

/**
 * Route to appropriate parser based on file extension
 * @param {Buffer} fileBuffer - File binary data
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} - Parsed email data
 */
async function parseEmailFile(fileBuffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();

  if (ext === 'msg') {
    return await parseMsgFile(fileBuffer);
  } else if (ext === 'eml') {
    return await parseEmlFile(fileBuffer);
  } else {
    throw new Error(`Unsupported email format: ${ext}`);
  }
}

module.exports = { parseEmailFile };
```

---

### Step 3: .msg Parser

**File**: `functions/email-extraction/parsers/msgParser.js` (NEW)

```javascript
const MsgReader = require('@kenjiuno/msgreader');

/**
 * Parse Microsoft Outlook .msg file
 * @param {Buffer} buffer - .msg file binary data
 * @returns {Promise<Object>} - Parsed email structure
 */
async function parseMsgFile(buffer) {
  try {
    const msgReader = new MsgReader(buffer);
    const fileData = msgReader.getFileData();

    return {
      subject: fileData.subject || '(No Subject)',
      from: {
        name: fileData.senderName || null,
        email: fileData.senderEmail || ''
      },
      to: (fileData.recipients || [])
        .filter(r => r.recipType === 1) // To recipients
        .map(r => ({
          name: r.name || null,
          email: r.email || r.smtpAddress || ''
        })),
      cc: (fileData.recipients || [])
        .filter(r => r.recipType === 2) // CC recipients
        .map(r => ({
          name: r.name || null,
          email: r.email || r.smtpAddress || ''
        })),
      date: fileData.creationTime ? new Date(fileData.creationTime) : new Date(),
      bodyHtml: fileData.bodyHTML || null,
      bodyText: fileData.body || '',
      attachments: (fileData.attachments || []).map(att => ({
        fileName: att.fileName || 'unnamed',
        data: att.content,
        size: att.content?.length || 0,
        mimeType: att.mimeType || 'application/octet-stream'
      }))
    };
  } catch (error) {
    throw new Error(`Failed to parse .msg file: ${error.message}`);
  }
}

module.exports = { parseMsgFile };
```

---

### Step 4: .eml Parser

**File**: `functions/email-extraction/parsers/emlParser.js` (NEW)

```javascript
const { simpleParser } = require('mailparser');

/**
 * Parse standard .eml email file
 * @param {Buffer} buffer - .eml file binary data
 * @returns {Promise<Object>} - Parsed email structure
 */
async function parseEmlFile(buffer) {
  try {
    const parsed = await simpleParser(buffer);

    return {
      subject: parsed.subject || '(No Subject)',
      from: {
        name: parsed.from?.value?.[0]?.name || null,
        email: parsed.from?.value?.[0]?.address || ''
      },
      to: (parsed.to?.value || []).map(addr => ({
        name: addr.name || null,
        email: addr.address || ''
      })),
      cc: (parsed.cc?.value || []).map(addr => ({
        name: addr.name || null,
        email: addr.address || ''
      })),
      date: parsed.date || new Date(),
      bodyHtml: parsed.html || null,
      bodyText: parsed.text || '',
      attachments: (parsed.attachments || []).map(att => ({
        fileName: att.filename || 'unnamed',
        data: att.content,
        size: att.size || 0,
        mimeType: att.contentType || 'application/octet-stream'
      }))
    };
  } catch (error) {
    throw new Error(`Failed to parse .eml file: ${error.message}`);
  }
}

module.exports = { parseEmlFile };
```

---

### Step 5: Email Extraction Service (Core Logic)

**File**: `functions/email-extraction/services/emailExtractionService.js` (NEW)

```javascript
const admin = require('firebase-admin');
const { parseEmailFile } = require('../parsers/emailParserFactory');
const { hashBlake3 } = require('../../shared/hashUtils');
const { MAX_FILE_SIZE, MAX_DEPTH, PARSE_STATUS } = require('../../shared/constants');

const db = admin.firestore();
const storage = admin.storage();

/**
 * Process email file and extract messages + attachments
 * Handles recursive extraction for nested .msg/.eml files
 *
 * @param {string} fileHash - BLAKE3 hash of email file
 * @param {Buffer} fileBuffer - Email file binary data
 * @param {string} fileName - Original filename
 * @param {string} firmId - Firm ID
 * @param {string} userId - User ID
 * @param {string} matterId - Matter ID
 * @param {string|null} parentEmailHash - Parent .msg hash (for nested emails)
 * @param {number} depth - Nesting depth (0 for top-level)
 * @returns {Promise<Object>} - Extraction result
 */
async function processEmailFile(
  fileHash,
  fileBuffer,
  fileName,
  firmId,
  userId,
  matterId,
  parentEmailHash = null,
  depth = 0
) {
  const uploadRef = db.collection('uploads').doc(fileHash);

  try {
    // Validation
    if (depth >= MAX_DEPTH) {
      throw new Error('Email nesting exceeded maximum depth of 10');
    }

    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      throw new Error('Email file exceeds 100MB limit');
    }

    // Update status: Processing
    await uploadRef.update({
      parseStatus: PARSE_STATUS.PROCESSING,
      parseProgress: 'Parsing email file...'
    });

    // 1. Parse email
    const parsed = await parseEmailFile(fileBuffer, fileName);

    // 2. Validate attachment sizes
    for (const att of parsed.attachments) {
      if (att.size > MAX_FILE_SIZE) {
        throw new Error(`Attachment "${att.fileName}" exceeds 100MB limit`);
      }
    }

    await uploadRef.update({
      parseProgress: `Extracting ${parsed.attachments.length} attachments...`
    });

    // 3. Process attachments
    const processedAttachments = [];
    const bucket = storage.bucket();

    for (const attachment of parsed.attachments) {
      const attHash = await hashBlake3(attachment.data);
      const isNestedEmail = /\.(msg|eml)$/i.test(attachment.fileName);

      if (isNestedEmail) {
        // Nested email: upload and recurse
        const nestedPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
        await bucket.file(nestedPath).save(attachment.data);

        await db.collection('uploads').doc(attHash).set({
          id: attHash,
          firmId,
          userId,
          matterId,
          sourceFileName: attachment.fileName,
          fileType: 'email',
          fileSize: attachment.size,
          storagePath: nestedPath,
          isNestedEmail: true,
          parentEmailFile: fileHash,
          nestingDepth: depth + 1,
          hasBeenParsed: false,
          parseStatus: PARSE_STATUS.PENDING,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Recursive extraction
        await processEmailFile(
          attHash,
          attachment.data,
          attachment.fileName,
          firmId,
          userId,
          matterId,
          fileHash,
          depth + 1
        );

        processedAttachments.push({
          fileHash: attHash,
          fileName: attachment.fileName,
          size: attachment.size,
          mimeType: attachment.mimeType,
          wasUploaded: true,
          isDuplicate: false,
          nestedEmail: true
        });

      } else {
        // Regular attachment
        const existingDoc = await db.collection('files').doc(attHash).get();
        const isDuplicate = existingDoc.exists;

        if (!isDuplicate) {
          // Upload new attachment
          const attPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
          await bucket.file(attPath).save(attachment.data);

          await db.collection('files').doc(attHash).set({
            id: attHash,
            firmId,
            userId,
            matterId,
            sourceFileName: attachment.fileName,
            fileType: getFileType(attachment.fileName),
            fileSize: attachment.size,
            storagePath: attPath,
            isEmailAttachment: true,
            extractedFromEmails: [fileHash],
            firstSeenInEmail: fileHash,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Update existing file record
          await db.collection('files').doc(attHash).update({
            extractedFromEmails: admin.firestore.FieldValue.arrayUnion(fileHash)
          });
        }

        processedAttachments.push({
          fileHash: attHash,
          fileName: attachment.fileName,
          size: attachment.size,
          mimeType: attachment.mimeType,
          wasUploaded: !isDuplicate,
          isDuplicate,
          nestedEmail: false
        });
      }
    }

    await uploadRef.update({
      parseProgress: 'Saving email message...'
    });

    // 4. Save email message to Firestore & Storage
    const messageRef = db.collection('emails').doc();
    const messageId = messageRef.id;

    // Save body text to Storage
    const bodyTextPath = `firms/${firmId}/emails/${messageId}/body.txt`;
    await bucket.file(bodyTextPath).save(
      Buffer.from(parsed.bodyText, 'utf-8')
    );

    // Save body HTML to Storage (if exists)
    let bodyHtmlPath = null;
    if (parsed.bodyHtml) {
      bodyHtmlPath = `firms/${firmId}/emails/${messageId}/body.html`;
      await bucket.file(bodyHtmlPath).save(
        Buffer.from(parsed.bodyHtml, 'utf-8')
      );
    }

    // Save message metadata to Firestore
    await messageRef.set({
      id: messageId,
      firmId,
      userId,
      matterId,
      extractedFromFile: fileHash,
      extractionDate: admin.firestore.FieldValue.serverTimestamp(),
      messageType: 'native',
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      cc: parsed.cc,
      date: admin.firestore.Timestamp.fromDate(parsed.date),
      bodyTextPath,
      bodyHtmlPath,
      attachments: processedAttachments.map(att => ({
        fileHash: att.fileHash,
        fileName: att.fileName,
        size: att.size,
        mimeType: att.mimeType,
        isDuplicate: att.isDuplicate,
        storagePath: att.wasUploaded
          ? `firms/${firmId}/matters/${matterId}/uploads/${att.fileHash}`
          : null
      })),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Update original .msg file record
    await uploadRef.update({
      hasBeenParsed: true,
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      parseStatus: PARSE_STATUS.COMPLETED,
      parseProgress: 'Email extraction complete',
      extractedMessageCount: 1,
      extractedAttachmentCount: processedAttachments.length,
      extractedMessages: [{
        messageId,
        subject: parsed.subject,
        from: parsed.from.email,
        date: admin.firestore.Timestamp.fromDate(parsed.date)
      }],
      extractedAttachments: processedAttachments
    });

    console.log(`Successfully extracted email ${fileHash}`);

    return {
      success: true,
      messageId,
      attachmentCount: processedAttachments.length
    };

  } catch (error) {
    console.error(`Email extraction failed for ${fileHash}:`, error);

    // Mark as failed
    await uploadRef.update({
      hasBeenParsed: false,
      parseStatus: PARSE_STATUS.FAILED,
      parseError: error.message,
      parseProgress: null
    });

    throw error;
  }
}

/**
 * Detect file type from filename extension
 * @param {string} fileName - Filename
 * @returns {string} - File type
 */
function getFileType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['msg', 'eml'].includes(ext)) return 'email';
  return 'other';
}

module.exports = { processEmailFile };
```

---

### Step 6: Storage Trigger Function

**File**: `functions/email-extraction/triggers/onEmailFileUploaded.js` (NEW)

```javascript
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const admin = require('firebase-admin');
const { processEmailFile } = require('../services/emailExtractionService');
const { EMAIL_EXTENSIONS } = require('../../shared/constants');

const db = admin.firestore();
const storage = admin.storage();

/**
 * Triggered when a file is uploaded to Storage
 * Checks if it's an email file and triggers extraction
 */
exports.onEmailFileUploaded = onObjectFinalized({
  // Configure for large files
  memory: '2GiB',
  timeoutSeconds: 300,  // 5 minutes
  maxInstances: 10,      // Prevent too many concurrent extractions
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  console.log('File uploaded:', filePath);

  // Check if it's an email file
  const ext = filePath.toLowerCase().split('.').pop();
  if (!EMAIL_EXTENSIONS.includes(ext)) {
    console.log('Not an email file, skipping');
    return null;
  }

  // Parse storage path: firms/{firmId}/matters/{matterId}/uploads/{fileHash}
  const pathParts = filePath.split('/');
  if (pathParts.length !== 5 || pathParts[0] !== 'firms' || pathParts[2] !== 'matters') {
    console.log('Unexpected storage path format, skipping');
    return null;
  }

  const firmId = pathParts[1];
  const matterId = pathParts[3];
  const fileHash = pathParts[4];

  // Check if already processed (prevent infinite loops)
  const uploadDoc = await db.collection('uploads').doc(fileHash).get();
  if (!uploadDoc.exists) {
    console.log('Upload document not found, skipping');
    return null;
  }

  const uploadData = uploadDoc.data();
  if (uploadData.hasBeenParsed || uploadData.parseStatus === 'processing') {
    console.log('Email already processed or processing, skipping');
    return null;
  }

  try {
    // Download file from Storage
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    const [fileBuffer] = await file.download();

    console.log(`Starting extraction for ${fileHash}`);

    // Process the email
    await processEmailFile(
      fileHash,
      fileBuffer,
      uploadData.sourceFileName,
      firmId,
      uploadData.userId,
      matterId,
      uploadData.parentEmailFile || null,
      uploadData.nestingDepth || 0
    );

    console.log(`Extraction completed for ${fileHash}`);
    return { success: true };

  } catch (error) {
    console.error(`Extraction failed for ${fileHash}:`, error);
    return { success: false, error: error.message };
  }
});
```

---

### Step 7: Main Entry Point

**File**: `functions/index.js`

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Export email extraction functions
const { onEmailFileUploaded } = require('./email-extraction/triggers/onEmailFileUploaded');

exports.onEmailFileUploaded = onEmailFileUploaded;
```

---

### Step 8: BLAKE3 Hash Utility

**File**: `functions/shared/hashUtils.js` (NEW)

```javascript
const crypto = require('crypto');

/**
 * Hash data using BLAKE3 (using SHA256 as fallback since BLAKE3 needs native module)
 * TODO: Consider using blake3-wasm or native blake3 module for true BLAKE3
 * @param {Buffer} data - Data to hash
 * @returns {Promise<string>} - Hash string
 */
async function hashBlake3(data) {
  // Using SHA256 as fallback - you may want to install blake3 npm package
  // For now, to match client-side hashing, ensure consistency
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

module.exports = { hashBlake3 };
```

**Note**: You should ensure the hash algorithm matches what's used on the client side. If client uses BLAKE3, install the `blake3` npm package or `blake3-wasm`.

---

## 🖥️ Phase 5: Client-Side Integration

### Step 1: Email Extraction Status Composable

**File**: `src/features/upload/composables/useEmailExtractionStatus.js` (NEW)

```javascript
import { ref, watch } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Listen to email extraction status in real-time
 * @param {string} fileHash - File hash to monitor
 * @returns {Object} - Status data and listeners
 */
export function useEmailExtractionStatus(fileHash) {
  const status = ref('pending');
  const progress = ref(null);
  const error = ref(null);
  const messageCount = ref(0);
  const attachmentCount = ref(0);
  const isProcessing = ref(false);

  let unsubscribe = null;

  // Watch for file hash changes
  watch(() => fileHash, (hash) => {
    if (!hash) return;

    // Clean up previous listener
    if (unsubscribe) unsubscribe();

    // Listen to upload document
    const uploadRef = doc(db, 'uploads', hash);
    unsubscribe = onSnapshot(uploadRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      status.value = data.parseStatus || 'pending';
      progress.value = data.parseProgress || null;
      error.value = data.parseError || null;
      messageCount.value = data.extractedMessageCount || 0;
      attachmentCount.value = data.extractedAttachmentCount || 0;
      isProcessing.value = data.parseStatus === 'processing';
    });
  }, { immediate: true });

  // Cleanup on unmount
  const cleanup = () => {
    if (unsubscribe) unsubscribe();
  };

  return {
    status,
    progress,
    error,
    messageCount,
    attachmentCount,
    isProcessing,
    cleanup
  };
}
```

---

### Step 2: Email Extraction Status Component

**File**: `src/features/upload/components/EmailExtractionStatus.vue` (NEW)

```vue
<template>
  <div v-if="isEmailFile" class="email-extraction-status">
    <!-- Processing State -->
    <div v-if="isProcessing" class="flex items-center gap-2">
      <v-progress-circular
        indeterminate
        size="16"
        width="2"
        color="primary"
      />
      <span class="text-sm text-gray-600">{{ progress || 'Processing email...' }}</span>
    </div>

    <!-- Completed State -->
    <div v-else-if="status === 'completed'" class="flex items-center gap-2">
      <v-icon size="small" color="success">mdi-check-circle</v-icon>
      <span class="text-sm text-gray-600">
        Extracted {{ messageCount }} message{{ messageCount !== 1 ? 's' : '' }}
        and {{ attachmentCount }} attachment{{ attachmentCount !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Failed State -->
    <div v-else-if="status === 'failed'" class="flex items-center gap-2">
      <v-icon size="small" color="error">mdi-alert-circle</v-icon>
      <span class="text-sm text-red-600">{{ error || 'Extraction failed' }}</span>
    </div>

    <!-- Pending State -->
    <div v-else class="flex items-center gap-2">
      <v-icon size="small" color="gray">mdi-clock-outline</v-icon>
      <span class="text-sm text-gray-500">Pending extraction...</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue';
import { useEmailExtractionStatus } from '../composables/useEmailExtractionStatus';

const props = defineProps({
  fileHash: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  }
});

const isEmailFile = computed(() => props.fileType === 'email');

const {
  status,
  progress,
  error,
  messageCount,
  attachmentCount,
  isProcessing,
  cleanup
} = useEmailExtractionStatus(props.fileHash);

onUnmounted(() => {
  cleanup();
});
</script>
```

---

### Step 3: Update File Type Detection

**File**: `src/features/upload/utils/fileTypeChecker.js`

```javascript
// Add to existing detectFileType function
export function detectFileType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();

  // NEW: Email types
  if (ext === 'msg' || ext === 'eml') return 'email';

  // Existing types...
  if (ext === 'pdf') return 'pdf';
  // ... etc
}
```

---

## 🧪 Phase 6: Testing Strategy

### Unit Tests (Cloud Functions)

**File**: `functions/test/email-extraction.test.js` (NEW)

```javascript
const { expect } = require('chai');
const { parseMsgFile } = require('../email-extraction/parsers/msgParser');
const { parseEmlFile } = require('../email-extraction/parsers/emlParser');
const fs = require('fs');

describe('Email Extraction', () => {
  describe('msgParser', () => {
    it('should extract subject from .msg file', async () => {
      const buffer = fs.readFileSync('./test/fixtures/simple.msg');
      const result = await parseMsgFile(buffer);
      expect(result.subject).to.equal('Test Email');
    });

    it('should extract attachments', async () => {
      const buffer = fs.readFileSync('./test/fixtures/with-attachments.msg');
      const result = await parseMsgFile(buffer);
      expect(result.attachments).to.have.lengthOf(2);
    });

    it('should handle missing subject', async () => {
      const buffer = fs.readFileSync('./test/fixtures/no-subject.msg');
      const result = await parseMsgFile(buffer);
      expect(result.subject).to.equal('(No Subject)');
    });
  });

  describe('emlParser', () => {
    it('should extract subject from .eml file', async () => {
      const buffer = fs.readFileSync('./test/fixtures/simple.eml');
      const result = await parseEmlFile(buffer);
      expect(result.subject).to.equal('Test Email');
    });
  });
});
```

### Integration Tests

Test with real .msg/.eml files from your legal work in Firebase Emulator Suite.

---

## 🔒 Phase 7: Security Rules

### Firestore Rules

```javascript
// firestore.rules

// Email messages
match /emails/{messageId} {
  allow read: if request.auth != null
    && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.userId;
}

// Upload documents (add email extraction fields)
match /uploads/{fileHash} {
  allow update: if request.auth != null
    && request.auth.uid == resource.data.userId
    && onlyUpdatingEmailExtractionFields();
}

function onlyUpdatingEmailExtractionFields() {
  return request.resource.data.diff(resource.data)
    .affectedKeys()
    .hasOnly(['hasBeenParsed', 'parsedAt', 'parseStatus',
              'parseProgress', 'extractedMessageCount', 'extractedMessages',
              'extractedAttachments', 'parseError']);
}
```

### Storage Rules

```javascript
// storage.rules

// Email message bodies
match /firms/{firmId}/emails/{messageId}/{fileName} {
  allow read: if request.auth != null
    && request.auth.uid == getFirmUserId(firmId);
  allow write: if request.auth != null
    && request.auth.uid == getFirmUserId(firmId);
}
```

---

## 🚀 Phase 8: Deployment

### Step 1: Deploy Cloud Functions

```bash
# From project root
cd functions
npm install

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:onEmailFileUploaded
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Step 4: Monitor Logs

```bash
# Watch function logs in real-time
firebase functions:log --only onEmailFileUploaded

# Or view in Firebase Console
# https://console.firebase.google.com/project/YOUR-PROJECT/functions/logs
```

---

## 📊 Phase 9: Monitoring & Cost Management

### Cloud Functions Dashboard

Monitor in Firebase Console:
- **Invocations**: How many emails processed
- **Execution time**: Average processing duration
- **Memory usage**: Peak memory consumption
- **Error rate**: Failed extractions

### Cost Estimation

**Conservative Estimate** (100 email uploads/month):
- Function invocations: 100 × $0.40/million = $0.00004
- Compute time (avg 10s each, 2GB memory): 100 × 10s × $0.0000025/GB-second × 2GB = $0.005
- Storage downloads (100MB avg): 100 × 0.1GB × $0.12/GB = $1.20
- **Total**: ~$1.21/month

**High Volume** (1000 emails/month):
- **Total**: ~$12.10/month

Extremely affordable compared to the reliability and UX benefits.

---

## 📈 Rollout Plan

1. **Deploy to Dev** - Test with Firebase Emulator Suite
2. **Test with Sample Files** - Upload test .msg/.eml files
3. **Monitor Logs** - Verify extraction working correctly
4. **Internal Testing** - Use on real case files (your work)
5. **Monitor Errors** - Check `parseStatus: 'failed'` records
6. **Deploy to Production** - All users get feature immediately

---

## 🎯 Success Criteria

- ✅ .msg and .eml files upload successfully
- ✅ Cloud Function triggers automatically
- ✅ Native message extracted to `emails` collection
- ✅ Attachments deduplicated correctly
- ✅ Nested .msg files process up to 10 levels
- ✅ Files >100MB rejected with clear error
- ✅ Failed extractions don't block file upload
- ✅ UI shows real-time progress updates
- ✅ Extraction completes within 30 seconds for typical emails
- ✅ Monthly costs remain under $20 for reasonable usage

---

## 🚀 Implementation Order (Recommended)

1. **Initialize Cloud Functions** (Phase 1)
2. **Build parsers** (Phase 4, Steps 2-4)
3. **Test parsers locally** with sample files
4. **Build extraction service** (Phase 4, Step 5)
5. **Create Storage trigger** (Phase 4, Step 6)
6. **Deploy to emulator** and test
7. **Build client-side status UI** (Phase 5)
8. **Deploy to dev** (Phase 8)
9. **Deploy security rules** (Phase 7)
10. **Deploy to production**

**Total Estimated Time**: 8-10 hours

---

## 📝 Key Differences from Client-Side Plan

| Aspect | Client-Side (v1) | **Server-Side (v2)** |
|--------|------------------|---------------------|
| **Libraries** | Browser-compatible alternatives | ✅ Original Node.js libraries |
| **Reliability** | Browser compatibility issues | ✅ Consistent Node.js environment |
| **Performance** | UI blocking, memory constraints | ✅ Background processing |
| **Large Files** | Risk of browser crashes | ✅ Cloud Functions handle 100MB easily |
| **Error Handling** | Limited browser debugging | ✅ Full logging and retry capability |
| **UI Updates** | Immediate (blocking) | ✅ Real-time (non-blocking) |
| **Cost** | Free | ✅ ~$1-20/month (minimal) |
| **Maintenance** | Complex polyfills/workarounds | ✅ Standard Node.js code |

---

## 🔧 Future Enhancements (Post-v1)

- **Retry Logic**: Auto-retry failed extractions
- **Email Threading**: Link related emails together
- **Full-Text Search**: Index email bodies in Algolia/Typesense
- **Quoted Message Extraction**: Parse reply chains (v2)
- **Email Analytics**: Track communication patterns
- **Large File Handling**: Process >100MB files via streaming

---

**End of Implementation Plan (Server-Side v2)**

---

## Additional Resources

- [Cloud Storage triggers | Firebase](https://firebase.google.com/docs/functions/gcp-storage-events)
- [Firebase Cloud Functions Quotas](https://firebase.google.com/docs/functions/quotas)
- [MailParser Documentation](https://nodemailer.com/extras/mailparser)
- [@kenjiuno/msgreader npm](https://www.npmjs.com/package/@kenjiuno/msgreader)
