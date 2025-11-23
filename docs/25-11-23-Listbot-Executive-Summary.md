What I am creating:
docs.ListBot.ca

EDRM litigation document management - Complete workflow from collection to trial presentation
AI-powered analysis - Gemini API for fact extraction, summarization, clustering
Hash-based deduplication - BLAKE3 automatic deduplication at database level
Flexible tagging system - 4 category types with hybrid storage
Tech Stack
Frontend: Vue 3 (Composition API) + Vuetify 3 + Tailwind CSS + Vite + Pinia + Vue Router 4 Backend: Firebase (Auth, Firestore, Storage, Functions) + Google Gemini API + File Search API Key Tools: BLAKE3 hashing, TanStack Virtual, PDF.js, Chart.js

Architecture Patterns
Solo Firm Architecture - firmId === userId for solo users, easy multi-user upgrade
Auth State Machine - Explicit states prevent Firebase race conditions
Hash-Based Deduplication - BLAKE3 hash as document ID (automatic DB-level dedup)
Hybrid Tag Storage - Subcollection (full metadata) + embedded map (fast rendering)
Web Worker Processing - Non-blocking file hashing
File Lifecycle
Detailed terminology: Original → Source → Upload → Batesed → Page → Redacted → Production

Features Implemented
Matter Management - Case organization with active context
File Upload - Drag-drop, folder support, 3-phase time estimation, deduplication
Document Table - Virtual scrolling, filtering, sorting, search
Category System - Date, Fixed List, Open List, Text Area types
Document Viewer - PDF.js integration with metadata display
AI Analysis - Date/type detection (partial implementation)
Features Planned (with Implementation Details)
EDRM Stages: Identify (custodians, ECA), Process (email threading), Analyze (timeline, clustering), Present (trial mode)
Pleadings Feature - AI fact extraction with semantic deduplication, version control
Facts Feature - Witness interview processing with hearsay tracking, RAG search
Email Threading - 40-74% time savings (highest ROI)
Advanced Analysis - Concept clustering, network analysis, sentiment analysis
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
Key Technical Decisions
Why Vue 3 Composition API, Firestore over SQL, hash-based deduplication, web workers, hybrid tag storage, Gemini over OpenAI - all with rationale.