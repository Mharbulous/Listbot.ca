# Firebase Storage

Firebase Storage structure, organization, and file storage patterns for the upload system.

## Available Documentation

@firebase-storage.md - Complete Firebase Storage structure documentation
- File storage paths with hash-based deduplication
- Processing folders (OCRed, Batesed, Pages, Redacted, Production)
- Storage efficiency patterns

@firebase-storage-plan.md - Firebase Storage planning and design decisions

## Quick Reference

**For storage structure:** See @firebase-storage.md
**For planning:** See @firebase-storage-plan.md

## Key Storage Concepts

**Hash-Based Paths**: Files stored at `/firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{extension}`

**Content Deduplication**: Identical files (same hash) stored only once, multiple metadata records can reference single storage file.

**Matter-Scoped**: Files organized under specific matters for access control.

**Processing Folders**: Reserved folders for OCRed, Batesed, Pages, Redacted, Production workflows.

## Related Documentation

- File lifecycle: @docs/Features/Upload/Processing/file-lifecycle.md
- Deduplication: @docs/Features/Upload/Deduplication/CLAUDE.md
- Data schema: @docs/Data/data-structures.md
