# Email Extraction Implementation - Handover Prompt

## Context

Implementing client-side email extraction for .msg/.eml files in ListBot. All architectural decisions finalized, ready to begin implementation.

## What's Done

1. **Architecture designed**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md` (comprehensive, 1260 lines)
2. **Decisions finalized**: `planning/2. TODOs/2025-11-28-Email_Extraction_Plan.md` (implementation plan)
3. **Approach selected**: Client-side extraction (rejected server-side Cloud Functions)

## Key Decisions

- **Storage**: Bodies in Firebase Storage, metadata in Firestore
- **Formats**: Both .msg and .eml
- **Scope v1**: Native messages only (skip quoted message parsing - too heuristic)
- **Size limits**: 100MB max for emails; fail extraction if any attachment >100MB
- **Depth limit**: 10 levels for nested .msg files
- **Failures**: Upload file anyway, mark `hasBeenParsed: false` for manual retry
- **UI**: Minimal progress ("Processing email...", "Extracting attachments...")

## Implementation Plan

**Start here**: Phase 1 - Install dependencies and build parsers

### Phase 1 Tasks
1. Install: `npm install @kenjiuno/msgreader mailparser mime-types`
2. Create `/src/features/upload/parsers/msgParser.js`
3. Create `/src/features/upload/parsers/emlParser.js`
4. Create `/src/features/upload/parsers/emailParserFactory.js`
5. Test parsers with sample .msg/.eml files

### Subsequent Phases
- Phase 2: Build `emailExtractionService.js` (recursive attachment processing)
- Phase 3: Storage integration (bodies → Storage, metadata → Firestore)
- Phase 4: Integrate into upload pipeline
- Phase 5: UI updates
- Phase 6: Security rules
- Phase 7: Testing & deployment

## File Structure Overview

**Existing upload system** (don't modify yet):
- `src/features/upload/composables/useFileProcessor.js` - Upload orchestration (integrate in Phase 4)
- `src/features/upload/workers/fileHashWorker.js` - BLAKE3 hashing (reuse for attachments)
- `src/features/upload/utils/fileTypeChecker.js` - File type detection (add 'email' type)

**New files to create**:
- `src/features/upload/parsers/` - Parser modules (Phase 1)
- `src/features/upload/services/emailExtractionService.js` - Core logic (Phase 2)
- `src/features/upload/composables/useEmailExtraction.js` - Vue composable (Phase 3)

## Key Architecture Points

1. **Email bodies NOT in Firestore** - Bodies stored in Storage paths `firms/{firmId}/emails/{messageId}/body.txt` and `body.html`. Firestore only has metadata + paths.

2. **Auto-generated message IDs** - Email messages use Firestore auto-IDs (NOT hash-based) because quoted messages can be identical across multiple .msg files. We need separate records to track each occurrence.

3. **Attachments deduplicated** - Extracted attachments hashed with BLAKE3 and stored in `firms/{firmId}/uploads/{hash}` (same path as regular uploads). Deduplication happens automatically.

4. **Recursive processing** - Nested .msg files (emails attached to emails) are extracted recursively up to depth 10. Each nested email gets its own record in `uploads` collection with `isNestedEmail: true`.

5. **Preserve originals** - Original .msg/.eml files ALWAYS uploaded to Storage, even if extraction fails. Legal/evidentiary requirement.

## Implementation Notes

### Parser Libraries

**@kenjiuno/msgreader** for .msg files:
```javascript
import MsgReader from '@kenjiuno/msgreader'
const msgReader = new MsgReader(buffer)
const fileData = msgReader.getFileData()
// Access: subject, senderEmail, recipients, attachments[], bodyHTML, body
```

**mailparser** for .eml files:
```javascript
import { simpleParser } from 'mailparser'
const parsed = await simpleParser(buffer)
// Access: subject, from, to, cc, attachments[], html, text
```

### Critical: Size Validation

Must validate BEFORE extraction:
1. Email file itself: reject if >100MB
2. Each attachment: reject entire extraction if ANY attachment >100MB

Rationale: User needs explicit notification about large files. Partial extraction without clear indication creates confusion.

### Firestore Schema

**New `emails` collection**:
- Document ID: Auto-generated (NOT hash)
- Stores metadata + Storage paths to bodies
- Reference to parent .msg file via `extractedFromFile` field

**Update `uploads` collection** (for .msg/.eml files):
- Add `hasBeenParsed: boolean`
- Add `parseStatus: 'pending' | 'processing' | 'completed' | 'failed'`
- Add `extractedMessages: Array<{messageId, subject, from, date}>`
- Add `extractedAttachments: Array<{fileHash, fileName, ...}>`

**Update `files` collection** (for extracted attachments):
- Add `isEmailAttachment: boolean`
- Add `extractedFromEmails: string[]` (array of .msg hashes)

## What NOT to Read

These files are **not relevant** to email extraction:
- `docs/Features/Organizer/*` - Document viewer/organizer (post-upload)
- `docs/Features/Matters/*` - Case management
- `docs/Features/Profile/*` - User settings
- `src/features/organizer/*` - Not involved in upload process
- Anything in `planning/7. Completed/*` - Historical context only

## Approaches Already Tried

**None yet** - This is greenfield implementation.

However, the architecture doc explains WHY certain approaches were rejected:
- **Server-side extraction** (Cloud Functions): Rejected due to higher cost, delayed feedback, bandwidth waste, cannot deduplicate before upload
- **Hash-based message IDs**: Rejected because identical quoted messages would collide (need separate records per occurrence)
- **Quoted message extraction in v1**: Deferred due to complexity (no standard format, heuristic parsing, can be edited by sender)

## Current Codebase Patterns

**Web worker pattern**: Upload system uses web workers for BLAKE3 hashing. See:
- `src/features/upload/composables/useSequentialHashWorker.js` - Worker wrapper
- `src/features/upload/workers/fileHashWorker.js` - Actual worker

**Reuse this pattern** for hashing extracted attachments (don't reinvent).

**Deduplication pattern**: Files deduplicated by BLAKE3 hash as document ID. See:
- `docs/Features/Upload/Deduplication/CLAUDE.md`
- Hash serves as Firestore doc ID → automatic database-level deduplication

**Apply same pattern** to extracted attachments.

## Git Workflow

**New branch**: `claude/email-extraction-v1-<session-id>` (create from current branch)
**Commits**: Implement phase-by-phase, commit after each phase completes
**PR**: Create when all 7 phases done and tested

## Next Steps

1. **Read** implementation plan: `planning/2. TODOs/2025-11-28-Email_Extraction_Plan.md`
2. **Skim** architecture (optional): `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`
3. **Start Phase 1**: Install dependencies, build parsers
4. **Test parsers** with sample .msg/.eml files before proceeding

## Quick Start Command

```bash
# Install dependencies
npm install @kenjiuno/msgreader mailparser mime-types

# Create parser directory
mkdir -p src/features/upload/parsers

# Begin implementing msgParser.js (see implementation plan for code)
```

---

**Ready to implement Phase 1?** Start with `msgParser.js` following the code template in the implementation plan.
