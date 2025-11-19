# /src Folder Restructure v3 - FINAL PLAN
## Optimized for Claude Code LLM Traversal

### Design Philosophy

This structure is optimized for AI-assisted development using Claude Code/Sonnet 4.5, following evidence-based best practices:

1. **Progressive Disclosure**: General → Specific hierarchy (max 5 levels deep)
2. **Descriptive Folder Names**: Folder names clearly indicate contents for LLM navigation
3. **Feature-Based Organization**: Domain logic grouped together (authentication, documents, matters, etc.)
4. **Path Provides Context**: Avoid redundant naming (folder location indicates purpose)
5. **Shallow Hierarchies**: Minimize nesting to improve discoverability
6. **Single Responsibility**: Each folder has one clear purpose

### Key Research Findings Applied

Based on analysis of 138+ production Claude Code implementations:
- Keep folder hierarchy shallow (2-4 levels typical, 5 max)
- Use domain-based organization over technical patterns
- Group all related code for a feature together
- Folder names should be self-documenting
- Each folder should support a future CLAUDE.md index file

---

## Proposed Structure

```
src/
├── App.vue                              # Root component
├── main.js                              # App entry point
│
├── core/                                # 🏗️ Application foundation (cross-feature infrastructure)
│   ├── auth/                            # Authentication infrastructure
│   │   └── stores/                      # Auth state management (authStore, authFirmSetup, etc.)
│   ├── firm/                            # Firm infrastructure
│   │   └── stores/                      # Firm state management (firm.js)
│   └── composables/                     # Core cross-feature composables
│       └── useNotification.js           # Shared notification system
│
├── features/                            # 🎨 Feature vertical slices (domain-driven modules)
│   │
│   ├── authentication/                  # Authentication feature
│   │   ├── components/
│   │   │   └── LoginForm.vue            ← FROM components/features/auth/
│   │   ├── services/
│   │   │   └── authService.js           ← FROM services/
│   │   ├── guards/
│   │   │   └── authGuard.js             ← FROM router/guards/auth.js
│   │   └── views/
│   │       └── (future auth views)
│   │
│   ├── matters/                         # Matter/case management feature
│   │   ├── components/
│   │   │   └── (future matter components)
│   │   ├── composables/
│   │   │   └── useMatters.js            ← FROM composables/
│   │   ├── guards/
│   │   │   └── matterGuard.js           ← FROM router/guards/matter.js
│   │   ├── services/
│   │   │   └── matterService.js         ← FROM services/
│   │   ├── stores/
│   │   │   └── matterView.js            ← FROM stores/
│   │   ├── utils/
│   │   │   └── seedMatters.js           ← FROM utils/
│   │   └── views/
│   │       ├── Matters.vue              ← FROM views/
│   │       ├── MatterDetail.vue         ← FROM views/
│   │       ├── EditMatter.vue           ← FROM views/
│   │       ├── NewMatter.vue            ← FROM views/
│   │       └── MatterImport.vue         ← FROM views/
│   │
│   ├── documents/                       # Document organization & management (formerly "organizer")
│   │   ├── components/
│   │   │   ├── table/                   # Document table components
│   │   │   │   ├── DocumentTable.vue    ← FROM components/base/DocumentTable.vue
│   │   │   │   ├── cells/               # Table cell components
│   │   │   │   │   └── (existing cell components from features/organizer/components/cells/)
│   │   │   │   ├── DragHandle.vue       ← FROM components/base/
│   │   │   │   ├── CellContentTooltip.vue ← FROM components/base/
│   │   │   │   └── DocumentPeekTooltip.vue ← FROM components/base/
│   │   │   ├── viewer/                  # Document viewer components
│   │   │   │   ├── DocumentNavigationBar.vue  ← FROM components/document/
│   │   │   │   ├── DocumentMetadataPanel.vue  ← FROM components/document/
│   │   │   │   ├── PdfViewerArea.vue          ← FROM components/document/
│   │   │   │   └── PdfThumbnailPanel.vue      ← FROM components/document/
│   │   │   ├── ai-analysis/             # AI analysis components
│   │   │   │   ├── AIAnalysisTab.vue           ← FROM components/document/tabs/
│   │   │   │   ├── DigitalFileTab.vue          ← FROM components/document/tabs/
│   │   │   │   ├── DocumentTab.vue             ← FROM components/document/tabs/
│   │   │   │   ├── ReviewTab.vue               ← FROM components/document/tabs/
│   │   │   │   ├── AIAnalysisButton.vue        ← FROM components/document/tabs/ai-analysis/
│   │   │   │   ├── AIAnalysisError.vue         ← FROM components/document/tabs/ai-analysis/
│   │   │   │   ├── AIAnalysisFieldItem.vue     ← FROM components/document/tabs/ai-analysis/
│   │   │   │   └── AIReviewFieldItem.vue       ← FROM components/document/tabs/ai-analysis/
│   │   │   └── tags/                    # Tag editing components
│   │   │       ├── EditableTag.vue      ← FROM components/features/tags/
│   │   │       └── composables/
│   │   │           └── useTagEditing.js ← FROM components/features/tags/composables/
│   │   ├── composables/
│   │   │   ├── useAIAnalysis.js         ← FROM composables/
│   │   │   ├── useCellTooltip.js        ← FROM composables/
│   │   │   ├── useColumnDragDrop.js     ← FROM composables/
│   │   │   ├── useColumnResize.js       ← FROM composables/
│   │   │   ├── useColumnSort.js         ← FROM composables/
│   │   │   ├── useColumnVisibility.js   ← FROM composables/
│   │   │   ├── useDocumentPeek.js       ← FROM composables/
│   │   │   ├── useDocumentTablePeek.js  ← FROM composables/
│   │   │   ├── useTooltipTiming.js      ← FROM composables/
│   │   │   ├── useVirtualTable.js       ← FROM composables/
│   │   │   └── (existing from features/organizer/composables/)
│   │   ├── services/
│   │   │   ├── aiMetadataExtractionService.js ← FROM services/
│   │   │   ├── fileService.js                  ← FROM services/
│   │   │   └── (existing from features/organizer/services/)
│   │   ├── stores/
│   │   │   ├── documentView.js          ← FROM stores/
│   │   │   └── (existing from features/organizer/stores/)
│   │   ├── utils/
│   │   │   ├── categoryFieldMapping.js  ← FROM utils/
│   │   │   └── (existing from features/organizer/utils/)
│   │   ├── constants/
│   │   │   └── (existing from features/organizer/constants/)
│   │   ├── types/
│   │   │   └── (existing from features/organizer/types/)
│   │   └── views/
│   │       ├── Documents.vue            ← FROM views/
│   │       ├── Analyze.vue              ← FROM views/
│   │       └── (existing from features/organizer/views/)
│   │
│   ├── categories/                      # Category/tag management (future extraction from documents)
│   │   └── (placeholder for future category management feature)
│   │
│   ├── profile/                         # User profile & settings feature
│   │   ├── composables/
│   │   │   ├── useFirmMembers.js        ← FROM composables/
│   │   │   └── useUsers.js              ← FROM composables/
│   │   ├── services/
│   │   │   ├── profileService.js        ← FROM services/
│   │   │   └── userService.js           ← FROM services/
│   │   ├── stores/
│   │   │   └── userPreferences.js       ← FROM stores/ (if exists)
│   │   └── views/
│   │       ├── Profile.vue              ← FROM views/
│   │       └── Settings.vue             ← FROM views/
│   │
│   └── upload/                          # File upload & processing feature
│       ├── components/
│       │   └── (existing components from features/upload/components/)
│       │       └── (also consolidate from components/features/upload/)
│       ├── composables/
│       │   ├── deduplication/           # Deduplication composables
│       │   │   └── (existing from features/upload/composables/deduplication/)
│       │   ├── webWorker/               # Worker management composables
│       │   │   └── (existing from features/upload/composables/webWorker/)
│       │   └── (other existing from features/upload/composables/)
│       ├── workers/
│       │   └── (existing from features/upload/workers/)
│       ├── services/
│       │   └── uploadService.js         ← FROM services/
│       ├── utils/
│       │   └── (existing from features/upload/utils/)
│       └── views/
│           └── (future upload views)
│
├── shared/                              # 🔗 Cross-feature shared components & utilities
│   ├── components/
│   │   ├── layout/                      # App-wide layout components
│   │   │   ├── AppHeader.vue            ← FROM components/layout/
│   │   │   └── AppSideBar.vue           ← FROM components/layout/
│   │   ├── navigation/                  # Navigation components
│   │   │   └── AppSwitcher.vue          ← FROM components/AppSwitcher.vue
│   │   ├── base/                        # Generic base/primitive components
│   │   │   ├── BaseSearchBar.vue        ← FROM components/base/
│   │   │   ├── HoldToConfirmButton.vue  ← FROM components/base/
│   │   │   └── ClearAllButton.vue       ← FROM shared/components/ (if exists)
│   │   ├── home/                        # Home/landing page components
│   │   │   ├── AddAppTab.vue            ← FROM components/home/
│   │   │   ├── FeaturesTab.vue          ← FROM components/home/
│   │   │   ├── FirstAppTab.vue          ← FROM components/home/
│   │   │   └── LocalDevTab.vue          ← FROM components/home/
│   │   └── ui/                          # Generic UI elements
│   │       └── SegmentedControl.vue     ← FROM components/ui/
│   └── composables/                     # Shared composables (if any exist)
│       └── (future shared composables that don't belong in core/)
│
├── views/                               # 🎯 Top-level route entry points (navigation scaffolding)
│   ├── Home.vue                         # Home/landing view
│   ├── About.vue                        # About page
│   ├── Testing.vue                      # Development testing view
│   └── defaults/                        # Default/error views
│       ├── PageNotFound.vue
│       └── UnderConstruction.vue
│   └── (Note: Most feature views moved to features/{feature}/views/)
│
├── router/                              # 🧭 Application routing
│   ├── index.js                         # Main router configuration
│   └── guards/                          # ⚠️ DEPRECATED - Guards moved to feature folders
│       └── (empty - move guards to features/{feature}/guards/)
│
├── services/                            # 🔧 Shared services (cross-feature only)
│   ├── firebase.js                      # ✅ KEEP - Shared Firebase initialization
│   └── firmService.js                   # ✅ KEEP - Shared firm operations
│
├── stores/                              # ⚠️ DEPRECATED - Stores moved to features or core
│   └── (empty - move stores to features/{feature}/stores/ or core/{domain}/stores/)
│
├── utils/                               # 🛠️ Truly shared utilities (generic, cross-feature)
│   ├── analyzeMockData.js               # Development/testing utilities
│   ├── cloudMockData.js
│   ├── dateFormatter.js                 # Generic date formatting
│   ├── errorMessages.js                 # Generic error handling
│   ├── memoryTracking.js                # Development utilities
│   ├── mimeTypeFormatter.js             # Generic MIME type handling
│   ├── performanceMonitor.js            # Development utilities
│   └── webglDetection.js                # Browser capability detection
│
├── composables/                         # ⚠️ DEPRECATED - Composables moved to features or core
│   └── (empty - move to features/{feature}/composables/ or core/composables/)
│
├── components/                          # ⚠️ DEPRECATED - Components moved to features or shared
│   └── (empty - move to features/{feature}/components/ or shared/components/)
│
├── config/                              # ⚙️ Application configuration
│   └── (existing config files)
│
├── plugins/                             # 🔌 Vue plugins (Vuetify, etc.)
│   └── (existing plugins)
│
├── styles/                              # 🎨 Global styles
│   └── (existing styles)
│
├── assets/                              # 📦 Static assets
│   ├── icons/
│   │   └── file_types/
│   ├── images/
│   │   └── snapshots/
│   └── precedents/
│       └── CourtForms/
│           ├── CAN/
│           │   ├── BC/
│           │   └── NB/
│           └── USA/
│               └── California/
│
├── dev-demos/                           # 🛠️ Development demos (not in production)
│   ├── components/
│   ├── composables/
│   ├── services/
│   ├── utils/
│   └── views/
│
└── test-utils/                          # 🧪 Testing utilities
    └── (existing test-utils)
```

---

## Key Organizational Principles

### 1. Feature-Based Vertical Slices

Each feature folder (`features/{feature}/`) contains ALL code for that domain:
- Components (UI elements)
- Composables (reactive logic)
- Services (business logic, API calls)
- Stores (state management)
- Guards (route protection)
- Views (route entry points)
- Utils (feature-specific utilities)
- Constants (feature-specific constants)
- Types (TypeScript types)

**Rationale**: When Claude needs to work on "matter management," all related code is in `features/matters/`. This aligns with how developers think about features and dramatically improves discoverability.

### 2. Core vs. Features vs. Shared

**Core**: Infrastructure that multiple features depend on but is foundational to the app
- Auth stores (used by all features)
- Firm stores (used by all features)
- Core composables (useNotification - used everywhere)

**Features**: Domain-specific functionality
- All code for authentication, matters, documents, upload, profile
- Self-contained vertical slices

**Shared**: Generic, reusable components and utilities with no domain specificity
- Layout components (AppHeader, AppSideBar)
- Base components (buttons, inputs)
- Generic utilities (dateFormatter, mimeTypeFormatter)

**Key Distinction**:
- Core = foundational infrastructure (auth, firm)
- Shared = generic reusable components (no business logic)
- Features = business domains (authentication process, matter management, document organization)

### 3. Folder Naming for LLM Discoverability

Folder names optimized for Claude Code search:
- ✅ `documents/` - Clear, searchable domain name
- ✅ `ai-analysis/` - Descriptive, specific purpose
- ✅ `webWorker/` - Clear technical context
- ❌ `misc/` - Ambiguous
- ❌ `helpers/` - Too generic

### 4. Shallow Hierarchies

Maximum depth: 5 levels (typically 3-4)
- Example: `features/documents/components/ai-analysis/AIAnalysisButton.vue` (5 levels)
- Avoids: Deep nesting that makes navigation difficult

### 5. Progressive Disclosure Support

Structure supports future CLAUDE.md indexing:
- Each major folder can have a CLAUDE.md index
- Top-level folders (core, features, shared) are natural index boundaries
- Feature folders are self-contained documentation units

---

## Migration Priorities

### Phase 1: Core Infrastructure Consolidation
**Goal**: Establish clear foundation layer

1. **Consolidate auth infrastructure**
   - Keep `core/auth/stores/` (already done)
   - Move `services/authService.js` → `features/authentication/services/`
   - Move `router/guards/auth.js` → `features/authentication/guards/`

2. **Consolidate firm infrastructure**
   - Create `core/firm/stores/`
   - Move firm-related stores to `core/firm/stores/`

3. **Core composables**
   - Verify `core/composables/useNotification.js` is in place

### Phase 2: Feature Consolidation
**Goal**: Group all related code by domain

1. **Matters feature**
   - Move `composables/useMatters.js` → `features/matters/composables/`
   - Move `services/matterService.js` → `features/matters/services/`
   - Move `stores/matterView.js` → `features/matters/stores/`
   - Move `utils/seedMatters.js` → `features/matters/utils/`
   - Move `router/guards/matter.js` → `features/matters/guards/`
   - Move all matter views from `views/` → `features/matters/views/`

2. **Documents feature** (rename from organizer)
   - Rename `features/organizer/` → `features/documents/`
   - Move `components/base/DocumentTable.vue` → `features/documents/components/table/`
   - Move `components/base/DragHandle.vue` → `features/documents/components/table/`
   - Move `components/base/CellContentTooltip.vue` → `features/documents/components/table/`
   - Move `components/base/DocumentPeekTooltip.vue` → `features/documents/components/table/`
   - Move `components/document/` → `features/documents/components/viewer/`
   - Move `components/document/tabs/` → `features/documents/components/ai-analysis/`
   - Move `components/features/tags/` → `features/documents/components/tags/`
   - Move document-related composables → `features/documents/composables/`
   - Move document-related services → `features/documents/services/`
   - Move `stores/documentView.js` → `features/documents/stores/`
   - Move document views from `views/` → `features/documents/views/`

3. **Upload feature**
   - Consolidate `components/features/upload/` → `features/upload/components/`
   - Move `services/uploadService.js` → `features/upload/services/`
   - Keep existing structure for composables, workers, utils

4. **Profile feature**
   - Move `composables/useFirmMembers.js` → `features/profile/composables/`
   - Move `composables/useUsers.js` → `features/profile/composables/`
   - Move `services/profileService.js` → `features/profile/services/`
   - Move `services/userService.js` → `features/profile/services/`
   - Move profile views from `views/` → `features/profile/views/`

5. **Authentication feature**
   - Move `components/features/auth/` → `features/authentication/components/`
   - Move `services/authService.js` → `features/authentication/services/`
   - Move `router/guards/auth.js` → `features/authentication/guards/`

### Phase 3: Shared Consolidation
**Goal**: Centralize truly cross-cutting components

1. **Layout components**
   - Move `components/layout/` → `shared/components/layout/`

2. **Navigation components**
   - Move `components/AppSwitcher.vue` → `shared/components/navigation/`

3. **Base components**
   - Move `components/base/BaseSearchBar.vue` → `shared/components/base/`
   - Move `components/base/HoldToConfirmButton.vue` → `shared/components/base/`

4. **Home components**
   - Move `components/home/` → `shared/components/home/`

5. **UI components**
   - Move `components/ui/` → `shared/components/ui/`

### Phase 4: Cleanup Deprecated Folders
**Goal**: Remove empty deprecated folders

1. Clean up empty folders:
   - `stores/` (after moving all to features or core)
   - `composables/` (after moving all to features or core)
   - `components/` (after moving all to features or shared)
   - `router/guards/` (after moving all to features)

2. Add README.md files to deprecated folders explaining the new structure

---

## Folder Depth Analysis

**Level 1** (7 folders): `core/`, `features/`, `shared/`, `views/`, `router/`, `services/`, `utils/`, `config/`, `plugins/`, `styles/`, `assets/`, `dev-demos/`, `test-utils/`

**Level 2** (by domain):
- `core/`: 3 folders (auth, firm, composables)
- `features/`: 6 features (authentication, matters, documents, categories, profile, upload)
- `shared/`: 2 folders (components, composables)

**Level 3** (by code type):
- Feature subfolders: components, composables, services, stores, guards, views, utils, constants, types
- Average: 5-7 subfolders per feature

**Level 4** (component organization):
- Documents feature: table, viewer, ai-analysis, tags
- Upload feature: deduplication, webWorker

**Level 5** (deepest - rare):
- `features/documents/components/ai-analysis/` (component files)
- `features/upload/composables/webWorker/` (composable files)

**Maximum depth: 5 levels** ✅ (within research-recommended limits)

---

## Benefits for Claude Code

### 1. Improved Search Efficiency
When Claude searches for "matter," it finds:
- `features/matters/` (all matter-related code)
- Clear subfolder organization (components, services, stores, etc.)

### 2. Progressive Context Loading
Claude can:
1. Start with high-level features
2. Navigate to specific subfolder (e.g., `services/`)
3. Find exact file (e.g., `matterService.js`)

### 3. Clear Boundaries
Each feature is self-contained:
- No confusion about where code lives
- Clear ownership and responsibility
- Easy to add future CLAUDE.md indexes

### 4. Hierarchical Understanding
Folder structure mirrors mental model:
- `features/` = business domains
- `core/` = foundational infrastructure
- `shared/` = generic reusable components

### 5. Reduced Token Usage
When working on a feature:
- Claude only needs to load that feature's context
- Cross-references to other features are explicit
- Shared code clearly identified

---

## Examples of LLM Navigation Patterns

### Example 1: "Show me the matter management code"
**Claude's navigation**:
1. Searches for "matter" → finds `features/matters/`
2. Sees clear structure: components, services, stores, views
3. Loads relevant files based on task

**Token efficiency**: Loads only `features/matters/` context (~5-10 files)

### Example 2: "How does document upload work?"
**Claude's navigation**:
1. Searches for "upload" → finds `features/upload/`
2. Sees subfolders: components, composables (deduplication, webWorker), workers, services
3. Identifies `workers/` for hashing logic, `services/` for upload flow

**Token efficiency**: Progressive disclosure through clear hierarchy

### Example 3: "Update the app header"
**Claude's navigation**:
1. Searches for "header" → finds `shared/components/layout/AppHeader.vue`
2. Recognizes it's shared (not feature-specific)
3. Checks for dependencies in features

**Token efficiency**: Shared components clearly separated from feature code

### Example 4: "Fix authentication issue"
**Claude's navigation**:
1. Searches for "auth" → finds multiple locations:
   - `core/auth/stores/` (auth state)
   - `features/authentication/` (auth feature)
2. Understands separation:
   - Core = state management
   - Feature = UI and logic
3. Loads both contexts as needed

**Token efficiency**: Clear separation of concerns

---

## Comparison with Previous Versions

### v1 → v2 Changes
- Moved from scattered views to feature-based views
- Clarified core vs. shared distinction
- Emphasized naming conventions for token efficiency

### v2 → v3 Changes (This Plan)
1. **Simplified folder hierarchy**
   - Reduced nesting where possible
   - Clearer folder purposes

2. **Stronger LLM optimization**
   - Folder names optimized for search
   - Progressive disclosure support
   - Shallow hierarchies (max 5 levels)

3. **Clearer core/feature/shared distinction**
   - Core = foundational infrastructure (auth, firm)
   - Features = business domains
   - Shared = generic reusable components

4. **Better component organization within features**
   - Documents: table, viewer, ai-analysis, tags
   - Upload: deduplication, webWorker
   - Logical groupings vs. flat structure

5. **Migration priorities refined**
   - Clear phase-by-phase approach
   - Specific file movements documented
   - Deprecated folder cleanup strategy

---

## IMPORTANT: No File Renaming

**This plan focuses EXCLUSIVELY on folder/subfolder reorganization.**

- ✅ DO: Move files to new folder locations
- ✅ DO: Rename folders (e.g., `organizer/` → `documents/`)
- ✅ DO: Create new folder structures
- ❌ DO NOT: Rename any files
- ❌ DO NOT: Change file extensions
- ❌ DO NOT: Modify file contents (except import paths)

**Rationale**: Renaming files and folders simultaneously makes it nearly impossible to track which new files correspond to which old files. Complete folder reorganization first, then consider file renaming in a separate phase.

---

## Future Enhancements

### 1. CLAUDE.md Index Files
After folder restructure is complete, add index files:
- `src/CLAUDE.md` (root index)
- `src/features/CLAUDE.md` (features index)
- `src/features/{feature}/CLAUDE.md` (per-feature index)

### 2. Feature-Specific Documentation
Create `docs/features/{feature}/` for detailed documentation

### 3. Automated Import Path Updates
Use tooling to update all import paths after migration

### 4. Testing Strategy
Ensure all imports are correct after each migration phase

---

## Success Criteria

This restructure is successful if:

1. ✅ **Discoverability**: Claude can find feature code in <3 searches
2. ✅ **Hierarchy**: Maximum folder depth ≤ 5 levels
3. ✅ **Clarity**: Each folder has single, clear purpose
4. ✅ **Token Efficiency**: Claude loads only relevant feature context
5. ✅ **Maintainability**: New developers understand structure quickly
6. ✅ **Scalability**: Easy to add new features following pattern
7. ✅ **Backward Compatible**: No file renaming, only moves

---

## Questions & Decisions

### Resolved
1. ✅ Core vs. Shared distinction clarified
2. ✅ Feature folder structure defined
3. ✅ Max hierarchy depth set (5 levels)
4. ✅ Naming conventions optimized for LLM
5. ✅ Migration priorities established

### Open Questions
1. Should `router/index.js` move to `core/router/`?
   - **Recommendation**: Keep at top level for now (convention)

2. Should services/firebase.js move to `core/services/`?
   - **Recommendation**: Consider moving to `core/firebase/` with config

3. When to create `features/categories/`?
   - **Recommendation**: After extracting from documents feature

4. Should feature views move to feature folders or stay in top-level `views/`?
   - **Recommendation**: Move to feature folders for better encapsulation
   - Keep only generic views (Home, About, Testing, defaults) in top-level `views/`

---

## Implementation Notes

### Import Path Updates
After moving folders, update all imports:
```javascript
// OLD
import { useMatters } from '@/composables/useMatters'
import matterService from '@/services/matterService'

// NEW
import { useMatters } from '@/features/matters/composables/useMatters'
import matterService from '@/features/matters/services/matterService'
```

### Router Updates
Update router to import feature views:
```javascript
// OLD
import Matters from '@/views/Matters.vue'

// NEW
import Matters from '@/features/matters/views/Matters.vue'
```

### Vite Alias Configuration
Consider adding feature aliases in `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
    '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
    '@shared': fileURLToPath(new URL('./src/shared', import.meta.url))
  }
}
```

---

## Conclusion

This v3 structure represents the optimal organization for Claude Code/LLM traversal:

- **Evidence-based**: Follows research on 138+ production implementations
- **LLM-optimized**: Clear hierarchies, descriptive names, progressive disclosure
- **Feature-focused**: Domain-driven organization matching mental models
- **Scalable**: Easy to add new features following established patterns
- **Maintainable**: Clear boundaries and single responsibilities

The structure balances theoretical best practices with practical implementation considerations, creating a foundation for efficient AI-assisted development.
