What I am creating:
ListBot

**Project**: ListBot - EDRM litigation document management system
**URL**: docs.ListBot.ca
**Dev Stage**: Pre-alpha (no legacy data, no migrations, iterative architecture)

Core Capabilities
EDRM litigation workflow - Collection → Preservation → Processing → Review → Analysis → Production → Presentation
AI-powered analysis - Gemini API for fact extraction, summarization, clustering
Dual-hash deduplication - BLAKE3 (file content, 32-char) + xxHash 64-bit (metadata, 16-char)
Flexible tagging - 4 category types (Date, Fixed List, Open List, Text Area) with hybrid storage
Matter-based organization - Solo Firm Architecture (firmId === userId)

Tech Stack
Frontend: Vue 3 (Composition API) + Vuetify 3 + Tailwind CSS + Vite + Pinia + Vue Router 4
Backend: Firebase (Auth, Firestore, Storage, Functions) + Google Gemini API + File Search API
Key Libraries: hash-wasm (BLAKE3), xxhash-wasm, TanStack Virtual, PDF.js, Chart.js

Architecture Patterns
Solo Firm Architecture - firmId === userId (enables future multi-user upgrade)
Auth State Machine - Explicit initialization prevents Firebase race conditions
Dual-Hash Deduplication:
  - BLAKE3 (128-bit/32-char): File content hash used as Firestore document ID
  - xxHash 64-bit (16-char): Metadata hash for duplicate/copy detection
  - Deduplication terminology: duplicate (skip upload) vs copy (upload metadata) vs redundant (cleanup phase) vs primary (best metadata)
Hybrid Tag Storage - Subcollection (full metadata) + embedded map (fast rendering)
Web Worker Processing - Non-blocking BLAKE3 hashing offloaded from main thread
File Lifecycle
Detailed terminology: Original → Source → Upload → Batesed → Page → Redacted → Production

Features: Three-Tier Status

Fully Implemented ✓
Matter Management - Case organization with active context, matter selection
File Upload (Legacy) - Drag-drop, folder support, 3-phase time estimation, deduplication
Document Table - Virtual scrolling (TanStack), filtering, sorting, search, batch operations
Category System - 4 types (Date, Fixed List, Open List, Text Area) with hybrid storage
Document Viewer - PDF.js integration with metadata display panel
Multi-App SSO - Shared Firebase Auth across ListBot/Intranet/Files subdomains

In Active Development 🚧
File Upload (/testing route) - New upload pipeline with enhanced deduplication
  - 48 files, 9,239 LOC (per docs/Features/Upload/testing-page-dependencies.md)
  - Features: Hash verification, metadata filtering, tentative verification, Stage 2 wrapper
  - Status: Functional but under active iteration
AI Analysis - Gemini API integration for document type/date detection (partial implementation)
Recent Refactoring - AppHeader fixes, PageLayout component, title-drawer DRY pattern

Planned/Stub Pages 📋
EDRM Stub Pages (12 views in src/views/stubs/):
  - Analysis, Cast, Collect, Facts, Identify, Law, Pleadings, Present, Preserve, Process, Produce, Theory
  - These are placeholder routes with planned features, not functional implementations

High-Value Planned Features:
  - Email Threading - 40-74% time savings (highest ROI feature) - See `@planning/1. PRDs/Email-Threading-PRD.md`
  - Pleadings - AI fact extraction with semantic deduplication, version control
  - Facts - Witness interview processing with hearsay tracking, RAG search
  - Advanced Analysis - Timeline visualization, concept clustering, network analysis, sentiment analysis
API Integration
Gemini API: Cost examples ($0.003/document), use cases, code samples
File Search API: RAG implementation, pricing (essentially free), example code
Cloud Functions: Triggers (onCreate, onCall), example implementations
Performance
Virtual scrolling (TanStack)
Firestore query optimization
AI result caching
Web worker offloading
Lazy loading
Security
Firebase Auth with multi-app SSO
Firestore Security Rules with examples
Data privacy considerations
API security patterns
Development
Local dev setup
Multi-app SSO testing
Testing strategy (Vitest)
Git workflow (two-branch model)
Recent Work Context (Nov 2025)
Recent PRs and commits focus on:
- PR #712: Reconciling performance analysis documentation with current codebase
- PR #711: Decomposing Matters.vue into focused modules (701→844 lines)
- PR #710: Adding development roadmap page at /dev/plan
- PR #701: AppHeader component fixes
- PR #700, #697-#699: PageLayout component refactoring, title-drawer DRY pattern
- PR #386: Fixed duplicate grouping with Stage 2 wrapper

Critical Non-Obvious Implementation Details
1. Deduplication Terminology (CRITICAL - must use precisely):
   - "duplicate": Same content + metadata, no informational value → skip upload + metadata
   - "copy": Same content, different metadata with informational value → skip upload, record metadata
   - "redundant": Hash-verified duplicates awaiting removal in next batch Stage 1 pre-filter
   - "primary/best": File with most meaningful metadata selected for upload to storage

2. Solo Firm Architecture:
   - firmId === userId for solo practitioners
   - All Firestore queries MUST scope by firmId
   - Design enables future multi-firm upgrade without data migration

3. Hash Usage Pattern:
   - BLAKE3 hash = Firestore document ID (ensures DB-level deduplication, no duplicates possible)
   - xxHash metadata hash = Distinguishes copies vs duplicates (same content, different metadata)
   - Files with unique sizes skip hashing entirely (performance optimization)

4. Auth State Machine:
   - MUST check authStore.isInitialized before authStore.isAuthenticated
   - Prevents Firebase race conditions in multi-app SSO environment

5. File Lifecycle Terminology (see docs/architecture/file-lifecycle.md):
   - Original → Source → Upload → Batesed → Page → Redacted → Production
   - Precise terms used throughout code, comments, and UI

Key Technical Decisions
Why Vue 3 Composition API, Firestore over SQL, hash-based deduplication, web workers, hybrid tag storage, Gemini over OpenAI - all with detailed rationale in docs/System/