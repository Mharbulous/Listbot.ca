# Folder Structure - Module Decomposition

**Date**: 2025-11-23
**Updated**: 2025-11-23 (Line counts verified and updated)

## Auth Module Structure

The authentication module has been decomposed from a single 345-line file into 4 focused modules following the streamline workflow.

### Directory Structure

```
src/core/auth/stores/
├── index.js              # Entry point - re-exports useAuthStore for backward compatibility (17 lines)
├── authStore.js          # Core Pinia store (218 lines)
├── authFirmSetup.js      # Firm management (138 lines)
└── authStateHandlers.js  # Auth lifecycle (115 lines)
```

### Module Responsibilities

#### `index.js` - Entry Point (17 lines)
- Re-exports `useAuthStore` for backward compatibility
- Maintains existing import paths: `import { useAuthStore } from '@/core/auth/stores'`

#### `authStore.js` - Core Pinia Store (218 lines)
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

#### `authFirmSetup.js` - Firm Management (138 lines)
**Responsibilities:**
- Solo Firm architecture implementation (firmId === userId)
- Firm creation and management
- User preferences initialization

**Exported Functions:**
- `_getUserFirmId(userId)` - Check if user has existing firm
- `_getUserRole(firmId, userId)` - Get user's role in firm
- `_createSoloFirm(firebaseUser)` - One-time firm creation (firm doc + default matter + preferences)
- `_initializeUserPreferences(userId)` - Initialize user preferences store

#### `authStateHandlers.js` - Auth Lifecycle (115 lines)
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
src/core/auth/stores/
├── index.js (17 lines)
├── authStore.js (218 lines)
├── authFirmSetup.js (138 lines)
└── authStateHandlers.js (115 lines)
Total: 488 lines (143 lines of additional code due to module boundaries and documentation)
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

The AppSideBar component has been decomposed from a single 422-line file into multiple focused modules following the streamline workflow.

### Directory Structure

```
src/shared/components/layout/
├── AppSideBar.vue                    # Main orchestrator (73 lines)
├── SidebarFooter.vue                 # Footer orchestrator (81 lines)
└── sidebar/
    ├── SidebarHeader.vue            # Logo + toggle button (97 lines)
    ├── SidebarNav.vue               # Navigation items list (235 lines)
    ├── SidebarTooltip.vue           # Floating tooltip component (54 lines)
    ├── useSidebarTooltip.js         # Tooltip logic composable (58 lines)
    ├── sidebarNavConfig.js          # Navigation items configuration (121 lines)
    ├── FooterTrigger.vue            # Footer trigger with avatar (156 lines)
    ├── FooterMenu.vue               # Footer menu popover (245 lines)
    ├── useFooterMenu.js             # Menu state management (73 lines)
    ├── useKeyboardNav.js            # Keyboard navigation (152 lines)
    └── footerConfig.js              # Footer configuration (58 lines)
```

### Module Responsibilities

#### `AppSideBar.vue` - Main Orchestrator (73 lines)
**Responsibilities:**
- Container layout structure
- Collapse/expand state management
- Orchestrates child components
- Minimal styling (layout only)

#### `SidebarFooter.vue` - Footer Orchestrator (81 lines)
**Responsibilities:**
- Coordinates FooterTrigger and FooterMenu components
- Uses useFooterMenu and useKeyboardNav composables
- Manages state between child components
- Minimal orchestration logic

#### `SidebarHeader.vue` - Header Component (97 lines)
**Responsibilities:**
- Logo display (conditional on collapse state)
- Toggle button with icon
- Header-specific styling

#### `SidebarNav.vue` - Navigation Component (235 lines)
**Responsibilities:**
- Iterates through navigation items
- Renders section headers and nav links
- Handles active state highlighting
- Delegates tooltip events to parent
- Navigation-specific styling

#### `SidebarTooltip.vue` - Tooltip Component (54 lines)
**Responsibilities:**
- Renders floating tooltip with Teleport
- Positioning and animation styles
- Clean, reusable tooltip component

#### `useSidebarTooltip.js` - Tooltip Composable (58 lines)
**Responsibilities:**
- Tooltip state management (hoveredItem, position)
- Mouse enter/leave handlers
- Position calculation logic
- Returns reactive state and handlers

**Exported API:**
- `hoveredItem` (ref) - Currently hovered navigation item key
- `tooltipText` (computed) - Text to display in tooltip
- `tooltipStyle` (computed) - Positioning styles
- `handleMouseEnter(event, itemKey)` - Show tooltip handler
- `handleMouseLeave()` - Hide tooltip handler

#### `sidebarNavConfig.js` - Navigation Configuration (121 lines)
**Responsibilities:**
- Navigation items array definition
- Icon selection logic (getItemIcon)
- Computed paths for dynamic routes
- Centralized configuration

**Navigation Sections:**
1. **Special Items** (not part of EDRM workflow)
   - Matters, Pleadings, Legal memos, Facts, Characters

2. **EDRM Workflow** (E-Discovery stages)
   - Identify, Preserve, Collect, Process, Review, Analyze, Produce, Present

3. **Resources**
   - About

**Exported API:**
- `useNavItems()` - Returns navigation items array with dynamic computed paths
- `getItemIcon(item, isHovered, isActive)` - Returns appropriate icon (handles special cases like folder icons)

#### `FooterTrigger.vue` - Footer Trigger Component (156 lines)
**Responsibilities:**
- Avatar display with loading spinner
- User role display (when sidebar expanded)
- Chevron icon animation
- Tooltip integration for avatar
- Click handler to toggle menu
- Exposes triggerButton ref to parent

#### `FooterMenu.vue` - Footer Menu Component (245 lines)
**Responsibilities:**
- Menu popover structure with transition
- Three menu sections:
  - **Account**: Profile, Settings links
  - **Switch Apps**: App switcher with descriptions
  - **Sign Out**: Logout button
- Mobile backdrop overlay
- Menu positioning and styles
- Menu item click handlers

#### `useFooterMenu.js` - Menu State Composable (73 lines)
**Responsibilities:**
- Menu open/close state management
- Toggle menu visibility
- Close menu and return focus to trigger
- Handle blur events
- Watch for sidebar collapse (auto-close menu)

**Exported API:**
- `isOpen` (ref) - Menu open state
- `menuId` (string) - Unique menu ID for accessibility
- `toggleMenu()` - Toggle menu visibility
- `closeMenu()` - Close menu and restore focus
- `handleBlur()` - Handle focus loss

#### `useKeyboardNav.js` - Keyboard Navigation Composable (152 lines)
**Responsibilities:**
- Menu items refs array management
- Focused index tracking
- Keyboard event handlers (Enter, Space, Arrow keys, Escape, Home, End, Tab)
- Focus management helpers

**Exported API:**
- `menuItems` (reactive array) - Menu item element refs
- `focusedIndex` (ref) - Currently focused item index
- `totalItems` (number) - Total count of menu items
- `handleTriggerKeydown(event)` - Trigger button keyboard handler
- `handleItemKeydown(event, index)` - Menu item keyboard handler
- `resetFocusIndex()` - Reset focus tracking

#### `footerConfig.js` - Footer Configuration (58 lines)
**Responsibilities:**
- User menu links configuration (Profile, Settings)
- Available apps configuration (Book Keeper, Intranet)
- App URL generation logic
- Base domain constant

**Exported API:**
- `userLinks` - Array of user menu links
- `availableApps` - Array of available apps
- `baseDomain` - Base domain for URL generation
- `getAppUrl(subdomain)` - Generate URL for app subdomain

### Migration Notes

**Old Structure (AppSideBar):**
```
src/shared/components/layout/AppSideBar.vue (422 lines)
```

**Old Structure (SidebarFooter):**
```
src/shared/components/layout/SidebarFooter.vue (596 lines)
```

**New Structure:**
```
src/shared/components/layout/
├── AppSideBar.vue (73 lines)
├── SidebarFooter.vue (81 lines)
└── sidebar/ (11 modules, 1,249 lines total)
Total: 1,403 lines
```

**Deprecated:**
- `/deprecated/AppSideBar.vue.backup-20251121` (original AppSideBar)
- `/deprecated/SidebarFooter.vue.backup-20251122` (original SidebarFooter)

**Backward Compatibility:**
- All component interfaces unchanged (same props and events)
- All existing imports continue to work
- No changes required in consuming code

### Benefits of Decomposition

1. **Maintainability** - All files < 250 lines, focused on single responsibility
2. **Reusability** - Tooltip and keyboard navigation composables can be reused
3. **Testability** - Components and logic can be tested in isolation
4. **Readability** - Clear separation of concerns
5. **Scalability** - Easy to extend configuration without touching component logic
6. **Accessibility** - Keyboard navigation logic is centralized and ARIA-compliant

### Testing Strategy

**Suggested Test Coverage (Navigation):**
1. Toggle sidebar expand/collapse
2. Navigate to each menu item (verify routing)
3. Hover over items when sidebar is collapsed (verify tooltips appear)
4. Verify active state highlighting matches current route
5. Test responsive behavior with different viewport heights
6. Verify folder icon changes (open/closed) on Collect item
7. Test section headers display correctly in both expanded and collapsed states

**Suggested Test Coverage (Footer Menu):**
1. Click footer trigger to open/close menu
2. Verify avatar displays user initials correctly
3. Hover over avatar when sidebar is collapsed (verify tooltip shows user name)
4. Navigate to Profile and Settings from footer menu
5. Test app switching links (Book Keeper, Intranet)
6. Test sign out functionality
7. Keyboard navigation:
   - Press Enter/Space on trigger to open menu
   - Press Arrow keys to navigate menu items
   - Press Escape to close menu
   - Press Home/End to jump to first/last item
8. Verify menu auto-closes when sidebar collapses
9. Verify focus returns to trigger when menu closes
10. Test mobile backdrop (click outside to close)

### Related Documentation

- `@docs/System/CLAUDE.md` - System architecture and component conventions
- `@CLAUDE.md` - Core directives and streamline workflow

---

## Pleadings Module Structure

The Pleadings view has been decomposed from a single 692-line file into multiple focused modules following the streamline workflow.

### Directory Structure

```
src/features/pleadings/
├── views/
│   └── Pleadings.vue                    # Main orchestrator (78 lines)
├── components/
│   ├── ProceedingsTabs.vue              # Tabbed navigation (339 lines)
│   ├── PleadingsTable.vue               # Data table (132 lines)
│   └── VersionHistoryModal.vue          # History modal (72 lines)
└── data/
    └── pleadingsMockData.js             # Mock data (179 lines)
```

### Module Responsibilities

#### `Pleadings.vue` - Main Orchestrator (78 lines)
**Responsibilities:**
- Page layout with gradient background
- Title drawer with action buttons
- Orchestrates child components (tabs, table, modal)
- Manages selected proceeding state
- Provides filtered pleadings computed property
- Handles event delegation from child components

#### `ProceedingsTabs.vue` - Tabbed Navigation (339 lines)
**Responsibilities:**
- Renders proceeding tabs with folder-style UI
- Implements "ALL" tab for showing all pleadings
- Dynamic tab overlap detection and management
- Resize observer for responsive overlap behavior
- Z-index management for active/inactive tabs
- Emits `update:modelValue` for v-model support

**Key Features:**
- Responsive overlap: Tabs overlap when space is constrained
- Active tab elevation: Selected tab appears raised and connected to table
- Proceeding tabs are 4px taller than ALL tab
- Smart z-index: Active tab always on top, others stacked left-to-right

#### `PleadingsTable.vue` - Data Table (132 lines)
**Responsibilities:**
- Displays pleadings data in tabular format
- Seven columns: Document Name, Version, Filing Date, Filing Party, Proceeding, Expires, Actions
- Version history link for amended pleadings
- Empty state display when no pleadings
- Row hover effects
- Emits events for version history and action menu

**Table Columns:**
1. **Document Name** - Name of the pleading
2. **Version** - Original or amendment number (with history link if amended)
3. **Filing Date** - Date the pleading was filed
4. **Filing Party** - Party name and role (Plaintiff/Defendant)
5. **Proceeding** - Venue and court file number
6. **Expires** - Expiry date (if applicable)
7. **Actions** - Three-dot menu for actions

#### `VersionHistoryModal.vue` - History Modal (72 lines)
**Responsibilities:**
- Displays amendment history in modal dialog
- Timeline view of all versions
- Current version indicator (green badge)
- Modal overlay with click-outside-to-close
- Close button in footer
- Supports v-model for visibility control

#### `pleadingsMockData.js` - Mock Data (179 lines)
**Responsibilities:**
- Mock proceedings data (3 proceedings)
- Mock pleadings data (8 pleadings across multiple proceedings)
- Mock version history data (2 versions)
- Named exports for reusability

**Data Structure:**
- **mockProceedings**: Array of proceedings with style of cause, venue, registry, court file number
- **mockPleadings**: Array of pleadings with document info, party details, proceeding reference
- **mockVersionHistory**: Array of versions with title, date, changes, current status

### Migration Notes

**Old Structure:**
```
src/features/pleadings/views/Pleadings.vue (692 lines)
```

**New Structure:**
```
src/features/pleadings/
├── views/Pleadings.vue (78 lines)
├── components/ (3 components, 543 lines total)
└── data/pleadingsMockData.js (179 lines)
Total: 800 lines (108 lines of additional code due to module boundaries)
```

**Deprecated:**
- Original file moved to `/deprecated/Pleadings.vue.backup`

**Backward Compatibility:**
- Component interface unchanged (same URL route)
- All existing functionality preserved
- No changes required in router configuration

### Benefits of Decomposition

1. **Single Responsibility** - Each component has one clear purpose
2. **Reusability** - Tabs, table, and modal can be reused independently
3. **Testability** - Smaller components are easier to unit test
4. **Maintainability** - Changes to tabs don't affect table logic
5. **Readability** - Each file is under 210 lines
6. **Data Separation** - Mock data is centralized and can be replaced with API calls

### Testing Strategy

**Suggested Test Coverage:**
1. **Tab Navigation:**
   - Click on proceeding tabs to filter pleadings
   - Click "ALL" tab to show all pleadings
   - Verify active tab styling and z-index
   - Test responsive overlap behavior (resize window)
   - Verify tabs remain sticky when scrolling

2. **Table Display:**
   - Verify all 8 mock pleadings display in "ALL" view
   - Filter by proceeding and verify correct pleadings shown
   - Click "View History" on amended pleadings
   - Click action menu (three dots) on any pleading
   - Verify empty state when no pleadings match filter

3. **Version History Modal:**
   - Click "View History" on amended pleading
   - Verify modal displays with version timeline
   - Verify "Current" badge on latest version
   - Click close button to dismiss
   - Click outside modal to dismiss

4. **Page Layout:**
   - Verify gradient background renders
   - Verify title drawer with "Pleadings" heading
   - Verify "New Proceeding" and "Upload Pleading" buttons
   - Test responsive behavior at different viewport sizes

### Related Documentation

- `@docs/Features/Pleadings/CLAUDE.md` - Pleadings feature documentation (if exists)
- `@CLAUDE.md` - Core directives and streamline workflow

---

## Matters Module Structure

The Matters view has been decomposed from a single 701-line file into multiple focused modules following the streamline workflow.

### Directory Structure

```
src/features/matters/
├── views/
│   └── Matters.vue                      # Main orchestrator (198 lines)
├── components/
│   ├── MattersNotification.vue          # Notification banner (74 lines)
│   ├── MattersFilterControls.vue        # Filter controls (272 lines)
│   └── MattersTable.vue                 # Data table (227 lines)
└── composables/
    └── useDocumentCounts.js             # Document counting logic (73 lines)
```

### Module Responsibilities

#### `Matters.vue` - Main Orchestrator (198 lines)
**Responsibilities:**
- PageLayout wrapper with gradient background
- Orchestrates child components (notification, filters, table)
- Handles route query parameters for redirect notifications
- Handles matter selection and navigation
- Manages notification auto-dismiss (8 seconds)
- Click-outside handler for dropdown
- Filtering logic (user assignment, status, search text)

**Key Computed Properties:**
- `visibleMatters` - Filters by user assignment and archived status
- `filteredMatters` - Applies search text filtering with case-sensitive and whole-word options
- `emptyStateMessage` - Dynamic message based on search state

#### `MattersNotification.vue` - Notification Banner (74 lines)
**Responsibilities:**
- Displays notification banner with icons (warning/info)
- Conditional styling based on type
- Dismiss button
- Auto-dismiss timer (controlled by parent)

**Props:**
- `message` (String) - Notification message
- `type` (String) - 'info' or 'warning'
- `modelValue` (Boolean) - Visibility control

**Emits:**
- `update:modelValue` - For v-model support

#### `MattersFilterControls.vue` - Filter Controls (272 lines)
**Responsibilities:**
- Segmented control (My Matters / Firm Matters) with sliding indicator
- Status dropdown (Active / Archived / All)
- Search input with integrated actions (case sensitive, whole word, clear)
- New Matter button
- All control styling and animations
- Hover state management for anticipatory nudge
- Uses mattersFilterStore directly

**Key Features:**
- Sliding indicator with text that moves with selection
- Anticipatory nudge on hover (5px shift when hovering inactive button)
- Smooth transitions and animations (0.3s cubic-bezier)
- Case sensitive toggle (Aa/aA button)
- Whole word toggle (Word/Wo__ button)

#### `MattersTable.vue` - Data Table (227 lines)
**Responsibilities:**
- Table rendering with 6 columns (Matter No., Clients, Description, Adverse Parties, Documents, Last Accessed)
- Loading state with spinner
- Error state with retry button
- Empty state with icon and message
- Row selection highlighting (amber background for selected)
- Alternating row colors (white/gray-50)
- Document count display with loading spinner

**Props:**
- `matters` (Array) - Filtered matters to display
- `loading` (Boolean) - Loading state
- `error` (String) - Error message
- `documentCounts` (Object) - Document counts by matter ID
- `selectedMatterId` (String) - Currently selected matter ID
- `emptyStateMessage` (String) - Dynamic empty state message

**Emits:**
- `select-matter` - When a row is clicked (passes matter object)
- `retry-fetch` - When retry button is clicked

**Table Columns:**
1. **Matter No.** - Matter number with optional "Archived" badge
2. **Clients** - Client names (comma-separated if multiple)
3. **Description** - Matter description
4. **Adverse Parties** - Adverse party names (comma-separated if multiple)
5. **Documents** - Document count with loading spinner
6. **Last Accessed** - Last accessed date (YYYY-MM-DD format)

#### `useDocumentCounts.js` - Document Counting Composable (73 lines)
**Responsibilities:**
- Fetch document counts for all matters in parallel
- Use `getCountFromServer` for efficient counting
- Error handling for individual matter count failures (returns 0 on error)
- Returns reactive documentCounts ref

**Exported API:**
- `documentCounts` (Ref<Object>) - Map of matter IDs to document counts
- `fetchDocumentCounts(matters, firmId)` - Async function to fetch counts

**Implementation Details:**
- Uses `Promise.all()` for parallel fetching
- Gracefully handles individual matter failures (logs error, returns 0 count)
- Updates reactive ref with all counts at once

### Migration Notes

**Old Structure:**
```
src/features/matters/views/Matters.vue (701 lines)
```

**New Structure:**
```
src/features/matters/
├── views/Matters.vue (198 lines)
├── components/ (3 components, 573 lines total)
└── composables/useDocumentCounts.js (73 lines)
Total: 844 lines (143 lines of additional code due to module boundaries and documentation)
```

**Deprecated:**
- Original file moved to `/deprecated/Matters.vue.backup-20251123`

**Backward Compatibility:**
- Component interface unchanged (same URL route)
- All existing functionality preserved
- No changes required in router configuration

### Benefits of Decomposition

1. **Single Responsibility** - Each component has one clear purpose
2. **Reusability** - Filter controls, table, and notification can be reused independently
3. **Testability** - Smaller components are easier to unit test
4. **Maintainability** - All files are under 300 lines (most under 230 lines)
5. **Readability** - Clear separation of concerns
6. **Performance** - Document counting logic can be optimized independently
7. **Composability** - useDocumentCounts composable can be used in other views

### Testing Strategy

**Suggested Test Coverage:**
1. **Notification Banner:**
   - Verify notification appears when redirected with query params (reason=no_matter_selected, reason=archived_matter)
   - Verify notification auto-dismisses after 8 seconds
   - Test dismiss button
   - Verify correct styling for info vs warning types

2. **Filter Controls:**
   - Toggle between "My Matters" and "Firm Matters"
   - Verify sliding indicator animates smoothly
   - Hover over inactive button to see anticipatory nudge (5px shift)
   - Test status dropdown (Active, Archived, All)
   - Test search input with various queries
   - Toggle case sensitive (Aa/aA button)
   - Toggle whole word (Word/Wo__ button)
   - Test clear button (X icon)
   - Click "New Matter" button to navigate

3. **Table Display:**
   - Verify all matters display with correct data in 6 columns
   - Click on a matter row to select and navigate
   - Verify selected row has amber background (bg-amber-50)
   - Verify document counts load and display correctly
   - Test loading state (spinner and "Loading matters..." message)
   - Test error state (error message and "Try Again" button)
   - Test empty state (icon and message)
   - Verify alternating row colors (white/gray-50)

4. **Filtering Logic:**
   - Filter by "My Matters" vs "Firm Matters"
   - Filter by status (Active, Archived, All)
   - Search by matter number, client, description, adverse party
   - Test case-sensitive search
   - Test whole-word search
   - Combine multiple filters

5. **Document Counts:**
   - Verify counts load for all matters
   - Verify loading spinner while counts are being fetched
   - Test error handling (should show 0 count on error)

### Related Documentation

- `@docs/Features/Matters/CLAUDE.md` - Matters feature documentation (if exists)
- `@CLAUDE.md` - Core directives and streamline workflow
