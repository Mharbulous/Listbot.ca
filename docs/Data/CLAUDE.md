# Data & Schema Documentation

Firestore collections, data structures, security rules, and query patterns for the ListBot application.

## Available Documentation

@data-structures.md - Central hub for Firestore data structure (firms, users, matters, files, categories)
- Pointers to specialized schema documentation
- Query patterns and index requirements
- Solo firm architecture

### Security
@docs/Data/Security/CLAUDE.md - Firestore security rules and access patterns

## Quick Reference

**For Firestore schema:** See @data-structures.md for central hub and pointers to specialized docs
**For security rules:** See @docs/Data/Security/firestore-security-rules.md
**For file metadata schema:** See @docs/Features/Organizer/Data/file-metadata-schema.md
**For category system:** See @docs/Features/Organizer/Categories/category-system-overview.md

## Key Concepts

**Solo Firm Architecture**: All data scoped by firmId, where firmId === userId for solo users. Provides consistent storage patterns across all collections.

**Role-Based Permissions**: All apps share the same permission model defined in Firestore security rules.

**No Denormalization**: Firms are small (3-10 members max), so no need for complex denormalization patterns.

## Related Documentation

- Upload data schemas: @docs/Features/Upload/CLAUDE.md
- Organizer data schemas: @docs/Features/Organizer/Data/CLAUDE.md
- System architecture: @docs/System/Architecture/overview.md
