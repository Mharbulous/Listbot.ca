# AI Metadata Extraction - Requirements Overview

**Status**: Phases 1-3 Implemented (Phase 4 Review Workflow Pending)
**Last Updated**: 2025-11-09
**Implementation Completion**: November 2025

## Quick Reference

This is the **index file** for AI Metadata Extraction requirements. The full requirements have been decomposed into focused documents by area of concern:

### Requirements Documentation

1. **[Business Requirements](./25-11-09-ai-requirements-business.md)**
   - Executive Summary
   - Problem Statement
   - Goals and Objectives
   - User Personas
   - **Audience**: Business stakeholders, product owners

2. **[Functional Requirements](./25-11-09-ai-requirements-functional.md)**
   - Functional Requirements (FR-1 through FR-9)
   - Non-Functional Requirements (NFR-1 through NFR-5)
   - **Audience**: Developers, QA engineers

3. **[Technical Architecture](./25-11-09-ai-requirements-architecture.md)**
   - Hybrid Storage Architecture (subcollection + embedded map)
   - Components and Services
   - Data Flow Diagrams
   - Prompt Engineering Specifications
   - **Audience**: Software architects, backend engineers

4. **[UI Specifications](./25-11-09-ai-requirements-ui.md)**
   - AI Tab Mockups (Configuration Panel)
   - Review Tab Mockups (Accept/Reject Workflow)
   - All UI Scenarios
   - **Audience**: UI/UX designers, frontend developers

5. **[User Stories](./25-11-09-ai-requirements-stories.md)**
   - 6 Epics with detailed user stories
   - Acceptance criteria for each story
   - **Audience**: Product owners, QA engineers, stakeholders

6. **[Project Management](./25-11-09-ai-requirements-project.md)**
   - Success Metrics and KPIs
   - Implementation Phases
   - Risks and Mitigations
   - Dependencies
   - Future Enhancements
   - **Audience**: Project managers, stakeholders

7. **[Technical Reference](./25-11-09-ai-requirements-reference.md)**
   - System Category Definitions
   - Tag Document Structure (subcollection + embedded)
   - Implementation File References
   - Change Log
   - **Audience**: Developers, technical writers

## Feature Overview

AI-powered extraction of document metadata fields (Document Date and Document Type) using Firebase AI Logic (Gemini 2.5 Flash Lite). The system analyzes document content and populates system category fields with confidence scoring.

### Current Implementation Status

**✅ Phases 1-3 Complete:**
- Manual analysis trigger via "Analyze Document" button
- Document Date extraction with confidence scoring
- Document Type classification with 3-tier hierarchy
- Hybrid tag storage (subcollection + embedded map)
- Confidence badges and alternative suggestions
- Auto-approval for ≥95% confidence

**🚧 Phase 4 In Progress:**
- Review Tab workflow (Accept/Reject actions)
- Badge counts and navigation
- Review queue management

## Three-Tab Architecture

1. **ℹ️ Metadata Tab**: Source file, storage, and embedded metadata
2. **🤖 AI Tab**: AI analysis results and configuration
3. **👤 Review Tab**: Dedicated workflow for reviewing AI extractions

## Related Documentation

- `docs/ai/aiAnalysis.md` - AI analysis system implementation details
- `docs/architecture/CategoryTags.md` - Tag system architecture
- `src/components/document/DocumentMetadataPanel.vue` - Metadata panel UI
- `planning/2. TODOs/2025-11-07-First-AI-analysis-dateNtype.md` - Implementation plan

## Key Concepts

- **95% Confidence Threshold**: AI suggestions ≥95% are auto-approved
- **Hybrid Storage**: Tags stored in both subcollection (full metadata) and embedded map (fast table loading)
- **3-Tier Type Hierarchy**: Matter-specific → Firm-wide → Global system categories
- **Review Workflow**: Low-confidence suggestions (<95%) flagged for human review

---

**Document Version**: 1.2
**Original File**: Decomposed from `ai-requirements.md` (1431 lines)
**Decomposition Date**: 2025-11-23
