# AI Document Analysis: Document Date & Document Type Extraction

**Date**: 2025-11-07
**Status**: Planning
**Priority**: High
**Epic**: AI-Powered Metadata Extraction

---

## Overview

Implement AI-powered extraction of Document Date and Document Type metadata using Google Gemini via Firebase Vertex AI. This feature enables automatic document analysis with confidence-based auto-approval.

**Implementation Phases**:
1. **Phase 1**: Analyze Button UI Frontend - See `2025-11-07-Phase1-First-AI-analysis-dateNtype-button.md`
2. **Phase 2**: Vertex AI Integration - See `2025-11-07-Phase2-First-AI-analysis-dateNtype-console.md`
3. **Phase 3**: AI Results Display & Firestore Storage - See `2025-11-07-Phase3-First-AI-analysis-dateNtype-display.md`
4. **Phase 4**: Human Review & Editing - See `2025-11-07-Phase4-First-AI-analysis-dateNtype-edit.md`

---

## Core User Stories (Apply to Multiple Phases)

### Automatic Document Analysis
**As a** legal professional
**I want to** click a button to analyze a document and automatically extract its creation date and type
**So that** I don't have to manually review and enter this metadata for every document

### Intelligent Date Detection
**As a** litigation paralegal
**I want to** the AI to distinguish between the original document date and stamp dates
**So that** invoices with "Paid 2024-12-03" stamps are correctly dated to the invoice date, not the payment date

### Document Type Classification
**As a** document reviewer
**I want to** the AI to classify documents into predefined types
**So that** I can quickly filter and organize documents by their type

### Confidence-Based Auto-Approval
**As a** case manager
**I want to** high-confidence AI suggestions to be automatically approved
**So that** I only need to review uncertain classifications

**Threshold**: 85% confidence for auto-approval (consistent with existing tags)

---

## Architecture Decisions

### User Interaction Flow
- **Trigger**: Manual "Analyze Document" button in AI tab
- **API Strategy**: Single Gemini API call analyzing both fields together
- **Confidence Threshold**: 85% for auto-approval
- **File Size Limit**: 20MB maximum

### Technical Design
- **Service**: `aiMetadataExtractionService.js` (new)
- **Storage**: Hybrid pattern (subcollection + embedded map) via `tagSubcollectionService`
- **Model**: Gemini 1.5 Flash via Firebase Vertex AI
- **File Access**: `FileProcessingService.getFileForProcessing()`
- **Security**: All queries scoped by `firmId`

### UI/UX Principles
1. **No Layout Shift**: Button, spinner, and value occupy the same location
2. **Single Focus**: User's attention stays in one place during state transitions
3. **Clean Main UI**: Context and alternatives only shown on hover (tooltip)
4. **Consistent Styling**: Vuetify components and project design system

---

## Gemini Prompt Strategy

### Prompt Structure
```
Analyze this document and extract:

1. Document Date: The date the ORIGINAL document was created/signed
   - IGNORE: Payment stamps, received dates, scanned dates, file metadata dates
   - For invoices: Extract invoice date (NOT payment stamp dates like "Paid 2024-12-03")
   - For letters: Extract letter date (NOT received/scanned dates)
   - For contracts: Extract execution/signature date
   - Format: YYYY-MM-DD (ISO 8601)

2. Document Type: Classify from this list ONLY:
   [Email, Memo, Letter, Contract, Invoice, Report, Affidavit, Audio, Brochure,
    By-laws, Case law, Certificate, Chart, Change order, Cheque, Cheque stub,
    Chronology, Court document, Drawing, Envelope, Evidence log, Fax cover,
    Financial record, Form, Folder, Index, Listing, Medical record, Notes,
    Pay stub, Photo]

For each field, provide:
- value: The extracted value
- confidence: 0-100 percentage
- reasoning: Brief explanation
- context: Excerpt from document showing where you found this
- alternatives: If confidence < 95%, suggest up to 2 alternatives with reasoning

Return as JSON.
```

### Expected Response Format
```json
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Invoice date found in header",
    "context": "Found 'Invoice Date: March 15, 2024' in document header",
    "alternatives": [...]
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    "reasoning": "Document contains 'INVOICE' header, itemized charges",
    "context": "Header: 'INVOICE #12345', line items with prices",
    "alternatives": []
  }
}
```

---

## Firestore Data Structure

### Tag Document (Subcollection)
```
/evidence/{documentHash}/tags/{categoryId}
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2024-03-15',
  confidence: 92,
  source: 'ai',
  autoApproved: true,
  reviewRequired: false,
  metadata: {
    model: 'gemini-1.5-flash',
    processingTime: 2345,
    aiReasoning: 'Invoice date found in header',
    context: 'Found "Invoice Date: March 15, 2024"',
    aiAlternatives: [...],
    reviewReason: null
  },
  createdAt: Timestamp,
  firmId: 'firmId'
}
```

### Embedded Map (Evidence Document)
```
/evidence/{documentHash}
{
  tags: {
    'DocumentDate': { tagName: '2024-03-15', confidence: 92, autoApproved: true },
    'DocumentType': { tagName: 'Invoice', confidence: 98, autoApproved: true }
  },
  tagCounts: { total: 2, ai: 2, human: 0 }
}
```

---

## Common Success Criteria

### Functional Requirements (All Phases)
- Single Gemini API call extracts both Document Date and Type
- Document Date correctly identifies original document date (ignores stamps)
- Document Type classifies using predefined system category list
- Confidence ≥85% auto-approves tags (green badge)
- Confidence <85% marks tags as review-required (yellow badge)
- Confidence <95% displays alternative suggestions
- Results persist in Firestore (hybrid storage pattern)

### Technical Requirements (Phases 2-4)
- Uses `aiMetadataExtractionService.js` for AI processing
- Uses `tagSubcollectionService.addTagsBatch()` for atomic storage
- Stores tags in subcollection AND embedded map
- All queries scoped by `firmId` for security
- Gemini 1.5 Flash via Firebase Vertex AI
- File size validated (20MB max)
- Dates stored in ISO 8601 format (YYYY-MM-DD)

### Error Handling (All Phases)
- File >20MB shows clear error message with retry button
- Network errors display with retry button
- API quota errors inform user gracefully
- Parse errors logged, generic message shown
- Errors never crash the application

### User Experience (All Phases)
- Clear loading states during analysis
- Confidence percentages clearly displayed
- Auto-approved vs review-required visually distinct
- Context and alternatives shown only on hover (clean main UI)
- Value, button, and spinner occupy same location (no layout shift)

---

## Files to Create/Modify

### New Files (Created in Phase 2)
1. **`src/services/aiMetadataExtractionService.js`** - Core AI service for date/type extraction

### Modified Files
1. **`src/components/document/DocumentMetadataPanel.vue`** - AI tab implementation (all phases)
2. **`src/services/firebase.js`** - Ensure Firebase Vertex AI initialized (Phase 2)
3. **`src/features/organizer/services/tagSubcollectionService.js`** - Add `updateTag()` method (Phase 4)

### Leveraged (No Changes)
- `src/features/organizer/services/FileProcessingService.js`
- `src/features/organizer/services/tagSubcollectionService.js` (except Phase 4 addition)
- Firestore collections: `/systemcategories/DocumentType`, `/systemcategories/DocumentDate`

---

## Dependencies

### External APIs
- **Google Gemini 1.5 Flash** via Firebase Vertex AI
- Requires: `VITE_FIREBASE_PROJECT_ID` in `.env`

### Environment Variables
```env
VITE_ENABLE_AI_FEATURES=true
VITE_AI_MAX_FILE_SIZE_MB=20
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Firebase Services
- Firebase Storage (file access)
- Firestore (tag storage)
- Firebase Vertex AI (Gemini API)

---

## Security Considerations

1. **Team Isolation**: All queries MUST be scoped by `firmId`
2. **File Access**: Only authenticated users can access files in their firm
3. **API Keys**: Firebase Vertex AI uses project-scoped authentication (no exposed keys)
4. **Input Validation**: File size limits prevent DoS
5. **Data Privacy**: AI analysis results stored in user's Firestore (not sent to third parties)

---

## Common Test Cases (Apply Across Phases)

### TC: Invoice with Payment Stamp
**File**: Invoice dated 2024-03-15 with "Paid 2024-12-03" stamp
**Expected**: Document Date: 2024-03-15 (invoice date, NOT stamp date)

### TC: High Confidence Auto-Approval
**File**: Clear invoice with obvious date/type
**Expected**: Green badge "✓ Auto-approved", both fields confidence ≥85%

### TC: Low Confidence Review Required
**File**: Blurry or ambiguous document
**Expected**: Yellow badge "⚠ Review Required", alternatives displayed

### TC: File Too Large
**File**: 25MB PDF
**Expected**: Error message, retry button, no API call made

### TC: Persistence
**Steps**: Analyze document, close browser, reopen AI tab
**Expected**: Results display immediately (no re-analysis)

---

## Notes

### Terminology Compliance
- **Original**: Real-world document (physical/digital source)
- **Source**: User's file before upload
- **Upload**: File in Firebase Storage
- **Document Date**: Business transaction date (NOT file creation/upload date)

### Design Rationale
- **Single API call**: More efficient, provides better context for AI
- **85% threshold**: Consistent with existing tag auto-approval
- **Manual trigger**: Gives users control, avoids unexpected API costs
- **Hybrid storage**: Optimizes both table performance and detail views

### Known Limitations
- Only supports files ≤20MB
- Requires network connection
- Limited to DocumentType predefined list
- English language only (initially)

---

## Future Enhancements (Out of Scope)

- Batch analysis (multiple documents)
- Custom prompts per document type
- OCR for scanned documents
- Multi-language support
- Firm-level custom document types
- Advanced review workflow with comments
- Analysis history/audit trail export

---

## References

- **Architecture Documentation**: `@docs/architecture/file-lifecycle.md`
- **Authentication**: `@docs/architecture/authentication.md`
- **Existing AI Service**: `src/features/organizer/services/aiProcessingService.js`
- **Tag Service**: `src/features/organizer/services/tagSubcollectionService.js`
