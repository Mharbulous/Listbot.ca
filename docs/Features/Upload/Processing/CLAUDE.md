# File Processing

File processing pipeline, lifecycle terminology, workflow orchestration, and performance analysis.

## Available Documentation

@file-lifecycle.md - **CRITICAL** file terminology definitions
- Original, Source, Upload, Batesed, Page, Redacted, Production, Storage, Document
- Usage guidelines and examples
- Terminology enforcement rules

@file-processing.md - File processing workflow and orchestration

@document-processing-workflow.md - Document processing pipeline details

@performance-analysis-summary.md - Performance analysis summary

@performance-analysis-abridged.md - Abridged performance analysis

## Quick Reference

**For file terminology:** See @file-lifecycle.md (CRITICAL - must read for any upload work)
**For processing workflow:** See @file-processing.md
**For performance:** See @performance-analysis-summary.md

## Critical File Terminology

This folder contains THE definitive source for file lifecycle terminology. All code, comments, UI text, and documentation MUST use these precise terms:

- **Original**: Real-world evidence (paper or digital)
- **Source**: Digital file on user's device before upload
- **Upload**: File in Firebase Storage ../uploads folder
- **Batesed**: PDF-converted, bates-stamped file
- **Page**: Single-page PDF for duplicate analysis
- **Redacted**: Redacted file for production
- **Production**: Final approved documents
- **Storage**: General term for all Firebase Storage files
- **Document**: General term for all versions of evidence

## Related Documentation

- Deduplication: @docs/Features/Upload/Deduplication/CLAUDE.md
- Storage: @docs/Features/Upload/Storage/CLAUDE.md
- System architecture: @docs/System/Architecture/overview.md
