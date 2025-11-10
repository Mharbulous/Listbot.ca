# Phase 4: Human Review & Editing

**Date**: 2025-11-07
**Phase**: 4 of 4 (Final)
**Status**: Planning
**Priority**: High

**Context**: See `2025-11-07-First-AI-analysis-dateNtype.md` for architecture and common requirements.

---

## Phase 4 Overview

Implement a two-tab workflow that separates **extraction configuration** (AI Tab) from **results review** (Review Tab). This phase creates a clean separation between "what to extract" and "what was extracted", with full human review and editing capabilities.

**Scope**: Two-tab workflow, Get/Skip/Manual configuration, review UI with Accept/Reject, manual entry, confidence badges, validation.

**What Phase 3 Gave Us**: Real AI results displayed with Firestore persistence on the AI tab.

**What Phase 4 Adds**:
- AI Tab becomes configuration panel (Get/Skip/Manual for pending fields)
- Review Tab becomes results panel (extracted values + manual entry)
- Fields dynamically move between tabs based on extraction state
- Accept/Reject workflow with human approval tracking
- Editable fields for both AI-extracted and manual entry
- Future: Reject button sends field back to AI tab with rejection logged to Firestore

---

## Phase 4 User Stories

### Story 1: Configure Extraction on AI Tab
**As a** user
**I want to** configure which fields to extract before running AI analysis
**So that** I can control what data the AI attempts to get

**Acceptance Criteria**:
- AI Tab displays fields that have **not yet been determined**
- Each field shows a sliding radio button: **Get | Skip | Manual**
- **Get** = "Get Now" - include this field in AI extraction prompt
- **Skip** = Don't ask AI about this field
- **Manual** = User will enter manually (field appears on Review tab with empty input)
- Field can be set to Manual but remains on AI Tab (user can change back to Get/Skip)
- Once a field is determined (AI-extracted or manually accepted), it disappears from AI Tab

---

### Story 2: Review AI-Extracted Values
**As a** user
**I want to** review and approve AI-extracted values
**So that** I can verify accuracy before accepting

**Acceptance Criteria**:
- Review Tab shows fields that have been **AI-extracted**
- Display format:
  - Field name
  - **Editable input field** pre-filled with AI value
  - **Confidence badge** (e.g., "85%") with tooltip showing reasoning
  - ✓ **Accept** button (enabled)
  - ✗ **Reject** button (mockup for now)
- Accept button saves value and removes field from AI Tab
- Reject button (future) sends field back to AI Tab and logs rejection to Firestore
- User can edit AI value before clicking Accept

---

### Story 3: Manual Entry Workflow
**As a** user
**I want to** manually enter values for fields set to "Manual"
**So that** I can provide data that AI cannot extract

**Acceptance Criteria**:
- When field is set to "Manual" on AI Tab, it **also** appears on Review Tab
- Display format on Review Tab:
  - Field name
  - **Empty editable input field**
  - No confidence badge
  - ✓ **Accept** button (disabled until value entered)
  - ✗ **Reject** button (mockup for now)
- Field appears on **both tabs** until value is accepted
- Once accepted, field disappears from AI Tab
- Reject button (future) removes Manual mode, sends back to AI Tab

---

### Story 4: Empty State on Review Tab
**As a** user
**I want to** see a clear message when there's nothing to review
**So that** I understand the current state

**Acceptance Criteria**:
- If **no fields extracted** AND **no fields set to Manual**
- Display message: _"Use AI to extract data for human review"_ (in italics)
- Once AI extracts a field or user sets a field to Manual, message disappears

---

### Story 5: Validation
**As a** user
**I want to** be prevented from entering invalid values
**So that** data quality is maintained

**Acceptance Criteria**:
- Document Date must be valid date (YYYY-MM-DD format)
- Document Date cannot be in the future
- Document Type must be from predefined list
- Empty values prevent Accept button from enabling
- Save button disabled until valid input provided
- Validation errors display inline below input field

---

## Implementation Details

### Add Two-Tab State Management

```javascript
// Field extraction configuration (AI Tab)
const extractionMode = ref({
  documentDate: 'get',  // 'get' | 'skip' | 'manual'
  documentType: 'get'
});

// Review/Edit state (Review Tab)
const reviewValues = ref({
  documentDate: '',
  documentType: ''
});

const reviewErrors = ref({
  documentDate: '',
  documentType: ''
});

// Loading states
const savingReview = ref(false);
const analyzingDocument = ref(false);

// AI results (from Phase 3)
const aiResults = ref({
  documentDate: null,  // null = not determined, { tagName, confidence, ... } = determined
  documentType: null
});
```

---

### Add AI Tab Methods (Get/Skip/Manual Configuration)

```javascript
// Update extraction mode (Get/Skip/Manual)
const setExtractionMode = (fieldName, mode) => {
  extractionMode.value[fieldName] = mode;

  // If switching to Manual, prepare Review Tab entry
  if (mode === 'manual') {
    reviewValues.value[fieldName] = '';
  }

  // If switching away from Manual, clear Review Tab entry
  if (mode !== 'manual' && !aiResults.value[fieldName]) {
    reviewValues.value[fieldName] = '';
  }
};

// Determine if field should show on AI Tab
const shouldShowOnAITab = (fieldName) => {
  // Show if field has NOT been determined (no AI result and not manually accepted)
  return !aiResults.value[fieldName];
};

// Determine if field should show on Review Tab
const shouldShowOnReviewTab = (fieldName) => {
  // Show if AI-extracted OR set to Manual
  return aiResults.value[fieldName] || extractionMode.value[fieldName] === 'manual';
};
```

---

### Add Review Tab Methods (Accept/Reject)

```javascript
// Validate review input
const validateReviewValue = (fieldName, value) => {
  if (!value || value.trim() === '') {
    return 'Value cannot be empty';
  }

  if (fieldName === 'documentDate') {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(value)) {
      return 'Date must be in YYYY-MM-DD format';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    if (date > new Date()) {
      return 'Date cannot be in the future';
    }
  }

  return null; // Valid
};

// Accept button clicked (AI-extracted or Manual)
const acceptReviewValue = async (fieldName) => {
  const value = reviewValues.value[fieldName];

  // Validate
  const error = validateReviewValue(fieldName, value);
  if (error) {
    reviewErrors.value[fieldName] = error;
    return;
  }

  savingReview.value = true;

  try {
    const authStore = useAuthStore();
    const firmId = authStore?.currentFirm;
    const userId = authStore?.user?.uid;
    const existingAITag = aiResults.value[fieldName];

    // Defensive checks
    if (!firmId) throw new Error('Firm ID not available. Please ensure you are logged in.');
    if (!userId) throw new Error('User ID not available. Please log in again.');
    if (!props.evidence?.id) throw new Error('Document ID not available.');

    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';
    const categoryName = fieldName === 'documentDate' ? 'Document Date' : 'Document Type';

    const acceptedTag = {
      categoryId,
      categoryName,
      tagName: value,
      confidence: existingAITag?.confidence ?? 100, // Keep AI confidence if exists
      source: existingAITag ? 'human-reviewed' : 'human', // human-reviewed if AI-extracted, human if manual
      autoApproved: true,
      reviewRequired: false,
      humanReviewed: true,
      metadata: {
        ...(existingAITag?.metadata || {}),
        // Preserve original AI data if it exists
        originalAI: existingAITag ? {
          value: existingAITag.tagName,
          confidence: existingAITag.confidence,
          reasoning: existingAITag.metadata?.aiReasoning,
          context: existingAITag.metadata?.context
        } : undefined,
        // Track acceptance
        acceptedBy: userId,
        acceptedAt: new Date().toISOString(),
        wasEdited: existingAITag ? (value !== existingAITag.tagName) : false
      }
    };

    await tagSubcollectionService.updateTag(
      props.evidence.id,
      categoryId,
      acceptedTag,
      firmId
    );

    console.log('✅ Review accepted and saved');

    // Clear review state
    reviewValues.value[fieldName] = '';
    reviewErrors.value[fieldName] = '';

    // Reload to update state (field will disappear from AI Tab)
    await loadAITags();

  } catch (error) {
    console.error('❌ Failed to accept review:', error);
    reviewErrors.value[fieldName] = error?.message || 'Failed to save. Please try again.';
  } finally {
    savingReview.value = false;
  }
};

// Reject button clicked (MOCKUP - future implementation)
const rejectReviewValue = async (fieldName) => {
  // TODO: Future implementation
  // 1. Log rejection to Firestore
  // 2. Clear aiResults[fieldName] (send back to AI Tab)
  // 3. Set extractionMode[fieldName] back to 'get'
  console.log('🚧 Reject button clicked (mockup):', fieldName);
};

// Check if Accept button should be enabled
const isAcceptEnabled = (fieldName) => {
  const value = reviewValues.value[fieldName];
  return value && value.trim() !== '' && !reviewErrors.value[fieldName];
};
```

---

### Update Template with Two-Tab UI

**AI Tab Template:**

```vue
<!-- AI Tab: Configuration Panel for Pending Fields -->
<v-tab-item value="ai">
  <div class="ai-config-panel">
    <!-- Document Date - Show only if not determined -->
    <div v-if="shouldShowOnAITab('documentDate')" class="ai-field-config">
      <div class="field-label">Document Date</div>

      <!-- Sliding Radio Button: Get | Skip | Manual -->
      <v-radio-group
        v-model="extractionMode.documentDate"
        inline
        density="compact"
        @update:model-value="setExtractionMode('documentDate', $event)"
      >
        <v-radio label="Get" value="get" />
        <v-radio label="Skip" value="skip" />
        <v-radio label="Manual" value="manual" />
      </v-radio-group>
    </div>

    <!-- Document Type - Show only if not determined -->
    <div v-if="shouldShowOnAITab('documentType')" class="ai-field-config">
      <div class="field-label">Document Type</div>

      <v-radio-group
        v-model="extractionMode.documentType"
        inline
        density="compact"
        @update:model-value="setExtractionMode('documentType', $event)"
      >
        <v-radio label="Get" value="get" />
        <v-radio label="Skip" value="skip" />
        <v-radio label="Manual" value="manual" />
      </v-radio-group>
    </div>

    <!-- Analyze Documents Button -->
    <v-btn
      color="primary"
      prepend-icon="mdi-brain"
      :loading="analyzingDocument"
      @click="analyzeDocument"
      class="mt-4"
    >
      Analyze Documents
    </v-btn>
  </div>
</v-tab-item>
```

**Review Tab Template:**

```vue
<!-- Review Tab: Results + Manual Entry -->
<v-tab-item value="review">
  <div class="review-panel">
    <!-- Empty State -->
    <div
      v-if="!shouldShowOnReviewTab('documentDate') && !shouldShowOnReviewTab('documentType')"
      class="review-empty-state"
    >
      <em>Use AI to extract data for human review</em>
    </div>

    <!-- Document Date Review -->
    <div v-if="shouldShowOnReviewTab('documentDate')" class="review-field">
      <div class="field-label">Document Date</div>

      <!-- Editable Input (pre-filled if AI-extracted, empty if Manual) -->
      <v-text-field
        v-model="reviewValues.documentDate"
        type="date"
        variant="outlined"
        density="compact"
        :error-messages="reviewErrors.documentDate"
        @input="reviewErrors.documentDate = ''"
      />

      <!-- Confidence Badge (only if AI-extracted) -->
      <v-tooltip v-if="aiResults.documentDate" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-chip
            v-bind="tooltipProps"
            :color="getConfidenceColor(aiResults.documentDate.confidence)"
            size="small"
            variant="flat"
            class="confidence-badge"
          >
            {{ aiResults.documentDate.confidence }}%
          </v-chip>
        </template>

        <div class="ai-tooltip-content">
          <!-- AI Reasoning -->
          <div v-if="aiResults.documentDate.metadata?.aiReasoning">
            <strong>AI Reasoning:</strong>
            <p>{{ aiResults.documentDate.metadata.aiReasoning }}</p>
          </div>

          <!-- Context -->
          <div v-if="aiResults.documentDate.metadata?.context">
            <strong>Context:</strong>
            <p>{{ aiResults.documentDate.metadata.context }}</p>
          </div>
        </div>
      </v-tooltip>

      <!-- Accept/Reject Buttons -->
      <div class="review-actions">
        <v-btn
          color="success"
          prepend-icon="mdi-check"
          size="small"
          :disabled="!isAcceptEnabled('documentDate')"
          :loading="savingReview"
          @click="acceptReviewValue('documentDate')"
        >
          Accept
        </v-btn>

        <v-btn
          color="error"
          prepend-icon="mdi-close"
          size="small"
          variant="outlined"
          @click="rejectReviewValue('documentDate')"
        >
          Reject
        </v-btn>
      </div>
    </div>

    <!-- Document Type Review (similar structure) -->
    <div v-if="shouldShowOnReviewTab('documentType')" class="review-field">
      <div class="field-label">Document Type</div>

      <!-- Dropdown for Document Type -->
      <v-select
        v-model="reviewValues.documentType"
        :items="documentTypeOptions"
        variant="outlined"
        density="compact"
        :error-messages="reviewErrors.documentType"
        @update:model-value="reviewErrors.documentType = ''"
      />

      <!-- Confidence Badge (only if AI-extracted) -->
      <v-chip
        v-if="aiResults.documentType"
        :color="getConfidenceColor(aiResults.documentType.confidence)"
        size="small"
        variant="flat"
        class="confidence-badge"
      >
        {{ aiResults.documentType.confidence }}%
      </v-chip>

      <!-- Accept/Reject Buttons -->
      <div class="review-actions">
        <v-btn
          color="success"
          prepend-icon="mdi-check"
          size="small"
          :disabled="!isAcceptEnabled('documentType')"
          :loading="savingReview"
          @click="acceptReviewValue('documentType')"
        >
          Accept
        </v-btn>

        <v-btn
          color="error"
          prepend-icon="mdi-close"
          size="small"
          variant="outlined"
          @click="rejectReviewValue('documentType')"
        >
          Reject
        </v-btn>
      </div>
    </div>
  </div>
</v-tab-item>
```

---

### Add Helper Methods

```javascript
// Confidence badge color (for Review Tab)
const getConfidenceColor = (confidence) => {
  if (confidence >= 85) return 'success';  // Green for high confidence
  if (confidence >= 70) return 'warning';  // Yellow for medium confidence
  return 'error';  // Red for low confidence
};

// Initialize review values when AI extraction completes
const initializeReviewValues = () => {
  // Pre-fill AI-extracted values
  if (aiResults.value.documentDate) {
    reviewValues.value.documentDate = aiResults.value.documentDate.tagName;
  }
  if (aiResults.value.documentType) {
    reviewValues.value.documentType = aiResults.value.documentType.tagName;
  }
};

// Watch for AI results and initialize review values
watch(aiResults, () => {
  initializeReviewValues();
}, { deep: true });

// Document Type options (for dropdown)
const documentTypeOptions = [
  'Statement',
  'Invoice',
  'Receipt',
  'Contract',
  'Letter',
  'Email',
  'Report',
  'Other'
];

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
```

---

### Add Two-Tab Styles

```css
/* AI Tab: Configuration Panel */
.ai-config-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-field-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
}

.field-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

/* Review Tab: Results Panel */
.review-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-empty-state {
  padding: 24px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.review-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
}

.confidence-badge {
  align-self: flex-start;
  margin-top: 4px;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Tooltip Content */
.ai-tooltip-content {
  max-width: 300px;
}

.ai-tooltip-content > div {
  margin-bottom: 8px;
}

.ai-tooltip-content strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.ai-tooltip-content p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
}
```

---

## Add tagSubcollectionService.updateTag() Method

**File**: `src/features/organizer/services/tagSubcollectionService.js`

```javascript
async updateTag(documentHash, categoryId, updatedTag, firmId) {
  const docRef = doc(db, 'evidence', documentHash);
  const tagRef = doc(collection(docRef, 'tags'), categoryId);

  await runTransaction(db, async (transaction) => {
    const tagDoc = await transaction.get(tagRef);

    if (!tagDoc.exists()) {
      throw new Error('Tag not found');
    }

    // Update subcollection
    transaction.update(tagRef, {
      ...updatedTag,
      updatedAt: serverTimestamp()
    });

    // Update embedded map
    transaction.update(docRef, {
      [`tags.${categoryId}`]: {
        tagName: updatedTag.tagName,
        confidence: updatedTag.confidence,
        autoApproved: updatedTag.autoApproved,
        humanReviewed: updatedTag.humanReviewed || false,
        source: updatedTag.source
      },
      updatedAt: serverTimestamp()
    });
  });

  console.log('✅ Tag updated atomically');
}
```

---

## Success Criteria

### Functional - AI Tab
- **F1**: AI Tab shows only fields that have NOT been determined
- **F2**: Each field displays Get | Skip | Manual radio buttons
- **F3**: Selecting "Manual" causes field to appear on Review Tab with empty input
- **F4**: Field disappears from AI Tab once value is accepted on Review Tab
- **F5**: "Analyze Documents" button includes only fields marked "Get" in the prompt

### Functional - Review Tab
- **F6**: Review Tab shows fields that are AI-extracted OR set to "Manual"
- **F7**: AI-extracted fields display with pre-filled editable input
- **F8**: Manual fields display with empty editable input
- **F9**: Confidence badge shows only for AI-extracted fields
- **F10**: Accept button is disabled when input is blank or invalid
- **F11**: Accept button saves value to Firestore and removes field from AI Tab
- **F12**: Reject button displays (mockup, no functionality yet)
- **F13**: Empty state message displays when no fields to review

### Functional - Field Lifecycle
- **F14**: Field set to "Manual" appears on BOTH tabs until accepted
- **F15**: Once accepted, field disappears from AI Tab
- **F16**: User can edit AI-extracted value before accepting
- **F17**: Edited AI values preserve original confidence badge

### Validation
- **V1**: Empty values prevent Accept button from enabling
- **V2**: Invalid dates rejected (format, future dates)
- **V3**: Document Type restricted to predefined dropdown list
- **V4**: Validation errors display inline below input field

### Audit Trail
- **A1**: Original AI values preserved in `metadata.originalAI`
- **A2**: Acceptance logged with `acceptedBy`, `acceptedAt`, `wasEdited` fields
- **A3**: Source set to 'human-reviewed' if AI-extracted, 'human' if manual
- **A4**: Future: Rejections logged to Firestore

### UI/UX
- **U1**: AI Tab has clean configuration panel look
- **U2**: Review Tab has distinct review panel look
- **U3**: Confidence badges color-coded (green ≥85%, yellow ≥70%, red <70%)
- **U4**: Tooltip shows AI reasoning and context on confidence badge hover
- **U5**: Empty state message in italics when nothing to review

---

## Testing Plan

### Manual Test Cases

#### TC1: AI Tab Configuration (Get/Skip/Manual)
**Steps**:
1. Open AI Tab on a document with no determined fields
2. Verify Document Date and Document Type show with Get|Skip|Manual radios
3. Switch Document Date to "Manual"
4. Switch Document Type to "Skip"

**Expected**:
- Both fields initially show on AI Tab with radios
- Switching to "Manual" causes Document Date to also appear on Review Tab
- Switching to "Skip" keeps field on AI Tab only

#### TC2: AI Extraction Workflow
**Steps**:
1. Set Document Date to "Get" on AI Tab
2. Set Document Type to "Get" on AI Tab
3. Click "Analyze Documents" button
4. Wait for AI extraction to complete

**Expected**:
- Both fields extracted by AI
- Both fields disappear from AI Tab
- Both fields appear on Review Tab with pre-filled values and confidence badges

#### TC3: Review and Accept AI-Extracted Value
**Steps**:
1. After AI extraction, go to Review Tab
2. Verify Document Date shows with value "2016-12-31" and confidence "85%"
3. Click Accept button

**Expected**:
- Value saved to Firestore
- Field remains off AI Tab (already determined)
- `source: 'human-reviewed'`, `humanReviewed: true` in Firestore

#### TC4: Edit AI Value Before Accepting
**Steps**:
1. After AI extraction, go to Review Tab
2. Edit Document Date from "2016-12-31" to "2016-12-30"
3. Click Accept

**Expected**:
- Modified value "2016-12-30" saved to Firestore
- Original AI value preserved in `metadata.originalAI`
- `metadata.wasEdited: true` in Firestore
- Confidence badge still shows original 85%

#### TC5: Manual Entry Workflow
**Steps**:
1. Set Document Type to "Manual" on AI Tab
2. Go to Review Tab
3. Verify Document Type shows with empty input field and no confidence badge
4. Try clicking Accept without entering value

**Expected**:
- Field appears on Review Tab with empty input
- Accept button is disabled
- Field still visible on AI Tab (can switch back to Get/Skip)

#### TC6: Manual Entry - Complete Flow
**Steps**:
1. Set Document Type to "Manual"
2. Go to Review Tab
3. Enter "Statement" in Document Type field
4. Click Accept

**Expected**:
- Accept button enables after typing
- Value saved to Firestore
- Field disappears from AI Tab
- `source: 'human'` in Firestore (not 'human-reviewed')

#### TC7: Validation Errors
**Steps**:
1. After AI extraction, go to Review Tab
2. Edit Document Date to "2030-12-31" (future date)
3. Try to click Accept

**Expected**:
- Validation error displays: "Date cannot be in the future"
- Accept button disabled
- No Firestore update

#### TC8: Empty State
**Steps**:
1. Set all fields to "Skip" on AI Tab
2. Switch to Review Tab

**Expected**:
- Review Tab shows: _"Use AI to extract data for human review"_ (in italics)

#### TC9: Field Appears on Both Tabs
**Steps**:
1. Set Document Date to "Manual" on AI Tab
2. Check Review Tab
3. Return to AI Tab
4. Switch back to "Get"
5. Check Review Tab again

**Expected**:
- Step 2: Field appears on Review Tab with empty input
- Step 2: Field still shows on AI Tab with radios
- Step 5: Field disappears from Review Tab (no longer Manual, not extracted)

For additional common test cases, see the main context file.

---

## Audit Trail Structure

**AI-Extracted, Accepted Without Edit:**
```javascript
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2016-12-31',
  confidence: 85,
  source: 'human-reviewed',  // AI extracted, human accepted
  autoApproved: true,
  reviewRequired: false,
  humanReviewed: true,
  metadata: {
    aiReasoning: 'Found date in document header',
    context: 'Located at top right of first page',
    originalAI: {
      value: '2016-12-31',
      confidence: 85,
      reasoning: 'Found date in document header',
      context: 'Located at top right of first page'
    },
    acceptedBy: 'userId123',
    acceptedAt: '2025-11-10T14:30:00Z',
    wasEdited: false  // User accepted without editing
  }
}
```

**AI-Extracted, Edited Before Accepting:**
```javascript
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2016-12-30',  // User changed from 2016-12-31
  confidence: 85,  // Original AI confidence preserved
  source: 'human-reviewed',
  autoApproved: true,
  reviewRequired: false,
  humanReviewed: true,
  metadata: {
    aiReasoning: 'Found date in document header',
    context: 'Located at top right of first page',
    originalAI: {
      value: '2016-12-31',  // Original AI value
      confidence: 85,
      reasoning: 'Found date in document header',
      context: 'Located at top right of first page'
    },
    acceptedBy: 'userId123',
    acceptedAt: '2025-11-10T14:35:00Z',
    wasEdited: true  // User edited before accepting
  }
}
```

**Manual Entry:**
```javascript
{
  categoryId: 'DocumentType',
  categoryName: 'Document Type',
  tagName: 'Statement',
  confidence: 100,  // Manual = 100% confidence
  source: 'human',  // Manual entry, not AI
  autoApproved: true,
  reviewRequired: false,
  humanReviewed: true,
  metadata: {
    acceptedBy: 'userId123',
    acceptedAt: '2025-11-10T14:40:00Z',
    wasEdited: false  // No original AI value to edit
  }
}
```

**Future: Rejected by Human**
```javascript
{
  // Field sent back to AI Tab
  // Firestore log entry created:
  rejectionHistory: [
    {
      aiValue: '2016-12-31',
      confidence: 85,
      rejectedBy: 'userId123',
      rejectedAt: '2025-11-10T14:45:00Z',
      reason: 'Incorrect date'
    }
  ]
}
```

---

## Source Field Logic

```
source === 'ai' → Initial AI extraction (before human review)
source === 'human-reviewed' → AI extracted, human accepted (with or without edits)
source === 'human' → Manual entry (no AI involved)
```

---

## Confidence Badge Logic (Review Tab Only)

```
confidence >= 85 → Green badge
confidence >= 70 → Yellow badge
confidence < 70 → Red badge
source === 'human' → No badge shown (manual entry, no AI confidence)
```

---

## Notes

### Key Workflow Principles

1. **Two-Tab Separation**: AI Tab = configuration (what to extract), Review Tab = results (what was extracted)
2. **Field Lifecycle**: Fields move from AI Tab → Review Tab → approved/saved
3. **Manual Mode Special Case**: Field appears on BOTH tabs until accepted
4. **Confidence Preservation**: Even if user edits AI value, original confidence badge remains
5. **Source Tracking**: `source: 'ai'` → `source: 'human-reviewed'` → eventually flows to Document tab

### Future Enhancements (Not in This Phase)

1. **Reject Button**: Full implementation to send fields back to AI Tab + log to Firestore
2. **Re-extraction**: Allow users to re-run AI on previously extracted fields
3. **Alternative Suggestions**: Show multiple AI suggestions with clickable chips
4. **Batch Accept**: Accept multiple fields at once
5. **Document Tab Integration**: Accepted values flow through to Document tab

---

## Completion Checklist

### AI Tab Implementation
- [ ] AI Tab displays only undetermined fields
- [ ] Get | Skip | Manual radio buttons implemented
- [ ] `setExtractionMode()` method working
- [ ] `shouldShowOnAITab()` logic correct
- [ ] Switching to Manual causes field to appear on Review Tab
- [ ] Analyze Documents button includes only "Get" fields in prompt

### Review Tab Implementation
- [ ] Review Tab displays AI-extracted and Manual fields
- [ ] `shouldShowOnReviewTab()` logic correct
- [ ] AI-extracted fields show pre-filled editable input
- [ ] Manual fields show empty editable input
- [ ] Confidence badge shows only for AI-extracted fields
- [ ] Confidence badge color-coded (green/yellow/red)
- [ ] Tooltip shows AI reasoning and context
- [ ] Empty state message displays when no fields to review

### Accept/Reject Functionality
- [ ] Accept button validation working
- [ ] Accept button disabled when input blank or invalid
- [ ] `acceptReviewValue()` method saves to Firestore correctly
- [ ] `isAcceptEnabled()` logic correct
- [ ] Reject button displays (mockup, no functionality)
- [ ] After accept, field disappears from AI Tab
- [ ] After accept, field data reloads correctly

### Validation
- [ ] Empty value validation working
- [ ] Date format validation (YYYY-MM-DD)
- [ ] Future date validation
- [ ] Document Type dropdown restricts values
- [ ] Inline error messages display correctly

### Audit Trail
- [ ] `source` set correctly ('human' vs 'human-reviewed')
- [ ] `metadata.originalAI` preserved for AI-extracted values
- [ ] `metadata.acceptedBy` and `acceptedAt` logged
- [ ] `metadata.wasEdited` tracks if user edited AI value
- [ ] `updateTag()` service method created/updated

### Styling
- [ ] AI Tab has clean configuration panel look
- [ ] Review Tab has distinct review panel look
- [ ] Field labels styled consistently
- [ ] Confidence badges positioned correctly
- [ ] Button layout clean and accessible

### Testing
- [ ] All test cases pass (TC1-TC9)
- [ ] Field lifecycle works correctly
- [ ] Manual mode shows on both tabs
- [ ] AI extraction workflow complete
- [ ] Validation prevents bad data
- [ ] Empty state displays correctly

### Documentation
- [ ] Code comments explain two-tab workflow
- [ ] Complex logic has inline documentation
- [ ] Firestore data structure documented
- [ ] Feature ready for Phase 5 (Document Tab integration)
