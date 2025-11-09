<template>
  <!-- Document Tab Content -->
  <div>
    <!-- Loading State -->
    <template v-if="loadingAITags">
      <div class="ai-loading-state">
        <v-progress-circular indeterminate size="24" color="primary" />
        <span class="ai-loading-text">Loading analysis results...</span>
      </div>
    </template>

    <!-- Error Alert -->
    <template v-else-if="aiError">
      <v-alert
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

        <!-- Retry Button -->
        <v-btn
          v-if="!aiError.action"
          @click="retryAnalysis"
          color="primary"
          variant="outlined"
          size="small"
          class="ai-error-action"
          prepend-icon="mdi-refresh"
        >
          Retry Analysis
        </v-btn>

        <!-- Action Button (e.g., Firebase Console link) -->
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
    </template>

    <!-- Content Section -->
    <template v-else>
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
            @click="handleAnalyzeClick"
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
                  <span class="ai-result-value">{{ formatDate(aiResults.documentDate.tagName) }}</span>
                  <v-chip
                    :color="aiResults.documentDate.autoApproved ? 'success' : 'warning'"
                    :prepend-icon="aiResults.documentDate.autoApproved ? 'mdi-check-circle' : 'mdi-alert'"
                    size="small"
                    variant="flat"
                    class="ai-result-badge"
                  >
                    {{ aiResults.documentDate.confidence }}%
                    {{ aiResults.documentDate.autoApproved ? 'Auto-approved' : 'Review Required' }}
                  </v-chip>
                </div>
              </template>

              <!-- Tooltip Content -->
              <div class="ai-tooltip-content">
                <div v-if="aiResults.documentDate.metadata?.context" class="ai-tooltip-section">
                  <strong>Context:</strong>
                  <p>{{ aiResults.documentDate.metadata.context }}</p>
                </div>
                <div
                  v-if="aiResults.documentDate.metadata?.aiAlternatives?.length"
                  class="ai-tooltip-section"
                >
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

        <!-- Document Type -->
        <div class="metadata-item">
          <span class="metadata-label">Document Type:</span>

          <!-- State 1: Analyze Button -->
          <v-btn
            v-if="!aiResults.documentType && !isAnalyzing"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-robot"
            @click="handleAnalyzeClick"
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
                  <span class="ai-result-value">{{ aiResults.documentType.tagName }}</span>
                  <v-chip
                    :color="aiResults.documentType.autoApproved ? 'success' : 'warning'"
                    :prepend-icon="aiResults.documentType.autoApproved ? 'mdi-check-circle' : 'mdi-alert'"
                    size="small"
                    variant="flat"
                    class="ai-result-badge"
                  >
                    {{ aiResults.documentType.confidence }}%
                    {{ aiResults.documentType.autoApproved ? 'Auto-approved' : 'Review Required' }}
                  </v-chip>
                </div>
              </template>

              <!-- Tooltip Content -->
              <div class="ai-tooltip-content">
                <div v-if="aiResults.documentType.metadata?.context" class="ai-tooltip-section">
                  <strong>Context:</strong>
                  <p>{{ aiResults.documentType.metadata.context }}</p>
                </div>
                <div
                  v-if="aiResults.documentType.metadata?.aiAlternatives?.length"
                  class="ai-tooltip-section"
                >
                  <strong>Alternatives:</strong>
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
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { FileProcessingService } from '@/features/organizer/services/fileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/core/stores/auth';
import tagSubcollectionService from '@/features/organizer/services/tagSubcollectionService';

// AI Analysis state
const isAnalyzing = ref(false);
const loadingAITags = ref(false);
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
  activeTab: {
    type: String,
    default: 'document',
  },
  dateFormat: {
    type: String,
    default: 'ISO',
  },
});

// Get route and auth store
const route = useRoute();
const authStore = useAuthStore();

// Watch for activeTab changes to load AI tags when tab opens
watch(() => props.activeTab, async (newTab) => {
  if (newTab === 'document') {
    await loadAITags();
  }
}, { immediate: true }); // Load immediately on mount if already on document tab

// Load existing AI tags from Firestore
const loadAITags = async () => {
  loadingAITags.value = true;
  aiError.value = null;

  try {
    const firmId = authStore?.currentFirm;
    const matterId = route.params.matterId || 'general';

    // Phase 1.5 Learning: Defensive checks before Firestore operations
    if (!firmId) {
      throw new Error('No firm ID available. Please ensure you are logged in.');
    }

    if (!props.evidence?.id) {
      throw new Error('Document ID not available.');
    }

    console.log('📂 Loading AI tags from Firestore...');
    console.log('   Matter ID:', matterId);

    const tags = await tagSubcollectionService.getTags(
      props.evidence.id, // Document hash (BLAKE3)
      {},
      firmId,
      matterId
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
    // Don't set error state for loading failures - just log them
    // This prevents error UI from showing on initial load
    console.warn('⚠️ Could not load previous analysis results:', error?.message || 'Unknown error');
  } finally {
    loadingAITags.value = false;
  }
};

// Format date according to user preference
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

// Retry analysis after error
const retryAnalysis = () => {
  aiError.value = null;
  handleAnalyzeClick();
};

// Handle analyze button click (Real Gemini API integration)
const handleAnalyzeClick = async () => {
  console.log('🤖 Analyze Document clicked');

  isAnalyzing.value = true;
  aiError.value = null; // Clear previous errors

  try {
    const firmId = authStore?.currentFirm;
    const matterId = route.params.matterId || 'general';

    // Phase 1.5 Learning: Defensive checks before operations
    if (!firmId) {
      throw new Error('No firm ID available. Please ensure you are logged in.');
    }

    if (!props.evidence?.id) {
      throw new Error('Document ID not available.');
    }

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

    // Call AI service
    const result = await aiMetadataExtractionService.analyzeDocument(
      base64Data,
      props.evidence,
      extension,
      firmId,
      matterId
    );

    console.log('🎯 FINAL PARSED RESULTS:');
    console.log('Document Date:', result.documentDate);
    console.log('Document Type:', result.documentType);
    console.log('Processing Time:', result.processingTime, 'ms');

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
        createdBy: authStore.user?.uid || 'system', // Add createdBy field
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
        createdBy: authStore.user?.uid || 'system', // Add createdBy field
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
    console.log('   Firestore path: firms/' + firmId + '/matters/' + matterId + '/evidence/' + props.evidence.id + '/tags');

    // Phase 1.5 Learning: Defensive checks before storage
    if (!Array.isArray(tagsToStore) || tagsToStore.length === 0) {
      console.warn('⚠️ No tags to store');
      return;
    }

    // Store via service (atomic batch write)
    await tagSubcollectionService.addTagsBatch(
      props.evidence.id,
      tagsToStore,
      firmId,
      matterId
    );

    console.log('✅ Tags stored successfully');

    // Reload tags to display real results
    await loadAITags();

    console.log('✅ Analysis complete and displayed');

  } catch (error) {
    console.error('❌ Analysis failed:', error);

    // Phase 1.5 Learning: Defensive error property access
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'unknown';

    // User-friendly error messages with defensive checks
    if (errorCode === 'AI/api-not-enabled' || errorMessage.includes('AI/api-not-enabled')) {
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
    } else if (errorMessage.includes('too large')) {
      aiError.value = {
        type: 'file-too-large',
        title: 'File Too Large',
        message: errorMessage,
        details: 'Please select a smaller file for AI analysis.',
      };
    } else if (errorMessage.includes('network') || errorCode === 'unavailable') {
      aiError.value = {
        type: 'network',
        title: 'Network Error',
        message: 'Analysis failed. Please check your connection and try again.',
        details: 'Ensure you have a stable internet connection.',
      };
    } else if (errorCode === 'resource-exhausted') {
      aiError.value = {
        type: 'quota',
        title: 'Service Unavailable',
        message: 'AI service unavailable. Please try again later.',
        details: 'The AI service may be experiencing high demand or quota limits.',
      };
    } else if (errorMessage.includes('firebasevertexai.googleapis.com')) {
      aiError.value = {
        type: 'api-config',
        title: 'API Configuration Error',
        message: 'Firebase AI API not enabled. Please check Firebase Console.',
        details: 'Ensure the Firebase Vertex AI API is enabled in your project settings.',
      };
    } else {
      aiError.value = {
        type: 'unknown',
        title: 'Analysis Failed',
        message: errorMessage,
        details: 'Please check the console for more details or try again later.',
      };
    }
  } finally {
    isAnalyzing.value = false;
  }
};
</script>

<style scoped>
/* Component-specific AI Analysis styles - shared styles inherited from parent */

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
