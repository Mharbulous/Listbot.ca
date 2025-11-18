# Build Performance Technical Debt

**Date Identified**: 2025-11-16
**Status**: Tracked (Not Urgent)
**Priority**: Medium - Address before production launch

## Summary

The production build completes successfully but has performance optimization warnings related to bundle size and code-splitting inefficiencies.

## Current Build Metrics

- **Main Bundle**: 2,023 KB minified (603 KB gzipped)
- **Thumbnail Renderer**: 401 KB minified (118 KB gzipped)
- **Total Build Time**: ~10 seconds

## Issues Identified

### 1. Dynamic/Static Import Mixing

**Warning Type**: Module chunking optimization

**Affected Modules**:
- `firebase/firestore/dist/esm/index.esm.js` - Mixed import pattern across 30+ files
- `src/services/firebase.js` - Mixed import pattern in auth store

**Root Cause**:
- Firebase Firestore is imported both statically (`import { ... }`) and dynamically (`import(...)`) across different files
- Prevents Vite from properly code-splitting Firebase into separate chunks

**Impact**:
- Firestore bundled into main chunk instead of lazy-loaded
- Larger initial bundle download
- No runtime errors or functionality issues

**Files with Mixed Patterns**:
- Static imports: Most service files, composables, stores
- Dynamic imports: `src/core/stores/auth.js`, `src/features/organizer/services/evidenceService.js`, `src/utils/seedMatters.js`

### 2. Large Chunk Size

**Warning Type**: Performance optimization

**Specific Issues**:
- Main bundle (`index-De-zV4Tx.js`): 2,023 KB > 500 KB threshold
- Thumbnail renderer (`useThumbnailRenderer-CaiCspAJ.js`): 401 KB > 500 KB threshold

**Root Cause**:
- No route-level code-splitting implemented
- PDF.js worker bundled in main chunk (1,046 KB)
- All feature code loaded upfront instead of on-demand

**Impact**:
- Slower initial page load (especially on slow connections)
- User waits for entire app download before interactivity
- Wasted bandwidth for features users may never access

## Performance Impact Assessment

### Current State (Pre-Alpha, No Users)
- No immediate production impact
- Development and testing not significantly affected
- Build completes successfully
- All functionality works correctly

### Before Production Launch
- Could affect user experience on slower connections
- Initial load time may cause user drop-off
- Mobile users particularly affected
- Wasted bandwidth on metered connections

## Recommended Solutions

### Phase 1: Route-Level Code Splitting (High Impact, Low Effort)

Implement lazy loading for route components:

```javascript
// router/index.js - Current
import Documents from '@/views/Documents.vue'
import FileUpload from '@/views/FileUpload.vue'
import ViewDocument from '@/views/ViewDocument.vue'

// Recommended
const Documents = () => import('@/views/Documents.vue')
const FileUpload = () => import('@/views/FileUpload.vue')
const ViewDocument = () => import('@/views/ViewDocument.vue')
```

**Expected Impact**: Reduce initial bundle by ~200-300 KB

### Phase 2: Standardize Firebase Imports (Medium Impact, Medium Effort)

Choose one import pattern across the codebase:

**Option A**: All Static (Simpler, but larger initial bundle)
```javascript
import { getFirestore, collection, ... } from 'firebase/firestore'
```

**Option B**: All Dynamic (Better code-splitting, more complex)
```javascript
const { getFirestore } = await import('firebase/firestore')
```

**Recommendation**: Use static imports consistently (Option A) for Firebase since it's needed early in auth flow anyway.

**Expected Impact**: Better chunk optimization, ~50-100 KB reduction

### Phase 3: Lazy Load Heavy Dependencies (High Impact, High Effort)

Defer loading of large libraries until needed:

1. **PDF.js Worker** (1,046 KB):
   - Only load when user opens a PDF for viewing
   - Implement in ViewDocument.vue with dynamic import

2. **Thumbnail Renderer** (401 KB):
   - Only load when Documents view mounts
   - Implement in Documents.vue with dynamic import

3. **Feature Module Splitting**:
   - Split upload feature into separate chunk
   - Split organizer feature into separate chunk
   - Split document viewer into separate chunk

**Expected Impact**: Reduce initial bundle to ~800 KB or less

### Phase 4: Manual Chunk Configuration (Fine-Tuning)

Configure Vite's rollup options for optimal chunking:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          'pdf-viewer': ['pdfjs-dist'],
          'vuetify': ['vuetify'],
        }
      }
    }
  }
}
```

**Expected Impact**: Better browser caching, faster repeat visits

## Implementation Timeline

### Milestone 1: Before Beta Testing
- [ ] Phase 1: Route-level code splitting
- [ ] Measure and document bundle size improvements

### Milestone 2: Before Production Launch
- [ ] Phase 2: Standardize Firebase imports
- [ ] Phase 3: Lazy load PDF.js and thumbnail renderer
- [ ] Re-run performance analysis
- [ ] Set target: Main bundle < 500 KB gzipped

### Milestone 3: Production Optimization
- [ ] Phase 4: Manual chunk configuration
- [ ] Implement bundle analysis monitoring
- [ ] Set up performance budgets in CI/CD

## Testing Requirements

When implementing fixes:

1. **Build Verification**:
   - Run `npm run build` and verify warnings resolved
   - Check bundle sizes in build output
   - Ensure total size reduction meets targets

2. **Functionality Testing**:
   - Test all routes load correctly
   - Verify auth flow works with any Firebase import changes
   - Test PDF viewing and thumbnail generation
   - Confirm no runtime errors in browser console

3. **Performance Testing**:
   - Measure initial page load time (Network tab)
   - Test on throttled connection (Slow 3G)
   - Verify lazy-loaded chunks appear in Network tab
   - Compare before/after metrics

## Related Documentation

- [Vite Code Splitting Guide](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Vue Router Lazy Loading](https://router.vuejs.org/guide/advanced/lazy-loading.html)

## Notes

- This is normal for early-stage development
- No functionality is broken or at risk
- Optimization should be data-driven based on real user metrics
- Consider implementing Web Vitals tracking before optimizing
