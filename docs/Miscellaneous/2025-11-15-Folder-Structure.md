# Folder Structure - Auth Module Decomposition

**Date**: 2025-11-15
**Updated**: 2025-11-18 (Auth module decomposed)

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
