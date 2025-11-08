import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI } from './firebase.js';

/**
 * AI Metadata Extraction Service
 * Handles AI-powered extraction of Document Date and Document Type using Firebase Vertex AI
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
   * @returns {Promise<Object>} - Analysis results with documentDate, documentType, and processingTime
   */
  async analyzeDocument(base64Data, evidence, extension = 'pdf') {
    const startTime = Date.now();

    try {
      console.log('🤖 Starting Gemini AI analysis...');
      console.log('File:', evidence.displayName || 'Unknown');
      console.log('Extension:', extension);
      console.log('Size:', this._formatFileSize(evidence.fileSize));

      if (!firebaseAI) {
        throw new Error('Firebase AI Logic not initialized. Ensure VITE_ENABLE_AI_FEATURES is set to true.');
      }

      // Get Gemini model
      const model = getGenerativeModel(firebaseAI, { model: 'gemini-1.5-flash' });

      // Build prompt
      const prompt = this._buildPrompt();

      // Get MIME type
      const mimeType = this._getMimeType(extension);

      console.log('📤 Sending request to Gemini API...');

      // Generate AI response
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: mimeType, data: base64Data } },
      ]);

      const response = await result.response;
      const text = response.text();

      console.log('📥 Received response from Gemini API');
      console.log('Raw response:', text);

      // Parse response
      const parsedResults = this._parseResponse(text);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${processingTime}ms`);
      console.log('Parsed results:', parsedResults);

      return {
        ...parsedResults,
        processingTime,
      };
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build the Gemini prompt for document analysis
   * @returns {string} - Formatted prompt
   */
  _buildPrompt() {
    return `Analyze this document and extract:

1. Document Date: The date the ORIGINAL document was created/signed
   - IGNORE: Payment stamps, received dates, scanned dates, file metadata dates
   - For invoices: Extract invoice date (NOT payment stamp dates like "Paid 2024-12-03")
   - For letters: Extract letter date (NOT received/scanned dates)
   - For contracts: Extract execution/signature date
   - Format: YYYY-MM-DD (ISO 8601)

2. Document Type: Classify from this list ONLY:
   [Email, Memo, Letter, Contract, Invoice, Report, Affidavit, Audio, Brochure,
    By-laws, Case law, Certificate, Chart, Change order, Cheque, Cheque stub,
    Chronology, Court document, Drawing, Envelope, Evidence log, Fax cover,
    Financial record, Form, Folder, Index, Listing, Medical record, Notes,
    Pay stub, Photo]

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
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
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
      };

      validateField(parsed.documentDate, 'documentDate');
      validateField(parsed.documentType, 'documentType');

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error(`Invalid AI response format: ${error.message}`);
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
