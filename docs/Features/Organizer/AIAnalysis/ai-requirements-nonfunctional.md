# AI Metadata Extraction - Non-Functional Requirements

**Related Documentation**:
- `ai-requirements-overview.md` - Executive summary and success metrics
- `ai-requirements-functional.md` - Functional requirements
- `ai-requirements-architecture.md` - Technical architecture and performance design

## Non-Functional Requirements

### NFR-1: Performance
- AI analysis completes within 10 seconds for files ≤20MB
- UI remains responsive during analysis (background processing)
- Loading indicators provide user feedback
- Failed analysis doesn't block UI

### NFR-2: Accuracy
- Document Date extraction accuracy target: ≥90% for standard business documents
- Document Type classification accuracy target: ≥85% for predefined types
- False positive rate (incorrect high-confidence suggestions): <5%

### NFR-3: Scalability
- Supports existing file size limits (20MB default, configurable via `VITE_AI_MAX_FILE_SIZE_MB`)
- Works with all supported file types (PDF, DOC, DOCX, images with OCR)
- Handles documents with poor formatting or degraded quality

### NFR-4: Usability
- Manual analysis trigger via "Analyze Document" button for fields marked "Get"
- Clear separation of concerns: AI Tab (configuration) vs Review Tab (results)
- Get/Skip/Manual workflow provides user control over extraction
- Fields dynamically move between tabs based on determination status
- Manual fields appear on both tabs until accepted
- Review tab provides focused Accept/Reject workflow
- One-click acceptance of AI suggestions or manual entries
- Editable fields allow corrections before accepting
- Validation prevents invalid data entry
- Helpful error messages with recovery options

### NFR-5: Integration
- Reuses existing `AIProcessingService` and `AITagService`
- Follows existing hybrid tag storage architecture (subcollection + embedded map)
- Uses existing `tagSubcollectionService.js` for atomic batch writes
- Compatible with existing category management system
- Works within Firebase AI Logic quotas and rate limits
- DocumentTable continues loading tags from embedded map (no performance impact)
