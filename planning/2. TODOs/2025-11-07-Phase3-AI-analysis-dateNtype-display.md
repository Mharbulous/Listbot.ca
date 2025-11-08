# Phase 3: AI Results Display & Firestore Storage

**Date**: 2025-11-07
**Status**: Planning
**Priority**: High
**Parent Epic**: AI-Powered Metadata Extraction
**Phase**: 3 of 4

---

## Phase Overview

Connect real AI results to the UI and store them in Firestore. This phase transitions from mock data display (Phase 1-2) to showing actual Gemini analysis results. Results are stored using the hybrid storage pattern (subcollection + embedded map) for optimal performance.

**Scope**: Display real AI results, Firestore storage, confidence-based styling, persistent results.

---

## User Stories

### Story 1: Display Real AI Results
**As a** user
**I want to** see the actual AI-extracted date and type
**So that** I can verify the accuracy and understand the AI's reasoning

**Acceptance Criteria**:
- ✅ After analysis completes, **real** AI values display (not mock)
- ✅ Document Date displays in user's preferred format (from props.dateFormat)
- ✅ Document Type displays exactly as returned by AI
- ✅ Confidence badge shows actual percentage from API
- ✅ Badge color based on confidence: green (≥85%), yellow (<85%)
- ✅ Tooltip shows real context and alternatives from API

---

### Story 2: Confidence-Based Auto-Approval
**As a** user
**I want to** see which AI suggestions are auto-approved vs requiring review
**So that** I can prioritize my review time on uncertain classifications

**Acceptance Criteria**:
- ✅ Confidence ≥85% tagged as auto-approved (green badge with ✓)
- ✅ Confidence <85% tagged as review-required (yellow badge with ⚠)
- ✅ Badge displays: "92% ✓ Auto-approved" or "78% ⚠ Review Required"
- ✅ Visual distinction is immediately clear (color + icon + text)

---

### Story 3: Store Results in Firestore
**As a** user
**I want to** my analysis results to persist across browser sessions
**So that** I don't have to re-analyze documents I've already reviewed

**Acceptance Criteria**:
- ✅ Results stored in Firestore after analysis completes
- ✅ Uses hybrid storage pattern (subcollection + embedded map)
- ✅ Stored via `tagSubcollectionService.addTagsBatch()` (atomic batch write)
- ✅ Includes all metadata: confidence, reasoning, context, alternatives, model, timestamp
- ✅ Both Document Date and Document Type stored in single batch operation
- ✅ Tag counters updated atomically

---

### Story 4: Load Existing Results
**As a** user
**I want to** see my previous analysis results when I open the AI tab
**So that** I don't have to wait for re-analysis every time

**Acceptance Criteria**:
- ✅ Opening AI tab queries Firestore for existing tags
- ✅ If tags exist, they display immediately (no "Analyze Document" button)
- ✅ Results include original confidence, approval status, and timestamp
- ✅ Loading state shows while querying Firestore
- ✅ If no tags exist, "Analyze Document" button displays

---

### Story 5: Tooltip with Real Data
**As a** user
**I want to** hover over results to see AI reasoning and alternatives
**So that** I can understand why the AI made this determination

**Acceptance Criteria**:
- ✅ Tooltip displays real context from API response
- ✅ Tooltip displays real alternatives (if confidence <95%)
- ✅ Each alternative shows value, confidence %, and reasoning
- ✅ Tooltip only appears when context or alternatives exist
- ✅ Tooltip formatted for readability (max width, hierarchy)

---

### Story 6: Error Handling
**As a** user
**I want to** see clear error messages when analysis fails
**So that** I know what went wrong and can retry if needed

**Acceptance Criteria**:
- ✅ File size errors show: "File too large for AI analysis (max 20MB)"
- ✅ Network errors show: "Analysis failed. Please check your connection and try again."
- ✅ API errors show: "AI service unavailable. Please try again later."
- ✅ All error states include a "Retry" button
- ✅ Clicking retry re-runs analysis from beginning
- ✅ No mock results shown on error (Phase 2 testing mode removed)

---

## Implementation Details

### Update DocumentMetadataPanel.vue

#### Remove Mock Data (Phase 1-2)
Delete the `MOCK_RESULTS` constant - no longer needed.

#### Add Firestore Loading on Tab Open
```javascript
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { tagSubcollectionService } from '@/features/organizer/services/tagSubcollectionService';
import FileProcessingService from '@/features/organizer/services/FileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';

// Reactive state
const loadingAITags = ref(false);
const isAnalyzing = ref(false);
const analysisError = ref(null);
const aiResults = ref({
  documentDate: null,
  documentType: null
});

// Watch for AI tab opening - load existing tags
watch(() => props.activeTab, async (newTab) => {
  if (newTab === 'document') {
    await loadAITags();
  }
});

/**
 * Load existing AI tags from Firestore
 */
const loadAITags = async () => {
  loadingAITags.value = true;
  analysisError.value = null;

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;

    console.log('📂 Loading AI tags from Firestore...');

    const tags = await tagSubcollectionService.getTags(
      props.evidence.id, // Document hash (BLAKE3)
      { categoryIds: ['DocumentDate', 'DocumentType'] },
      firmId
    );

    console.log('✅ Tags loaded:', tags);

    // Convert array to object keyed by categoryId
    aiResults.value = {
      documentDate: tags.find(t => t.categoryId === 'DocumentDate') || null,
      documentType: tags.find(t => t.categoryId === 'DocumentType') || null
    };

  } catch (error) {
    console.error('❌ Failed to load AI tags:', error);
    analysisError.value = 'Failed to load previous analysis results.';
  } finally {
    loadingAITags.value = false;
  }
};
```

#### Update Analysis Handler (Replace Phase 2 Mock Results)
```javascript
/**
 * Analyze document using Gemini AI and store results
 */
const handleAnalyzeClick = async () => {
  console.log('🤖 Analyze Document clicked');

  isAnalyzing.value = true;
  analysisError.value = null;

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const matterId = 'general'; // TODO: Make dynamic based on route

    // Validate file size
    const maxSizeMB = parseInt(import.meta.env.VITE_AI_MAX_FILE_SIZE_MB || '20');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (props.evidence.fileSize > maxSizeBytes) {
      throw new Error(`File too large for AI analysis (max ${maxSizeMB}MB)`);
    }

    console.log('📂 Getting file content from Firebase Storage...');

    // Get file content
    const base64Data = await FileProcessingService.getFileForProcessing(
      props.evidence,
      firmId,
      matterId
    );

    console.log('✅ File retrieved successfully');

    // Extract file extension
    const extension = props.evidence.displayName?.split('.').pop()?.toLowerCase() || 'pdf';

    // Call AI service
    const result = await aiMetadataExtractionService.analyzeDocument(
      base64Data,
      props.evidence,
      extension
    );

    console.log('🎯 AI analysis complete:', result);

    // Prepare tags for storage
    const tagsToStore = [];
    const confidenceThreshold = 85;

    if (result.documentDate) {
      tagsToStore.push({
        categoryId: 'DocumentDate',
        categoryName: 'Document Date',
        tagName: result.documentDate.value,
        confidence: result.documentDate.confidence,
        source: 'ai',
        autoApproved: result.documentDate.confidence >= confidenceThreshold,
        reviewRequired: result.documentDate.confidence < confidenceThreshold,
        metadata: {
          model: 'gemini-1.5-flash',
          processingTime: result.processingTime,
          aiReasoning: result.documentDate.reasoning,
          context: result.documentDate.context,
          aiAlternatives: result.documentDate.alternatives || [],
          reviewReason: result.documentDate.confidence < confidenceThreshold
            ? 'Confidence below threshold'
            : null
        }
      });
    }

    if (result.documentType) {
      tagsToStore.push({
        categoryId: 'DocumentType',
        categoryName: 'Document Type',
        tagName: result.documentType.value,
        confidence: result.documentType.confidence,
        source: 'ai',
        autoApproved: result.documentType.confidence >= confidenceThreshold,
        reviewRequired: result.documentType.confidence < confidenceThreshold,
        metadata: {
          model: 'gemini-1.5-flash',
          processingTime: result.processingTime,
          aiReasoning: result.documentType.reasoning,
          context: result.documentType.context,
          aiAlternatives: result.documentType.alternatives || [],
          reviewReason: result.documentType.confidence < confidenceThreshold
            ? 'Confidence below threshold'
            : null
        }
      });
    }

    console.log('💾 Storing tags in Firestore...', tagsToStore);

    // Store via service (atomic batch write to subcollection + embedded map)
    await tagSubcollectionService.addTagsBatch(
      props.evidence.id, // Document hash
      tagsToStore,
      firmId
    );

    console.log('✅ Tags stored successfully');

    // Reload tags to display
    await loadAITags();

    console.log('✅ Analysis complete and displayed');

  } catch (error) {
    console.error('❌ Analysis failed:', error);

    // User-friendly error messages
    let errorMessage = 'Analysis failed. Please try again.';

    if (error.message?.includes('too large')) {
      errorMessage = error.message;
    } else if (error.message?.includes('network') || error.code === 'unavailable') {
      errorMessage = 'Analysis failed. Please check your connection and try again.';
    } else if (error.code === 'resource-exhausted') {
      errorMessage = 'AI service unavailable. Please try again later.';
    }

    analysisError.value = errorMessage;

  } finally {
    isAnalyzing.value = false;
  }
};

/**
 * Retry analysis after error
 */
const retryAnalysis = () => {
  analysisError.value = null;
  handleAnalyzeClick();
};

/**
 * Format date according to user preference
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);

    // Use props.dateFormat if available, otherwise use locale default
    if (props.dateFormat === 'ISO') {
      return dateString; // Already ISO 8601
    }

    return date.toLocaleDateString(); // Browser locale
  } catch (error) {
    console.error('Failed to format date:', dateString, error);
    return dateString; // Fallback to raw string
  }
};
```

#### Update Template (Real Results)
```vue
<div v-if="activeTab === 'document'">
  <!-- Loading State (initial load) -->
  <div v-if="loadingAITags" class="ai-loading">
    <v-progress-circular indeterminate size="24" />
    <span>Loading analysis results...</span>
  </div>

  <!-- Error State -->
  <div v-else-if="analysisError" class="ai-error">
    <v-icon icon="mdi-alert-circle" color="error" size="48" />
    <h4>Analysis Error</h4>
    <p>{{ analysisError }}</p>
    <v-btn color="primary" @click="retryAnalysis">
      <v-icon icon="mdi-refresh" start />
      Retry Analysis
    </v-btn>
  </div>

  <!-- Content -->
  <div v-else>
    <!-- Document Date Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Document Date</h3>

      <!-- State 1: Not Analyzed (Button) -->
      <v-btn
        v-if="!aiResults.documentDate && !isAnalyzing"
        color="primary"
        variant="outlined"
        prepend-icon="mdi-robot"
        @click="handleAnalyzeClick"
        class="analyze-button"
      >
        Analyze Document
      </v-btn>

      <!-- State 2: Analyzing (Spinner) -->
      <div v-else-if="isAnalyzing" class="analyzing-state">
        <v-progress-circular indeterminate size="20" />
        <span class="analyzing-text">Analyzing...</span>
      </div>

      <!-- State 3: Analyzed (Real Results) -->
      <div v-else class="ai-result">
        <v-tooltip location="bottom" :disabled="!hasTooltipContent(aiResults.documentDate)">
          <template v-slot:activator="{ props: tooltipProps }">
            <div v-bind="tooltipProps" class="ai-result-content">
              <span class="ai-result-value">
                {{ formatDate(aiResults.documentDate.tagName) }}
              </span>
              <v-chip
                :color="aiResults.documentDate.autoApproved ? 'success' : 'warning'"
                :prepend-icon="aiResults.documentDate.autoApproved ? 'mdi-check-circle' : 'mdi-alert'"
                size="small"
                variant="flat"
                class="ai-result-badge"
              >
                {{ aiResults.documentDate.confidence }}%
                {{ aiResults.documentDate.autoApproved ? ' Auto-approved' : ' Review Required' }}
              </v-chip>
            </div>
          </template>

          <div class="ai-tooltip-content">
            <div v-if="aiResults.documentDate.metadata?.context" class="ai-tooltip-section">
              <strong>Context:</strong>
              <p>{{ aiResults.documentDate.metadata.context }}</p>
            </div>
            <div
              v-if="aiResults.documentDate.metadata?.aiAlternatives?.length"
              class="ai-tooltip-section"
            >
              <strong>Alternative Suggestions:</strong>
              <ul>
                <li v-for="alt in aiResults.documentDate.metadata.aiAlternatives" :key="alt.value">
                  {{ formatDate(alt.value) }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
                </li>
              </ul>
            </div>
          </div>
        </v-tooltip>
      </div>
    </div>

    <!-- Document Type Section (identical pattern) -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Document Type</h3>

      <v-btn
        v-if="!aiResults.documentType && !isAnalyzing"
        color="primary"
        variant="outlined"
        prepend-icon="mdi-robot"
        @click="handleAnalyzeClick"
        class="analyze-button"
      >
        Analyze Document
      </v-btn>

      <div v-else-if="isAnalyzing" class="analyzing-state">
        <v-progress-circular indeterminate size="20" />
        <span class="analyzing-text">Analyzing...</span>
      </div>

      <div v-else class="ai-result">
        <v-tooltip location="bottom" :disabled="!hasTooltipContent(aiResults.documentType)">
          <template v-slot:activator="{ props: tooltipProps }">
            <div v-bind="tooltipProps" class="ai-result-content">
              <span class="ai-result-value">
                {{ aiResults.documentType.tagName }}
              </span>
              <v-chip
                :color="aiResults.documentType.autoApproved ? 'success' : 'warning'"
                :prepend-icon="aiResults.documentType.autoApproved ? 'mdi-check-circle' : 'mdi-alert'"
                size="small"
                variant="flat"
                class="ai-result-badge"
              >
                {{ aiResults.documentType.confidence }}%
                {{ aiResults.documentType.autoApproved ? ' Auto-approved' : ' Review Required' }}
              </v-chip>
            </div>
          </template>

          <div class="ai-tooltip-content">
            <div v-if="aiResults.documentType.metadata?.context" class="ai-tooltip-section">
              <strong>Context:</strong>
              <p>{{ aiResults.documentType.metadata.context }}</p>
            </div>
            <div
              v-if="aiResults.documentType.metadata?.aiAlternatives?.length"
              class="ai-tooltip-section"
            >
              <strong>Alternative Suggestions:</strong>
              <ul>
                <li v-for="alt in aiResults.documentType.metadata.aiAlternatives" :key="alt.value">
                  {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
                </li>
              </ul>
            </div>
          </div>
        </v-tooltip>
      </div>
    </div>
  </div>
</div>
```

#### Add Tooltip Helper
```javascript
/**
 * Check if tooltip should be shown
 * (Only show if there's context or alternatives)
 */
const hasTooltipContent = (result) => {
  if (!result) return false;
  return !!(
    result.metadata?.context ||
    result.metadata?.aiAlternatives?.length
  );
};
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
    context: 'Found "Invoice Date: March 15, 2024" in document header',
    aiAlternatives: [
      {
        value: '2024-03-14',
        confidence: 78,
        reasoning: 'Possible scan date in footer'
      }
    ],
    reviewReason: null
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: 'userId',
  firmId: 'firmId'
}
```

### Embedded Map (Evidence Document)
```
/evidence/{documentHash}
{
  tags: {
    'DocumentDate': {
      tagName: '2024-03-15',
      confidence: 92,
      autoApproved: true
    },
    'DocumentType': {
      tagName: 'Invoice',
      confidence: 98,
      autoApproved: true
    }
  },
  tagCounts: {
    total: 2,
    ai: 2,
    human: 0
  }
}
```

---

## Success Criteria

### Functional
- ✅ **F1**: Opening AI tab loads existing tags from Firestore
- ✅ **F2**: If tags exist, they display immediately (no button)
- ✅ **F3**: If no tags exist, "Analyze Document" button displays
- ✅ **F4**: Clicking button analyzes and stores results
- ✅ **F5**: Real AI values display (not mock)
- ✅ **F6**: Results persist across browser sessions
- ✅ **F7**: Tooltip shows real context and alternatives

### Storage
- ✅ **S1**: Results stored in Firestore subcollection
- ✅ **S2**: Results embedded in evidence document (hybrid pattern)
- ✅ **S3**: Both writes happen atomically (batch operation)
- ✅ **S4**: Tag counters updated correctly
- ✅ **S5**: All metadata fields populated (confidence, context, alternatives, etc.)

### UI/UX
- ✅ **U1**: Confidence badge color-coded (green ≥85%, yellow <85%)
- ✅ **U2**: Badge text distinguishes auto-approved vs review-required
- ✅ **U3**: Date formatted according to user preference
- ✅ **U4**: Tooltip only shows when content exists
- ✅ **U5**: Loading state shows while querying Firestore
- ✅ **U6**: Error messages are user-friendly (not technical)
- ✅ **U7**: Retry button works after errors
- ✅ **U8**: No layout shift during state transitions

### Error Handling
- ✅ **E1**: File size errors show clear message
- ✅ **E2**: Network errors show clear message + retry
- ✅ **E3**: API errors show clear message + retry
- ✅ **E4**: Firestore errors logged (but don't crash app)
- ✅ **E5**: No mock results on error (Phase 2 mode removed)

---

## Testing Plan

### Manual Test Cases

#### TC1: First Analysis (No Existing Tags)
**Steps**:
1. Open AI tab for document never analyzed
2. Click "Analyze Document"
3. Wait for completion
4. Refresh browser
5. Reopen AI tab

**Expected**:
- Step 1: Button displays (no loading)
- Step 2: Spinner shows for ~2-5 seconds
- Step 3: Real date and type display with confidence badges
- Step 4-5: Same results display immediately (no re-analysis)

#### TC2: Load Existing Tags
**Setup**: Document already analyzed in previous session
**Steps**: Open AI tab

**Expected**:
- Loading state shows briefly (<500ms)
- Real results display immediately
- No "Analyze Document" button
- Tooltip shows context and alternatives

#### TC3: High Confidence Auto-Approval
**File**: Clear invoice with obvious date/type
**Steps**: Analyze document

**Expected**:
- Both fields show green badge
- Badge text: "92% ✓ Auto-approved" (or similar ≥85%)
- Check mark icon visible
- Firestore: `autoApproved: true`, `reviewRequired: false`

#### TC4: Low Confidence Review Required
**File**: Blurry or ambiguous document
**Steps**: Analyze document

**Expected**:
- Badge shows yellow color
- Badge text: "78% ⚠ Review Required" (or similar <85%)
- Warning icon visible
- Firestore: `autoApproved: false`, `reviewRequired: true`
- Tooltip shows alternatives (if confidence <95%)

#### TC5: Tooltip Content
**Steps**:
1. Analyze document (any file)
2. Hover over Document Date result
3. Hover over Document Type result

**Expected**:
- Tooltip displays if context or alternatives exist
- Context shown in italics with clear label
- Alternatives listed with confidence % and reasoning
- Tooltip max width prevents text overflow

#### TC6: Error with Retry
**Setup**: Disconnect network
**Steps**:
1. Click "Analyze Document"
2. Wait for error
3. Reconnect network
4. Click "Retry"

**Expected**:
- Step 2: Error message displays "Please check your connection"
- Step 2: Retry button visible
- Step 4: Analysis runs successfully
- Results display normally

#### TC7: File Too Large
**File**: 25MB PDF
**Steps**: Click "Analyze Document"

**Expected**:
- Error: "File too large for AI analysis (max 20MB)"
- Retry button visible
- No Gemini API call made
- No Firestore write attempted

#### TC8: Firestore Persistence
**Steps**:
1. Analyze document
2. Close browser completely
3. Reopen browser
4. Navigate to same document
5. Open AI tab

**Expected**:
- Results display immediately from Firestore
- Same values, confidence, timestamps
- No re-analysis needed

---

## Files Modified

### Modified Files
1. **`src/components/document/DocumentMetadataPanel.vue`**
   - Remove `MOCK_RESULTS` constant
   - Add `loadAITags()` method
   - Add `watch` for tab changes
   - Update `handleAnalyzeClick()` to store in Firestore
   - Add `retryAnalysis()` method
   - Add `hasTooltipContent()` helper
   - Update template to show real results
   - Add error state UI
   - Add imports: `tagSubcollectionService`

---

## Dependencies

### Internal Services
- `tagSubcollectionService.getTags()` - Load existing tags
- `tagSubcollectionService.addTagsBatch()` - Store new tags atomically
- `FileProcessingService.getFileForProcessing()` - Get file content
- `aiMetadataExtractionService.analyzeDocument()` - AI analysis (Phase 2)

### Firestore Collections
- `/evidence/{hash}/tags` - Tag subcollection
- `/evidence/{hash}` - Embedded tag map and counters

---

## Notes

### Hybrid Storage Benefits
1. **Performance**: Embedded map enables fast table filtering/sorting
2. **Detail**: Subcollection preserves full metadata (reasoning, alternatives, timestamps)
3. **Atomic**: Batch write ensures consistency between both locations
4. **Counters**: Tag counts updated automatically

### Phase 3 vs Phase 2
**Phase 2**:
- AI analysis functional
- Results logged to console
- Mock UI results displayed

**Phase 3**:
- Mock data removed
- Real AI results displayed in UI
- Results stored in Firestore
- Results persist across sessions
- Error handling fully functional

### Date Formatting
The `formatDate()` helper should respect user preferences. If `props.dateFormat` is available, use it. Otherwise, fall back to browser locale default.

---

## Next Steps (Phase 4)

Phase 4 will add:
1. Human review workflow (approve/reject AI suggestions)
2. Edit AI-generated values
3. Select alternative suggestions with one click
4. Mark tags as "human-reviewed" after editing
5. Audit trail for human edits
6. Re-analyze functionality (future enhancement)

---

## Completion Checklist

- [ ] `MOCK_RESULTS` constant removed
- [ ] `loadAITags()` implemented and working
- [ ] `watch` triggers on AI tab open
- [ ] `handleAnalyzeClick()` stores in Firestore
- [ ] Real results display in UI (not mock)
- [ ] Confidence badges color-coded correctly
- [ ] Tooltip shows real context and alternatives
- [ ] Error states with retry button functional
- [ ] All manual tests pass (TC1-TC8)
- [ ] Results persist across browser sessions (TC8)
- [ ] High confidence shows auto-approved (TC3)
- [ ] Low confidence shows review required (TC4)
- [ ] No console errors or warnings
- [ ] Ready for Phase 4 (human review/editing)
