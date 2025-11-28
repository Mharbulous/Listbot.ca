# Email Extraction Documentation Update - Handover

## Context

Email extraction architecture has been designed (`docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`). Now need to update related documentation files to maintain consistency across the codebase.

## Primary Documentation

**Complete Design:** `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`
- Terminology: Native vs Quoted messages
- Firestore schema: `uploads`, `emails`, `files` collections
- Storage paths: `/uploads` (files + attachments), `/emails` (parsed messages)
- Recursive processing algorithm with depth limit
- Non-obvious implementation details

## Files Requiring Updates

### HIGH PRIORITY

#### 1. `docs/Features/Upload/Processing/file-lifecycle.md` ⚠️ CRITICAL
**Why:** This is THE authoritative source for file terminology across the entire codebase.

**Required Changes:**
- Add **Native** and **Quoted** to Email Message Types section
- Include strict definitions with forensic implications
- Add examples of tampering detection
- Maintain consistency with existing terminology (Original, Source, Upload, Batesed, etc.)

**Location for Addition:** After line 38 "Document" definition, add new section:
```markdown
### Email Message Types (For Email Processing)

10. **Native** - The current/top-level message in an email file (.msg, .eml) for which we have actual metadata from the email file's binary structure
   - High metadata reliability - extracted directly from email file headers
   - Forensically trustworthy for chain of custody
   - Example: The reply email you just received (has authoritative From, To, Date, Subject)

11. **Quoted** - Previous messages in an email thread extracted from quoted text in the email body
   - Variable metadata reliability - parsed from text blocks that can be edited
   - Cannot be verified without original email file
   - Example: "On Jan 5, John wrote: ..." (sender could have modified this text)
```

**⚠️ Critical:**  These definitions distinguish reliable (Native) from potentially-tampered (Quoted) content. Essential for legal/evidentiary use.

#### 2. `docs/Data/25-11-18-data-structures.md`
**Why:** Central hub for ALL Firestore collections. Must document new `emails` collection.

**Required Changes:**
- Add `emails` collection to "Collection Structure" section (line 128-138)
- Update path list to include: `/firms/{firmId}/emails/{messageId}`
- Add brief description: "Individual parsed email messages from .msg files"
- Reference Email-Extraction documentation for details

**New Section to Add** (after line 138):
```markdown
### Email Messages Collection (NEW)

**Path**: `/firms/{firmId}/emails/{messageId}`

Individual email messages parsed from .msg/.eml files during email extraction.

**Purpose**:
- Store parsed Native and Quoted messages separately for threading
- Enable full-text search across email content
- Support modification detection (compare Quoted vs original Native)

**Document ID**: Auto-generated (not hash-based) to allow duplicate quoted content across multiple .msg files

**Key Fields**:
- `isNative`: boolean - Native (reliable) vs Quoted (potentially edited)
- `extractedFromFile`: string - Hash of original .msg file
- `attachments`: array - References to attachment hashes
- `bodyText`, `bodyHtml`: Email content
- `from`, `to`, `cc`, `bcc`: Email addresses
- `subject`, `date`: Message metadata

**See**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md` for complete schema

**Integration**:
- Stage 1c (Email Extraction) populates this collection
- Stage 3 (Email Threading) consumes this data
```

**Update "Complete Collection Paths"** (line 131-138):
```markdown
/users/{userId}
/firms/{firmId}
/firms/{firmId}/matters/{matterId}
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}
/firms/{firmId}/matters/{matterId}/categories/{categoryId}
/firms/{firmId}/emails/{messageId}  ← ADD THIS LINE
```

#### 3. `docs/Features/Upload/Storage/firebase-storage-plan.md`
**Why:** Documents storage path structure. Must include new `/emails` path.

**Required Changes:**
- Update "Storage Structure (Simplified)" section (line 77-84)
- Add `/emails` path with explanation
- Clarify distinction between email messages (light) vs email files (heavy)

**Updated Structure** (replace lines 77-84):
```markdown
## Storage Structure

```
Firebase Storage Root
└── /firms/{firmId}/
    └── /matters/{matterId}/
        ├── /uploads/{fileHash}.{ext}     # Original files + attachments
        └── /emails/{messageId}           # Parsed email message bodies (NEW)
```

**Path Purposes:**
- `/uploads`: Binary files (original .msg, extracted attachments, regular uploads)
- `/emails`: Parsed message bodies (HTML/text content for threading)

**Storage Optimization:**
- Email messages stored separately to avoid re-parsing .msg files
- Attachments deduplicated in /uploads regardless of source email
- Original .msg files preserved for evidentiary integrity
```

### MEDIUM PRIORITY

#### 4. `docs/Features/Upload/CLAUDE.md`
**Why:** Feature overview must reference new Email-Extraction sub-feature.

**Required Changes:**
- Add reference to Email-Extraction in "Documentation Organization" section (after line 14)

**Add** (after line 14):
```markdown
### Email Extraction
@docs/Features/Upload/Email-Extraction/CLAUDE.md - Email parsing, attachment extraction, message threading prep
```

#### 5. `docs/Features/Upload/Processing/CLAUDE.md`
**Why:** References file-lifecycle.md which will be updated.

**Required Changes:**
- Update "Critical File Terminology" list (line 28-38) to include Native and Quoted
- Add note about email-specific terms

**Add** (after line 38):
```markdown
### Email Processing Terms (See file-lifecycle.md)

- **Native**: Current message in .msg file (reliable metadata)
- **Quoted**: Previous messages in thread (potentially edited)
```

### LOW PRIORITY (Reference Updates)

#### 6. `docs/Features/Organizer/Data/25-11-18-file-metadata-schema.md`
**Why:** Documents file metadata collections. Should note that some files are email attachments.

**Optional Addition** (after line 285 "sourceMetadata Subcollection"):
```markdown
**Note**: Files with `isEmailAttachment: true` were extracted from .msg files during email processing. See `docs/Features/Upload/Email-Extraction/` for extraction workflow.
```

## Files That Look Relevant But Are NOT

### ❌ `docs/Features/Organizer/Data/25-11-18-evidence-schema.md`
**Why NOT:** Evidence schema is for uploaded files, not email messages. Email messages are in separate `emails` collection, not nested under `evidence`.

### ❌ `docs/Features/Upload/Deduplication/` (all files)
**Why NOT:** Deduplication logic already works correctly. Email attachments participate in existing BLAKE3 deduplication. No changes needed.

### ❌ `docs/Features/Upload/Processing/file-processing.md`
**Why NOT:** Generic file processing. Email extraction is a specific sub-workflow documented separately.

## Implementation Order

1. **Start:** `file-lifecycle.md` - Add Native/Quoted definitions (critical for terminology consistency)
2. **Then:** `data-structures.md` - Document emails collection (database schema)
3. **Then:** `firebase-storage-plan.md` - Document /emails storage path (storage structure)
4. **Finally:** `CLAUDE.md` files - Update references (navigation)

## Approach That Failed

**DON'T** try to update `evidence-schema.md` to include email messages. Email messages are a separate collection, not a subcollection of evidence. Mixing them causes confusion.

## Key Non-Obvious Details (From Architecture Doc)

### 1. Native vs Quoted Distinction
Not just about reliability - it's about **forensic value**. Quoted messages can be edited before sending, making them inadmissible as evidence without corroboration.

### 2. Auto-Generated IDs for Email Messages
Must use auto-generated IDs (not hashes) because identical quoted content appears in multiple .msg files. Hash-based IDs would lose source tracking.

### 3. Processing Order Matters
Attachments must be hashed BEFORE saving email messages, because email documents reference attachment hashes. Wrong order = incomplete data or extra update operations.

### 4. Original .msg Never Deleted
Even after extraction, original must be preserved for legal/evidentiary reasons. This is a hard requirement, not an optimization.

### 5. Terminology Confusion: Collections vs Storage Paths
- Firestore collections: `uploads`, `emails`, `files` (metadata in database)
- Storage paths: `/uploads/`, `/emails/` (actual file bytes)
- Same names, completely different systems

## Current Git State

**Branch:** `claude/email-threading-design-018tZef59JMxUPbwo9aXWAhu`
**Last Commit:** `daa8af8` - "DESIGN: Add comprehensive email extraction architecture documentation"
**Status:** Clean working directory

## Next Session Instructions

**Branch for next session:** Create NEW branch with naming pattern: `claude/email-docs-update-<session-id>`

**Tasks:**
1. Read `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md` (reference)
2. Update files in Implementation Order (above)
3. Commit incrementally (one file per commit)
4. Push when complete

**Validation:**
- Terminology consistency: Native/Quoted match across all files
- No orphaned references: All @-imports resolve correctly
- Schema completeness: emails collection documented in data-structures.md

---

**Estimated Effort:** 30-45 minutes
**Complexity:** Low (mostly additive documentation updates)
**Risk:** Low (no code changes, only documentation)
