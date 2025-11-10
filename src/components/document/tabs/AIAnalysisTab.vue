<template>
  <div>
    <!-- Loading State (only shown after 200ms delay to prevent flash) -->
    <template v-if="showLoadingUI">
      <div class="ai-loading-state">
        <v-progress-circular indeterminate size="24" color="primary" />
        <span class="ai-loading-text">Loading results...</span>
      </div>
    </template>

    <!-- Error Alert -->
    <AIAnalysisError
      v-else-if="aiError"
      :error="aiError"
      @close="aiError = null"
      @retry="retryAnalysis"
    />

    <!-- Two-Tab Interface -->
    <template v-else>
      <v-tabs v-model="activeInternalTab" color="primary" class="ai-tabs">
        <v-tab value="ai">AI</v-tab>
        <v-tab value="review">Review</v-tab>
      </v-tabs>

      <v-window v-model="activeInternalTab" class="ai-tab-window">
        <!-- AI Tab: Configuration Panel with Get/Skip/Manual -->
        <v-window-item value="ai">
          <div class="ai-config-panel">
            <!-- Document Date - Show only if not determined -->
            <AIAnalysisFieldItem
              v-if="shouldShowOnAITab('documentDate')"
              label="Document Date"
              :field-preference="fieldPreferences.documentDate"
              :is-analyzing="isAnalyzing"
              @update:field-preference="setExtractionMode('documentDate', $event)"
            />

            <!-- Document Type - Show only if not determined -->
            <AIAnalysisFieldItem
              v-if="shouldShowOnAITab('documentType')"
              label="Document Type"
              :field-preference="fieldPreferences.documentType"
              :is-analyzing="isAnalyzing"
              @update:field-preference="setExtractionMode('documentType', $event)"
            />

            <!-- Analyze Documents Button -->
            <AIAnalysisButton
              :has-empty-fields="hasEmptyFields"
              :is-analyzing="isAnalyzing"
              @analyze="handleAnalyzeClick"
            />
          </div>
        </v-window-item>

        <!-- Review Tab: Results + Manual Entry -->
        <v-window-item value="review">
          <div class="review-panel">
            <!-- Empty State -->
            <div
              v-if="!shouldShowOnReviewTab('documentDate') && !shouldShowOnReviewTab('documentType')"
              class="review-empty-state"
            >
              <em>Use AI to extract data for human review</em>
            </div>

            <!-- Document Date Review -->
            <div v-if="shouldShowOnReviewTab('documentDate')" class="review-field-section">
              <!-- Label with inline confidence badge -->
              <div class="field-header">
                <span class="field-label">Document Date</span>
                <v-chip
                  v-if="aiResults.documentDate"
                  :color="getConfidenceColor(aiResults.documentDate.confidence)"
                  size="small"
                  variant="flat"
                  class="confidence-badge-inline"
                >
                  {{ aiResults.documentDate.confidence }}%
                </v-chip>
              </div>

              <!-- Review/Edit UI -->
              <AIReviewFieldItem
                field-name="documentDate"
                label=""
                field-type="date"
                :ai-result="aiResults.documentDate"
                :review-value="reviewValues.documentDate"
                :review-error="reviewErrors.documentDate"
                :saving="savingReview"
                :is-accept-enabled="isAcceptEnabled('documentDate')"
                :get-confidence-color="getConfidenceColor"
                :hide-label="true"
                :hide-confidence-badge="true"
                @update:review-value="reviewValues.documentDate = $event"
                @clear-error="reviewErrors.documentDate = ''"
                @accept="acceptReviewValue('documentDate')"
                @reject="rejectReviewValue('documentDate')"
              />
            </div>

            <!-- Document Type Review -->
            <div v-if="shouldShowOnReviewTab('documentType')" class="review-field-section">
              <!-- Label with inline confidence badge -->
              <div class="field-header">
                <span class="field-label">Document Type</span>
                <v-chip
                  v-if="aiResults.documentType"
                  :color="getConfidenceColor(aiResults.documentType.confidence)"
                  size="small"
                  variant="flat"
                  class="confidence-badge-inline"
                >
                  {{ aiResults.documentType.confidence }}%
                </v-chip>
              </div>

              <!-- Review/Edit UI -->
              <AIReviewFieldItem
                field-name="documentType"
                label=""
                field-type="select"
                :select-options="documentTypeOptions"
                :ai-result="aiResults.documentType"
                :review-value="reviewValues.documentType"
                :review-error="reviewErrors.documentType"
                :saving="savingReview"
                :is-accept-enabled="isAcceptEnabled('documentType')"
                :get-confidence-color="getConfidenceColor"
                :hide-label="true"
                :hide-confidence-badge="true"
                @update:review-value="reviewValues.documentType = $event"
                @clear-error="reviewErrors.documentType = ''"
                @accept="acceptReviewValue('documentType')"
                @reject="rejectReviewValue('documentType')"
              />
            </div>
          </div>
        </v-window-item>
      </v-window>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAIAnalysis } from '@/composables/useAIAnalysis';
import AIAnalysisError from './ai-analysis/AIAnalysisError.vue';
import AIAnalysisFieldItem from './ai-analysis/AIAnalysisFieldItem.vue';
import AIAnalysisButton from './ai-analysis/AIAnalysisButton.vue';
import AIReviewFieldItem from './ai-analysis/AIReviewFieldItem.vue';

// Props
const props = defineProps({
  evidence: {
    type: Object,
    required: true,
  },
  fileHash: {
    type: String,
    required: true,
  },
  activeTab: {
    type: String,
    default: 'document',
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD',
  },
});

// Internal tab state (AI vs Review)
const activeInternalTab = ref('ai');

// Use AI Analysis composable
const {
  isAnalyzing,
  showLoadingUI,
  aiError,
  aiResults,
  fieldPreferences,
  lastLoadedFileHash,
  hasEmptyFields,
  loadAITags,
  handleAnalyzeClick,
  retryAnalysis,

  // Phase 4: Review Tab
  reviewValues,
  reviewErrors,
  savingReview,
  documentTypeOptions,
  setExtractionMode,
  shouldShowOnAITab,
  shouldShowOnReviewTab,
  acceptReviewValue,
  rejectReviewValue,
  isAcceptEnabled,
  getConfidenceColor,
} = useAIAnalysis(props);

// Watch for activeTab or fileHash changes
// Only load data when:
// 1. The AI tab is currently active
// 2. AND the document has changed since last load (or never loaded)
watch(
  [() => props.activeTab, () => props.fileHash],
  async ([newTab, newFileHash]) => {
    if (newTab === 'document' && newFileHash !== lastLoadedFileHash.value) {
      await loadAITags();
    }
  },
  { immediate: true } // Load immediately on mount if already on document tab
);
</script>

<style scoped>
/* Loading State */
.ai-loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  margin: 20px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.ai-loading-text {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

/* Two-Tab Interface */
.ai-tabs {
  margin-bottom: 16px;
}

.ai-tab-window {
  margin-top: 16px;
}

/* AI Tab: Configuration Panel */
.ai-config-panel {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Review Tab: Results Panel */
.review-panel {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.review-empty-state {
  padding: 24px;
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Review Field Section */
.review-field-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Field Header with inline confidence badge */
.field-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.field-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.confidence-badge-inline {
  margin-left: auto;
}
</style>
