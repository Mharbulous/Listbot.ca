# AI Metadata Extraction - Prompt Engineering

**Related Documentation**:
- `ai-requirements-functional.md` - Requirements FR-2 (Date) and FR-3 (Type)
- `src/services/aiMetadataExtractionService.js` - Implementation

## Prompt Engineering

### Document Date Extraction Prompt (Specialized)

```
You are a document date extraction specialist. Analyze the provided document and extract the primary document date.

PRIORITY ORDER (extract the MOST RELEVANT date):
1. Signature date or execution date
2. Document creation date stated in header/footer
3. Letterhead date or "Date:" field
4. Latest substantive content date
5. Metadata creation date (lowest priority)

DO NOT extract:
- Received dates or routing dates
- Metadata modification dates unless no other date exists
- Future dates (unless document is explicitly forward-dated)

Return your analysis as JSON:
{
  "primaryDate": "YYYY-MM-DD",
  "confidence": 0.95,
  "location": "Brief description of where date was found",
  "alternatives": [
    {
      "date": "YYYY-MM-DD",
      "confidence": 0.65,
      "location": "Where this alternative was found",
      "reason": "Why this might be the document date"
    }
  ]
}

RULES:
- confidence must be between 0 and 1 (decimal)
- Only include alternatives if primaryDate confidence < 0.95
- Include up to 2 alternatives maximum
- Sum of all confidences should approach or exceed 0.95
- If no date found, return primaryDate: null, confidence: 0

Document to analyze:
[document content]
```

### Document Type Classification Prompt (Specialized)

```
You are a legal document classifier. Analyze the provided document and classify its type.

PREDEFINED TYPES (prefer these if they fit):
- Email: Electronic correspondence
- Memo: Internal memorandum or note
- Letter: Formal correspondence
- Contract: Agreement, contract, or binding document
- Invoice: Bill, invoice, or payment request
- Report: Analysis, report, or formal documentation

You may suggest NEW types if none of the predefined types fit well.

Consider these indicators:
- Document structure (header, footer, signature block)
- Formatting conventions
- Language and tone
- Presence of legal terminology
- Standard document elements (RE:, Dear, Sincerely, etc.)

Return your analysis as JSON:
{
  "primaryType": "Email",
  "confidence": 0.92,
  "reasoning": "Brief explanation of classification",
  "indicators": ["List", "of", "key", "indicators"],
  "alternatives": [
    {
      "type": "Memo",
      "confidence": 0.45,
      "reasoning": "Why this alternative is possible"
    }
  ]
}

RULES:
- confidence must be between 0 and 1 (decimal)
- Only include alternatives if primaryType confidence < 0.95
- Include up to 2 alternatives maximum
- Rank alternatives by confidence (highest first)
- Sum of all confidences should approach or exceed 0.95
- Prefer predefined types unless document clearly doesn't fit any

Document to analyze:
[document content]
```
