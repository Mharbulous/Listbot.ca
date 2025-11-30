# AI Metadata Extraction - Business Requirements

**Part of**: [AI Requirements Overview](./25-11-09-ai-requirements.md)
**Last Updated**: 2025-11-09

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
