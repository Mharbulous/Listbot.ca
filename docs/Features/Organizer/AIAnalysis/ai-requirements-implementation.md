# AI Metadata Extraction - Implementation Details

**Related Documentation**:
- `ai-requirements-overview.md` - Executive summary and phases
- `ai-requirements-functional.md` - Functional requirements
- `ai-requirements-architecture.md` - Technical architecture

## Dependencies

1. Firebase AI Logic (Gemini) API access and quotas
2. **Existing hybrid tag storage architecture** (subcollection + embedded map)
   - `tagSubcollectionService.js` for atomic batch writes
   - Evidence documents with `tags` map field
   - `tagCount`, `autoApprovedCount`, `reviewRequiredCount` counters
3. Existing category management system (DocumentDate and DocumentType categories)
4. Document viewer with metadata panel
5. Firebase Storage for document content access
6. DocumentTable already configured to read from embedded `tags` map field

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low AI accuracy for non-standard documents | High | Medium | Robust confidence scoring, always show alternatives, easy manual override |
| API rate limits or quota exhaustion | Medium | High | Implement queuing, respect rate limits, clear error messaging, allow batch processing later |
| User distrust of AI suggestions | Medium | Medium | Always show confidence scores, provide context/reasoning, make review easy, track accuracy metrics |
| Performance impact on tab switching | Low | Medium | Background processing, optimize prompts, cache results, progressive loading |
| Complex date interpretation (date ranges, partial dates) | Medium | Medium | Clear rules in prompt, flag ambiguous dates for review, provide date formatting options |

## Open Questions

1. **Date Formatting**: Should extracted dates be displayed in user's preferred format or ISO format?
   - **Recommendation**: Use user's preferred date format from settings for display, store ISO 8601 in database

2. **Multi-Date Documents**: How to handle documents with multiple relevant dates (e.g., contract with execution date and effective date)?
   - **Recommendation**: Extract "primary" document date (execution/creation), consider adding "Effective Date" as separate field in future

3. **Date Ranges**: How to handle date ranges (e.g., "January-March 2024")?
   - **Recommendation**: Extract start date, add note field, or flag for manual review

4. **Timezone Handling**: Should extracted dates include timezone information?
   - **Recommendation**: Store dates without time component (date only), as DocumentDate is a date field not datetime

5. **Reanalysis**: Should users be able to manually trigger reanalysis after AI has run?
   - **Recommendation**: Yes, add "Reanalyze" button in AI tab for re-running extraction

6. **Background Processing**: Should analysis run in background for newly uploaded documents?
   - **Recommendation**: Future enhancement - initial version only analyzes on tab open to manage API costs

## Appendix

### Related System Categories

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

### Tag Document Structure Reference

#### Subcollection Storage (Full Metadata)

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

#### Embedded Map Storage (Fast Table Loading)

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
