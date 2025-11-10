<template>
  <!-- Review Tab Content -->
  <div>
    <!-- Loading State -->
    <template v-if="showLoadingUI">
      <div class="review-loading-state">
        <v-progress-circular indeterminate size="24" color="primary" />
        <span class="review-loading-text">Loading review data...</span>
      </div>
    </template>

    <!-- Empty State: No fields to review -->
    <template v-else-if="!hasFieldsToReview">
      <div class="review-empty-state">
        <em>Use AI to extract data for human review</em>
      </div>
    </template>

    <!-- Review Fields Section -->
    <template v-else>
      <div class="review-panel">
        <!-- Document Date Review -->
        <div v-if="shouldShowField('documentDate')" class="review-field">
          <div class="field-label-with-badge">
            <span class="field-label">Document Date</span>
            <!-- Confidence Badge (only if AI-extracted) -->
            <v-tooltip v-if="aiResults.documentDate" location="bottom" max-width="400">
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

              <!-- Tooltip Content -->
              <div class="ai-tooltip-content">
                <div v-if="aiResults.documentDate.metadata?.context" class="ai-tooltip-section">
                  <strong>Context:</strong>
                  <p>{{ aiResults.documentDate.metadata.context }}</p>
                </div>
                <div v-if="aiResults.documentDate.metadata?.aiReasoning" class="ai-tooltip-section">
                  <strong>AI Reasoning:</strong>
                  <p>{{ aiResults.documentDate.metadata.aiReasoning }}</p>
                </div>
                <div
                  v-if="aiResults.documentDate.metadata?.aiAlternatives?.length"
                  class="ai-tooltip-section"
                >
                  <strong>Alternatives:</strong>
                  <ul>
                    <li v-for="alt in aiResults.documentDate.metadata.aiAlternatives" :key="alt.value">
                      {{ formatDateString(alt.value) }} ({{ alt.confidence }}%)
                    </li>
                  </ul>
                </div>
              </div>
            </v-tooltip>
          </div>

          <!-- Editable Input (pre-filled with AI value) -->
          <v-text-field
            v-model="reviewValues.documentDate"
            type="date"
            variant="outlined"
            density="compact"
            :error-messages="reviewErrors.documentDate"
            @input="reviewErrors.documentDate = ''"
            class="review-input"
          />

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

        <!-- Document Type Review -->
        <div v-if="shouldShowField('documentType')" class="review-field">
          <div class="field-label-with-badge">
            <span class="field-label">Document Type</span>
            <!-- Confidence Badge (only if AI-extracted) -->
            <v-tooltip v-if="aiResults.documentType" location="bottom" max-width="400">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-chip
                  v-bind="tooltipProps"
                  :color="getConfidenceColor(aiResults.documentType.confidence)"
                  size="small"
                  variant="flat"
                  class="confidence-badge"
                >
                  {{ aiResults.documentType.confidence }}%
                </v-chip>
              </template>

              <!-- Tooltip Content -->
              <div class="ai-tooltip-content">
                <div v-if="aiResults.documentType.metadata?.context" class="ai-tooltip-section">
                  <strong>Context:</strong>
                  <p>{{ aiResults.documentType.metadata.context }}</p>
                </div>
                <div v-if="aiResults.documentType.metadata?.aiReasoning" class="ai-tooltip-section">
                  <strong>AI Reasoning:</strong>
                  <p>{{ aiResults.documentType.metadata.aiReasoning }}</p>
                </div>
                <div
                  v-if="aiResults.documentType.metadata?.aiAlternatives?.length"
                  class="ai-tooltip-section"
                >
                  <strong>Alternatives:</strong>
                  <ul>
                    <li v-for="alt in aiResults.documentType.metadata.aiAlternatives" :key="alt.value">
                      {{ alt.value }} ({{ alt.confidence }}%)
                    </li>
                  </ul>
                </div>
              </div>
            </v-tooltip>
          </div>

          <!-- Editable Input (pre-filled with AI value) -->
          <v-text-field
            v-model="reviewValues.documentType"
            variant="outlined"
            density="compact"
            :error-messages="reviewErrors.documentType"
            @input="reviewErrors.documentType = ''"
            class="review-input"
          />

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
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/core/stores/auth';
import tagSubcollectionService from '@/features/organizer/services/tagSubcollectionService';
import { formatDate } from '@/utils/dateFormatter';

// Props
const props = defineProps({
  activeTab: {
    type: String,
    default: 'review',
  },
  fileHash: {
    type: String,
    required: true,
  },
  evidence: {
    type: Object,
    required: true,
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD',
  },
});

// Get route and auth store
const route = useRoute();
const authStore = useAuthStore();

// Track the last loaded document to avoid unnecessary reloads
const lastLoadedFileHash = ref(null);

// Loading state
const loadingReviewData = ref(false);
const showLoadingUI = ref(false);
let loadingDelayTimeout = null;

// Review state
const savingReview = ref(false);
const aiResults = ref({
  documentDate: null,
  documentType: null,
});
const reviewValues = ref({
  documentDate: '',
  documentType: '',
});
const reviewErrors = ref({
  documentDate: '',
  documentType: '',
});

// Check if there are any fields to review
const hasFieldsToReview = computed(() => {
  return aiResults.value.documentDate || aiResults.value.documentType;
});

// Determine if a field should be shown on Review Tab
const shouldShowField = (fieldName) => {
  // Show if AI-extracted
  return !!aiResults.value[fieldName];
};

// Get confidence badge color
const getConfidenceColor = (confidence) => {
  if (confidence >= 95) return 'success'; // Green for very high confidence
  if (confidence >= 80) return 'warning'; // Amber for medium-high confidence
  return 'error'; // Red for low confidence
};

// Format date string
const formatDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return 'Unknown';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return formatDate(date, props.dateFormat);
  } catch (error) {
    return dateString;
  }
};

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

// Check if Accept button should be enabled
const isAcceptEnabled = (fieldName) => {
  const value = reviewValues.value[fieldName];
  return value && value.trim() !== '' && !reviewErrors.value[fieldName];
};

// Accept button clicked
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
    const firmId = authStore?.currentFirm;
    const matterId = route.params.matterId || 'general';
    const userId = authStore?.user?.uid;
    const existingAITag = aiResults.value[fieldName];

    // Defensive checks
    if (!firmId) throw new Error('Firm ID not available. Please ensure you are logged in.');
    if (!userId) throw new Error('User ID not available. Please log in again.');
    if (!props.evidence?.id) throw new Error('Document ID not available.');

    const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';

    // Since there's no updateTag method, we'll use approveAITag for now
    // This marks the tag as reviewed and approved
    await tagSubcollectionService.approveAITag(
      props.evidence.id,
      categoryId,
      firmId,
      matterId
    );

    console.log('✅ Review accepted and saved');

    // Clear review state
    reviewValues.value[fieldName] = '';
    reviewErrors.value[fieldName] = '';

    // Reload to update state (field will disappear from Review Tab and AI Tab)
    await loadReviewData();

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

  const categoryId = fieldName === 'documentDate' ? 'DocumentDate' : 'DocumentType';

  try {
    const firmId = authStore?.currentFirm;
    const matterId = route.params.matterId || 'general';

    await tagSubcollectionService.rejectAITag(
      props.evidence.id,
      categoryId,
      firmId,
      matterId
    );

    console.log('✅ Tag rejected');

    // Reload to update state
    await loadReviewData();
  } catch (error) {
    console.error('❌ Failed to reject tag:', error);
  }
};

// Load AI-extracted tags that need review
const loadReviewData = async () => {
  loadingReviewData.value = true;

  // Only show loading UI if loading takes longer than 200ms (prevents flash)
  loadingDelayTimeout = setTimeout(() => {
    if (loadingReviewData.value) {
      showLoadingUI.value = true;
    }
  }, 200);

  try {
    const firmId = authStore?.currentFirm;
    const matterId = route.params.matterId || 'general';

    // Defensive checks
    if (!firmId) {
      throw new Error('No firm ID available. Please ensure you are logged in.');
    }

    if (!props.evidence?.id) {
      throw new Error('Document ID not available.');
    }

    console.log('[ReviewTab] Loading AI tags from Firestore...');

    const tags = await tagSubcollectionService.getTags(
      props.evidence.id,
      {},
      firmId,
      matterId
    );

    console.log('[ReviewTab] Tags loaded:', tags?.length || 0, 'tags');

    // Load AI-extracted tags that need review (not yet approved/rejected)
    // Filter: must be AI-sourced AND not yet approved/rejected
    aiResults.value = {
      documentDate: tags?.find(t =>
        t?.categoryId === 'DocumentDate' &&
        t?.source === 'ai' &&
        !t?.humanApproved &&
        !t?.rejected
      ) || null,
      documentType: tags?.find(t =>
        t?.categoryId === 'DocumentType' &&
        t?.source === 'ai' &&
        !t?.humanApproved &&
        !t?.rejected
      ) || null
    };

    // Pre-fill review values with AI-extracted data
    if (aiResults.value.documentDate) {
      reviewValues.value.documentDate = aiResults.value.documentDate.tagName;
    }
    if (aiResults.value.documentType) {
      reviewValues.value.documentType = aiResults.value.documentType.tagName;
    }

    // Track that we've loaded this document successfully
    lastLoadedFileHash.value = props.fileHash;

  } catch (error) {
    console.error('[ReviewTab] Failed to load review data:', error);
  } finally {
    loadingReviewData.value = false;
    // Clear timeout and hide loading UI
    if (loadingDelayTimeout) {
      clearTimeout(loadingDelayTimeout);
      loadingDelayTimeout = null;
    }
    showLoadingUI.value = false;
  }
};

// Watch for activeTab or fileHash changes
watch(
  [() => props.activeTab, () => props.fileHash],
  async ([newTab, newFileHash]) => {
    if (newTab === 'review' && newFileHash !== lastLoadedFileHash.value) {
      await loadReviewData();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Review Tab Styles */

.review-loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  margin: 20px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.review-loading-text {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.review-empty-state {
  padding: 24px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.review-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.field-label-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
  text-transform: uppercase;
}

.review-input {
  margin-top: 4px;
}

.confidence-badge {
  font-weight: 600;
}

.review-actions {
  display: flex;
  gap: 8px;
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
