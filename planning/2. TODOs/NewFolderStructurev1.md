Here's the comprehensive ASCII tree diagram of the proposed structure:

src/
├── App.vue
├── main.js
│
├── core/                           # Cross-cutting application core
│   ├── composables/
│   │   └── useNotification.js     # Shared notification system
│   └── stores/
│       ├── auth/                   # Auth state (shared across all features)
│       │   ├── authFirmSetup.js
│       │   ├── authStateHandlers.js
│       │   ├── authStore.js
│       │   └── index.js
│       └── firm.js                 # Firm state (shared across features)
│
├── features/                       # Feature-based vertical slices
│   │
│   ├── authentication/             # ✨ NEW - Auth feature
│   │   ├── components/
│   │   │   └── LoginForm.vue       ← FROM components/features/auth/
│   │   ├── composables/
│   │   │   └── (future composables)
│   │   ├── services/
│   │   │   └── authService.js      ← FROM services/
│   │   ├── router/
│   │   │   └── guards.js           ← FROM router/guards/auth.js
│   │   └── views/
│   │       └── (future auth views)
│   │
│   ├── matters/                    # ✨ NEW - Matter management
│   │   ├── components/
│   │   │   └── (future components)
│   │   ├── composables/
│   │   │   └── useMatters.js       ← FROM composables/
│   │   ├── constants/
│   │   │   └── (future constants)
│   │   ├── router/
│   │   │   └── guards.js           ← FROM router/guards/matter.js
│   │   ├── services/
│   │   │   └── matterService.js    ← FROM services/
│   │   ├── stores/
│   │   │   └── matterView.js       ← FROM stores/
│   │   ├── types/
│   │   │   └── (future types)
│   │   ├── utils/
│   │   │   └── seedMatters.js      ← FROM utils/
│   │   └── views/
│   │       ├── Matters.vue         ← FROM views/
│   │       ├── MatterDetail.vue    ← FROM views/
│   │       ├── EditMatter.vue      ← FROM views/
│   │       ├── NewMatter.vue       ← FROM views/
│   │       └── MatterImport.vue    ← FROM views/
│   │
│   ├── organizer/                  # 📦 EXISTING - Consolidate remaining files
│   │   ├── components/
│   │   │   ├── (existing components)
│   │   │   ├── base/               ← NEW subfolder
│   │   │   │   ├── DocumentTable.vue    ← FROM components/base/
│   │   │   │   ├── CellContentTooltip.vue ← FROM components/base/
│   │   │   │   ├── DocumentPeekTooltip.vue ← FROM components/base/
│   │   │   │   └── DragHandle.vue        ← FROM components/base/
│   │   │   ├── document/           ← NEW subfolder
│   │   │   │   ├── DocumentMetadataPanel.vue    ← FROM components/document/
│   │   │   │   ├── DocumentNavigationBar.vue    ← FROM components/document/
│   │   │   │   ├── PdfThumbnailPanel.vue        ← FROM components/document/
│   │   │   │   ├── PdfViewerArea.vue            ← FROM components/document/
│   │   │   │   └── tabs/
│   │   │   │       ├── AIAnalysisTab.vue        ← FROM components/document/tabs/
│   │   │   │       ├── DigitalFileTab.vue       ← FROM components/document/tabs/
│   │   │   │       ├── DocumentTab.vue          ← FROM components/document/tabs/
│   │   │   │       ├── ReviewTab.vue            ← FROM components/document/tabs/
│   │   │   │       └── ai-analysis/
│   │   │   │           ├── AIAnalysisButton.vue       ← FROM components/document/tabs/ai-analysis/
│   │   │   │           ├── AIAnalysisError.vue        ← FROM components/document/tabs/ai-analysis/
│   │   │   │           ├── AIAnalysisFieldItem.vue    ← FROM components/document/tabs/ai-analysis/
│   │   │   │           └── AIReviewFieldItem.vue      ← FROM components/document/tabs/ai-analysis/
│   │   │   └── tags/               ← NEW subfolder
│   │   │       ├── EditableTag.vue         ← FROM components/features/tags/
│   │   │       └── composables/
│   │   │           └── useTagEditing.js    ← FROM components/features/tags/composables/
│   │   ├── composables/
│   │   │   ├── (existing composables)
│   │   │   ├── useAIAnalysis.js         ← FROM composables/
│   │   │   ├── useCellTooltip.js        ← FROM composables/
│   │   │   ├── useColumnDragDrop.js     ← FROM composables/
│   │   │   ├── useColumnResize.js       ← FROM composables/
│   │   │   ├── useColumnSort.js         ← FROM composables/
│   │   │   ├── useColumnVisibility.js   ← FROM composables/
│   │   │   ├── useDocumentPeek.js       ← FROM composables/
│   │   │   ├── useDocumentTablePeek.js  ← FROM composables/
│   │   │   ├── useTooltipTiming.js      ← FROM composables/
│   │   │   └── useVirtualTable.js       ← FROM composables/
│   │   ├── constants/
│   │   │   └── (existing constants)
│   │   ├── services/
│   │   │   ├── (existing services)
│   │   │   ├── aiMetadataExtractionService.js  ← FROM services/
│   │   │   └── fileService.js                   ← FROM services/
│   │   ├── stores/
│   │   │   ├── (existing stores)
│   │   │   └── documentView.js     ← FROM stores/
│   │   ├── types/
│   │   │   └── (existing types)
│   │   ├── utils/
│   │   │   ├── (existing utils)
│   │   │   └── categoryFieldMapping.js  ← FROM utils/
│   │   └── views/
│   │       ├── (existing views)
│   │       ├── Documents.vue       ← FROM views/
│   │       └── Analyze.vue         ← FROM views/
│   │
│   ├── profile/                    # ✨ NEW - User profile & settings
│   │   ├── components/
│   │   │   └── (future components)
│   │   ├── composables/
│   │   │   ├── useFirmMembers.js   ← FROM composables/
│   │   │   └── useUsers.js         ← FROM composables/
│   │   ├── services/
│   │   │   ├── profileService.js   ← FROM services/
│   │   │   └── userService.js      ← FROM services/
│   │   ├── stores/
│   │   │   └── userPreferences.js  ← FROM core/stores/
│   │   └── views/
│   │       ├── Profile.vue         ← FROM views/
│   │       └── Settings.vue        ← FROM views/
│   │
│   └── upload/                     # 📦 EXISTING - Add missing files
│       ├── components/
│       │   └── (existing components - remove placeholder.txt)
│       ├── composables/
│       │   └── (existing composables)
│       ├── services/
│       │   └── uploadService.js    ← FROM services/
│       ├── stores/
│       │   └── (future stores)
│       ├── types/
│       │   └── (future types)
│       ├── utils/
│       │   └── (existing utils)
│       ├── views/
│       │   └── (future upload views)
│       └── workers/
│           └── (existing workers)
│
├── shared/                         # Truly shared components
│   └── components/
│       ├── ClearAllButton.vue      # Generic shared component
│       ├── AppSwitcher.vue         ← FROM components/
│       ├── base/                   # Generic base components
│       │   ├── BaseSearchBar.vue   ← FROM components/base/
│       │   └── HoldToConfirmButton.vue  ← FROM components/base/
│       ├── home/                   # Home/landing components
│       │   ├── AddAppTab.vue       ← FROM components/home/
│       │   ├── FeaturesTab.vue     ← FROM components/home/
│       │   ├── FirstAppTab.vue     ← FROM components/home/
│       │   └── LocalDevTab.vue     ← FROM components/home/
│       ├── layout/                 # App-wide layout
│       │   ├── AppHeader.vue       ← FROM components/layout/
│       │   └── AppSideBar.vue      ← FROM components/layout/
│       └── ui/                     # Generic UI components
│           └── SegmentedControl.vue ← FROM components/ui/
│
├── router/
│   ├── index.js                    # Main router config
│   └── guards/                     # ⚠️ DEPRECATED - Guards moved to features
│       └── (empty - guards moved to feature folders)
│
├── services/                       # ⚠️ DEPRECATED - Services moved to features
│   ├── firebase.js                 # ✅ KEEP - Shared Firebase config
│   └── firmService.js              # ✅ KEEP - Shared firm service
│
├── utils/                          # Shared utilities only
│   ├── analyzeMockData.js          # Development/testing utilities
│   ├── cloudMockData.js
│   ├── dateFormatter.js            # Generic date formatting
│   ├── errorMessages.js            # Generic error handling
│   ├── memoryTracking.js           # Development utilities
│   ├── mimeTypeFormatter.js        # Generic MIME type handling
│   ├── performanceMonitor.js       # Development utilities
│   └── webglDetection.js           # Browser capability detection
│
├── config/                         # App configuration
│   └── (existing config files)
│
├── plugins/                        # Vue plugins
│   └── (existing plugins)
│
├── styles/                         # Global styles
│   └── (existing styles)
│
├── assets/                         # Static assets
│   └── (existing assets)
│
├── views/                          # ⚠️ MOSTLY DEPRECATED - Views moved to features
│   ├── Home.vue                    # ✅ KEEP - Generic home view
│   ├── About.vue                   # ✅ KEEP - Generic about view
│   ├── Testing.vue                 # ✅ KEEP - Development view
│   └── defaults/
│       ├── PageNotFound.vue        # ✅ KEEP - Generic error pages
│       └── UnderConstruction.vue   # ✅ KEEP - Generic placeholder
│
├── dev-demos/                      # Development demos
│   └── (existing dev-demos)
│
└── test-utils/                     # Testing utilities
    └── (existing test-utils)