# Email Extraction Architecture

## Overview

This document defines the architecture for extracting email messages and attachments from email files (.msg, .eml), integrating with ListBot's existing deduplication and file lifecycle systems.

### Key Design Principles

1. **Preserve Original Evidence**: Original .msg/.eml files are NEVER modified or deleted
2. **Maximize Deduplication**: Extract attachments before saving emails to deduplicate across all sources
3. **Maintain Bidirectional References**: Track relationships between emails, attachments, and original files
4. **Recursive Processing**: Handle nested .msg files (emails attached to emails) to any depth
5. **Separate Storage Concerns**: Email messages vs attachments have different storage needs

---

## Storage Architecture

### Firebase Storage Structure

```
firms/{firmId}/
├── uploads/                  # Original files + extracted attachments
│   ├── <msg-file-hash>      # Original .msg file (preserved as evidence)
│   ├── <attachment-hash-1>  # Extracted attachment (primary/best copy)
│   └── <attachment-hash-2>  # Another extracted attachment
│
└── emails/                   # Parsed individual email messages
    ├── <message-id-1>       # Native email message (body + headers)
    ├── <message-id-2>       # Quoted email message
    └── <message-id-3>       # Another quoted message
```

### Storage Path Rules

| Content Type | Storage Location | ID Type | Purpose |
|-------------|------------------|---------|---------|
| Original .msg file | `/uploads/<blake3-hash>` | BLAKE3 hash | Evidentiary preservation |
| Extracted attachment | `/uploads/<blake3-hash>` | BLAKE3 hash | Deduplication + storage |
| Parsed email message | `/emails/<unique-id>` | Auto-generated | Individual message access |

**Why email messages use unique IDs (not hashes):**
- Quoted emails can be identical across multiple .msg files
- We need to track each occurrence separately for threading
- Messages need relationships to their source .msg file

---

## Terminology

### ⚠️ CRITICAL: Add these terms to file-lifecycle.md

The following terms are specific to email processing and must be added to `docs/Features/Upload/Processing/file-lifecycle.md` for consistency:

### Email Message Types

**STRICT DEFINITION REQUIRED** - These terms distinguish between reliable and potentially-tampered email content:

| Term | Definition | Metadata Reliability | Forensic Value | Example |
|------|-----------|---------------------|----------------|---------|
| **Native** | The current/top-level message in a .msg file for which we have actual .msg metadata | ✅ High - extracted from binary .msg structure | ✅ Trustworthy - direct from email file | The reply you just received |
| **Quoted** | Previous messages in the thread extracted from email body text or headers | ⚠️ Variable - parsed from quoted text blocks | ⚠️ Unverifiable - can be edited before sending | "On Jan 5, John wrote..." |

**Critical Distinction:**
- **Native** messages have metadata directly from the .msg file binary structure (From, To, Date, Subject headers are authoritative)
- **Quoted** messages are text reconstructions from the email body - **can be modified** by sender before sending
- Example: Alice replies to Bob's email but edits Bob's quoted text before sending - the Quoted message does not match Bob's original Native message

**Use Cases:**
- **Native** messages: Chain of custody, legal evidence, timestamp verification
- **Quoted** messages: Context reconstruction, thread visualization, detecting tampering (compare to original Native if available)

**Detection of Tampering:**
When the same email appears both as Native (in its own .msg file) and Quoted (in a reply), compare bodyText hashes to detect if quoted content was altered.

### Email Attachment Deduplication Types

| Term | Definition | Storage Action | Metadata Action | Firestore Collection |
|------|-----------|----------------|-----------------|---------------------|
| **Best/Primary** | First occurrence or best metadata version | ✅ Upload to `/uploads` | ✅ Full record created | `uploads` collection |
| **Copy** | Duplicate hash with meaningful metadata differences | ❌ Skip upload | ✅ Record metadata in `copies` array | `files` collection (update) |

**Note:** These terms align with existing ListBot deduplication terminology from `docs/Features/Upload/Deduplication/CLAUDE.md`.

**Storage Path Clarification:**
- `/uploads` is a **Firebase Storage path**, not a Firestore collection
- Firestore collections are `uploads`, `emails`, and `files`
- Do not confuse `/uploads` (storage) with `uploads` collection (database)

---

## Non-Obvious Implementation Details

### Why `emails` Collection Uses Auto-Generated IDs (Not Hashes)

**Critical Design Decision:** Email messages use auto-generated IDs instead of content hashes.

**Rationale:**
1. **Quoted messages can be identical across multiple .msg files** - If Bob forwards Alice's email to 3 people, we get 3 .msg files with identical quoted content
2. **We need to track each occurrence separately** - Each instance of the quoted message has different context (which .msg file it came from)
3. **Threading requires source tracking** - Need to know which .msg file contained which message for reconstruction
4. **Hash-based IDs would lose information** - Same quoted content → same hash → only one record → lost context

**Example Problem with Hash-Based IDs:**
```javascript
// BAD: Using content hash as ID
{
  id: 'hash-of-quoted-email-body',
  bodyText: 'Let's meet at 3pm',
  extractedFromFile: 'hash-abc123'  // ❌ Can only store ONE source
}

// GOOD: Auto-generated ID allows multiple occurrences
{
  id: 'msg-001',
  bodyText: 'Let's meet at 3pm',
  extractedFromFile: 'hash-abc123'  // ✅ First occurrence
}
{
  id: 'msg-002',
  bodyText: 'Let's meet at 3pm',  // Identical content
  extractedFromFile: 'hash-def456'  // ✅ Second occurrence from different .msg
}
```

**Implementation:**
- Use Firestore auto-generated IDs: `doc(collection(db, 'emails')).id`
- Store bidirectional references: message → .msg file (extractedFromFile), .msg file → messages (extractedMessages array)

### Why Original .msg Files Are Never Deleted

**Legal/Evidentiary Requirement:** Original .msg files must be preserved even after extraction.

**Reasons:**
1. **Chain of custody** - Original file is legal evidence of what was received
2. **Metadata authenticity** - Proves message headers weren't tampered with
3. **Format preservation** - Some email properties may not be extracted (embedded images, formatting, etc.)
4. **Audit trail** - Can always verify extraction was performed correctly

**Storage Impact:**
- Original .msg might be 500 KB
- After extraction: attachments deduplicated, messages in `/emails`
- Still store 500 KB original + extracted components
- **Trade-off:** Storage cost vs. legal defensibility

**Implementation:**
- Upload original to `/uploads/<hash>`
- Extract components
- Mark as `hasBeenParsed: true`
- NEVER delete original

### Why Attachments Are Processed BEFORE Email Saving

**Critical Workflow Order:** Attachments must be hashed and deduplicated before saving email messages.

**Reason:**
Email message documents reference attachment hashes in their `attachments` array:
```javascript
{
  id: 'msg-001',
  attachments: [
    { fileHash: 'abc123', fileName: 'contract.pdf', isDuplicate: false }
  ]
}
```

If we save the email message first, we don't know the attachment hashes yet.

**Correct Flow:**
1. Parse .msg → extract attachments
2. Hash each attachment (BLAKE3)
3. Check if hash exists → determine isDuplicate
4. Upload new attachments to `/uploads`
5. Build attachments array with hashes
6. Save email message with complete attachment references

**Incorrect Flow:**
1. Parse .msg → save email message → ❌ don't know attachment hashes yet
2. Extract attachments → hash them
3. Try to update email message → ❌ inefficient, atomic issues

### Recursive Depth Limit: Why 10 Levels?

**Safety Constraint:** `processEmailFile()` has max depth of 10.

**Reasoning:**
1. **Prevents infinite loops** - Circular references, malformed files
2. **Realistic upper bound** - Real email threads rarely exceed 5-6 levels of nesting
3. **Performance protection** - Each level adds processing time
4. **Memory constraints** - Deep recursion can exhaust stack

**Real-World Context:**
- Normal case: 1-2 levels (email with .msg attachment)
- Edge case: 3-4 levels (forwarded email chains)
- Suspicious: 5+ levels (potential malformed data)
- Attack vector: 10+ levels (deliberate exploit attempt)

**Implementation:**
```javascript
if (depth > 10) {
  throw new Error(`Email nesting exceeded maximum depth of 10`)
}
```

### Why Firestore Collection Names Don't Match Storage Paths

**Potential Confusion:** Firestore `uploads` collection vs. Firebase Storage `/uploads` path.

**Clarification:**
- **Firestore collections:** `uploads`, `emails`, `files` (database schema)
- **Storage paths:** `/firms/{firmId}/uploads/`, `/firms/{firmId}/emails/` (file storage)

**Why Different:**
- Firestore = structured data with queries (metadata, relationships)
- Storage = blob storage (actual file bytes)
- They serve different purposes and have different access patterns

**Example:**
```javascript
// Firestore: Document metadata in `uploads` collection
const uploadDoc = await getDoc(doc(db, 'uploads', fileHash))
// Returns: { fileType: 'email', hasBeenParsed: true, ... }

// Storage: Actual .msg file bytes at `/uploads` path
const storageRef = ref(storage, `firms/${firmId}/uploads/${fileHash}`)
const bytes = await getBytes(storageRef)
// Returns: Binary .msg file data
```

### Why .eml Parsing Needs Different Library Than .msg

**Format Differences:**
- **.msg**: Microsoft proprietary binary format (requires `@kenjiuno/msgreader`)
- **.eml**: Standard MIME text format (requires `mailparser`)

**Cannot Use Same Parser:**
- `.msg` files have binary structures, compound document format
- `.eml` files are text-based MIME with headers and parts
- Attempting to parse .msg with mailparser → fails
- Attempting to parse .eml with msgreader → fails

**Implementation:**
```javascript
function parseEmailFile(buffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'msg') {
    return parseMsgFile(buffer)  // Uses @kenjiuno/msgreader
  } else if (ext === 'eml') {
    return parseEmlFile(buffer)  // Uses mailparser
  }
}
```

### Why Quoted Message Extraction Is Imperfect

**Limitation:** Extracting quoted messages from email bodies is heuristic, not guaranteed.

**Challenges:**
1. **No standard format** - Different email clients quote differently
2. **Text can be edited** - Senders can modify quoted text
3. **Incomplete headers** - Quoted sections often lack full metadata
4. **Parsing complexity** - Nested quotes, inline replies, HTML formatting

**Common Patterns:**
```
On Jan 5, 2024, John Doe wrote:
> Original message text

-----Original Message-----
From: Jane Smith
Sent: Monday, January 5, 2024 2:30 PM

From: Bob Johnson <bob@example.com>
Date: Jan 5, 2024 at 2:30 PM
Subject: Re: Meeting
```

**Implementation Strategy:**
1. Use regex patterns for common quote formats
2. Extract as much metadata as possible
3. Mark as `isNative: false` to indicate lower reliability
4. Accept that some quoted messages may be missed or incomplete

**Future Improvement:**
- Machine learning model to detect quoted sections
- Parse HTML structure for better accuracy
- Cross-reference with other .msg files in system

---

## Firestore Schema

### Collection: `uploads`
**Purpose:** Track original .msg files

```typescript
{
  // Document ID = BLAKE3 hash of original .msg file
  id: string,  // '<msg-file-blake3-hash>'

  // Standard file fields
  firmId: string,
  userId: string,
  sourceFileName: string,  // 'conversation.msg'
  fileType: 'email',
  fileSize: number,
  storagePath: string,  // 'firms/{firmId}/uploads/{hash}'
  uploadedAt: Timestamp,

  // Email extraction status
  hasBeenParsed: boolean,
  parsedAt: Timestamp | null,
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed',
  parseError: string | null,

  // Extraction results
  extractedMessageCount: number,
  extractedAttachmentCount: number,
  extractedMessages: Array<{
    messageId: string,      // ID in emails collection
    isNative: boolean,      // Native vs Quoted
    subject: string,
    from: string,
    date: Timestamp
  }>,
  extractedAttachments: Array<{
    fileHash: string,       // BLAKE3 hash
    fileName: string,
    size: number,
    mimeType: string,
    wasUploaded: boolean,   // false if duplicate
    isDuplicate: boolean,
    nestedEmail: boolean    // true if this attachment is a .msg file
  }>,

  // Recursive nesting tracking
  isNestedEmail: boolean,        // true if this .msg was extracted from another .msg
  parentEmailFile: string | null, // hash of parent .msg file if nested
  nestingDepth: number           // 0 for top-level, 1+ for nested
}
```

### Collection: `emails`
**Purpose:** Individual parsed email messages

```typescript
{
  // Document ID = Auto-generated unique ID (NOT hash-based)
  id: string,

  // Firm/user context
  firmId: string,
  userId: string,

  // Source tracking
  extractedFromFile: string,      // Hash of original .msg file
  extractedFromPath: string,      // Full storage path to .msg
  extractionDate: Timestamp,

  // Message type
  isNative: boolean,
  messageType: 'native' | 'quoted',

  // Email metadata
  subject: string,
  from: {
    name: string | null,
    email: string
  },
  to: Array<{
    name: string | null,
    email: string
  }>,
  cc: Array<{
    name: string | null,
    email: string
  }>,
  bcc: Array<{
    name: string | null,
    email: string
  }>,
  date: Timestamp,

  // Email content
  bodyHtml: string | null,
  bodyText: string,
  headers: Record<string, string>,  // Raw email headers

  // Attachments
  attachments: Array<{
    fileHash: string,           // BLAKE3 hash
    fileName: string,
    size: number,
    mimeType: string,
    isDuplicate: boolean,
    storagePath: string | null, // Path in /uploads if uploaded, null if duplicate
    primaryLocation: string | null,  // Path to primary copy if duplicate
    isNestedEmail: boolean      // true if attachment is a .msg file
  }>,

  // Threading (populated in Stage 3)
  threadId: string | null,
  inReplyTo: string | null,
  references: string[],

  // Storage
  storagePath: string,  // 'firms/{firmId}/emails/{id}'
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `files`
**Purpose:** Track extracted attachments

```typescript
{
  // Document ID = BLAKE3 hash of attachment
  id: string,

  // Standard file fields
  firmId: string,
  sourceFileName: string,  // Original filename from email
  fileType: string,        // pdf, docx, jpg, etc.
  fileSize: number,
  storagePath: string,     // 'firms/{firmId}/uploads/{hash}'
  uploadedAt: Timestamp,

  // Provenance
  isEmailAttachment: true,
  extractedFromEmails: string[],  // Array of .msg file hashes
  firstSeenInEmail: string,       // Hash of first .msg that had this attachment

  // Copy tracking (if this attachment appeared with different metadata)
  copies: Array<{
    fileName: string,        // Filename variant
    emailMessageId: string,  // ID in emails collection
    emailId: string,         // Hash of .msg file
    attachedDate: Timestamp,
    size: number
  }>,

  // Standard processing fields
  status: string,
  processedAt: Timestamp | null
}
```

---

## Processing Algorithm

### High-Level Workflow

```
User uploads file.msg
    ↓
Hash file.msg → Upload to /uploads/<hash>
    ↓
Detect file type = 'email'
    ↓
🆕 Email Extraction Stage
    ↓
    ├─ Parse .msg file
    ├─ Extract native message
    ├─ Extract quoted messages
    ├─ Process attachments (recursive if .msg)
    │   ├─ Hash attachment
    │   ├─ Check if duplicate
    │   ├─ Upload to /uploads if new
    │   └─ Record metadata
    ├─ Save messages to /emails
    └─ Update original file record
    ↓
Continue to Stage 2 (Bates numbering)
    ↓
Later: Stage 3 (Email Threading)
```

### Recursive Attachment Processing

```typescript
/**
 * Recursively processes an email file, extracting messages and attachments
 *
 * @param fileHash - BLAKE3 hash of the .msg file
 * @param parentEmailHash - Hash of parent .msg if this is nested
 * @param depth - Current nesting depth (max 10)
 */
async function processEmailFile(
  fileHash: string,
  parentEmailHash: string | null = null,
  depth: number = 0
): Promise<void> {

  // Safety check: prevent infinite recursion
  if (depth > 10) {
    throw new Error(`Email nesting exceeded maximum depth of 10 at file ${fileHash}`)
  }

  // 1. Download original .msg file from storage
  const msgBuffer = await downloadFromStorage(`/uploads/${fileHash}`)

  // 2. Parse .msg file
  const parsed = await parseMsgFile(msgBuffer)  // Using msg-reader library

  // 3. Extract native (current) message
  const nativeMessage = {
    subject: parsed.subject,
    from: parsed.from,
    to: parsed.to,
    cc: parsed.cc,
    bcc: parsed.bcc,
    date: parsed.date,
    bodyHtml: parsed.bodyHtml,
    bodyText: parsed.bodyText,
    headers: parsed.headers,
    isNative: true,
    messageType: 'native'
  }

  // 4. Extract quoted (previous) messages from thread
  //    Parse email body for quoted sections like "On Jan 5, John wrote:"
  const quotedMessages = await extractQuotedMessages(parsed.bodyHtml, parsed.bodyText)

  // 5. Process all attachments (including nested .msg files)
  const processedAttachments = []

  for (const attachment of parsed.attachments) {

    // 5a. Hash the attachment
    const attachmentHash = await hashBlake3(attachment.data)

    // 5b. Check if attachment is a .msg file (nested email)
    const isNestedEmail = attachment.fileName.toLowerCase().endsWith('.msg') ||
                          attachment.fileName.toLowerCase().endsWith('.eml')

    if (isNestedEmail) {

      // 5c. Save nested .msg to /uploads
      await uploadToStorage(attachment.data, `/uploads/${attachmentHash}`)

      // 5d. Create file record for nested .msg
      await createFileRecord({
        id: attachmentHash,
        firmId: getCurrentFirmId(),
        sourceFileName: attachment.fileName,
        fileType: 'email',
        fileSize: attachment.size,
        storagePath: `/uploads/${attachmentHash}`,
        isNestedEmail: true,
        parentEmailFile: fileHash,
        nestingDepth: depth + 1,
        hasBeenParsed: false  // Will be processed recursively
      })

      // 5e. Recursively process the nested email
      await processEmailFile(attachmentHash, fileHash, depth + 1)

      processedAttachments.push({
        fileHash: attachmentHash,
        fileName: attachment.fileName,
        size: attachment.size,
        mimeType: attachment.mimeType,
        wasUploaded: true,
        isDuplicate: false,  // Nested emails are always preserved
        nestedEmail: true
      })

    } else {
      // 5f. Regular attachment (non-email)

      // Check if this hash already exists in system
      const existingFile = await checkFileExists(attachmentHash)

      if (!existingFile) {
        // New attachment - save to /uploads as primary
        await uploadToStorage(attachment.data, `/uploads/${attachmentHash}`)

        await createFileRecord({
          id: attachmentHash,
          firmId: getCurrentFirmId(),
          sourceFileName: attachment.fileName,
          fileType: getFileType(attachment.fileName),
          fileSize: attachment.size,
          storagePath: `/uploads/${attachmentHash}`,
          isEmailAttachment: true,
          extractedFromEmails: [fileHash],
          firstSeenInEmail: fileHash,
          copies: []
        })

        processedAttachments.push({
          fileHash: attachmentHash,
          fileName: attachment.fileName,
          size: attachment.size,
          mimeType: attachment.mimeType,
          wasUploaded: true,
          isDuplicate: false,
          nestedEmail: false
        })

      } else {
        // Duplicate attachment - check if metadata is unique
        const metadataIsDifferent = existingFile.sourceFileName !== attachment.fileName

        if (metadataIsDifferent) {
          // Record as copy with unique metadata
          await updateFileRecord(attachmentHash, {
            extractedFromEmails: arrayUnion(fileHash),
            copies: arrayUnion({
              fileName: attachment.fileName,
              emailMessageId: null,  // Will be set when we save email message
              emailId: fileHash,
              attachedDate: nativeMessage.date,
              size: attachment.size
            })
          })
        }

        processedAttachments.push({
          fileHash: attachmentHash,
          fileName: attachment.fileName,
          size: attachment.size,
          mimeType: attachment.mimeType,
          wasUploaded: false,
          isDuplicate: true,
          nestedEmail: false
        })
      }
    }
  }

  // 6. Save native message to /emails
  const nativeMessageId = await saveEmailMessage({
    ...nativeMessage,
    firmId: getCurrentFirmId(),
    userId: getCurrentUserId(),
    extractedFromFile: fileHash,
    extractedFromPath: `/uploads/${fileHash}`,
    attachments: processedAttachments.map(att => ({
      fileHash: att.fileHash,
      fileName: att.fileName,
      size: att.size,
      mimeType: att.mimeType,
      isDuplicate: att.isDuplicate,
      storagePath: att.wasUploaded ? `/uploads/${att.fileHash}` : null,
      primaryLocation: att.isDuplicate ? await getPrimaryLocation(att.fileHash) : null,
      isNestedEmail: att.nestedEmail
    })),
    storagePath: `/emails/${generateId()}`
  })

  // 7. Update copy records with native message ID
  for (const att of processedAttachments) {
    if (att.isDuplicate) {
      await updateCopyMetadata(att.fileHash, fileHash, nativeMessageId)
    }
  }

  // 8. Save quoted messages to /emails (no attachments)
  const quotedMessageIds = []
  for (const quoted of quotedMessages) {
    const quotedId = await saveEmailMessage({
      ...quoted,
      firmId: getCurrentFirmId(),
      userId: getCurrentUserId(),
      extractedFromFile: fileHash,
      extractedFromPath: `/uploads/${fileHash}`,
      isNative: false,
      messageType: 'quoted',
      attachments: [],  // Quoted messages don't have separate attachments
      storagePath: `/emails/${generateId()}`
    })
    quotedMessageIds.push(quotedId)
  }

  // 9. Update original .msg file record
  await updateFileRecord(fileHash, {
    hasBeenParsed: true,
    parsedAt: serverTimestamp(),
    parseStatus: 'completed',
    extractedMessageCount: 1 + quotedMessages.length,
    extractedAttachmentCount: processedAttachments.length,
    extractedMessages: [
      {
        messageId: nativeMessageId,
        isNative: true,
        subject: nativeMessage.subject,
        from: nativeMessage.from.email,
        date: nativeMessage.date
      },
      ...quotedMessages.map((q, i) => ({
        messageId: quotedMessageIds[i],
        isNative: false,
        subject: q.subject,
        from: q.from.email,
        date: q.date
      }))
    ],
    extractedAttachments: processedAttachments
  })

  console.log(`✅ Processed email ${fileHash} at depth ${depth}:`)
  console.log(`   - ${1 + quotedMessages.length} messages extracted`)
  console.log(`   - ${processedAttachments.length} attachments processed`)
  console.log(`   - ${processedAttachments.filter(a => a.nestedEmail).length} nested emails`)
}
```

### Algorithm Flow Diagram

```
processEmailFile(hash, parent, depth)
    ↓
    ├─ Download .msg from /uploads/<hash>
    ├─ Parse .msg
    ├─ Extract native message
    ├─ Extract quoted messages
    ↓
    └─ For each attachment:
        ├─ Hash attachment
        ├─ Is .msg file?
        │   ├─ YES → Upload to /uploads
        │   │         Create file record
        │   │         RECURSE: processEmailFile(attachmentHash, hash, depth+1)
        │   └─ NO  → Already exists?
        │             ├─ NO  → Upload to /uploads (primary)
        │             │         Create file record
        │             └─ YES → Skip upload
        │                       Record as copy if metadata differs
        ↓
        ├─ Save native message → /emails/<id>
        ├─ Save quoted messages → /emails/<id>
        └─ Update original file record
```

---

## Integration with Existing File Lifecycle

### Modified Processing Stages

**Stage 1: Upload & Pre-Processing**

```
Stage 1a: Queue Files
    ↓
Stage 1b: Hash Files (BLAKE3)
    ↓
Stage 1c: 🆕 Email Extraction (NEW)
    │
    ├─ Detect .msg/.eml files
    ├─ Parse email structure
    ├─ Extract all messages (native + quoted)
    ├─ Recursively process attachments
    │   ├─ Hash extracted attachments
    │   ├─ Upload new attachments to /uploads
    │   └─ Record duplicate metadata
    ├─ Save messages to /emails
    └─ Update file records
    ↓
Stage 1d: Deduplication (existing)
    │  Note: Now includes extracted attachments
    ↓
Stage 1e: Upload Confirmation (existing)
```

**Stage 2: Bates Numbering** (unchanged)

**Stage 3: Email Threading** (future)
- Works with data in `/emails` collection
- Much lighter processing (no large attachments)
- Can reference attachments by hash

### File Type Detection

```typescript
// In file upload handler
async function processFile(file: File) {
  const hash = await hashBlake3(file)
  const fileType = detectFileType(file.name)

  // Upload to /uploads
  await uploadToStorage(file, `/uploads/${hash}`)

  // Create file record
  await createFileRecord({
    id: hash,
    sourceFileName: file.name,
    fileType: fileType,
    // ... other fields
  })

  // If email type, trigger extraction
  if (fileType === 'email') {
    await processEmailFile(hash, null, 0)
  }
}

function detectFileType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'msg' || ext === 'eml') return 'email'
  if (ext === 'pdf') return 'pdf'
  // ... etc
}
```

---

## UI/UX Considerations

### Email File Display

When displaying an email file in the document organizer:

```
📧 conversation.msg
   ├─ 📨 Native: Re: Contract Review (John Doe → Jane Smith)
   ├─ 💬 Quoted: Contract Review (Jane Smith → John Doe)
   ├─ 💬 Quoted: Initial Request (John Doe → Jane Smith)
   ├─ 📎 contract.pdf (125 KB) → Uploaded
   └─ 📎 logo.png (45 KB) → Duplicate (skip)

3 messages, 2 attachments (1 duplicate)
```

### Attachment Status Indicators

| Status | Icon | Tooltip | Action |
|--------|------|---------|--------|
| Uploaded | ✅ | "New file uploaded to storage" | Link to file in organizer |
| Duplicate | 🔗 | "Duplicate of existing file" | Link to primary copy |
| Nested Email | 📧 | "Attached email (processed separately)" | Link to extracted email |

### Email Message View

When viewing an individual email message:

```
┌─────────────────────────────────────────┐
│ 📨 Native Message                       │
├─────────────────────────────────────────┤
│ From: John Doe <john@example.com>      │
│ To: Jane Smith <jane@example.com>      │
│ Date: January 15, 2024 2:30 PM         │
│ Subject: Re: Contract Review            │
├─────────────────────────────────────────┤
│ [Email body content]                    │
├─────────────────────────────────────────┤
│ 📎 Attachments (2)                      │
│   • contract.pdf (125 KB) [View]       │
│   • logo.png (45 KB) [Duplicate]       │
├─────────────────────────────────────────┤
│ 🔗 Thread (3 messages)                  │
│   View full conversation               │
└─────────────────────────────────────────┘
```

---

## Implementation Requirements

### Required Libraries

```json
{
  "dependencies": {
    "@kenjiuno/msgreader": "^2.4.0",  // Parse .msg files
    "mailparser": "^3.6.5",           // Parse .eml files
    "hash-wasm": "^4.11.0",           // BLAKE3 hashing (existing)
    "mime-types": "^2.1.35"           // MIME type detection
  }
}
```

### Library Usage Examples

**Parse .msg file:**
```typescript
import MsgReader from '@kenjiuno/msgreader'

async function parseMsgFile(buffer: Buffer) {
  const msgReader = new MsgReader(buffer)
  const fileData = msgReader.getFileData()

  return {
    subject: fileData.subject,
    from: {
      name: fileData.senderName,
      email: fileData.senderEmail
    },
    to: fileData.recipients.filter(r => r.type === 'to'),
    cc: fileData.recipients.filter(r => r.type === 'cc'),
    bcc: fileData.recipients.filter(r => r.type === 'bcc'),
    date: new Date(fileData.creationTime),
    bodyHtml: fileData.bodyHTML,
    bodyText: fileData.body,
    headers: fileData.headers,
    attachments: fileData.attachments.map(att => ({
      fileName: att.fileName,
      data: att.content,
      size: att.content.length,
      mimeType: att.mimeType
    }))
  }
}
```

**Parse .eml file:**
```typescript
import { simpleParser } from 'mailparser'

async function parseEmlFile(buffer: Buffer) {
  const parsed = await simpleParser(buffer)

  return {
    subject: parsed.subject,
    from: {
      name: parsed.from?.value[0]?.name || null,
      email: parsed.from?.value[0]?.address || ''
    },
    to: parsed.to?.value.map(addr => ({
      name: addr.name || null,
      email: addr.address
    })) || [],
    cc: parsed.cc?.value.map(addr => ({
      name: addr.name || null,
      email: addr.address
    })) || [],
    bcc: parsed.bcc?.value.map(addr => ({
      name: addr.name || null,
      email: addr.address
    })) || [],
    date: parsed.date || new Date(),
    bodyHtml: parsed.html || null,
    bodyText: parsed.text || '',
    headers: Object.fromEntries(
      Array.from(parsed.headers.entries())
    ),
    attachments: parsed.attachments.map(att => ({
      fileName: att.filename,
      data: att.content,
      size: att.size,
      mimeType: att.contentType
    }))
  }
}
```

### Extract Quoted Messages

```typescript
/**
 * Extracts quoted/previous messages from email body
 * This is a simplified example - production needs more sophisticated parsing
 */
function extractQuotedMessages(
  bodyHtml: string | null,
  bodyText: string
): QuotedMessage[] {
  const quotedMessages: QuotedMessage[] = []

  // Common patterns for quoted sections:
  // "On [date], [name] wrote:"
  // "From: [name] Sent: [date]"
  // "-----Original Message-----"

  const quotedPattern = /On\s+(.+?),\s+(.+?)\s+wrote:/gi
  const matches = bodyText.matchAll(quotedPattern)

  for (const match of matches) {
    // Extract date and sender from pattern
    const dateStr = match[1]
    const senderStr = match[2]

    // Parse email address from sender string
    const emailMatch = senderStr.match(/<(.+?)>/)
    const email = emailMatch ? emailMatch[1] : senderStr

    // Extract quoted content (simplified - needs more robust parsing)
    const startIdx = match.index || 0
    const quotedContent = extractQuotedBlock(bodyText, startIdx)

    quotedMessages.push({
      subject: '',  // Usually not available in quoted sections
      from: {
        name: senderStr.replace(/<.+?>/, '').trim(),
        email: email
      },
      to: [],  // Usually not available
      cc: [],
      bcc: [],
      date: new Date(dateStr),
      bodyHtml: null,
      bodyText: quotedContent,
      headers: {},
      isNative: false,
      messageType: 'quoted'
    })
  }

  return quotedMessages
}
```

---

## Security Considerations

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Original email files
    match /uploads/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }

    // Parsed email messages
    match /emails/{messageId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }

    // Extracted attachments
    match /files/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Uploads folder (original files + attachments)
    match /firms/{firmId}/uploads/{fileHash} {
      allow read: if request.auth != null
        && request.auth.uid == getFirmUserId(firmId);
      allow write: if request.auth != null
        && request.auth.uid == getFirmUserId(firmId);
    }

    // Emails folder (parsed messages)
    match /firms/{firmId}/emails/{messageId} {
      allow read: if request.auth != null
        && request.auth.uid == getFirmUserId(firmId);
      allow write: if request.auth != null
        && request.auth.uid == getFirmUserId(firmId);
    }
  }

  function getFirmUserId(firmId) {
    return firestore.get(/databases/(default)/documents/firms/$(firmId)).data.userId;
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Email Extraction', () => {

  describe('parseMsgFile', () => {
    it('should extract native message metadata', async () => {
      const buffer = await loadTestMsgFile('simple-email.msg')
      const result = await parseMsgFile(buffer)

      expect(result.subject).toBe('Test Subject')
      expect(result.from.email).toBe('sender@example.com')
      expect(result.attachments).toHaveLength(2)
    })
  })

  describe('processEmailFile', () => {
    it('should handle nested .msg attachments', async () => {
      // Mock: email.msg contains nested.msg as attachment
      const result = await processEmailFile('test-hash', null, 0)

      expect(result.extractedAttachments).toContainEqual(
        expect.objectContaining({ nestedEmail: true })
      )
    })

    it('should deduplicate attachments across emails', async () => {
      // Upload first email with attachment
      await processEmailFile('email1-hash', null, 0)

      // Upload second email with same attachment (different filename)
      await processEmailFile('email2-hash', null, 0)

      const file = await getFileRecord('attachment-hash')
      expect(file.copies).toHaveLength(1)
    })

    it('should prevent infinite recursion', async () => {
      // Mock: deeply nested emails beyond limit
      await expect(
        processEmailFile('circular-hash', null, 11)
      ).rejects.toThrow('exceeded maximum depth')
    })
  })

  describe('extractQuotedMessages', () => {
    it('should parse quoted sections from body', () => {
      const bodyText = `
        Thanks for your response.

        On Jan 15, 2024, John Doe <john@example.com> wrote:
        > This is the previous message
      `

      const quoted = extractQuotedMessages(null, bodyText)
      expect(quoted).toHaveLength(1)
      expect(quoted[0].from.email).toBe('john@example.com')
    })
  })
})
```

### Integration Tests

```typescript
describe('Email Extraction Integration', () => {

  it('should complete full email extraction workflow', async () => {
    // 1. Upload .msg file
    const file = await loadTestFile('conversation.msg')
    const hash = await hashBlake3(file)

    await uploadToStorage(file, `/uploads/${hash}`)

    // 2. Trigger extraction
    await processEmailFile(hash, null, 0)

    // 3. Verify original file record
    const uploadRecord = await getUploadRecord(hash)
    expect(uploadRecord.hasBeenParsed).toBe(true)
    expect(uploadRecord.extractedMessageCount).toBeGreaterThan(0)

    // 4. Verify messages were created
    const messages = await getEmailMessages(hash)
    expect(messages).toHaveLength(uploadRecord.extractedMessageCount)
    expect(messages.some(m => m.isNative)).toBe(true)

    // 5. Verify attachments were processed
    for (const att of uploadRecord.extractedAttachments) {
      if (att.wasUploaded) {
        const fileExists = await checkStorageExists(`/uploads/${att.fileHash}`)
        expect(fileExists).toBe(true)
      }
    }
  })
})
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Attachment Processing**
   - Hash attachments in parallel (use Promise.all)
   - Upload non-duplicate attachments concurrently

2. **Batch Firestore Writes**
   - Use batch writes for multiple quoted messages
   - Update file records in batches

3. **Progressive UI Updates**
   - Emit progress events during extraction
   - Update UI as each message/attachment is processed

4. **Worker Thread Hashing**
   - Use existing web worker for BLAKE3 hashing
   - Keep UI responsive during large file processing

### Example: Parallel Processing

```typescript
// Process attachments in parallel
const attachmentPromises = parsed.attachments.map(async (attachment) => {
  const hash = await hashBlake3(attachment.data)
  const exists = await checkFileExists(hash)

  if (!exists && !isNestedEmail(attachment)) {
    await uploadToStorage(attachment.data, `/uploads/${hash}`)
  }

  return { hash, exists, attachment }
})

const processedAttachments = await Promise.all(attachmentPromises)
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic .msg parsing
- ✅ Attachment extraction
- ✅ Native message extraction
- ✅ Deduplication integration

### Phase 2 (Next)
- 📧 Email threading (Stage 3)
- 🔍 Advanced quoted message parsing
- 📊 Conversation view UI

### Phase 3 (Future)
- 🤖 AI-powered email categorization
- 🔗 Automatic thread reconstruction
- 📎 Inline attachment preview
- 🏷️ Smart tagging based on email content

---

## References

- Parent Documentation: `docs/Features/Upload/CLAUDE.md`
- File Lifecycle: `docs/Features/Upload/Processing/file-lifecycle.md`
- Deduplication: `docs/Features/Upload/Deduplication/CLAUDE.md`
- File Processing: `docs/Features/Upload/Processing/file-processing.md`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Status:** 🟡 Design Review
