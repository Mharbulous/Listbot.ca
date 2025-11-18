# Auth Module Test Strategy

**Reconciled up to**: 2025-11-18
**Module**: Authentication (decomposed into 3 modules)
**Location**: `src/core/stores/auth/`

## Key Files

- `src/core/stores/auth/index.js` - Module entry point, re-exports authStore
- `src/core/stores/auth/authStore.js` - Core Pinia store (state, getters, actions)
- `src/core/stores/auth/authFirmSetup.js` - Firm management, Solo Firm creation
- `src/core/stores/auth/authStateHandlers.js` - Auth lifecycle handlers, state machine
- `src/services/authService.js` - Firebase authentication service wrapper
- `src/services/userService.js` - User document CRUD operations
- `src/core/stores/userPreferences.js` - User preferences store

## Overview

This document outlines the comprehensive test strategy for the newly decomposed auth module. The auth module is critical to the application and implements a state machine pattern that must be thoroughly tested.

## Test File Structure

All tests should be located in the `/tests` folder as per project guidelines:

```
tests/
├── unit/
│   ├── auth/
│   │   ├── authStore.spec.js           # Core store tests
│   │   ├── authFirmSetup.spec.js       # Firm management tests
│   │   └── authStateHandlers.spec.js   # Lifecycle handlers tests
│   └── ...
└── integration/
    ├── auth/
    │   ├── authFlow.spec.js            # End-to-end auth flows
    │   └── firmCreation.spec.js        # Solo firm creation flow
    └── ...
```

## Unit Tests

### 1. `authStore.spec.js` - Core Pinia Store Tests

#### State Management
- [ ] **Initial state**: Verify default state values
  - `authState` should be `'uninitialized'`
  - `user`, `userRole`, `firmId`, `error` should be `null`
  - `_initialized` should be `false`

#### Getters
- [ ] **isUninitialized**: Returns `true` when `authState === 'uninitialized'`
- [ ] **isInitializing**: Returns `true` when `authState === 'initializing'`
- [ ] **isAuthenticated**: Returns `true` when `authState === 'authenticated'`
- [ ] **isUnauthenticated**: Returns `true` when `authState === 'unauthenticated'`
- [ ] **isError**: Returns `true` when `authState === 'error'`
- [ ] **isInitialized**: Returns `true` when NOT in `'uninitialized'` or `'initializing'`
- [ ] **userDisplayName**:
  - Returns `null` when no user
  - Returns `displayName` when available
  - Fallbacks to email prefix when no displayName
  - Fallbacks to `'User'` when no email
- [ ] **userInitials**:
  - Returns `'loading'` when no user
  - Returns two initials from full name (first + last)
  - Returns first two characters for single word names
  - Handles email addresses (uses part before @)

#### Actions - Initialize
- [ ] **initialize()**:
  - Sets `authState` to `'initializing'`
  - Sets `_initialized` to `true`
  - Calls `setPersistence` with `browserLocalPersistence`
  - Calls `_initializeFirebase()`
  - Does not reinitialize if already initialized

#### Actions - Login/Logout
- [ ] **login(email, password)**:
  - Clears any existing error
  - Delegates to `authService.signIn()`
  - Does NOT directly update state (waits for onAuthStateChanged)
  - Sets error state on failure
- [ ] **logout()**:
  - Clears any existing error
  - Delegates to `authService.signOut()`
  - Does NOT directly update state (waits for onAuthStateChanged)
  - Sets error state on failure

#### Actions - Utility
- [ ] **waitForInit()**:
  - Resolves immediately if already initialized
  - Waits for state change if not initialized
  - Unsubscribes after resolving
- [ ] **cleanup()**:
  - Unsubscribes from Firebase listener
  - Resets `_initialized` to `false`
  - Resets `authState` to `'uninitialized'`
- [ ] **fetchUserData(userId)**:
  - Clears role/firm if no userId
  - Fetches user doc from Firestore
  - Does NOT fail auth on error

### 2. `authFirmSetup.spec.js` - Firm Management Tests

#### _getUserFirmId
- [ ] **Existing solo firm**: Returns userId when firm doc exists
- [ ] **No firm**: Returns `null` when no firm doc exists
- [ ] **Error handling**: Returns `null` on Firestore error

#### _getUserRole
- [ ] **Admin role**: Returns `'admin'` when user is admin in firm
- [ ] **Member role**: Returns user's role from firm members
- [ ] **Default role**: Returns `'member'` when role not found
- [ ] **Firm not found**: Returns `'member'` when firm doesn't exist
- [ ] **Error handling**: Returns `'member'` on Firestore error

#### _createSoloFirm
- [ ] **Firm creation**:
  - Creates firm doc at `firms/{userId}`
  - Sets firm name to "{displayName}'s Workspace"
  - Sets `isPersonal: true`
  - Adds user as admin member
- [ ] **Default matter creation**:
  - Creates matter at `firms/{userId}/matters/general`
  - Sets title to "General Documents"
  - Sets matterNumber to "GEN-001"
  - Sets `isSystemMatter: true`
- [ ] **User preferences creation**:
  - Calls `UserService.createOrUpdateUserDocument()`
  - Sets default preferences (theme, notifications, language, dateFormat, timeFormat, darkMode)
- [ ] **Batch commit**: All operations in single batch
- [ ] **Error handling**: Throws error and logs on failure
- [ ] **Idempotency**: Should only be called ONCE per user

#### _initializeUserPreferences
- [ ] **Success**: Initializes userPreferences store
- [ ] **Error handling**: Logs error but does NOT fail auth
- [ ] **Store initialization**: Calls `preferencesStore.initialize(userId)`

### 3. `authStateHandlers.spec.js` - Lifecycle Handlers Tests

#### _initializeFirebase
- [ ] **Listener setup**: Returns unsubscribe function
- [ ] **onAuthStateChanged**: Sets up Firebase listener
- [ ] **Authenticated flow**: Calls `_handleUserAuthenticated` when user exists
- [ ] **Unauthenticated flow**: Calls `_handleUserUnauthenticated` when user is null
- [ ] **Error handling**: Sets `authState` to `'error'` on handler error

#### _handleUserAuthenticated
- [ ] **User identity**:
  - Sets user object with uid, email, displayName, photoURL
  - Uses Firebase user as single source of truth
  - Generates displayName from email if not provided
- [ ] **Existing firm flow**:
  - Calls `_getUserFirmId()`
  - Sets `firmId` from result
  - Calls `_getUserRole()` and sets `userRole`
- [ ] **New user flow**:
  - Calls `_createSoloFirm()` when no firm exists
  - Sets `firmId` to userId
  - Sets `userRole` to `'admin'`
- [ ] **Preferences**: Calls `_initializeUserPreferences()`
- [ ] **State transition**: Sets `authState` to `'authenticated'`
- [ ] **Error clearing**: Clears any existing error
- [ ] **Fallback behavior**:
  - Still authenticates even if firm setup fails
  - Falls back to userId as firmId
  - Falls back to 'admin' as role

#### _handleUserUnauthenticated
- [ ] **State clearing**:
  - Sets `user` to `null`
  - Sets `userRole` to `null`
  - Sets `firmId` to `null`
  - Sets `authState` to `'unauthenticated'`
  - Clears error
- [ ] **Preferences cleanup**: Calls `preferencesStore.clear()`
- [ ] **Error handling**: Logs error if preferences clear fails

## Integration Tests

### 1. `authFlow.spec.js` - End-to-End Auth Flows

#### Complete Login Flow
- [ ] **New user login**:
  1. Start with `authState === 'uninitialized'`
  2. Call `initialize()`
  3. Verify `authState === 'initializing'`
  4. Mock Firebase user login
  5. Verify solo firm creation
  6. Verify `authState === 'authenticated'`
  7. Verify `firmId === userId`
  8. Verify `userRole === 'admin'`

- [ ] **Returning user login**:
  1. Start with `authState === 'uninitialized'`
  2. Call `initialize()`
  3. Mock Firebase user login (existing user)
  4. Verify NO firm creation (firm already exists)
  5. Verify `authState === 'authenticated'`
  6. Verify correct `firmId` and `userRole` loaded

#### Complete Logout Flow
- [ ] **User logout**:
  1. Start with authenticated user
  2. Call `logout()`
  3. Verify `authState === 'unauthenticated'`
  4. Verify all user data cleared
  5. Verify preferences cleared

#### State Machine Transitions
- [ ] **Valid transitions**:
  - `uninitialized` → `initializing` → `authenticated`
  - `uninitialized` → `initializing` → `unauthenticated`
  - `authenticated` → `unauthenticated` (logout)
  - `unauthenticated` → `authenticated` (login)
  - Any state → `error` (on error)

- [ ] **Invalid transitions**:
  - Cannot skip `initializing` state
  - Cannot access auth-protected features before `isInitialized`

#### waitForInit Behavior
- [ ] **Already initialized**: Resolves immediately
- [ ] **During initialization**: Waits for state change
- [ ] **Route guards**: Can be used in route guards safely

### 2. `firmCreation.spec.js` - Solo Firm Creation Flow

#### One-Time Firm Creation
- [ ] **First login**: Firm is created
- [ ] **Second login**: Firm is NOT recreated
- [ ] **Concurrent logins**: Firm creation is idempotent

#### Solo Firm Architecture
- [ ] **firmId === userId**: Always true for solo users
- [ ] **Firm structure**: Correct firm doc structure
- [ ] **Default matter**: "general" matter always created
- [ ] **User preferences**: Default preferences always set

#### Error Recovery
- [ ] **Firm creation failure**: Still authenticates user
- [ ] **Matter creation failure**: Still authenticates user
- [ ] **Preferences failure**: Still authenticates user

## Mocking Strategy

### Firebase Mocks
```javascript
// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
  getAuth: vi.fn(() => ({})),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
}));
```

### Service Mocks
```javascript
// Mock auth service
vi.mock('@/services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock user service
vi.mock('@/services/userService', () => ({
  UserService: {
    createOrUpdateUserDocument: vi.fn(),
  },
}));
```

### Store Mocks
```javascript
// Mock user preferences store
vi.mock('@/core/stores/userPreferences', () => ({
  useUserPreferencesStore: vi.fn(() => ({
    initialize: vi.fn(),
    clear: vi.fn(),
  })),
}));
```

## Test Utilities

### Helper Functions
```javascript
// Create mock Firebase user
function createMockFirebaseUser(overrides = {}) {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    ...overrides,
  };
}

// Setup auth store for testing
function setupAuthStore() {
  setActivePinia(createPinia());
  return useAuthStore();
}

// Wait for state machine transition
async function waitForAuthState(store, expectedState, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const checkState = () => {
      if (store.authState === expectedState) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for state: ${expectedState}`));
      } else {
        setTimeout(checkState, 10);
      }
    };
    checkState();
  });
}
```

## Coverage Goals

- **Line Coverage**: 90%+
- **Branch Coverage**: 85%+
- **Function Coverage**: 95%+

Critical paths that MUST be tested:
1. Auth state machine transitions (all states)
2. Solo firm creation (one-time only)
3. Error handling and fallbacks
4. User authentication and de-authentication

## Test Execution

### Run Tests
```bash
# Run all auth tests
npm run test:run -- tests/unit/auth tests/integration/auth

# Run specific test file
npm run test:run -- tests/unit/auth/authStore.spec.js

# Watch mode for development
npm run test -- tests/unit/auth
```

### Coverage Report
```bash
# Generate coverage report
npm run test:coverage -- tests/unit/auth tests/integration/auth
```

## Notes

- All tests MUST use Vitest (project standard)
- Tests MUST be in `/tests` folder (project requirement)
- Use `environment: 'node'` for store tests (avoid jsdom + worker incompatibility)
- Mock Firebase services to avoid network calls
- Test the state machine explicitly - it's critical to app functionality
- Remember: Solo Firm creation happens ONCE - test idempotency
