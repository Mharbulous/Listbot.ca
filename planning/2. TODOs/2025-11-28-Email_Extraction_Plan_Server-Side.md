# Email Extraction Implementation Plan (v3 - Server-Side Refined)

**Date**: 2025-11-28
**Status**: Ready for Implementation
**Priority**: High
**Branch**: `claude/email-extraction-server-side-<session-id>`

---

## 📋 Revision History

| Version | Date | Changes |
|---------|------|---------|
| v3 | 2025-11-28 | Firestore trigger (primary), BLAKE3 consistency fix, race condition protection, retry mechanism, schema improvements |
| v2 | 2025-11-28 | Server-side using Cloud Functions |
| v1 | 2025-11-28 | ❌ Deprecated (client-side browser compatibility issues) |

---

## ✅ Decision Summary

### Finalized Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Trigger Mechanism** | Firestore `onCreate` (primary) | More reliable than Storage triggers; cleaner integration |
| **Hash Algorithm** | BLAKE3 (matching client) | **Critical**: Must match client-side for deduplication |
| **Storage Strategy** | Bodies → Storage; Metadata → Firestore | Avoids 1MB document limit |
| **File Formats** | .msg and .eml | Covers Outlook and standard email |
| **Message Extraction** | Native only (v1) | Skip quoted messages initially |
| **Failure Handling** | Upload succeeds, mark `hasBeenParsed: false` | Never block uploads |
| **Size Limits** | 100MB max (file and attachments) | Cloud Functions memory safety |
| **Depth Limit** | 10 levels nested .msg | Prevent infinite recursion |
| **Race Protection** | Firestore transaction locking | Prevent duplicate processing |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                               │
├─────────────────────────────────────────────────────────────────┤
│  1. User drops .msg/.eml file                                   │
│  2. Client hashes with BLAKE3                                   │
│  3. Client uploads to Storage                                   │
│  4. Client creates Firestore doc (fileType: 'email')            │
│  5. Client listens for parseStatus updates                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUD FUNCTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│  onUploadCreated (Firestore trigger)                            │
│    ├── Claim processing lock (transaction)                      │
│    ├── Download file from Storage                               │
│    ├── Parse email (.msg or .eml)                               │
│    ├── Hash attachments with BLAKE3                             │
│    ├── Deduplicate against existing files                       │
│    ├── Upload new attachments to Storage                        │
│    ├── Create emails collection doc                             │
│    ├── Update uploads doc with results                          │
│    └── Recurse for nested .msg/.eml                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Firebase Cloud Functions Setup

### Prerequisites

- Firebase Blaze Plan (required for Cloud Functions)
- Firebase CLI v11.18.0+
- Node.js 20 runtime

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

### Install Dependencies

```bash
cd functions
npm install blake3 @kenjiuno/msgreader mailparser mime-types
npm install firebase-admin@latest firebase-functions@latest
```

**Library Purposes:**

| Library | Size | Purpose |
|---------|------|---------|
| `blake3` | ~2MB (native) | **Critical**: Hash consistency with client |
| `@kenjiuno/msgreader` | ~150KB | Parse .msg files (Microsoft Outlook) |
| `mailparser` | ~200KB | Parse .eml files (standard email format) |
| `mime-types` | ~50KB | MIME type detection for attachments |

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
    "blake3": "^2.1.7",
    "@kenjiuno/msgreader": "^1.27.0",
    "mailparser": "^3.7.1",
    "mime-types": "^2.1.35",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "chai": "^4.3.7",
    "mocha": "^10.2.0",
    "firebase-functions-test": "^3.1.0"
  },
  "scripts": {
    "test": "mocha --exit 'test/**/*.test.js'"
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
│   │   ├── onUploadCreated.js            # PRIMARY: Firestore trigger
│   │   ├── retryFailedExtractions.js     # Scheduled retry
│   │   └── manualRetry.js                # Callable function for UI retry
│   │
│   ├── parsers/
│   │   ├── msgParser.js                  # .msg file parser
│   │   ├── emlParser.js                  # .eml file parser
│   │   └── emailParserFactory.js         # Router: .msg vs .eml
│   │
│   ├── services/
│   │   ├── emailExtractionService.js     # Core extraction logic
│   │   ├── processingLock.js             # Transaction-based locking
│   │   └── attachmentProcessor.js        # Attachment handling
│   │
│   └── utils/
│       ├── hashUtils.js                  # BLAKE3 hashing (CRITICAL)
│       ├── emailValidation.js            # Size/depth validation
│       └── fileTypeUtils.js              # File type detection
│
└── shared/
    └── constants.js                      # Shared constants
```

### Client-Side Updates

```
src/features/upload/
├── composables/
│   └── useEmailExtractionStatus.js       # Real-time status listener
│
├── components/
│   └── EmailExtractionStatus.vue         # Status display component
│
└── utils/
    └── fileTypeChecker.js                # Add email detection
```

---

## 🗄️ Phase 3: Firestore Schema

### `emails` Collection (Email Message Metadata)

```javascript
{
  // Identity
  id: string,                            // Auto-generated
  
  // Context
  firmId: string,                        // Solo firm = userId
  userId: string,
  matterId: string,
  
  // Source tracking
  extractedFromFile: string,             // BLAKE3 hash of .msg/.eml
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
  
  // Search optimization (denormalized)
  subjectLower: string,                  // Lowercase for search
  fromEmail: string,                     // Denormalized for queries
  toEmails: string[],                    // Array of recipient emails
  hasAttachments: boolean,
  attachmentCount: number,
  bodyPreview: string,                   // First 500 chars
  
  // Storage paths (bodies in Firebase Storage)
  bodyTextPath: string,                  // 'firms/{firmId}/emails/{id}/body.txt'
  bodyHtmlPath: string | null,           // 'firms/{firmId}/emails/{id}/body.html'
  
  // Attachments (references)
  attachments: Array<{
    fileHash: string,                    // BLAKE3 hash
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

### `uploads` Collection (Add Email Extraction Fields)

```javascript
{
  // Existing fields...
  id: string,                            // BLAKE3 hash
  firmId: string,
  userId: string,
  matterId: string,
  sourceFileName: string,
  fileType: string,                      // 'email' for .msg/.eml
  fileSize: number,
  storagePath: string,
  uploadedAt: Timestamp,
  
  // Email extraction status
  hasBeenParsed: boolean,                // false initially
  parsedAt: Timestamp | null,
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed',
  parseProgress: string | null,          // "Extracting 3 attachments..."
  parseError: string | null,
  parseStartedAt: Timestamp | null,      // For timeout detection
  
  // Retry tracking
  retryCount: number,                    // Default: 0, max: 3
  lastRetryAt: Timestamp | null,
  
  // Extraction results
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
  
  // Nested email tracking
  isNestedEmail: boolean,                // true if extracted from another .msg
  parentEmailFile: string | null,        // BLAKE3 hash of parent
  nestingDepth: number                   // 0 for top-level, 1+ for nested
}
```

### `files` Collection (Track Extracted Attachments)

```javascript
{
  // Existing fields...
  id: string,                            // BLAKE3 hash
  firmId: string,
  userId: string,
  matterId: string,
  sourceFileName: string,
  fileType: string,
  fileSize: number,
  storagePath: string,
  uploadedAt: Timestamp,
  
  // Email attachment tracking
  isEmailAttachment: boolean,            // true if from email
  extractedFromEmails: string[],         // Array of .msg/.eml hashes
  firstSeenInEmail: string | null        // Hash of first .msg
}
```

---

## 🔨 Phase 4: Server-Side Implementation

### Step 1: Constants

**File**: `functions/shared/constants.js`

```javascript
module.exports = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,     // 100MB
  MAX_DEPTH: 10,                         // Max nested email depth
  MAX_RETRY_COUNT: 3,                    // Max retry attempts
  MAX_BODY_PREVIEW: 500,                 // Characters for preview
  MAX_BODY_SIZE: 1024 * 1024,            // 1MB body truncation
  EMAIL_EXTENSIONS: ['msg', 'eml'],
  
  PARSE_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },
  
  FILE_TYPES: {
    PDF: 'pdf',
    IMAGE: 'image',
    WORD: 'word',
    EXCEL: 'excel',
    EMAIL: 'email',
    OTHER: 'other'
  }
};
```

---

### Step 2: BLAKE3 Hash Utility (CRITICAL)

**File**: `functions/email-extraction/utils/hashUtils.js`

```javascript
/**
 * BLAKE3 hashing utility
 * CRITICAL: Must match client-side hashing exactly for deduplication
 */

const blake3 = require('blake3');

/**
 * Hash data using BLAKE3
 * @param {Buffer} data - Data to hash
 * @returns {string} - Hex-encoded hash
 */
function hashBlake3(data) {
  const hasher = blake3.createHash();
  hasher.update(data);
  return hasher.digest('hex');
}

/**
 * Verify hash consistency (for testing)
 * @param {Buffer} data - Data to hash
 * @param {string} expectedHash - Expected hash
 * @returns {boolean} - True if hashes match
 */
function verifyHash(data, expectedHash) {
  const computed = hashBlake3(data);
  return computed === expectedHash;
}

module.exports = { hashBlake3, verifyHash };
```

---

### Step 3: Processing Lock (Race Condition Protection)

**File**: `functions/email-extraction/services/processingLock.js`

```javascript
/**
 * Transaction-based processing lock
 * Prevents duplicate processing of the same file
 */

const admin = require('firebase-admin');
const { PARSE_STATUS } = require('../../shared/constants');

const db = admin.firestore();

/**
 * Attempt to claim processing lock for a file
 * Uses Firestore transaction to prevent race conditions
 * 
 * @param {string} fileHash - File hash to lock
 * @returns {Promise<{success: boolean, data: Object|null}>}
 */
async function claimProcessingLock(fileHash) {
  const uploadRef = db.collection('uploads').doc(fileHash);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(uploadRef);
      
      if (!doc.exists) {
        return { success: false, reason: 'Document not found' };
      }
      
      const data = doc.data();
      
      // Already processed or currently processing
      if (data.hasBeenParsed) {
        return { success: false, reason: 'Already parsed' };
      }
      
      if (data.parseStatus === PARSE_STATUS.PROCESSING) {
        // Check for stale lock (older than 10 minutes)
        const startedAt = data.parseStartedAt?.toDate();
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (startedAt && startedAt > tenMinutesAgo) {
          return { success: false, reason: 'Already processing' };
        }
        // Stale lock - proceed to claim
      }
      
      // Claim the lock
      transaction.update(uploadRef, {
        parseStatus: PARSE_STATUS.PROCESSING,
        parseStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        parseProgress: 'Starting extraction...'
      });
      
      return { success: true, data };
    });
    
    return result;
    
  } catch (error) {
    console.error(`Failed to claim lock for ${fileHash}:`, error);
    return { success: false, reason: error.message };
  }
}

/**
 * Release processing lock (on failure)
 * 
 * @param {string} fileHash - File hash to unlock
 * @param {string} error - Error message
 * @param {boolean} incrementRetry - Whether to increment retry count
 */
async function releaseProcessingLock(fileHash, error, incrementRetry = true) {
  const uploadRef = db.collection('uploads').doc(fileHash);
  
  const updateData = {
    parseStatus: PARSE_STATUS.FAILED,
    parseError: error,
    parseProgress: null
  };
  
  if (incrementRetry) {
    updateData.retryCount = admin.firestore.FieldValue.increment(1);
    updateData.lastRetryAt = admin.firestore.FieldValue.serverTimestamp();
  }
  
  await uploadRef.update(updateData);
}

/**
 * Mark processing complete
 * 
 * @param {string} fileHash - File hash
 * @param {Object} results - Extraction results
 */
async function markProcessingComplete(fileHash, results) {
  const uploadRef = db.collection('uploads').doc(fileHash);
  
  await uploadRef.update({
    hasBeenParsed: true,
    parsedAt: admin.firestore.FieldValue.serverTimestamp(),
    parseStatus: PARSE_STATUS.COMPLETED,
    parseProgress: 'Extraction complete',
    parseError: null,
    extractedMessageCount: results.messageCount,
    extractedAttachmentCount: results.attachmentCount,
    extractedMessages: results.messages,
    extractedAttachments: results.attachments
  });
}

module.exports = {
  claimProcessingLock,
  releaseProcessingLock,
  markProcessingComplete
};
```

---

### Step 4: Email Parser Factory

**File**: `functions/email-extraction/parsers/emailParserFactory.js`

```javascript
/**
 * Email parser factory
 * Routes to appropriate parser based on file extension
 */

// Lazy-load parsers to reduce cold start time
let msgParser = null;
let emlParser = null;

/**
 * Parse email file
 * @param {Buffer} fileBuffer - File binary data
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} - Parsed email data
 */
async function parseEmailFile(fileBuffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  
  if (ext === 'msg') {
    if (!msgParser) {
      msgParser = require('./msgParser');
    }
    return await msgParser.parseMsgFile(fileBuffer);
    
  } else if (ext === 'eml') {
    if (!emlParser) {
      emlParser = require('./emlParser');
    }
    return await emlParser.parseEmlFile(fileBuffer);
    
  } else {
    throw new Error(`Unsupported email format: ${ext}`);
  }
}

/**
 * Check if file is an email type
 * @param {string} fileName - Filename to check
 * @returns {boolean}
 */
function isEmailFile(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  return ['msg', 'eml'].includes(ext);
}

module.exports = { parseEmailFile, isEmailFile };
```

---

### Step 5: .msg Parser

**File**: `functions/email-extraction/parsers/msgParser.js`

```javascript
/**
 * Microsoft Outlook .msg file parser
 */

const MsgReader = require('@kenjiuno/msgreader').default;

/**
 * Parse .msg file
 * @param {Buffer} buffer - .msg file binary data
 * @returns {Promise<Object>} - Parsed email structure
 */
async function parseMsgFile(buffer) {
  try {
    const msgReader = new MsgReader(buffer);
    const fileData = msgReader.getFileData();
    
    // Extract recipients by type
    const recipients = fileData.recipients || [];
    const toRecipients = recipients
      .filter(r => r.recipType === 1)
      .map(r => ({
        name: r.name || null,
        email: r.email || r.smtpAddress || ''
      }));
    
    const ccRecipients = recipients
      .filter(r => r.recipType === 2)
      .map(r => ({
        name: r.name || null,
        email: r.email || r.smtpAddress || ''
      }));
    
    // Extract attachments
    const attachments = (fileData.attachments || []).map(att => {
      // Get attachment content
      let content = att.content;
      if (!content && att.dataId !== undefined) {
        content = msgReader.getAttachment(att.dataId).content;
      }
      
      return {
        fileName: att.fileName || att.name || 'unnamed',
        data: content ? Buffer.from(content) : Buffer.alloc(0),
        size: content?.length || 0,
        mimeType: att.mimeType || 'application/octet-stream'
      };
    });
    
    return {
      subject: fileData.subject || '(No Subject)',
      from: {
        name: fileData.senderName || null,
        email: fileData.senderEmail || fileData.senderSmtpAddress || ''
      },
      to: toRecipients,
      cc: ccRecipients,
      date: fileData.creationTime 
        ? new Date(fileData.creationTime) 
        : (fileData.messageDeliveryTime 
          ? new Date(fileData.messageDeliveryTime) 
          : new Date()),
      bodyHtml: fileData.bodyHTML || null,
      bodyText: fileData.body || '',
      attachments
    };
    
  } catch (error) {
    throw new Error(`Failed to parse .msg file: ${error.message}`);
  }
}

module.exports = { parseMsgFile };
```

---

### Step 6: .eml Parser

**File**: `functions/email-extraction/parsers/emlParser.js`

```javascript
/**
 * Standard .eml email file parser
 */

const { simpleParser } = require('mailparser');

/**
 * Parse .eml file
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
        size: att.size || att.content?.length || 0,
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

### Step 7: File Type Utilities

**File**: `functions/email-extraction/utils/fileTypeUtils.js`

```javascript
/**
 * File type detection utilities
 */

const { FILE_TYPES } = require('../../shared/constants');

/**
 * Detect file type from filename
 * @param {string} fileName - Filename
 * @returns {string} - File type constant
 */
function getFileType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  
  const typeMap = {
    pdf: FILE_TYPES.PDF,
    jpg: FILE_TYPES.IMAGE,
    jpeg: FILE_TYPES.IMAGE,
    png: FILE_TYPES.IMAGE,
    gif: FILE_TYPES.IMAGE,
    webp: FILE_TYPES.IMAGE,
    doc: FILE_TYPES.WORD,
    docx: FILE_TYPES.WORD,
    xls: FILE_TYPES.EXCEL,
    xlsx: FILE_TYPES.EXCEL,
    msg: FILE_TYPES.EMAIL,
    eml: FILE_TYPES.EMAIL
  };
  
  return typeMap[ext] || FILE_TYPES.OTHER;
}

module.exports = { getFileType };
```

---

### Step 8: Email Extraction Service (Core Logic)

**File**: `functions/email-extraction/services/emailExtractionService.js`

```javascript
/**
 * Core email extraction service
 * Handles parsing, attachment processing, and storage
 */

const admin = require('firebase-admin');
const { parseEmailFile, isEmailFile } = require('../parsers/emailParserFactory');
const { hashBlake3 } = require('../utils/hashUtils');
const { getFileType } = require('../utils/fileTypeUtils');
const { 
  claimProcessingLock, 
  releaseProcessingLock, 
  markProcessingComplete 
} = require('./processingLock');
const { 
  MAX_FILE_SIZE, 
  MAX_DEPTH, 
  MAX_BODY_PREVIEW, 
  MAX_BODY_SIZE,
  PARSE_STATUS 
} = require('../../shared/constants');

const db = admin.firestore();
const storage = admin.storage();

/**
 * Process email file and extract messages + attachments
 * 
 * @param {string} fileHash - BLAKE3 hash of email file
 * @param {Object} uploadData - Upload document data
 * @returns {Promise<Object>} - Extraction result
 */
async function processEmailFile(fileHash, uploadData) {
  const { 
    firmId, 
    userId, 
    matterId, 
    sourceFileName, 
    storagePath,
    parentEmailFile = null, 
    nestingDepth = 0 
  } = uploadData;
  
  const uploadRef = db.collection('uploads').doc(fileHash);
  
  try {
    // 1. Validate depth
    if (nestingDepth >= MAX_DEPTH) {
      throw new Error(`Email nesting exceeded maximum depth of ${MAX_DEPTH}`);
    }
    
    // 2. Claim processing lock
    const lockResult = await claimProcessingLock(fileHash);
    if (!lockResult.success) {
      console.log(`Skipping ${fileHash}: ${lockResult.reason}`);
      return { success: false, reason: lockResult.reason };
    }
    
    // 3. Download file from Storage
    await uploadRef.update({ parseProgress: 'Downloading file...' });
    
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [fileBuffer] = await file.download();
    
    // 4. Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Email file exceeds 100MB limit');
    }
    
    // 5. Parse email
    await uploadRef.update({ parseProgress: 'Parsing email...' });
    const parsed = await parseEmailFile(fileBuffer, sourceFileName);
    
    // 6. Validate attachment sizes
    for (const att of parsed.attachments) {
      if (att.size > MAX_FILE_SIZE) {
        throw new Error(`Attachment "${att.fileName}" exceeds 100MB limit`);
      }
    }
    
    // 7. Process attachments
    await uploadRef.update({ 
      parseProgress: `Extracting ${parsed.attachments.length} attachments...` 
    });
    
    const processedAttachments = await processAttachments(
      parsed.attachments,
      fileHash,
      firmId,
      userId,
      matterId,
      nestingDepth
    );
    
    // 8. Save email message
    await uploadRef.update({ parseProgress: 'Saving email message...' });
    
    const messageId = await saveEmailMessage(
      parsed,
      processedAttachments,
      fileHash,
      firmId,
      userId,
      matterId
    );
    
    // 9. Mark complete
    await markProcessingComplete(fileHash, {
      messageCount: 1,
      attachmentCount: processedAttachments.length,
      messages: [{
        messageId,
        subject: parsed.subject,
        from: parsed.from.email,
        date: admin.firestore.Timestamp.fromDate(parsed.date)
      }],
      attachments: processedAttachments
    });
    
    console.log(`Successfully extracted email ${fileHash}`);
    
    return {
      success: true,
      messageId,
      attachmentCount: processedAttachments.length
    };
    
  } catch (error) {
    console.error(`Email extraction failed for ${fileHash}:`, error);
    await releaseProcessingLock(fileHash, error.message);
    throw error;
  }
}

/**
 * Process email attachments
 * Handles deduplication and nested email recursion
 */
async function processAttachments(
  attachments,
  parentFileHash,
  firmId,
  userId,
  matterId,
  parentDepth
) {
  const bucket = storage.bucket();
  const processedAttachments = [];
  
  for (const attachment of attachments) {
    const attHash = hashBlake3(attachment.data);
    const isNestedEmail = isEmailFile(attachment.fileName);
    
    if (isNestedEmail) {
      // Nested email: upload and create pending extraction
      const nestedPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
      await bucket.file(nestedPath).save(attachment.data);
      
      // Create upload doc (will trigger extraction via Firestore trigger)
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
        parentEmailFile: parentFileHash,
        nestingDepth: parentDepth + 1,
        hasBeenParsed: false,
        parseStatus: PARSE_STATUS.PENDING,
        retryCount: 0,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
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
      // Regular attachment: check for duplicate
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
          extractedFromEmails: [parentFileHash],
          firstSeenInEmail: parentFileHash,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } else {
        // Update existing file with new source reference
        await db.collection('files').doc(attHash).update({
          extractedFromEmails: admin.firestore.FieldValue.arrayUnion(parentFileHash)
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
  
  return processedAttachments;
}

/**
 * Save email message to Firestore and Storage
 */
async function saveEmailMessage(
  parsed,
  processedAttachments,
  fileHash,
  firmId,
  userId,
  matterId
) {
  const bucket = storage.bucket();
  const messageRef = db.collection('emails').doc();
  const messageId = messageRef.id;
  
  // Prepare body text (with truncation warning if needed)
  let bodyText = parsed.bodyText;
  let bodyTruncated = false;
  if (bodyText.length > MAX_BODY_SIZE) {
    bodyText = bodyText.substring(0, MAX_BODY_SIZE) + 
      '\n\n[Content truncated - full body exceeds 1MB]';
    bodyTruncated = true;
  }
  
  // Save body text to Storage
  const bodyTextPath = `firms/${firmId}/emails/${messageId}/body.txt`;
  await bucket.file(bodyTextPath).save(Buffer.from(bodyText, 'utf-8'));
  
  // Save body HTML to Storage (if exists)
  let bodyHtmlPath = null;
  if (parsed.bodyHtml) {
    let bodyHtml = parsed.bodyHtml;
    if (bodyHtml.length > MAX_BODY_SIZE) {
      bodyHtml = bodyHtml.substring(0, MAX_BODY_SIZE) + 
        '\n<!-- Content truncated - full body exceeds 1MB -->';
    }
    bodyHtmlPath = `firms/${firmId}/emails/${messageId}/body.html`;
    await bucket.file(bodyHtmlPath).save(Buffer.from(bodyHtml, 'utf-8'));
  }
  
  // Create body preview for list display
  const bodyPreview = parsed.bodyText
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_BODY_PREVIEW);
  
  // Save message metadata to Firestore
  await messageRef.set({
    id: messageId,
    firmId,
    userId,
    matterId,
    extractedFromFile: fileHash,
    extractionDate: admin.firestore.FieldValue.serverTimestamp(),
    messageType: 'native',
    
    // Core metadata
    subject: parsed.subject,
    from: parsed.from,
    to: parsed.to,
    cc: parsed.cc,
    date: admin.firestore.Timestamp.fromDate(parsed.date),
    
    // Search optimization (denormalized)
    subjectLower: parsed.subject.toLowerCase(),
    fromEmail: parsed.from.email.toLowerCase(),
    toEmails: parsed.to.map(r => r.email.toLowerCase()),
    hasAttachments: processedAttachments.length > 0,
    attachmentCount: processedAttachments.length,
    bodyPreview,
    bodyTruncated,
    
    // Storage paths
    bodyTextPath,
    bodyHtmlPath,
    
    // Attachments
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
    
    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return messageId;
}

module.exports = { processEmailFile };
```

---

### Step 9: Firestore Trigger (Primary)

**File**: `functions/email-extraction/triggers/onUploadCreated.js`

```javascript
/**
 * PRIMARY trigger: Firestore onCreate for uploads collection
 * More reliable than Storage triggers
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { processEmailFile } = require('../services/emailExtractionService');

exports.onUploadCreated = onDocumentCreated({
  document: 'uploads/{fileHash}',
  memory: '2GiB',
  timeoutSeconds: 300,
  maxInstances: 10,
}, async (event) => {
  const fileHash = event.params.fileHash;
  const data = event.data.data();
  
  console.log(`Upload created: ${fileHash}, type: ${data.fileType}`);
  
  // Only process email files
  if (data.fileType !== 'email') {
    console.log('Not an email file, skipping');
    return null;
  }
  
  // Skip if already processed (shouldn't happen on create, but safety check)
  if (data.hasBeenParsed) {
    console.log('Already parsed, skipping');
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
```

---

### Step 10: Scheduled Retry Function

**File**: `functions/email-extraction/triggers/retryFailedExtractions.js`

```javascript
/**
 * Scheduled function to retry failed extractions
 * Runs every 6 hours
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { processEmailFile } = require('../services/emailExtractionService');
const { MAX_RETRY_COUNT, PARSE_STATUS } = require('../../shared/constants');

const db = admin.firestore();

exports.retryFailedExtractions = onSchedule({
  schedule: 'every 6 hours',
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (event) => {
  console.log('Starting retry of failed email extractions');
  
  // Find failed extractions that haven't exceeded retry limit
  const failedUploads = await db.collection('uploads')
    .where('fileType', '==', 'email')
    .where('parseStatus', '==', PARSE_STATUS.FAILED)
    .where('retryCount', '<', MAX_RETRY_COUNT)
    .limit(10)
    .get();
  
  console.log(`Found ${failedUploads.size} failed extractions to retry`);
  
  const results = [];
  
  for (const doc of failedUploads.docs) {
    const fileHash = doc.id;
    const data = doc.data();
    
    console.log(`Retrying extraction for ${fileHash} (attempt ${data.retryCount + 1})`);
    
    // Reset status to pending
    await doc.ref.update({
      parseStatus: PARSE_STATUS.PENDING,
      parseError: null,
      parseProgress: 'Queued for retry...'
    });
    
    try {
      await processEmailFile(fileHash, data);
      results.push({ fileHash, success: true });
    } catch (error) {
      console.error(`Retry failed for ${fileHash}:`, error);
      results.push({ fileHash, success: false, error: error.message });
    }
  }
  
  console.log('Retry results:', results);
  return results;
});
```

---

### Step 11: Manual Retry Callable Function

**File**: `functions/email-extraction/triggers/manualRetry.js`

```javascript
/**
 * Callable function for manual retry from UI
 * Allows users to retry failed extractions on demand
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { processEmailFile } = require('../services/emailExtractionService');
const { PARSE_STATUS } = require('../../shared/constants');

const db = admin.firestore();

exports.retryEmailExtraction = onCall({
  memory: '2GiB',
  timeoutSeconds: 300,
}, async (request) => {
  const { fileHash } = request.data;
  const uid = request.auth?.uid;
  
  // Validate authentication
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }
  
  // Validate input
  if (!fileHash || typeof fileHash !== 'string') {
    throw new HttpsError('invalid-argument', 'fileHash is required');
  }
  
  // Get upload document
  const uploadDoc = await db.collection('uploads').doc(fileHash).get();
  
  if (!uploadDoc.exists) {
    throw new HttpsError('not-found', 'File not found');
  }
  
  const data = uploadDoc.data();
  
  // Verify ownership
  if (data.userId !== uid) {
    throw new HttpsError('permission-denied', 'Not your file');
  }
  
  // Verify it's an email file
  if (data.fileType !== 'email') {
    throw new HttpsError('failed-precondition', 'Not an email file');
  }
  
  // Check if already processing
  if (data.parseStatus === PARSE_STATUS.PROCESSING) {
    throw new HttpsError('failed-precondition', 'Already processing');
  }
  
  // Check if already completed
  if (data.hasBeenParsed) {
    throw new HttpsError('failed-precondition', 'Already extracted');
  }
  
  console.log(`Manual retry requested for ${fileHash} by ${uid}`);
  
  // Reset status
  await uploadDoc.ref.update({
    parseStatus: PARSE_STATUS.PENDING,
    parseError: null,
    parseProgress: 'Manual retry requested...'
  });
  
  try {
    const result = await processEmailFile(fileHash, data);
    return { success: true, ...result };
    
  } catch (error) {
    console.error(`Manual retry failed for ${fileHash}:`, error);
    throw new HttpsError('internal', error.message);
  }
});
```

---

### Step 12: Main Entry Point

**File**: `functions/index.js`

```javascript
/**
 * Cloud Functions entry point
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Email extraction functions
const { onUploadCreated } = require('./email-extraction/triggers/onUploadCreated');
const { retryFailedExtractions } = require('./email-extraction/triggers/retryFailedExtractions');
const { retryEmailExtraction } = require('./email-extraction/triggers/manualRetry');

// Export functions
exports.onUploadCreated = onUploadCreated;
exports.retryFailedExtractions = retryFailedExtractions;
exports.retryEmailExtraction = retryEmailExtraction;
```

---

## 🖥️ Phase 5: Client-Side Integration

### Step 1: Update File Type Detection

**File**: `src/features/upload/utils/fileTypeChecker.js`

```javascript
// Add to existing detectFileType function
export function detectFileType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  
  // Email types
  if (ext === 'msg' || ext === 'eml') return 'email';
  
  // Existing types...
  if (ext === 'pdf') return 'pdf';
  // ... etc
}
```

### Step 2: Client Upload Metadata

When uploading .msg/.eml files, ensure these fields are set:

```javascript
// In your upload composable/service
async function uploadFile(file, fileHash, matterId) {
  const isEmail = ['msg', 'eml'].includes(
    file.name.toLowerCase().split('.').pop()
  );
  
  // Upload to Storage...
  
  // Create Firestore document
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
    
    // Email-specific fields (set even for non-emails for consistency)
    hasBeenParsed: false,
    parseStatus: isEmail ? 'pending' : null,
    isNestedEmail: false,
    parentEmailFile: null,
    nestingDepth: 0,
    retryCount: 0
  });
}
```

### Step 3: Email Extraction Status Composable

**File**: `src/features/upload/composables/useEmailExtractionStatus.js`

```javascript
import { ref, watch, onUnmounted } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';

/**
 * Real-time email extraction status listener
 * @param {Ref<string>} fileHashRef - Reactive file hash
 * @returns {Object} - Status data and actions
 */
export function useEmailExtractionStatus(fileHashRef) {
  const status = ref('pending');
  const progress = ref(null);
  const error = ref(null);
  const messageCount = ref(0);
  const attachmentCount = ref(0);
  const isProcessing = ref(false);
  const canRetry = ref(false);
  const retryCount = ref(0);
  
  let unsubscribe = null;
  
  // Watch for file hash changes
  watch(fileHashRef, (hash) => {
    // Cleanup previous listener
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    
    if (!hash) return;
    
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
      retryCount.value = data.retryCount || 0;
      
      isProcessing.value = data.parseStatus === 'processing';
      canRetry.value = data.parseStatus === 'failed' && data.retryCount < 3;
    }, (err) => {
      console.error('Error listening to upload:', err);
      error.value = err.message;
    });
  }, { immediate: true });
  
  // Retry function
  async function retry() {
    if (!fileHashRef.value || !canRetry.value) return;
    
    try {
      const retryFn = httpsCallable(functions, 'retryEmailExtraction');
      await retryFn({ fileHash: fileHashRef.value });
    } catch (err) {
      console.error('Retry failed:', err);
      error.value = err.message;
    }
  }
  
  // Cleanup
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });
  
  return {
    status,
    progress,
    error,
    messageCount,
    attachmentCount,
    isProcessing,
    canRetry,
    retryCount,
    retry
  };
}
```

### Step 4: Email Extraction Status Component

**File**: `src/features/upload/components/EmailExtractionStatus.vue`

```vue
<template>
  <div v-if="isEmailFile" class="email-extraction-status">
    <!-- Processing -->
    <div v-if="isProcessing" class="flex items-center gap-2">
      <v-progress-circular
        indeterminate
        size="16"
        width="2"
        color="primary"
      />
      <span class="text-sm text-gray-600">
        {{ progress || 'Processing email...' }}
      </span>
    </div>
    
    <!-- Completed -->
    <div v-else-if="status === 'completed'" class="flex items-center gap-2">
      <v-icon size="small" color="success">mdi-check-circle</v-icon>
      <span class="text-sm text-gray-600">
        {{ messageCount }} message, {{ attachmentCount }} attachments
      </span>
    </div>
    
    <!-- Failed -->
    <div v-else-if="status === 'failed'" class="flex items-center gap-2">
      <v-icon size="small" color="error">mdi-alert-circle</v-icon>
      <span class="text-sm text-red-600">
        {{ error || 'Extraction failed' }}
      </span>
      <v-btn
        v-if="canRetry"
        size="x-small"
        variant="text"
        color="primary"
        @click="retry"
      >
        Retry ({{ 3 - retryCount }} left)
      </v-btn>
    </div>
    
    <!-- Pending -->
    <div v-else class="flex items-center gap-2">
      <v-icon size="small" color="gray">mdi-clock-outline</v-icon>
      <span class="text-sm text-gray-500">Pending extraction...</span>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue';
import { useEmailExtractionStatus } from '../composables/useEmailExtractionStatus';

const props = defineProps({
  fileHash: { type: String, required: true },
  fileType: { type: String, required: true }
});

const isEmailFile = computed(() => props.fileType === 'email');

const {
  status,
  progress,
  error,
  messageCount,
  attachmentCount,
  isProcessing,
  canRetry,
  retryCount,
  retry
} = useEmailExtractionStatus(toRef(props, 'fileHash'));
</script>
```

---

## 🔒 Phase 6: Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Email messages - read/write by owner
    match /emails/{messageId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
      
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
    
    // Uploads - allow Cloud Functions to update extraction fields
    match /uploads/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      
      // Allow updates from owner or Cloud Functions
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.userId
            || isCloudFunctionUpdate());
      
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
    
    // Files - track email attachments
    match /files/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.userId
            || isCloudFunctionUpdate());
    }
    
    // Helper: Check if update is from Cloud Functions
    function isCloudFunctionUpdate() {
      // Cloud Functions updates will have specific field patterns
      return request.resource.data.diff(resource.data)
        .affectedKeys()
        .hasOnly([
          'hasBeenParsed', 'parsedAt', 'parseStatus', 'parseProgress',
          'parseError', 'parseStartedAt', 'retryCount', 'lastRetryAt',
          'extractedMessageCount', 'extractedAttachmentCount',
          'extractedMessages', 'extractedAttachments',
          'isEmailAttachment', 'extractedFromEmails', 'firstSeenInEmail'
        ]);
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Email message bodies
    match /firms/{firmId}/emails/{messageId}/{fileName} {
      allow read: if request.auth != null
        && request.auth.uid == firmId;  // Solo firm: firmId === userId
      
      allow write: if request.auth != null
        && request.auth.uid == firmId;
    }
    
    // Uploads (including email files and attachments)
    match /firms/{firmId}/matters/{matterId}/uploads/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == firmId;
      
      allow write: if request.auth != null
        && request.auth.uid == firmId;
    }
  }
}
```

---

## 🧪 Phase 7: Testing

### Unit Tests

**File**: `functions/test/parsers.test.js`

```javascript
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { parseMsgFile } = require('../email-extraction/parsers/msgParser');
const { parseEmlFile } = require('../email-extraction/parsers/emlParser');
const { hashBlake3 } = require('../email-extraction/utils/hashUtils');

describe('Email Parsers', () => {
  
  describe('msgParser', () => {
    it('should extract subject from .msg file', async () => {
      const buffer = fs.readFileSync(
        path.join(__dirname, 'fixtures/simple.msg')
      );
      const result = await parseMsgFile(buffer);
      expect(result.subject).to.be.a('string');
      expect(result.subject).to.not.equal('');
    });
    
    it('should handle missing subject', async () => {
      const buffer = fs.readFileSync(
        path.join(__dirname, 'fixtures/no-subject.msg')
      );
      const result = await parseMsgFile(buffer);
      expect(result.subject).to.equal('(No Subject)');
    });
    
    it('should extract attachments', async () => {
      const buffer = fs.readFileSync(
        path.join(__dirname, 'fixtures/with-attachments.msg')
      );
      const result = await parseMsgFile(buffer);
      expect(result.attachments).to.be.an('array');
    });
  });
  
  describe('emlParser', () => {
    it('should extract subject from .eml file', async () => {
      const buffer = fs.readFileSync(
        path.join(__dirname, 'fixtures/simple.eml')
      );
      const result = await parseEmlFile(buffer);
      expect(result.subject).to.be.a('string');
    });
  });
  
  describe('hashUtils', () => {
    it('should produce consistent BLAKE3 hashes', () => {
      const data = Buffer.from('test data');
      const hash1 = hashBlake3(data);
      const hash2 = hashBlake3(data);
      expect(hash1).to.equal(hash2);
    });
    
    it('should produce 64-character hex hash', () => {
      const data = Buffer.from('test');
      const hash = hashBlake3(data);
      expect(hash).to.have.lengthOf(64);
      expect(hash).to.match(/^[a-f0-9]+$/);
    });
  });
});
```

### Integration Test with Emulator

```bash
# Start emulators
firebase emulators:start --only functions,firestore,storage

# Run tests
cd functions
npm test
```

### Test Fixtures

Create `functions/test/fixtures/` directory with:
- `simple.msg` - Basic email with subject
- `no-subject.msg` - Email without subject
- `with-attachments.msg` - Email with PDF/image attachments
- `nested-email.msg` - Email with .msg attachment
- `simple.eml` - Basic .eml file

---

## 🚀 Phase 8: Deployment

### Step 1: Deploy Cloud Functions

```bash
cd functions
npm install

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:onUploadCreated
firebase deploy --only functions:retryFailedExtractions
firebase deploy --only functions:retryEmailExtraction
```

### Step 2: Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Step 3: Monitor

```bash
# Watch logs
firebase functions:log --only onUploadCreated

# Firebase Console
# https://console.firebase.google.com/project/YOUR-PROJECT/functions/logs
```

---

## 📊 Phase 9: Monitoring & Cost

### Cloud Functions Dashboard

Monitor in Firebase Console:
- **Invocations**: Email files processed
- **Execution time**: Average duration
- **Memory usage**: Peak consumption
- **Error rate**: Failed extractions

### Cost Estimation

| Volume | Compute | Storage I/O | **Monthly Total** |
|--------|---------|-------------|-------------------|
| 100 emails | $0.01 | $1.20 | ~$1.21 |
| 500 emails | $0.03 | $6.00 | ~$6.03 |
| 1000 emails | $0.05 | $12.00 | ~$12.05 |

Extremely affordable for the reliability benefits.

---

## ✅ Success Criteria

- [ ] .msg and .eml files upload successfully
- [ ] Firestore trigger fires on upload document creation
- [ ] Processing lock prevents duplicate extraction
- [ ] Native message extracted to `emails` collection
- [ ] Attachments deduplicated via BLAKE3 hash
- [ ] Nested .msg files process up to 10 levels
- [ ] Files >100MB rejected with clear error
- [ ] Failed extractions don't block upload
- [ ] UI shows real-time progress updates
- [ ] Manual retry works from UI
- [ ] Scheduled retry processes failed extractions
- [ ] BLAKE3 hashes match between client and server

---

## 🚀 Implementation Order

| Step | Task | Time Est. |
|------|------|-----------|
| 1 | Initialize Cloud Functions, install deps | 30 min |
| 2 | Create constants, hash utils | 15 min |
| 3 | Build email parsers (msg, eml, factory) | 1 hour |
| 4 | Test parsers with sample files | 30 min |
| 5 | Build processing lock service | 30 min |
| 6 | Build core extraction service | 2 hours |
| 7 | Create Firestore trigger | 30 min |
| 8 | Create retry functions (scheduled + callable) | 45 min |
| 9 | Deploy to emulator, integration test | 1 hour |
| 10 | Build client-side status composable | 30 min |
| 11 | Build status UI component | 30 min |
| 12 | Update client upload flow | 30 min |
| 13 | Deploy security rules | 15 min |
| 14 | Deploy to production | 15 min |
| 15 | Monitor and verify | 30 min |

**Total Estimated Time**: 9-10 hours

---

## 🔮 Future Enhancements (Post-v1)

- **Email Threading**: Link related emails by conversation
- **Full-Text Search**: Index bodies in Algolia/Typesense
- **Quoted Message Extraction**: Parse reply chains
- **Large File Streaming**: Handle >100MB via chunked processing
- **Email Analytics**: Communication patterns, timeline views
- **OCR for Image Attachments**: Extract text from scanned docs

---

**End of Implementation Plan (Server-Side v3)**