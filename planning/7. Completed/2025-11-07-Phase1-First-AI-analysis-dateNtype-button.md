# Phase 1: Analyze Button UI Frontend

**Date**: 2025-11-07
**Phase**: 1 of 4
**Status**: Planning
**Priority**: High

**Context**: See `2025-11-07-First-AI-analysis-dateNtype.md` for overall architecture and user stories.

---

## Phase 1 Overview

Implement the "Analyze Document" button in the AI tab of the DocumentMetadataPanel. This phase focuses **exclusively on the UI frontend** with mock data - no AI integration yet.

**Scope**: UI components, state management, visual design, and simulated analysis flow.

**What's Next**: Phase 2 will replace the mock 3-second timer with real Gemini API calls.

---

## Phase 1 User Stories

### Story 1: Display Analyze Button
**As a** user
**I want to** see an "Analyze Document" button in the AI tab when no analysis has been performed
**So that** I know AI analysis is available for this document

**Acceptance Criteria**:
- When AI tab is opened, button displays where value will eventually appear
- Button labeled "🤖 Analyze Document"
- Button occupies the same space where analyzed values will display (prevents layout shift)
- Button appears for both Document Date and Document Type sections
- Clicking button logs to console: "Analyze clicked for [field name]"

---

### Story 2: Show Loading State
**As a** user
**I want to** see a spinner when analysis is in progress
**So that** I know the system is working

**Acceptance Criteria**:
- Clicking button triggers `isAnalyzing` state to true
- Spinner replaces button in the **same location** (no layout shift)
- Spinner includes text: "Analyzing..."
- Spinner auto-resets after 3 seconds (simulated analysis)
- Console logs: "Analysis started" and "Analysis completed"

---

### Story 3: Display Mock Results
**As a** user
**I want to** see how results will look after analysis
**So that** I can verify the UI design is clear and useful

**Acceptance Criteria**:
- After spinner completes, display mock value + confidence badge
- Mock Document Date: "2024-03-15" with "92%" badge
- Mock Document Type: "Invoice" with "98%" badge
- Values replace spinner in the **same location** (no layout shift)
- Green badge indicates high confidence (≥95%)

---

### Story 4: Tooltip on Hover (Mock)
**As a** user
**I want to** hover over the result to see additional context
**So that** I can understand why the AI made this determination

**Acceptance Criteria**:
- Hovering over value or badge shows Vuetify tooltip
- Tooltip displays mock context: "Found 'Invoice Date: March 15, 2024' in document header"
- Tooltip displays mock alternative: "2024-03-14 (78%) - Possible scan date in footer"
- Tooltip styled for readability (max width, padding)

---

## UI Design

### State Transitions

**Key Principle**: Button → Spinner → Result all occupy the **same screen location**

```
┌─ Document Date ─────────────────────────┐
│ Date: [🤖 Analyze Document]            │  ← State 1: Button
└─────────────────────────────────────────┘
         ↓ (click)
┌─ Document Date ─────────────────────────┐
│ Date: ⟳ Analyzing...                   │  ← State 2: Spinner (3 sec)
└─────────────────────────────────────────┘
         ↓ (complete)
┌─ Document Date ─────────────────────────┐
│ Date: 2024-03-15  [92%]                │  ← State 3: Mock Result
└─────────────────────────────────────────┘
         │ (hover)
         ↓
    ┌─────────────────────────────────────┐
    │ Context: Found 'Invoice Date:       │
    │ March 15, 2024' in document header  │
    │                                     │
    │ Alternatives:                       │
    │ • 2024-03-14 (78%)                 │
    │   Possible scan date in footer      │
    └─────────────────────────────────────┘
```

---

## Implementation Details

### File to Modify
**`src/components/document/tabs/AIAnalysisTab.vue`**

### Current State (Lines 244-278)
```vue
<div v-if="activeTab === 'document'">
  <div class="metadata-section">
    <h3 class="metadata-section-title">System Fields</h3>
    <div class="metadata-item">
      <span class="metadata-label">Document Date:</span>
      <span class="metadata-value metadata-placeholder">Not yet analyzed</span>
    </div>
    <!-- Similar for Document Type -->
  </div>
</div>
```

### New Template
```vue
<div v-if="activeTab === 'document'">
  <div class="metadata-section">
    <h3 class="metadata-section-title">Document Date</h3>

    <!-- State 1: Button -->
    <v-btn
      v-if="!aiResults.documentDate && !isAnalyzing"
      color="primary"
      variant="outlined"
      prepend-icon="mdi-robot"
      @click="handleAnalyzeClick('documentDate')"
      class="analyze-button"
    >
      Analyze Document
    </v-btn>

    <!-- State 2: Spinner -->
    <div v-else-if="isAnalyzing" class="analyzing-state">
      <v-progress-circular indeterminate size="20" />
      <span class="analyzing-text">Analyzing...</span>
    </div>

    <!-- State 3: Mock Result -->
    <div v-else class="ai-result">
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <div v-bind="props" class="ai-result-content">
            <span class="ai-result-value">{{ aiResults.documentDate.value }}</span>
            <v-chip
              :color="aiResults.documentDate.confidence >= 95 ? 'success' : 'warning'"
              size="small"
              variant="flat"
              class="ai-result-badge"
            >
              {{ aiResults.documentDate.confidence }}%
            </v-chip>
          </div>
        </template>

        <!-- Tooltip Content -->
        <div class="ai-tooltip-content">
          <div class="ai-tooltip-section">
            <strong>Context:</strong>
            <p>{{ aiResults.documentDate.context }}</p>
          </div>
          <div v-if="aiResults.documentDate.alternatives.length" class="ai-tooltip-section">
            <strong>Alternatives:</strong>
            <ul>
              <li v-for="alt in aiResults.documentDate.alternatives" :key="alt.value">
                {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
              </li>
            </ul>
          </div>
        </div>
      </v-tooltip>
    </div>
  </div>

  <!-- Document Type Section (identical pattern) -->
  <div class="metadata-section">
    <!-- ... same structure for Document Type ... -->
  </div>
</div>
```

### New Script (Composition API)
```javascript
import { ref } from 'vue';

// Reactive state
const isAnalyzing = ref(false);
const aiResults = ref({
  documentDate: null,
  documentType: null
});

// Mock data (WILL BE REPLACED IN PHASE 2)
const MOCK_RESULTS = {
  documentDate: {
    value: '2024-03-15',
    confidence: 92,
    context: "Found 'Invoice Date: March 15, 2024' in document header",
    alternatives: [
      {
        value: '2024-03-14',
        confidence: 78,
        reasoning: 'Possible scan date in footer'
      }
    ]
  },
  documentType: {
    value: 'Invoice',
    confidence: 98,
    context: "Document contains 'INVOICE' header, itemized charges, and total due",
    alternatives: []
  }
};

// Simulate analysis (WILL BE REPLACED IN PHASE 2)
const handleAnalyzeClick = (fieldName) => {
  console.log(`Analyze clicked for: ${fieldName}`);
  console.log('Analysis started');

  isAnalyzing.value = true;

  // 3-second simulated analysis
  setTimeout(() => {
    isAnalyzing.value = false;

    // Set mock results for both fields
    if (fieldName === 'documentDate') {
      aiResults.value.documentDate = MOCK_RESULTS.documentDate;
      aiResults.value.documentType = MOCK_RESULTS.documentType;
    }

    console.log('Analysis completed');
    console.log('Mock results:', aiResults.value);
  }, 3000);
};
```

### New Styles
```css
/* Analyze Button */
.analyze-button {
  margin: 12px 0;
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.analyzing-text {
  font-size: 0.95rem;
  color: #666;
  font-style: italic;
}

/* AI Result */
.ai-result {
  margin: 12px 0;
}

.ai-result-content {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.ai-result-content:hover {
  background-color: #f5f5f5;
}

.ai-result-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.ai-result-badge {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Tooltip Content */
.ai-tooltip-content {
  max-width: 350px;
  padding: 8px;
}

.ai-tooltip-section {
  margin-bottom: 12px;
}

.ai-tooltip-section:last-child {
  margin-bottom: 0;
}

.ai-tooltip-section strong {
  display: block;
  margin-bottom: 4px;
  color: #1976d2;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.ai-tooltip-section p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
  font-style: italic;
}

.ai-tooltip-section ul {
  margin: 0;
  padding-left: 16px;
  list-style: disc;
}

.ai-tooltip-section li {
  font-size: 0.85rem;
  line-height: 1.4;
  color: #555;
  margin-bottom: 4px;
}
```

---

## Success Criteria

### Functional
- **F1**: "Analyze Document" button displays in AI tab when no results exist
- **F2**: Clicking button logs to console: "Analyze clicked for [field]"
- **F3**: Button triggers 3-second simulated analysis with spinner
- **F4**: Spinner replaces button in same location (no layout shift)
- **F5**: Mock results display after spinner completes
- **F6**: Results replace spinner in same location (no layout shift)
- **F7**: Hovering over result shows tooltip with context and alternatives

### Visual Design
- **V1**: Button styled with Vuetify design system
- **V2**: Spinner centered and clearly visible
- **V3**: Mock values easy to read (font size, weight, color)
- **V4**: Confidence badge color-coded (green ≥95%, yellow/amber <95%)
- **V5**: Tooltip formatted for readability
- **V6**: No layout shift during state transitions

### Code Quality
- **C1**: Uses Vue 3 Composition API patterns
- **C2**: Reactive state properly declared with `ref()`
- **C3**: Console logging clear and descriptive
- **C4**: Comments explain mock data and future replacement

---

## Testing Plan

### Manual Tests

#### TC1: Initial State
**Steps**: Open AI tab
**Expected**:
- Button labeled "🤖 Analyze Document" visible
- Button positioned where value will appear
- No console errors

#### TC2: Click Analysis
**Steps**: Click "Analyze Document" button
**Expected**:
- Console logs: "Analyze clicked for documentDate"
- Console logs: "Analysis started"
- Spinner replaces button immediately
- Text shows "Analyzing..."

#### TC3: Analysis Completion
**Steps**: Wait 3 seconds after clicking
**Expected**:
- Console logs: "Analysis completed"
- Console logs mock results object
- Spinner disappears
- Mock value "2024-03-15" displays with "92%" badge
- Mock type "Invoice" displays with "98%" badge

#### TC4: Tooltip Display
**Steps**: Complete analysis, then hover over Document Date result
**Expected**:
- Tooltip appears below cursor
- Shows context: "Found 'Invoice Date: March 15, 2024' in document header"
- Shows alternative: "2024-03-14 (78%) - Possible scan date in footer"
- Tooltip disappears when mouse moves away

#### TC5: Layout Shift Test
**Steps**:
1. Open AI tab
2. Measure button position (Y coordinate)
3. Click button, wait for spinner
4. Measure spinner position
5. Wait for results
6. Measure result position

**Expected**: All three elements have **identical Y coordinates** - no visible layout "jump"

---

## Notes

### Mock Data Explanation
The `MOCK_RESULTS` constant simulates what will come from the Gemini API in Phase 2:
```javascript
{
  value: string,        // The extracted value
  confidence: number,   // 0-100 percentage
  context: string,      // Where AI found this info
  alternatives: [       // Other possible values (if confidence < 95%)
    { value: string, confidence: number, reasoning: string }
  ]
}
```

### Phase 2 Changes
Phase 2 will:
1. Replace `handleAnalyzeClick()` to call real Gemini API
2. Remove `MOCK_RESULTS` constant
3. Keep the same UI/template structure
4. Add real error handling

---

## Completion Checklist

- [ ] Template updated with button, spinner, result states
- [ ] Script adds reactive state and mock handler
- [ ] Styles added for all UI states
- [ ] Console logging implemented
- [ ] All manual tests pass (TC1-TC5)
- [ ] No console errors or warnings
- [ ] Code reviewed for style consistency
- [ ] Ready for Phase 2 (Gemini API integration)
