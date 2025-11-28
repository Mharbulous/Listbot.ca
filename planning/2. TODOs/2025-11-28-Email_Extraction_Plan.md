# Email Extraction Implementation Plan (v1)

**Date**: 2025-11-28
**Status**: Ready for Implementation
**Priority**: High
**Branch**: `claude/email-extraction-strategy-01QeDUo8mhie2GgCQSseA7Am`

**Architecture Document**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`

---

## Decision Summary

### ✅ Finalized Decisions (2025-11-28)

1. **Storage Strategy**: Email message bodies → Firebase Storage; Metadata → Firestore
2. **File Formats**: Both .msg and .eml
3. **Message Extraction**: Native messages only (skip quoted messages in v1)
4. **Failure Handling**: Upload as regular file, mark `hasBeenParsed: false` for manual retry
5. **Size Limits**: 100MB max for .msg/.eml files; fail extraction if any attachment >100MB
6. **Processing**: Parallel with other uploads (non-blocking)
7. **UI Detail**: Minimal ("Processing email...", "Extracting attachments...")
8. **Depth Limit**: 10 levels max; mark `hasBeenParsed: false` if exceeded

### 🎯 Implementation Approach

**Client-side extraction only** (no Cloud Functions) with:
- 100MB file size limit
- Integration with existing web worker pattern for hashing
- Parallel processing with other file uploads
- Graceful degradation on failures (upload file, mark for manual retry)

---

## Key Architecture Decisions

### Why Client-Side (Not Server-Side)?

**Selected**: Client-side extraction before upload
**Rejected**: Cloud Functions after upload to Storage

**Rationale**:
- ✅ Deduplication before upload (saves bandwidth)
- ✅ No Cloud Functions costs
- ✅ Real-time user feedback
- ✅ Integrates with existing Stage 1 pipeline
- ✅ Simpler architecture

**Trade-off Accepted**: Browser memory limits (~100MB practical max)

### Why Skip Quoted Messages in v1?

**Selected**: Extract native message only
**Deferred to v2**: Quoted message parsing

**Rationale**:
- Quoted message extraction is heuristic and error-prone (see architecture doc lines 255-289)
- Regex patterns miss many quote formats
- Quoted text can be modified by sender (forensically unreliable)
- Focus v1 on robust native message + attachment extraction

### Why Fail Extraction on Large Attachments?

**Selected**: Reject entire extraction if any attachment >100MB
**Rejected**: Skip large attachment, extract others

**Rationale**:
- User needs to know about large attachments explicitly
- Prevents incomplete extractions without clear indication
- Will build dedicated large file handling in future version

---

## File Structure

### New Files to Create

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

### Files to Modify

- `src/features/upload/utils/fileTypeChecker.js` - Add 'email' file type
- `src/features/upload/composables/useFileProcessor.js` - Integrate extraction
- `src/features/upload/components/StatusCell.vue` - Email status UI
- `firestore.rules` - Security rules for `emails` collection
- `storage.rules` - Security rules for `firms/{firmId}/emails/` path

---

## Dependencies

### NPM Packages to Install

```bash
npm install @kenjiuno/msgreader mailparser mime-types
```

**Library Purposes**:
- `@kenjiuno/msgreader` (~150KB) - Parse Microsoft Outlook .msg files
- `mailparser` (~200KB) - Parse standard RFC 822 .eml files
- `mime-types` (~50KB) - MIME type detection for attachments

---

## Firestore Schema Changes

### New Collection: `emails`

```typescript
{
  id: string,                            // Auto-generated unique ID
  firmId: string,
  userId: string,
  extractedFromFile: string,             // Hash of .msg/.eml file
  extractionDate: Timestamp,
  messageType: 'native',                 // Always 'native' in v1
  subject: string,
  from: { name: string | null, email: string },
  to: Array<{ name: string | null, email: string }>,
  cc: Array<{ name: string | null, email: string }>,
  date: Timestamp,
  bodyTextPath: string,                  // Storage path to body.txt
  bodyHtmlPath: string | null,           // Storage path to body.html
  attachments: Array<{
    fileHash: string,
    fileName: string,
    size: number,
    mimeType: string,
    isDuplicate: boolean,
    storagePath: string | null
  }>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Updates to `uploads` Collection

**Add these fields**:
```typescript
{
  // ... existing fields

  // Email extraction status
  hasBeenParsed: boolean,
  parsedAt: Timestamp | null,
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed',
  parseError: string | null,

  // Extraction results
  extractedMessageCount: number,
  extractedAttachmentCount: number,
  extractedMessages: Array<{ messageId, subject, from, date }>,
  extractedAttachments: Array<{ fileHash, fileName, size, wasUploaded, isDuplicate, nestedEmail }>,

  // Nested email tracking
  isNestedEmail: boolean,
  parentEmailFile: string | null,
  nestingDepth: number
}
```

### Updates to `files` Collection

**Add these fields**:
```typescript
{
  // ... existing fields

  // Email attachment tracking
  isEmailAttachment: boolean,
  extractedFromEmails: string[],
  firstSeenInEmail: string | null
}
```

---

## Implementation Phases

### Phase 1: Dependencies & Parsers
- Install NPM packages
- Create `msgParser.js` and `emlParser.js`
- Create `emailParserFactory.js` router
- Unit test parsers with sample .msg/.eml files

### Phase 2: Extraction Service
- Create `emailExtractionService.js`
- Implement recursive attachment processing
- Implement size/depth validation
- Handle nested .msg files

### Phase 3: Storage Integration
- Create `useEmailStorage.js` composable
- Implement body text/HTML upload to Storage
- Implement Firestore metadata writes
- Handle duplicate attachment detection

### Phase 4: Upload Pipeline Integration
- Modify `fileTypeChecker.js` to detect email types
- Integrate extraction into `useFileProcessor.js`
- Add progress callbacks for UI updates
- Handle extraction failures gracefully

### Phase 5: UI Updates
- Update `StatusCell.vue` for email status
- Show minimal progress messages
- Display extraction results in upload table

### Phase 6: Security Rules
- Add Firestore rules for `emails` collection
- Add Storage rules for `firms/{firmId}/emails/` path
- Test access control

### Phase 7: Testing & Deployment
- Unit tests for parsers
- Integration tests for full extraction
- Test with real .msg/.eml files
- Deploy to production

---

## Testing Strategy

### Test Files Needed

Create test files in `/tests/fixtures/email-extraction/`:
- `simple.msg` - Basic email, no attachments
- `with-attachments.msg` - Email with 2-3 attachments
- `nested.msg` - Email with .msg attachment
- `simple.eml` - Basic .eml file
- `large-attachment.msg` - Email with >100MB attachment (should fail)

### Unit Tests

- Parser tests: Extract metadata correctly
- Validation tests: Size/depth limits enforced
- Deduplication tests: Attachments deduplicated properly
- Nested email tests: Recursive processing up to depth 10

### Integration Tests

- Full extraction workflow: .msg → Firestore + Storage
- Failure handling: Corrupted files, oversized attachments
- Parallel processing: Email extraction doesn't block other uploads

---

## Success Criteria

- ✅ .msg and .eml files upload and extract successfully
- ✅ Native message saved to `emails` collection
- ✅ Email body text/HTML saved to Storage
- ✅ Attachments deduplicated correctly
- ✅ Nested .msg files process up to 10 levels
- ✅ Files >100MB rejected with clear error
- ✅ Attachments >100MB fail extraction gracefully
- ✅ Failed extractions don't block file upload
- ✅ UI shows clear, minimal progress messages
- ✅ Original .msg/.eml preserved in `uploads` even if extraction fails

---

## Future Enhancements (v2+)

**Not in v1 scope**:
- Quoted message extraction (complex, heuristic)
- Email threading (Stage 3 processing)
- Large file handling (>100MB emails/attachments)
- Cloud Functions for server-side extraction
- AI-powered email categorization
- Conversation view UI
- Inline attachment preview

---

## References

- Architecture: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`
- File Lifecycle: `docs/Features/Upload/Processing/file-lifecycle.md`
- Deduplication: `docs/Features/Upload/Deduplication/CLAUDE.md`
- Upload System: `docs/Features/Upload/CLAUDE.md`

---

**Status**: Ready for implementation. Begin with Phase 1 (dependencies & parsers).
