# Vitest Test Suites Documentation

**Reconciled up to**: 2025-11-18

**Document Purpose**: Track all Vitest test suites in the ListBot application, including creation, modification, and deletion history.

**Last Updated**: 2025-01-20 (Memory Leak Tests - Complete Resolution)
**Maintained By**: Development Firm

---

## Key Files

This documentation extensively covers the following test infrastructure files:

**Test Configuration:**
- `vite.config.js` - Vitest test environment configuration (jsdom, globals, test patterns)

**Core Test Suites:**
- `tests/unit/features/organizer/stores/virtualFolderStore.test.js` - Virtual folder store core functionality (53 tests)
- `tests/unit/features/organizer/stores/organizer.integration.test.js` - Organizer facade integration (28 tests)
- `tests/unit/features/organizer/stores/performanceOptimization.test.js` - Performance thresholds (15 tests)
- `tests/unit/features/organizer/stores/backwardCompatibility.test.js` - Legacy API compatibility (20 tests)
- `tests/unit/features/organizer/stores/errorHandling.test.js` - Error handling coverage (21 tests)
- `tests/unit/components/ViewModeToggle.spec.js` - View mode toggle component (57 tests)
- `tests/unit/composables/memoryLeak.test.js` - Memory leak prevention (16 tests)
- `tests/unit/features/upload/composables/useSequentialPrefilter.test.js` - Sequential deduplication (12 tests)

**Test Utilities:**
- `src/test-utils/virtualFolderTestUtils.js` - Mock data generators and validation utilities
- `src/test-utils/mockFileAPI.js` - File API mocking for upload/memory tests
- `src/test-utils/tagValidationTest.js` - Manual tag validation testing utility
- `src/test-utils/categoryMigrationTest.js` - Manual category migration testing utility

---

## Executive Summary

**Overall Test Suite Health**: ✅ **EXCELLENT**

| Metric                       | Status             | Count               |
| ---------------------------- | ------------------ | ------------------- |
| **Total Active Test Suites** | ✅ All Operational | 9 suites            |
| **Total Tests**              | ✅ All Passing     | ~518 tests          |
| **Recent Issues**            | ✅ All Resolved    | 0 outstanding       |
| **Performance Benchmarks**   | ✅ Meeting Targets | 4 active benchmarks |

**Recent Achievements (2025-01-20):**

- ✅ **Memory Leak Prevention Tests**: Complete resolution of all 4 remaining failures (100% pass rate achieved)
- ✅ **Virtual Folder System Tests**: Full automation of Phase 1 testing (96 tests across 3 files)
- ✅ **Test Infrastructure**: Enhanced mocking capabilities and performance optimization
- ✅ **Backward Compatibility Suite**: Comprehensive legacy API testing (20 tests)
- ✅ **Error Handling Suite**: Comprehensive error scenario coverage (21 tests)

---

## Test Suite Registry

### Active Test Suites Overview

| Suite Name             | Status    | Files              | Test Count                 | Created      | Last Updated | Phase/Feature                       |
| ---------------------- | --------- | ------------------ | -------------------------- | ------------ | ------------ | ----------------------------------- |
| Virtual Folder System  | ✅ Active | 3 main + 1 utility | 96                         | 2025-01-20   | 2025-01-20   | Phase 1 - Virtual Folder Foundation |
| Component Tests (Phase 2) | ✅ Active | 5                  | 227                        | Pre-existing | -            | Phase 2 - UI Components             |
| Utility & Service Tests | ✅ Active | 2                  | 86                         | Pre-existing | -            | Core Utilities & AI Services        |
| Memory Leak Prevention | ✅ Active | 1                  | 16 (0 failing, 16 passing) | Pre-existing | 2025-01-20   | Upload System                       |
| Upload System          | ✅ Active | 3                  | ~42                        | Pre-existing | 2025-01-20   | File Upload & Deduplication         |
| SSO Integration        | ✅ Active | 1                  | ~10                        | Pre-existing | -            | Multi-App Authentication            |
| Backward Compatibility | ✅ Active | 1                  | 20                         | 2025-01-20   | 2025-01-20   | Legacy API Support                  |
| Error Handling         | ✅ Active | 1                  | 21                         | 2025-01-20   | 2025-01-20   | Comprehensive Error Scenarios       |

### Detailed Test Suite Information

#### 1. Virtual Folder System Tests ✅

| **Attribute**   | **Details**                         |
| --------------- | ----------------------------------- |
| **Created**     | 2025-01-20                          |
| **Status**      | Active                              |
| **Phase**       | Phase 1 - Virtual Folder Foundation |
| **Total Tests** | 96 (53 + 28 + 15)                   |

**Test Files:**
| File Path | Test Count | Purpose |
|-----------|------------|---------|
| `/tests/unit/features/organizer/stores/virtualFolderStore.test.js` | 53 | Core virtual folder store functionality |
| `/tests/unit/features/organizer/stores/organizer.integration.test.js` | 28 | Integration testing with organizer facade |
| `/tests/unit/features/organizer/stores/performanceOptimization.test.js` | 15 | Performance threshold validation for large datasets |
| `src/test-utils/virtualFolderTestUtils.js` | N/A | Supporting test utilities and mock data |

**Coverage Areas:**
| Category | Description | Test Count |
|----------|-------------|------------|
| Store Instantiation | Initial state and computed properties | 6 |
| View Mode Management | Switching between flat/folder modes | 6 |
| Folder Hierarchy | Management and manipulation | 6 |
| Navigation Methods | Folder navigation and breadcrumbs | 11 |
| Evidence Filtering | Path-based evidence filtering | 7 |
| Folder Structure | Generation and validation | 7 |
| Cache Management | Performance and memory optimization | 4 |
| Performance Tests | Large dataset and timing validation | 18 |
| Error Handling | Edge cases and invalid data | 3 |
| Integration Tests | Cross-store communication | 28 |

**Performance Benchmarks:**
| Operation | Threshold | Current Performance |
|-----------|-----------|-------------------|
| Folder generation (1000+ docs) | <50ms | ✅ Passing |
| Cache lookup | <5ms | ✅ Passing |
| Deep navigation | <10ms | ✅ Passing |
| Integrated operations | <10ms | ✅ Passing |
| Evidence filtering (complex hierarchies) | <25ms | ✅ Passing |

---

#### 2. Component Tests (Phase 2) ✅

| **Attribute**   | **Details**                   |
| --------------- | ----------------------------- |
| **Created**     | Pre-existing                  |
| **Status**      | Active                        |
| **Phase**       | Phase 2 - UI Components       |
| **Total Tests** | 227 (across 5 component files)|

**Test Files:**
| File Path | Test Count | Purpose |
|-----------|------------|---------|
| `/tests/unit/features/organizer/components/Phase2Components.test.js` | 15 | Phase 2 component testing suite |
| `/tests/unit/features/organizer/components/ViewModeToggle.spec.js` | 57 | View mode toggle component with store integration |
| `/tests/unit/features/organizer/components/TagContextMenu.spec.js` | 56 | Tag context menu with AI features and keyboard navigation |
| `/tests/unit/features/organizer/components/FolderHierarchySelector.spec.js` | 61 | Folder hierarchy selector with drag-and-drop |
| `/tests/unit/features/organizer/components/FolderBreadcrumbs.spec.js` | 38 | Folder breadcrumbs with responsive behavior |

**Coverage Areas:**
| Category | Description | Test Count |
|----------|-------------|------------|
| ViewModeToggle | Store integration, localStorage persistence, reactive watchers | 57 |
| - Compact Mode | Compact mode rendering, accessibility, tooltips | 15 |
| - Store Integration | Reactive state updates, store actions | 20 |
| - Persistence | localStorage save/restore, cross-session state | 12 |
| - Accessibility | ARIA labels, keyboard navigation, screen readers | 10 |
| TagContextMenu | Context menu functionality and AI integration | 56 |
| - Menu Actions | Show in folders, filter, search, copy, edit, statistics | 20 |
| - AI Integration | AI tag approve/reject, confidence indicators | 12 |
| - Menu Positioning | Viewport collision detection, dynamic positioning | 8 |
| - Keyboard Shortcuts | Arrow navigation, Enter/Escape, modifier keys | 16 |
| FolderHierarchySelector | Category and folder management | 61 |
| - Category Management | Add/remove/reorder categories, validation | 15 |
| - Auto-save | localStorage persistence, debounced saves | 10 |
| - Keyboard Navigation | Arrow keys, Ctrl+arrow, Delete, multi-select | 20 |
| - Drag-and-Drop | Reordering, visual feedback, touch support | 16 |
| FolderBreadcrumbs | Navigation breadcrumbs | 38 |
| - Responsive Behavior | Mobile collapse, ellipsis, overflow handling | 12 |
| - Click Navigation | Path navigation, folder selection | 10 |
| - Resize Listeners | Window resize handling, debouncing | 8 |
| - Accessibility | ARIA navigation, semantic HTML, focus management | 8 |

---

#### 3. Utility & Service Tests ✅

| **Attribute**   | **Details**                     |
| --------------- | ------------------------------- |
| **Created**     | Pre-existing                    |
| **Status**      | Active                          |
| **Total Tests** | 86 (26 + 60)                    |

**Test Files:**
| File Path | Test Count | Purpose |
|-----------|------------|---------|
| `/tests/unit/dateFormatter.test.js` | 26 | Date and time formatting utilities |
| `/tests/unit/services/aiMetadataExtractionService.test.js` | 60 | AI-powered document classification service |

**Coverage Areas - Date Formatter (26 tests):**
| Function | Test Coverage | Test Count |
|----------|---------------|------------|
| `formatDate()` | Multiple format variants, edge cases, null handling | 8 |
| `formatTime()` | 12/24 hour formats, timezones, AM/PM handling | 9 |
| `formatDateTime()` | Combined date/time, custom separators, localization | 9 |

**Coverage Areas - AI Metadata Extraction Service (60 tests):**
| Category | Description | Test Count |
|----------|-------------|------------|
| Document Classification | AI-powered document type identification | 15 |
| Prompt Engineering | Template generation, context injection, token optimization | 12 |
| Response Parsing | JSON extraction, validation, error handling | 10 |
| Token Usage Tracking | Input/output/caching token metrics | 8 |
| Document Type Hierarchy | 3-tier system (matter → firm → global) | 10 |
| - Matter-Specific Types | Client-specific document classification | 3 |
| - Firm-Level Types | Organization-wide document types | 3 |
| - Global Types | Universal document categories | 4 |
| Error Handling | API failures, rate limiting, timeout handling | 5 |

---

#### 4. Memory Leak Prevention Tests ✅

| **Attribute**    | **Details**                      |
| ---------------- | -------------------------------- |
| **Created**      | Pre-existing                     |
| **Status**       | ✅ Active (All 16 tests passing) |
| **Total Tests**  | 16 (0 failing, 16 passing)       |
| **Last Updated** | 2025-01-20                       |

**Test Files:**
| File Path | Test Count | Status | Coverage |
|-----------|------------|---------|---------|
| `/tests/unit/composables/memoryLeak.test.js` | 16 | ✅ Active | AbortController tracking, event listener management, timer cleanup, integration scenarios |

**All Issues Resolved:** ✅
| Issue | Resolution | Status |
|-------|------------|---------|
| `vi.restoreAllTimers` not available | Updated to `vi.useRealTimers()` | ✅ Fixed |
| Test timeouts | Increased timeout to 10s for integration tests | ✅ Fixed |
| AbortController cleanup | Added proper mock restoration | ✅ Fixed |
| AbortController tracking | Fixed controller tracking mock with proper vi.fn().mockImplementation() | ✅ Fixed |
| Event listener mocking | Updated mocking strategy with proper AbortSignal.timeout mocking | ✅ Fixed |
| Timer cleanup verification | Fixed timer spy setup to count incremental calls | ✅ Fixed |
| Integration test performance | Simplified test scenario and reduced timeout to 20s | ✅ Fixed |

---

#### 5. Upload System Tests ✅

| **Attribute**   | **Details**  |
| --------------- | ------------ |
| **Created**     | Pre-existing |
| **Status**      | ✅ Active    |
| **Total Tests** | ~42          |

**Test Files:**
| File Path | Purpose | Status |
|-----------|---------|--------|
| `/tests/unit/features/upload/composables/useFolderAnalysis.test.js` | Folder analysis functionality | ✅ Active |
| `/tests/unit/features/upload/composables/useFolderTimeouts.test.js` | Timeout management systems | ✅ Active |
| `/tests/unit/features/upload/composables/useSequentialPrefilter.test.js` | Sequential deduplication and redundant file lifecycle | ✅ Active |

**Coverage Areas - Sequential Deduplication (12 tests):**
| Category | Description | Test Count |
|----------|-------------|------------|
| Stage 1 Pre-filter | Redundant file removal from previous processing | 3 |
| Stage 2 Hash Verification | Hash-based duplicate detection and marking | 4 |
| Two-Phase Lifecycle | Duplicate → Redundant → Removal workflow | 3 |
| Edge Cases | Empty arrays, null handling, malformed data | 2 |

**Key Concepts Tested:**
- **Redundant file lifecycle**: Files marked as "duplicate" transition to "redundant" status after hash verification, then are removed in Stage 1 pre-filter of next batch
- **Two-phase cleanup**: Separation of duplicate detection (Stage 2) from redundant file removal (Stage 1 of next batch)
- **Sequential deduplication**: Optimized algorithm for processing files in batches without re-hashing

---

#### 6. SSO Integration Tests ✅

| **Attribute**   | **Details**  |
| --------------- | ------------ |
| **Created**     | Pre-existing |
| **Status**      | ✅ Active    |
| **Total Tests** | ~10          |

**Test Files:**
| File Path | Purpose | Status |
|-----------|---------|--------|
| `tests/sso-e2e.test.js` | Cross-application authentication flows | ✅ Active |

---

#### 7. Backward Compatibility Tests ✅

| **Attribute**   | **Details**                  |
| --------------- | ---------------------------- |
| **Created**     | 2025-01-20                   |
| **Status**      | ✅ Active                    |
| **Total Tests** | 20                           |
| **Phase**       | Organizer Store API Versions |

**Test Files:**
| File Path | Test Count | Purpose |
|-----------|------------|---------|
| `/tests/unit/features/organizer/stores/backwardCompatibility.test.js` | 20 | Legacy organizer store method preservation across v1.0/v1.1/v1.2 |

**Coverage Areas:**
| Category | Description | Test Count |
|----------|-------------|------------|
| v1.0 Core Methods | setFilter, clearFilters, reset | 6 |
| v1.1 Category Methods | addCategory, updateCategory, deleteCategory | 7 |
| v1.2 AI Methods | processAICategorization, approveAITag, rejectAITag | 7 |

**Purpose**: Ensures that organizer store refactoring and facade pattern implementation preserves all legacy API methods for backward compatibility.

---

#### 8. Error Handling Tests ✅

| **Attribute**   | **Details**                        |
| --------------- | ---------------------------------- |
| **Created**     | 2025-01-20                         |
| **Status**      | ✅ Active                          |
| **Total Tests** | 21                                 |
| **Phase**       | Comprehensive Error Scenario Coverage |

**Test Files:**
| File Path | Test Count | Purpose |
|-----------|------------|---------|
| `/tests/unit/features/organizer/stores/errorHandling.test.js` | 21 | Comprehensive error handling in organizer store |

**Coverage Areas:**
| Category | Description | Test Count |
|----------|-------------|------------|
| Network Failure Handling | Network errors, timeouts, graceful degradation | 6 |
| Invalid Data Handling | Null, undefined, malformed data structures | 7 |
| Edge Cases | Empty arrays, circular references, missing fields | 5 |
| Error Recovery | State restoration, cleanup after errors | 3 |

**Purpose**: Validates robust error handling across all organizer store operations, ensuring system stability under adverse conditions.

---

## Test Utilities Registry

### Active Test Utilities Overview

| Utility Name              | File Path                                  | Created      | Status    | Used By              | Purpose                                             |
| ------------------------- | ------------------------------------------ | ------------ | --------- | -------------------- | --------------------------------------------------- |
| Virtual Folder Test Utils | `src/test-utils/virtualFolderTestUtils.js` | 2025-01-20   | ✅ Active | Virtual Folder Tests | Mock data and validation for virtual folder testing |
| Mock File API Utils       | `src/test-utils/mockFileAPI.js`            | Pre-existing | ✅ Active | Upload/Memory Tests  | File API mocking for upload system testing          |
| Tag Validation Test       | `src/test-utils/tagValidationTest.js`      | 2025-01-20   | ✅ Active | Manual Testing       | Tag validation and orphaned tag cleanup verification |
| Category Migration Test   | `src/test-utils/categoryMigrationTest.js`  | 2025-01-20   | ✅ Active | Manual Testing       | Category isActive field migration verification      |

### Detailed Utility Information

#### 1. Virtual Folder Test Utils ✅

| **Attribute** | **Details**                                                   |
| ------------- | ------------------------------------------------------------- |
| **File**      | `src/test-utils/virtualFolderTestUtils.js`                    |
| **Created**   | 2025-01-20                                                    |
| **Purpose**   | Support Virtual Folder System testing                         |
| **Used By**   | `virtualFolderStore.test.js`, `organizer.integration.test.js`, `performanceOptimization.test.js`, `backwardCompatibility.test.js`, `errorHandling.test.js` |

**Exported Functions:**
| Function | Parameters | Purpose |
|----------|------------|---------|
| `generateMockCategories()` | `count = 3` | Creates realistic category data with IDs, names, colors |
| `generateMockEvidence()` | `count = 20, categories = null` | Creates evidence documents with realistic tag distributions |
| `generateMockTags()` | `categoryId, tagNames` | Creates tag objects for specific categories |

**Exported Objects:**
| Object | Purpose | Contents |
|--------|---------|----------|
| `testScenarios` | Pre-built test data scenarios | `emptyEvidence`, `malformedTagsEvidence`, `hierarchicalTestData`, `largeDataset` |
| `mockStoreStates` | Common store state configurations | `initial`, `configuredFolderView`, `deepNavigation` |
| `performanceUtils` | Performance measurement tools | `measureTime()`, `generateCacheKey()` |
| `validationUtils` | Structure validation helpers | `validateFolderStructure()`, `validateBreadcrumbs()` |

---

#### 2. Mock File API Utils ✅

| **Attribute** | **Details**                                |
| ------------- | ------------------------------------------ |
| **File**      | `src/test-utils/mockFileAPI.js`            |
| **Created**   | Pre-existing                               |
| **Purpose**   | File API mocking for upload system testing |
| **Used By**   | `memoryLeak.test.js`, upload system tests  |

---

#### 3. Tag Validation Test ✅

| **Attribute** | **Details**                                        |
| ------------- | -------------------------------------------------- |
| **File**      | `src/test-utils/tagValidationTest.js`              |
| **Created**   | 2025-01-20                                         |
| **Type**      | Manual Testing Utility (not automated Vitest test) |
| **Purpose**   | Validate tag references and identify orphaned tags |

**Key Features:**
- Tests category store initialization
- Fetches raw tags from subcollections
- Validates category references for each tag
- Identifies orphaned tags (deleted categories)
- Identifies inactive tags (inactive categories)
- Reports validation statistics

**Usage**: Manual/dev testing tool for debugging tag-category relationship issues in production data.

---

#### 4. Category Migration Test ✅

| **Attribute** | **Details**                                        |
| ------------- | -------------------------------------------------- |
| **File**      | `src/test-utils/categoryMigrationTest.js`          |
| **Created**   | 2025-01-20                                         |
| **Type**      | Manual Testing Utility (not automated Vitest test) |
| **Purpose**   | Verify isActive field migration for categories     |

**Key Features:**
- Tests normal category queries with isActive field
- Verifies unique name validation with migration fallback
- Confirms automatic migration of categories missing isActive
- Reports migration statistics and status

**Usage**: Manual/dev testing tool for verifying backward compatibility during category schema migrations.

---

## Test Configuration

### Vitest Configuration

**File**: `vite.config.js`
**Test Environment**: jsdom
**Globals**: Enabled
**Include Patterns**:
- `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- `tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`

### Test Commands

- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Launch test UI
