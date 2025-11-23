# AI Metadata Extraction - Project Management

**Part of**: [AI Requirements Overview](./25-11-09-ai-requirements.md)
**Last Updated**: 2025-11-09

## Success Metrics

### Adoption Metrics
- **AI Tab Usage**: % of document views where AI tab is opened (target: >60% within 3 months)
- **Auto-Approval Rate**: % of AI suggestions auto-approved (target: >70%)
- **Manual Override Rate**: % of AI suggestions manually corrected (target: <15%)

### Accuracy Metrics
- **Document Date Accuracy**: % of auto-approved dates that remain unchanged after human review (target: >90%)
- **Document Type Accuracy**: % of auto-approved types that remain unchanged (target: >85%)
- **Confidence Calibration**: Correlation between AI confidence and accuracy (target: >0.85)

### Performance Metrics
- **Analysis Time**: Average time for AI analysis to complete (target: <8 seconds)
- **Time Savings**: Average time saved per document vs. manual entry (target: >30 seconds)
- **User Satisfaction**: User rating of AI assistance (target: >4.0/5.0)

## Future Enhancements (Out of Scope for Initial Release)

1. **Multi-Field Extraction**: Extract Author, Custodian, and custom firm/matter fields
2. **Document Summarization**: Generate AI-powered document summaries
3. **Key Entity Extraction**: Extract party names, dates, amounts, locations
4. **Batch Processing**: Run AI analysis on multiple documents at once
5. **Learning from Corrections**: Train models based on user corrections
6. **Extraction Confidence Visualization**: Heat map showing which parts of document informed extraction
7. **Jump to Content**: Click extracted value to jump to relevant section in document viewer

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

## Implementation Phases

### Phase 1: Core Extraction (Initial Release)
- Automatic trigger detection
- Document Date extraction
- Document Type classification
- Basic UI display
- Tag subcollection storage
- Estimated: 2-3 weeks

### Phase 2: Review Workflow (Week 4)
- Alternative suggestions UI
- Approve/reject/override actions
- Review status tracking
- Confidence visualization
- Estimated: 1-2 weeks

### Phase 3: Polish and Edge Cases (Week 6)
- Error handling
- Performance optimization
- Edge case handling
- User feedback integration
- Analytics tracking
- Estimated: 1 week

### Phase 4: Testing and Refinement (Week 7-8)
- User acceptance testing
- Accuracy validation
- Performance testing
- Prompt engineering refinement
- Documentation
- Estimated: 1-2 weeks

**Total Estimated Timeline**: 6-8 weeks
