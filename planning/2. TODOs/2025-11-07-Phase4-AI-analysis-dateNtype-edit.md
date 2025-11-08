# Phase 4: Human Review & Editing

**Date**: 2025-11-07
**Status**: Planning
**Priority**: High
**Parent Epic**: AI-Powered Metadata Extraction
**Phase**: 4 of 4 (Final)

---

## Phase Overview

Add human review and editing capabilities for AI-generated metadata. This phase enables users to correct AI mistakes, approve review-required suggestions, select alternatives, and manually edit values. All human edits are tracked with audit trails.

**Scope**: Edit UI, alternative selection, human review workflow, audit trail, re-analysis.

---

## User Stories

### Story 1: Edit AI-Generated Values
**As a** user
**I want to** click on an AI result to edit it
**So that** I can correct mistakes or adjust values to match my firm's standards

**Acceptance Criteria**:
- ✅ Clicking on value enters edit mode (inline editing)
- ✅ Document Date shows date picker (respects user's date format)
- ✅ Document Type shows dropdown (predefined system categories only)
- ✅ Save button commits changes to Firestore
- ✅ Cancel button reverts to original value
- ✅ After save, tag marked as `source: 'human'` (overrides AI)
- ✅ Original AI data preserved in `metadata.originalAI` for audit trail

---

### Story 2: Approve Alternative Suggestions
**As a** user
**I want to** click an alternative suggestion to approve it
**So that** I can quickly select the correct value without typing

**Acceptance Criteria**:
- ✅ Alternatives displayed as clickable chips in tooltip
- ✅ Clicking alternative replaces current value
- ✅ Tag updated in Firestore with new value
- ✅ Tag marked as `source: 'human-reviewed'` (human selected AI alternative)
- ✅ Confidence updated to alternative's confidence
- ✅ Original AI reasoning preserved in audit trail

---

### Story 3: Mark as Reviewed
**As a** user
**I want to** mark low-confidence suggestions as reviewed without editing
**So that** I can confirm the AI's choice was correct despite low confidence

**Acceptance Criteria**:
- ✅ Review-required tags (confidence <85%) show "Approve" button
- ✅ Clicking "Approve" marks tag as `humanReviewed: true`
- ✅ Badge changes from yellow "⚠ Review Required" to green "✓ Reviewed"
- ✅ Tag remains searchable/filterable as if auto-approved
- ✅ Original confidence preserved (e.g., "78% ✓ Reviewed")

---

### Story 4: Re-Analyze Document
**As a** user
**I want to** re-run AI analysis on a document
**So that** I can get updated results if the AI improves or I upload a new version

**Acceptance Criteria**:
- ✅ "Re-Analyze" button visible when results exist
- ✅ Clicking shows confirmation dialog: "This will replace existing AI analysis. Continue?"
- ✅ Confirming runs new analysis
- ✅ Previous AI results archived in `metadata.previousAI` array (max 3 entries)
- ✅ New results display after completion
- ✅ Human edits preserved (if `source: 'human'`, don't overwrite)

---

### Story 5: Audit Trail
**As a** firm administrator
**I want to** see who edited AI-generated values and when
**So that** I can track quality control and training needs

**Acceptance Criteria**:
- ✅ All edits logged with timestamp and userId
- ✅ Original AI values preserved in `metadata.originalAI`
- ✅ Edit history shows: original value, new value, editor, timestamp
- ✅ Tooltip shows "Edited by [Name] on [Date]" for human-edited tags
- ✅ Console logs full audit trail for debugging

---

### Story 6: Validation
**As a** user
**I want to** be prevented from entering invalid values
**So that** data quality is maintained

**Acceptance Criteria**:
- ✅ Document Date must be valid date (YYYY-MM-DD format)
- ✅ Document Date cannot be in the future
- ✅ Document Type must be from predefined list (dropdown enforces this)
- ✅ Empty values rejected with error message
- ✅ Save button disabled until valid input provided

---

## Implementation Details

### Update DocumentMetadataPanel.vue

#### Add Edit State
```javascript
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

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
```

#### Add Edit Methods
```javascript
/**
 * Enter edit mode for a field
 */
const startEdit = (fieldName) => {
  console.log('Starting edit for:', fieldName);

  const currentValue = aiResults.value[fieldName]?.tagName || '';

  editMode.value[fieldName] = true;
  editValues.value[fieldName] = currentValue;
  editErrors.value[fieldName] = '';
};

/**
 * Cancel edit and revert
 */
const cancelEdit = (fieldName) => {
  console.log('Cancelling edit for:', fieldName);

  editMode.value[fieldName] = false;
  editValues.value[fieldName] = '';
  editErrors.value[fieldName] = '';
};

/**
 * Validate edit value
 */
const validateEdit = (fieldName, value) => {
  if (!value || value.trim() === '') {
    return 'Value cannot be empty';
  }

  if (fieldName === 'documentDate') {
    // Validate ISO 8601 format
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(value)) {
      return 'Date must be in YYYY-MM-DD format';
    }

    // Validate valid date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Validate not in future
    if (date > new Date()) {
      return 'Date cannot be in the future';
    }
  }

  return null; // Valid
};

/**
 * Save edited value
 */
const saveEdit = async (fieldName) => {
  console.log('Saving edit for:', fieldName);

  const newValue = editValues.value[fieldName];

  // Validate
  const error = validateEdit(fieldName, newValue);
  if (error) {
    editErrors.value[fieldName] = error;
    return;
  }

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const userId = authStore.user.uid;

    const existingTag = aiResults.value[fieldName];
    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';
    const categoryName = fieldName === 'documentDate' ? 'Document Date' : 'Document Type';

    // Prepare updated tag
    const updatedTag = {
      categoryId,
      categoryName,
      tagName: newValue,
      confidence: existingTag?.confidence || 100, // Keep original or 100 for manual
      source: 'human', // Human edit overrides AI
      autoApproved: true, // Human edits auto-approved
      reviewRequired: false,
      humanReviewed: true,
      metadata: {
        ...existingTag?.metadata,
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

    console.log('Updating tag:', updatedTag);

    // Update via service
    await tagSubcollectionService.updateTag(
      props.evidence.id,
      categoryId,
      updatedTag,
      firmId
    );

    console.log('✅ Tag updated successfully');

    // Exit edit mode
    editMode.value[fieldName] = false;
    editValues.value[fieldName] = '';

    // Reload tags
    await loadAITags();

  } catch (error) {
    console.error('❌ Failed to save edit:', error);
    editErrors.value[fieldName] = 'Failed to save. Please try again.';
  }
};

/**
 * Approve an alternative suggestion
 */
const approveAlternative = async (fieldName, alternative) => {
  console.log('Approving alternative for:', fieldName, alternative);

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const userId = authStore.user.uid;

    const existingTag = aiResults.value[fieldName];
    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';
    const categoryName = fieldName === 'documentDate' ? 'Document Date' : 'Document Type';

    const updatedTag = {
      categoryId,
      categoryName,
      tagName: alternative.value,
      confidence: alternative.confidence,
      source: 'human-reviewed', // Human selected AI alternative
      autoApproved: true,
      reviewRequired: false,
      humanReviewed: true,
      metadata: {
        ...existingTag?.metadata,
        originalAI: existingTag?.metadata?.originalAI || {
          value: existingTag?.tagName,
          confidence: existingTag?.confidence,
          reasoning: existingTag?.metadata?.aiReasoning
        },
        selectedAlternative: {
          value: alternative.value,
          confidence: alternative.confidence,
          reasoning: alternative.reasoning,
          selectedBy: userId,
          selectedAt: new Date().toISOString()
        }
      }
    };

    console.log('Approving alternative:', updatedTag);

    await tagSubcollectionService.updateTag(
      props.evidence.id,
      categoryId,
      updatedTag,
      firmId
    );

    console.log('✅ Alternative approved');

    // Reload tags
    await loadAITags();

  } catch (error) {
    console.error('❌ Failed to approve alternative:', error);
    analysisError.value = 'Failed to approve alternative. Please try again.';
  }
};

/**
 * Mark low-confidence tag as reviewed (without editing)
 */
const markAsReviewed = async (fieldName) => {
  console.log('Marking as reviewed:', fieldName);

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const userId = authStore.user.uid;

    const existingTag = aiResults.value[fieldName];
    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';

    const updatedTag = {
      ...existingTag,
      humanReviewed: true,
      reviewRequired: false,
      metadata: {
        ...existingTag.metadata,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        reviewComment: 'Approved without changes'
      }
    };

    console.log('Marking reviewed:', updatedTag);

    await tagSubcollectionService.updateTag(
      props.evidence.id,
      categoryId,
      updatedTag,
      firmId
    );

    console.log('✅ Marked as reviewed');

    // Reload tags
    await loadAITags();

  } catch (error) {
    console.error('❌ Failed to mark as reviewed:', error);
    analysisError.value = 'Failed to mark as reviewed. Please try again.';
  }
};

/**
 * Re-analyze document (archive previous AI results)
 */
const reAnalyzeDocument = async () => {
  console.log('Re-analyzing document...');

  // Confirmation dialog
  const confirmed = confirm(
    'This will replace existing AI analysis with new results. ' +
    'Human-edited values will be preserved. Continue?'
  );

  if (!confirmed) {
    console.log('Re-analysis cancelled');
    return;
  }

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;

    // Archive current AI results
    const previousAI = {
      documentDate: aiResults.value.documentDate?.metadata?.originalAI || {
        value: aiResults.value.documentDate?.tagName,
        confidence: aiResults.value.documentDate?.confidence
      },
      documentType: aiResults.value.documentType?.metadata?.originalAI || {
        value: aiResults.value.documentType?.tagName,
        confidence: aiResults.value.documentType?.confidence
      },
      analyzedAt: new Date().toISOString()
    };

    console.log('Archiving previous AI:', previousAI);

    // Run new analysis (reuse handleAnalyzeClick logic)
    // But preserve human-edited values (source: 'human')

    // TODO: Implement re-analysis with preservation of human edits
    // For now, just run standard analysis
    await handleAnalyzeClick();

  } catch (error) {
    console.error('❌ Re-analysis failed:', error);
    analysisError.value = 'Re-analysis failed. Please try again.';
  }
};
```

#### Update Template (Edit UI)
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
      hide-details="auto"
    />
    <div class="ai-edit-actions">
      <v-btn
        size="small"
        color="success"
        @click="saveEdit('documentDate')"
        :disabled="!!editErrors.documentDate"
      >
        Save
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        @click="cancelEdit('documentDate')"
      >
        Cancel
      </v-btn>
    </div>
  </div>

  <!-- View Mode (with Edit Button) -->
  <div v-else>
    <v-tooltip location="bottom" :disabled="!hasTooltipContent(aiResults.documentDate)">
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
            class="ai-result-badge"
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
        <div
          v-if="aiResults.documentDate.metadata?.aiAlternatives?.length"
          class="ai-tooltip-section"
        >
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

        <!-- Edit History -->
        <div v-if="aiResults.documentDate.metadata?.editHistory?.length" class="ai-tooltip-section">
          <strong>Edit History:</strong>
          <p class="ai-edit-history">
            Edited by {{ getUserName(aiResults.documentDate.metadata.editHistory[0].editedBy) }}
            on {{ formatDateTime(aiResults.documentDate.metadata.editHistory[0].editedAt) }}
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

<!-- Document Type Section (identical edit pattern) -->
```

#### Add Helper Methods
```javascript
/**
 * Get chip color based on tag state
 */
const getChipColor = (tag) => {
  if (!tag) return 'grey';
  if (tag.humanReviewed || tag.source === 'human') return 'success';
  if (tag.autoApproved) return 'success';
  return 'warning';
};

/**
 * Get chip icon based on tag state
 */
const getChipIcon = (tag) => {
  if (!tag) return '';
  if (tag.humanReviewed || tag.source === 'human') return 'mdi-check-circle';
  if (tag.autoApproved) return 'mdi-check-circle';
  return 'mdi-alert';
};

/**
 * Get chip label text
 */
const getChipLabel = (tag) => {
  if (!tag) return '';
  if (tag.source === 'human') return ' Edited';
  if (tag.humanReviewed) return ' Reviewed';
  if (tag.autoApproved) return ' Auto-approved';
  return ' Review Required';
};

/**
 * Get user name from ID (TODO: fetch from user store)
 */
const getUserName = (userId) => {
  // TODO: Implement user lookup
  return userId.substring(0, 8); // Fallback: truncated ID
};

/**
 * Format datetime for display
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString();
};
```

#### Add Edit Styles
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
  transition: background-color 0.2s;
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

/* Re-Analyze Button */
.ai-reanalyze-btn {
  margin-top: 8px;
}

/* Edit History */
.ai-edit-history {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}
```

---

## Firestore Updates

### Add `tagSubcollectionService.updateTag()` Method

**File**: `src/features/organizer/services/tagSubcollectionService.js`

```javascript
/**
 * Update an existing tag
 */
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
- ✅ **F1**: Clicking value enters edit mode
- ✅ **F2**: Edit mode shows appropriate input (date picker or dropdown)
- ✅ **F3**: Save commits changes to Firestore
- ✅ **F4**: Cancel reverts without saving
- ✅ **F5**: Clicking alternative approves and saves it
- ✅ **F6**: "Approve" button marks review-required tags as reviewed
- ✅ **F7**: Re-analyze runs new analysis
- ✅ **F8**: Human edits preserved during re-analysis

### Validation
- ✅ **V1**: Empty values rejected
- ✅ **V2**: Invalid dates rejected (format, future dates)
- ✅ **V3**: Document Type restricted to predefined list
- ✅ **V4**: Save button disabled for invalid input
- ✅ **V5**: Clear error messages shown

### Audit Trail
- ✅ **A1**: Original AI values preserved in `metadata.originalAI`
- ✅ **A2**: Edit history includes: previous value, new value, user, timestamp
- ✅ **A3**: Alternative selections logged with user and timestamp
- ✅ **A4**: Review approvals logged with user and timestamp
- ✅ **A5**: Tooltip shows edit/review info

### UI/UX
- ✅ **U1**: Edit icon appears on hover
- ✅ **U2**: Edit mode visually distinct (background color)
- ✅ **U3**: Alternative chips visually clickable (hover effects)
- ✅ **U4**: Badge colors update after human review (yellow → green)
- ✅ **U5**: Re-analyze button accessible but not prominent
- ✅ **U6**: Confirmation dialog before re-analysis

---

## Testing Plan

### Manual Test Cases

#### TC1: Edit Document Date
**Steps**:
1. Click on Document Date value
2. Change date in picker
3. Click Save

**Expected**:
- Date picker shows current value
- Save updates Firestore
- New value displays
- Badge shows "✓ Edited"
- Tooltip shows "Edited by [Name] on [Date]"
- Console logs audit trail

#### TC2: Edit with Validation Error
**Steps**:
1. Click on Document Date
2. Enter future date
3. Try to save

**Expected**:
- Error message: "Date cannot be in the future"
- Save button disabled
- No Firestore update
- Can cancel to exit

#### TC3: Approve Alternative
**Steps**:
1. Analyze document with alternatives
2. Hover over result
3. Click alternative chip in tooltip

**Expected**:
- Value updates to alternative
- Confidence updates to alternative's confidence
- Badge changes to "✓ Reviewed"
- Firestore: `source: 'human-reviewed'`
- Original AI preserved in audit trail

#### TC4: Mark as Reviewed
**Steps**:
1. Analyze document with low confidence (<85%)
2. Click "Approve" button

**Expected**:
- Badge changes from "⚠ Review Required" to "✓ Reviewed"
- Firestore: `humanReviewed: true`, `reviewRequired: false`
- Tooltip shows "Reviewed by [Name] on [Date]"
- Value unchanged (just marked reviewed)

#### TC5: Re-Analyze
**Steps**:
1. Analyze document
2. Click "Re-Analyze"
3. Confirm dialog
4. Wait for completion

**Expected**:
- Confirmation dialog appears
- New analysis runs
- Previous AI results archived
- New results display
- Console logs previous values

#### TC6: Re-Analyze with Human Edit
**Setup**: Document with manually edited date
**Steps**: Click "Re-Analyze", confirm

**Expected**:
- Document Type re-analyzed (was AI)
- Document Date preserved (was human edit)
- Only AI-sourced values replaced

#### TC7: Cancel Edit
**Steps**:
1. Click value to edit
2. Change value
3. Click Cancel

**Expected**:
- Original value restored
- No Firestore update
- Exit edit mode
- No audit trail entry

#### TC8: Edit History Tooltip
**Setup**: Document with multiple edits
**Steps**: Hover over edited value

**Expected**:
- Tooltip shows latest edit info
- "Edited by [Name] on [Date]"
- Original AI context still visible
- Full edit history in console (if logging enabled)

---

## Files Modified

### Modified Files
1. **`src/components/document/DocumentMetadataPanel.vue`**
   - Add edit state: `editMode`, `editValues`, `editErrors`
   - Add methods: `startEdit()`, `cancelEdit()`, `validateEdit()`, `saveEdit()`
   - Add methods: `approveAlternative()`, `markAsReviewed()`, `reAnalyzeDocument()`
   - Add helpers: `getChipColor()`, `getChipIcon()`, `getChipLabel()`, `getUserName()`, `formatDateTime()`
   - Update template with edit UI, approve button, re-analyze button
   - Add edit styles

2. **`src/features/organizer/services/tagSubcollectionService.js`**
   - Add `updateTag()` method (atomic transaction)

---

## Dependencies

### Internal Services
- `tagSubcollectionService.updateTag()` - Update tag atomically (NEW)
- `tagSubcollectionService.getTags()` - Reload after edits
- All Phase 3 services (analysis, storage, loading)

### User Store (Future Enhancement)
- `getUserById()` - Get user name from ID (for audit trail display)

---

## Notes

### Human Edit Priority
When a tag has `source: 'human'`, it should be preserved during re-analysis. Only tags with `source: 'ai'` should be replaced.

### Audit Trail Structure
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

### Badge State Logic
```
source === 'human' → Green "✓ Edited"
humanReviewed === true → Green "✓ Reviewed"
autoApproved === true → Green "✓ Auto-approved"
reviewRequired === true → Yellow "⚠ Review Required"
```

---

## Future Enhancements (Beyond Phase 4)

- [ ] Bulk approve all review-required tags
- [ ] Advanced review workflow with comments
- [ ] Export audit trail to CSV
- [ ] Firm-level custom document types (beyond system categories)
- [ ] Multi-user collaboration (notify when someone edits)
- [ ] Rollback to previous version
- [ ] Compare AI vs human accuracy over time (analytics)

---

## Completion Checklist

- [ ] Edit mode UI implemented (date picker, dropdown)
- [ ] Validation working (empty, invalid, future dates)
- [ ] Save/Cancel buttons functional
- [ ] Alternative selection working
- [ ] "Approve" button working for review-required tags
- [ ] Re-analyze functionality working
- [ ] Human edits preserved during re-analysis
- [ ] Audit trail complete (originalAI, editHistory, etc.)
- [ ] Badge colors update correctly
- [ ] Tooltip shows edit/review info
- [ ] `updateTag()` service method created
- [ ] All manual tests pass (TC1-TC8)
- [ ] Console logging clear and helpful
- [ ] No errors or warnings
- [ ] Feature complete and ready for production
