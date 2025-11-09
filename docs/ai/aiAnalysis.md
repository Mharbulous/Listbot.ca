# AI-Powered Document Analysis - Implementation Guide

**Status**: Phases 1-3 Implemented (DocumentDate & DocumentType)
**Last Updated**: 2025-11-09
**Implementation Completion**: November 2025

## Overview

The AI document analysis system automatically extracts structured metadata from documents using Google Gemini AI via Firebase AI Logic. This system is designed to be extensible, allowing new system categories to be added following the same patterns established for DocumentDate and DocumentType.

### Current Capabilities

- **Document Date Extraction**: Identifies the original document creation/signature date (ignores payment stamps, received dates)
- **Document Type Classification**: Classifies documents using a 3-tier hierarchy (matter-specific → firm-wide → global)
- **Confidence Scoring**: Provides 0-100% confidence scores with 95% threshold for auto-approval
- **Alternative Suggestions**: Offers up to 2 alternatives for low-confidence (<95%) extractions
- **Hybrid Storage**: Stores results in both subcollection (full metadata) and embedded map (table performance)

## Architecture

### Service Layer

#### 1. Core Metadata Extraction Service

**Location**: `src/services/aiMetadataExtractionService.js`

This is a **singleton service** that handles AI-powered extraction of DocumentDate and DocumentType. It's the primary service for system category metadata extraction.

**Key Methods**:
- `analyzeDocument(base64Data, evidence, extension, firmId, matterId)` - Main analysis method
- `_buildPrompt(documentTypes)` - Constructs AI prompt with dynamic document types
- `_parseResponse(text)` - Parses and validates AI JSON response
- `_getDocumentTypes(firmId, matterId)` - Fetches document types using 3-tier hierarchy
- `_getMimeType(extension)` - Maps file extensions to MIME types

**AI Model**: `gemini-2.5-flash-lite` (as of November 2025)

**Example Usage**:
```javascript
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';

const result = await aiMetadataExtractionService.analyzeDocument(
  base64FileData,
  evidenceDocument,
  'pdf',
  firmId,
  matterId
);

// Result structure:
// {
//   documentDate: { value, confidence, reasoning, context, alternatives },
//   documentType: { value, confidence, reasoning, context, alternatives },
//   processingTime: 3200,
//   tokenUsage: { inputTokens, outputTokens, totalTokens, ... }
// }
```

#### 2. General AI Tag Service

**Location**: `src/features/organizer/services/aiTagService.js`

This is a **class service** for general AI-powered tag suggestions (not system categories). Used for firm/matter custom categories.

**Key Methods**:
- `processSingleDocument(evidenceId)` - Processes a document for tag suggestions
- `generateTagSuggestions(...)` - Generates suggestions based on user categories
- `storeaiAlternativesWithConfidence(...)` - Stores suggestions with confidence-based approval

**AI Model**: `gemini-pro` (general tagging)

**Note**: This service is separate from metadata extraction and uses different prompting strategies.

#### 3. AI Processing Service

**Location**: `src/features/organizer/services/aiProcessingService.js`

Lower-level service providing core AI operations. Used by aiTagService.

**Key Methods**:
- `generateTagSuggestions(base64Data, categories, evidence, extension)` - Core AI generation
- `parseAIResponse(aiResponse, categories)` - Response parsing
- `getMimeType(filename)` - MIME type resolution

#### 4. File Processing Service

**Location**: `src/features/organizer/services/fileProcessingService.js`

Handles file retrieval and processing for AI analysis.

**Key Methods**:
- `getFileForProcessing(evidence, firmId, matterId)` - Retrieves file from Firebase Storage as base64
- `getUploadExtension(evidence)` - Extracts file extension
- `arrayBufferToBase64(arrayBuffer)` - Efficient base64 conversion

### UI Components

#### AI Analysis Tab

**Location**: `src/components/document/tabs/AIAnalysisTab.vue`

Main user interface for AI analysis results.

**Features**:
- Manual trigger via "Analyze Document" button
- Three-state display: Button → Analyzing spinner → Results
- Confidence badges (≥95% green, 80-94% amber, <80% red)
- Hover tooltips showing context and alternatives
- Error handling with retry capability
- Placeholder sections for future Firm/Matter fields

**Key Methods**:
- `handleAnalyzeClick()` - Triggers analysis workflow (lines 374-503)
- `loadAITags()` - Loads existing results from Firestore (lines 264-325)
- `getConfidenceBadgeColor(confidence)` - Determines badge color (lines 257-261)
- `formatDateString(dateString)` - Formats dates per user preference (lines 342-366)

**State Management**:
- `isAnalyzing` - Analysis in progress flag
- `aiResults` - Stores documentDate and documentType results
- `aiError` - Error state with user-friendly messages
- `showLoadingUI` - Delayed loading indicator (prevents flash)

#### Review Tab (Placeholder)

**Location**: `src/components/document/tabs/ReviewTab.vue`

Minimal placeholder for future Phase 4 implementation. Currently shows basic structure only.

**Planned Features** (Not Yet Implemented):
- Review queue for low-confidence suggestions
- Approve/reject/custom entry workflows
- Review history timeline
- Badge count notifications

### Data Storage

#### Hybrid Architecture

The system uses **two synchronized storage locations** for optimal performance and functionality:

##### 1. Subcollection Storage (Full Metadata)

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{evidenceId}/tags/{categoryId}`

**Purpose**: Complete AI analysis with alternatives, reasoning, and audit trail

**Document Structure**:
```javascript
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2024-03-15',
  confidence: 97,
  source: 'ai',
  autoApproved: true,
  reviewRequired: false,
  createdAt: Timestamp,
  createdBy: userId,
  metadata: {
    model: 'gemini-2.5-flash-lite',
    processingTime: 3200,
    aiReasoning: 'Invoice date found in header',
    context: 'Found "Invoice Date: March 15, 2024" in document header',
    aiAlternatives: [
      { value: '2024-03-14', confidence: 78, reasoning: '...' }
    ],
    reviewReason: null
  }
}
```

##### 2. Embedded Map Storage (Fast Table Loading)

**Path**: `evidence.tags[categoryId]` (within evidence document)

**Purpose**: Denormalized data for DocumentTable performance (single query for 10,000+ docs)

**Structure**:
```javascript
{
  tags: {
    'DocumentDate': {
      tagName: '2024-03-15',
      confidence: 97,
      autoApproved: true,
      reviewRequired: false,
      source: 'ai',
      createdAt: Timestamp
    },
    'DocumentType': {
      tagName: 'Invoice',
      confidence: 98,
      autoApproved: true,
      reviewRequired: false,
      source: 'ai',
      createdAt: Timestamp
    }
  },
  tagCount: 2,
  autoApprovedCount: 2,
  reviewRequiredCount: 0
}
```

#### Synchronization

**Service**: `src/features/organizer/services/tagSubcollectionService.js`

**Method**: `addTagsBatch(evidenceId, tagsArray, firmId, matterId)`

All writes use **atomic batch operations** to keep both locations synchronized:

```javascript
const batch = writeBatch(db);

// Write full metadata to subcollection
batch.set(subcollectionRef, fullTagDocument);

// Write simplified data to embedded map
batch.update(evidenceRef, {
  [`tags.${categoryId}`]: embeddedTagData,
  tagCount: increment(1),
  autoApprovedCount: autoApproved ? increment(1) : 0,
  reviewRequiredCount: reviewRequired ? increment(1) : 0
});

await batch.commit(); // Atomic transaction
```

### Document Type Hierarchy (3-Tier)

The system dynamically fetches document types before AI analysis, checking three levels:

#### Hierarchy Order:

1. **Matter-Specific** (Highest Priority)
   - Path: `/firms/{firmId}/matters/{matterId}/categories/DocumentType`
   - Use case: Matter-specific document types (e.g., "Motion for Summary Judgment" in litigation)

2. **Firm-Wide** (Secondary)
   - Path: `/firms/{firmId}/matters/general/categories/DocumentType`
   - Use case: Firm-standard document types across all matters

3. **Global System Categories** (Fallback)
   - Path: `/systemcategories/DocumentType`
   - Use case: Default document types (Email, Memo, Letter, Contract, Invoice, Report, etc.)

**Implementation**: `aiMetadataExtractionService.js` lines 258-351

**Logic**:
```javascript
// Try matter-specific first
if (matterId && matterId !== 'general') {
  const matterTypes = await fetchMatterTypes(firmId, matterId);
  if (matterTypes.length > 0) return matterTypes;
}

// Fall back to firm-wide
const firmTypes = await fetchFirmTypes(firmId);
if (firmTypes.length > 0) return firmTypes;

// Fall back to global
const globalTypes = await fetchGlobalTypes();
if (globalTypes.length > 0) return globalTypes;

throw new Error('No document types found');
```

## Prompting Strategy

### Document Date Extraction Prompt

**Key Rules**:
1. Extract **ORIGINAL** document date (creation/signature date)
2. **IGNORE**: Payment stamps, received dates, scanned dates, file metadata
3. For invoices: Invoice date (NOT "Paid 2024-12-03" stamps)
4. For letters: Letter date (NOT received/scanned dates)
5. For contracts: Execution/signature date
6. Format: ISO 8601 (YYYY-MM-DD)

**Expected Response**:
```json
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Invoice date found in header",
    "context": "Found 'Invoice Date: March 15, 2024' in document header",
    "alternatives": [
      {
        "value": "2024-03-14",
        "confidence": 78,
        "reasoning": "Possible scan date in footer"
      }
    ]
  },
  "documentType": { ... }
}
```

### Document Type Classification Prompt

**Dynamic Type List**: The prompt is built dynamically with the available document types from the 3-tier hierarchy.

**Example**:
```
2. Document Type: Classify from this list ONLY:
   [Email, Memo, Letter, Contract, Invoice, Report, Affidavit, Audio, Brochure,
    By-laws, Case law, Certificate, Chart, Change order, Cheque, Cheque stub,
    Chronology, Court document, Drawing, Envelope, Evidence log, Fax cover,
    Financial record, Form, Folder, Index, Listing, Medical record, Notes,
    Pay stub, Photo]
```

**Key Rules**:
1. Prefer types from the provided list
2. Can suggest **alternative types** not in list (Open List behavior)
3. Provide reasoning for classification
4. Include context excerpt showing classification basis

## Workflow

### User Flow

1. **User opens document in DocumentTable**
2. **User clicks AI tab in metadata panel**
3. **System checks for existing analysis** (from embedded tags map)
4. **If no analysis exists, user clicks "Analyze Document" button**
5. **System performs analysis:**
   - Validates file size (≤20MB default)
   - Fetches document types from 3-tier hierarchy
   - Retrieves file content from Firebase Storage
   - Sends to Gemini AI with specialized prompt
   - Parses and validates response
6. **System stores results:**
   - Writes to subcollection (full metadata)
   - Writes to embedded map (denormalized)
   - Updates counters atomically
7. **UI displays results:**
   - Shows extracted date and type
   - Displays confidence badges
   - Provides hover tooltips with context/alternatives

### Technical Flow

```javascript
// 1. User clicks "Analyze Document"
handleAnalyzeClick() {
  isAnalyzing.value = true;

  // 2. Get file content
  const base64Data = await fileProcessingService.getFileForProcessing(
    evidence, firmId, matterId
  );

  // 3. Call AI service
  const result = await aiMetadataExtractionService.analyzeDocument(
    base64Data, evidence, extension, firmId, matterId
  );

  // 4. Prepare tags for storage
  const tags = [
    {
      categoryId: 'DocumentDate',
      categoryName: 'Document Date',
      tagName: result.documentDate.value,
      confidence: result.documentDate.confidence,
      source: 'ai',
      autoApproved: result.documentDate.confidence >= 95,
      reviewRequired: result.documentDate.confidence < 95,
      metadata: {
        model: 'gemini-2.5-flash-lite',
        processingTime: result.processingTime,
        aiReasoning: result.documentDate.reasoning,
        context: result.documentDate.context,
        aiAlternatives: result.documentDate.alternatives
      }
    },
    // ... DocumentType tag
  ];

  // 5. Store via subcollection service (atomic batch write)
  await tagSubcollectionService.addTagsBatch(
    evidence.id, tags, firmId, matterId
  );

  // 6. Reload tags to display
  await loadAITags();
}
```

## Extending with New Categories

To add AI analysis for additional system categories (e.g., DocumentAuthor, DocumentCustodian), follow these patterns:

### Step 1: Update Core Service

**File**: `src/services/aiMetadataExtractionService.js` (or create new service)

**Pattern**: Add new field to the prompt and response parsing

```javascript
_buildPrompt(documentTypes, authors) {
  return `Analyze this document and extract:

1. Document Date: [existing rules]
2. Document Type: [existing rules]
3. Document Author: The person or entity who created/authored the document
   - IGNORE: Recipients, CCs, reviewers
   - For letters: Extract "From" or signer
   - For contracts: Extract drafting party if clear
   - Format: Full name or entity name

Return as JSON:
{
  "documentDate": { ... },
  "documentType": { ... },
  "documentAuthor": {
    "value": "John Smith",
    "confidence": 88,
    "reasoning": "Found in 'From:' field and signature block",
    "context": "From: John Smith [header] and signed 'John Smith'",
    "alternatives": []
  }
}`;
}
```

### Step 2: Update UI Component

**File**: `src/components/document/tabs/AIAnalysisTab.vue`

**Pattern**: Add new field display in System Fields section

```vue
<!-- Document Author -->
<div class="metadata-item">
  <span class="metadata-label">Document Author:</span>

  <!-- State 1: Analyze Button -->
  <v-btn
    v-if="!aiResults.documentAuthor && !isAnalyzing"
    color="primary"
    variant="outlined"
    prepend-icon="mdi-robot"
    @click="handleAnalyzeClick"
    class="analyze-button"
    size="small"
  >
    Analyze Document
  </v-btn>

  <!-- State 2: Analyzing Spinner -->
  <div v-else-if="isAnalyzing" class="analyzing-state">
    <v-progress-circular indeterminate size="20" color="primary" />
    <span class="analyzing-text">Analyzing...</span>
  </div>

  <!-- State 3: AI Result with Tooltip -->
  <div v-else class="ai-result">
    <v-tooltip location="bottom" max-width="400">
      <template v-slot:activator="{ props: tooltipProps }">
        <div v-bind="tooltipProps" class="ai-result-content">
          <span class="ai-result-value">{{ aiResults.documentAuthor.tagName }}</span>
          <v-chip
            :color="getConfidenceBadgeColor(aiResults.documentAuthor.confidence)"
            size="small"
            variant="flat"
            class="ai-result-badge"
          >
            {{ aiResults.documentAuthor.confidence }}%
          </v-chip>
        </div>
      </template>
      <div class="ai-tooltip-content">
        <div v-if="aiResults.documentAuthor.metadata?.context" class="ai-tooltip-section">
          <strong>Context:</strong>
          <p>{{ aiResults.documentAuthor.metadata.context }}</p>
        </div>
        <div v-if="aiResults.documentAuthor.metadata?.aiAlternatives?.length" class="ai-tooltip-section">
          <strong>Alternatives:</strong>
          <ul>
            <li v-for="alt in aiResults.documentAuthor.metadata.aiAlternatives" :key="alt.value">
              {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
            </li>
          </ul>
        </div>
      </div>
    </v-tooltip>
  </div>
</div>
```

### Step 3: Update Tag Storage Logic

**File**: `AIAnalysisTab.vue` - `handleAnalyzeClick()` method

**Pattern**: Add new category to tags array

```javascript
const tagsToStore = [
  // ... existing DocumentDate tag
  // ... existing DocumentType tag

  // New DocumentAuthor tag
  {
    categoryId: 'DocumentAuthor',
    categoryName: 'Document Author',
    tagName: result.documentAuthor.value,
    confidence: result.documentAuthor.confidence,
    source: 'ai',
    autoApproved: result.documentAuthor.confidence >= confidenceThreshold,
    reviewRequired: result.documentAuthor.confidence < confidenceThreshold,
    createdBy: authStore.user?.uid || 'system',
    metadata: {
      model: 'gemini-2.5-flash-lite',
      processingTime: result.processingTime,
      aiReasoning: result.documentAuthor.reasoning,
      context: result.documentAuthor.context,
      aiAlternatives: result.documentAuthor.alternatives || [],
      reviewReason: result.documentAuthor.confidence < confidenceThreshold
        ? 'Confidence below threshold'
        : null
    }
  }
];
```

### Step 4: Create System Category in Firestore

**Collection**: `/systemcategories/DocumentAuthor`

```javascript
{
  id: 'DocumentAuthor',
  name: 'Document Author',
  type: 'Open List', // or 'Text' depending on requirements
  isSystemCategory: true,
  description: 'The person or entity who created/authored the document',
  tags: [] // Empty for Open List, or predefined authors
}
```

### Step 5: Update State Management

**File**: `AIAnalysisTab.vue`

**Pattern**: Add new field to `aiResults` ref

```javascript
const aiResults = ref({
  documentDate: null,
  documentType: null,
  documentAuthor: null  // Add new field
});
```

**Pattern**: Update `loadAITags()` method

```javascript
aiResults.value = {
  documentDate: tags?.find(t => t?.categoryId === 'DocumentDate') || null,
  documentType: tags?.find(t => t?.categoryId === 'DocumentType') || null,
  documentAuthor: tags?.find(t => t?.categoryId === 'DocumentAuthor') || null
};
```

## Configuration

### Environment Variables

```env
VITE_ENABLE_AI_FEATURES=true
VITE_AI_MAX_FILE_SIZE_MB=20
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Firebase AI Configuration

**Location**: `src/services/firebase.js`

```javascript
import { getAI } from 'firebase/ai';

// CRITICAL: Use default backend for client-side web apps
// DO NOT use VertexAIBackend (causes 403 errors)
const firebaseAI = getAI(app);

export { firebaseAI };
```

**Important**: Client-side web apps MUST use the default backend. `VertexAIBackend` is only for server-side Node.js applications.

## Performance Considerations

### File Size Limits

- **Default**: 20MB (configurable via `VITE_AI_MAX_FILE_SIZE_MB`)
- **Rationale**: Gemini API has file size limits; larger files increase processing time and costs
- **Handling**: File size validation occurs before API call; user-friendly error if exceeded

### Processing Time

- **Typical**: 2-5 seconds for standard documents (< 5MB)
- **Large Files**: 5-10 seconds for files near 20MB limit
- **Token Usage**: Logged to console for cost tracking (input, output, cached, total)

### Caching

- **Results**: Stored in Firestore; loaded on tab open (no re-analysis unless user triggers)
- **Document Types**: Fetched once per analysis (not cached between analyses)
- **Files**: Retrieved from Storage on-demand (not cached)

## Error Handling

### User-Friendly Error Categories

**File Too Large**:
```
Title: File Too Large
Message: File exceeds 20MB limit for AI analysis
Action: [Retry with smaller file]
```

**Network Error**:
```
Title: Network Error
Message: Analysis failed. Please check your connection and try again.
Action: [Retry]
```

**API Not Enabled**:
```
Title: Firebase AI API Not Enabled
Message: The Firebase AI API needs to be enabled in your Firebase project
Action: [Enable API in Firebase Console →]
```

**Generic Error**:
```
Title: Analysis Failed
Message: [Error message from AI service]
Action: [Retry]
```

### Error Logging

All errors are logged to console with detailed context:

```javascript
console.error('❌ AI analysis failed:', error);
console.error('Context:', {
  fileHash: evidence.id,
  fileName: evidence.displayName,
  firmId,
  matterId,
  errorCode: error?.code,
  errorMessage: error?.message
});
```

## Testing

### Manual Testing Checklist

- [ ] Test with various document types (invoice, cheque, letter, contract)
- [ ] Test with clear dates (high confidence expected)
- [ ] Test with ambiguous documents (low confidence, alternatives expected)
- [ ] Test with documents containing payment stamps (should ignore stamps)
- [ ] Test with files >20MB (should show error)
- [ ] Test network offline (should show friendly error)
- [ ] Test analysis persistence (close browser, reopen, results should load)
- [ ] Test confidence badge colors (≥95% green, 80-94% amber, <80% red)
- [ ] Test tooltip hover (should show context and alternatives)
- [ ] Test retry after error

### Unit Testing

**Location**: `tests/unit/services/aiMetadataExtractionService.test.js`

**Coverage**:
- Response parsing and validation
- Error handling for malformed responses
- Confidence threshold logic
- Date format validation
- Mock Gemini API responses

## Future Enhancements

### Phase 4: Review Workflow (Planned)

- Full Review Tab implementation with review queue
- Approve/reject/custom entry actions
- Review history timeline
- Badge count notifications
- Bulk review operations

### Additional Categories (Potential)

- **DocumentCustodian**: Person who possessed/provided the document
- **DocumentRecipient**: Primary intended recipient
- **DocumentSubject**: Brief subject/RE line extraction
- **DocumentParties**: Key parties mentioned in legal documents
- **DocumentAmount**: Monetary amounts (invoices, contracts)
- **DocumentDuration**: Date ranges or contract terms

### Advanced Features (Future)

- Batch processing (analyze multiple documents)
- Custom prompts per document type
- OCR integration for scanned documents
- Multi-language support
- Firm-level custom extractors
- Analysis confidence calibration based on user corrections

## Troubleshooting

### Issue: 403 Forbidden Error

**Symptom**: AI analysis fails with 403 error claiming "API not enabled"

**Root Causes**:
1. VertexAIBackend used in client-side app (WRONG - use default backend)
2. Firebase AI API actually not enabled in Firebase Console
3. Project ID mismatch in environment variables

**Solution**:
1. Check `firebase.js` - ensure using `getAI(app)` without backend parameter
2. Verify API enabled: `https://console.firebase.google.com/project/{projectId}/genai/`
3. Confirm `VITE_FIREBASE_PROJECT_ID` matches actual project

### Issue: Incorrect Date Extracted

**Symptom**: AI extracts payment stamp date instead of invoice date

**Root Cause**: Prompt not explicit enough about ignoring stamps

**Solution**: The current prompt (as of November 2025) explicitly states:
```
IGNORE: Payment stamps, received dates, scanned dates, file metadata dates
For invoices: Extract invoice date (NOT payment stamp dates like "Paid 2024-12-03")
```

If still occurring, provide specific example document for prompt refinement.

### Issue: Results Not Persisting

**Symptom**: Analysis runs but results don't appear after page refresh

**Root Cause**: Batch write may have failed silently

**Debug Steps**:
1. Check browser console for Firestore errors
2. Verify Firestore permissions (should allow writes to evidence/{id}/tags)
3. Check that `tagSubcollectionService.addTagsBatch()` completed successfully
4. Inspect Firestore directly to see if tags were written

## Related Documentation

- **`docs/ai/ai-metadata-extraction-requirements.md`** - Product requirements (PRD)
- **`docs/architecture/CategoryTags.md`** - Tag system architecture
- **`docs/architecture/file-lifecycle.md`** - File terminology and lifecycle
- **`planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md`** - Implementation plan and learnings

---

**Document Version**: 2.0
**Last Updated**: 2025-11-09
**Status**: Complete implementation guide (reflects Phases 1-3 completion)
