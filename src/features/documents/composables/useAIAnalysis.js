import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { FileProcessingService } from '@/features/organizer/services/fileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/core/auth/stores';
import tagSubcollectionService from '@/features/organizer/services/tagSubcollectionService';
import { formatDate } from '@/utils/dateFormatter';

/**
 * Composable for AI document analysis functionality
 * Handles loading, analyzing, and storing AI-extracted metadata
 */
export function useAIAnalysis(props) {
  const route = useRoute();
  const authStore = useAuthStore();
  const fileProcessingService = new FileProcessingService();

  // State
  const isAnalyzing = ref(false);
  const loadingAITags = ref(false);
  const showLoadingUI = ref(false);
  const aiError = ref(null);
  const aiResults = ref({
    documentDate: null,
    documentType: null,
  });
  const fieldPreferences = ref({
    documentDate: 'get',
    documentType: 'get',
  });
  const lastLoadedFileHash = ref(null);

  // Review Tab state (Phase 4)
  const reviewValues = ref({
    documentDate: '',
    documentType: '',
  });
  const reviewErrors = ref({
    documentDate: '',
    documentType: '',
  });
  const savingReview = ref(false);

  let loadingDelayTimeout = null;

  // Computed
  const hasEmptyFields = computed(() => {
    return !aiResults.value.documentDate || !aiResults.value.documentType;
  });

  // Format date according to user preference
  const formatDateString = (dateString, dateFormat) => {
    if (!dateString || typeof dateString !== 'string') {
      console.warn('⚠️ Invalid date string:', dateString);
      return 'Unknown';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Could not parse date:', dateString);
        return dateString;
      }
      return formatDate(date, dateFormat);
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return dateString;
    }
  };

  // Load existing AI tags from Firestore
  const loadAITags = async () => {
    loadingAITags.value = true;
    aiError.value = null;

    // Only show loading UI if loading takes longer than 200ms
    loadingDelayTimeout = setTimeout(() => {
      if (loadingAITags.value) {
        showLoadingUI.value = true;
      }
    }, 200);

    try {
      const firmId = authStore?.currentFirm;
      const matterId = route.params.matterId || 'general';

      if (!firmId) {
        throw new Error('No firm ID available. Please ensure you are logged in.');
      }

      if (!props.evidence?.id) {
        throw new Error('Document ID not available.');
      }

      console.log('📂 Loading AI tags from Firestore...');
      console.log('   Matter ID:', matterId);

      const tags = await tagSubcollectionService.getTags(
        props.evidence.id,
        {},
        firmId,
        matterId
      );

      console.log('✅ Tags loaded:', tags?.length || 0, 'tags');

      aiResults.value = {
        documentDate: tags?.find(t => t?.categoryId === 'DocumentDate') || null,
        documentType: tags?.find(t => t?.categoryId === 'DocumentType') || null
      };

      lastLoadedFileHash.value = props.fileHash;

    } catch (error) {
      console.error('❌ Failed to load AI tags:', error);
      console.warn('⚠️ Could not load previous results:', error?.message || 'Unknown error');
    } finally {
      loadingAITags.value = false;
      if (loadingDelayTimeout) {
        clearTimeout(loadingDelayTimeout);
        loadingDelayTimeout = null;
      }
      showLoadingUI.value = false;
    }
  };

  // Handle analyze button click - Real Gemini API integration
  const handleAnalyzeClick = async () => {
    console.log('🤖 🚀Analyze Document clicked');

    isAnalyzing.value = true;
    aiError.value = null;

    try {
      const firmId = authStore?.currentFirm;
      const matterId = route.params.matterId || 'general';

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
          createdBy: authStore.user?.uid || 'system',
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
          createdBy: authStore.user?.uid || 'system',
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

      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'unknown';

      // User-friendly error messages
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

  // Retry analysis after error
  const retryAnalysis = () => {
    aiError.value = null;
    handleAnalyzeClick();
  };

  // ===== PHASE 4: Review Tab Methods =====

  // Document Type options for dropdown
  const documentTypeOptions = [
    'Statement',
    'Invoice',
    'Receipt',
    'Contract',
    'Letter',
    'Email',
    'Report',
    'Affidavit',
    'Audio',
    'Brochure',
    'By-laws',
    'Case law',
    'Certificate',
    'Chart',
    'Change order',
    'Cheque',
    'Cheque stub',
    'Chronology',
    'Court document',
    'Drawing',
    'Envelope',
    'Evidence log',
    'Fax cover',
    'Financial record',
    'Form',
    'Folder',
    'Index',
    'Listing',
    'Medical record',
    'Notes',
    'Pay stub',
    'Photo',
    'Other',
  ];

  // Update extraction mode (Get/Skip/Manual)
  const setExtractionMode = (fieldName, mode) => {
    fieldPreferences.value[fieldName] = mode;

    // If switching to Manual, prepare Review Tab entry with empty value
    if (mode === 'manual') {
      reviewValues.value[fieldName] = '';
    }

    // If switching away from Manual, clear Review Tab entry (unless AI has extracted)
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
    return aiResults.value[fieldName] || fieldPreferences.value[fieldName] === 'manual';
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
      const firmId = authStore?.currentFirm;
      const userId = authStore?.user?.uid;
      const matterId = route.params.matterId || 'general';
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
        confidence: existingAITag?.confidence ?? 100, // Keep AI confidence if exists, otherwise 100 for manual
        source: existingAITag ? 'human-reviewed' : 'human', // human-reviewed if AI-extracted, human if manual
        autoApproved: true,
        reviewRequired: false,
        humanReviewed: true,
        createdBy: userId,
        metadata: {
          ...(existingAITag?.metadata || {}),
          // Preserve original AI data if it exists
          originalAI: existingAITag
            ? {
                value: existingAITag.tagName,
                confidence: existingAITag.confidence,
                reasoning: existingAITag.metadata?.aiReasoning,
                context: existingAITag.metadata?.context,
              }
            : undefined,
          // Track acceptance
          acceptedBy: userId,
          acceptedAt: new Date().toISOString(),
          wasEdited: existingAITag ? value !== existingAITag.tagName : false,
        },
      };

      // Use updateTag if AI-extracted, addTag if manual entry
      if (existingAITag) {
        await tagSubcollectionService.updateTag(
          props.evidence.id,
          categoryId,
          acceptedTag,
          firmId,
          matterId
        );
      } else {
        await tagSubcollectionService.addTag(
          props.evidence.id,
          acceptedTag,
          firmId,
          matterId
        );
      }

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
    // 3. Set fieldPreferences[fieldName] back to 'get'
    console.log('🚧 Reject button clicked (mockup):', fieldName);
  };

  // Check if Accept button should be enabled
  const isAcceptEnabled = (fieldName) => {
    const value = reviewValues.value[fieldName];
    return value && value.trim() !== '' && !reviewErrors.value[fieldName];
  };

  // Confidence badge color (for Review Tab)
  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'success'; // Green for high confidence
    if (confidence >= 70) return 'warning'; // Yellow for medium confidence
    return 'error'; // Red for low confidence
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

  return {
    // State
    isAnalyzing,
    loadingAITags,
    showLoadingUI,
    aiError,
    aiResults,
    fieldPreferences,
    lastLoadedFileHash,

    // Review Tab state (Phase 4)
    reviewValues,
    reviewErrors,
    savingReview,

    // Computed
    hasEmptyFields,

    // Methods
    loadAITags,
    handleAnalyzeClick,
    retryAnalysis,
    formatDateString,

    // Review Tab methods (Phase 4)
    documentTypeOptions,
    setExtractionMode,
    shouldShowOnAITab,
    shouldShowOnReviewTab,
    validateReviewValue,
    acceptReviewValue,
    rejectReviewValue,
    isAcceptEnabled,
    getConfidenceColor,
    initializeReviewValues,
  };
}
