# Folder Structure - Module Decomposition

**Date**: 2025-11-15
**Updated**: 2025-11-21 (AppSideBar decomposed)

## Auth Module Structure

The authentication module has been decomposed from a single 345-line file into 3 focused modules following the streamline workflow.

### Directory Structure

```
src/core/stores/auth/
├── index.js              # Entry point - re-exports useAuthStore for backward compatibility
├── authStore.js          # Core Pinia store (~120 lines)
├── authFirmSetup.js      # Firm management (~100 lines)
└── authStateHandlers.js  # Auth lifecycle (~100 lines)
```

### Module Responsibilities

#### `index.js` - Entry Point
- Re-exports `useAuthStore` for backward compatibility
- Maintains existing import paths: `import { useAuthStore } from '@/core/stores/auth'`

#### `authStore.js` - Core Pinia Store
**Responsibilities:**
- Pinia store definition (`defineStore`)
- State management (authState, user, userRole, firmId, error)
- Getters (isAuthenticated, isInitialized, userDisplayName, userInitials, etc.)
- Public actions (initialize, login, logout, waitForInit, cleanup, fetchUserData)
- Composes functionality from authFirmSetup and authStateHandlers

**State Machine:**
```
uninitialized → initializing → authenticated | unauthenticated | error
```

#### `authFirmSetup.js` - Firm Management
**Responsibilities:**
- Solo Firm architecture implementation (firmId === userId)
- Firm creation and management
- User preferences initialization

**Exported Functions:**
- `_getUserFirmId(userId)` - Check if user has existing firm
- `_getUserRole(firmId, userId)` - Get user's role in firm
- `_createSoloFirm(firebaseUser)` - One-time firm creation (firm doc + default matter + preferences)
- `_initializeUserPreferences(userId)` - Initialize user preferences store

#### `authStateHandlers.js` - Auth Lifecycle
**Responsibilities:**
- Firebase authentication lifecycle events
- Auth state transitions
- User authentication flow

**Exported Functions:**
- `_initializeFirebase(store)` - Set up onAuthStateChanged listener
- `_handleUserAuthenticated(store, firebaseUser)` - Handle user login flow
- `_handleUserUnauthenticated(store)` - Handle user logout and cleanup

### Auth Flow Diagram

```
App Startup
    ↓
authStore.initialize()
    ↓
Set authState = 'initializing'
    ↓
_initializeFirebase() → onAuthStateChanged listener
    ↓
┌───────────────────────────────────────┐
│   Firebase User State Change          │
└───────────────────────────────────────┘
         ↓                      ↓
    User exists           User is null
         ↓                      ↓
_handleUserAuthenticated  _handleUserUnauthenticated
         ↓                      ↓
    1. Set user identity    1. Clear user
    2. Check firm           2. Clear firmId/role
    3. Create if needed     3. Clear preferences
    4. Init preferences     4. Set authState = 'unauthenticated'
    5. Set authState = 'authenticated'
```

### Solo Firm Architecture

**Key Principle:** `firmId === userId` for solo users

**Firm Creation (One-time):**
1. **Firm Document** (`firms/{userId}`)
   - Name: "{User}'s Workspace"
   - Members: Single admin user
   - isPersonal: true

2. **Default Matter** (`firms/{userId}/matters/general`)
   - Title: "General Documents"
   - matterNumber: "GEN-001"
   - isSystemMatter: true

3. **User Document** (`users/{userId}`)
   - Preferences (theme, notifications, language, dateFormat, timeFormat, darkMode)

### Migration Notes

**Old Structure:**
```
src/core/stores/auth.js (345 lines)
```

**New Structure:**
```
src/core/stores/auth/
├── index.js
├── authStore.js
├── authFirmSetup.js
└── authStateHandlers.js
```

**Deprecated:**
- Original file moved to `/deprecated/auth.js`

**Backward Compatibility:**
- All existing imports continue to work via `index.js` re-export
- No changes required in consuming code

### Testing Strategy

See dedicated test suggestions in auth module documentation.

**Suggested Test Coverage:**
1. Auth state machine transitions
2. Login/logout flows
3. Solo firm creation (one-time only)
4. Firm membership and role checking
5. User preferences initialization
6. Error handling and fallbacks

### Related Documentation

- `@docs/architecture/authentication.md` - Full auth state machine and Solo Firm architecture
- `@docs/architecture/overview.md` - High-level component architecture
- `@CLAUDE.md` - Core directives and project overview

---

## AppSideBar Module Structure

The AppSideBar component has been decomposed from a single 422-line file into 6 focused modules following the streamline workflow.

### Directory Structure

```
src/shared/components/layout/
├── AppSideBar.vue                    # Main orchestrator (~79 lines)
├── SidebarFooter.vue                 # Footer component (unchanged)
└── sidebar/
    ├── SidebarHeader.vue            # Logo + toggle button (~107 lines)
    ├── SidebarNav.vue               # Navigation items list (~143 lines)
    ├── SidebarTooltip.vue           # Floating tooltip component (~57 lines)
    ├── useSidebarTooltip.js         # Tooltip logic composable (~60 lines)
    └── sidebarNavConfig.js          # Navigation items configuration (~107 lines)
```

### Module Responsibilities

#### `AppSideBar.vue` - Main Orchestrator
**Responsibilities:**
- Container layout structure
- Collapse/expand state management
- Orchestrates child components
- Minimal styling (layout only)

**Size:** ~79 lines (down from 422 lines)

#### `SidebarHeader.vue` - Header Component
**Responsibilities:**
- Logo display (conditional on collapse state)
- Toggle button with icon
- Header-specific styling

**Size:** ~107 lines

#### `SidebarNav.vue` - Navigation Component
**Responsibilities:**
- Iterates through navigation items
- Renders section headers and nav links
- Handles active state highlighting
- Delegates tooltip events to parent
- Navigation-specific styling

**Size:** ~143 lines

#### `SidebarTooltip.vue` - Tooltip Component
**Responsibilities:**
- Renders floating tooltip with Teleport
- Positioning and animation styles
- Clean, reusable tooltip component

**Size:** ~57 lines

#### `useSidebarTooltip.js` - Tooltip Composable
**Responsibilities:**
- Tooltip state management (hoveredItem, position)
- Mouse enter/leave handlers
- Position calculation logic
- Returns reactive state and handlers

**Size:** ~60 lines

**Exported API:**
- `hoveredItem` (ref) - Currently hovered navigation item key
- `tooltipText` (computed) - Text to display in tooltip
- `tooltipStyle` (computed) - Positioning styles
- `handleMouseEnter(event, itemKey)` - Show tooltip handler
- `handleMouseLeave()` - Hide tooltip handler

#### `sidebarNavConfig.js` - Navigation Configuration
**Responsibilities:**
- Navigation items array definition
- Icon selection logic (getItemIcon)
- Computed paths for dynamic routes
- Centralized configuration

**Size:** ~107 lines

**Navigation Sections:**
1. **Special Items** (not part of EDRM workflow)
   - Matters, Pleadings, Legal memos, Disputed Facts, Cast of Characters

2. **EDRM Workflow** (E-Discovery stages)
   - Identify, Preserve, Collect, Process, Review, Analyze, Produce, Present

3. **Resources**
   - About

**Exported API:**
- `useNavItems()` - Returns navigation items array with dynamic computed paths
- `getItemIcon(item, isHovered, isActive)` - Returns appropriate icon (handles special cases like folder icons)

### Migration Notes

**Old Structure:**
```
src/shared/components/layout/AppSideBar.vue (422 lines)
```

**New Structure:**
```
src/shared/components/layout/
├── AppSideBar.vue (~79 lines)
└── sidebar/ (6 modules, ~474 lines total)
```

**Deprecated:**
- Original file backed up to `/deprecated/AppSideBar.vue.backup-20251121`

**Backward Compatibility:**
- Component interface unchanged (same props and events)
- All existing imports continue to work
- No changes required in consuming code

### Benefits of Decomposition

1. **Maintainability** - Each file < 150 lines, focused on single responsibility
2. **Reusability** - Tooltip composable can be reused in other components
3. **Testability** - Components and logic can be tested in isolation
4. **Readability** - Clear separation of concerns
5. **Scalability** - Easy to extend navigation configuration without touching component logic

### Testing Strategy

**Suggested Test Coverage:**
1. Toggle sidebar expand/collapse
2. Navigate to each menu item (verify routing)
3. Hover over items when sidebar is collapsed (verify tooltips appear)
4. Verify active state highlighting matches current route
5. Test responsive behavior with different viewport heights
6. Verify folder icon changes (open/closed) on Collect item
7. Test section headers display correctly in both expanded and collapsed states

### Related Documentation

- `@docs/System/CLAUDE.md` - System architecture and component conventions
- `@CLAUDE.md` - Core directives and streamline workflow
