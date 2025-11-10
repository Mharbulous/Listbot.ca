# File Decomposition List
**Generated:** 2025-11-09
**Criteria:** Files exceeding 300 lines of code

## Summary
- **Total source code files requiring decomposition:** 75
- **Target size:** Max 300 lines (components should be ~200 lines after decomposition)
- **Priority:** Largest files first

---

## Source Code Files Requiring Decomposition

### Vue Components (.vue)

| Filepath | No of Lines |
|----------|-------------|
| `/home/user/Bookkeeper/src/components/base/DocumentTable.vue` | 711 |
| `/home/user/Bookkeeper/src/views/MatterDetail.vue` | 682 |
| `/home/user/Bookkeeper/src/features/organizer/components/FolderHierarchySelector.vue` | 651 |
| `/home/user/Bookkeeper/src/views/EditMatter.vue` | 595 |
| `/home/user/Bookkeeper/src/features/upload/components/FileUploadQueue.vue` | 576 |
| `/home/user/Bookkeeper/src/dev-demos/views/NewSystemCategory.vue` | 513 |
| `/home/user/Bookkeeper/src/features/organizer/views/CategoryCreationWizard.vue` | 512 |
| `/home/user/Bookkeeper/src/views/Matters.vue` | 499 |
| `/home/user/Bookkeeper/src/components/document/tabs/DigitalFileTab.vue` | 494 |
| `/home/user/Bookkeeper/src/components/base/DocumentPeekTooltip.vue` | 480 |
| `/home/user/Bookkeeper/src/features/upload/components/FileUploadStatus.vue` | 455 |
| `/home/user/Bookkeeper/src/views/Profile.vue` | 441 |
| `/home/user/Bookkeeper/src/features/organizer/views/ViewDocument.vue` | 439 |
| `/home/user/Bookkeeper/src/components/AppSwitcher.vue` | 421 |
| `/home/user/Bookkeeper/src/features/upload/components/ProcessingProgressModal.vue` | 413 |
| `/home/user/Bookkeeper/src/features/organizer/views/CategoryManager.vue` | 397 |
| `/home/user/Bookkeeper/src/views/Cloud.vue` | 396 |
| `/home/user/Bookkeeper/src/views/NewMatter.vue` | 353 |
| `/home/user/Bookkeeper/src/dev-demos/views/LazyLoadingDemo.vue` | 327 |
| `/home/user/Bookkeeper/src/features/organizer/components/AITagChip.vue` | 326 |
| `/home/user/Bookkeeper/src/components/document/DocumentMetadataPanel.vue` | 317 |
| `/home/user/Bookkeeper/src/features/organizer/components/FolderBreadcrumbs.vue` | 316 |
| `/home/user/Bookkeeper/src/features/upload/components/CloudFileWarningModal.vue` | 313 |
| `/home/user/Bookkeeper/src/features/upload/components/UploadSummaryCard.vue` | 309 |

### JavaScript/TypeScript Files (.js, .ts)

| Filepath | No of Lines |
|----------|-------------|
| `/home/user/Bookkeeper/src/features/organizer/stores/organizerCore.js` | 616 |
| `/home/user/Bookkeeper/src/features/organizer/services/tagSubcollectionService.js` | 586 |
| `/home/user/Bookkeeper/src/dev-demos/services/devTagService.js` | 572 |
| `/home/user/Bookkeeper/src/features/upload/composables/useFileQueue.js` | 512 |
| `/home/user/Bookkeeper/src/features/upload/composables/useWebWorker.js` | 477 |
| `/home/user/Bookkeeper/src/features/organizer/services/categoryService.js` | 477 |
| `/home/user/Bookkeeper/transforms/file-to-upload.transform.js` | 472 |
| `/home/user/Bookkeeper/src/composables/useDocumentPeek.js` | 459 |
| `/home/user/Bookkeeper/src/features/organizer/services/evidenceQueryService.js` | 455 |
| `/home/user/Bookkeeper/src/utils/seedMatters.js` | 412 |
| `/home/user/Bookkeeper/src/utils/errorMessages.js` | 394 |
| `/home/user/Bookkeeper/src/services/aiMetadataExtractionService.js` | 392 |
| `/home/user/Bookkeeper/src/services/matterService.js` | 378 |
| `/home/user/Bookkeeper/src/features/organizer/composables/usePdfCache.js` | 377 |
| `/home/user/Bookkeeper/src/features/organizer/composables/useCanvasPreloader.js` | 374 |
| `/home/user/Bookkeeper/src/features/organizer/stores/virtualFolderStore.js` | 373 |
| `/home/user/Bookkeeper/src/features/upload/composables/useFolderAnalysis.js` | 372 |
| `/home/user/Bookkeeper/src/features/upload/composables/useFolderOptions.js` | 358 |
| `/home/user/Bookkeeper/src/features/organizer/composables/useNavigationPerformanceTracker.js` | 358 |
| `/home/user/Bookkeeper/src/features/upload/utils/hardwareCalibration.js` | 355 |
| `/home/user/Bookkeeper/src/test-utils/virtualFolderTestUtils.js` | 350 |
| `/home/user/Bookkeeper/src/features/organizer/services/aiTagService.js` | 350 |
| `/home/user/Bookkeeper/src/core/stores/auth.js` | 344 |
| `/home/user/Bookkeeper/src/composables/useMatters.js` | 344 |
| `/home/user/Bookkeeper/src/features/upload/composables/useWorkerManager.js` | 341 |
| `/home/user/Bookkeeper/src/test-utils/mockFileAPI.js` | 336 |
| `/home/user/Bookkeeper/src/features/upload/composables/useFolderTimeouts.js` | 335 |
| `/home/user/Bookkeeper/src/features/organizer/services/evidenceService.js` | 328 |
| `/home/user/Bookkeeper/src/dev-demos/composables/useDevTags.js` | 320 |
| `/home/user/Bookkeeper/src/features/organizer/composables/useEvidenceLoader.js` | 319 |
| `/home/user/Bookkeeper/src/components/features/tags/composables/useTagEditing.js` | 313 |
| `/home/user/Bookkeeper/src/features/upload/workers/fileHashWorker.js` | 311 |

---

## Test Files Over 300 Lines (For Reference)

| Filepath | No of Lines |
|----------|-------------|
| `/home/user/Bookkeeper/tests/unit/services/aiMetadataExtractionService.test.js` | 1301 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/components/FolderHierarchySelector.spec.js` | 877 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/components/TagContextMenu.spec.js` | 828 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/stores/virtualFolderStore.test.js` | 751 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/components/ViewModeToggle.spec.js` | 741 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/components/FolderBreadcrumbs.spec.js` | 629 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/stores/errorHandling.test.js` | 510 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/stores/organizer.integration.test.js` | 498 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/stores/performanceOptimization.test.js` | 404 |
| `/home/user/Bookkeeper/tests/unit/composables/memoryLeak.test.js` | 377 |
| `/home/user/Bookkeeper/tests/unit/features/upload/composables/useFolderTimeouts.test.js` | 337 |
| `/home/user/Bookkeeper/tests/unit/features/organizer/stores/backwardCompatibility.test.js` | 311 |

---

## Top 10 Priority Files for Immediate Decomposition

Based on size and functional complexity:

1. **deprecated/ViewDocument.vue** (1005 lines) - Consider removing if truly deprecated
2. **src/views/Home.vue** (866 lines) - Main view, high traffic
3. **src/features/upload/FileUpload.vue** (853 lines) - Core feature
4. **src/dev-demos/views/CategoryEditViewer.vue** (760 lines) - Demo/dev tool
5. **src/features/organizer/views/CategoryEditWizard.vue** (724 lines) - Complex wizard
6. **src/components/base/DocumentTable.vue** (711 lines) - Critical base component
7. **src/components/document/tabs/AIAnalysisTab.vue** (701 lines) - Feature tab
8. **src/views/MatterDetail.vue** (682 lines) - Detail view
9. **src/features/organizer/components/FolderHierarchySelector.vue** (651 lines) - Complex component
10. **src/features/organizer/stores/organizerCore.js** (616 lines) - Core state management

---

## Decomposition Strategy Notes

### General Approach
- Break components into logical sub-components by area of concern
- Extract composables for reusable logic
- Separate presentation from business logic
- Create utility modules for shared functions
- Maintain single responsibility principle

### Component Patterns to Extract
- Modal dialogs → Separate components
- Form sections → Dedicated form components
- Complex computed logic → Composables
- Repeated UI patterns → Base components
- State management → Separate store modules

### Naming Convention for Decomposed Files
- Parent component: `FeatureName.vue`
- Child components: `FeatureName[Purpose].vue`
- Composables: `useFeature[Aspect].js`
- Services: `featureService.js` → `feature[Specific]Service.js`
