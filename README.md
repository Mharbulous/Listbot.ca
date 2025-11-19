# ListBot

Vue 3 + Vuetify 3 + Vite + Firebase + Pinia + Tailwind + Vitest

Part of a multi-app SSO architecture with file upload/processing.

## Critical: Know Before You Code

1. **Pre-Alpha Stage**: NO user data exists. NO migrations needed. Firestore/Storage can be wiped anytime. Focus on optimal architecture, not backward compatibility.

2. **Multi-App SSO**: Shares Firebase Auth with Intranet and Coryphaeus apps. **Never change Firebase config without coordinating across all apps.**

3. **Terminology is Enforced**: File lifecycle uses specific terms (Original, Source, Upload, Batesed, etc.). See `docs/architecture/file-lifecycle.md` before coding file features.

4. **Auth State Machine**: Always check `authStore.isInitialized` before `authStore.isAuthenticated`. See `docs/architecture/authentication.md`.

5. **Solo Firm Architecture**: All data scoped by `firmId`. For solo users: `firmId === userId` (always).

6. **Tests Location**: All Vitest tests go in `/tests` folder (not alongside source).

7. **Two-Branch Model**: All PRs/merges go to `main` (because Claude Code on the Web can only merge with Main branch). The `production` branch is manually promoted from `main` - never commit or PR to it. See `docs/hosting/2025-11-16-Promotion.md`.

## Documentation

**CLAUDE.md Indexed Feature-Module Structure**: Documentation is organized by business features/modules, mirroring the codebase structure. Each major folder contains a `CLAUDE.md` index file that points to detailed documentation within that module.

### Start Here
- **Root**: `/CLAUDE.md` - High-level directives and documentation index
- **System-Wide**: `@docs/System/CLAUDE.md` - Architecture, stack, conventions, shared components
- **Features** (organized as vertical slices):
  - `@docs/Features/Authentication/CLAUDE.md` - Multi-app SSO, auth state machine, security
  - `@docs/Features/Upload/CLAUDE.md` - File upload, processing, deduplication, workers
  - `@docs/Features/Organizer/CLAUDE.md` - Document table, viewer, categories, AI analysis
  - `@docs/Features/Matters/CLAUDE.md` - Matter/case management
  - `@docs/Features/Profile/CLAUDE.md` - User profile and settings
- **Cross-Feature**:
  - `@docs/Data/CLAUDE.md` - Firestore schema, security rules, query patterns
  - `@docs/Testing/CLAUDE.md` - Testing strategy, Vitest setup, test patterns
  - `@docs/DevOps/CLAUDE.md` - Local development, SSO setup, deployment

### Philosophy
Each feature module contains **all** documentation for that feature (UI, logic, state, data) as a vertical slice, making it easy to find everything related to a specific feature in one place. This structure mirrors `src/features/` for intuitive navigation.

For more details, see:
- `@docs/System/Documentation/documentation-hierarchy.md` - Organization philosophy
- `@docs/System/Documentation/documentation-structure.md` - Visual structure diagrams
