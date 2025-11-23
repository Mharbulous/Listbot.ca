# AI Metadata Extraction - Technical Reference

**Part of**: [AI Requirements Overview](./25-11-09-ai-requirements.md)
**Last Updated**: 2025-11-09

## Related System Categories

```javascript
// DocumentDate - Date type
{
  id: 'DocumentDate',
  name: 'Document Date',
  type: 'Date',
  defaultDateFormat: 'YYYY-MM-DD',
  isSystemCategory: true,
  description: 'The date the document was created or signed'
}

// DocumentType - Open List type
{
  id: 'DocumentType',
  name: 'Document Type',
  type: 'Open List',
  isSystemCategory: true,
  description: 'Classification of document type',
  tags: [
    { name: 'Email' },
    { name: 'Memo' },
    { name: 'Letter' },
    { name: 'Contract' },
    { name: 'Invoice' },
    { name: 'Report' }
  ]
}
```

## Tag Document Structure Reference

### Subcollection Storage (Full Metadata)

Stored at: `/firms/{firmId}/matters/{matterId}/evidence/{evidenceId}/tags/{categoryId}`

```javascript
// Example: Auto-approved Document Date tag (Subcollection)
{
  categoryId: 'DocumentDate',
  categoryName: 'Document Date',
  tagName: '2024-03-15',
  source: 'ai',
  confidence: 97, // 0-100 percentage
  autoApproved: true,
  reviewRequired: false,
  reviewedAt: Timestamp, // Auto-set for auto-approved
  reviewedBy: null,
  humanApproved: null,
  createdAt: Timestamp,
  createdBy: 'ai-system',
  metadata: {
    model: 'gemini-2.5-flash-lite', // Metadata extraction model
    processingTime: 3200, // milliseconds
    context: 'Analyzed document headers and signature blocks',
    aiAlternatives: [], // Empty for high confidence (≥95%)
    contentMatch: 'Date: March 15, 2024 [from page 1, top right header]',
    reviewReason: null
  }
}

// Example: Review-required Document Type tag (Subcollection)
{
  categoryId: 'DocumentType',
  categoryName: 'Document Type',
  tagName: 'Memo',
  source: 'ai',
  confidence: 78, // 0-100 percentage
  autoApproved: false,
  reviewRequired: true,
  reviewedAt: null,
  reviewedBy: null,
  humanApproved: null,
  createdAt: Timestamp,
  createdBy: 'ai-system',
  metadata: {
    model: 'gemini-2.5-flash-lite', // Metadata extraction model
    processingTime: 4100,
    context: 'Document structure analysis with multiple format indicators',
    aiAlternatives: [
      {
        value: 'Letter',
        confidence: 35,
        reasoning: 'Formal greeting and closing similar to business letter format'
      },
      {
        value: 'Email',
        confidence: 12,
        reasoning: 'TO/FROM fields similar to email headers'
      }
    ],
    contentMatch: 'MEMORANDUM [from header] + TO/FROM fields + body text structure',
    reviewReason: 'Document has characteristics of both memo and letter formats'
  }
}
```

### Embedded Map Storage (Fast Table Loading)

Stored at: `evidence.tags[categoryId]` (denormalized in evidence document)

```javascript
// Example: Embedded tags in evidence document
{
  // ... other evidence fields ...
  tags: {
    'DocumentDate': {
      tagName: '2024-03-15',
      confidence: 97,
      source: 'ai',
      autoApproved: true,
      reviewRequired: false,
      createdAt: Timestamp
    },
    'DocumentType': {
      tagName: 'Memo',
      confidence: 78,
      source: 'ai',
      autoApproved: false,
      reviewRequired: true,
      createdAt: Timestamp
    }
  },
  tagCount: 2,
  autoApprovedCount: 1,
  reviewRequiredCount: 1
}
```

**Note**: Both storage locations are synchronized atomically using batch writes in `tagSubcollectionService.js`. The DocumentTable reads only from the embedded map for performance (single query for 10,000+ documents). The Review tab reads from the subcollection to access full metadata including alternatives and reasoning.

## Implementation Reference

For actual implementation details, see:
- **`docs/ai/aiAnalysis.md`** - Complete implementation guide with architecture and extension patterns
- **`src/services/aiMetadataExtractionService.js`** - Core AI metadata extraction service
- **`src/components/document/tabs/AIAnalysisTab.vue`** - UI implementation
- **`planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md`** - Implementation plan and learnings

## Related Documentation

- `docs/ai/aiAnalysis.md` - AI analysis system overview (implementation details)
- `docs/architecture/CategoryTags.md` - Tag system architecture
- `src/components/document/DocumentMetadataPanel.vue` - Metadata panel UI
- `planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md` - Implementation plan

## Change Log

**Document Version**: 1.2

- **v1.2 (2025-11-09)**: Updated to reflect Phases 1-3 implementation completion
  - Changed status from "Planning" to "Phases 1-3 Implemented"
  - Updated FR-1 from auto-trigger to manual button trigger
  - Confirmed 95% confidence threshold throughout
  - Updated AI model references to gemini-2.5-flash-lite
  - Marked Review Tab (FR-7, FR-8) as Phase 4 (not yet implemented)
  - Added implementation file references and line numbers
  - Documented 3-tier document type hierarchy
- **v1.1 (2025-11-04)**: Updated to reflect actual hybrid storage architecture (subcollection + embedded map)
- **v1.0 (2025-11-04)**: Initial requirements document

**Authors**: Product Team + AI Assistant
**Reviewers**: Implementation Team
**Status**: Living Document (reflects actual implementation)
