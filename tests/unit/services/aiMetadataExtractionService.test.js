import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules before importing the service
vi.mock('firebase/ai', () => ({
  getGenerativeModel: vi.fn(),
  getAI: vi.fn(),
  VertexAIBackend: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('@/services/firebase.js', () => ({
  firebaseAI: {},
  db: {},
}));

import aiMetadataExtractionService from '@/services/aiMetadataExtractionService';
import { getGenerativeModel } from 'firebase/ai';
import { doc, getDoc } from 'firebase/firestore';

describe('AIMetadataExtractionService', () => {
  describe('_buildPrompt', () => {
    it('builds correct prompt with all required elements', () => {
      const documentTypes = ['Email', 'Memo', 'Letter', 'Contract', 'Invoice', 'Report'];
      const prompt = aiMetadataExtractionService._buildPrompt(documentTypes);

      // Check Document Date instructions
      expect(prompt).toContain('Document Date');
      expect(prompt).toContain('IGNORE: Payment stamps, received dates, scanned dates');
      expect(prompt).toContain('ISO 8601');
      expect(prompt).toContain('YYYY-MM-DD');

      // Check Document Type instructions
      expect(prompt).toContain('Document Type');
      expect(prompt).toContain('Invoice');
      expect(prompt).toContain('Email');
      expect(prompt).toContain('Contract');

      // Check required output format
      expect(prompt).toContain('value');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('reasoning');
      expect(prompt).toContain('context');
      expect(prompt).toContain('alternatives');

      // Check JSON format requirement
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('documentDate');
      expect(prompt).toContain('documentType');
    });

    it('includes invoice-specific guidance', () => {
      const documentTypes = ['Invoice', 'Contract'];
      const prompt = aiMetadataExtractionService._buildPrompt(documentTypes);
      expect(prompt).toContain('For invoices: Extract invoice date');
      expect(prompt).toContain('NOT payment stamp dates');
    });

    it('includes confidence threshold guidance', () => {
      const documentTypes = ['Email'];
      const prompt = aiMetadataExtractionService._buildPrompt(documentTypes);
      expect(prompt).toContain('confidence < 95%');
      expect(prompt).toContain('alternatives');
    });

    it('uses provided document types in prompt', () => {
      const customTypes = ['Custom Type 1', 'Custom Type 2', 'Special Document'];
      const prompt = aiMetadataExtractionService._buildPrompt(customTypes);
      expect(prompt).toContain('Custom Type 1');
      expect(prompt).toContain('Custom Type 2');
      expect(prompt).toContain('Special Document');
    });

    it('formats document types as comma-separated list', () => {
      const documentTypes = ['Email', 'Invoice', 'Contract'];
      const prompt = aiMetadataExtractionService._buildPrompt(documentTypes);
      expect(prompt).toContain('[Email, Invoice, Contract]');
    });
  });

  describe('_parseResponse', () => {
    it('parses valid JSON response', () => {
      const validResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(validResponse);

      expect(parsed.documentDate.value).toBe('2024-03-15');
      expect(parsed.documentDate.confidence).toBe(92);
      expect(parsed.documentType.value).toBe('Invoice');
      expect(parsed.documentType.confidence).toBe(98);
    });

    it('handles markdown code blocks with json tag', () => {
      const responseWithMarkdown = `\`\`\`json
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Found in header",
    "context": "Invoice Date: March 15, 2024",
    "alternatives": []
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    "reasoning": "Contains invoice header",
    "context": "INVOICE #12345",
    "alternatives": []
  }
}
\`\`\``;

      const parsed = aiMetadataExtractionService._parseResponse(responseWithMarkdown);
      expect(parsed.documentDate.value).toBe('2024-03-15');
      expect(parsed.documentType.value).toBe('Invoice');
    });

    it('handles markdown code blocks without json tag', () => {
      const responseWithMarkdown = `\`\`\`
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Found in header",
    "context": "Invoice Date: March 15, 2024",
    "alternatives": []
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    "reasoning": "Contains invoice header",
    "context": "INVOICE #12345",
    "alternatives": []
  }
}
\`\`\``;

      const parsed = aiMetadataExtractionService._parseResponse(responseWithMarkdown);
      expect(parsed.documentDate.value).toBe('2024-03-15');
      expect(parsed.documentType.value).toBe('Invoice');
    });

    it('handles response with alternatives', () => {
      const responseWithAlternatives = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 88,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
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
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(responseWithAlternatives);
      expect(parsed.documentDate.alternatives).toHaveLength(1);
      expect(parsed.documentDate.alternatives[0].value).toBe('2024-03-14');
    });

    it('throws error on invalid JSON', () => {
      expect(() => {
        aiMetadataExtractionService._parseResponse('not valid json');
      }).toThrow('Invalid AI response format');
    });

    it('throws error when documentDate is missing', () => {
      const missingDateResponse = JSON.stringify({
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(missingDateResponse);
      }).toThrow('Missing required fields');
    });

    it('throws error when documentType is missing', () => {
      const missingTypeResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(missingTypeResponse);
      }).toThrow('Missing required fields');
    });

    it('throws error when value field is missing', () => {
      const missingValueResponse = JSON.stringify({
        documentDate: {
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(missingValueResponse);
      }).toThrow('Invalid documentDate structure');
    });

    it('throws error when confidence field is missing', () => {
      const missingConfidenceResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(missingConfidenceResponse);
      }).toThrow('Invalid documentDate structure');
    });

    it('accepts valid response with all optional fields present', () => {
      const fullResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [
            {
              value: '2024-03-14',
              confidence: 78,
              reasoning: 'Possible scan date',
            },
          ],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(fullResponse);
      expect(parsed.documentDate.reasoning).toBe('Found in header');
      expect(parsed.documentDate.context).toBe('Invoice Date: March 15, 2024');
      expect(parsed.documentDate.alternatives).toHaveLength(1);
      expect(parsed.documentType.reasoning).toBe('Contains invoice header');
      expect(parsed.documentType.context).toBe('INVOICE #12345');
    });

    it('handles confidence at boundary values (0 and 100)', () => {
      const boundaryResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 0,
          reasoning: 'Very uncertain',
          context: 'Unclear date',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 100,
          reasoning: 'Absolutely certain',
          context: 'Clear invoice header',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(boundaryResponse);
      expect(parsed.documentDate.confidence).toBe(0);
      expect(parsed.documentType.confidence).toBe(100);
    });

    it('handles empty alternatives array', () => {
      const noAlternativesResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 98,
          reasoning: 'Clear date',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Clear type',
          context: 'INVOICE',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(noAlternativesResponse);
      expect(parsed.documentDate.alternatives).toEqual([]);
      expect(parsed.documentType.alternatives).toEqual([]);
    });

    it('handles multiple code blocks by extracting first one only', () => {
      const multipleCodeBlocksResponse = `\`\`\`json
{
  "documentDate": {
    "value": "2024-03-15",
    "confidence": 92,
    "reasoning": "Found in header",
    "context": "Invoice Date: March 15, 2024",
    "alternatives": []
  },
  "documentType": {
    "value": "Invoice",
    "confidence": 98,
    "reasoning": "Contains invoice header",
    "context": "INVOICE #12345",
    "alternatives": []
  }
}
\`\`\`

Here's another code block that should be ignored:
\`\`\`json
{
  "documentDate": {
    "value": "2024-12-31",
    "confidence": 50,
    "reasoning": "Wrong date",
    "context": "Should not use this",
    "alternatives": []
  }
}
\`\`\``;

      const parsed = aiMetadataExtractionService._parseResponse(multipleCodeBlocksResponse);
      // Should use the first code block only
      expect(parsed.documentDate.value).toBe('2024-03-15');
      expect(parsed.documentType.value).toBe('Invoice');
    });

    it('throws error when confidence is below 0', () => {
      const negativeConfidenceResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: -5,
          reasoning: 'Invalid confidence',
          context: 'Test',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(negativeConfidenceResponse);
      }).toThrow('Invalid confidence value for documentDate: must be 0-100, got -5');
    });

    it('throws error when confidence is above 100', () => {
      const highConfidenceResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 150,
          reasoning: 'Invalid confidence',
          context: 'Test',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      expect(() => {
        aiMetadataExtractionService._parseResponse(highConfidenceResponse);
      }).toThrow('Invalid confidence value for documentDate: must be 0-100, got 150');
    });

    it('warns when date format is not ISO 8601', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const invalidDateFormatResponse = JSON.stringify({
        documentDate: {
          value: '03/15/2024',
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: 03/15/2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(invalidDateFormatResponse);
      expect(parsed.documentDate.value).toBe('03/15/2024');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Date format validation: expected YYYY-MM-DD, got 03/15/2024')
      );

      consoleSpy.mockRestore();
    });

    it('accepts valid ISO 8601 date format without warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const validDateFormatResponse = JSON.stringify({
        documentDate: {
          value: '2024-03-15',
          confidence: 92,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      });

      const parsed = aiMetadataExtractionService._parseResponse(validDateFormatResponse);
      expect(parsed.documentDate.value).toBe('2024-03-15');
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('_getMimeType', () => {
    it('gets correct MIME type for PDF', () => {
      expect(aiMetadataExtractionService._getMimeType('pdf')).toBe('application/pdf');
    });

    it('gets correct MIME type for PNG (lowercase)', () => {
      expect(aiMetadataExtractionService._getMimeType('png')).toBe('image/png');
    });

    it('gets correct MIME type for PNG (uppercase)', () => {
      expect(aiMetadataExtractionService._getMimeType('PNG')).toBe('image/png');
    });

    it('gets correct MIME type for JPEG', () => {
      expect(aiMetadataExtractionService._getMimeType('jpeg')).toBe('image/jpeg');
      expect(aiMetadataExtractionService._getMimeType('jpg')).toBe('image/jpeg');
    });

    it('gets correct MIME type for Word documents', () => {
      expect(aiMetadataExtractionService._getMimeType('doc')).toBe('application/msword');
      expect(aiMetadataExtractionService._getMimeType('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('gets correct MIME type for Excel documents', () => {
      expect(aiMetadataExtractionService._getMimeType('xls')).toBe('application/vnd.ms-excel');
      expect(aiMetadataExtractionService._getMimeType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('defaults to PDF for unknown extensions', () => {
      expect(aiMetadataExtractionService._getMimeType('unknown')).toBe('application/pdf');
      expect(aiMetadataExtractionService._getMimeType('xyz')).toBe('application/pdf');
    });

    it('handles case-insensitive extensions', () => {
      expect(aiMetadataExtractionService._getMimeType('PDF')).toBe('application/pdf');
      expect(aiMetadataExtractionService._getMimeType('JpEg')).toBe('image/jpeg');
    });
  });

  describe('_formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(aiMetadataExtractionService._formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes correctly', () => {
      expect(aiMetadataExtractionService._formatFileSize(1024)).toBe('1.00 KB');
      expect(aiMetadataExtractionService._formatFileSize(5120)).toBe('5.00 KB');
    });

    it('formats megabytes correctly', () => {
      expect(aiMetadataExtractionService._formatFileSize(1048576)).toBe('1.00 MB');
      expect(aiMetadataExtractionService._formatFileSize(5242880)).toBe('5.00 MB');
    });

    it('handles zero bytes', () => {
      expect(aiMetadataExtractionService._formatFileSize(0)).toBe('Unknown');
    });

    it('handles null/undefined', () => {
      expect(aiMetadataExtractionService._formatFileSize(null)).toBe('Unknown');
      expect(aiMetadataExtractionService._formatFileSize(undefined)).toBe('Unknown');
    });

    it('rounds to 2 decimal places', () => {
      expect(aiMetadataExtractionService._formatFileSize(1536)).toBe('1.50 KB');
      expect(aiMetadataExtractionService._formatFileSize(1572864)).toBe('1.50 MB');
    });
  });

  describe('isAIEnabled', () => {
    it('returns true when AI features are enabled and firebaseAI is available', () => {
      // This test depends on environment configuration
      // We'll check that the method exists and returns a boolean
      const result = aiMetadataExtractionService.isAIEnabled();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('maxFileSizeMB', () => {
    it('has maxFileSizeMB property', () => {
      expect(aiMetadataExtractionService.maxFileSizeMB).toBeDefined();
      expect(typeof aiMetadataExtractionService.maxFileSizeMB).toBe('number');
    });

    it('maxFileSizeMB is greater than 0', () => {
      expect(aiMetadataExtractionService.maxFileSizeMB).toBeGreaterThan(0);
    });
  });

  describe('_getDocumentTypes (three-tier hierarchy)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('fetches document types from matter-specific categories (primary)', async () => {
      const mockCategoryData = {
        tags: [
          { id: 'doctype-email', name: 'Email' },
          { id: 'doctype-invoice', name: 'Invoice' },
          { id: 'doctype-contract', name: 'Contract' },
        ],
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockCategoryData,
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456');

      expect(types).toEqual(['Email', 'Invoice', 'Contract']);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'firms',
        'firm123',
        'matters',
        'matter456',
        'categories',
        'DocumentType'
      );
    });

    it('falls back to firm-wide categories when matter-specific not found (secondary)', async () => {
      const firmWideCategoryData = {
        tags: [
          { id: 'doctype-memo', name: 'Memo' },
          { id: 'doctype-letter', name: 'Letter' },
        ],
      };

      let callCount = 0;
      vi.mocked(getDoc).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: matter-specific (not found)
          return Promise.resolve({ exists: () => false });
        }
        if (callCount === 2) {
          // Second call: firm-wide (found)
          return Promise.resolve({ exists: () => true, data: () => firmWideCategoryData });
        }
        return Promise.resolve({ exists: () => false });
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456');

      expect(types).toEqual(['Memo', 'Letter']);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'firms',
        'firm123',
        'matters',
        'general',
        'categories',
        'DocumentType'
      );
    });

    it('falls back to global systemcategories when firm paths not found (tertiary)', async () => {
      const globalCategoryData = {
        tags: [
          { id: 'doctype-report', name: 'Report' },
          { id: 'doctype-affidavit', name: 'Affidavit' },
        ],
      };

      let callCount = 0;
      vi.mocked(getDoc).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: matter-specific (not found)
          return Promise.resolve({ exists: () => false });
        }
        if (callCount === 2) {
          // Second call: firm-wide (not found)
          return Promise.resolve({ exists: () => false });
        }
        if (callCount === 3) {
          // Third call: global systemcategories (found)
          return Promise.resolve({ exists: () => true, data: () => globalCategoryData });
        }
        return Promise.resolve({ exists: () => false });
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456');

      expect(types).toEqual(['Report', 'Affidavit']);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'systemcategories',
        'DocumentType'
      );
    });

    it('throws error when all three tiers fail', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      });

      await expect(
        aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456')
      ).rejects.toThrow('DocumentType category not found');
    });

    it('throws error when firmId is missing', async () => {
      await expect(
        aiMetadataExtractionService._getDocumentTypes(null, 'matter456')
      ).rejects.toThrow('Missing firmId parameter');
    });

    it('skips matter-specific check when matterId is "general"', async () => {
      const firmWideCategoryData = {
        tags: [
          { id: 'doctype-email', name: 'Email' },
        ],
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => firmWideCategoryData,
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'general');

      expect(types).toEqual(['Email']);
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'firms',
        'firm123',
        'matters',
        'general',
        'categories',
        'DocumentType'
      );
      expect(doc).not.toHaveBeenCalledWith(
        expect.anything(),
        'firms',
        'firm123',
        'matters',
        'matter456',
        'categories',
        'DocumentType'
      );
    });

    it('filters out invalid tag entries from matter-specific', async () => {
      const mockCategoryData = {
        tags: [
          { id: 'doctype-email', name: 'Email' },
          { id: 'doctype-invalid', name: null },
          { id: 'doctype-invoice', name: 'Invoice' },
          { id: 'doctype-empty' },
        ],
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockCategoryData,
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456');

      expect(types).toEqual(['Email', 'Invoice']);
    });

    it('prioritizes matter-specific over firm-wide when both exist', async () => {
      const matterSpecificData = {
        tags: [{ id: 'doctype-custom', name: 'CustomType' }],
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => matterSpecificData,
      });

      const types = await aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456');

      expect(types).toEqual(['CustomType']);
      // Should only call once since matter-specific is found first
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('throws error when category exists but has no valid tags', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ tags: [] }),
      });

      await expect(
        aiMetadataExtractionService._getDocumentTypes('firm123', 'matter456')
      ).rejects.toThrow('DocumentType category not found');
    });
  });

  describe('analyzeDocument (integration)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock Firestore to return default document types
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          tags: [
            { id: 'doctype-email', name: 'Email' },
            { id: 'doctype-invoice', name: 'Invoice' },
          ],
        }),
      });
    });

    it('successfully analyzes document with mocked AI response', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.documentDate.value).toBe('2024-03-15');
      expect(result.documentDate.confidence).toBe(95);
      expect(result.documentType.value).toBe('Invoice');
      expect(result.documentType.confidence).toBe(98);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining('Document Date') }),
          expect.objectContaining({
            inlineData: expect.objectContaining({
              mimeType: 'application/pdf',
              data: 'base64data',
            }),
          }),
        ])
      );
    });

    it('handles AI response with markdown code blocks', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``,
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'invoice.pdf', fileSize: 2048 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.documentDate.value).toBe('2024-03-15');
      expect(result.documentType.value).toBe('Invoice');
    });

    it('throws error when AI returns invalid response', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => 'invalid json response',
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      await expect(
        aiMetadataExtractionService.analyzeDocument(
          'base64data',
          { displayName: 'test.pdf', fileSize: 1024 },
          'pdf',
          'firm123',
          'matter456'
        )
      ).rejects.toThrow('Invalid AI response format');
    });

    it('throws error when AI returns response with out-of-range confidence', async () => {
      const invalidResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 150, // Invalid: >100
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(invalidResponse),
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      await expect(
        aiMetadataExtractionService.analyzeDocument(
          'base64data',
          { displayName: 'test.pdf', fileSize: 1024 },
          'pdf',
          'firm123',
          'matter456'
        )
      ).rejects.toThrow('Invalid confidence value for documentDate: must be 0-100, got 150');
    });
  });

  describe('Token Usage Tracking', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock Firestore to return default document types
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          tags: [
            { id: 'doctype-email', name: 'Email' },
            { id: 'doctype-invoice', name: 'Invoice' },
          ],
        }),
      });
    });

    it('extracts token counts from API response', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
            usageMetadata: {
              promptTokenCount: 2845,
              candidatesTokenCount: 156,
              cachedContentTokenCount: 0,
              totalTokenCount: 3001,
            },
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage.inputTokens).toBe(2845);
      expect(result.tokenUsage.outputTokens).toBe(156);
      expect(result.tokenUsage.cachedTokens).toBe(0);
      expect(result.tokenUsage.totalTokens).toBe(3001);
      expect(result.tokenUsage.aiModel).toBe('gemini-2.5-flash-lite');
    });

    it('handles cached tokens correctly', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
            usageMetadata: {
              promptTokenCount: 2845,
              candidatesTokenCount: 156,
              cachedContentTokenCount: 2500,
              totalTokenCount: 3001,
            },
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.tokenUsage.cachedTokens).toBe(2500);
    });

    it('defaults cachedTokens to 0 if not present', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
            usageMetadata: {
              promptTokenCount: 2845,
              candidatesTokenCount: 156,
              totalTokenCount: 3001,
            },
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.tokenUsage.cachedTokens).toBe(0);
    });

    it('validates timestamps are ISO 8601 format', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
            usageMetadata: {
              promptTokenCount: 2845,
              candidatesTokenCount: 156,
              cachedContentTokenCount: 0,
              totalTokenCount: 3001,
            },
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.tokenUsage.aiPromptSent).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.tokenUsage.aiResponse).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      expect(() => new Date(result.tokenUsage.aiPromptSent)).not.toThrow();
      expect(() => new Date(result.tokenUsage.aiResponse)).not.toThrow();
    });

    it('calculates response time correctly', async () => {
      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
            usageMetadata: {
              promptTokenCount: 2845,
              candidatesTokenCount: 156,
              cachedContentTokenCount: 0,
              totalTokenCount: 3001,
            },
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      const promptTime = new Date(result.tokenUsage.aiPromptSent).getTime();
      const responseTime = new Date(result.tokenUsage.aiResponse).getTime();
      const expectedDiff = responseTime - promptTime;

      expect(result.tokenUsage.aiResponseTime).toBe(expectedDiff);
      expect(result.tokenUsage.aiResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('logs warning when usageMetadata is missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('usageMetadata missing or malformed')
      );

      consoleWarnSpy.mockRestore();
    });

    it('defaults all token counts to 0 when usageMetadata is missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockResponse = {
        documentDate: {
          value: '2024-03-15',
          confidence: 95,
          reasoning: 'Found in header',
          context: 'Invoice Date: March 15, 2024',
          alternatives: [],
        },
        documentType: {
          value: 'Invoice',
          confidence: 98,
          reasoning: 'Contains invoice header',
          context: 'INVOICE #12345',
          alternatives: [],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
          },
        }),
      };

      vi.mocked(getGenerativeModel).mockReturnValue(mockModel);

      const result = await aiMetadataExtractionService.analyzeDocument(
        'base64data',
        { displayName: 'test.pdf', fileSize: 1024 },
        'pdf',
        'firm123',
        'matter456'
      );

      expect(result.tokenUsage.inputTokens).toBe(0);
      expect(result.tokenUsage.outputTokens).toBe(0);
      expect(result.tokenUsage.cachedTokens).toBe(0);
      expect(result.tokenUsage.totalTokens).toBe(0);

      consoleWarnSpy.mockRestore();
    });
  });
});
