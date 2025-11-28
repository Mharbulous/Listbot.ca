# Email Extraction Implementation Plan (v1)

**Date**: 2025-11-28
**Status**: Ready for Implementation
**Priority**: High
**Branch**: `claude/email-extraction-v1-<session-id>`

**Architecture Document**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`

---

## Decision Summary

### ✅ Finalized Decisions (2025-11-28)

1. **Storage Strategy**: Email message bodies → Firebase Storage; Metadata → Firestore
2. **File Formats**: Both .msg and .eml
3. **Message Extraction**: Native messages only (skip quoted messages in v1)
4. **Failure Handling**: Upload as regular file, mark `hasBeenParsed: false` for manual retry
5. **Size Limits**: 100MB max for .msg/.eml files; fail extraction if any attachment >100MB
6. **Processing**: Parallel with other uploads (use existing web worker pattern)
7. **UI Detail**: Minimal ("Processing email...", "Extracting attachments...")
8. **Depth Limit**: 10 levels for nested .msg files; mark `hasBeenParsed: false` if exceeded

### ⚙️ Implementation Approach

- **Client-side extraction only** (no Cloud Functions)
- **100MB limit** prevents browser memory issues
- **Deduplication BEFORE upload** (saves bandwidth and storage costs)
- **Integrates with existing Stage 1 pipeline** (Hash → Dedupe → Upload)
- **Email bodies in Storage** (avoids Firestore 1MB document limit)

---

## 📦 Phase 1: Dependencies & Setup

### Install Required Libraries

```bash
npm install @kenjiuno/msgreader mailparser mime-types
```

**Library Purposes:**
- `@kenjiuno/msgreader` (~150KB) - Parse .msg files (Microsoft Outlook)
- `mailparser` (~200KB) - Parse .eml files (standard email format)
- `mime-types` (~50KB) - MIME type detection for attachments

**Total Bundle Size Impact**: ~400KB

---

## 📁 Phase 2: File Structure

Create these new files in the upload feature folder:

```
src/features/upload/
├── services/
│   └── emailExtractionService.js        # Core extraction logic
│
├── parsers/
│   ├── msgParser.js                     # .msg file parser
│   ├── emlParser.js                     # .eml file parser
│   └── emailParserFactory.js            # Router: .msg vs .eml
│
├── composables/
│   ├── useEmailExtraction.js            # Vue composable for extraction
│   └── useEmailStorage.js               # Firebase Storage operations
│
└── utils/
    ├── emailValidation.js               # Size/depth validation
    └── emailHelpers.js                  # Common email utilities
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

## 🔨 Phase 4: Implementation Steps

### Step 1: Email File Type Detection

**File**: `src/features/upload/utils/fileTypeChecker.js`

Add to existing `detectFileType` function:

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

### Step 2: Email Parser Factory

**File**: `src/features/upload/parsers/emailParserFactory.js` (NEW)

```javascript
import { parseMsgFile } from './msgParser.js';
import { parseEmlFile } from './emlParser.js';

/**
 * Route to appropriate parser based on file extension
 * @param {ArrayBuffer} fileBuffer - File binary data
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} - Parsed email data
 */
export async function parseEmailFile(fileBuffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();

  if (ext === 'msg') {
    return await parseMsgFile(fileBuffer);
  } else if (ext === 'eml') {
    return await parseEmlFile(fileBuffer);
  } else {
    throw new Error(`Unsupported email format: ${ext}`);
  }
}
```

---

### Step 3: .msg Parser

**File**: `src/features/upload/parsers/msgParser.js` (NEW)

```javascript
import MsgReader from '@kenjiuno/msgreader';

/**
 * Parse Microsoft Outlook .msg file
 * @param {ArrayBuffer} buffer - .msg file binary data
 * @returns {Promise<Object>} - Parsed email structure
 */
export async function parseMsgFile(buffer) {
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
```

---

### Step 4: .eml Parser

**File**: `src/features/upload/parsers/emlParser.js` (NEW)

```javascript
import { simpleParser } from 'mailparser';

/**
 * Parse standard .eml email file
 * @param {ArrayBuffer} buffer - .eml file binary data
 * @returns {Promise<Object>} - Parsed email structure
 */
export async function parseEmlFile(buffer) {
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
```

---

### Step 5: Email Extraction Service (Core Logic)

**File**: `src/features/upload/services/emailExtractionService.js` (NEW)

```javascript
import { ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc, updateDoc, getDoc, collection, arrayUnion } from 'firebase/firestore';
import { parseEmailFile } from '../parsers/emailParserFactory.js';
import { hashBlake3 } from '../workers/fileHashWorker.js'; // Use existing hasher
import { storage, db } from '@/firebase';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DEPTH = 10;

/**
 * Process email file and extract messages + attachments
 * Handles recursive extraction for nested .msg/.eml files
 *
 * @param {string} fileHash - BLAKE3 hash of email file
 * @param {ArrayBuffer} fileBuffer - Email file binary data
 * @param {string} fileName - Original filename
 * @param {string} firmId - Firm ID
 * @param {string} userId - User ID
 * @param {string} matterId - Matter ID
 * @param {string|null} parentEmailHash - Parent .msg hash (for nested emails)
 * @param {number} depth - Nesting depth (0 for top-level)
 * @param {Function|null} onProgress - Progress callback (message: string) => void
 * @returns {Promise<Object>} - Extraction result
 */
export async function processEmailFile(
  fileHash,
  fileBuffer,
  fileName,
  firmId,
  userId,
  matterId,
  parentEmailHash = null,
  depth = 0,
  onProgress = null
) {
  // Validation
  if (depth >= MAX_DEPTH) {
    throw new Error('Email nesting exceeded maximum depth of 10');
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('Email file exceeds 100MB limit');
  }

  onProgress?.('Parsing email file...');

  try {
    // 1. Parse email
    const parsed = await parseEmailFile(fileBuffer, fileName);

    // 2. Validate attachment sizes
    for (const att of parsed.attachments) {
      if (att.size > MAX_FILE_SIZE) {
        throw new Error(`Attachment "${att.fileName}" exceeds 100MB limit`);
      }
    }

    onProgress?.(`Extracting ${parsed.attachments.length} attachments...`);

    // 3. Process attachments
    const processedAttachments = [];

    for (const attachment of parsed.attachments) {
      const attHash = await hashBlake3(attachment.data);
      const isNestedEmail = /\.(msg|eml)$/i.test(attachment.fileName);

      if (isNestedEmail) {
        // Nested email: upload and recurse
        const nestedPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
        await uploadBytes(ref(storage, nestedPath), attachment.data);

        await setDoc(doc(db, 'uploads', attHash), {
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
          parseStatus: 'pending',
          uploadedAt: new Date()
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
          depth + 1,
          onProgress
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
        const existingDoc = await getDoc(doc(db, 'files', attHash));
        const isDuplicate = existingDoc.exists();

        if (!isDuplicate) {
          // Upload new attachment
          const attPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}`;
          await uploadBytes(ref(storage, attPath), attachment.data);

          await setDoc(doc(db, 'files', attHash), {
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
            uploadedAt: new Date()
          });
        } else {
          // Update existing file record
          await updateDoc(doc(db, 'files', attHash), {
            extractedFromEmails: arrayUnion(fileHash)
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

    onProgress?.('Saving email message...');

    // 4. Save email message to Firestore & Storage
    const messageId = doc(collection(db, 'emails')).id;

    // Save body text to Storage
    const bodyTextPath = `firms/${firmId}/emails/${messageId}/body.txt`;
    await uploadBytes(
      ref(storage, bodyTextPath),
      new TextEncoder().encode(parsed.bodyText)
    );

    // Save body HTML to Storage (if exists)
    let bodyHtmlPath = null;
    if (parsed.bodyHtml) {
      bodyHtmlPath = `firms/${firmId}/emails/${messageId}/body.html`;
      await uploadBytes(
        ref(storage, bodyHtmlPath),
        new TextEncoder().encode(parsed.bodyHtml)
      );
    }

    // Save message metadata to Firestore
    await setDoc(doc(db, 'emails', messageId), {
      id: messageId,
      firmId,
      userId,
      matterId,
      extractedFromFile: fileHash,
      extractionDate: new Date(),
      messageType: 'native',
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      cc: parsed.cc,
      date: parsed.date,
      bodyTextPath,
      bodyHtmlPath,
      attachments: processedAttachments.map(att => ({
        fileHash: att.fileHash,
        fileName: att.fileName,
        size: att.size,
        mimeType: att.mimeType,
        isDuplicate: att.isDuplicate,
        storagePath: att.wasUploaded ? `firms/${firmId}/matters/${matterId}/uploads/${att.fileHash}` : null
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Update original .msg file record
    await updateDoc(doc(db, 'uploads', fileHash), {
      hasBeenParsed: true,
      parsedAt: new Date(),
      parseStatus: 'completed',
      extractedMessageCount: 1,
      extractedAttachmentCount: processedAttachments.length,
      extractedMessages: [{
        messageId,
        subject: parsed.subject,
        from: parsed.from.email,
        date: parsed.date
      }],
      extractedAttachments: processedAttachments
    });

    onProgress?.('Email extraction complete');

    return {
      success: true,
      messageId,
      attachmentCount: processedAttachments.length
    };

  } catch (error) {
    // Mark as failed
    await updateDoc(doc(db, 'uploads', fileHash), {
      hasBeenParsed: false,
      parseStatus: 'failed',
      parseError: error.message
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
  return 'other';
}

export default { processEmailFile };
```

---

### Step 6: Integration with Upload Pipeline

**File**: `src/features/upload/composables/useFileProcessor.js`

Modify existing upload processor to detect and extract emails:

```javascript
import { processEmailFile } from '../services/emailExtractionService.js';

/**
 * Process file upload
 * Detect email files and trigger extraction
 */
async function processFile(file, fileHash) {
  // ... existing upload logic (hash, upload to storage, create metadata)

  // NEW: Email extraction
  if (file.type === 'email') {
    try {
      updateStatus(file.id, 'Processing email...');

      const fileBuffer = await file.arrayBuffer();

      await processEmailFile(
        fileHash,
        fileBuffer,
        file.name,
        currentFirmId,
        currentUserId,
        currentMatterId,
        null, // no parent
        0,    // depth 0
        (message) => updateStatus(file.id, message)
      );

      updateStatus(file.id, 'Email processed successfully');

    } catch (error) {
      console.error('Email extraction failed:', error);
      updateStatus(file.id, `Email extraction failed: ${error.message}`);
      // File is still uploaded, just not parsed
    }
  }

  // ... continue with rest of upload
}
```

---

## 🧪 Phase 5: Testing Strategy

### Unit Tests (`/tests/unit/email-extraction/`)

#### `msgParser.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { parseMsgFile } from '@/features/upload/parsers/msgParser.js';
import { loadTestFile } from '../helpers/fileLoader.js';

describe('msgParser', () => {
  it('should extract subject from .msg file', async () => {
    const buffer = await loadTestFile('simple.msg');
    const result = await parseMsgFile(buffer);
    expect(result.subject).toBe('Test Email');
  });

  it('should extract attachments', async () => {
    const buffer = await loadTestFile('with-attachments.msg');
    const result = await parseMsgFile(buffer);
    expect(result.attachments).toHaveLength(2);
  });

  it('should handle missing subject', async () => {
    const buffer = await loadTestFile('no-subject.msg');
    const result = await parseMsgFile(buffer);
    expect(result.subject).toBe('(No Subject)');
  });
});
```

#### `emailExtractionService.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { processEmailFile } from '@/features/upload/services/emailExtractionService.js';

describe('processEmailFile', () => {
  it('should reject files > 100MB', async () => {
    const largeBuffer = new ArrayBuffer(101 * 1024 * 1024);
    await expect(
      processEmailFile('hash', largeBuffer, 'large.msg', 'firm1', 'user1', 'matter1')
    ).rejects.toThrow('exceeds 100MB');
  });

  it('should reject attachments > 100MB', async () => {
    // Mock parsed email with large attachment
    const buffer = await createMockMsgWithLargeAttachment(101 * 1024 * 1024);
    await expect(
      processEmailFile('hash', buffer, 'test.msg', 'firm1', 'user1', 'matter1')
    ).rejects.toThrow('Attachment "large.pdf" exceeds 100MB limit');
  });

  it('should handle nested emails up to depth 10', async () => {
    // Test with nested .msg files
    // Create mock email with 10 levels of nesting
    // Verify 10th level succeeds, 11th fails
  });

  it('should deduplicate attachments', async () => {
    // Upload email with attachment
    // Upload same email again
    // Verify attachment uploaded only once
  });
});
```

### Integration Tests

Test with real .msg/.eml files from your legal work.

---

## 📊 Phase 6: UI Updates

### Minimal Progress Indicators

**File**: `src/features/upload/components/StatusCell.vue`

```vue
<template>
  <div v-if="file.fileType === 'email'" class="email-status">
    <v-icon v-if="file.parseStatus === 'processing'" size="small">
      mdi-email-sync
    </v-icon>
    <span>{{ file.statusMessage }}</span>
    <!-- "Processing email...", "Extracting 3 attachments..." -->
  </div>
</template>
```

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
              'extractedMessageCount', 'extractedMessages',
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

## 📈 Phase 8: Rollout Plan

1. **Deploy to Dev** - Test with sample .msg/.eml files
2. **Internal Testing** - Use on real case files (your work)
3. **Monitor Errors** - Check `parseStatus: 'failed'` records
4. **Deploy to Production** - All users get feature immediately

---

## 🎯 Success Criteria

- ✅ .msg and .eml files upload successfully
- ✅ Native message extracted to `emails` collection
- ✅ Attachments deduplicated correctly
- ✅ Nested .msg files process up to 10 levels
- ✅ Files >100MB rejected with clear error
- ✅ Failed extractions don't block file upload
- ✅ UI shows minimal, clear progress messages

---

## 🚀 Implementation Order (Recommended)

1. **Install libraries** (Phase 1)
2. **Build parsers** (Step 2, 3, 4)
3. **Test parsers with sample files** (Phase 5)
4. **Build extraction service** (Step 5)
5. **Integrate with upload pipeline** (Step 6)
6. **Add UI updates** (Phase 6)
7. **Deploy security rules** (Phase 7)

**Total Estimated Time**: 6-8 hours

---

## 📝 Notes

- Email bodies stored in Firebase Storage to avoid Firestore 1MB document limit
- Deduplication happens BEFORE upload (saves bandwidth)
- All extraction metadata in Firestore for fast queries
- Failed extractions still upload .msg file for manual retry
- Nested emails handled recursively with depth limit

---

**End of Implementation Plan**
