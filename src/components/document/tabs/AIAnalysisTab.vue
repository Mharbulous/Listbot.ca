<template>
  <!-- Document Tab Content -->
  <div>
    <!-- Error Alert -->
    <v-alert
      v-if="aiError"
      type="error"
      variant="tonal"
      class="ai-error-alert"
      closable
      @click:close="aiError = null"
    >
      <template v-slot:title>
        <strong>{{ aiError.title }}</strong>
      </template>
      <p class="ai-error-message">{{ aiError.message }}</p>
      <p v-if="aiError.details" class="ai-error-details">{{ aiError.details }}</p>
      <v-btn
        v-if="aiError.action"
        :href="aiError.action.url"
        target="_blank"
        color="error"
        variant="outlined"
        size="small"
        class="ai-error-action"
      >
        {{ aiError.action.text }}
        <v-icon right>mdi-open-in-new</v-icon>
      </v-btn>
    </v-alert>

    <!-- System Fields Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">System Fields</h3>

      <!-- Document Date -->
      <div class="metadata-item">
        <span class="metadata-label">Document Date:</span>

        <!-- State 1: Analyze Button -->
        <v-btn
          v-if="!aiResults.documentDate && !isAnalyzing"
          color="primary"
          variant="outlined"
          prepend-icon="mdi-robot"
          @click="handleAnalyzeClick('documentDate')"
          class="analyze-button"
          size="small"
        >
          Analyze Document
        </v-btn>

        <!-- State 2: Analyzing Spinner -->
        <div v-else-if="isAnalyzing" class="analyzing-state">
          <v-progress-circular indeterminate size="20" color="primary" />
          <span class="analyzing-text">Analyzing...</span>
        </div>

        <!-- State 3: AI Result with Tooltip -->
        <div v-else class="ai-result">
          <v-tooltip location="bottom" max-width="400">
            <template v-slot:activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps" class="ai-result-content">
                <span class="ai-result-value">{{ aiResults.documentDate.value }}</span>
                <v-chip
                  :color="aiResults.documentDate.confidence >= 85 ? 'success' : 'warning'"
                  size="small"
                  variant="flat"
                  class="ai-result-badge"
                >
                  {{ aiResults.documentDate.confidence }}% ✓
                </v-chip>
              </div>
            </template>

            <!-- Tooltip Content -->
            <div class="ai-tooltip-content">
              <div class="ai-tooltip-section">
                <strong>Context:</strong>
                <p>{{ aiResults.documentDate.context }}</p>
              </div>
              <div
                v-if="aiResults.documentDate.alternatives.length"
                class="ai-tooltip-section"
              >
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

      <!-- Document Type -->
      <div class="metadata-item">
        <span class="metadata-label">Document Type:</span>

        <!-- State 1: Analyze Button -->
        <v-btn
          v-if="!aiResults.documentType && !isAnalyzing"
          color="primary"
          variant="outlined"
          prepend-icon="mdi-robot"
          @click="handleAnalyzeClick('documentType')"
          class="analyze-button"
          size="small"
        >
          Analyze Document
        </v-btn>

        <!-- State 2: Analyzing Spinner -->
        <div v-else-if="isAnalyzing" class="analyzing-state">
          <v-progress-circular indeterminate size="20" color="primary" />
          <span class="analyzing-text">Analyzing...</span>
        </div>

        <!-- State 3: AI Result with Tooltip -->
        <div v-else class="ai-result">
          <v-tooltip location="bottom" max-width="400">
            <template v-slot:activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps" class="ai-result-content">
                <span class="ai-result-value">{{ aiResults.documentType.value }}</span>
                <v-chip
                  :color="aiResults.documentType.confidence >= 85 ? 'success' : 'warning'"
                  size="small"
                  variant="flat"
                  class="ai-result-badge"
                >
                  {{ aiResults.documentType.confidence }}% ✓
                </v-chip>
              </div>
            </template>

            <!-- Tooltip Content -->
            <div class="ai-tooltip-content">
              <div class="ai-tooltip-section">
                <strong>Context:</strong>
                <p>{{ aiResults.documentType.context }}</p>
              </div>
              <div
                v-if="aiResults.documentType.alternatives.length"
                class="ai-tooltip-section"
              >
                <strong>Alternatives:</strong>
                <ul>
                  <li v-for="alt in aiResults.documentType.alternatives" :key="alt.value">
                    {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
                  </li>
                </ul>
              </div>
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>

    <!-- Firm Fields Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Firm fields</h3>
      <div class="metadata-notice">
        <p>Coming soon...</p>
      </div>
    </div>

    <!-- Matter Fields Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Matter fields</h3>
      <div class="metadata-notice">
        <p>Coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { FileProcessingService } from '@/features/organizer/services/fileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/core/stores/auth';

// AI Analysis state
const isAnalyzing = ref(false);
const aiError = ref(null);
const aiResults = ref({
  documentDate: null,
  documentType: null,
});

// Instantiate file processing service
const fileProcessingService = new FileProcessingService();

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
});

// Mock AI analysis data (Used for UI display in Phase 2)
const MOCK_RESULTS = {
  documentDate: {
    value: '2024-03-15',
    confidence: 92,
    context: "Found 'Invoice Date: March 15, 2024' in document header",
    alternatives: [
      {
        value: '2024-03-14',
        confidence: 78,
        reasoning: 'Possible scan date in footer',
      },
    ],
  },
  documentType: {
    value: 'Invoice',
    confidence: 98,
    context: "Document contains 'INVOICE' header, itemized charges, and total due",
    alternatives: [],
  },
};

// Get route and auth store
const route = useRoute();
const authStore = useAuthStore();

// Handle analyze button click (Real Gemini API integration)
const handleAnalyzeClick = async (fieldName) => {
  console.log(`Analyze clicked for: ${fieldName}`);
  console.log('Analysis started');

  isAnalyzing.value = true;
  aiError.value = null; // Clear previous errors

  try {
    const firmId = authStore.currentFirm;
    const matterId = route.params.matterId || 'general';

    // Validate file size
    const maxSizeMB = parseInt(import.meta.env.VITE_AI_MAX_FILE_SIZE_MB || '20');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (props.evidence.fileSize > maxSizeBytes) {
      throw new Error(`File too large for AI analysis (max ${maxSizeMB}MB)`);
    }

    console.log('📂 Getting file content from Firebase Storage...');

    // Get file content
    const base64Data = await fileProcessingService.getFileForProcessing(
      props.evidence,
      firmId,
      matterId
    );

    console.log('✅ File retrieved successfully');

    // Extract file extension
    const extension = props.evidence.displayName?.split('.').pop()?.toLowerCase() || 'pdf';

    // Call AI service (this logs results internally)
    const result = await aiMetadataExtractionService.analyzeDocument(
      base64Data,
      props.evidence,
      extension
    );

    console.log('🎯 FINAL PARSED RESULTS:');
    console.log('Document Date:', result.documentDate);
    console.log('Document Type:', result.documentType);
    console.log('Processing Time:', result.processingTime, 'ms');

    // TODO: Phase 3 - Replace mock results with real AI results from the API response
    // Currently displaying mock data in UI while logging real results to console for verification
    // Phase 2: Keep showing mock UI results
    // Phase 3 will replace this with real results display
    setTimeout(() => {
      isAnalyzing.value = false;
      aiResults.value.documentDate = MOCK_RESULTS.documentDate;
      aiResults.value.documentType = MOCK_RESULTS.documentType;
      console.log('✅ Mock UI results displayed (Phase 2 behavior)');
    }, 500);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });

    isAnalyzing.value = false;

    // Detect specific error types (using defensive checks with optional chaining)
    if (error?.code === 'AI/api-not-enabled' || error?.message?.includes('AI/api-not-enabled')) {
      aiError.value = {
        type: 'api-not-enabled',
        title: 'Firebase AI API Not Enabled',
        message:
          'The Firebase AI API needs to be enabled in your Firebase project before you can use AI analysis features.',
        action: {
          text: 'Enable API in Firebase Console',
          url: `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/genai/`,
        },
        details:
          'After enabling the API, wait 2-3 minutes for the changes to propagate, then try again.',
      };
    } else if (error?.message?.includes('File too large')) {
      aiError.value = {
        type: 'file-too-large',
        title: 'File Too Large',
        message: error?.message || 'File exceeds maximum size',
        details: 'Please select a smaller file for AI analysis.',
      };
    } else {
      aiError.value = {
        type: 'unknown',
        title: 'Analysis Failed',
        message: error?.message || 'An unexpected error occurred during AI analysis.',
        details: 'Please check the console for more details or try again later.',
      };
    }
  }
};
</script>

<style scoped>
.metadata-section {
  margin-bottom: 24px;
  transition: opacity 0.15s ease-in-out;
}

.metadata-section:last-child {
  margin-bottom: 0;
}

.metadata-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.metadata-notice {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.metadata-notice p {
  margin: 0;
  padding: 0;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.metadata-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

/* AI Analysis Styles */
/* Analyze Button */
.analyze-button {
  margin: 8px 0;
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.analyzing-text {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

/* AI Result */
.ai-result {
  margin: 8px 0;
}

.ai-result-content {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: fit-content;
}

.ai-result-content:hover {
  background-color: #f5f5f5;
}

.ai-result-value {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.ai-result-badge {
  font-size: 0.7rem;
  font-weight: 600;
}

/* AI Error Alert */
.ai-error-alert {
  margin-bottom: 20px;
}

.ai-error-message {
  margin: 8px 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.ai-error-details {
  margin: 8px 0 12px 0;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.9;
}

.ai-error-action {
  margin-top: 8px;
}

/* Tooltip Content */
.ai-tooltip-content {
  padding: 4px;
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
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 600;
}

.ai-tooltip-section p {
  margin: 0;
  font-size: 0.85rem;
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
  font-size: 0.8rem;
  line-height: 1.4;
  color: #555;
  margin-bottom: 4px;
}
</style>
