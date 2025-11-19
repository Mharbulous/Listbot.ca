# Document Organizer Feature

Document table, viewer, categories, tags, and AI analysis for organizing and managing uploaded files.

## Documentation Organization

### AI Analysis
@docs/Features/Organizer/AIAnalysis/CLAUDE.md - AI-powered document analysis and metadata extraction

### Categories & Tags
@docs/Features/Organizer/Categories/CLAUDE.md - Category system, tagging, and organization

### Data Schemas
@docs/Features/Organizer/Data/CLAUDE.md - Evidence schema, file metadata, and data structures

### Document Table
@docs/Features/Organizer/DocumentTable/CLAUDE.md - Document table architecture and implementation

## Quick Reference

**For category system:** See @docs/Features/Organizer/Categories/category-system-overview.md
**For file metadata:** See @docs/Features/Organizer/Data/file-metadata-schema.md
**For evidence schema:** See @docs/Features/Organizer/Data/evidence-schema.md
**For AI analysis:** See @docs/Features/Organizer/AIAnalysis/ai-analysis-overview.md
**For document table:** See @docs/Features/Organizer/DocumentTable/document-table-architecture.md

## Key Organizer Concepts

**Hybrid Tag Storage**: Tags stored in BOTH subcollection (full metadata) AND embedded map (DocumentTable performance) with atomic batch writes.

**One Tag Per Category**: Enforced through tagCategoryId as document ID - prevents duplicate tags.

**Category Types**: Date, Fixed List, Open List, Text Area - each with specific behavior patterns.

**System Categories**: Pre-defined categories (DocumentDate, Privilege, Description, etc.) copied to each matter.

## Related Documentation

- Upload system: @docs/Features/Upload/CLAUDE.md
- Data structures: @docs/Data/data-structures.md
- Matter organization: @docs/Features/Matters/CLAUDE.md
