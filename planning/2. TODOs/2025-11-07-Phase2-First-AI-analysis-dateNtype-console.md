# Phase 2: Vertex AI Integration (Console Output)

**Date**: 2025-11-07
**Status**: Planning
**Priority**: High
**Parent Epic**: AI-Powered Metadata Extraction
**Phase**: 2 of 4

---

## Phase Overview

Integrate Google Gemini via Firebase Vertex AI to make the "Analyze Document" button functional. This phase focuses on **backend AI integration** - calling the Gemini API and logging results to console. UI will continue showing mock data until Phase 3.

**Scope**: AI service creation, Gemini API calls, response parsing, console logging.

---

## User Stories

### Story 1: Gemini API Integration
**As a** developer
**I want to** call Gemini API when the user clicks "Analyze Document"
**So that** we can extract real document metadata using AI

**Acceptance Criteria**:
- ✅ Clicking "Analyze Document" triggers real Gemini API call
- ✅ File content retrieved via `FileProcessingService.getFileForProcessing()`
- ✅ File size validated before API call (max 20MB)
- ✅ Single API call analyzes both Document Date and Document Type
- ✅ API response logged to console in structured format
- ✅ UI continues showing mock results (Phase 1 behavior preserved)

---

### Story 2: Intelligent Date Extraction
**As a** developer
**I want to** the AI to distinguish original document dates from stamp dates
**So that** invoices with payment stamps return the invoice date, not the stamp date

**Acceptance Criteria**:
- ✅ Gemini prompt explicitly instructs to ignore stamps/received dates
- ✅ Prompt provides examples for invoices, letters, contracts
- ✅ Console output shows extracted date in ISO 8601 format (YYYY-MM-DD)
- ✅ Console output includes AI's reasoning and context
- ✅ Test invoice with "Paid 2024-12-03" stamp returns invoice date, not stamp

---

### Story 3: Document Type Classification
**As a** developer
**I want to** the AI to classify documents using predefined types
**So that** classifications are consistent and valid

**Acceptance Criteria**:
- ✅ Gemini prompt includes full DocumentType system category list
- ✅ Prompt explicitly restricts AI to only use predefined types
- ✅ Console output shows selected type and confidence
- ✅ Console output includes AI's reasoning
- ✅ Response validation rejects types not in predefined list

---

### Story 4: Confidence and Alternatives
**As a** developer
**I want to** receive confidence scores and alternative suggestions
**So that** we can implement auto-approval logic in Phase 3

**Acceptance Criteria**:
- ✅ API response includes confidence percentage (0-100)
- ✅ When confidence <95%, up to 2 alternatives included
- ✅ Each alternative includes value, confidence, and reasoning
- ✅ Console output clearly shows primary result and alternatives
- ✅ Confidence and alternatives available for both fields

---

### Story 5: Error Handling
**As a** developer
**I want to** gracefully handle API errors
**So that** failures are logged and don't crash the application

**Acceptance Criteria**:
- ✅ File size >20MB logs error, does not call API
- ✅ Network errors caught and logged with details
- ✅ API quota errors caught and logged
- ✅ JSON parse errors caught and logged
- ✅ All errors logged to console with stack traces
- ✅ UI shows mock results even on error (for Phase 2 testing)

---

## Implementation Details

### New File to Create
**`src/services/aiMetadataExtractionService.js`**

### Service Structure
```javascript
import { getGenerativeModel } from 'firebase/vertexai-preview';
import { firebaseAI } from './firebase';

/**
 * AI service for extracting Document Date and Document Type metadata
 * using Google Gemini via Firebase Vertex AI.
 */
class AIMetadataExtractionService {
  constructor() {
    this.model = getGenerativeModel(firebaseAI, {
      model: 'gemini-1.5-flash'
    });
  }

  /**
   * Analyze document to extract Date and Type
   *
   * @param {string} base64Data - Base64-encoded file content
   * @param {Object} evidence - Evidence document metadata
   * @param {string} extension - File extension (pdf, jpg, etc.)
   * @returns {Promise<Object>} Parsed AI response
   */
  async analyzeDocument(base64Data, evidence, extension) {
    const startTime = Date.now();

    try {
      console.log('🤖 Starting Gemini AI analysis...');
      console.log('File:', evidence.displayName);
      console.log('Extension:', extension);
      console.log('Size:', (evidence.fileSize / 1024).toFixed(2), 'KB');

      // Construct prompt
      const prompt = this._buildPrompt();

      // Prepare file data
      const filePart = {
        inlineData: {
          data: base64Data,
          mimeType: this._getMimeType(extension)
        }
      };

      // Call Gemini API
      console.log('📤 Sending request to Gemini API...');
      const result = await this.model.generateContent([prompt, filePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📥 Received response from Gemini API');
      console.log('Raw response:', text);

      // Parse JSON response
      const parsed = this._parseResponse(text);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${processingTime}ms`);
      console.log('Parsed results:', JSON.stringify(parsed, null, 2));

      return {
        ...parsed,
        processingTime
      };

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });

      throw error;
    }
  }

  /**
   * Build Gemini prompt for date/type extraction
   */
  _buildPrompt() {
    return `Analyze this document and extract the following metadata:

1. **Document Date**: The date the ORIGINAL document was created, signed, or authored.
   - CRITICAL: IGNORE payment stamps, received dates, scanned dates, or file metadata dates
   - For invoices: Extract the invoice date (NOT payment stamp dates like "Paid 2024-12-03")
   - For letters: Extract the letter date (NOT received/scanned dates)
   - For contracts: Extract the execution/signature date (NOT filing/recorded dates)
   - For emails: Extract the sent date
   - Format: YYYY-MM-DD (ISO 8601)

2. **Document Type**: Classify the document using ONLY these predefined types:
   Email, Memo, Letter, Contract, Invoice, Report, Affidavit, Audio, Brochure,
   By-laws, Case law, Certificate, Chart, Change order, Cheque, Cheque stub,
   Chronology, Court document, Drawing, Envelope, Evidence log, Fax cover,
   Financial record, Form, Folder, Index, Listing, Medical record, Notes,
   Pay stub, Photo

For each field, provide:
- **value**: The extracted value (REQUIRED)
- **confidence**: Your confidence level as a percentage 0-100 (REQUIRED)
- **reasoning**: Brief explanation of your determination (REQUIRED)
- **context**: Excerpt from the document showing where you found this information (REQUIRED)
- **alternatives**: If confidence < 95%, provide up to 2 alternative suggestions, each with:
  - value: Alternative value
  - confidence: Confidence in this alternative
  - reasoning: Why this might be correct

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "documentDate": {
    "value": "YYYY-MM-DD",
    "confidence": 85,
    "reasoning": "Brief explanation",
    "context": "Excerpt from document",
    "alternatives": [
      {
        "value": "YYYY-MM-DD",
        "confidence": 75,
        "reasoning": "Alternative explanation"
      }
    ]
  },
  "documentType": {
    "value": "Type from list",
    "confidence": 92,
    "reasoning": "Brief explanation",
    "context": "Excerpt from document",
    "alternatives": []
  }
}

If you cannot determine a field, set confidence to 0 and explain why in reasoning.`;
  }

  /**
   * Parse Gemini response text into structured object
   */
  _parseResponse(text) {
    try {
      // Clean response (remove markdown code blocks if present)
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.documentDate || !parsed.documentType) {
        throw new Error('Missing required fields in AI response');
      }

      // Validate required fields for each result
      ['documentDate', 'documentType'].forEach(field => {
        const result = parsed[field];
        if (!result.value || result.confidence === undefined) {
          throw new Error(`Missing value or confidence for ${field}`);
        }
      });

      return parsed;

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Response text:', text);
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  /**
   * Get MIME type from file extension
   */
  _getMimeType(extension) {
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

// Export singleton instance
export default new AIMetadataExtractionService();
```

---

### Update DocumentMetadataPanel.vue

Replace the `handleAnalyzeClick()` method from Phase 1:

```javascript
import FileProcessingService from '@/features/organizer/services/FileProcessingService';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { useAuthStore } from '@/stores/auth';

const handleAnalyzeClick = async (fieldName) => {
  console.log(`Analyze clicked for: ${fieldName}`);
  console.log('Analysis started');

  isAnalyzing.value = true;

  try {
    const authStore = useAuthStore();
    const firmId = authStore.currentFirm;
    const matterId = 'general'; // TODO: Make dynamic based on route

    // Validate file size
    const maxSizeMB = parseInt(import.meta.env.VITE_AI_MAX_FILE_SIZE_MB || '20');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (props.evidence.fileSize > maxSizeBytes) {
      throw new Error(`File too large for AI analysis (max ${maxSizeMB}MB)`);
    }

    console.log('📂 Getting file content from Firebase Storage...');

    // Get file content
    const base64Data = await FileProcessingService.getFileForProcessing(
      props.evidence,
      firmId,
      matterId
    );

    console.log('✅ File retrieved successfully');

    // Extract file extension
    const extension = props.evidence.displayName?.split('.').pop()?.toLowerCase() || 'pdf';

    // Call AI service (this will log results to console)
    const result = await aiMetadataExtractionService.analyzeDocument(
      base64Data,
      props.evidence,
      extension
    );

    console.log('🎯 FINAL PARSED RESULTS:');
    console.log('Document Date:', result.documentDate);
    console.log('Document Type:', result.documentType);
    console.log('Processing Time:', result.processingTime, 'ms');

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
      stack: error.stack
    });

    // Phase 2: Still show mock results even on error (for testing)
    setTimeout(() => {
      isAnalyzing.value = false;
      aiResults.value.documentDate = MOCK_RESULTS.documentDate;
      aiResults.value.documentType = MOCK_RESULTS.documentType;
      console.log('⚠️ Showing mock results despite error (Phase 2 testing mode)');
    }, 500);
  }
};
```

---

### Update firebase.js (if needed)

Ensure Firebase Vertex AI is initialized:

```javascript
import { initializeApp } from 'firebase/app';
import { getVertexAI } from 'firebase/vertexai-preview';

// ... existing Firebase initialization ...

// Initialize Vertex AI
export const firebaseAI = getVertexAI(app);
```

---

## Success Criteria

### Functional
- ✅ **F1**: Clicking "Analyze Document" calls real Gemini API
- ✅ **F2**: File content retrieved via `FileProcessingService.getFileForProcessing()`
- ✅ **F3**: File size validated before API call (>20MB rejected)
- ✅ **F4**: Single API call returns both date and type
- ✅ **F5**: API response logged to console with full structure
- ✅ **F6**: UI continues showing mock results (Phase 1 behavior preserved)

### AI Accuracy
- ✅ **A1**: Invoice with payment stamp returns invoice date (not stamp)
- ✅ **A2**: Letter with received stamp returns letter date (not received)
- ✅ **A3**: Document type matches predefined list only
- ✅ **A4**: Confidence scores are reasonable (>80% for clear documents)
- ✅ **A5**: Alternatives provided when confidence <95%

### Error Handling
- ✅ **E1**: Files >20MB log error and don't call API
- ✅ **E2**: Network errors caught and logged
- ✅ **E3**: API quota errors caught and logged
- ✅ **E4**: JSON parse errors caught and logged
- ✅ **E5**: Application doesn't crash on any error

### Console Output
- ✅ **C1**: File info logged before API call
- ✅ **C2**: "Sending request" logged
- ✅ **C3**: Raw Gemini response logged
- ✅ **C4**: Parsed results logged in readable format
- ✅ **C5**: Processing time logged
- ✅ **C6**: Errors logged with stack traces

---

## Testing Plan

### Unit Tests (Vitest)

**File**: `tests/services/aiMetadataExtractionService.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';

describe('AIMetadataExtractionService', () => {
  it('builds correct prompt', () => {
    const prompt = aiMetadataExtractionService._buildPrompt();
    expect(prompt).toContain('Document Date');
    expect(prompt).toContain('Document Type');
    expect(prompt).toContain('IGNORE payment stamps');
    expect(prompt).toContain('ISO 8601');
  });

  it('parses valid JSON response', () => {
    const validResponse = JSON.stringify({
      documentDate: {
        value: '2024-03-15',
        confidence: 92,
        reasoning: 'Found in header',
        context: 'Invoice Date: March 15, 2024',
        alternatives: []
      },
      documentType: {
        value: 'Invoice',
        confidence: 98,
        reasoning: 'Contains invoice header',
        context: 'INVOICE #12345',
        alternatives: []
      }
    });

    const parsed = aiMetadataExtractionService._parseResponse(validResponse);
    expect(parsed.documentDate.value).toBe('2024-03-15');
    expect(parsed.documentType.value).toBe('Invoice');
  });

  it('handles markdown code blocks in response', () => {
    const responseWithMarkdown = '```json\n{"documentDate": {"value": "2024-03-15", "confidence": 90, "reasoning": "test", "context": "test"}}\n```';

    const parsed = aiMetadataExtractionService._parseResponse(responseWithMarkdown);
    expect(parsed.documentDate.value).toBe('2024-03-15');
  });

  it('throws error on invalid JSON', () => {
    expect(() => {
      aiMetadataExtractionService._parseResponse('not valid json');
    }).toThrow('Invalid AI response format');
  });

  it('gets correct MIME type', () => {
    expect(aiMetadataExtractionService._getMimeType('pdf')).toBe('application/pdf');
    expect(aiMetadataExtractionService._getMimeType('jpg')).toBe('image/jpeg');
    expect(aiMetadataExtractionService._getMimeType('PNG')).toBe('image/png');
  });
});
```

---

### Manual Test Cases

#### TC1: Simple Invoice Analysis
**File**: Clear invoice PDF with date in header
**Steps**:
1. Open AI tab
2. Click "Analyze Document"
3. Check console output

**Expected Console**:
```
🤖 Starting Gemini AI analysis...
File: invoice-march-2024.pdf
Extension: pdf
Size: 234.56 KB
📂 Getting file content from Firebase Storage...
✅ File retrieved successfully
📤 Sending request to Gemini API...
📥 Received response from Gemini API
Raw response: {"documentDate": {...}, "documentType": {...}}
✅ Analysis completed in 2345ms
Parsed results: {
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 95,
    ...
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    ...
  }
}
🎯 FINAL PARSED RESULTS:
Document Date: { value: "2024-03-15", confidence: 95, ... }
Document Type: { value: "Invoice", confidence: 98, ... }
Processing Time: 2345 ms
✅ Mock UI results displayed (Phase 2 behavior)
```

**Expected UI**:
- Spinner shows during analysis
- Mock results display after completion (Phase 1 behavior)

#### TC2: Invoice with Payment Stamp
**File**: Invoice dated 2024-03-15 with "Paid 2024-12-03" stamp
**Steps**: Same as TC1

**Expected Console**:
- Document Date value: "2024-03-15" (NOT "2024-12-03")
- Reasoning mentions ignoring stamp
- Context references invoice date location

#### TC3: File Too Large
**File**: 25MB PDF
**Steps**: Click "Analyze Document"

**Expected Console**:
```
Analyze clicked for: documentDate
Analysis started
❌ Analysis failed: Error: File too large for AI analysis (max 20MB)
Error details: {
  message: "File too large for AI analysis (max 20MB)",
  stack: "..."
}
⚠️ Showing mock results despite error (Phase 2 testing mode)
```

**Expected**: No Gemini API call made

#### TC4: Network Error
**Setup**: Disconnect network
**Steps**: Click "Analyze Document"

**Expected Console**:
- Error logged with network details
- Mock results still display (Phase 2 mode)

#### TC5: Low Confidence Result
**File**: Blurry or ambiguous document
**Steps**: Click "Analyze Document"

**Expected Console**:
- Confidence <95%
- Alternatives array populated
- Each alternative has value, confidence, reasoning

---

## Files Created/Modified

### New Files
1. **`src/services/aiMetadataExtractionService.js`**
   - Core AI service
   - Gemini API integration
   - Response parsing
   - Error handling

2. **`tests/services/aiMetadataExtractionService.test.js`**
   - Unit tests for service methods
   - Response parsing tests
   - Error handling tests

### Modified Files
1. **`src/components/document/DocumentMetadataPanel.vue`**
   - Update `handleAnalyzeClick()` to call real AI service
   - Add imports for `FileProcessingService` and `aiMetadataExtractionService`
   - Add file size validation
   - Enhanced console logging

2. **`src/services/firebase.js`** (if needed)
   - Initialize and export `firebaseAI` for Vertex AI

---

## Environment Variables

Add to `.env`:
```env
VITE_ENABLE_AI_FEATURES=true
VITE_AI_MAX_FILE_SIZE_MB=20
```

---

## Dependencies

### External APIs
- **Google Gemini 1.5 Flash** via Firebase Vertex AI
- Requires Firebase project with Vertex AI enabled

### NPM Packages
- `firebase` (already installed)
- `firebase/vertexai-preview` (already available)

### Internal Services
- `FileProcessingService.getFileForProcessing()` - Get file content
- `useAuthStore` - Get firmId for security scoping

---

## Notes

### Phase 2 Behavior
- AI analysis runs successfully
- Results logged to console
- **UI still shows mock results** (Phase 1 behavior preserved)
- Phase 3 will connect real results to UI display

### Console Output Strategy
Console logging is intentionally verbose in Phase 2 to aid debugging:
- 🤖 = AI operation starting
- 📂 = File operation
- ✅ = Success
- 📤 = Sending request
- 📥 = Receiving response
- 🎯 = Final results
- ❌ = Error
- ⚠️ = Warning

### Gemini Prompt Refinement
The prompt is designed to:
1. Explicitly tell AI what to ignore (stamps, metadata dates)
2. Provide examples for different document types
3. Require specific JSON structure
4. Request reasoning and context for transparency
5. Generate alternatives when uncertain

---

## Next Steps (Phase 3)

Phase 3 will:
1. Display real AI results in UI (not mock data)
2. Store results in Firestore via `tagSubcollectionService`
3. Implement tooltip with real context and alternatives
4. Add confidence-based auto-approval logic
5. Remove Phase 2 testing mode (no more mock results on error)

---

## Completion Checklist

- [ ] `aiMetadataExtractionService.js` created and functional
- [ ] Unit tests pass for service methods
- [ ] `handleAnalyzeClick()` updated to call real AI
- [ ] File size validation implemented
- [ ] Console logging comprehensive and clear
- [ ] TC1-TC5 manual tests pass
- [ ] Invoice with stamp test (TC2) returns correct date
- [ ] File >20MB rejected without API call (TC3)
- [ ] Errors handled gracefully (TC4)
- [ ] No console errors or warnings (except expected errors)
- [ ] Ready for Phase 3 (UI display integration)
