# File Upload & Processing Feature

Complete file upload system including deduplication, processing pipeline, storage management, and web worker coordination.

## Documentation Organization

### Deduplication
@docs/Features/Upload/Deduplication/CLAUDE.md - Client-side and server-side file deduplication logic

### Processing
@docs/Features/Upload/Processing/CLAUDE.md - File processing pipeline, lifecycle, and workflow

### Storage
@docs/Features/Upload/Storage/CLAUDE.md - Firebase Storage structure and organization

## Direct Documentation Files

@new-upload-page-testing-route.md - Testing route setup for new upload page
@old-upload-page.md - Legacy upload page documentation
@testing-page-dependencies.md - Upload page testing dependencies

## Quick Reference

**For file terminology:** See @docs/Features/Upload/Processing/file-lifecycle.md (CRITICAL - defines Original, Source, Upload, Batesed, etc.)
**For deduplication logic:** See @docs/Features/Upload/Deduplication/client-deduplication-logic.md
**For file processing:** See @docs/Features/Upload/Processing/file-processing.md
**For storage structure:** See @docs/Features/Upload/Storage/firebase-storage.md

## Key Upload System Concepts

**Hash-Based Deduplication**: Files deduplicated using BLAKE3 hashes. Hash serves as Firestore document ID for automatic database-level deduplication.

**Two-Phase Deduplication**:
- Phase 1: Client-side (instant feedback, group by size, hash only duplicates)
- Phase 2: Upload with hash verification (during upload, database queries)

**Web Worker Hashing**: CPU-intensive BLAKE3 hashing runs in web worker (@/workers/fileHashWorker.js) to prevent UI blocking.

**File Lifecycle**: Precise terminology (Original → Source → Upload → Batesed → Page → Redacted → Production) - see Processing/file-lifecycle.md.

## Related Documentation

- System architecture: @docs/System/Architecture/overview.md
- Data schema: @docs/Data/data-structures.md
- Testing: @docs/Testing/vitest-test-suites.md (Memory leak prevention tests)
- Organizer: @docs/Features/Organizer/CLAUDE.md (document organization after upload)
