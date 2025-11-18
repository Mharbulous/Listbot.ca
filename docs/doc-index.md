# Documentation Index

This file maps the documentation structure for the Bookkeeper project, following a hub-and-spoke model with `CLAUDE.md` as the central hub.

## Hub-and-Spoke Structure

```
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
```

**Legend:**
- ✓ = File exists and is referenced in CLAUDE.md
- ✗ = File referenced in CLAUDE.md but does not exist

## Orphaned Documentation Files

The following documentation files exist but are NOT referenced by CLAUDE.md:

### Root-level docs/
- `docs/2025-11-10-Old-Upload-Page.md`
- `docs/2025-11-15-Folder-Structure.md`
- `docs/AsyncProcessesTable.md`
- `docs/Document-Processing-Workflow.md`
- `docs/FAQ.md`
- `docs/TanStackAndVue3.md`
- `docs/data-structures.md`
- `docs/design-guidelines.md`
- `docs/firebase-storage-plan.md`
- `docs/navigation-map.md`

### docs/agent-instructions/
- `docs/agent-instructions/file-relocator.md`

### docs/ai/
- `docs/ai/ai-metadata-extraction-requirements.md`
- `docs/ai/aiAnalysis.md`

### docs/analysis/
- `docs/analysis/2025-11-16-deduplication-complexity-analysis.md`
- `docs/analysis/performance-analysis-abridged.md`
- `docs/analysis/performance-analysis-summary.md`

### docs/architecture/ (orphaned)
- `docs/architecture/CategoryTags.md`
- `docs/architecture/Evidence.md`
- `docs/architecture/FileMetadata.md`
- `docs/architecture/MetadataSpecs.md`
- `docs/architecture/Settings.md`
- `docs/architecture/SoloFirmMatters.md`
- `docs/architecture/client-deduplication-logic.md`
- `docs/architecture/client-deduplication-stories.md`
- `docs/architecture/firebase-storage.md`
- `docs/architecture/firm-workflows.md`
- `docs/architecture/security-rules.md`

### docs/dedupe/
- `docs/dedupe/2025-11-16-ClientDeDupeLogic.md`
- `docs/dedupe/2025-11-16-MMD-ClientDeDupeLogic.md`

### docs/hosting/
- `docs/hosting/2025-11-16-Promotion.md`
- `docs/hosting/tips.md`

### docs/technical_debt/
- `docs/technical_debt/2025-11-16-build-debt.md`

### docs/testing/ (orphaned)
- `docs/testing/2025-11-15-vitest-test-suites.md`

## Summary

- **Referenced by CLAUDE.md:** 8 files (1 missing)
- **Orphaned files:** 37 files
- **Total documentation files:** 44 files (excluding CLAUDE.md itself)

## Notes

1. **Missing Reference:** CLAUDE.md references `docs/testing/performance-analysis.md` which does not exist. Similar files exist in `docs/analysis/` directory:
   - `docs/analysis/performance-analysis-abridged.md`
   - `docs/analysis/performance-analysis-summary.md`

2. **High Orphan Rate:** 84% of documentation files are not referenced by the hub (CLAUDE.md), suggesting the hub-and-spoke model is not being consistently followed.

3. **Recommended Action:** Review orphaned files and either:
   - Add relevant files to CLAUDE.md's "Documentation & Architecture (@-Imports)" section
   - Consolidate or archive outdated documentation
   - Create sub-hubs for specific topics (e.g., deduplication, AI features) if the main hub becomes too large
