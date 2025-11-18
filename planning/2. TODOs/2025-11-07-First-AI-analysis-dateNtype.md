# AI Document Analysis: Document Date & Document Type Extraction

**Date**: 2025-11-07
**Status**: Planning
**Priority**: High
**Epic**: AI-Powered Metadata Extraction

---

## Overview

Implement AI-powered extraction of Document Date and Document Type metadata using Google Gemini via Firebase AI Logic. This feature enables automatic document analysis with confidence-based auto-approval.

**Implementation Phases**:
1. **Phase 1**: Analyze Button UI Frontend - See `2025-11-07-Phase1-First-AI-analysis-dateNtype-button.md`
2. **Phase 2**: Firebase AI Logic Integration - See `2025-11-07-Phase2-First-AI-analysis-dateNtype-console.md`
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

**Threshold**: 95% confidence for auto-approval

---

## Architecture Decisions

### User Interaction Flow
- **Trigger**: Manual "Analyze Document" button in AI tab
- **API Strategy**: Single Gemini API call analyzing both fields together
- **Confidence Threshold**: 95% for auto-approval
- **File Size Limit**: 20MB maximum

### Technical Design
- **Service**: `aiMetadataExtractionService.js` (new)
- **Storage**: Hybrid pattern (subcollection + embedded map) via `tagSubcollectionService`
- **Model**: Gemini 2.5 Flash Lite via Firebase AI Logic
- **File Access**: `FileProcessingService.getFileForProcessing()`
- **Security**: All queries scoped by `firmId`

### UI/UX Principles
1. **No Layout Shift**: Button, spinner, and value occupy the same location
2. **Single Focus**: User's attention stays in one place during state transitions
3. **Clean Main UI**: Context and alternatives only shown on hover (tooltip)
4. **Consistent Styling**: Vuetify components and project design system

---

## Implementation Best Practices (from Phase 1.5 Learnings)

**Context**: Phase 1.5 involved troubleshooting Firebase AI integration issues. The learnings below apply to all implementation phases.

### 1. Firebase AI Backend Configuration (CRITICAL)

**Rule**: Client-side web apps MUST use default backend

```javascript
// ✅ CORRECT - For client-side web apps (ListBot)
import { getAI } from 'firebase/ai';
const firebaseAI = getAI(app);

// ❌ WRONG - Only for server-side Node.js apps
import { getAI, VertexAIBackend } from 'firebase/ai';
const firebaseAI = getAI(app, { backend: new VertexAIBackend() });
```

**Why This Matters**:
- Using `VertexAIBackend` in client-side apps causes **403 Forbidden errors**
- `VertexAIBackend` requires Google Cloud IAM service account credentials
- Default backend handles Firebase authentication automatically
- This was the root cause of Phase 1.5 troubleshooting

**Reference**: See Phase 2 plan for detailed backend configuration instructions

---

### 2. Defensive Programming Patterns

**Rule**: Always use optional chaining and fallback values

```javascript
// ❌ Unsafe - May crash if error structure is unexpected
const message = error.message;
const confidence = result.documentDate.confidence;

// ✅ Defensive - Handles missing/null/undefined gracefully
const message = error?.message || 'Unknown error';
const confidence = result?.documentDate?.confidence ?? 0;
```

**Apply To**:
- All error property access (`error?.message`, `error?.code`)
- All Firestore data access (`tags?.find(...)`, `tag?.categoryId`)
- All nested object access (`metadata?.editHistory?.[0]?.editedBy`)
- All user input (`props.evidence?.id`, `authStore?.currentFirm`)

**Why This Matters**:
- Firebase errors don't always have consistent structure
- Firestore may return null/undefined or malformed data
- Third-party errors may have different formats
- Prevents UI crashes and provides better user experience

---

### 3. Pre-Operation Validation

**Rule**: Validate required data before Firestore/API operations

```javascript
// Check authentication state
if (!authStore?.currentFirm) {
  throw new Error('No firm ID available. Please ensure you are logged in.');
}

if (!authStore?.user?.uid) {
  throw new Error('User ID not available. Please log in again.');
}

// Check document data
if (!props.evidence?.id) {
  throw new Error('Document ID not available.');
}

// Check array data before iteration
if (!Array.isArray(tags) || tags.length === 0) {
  console.warn('⚠️ No tags to process');
  return;
}
```

**Apply To**:
- All Firestore read/write operations
- All Firebase Storage operations
- All AI API calls
- All data transformations

---

### 4. Error Message Awareness

**Rule**: Don't trust Firebase error messages at face value

**Key Learning**: Phase 1.5 encountered a 403 error claiming "API not enabled" when the real issue was using the wrong backend type. The API was actually enabled.

**Best Practice**:
- Add comprehensive logging to understand actual state
- Include configuration details in error logs
- Provide troubleshooting steps beyond error message
- Categorize errors for user-friendly display

```javascript
// Categorize errors for better user experience
const detectErrorType = (error) => {
  const message = error?.message || '';
  const code = error?.code || '';

  if (message.includes('too large')) {
    return 'File exceeds size limit';
  } else if (message.includes('network') || code === 'unavailable') {
    return 'Network connection error';
  } else if (code === 'resource-exhausted') {
    return 'AI service quota exceeded';
  } else if (message.includes('firebasevertexai.googleapis.com')) {
    return 'Firebase AI API configuration error';
  }

  return 'Unknown error - check logs for details';
};
```

---

### 5. Testing Requirements

**Rule**: Manual testing with real data is NOT optional

**Why Unit Tests Aren't Enough**:
- Unit tests use mocked data and may miss integration issues
- Real files reveal edge cases (large files, malformed PDFs, unusual formats)
- Actual API responses may differ from mocked responses
- Network conditions affect real-world behavior
- Processing time varies with file size and complexity

**Testing Checklist (All Phases)**:
- ✅ Test with real PDF files (various sizes and types)
- ✅ Test with files >20MB (should be rejected)
- ✅ Test with network offline (should show friendly error)
- ✅ Test with multiple document types (invoice, cheque, contract, etc.)
- ✅ Test persistence (close browser, reopen - results should load)
- ✅ Verify console output matches expected format
- ✅ Confirm processing times are reasonable

**Phase 1.5 Example**:
- Tested with real PDF: "2016-12-06 CHQ#282 West Coast.pdf" (493.74 KB)
- Processing time: 3.525 seconds
- Confidence: Date 99%, Type 95%
- Result: Successfully identified cheque with correct date

---

### 6. Console Logging Standards

**Rule**: Use consistent emoji indicators and structured logging

**Console Output Pattern**:
```javascript
console.log('🤖 Starting Gemini AI analysis...');
console.log('📂 Getting file content from Firebase Storage...');
console.log('✅ File retrieved successfully');
console.log('📤 Sending request to Gemini API...');
console.log('📥 Received response from Gemini API');
console.log('🎯 FINAL PARSED RESULTS:', results);
console.log('✅ Analysis completed in', processingTime, 'ms');
console.error('❌ Analysis failed:', error);
console.warn('⚠️ Invalid date string:', dateString);
```

**Benefits**:
- Easy to scan console output
- Clear operation flow visualization
- Quick identification of errors/warnings
- Consistent across all phases

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
- alternative: suggest 1 alternative unconstrained by the Document Type list with reasoning.

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
    model: 'gemini-2.5-flash-lite',
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
- Confidence ≥95% auto-approves tags (green badge)
- Confidence <95% marks tags as review-required (yellow badge)
- Confidence <95% displays alternative suggestions
- Results persist in Firestore (hybrid storage pattern)

### Technical Requirements (Phases 2-4)
- Uses `aiMetadataExtractionService.js` for AI processing
- Uses `tagSubcollectionService.addTagsBatch()` for atomic storage
- Stores tags in subcollection AND embedded map
- All queries scoped by `firmId` for security
- Gemini 2.5 Flash Lite via Firebase AI Logic
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
1. **`src/components/document/tabs/AIAnalysisTab.vue`** - AI tab implementation (all phases)
2. **`src/services/firebase.js`** - Ensure Firebase AI Logic initialized (Phase 2)
3. **`src/features/organizer/services/tagSubcollectionService.js`** - Add `updateTag()` method (Phase 4)

### Leveraged (No Changes)
- `src/features/organizer/services/FileProcessingService.js`
- `src/features/organizer/services/tagSubcollectionService.js` (except Phase 4 addition)
- Firestore collections: `/systemcategories/DocumentType`, `/systemcategories/DocumentDate`

---

## Dependencies

### External APIs
- **Google Gemini 2.5 Flash Lite** via Firebase AI Logic (formerly "Vertex AI in Firebase")
- Requires: `VITE_FIREBASE_PROJECT_ID` in `.env`
- SDK: `firebase/ai` (uses default backend for client-side web applications)
- **Backend**: Default backend (NOT VertexAIBackend - see Implementation Best Practices)

### Environment Variables
```env
VITE_ENABLE_AI_FEATURES=true
VITE_AI_MAX_FILE_SIZE_MB=20
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Firebase Services
- Firebase Storage (file access)
- Firestore (tag storage)
- Firebase AI Logic (Gemini API)

---

## Security Considerations

1. **Team Isolation**: All queries MUST be scoped by `firmId`
2. **File Access**: Only authenticated users can access files in their firm
3. **API Keys**: Firebase AI Logic uses project-scoped authentication (no exposed keys)
4. **Input Validation**: File size limits prevent DoS
5. **Data Privacy**: AI analysis results stored in user's Firestore (not sent to third parties)

---

## Common Test Cases (Apply Across Phases)

### TC: Invoice with Payment Stamp
**File**: Invoice dated 2024-03-15 with "Paid 2024-12-03" stamp
**Expected**: Document Date: 2024-03-15 (invoice date, NOT stamp date)

### TC: High Confidence Auto-Approval
**File**: Clear invoice with obvious date/type
**Expected**: Green badge showing percentage (e.g., "97%"), both fields confidence ≥95%

### TC: Low Confidence Review Required
**File**: Blurry or ambiguous document
**Expected**: Yellow/amber badge showing percentage (e.g., "72%"), alternatives displayed

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
- **95% threshold**: High confidence standard for auto-approval of AI-extracted metadata
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
