# Console Logging Standardization Plan

**Status**: Ready for Implementation
**Priority**: Medium
**Estimated Time**: 4-6 hours
**Created**: 2025-01-27
**Updated**: 2025-10-31 (Post-DRY Analysis)
**Approach**: LogService wrapper (solves logging + DRY violation)

## Problem Statement

The Bookkeeper codebase has **758 console.* occurrences across 105 files** with inconsistent logging conventions and duplicated patterns.

**Issues:**
- Cannot distinguish temporary debugging from permanent monitoring logs
- Console logging patterns duplicated across services, composables, and stores (~200 lines)
- Production console is cluttered with debugging output

**Solution:** Create centralized LogService to standardize logging and eliminate duplication.

## Current State

**Scope:** 105 files, 758 occurrences

**Primary Issue Areas:**
- **Services** (8 files): Identical logging patterns - prime DRY violation
- **Composables** (16 files): Duplicated async operation logging
- **Organizer feature** (30+ files): Mixed debug/info usage
- **Upload feature** (15+ files): Performance logging patterns

## LogService Design

```javascript
// src/services/logService.js
export class LogService {
  static debug(message, ...args) {
    if (import.meta.env.DEV) console.debug(message, ...args);
  }

  static info(message, ...args) {
    console.info(message, ...args);
  }

  static warn(message, ...args) {
    console.warn(message, ...args);
  }

  static error(message, error, context = {}) {
    console.error(message, error);
  }

  static performance(event, duration, meta = {}) {
    console.log(`⚡ ${event}: ${duration}ms`, meta);
  }

  static service(name, operation, ...args) {
    this.info(`[${name}] ${operation}`, ...args);
  }
}
```

### Log Level Convention

| Method | Purpose | Auto-Filtered in Prod? |
|--------|---------|----------------------|
| `debug()` | Temporary debugging, flow tracing | ✅ Yes (DEV only) |
| `info()` | Application events, user actions | ❌ No (always shown) |
| `warn()` | Degraded states, fallbacks | ❌ No (always shown) |
| `error()` | Errors and exceptions | ❌ No (always shown) |
| `performance()` | Timing metrics with ⚡ prefix | ❌ No (always shown) |
| `service()` | Service operations with [Name] prefix | ❌ No (always shown) |

## Implementation Plan

### Phase 1: Create LogService (1 hour)

1. **Create `src/services/logService.js`** with the design above
2. **Add to CLAUDE.md** - Document new logging standards
3. **Create usage examples** for common patterns

### Phase 2: Update Services Layer (2 hours)

**Target:** All 8 service files
- `authService.js`
- `firmService.js`
- `matterService.js`
- `profileService.js`
- `userService.js`
- `fileService.js`
- `uploadService.js`
- Plus organizer services

**Pattern to apply:**
```javascript
// Before
try {
  console.log('Matter created:', matterId);
} catch (error) {
  console.error('Error creating matter:', error);
  throw error;
}

// After
try {
  LogService.service('MatterService', 'created', matterId);
} catch (error) {
  LogService.error('Error creating matter', error, { matterId });
  throw error;
}
```

**Result:** ~100 lines eliminated

### Phase 3: Update Composables & Stores (2 hours)

**Target:** 16 composables + stores with async operations
- `useMatters.js`, `useUsers.js`, `useFirmMembers.js` (async patterns)
- `useColumnVisibility.js`, `useColumnSort.js`, etc. (localStorage patterns)
- `auth.js`, `firm.js` stores

**Pattern to apply:**
```javascript
// Before
loading.value = true;
try {
  console.log('Fetching matters...');
  // ... operation ...
  console.log('Fetched:', data.length);
} finally {
  loading.value = false;
}

// After
loading.value = true;
try {
  LogService.debug('Fetching matters...');
  // ... operation ...
  LogService.debug('Fetched:', data.length);
} finally {
  loading.value = false;
}
```

**Result:** ~100 lines eliminated

### Phase 4: Testing & Documentation (1 hour)

1. **Test production build**
   - Verify `LogService.debug()` is filtered out
   - Verify important events still visible

2. **Update documentation**
   - Add LogService usage to `CLAUDE.md`
   - Create code snippets for common patterns

3. **Code review prep**
   - List files changed
   - Document LOC reduction (~200 lines)

## Benefits

- **Clean production console:** Debug logs auto-filtered in production builds
- **DRY compliance:** Eliminates ~200 lines of duplicate logging patterns
- **Future-proof:** Single point to add error tracking, formatting, analytics
- **Testable:** Can mock LogService in unit tests
- **Consistent:** Standardized formatting across entire codebase
- **Self-documenting:** Clear intent with method names (debug vs info vs service)

## Success Criteria

- [ ] LogService created and tested
- [ ] All 8 core services use LogService
- [ ] All composables with async operations use LogService
- [ ] Production build filters debug logs (console.debug not shown)
- [ ] ~200 lines of duplicate code eliminated
- [ ] LogService usage documented in `CLAUDE.md`
- [ ] Code review shows LOC reduction metrics

## Next Steps

1. **Start Phase 1:** Create LogService and add to project
2. **Continue with Phase 2:** Update services layer systematically
3. **Execute Phase 3:** Update composables and stores
4. **Complete Phase 4:** Test and document
