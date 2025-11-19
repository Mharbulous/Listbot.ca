# Proposed /src Folder Restructure v2
## Philosophy: Views as Navigation Scaffolding + Features as Domain Logic

### Core Principles

1. **Views = Navigation Menu Items** (route entry points, composition shells)
2. **Features = Domain Logic** (reusable functionality, business logic)
3. **Views compose Features** (views are thin shells that orchestrate feature components)
4. **Shared = Cross-cutting concerns** (used by multiple features/views)
5. **Core = Foundation** (auth, routing, app-level concerns)

---

## Proposed Structure

```
src/
├── views/                              # 🎯 Navigation menu items (route entry points)
│   ├── About.vue                       # ℹ️ Information menu item
│   ├── Analyze.vue                     # 🕵️ Analyze menu item
│   ├── Categories.vue                  # 🗃️ Categories menu item (new)
│   ├── Documents.vue                   # 📁 Documents menu item
│   ├── Home.vue                        # 🏠 Home/landing
│   ├── List.vue                        # 📃 List menu item
│   ├── Matters.vue                     # 🗄️ Matters menu item
│   ├── MatterDetail.vue                # 🗄️ Individual matter view
│   ├── Profile.vue                     # 👤 User profile
│   ├── Settings.vue                    # ⚙️ App settings
│   ├── Upload.vue                      # 📤 Upload menu item
│   ├── Login.vue                       # 🔐 Login page
│   └── defaults/                       # Default/error views
│       ├── UnderConstruction.vue
│       └── PageNotFound.vue
│
├── features/                           # 🎨 Domain-specific feature modules
│   ├── matters/                        # Matter/case management
│   │   ├── components/
│   │   │   ├── MatterCard.vue
│   │   │   ├── MatterForm.vue
│   │   │   ├── MatterTable.vue
│   │   │   └── MatterSelector.vue
│   │   ├── composables/
│   │   │   ├── useMatter.js
│   │   │   └── useMatterValidation.js
│   │   ├── stores/
│   │   │   └── matterStore.js
│   │   ├── services/
│   │   │   └── matterService.js
│   │   ├── types/
│   │   │   └── matter.types.ts
│   │   └── utils/
│   │       └── matterUtils.js
│   │
│   ├── documents/                      # Document management (organizer)
│   │   ├── components/
│   │   │   ├── table/                  # Document table components
│   │   │   │   ├── DocumentTable.vue
│   │   │   │   ├── cells/              # Table cell components
│   │   │   │   │   ├── DateCell.vue
│   │   │   │   │   ├── TypeCell.vue
│   │   │   │   │   ├── TagsCell.vue
│   │   │   │   │   └── ActionsCell.vue
│   │   │   │   └── columns/
│   │   │   │       └── columnDefinitions.js
│   │   │   ├── viewer/                 # Document viewer components
│   │   │   │   ├── DocumentViewer.vue
│   │   │   │   ├── PDFViewer.vue
│   │   │   │   ├── ImageViewer.vue
│   │   │   │   ├── NavigationBar.vue
│   │   │   │   └── ThumbnailPanel.vue
│   │   │   ├── ai-analysis/            # AI analysis components
│   │   │   │   ├── AIAnalysisTab.vue
│   │   │   │   ├── DocumentTypeEditor.vue
│   │   │   │   └── DocumentDateEditor.vue
│   │   │   └── DocumentCard.vue
│   │   ├── composables/
│   │   │   ├── useDocumentNavigation.js
│   │   │   ├── useDocumentSelection.js
│   │   │   ├── useDocumentViewer.js
│   │   │   └── usePDFCache.js
│   │   ├── stores/
│   │   │   ├── documentStore.js
│   │   │   └── viewerStore.js
│   │   ├── services/
│   │   │   ├── documentService.js
│   │   │   ├── aiAnalysisService.js
│   │   │   └── pdfService.js
│   │   ├── types/
│   │   │   └── document.types.ts
│   │   └── utils/
│   │       ├── documentUtils.js
│   │       └── pdfUtils.js
│   │
│   ├── categories/                     # Category/tag management
│   │   ├── components/
│   │   │   ├── CategoryManager.vue
│   │   │   ├── CategoryCard.vue
│   │   │   ├── CategorySelector.vue
│   │   │   └── TagEditor.vue
│   │   ├── wizards/                    # Category wizards
│   │   │   ├── CategoryCreationWizard.vue
│   │   │   └── CategoryEditWizard.vue
│   │   ├── composables/
│   │   │   └── useCategory.js
│   │   ├── stores/
│   │   │   └── categoryStore.js
│   │   ├── services/
│   │   │   └── categoryService.js
│   │   └── types/
│   │       └── category.types.ts
│   │
│   ├── upload/                         # File upload & processing
│   │   ├── components/
│   │   │   ├── UploadZone.vue
│   │   │   ├── FileList.vue
│   │   │   ├── FileListItem.vue
│   │   │   ├── UploadProgress.vue
│   │   │   ├── QueueStatusChip.vue
│   │   │   └── ClearFilesMenu.vue
│   │   ├── composables/
│   │   │   ├── useFileUpload.js
│   │   │   ├── useFileHashing.js
│   │   │   ├── useDeduplication.js
│   │   │   └── webWorker/
│   │   │       └── useHashWorker.js
│   │   ├── workers/
│   │   │   └── fileHashWorker.js       # BLAKE3 hashing web worker
│   │   ├── stores/
│   │   │   └── uploadStore.js
│   │   ├── services/
│   │   │   ├── uploadService.js
│   │   │   └── deduplicationService.js
│   │   ├── types/
│   │   │   └── upload.types.ts
│   │   ├── utils/
│   │   │   └── uploadUtils.js
│   │   └── constants/
│   │       └── uploadConstants.js
│   │
│   ├── profile/                        # User profile management
│   │   ├── components/
│   │   │   ├── ProfileForm.vue
│   │   │   └── SettingsPanel.vue
│   │   ├── composables/
│   │   │   └── useProfile.js
│   │   └── services/
│   │       └── profileService.js
│   │
│   └── analyze/                        # Analysis features (future)
│       └── components/
│           └── (placeholder for analyze features)
│
├── core/                               # 🏗️ App foundation & infrastructure
│   ├── auth/                           # Authentication
│   │   ├── stores/
│   │   │   └── authStore.js
│   │   ├── components/
│   │   │   ├── LoginForm.vue
│   │   │   └── AuthGuard.vue
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── guards/
│   │       ├── authGuard.js
│   │       └── matterGuard.js
│   │
│   ├── router/                         # Routing
│   │   ├── index.js
│   │   └── guards/
│   │       ├── auth.js
│   │       └── matter.js
│   │
│   └── config/                         # App configuration
│       ├── firebase.js
│       └── app.config.js
│
├── shared/                             # 🔗 Cross-cutting shared code
│   ├── components/                     # Shared UI components
│   │   ├── layout/
│   │   │   ├── AppSideBar.vue
│   │   │   ├── AppHeader.vue
│   │   │   └── AppSwitcher.vue
│   │   ├── base/                       # Base/primitive components
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseInput.vue
│   │   │   ├── BaseDialog.vue
│   │   │   └── BaseCard.vue
│   │   ├── wizard/                     # Shared wizard components
│   │   │   ├── WizardContainer.vue
│   │   │   ├── WizardStep.vue
│   │   │   ├── WizardNavigation.vue
│   │   │   └── WizardProgressBar.vue
│   │   └── ui/                         # Common UI elements
│   │       ├── LoadingSpinner.vue
│   │       ├── ErrorMessage.vue
│   │       └── ConfirmDialog.vue
│   │
│   ├── composables/                    # Shared composables
│   │   ├── useAsync.js
│   │   ├── useAsyncRegistry.js
│   │   ├── useAsyncInspector.js
│   │   ├── useFavicon.js
│   │   └── useToast.js
│   │
│   ├── services/                       # Shared services
│   │   ├── firebase/
│   │   │   ├── firestore.js
│   │   │   └── storage.js
│   │   └── api/
│   │       └── apiClient.js
│   │
│   ├── stores/                         # Shared Pinia stores
│   │   ├── appStore.js
│   │   └── matterViewStore.js          # Active matter context
│   │
│   ├── utils/                          # Shared utilities
│   │   ├── dateUtils.js
│   │   ├── formatters.js
│   │   └── validators.js
│   │
│   └── types/                          # Shared TypeScript types
│       └── common.types.ts
│
├── plugins/                            # 🔌 Vue plugins (Vuetify, etc.)
│   └── vuetify.js
│
├── styles/                             # 🎨 Global styles
│   ├── main.css
│   ├── variables.css
│   └── tailwind.css
│
├── assets/                             # 📦 Static assets
│   ├── images/
│   ├── icons/
│   └── precedents/
│
├── test-utils/                         # 🧪 Test utilities
│   └── testHelpers.js
│
├── dev-demos/                          # 🛠️ Development demos (not in production)
│   ├── views/
│   ├── components/
│   ├── composables/
│   ├── services/
│   └── utils/
│
├── App.vue                             # Root component
└── main.js                             # App entry point
```

---

## Migration Strategy

### Phase 1: Core Infrastructure
- [x] Consolidate auth under `/core/auth/`
- [ ] Move router guards to `/core/router/guards/`
- [ ] Centralize config to `/core/config/`

### Phase 2: Shared Code
- [ ] Move layout components to `/shared/components/layout/`
- [ ] Consolidate base components to `/shared/components/base/`
- [ ] Move shared composables to `/shared/composables/`
- [ ] Move shared stores to `/shared/stores/`

### Phase 3: Feature Modules
- [ ] Organize **matters** feature
  - Move `/components/features/` matter components → `/features/matters/components/`
  - Move matter-specific stores → `/features/matters/stores/`

- [ ] Organize **documents** feature (rename from "organizer")
  - Rename `/features/organizer/` → `/features/documents/`
  - Consolidate `/components/document/` → `/features/documents/components/`
  - Update all imports from `@/features/organizer/` → `@/features/documents/`

- [ ] Organize **upload** feature
  - Keep `/features/upload/` structure
  - Move `/components/features/upload/` → `/features/upload/components/`

- [ ] Organize **categories** feature
  - Extract from organizer → `/features/categories/`
  - Create `/features/categories/wizards/` for wizard components
  - Move `CategoryCreationWizard.vue` → `/features/categories/wizards/`
  - Move `CategoryEditWizard.vue` → `/features/categories/wizards/`

- [ ] Create shared wizard infrastructure
  - Create `/shared/components/wizard/` folder
  - Add reusable wizard components (WizardContainer, WizardStep, WizardNavigation, WizardProgressBar)
  - Add wizard-related composables to `/shared/composables/` (e.g., `useWizardSteps.js`)

### Phase 4: Views
- [ ] Keep view file names WITHOUT `View` suffix (folder path provides context)
- [ ] Ensure each view is a thin composition shell
- [ ] Update router imports

---

## Key Relationships

### Views → Features
```
📁 Documents.vue (route shell at /views/Documents.vue)
  └── uses 📦 /features/documents/
      ├── DocumentTable.vue
      ├── useDocumentNavigation()
      └── documentStore

📤 Upload.vue (route shell at /views/Upload.vue)
  └── uses 📦 /features/upload/
      ├── UploadZone.vue
      ├── FileList.vue
      └── uploadStore

🗄️ Matters.vue (route shell at /views/Matters.vue)
  └── uses 📦 /features/matters/
      ├── MatterTable.vue
      └── matterStore
```

### Features ↔ Shared
```
📦 /features/documents/
  └── uses 🔗 /shared/
      ├── components/base/BaseButton.vue
      ├── composables/useAsync.js
      └── utils/dateUtils.js
```

### Wizards (Feature + Shared)
```
🧙 /features/categories/wizards/CategoryCreationWizard.vue
  └── uses 🔗 /shared/components/wizard/
      ├── WizardContainer.vue
      ├── WizardStep.vue
      ├── WizardNavigation.vue
      └── WizardProgressBar.vue
  └── uses 🔗 /shared/composables/
      └── useWizardSteps.js
```

---

## Benefits of This Structure

1. **Clear Navigation Mapping**: `/views/` directly mirrors the navigation menu structure
2. **Feature Encapsulation**: All domain logic for a feature lives together
3. **Reusability**: Features can be composed into multiple views
4. **Testability**: Features are self-contained and testable in isolation
5. **Scalability**: Easy to add new features or views independently
6. **Discoverability**:
   - "Where's the route component?" → `/views/`
   - "Where's the matter logic?" → `/features/matters/`
   - "Where's the shared button?" → `/shared/components/base/`

---

## Naming Conventions (Optimized for Claude Code Token Efficiency)

### Philosophy: Folder Path Provides Context

File names should be **descriptive but not redundant** with their folder path. This optimizes Claude Code's ability to find relevant files efficiently while minimizing token usage when searching.

### Views (Route Entry Points)
- **DON'T** add `View` suffix - folder path already signals this is a view
- **DO** use clear, singular or plural names matching the route
- ✅ `/views/Documents.vue` - Clear from path this is a view
- ✅ `/views/Matters.vue` - No redundancy
- ❌ `/views/DocumentsView.vue` - Redundant (folder already says "view")

### Feature Components
- **DO** use explicit, purpose-describing names
- **DO** include the feature domain in the name to avoid ambiguity
- ✅ `/features/documents/components/DocumentTable.vue` - Clear purpose
- ✅ `/features/documents/components/DocumentViewer.vue` - Clear purpose
- ✅ `/features/matters/components/MatterCard.vue` - Clear purpose
- ❌ `/features/documents/components/Document.vue` - Ambiguous (document what?)

### Shared Components
- **Base components**: `Base*.vue` prefix (e.g., `BaseButton.vue`, `BaseDialog.vue`)
- **Layout components**: `App*.vue` prefix (e.g., `AppSideBar.vue`, `AppHeader.vue`)
- **UI components**: Descriptive names (e.g., `LoadingSpinner.vue`, `ErrorMessage.vue`)

### JavaScript/TypeScript Files
- **Composables**: `use*.js` (e.g., `useMatter.js`, `useDocumentNavigation.js`)
- **Stores**: `*Store.js` (e.g., `matterStore.js`, `documentStore.js`)
- **Services**: `*Service.js` (e.g., `authService.js`, `uploadService.js`)
- **Utils**: Descriptive names (e.g., `dateUtils.js`, `formatters.js`)

### Why This Helps Claude Code

When Claude searches for "documents view", it efficiently finds:
1. Path match: `/views/Documents.vue` ✅ (folder + filename both match)
2. No need to read redundant suffixes
3. Explicit feature component names help disambiguate when searching for specific functionality

---

## Questions to Consider

1. ~~Should we rename existing views to `*View.vue` for consistency?~~ **RESOLVED: No - keep without suffix for token efficiency**
2. ~~Should `/features/organizer/` be renamed to `/features/documents/`?~~ **RESOLVED: Yes - rename to documents**
3. ~~How should we handle wizard-style views (e.g., CategoryCreationWizard)?~~ **RESOLVED: Create `/wizards/` subfolder within each feature + shared wizard components**
4. Should login be a view or a feature component?
   - Current proposal: `Login.vue` (view) uses `/core/auth/` components
5. Should wizard routes point to views or directly to feature wizard components?
   - Option A: Create dedicated views that wrap wizards (e.g., `/views/CategoryWizard.vue` wraps `/features/categories/wizards/CategoryCreationWizard.vue`)
   - Option B: Route directly to feature wizard components

---

## Notes

- This structure preserves the **views as navigation scaffolding** concept
- Features are **domain-focused** and **self-contained**
- Shared code is **cross-cutting** (used by multiple features)
- Core is **foundational** (auth, routing, config)
- **Wizards** are organized as a distinct class of components:
  - Feature-specific wizards live in `/features/{feature}/wizards/`
  - Shared wizard UI components live in `/shared/components/wizard/`
  - Wizards often share similar subcomponents (steps, navigation, progress bars)
- **Naming optimized for Claude Code**: File names avoid redundancy with folder paths for better token efficiency in AI-assisted development
- This aligns with Vue 3 best practices and feature-based architecture patterns
