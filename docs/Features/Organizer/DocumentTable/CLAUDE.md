# Document Table

Document table architecture, implementation, and performance optimization patterns.

## Available Documentation

@document-table-architecture.md - Complete document table architecture
- Table structure and layout
- Performance optimization
- Tag rendering from embedded map
- Query patterns

## Quick Reference

**For table architecture:** See @document-table-architecture.md

## Key Document Table Concepts

**Embedded Map Performance**: Uses `evidence.tags[categoryId]` embedded map for fast rendering without subcollection queries.

**Hybrid Tag Integration**: Displays tags from embedded map, full metadata available in subcollection when needed.

## Related Documentation

- Categories: @docs/Features/Organizer/Categories/category-system-overview.md
- Evidence schema: @docs/Features/Organizer/Data/evidence-schema.md
- System architecture: @docs/System/Architecture/overview.md
