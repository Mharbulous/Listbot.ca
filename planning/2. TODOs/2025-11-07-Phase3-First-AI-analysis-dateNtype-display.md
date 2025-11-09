# Phase 3: AI Results Display & Firestore Storage

**Date**: 2025-11-07
**Phase**: 3 of 4
**Status**: Planning
**Priority**: High

**Context**: See `2025-11-07-First-AI-analysis-dateNtype.md` for architecture, Firestore structure, and common requirements.

---

## Phase 3 Overview

Connect real AI results to the UI and store them in Firestore. This phase transitions from mock data display (Phases 1-2) to showing actual Gemini analysis results with persistent storage.

**Scope**: Display real AI results, Firestore storage, confidence-based styling, persistent results.

**What Phase 2 Gave Us**: Real Gemini API calls with console logging.

**What Phase 3 Adds**: Real results displayed in UI, Firestore persistence, confidence-based badges, loading existing results.

**What's Next**: Phase 4 will add human review and editing capabilities.

---

## Phase 3 Key Changes

### Remove from Phase 1-2
- Delete `MOCK_RESULTS` constant - no longer needed
- Remove mock UI display logic from `handleAnalyzeClick()`

### Add to Phase 3
- `loadAITags()` method - Query Firestore for existing results
- `watch` for AI tab opening - Trigger loading
- Firestore storage after successful analysis
- Real results displayed with confidence-based colors
- Error states with retry button

---

## Phase 3 User Stories

### Story 1: Display Real AI Results
**As a** user
**I want to** see the actual AI-extracted date and type
**So that** I can verify the accuracy

**Acceptance Criteria**:
- After analysis completes, **real** AI values display (not mock)
- Document Date displays in user's preferred format (from props.dateFormat)
- Document Type displays exactly as returned by AI
- Confidence badge shows actual percentage from API
- Badge color based on confidence: green (≥85%), yellow (<85%)
- Tooltip shows real context and alternatives

---

### Story 2: Store Results in Firestore
**As a** user
**I want to** my analysis results to persist across browser sessions
**So that** I don't have to re-analyze documents

**Acceptance Criteria**:
- Results stored in Firestore after analysis completes
- Uses hybrid storage pattern (subcollection + embedded map)
- Stored via `tagSubcollectionService.addTagsBatch()` (atomic batch write)
- Includes metadata: confidence, reasoning, context, alternatives, model, timestamp
- Both fields stored in single batch operation
- Tag counters updated atomically

---

### Story 3: Load Existing Results
**As a** user
**I want to** see my previous analysis results when I open the AI tab
**So that** I don't wait for re-analysis every time

**Acceptance Criteria**:
- Opening AI tab queries Firestore for existing tags
- If tags exist, they display immediately (no "Analyze Document" button)
- Loading state shows while querying Firestore
- If no tags exist, "Analyze Document" button displays

---

### Story 4: Error Handling with Retry
**As a** user
**I want to** see clear error messages when analysis fails
**So that** I know what went wrong and can retry

**Acceptance Criteria**:
- File size errors show: "File too large for AI analysis (max 20MB)"
- Network errors show: "Analysis failed. Please check your connection and try again."
- API errors show: "AI service unavailable. Please try again later."
- All error states include a "Retry" button
- Clicking retry re-runs analysis
- No mock results shown on error (Phase 2 testing mode removed)

---

## Implementation Details

For Firestore data structure details, see the main context file section "Firestore Data Structure".

### Add Firestore Loading

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

// Watch for AI tab opening
watch(() => props.activeTab, async (newTab) => {
  if (newTab === 'document') {
    await loadAITags();
  }
});

const loadAITags = async () => {
  loadingAITags.value = true;
  analysisError.value = null;

  try {
    const authStore = useAuthStore();
    const firmId = authStore?.currentFirm;

    // Phase 1.5 Learning: Defensive checks before Firestore operations
    if (!firmId) {
      throw new Error('No firm ID available. Please ensure you are logged in.');
    }

    if (!props.evidence?.id) {
      throw new Error('Document ID not available.');
    }

    console.log('📂 Loading AI tags from Firestore...');

    const tags = await tagSubcollectionService.getTags(
      props.evidence.id, // Document hash (BLAKE3)
      { categoryIds: ['DocumentDate', 'DocumentType'] },
      firmId
    );

    console.log('✅ Tags loaded:', tags?.length || 0, 'tags');

    // Phase 1.5 Learning: Defensive array access with optional chaining
    // Firestore may return null/undefined or malformed data
    aiResults.value = {
      documentDate: tags?.find(t => t?.categoryId === 'DocumentDate') || null,
      documentType: tags?.find(t => t?.categoryId === 'DocumentType') || null
    };

  } catch (error) {
    console.error('❌ Failed to load AI tags:', error);
    // Phase 1.5 Learning: Use defensive error property access
    analysisError.value = error?.message || 'Failed to load previous analysis results.';
  } finally {
    loadingAITags.value = false;
  }
};
```

---

### Update Analysis Handler

```javascript
const handleAnalyzeClick = async () => {
  console.log('🤖 Analyze Document clicked');

  isAnalyzing.value = true;
  analysisError.value = null;

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const matterId = 'general'; // TODO: Make dynamic

    // Validate file size
    const maxSizeMB = parseInt(import.meta.env.VITE_AI_MAX_FILE_SIZE_MB || '20');
    if (props.evidence.fileSize > maxSizeMB * 1024 * 1024) {
      throw new Error(`File too large for AI analysis (max ${maxSizeMB}MB)`);
    }

    // Get file content
    const base64Data = await FileProcessingService.getFileForProcessing(
      props.evidence,
      firmId,
      matterId
    );

    // Extract extension
    const extension = props.evidence.displayName?.split('.').pop()?.toLowerCase() || 'pdf';

    // Call AI service
    const result = await aiMetadataExtractionService.analyzeDocument(
      base64Data,
      props.evidence,
      extension
    );

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
          model: 'gemini-2.5-flash-lite',
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
          model: 'gemini-2.5-flash-lite',
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

    console.log('💾 Storing tags in Firestore...', tagsToStore?.length || 0, 'tags');

    // Phase 1.5 Learning: Defensive checks before storage
    if (!props.evidence?.id) {
      throw new Error('Document ID is missing');
    }

    if (!Array.isArray(tagsToStore) || tagsToStore.length === 0) {
      console.warn('⚠️ No tags to store');
      return;
    }

    if (!firmId) {
      throw new Error('Firm ID is missing');
    }

    // Store via service (atomic batch write)
    await tagSubcollectionService.addTagsBatch(
      props.evidence.id,
      tagsToStore,
      firmId
    );

    console.log('✅ Tags stored successfully');

    // Reload tags to display
    await loadAITags();

    console.log('✅ Analysis complete and displayed');

  } catch (error) {
    console.error('❌ Analysis failed:', error);

    // Phase 1.5 Learning: Defensive error property access
    // Firebase errors may not have consistent structure
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'unknown';

    // User-friendly error messages with defensive checks
    let userMessage = 'Analysis failed. Please try again.';

    if (errorMessage.includes('too large')) {
      userMessage = errorMessage;
    } else if (errorMessage.includes('network') || errorCode === 'unavailable') {
      userMessage = 'Analysis failed. Please check your connection and try again.';
    } else if (errorCode === 'resource-exhausted') {
      userMessage = 'AI service unavailable. Please try again later.';
    } else if (errorMessage.includes('firebasevertexai.googleapis.com')) {
      userMessage = 'Firebase AI API not enabled. Please check Firebase Console.';
    }

    analysisError.value = userMessage;

  } finally {
    isAnalyzing.value = false;
  }
};

const retryAnalysis = () => {
  analysisError.value = null;
  handleAnalyzeClick();
};

const formatDate = (dateString) => {
  // Phase 1.5 Learning: Defensive type checking and validation
  if (!dateString || typeof dateString !== 'string') {
    console.warn('⚠️ Invalid date string:', dateString);
    return 'Unknown';
  }

  try {
    // Return as-is for ISO format preference
    if (props.dateFormat === 'ISO') {
      return dateString;
    }

    // Parse and format
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Could not parse date:', dateString);
      return dateString; // Return original if unparseable
    }

    return date.toLocaleDateString();

  } catch (error) {
    console.error('❌ Date formatting error:', error);
    return dateString; // Fallback to original string
  }
};
```

---

### Update Template

```vue
<div v-if="activeTab === 'document'">
  <!-- Loading State -->
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
    <div class="metadata-section">
      <h3 class="metadata-section-title">Document Date</h3>

      <!-- Button if not analyzed -->
      <v-btn
        v-if="!aiResults.documentDate && !isAnalyzing"
        color="primary"
        variant="outlined"
        prepend-icon="mdi-robot"
        @click="handleAnalyzeClick"
      >
        Analyze Document
      </v-btn>

      <!-- Spinner during analysis -->
      <div v-else-if="isAnalyzing" class="analyzing-state">
        <v-progress-circular indeterminate size="20" />
        <span>Analyzing...</span>
      </div>

      <!-- Real Results -->
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
            <div v-if="aiResults.documentDate.metadata?.aiAlternatives?.length" class="ai-tooltip-section">
              <strong>Alternatives:</strong>
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

    <!-- Document Type (same pattern) -->
  </div>
</div>
```

---

## Success Criteria

### Functional
- **F1**: Opening AI tab loads existing tags from Firestore
- **F2**: If tags exist, they display immediately (no button)
- **F3**: If no tags exist, "Analyze Document" button displays
- **F4**: Clicking button analyzes and stores results
- **F5**: Real AI values display (not mock)
- **F6**: Results persist across browser sessions

### Storage
- **S1**: Results stored in Firestore subcollection
- **S2**: Results embedded in evidence document (hybrid pattern)
- **S3**: Both writes happen atomically (batch operation)
- **S4**: Tag counters updated correctly

### UI/UX
- **U1**: Confidence badge color-coded correctly
- **U2**: Badge text distinguishes auto-approved vs review-required
- **U3**: Date formatted according to user preference
- **U4**: Tooltip only shows when content exists
- **U5**: Loading state shows while querying Firestore
- **U6**: Error messages are user-friendly
- **U7**: Retry button works after errors

---

## Testing Plan

### Manual Test Cases

#### TC1: First Analysis (No Existing Tags)
**Steps**: Open AI tab for never-analyzed document, click "Analyze", refresh browser, reopen AI tab
**Expected**: Button displays → Analysis runs → Real results display → After refresh, same results load immediately

#### TC2: Load Existing Tags
**Setup**: Document already analyzed
**Steps**: Open AI tab
**Expected**: Loading state briefly → Real results display immediately → No "Analyze Document" button

#### TC3: High Confidence Auto-Approval
**File**: Clear invoice
**Expected**: Green badge "✓ Auto-approved", confidence ≥85%, Firestore `autoApproved: true`

#### TC4: Low Confidence Review Required
**File**: Blurry document
**Expected**: Yellow badge "⚠ Review Required", confidence <85%, Firestore `reviewRequired: true`

For additional common test cases, see the main context file section "Common Test Cases".

---

## Notes

### Phase 2 vs Phase 3

**Phase 2**:
- AI analysis functional
- Results logged to console
- Mock UI results displayed

**Phase 3**:
- Mock data removed ✅
- Real AI results displayed in UI ✅
- Results stored in Firestore ✅
- Results persist across sessions ✅
- Error handling fully functional ✅

### Hybrid Storage Benefits
1. **Performance**: Embedded map enables fast table filtering/sorting
2. **Detail**: Subcollection preserves full metadata
3. **Atomic**: Batch write ensures consistency
4. **Counters**: Tag counts updated automatically

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
- [ ] All manual tests pass (TC1-TC4)
- [ ] Results persist across browser sessions
- [ ] Ready for Phase 4 (human review/editing)
