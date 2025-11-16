# Bookkeeper

Vue 3 bookkeeping app with file upload/processing. Part of a multi-app SSO architecture.

## Critical: Know Before You Code

1. **Pre-Alpha Stage**: NO user data exists. NO migrations needed. Firestore/Storage can be wiped anytime. Focus on optimal architecture, not backward compatibility.

2. **Multi-App SSO**: Shares Firebase Auth with Intranet and Coryphaeus apps. **Never change Firebase config without coordinating across all apps.**

3. **Terminology is Enforced**: File lifecycle uses specific terms (Original, Source, Upload, Batesed, etc.). See `docs/architecture/file-lifecycle.md` before coding file features.

4. **Auth State Machine**: Always check `authStore.isInitialized` before `authStore.isAuthenticated`. See `docs/architecture/authentication.md`.

5. **Solo Firm Architecture**: All data scoped by `firmId`. For solo users: `firmId === userId` (always).

6. **Tests Location**: All Vitest tests go in `/tests` folder (not alongside source).

## Quick Start

```bash
npm install
npm run dev          # localhost:5173
```

**Working on auth/SSO?** Use:
```bash
npm run dev:bookkeeping  # bookkeeping.localhost:3001
```

## Before You Commit

```bash
npm run lint
npm run test:run
npm run build
```

## Documentation

- **Start here**: `CLAUDE.md` - Development directives and workflow
- **Architecture**: `docs/architecture/` - Auth, file lifecycle, processing
- **Component docs**: `docs/front-end/` - DocumentTable, layouts, views

## Tech Stack

Vue 3 + Vuetify 3 + Vite + Firebase + Pinia + Tailwind + Vitest
