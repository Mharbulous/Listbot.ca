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

    <!-- Single View: Configuration + Review -->
    <template v-else>
      <div class="ai-content">
        <!-- AI Configuration Panel -->
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
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAIAnalysis } from '@/composables/useAIAnalysis';
import AIAnalysisError from './ai-analysis/AIAnalysisError.vue';
import AIAnalysisFieldItem from './ai-analysis/AIAnalysisFieldItem.vue';
import AIAnalysisButton from './ai-analysis/AIAnalysisButton.vue';

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

/* Single View Content */
.ai-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

/* Configuration Panel */
.ai-config-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
