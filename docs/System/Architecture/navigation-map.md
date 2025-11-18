# ListBot App - Navigation Map

This document provides a comprehensive navigation map of the entire ListBot application, showing all routes, views, and the navigation hierarchy.

**Last Updated**: 2025-11-09
**Router Mode**: Hash-based (`createWebHashHistory`)
**Framework**: Vue Router 4

---

## ASCII Navigation Tree

```
ListBot App
│
├── 🏠 Home & Dashboard
│   ├── / ................................ Home (default landing)
│   └── /home ............................ Home (explicit)
│
├── 🔐 Authentication
│   └── /login ........................... Login Form
│
├── 🗄️ Matters Management
│   ├── /matters ......................... Matters List
│   ├── /matters/new ..................... Create New Matter
│   ├── /matters/import .................. Import Matters
│   ├── /matters/edit/:matterId .......... Edit Matter
│   └── /matters/:id ..................... Matter Detail View
│
├── 📂 Document Management (Matter-Scoped)
│   ├── /matters/:matterId/documents ..... Documents List (Cloud View)
│   └── /matters/:matterId/documents/view/:fileHash
│       └── ............................... View Document Detail
│
├── 🗃️ Category Management (Matter-Scoped)
│   ├── /matters/:matterId/categories .... Category Manager
│   ├── /matters/:matterId/categories/new
│   │   └── ............................... Category Creation Wizard
│   └── /matters/:matterId/categories/edit/:id
│       └── ............................... Category Edit Wizard
│
├── 📤 File Operations
│   ├── /upload .......................... File Upload (requires active matter)
│   ├── /analyze ......................... File Analysis
│   └── /list ............................ Evidence List (🚧 Under Construction)
│
├── 👤 User Management
│   ├── /profile ......................... User Profile
│   ├── /settings ........................ User Settings
│   └── /about ........................... About / Information
│
├── 🔧 System Routes
│   ├── /under-construction .............. Under Construction Page
│   ├── /404 ............................. Page Not Found
│   └── /:pathMatch(.*)* ................. Catch-All (redirects to /404)
│
└── 🛠️ Development Routes (DEV MODE ONLY)
    ├── /dev ............................. Dev Demo Index
    ├── /dev/lazy-loading ................ Lazy Loading Performance Demo
    ├── /dev/clickable-tags .............. Clickable Tag System Demo
    ├── /dev/seed-matters ................ Matter Database Seeding Utility
    ├── /dev/categories .................. Category Migration Tool
    ├── /dev/categories/edit/:id ......... Category Edit Viewer
    └── /dev/categories/newSystemCategory
        └── ............................... New System Category Creator
```

---

## Navigation Sidebar Structure

The app uses a fixed sidebar (`AppSideBar.vue`) with the following navigation items:

```
┌─────────────────────────────┐
│     [BDLC Logo]             │
├─────────────────────────────┤
│                             │
│  🗄️  Matters                │
│  🗃️  Categories (dynamic)   │
│  📤  Upload                  │
│  📁  Documents (dynamic)     │
│  📃  List                    │
│  🕵️  Analyze                 │
│  ℹ️  Information             │
│                             │
│        [flex-spacer]        │
│                             │
│  [App Switcher]             │
└─────────────────────────────┘
```

**Dynamic Navigation Items:**
- **Categories**: Routes to `/matters/:matterId/categories` when a matter is active
- **Documents**: Routes to `/matters/:matterId/documents` when a matter is active

---

## Route Metadata & Guards

### Authentication Requirements

| Route Pattern | Requires Auth | Requires Matter | Requires Active Matter |
|---------------|---------------|-----------------|------------------------|
| `/` | ✅ | ❌ | ❌ |
| `/login` | ❌ | ❌ | ❌ |
| `/matters` | ✅ | ❌ | ❌ |
| `/matters/:id` | ✅ | ❌ | ❌ |
| `/matters/:matterId/documents` | ✅ | ✅ | ❌ |
| `/matters/:matterId/categories` | ✅ | ✅ | ❌ |
| `/upload` | ✅ | ❌ | ✅ |
| `/profile` | ✅ | ❌ | ❌ |
| `/settings` | ✅ | ❌ | ❌ |
| `/about` | ✅ | ❌ | ❌ |
| `/analyze` | ✅ | ❌ | ❌ |
| `/list` | ✅ | ❌ | ❌ |
| `/dev/*` | varies | varies | ❌ |

### Global Guards

The router applies two global `beforeEach` guards:

1. **Auth Guard** (`guards/auth.js`)
   - Checks `requiresAuth` metadata
   - Validates authentication state
   - Redirects to `/login` if not authenticated

2. **Matter Guard** (`guards/matter.js`)
   - Checks `requiresMatter` and `requiresActiveMatter` metadata
   - Validates matter context
   - Ensures matter exists and user has access

---

## Route Groups by Feature

### 📋 Matters Workflow
```
/matters ─────────────────────► List all matters
    │
    ├─► /matters/new ─────────► Create new matter
    ├─► /matters/import ──────► Import matters from file
    ├─► /matters/:id ─────────► View matter details
    └─► /matters/edit/:id ────► Edit matter
```

### 📁 Document Workflow (Matter Context Required)
```
/matters/:matterId/documents ──────────► View all documents in matter
    │
    └─► /view/:fileHash ───────────────► View specific document
```

### 🗂️ Category Workflow (Matter Context Required)
```
/matters/:matterId/categories ─────────► Manage categories
    │
    ├─► /new ──────────────────────────► Create new category
    └─► /edit/:id ─────────────────────► Edit existing category
```

### 📤 File Processing Workflow
```
/upload ──────────► Upload files (requires active matter)
    │
    ├─► /analyze ─► Analyze uploaded files
    └─► /list ────► View evidence list (🚧 Under Construction)
```

---

## Component Architecture

### Layout Components
- **App.vue**: Root component with conditional layout rendering
- **AppSideBar.vue**: Fixed sidebar navigation (60px width)
- **AppHeader.vue**: Top header bar (hidden on login page)

### View Components Location
```
src/views/
├── About.vue .......................... /about
├── Analyze.vue ........................ /analyze
├── Documents.vue .......................... /matters/:matterId/documents
├── EditMatter.vue ..................... /matters/edit/:matterId
├── Home.vue ........................... / and /home
├── MatterDetail.vue ................... /matters/:id
├── MatterImport.vue ................... /matters/import
├── Matters.vue ........................ /matters
├── NewMatter.vue ...................... /matters/new
├── Profile.vue ........................ /profile
├── Settings.vue ....................... /settings
└── defaults/
    ├── PageNotFound.vue ............... /404
    └── UnderConstruction.vue .......... /under-construction and /list
```

### Feature Components
```
src/features/
├── upload/
│   └── FileUpload.vue ................. /upload
└── organizer/views/
    ├── CategoryEditWizard.vue ......... /matters/:matterId/categories/edit/:id
    ├── CategoryCreationWizard.vue ..... /matters/:matterId/categories/new
    ├── CategoryManager.vue ............ /matters/:matterId/categories
    └── ViewDocument.vue ............... /matters/:matterId/documents/view/:fileHash
```

### Dev Demo Components
```
src/dev-demos/views/
├── DemoIndex.vue ...................... /dev
├── LazyLoadingDemo.vue ................ /dev/lazy-loading
├── 2click-autocomplete-tags.vue ....... /dev/clickable-tags
├── SeedMatterData.vue ................. /dev/seed-matters
├── CategoryMigrationTool.vue .......... /dev/categories
├── CategoryEditViewer.vue ............. /dev/categories/edit/:id
└── NewSystemCategory.vue .............. /dev/categories/newSystemCategory
```

---

## Navigation Patterns

### Primary Navigation Flow
```
Login ──► Home ──► Matters ──► Matter Detail ──► Documents/Categories
                      │                              │
                      └──────► Upload ──────────────┘
```

### Matter-Scoped Navigation
When a matter is active, the sidebar dynamically updates:
- **Categories** button routes to the active matter's categories
- **Documents** button routes to the active matter's documents

### Authentication Flow
```
Unauthenticated User ──► Any Protected Route ──► /login
                                                     │
Successful Login ─────────────────────────────────► / (Home)
```

---

## Special Routes

### Dynamic Title Routes
Some routes use `titleFn: true` metadata to generate dynamic titles:
- `/matters/:matterId/documents/view/:fileHash` - Title based on document name

### Under Construction Routes
The following routes redirect to the "Under Construction" page:
- `/list` - Evidence List feature (planned)

### Catch-All Route
- `/:pathMatch(.*)*` - Catches all unmatched routes and redirects to `/404`

---

## Development-Only Features

### Dev Route Registration
Development routes are conditionally registered via `registerDemoRoutes()`:
- Only available when `import.meta.env.DEV === true`
- Excluded from production builds
- Accessed via `/dev/*` paths

### Dev Demo Index
The `/dev` route provides an index page listing all available development demos and testing utilities.

---

## Related Documentation

- **Architecture Overview**: `@docs/architecture/overview.md`
- **Authentication**: `@docs/architecture/authentication.md`
- **File Lifecycle**: `@docs/architecture/file-lifecycle.md`
- **Dev Demos**: `@src/dev-demos/README.md`

---

## Notes

- All routes use **hash-based routing** (`#/path`) for compatibility with static hosting
- The app uses a **matter-scoped architecture** where most document/category operations require an active matter context
- The **sidebar navigation** is fixed and always visible (except on `/login`)
- **Mobile menu** functionality exists but requires JavaScript interaction
- **App Switcher** component in sidebar footer enables SSO navigation between multiple apps
