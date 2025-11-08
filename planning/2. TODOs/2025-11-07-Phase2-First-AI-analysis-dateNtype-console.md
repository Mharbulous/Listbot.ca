# Phase 2: Vertex AI Integration (Console Output)

**Date**: 2025-11-07
**Phase**: 2 of 4
**Status**: Planning
**Priority**: High

**Context**: See `2025-11-07-First-AI-analysis-dateNtype.md` for overall architecture, prompts, and data structures.

---

## Phase 2 Overview

Integrate Google Gemini via Firebase Vertex AI to make the "Analyze Document" button functional. This phase focuses on **backend AI integration** - calling the Gemini API and logging results to console. UI continues showing mock data until Phase 3.

**Scope**: AI service creation, Gemini API calls, response parsing, console logging.

**What Phase 1 Gave Us**: Functional UI with mock data and 3-second timer.

**What Phase 2 Adds**: Real Gemini API calls, structured console output, error handling.

**What's Next**: Phase 3 will display real AI results in the UI and store them in Firestore.

---

## Phase 2 User Stories

### Story 1: Gemini API Integration
**As a** developer
**I want to** call Gemini API when the user clicks "Analyze Document"
**So that** we can extract real document metadata using AI

**Acceptance Criteria**:
- Clicking "Analyze Document" triggers real Gemini API call
- File content retrieved via `FileProcessingService.getFileForProcessing()`
- File size validated before API call (max 20MB)
- Single API call analyzes both Document Date and Document Type
- API response logged to console in structured format
- UI continues showing mock results (Phase 1 behavior preserved)

---

### Story 2: Console Output Quality
**As a** developer
**I want to** comprehensive console logging of the AI analysis process
**So that** I can debug issues and verify correct operation

**Acceptance Criteria**:
- File info logged before API call (name, size, extension)
- "Sending request" logged when API call starts
- Raw Gemini response logged
- Parsed results logged in readable JSON format
- Processing time logged
- Errors logged with stack traces

---

## Implementation Details

### New File: `aiMetadataExtractionService.js`

**Location**: `src/services/aiMetadataExtractionService.js`

For full Gemini prompt details, see the main context file: `2025-11-07-First-AI-analysis-dateNtype.md`

**Key Methods**:
```javascript
class AIMetadataExtractionService {
  constructor() {
    this.model = getGenerativeModel(firebaseAI, {
      model: 'gemini-1.5-flash'
    });
  }

  async analyzeDocument(base64Data, evidence, extension) {
    // 1. Log start
    // 2. Build prompt (see context file for full prompt)
    // 3. Prepare file data with MIME type
    // 4. Call Gemini API
    // 5. Parse JSON response
    // 6. Return parsed results with processing time
  }

  _buildPrompt() {
    // See context file for full prompt structure
    // Returns multi-line string with instructions
  }

  _parseResponse(text) {
    // Clean markdown code blocks
    // Parse JSON
    // Validate required fields
    // Return structured object
  }

  _getMimeType(extension) {
    // Map file extensions to MIME types
  }
}
```

---

### Update DocumentMetadataPanel.vue

**Replace Phase 1's `handleAnalyzeClick()` method**:

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

### Update firebase.js

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
- **F1**: Clicking "Analyze Document" calls real Gemini API
- **F2**: File content retrieved via `FileProcessingService.getFileForProcessing()`
- **F3**: File size validated before API call (>20MB rejected)
- **F4**: Single API call returns both date and type
- **F5**: API response logged to console with full structure
- **F6**: UI continues showing mock results (Phase 1 behavior preserved)

### AI Accuracy
- **A1**: Invoice with payment stamp returns invoice date (not stamp) - see context file for test case details
- **A2**: Document type matches predefined list only
- **A3**: Confidence scores are reasonable (>80% for clear documents)
- **A4**: Alternatives provided when confidence <95%

### Error Handling
- **E1**: Files >20MB log error and don't call API
- **E2**: Network errors caught and logged
- **E3**: JSON parse errors caught and logged
- **E4**: Application doesn't crash on any error

### Console Output
- **C1**: File info logged before API call
- **C2**: "Sending request" logged
- **C3**: Raw Gemini response logged
- **C4**: Parsed results logged in readable format
- **C5**: Processing time logged
- **C6**: Errors logged with stack traces

**Console Emoji Guide**:
- 🤖 = AI operation starting
- 📂 = File operation
- ✅ = Success
- 📤 = Sending request
- 📥 = Receiving response
- 🎯 = Final results
- ❌ = Error
- ⚠️ = Warning

---

## Testing Plan

### Unit Tests

**File**: `tests/services/aiMetadataExtractionService.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';

describe('AIMetadataExtractionService', () => {
  it('builds correct prompt', () => {
    const prompt = aiMetadataExtractionService._buildPrompt();
    expect(prompt).toContain('Document Date');
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
    const responseWithMarkdown = '```json\n{"documentDate": {...}}\n```';
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
    expect(aiMetadataExtractionService._getMimeType('PNG')).toBe('image/png');
  });
});
```

---

### Manual Test Cases

#### TC1: Simple Invoice Analysis
**File**: Clear invoice PDF
**Expected Console Output**:
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
Parsed results: { documentDate: {...}, documentType: {...} }
🎯 FINAL PARSED RESULTS:
Document Date: { value: "2024-03-15", confidence: 95, ... }
Document Type: { value: "Invoice", confidence: 98, ... }
Processing Time: 2345 ms
✅ Mock UI results displayed (Phase 2 behavior)
```

#### TC2: File Too Large
**File**: 25MB PDF
**Expected**: Error logged, no API call, mock UI still displays

#### TC3: Network Error
**Setup**: Disconnect network
**Expected**: Error logged with network details, mock UI displays

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
- Google Gemini 1.5 Flash via Firebase Vertex AI
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
- AI analysis runs successfully ✅
- Results logged to console ✅
- **UI still shows mock results** ⚠️ (intentional for testing)
- Phase 3 will connect real results to UI display

### Gemini Prompt
For the full prompt structure, see the main context file: `2025-11-07-First-AI-analysis-dateNtype.md`

Key prompt features:
1. Explicitly tells AI what to ignore (stamps, metadata dates)
2. Provides examples for different document types
3. Requires specific JSON structure
4. Requests reasoning and context for transparency
5. Generates alternatives when uncertain

---

## Completion Checklist

- [ ] `aiMetadataExtractionService.js` created and functional
- [ ] Unit tests pass for service methods
- [ ] `handleAnalyzeClick()` updated to call real AI
- [ ] File size validation implemented
- [ ] Console logging comprehensive and clear
- [ ] Manual tests pass (TC1-TC3)
- [ ] Invoice with stamp test returns correct date
- [ ] File >20MB rejected without API call
- [ ] Errors handled gracefully
- [ ] No unexpected console errors
- [ ] Ready for Phase 3 (UI display integration)
