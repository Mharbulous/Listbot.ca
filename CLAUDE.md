# CLAUDE.md - Bookkeeper App

This file provides high-level directives for working on the Bookkeeper repository.
This file is **lean by design**. Detailed documentation is in the `/docs` directory.

## 1. CRITICAL: Core Directives

**You MUST follow these rules at all times.**

1.  **AGENT: Linting:** You MUST delegate all linting and code beautification to the `beautifier` agent.
    - _Example_: "Task: Use the `beautifier` agent to fix linting in `src/views/FileUpload.vue`."
2.  **DEV STAGE: Early (No Legacy)**
    - Development is in a pre-alpha stage.
    - **There is NO existing user data.**
    - You MUST NOT write migration scripts.
    - You MUST implement schema changes or refactors _directly_.
    - Firestore and Storage can be wiped clean at any time. Focus on the _optimal_ architecture, not backward compatibility.
3.  **TERMINOLOGY:** The file processing lifecycle has very specific terminology (Original, Source, Upload, Batesed, etc.). You MUST consult `@docs/architecture/file-lifecycle.md` to ensure you use this terminology correctly in all code, comments, and UI text.
4.  **TESTS:** All Vitest unit/component tests MUST be located in the `/tests` folder.

---

## 2. Project Overview & Tech Stack

- **Project**: **Bookkeeper** - A Vue 3 bookkeeping app with file upload/processing.
- **Architecture**: Part of a multi-app SSO architecture sharing Firebase Auth.
- **Frontend**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Framework**: Vuetify 3
- **State Management**: Pinia
- **Routing**: Vue Router 4 (hash-based)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Tailwind CSS
- **Testing**: Vitest

---

## 3. Essential Commands

### Standard Dev Server

- **Run server at**: `http://localhost:5173/`

### Multi-App SSO Testing (Use these for auth work)

- `npm run dev:intranet` (intranet.localhost:3000)
- `npm run dev:bookkeeping` (bookkeeping.localhost:3001)
- `npm run dev:files` (files.localhost:3002)

### Pre-Commit (Do NOT run unless requested)

1.  `npm run lint` (Or delegate to `beautifier` agent)
2.  `npm run test:run`
3.  `npm run build`

---

## 4. Documentation & Architecture (@-Imports)

This `CLAUDE.md` is lean. You MUST reference the files below using `@path/to/file` when you need detailed context on architecture or implementation.

- `@docs/architecture/overview.md`
  - High-level component architecture (Layouts, Views, Base vs. Feature).
  - High-level data flow patterns.
- `@docs/architecture/authentication.md`
  - **CRITICAL**: The full "Auth State Machine" logic (`uninitialized` -> `initializing` -> ...).
  - **CRITICAL**: The "Solo Firm" architecture (`firmId === userId`).
  - Route guards and Pinia store integration.
- `@docs/architecture/file-lifecycle.md`
  - **CRITICAL**: The definitive guide to all file terminology (Original, Source, Upload, Batesed, Page, Redacted, Production, Storage).
  - **You MUST use this exact terminology.**
- `@docs/architecture/file-processing.md`
  - The 3-phase hardware-calibrated time estimation formulas.
  - Deduplication strategy (size-pre-filter, BLAKE3 hash as ID).
  - Path parsing optimization logic.
  - Hardware performance calibration (H-Factor system).
- `@src/dev-demos/README.md`
  - Overview of the demo system, routes (`/dev/*`), and components.
- `@docs/testing/performance-analysis.md`
  - Instructions for performance data collection (`parse_console_log.py`).
  - Details on the H-Factor (Hardware Calibration) system.
- `@docs/front-end/DocumentTable.md`
  - DocumentTable architecture and the 4 column data sources (Built-in, System, Firm, Matter categories).

---

## 5. Key Implementation Concepts (High-Level)

This is a brief overview of core concepts. For details, see the `@docs` above.

- **Auth State Machine**: Always check `authStore.isInitialized` before `authStore.isAuthenticated`. The system uses an explicit state machine to prevent Firebase race conditions.
- **"Solo Firm" Architecture**: All data is scoped by a `firmId`. For solo users, the `firmId` is **always** equal to the `userId`. This is a fundamental data model rule.
- **Web Worker Hashing**: File hashing (BLAKE3) is CPU-intensive and MUST run in a web worker (`@/workers/fileHashWorker.js`) to avoid blocking the UI.
- **Hash-Based Deduplication**: Files are deduplicated.
  1.  Files with unique sizes _skip_ hashing.
  2.  Only files with matching sizes are hashed.
  3.  The final BLAKE3 hash is used as the document ID in Firestore, providing automatic, database-level deduplication.
- **Multi-App SSO**: All apps (Bookkeeper, Intranet, Files) share a **single, identical Firebase project config** to enable seamless SSO.
