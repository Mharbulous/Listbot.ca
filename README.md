# Bookkeeper

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

**Hub and Spoke Model**: `CLAUDE.md` is the hub - start there for development directives, workflow, and pointers to all detailed documentation. Detailed docs in `/docs` are the spokes, referenced from `CLAUDE.md` as needed.

CLAUDE.md (HUB)
│
├── docs/architecture/

│   ├── overview.md ✓

│   ├── authentication.md ✓

│   ├── file-lifecycle.md ✓

│   └── file-processing.md ✓

│

├── docs/front-end/

│   └── DocumentTable.md ✓

│
├── docs/testing/

│   └── performance-analysis.md ✗ (MISSING - referenced but not found)

│
├── docs/

│   └── 2025-11-10-New-Upload-Page.md ✓

│
└── src/dev-demos/
    └── README.md ✓
