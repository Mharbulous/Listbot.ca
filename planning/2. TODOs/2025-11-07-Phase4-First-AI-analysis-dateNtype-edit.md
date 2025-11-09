# Phase 4: Human Review & Editing

**Date**: 2025-11-07
**Phase**: 4 of 4 (Final)
**Status**: Planning
**Priority**: High

**Context**: See `2025-11-07-First-AI-analysis-dateNtype.md` for architecture and common requirements.

---

## Phase 4 Overview

Add human review and editing capabilities for AI-generated metadata. This phase enables users to correct AI mistakes, approve review-required suggestions, select alternatives, and manually edit values with full audit trails.

**Scope**: Edit UI, alternative selection, human review workflow, audit trail, re-analysis.

**What Phase 3 Gave Us**: Real AI results displayed with Firestore persistence.

**What Phase 4 Adds**: Inline editing, alternative selection, approve button, re-analysis, audit trail, validation.

---

## Phase 4 User Stories

### Story 1: Edit AI-Generated Values
**As a** user
**I want to** click on an AI result to edit it
**So that** I can correct mistakes

**Acceptance Criteria**:
- Clicking on value enters edit mode (inline editing)
- Document Date shows date picker (respects user's date format)
- Document Type shows dropdown (predefined system categories only)
- Save button commits changes to Firestore
- Cancel button reverts to original value
- After save, tag marked as `source: 'human'`
- Original AI data preserved in `metadata.originalAI`

---

### Story 2: Approve Alternative Suggestions
**As a** user
**I want to** click an alternative suggestion to approve it
**So that** I can quickly select the correct value without typing

**Acceptance Criteria**:
- Alternatives displayed as clickable chips in tooltip
- Clicking alternative replaces current value
- Tag updated in Firestore
- Tag marked as `source: 'human-reviewed'`
- Confidence updated to alternative's confidence
- Original AI reasoning preserved

---

### Story 3: Mark as Reviewed
**As a** user
**I want to** mark low-confidence suggestions as reviewed without editing
**So that** I can confirm the AI's choice was correct

**Acceptance Criteria**:
- Review-required tags (confidence <85%) show "Approve" button
- Clicking "Approve" marks tag as `humanReviewed: true`
- Badge changes from yellow "⚠ Review Required" to green "✓ Reviewed"
- Original confidence preserved (e.g., "78% ✓ Reviewed")

---

### Story 4: Re-Analyze Document
**As a** user
**I want to** re-run AI analysis on a document
**So that** I can get updated results

**Acceptance Criteria**:
- "Re-Analyze" button visible when results exist
- Clicking shows confirmation dialog
- Previous AI results archived in `metadata.previousAI` array (max 3 entries)
- New results display after completion
- Human edits preserved (if `source: 'human'`, don't overwrite)

---

### Story 5: Validation
**As a** user
**I want to** be prevented from entering invalid values
**So that** data quality is maintained

**Acceptance Criteria**:
- Document Date must be valid date (YYYY-MM-DD format)
- Document Date cannot be in the future
- Document Type must be from predefined list
- Empty values rejected with error message
- Save button disabled until valid input provided

---

## Implementation Details

### Add Edit State

```javascript
// Edit state
const editMode = ref({
  documentDate: false,
  documentType: false
});

const editValues = ref({
  documentDate: '',
  documentType: ''
});

const editErrors = ref({
  documentDate: '',
  documentType: ''
});

// Phase 1.5 Learning: Add loading state for better UX
const savingEdit = ref(false);
```

---

### Add Edit Methods

```javascript
const startEdit = (fieldName) => {
  const currentValue = aiResults.value[fieldName]?.tagName || '';
  editMode.value[fieldName] = true;
  editValues.value[fieldName] = currentValue;
  editErrors.value[fieldName] = '';
};

const cancelEdit = (fieldName) => {
  editMode.value[fieldName] = false;
  editValues.value[fieldName] = '';
  editErrors.value[fieldName] = '';
};

const validateEdit = (fieldName, value) => {
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

const savingEdit = ref(false);

const saveEdit = async (fieldName) => {
  const newValue = editValues.value?.[fieldName];

  // Validate
  const error = validateEdit(fieldName, newValue);
  if (error) {
    editErrors.value[fieldName] = error;
    return;
  }

  savingEdit.value = true;

  try {
    const authStore = useAuthStore();
    const firmId = authStore?.currentFirm;
    const userId = authStore?.user?.uid;
    const existingTag = aiResults.value?.[fieldName];

    // Phase 1.5 Learning: Defensive checks before Firestore operations
    if (!firmId) {
      throw new Error('Firm ID not available. Please ensure you are logged in.');
    }

    if (!userId) {
      throw new Error('User ID not available. Please log in again.');
    }

    if (!props.evidence?.id) {
      throw new Error('Document ID not available.');
    }

    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';
    const categoryName = fieldName === 'documentDate' ? 'Document Date' : 'Document Type';

    const updatedTag = {
      categoryId,
      categoryName,
      tagName: newValue,
      confidence: existingTag?.confidence ?? 100,
      source: 'human', // Human edit overrides AI
      autoApproved: true,
      reviewRequired: false,
      humanReviewed: true,
      metadata: {
        ...(existingTag?.metadata || {}),
        originalAI: existingTag?.metadata?.originalAI || {
          value: existingTag?.tagName,
          confidence: existingTag?.confidence,
          reasoning: existingTag?.metadata?.aiReasoning,
          context: existingTag?.metadata?.context
        },
        editHistory: [
          ...(existingTag?.metadata?.editHistory || []),
          {
            previousValue: existingTag?.tagName,
            newValue,
            editedBy: userId,
            editedAt: new Date().toISOString(),
            reason: 'Human edit'
          }
        ]
      }
    };

    await tagSubcollectionService.updateTag(
      props.evidence.id,
      categoryId,
      updatedTag,
      firmId
    );

    console.log('✅ Edit saved successfully');

    // Exit edit mode
    editMode.value[fieldName] = false;
    editValues.value[fieldName] = '';
    editErrors.value[fieldName] = '';

    // Reload to display updated value
    await loadAITags();

  } catch (error) {
    console.error('❌ Failed to save edit:', error);

    // Phase 1.5 Learning: Defensive error property access
    const errorMessage = error?.message || 'Failed to save. Please try again.';
    editErrors.value[fieldName] = errorMessage;

  } finally {
    savingEdit.value = false;
  }
};

const approveAlternative = async (fieldName, alternative) => {
  // Similar to saveEdit but with source: 'human-reviewed'
  // Includes metadata.selectedAlternative tracking
};

const markAsReviewed = async (fieldName) => {
  // Updates humanReviewed: true, reviewRequired: false
  // Adds metadata.reviewedBy and reviewedAt
};
```

---

### Update Template with Edit UI

```vue
<!-- State 3: Analyzed (with Edit Capability) -->
<div v-else class="ai-result">
  <!-- Edit Mode -->
  <div v-if="editMode.documentDate" class="ai-edit-mode">
    <v-text-field
      v-model="editValues.documentDate"
      type="date"
      label="Document Date"
      :error-messages="editErrors.documentDate"
      variant="outlined"
      density="compact"
    />
    <div class="ai-edit-actions">
      <v-btn
        size="small"
        color="success"
        @click="saveEdit('documentDate')"
        :disabled="!!editErrors.documentDate"
        :loading="savingEdit"
      >
        Save
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        @click="cancelEdit('documentDate')"
        :disabled="savingEdit"
      >
        Cancel
      </v-btn>
    </div>
  </div>

  <!-- View Mode (with Edit Button) -->
  <div v-else>
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props: tooltipProps }">
        <div v-bind="tooltipProps" class="ai-result-content">
          <span class="ai-result-value" @click="startEdit('documentDate')">
            {{ formatDate(aiResults.documentDate.tagName) }}
            <v-icon size="small" class="ai-edit-icon">mdi-pencil</v-icon>
          </span>

          <v-chip
            :color="getChipColor(aiResults.documentDate)"
            :prepend-icon="getChipIcon(aiResults.documentDate)"
            size="small"
            variant="flat"
          >
            {{ aiResults.documentDate.confidence }}%
            {{ getChipLabel(aiResults.documentDate) }}
          </v-chip>

          <!-- Approve Button (for review-required tags) -->
          <v-btn
            v-if="aiResults.documentDate.reviewRequired && !aiResults.documentDate.humanReviewed"
            size="small"
            color="success"
            variant="outlined"
            @click.stop="markAsReviewed('documentDate')"
          >
            Approve
          </v-btn>
        </div>
      </template>

      <div class="ai-tooltip-content">
        <!-- Context -->
        <div v-if="aiResults.documentDate.metadata?.context" class="ai-tooltip-section">
          <strong>Context:</strong>
          <p>{{ aiResults.documentDate.metadata.context }}</p>
        </div>

        <!-- Alternatives (clickable) -->
        <div v-if="aiResults.documentDate.metadata?.aiAlternatives?.length" class="ai-tooltip-section">
          <strong>Alternative Suggestions:</strong>
          <div class="ai-alternatives-chips">
            <v-chip
              v-for="alt in aiResults.documentDate.metadata.aiAlternatives"
              :key="alt.value"
              size="small"
              variant="outlined"
              color="primary"
              @click="approveAlternative('documentDate', alt)"
              class="ai-alternative-chip"
            >
              {{ formatDate(alt.value) }} ({{ alt.confidence }}%)
            </v-chip>
          </div>
          <p class="ai-alternatives-note">Click to approve alternative</p>
        </div>

        <!-- Edit History (Phase 1.5: Defensive access with optional chaining) -->
        <div v-if="aiResults.documentDate?.metadata?.editHistory?.length > 0" class="ai-tooltip-section">
          <strong>Edit History:</strong>
          <p class="ai-edit-history">
            Edited by {{ getUserName(aiResults.documentDate.metadata.editHistory[0]?.editedBy) }}
            on {{ formatDateTime(aiResults.documentDate.metadata.editHistory[0]?.editedAt) }}
          </p>

          <!-- Show count if multiple edits -->
          <p v-if="aiResults.documentDate.metadata.editHistory.length > 1" class="text-caption">
            ({{ aiResults.documentDate.metadata.editHistory.length }} edits total)
          </p>
        </div>
      </div>
    </v-tooltip>
  </div>

  <!-- Re-Analyze Button -->
  <v-btn
    size="small"
    variant="text"
    prepend-icon="mdi-refresh"
    @click="reAnalyzeDocument"
    class="ai-reanalyze-btn"
  >
    Re-Analyze
  </v-btn>
</div>
```

---

### Add Helper Methods

```javascript
const getChipColor = (tag) => {
  if (!tag) return 'grey';
  if (tag.humanReviewed || tag.source === 'human') return 'success';
  if (tag.autoApproved) return 'success';
  return 'warning';
};

const getChipIcon = (tag) => {
  if (!tag) return '';
  if (tag.humanReviewed || tag.source === 'human') return 'mdi-check-circle';
  if (tag.autoApproved) return 'mdi-check-circle';
  return 'mdi-alert';
};

const getChipLabel = (tag) => {
  if (!tag) return '';
  if (tag.source === 'human') return ' Edited';
  if (tag.humanReviewed) return ' Reviewed';
  if (tag.autoApproved) return ' Auto-approved';
  return ' Review Required';
};

const getUserName = (userId) => {
  // TODO: Implement user lookup
  return userId.substring(0, 8); // Fallback: truncated ID
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString();
};
```

---

### Add Edit Styles

```css
/* Edit Mode */
.ai-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.ai-edit-actions {
  display: flex;
  gap: 8px;
}

/* Edit Icon */
.ai-edit-icon {
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 4px;
}

.ai-result-value:hover .ai-edit-icon {
  opacity: 0.6;
}

.ai-result-value {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.ai-result-value:hover {
  background-color: #f0f0f0;
}

/* Alternative Chips (clickable) */
.ai-alternative-chip {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-alternative-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ai-alternatives-note {
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
  margin-top: 4px;
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

### Functional
- **F1**: Clicking value enters edit mode
- **F2**: Edit mode shows appropriate input (date picker or dropdown)
- **F3**: Save commits changes to Firestore
- **F4**: Cancel reverts without saving
- **F5**: Clicking alternative approves and saves it
- **F6**: "Approve" button marks review-required tags as reviewed
- **F7**: Re-analyze runs new analysis
- **F8**: Human edits preserved during re-analysis

### Validation
- **V1**: Empty values rejected
- **V2**: Invalid dates rejected (format, future dates)
- **V3**: Document Type restricted to predefined list
- **V4**: Save button disabled for invalid input

### Audit Trail
- **A1**: Original AI values preserved in `metadata.originalAI`
- **A2**: Edit history includes: previous value, new value, user, timestamp
- **A3**: Alternative selections logged with user and timestamp
- **A4**: Review approvals logged with user and timestamp

### UI/UX
- **U1**: Edit icon appears on hover
- **U2**: Edit mode visually distinct (background color)
- **U3**: Alternative chips visually clickable (hover effects)
- **U4**: Badge colors update after human review (yellow → green)
- **U5**: Confirmation dialog before re-analysis

---

## Testing Plan

### Manual Test Cases

#### TC1: Edit Document Date
**Steps**: Click on Document Date value, change date, click Save
**Expected**: Date picker shows → Save updates Firestore → New value displays → Badge shows "✓ Edited" → Tooltip shows "Edited by [Name]"

#### TC2: Edit with Validation Error
**Steps**: Click on Document Date, enter future date, try to save
**Expected**: Error message "Date cannot be in the future" → Save button disabled → No Firestore update

#### TC3: Approve Alternative
**Steps**: Analyze document with alternatives, hover over result, click alternative chip
**Expected**: Value updates to alternative → Confidence updates → Badge changes to "✓ Reviewed" → Original AI preserved

#### TC4: Mark as Reviewed
**Steps**: Analyze document with low confidence (<85%), click "Approve" button
**Expected**: Badge changes from "⚠ Review Required" to "✓ Reviewed" → Firestore `humanReviewed: true` → Value unchanged

#### TC5: Re-Analyze
**Steps**: Analyze document, click "Re-Analyze", confirm dialog
**Expected**: Confirmation dialog → New analysis runs → Previous AI results archived → New results display

For additional common test cases, see the main context file.

---

## Audit Trail Structure

```javascript
{
  metadata: {
    originalAI: {
      value: '2024-03-15',
      confidence: 92,
      reasoning: 'Found in header'
    },
    editHistory: [
      {
        previousValue: '2024-03-15',
        newValue: '2024-03-14',
        editedBy: 'userId123',
        editedAt: '2025-11-07T14:30:00Z',
        reason: 'Human edit'
      }
    ],
    selectedAlternative: {
      value: '2024-03-14',
      confidence: 78,
      reasoning: 'Scan date in footer',
      selectedBy: 'userId123',
      selectedAt: '2025-11-07T14:35:00Z'
    },
    reviewedBy: 'userId123',
    reviewedAt: '2025-11-07T14:40:00Z'
  }
}
```

---

## Badge State Logic

```
source === 'human' → Green "✓ Edited"
humanReviewed === true → Green "✓ Reviewed"
autoApproved === true → Green "✓ Auto-approved"
reviewRequired === true → Yellow "⚠ Review Required"
```

---

## Notes

### Human Edit Priority
When a tag has `source: 'human'`, it should be preserved during re-analysis. Only tags with `source: 'ai'` should be replaced.

---

## Completion Checklist

- [ ] Edit mode UI implemented (date picker, dropdown)
- [ ] Validation working (empty, invalid, future dates)
- [ ] Save/Cancel buttons functional
- [ ] Alternative selection working
- [ ] "Approve" button working for review-required tags
- [ ] Re-analyze functionality working
- [ ] Human edits preserved during re-analysis
- [ ] Audit trail complete
- [ ] Badge colors update correctly
- [ ] Tooltip shows edit/review info
- [ ] `updateTag()` service method created
- [ ] All manual tests pass (TC1-TC5)
- [ ] Feature complete and ready for production
