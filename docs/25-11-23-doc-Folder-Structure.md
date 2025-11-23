# Documentation Folder Structure - Line Count Analysis
**Generated:** 2025-11-23
**Purpose:** Track documentation file sizes for the /doc-streamline command

---

## Files Exceeding 700 Lines (Streamlining Candidates)

### Priority 1: Files WITHOUT Date Prefix
- `Features/Upload/Deduplication/deduplication-complexity-analysis.md` - **759 lines**

### Priority 2: Files WITH Date Prefix (Oldest First)
- `Testing/25-11-18-vitest-test-suites.md` - **1629 lines**
- `Features/Upload/old-upload-page.md` - **1109 lines**
- `Features/Upload/Deduplication/25-11-18-client-deduplication-logic.md` - **807 lines**
- `Features/Organizer/AIAnalysis/25-11-19-ai-analysis-overview.md` - **816 lines**

### Approaching Limit (600-700 lines)
- `Miscellaneous/2025-11-23-Folder-Structure.md` - **931 lines**
- `Features/Authentication/25-11-18-auth-state-machine.md` - **666 lines**
- `System/Architecture/25-11-18-async-processes-documentation.md` - **612 lines**
- `Features/Profile/25-11-18-settings-page.md` - **604 lines**

---

## Complete File Listing by Folder

### Root Level (docs/)
- `25-11-18-FAQ.md` - 129 lines
- `25-11-18-doc-index.md` - 140 lines
- `25-11-23-Listbot-Executive-Summary.md` - 114 lines

### Data/
- `25-11-18-data-structures.md` - 340 lines

#### Data/Security/
- `25-11-18-firestore-security-rules.md` - 461 lines

### DevOps/
- `25-11-18-firebase-permissions-status.md` - 126 lines
- `25-11-18-hosting-tips.md` - 94 lines
- `deployment-promotion.md` - 418 lines *(no date prefix)*
- `firebase-add-user-steps.md` - 75 lines *(no date prefix)*
- `firebase-project-setup.md` - 205 lines *(no date prefix)*
- `promotion-improvements.md` - 153 lines *(no date prefix)*

### Features/Authentication/
- `25-11-18-auth-state-machine.md` - 666 lines

### Features/Matters/
- `solo-firm-matters.md` - 236 lines *(no date prefix)*

### Features/Organizer/AIAnalysis/
- `25-11-19-ai-analysis-overview.md` - 816 lines ⚠️
- `ai-requirements-architecture.md` - 249 lines *(no date prefix)*
- `ai-requirements-functional.md` - 269 lines *(no date prefix)*
- `ai-requirements-implementation.md` - 182 lines *(no date prefix)*
- `ai-requirements-nonfunctional.md` - 44 lines *(no date prefix)*
- `ai-requirements-overview.md` - 152 lines *(no date prefix)*
- `ai-requirements-prompts.md` - 99 lines *(no date prefix)*
- `ai-requirements-ui-mockups.md` - 182 lines *(no date prefix)*
- `ai-requirements-user-stories.md` - 299 lines *(no date prefix)*

### Features/Organizer/Categories/
- `25-11-18-category-system-overview.md` - 431 lines

### Features/Organizer/Data/
- `25-11-18-evidence-schema.md` - 525 lines
- `25-11-18-file-metadata-schema.md` - 463 lines
- `25-11-18-metadata-specs.md` - 106 lines

### Features/Organizer/DocumentTable/
- `25-11-18-document-table-architecture.md` - 325 lines

### Features/Profile/
- `25-11-18-settings-page.md` - 604 lines

### Features/Upload/
- `25-11-18-new-upload-page-testing-route.md` - 49 lines
- `deduplication-inconsistency-examples.md` - 479 lines *(no date prefix)*
- `old-upload-page.md` - 1109 lines ⚠️ *(no date prefix)*
- `testing-page-dependencies.md` - 143 lines *(no date prefix)*

#### Features/Upload/Deduplication/
- `2025-11-16-ClientDeDupeLogic.md` - 561 lines
- `2025-11-16-MMD-ClientDeDupeLogic.md` - 345 lines
- `25-11-18-client-deduplication-logic.md` - 807 lines ⚠️
- `25-11-18-client-deduplication-stories.md` - 140 lines
- `deduplication-complexity-analysis.md` - 759 lines ⚠️ *(no date prefix)*

#### Features/Upload/Processing/
- `25-11-23-performance-analysis-summary.md` - 271 lines
- `document-processing-workflow.md` - 169 lines *(no date prefix)*
- `file-lifecycle.md` - 192 lines *(no date prefix)*
- `file-processing.md` - 87 lines *(no date prefix)*
- `performance-analysis-abridged.md` - 386 lines *(no date prefix)*

#### Features/Upload/Storage/
- `firebase-storage-plan.md` - 414 lines *(no date prefix)*
- `firebase-storage.md` - 207 lines *(no date prefix)*

### Front-End/
- `2025-11-22-Responsive-Overlapping-Folder-Tabs.md` - 631 lines
- `25-11-18-tanstack-and-vue3.md` - 573 lines
- `25-11-22-Adaptive-folder-tabs.md` - 281 lines

### Miscellaneous/
- `2025-11-23-Folder-Structure.md` - 931 lines
- `25-11-18-auth-module-test-strategy.md` - 373 lines

### System/Architecture/
- `25-11-18-async-processes-documentation.md` - 612 lines
- `25-11-18-navigation-map.md` - 310 lines
- `25-11-19-overview.md` - 183 lines

### System/Conventions/
- `25-11-18-design-guidelines.md` - 450 lines

### System/Documentation/
- `documentation-hierarchy.md` - 396 lines *(no date prefix)*
- `documentation-structure.md` - 342 lines *(no date prefix)*

### TechnicalDebt/
- `25-11-18-build-debt.md` - 235 lines

### Testing/
- `25-11-18-vitest-test-suites.md` - 1629 lines ⚠️

---

## Summary Statistics

- **Total documentation files:** 56 (excluding CLAUDE.md index files)
- **Total lines:** 20,967
- **Files >700 lines:** 5
- **Files 600-700 lines:** 4
- **Files without date prefix:** 25
- **Average file size:** 374 lines

---

## Next Steps for /doc-streamline

**Recommended decomposition order:**

1. ✅ ~~`Features/Organizer/AIAnalysis/ai-requirements.md` (1430 lines, no date prefix)~~ **COMPLETED**
2. `Features/Upload/Deduplication/deduplication-complexity-analysis.md` (759 lines, no date prefix)
3. `Testing/25-11-18-vitest-test-suites.md` (1629 lines)
4. `Features/Upload/old-upload-page.md` (1109 lines)
5. `Features/Upload/Deduplication/25-11-18-client-deduplication-logic.md` (807 lines)
6. `Features/Organizer/AIAnalysis/25-11-19-ai-analysis-overview.md` (816 lines)
