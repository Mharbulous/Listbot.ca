# Features Documentation

All application features organized by domain. Each feature folder contains complete documentation for that feature including UI, logic, state management, and data schemas.

## Feature Modules

### Authentication
@docs/Features/Authentication/CLAUDE.md - Multi-app SSO, auth state machine, Firebase Auth integration

### File Upload & Processing
@docs/Features/Upload/CLAUDE.md - File upload, deduplication, processing pipeline, storage management

### Document Organizer
@docs/Features/Organizer/CLAUDE.md - Document table, viewer, categories, tags, AI analysis

### Matters & Cases
@docs/Features/Matters/CLAUDE.md - Matter management, client workflows, firm structure

### User Profile
@docs/Features/Profile/CLAUDE.md - User settings and profile management

## Quick Reference

**For authentication issues:** See @docs/Features/Authentication/auth-state-machine.md
**For file upload:** See @docs/Features/Upload/CLAUDE.md
**For file terminology:** See @docs/Features/Upload/Processing/file-lifecycle.md
**For deduplication:** See @docs/Features/Upload/Deduplication/client-deduplication-logic.md
**For document organization:** See @docs/Features/Organizer/CLAUDE.md
**For solo firm architecture:** See @docs/Features/Matters/solo-firm-matters.md

## Related Documentation

- System architecture: @docs/System/Architecture/overview.md
- Data schemas: @docs/Data/CLAUDE.md
- Testing: @docs/Testing/CLAUDE.md
