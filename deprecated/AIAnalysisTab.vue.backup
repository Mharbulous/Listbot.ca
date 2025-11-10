<template>
  <!-- Document Tab Content -->
  <div>
    <!-- Loading State (only shown after 200ms delay to prevent flash) -->
    <template v-if="showLoadingUI">
      <div class="ai-loading-state">
        <v-progress-circular indeterminate size="24" color="primary" />
        <span class="ai-loading-text">Loading results...</span>
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
          Retry
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
        <!-- Document Date - Only show if NOT yet extracted -->
        <div v-if="!aiResults.documentDate" class="metadata-item">
          <span
            class="metadata-label"
            :class="{ 'align-right': fieldPreferences.documentDate !== 'get' }"
          >
            Document Date
          </span>

          <div class="field-controls">
            <!-- Segmented Control (shown when NOT analyzing) -->
            <SegmentedControl
              v-if="!isAnalyzing"
              v-model="fieldPreferences.documentDate"
              :options="[
                { label: 'Get', value: 'get' },
                { label: 'Skip', value: 'skip' },
                { label: 'Manual', value: 'manual' }
              ]"
            />

            <!-- Analyzing Spinner (shown when analyzing, replaces control) -->
            <div v-else class="analyzing-state">
              <v-progress-circular indeterminate size="20" color="primary" />
              <span class="analyzing-text">Analyzing...</span>
            </div>
          </div>
        </div>

        <!-- Document Type - Only show if NOT yet extracted -->
        <div v-if="!aiResults.documentType" class="metadata-item">
          <span
            class="metadata-label"
            :class="{ 'align-right': fieldPreferences.documentType !== 'get' }"
          >
            Document Type
          </span>

          <div class="field-controls">
            <!-- Segmented Control (shown when NOT analyzing) -->
            <SegmentedControl
              v-if="!isAnalyzing"
              v-model="fieldPreferences.documentType"
              :options="[
                { label: 'Get', value: 'get' },
                { label: 'Skip', value: 'skip' },
                { label: 'Manual', value: 'manual' }
              ]"
            />

            <!-- Analyzing Spinner (shown when analyzing, replaces control) -->
            <div v-else class="analyzing-state">
              <v-progress-circular indeterminate size="20" color="primary" />
              <span class="analyzing-text">Analyzing...</span>
            </div>
          </div>
        </div>

        <!-- 🚀Analyze Document Button (at bottom of System Fields) -->
        <div class="analyze-document-section">
          <!-- Message when no fields remain to be filled -->
          <div v-if="!hasEmptyFields" class="no-fields-message">
            There are no empty fields to be filled out.
          </div>

          <button
            @click="handleAnalyzeClick"
            :disabled="isAnalyzing || !hasEmptyFields"
            class="analyze-document-button"
          >
            <span>🚀Analyze Document</span>
            <v-progress-circular
              v-if="isAnalyzing"
              indeterminate
              size="20"
              width="2"
              color="white"
              class="button-loader"
            />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { FileProcessingService } from '@/features/organizer/services/fileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/core/stores/auth';
import tagSubcollectionService from '@/features/organizer/services/tagSubcollectionService';
import { formatDate } from '@/utils/dateFormatter';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';

// AI Analysis state
const isAnalyzing = ref(false);
const loadingAITags = ref(false);
const showLoadingUI = ref(false); // Delayed loading UI to prevent flash
const aiError = ref(null);
const aiResults = ref({
  documentDate: null,
  documentType: null,
});

// Field analysis preferences (mockup state - not functional yet)
const fieldPreferences = ref({
  documentDate: 'get',
  documentType: 'get',
});

// Track the last loaded document to avoid unnecessary reloads
const lastLoadedFileHash = ref(null);
let loadingDelayTimeout = null;

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
    default: 'YYYY-MM-DD',
  },
});

// Get route and auth store
const route = useRoute();
const authStore = useAuthStore();

// Helper function to get badge color based on confidence level
const getConfidenceBadgeColor = (confidence) => {
  if (confidence >= 85) return 'success'; // Green for 85%+ (auto-approved)
  return 'warning'; // Yellow for <85% (review required)
};

// Computed property to check if there are any empty fields
const hasEmptyFields = computed(() => {
  return !aiResults.value.documentDate || !aiResults.value.documentType;
});

// Load existing AI tags from Firestore
const loadAITags = async () => {
  loadingAITags.value = true;
  aiError.value = null;

  // Only show loading UI if loading takes longer than 200ms (prevents flash)
  loadingDelayTimeout = setTimeout(() => {
    if (loadingAITags.value) {
      showLoadingUI.value = true;
    }
  }, 200);

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

    // Track that we've loaded this document successfully
    lastLoadedFileHash.value = props.fileHash;

  } catch (error) {
    console.error('❌ Failed to load AI tags:', error);
    // Phase 1.5 Learning: Use defensive error property access
    // Don't set error state for loading failures - just log them
    // This prevents error UI from showing on initial load
    console.warn('⚠️ Could not load previous results:', error?.message || 'Unknown error');
  } finally {
    loadingAITags.value = false;
    // Clear timeout and hide loading UI
    if (loadingDelayTimeout) {
      clearTimeout(loadingDelayTimeout);
      loadingDelayTimeout = null;
    }
    showLoadingUI.value = false;
  }
};

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

// Format date according to user preference using centralized utility
const formatDateString = (dateString) => {
  // Phase 1.5 Learning: Defensive type checking and validation
  if (!dateString || typeof dateString !== 'string') {
    console.warn('⚠️ Invalid date string:', dateString);
    return 'Unknown';
  }

  try {
    // Parse the date string
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Could not parse date:', dateString);
      return dateString; // Return original if unparseable
    }

    // Use centralized date formatter with user's preferred format
    return formatDate(date, props.dateFormat);

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
  console.log('🤖 🚀Analyze Document clicked');

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
      throw new Error(`File too large for AI extraction (max ${maxSizeMB}MB)`);
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

    console.log('✅ Data extraction complete and displayed');

  } catch (error) {
    console.error('❌ Data extraction failed:', error);

    // Phase 1.5 Learning: Defensive error property access
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'unknown';

    // User-friendly error messages with defensive checks
    if (errorCode === 'AI/api-not-enabled' || errorMessage.includes('AI/api-not-enabled')) {
      aiError.value = {
        type: 'api-not-enabled',
        title: 'Firebase AI API Not Enabled',
        message:
          'The Firebase AI API needs to be enabled in your Firebase project before you can use AI extraction features.',
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
        details: 'Please select a smaller file for AI extraction.',
      };
    } else if (errorMessage.includes('network') || errorCode === 'unavailable') {
      aiError.value = {
        type: 'network',
        title: 'Network Error',
        message: 'Data extraction failed. Please check your connection and try again.',
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
        title: 'Data Extraction Failed',
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

/* Metadata Label Alignment Animation */
.metadata-label {
  position: relative;
  display: inline-block;
  left: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.metadata-label.align-right {
  /* Move to right side of container, then adjust back by label width */
  left: 100%;
  transform: translateX(-100%);
}

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

/* Field Controls Layout */
.field-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

/* Radio Button Group */
.field-radio-group {
  margin: 0;
}

.field-radio-group :deep(.v-selection-control-group) {
  gap: 16px;
}

/* Field Status (No analysis yet) */
.field-status {
  padding: 4px 0;
}

.field-status-text {
  font-size: 0.875rem;
  color: #999;
  font-style: italic;
}

/* 🚀Analyze Document Section */
.analyze-document-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-fields-message {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 24px;
  width: 100%;
}

.analyze-document-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  background-color: #1976d2; /* Primary blue */
  border: none;
  border-radius: 0.75rem; /* rounded-xl */
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgb(25 118 210 / 0.3), 0 4px 6px -4px rgb(25 118 210 / 0.3); /* shadow-lg shadow-primary/30 */
  min-width: 200px;
}

.analyze-document-button:hover:not(:disabled) {
  background-color: #1565c0; /* Darker blue on hover */
  transform: translateY(-1px);
  box-shadow: 0 20px 25px -5px rgb(25 118 210 / 0.3), 0 8px 10px -6px rgb(25 118 210 / 0.3);
}

.analyze-document-button:active:not(:disabled) {
  transform: translateY(0);
}

.analyze-document-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-loader {
  margin-left: 0.25rem;
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 40px; /* Match approximate height of SegmentedControl */
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
