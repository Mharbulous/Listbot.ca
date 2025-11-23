# AI Metadata Extraction - Overview

**Status**: Phases 1-3 Implemented (Phase 4 Review Workflow Pending)
**Last Updated**: 2025-11-09
**Implementation Completion**: November 2025

**Related Documentation**:
- `ai-requirements-functional.md` - Functional requirements (FR-1 to FR-9)
- `ai-requirements-nonfunctional.md` - Non-functional requirements
- `ai-requirements-architecture.md` - Technical architecture and data flow
- `ai-requirements-prompts.md` - AI prompt engineering
- `ai-requirements-ui-mockups.md` - UI mockups and scenarios
- `ai-requirements-user-stories.md` - User stories and epics
- `ai-requirements-implementation.md` - Dependencies, risks, and appendix
- `docs/ai/aiAnalysis.md` - AI analysis system overview (implementation details)
- `docs/architecture/CategoryTags.md` - Tag system architecture
- `src/components/document/DocumentMetadataPanel.vue` - Metadata panel UI
- `planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md` - Implementation plan

## Executive Summary

This document defines the requirements for AI-powered extraction of document metadata fields (Document Date and Document Type). The system leverages Firebase AI Logic (Gemini 2.5 Flash Lite) to analyze document content and populate system category fields with confidence scoring.

**Implementation Status**: Core extraction features (Phases 1-3) are complete. Users manually trigger analysis via "Analyze Document" button in the AI tab. Results are displayed with confidence badges and stored in Firestore via the hybrid tag storage architecture. Review workflow (Phase 4) is planned for future implementation.

**Three-Tab Architecture**: The metadata panel uses three tabs with distinct purposes:
- **ℹ️ Metadata Tab**: Displays source file, storage, and embedded metadata
- **🤖 AI Tab**: Shows AI analysis results in a clean, simple view
- **👤Review Tab**: Dedicated workflow for reviewing and correcting low-confidence AI extractions

## Problem Statement

Currently, when users open the AI tab in the metadata panel, they see "Not yet analyzed" placeholders for Document Date and Document Type fields. Users must manually review documents and enter this metadata, which is time-consuming and error-prone. Our existing AI infrastructure for tag suggestions can be extended to automatically extract structured metadata fields.

The metadata panel already has a dedicated **👤Review tab** for human review workflows, which should be leveraged for reviewing low-confidence AI suggestions rather than cluttering the AI tab with review UI.

## Goals

1. **Manual Analysis Trigger**: User manually triggers AI analysis via "Analyze Document" button; AI tab loads existing results from Firestore when opened
2. **Structured Extraction**: Extract specific metadata fields (Document Date and Document Type) from document content
3. **Confidence Scoring**: Provide confidence scores for each extracted field
4. **Multiple Alternatives**: For low-confidence extractions (<95%), provide alternative suggestions
5. **Separation of Concerns**: AI tab shows results cleanly; Review tab handles all review workflows
6. **Clear Navigation**: Badge counts on Review tab indicate items needing attention
7. **User Review**: Dedicated Review tab allows users to accept, reject, or manually override AI suggestions
8. **Integration**: Seamlessly integrate with existing tag subcollection architecture

## User Personas

### Primary: Legal Document Reviewer
- Reviews 50-200 documents per day
- Needs quick metadata tagging for discovery management
- Values accuracy over speed but appreciates automation
- Comfortable reviewing and correcting AI suggestions

### Secondary: Paralegal/Legal Assistant
- Organizes incoming documents for case management
- Focuses on consistent categorization
- May have less domain expertise than attorneys
- Relies on system guidance for difficult classifications

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

---

**Document Version**: 1.2
**Last Updated**: 2025-11-09
**Change Log**:
- v1.2 (2025-11-09): Updated to reflect Phases 1-3 implementation completion
  - Changed status from "Planning" to "Phases 1-3 Implemented"
  - Updated FR-1 from auto-trigger to manual button trigger
  - Confirmed 95% confidence threshold throughout
  - Updated AI model references to gemini-2.5-flash-lite
  - Marked Review Tab (FR-7, FR-8) as Phase 4 (not yet implemented)
  - Added implementation file references and line numbers
  - Documented 3-tier document type hierarchy
- v1.1 (2025-11-04): Updated to reflect actual hybrid storage architecture (subcollection + embedded map)
- v1.0 (2025-11-04): Initial requirements document

**Authors**: Product Team + AI Assistant
**Reviewers**: Implementation Team
**Status**: Living Document (reflects actual implementation)

---

## Implementation Reference

For actual implementation details, see:
- **`docs/ai/aiAnalysis.md`** - Complete implementation guide with architecture and extension patterns
- **`src/services/aiMetadataExtractionService.js`** - Core AI metadata extraction service
- **`src/components/document/tabs/AIAnalysisTab.vue`** - UI implementation
- **`planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md`** - Implementation plan and learnings
