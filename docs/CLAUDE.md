# ListBot Documentation

Complete technical documentation for the ListBot file management and document organization application.

## Documentation Organization

This documentation follows a feature-module structure where each major area has its own folder with detailed documentation organized by domain.

### System-Wide Documentation
@docs/System/CLAUDE.md - Architecture, tech stack, conventions, and shared patterns

### Feature Documentation
@docs/Features/CLAUDE.md - All application features organized by domain

### Data & Schema
@docs/Data/CLAUDE.md - Firestore collections, security rules, and data architecture

### Development & Operations
@docs/DevOps/CLAUDE.md - Firebase setup, deployment, hosting, and local development

### Testing
@docs/Testing/CLAUDE.md - Test suites, testing strategy, and Vitest configuration

### Technical Debt & Planning
@docs/TechnicalDebt/CLAUDE.md - Known issues and improvement backlog

### Miscellaneous
@docs/Miscellaneous/CLAUDE.md - Folder structure analysis and cross-cutting documentation

## Quick Navigation

**For new developers:**
- Start with @docs/System/Architecture/overview.md for high-level architecture
- Then see @docs/Features/Upload/CLAUDE.md for the core file upload system
- Review @docs/Features/Authentication/auth-state-machine.md for auth patterns

**For authentication work:**
- See @docs/Features/Authentication/CLAUDE.md for auth state machine and SSO setup

**For file upload and processing:**
- See @docs/Features/Upload/CLAUDE.md for complete upload system documentation
- File terminology: @docs/Features/Upload/Processing/file-lifecycle.md
- Deduplication: @docs/Features/Upload/Deduplication/CLAUDE.md

**For Firestore schema and queries:**
- See @docs/Data/CLAUDE.md for all data structure documentation

**For deployment and hosting:**
- See @docs/DevOps/CLAUDE.md for Firebase configuration and promotion workflow

**For testing:**
- See @docs/Testing/vitest-test-suites.md for test suite registry

## Documentation Files in Root

@FAQ.md - Frequently asked questions about the project
@doc-index.md - Guide for the /doc-index command used to generate these CLAUDE.md files

## Key Architectural Concepts

**Solo Firm Architecture**: Every user has a firmId that equals their userId, providing consistent data patterns throughout the application with seamless upgrade path to multi-user firms.

**Auth State Machine**: Explicit state tracking (uninitialized → initializing → authenticated/unauthenticated) prevents Firebase Auth timing issues.

**Hash-Based Deduplication**: Files are deduplicated using BLAKE3 hashes, with the hash serving as the Firestore document ID for automatic database-level deduplication.

**Web Worker Processing**: CPU-intensive operations (file hashing) run in web workers to prevent UI blocking.

**Feature-Module Documentation**: All documentation for a feature (UI, logic, state, data) is grouped together in that feature's folder for easy discovery.
