# AI Metadata Extraction - Functional Requirements

**Related Documentation**:
- `ai-requirements-overview.md` - Executive summary, goals, and metrics
- `ai-requirements-architecture.md` - Technical architecture details
- `ai-requirements-user-stories.md` - User stories for each requirement

## Functional Requirements

### FR-1: Manual Analysis Trigger
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED
- **Description**: User manually triggers AI analysis by clicking "Analyze Document" button in the AI tab
- **Acceptance Criteria**:
  - ✅ "Analyze Document" button displayed when no analysis results exist
  - ✅ Button disabled during analysis with spinner state
  - ✅ Loading state shows "Analyzing..." with progress indicator
  - ✅ Analysis processes Document Date and Document Type in single API call
  - ✅ Results stored in Firestore via tagSubcollectionService
  - ✅ Results persist across sessions (loaded from Firestore on tab open)
- **Implementation**: `src/components/document/tabs/AIAnalysisTab.vue` lines 67-77, 374-503

### FR-2: Document Date Extraction
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED
- **Description**: AI analyzes document content to determine the date the document was created or signed
- **Acceptance Criteria**:
  - ✅ AI extracts dates from document content (headers, footers, signatures, letterhead)
  - ✅ Prioritizes document creation/signature dates over payment stamps and received dates
  - ✅ Returns date in ISO 8601 format (YYYY-MM-DD)
  - ✅ Provides confidence score (0-100%)
  - ✅ For confidence <95%, provides up to 2 alternative date suggestions
  - ✅ Handles common date formats (MM/DD/YYYY, DD/MM/YYYY, Month DD, YYYY, etc.)
  - ✅ Prompt explicitly instructs AI to ignore payment stamps, received dates, scanned dates
- **Implementation**:
  - Service: `src/services/aiMetadataExtractionService.js` lines 32-141 (analyzeDocument method)
  - Prompt: Lines 148-194 (_buildPrompt method with date extraction rules)
  - Parser: Lines 201-249 (_parseResponse method)

### FR-3: Document Type Classification
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED
- **Description**: AI classifies document into predefined or suggested types from the DocumentType system category using 3-tier hierarchy
- **Acceptance Criteria**:
  - ✅ AI uses **3-tier document type hierarchy** (Matter-specific → Firm-wide → Global systemcategories)
  - ✅ Dynamically fetches document types from Firestore before analysis
  - ✅ Can suggest new document types not in the predefined list (Open List behavior)
  - ✅ Returns primary classification with confidence score (0-100%)
  - ✅ For confidence <95%, provides up to 2 alternative type suggestions
  - ✅ Considers document structure, formatting, headers, and content
  - ✅ Includes reasoning and context for each suggestion
- **Implementation**:
  - Service: `src/services/aiMetadataExtractionService.js` lines 258-351 (_getDocumentTypes method)
  - 3-Tier Hierarchy Logic: Matter (firmId/matterId/categories) → Firm (firmId/general/categories) → Global (systemcategories)
  - Prompt Building: Lines 148-194 (dynamically injects available types into prompt)

### FR-4: Confidence Scoring
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED
- **Description**: Each extracted field includes a confidence score that determines auto-approval and alternative suggestions
- **Acceptance Criteria**:
  - ✅ Confidence expressed as percentage (0-100%)
  - ✅ **Threshold: ≥95% for auto-approval** (implemented in AIAnalysisTab.vue:432)
  - ✅ Primary suggestion confidence ≥95% → auto-approve (autoApproved: true, reviewRequired: false)
  - ✅ Primary suggestion confidence <95% → mark for review (reviewRequired: true)
  - ✅ Alternative suggestions provided with confidence scores and reasoning
  - ✅ Alternatives displayed in tooltips on hover (AIAnalysisTab.vue:103-120)
- **Implementation**:
  - Threshold constant: `AIAnalysisTab.vue` line 432: `const confidenceThreshold = 95`
  - Badge colors: ≥95% green (success), 80-94% amber (warning), <80% red (error)
  - Badge computation: Lines 257-261 (getConfidenceBadgeColor method)

### FR-5: Hybrid Tag Storage (Subcollection + Embedded Map)
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED
- **Description**: Extracted metadata stored using hybrid architecture via tagSubcollectionService: **subcollections for full metadata/audit trail**, and **embedded map field for fast table loading**
- **Architecture Rationale**:
  - **Performance**: Embedded map enables loading 10,000+ documents in a single query (no N+1 subcollection queries)
  - **Rich Metadata**: Subcollection stores full AI metadata (alternatives, confidence, review history)
  - **Audit Trail**: Subcollection preserves complete review history and AI analysis details
  - **Atomic Writes**: Batch writes keep both locations synchronized
- **Implementation Service**: `src/features/organizer/services/tagSubcollectionService.js`
  - Method: `addTagsBatch()` - Atomic batch write to both subcollection and embedded map
  - Usage: `AIAnalysisTab.vue` lines 490-495
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
        model: 'gemini-2.5-flash-lite', // Current AI model for metadata extraction
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

### FR-6: UI Display in 🤖 AI Tab (Configuration Panel)
- **Priority**: P0 (Critical)
- **Status**: 🚧 PHASE 4 IN PROGRESS
- **Description**: AI Tab serves as configuration panel for metadata extraction, with Get/Skip/Manual options for pending fields
- **Acceptance Criteria**:
  - **Configuration Panel**:
    - Shows only fields that have NOT been determined (no AI result and not manually accepted)
    - Each pending field displays Get | Skip | Manual radio buttons
    - **Get**: Include this field in AI extraction prompt
    - **Skip**: Don't ask AI about this field
    - **Manual**: User will enter manually (field appears on Review Tab with empty input)
  - **Dynamic Field Visibility**:
    - Fields disappear from AI Tab once determined (AI-extracted or manually accepted)
    - Fields set to "Manual" remain on AI Tab until accepted on Review Tab
  - **Analysis Trigger**:
    - "Analyze Document" button includes only fields marked "Get"
    - Button disabled during analysis with spinner state
    - Loading state shows "Analyzing..." with progress indicator
  - **Status Indicators** (Confidence Badges on Review Tab):
    - ≥95% confidence: Green badge (success color)
    - 80-94% confidence: Amber badge (warning color)
    - <80% confidence: Red badge (error color)
  - **Error Handling**:
    - Error alert with reason and [Retry] button
    - Failed fields remain on AI Tab for retry
- **Implementation**: `src/components/document/tabs/AIAnalysisTab.vue`
  - Configuration state: `extractionMode` ref
  - Field visibility: `shouldShowOnAITab()` method
  - Mode selection: `setExtractionMode()` method

### FR-7: Tab Navigation and Badge Counts
- **Priority**: P1 (High)
- **Status**: ⏸️ NOT YET IMPLEMENTED (Phase 4)
- **Description**: Review tab will display badge count when items need review, providing clear navigation
- **Current State**:
  - ReviewTab.vue exists as minimal placeholder (`src/components/document/tabs/ReviewTab.vue`, 78 lines)
  - Shows basic structure: "Review tag: [tag name]"
  - No badge count implementation
  - No review queue functionality
- **Planned Acceptance Criteria** (Future):
  - Badge Display: "👤Review (2)" when reviewRequiredCount > 0
  - Badge updates in real-time as items are reviewed
  - Navigation hints from AI tab to Review tab
  - Active tab highlighting

### FR-8: 👤Review Tab - Review & Accept Workflow
- **Priority**: P1 (High - Phase 4)
- **Status**: 🚧 PHASE 4 IN PROGRESS
- **Description**: Review Tab provides streamlined workflow for reviewing AI-extracted values and manual entry, with Accept/Reject actions
- **Acceptance Criteria**:
  - **Display Logic**:
    - Shows fields that are AI-extracted OR set to "Manual" on AI Tab
    - Empty state: "No data ready for review" when no fields to display
    - Fields disappear after acceptance

  - **AI-Extracted Fields Display**:
    - Field name (e.g., "Document Date")
    - Editable input field pre-filled with AI value
    - Confidence badge (e.g., "85%") with color coding:
      - ≥95% confidence: Green badge
      - 80-94% confidence: Amber badge
      - <80% confidence: Red badge
    - Tooltip on badge hover showing AI reasoning and context
    - ✓ Accept button (enabled when input is valid)
    - ✗ Reject button (mockup for Phase 4)

  - **Manual Entry Fields Display**:
    - Field name
    - Empty editable input field
    - No confidence badge (manual entry has no AI confidence)
    - ✓ Accept button (disabled until value entered)
    - ✗ Reject button (mockup for Phase 4)
    - Field appears on BOTH AI Tab and Review Tab until accepted

  - **Accept Action**:
    - Validates input (date format, not in future, non-empty, etc.)
    - Saves to Firestore with metadata:
      - `source: 'human-reviewed'` (if AI-extracted) or `source: 'human'` (if manual)
      - `humanReviewed: true`
      - `autoApproved: true`
      - `acceptedBy: userId`
      - `acceptedAt: timestamp`
      - `wasEdited: true/false` (tracks if user changed AI value)
      - `originalAI` (preserves original AI data if edited)
    - Field disappears from AI Tab
    - Reloads data to update UI state

  - **Reject Action** (Future):
    - Logs rejection to Firestore
    - Clears AI result for that field
    - Sends field back to AI Tab
    - Sets extraction mode back to 'get'

  - **Validation**:
    - Document Date: YYYY-MM-DD format, cannot be in future
    - Document Type: Must be from predefined list
    - Empty values prevent Accept button from enabling
    - Inline error messages display below input field

  - **Field Lifecycle on Review Tab**:
    - AI-extracted with confidence ≥95%: Pre-filled, ready to accept
    - AI-extracted with confidence <95%: Pre-filled, review recommended
    - Set to "Manual": Empty input, user must enter value
    - User can edit any pre-filled value before accepting

### FR-9: Alternative Suggestions Management
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
