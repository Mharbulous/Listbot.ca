#!/bin/bash

# Migration Script for /src Folder Restructuring
# Generated: 2025-11-19
# This script moves 168 files to their new locations using git mv to preserve history

set -e  # Exit on error

echo "=========================================="
echo "Starting folder structure migration"
echo "=========================================="
echo ""

# Function to create directory if it doesn't exist
ensure_dir() {
  if [ ! -d "$1" ]; then
    echo "Creating directory: $1"
    mkdir -p "$1"
  fi
}

# Function to move file with git mv
move_file() {
  local src="$1"
  local dest="$2"

  if [ -f "$src" ]; then
    echo "Moving: $src → $dest"
    git mv "$src" "$dest"
  else
    echo "WARNING: Source file not found: $src"
  fi
}

echo "========================================"
echo "BATCH 1: Core auth stores (4 files)"
echo "========================================"
echo ""

ensure_dir "src/core/auth/stores"
move_file "src/core/stores/auth/authFirmSetup.js" "src/core/auth/stores/authFirmSetup.js"
move_file "src/core/stores/auth/authStateHandlers.js" "src/core/auth/stores/authStateHandlers.js"
move_file "src/core/stores/auth/authStore.js" "src/core/auth/stores/authStore.js"
move_file "src/core/stores/auth/index.js" "src/core/auth/stores/index.js"

echo ""
echo "Batch 1 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 2: Core firm store (1 file)"
echo "========================================"
echo ""

ensure_dir "src/core/firm/stores"
move_file "src/core/stores/firm.js" "src/core/firm/stores/firm.js"

echo ""
echo "Batch 2 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 3: Profile stores (1 file)"
echo "========================================"
echo ""

ensure_dir "src/features/profile/stores"
move_file "src/core/stores/userPreferences.js" "src/features/profile/stores/userPreferences.js"

echo ""
echo "Batch 3 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 4: Authentication feature (3 files)"
echo "========================================"
echo ""

ensure_dir "src/features/authentication/components"
ensure_dir "src/features/authentication/services"
ensure_dir "src/features/authentication/guards"
move_file "src/components/features/auth/LoginForm.vue" "src/features/authentication/components/LoginForm.vue"
move_file "src/services/authService.js" "src/features/authentication/services/authService.js"
move_file "src/router/guards/auth.js" "src/features/authentication/guards/authGuard.js"

echo ""
echo "Batch 4 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 5: Matters feature - composables, services, stores, utils (5 files)"
echo "========================================"
echo ""

ensure_dir "src/features/matters/composables"
ensure_dir "src/features/matters/services"
ensure_dir "src/features/matters/stores"
ensure_dir "src/features/matters/utils"
ensure_dir "src/features/matters/guards"
move_file "src/composables/useMatters.js" "src/features/matters/composables/useMatters.js"
move_file "src/services/matterService.js" "src/features/matters/services/matterService.js"
move_file "src/stores/matterView.js" "src/features/matters/stores/matterView.js"
move_file "src/utils/seedMatters.js" "src/features/matters/utils/seedMatters.js"
move_file "src/router/guards/matter.js" "src/features/matters/guards/matterGuard.js"

echo ""
echo "Batch 5 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 6: Matters feature - views (5 files)"
echo "========================================"
echo ""

ensure_dir "src/features/matters/views"
move_file "src/views/Matters.vue" "src/features/matters/views/Matters.vue"
move_file "src/views/MatterDetail.vue" "src/features/matters/views/MatterDetail.vue"
move_file "src/views/EditMatter.vue" "src/features/matters/views/EditMatter.vue"
move_file "src/views/NewMatter.vue" "src/features/matters/views/NewMatter.vue"
move_file "src/views/MatterImport.vue" "src/features/matters/views/MatterImport.vue"

echo ""
echo "Batch 6 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 7: Documents feature - table components (8 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/components/table"
ensure_dir "src/features/documents/components/table/cells"
move_file "src/components/base/DocumentTable.vue" "src/features/documents/components/table/DocumentTable.vue"
move_file "src/components/base/DragHandle.vue" "src/features/documents/components/table/DragHandle.vue"
move_file "src/components/base/CellContentTooltip.vue" "src/features/documents/components/table/CellContentTooltip.vue"
move_file "src/components/base/DocumentPeekTooltip.vue" "src/features/documents/components/table/DocumentPeekTooltip.vue"
move_file "src/features/organizer/components/cells/BadgeCell.vue" "src/features/documents/components/table/cells/BadgeCell.vue"
move_file "src/features/organizer/components/cells/DateCell.vue" "src/features/documents/components/table/cells/DateCell.vue"
move_file "src/features/organizer/components/cells/FileSizeCell.vue" "src/features/documents/components/table/cells/FileSizeCell.vue"
move_file "src/features/organizer/components/cells/TagListCell.vue" "src/features/documents/components/table/cells/TagListCell.vue"

echo ""
echo "Batch 7 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 8: Documents feature - table cells cont. (1 file)"
echo "========================================"
echo ""

move_file "src/features/organizer/components/cells/TextCell.vue" "src/features/documents/components/table/cells/TextCell.vue"

echo ""
echo "Batch 8 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 9: Documents feature - viewer components (4 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/components/viewer"
move_file "src/components/document/DocumentNavigationBar.vue" "src/features/documents/components/viewer/DocumentNavigationBar.vue"
move_file "src/components/document/DocumentMetadataPanel.vue" "src/features/documents/components/viewer/DocumentMetadataPanel.vue"
move_file "src/components/document/PdfViewerArea.vue" "src/features/documents/components/viewer/PdfViewerArea.vue"
move_file "src/components/document/PdfThumbnailPanel.vue" "src/features/documents/components/viewer/PdfThumbnailPanel.vue"

echo ""
echo "Batch 9 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 10: Documents feature - AI analysis components (8 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/components/ai-analysis"
move_file "src/components/document/tabs/AIAnalysisTab.vue" "src/features/documents/components/ai-analysis/AIAnalysisTab.vue"
move_file "src/components/document/tabs/DigitalFileTab.vue" "src/features/documents/components/ai-analysis/DigitalFileTab.vue"
move_file "src/components/document/tabs/DocumentTab.vue" "src/features/documents/components/ai-analysis/DocumentTab.vue"
move_file "src/components/document/tabs/ReviewTab.vue" "src/features/documents/components/ai-analysis/ReviewTab.vue"
move_file "src/components/document/tabs/ai-analysis/AIAnalysisButton.vue" "src/features/documents/components/ai-analysis/AIAnalysisButton.vue"
move_file "src/components/document/tabs/ai-analysis/AIAnalysisError.vue" "src/features/documents/components/ai-analysis/AIAnalysisError.vue"
move_file "src/components/document/tabs/ai-analysis/AIAnalysisFieldItem.vue" "src/features/documents/components/ai-analysis/AIAnalysisFieldItem.vue"
move_file "src/components/document/tabs/ai-analysis/AIReviewFieldItem.vue" "src/features/documents/components/ai-analysis/AIReviewFieldItem.vue"

echo ""
echo "Batch 10 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 11: Documents feature - tag components (2 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/components/tags"
ensure_dir "src/features/documents/components/tags/composables"
move_file "src/components/features/tags/EditableTag.vue" "src/features/documents/components/tags/EditableTag.vue"
move_file "src/components/features/tags/composables/useTagEditing.js" "src/features/documents/components/tags/composables/useTagEditing.js"

echo ""
echo "Batch 11 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 12: Documents feature - organizer components part 1 (10 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/components"
move_file "src/features/organizer/components/AITagChip.vue" "src/features/documents/components/AITagChip.vue"
move_file "src/features/organizer/components/ColumnSelector.vue" "src/features/documents/components/ColumnSelector.vue"
move_file "src/features/organizer/components/FileDetails.vue" "src/features/documents/components/FileDetails.vue"
move_file "src/features/organizer/components/FileGrid.vue" "src/features/documents/components/FileGrid.vue"
move_file "src/features/organizer/components/FileItem.vue" "src/features/documents/components/FileItem.vue"
move_file "src/features/organizer/components/FilePreview.vue" "src/features/documents/components/FilePreview.vue"
move_file "src/features/organizer/components/FileSearch.vue" "src/features/documents/components/FileSearch.vue"
move_file "src/features/organizer/components/FileTypeFilters.vue" "src/features/documents/components/FileTypeFilters.vue"
move_file "src/features/organizer/components/FolderBreadcrumbs.vue" "src/features/documents/components/FolderBreadcrumbs.vue"
move_file "src/features/organizer/components/FolderHierarchySelector.vue" "src/features/documents/components/FolderHierarchySelector.vue"

echo ""
echo "Batch 12 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 13: Documents feature - organizer components part 2 (4 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/components/PdfPageCanvas.vue" "src/features/documents/components/PdfPageCanvas.vue"
move_file "src/features/organizer/components/PdfThumbnailList.vue" "src/features/documents/components/PdfThumbnailList.vue"
move_file "src/features/organizer/components/TagOptionsManager.vue" "src/features/documents/components/TagOptionsManager.vue"
move_file "src/features/organizer/components/ViewModeToggle.vue" "src/features/documents/components/ViewModeToggle.vue"

echo ""
echo "Batch 13 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 14: Documents feature - composables part 1 (10 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/composables"
move_file "src/composables/useAIAnalysis.js" "src/features/documents/composables/useAIAnalysis.js"
move_file "src/composables/useCellTooltip.js" "src/features/documents/composables/useCellTooltip.js"
move_file "src/composables/useColumnDragDrop.js" "src/features/documents/composables/useColumnDragDrop.js"
move_file "src/composables/useColumnResize.js" "src/features/documents/composables/useColumnResize.js"
move_file "src/composables/useColumnSort.js" "src/features/documents/composables/useColumnSort.js"
move_file "src/composables/useColumnVisibility.js" "src/features/documents/composables/useColumnVisibility.js"
move_file "src/composables/useDocumentPeek.js" "src/features/documents/composables/useDocumentPeek.js"
move_file "src/composables/useDocumentTablePeek.js" "src/features/documents/composables/useDocumentTablePeek.js"
move_file "src/composables/useTooltipTiming.js" "src/features/documents/composables/useTooltipTiming.js"
move_file "src/composables/useVirtualTable.js" "src/features/documents/composables/useVirtualTable.js"

echo ""
echo "Batch 14 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 15: Core composables (3 files)"
echo "========================================"
echo ""

ensure_dir "src/core/composables"
move_file "src/composables/useAsyncInspector.js" "src/core/composables/useAsyncInspector.js"
move_file "src/composables/useAsyncRegistry.js" "src/core/composables/useAsyncRegistry.js"
move_file "src/composables/useFavicon.js" "src/core/composables/useFavicon.js"

echo ""
echo "Batch 15 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 16: Profile composables (2 files)"
echo "========================================"
echo ""

ensure_dir "src/features/profile/composables"
move_file "src/composables/useFirmMembers.js" "src/features/profile/composables/useFirmMembers.js"
move_file "src/composables/useUsers.js" "src/features/profile/composables/useUsers.js"

echo ""
echo "Batch 16 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 17: Documents feature - organizer composables part 1 (10 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/composables/useCanvasPreloader.js" "src/features/documents/composables/useCanvasPreloader.js"
move_file "src/features/organizer/composables/useCategoryEditActions.js" "src/features/documents/composables/useCategoryEditActions.js"
move_file "src/features/organizer/composables/useCategoryEditForm.js" "src/features/documents/composables/useCategoryEditForm.js"
move_file "src/features/organizer/composables/useCategoryEditState.js" "src/features/documents/composables/useCategoryEditState.js"
move_file "src/features/organizer/composables/useCategoryEditValidation.js" "src/features/documents/composables/useCategoryEditValidation.js"
move_file "src/features/organizer/composables/useCategoryFormHelpers.js" "src/features/documents/composables/useCategoryFormHelpers.js"
move_file "src/features/organizer/composables/useCategoryManager.js" "src/features/documents/composables/useCategoryManager.js"
move_file "src/features/organizer/composables/useCategoryTypeConversion.js" "src/features/documents/composables/useCategoryTypeConversion.js"
move_file "src/features/organizer/composables/useDocumentNavigation.js" "src/features/documents/composables/useDocumentNavigation.js"
move_file "src/features/organizer/composables/useDocumentPreloader.js" "src/features/documents/composables/useDocumentPreloader.js"

echo ""
echo "Batch 17 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 18: Documents feature - organizer composables part 2 (10 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/composables/useEvidenceDeduplication.js" "src/features/documents/composables/useEvidenceDeduplication.js"
move_file "src/features/organizer/composables/useEvidenceLoader.js" "src/features/documents/composables/useEvidenceLoader.js"
move_file "src/features/organizer/composables/useFilePreview.js" "src/features/documents/composables/useFilePreview.js"
move_file "src/features/organizer/composables/useFileSearch.js" "src/features/documents/composables/useFileSearch.js"
move_file "src/features/organizer/composables/useFileViewer.js" "src/features/documents/composables/useFileViewer.js"
move_file "src/features/organizer/composables/useNavigationPerformanceTracker.js" "src/features/documents/composables/useNavigationPerformanceTracker.js"
move_file "src/features/organizer/composables/usePageComplexity.js" "src/features/documents/composables/usePageComplexity.js"
move_file "src/features/organizer/composables/usePagePreloader.js" "src/features/documents/composables/usePagePreloader.js"
move_file "src/features/organizer/composables/usePageVisibility.js" "src/features/documents/composables/usePageVisibility.js"
move_file "src/features/organizer/composables/usePdfCache.js" "src/features/documents/composables/usePdfCache.js"

echo ""
echo "Batch 18 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 19: Documents feature - organizer composables part 3 (8 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/composables/usePdfMetadata.js" "src/features/documents/composables/usePdfMetadata.js"
move_file "src/features/organizer/composables/usePdfViewer.js" "src/features/documents/composables/usePdfViewer.js"
move_file "src/features/organizer/composables/useRenderTracking.js" "src/features/documents/composables/useRenderTracking.js"
move_file "src/features/organizer/composables/useTagColor.js" "src/features/documents/composables/useTagColor.js"
move_file "src/features/organizer/composables/useThumbnailRenderer.js" "src/features/documents/composables/useThumbnailRenderer.js"
move_file "src/features/organizer/composables/useViewerNavigation.js" "src/features/documents/composables/useViewerNavigation.js"

echo ""
echo "Batch 19 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 20: Documents feature - services part 1 (5 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/services"
move_file "src/services/aiMetadataExtractionService.js" "src/features/documents/services/aiMetadataExtractionService.js"
move_file "src/services/fileService.js" "src/features/documents/services/fileService.js"
move_file "src/features/organizer/services/aiProcessingService.js" "src/features/documents/services/aiProcessingService.js"
move_file "src/features/organizer/services/aiTagService.js" "src/features/documents/services/aiTagService.js"
move_file "src/features/organizer/services/categoryService.js" "src/features/documents/services/categoryService.js"

echo ""
echo "Batch 20 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 21: Documents feature - services part 2 (8 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/services/evidenceDocumentService.js" "src/features/documents/services/evidenceDocumentService.js"
move_file "src/features/organizer/services/evidenceQueryService.js" "src/features/documents/services/evidenceQueryService.js"
move_file "src/features/organizer/services/evidenceService.js" "src/features/documents/services/evidenceService.js"
move_file "src/features/organizer/services/fileProcessingService.js" "src/features/documents/services/fileProcessingService.js"
move_file "src/features/organizer/services/index.js" "src/features/documents/services/index.js"
move_file "src/features/organizer/services/systemCategoriesService.js" "src/features/documents/services/systemCategoriesService.js"
move_file "src/features/organizer/services/systemCategoryService.js" "src/features/documents/services/systemCategoryService.js"
move_file "src/features/organizer/services/tagOperationService.js" "src/features/documents/services/tagOperationService.js"

echo ""
echo "Batch 21 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 22: Documents feature - services part 3 (1 file)"
echo "========================================"
echo ""

move_file "src/features/organizer/services/tagSubcollectionService.js" "src/features/documents/services/tagSubcollectionService.js"

echo ""
echo "Batch 22 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 23: Documents feature - stores (9 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/stores"
move_file "src/stores/documentView.js" "src/features/documents/stores/documentView.js"
move_file "src/features/organizer/stores/categoryComposables.js" "src/features/documents/stores/categoryComposables.js"
move_file "src/features/organizer/stores/categoryCore.js" "src/features/documents/stores/categoryCore.js"
move_file "src/features/organizer/stores/categoryStore.js" "src/features/documents/stores/categoryStore.js"
move_file "src/features/organizer/stores/categoryValidation.js" "src/features/documents/stores/categoryValidation.js"
move_file "src/features/organizer/stores/organizer.js" "src/features/documents/stores/organizer.js"
move_file "src/features/organizer/stores/organizerCore.js" "src/features/documents/stores/organizerCore.js"
move_file "src/features/organizer/stores/organizerQueryStore.js" "src/features/documents/stores/organizerQueryStore.js"
move_file "src/features/organizer/stores/virtualFolderStore.js" "src/features/documents/stores/virtualFolderStore.js"

echo ""
echo "Batch 23 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 24: Documents feature - utils (10 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/utils"
move_file "src/utils/categoryFieldMapping.js" "src/features/documents/utils/categoryFieldMapping.js"
move_file "src/features/organizer/utils/automaticTagColors.js" "src/features/documents/utils/automaticTagColors.js"
move_file "src/features/organizer/utils/categoryFormHelpers.js" "src/features/documents/utils/categoryFormHelpers.js"
move_file "src/features/organizer/utils/categoryFormOptions.js" "src/features/documents/utils/categoryFormOptions.js"
move_file "src/features/organizer/utils/categoryIdGenerator.js" "src/features/documents/utils/categoryIdGenerator.js"
move_file "src/features/organizer/utils/categoryTypeConversions.js" "src/features/documents/utils/categoryTypeConversions.js"
move_file "src/features/organizer/utils/categoryTypes.js" "src/features/documents/utils/categoryTypes.js"
move_file "src/features/organizer/utils/currencyOptions.js" "src/features/documents/utils/currencyOptions.js"
move_file "src/features/organizer/utils/fileUtils.js" "src/features/documents/utils/fileUtils.js"
move_file "src/features/organizer/utils/fileViewerUtils.js" "src/features/documents/utils/fileViewerUtils.js"

echo ""
echo "Batch 24 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 25: Documents feature - utils cont. (3 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/utils/previewGenerators.js" "src/features/documents/utils/previewGenerators.js"
move_file "src/features/organizer/utils/uploadUtils.js" "src/features/documents/utils/uploadUtils.js"
move_file "src/features/organizer/utils/uploadViewerUtils.js" "src/features/documents/utils/uploadViewerUtils.js"

echo ""
echo "Batch 25 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 26: Documents feature - constants and types (2 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/constants"
ensure_dir "src/features/documents/types"
move_file "src/features/organizer/constants/systemCategories.js" "src/features/documents/constants/systemCategories.js"
move_file "src/features/organizer/types/viewer.types.js" "src/features/documents/types/viewer.types.js"

echo ""
echo "Batch 26 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 27: Documents feature - views part 1 (3 files)"
echo "========================================"
echo ""

ensure_dir "src/features/documents/views"
move_file "src/views/Documents.vue" "src/features/documents/views/Documents.vue"
move_file "src/views/Analyze.vue" "src/features/documents/views/Analyze.vue"
move_file "src/features/organizer/views/CategoryCreationWizard.vue" "src/features/documents/views/CategoryCreationWizard.vue"

echo ""
echo "Batch 27 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 28: Documents feature - views part 2 (4 files)"
echo "========================================"
echo ""

move_file "src/features/organizer/views/CategoryEditWizard.vue" "src/features/documents/views/CategoryEditWizard.vue"
move_file "src/features/organizer/views/CategoryManager.vue" "src/features/documents/views/CategoryManager.vue"
move_file "src/features/organizer/views/FileViewer.vue" "src/features/documents/views/FileViewer.vue"
move_file "src/features/organizer/views/ViewDocument.vue" "src/features/documents/views/ViewDocument.vue"

echo ""
echo "Batch 28 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 29: Profile feature (4 files)"
echo "========================================"
echo ""

ensure_dir "src/features/profile/services"
ensure_dir "src/features/profile/views"
move_file "src/services/profileService.js" "src/features/profile/services/profileService.js"
move_file "src/services/userService.js" "src/features/profile/services/userService.js"
move_file "src/views/Profile.vue" "src/features/profile/views/Profile.vue"
move_file "src/views/Settings.vue" "src/features/profile/views/Settings.vue"

echo ""
echo "Batch 29 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 30: Upload feature (1 file)"
echo "========================================"
echo ""

ensure_dir "src/features/upload/services"
move_file "src/services/uploadService.js" "src/features/upload/services/uploadService.js"

echo ""
echo "Batch 30 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 31: Shared components - layout (2 files)"
echo "========================================"
echo ""

ensure_dir "src/shared/components/layout"
move_file "src/components/layout/AppHeader.vue" "src/shared/components/layout/AppHeader.vue"
move_file "src/components/layout/AppSideBar.vue" "src/shared/components/layout/AppSideBar.vue"

echo ""
echo "Batch 31 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 32: Shared components - navigation (1 file)"
echo "========================================"
echo ""

ensure_dir "src/shared/components/navigation"
move_file "src/components/AppSwitcher.vue" "src/shared/components/navigation/AppSwitcher.vue"

echo ""
echo "Batch 32 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 33: Shared components - base (3 files)"
echo "========================================"
echo ""

ensure_dir "src/shared/components/base"
move_file "src/components/base/BaseSearchBar.vue" "src/shared/components/base/BaseSearchBar.vue"
move_file "src/components/base/HoldToConfirmButton.vue" "src/shared/components/base/HoldToConfirmButton.vue"
move_file "src/shared/components/ClearAllButton.vue" "src/shared/components/base/ClearAllButton.vue"

echo ""
echo "Batch 33 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 34: Shared components - home (4 files)"
echo "========================================"
echo ""

ensure_dir "src/shared/components/home"
move_file "src/components/home/AddAppTab.vue" "src/shared/components/home/AddAppTab.vue"
move_file "src/components/home/FeaturesTab.vue" "src/shared/components/home/FeaturesTab.vue"
move_file "src/components/home/FirstAppTab.vue" "src/shared/components/home/FirstAppTab.vue"
move_file "src/components/home/LocalDevTab.vue" "src/shared/components/home/LocalDevTab.vue"

echo ""
echo "Batch 34 complete. Please run: npm run build"
echo "Press Enter to continue or Ctrl+C to stop..."
read

echo ""
echo "========================================"
echo "BATCH 35: Shared components - UI (1 file)"
echo "========================================"
echo ""

ensure_dir "src/shared/components/ui"
move_file "src/components/ui/SegmentedControl.vue" "src/shared/components/ui/SegmentedControl.vue"

echo ""
echo "All file migrations complete!"
echo ""
echo "========================================"
echo "IMPORTANT NEXT STEPS:"
echo "========================================"
echo "1. Run: npm run build"
echo "2. Fix any import errors that arise"
echo "3. Run: npm run test:run"
echo "4. Commit the changes with a descriptive message"
echo ""
echo "Migration script finished successfully!"
