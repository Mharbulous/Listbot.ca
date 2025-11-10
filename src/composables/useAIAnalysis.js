import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { FileProcessingService } from '@/features/organizer/services/fileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/core/stores/auth';
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

  return {
    // State
    isAnalyzing,
    loadingAITags,
    showLoadingUI,
    aiError,
    aiResults,
    fieldPreferences,
    lastLoadedFileHash,

    // Computed
    hasEmptyFields,

    // Methods
    loadAITags,
    handleAnalyzeClick,
    retryAnalysis,
    formatDateString,
  };
}
