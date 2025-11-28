# Email Extraction Documentation

## Overview

This folder contains documentation for email extraction and processing within ListBot's file upload pipeline.

**Email extraction** is the process of parsing email files (.msg, .eml), extracting individual messages and attachments, and integrating them with ListBot's existing deduplication system.

---

## Key Concepts

### Why Email Extraction?

Email files (.msg, .eml) contain:
1. **Multiple messages** - A single .msg can contain a thread of previous emails
2. **Attachments** - Files attached to emails that need deduplication
3. **Nested emails** - Emails can have other emails as attachments (recursive)

**Without extraction:**
- Duplicate attachments across multiple emails waste storage
- Cannot thread conversations or search individual messages
- Cannot deduplicate attachments sent in multiple email threads

**With extraction:**
- Attachments deduplicated across ALL emails
- Individual messages searchable and threadable
- Nested emails processed recursively
- Original .msg preserved for evidentiary integrity

---

## Processing Stages

Email extraction occurs during **Stage 1c** of the file processing pipeline:

```
Stage 1a: Queue Files
    ↓
Stage 1b: Hash Files (BLAKE3)
    ↓
Stage 1c: Email Extraction ← NEW STAGE
    ↓
Stage 1d: Deduplication (now includes extracted attachments)
    ↓
Stage 1e: Upload Confirmation
```

**Later:** Stage 3 (Email Threading) uses extracted messages from this stage.

---

## Storage Architecture

### Firebase Storage Structure

```
/uploads/           → Original .msg files + extracted attachments
/emails/            → Parsed individual email messages
```

**Key Design Decision:**
- Email **messages** (body + headers) stored in `/emails`
- Email **attachments** stored in `/uploads` (with deduplication)
- Original `.msg` files preserved in `/uploads` (evidentiary integrity)

---

## Terminology

### Email Message Types

| Term | Definition | Example |
|------|-----------|---------|
| **Native** | Current/top-level message in .msg file | The reply you just received |
| **Quoted** | Previous messages in thread | "On Jan 5, John wrote..." |

### Attachment Deduplication

| Term | Definition | Action |
|------|-----------|--------|
| **Best/Primary** | First occurrence or best metadata | ✅ Upload to storage |
| **Copy** | Duplicate with different metadata | ❌ Skip upload, record metadata only |

Aligns with existing deduplication terminology in `@docs/Features/Upload/Deduplication/CLAUDE.md`.

---

## Documentation Files

### Core Architecture

📄 **email-extraction-architecture.md**
- Complete technical specification
- Firestore schema design
- Recursive processing algorithm
- Integration with file lifecycle
- Security rules and testing strategy

**When to reference:**
- Implementing email extraction features
- Understanding storage structure
- Designing Firestore queries for emails
- Writing tests for email processing

---

## Quick Reference

### Firestore Collections

| Collection | Purpose | Document ID |
|-----------|---------|-------------|
| `uploads` | Original .msg files | BLAKE3 hash |
| `emails` | Individual parsed messages | Auto-generated |
| `files` | Extracted attachments | BLAKE3 hash |

### Key Fields

**uploads** (original .msg):
- `hasBeenParsed: boolean` - Extraction status
- `extractedMessages: array` - List of parsed messages
- `extractedAttachments: array` - List of extracted attachments
- `isNestedEmail: boolean` - True if extracted from another email

**emails** (individual messages):
- `isNative: boolean` - Native vs Quoted
- `extractedFromFile: string` - Hash of source .msg
- `attachments: array` - References to attachment hashes

**files** (attachments):
- `isEmailAttachment: true`
- `extractedFromEmails: array` - List of .msg hashes
- `copies: array` - Metadata variants if duplicate

---

## Implementation Checklist

When implementing email extraction:

- [ ] Install required libraries (`@kenjiuno/msgreader`, `mailparser`)
- [ ] Update Firestore schema with new fields
- [ ] Implement `processEmailFile()` recursive function
- [ ] Add email type detection in upload handler
- [ ] Update deduplication to handle extracted attachments
- [ ] Create UI components for email display
- [ ] Write unit tests for parsing logic
- [ ] Write integration tests for full workflow
- [ ] Update security rules for `/emails` storage path

---

## Related Documentation

**Parent:**
- `@docs/Features/Upload/CLAUDE.md` - Upload feature overview

**Related:**
- `@docs/Features/Upload/Processing/file-lifecycle.md` - File terminology
- `@docs/Features/Upload/Deduplication/CLAUDE.md` - Deduplication rules
- `@docs/Features/Upload/Processing/file-processing.md` - Processing workflow

**Future:**
- Email threading (Stage 3) - TBD

---

## Example Queries

### Get all messages from an email file

```typescript
const q = query(
  collection(db, 'emails'),
  where('firmId', '==', firmId),
  where('extractedFromFile', '==', msgFileHash),
  orderBy('date', 'desc')
)
const messages = await getDocs(q)
```

### Get all emails containing an attachment

```typescript
const q = query(
  collection(db, 'emails'),
  where('firmId', '==', firmId),
  where('attachments', 'array-contains', {
    fileHash: attachmentHash
  })
)
const emailsWithAttachment = await getDocs(q)
```

### Check if file has been parsed

```typescript
const uploadDoc = await getDoc(doc(db, 'uploads', msgFileHash))
const hasBeenParsed = uploadDoc.data()?.hasBeenParsed || false
```

---

**Last Updated:** 2025-11-28
**Status:** 🟡 Design Phase
