# ViewDocument.vue Decomposition Plan

**Status**: TODO
**Created**: 2025-11-02
**Estimated Effort**: 4-6 hours (incremental approach)
**Priority**: Medium

## Executive Summary

Decompose the monolithic ViewDocument.vue component (1,903 lines) into a maintainable component-based architecture, reducing the main component to ~400 lines through extraction of 4 focused UI components.

## Current State Analysis

### File Statistics
- **Total Lines**: 1,903
  - Template: ~417 lines (22%)
  - Script: ~922 lines (48%)
  - Styles: ~557 lines (29%)

### Identified Responsibilities (9 Areas)
1. **Document Navigation & Routing** - Managing navigation between documents
2. **PDF Rendering & Display** - Handling PDF viewer and pages
3. **Thumbnail Management** - Left sidebar thumbnail panel
4. **Metadata Display & Editing** - Right sidebar metadata panel with variant selection
5. **Data Fetching & Caching** - Firestore/Storage integration with caching layer
6. **Pre-loading Strategy** - Background loading of adjacent documents
7. **User Interactions** - Keyboard shortcuts, toggles, page jumps
8. **State Management** - Complex loading/error states across multiple phases
9. **Performance Tracking** - Navigation timing and cache hit/miss logging

### Current Architecture

```
ViewDocument.vue (1,903 lines)
├── Template (417 lines)
│   ├── Thumbnail Panel (Left Sidebar) - Lines 19-58
│   ├── Center Panel (Main Viewer) - Lines 60-194
│   │   ├── Navigation controls
│   │   ├── PDF viewer area
│   │   └── Loading/error states
│   └── Metadata Panel (Right Sidebar) - Lines 196-416
│       ├── Source File
│       ├── Cloud Storage Information
│       └── Embedded Metadata (PDF-specific)
├── Script (922 lines)
│   ├── State management (10+ reactive refs)
│   ├── Composable integration (5 composables)
│   ├── Document navigation logic
│   ├── Data fetching & caching
│   ├── Pre-loading system
│   ├── Metadata management
│   ├── User interactions
│   └── Lifecycle hooks
└── Styles (557 lines)
    └── 10+ major style groups for all sections
```

## Decomposition Strategy

### Approach: Incremental Component Extraction
- **Phase 1**: Extract UI components (this implementation)
- **Phase 2**: Testing and verification
- **Future**: Extract composables and further decompose if needed

### Design Principles
1. **Clear Visual Boundaries**: Each component owns one visual section
2. **Single Responsibility**: One component = one panel/section
3. **Styles Co-located**: Keep `<style scoped>` within each component (Vue SFC best practice)
4. **Progressive Enhancement**: Start with larger components, decompose further only if needed
5. **KISS > DRY**: Favor simplicity over eliminating all duplication

---

## Phase 1: UI Component Extraction

### Component 1: DocumentNavigationBar.vue

**Lines Extracted**: ~100 lines total
- Template: Lines 62-137
- Script: Navigation methods (586-627)
- Styles: Navigation controls styling

**Responsibilities**:
- First/Previous/Next/Last document navigation
- Page jump input for PDF documents
- Navigation state display (current page, total pages)

**Interface**:
```vue
<template>
  <DocumentNavigationBar
    :current-document-index="currentDocumentIndex"
    :total-documents="totalDocuments"
    :is-pdf-file="isPdfFile"
    :current-page="currentVisiblePage"
    :total-pages="totalPages"
    @navigate-first="goToFirstDocument"
    @navigate-previous="goToPreviousDocument"
    @navigate-next="goToNextDocument"
    @navigate-last="goToLastDocument"
    @jump-to-page="handlePageJump"
  />
</template>
```

**Props**:
- `currentDocumentIndex: Number` - Index of current document in organizer
- `totalDocuments: Number` - Total documents in organizer
- `isPdfFile: Boolean` - Whether current document is a PDF
- `currentPage: Number` - Current visible page (PDF only)
- `totalPages: Number` - Total pages in PDF

**Events**:
- `navigate-first` - Navigate to first document
- `navigate-previous` - Navigate to previous document
- `navigate-next` - Navigate to next document
- `navigate-last` - Navigate to last document
- `jump-to-page(pageNumber)` - Jump to specific PDF page

**File Location**: `src/components/document/DocumentNavigationBar.vue`

---

### Component 2: PdfThumbnailPanel.vue

**Lines Extracted**: ~80 lines total
- Template: Lines 19-58
- Script: Thumbnail visibility state
- Styles: Thumbnail panel layout

**Responsibilities**:
- Collapsible left sidebar
- PDF thumbnail list display
- Thumbnail visibility toggle
- Page selection from thumbnails

**Interface**:
```vue
<template>
  <PdfThumbnailPanel
    :is-pdf-file="isPdfFile"
    :pdf-document="pdfDocument"
    :total-pages="totalPages"
    :current-visible-page="currentVisiblePage"
    :visible="thumbnailsVisible"
    @toggle-visibility="toggleThumbnails"
    @page-selected="handleThumbnailClick"
  />
</template>
```

**Props**:
- `isPdfFile: Boolean` - Whether current document is a PDF
- `pdfDocument: Object` - PDF.js document object
- `totalPages: Number` - Total pages in PDF
- `currentVisiblePage: Number` - Currently visible page number
- `visible: Boolean` - Whether thumbnail panel is visible

**Events**:
- `toggle-visibility` - Toggle thumbnail panel visibility
- `page-selected(pageNumber)` - Page selected from thumbnail

**File Location**: `src/components/document/PdfThumbnailPanel.vue`

---

### Component 3: PdfViewerArea.vue

**Lines Extracted**: ~120 lines total
- Template: Lines 139-193
- Script: Viewer state management
- Styles: Viewer area layout, loading/error states

**Responsibilities**:
- Main PDF viewer container
- PDF page rendering area
- Loading state display
- Error state display
- Non-PDF placeholder

**Interface**:
```vue
<template>
  <PdfViewerArea
    :is-pdf-file="isPdfFile"
    :pdf-document="pdfDocument"
    :total-pages="totalPages"
    :viewer-loading="viewerLoading"
    :loading-document="loadingDocument"
    :pdf-load-error="pdfLoadError"
    @page-rendered="handlePageRendered"
  />
</template>
```

**Props**:
- `isPdfFile: Boolean` - Whether current document is a PDF
- `pdfDocument: Object` - PDF.js document object
- `totalPages: Number` - Total pages in PDF
- `viewerLoading: Boolean` - Whether viewer is in loading state
- `loadingDocument: Boolean` - Whether document is being loaded
- `pdfLoadError: Error | null` - PDF loading error if any

**Events**:
- `page-rendered(pageNumber)` - Emitted when a page finishes rendering

**File Location**: `src/components/document/PdfViewerArea.vue`

---

### Component 4: DocumentMetadataPanel.vue

**Lines Extracted**: ~300 lines total
- Template: Lines 196-416
- Script: Metadata toggle, variant selection logic, dropdown state
- Styles: All metadata panel styling

**Responsibilities**:
- Collapsible right sidebar
- Source file metadata display (with variant dropdown)
- Cloud storage metadata display
- Embedded PDF metadata display
- Variant selection and switching
- Earlier copy detection

**Interface**:
```vue
<template>
  <DocumentMetadataPanel
    :evidence="evidence"
    :storage-metadata="storageMetadata"
    :source-metadata-variants="sourceMetadataVariants"
    :selected-metadata-hash="selectedMetadataHash"
    :earlier-copy-hash="earlierCopyHash"
    :dropdown-open="metadataDropdownOpen"
    :visible="metadataVisible"
    @toggle-visibility="toggleMetadata"
    @variant-selected="handleMetadataSelection"
    @dropdown-toggled="handleMetadataDropdownToggle"
  />
</template>
```

**Props**:
- `evidence: Object` - Evidence document from Firestore
- `storageMetadata: Object` - Storage metadata from Cloud Storage
- `sourceMetadataVariants: Array` - Available source metadata variants
- `selectedMetadataHash: String` - Currently selected variant hash
- `earlierCopyHash: String | null` - Hash of earlier copy if detected
- `dropdownOpen: Boolean` - Variant dropdown open state
- `visible: Boolean` - Whether metadata panel is visible

**Events**:
- `toggle-visibility` - Toggle metadata panel visibility
- `variant-selected(hash)` - Metadata variant selected from dropdown
- `dropdown-toggled(open)` - Dropdown open state changed

**File Location**: `src/components/document/DocumentMetadataPanel.vue`

**Internal Structure** (single component, may decompose later):
- Source File Section
  - File name with variant dropdown
  - Upload date
  - File size
  - MIME type
- Cloud Storage Information Section
  - Upload timestamp
  - File hash (BLAKE3)
- Embedded Metadata Section (PDF-specific)
  - PDF metadata key-value pairs
  - Conditional display based on file type

---

### Component 5: ViewDocument.vue (Updated)

**Lines After Refactor**: ~400 lines total
- Template: ~150 lines (component integration)
- Script: ~200 lines (orchestration logic)
- Styles: ~50 lines (container layout only)

**Retained Responsibilities**:
- Route parameter handling
- Document ID extraction from URL
- Organizer store integration
- Data fetching and caching
- Background pre-loading system
- Keyboard event handling
- State management (reactive refs)
- Composable integration
- Lifecycle management

**Updated Template Structure**:
```vue
<template>
  <div class="view-document-container">
    <div class="view-document-content">
      <!-- Left Panel -->
      <PdfThumbnailPanel
        :is-pdf-file="isPdfFile"
        :pdf-document="pdfDocument"
        :total-pages="totalPages"
        :current-visible-page="currentVisiblePage"
        :visible="thumbnailsVisible"
        @toggle-visibility="toggleThumbnails"
        @page-selected="handleThumbnailClick"
      />

      <!-- Center Panel -->
      <div class="view-document-center">
        <DocumentNavigationBar
          :current-document-index="currentDocumentIndex"
          :total-documents="totalDocuments"
          :is-pdf-file="isPdfFile"
          :current-page="currentVisiblePage"
          :total-pages="totalPages"
          @navigate-first="goToFirstDocument"
          @navigate-previous="goToPreviousDocument"
          @navigate-next="goToNextDocument"
          @navigate-last="goToLastDocument"
          @jump-to-page="handlePageJump"
        />

        <PdfViewerArea
          :is-pdf-file="isPdfFile"
          :pdf-document="pdfDocument"
          :total-pages="totalPages"
          :viewer-loading="viewerLoading"
          :loading-document="loadingDocument"
          :pdf-load-error="pdfLoadError"
          @page-rendered="handlePageRendered"
        />
      </div>

      <!-- Right Panel -->
      <DocumentMetadataPanel
        :evidence="evidence"
        :storage-metadata="storageMetadata"
        :source-metadata-variants="sourceMetadataVariants"
        :selected-metadata-hash="selectedMetadataHash"
        :earlier-copy-hash="earlierCopyHash"
        :dropdown-open="metadataDropdownOpen"
        :visible="metadataVisible"
        @toggle-visibility="toggleMetadata"
        @variant-selected="handleMetadataSelection"
        @dropdown-toggled="handleMetadataDropdownToggle"
      />
    </div>
  </div>
</template>
```

---

## Implementation Order

### Step 1: Create Component Files
1. Create `src/components/document/` directory (if doesn't exist)
2. Create 4 new component files with boilerplate structure

### Step 2: Extract Components (One at a time)
1. **Start with DocumentNavigationBar.vue** (simplest, least dependencies)
   - Copy template section
   - Copy navigation methods
   - Copy relevant styles
   - Define props and events
   - Test in isolation

2. **Extract PdfThumbnailPanel.vue** (simple, clear boundaries)
   - Copy template section
   - Copy thumbnail toggle logic
   - Copy relevant styles
   - Define props and events
   - Test in isolation

3. **Extract PdfViewerArea.vue** (moderate complexity)
   - Copy template section
   - Copy viewer state logic
   - Copy relevant styles
   - Define props and events
   - Test in isolation

4. **Extract DocumentMetadataPanel.vue** (most complex)
   - Copy entire metadata template section
   - Copy variant selection logic
   - Copy dropdown state management
   - Copy all metadata styles
   - Define props and events
   - Test in isolation

### Step 3: Update ViewDocument.vue
1. Import all 4 new components
2. Replace template sections with component tags
3. Pass props from parent state
4. Handle events from child components
5. Remove extracted code from script
6. Remove extracted styles
7. Keep only container/layout styles

### Step 4: Integration Testing
1. Test document navigation (all buttons, keyboard shortcuts)
2. Test thumbnail panel (toggle, page selection)
3. Test PDF viewer (rendering, scrolling, page visibility)
4. Test metadata panel (toggle, variant selection, dropdown)
5. Test cross-component interactions
6. Test responsive behavior
7. Verify pre-loading still works
8. Check performance (should be same or better)

---

## Phase 2: Testing & Verification

### Manual Testing Checklist

#### Navigation Testing
- [ ] First document button works
- [ ] Previous document button works
- [ ] Next document button works
- [ ] Last document button works
- [ ] Page jump input works (PDFs only)
- [ ] Navigation buttons disabled at boundaries
- [ ] Keyboard shortcuts work (arrow keys, page up/down, home/end)

#### Thumbnail Panel Testing
- [ ] Panel toggles open/closed
- [ ] Thumbnails render correctly
- [ ] Clicking thumbnail navigates to page
- [ ] Current page highlighted in thumbnails
- [ ] Panel hidden for non-PDF files

#### PDF Viewer Testing
- [ ] PDF pages render correctly
- [ ] Continuous scroll works
- [ ] Page visibility tracking works
- [ ] Loading states display properly
- [ ] Error states display properly
- [ ] Non-PDF placeholder shows correctly

#### Metadata Panel Testing
- [ ] Panel toggles open/closed
- [ ] Source file metadata displays
- [ ] Variant dropdown opens/closes
- [ ] Variant selection works
- [ ] Earlier copy warning shows when applicable
- [ ] Cloud storage metadata displays
- [ ] Embedded PDF metadata displays (PDFs only)

#### Integration Testing
- [ ] Navigation updates all panels
- [ ] Pre-loading still works in background
- [ ] Performance is same or better
- [ ] No console errors
- [ ] No prop validation errors
- [ ] Responsive layout still works

### Automated Testing Considerations

**Component Tests** (Vitest + Vue Test Utils):
- Test each component in isolation
- Mock props and verify events
- Test conditional rendering
- Test user interactions

**Integration Tests**:
- Test ViewDocument.vue with child components
- Verify data flow between components
- Test event handling

---

## Expected Outcomes

### Before Decomposition
- **1 file**: ViewDocument.vue (1,903 lines)
- **Complexity**: High (9 distinct responsibilities)
- **Maintainability**: Low (cognitive overload)
- **Testability**: Difficult (too many concerns)

### After Phase 1 Decomposition
- **5 files**:
  - ViewDocument.vue (~400 lines) - Orchestrator
  - DocumentNavigationBar.vue (~100 lines)
  - PdfThumbnailPanel.vue (~80 lines)
  - PdfViewerArea.vue (~120 lines)
  - DocumentMetadataPanel.vue (~300 lines)
- **Total Lines**: ~1,000 lines (similar total, better organized)
- **Complexity**: Medium (clear separation of concerns)
- **Maintainability**: High (each file has single responsibility)
- **Testability**: Excellent (small, focused components)

### Metrics
- **Main component size reduction**: 1,903 → 400 lines (79% reduction)
- **Number of components**: 1 → 5
- **Average component size**: 1,903 → 200 lines
- **Largest component**: 1,903 → 400 lines (ViewDocument.vue orchestrator)

---

## Future Enhancements (Not in Phase 1)

### Phase 3: Extract Composables (Future)
If orchestration logic in ViewDocument.vue becomes too complex (>500 lines):

1. **useDocumentNavigation.js** (~150 lines)
   - Extract navigation state and methods
   - Returns: currentDocumentIndex, navigation functions

2. **useDocumentMetadata.js** (~250 lines)
   - Extract evidence/metadata fetching
   - Returns: loadEvidence, fetchStorageMetadata, caching functions

3. **useMetadataVariants.js** (~100 lines)
   - Extract variant selection logic
   - Returns: variants, selectedHash, selection handlers

4. **useDocumentPreloading.js** (~200 lines)
   - Extract pre-loading system
   - Returns: startBackgroundPreload, preload functions

### Phase 4: Decompose DocumentMetadataPanel (Future)
If DocumentMetadataPanel.vue becomes too complex (>400 lines):

1. **SourceFileSection.vue** (~100 lines)
   - File name dropdown, date, size, MIME type

2. **CloudStorageSection.vue** (~50 lines)
   - Upload timestamp, file hash

3. **EmbeddedMetadataSection.vue** (~150 lines)
   - PDF metadata key-value display

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**:
- Extract one component at a time
- Test after each extraction
- Keep git history clean with atomic commits

### Risk 2: Props/Events Complexity
**Mitigation**:
- Keep props simple and well-documented
- Use TypeScript interfaces for clarity (future)
- Document prop/event contracts in this plan

### Risk 3: Performance Regression
**Mitigation**:
- Monitor load times before/after
- Use Vue DevTools to check component render times
- Keep pre-loading system intact in parent

### Risk 4: State Management Confusion
**Mitigation**:
- Keep all state in ViewDocument.vue (single source of truth)
- Child components are stateless (props in, events out)
- Document data flow clearly

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All 4 components extracted and tested
- [ ] ViewDocument.vue reduced to ~400 lines
- [ ] All existing functionality works
- [ ] No console errors or warnings
- [ ] Manual testing checklist complete
- [ ] Code review approved
- [ ] Changes committed with descriptive messages

### Overall Success When:
- [ ] Main component is maintainable (≤400 lines)
- [ ] Each component has single, clear responsibility
- [ ] Code is easier to understand and modify
- [ ] New developers can navigate codebase faster
- [ ] Testing is easier and more focused
- [ ] Performance is same or better
- [ ] No regressions in functionality

---

## References

### Related Documentation
- `@docs/architecture/overview.md` - Component architecture patterns
- `@docs/architecture/file-lifecycle.md` - File terminology standards
- `@docs/front-end/DocumentTable.md` - Related document display patterns

### Related Components
- `PdfPageCanvas.vue` - Used by PdfViewerArea
- `PdfThumbnailList.vue` - Used by PdfThumbnailPanel

### Related Composables
- `usePdfMetadata.js` - PDF metadata extraction
- `usePdfCache.js` - PDF caching layer
- `usePdfViewer.js` - PDF viewer logic
- `usePageVisibility.js` - Page visibility tracking

---

## Notes

- This decomposition follows Vue 3 Composition API best practices
- Styles remain scoped within each component (SFC pattern)
- Parent component retains orchestration responsibility (KISS principle)
- Further decomposition can be done incrementally if needed
- Focus is on maintainability and readability, not premature optimization
