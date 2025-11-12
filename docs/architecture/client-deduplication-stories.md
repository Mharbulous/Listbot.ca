# Client-Side Deduplication: User Stories

This document contains all user stories and implementation requirements for the client-side deduplication feature.

---

## Related Documentation

This document is part of a three-document set for deduplication:

1. **`@docs/architecture/client-deduplication-logic.md`**
   - Architectural rationale and design philosophy
   - Detailed implementation guide with code examples
   - Performance optimization strategies
   - **Read this first** to understand WHY each requirement exists

2. **This document (`client-deduplication-stories.md`)**
   - User stories and implementation requirements
   - Complete checklist of features to implement
   - Anti-requirements (what NOT to do)

3. **`@planning/2. TODOs/New_Upload_Queue/2025-11-10-Phase3-DuplicateManagement.md`**
   - Implementation planning for Phase 3
   - Task breakdown and timeline
   - Testing scenarios

**Also see:** `@docs/architecture/file-lifecycle.md` for definitive file terminology.

---

## Implementation Checklist

To enhance the UI without breaking the architecture:

### Status & Display
- [ ] **Update status names**: `pending`, `ready`, `copy`, `uploading`, `uploaded`, `read error`, `failed`
- [ ] **Add visual indicators** (icons, colors) for different statuses
- [ ] **Add progress callback** during client-side hashing phase
- [ ] **Display "one-and-the-same" detection** when same file selected multiple times (silently filtered)
- [ ] **Show "copy detected" indicators** with explanation

### User Interface
- [ ] **Sort queue by folder path** (not by size) when files are added for better UX
- [ ] **Create preview modal** to show deduplication summary before upload
- [ ] **Create completion modal** to show metrics after upload
- [ ] **Disable ALL checkboxes during upload phase** to prevent unpredictable behavior
- [ ] **Disable checkbox for `read error` status** (same as .lnk files)

### Metrics & Feedback
- [ ] **Add deduplication metrics** display during and after upload
- [ ] **Display storage saved** calculations
- [ ] **Show upload progress** with current file and percentage

### Error Handling
- [ ] **Implement `read error` status** for hash failures with disabled checkbox
- [ ] **Implement `failed` status** for upload errors
- [ ] **Continue processing** other files when one fails

### DO NOT (Anti-Requirements)
- ❌ Add user override of deduplication decisions (users CAN exclude files from queue, but CANNOT cherry-pick which copy/duplicate to upload)
- ❌ Query database before upload phase
- ❌ Hash files before user clicks upload button
- ❌ Allow suppressing metadata from any copy
- ❌ Change priority rules without documenting rationale
- ❌ Move expensive operations out of upload phase
- ❌ Sort queue by file size (provides no performance benefit, adds O(n log n) overhead)

---

## Related Documentation

For architectural context and implementation details, see:
- `@docs/architecture/client-deduplication-logic.md` - Architecture rationale and detailed implementation guide
- `@docs/architecture/file-lifecycle.md` - File terminology and lifecycle
- `@docs/architecture/file-processing.md` - File processing and deduplication strategy
