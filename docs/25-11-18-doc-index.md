# Documentation Index (OBSOLETE)

**Reconciled up to**: 2025-11-18
**Status**: ⚠️ **OBSOLETE** - This file documented the old hub-and-spoke documentation model

---

## ⚠️ IMPORTANT: This Documentation is Outdated

This file described a **single hub-and-spoke documentation model** that was replaced in **November 2024** with a **feature-module hierarchy**.

### For Current Documentation Structure, See:

- **📄 `/CLAUDE.md`** - Root hub for the feature-module hierarchy
- **📄 `docs/System/Documentation/documentation-hierarchy.md`** - Feature-module organization philosophy
- **📄 `docs/System/Documentation/documentation-structure.md`** - Visual structure diagrams

### What Changed:

**Old Model (documented below):**
- Single `CLAUDE.md` hub at root
- All documentation referenced from one central file
- Flat structure: `docs/architecture/`, `docs/front-end/`, etc.

**New Model (current):**
- **25 CLAUDE.md index files** organized by feature modules
- Each folder has its own `CLAUDE.md` that references docs in that module
- Hierarchical structure: `docs/Features/Upload/`, `docs/System/Architecture/`, etc.
- Mirrors the `src/features/` codebase structure

### Major Reorganization Commits:

1. **5e4c723** - "Generate comprehensive CLAUDE.md index structure" (created feature-module hierarchy)
2. **2e8a299** - "Reorganize documentation using feature-module hierarchy" (initial reorganization)
3. **0e7177f** - "Reorganized folders" (file moves)

---

## Historical Content (Pre-November 2024)

*The content below describes the documentation structure as it existed before the reorganization. Many folders and files referenced here have been moved or reorganized.*

---

## Key Files

- `/CLAUDE.md` - Root hub (now part of multi-hub feature-module structure)
- `docs/System/Documentation/documentation-hierarchy.md` - Current structure philosophy
- `docs/System/Documentation/documentation-structure.md` - Current structure diagrams

---

## Hub-and-Spoke Structure (OLD MODEL)

```
CLAUDE.md (HUB)
│
├── docs/architecture/          [MOVED to docs/System/Architecture/ and docs/Features/*/]
│   ├── overview.md ✓          [NOW: docs/System/Architecture/overview.md]
│   ├── authentication.md ✓    [REORGANIZED into docs/Features/Authentication/]
│   ├── file-lifecycle.md ✓    [NOW: docs/Features/Upload/Processing/file-lifecycle.md]
│   └── file-processing.md ✓   [NOW: docs/Features/Upload/Processing/file-processing.md]
│
├── docs/front-end/             [DELETED - moved to docs/Features/Organizer/DocumentTable/]
│   └── DocumentTable.md ✓     [NOW: docs/Features/Organizer/DocumentTable/document-table-architecture.md]
│
├── docs/
│   └── 2025-11-10-New-Upload-Page.md ✓
│
└── src/dev-demos/
    └── README.md ✓
```

**Legend:**
- ✓ = File existed at time of this documentation
- [MOVED/NOW/DELETED] = Current status as of 2025-11-18

---

## Files Listed as "Orphaned" (Now Reorganized)

*The following files were listed as "orphaned" (not referenced by CLAUDE.md) at the time. Many have since been reorganized into the feature-module structure.*

### Root-level docs/
- `docs/2025-11-10-Old-Upload-Page.md` → Now `docs/Features/Upload/old-upload-page.md`
- `docs/2025-11-15-Folder-Structure.md` → Now `docs/Miscellaneous/2025-11-15-Folder-Structure.md`
- `docs/AsyncProcessesTable.md` → Now `docs/System/Architecture/async-processes-documentation.md`
- `docs/Document-Processing-Workflow.md` → Reorganized into `docs/Features/Upload/Processing/`
- `docs/FAQ.md` → Reconciled as `docs/25-11-18-FAQ.md`
- `docs/TanStackAndVue3.md` → Now `docs/System/Stack/tanstack-and-vue3.md`
- `docs/data-structures.md` → Reconciled as `docs/Data/25-11-18-data-structures.md`
- `docs/design-guidelines.md` → Now `docs/System/Conventions/design-guidelines.md`
- `docs/firebase-storage-plan.md` → Reorganized into `docs/Features/Upload/Storage/`
- `docs/navigation-map.md` → Now `docs/System/Architecture/navigation-map.md`

### docs/architecture/ (orphaned at the time, now reorganized)
- `docs/architecture/CategoryTags.md` → Now `docs/Features/Organizer/Categories/`
- `docs/architecture/Evidence.md` → Now `docs/Features/Organizer/Data/evidence-schema.md`
- `docs/architecture/FileMetadata.md` → Now `docs/Features/Organizer/Data/file-metadata-schema.md`
- `docs/architecture/MetadataSpecs.md` → Now `docs/Features/Organizer/Data/metadata-specs.md`
- `docs/architecture/Settings.md` → Now `docs/Features/Profile/settings-page.md`
- `docs/architecture/SoloFirmMatters.md` → Now `docs/Features/Matters/solo-firm-matters.md`
- `docs/architecture/client-deduplication-logic.md` → Reconciled as `docs/Features/Upload/Deduplication/25-11-18-client-deduplication-logic.md`
- `docs/architecture/client-deduplication-stories.md` → Reorganized into `docs/Features/Upload/Deduplication/`
- `docs/architecture/firebase-storage.md` → Reorganized into `docs/Features/Upload/Storage/`
- `docs/architecture/firm-workflows.md` → Now `docs/Features/Matters/firm-workflows.md`
- `docs/architecture/security-rules.md` → Now `docs/Data/Security/firestore-security-rules.md`

### Other relocated files
- `docs/testing/2025-11-15-vitest-test-suites.md` → Now `docs/Testing/vitest-test-suites.md`
- `docs/hosting/tips.md` → Now `docs/DevOps/hosting-tips.md`
- `docs/technical_debt/2025-11-16-build-debt.md` → Now `docs/TechnicalDebt/build-debt.md`

---

## Summary (Historical Snapshot)

- **Referenced by CLAUDE.md:** 8 files (1 missing)
- **Orphaned files:** 37 files
- **Total documentation files:** 44 files (excluding CLAUDE.md itself)

**Current Reality (2025-11-18):** Documentation is now organized into a feature-module hierarchy with 25 CLAUDE.md index files distributed across the documentation tree.

---

## Notes

1. **Missing Reference (Historical):** The old CLAUDE.md referenced `docs/testing/performance-analysis.md` which did not exist. Similar files existed in `docs/analysis/` directory.

2. **High Orphan Rate (Historical Context):** At the time, 84% of documentation files were not referenced by the hub (CLAUDE.md), which indicated the hub-and-spoke model was not being consistently followed. This issue was addressed by the reorganization into the feature-module hierarchy.

3. **Current Structure:** The new feature-module structure uses **multiple hubs** (one CLAUDE.md per feature/module folder) rather than attempting to reference all files from a single central hub. This provides better organization and scalability.

---

## Reconciliation Notes

**Reconciled**: 2025-11-18
**Reconciliation Type**: Marked as obsolete, added current structure references
**Action Taken**: Created dated version to preserve historical record while clearly marking as outdated
