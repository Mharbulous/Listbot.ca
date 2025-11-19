# Categories & Tags

Category system, tagging, tag storage patterns, and document organization.

## Available Documentation

@category-system-overview.md - Complete category and tag system architecture
- Hybrid storage (subcollection + embedded map)
- One tag per category enforcement
- System vs matter-specific categories
- Tag color computation (triadic pattern)
- Category types (Date, Fixed List, Open List, Text Area)

## Quick Reference

**For category architecture:** See @category-system-overview.md

## Key Category Concepts

**Hybrid Tag Storage**: Tags stored in BOTH locations with atomic batch writes:
- Subcollection: `/firms/{firmId}/evidence/{evidenceId}/tags/{categoryId}` (full metadata)
- Embedded map: `evidence.tags[categoryId]` (simplified for DocumentTable)

**One Tag Per Category**: Enforced through tagCategoryId as document ID.

**No Duplicate Colors**: Colors computed using triadic pattern based on category position.

**System Categories**: Pre-defined categories (DocumentDate, Privilege, Description, DocumentType, Author, Custodian) copied to each matter.

## Related Documentation

- Evidence schema: @docs/Features/Organizer/Data/evidence-schema.md
- Data structures: @docs/Data/data-structures.md
- AI analysis: @docs/Features/Organizer/AIAnalysis/CLAUDE.md
