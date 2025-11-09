import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI, db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * AI Metadata Extraction Service
 * Handles AI-powered extraction of Document Date and Document Type using Firebase AI Logic
 *
 * Note: Firebase AI Logic is the current name for what was previously called "Vertex AI in Firebase" (rebranded May 2025)
 *
 * @pattern Singleton Export (Stateless Service)
 * @rationale This service is stateless - all methods are pure functions that take
 *            parameters and return results. No instance state needed between calls.
 *            Exported as singleton to avoid unnecessary instantiation overhead.
 * @usage import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
 *        const result = await aiMetadataExtractionService.analyzeDocument(...);
 */
class AIMetadataExtractionService {
  constructor() {
    this.maxFileSizeMB = parseInt(import.meta.env.VITE_AI_MAX_FILE_SIZE_MB || '20');
  }

  /**
   * Check if AI features are enabled and properly configured
   * @returns {boolean} - True if AI features are available
   */
  isAIEnabled() {
    return import.meta.env.VITE_ENABLE_AI_FEATURES === 'true' && firebaseAI !== null;
  }

  /**
   * Analyze document to extract metadata (date and type)
   * @param {string} base64Data - Base64 encoded file content
   * @param {Object} evidence - Evidence document object
   * @param {string} extension - File extension
   * @param {string} firmId - The firm ID for fetching document types
   * @param {string} matterId - The matter ID for fetching document types
   * @returns {Promise<Object>} - Analysis results with documentDate, documentType, processingTime, and tokenUsage
   */
  async analyzeDocument(base64Data, evidence, extension = 'pdf', firmId, matterId = 'general') {
    const startTime = Date.now();

    // Token tracking timestamps
    let aiPromptSent = null;
    let aiResponse = null;

    try {
      console.log('🤖 Starting Gemini AI analysis...');
      console.log('File:', evidence.displayName || 'Unknown');
      console.log('Extension:', extension);
      console.log('Size:', this._formatFileSize(evidence.fileSize));

      if (!firebaseAI) {
        throw new Error('Firebase AI Logic not initialized. Ensure VITE_ENABLE_AI_FEATURES is set to true.');
      }

      // Get Gemini model (using 2.5 Flash Lite - Gemini 1.5 models retired Sept 2025)
      const modelName = 'gemini-2.5-flash-lite';
      const model = getGenerativeModel(firebaseAI, { model: modelName });

      // Fetch document types from Firestore
      const documentTypes = await this._getDocumentTypes(firmId, matterId);
      console.log('📋 Document types loaded:', documentTypes.length, 'types');

      // Build prompt with dynamic document types
      const prompt = this._buildPrompt(documentTypes);

      // Get MIME type
      const mimeType = this._getMimeType(extension);

      console.log('📤 Sending request to Gemini API:\n', prompt);

      // Record timestamp when sending prompt
      aiPromptSent = Date.now();

      // Generate AI response
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: mimeType, data: base64Data } },
      ]);

      const response = await result.response;

      // Record timestamp when response received
      aiResponse = Date.now();

      const text = response.text();

      console.log('📥 Received response from Gemini API');
      console.log('Raw response:', text);

      // Extract token usage from response
      const usageMetadata = response.usageMetadata || {};
      const tokenUsage = {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        cachedTokens: usageMetadata.cachedContentTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
        aiModel: modelName,
        aiPromptSent: new Date(aiPromptSent).toISOString(),
        aiResponse: new Date(aiResponse).toISOString(),
        aiResponseTime: aiResponse - aiPromptSent
      };

      // Validate token data
      if (!usageMetadata || typeof usageMetadata.promptTokenCount !== 'number') {
        console.warn('⚠️ usageMetadata missing or malformed in API response');
        console.warn('Response object:', response);
      }

      // Parse response
      const parsedResults = this._parseResponse(text);

      const processingTime = Date.now() - startTime;

      // Log comprehensive token usage
      console.log('\n💰 ===== TOKEN USAGE REPORT =====');
      console.log('AI Model:', tokenUsage.aiModel);
      console.log('Prompt Sent:', tokenUsage.aiPromptSent);
      console.log('Response Received:', tokenUsage.aiResponse);
      console.log('AI Response Time:', tokenUsage.aiResponseTime, 'ms');
      console.log('\n📊 Token Counts:');
      console.log('  Input Tokens:', tokenUsage.inputTokens);
      console.log('  Output Tokens:', tokenUsage.outputTokens);
      console.log('  Cached Tokens:', tokenUsage.cachedTokens);
      console.log('  Total Tokens:', tokenUsage.totalTokens);
      console.log('================================\n');

      console.log(`✅ Analysis completed in ${processingTime}ms`);
      console.log('Parsed results:', parsedResults);

      return {
        ...parsedResults,
        processingTime,
        tokenUsage
      };
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build the Gemini prompt for document analysis
   * @param {Array<string>} documentTypes - Array of valid document type names
   * @returns {string} - Formatted prompt
   */
  _buildPrompt(documentTypes) {
    // Format document types as a comma-separated list
    const typesList = documentTypes.join(', ');

    return `Analyze this document and extract:

1. Document Date: The date the ORIGINAL document was created/signed
   - IGNORE: Payment stamps, received dates, scanned dates, file metadata dates
   - For invoices: Extract invoice date (NOT payment stamp dates like "Paid 2024-12-03")
   - For letters: Extract letter date (NOT received/scanned dates)
   - For contracts: Extract execution/signature date
   - Format: YYYY-MM-DD (ISO 8601)

2. Document Type: Classify from this list ONLY:
   [${typesList}]

For each field, provide:
- value: The extracted value
- confidence: 0-100 percentage
- reasoning: Brief explanation
- context: Excerpt from document showing where you found this
- alternatives: If confidence < 95%, suggest up to 2 alternatives with reasoning

Return as JSON in this exact format:
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Invoice date found in header",
    "context": "Found 'Invoice Date: March 15, 2024' in document header",
    "alternatives": [
      {
        "value": "2024-03-14",
        "confidence": 78,
        "reasoning": "Possible scan date in footer"
      }
    ]
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    "reasoning": "Document contains 'INVOICE' header, itemized charges",
    "context": "Header: 'INVOICE #12345', line items with prices",
    "alternatives": []
  }
}`;
  }

  /**
   * Parse AI response and validate structure
   * @param {string} text - Raw AI response
   * @returns {Object} - Parsed and validated results
   */
  _parseResponse(text) {
    try {
      // Remove markdown code blocks if present (extract first block only)
      let cleanedText = text.trim();

      // Match first code block with optional 'json' language specifier
      // This prevents concatenating multiple code blocks
      const jsonCodeBlockMatch = cleanedText.match(/^```(?:json)?\s*\n?([\s\S]*?)```/);
      if (jsonCodeBlockMatch) {
        cleanedText = jsonCodeBlockMatch[1].trim();
      }

      // Parse JSON
      const parsed = JSON.parse(cleanedText);

      // Validate required fields
      if (!parsed.documentDate || !parsed.documentType) {
        throw new Error('Missing required fields in AI response');
      }

      // Validate structure
      const validateField = (field, fieldName) => {
        if (!field.value || typeof field.confidence !== 'number') {
          throw new Error(`Invalid ${fieldName} structure in AI response`);
        }
        if (field.confidence < 0 || field.confidence > 100) {
          throw new Error(
            `Invalid confidence value for ${fieldName}: must be 0-100, got ${field.confidence}`
          );
        }
      };

      validateField(parsed.documentDate, 'documentDate');
      validateField(parsed.documentType, 'documentType');

      // Validate date format (ISO 8601: YYYY-MM-DD)
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (parsed.documentDate.value && !datePattern.test(parsed.documentDate.value)) {
        console.warn(
          `Date format validation: expected YYYY-MM-DD, got ${parsed.documentDate.value}`
        );
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  /**
   * Fetch document types from Firestore DocumentType category using three-tier hierarchy
   * Priority: Matter-specific → Firm-wide → Global systemcategories
   * @param {string} firmId - The firm ID
   * @param {string} matterId - The matter ID
   * @returns {Promise<Array<string>>} - Array of document type names
   */
  async _getDocumentTypes(firmId, matterId = 'general') {
    try {
      // Validate parameters
      if (!firmId) {
        throw new Error('Missing firmId parameter - cannot fetch document types');
      }

      // 1. PRIMARY: Try matter-specific categories first
      if (matterId && matterId !== 'general') {
        try {
          const matterRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', 'DocumentType');
          const matterDoc = await getDoc(matterRef);

          if (matterDoc.exists()) {
            const categoryData = matterDoc.data();
            if (categoryData.tags && Array.isArray(categoryData.tags) && categoryData.tags.length > 0) {
              const documentTypes = categoryData.tags
                .map((tag) => tag.name)
                .filter((name) => name && typeof name === 'string');

              if (documentTypes.length > 0) {
                console.log(
                  `[AIMetadataExtractionService] Loaded ${documentTypes.length} document types from matter-specific categories (${matterId})`
                );
                return documentTypes;
              }
            }
          }
        } catch (error) {
          console.warn('[AIMetadataExtractionService] Failed to fetch matter-specific DocumentType:', error.message);
        }
      }

      // 2. SECONDARY: Try firm-wide categories (/matters/general)
      try {
        const firmWideRef = doc(db, 'firms', firmId, 'matters', 'general', 'categories', 'DocumentType');
        const firmWideDoc = await getDoc(firmWideRef);

        if (firmWideDoc.exists()) {
          const categoryData = firmWideDoc.data();
          if (categoryData.tags && Array.isArray(categoryData.tags) && categoryData.tags.length > 0) {
            const documentTypes = categoryData.tags
              .map((tag) => tag.name)
              .filter((name) => name && typeof name === 'string');

            if (documentTypes.length > 0) {
              console.log(
                `[AIMetadataExtractionService] Loaded ${documentTypes.length} document types from firm-wide categories`
              );
              return documentTypes;
            }
          }
        }
      } catch (error) {
        console.warn('[AIMetadataExtractionService] Failed to fetch firm-wide DocumentType:', error.message);
      }

      // 3. TERTIARY: Try global systemcategories
      try {
        const globalRef = doc(db, 'systemcategories', 'DocumentType');
        const globalDoc = await getDoc(globalRef);

        if (globalDoc.exists()) {
          const categoryData = globalDoc.data();
          if (categoryData.tags && Array.isArray(categoryData.tags) && categoryData.tags.length > 0) {
            const documentTypes = categoryData.tags
              .map((tag) => tag.name)
              .filter((name) => name && typeof name === 'string');

            if (documentTypes.length > 0) {
              console.log(
                `[AIMetadataExtractionService] Loaded ${documentTypes.length} document types from global systemcategories`
              );
              return documentTypes;
            }
          }
        }
      } catch (error) {
        console.warn('[AIMetadataExtractionService] Failed to fetch global systemcategories DocumentType:', error.message);
      }

      // If all three tiers failed, throw error
      throw new Error(
        'DocumentType category not found in matter-specific, firm-wide, or global systemcategories'
      );

    } catch (error) {
      console.error(
        '[AIMetadataExtractionService] Failed to fetch document types:',
        error.message
      );
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   * @param {string} extension - File extension
   * @returns {string} - MIME type
   */
  _getMimeType(extension) {
    const ext = extension.toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };

    return mimeTypes[ext] || 'application/pdf';
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  _formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Export singleton instance
export default new AIMetadataExtractionService();
