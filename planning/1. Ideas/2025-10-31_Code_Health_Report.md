# Codebase Health Report
**Project**: Bookkeeper
**Report Date**: 2025-10-31
**Status**: ✅ VERY GOOD
**Issues Found**: 4 (2 deprecated, 1 duplicate, 1 orphaned)
**Cleanup Effort**: ~15 minutes

---

## Quick Reference: Issue Summary

| Priority | Issue Type | Count | Action Required |
|----------|-----------|-------|-----------------|
| P1 - High | Deprecated Files | 2 | DELETE |
| P1 - High | Duplicate Tests | 1 | DELETE |
| P2 - Medium | Orphaned Code | 1 | INVESTIGATE |
| **TOTAL** | | **4** | |

---

## 1. Analysis Methodology

### 1.1 Tools & Techniques Used

This analysis used the following systematic approach:

1. **Glob Pattern Matching** - Identify all files by type
   ```bash
   # Example patterns
   src/components/**/*.vue
   src/composables/**/*.js
   src/utils/**/*.js
   src/stores/**/*.js
   tests/**/*.{spec,test}.js
   ```

2. **Grep Code Searches** - Find imports and usage
   ```bash
   # Example searches
   grep -r "import.*useLazyDocuments" src/
   grep -r "from.*uploadService" src/
   ```

3. **Cross-Reference Analysis** - Verify import statements match actual usage

4. **Duplicate Detection** - Find identical files
   ```bash
   # Check for duplicates by comparing file sizes then content
   find tests/ -name "*.spec.js" -o -name "*.test.js"
   ```

5. **Deprecation Markers** - Search for explicit markers
   ```bash
   # Search for common deprecation markers
   grep -r "DEPRECATED\|OBSOLETE\|UNUSED\|FIXME.*remove" src/
   ```

### 1.2 Directories Analyzed

- ✅ `src/components/` - All Vue components
- ✅ `src/composables/` - All composable functions
- ✅ `src/features/` - Feature-specific code
- ✅ `src/services/` - Business logic services
- ✅ `src/stores/` - Pinia state stores
- ✅ `src/utils/` - Utility functions
- ✅ `src/views/` - Page-level components
- ✅ `src/dev-demos/` - Development demos
- ✅ `tests/` - All test files
- ✅ `src/deprecated/` - Explicitly deprecated code

**Total Files Analyzed**: 200+ files

---

## 2. Issues Found

### 2.1 DEPRECATED CODE ❌ (Priority 1: DELETE)

Files explicitly marked as deprecated but still present in codebase.

#### Issue #1: `src/deprecated/uploadService.js`
```yaml
Type: Deprecated Service Class
Size: ~25KB
Imports: 0 (NOT IMPORTED ANYWHERE)
Created: Legacy upload system with "original" file terminology
Replacement: src/features/upload/composables/* + web workers
Risk: LOW (already isolated in /deprecated folder)
Action: DELETE - Safe to remove immediately
Time: 1 minute
```

**Why it's deprecated**: Uses outdated terminology and architecture. Replaced by modern composable-based upload system with web worker support.

#### Issue #2: `src/deprecated/useUploadManager.js`
```yaml
Type: Deprecated Composable
Size: ~20KB
Imports: 0 (NOT IMPORTED ANYWHERE)
Created: Legacy upload state management
Replacement: src/features/upload/composables/useFileQueue.js
Risk: LOW (already isolated in /deprecated folder)
Action: DELETE - Safe to remove immediately
Time: 1 minute
```

**Why it's deprecated**: Replaced by useFileQueue.js with better error handling and state management.

---

### 2.2 DUPLICATE FILES ⚠️ (Priority 1: DELETE ONE)

Files with identical or near-identical content causing redundancy.

#### Issue #3: Duplicate Test Files
```yaml
File 1: tests/unit/features/organizer/components/FolderBreadcrumbs.spec.js (629 lines)
File 2: tests/unit/features/organizer/components/FolderBreadcrumbs.test.js (629 lines)
Status: BYTE-IDENTICAL (100% duplicate)
Impact: Duplicate test execution, wasted CI/CD time
Risk: LOW (just redundancy, not a bug)
Action: DELETE FolderBreadcrumbs.test.js (keep .spec.js for consistency)
Time: 1 minute
```

**Why it's a problem**: Running identical tests twice wastes resources. Project convention uses `.spec.js` extension.

---

### 2.3 ORPHANED CODE 🔍 (Priority 2: INVESTIGATE)

Code that exists but has no imports/references. May be intentional API or truly orphaned.

#### Issue #4: `src/composables/useLazyDocuments.js`
```yaml
Type: Composable Function
Imports: 0 (only self-reference in file)
Purpose: Lazy loading for document lists with preloading
Related: NOT used by LazyLoadingDemo.vue (has own implementation)
Risk: LOW (small file, clear purpose)
Decision Needed: Is this intentional future API or orphaned code?
```

**Code signature**:
```javascript
export function useLazyDocuments(documents, options = {}) {
  return {
    isItemLoaded,
    loadItem,
    resetLoadedItems,
    preloadInitialItems,
  };
}
```

**Action Options**:
- **Option A**: KEEP with documentation - Add comment explaining it's for future use
- **Option B**: DELETE - Remove if no plans to use
- **Recommended**: Decide within 1 week, then take action

---

## 3. Health Metrics

### 3.1 Code Usage Statistics

| Category | Total Files | Active | Deprecated | Orphaned | Duplicate |
|----------|-------------|--------|------------|----------|-----------|
| Composables | 12 | 11 | 0 | 1 | 0 |
| Utilities | 8 | 8 | 0 | 0 | 0 |
| Components | 40+ | 40+ | 0 | 0 | 0 |
| Views | 13 | 13 | 0 | 0 | 0 |
| Stores | 5 | 5 | 0 | 0 | 0 |
| Services | 8 | 8 | 2 (isolated) | 0 | 0 |
| Tests | 16 | 15 | 0 | 0 | 1 |
| **TOTALS** | **102+** | **98+** | **2** | **1** | **1** |

### 3.2 Health Score

```
Overall Health: 96.1% (98/102 files active and non-redundant)

Score Breakdown:
✅ Active Code:    98/102 = 96.1%
❌ Deprecated:     2/102  = 2.0%
⚠️  Orphaned:      1/102  = 1.0%
⚠️  Duplicate:     1/102  = 1.0%
```

### 3.3 Trend Analysis

| Metric | Current | Previous | Trend |
|--------|---------|----------|-------|
| Health Score | 96.1% | N/A (first report) | - |
| Deprecated Files | 2 | - | - |
| Orphaned Code | 1 | - | - |
| Duplicates | 1 | - | - |

**Note**: Future reports should track trends to measure codebase health over time.

---

## 4. Verified Active Code ✅

### 4.1 All Composables (11/12 Active)

| File | Status | Used In |
|------|--------|---------|
| `useColumnDragDrop.js` | ✅ ACTIVE | DocumentTable.vue, Analyze.vue |
| `useColumnResize.js` | ✅ ACTIVE | DocumentTable.vue, Analyze.vue |
| `useColumnSort.js` | ✅ ACTIVE | DocumentTable.vue |
| `useColumnVisibility.js` | ✅ ACTIVE | DocumentTable.vue, Analyze.vue |
| `useVirtualTable.js` | ✅ ACTIVE | DocumentTable.vue |
| `useAsyncRegistry.js` | ✅ ACTIVE | main.js (global async cleanup) |
| `useAsyncInspector.js` | ✅ ACTIVE | App.vue (dev debugging) |
| `useFavicon.js` | ✅ ACTIVE | App.vue |
| `useMatters.js` | ✅ ACTIVE | Multiple matter views |
| `useFirmMembers.js` | ✅ ACTIVE | EditMatter, MatterDetail, NewMatter |
| `useUsers.js` | ✅ ACTIVE | MatterDetail.vue |
| `useLazyDocuments.js` | ⚠️ ORPHANED | (See Issue #4) |

### 4.2 All Utilities (8/8 Active)

| File | Status | Purpose | Used In |
|------|--------|---------|---------|
| `seedMatters.js` | ✅ ACTIVE | Dev data seeding | SeedMatterData.vue |
| `analyzeMockData.js` | ✅ ACTIVE | Mock data analysis | Analyze.vue, cloudMockData.js |
| `cloudMockData.js` | ✅ ACTIVE | Cloud mock data | Cloud.vue |
| `performanceMonitor.js` | ✅ ACTIVE | Performance tracking | Cloud.vue |
| `dateFormatter.js` | ✅ ACTIVE | Date/time formatting | Multiple files |
| `errorMessages.js` | ✅ ACTIVE | Error handling | Error flows |
| `mimeTypeFormatter.js` | ✅ ACTIVE | MIME type display | File operations |
| `categoryFieldMapping.js` | ✅ ACTIVE | Category mapping | uploadService.js |

### 4.3 All Components (40+ Active)

**Base Components**:
- ✅ `BaseSearchBar.vue` - Base component (may not have direct usage)
- ✅ `DocumentTable.vue` - Used in multiple views
- ✅ `HoldToConfirmButton.vue` - CategoryEditWizard, CloudFileWarningModal, FileUploadQueue

**Layout Components**:
- ✅ `AppHeader.vue` - Core layout
- ✅ `NewSideBar.vue` - Core navigation
- ✅ `AppSwitcher.vue` - Multi-app SSO navigation
- ✅ `LoginForm.vue` - /login route

**Feature Components**:
- ✅ `EditableTag.vue` - Dev demos
- ✅ `ClearAllButton.vue` - CloudFileWarningModal, FileUploadQueue

### 4.4 All Views (13 Active)

- ✅ Home, About, Profile, Settings
- ✅ Matters, NewMatter, EditMatter, MatterDetail, MatterImport
- ✅ Analyze, Cloud, FileUpload
- ✅ PageNotFound, UnderConstruction

### 4.5 All Stores (5/5 Active)

| Store | Status | Critical | Used In |
|-------|--------|----------|---------|
| `auth.js` | ✅ ACTIVE | YES | Global auth state |
| `firm.js` | ✅ ACTIVE | YES | Firm context |
| `userPreferences.js` | ✅ ACTIVE | NO | User settings |
| `matterView.js` | ✅ ACTIVE | NO | Matter UI state |
| `documentView.js` | ✅ ACTIVE | NO | Document UI state |

### 4.6 All Services (8/8 Active, 2 Deprecated Isolated)

| Service | Status | Purpose |
|---------|--------|---------|
| `authService.js` | ✅ ACTIVE | Authentication logic |
| `firebase.js` | ✅ ACTIVE | Firebase configuration |
| `matterService.js` | ✅ ACTIVE | Matter CRUD operations |
| `firmService.js` | ✅ ACTIVE | Firm operations |
| `profileService.js` | ✅ ACTIVE | User profile operations |
| `userService.js` | ✅ ACTIVE | User management |
| `fileService.js` | ✅ ACTIVE | File operations |
| `uploadService.js` | ✅ ACTIVE | File uploads (modern) |

**Note**: 2 deprecated services in `src/deprecated/` folder (See Issues #1, #2)

---

## 5. Action Plan

### Phase 1: Immediate Cleanup (Priority 1)
**Estimated Time**: 5 minutes
**Risk**: LOW (all safe deletions)

- [ ] **Task 1.1**: Delete `src/deprecated/uploadService.js`
- [ ] **Task 1.2**: Delete `src/deprecated/useUploadManager.js`
- [ ] **Task 1.3**: Delete `tests/unit/features/organizer/components/FolderBreadcrumbs.test.js`
- [ ] **Task 1.4**: Run tests to verify no breakage: `npm run test:run`
- [ ] **Task 1.5**: Commit with message: "chore: remove deprecated and duplicate files"

### Phase 2: Investigation (Priority 2)
**Estimated Time**: 10 minutes
**Risk**: LOW (decision needed)

- [ ] **Task 2.1**: Review `src/composables/useLazyDocuments.js` purpose
- [ ] **Task 2.2**: Check if it's planned for future use
- [ ] **Task 2.3**: If keeping: Add JSDoc comment explaining intent
- [ ] **Task 2.4**: If removing: Delete file and run tests
- [ ] **Task 2.5**: Document decision in next health report

### Phase 3: Verification (Final)
**Estimated Time**: 5 minutes
**Risk**: NONE

- [ ] **Task 3.1**: Verify all tests pass
- [ ] **Task 3.2**: Verify build succeeds: `npm run build`
- [ ] **Task 3.3**: Update this health report with completion status
- [ ] **Task 3.4**: Schedule next health check (recommend: quarterly)

---

## 6. Code Organization Assessment

### 6.1 Strengths ✅

- **Proper Isolation**: `/deprecated` folder cleanly separates old code
- **Feature Structure**: Well-organized (`features/upload`, `features/organizer`)
- **Dev/Prod Separation**: Dev demos properly gated (`import.meta.env.DEV`)
- **Clear Naming**: Consistent file naming conventions
- **Test Coverage**: Comprehensive test suite with good organization
- **Documentation**: Strong architecture docs in `/docs`

### 6.2 Recommendations 💡

1. **Establish Deprecation Process**:
   - When deprecating code, immediately move to `/deprecated` folder
   - Add deprecation date and replacement info in header comment
   - Schedule review/removal within 1-2 sprints

2. **Test File Consistency**:
   - Standardize on `.spec.js` extension (already project convention)
   - Add pre-commit hook to prevent `.test.js` files

3. **Orphaned Code Prevention**:
   - Use ESLint plugin `eslint-plugin-unused-imports`
   - Run import analysis monthly
   - Document "intentional API" composables in `/docs`

4. **Regular Health Checks**:
   - Run this analysis quarterly
   - Track trends (health score over time)
   - Set target: maintain >95% health score

---

## 7. Future Analysis Quick Guide

### 7.1 Running Next Health Check

**Prerequisites**:
- Repository access
- Claude Code or similar AI assistant
- ~30 minutes for comprehensive analysis

**Steps**:
1. Create new report file: `planning/1. Ideas/YYYY-MM-DD_Code_Health.md`
2. Use this template as starting point
3. Run analysis using Explore agent (thoroughness: "very thorough")
4. Update metrics, compare to previous report
5. Identify new issues and track trends

### 7.2 Quick Check Commands

```bash
# Find unused imports (requires eslint-plugin-unused-imports)
npm run lint

# Find files not imported anywhere (manual grep)
for file in src/composables/*.js; do
  filename=$(basename "$file" .js)
  count=$(grep -r "import.*$filename" src/ | wc -l)
  if [ $count -eq 0 ]; then
    echo "Potentially unused: $file"
  fi
done

# Find duplicate test files
find tests/ \( -name "*.spec.js" -o -name "*.test.js" \) | sort | uniq -d

# Search for deprecation markers
grep -r "DEPRECATED\|OBSOLETE\|@deprecated" src/ --include="*.js" --include="*.vue"
```

### 7.3 Red Flags to Watch For

- ⚠️ Files in `/deprecated` older than 3 months
- ⚠️ Composables/utilities with 0 imports
- ⚠️ Test files with duplicate names (*.spec.js + *.test.js)
- ⚠️ Large files (>1000 lines) that aren't modular
- ⚠️ TODO/FIXME comments older than 6 months
- ⚠️ Services or stores not registered in main.js

---

## 8. Historical Context

### 8.1 Report History

| Date | Health Score | Issues | Status | Notes |
|------|-------------|--------|--------|-------|
| 2025-10-31 | 96.1% | 4 | In Progress | Initial health report |

### 8.2 Known Limitations

This report does not analyze:
- Code complexity metrics (cyclomatic complexity, etc.)
- Security vulnerabilities (use `npm audit` for that)
- Performance bottlenecks (use performance profiling)
- Test coverage percentage (use `npm run test:coverage`)
- Bundle size analysis (use build analyzer)

For comprehensive code quality, combine this health report with:
- Automated linting (`npm run lint`)
- Security scanning (`npm audit`)
- Test coverage reports (`npm run test:coverage`)
- Bundle analysis (Vite build stats)

---

## Appendix A: Search Patterns Used

### File Discovery Patterns
```
src/components/**/*.vue
src/composables/**/*.{js,ts}
src/features/**/*.{js,vue}
src/services/**/*.js
src/stores/**/*.js
src/utils/**/*.js
src/views/**/*.vue
src/deprecated/**/*
tests/**/*.{spec,test}.{js,ts}
```

### Import Search Patterns
```
import.*from ['"]@/composables/
import.*from ['"]@/utils/
import.*from ['"]@/services/
import { .* } from
```

### Deprecation Markers
```
@deprecated
DEPRECATED
OBSOLETE
TODO.*remove
FIXME.*delete
UNUSED
Legacy
Old implementation
```

---

## Appendix B: Automation Opportunities

### Recommended Tools

1. **ESLint Plugins**:
   - `eslint-plugin-unused-imports` - Auto-detect unused imports
   - `eslint-plugin-import` - Enforce import conventions

2. **Pre-commit Hooks**:
   ```bash
   # .husky/pre-commit
   npm run lint
   # Check for .test.js files (prefer .spec.js)
   if git diff --cached --name-only | grep "\.test\.js$"; then
     echo "Error: Use .spec.js instead of .test.js"
     exit 1
   fi
   ```

3. **CI/CD Integration**:
   - Add health check to monthly scheduled job
   - Auto-generate report as markdown
   - Post summary to team chat

4. **IDE Integration**:
   - VS Code: "Unused Imports" extension
   - Show deprecation warnings in-editor

---

**Last Updated**: 2025-10-31
**Next Review Due**: 2026-01-31 (Quarterly)
**Report Confidence**: HIGH (thorough cross-verification)
**Analysis Tool**: Claude Code Explore Agent
