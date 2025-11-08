# AI Metadata Extraction - Product Requirements Document

**Status**: Planning Phase
**Last Updated**: 2025-11-04
**Related Documentation**:
- `docs/ai/aiAnalysis.md` - AI analysis system overview
- `docs/architecture/CategoryTags.md` - Tag system architecture
- `src/components/document/DocumentMetadataPanel.vue` - Metadata panel UI

## Executive Summary

This document defines the requirements for AI-powered automatic extraction of document metadata fields (Document Date and Document Type) when users open the AI tab in the document metadata panel. The system will leverage the existing Firebase AI Logic (Gemini) infrastructure to analyze document content and populate system category fields with confidence scoring.

**Three-Tab Architecture**: The metadata panel uses three tabs with distinct purposes:
- **ℹ️ Metadata Tab**: Displays source file, storage, and embedded metadata
- **🤖 AI Tab**: Shows AI analysis results in a clean, simple view
- **👤Review Tab**: Dedicated workflow for reviewing and correcting low-confidence AI extractions

## Problem Statement

Currently, when users open the AI tab in the metadata panel, they see "Not yet analyzed" placeholders for Document Date and Document Type fields. Users must manually review documents and enter this metadata, which is time-consuming and error-prone. Our existing AI infrastructure for tag suggestions can be extended to automatically extract structured metadata fields.

The metadata panel already has a dedicated **👤Review tab** for human review workflows, which should be leveraged for reviewing low-confidence AI suggestions rather than cluttering the AI tab with review UI.

## Goals

1. **Automatic Analysis**: When a user opens the AI tab, automatically trigger AI analysis if Document Date or Document Type fields are "Not yet analyzed"
2. **Structured Extraction**: Extract specific metadata fields (Document Date and Document Type) from document content
3. **Confidence Scoring**: Provide confidence scores for each extracted field
4. **Multiple Alternatives**: For low-confidence extractions (<95%), provide alternative suggestions
5. **Separation of Concerns**: AI tab shows results cleanly; Review tab handles all review workflows
6. **Clear Navigation**: Badge counts on Review tab indicate items needing attention
7. **User Review**: Dedicated Review tab allows users to accept, reject, or manually override AI suggestions
8. **Integration**: Seamlessly integrate with existing tag subcollection architecture

## User Personas

### Primary: Legal Document Reviewer
- Reviews 50-200 documents per day
- Needs quick metadata tagging for discovery management
- Values accuracy over speed but appreciates automation
- Comfortable reviewing and correcting AI suggestions

### Secondary: Paralegal/Legal Assistant
- Organizes incoming documents for case management
- Focuses on consistent categorization
- May have less domain expertise than attorneys
- Relies on system guidance for difficult classifications

## Requirements

### Functional Requirements

#### FR-1: Automatic Trigger Detection
- **Priority**: P0 (Critical)
- **Description**: When user opens the AI tab in the metadata panel, system checks if Document Date and/or Document Type tags exist using the embedded tags map
- **Acceptance Criteria**:
  - System reads `evidence.tags['DocumentDate']` from already-loaded evidence document
  - System reads `evidence.tags['DocumentType']` from already-loaded evidence document
  - No additional Firestore queries needed (tags already loaded with evidence document)
  - If either tag is missing or has `reviewRequired: true`, trigger AI analysis
  - Analysis triggers automatically without user interaction
  - Loading state displayed during analysis

#### FR-2: Document Date Extraction
- **Priority**: P0 (Critical)
- **Description**: AI analyzes document content to determine the date the document was created or signed
- **Acceptance Criteria**:
  - AI extracts dates from document content (headers, footers, signatures, letterhead)
  - Prioritizes document creation/signature dates over embedded metadata dates
  - Returns date in ISO 8601 format (YYYY-MM-DD)
  - Provides confidence score (0-100%)
  - For confidence <95%, provides up to 2 alternative date suggestions
  - Handles common date formats (MM/DD/YYYY, DD/MM/YYYY, Month DD, YYYY, etc.)
  - Distinguishes between document date vs. received date vs. metadata date

#### FR-3: Document Type Classification
- **Priority**: P0 (Critical)
- **Description**: AI classifies document into predefined or suggested types from the DocumentType system category
- **Acceptance Criteria**:
  - AI selects from existing DocumentType tags: Email, Memo, Letter, Contract, Invoice, Report
  - Can suggest new document types not in the predefined list (Open List behavior)
  - Returns primary classification with confidence score (0-100%)
  - For confidence <95%, provides up to 2 alternative type suggestions with confidence scores
  - Considers document structure, formatting, headers, and content
  - Maintains cumulative confidence of alternatives until 95% threshold or 2 alternatives reached

#### FR-4: Confidence Scoring
- **Priority**: P0 (Critical)
- **Description**: Each extracted field includes a confidence score that determines auto-approval and alternative suggestions
- **Acceptance Criteria**:
  - Confidence expressed as percentage (0-100%)
  - Primary suggestion confidence ≥95% → auto-approve, no alternatives needed
  - Primary suggestion confidence <95% → generate up to 2 alternative suggestions
  - Alternative suggestions ranked by confidence
  - Sum of all confidences (primary + alternatives) should approach or exceed 95%
  - Confidence calculation considers: content clarity, format consistency, contextual clues

#### FR-5: Hybrid Tag Storage (Subcollection + Embedded Map)
- **Priority**: P0 (Critical)
- **Description**: Extracted metadata stored using a hybrid architecture: **subcollections for full metadata/audit trail**, and **embedded map field for fast table loading**
- **Architecture Rationale**:
  - **Performance**: Embedded map enables loading 10,000+ documents in a single query (no N+1 subcollection queries)
  - **Rich Metadata**: Subcollection stores full AI metadata (alternatives, confidence, review history)
  - **Audit Trail**: Subcollection preserves complete review history and AI analysis details
  - **Atomic Writes**: Batch writes keep both locations synchronized
- **Acceptance Criteria**:

  **Subcollection Storage** (Full metadata, audit trail, alternatives):
  - Tags stored at `/firms/{firmId}/matters/{matterId}/evidence/{evidenceId}/tags/{categoryId}`
  - Uses `DocumentDate` and `DocumentType` as document IDs (one per category constraint)
  - Tag document structure:
    ```javascript
    {
      categoryId: 'DocumentDate' | 'DocumentType',
      categoryName: 'Document Date' | 'Document Type',
      tagName: string, // Date string or type name
      source: 'ai',
      confidence: number, // 0-100 (percentage)
      autoApproved: boolean, // true if confidence >= 95
      reviewRequired: boolean, // true if confidence < 95
      reviewedAt: Timestamp | null,
      reviewedBy: string | null,
      humanApproved: boolean | null,
      createdAt: Timestamp,
      createdBy: string,
      metadata: {
        model: 'gemini-1.5-flash',
        processingTime: number,
        context: string,
        aiAlternatives: [
          {
            value: string,
            confidence: number,
            reasoning: string
          }
        ],
        contentMatch: string, // Excerpt showing where info was found
        reviewReason: string | null
      }
    }
    ```

  **Embedded Map Storage** (Fast table loading):
  - Simplified tag data stored in `evidence.tags[categoryId]` map field
  - Denormalized for DocumentTable performance (single query loads all tags)
  - Structure:
    ```javascript
    evidence.tags = {
      'DocumentDate': {
        tagName: '2024-03-15',
        confidence: 97,
        source: 'ai',
        autoApproved: true,
        reviewRequired: false,
        createdAt: Timestamp
      },
      'DocumentType': {
        tagName: 'Invoice',
        confidence: 92,
        source: 'ai',
        autoApproved: false,
        reviewRequired: true,
        createdAt: Timestamp
      }
    }
    ```

  **Synchronization**:
  - **All tag writes use batch writes** to atomically update both locations
  - Subcollection write includes full metadata
  - Embedded map write includes only fields needed for table display
  - Evidence document counters updated (tagCount, autoApprovedCount, reviewRequiredCount)
  - Service: `tagSubcollectionService.js` handles synchronization automatically

#### FR-6: UI Display in 🤖 AI Tab
- **Priority**: P0 (Critical)
- **Description**: AI-extracted metadata displayed cleanly in the AI tab with status indicators, keeping the interface simple and uncluttered
- **Acceptance Criteria**:
  - **System Fields Section**:
    - Document Date field displays extracted date or "Not yet analyzed"
    - Document Type field displays extracted type or "Not yet analyzed"
  - **Status Indicators**:
    - Auto-approved items (≥95% confidence): Green checkmark (✓) next to value
    - Review-required items (<95% confidence): Yellow warning icon (⚠️) next to value
    - No extraction: No icon, shows "Not yet analyzed"
  - **Loading State**: Shows "Analyzing document..." with spinner during AI processing
  - **Error State**: Shows "Analysis failed" with brief error reason and [Retry] button
  - **Success State**: Shows extracted values with appropriate status icons
  - **Review Prompt**: If any items need review, displays alert box: "Some AI suggestions need your review. [Go to Review tab →]"
  - **No Detailed Review UI**: AI tab does NOT show alternatives, approve/reject buttons, or detailed review controls
  - **Manual Entry**: Simple "Edit" button for each field allows manual override at any time

#### FR-7: Tab Navigation and Badge Counts
- **Priority**: P0 (Critical)
- **Description**: Review tab displays badge count when items need review, providing clear navigation
- **Acceptance Criteria**:
  - **Badge Display**:
    - When reviewRequiredCount > 0, Review tab shows badge: "👤Review (2)"
    - Badge count updates in real-time as items are reviewed
    - Badge disappears when reviewRequiredCount = 0
  - **Navigation Hints**:
    - AI tab shows clickable prompt linking to Review tab when items need review
    - Clicking prompt automatically switches to Review tab
  - **Active Tab Highlighting**: Currently active tab is visually highlighted
  - **Persistent Badge**: Badge remains visible even when viewing other tabs

#### FR-8: 👤Review Tab - Full Review Workflow
- **Priority**: P0 (Critical)
- **Description**: Dedicated Review tab provides comprehensive workflow for reviewing and correcting low-confidence AI extractions
- **Acceptance Criteria**:
  - **Tab Sections**:
    1. **Review Queue** (items needing review)
    2. **Approved Items** (auto-approved and human-approved)
    3. **Review History** (timeline of review actions)

  - **Review Queue Display**:
    - Shows only items with `reviewRequired: true`
    - Each item displays as a card/section:
      ```
      Document Date (72% confidence) ⚠️
      ├─ AI Suggestion: March 15, 2024 (72%)
      │  └─ Found in: "Date: March 15, 2024 [from page 1, top right]"
      ├─ Alternative 1: March 1, 2024 (45%)
      │  └─ Found in: "Received: March 1, 2024 [from header]"
      ├─ Alternative 2: February 28, 2024 (18%)
      │  └─ Found in: "Period ending: February 28, 2024 [from content]"
      └─ Actions: [✓ Approve] [✗ Reject] [✎ Custom Entry]
      ```
    - Shows `AIanalysis.contentMatch` for context
    - Displays all alternatives with confidence scores
    - Provides three action buttons per item

  - **Review Actions**:
    - **Approve**: Accepts AI suggestion, updates tag with `humanApproved: true`, `reviewedAt`, `reviewedBy`
    - **Select Alternative**: Click alternative to replace current value, marks as human-reviewed
    - **Custom Entry**: Opens input field, user enters value, sets `source: 'human'`, `confidence: 1.0`
    - **Reject**: Marks as rejected, prompts for custom entry

  - **Approved Items Section**:
    - Lists auto-approved items (confidence ≥95%) in collapsed view
    - Lists human-approved items with approval details
    - Shows approval timestamp and reviewer
    - Allows re-opening for re-review if needed

  - **Review History Section**:
    - Timeline of all review actions
    - Shows: timestamp, reviewer, action taken, old value → new value
    - Helps with audit trail and quality control

  - **Empty States**:
    - Review Queue empty: "No items need review ✓"
    - Approved Items empty: "No approved items yet"
    - History empty: "No review history yet"

#### FR-9: Alternative Suggestions Management
- **Priority**: P1 (High)
- **Description**: Alternative suggestions are generated, stored, and displayed in the Review tab for low-confidence extractions
- **Acceptance Criteria**:
  - Alternatives stored in `AIanalysis.aiAlternatives` array (rank-ordered)
  - Primary suggestion stored in `tagName` field
  - Each alternative includes confidence score and reasoning
  - Review tab displays all alternatives with visual ranking (1st, 2nd alternative)
  - User can click any alternative to select it
  - Selecting alternative updates `tagName`, sets `humanApproved: true`, preserves alternative's confidence
  - Original AI selection preserved in `AIanalysis.aiSelection` for audit trail

### Non-Functional Requirements

#### NFR-1: Performance
- AI analysis completes within 10 seconds for files ≤20MB
- UI remains responsive during analysis (background processing)
- Loading indicators provide user feedback
- Failed analysis doesn't block UI

#### NFR-2: Accuracy
- Document Date extraction accuracy target: ≥90% for standard business documents
- Document Type classification accuracy target: ≥85% for predefined types
- False positive rate (incorrect high-confidence suggestions): <5%

#### NFR-3: Scalability
- Supports existing file size limits (20MB default, configurable via `VITE_AI_MAX_FILE_SIZE_MB`)
- Works with all supported file types (PDF, DOC, DOCX, images with OCR)
- Handles documents with poor formatting or degraded quality

#### NFR-4: Usability
- Zero-click analysis (automatic on tab open)
- Clear separation of concerns across three tabs
- AI tab remains clean and simple (display only)
- Review tab provides focused review workflow
- Badge count provides at-a-glance status
- One-click navigation from AI tab to Review tab
- One-click acceptance of suggestions in Review tab
- Two-click override with custom value
- Helpful error messages with recovery options

#### NFR-5: Integration
- Reuses existing `AIProcessingService` and `AITagService`
- Follows existing hybrid tag storage architecture (subcollection + embedded map)
- Uses existing `tagSubcollectionService.js` for atomic batch writes
- Compatible with existing category management system
- Works within Firebase AI Logic quotas and rate limits
- DocumentTable continues loading tags from embedded map (no performance impact)

## Technical Architecture

### Hybrid Storage Architecture

**Critical Design Decision**: The system uses a **dual-storage hybrid architecture** to optimize for both performance and functionality:

#### Why Hybrid Storage?

**Problem**: Loading 10,000 documents with subcollection queries would require 10,001 Firestore reads (1 for evidence list + 10,000 for tag subcollections), causing severe performance degradation.

**Solution**: Store tags in **two synchronized locations**:

1. **Subcollection** (`/evidence/{id}/tags/{categoryId}`):
   - **Purpose**: Full metadata, audit trail, review workflows
   - **Contains**: Complete AI analysis including alternatives, confidence scores, reasoning, review history
   - **Accessed by**: Review Tab, detailed document view
   - **Performance**: Only queried when viewing individual document details

2. **Embedded Map** (`evidence.tags[categoryId]`):
   - **Purpose**: Fast table loading without N+1 queries
   - **Contains**: Simplified tag data (tagName, confidence, reviewRequired, autoApproved)
   - **Accessed by**: DocumentTable, AI Tab initial display
   - **Performance**: Loaded in single query for entire evidence collection

#### Synchronization Pattern

All tag writes use **atomic batch writes** to keep both locations synchronized:

```javascript
// tagSubcollectionService.js - addTag() method
const batch = writeBatch(db);

// Write full metadata to subcollection
batch.set(subcollectionRef, {
  categoryId, categoryName, tagName,
  confidence, autoApproved, reviewRequired,
  metadata: { aiAlternatives, contentMatch, ... }
});

// Write simplified data to embedded map
batch.update(evidenceRef, {
  [`tags.${categoryId}`]: {
    tagName, confidence, autoApproved,
    reviewRequired, source, createdAt
  }
});

// Update counters
batch.update(evidenceRef, {
  tagCount: increment(1),
  reviewRequiredCount: reviewRequired ? increment(1) : 0
});

await batch.commit(); // Atomic transaction
```

#### Data Flow by Use Case

| Use Case | Data Source | Why |
|----------|-------------|-----|
| Load DocumentTable (10,000 docs) | Embedded map | Single query, no subcollection overhead |
| Display AI Tab initial view | Embedded map | Fast display, status icons only |
| Display Review Tab queue | Subcollection | Need alternatives, reasoning, full metadata |
| Approve/reject AI suggestion | Both (batch write) | Keep synchronized atomically |
| Export document list | Embedded map | Fast bulk operations |

#### Benefits

✅ **Performance**: DocumentTable loads 10,000+ docs in ~2 seconds (vs ~30+ seconds with subcollections)
✅ **Rich Metadata**: Review workflows have access to full AI analysis
✅ **Audit Trail**: Complete history preserved in subcollection
✅ **Consistency**: Batch writes ensure atomic synchronization
✅ **Scalability**: Embedded map approach scales linearly with document count

### Components

1. **DocumentMetadataPanel.vue** (existing, enhanced)
   - **Tab State Management**:
     - Manages active tab (Metadata, AI, Review)
     - Computes badge count for Review tab from tag counters
     - Handles tab switching with navigation hints
   - **AI Tab** (simplified):
     - Displays extracted values with status icons
     - Shows loading/error/success states
     - Simple "Edit" buttons for manual override
     - "Go to Review tab" prompt when items need review
   - **Review Tab** (new):
     - Review Queue component
     - Approved Items component
     - Review History component
     - Review action handlers

2. **AIMetadataExtractionService.js** (new)
   - Extends `AIProcessingService`
   - Specialized prompts for document date extraction
   - Specialized prompts for document type classification
   - Handles confidence calculation and alternative generation
   - Formats responses for hybrid tag storage (subcollection + embedded map)
   - Parses AI responses into structured tag documents
   - Delegates to `tagSubcollectionService.js` for atomic batch writes

3. **useAIMetadataExtraction.js** (new composable)
   - Reactive state management for extraction status
   - Orchestrates extraction workflow on AI tab open
   - Queries tag subcollection for existing metadata
   - Triggers AI analysis when needed
   - Provides computed properties for badge counts
   - Exposes review action methods

4. **ReviewQueueItem.vue** (new component)
   - Displays single review item (Document Date or Document Type)
   - Shows AI suggestion, alternatives, and context
   - Provides approve/reject/custom entry actions
   - Emits events for parent handling

5. **ApprovedItemsList.vue** (new component)
   - Displays auto-approved and human-approved items
   - Shows approval details (timestamp, reviewer)
   - Allows re-opening for re-review

6. **ReviewHistoryTimeline.vue** (new component)
   - Timeline view of review actions
   - Shows audit trail for quality control

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant MetadataPanel
    participant Composable as useAIMetadataExtraction
    participant AIMetadataService
    participant VertexAI as Firebase AI Logic
    participant TagService as tagSubcollectionService
    participant Firestore

    User->>MetadataPanel: Opens AI tab
    MetadataPanel->>Composable: checkAndTriggerAnalysis()

    Note over Composable,Firestore: Check Embedded Tags (Fast)
    Composable->>Firestore: Read evidence.tags map field
    Firestore-->>Composable: Return embedded tags

    alt Tags missing or reviewRequired
        Composable->>AIMetadataService: extractMetadata(evidenceId)
        AIMetadataService->>Firestore: Get document content from Storage
        AIMetadataService->>VertexAI: Generate with specialized prompt
        VertexAI-->>AIMetadataService: Return analysis JSON
        AIMetadataService->>AIMetadataService: Parse and validate
        AIMetadataService->>AIMetadataService: Calculate confidence scores
        AIMetadataService->>AIMetadataService: Generate alternatives if conf < 95%

        Note over AIMetadataService,Firestore: Hybrid Storage (Batch Write)
        AIMetadataService->>TagService: addTag(evidenceId, tagData)
        TagService->>TagService: Prepare full tag document
        TagService->>TagService: Prepare simplified embedded tag
        TagService->>Firestore: batch.set(subcollection/{categoryId}, fullTag)
        TagService->>Firestore: batch.update(evidence, {tags.categoryId: embeddedTag})
        TagService->>Firestore: batch.update(evidence, {counters})
        TagService->>Firestore: batch.commit()
        Firestore-->>TagService: Confirm atomic write
        TagService-->>Composable: Return stored tags
        Composable-->>MetadataPanel: Update UI with results
    else Tags exist and approved
        Composable-->>MetadataPanel: Display existing values from embedded map
    end

    MetadataPanel-->>User: Show extracted metadata
```

#### Review Tab Workflow

```mermaid
sequenceDiagram
    participant User
    participant MetadataPanel
    participant ReviewTab
    participant Composable as useAIMetadataExtraction
    participant TagService as tagSubcollectionService
    participant Firestore

    User->>MetadataPanel: Clicks "Go to Review tab" link from AI tab
    MetadataPanel->>MetadataPanel: Switch to Review tab

    Note over Composable,Firestore: Load from Subcollection (Full Metadata)
    MetadataPanel->>Composable: Load review queue
    Composable->>TagService: getTagsByStatus(evidenceId)
    TagService->>Firestore: Query tags subcollection (all tags)
    Firestore-->>TagService: Return all tag documents with full metadata
    TagService->>TagService: Filter by reviewRequired=true
    TagService-->>Composable: Return pending tags with alternatives
    Composable-->>ReviewTab: Display review queue items

    ReviewTab-->>User: Show items with alternatives, confidence, reasoning

    alt User approves AI suggestion
        User->>ReviewTab: Clicks [✓ Approve]
        ReviewTab->>Composable: approveTag(categoryId)
        Composable->>TagService: approveAITag(evidenceId, categoryId)

        Note over TagService,Firestore: Batch Update (Subcollection + Embedded)
        TagService->>Firestore: batch.update(subcollection/{categoryId}, approval fields)
        TagService->>Firestore: batch.update(evidence.tags.{categoryId}, approval fields)
        TagService->>Firestore: batch.update(evidence, decrement reviewRequiredCount)
        TagService->>Firestore: batch.commit()
        Firestore-->>TagService: Confirm atomic update
        TagService-->>Composable: Return success
        Composable-->>ReviewTab: Update UI, move to Approved Items
        ReviewTab-->>MetadataPanel: Update badge count (-1)
        MetadataPanel-->>User: Badge updates, item removed from queue

    else User selects alternative
        User->>ReviewTab: Clicks alternative suggestion
        ReviewTab->>Composable: selectAlternative(categoryId, alternativeValue)
        Composable->>TagService: Update tag documents

        Note over TagService,Firestore: Batch Update Both Locations
        TagService->>Firestore: batch.update(subcollection, new tagName + approval)
        TagService->>Firestore: batch.update(evidence.tags, new tagName + approval)
        TagService->>Firestore: batch.commit()
        Firestore-->>TagService: Confirm update
        TagService-->>Composable: Return success
        Composable-->>ReviewTab: Update UI
        ReviewTab-->>MetadataPanel: Update badge count (-1)

    else User enters custom value
        User->>ReviewTab: Clicks [✎ Custom Entry]
        ReviewTab-->>User: Show input field
        User->>ReviewTab: Enters custom value
        ReviewTab->>Composable: customEntry(categoryId, customValue)
        Composable->>TagService: Update tag documents

        Note over TagService,Firestore: Batch Update with Human Source
        TagService->>Firestore: batch.update(subcollection, custom value + source='human')
        TagService->>Firestore: batch.update(evidence.tags, custom value + source='human')
        TagService->>Firestore: batch.commit()
        Firestore-->>TagService: Confirm update
        TagService-->>Composable: Return success
        Composable-->>ReviewTab: Update UI
        ReviewTab-->>MetadataPanel: Update badge count (-1)
    end
```

### Prompt Engineering

#### Document Date Extraction Prompt (Specialized)

```
You are a document date extraction specialist. Analyze the provided document and extract the primary document date.

PRIORITY ORDER (extract the MOST RELEVANT date):
1. Signature date or execution date
2. Document creation date stated in header/footer
3. Letterhead date or "Date:" field
4. Latest substantive content date
5. Metadata creation date (lowest priority)

DO NOT extract:
- Received dates or routing dates
- Metadata modification dates unless no other date exists
- Future dates (unless document is explicitly forward-dated)

Return your analysis as JSON:
{
  "primaryDate": "YYYY-MM-DD",
  "confidence": 0.95,
  "location": "Brief description of where date was found",
  "alternatives": [
    {
      "date": "YYYY-MM-DD",
      "confidence": 0.65,
      "location": "Where this alternative was found",
      "reason": "Why this might be the document date"
    }
  ]
}

RULES:
- confidence must be between 0 and 1 (decimal)
- Only include alternatives if primaryDate confidence < 0.95
- Include up to 2 alternatives maximum
- Sum of all confidences should approach or exceed 0.95
- If no date found, return primaryDate: null, confidence: 0

Document to analyze:
[document content]
```

#### Document Type Classification Prompt (Specialized)

```
You are a legal document classifier. Analyze the provided document and classify its type.

PREDEFINED TYPES (prefer these if they fit):
- Email: Electronic correspondence
- Memo: Internal memorandum or note
- Letter: Formal correspondence
- Contract: Agreement, contract, or binding document
- Invoice: Bill, invoice, or payment request
- Report: Analysis, report, or formal documentation

You may suggest NEW types if none of the predefined types fit well.

Consider these indicators:
- Document structure (header, footer, signature block)
- Formatting conventions
- Language and tone
- Presence of legal terminology
- Standard document elements (RE:, Dear, Sincerely, etc.)

Return your analysis as JSON:
{
  "primaryType": "Email",
  "confidence": 0.92,
  "reasoning": "Brief explanation of classification",
  "indicators": ["List", "of", "key", "indicators"],
  "alternatives": [
    {
      "type": "Memo",
      "confidence": 0.45,
      "reasoning": "Why this alternative is possible"
    }
  ]
}

RULES:
- confidence must be between 0 and 1 (decimal)
- Only include alternatives if primaryType confidence < 0.95
- Include up to 2 alternatives maximum
- Rank alternatives by confidence (highest first)
- Sum of all confidences should approach or exceed 0.95
- Prefer predefined types unless document clearly doesn't fit any

Document to analyze:
[document content]
```

## UI Mockups (Text Format)

### 🤖 AI Tab - Simple Display

#### Scenario 1: Auto-Approved Items (High Confidence)
```
┌─────────────────────────────────────────┐
│ 🤖 AI Tab                               │
├─────────────────────────────────────────┤
│                                         │
│ System Fields                           │
│ ─────────────────                       │
│                                         │
│ DOCUMENT DATE:                          │
│ March 15, 2024 ✓                        │
│                                         │
│ DOCUMENT TYPE:                          │
│ Invoice ✓                               │
│                                         │
│ ────────────────────────────────────    │
│                                         │
│ Firm Fields                             │
│ Coming soon...                          │
│                                         │
│ Matter Fields                           │
│ Coming soon...                          │
│                                         │
└─────────────────────────────────────────┘
```

#### Scenario 2: Items Need Review (Low Confidence)
```
┌─────────────────────────────────────────┐
│ 🤖 AI Tab                               │
├─────────────────────────────────────────┤
│                                         │
│ ⚠️ Review Required                      │
│ ┌─────────────────────────────────────┐ │
│ │ Some AI suggestions need your       │ │
│ │ review.                             │ │
│ │                                     │ │
│ │        [Go to Review tab →]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ System Fields                           │
│ ─────────────────                       │
│                                         │
│ DOCUMENT DATE:                          │
│ March 15, 2024 ⚠️                       │
│ [Edit]                                  │
│                                         │
│ DOCUMENT TYPE:                          │
│ Memo ⚠️                                 │
│ [Edit]                                  │
│                                         │
└─────────────────────────────────────────┘
```

#### Scenario 3: Analysis in Progress
```
┌─────────────────────────────────────────┐
│ 🤖 AI Tab                               │
├─────────────────────────────────────────┤
│                                         │
│ ⏳ Analyzing document...                │
│                                         │
│ [Spinner animation]                     │
│                                         │
│ System Fields                           │
│ ─────────────────                       │
│                                         │
│ DOCUMENT DATE:                          │
│ Not yet analyzed                             │
│                                         │
│ DOCUMENT TYPE:                          │
│ Not yet analyzed                             │
│                                         │
└─────────────────────────────────────────┘
```

### 👤 Review Tab - Full Workflow

#### Review Queue Section
```
┌─────────────────────────────────────────┐
│ 👤 Review (2)                           │
├─────────────────────────────────────────┤
│                                         │
│ Review Queue (2 items)                  │
│ ═══════════════════════════════════     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Document Date (72% confidence) ⚠️   │ │
│ │                                     │ │
│ │ AI Suggestion: March 15, 2024 (72%) │ │
│ │ Found in: "Date: March 15, 2024     │ │
│ │            [from page 1, top right]"│ │
│ │                                     │ │
│ │ Alternative 1: March 1, 2024 (45%)  │ │
│ │ Found in: "Received: March 1, 2024  │ │
│ │            [from header]"           │ │
│ │                                     │ │
│ │ Alternative 2: Feb 28, 2024 (18%)   │ │
│ │ Found in: "Period ending: Feb 28"   │ │
│ │                                     │ │
│ │ [✓ Approve] [✗ Reject] [✎ Custom]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Document Type (78% confidence) ⚠️   │ │
│ │                                     │ │
│ │ AI Suggestion: Memo (78%)           │ │
│ │ Found in: "MEMORANDUM [header] +    │ │
│ │            TO/FROM fields"          │ │
│ │                                     │ │
│ │ Alternative 1: Letter (35%)         │ │
│ │ Alternative 2: Email (12%)          │ │
│ │                                     │ │
│ │ [✓ Approve] [✗ Reject] [✎ Custom]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Approved Items                          │
│ ───────────────                         │
│                                         │
│ Auto-Approved (0) ▼                     │
│                                         │
│ Human-Approved (0)                      │
│ (none yet)                              │
│                                         │
│ Review History                          │
│ ──────────────                          │
│                                         │
│ (no history yet)                        │
│                                         │
└─────────────────────────────────────────┘
```

#### After Approving First Item
```
┌─────────────────────────────────────────┐
│ 👤 Review (1)                           │
├─────────────────────────────────────────┤
│                                         │
│ Review Queue (1 item)                   │
│ ═══════════════════════════════════     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Document Type (78% confidence) ⚠️   │ │
│ │ ... (same as above)                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Approved Items                          │
│ ───────────────                         │
│                                         │
│ Auto-Approved (0) ▼                     │
│                                         │
│ Human-Approved (1) ▼                    │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Document Date: March 15, 2024     │ │
│ │   Approved by: John Smith           │ │
│ │   At: 2024-11-04 14:23:15           │ │
│ │   Original confidence: 72%          │ │
│ │   [Re-open for review]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Review History                          │
│ ──────────────                          │
│                                         │
│ 📅 2024-11-04 14:23:15                  │
│    John Smith approved AI suggestion   │
│    Document Date: March 15, 2024        │
│                                         │
└─────────────────────────────────────────┘
```

#### All Items Reviewed
```
┌─────────────────────────────────────────┐
│ 👤 Review                               │
├─────────────────────────────────────────┤
│                                         │
│ Review Queue                            │
│ ═══════════════════════════════════     │
│                                         │
│ ✓ No items need review                  │
│                                         │
│ Approved Items                          │
│ ───────────────                         │
│                                         │
│ Auto-Approved (0) ▼                     │
│                                         │
│ Human-Approved (2) ▼                    │
│ • Document Date: March 15, 2024         │
│ • Document Type: Memo                   │
│                                         │
│ Review History                          │
│ ──────────────                          │
│                                         │
│ 📅 2024-11-04 14:25:42                  │
│    John Smith selected alternative     │
│    Document Type: Letter → Memo         │
│                                         │
│ 📅 2024-11-04 14:23:15                  │
│    John Smith approved AI suggestion   │
│    Document Date: March 15, 2024        │
│                                         │
└─────────────────────────────────────────┘
```

### Tab Navigation with Badge

```
┌───────────────────────────────────────────────────┐
│ [ℹ️ Metadata] [🤖 AI] [👤Review (2)]    [👁️]    │
│ ─────────────  ─────                              │
│    (active)                                       │
└───────────────────────────────────────────────────┘
        ↓
   (User clicks Review tab)
        ↓
┌───────────────────────────────────────────────────┐
│ [ℹ️ Metadata] [🤖 AI] [👤Review (2)]    [👁️]    │
│                        ─────────────              │
│                          (active)                 │
└───────────────────────────────────────────────────┘
```

## User Stories

### Epic 1: Automatic Analysis Trigger

#### US-1.1: Auto-Trigger on Tab Open
**As a** document reviewer
**I want** AI analysis to start automatically when I open the AI tab
**So that** I don't have to manually trigger analysis for every document

**Acceptance Criteria:**
- Given I open a document's metadata panel
- When I click on the "🤖 AI" tab
- Then the system checks if DocumentDate and DocumentType tags exist
- And if either is missing or needs review, AI analysis starts automatically
- And I see a loading indicator showing "Analyzing document..."

#### US-1.2: Skip Analysis for Complete Documents
**As a** document reviewer
**I want** the system to skip AI analysis if metadata is already complete and approved
**So that** I don't waste processing time or see unnecessary loading states

**Acceptance Criteria:**
- Given I open the AI tab
- When both DocumentDate and DocumentType tags exist with `autoApproved: true`
- Then no AI analysis is triggered
- And I immediately see the existing metadata values

### Epic 2: Document Date Extraction

#### US-2.1: Extract Document Date with High Confidence
**As a** document reviewer
**I want** the system to extract the document date from the content
**So that** I can quickly see when the document was created without reading it

**Acceptance Criteria:**
- Given a document with a clear date (e.g., letterhead date, signature date)
- When AI analysis completes
- Then Document Date field shows the extracted date (e.g., "March 15, 2024")
- And confidence score shows ≥95%
- And a green checkmark (✓) indicates auto-approval
- And the tag is stored with `autoApproved: true`

#### US-2.2: Flag Low-Confidence Date for Review
**As a** document reviewer
**I want** to be notified when date extraction has low confidence
**So that** I can review it in the dedicated Review tab

**Acceptance Criteria:**
- Given a document with multiple dates or unclear date
- When AI analysis completes with confidence <95%
- Then Document Date field shows the primary suggestion (e.g., "March 15, 2024")
- And a yellow warning icon (⚠️) indicates review needed
- And the tag is stored with `reviewRequired: true`
- And Review tab badge count increases (e.g., "👤Review (1)")
- And AI tab shows prompt: "Some AI suggestions need your review. [Go to Review tab →]"

#### US-2.3: Handle Documents with No Clear Date
**As a** document reviewer
**I want** clear indication when no date can be extracted
**So that** I know I need to manually research or enter the date

**Acceptance Criteria:**
- Given a document with no discernible date
- When AI analysis completes
- Then Document Date field shows "No date found (AI confidence: 0%)"
- And a manual entry field is prominently displayed
- And the field is marked for required manual review

### Epic 3: Document Type Classification

#### US-3.1: Classify Document Type with High Confidence
**As a** document reviewer
**I want** the system to classify the document type automatically
**So that** documents are consistently categorized

**Acceptance Criteria:**
- Given a clearly formatted document (e.g., email with headers, invoice with line items)
- When AI analysis completes
- Then Document Type field shows the classification (e.g., "Invoice")
- And confidence score shows ≥95%
- And a green checkmark (✓) indicates auto-approval
- And the tag is stored with `autoApproved: true`

#### US-3.2: Flag Low-Confidence Type for Review
**As a** document reviewer
**I want** to be notified when type classification has low confidence
**So that** I can review it in the dedicated Review tab

**Acceptance Criteria:**
- Given a document with characteristics of multiple types
- When AI analysis completes with confidence <95%
- Then Document Type field shows primary classification (e.g., "Memo")
- And a yellow warning icon (⚠️) indicates review needed
- And the tag is stored with `reviewRequired: true`
- And Review tab badge count increases (e.g., "👤Review (2)")
- And AI tab shows prompt: "Some AI suggestions need your review. [Go to Review tab →]"

#### US-3.3: Suggest New Document Types
**As a** document reviewer
**I want** AI to suggest new document types not in the predefined list
**So that** I can handle unusual or specialized documents

**Acceptance Criteria:**
- Given a document that doesn't fit predefined types (Email, Memo, Letter, Contract, Invoice, Report)
- When AI analysis completes
- Then Document Type field shows a suggested new type (e.g., "Affidavit")
- And confidence score is displayed
- And I can accept, reject, or modify the suggested type
- When I accept the new type
- Then it's added to the DocumentType category's tag options (Open List behavior)

### Epic 4: Tab Navigation and Badge Awareness

#### US-4.1: Review Tab Badge Count
**As a** document reviewer
**I want** to see a badge count on the Review tab
**So that** I know how many items need my attention without switching tabs

**Acceptance Criteria:**
- Given AI has extracted metadata with confidence <95%
- When I'm viewing any tab in the metadata panel
- Then the Review tab header shows badge count: "👤Review (2)"
- And the badge updates in real-time as I review items
- And the badge disappears when all items are reviewed

#### US-4.2: Navigate from AI Tab to Review Tab
**As a** document reviewer
**I want** to easily navigate from the AI tab to the Review tab
**So that** I can quickly review low-confidence suggestions

**Acceptance Criteria:**
- Given the AI tab shows items needing review
- When I see the prompt "Some AI suggestions need your review"
- And I click "[Go to Review tab →]"
- Then the metadata panel switches to the Review tab
- And I see the Review Queue with items needing attention

### Epic 5: Review Tab Workflow

#### US-5.1: View Review Queue
**As a** document reviewer
**I want** to see all items requiring review in one place
**So that** I can efficiently process low-confidence suggestions

**Acceptance Criteria:**
- Given I open the Review tab
- When there are items with `reviewRequired: true`
- Then I see a "Review Queue" section at the top
- And each item shows:
  - Field name and confidence %
  - AI suggestion with confidence score
  - Up to 2 alternatives with confidence scores
  - Context excerpt showing where info was found
  - Action buttons: [✓ Approve] [✗ Reject] [✎ Custom Entry]

#### US-5.2: View Extraction Context in Review
**As a** document reviewer
**I want** to see where in the document the AI found the information
**So that** I can verify accuracy before approving

**Acceptance Criteria:**
- Given an item in the Review Queue
- Then I see the `AIanalysis.contentMatch` field displayed
- Which shows the excerpt from the document (e.g., "Date: March 15, 2024 [from page 1, top right]")
- And this helps me understand why AI made its suggestion
- And I can make an informed decision to approve/reject/override

#### US-5.3: Approve AI Suggestion in Review Tab
**As a** document reviewer
**I want** to quickly approve correct AI suggestions
**So that** I can efficiently process items that look correct despite low confidence

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click the [✓ Approve] button
- Then the tag document is updated with `humanApproved: true`, `reviewedAt`, `reviewedBy`
- And the item moves from Review Queue to Approved Items section
- And the warning icon in AI tab changes to a checkmark
- And the Review tab badge count decreases by 1

#### US-5.4: Select Alternative Suggestion in Review Tab
**As a** document reviewer
**I want** to select from alternative suggestions
**So that** I can quickly correct minor errors without typing

**Acceptance Criteria:**
- Given an item in Review Queue with alternatives
- When I click on an alternative (e.g., "Alternative 1: March 1, 2024 (45%)")
- Then the `tagName` field updates to the selected alternative
- And the tag is marked with `humanApproved: true`, `reviewedAt`, `reviewedBy`
- And the item moves to Approved Items section
- And the AI tab shows the updated value
- And the Review tab badge count decreases by 1

#### US-5.5: Custom Entry in Review Tab
**As a** document reviewer
**I want** to manually enter or correct extracted values
**So that** I can fix incorrect AI extractions

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click [✎ Custom Entry] button
- Then an input field appears with the current value pre-filled
- When I enter a new value and save
- Then the tag document updates with my value
- And `source` changes to 'human'
- And `confidence` is set to 1.0 (100%)
- And `humanApproved` is set to true
- And the item moves to Approved Items section
- And the Review tab badge count decreases by 1

#### US-5.6: Reject Suggestion and Enter Custom Value
**As a** document reviewer
**I want** to reject an AI suggestion and provide my own value
**So that** I can correct completely wrong extractions

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click [✗ Reject] button
- Then the custom entry field immediately appears
- And I'm prompted to enter the correct value
- And I cannot dismiss without entering a value
- When I enter and save the correct value
- Then it's handled same as Custom Entry (source: 'human', confidence: 1.0)

#### US-5.7: View Approved Items
**As a** document reviewer
**I want** to see which items have been auto-approved or human-approved
**So that** I can review the complete picture of document metadata

**Acceptance Criteria:**
- Given I'm in the Review tab
- Then I see an "Approved Items" section below the Review Queue
- Which shows two subsections:
  - **Auto-Approved** (confidence ≥95%): collapsed by default, shows count
  - **Human-Approved**: shows full details with reviewer and timestamp
- And I can expand auto-approved to see details
- And I can re-open any item for re-review if needed

#### US-5.8: View Review History
**As a** document reviewer
**I want** to see a timeline of review actions
**So that** I can audit what changes were made

**Acceptance Criteria:**
- Given I'm in the Review tab
- Then I see a "Review History" section at the bottom
- Which shows a chronological timeline of actions:
  - Timestamp
  - Reviewer name
  - Action taken (Approved AI / Selected Alternative / Custom Entry)
  - Old value → New value
- And this provides an audit trail for quality control

### Epic 6: Error Handling and Edge Cases

#### US-6.1: Handle Analysis Failures Gracefully
**As a** document reviewer
**I want** clear error messages and recovery options when AI analysis fails
**So that** I can proceed with manual entry

**Acceptance Criteria:**
- Given AI analysis fails (network error, API error, timeout)
- When the failure occurs
- Then the AI tab shows "Analysis failed" with error reason
- And a "Retry" button is displayed
- And manual entry fields remain accessible
- And existing metadata (if any) is preserved

#### US-6.2: Handle Unsupported File Types
**As a** document reviewer
**I want** clear messaging when my document type isn't supported for AI analysis
**So that** I understand why analysis isn't available

**Acceptance Criteria:**
- Given a file type not supported for AI content analysis
- When I open the AI tab
- Then a message displays "AI analysis not available for this file type"
- And manual entry fields are shown
- And I can still manually enter Document Date and Document Type

#### US-6.3: Handle Large Files
**As a** document reviewer
**I want** clear messaging when my file is too large for AI analysis
**So that** I understand the limitation and can proceed manually

**Acceptance Criteria:**
- Given a file larger than the AI size limit (default 20MB)
- When I open the AI tab
- Then a message displays "File too large for AI analysis (25MB > 20MB limit)"
- And manual entry fields are shown
- And existing metadata features remain functional

## Success Metrics

### Adoption Metrics
- **AI Tab Usage**: % of document views where AI tab is opened (target: >60% within 3 months)
- **Auto-Approval Rate**: % of AI suggestions auto-approved (target: >70%)
- **Manual Override Rate**: % of AI suggestions manually corrected (target: <15%)

### Accuracy Metrics
- **Document Date Accuracy**: % of auto-approved dates that remain unchanged after human review (target: >90%)
- **Document Type Accuracy**: % of auto-approved types that remain unchanged (target: >85%)
- **Confidence Calibration**: Correlation between AI confidence and accuracy (target: >0.85)

### Performance Metrics
- **Analysis Time**: Average time for AI analysis to complete (target: <8 seconds)
- **Time Savings**: Average time saved per document vs. manual entry (target: >30 seconds)
- **User Satisfaction**: User rating of AI assistance (target: >4.0/5.0)

## Future Enhancements (Out of Scope for Initial Release)

1. **Multi-Field Extraction**: Extract Author, Custodian, and custom firm/matter fields
2. **Document Summarization**: Generate AI-powered document summaries
3. **Key Entity Extraction**: Extract party names, dates, amounts, locations
4. **Batch Processing**: Run AI analysis on multiple documents at once
5. **Learning from Corrections**: Train models based on user corrections
6. **Extraction Confidence Visualization**: Heat map showing which parts of document informed extraction
7. **Jump to Content**: Click extracted value to jump to relevant section in document viewer

## Dependencies

1. Firebase AI Logic (Gemini) API access and quotas
2. **Existing hybrid tag storage architecture** (subcollection + embedded map)
   - `tagSubcollectionService.js` for atomic batch writes
   - Evidence documents with `tags` map field
   - `tagCount`, `autoApprovedCount`, `reviewRequiredCount` counters
3. Existing category management system (DocumentDate and DocumentType categories)
4. Document viewer with metadata panel
5. Firebase Storage for document content access
6. DocumentTable already configured to read from embedded `tags` map field

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low AI accuracy for non-standard documents | High | Medium | Robust confidence scoring, always show alternatives, easy manual override |
| API rate limits or quota exhaustion | Medium | High | Implement queuing, respect rate limits, clear error messaging, allow batch processing later |
| User distrust of AI suggestions | Medium | Medium | Always show confidence scores, provide context/reasoning, make review easy, track accuracy metrics |
| Performance impact on tab switching | Low | Medium | Background processing, optimize prompts, cache results, progressive loading |
| Complex date interpretation (date ranges, partial dates) | Medium | Medium | Clear rules in prompt, flag ambiguous dates for review, provide date formatting options |

## Open Questions

1. **Date Formatting**: Should extracted dates be displayed in user's preferred format or ISO format?
   - **Recommendation**: Use user's preferred date format from settings for display, store ISO 8601 in database

2. **Multi-Date Documents**: How to handle documents with multiple relevant dates (e.g., contract with execution date and effective date)?
   - **Recommendation**: Extract "primary" document date (execution/creation), consider adding "Effective Date" as separate field in future

3. **Date Ranges**: How to handle date ranges (e.g., "January-March 2024")?
   - **Recommendation**: Extract start date, add note field, or flag for manual review

4. **Timezone Handling**: Should extracted dates include timezone information?
   - **Recommendation**: Store dates without time component (date only), as DocumentDate is a date field not datetime

5. **Reanalysis**: Should users be able to manually trigger reanalysis after AI has run?
   - **Recommendation**: Yes, add "Reanalyze" button in AI tab for re-running extraction

6. **Background Processing**: Should analysis run in background for newly uploaded documents?
   - **Recommendation**: Future enhancement - initial version only analyzes on tab open to manage API costs

## Implementation Phases

### Phase 1: Core Extraction (Initial Release)
- Automatic trigger detection
- Document Date extraction
- Document Type classification
- Basic UI display
- Tag subcollection storage
- Estimated: 2-3 weeks

### Phase 2: Review Workflow (Week 4)
- Alternative suggestions UI
- Approve/reject/override actions
- Review status tracking
- Confidence visualization
- Estimated: 1-2 weeks

### Phase 3: Polish and Edge Cases (Week 6)
- Error handling
- Performance optimization
- Edge case handling
- User feedback integration
- Analytics tracking
- Estimated: 1 week

### Phase 4: Testing and Refinement (Week 7-8)
- User acceptance testing
- Accuracy validation
- Performance testing
- Prompt engineering refinement
- Documentation
- Estimated: 1-2 weeks

**Total Estimated Timeline**: 6-8 weeks

## Appendix

### Related System Categories

```javascript
// DocumentDate - Date type
{
  id: 'DocumentDate',
  name: 'Document Date',
  type: 'Date',
  defaultDateFormat: 'YYYY-MM-DD',
  isSystemCategory: true,
  description: 'The date the document was created or signed'
}

// DocumentType - Open List type
{
  id: 'DocumentType',
  name: 'Document Type',
  type: 'Open List',
  isSystemCategory: true,
  description: 'Classification of document type',
  tags: [
    { name: 'Email' },
    { name: 'Memo' },
    { name: 'Letter' },
    { name: 'Contract' },
    { name: 'Invoice' },
    { name: 'Report' }
  ]
}
```

### Tag Document Structure Reference

#### Subcollection Storage (Full Metadata)

Stored at: `/firms/{firmId}/matters/{matterId}/evidence/{evidenceId}/tags/{categoryId}`

```javascript
// Example: Auto-approved Document Date tag (Subcollection)
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2024-03-15',
  source: 'ai',
  confidence: 97, // 0-100 percentage
  autoApproved: true,
  reviewRequired: false,
  reviewedAt: Timestamp, // Auto-set for auto-approved
  reviewedBy: null,
  humanApproved: null,
  createdAt: Timestamp,
  createdBy: 'ai-system',
  metadata: {
    model: 'gemini-1.5-flash',
    processingTime: 3200, // milliseconds
    context: 'Analyzed document headers and signature blocks',
    aiAlternatives: [], // Empty for high confidence (≥95%)
    contentMatch: 'Date: March 15, 2024 [from page 1, top right header]',
    reviewReason: null
  }
}

// Example: Review-required Document Type tag (Subcollection)
{
  categoryId: 'DocumentType',
  categoryName: 'Document Type',
  tagName: 'Memo',
  source: 'ai',
  confidence: 78, // 0-100 percentage
  autoApproved: false,
  reviewRequired: true,
  reviewedAt: null,
  reviewedBy: null,
  humanApproved: null,
  createdAt: Timestamp,
  createdBy: 'ai-system',
  metadata: {
    model: 'gemini-1.5-flash',
    processingTime: 4100,
    context: 'Document structure analysis with multiple format indicators',
    aiAlternatives: [
      {
        value: 'Letter',
        confidence: 35,
        reasoning: 'Formal greeting and closing similar to business letter format'
      },
      {
        value: 'Email',
        confidence: 12,
        reasoning: 'TO/FROM fields similar to email headers'
      }
    ],
    contentMatch: 'MEMORANDUM [from header] + TO/FROM fields + body text structure',
    reviewReason: 'Document has characteristics of both memo and letter formats'
  }
}
```

#### Embedded Map Storage (Fast Table Loading)

Stored at: `evidence.tags[categoryId]` (denormalized in evidence document)

```javascript
// Example: Embedded tags in evidence document
{
  // ... other evidence fields ...
  tags: {
    'DocumentDate': {
      tagName: '2024-03-15',
      confidence: 97,
      source: 'ai',
      autoApproved: true,
      reviewRequired: false,
      createdAt: Timestamp
    },
    'DocumentType': {
      tagName: 'Memo',
      confidence: 78,
      source: 'ai',
      autoApproved: false,
      reviewRequired: true,
      createdAt: Timestamp
    }
  },
  tagCount: 2,
  autoApprovedCount: 1,
  reviewRequiredCount: 1
}
```

**Note**: Both storage locations are synchronized atomically using batch writes in `tagSubcollectionService.js`. The DocumentTable reads only from the embedded map for performance (single query for 10,000+ documents). The Review tab reads from the subcollection to access full metadata including alternatives and reasoning.

---

**Document Version**: 1.1
**Last Updated**: 2025-11-04
**Change Log**:
- v1.1 (2025-11-04): Updated to reflect actual hybrid storage architecture (subcollection + embedded map)
- v1.0 (2025-11-04): Initial requirements document

**Authors**: Product Team + AI Assistant
**Reviewers**: TBD
**Approval**: Pending
