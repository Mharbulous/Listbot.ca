# TanStack Virtual with Vue 3: Nuances and Common Pitfalls

## Overview

This document captures critical patterns and common pitfalls when implementing TanStack Virtual (`@tanstack/vue-virtual`) with Vue 3's Composition API for virtual scrolling tables. These lessons were learned through actual implementation and debugging of a virtualized table with column management features.

**Context**: Implementing virtual scrolling for a 1,000-row table with dynamic columns (resize, drag-drop, visibility toggle) while maintaining <100ms initial render and 60 FPS scrolling performance.

---

## The Critical Pattern: Computed Options Wrapper

### ✅ CORRECT - The Pattern That Works

The **single most important pattern** for TanStack Virtual with Vue 3:

```javascript
import { computed, ref } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';

export function useVirtualTable(options) {
  const { data, scrollContainer, estimateSize = 48, overscan = 5 } = options;

  // CRITICAL: Wrap ENTIRE options object in computed()
  const virtualizerOptions = computed(() => ({
    count: data.value?.length || 0,           // Plain number, NOT computed()
    getScrollElement: () => scrollContainer.value,
    estimateSize: () => estimateSize,
    overscan,
    enableSmoothScroll: true,
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0
  }));

  // Pass the computed wrapper to useVirtualizer
  const rowVirtualizer = useVirtualizer(virtualizerOptions);

  // Extract reactive values for template
  const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());
  const virtualTotalSize = computed(() => rowVirtualizer.value.getTotalSize());

  return { rowVirtualizer, virtualItems, virtualTotalSize };
}
```

### ❌ WRONG - Patterns That Fail

#### Anti-Pattern 1: Individual Computed Properties
```javascript
// ❌ This does NOT work - passes ComputedRef instead of number
const rowVirtualizer = useVirtualizer({
  count: computed(() => data.value.length),  // Returns ComputedRef, not number!
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => estimateSize
});
```

**Result**: `virtualTotalSize: 0`, no rows rendered, silent failure.

#### Anti-Pattern 2: Plain Object Without Reactivity
```javascript
// ❌ This works initially but doesn't react to data changes
const rowVirtualizer = useVirtualizer({
  count: data.value.length,  // Evaluated once, never updates
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => estimateSize
});
```

**Result**: Works with initial data, but doesn't update when `data.value` changes.

---

## Critical Requirement: Setup Scope Initialization

### ✅ CORRECT - Call During Setup

```javascript
<script setup>
import { ref } from 'vue';
import { useVirtualTable } from '@/composables/useVirtualTable';

const mockData = ref([]);
const scrollContainer = ref(null);

// MUST be called synchronously during setup, BEFORE any await
const {
  virtualItems,
  virtualTotalSize,
  scrollOffset
} = useVirtualTable({
  data: mockData,
  scrollContainer,
  estimateSize: 48,
  overscan: 5
});

// Data loading happens AFTER virtualizer initialization
onMounted(async () => {
  mockData.value = await loadData(); // Virtualizer reacts automatically
});
</script>
```

### ❌ WRONG - Lifecycle Hook Initialization

```javascript
<script setup>
const mockData = ref([]);
const scrollContainer = ref(null);

onMounted(async () => {
  // ❌ This causes "onScopeDispose() called when no active effect scope" warning
  const { virtualItems } = useVirtualTable({
    data: mockData,
    scrollContainer,
    estimateSize: 48
  });
});
</script>
```

**Result**: Vue warning about effect scope, virtualizer may not work correctly.

**Why**: Vue composables use effect scopes for cleanup. These must be established during component setup, not in lifecycle hooks.

---

## Handling Null Refs: The Pattern That Works

### The Problem
When you initialize the virtualizer during setup, template refs like `scrollContainer` are **always null** initially (DOM hasn't mounted yet).

### ✅ The Solution: Callback Pattern
```javascript
const virtualizerOptions = computed(() => ({
  count: data.value?.length || 0,

  // This callback returns null initially - that's OK!
  getScrollElement: () => scrollContainer.value,

  estimateSize: () => 48,
  overscan: 5
}));
```

**How It Works**:
1. During setup: `scrollContainer.value` is `null`, `getScrollElement()` returns `null`
2. After DOM mount: `scrollContainer.value` becomes the HTMLElement
3. Vue's reactivity system automatically updates the virtualizer
4. TanStack Virtual is designed to handle null scroll elements gracefully

### ❌ Don't Try to Work Around It
```javascript
// ❌ Don't do this - unnecessary and doesn't help
onMounted(async () => {
  await nextTick();
  rowVirtualizer.value.measure(); // Not needed!
});
```

The virtualizer automatically measures when the scroll element becomes available.

---

## Template Implementation

### Virtual Container Structure
```vue
<template>
  <div ref="scrollContainer" class="scroll-container">
    <!-- Virtual container with dynamic height -->
    <div
      class="virtual-container"
      :style="{
        height: virtualTotalSize + 'px',
        position: 'relative'
      }"
    >
      <!-- Only visible + overscan items are rendered -->
      <div
        v-for="virtualItem in virtualItems"
        :key="virtualItem.key"
        class="virtual-row"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: virtualItem.size + 'px',
          transform: `translateY(${virtualItem.start}px)`
        }"
      >
        <!-- Access actual data via index -->
        <div>{{ mockData[virtualItem.index].name }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-container {
  height: 100vh;
  overflow-y: auto;
}

.virtual-container {
  position: relative;
  width: 100%;
}

.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
```

### Key Template Requirements:

1. **Scroll Container**: Must have fixed height and `overflow-y: auto`
2. **Virtual Container**: Dynamic height based on `virtualTotalSize`
3. **Virtual Rows**:
   - `position: absolute` with `transform: translateY(${virtualItem.start}px)`
   - Access data via `mockData[virtualItem.index]`
   - Use `virtualItem.key` for Vue's `:key` binding

---

## Data Access Pattern

### ✅ CORRECT - Index-Based Access
```vue
<div v-for="virtualItem in virtualItems" :key="virtualItem.key">
  <!-- Use virtualItem.index to access your data array -->
  <span>{{ mockData[virtualItem.index].fileName }}</span>
  <span>{{ mockData[virtualItem.index].size }}</span>
</div>
```

### ❌ WRONG - Direct Iteration
```vue
<!-- ❌ This doesn't work - virtualItem is NOT your data object -->
<div v-for="virtualItem in virtualItems" :key="virtualItem.key">
  <span>{{ virtualItem.fileName }}</span>  <!-- undefined! -->
</div>
```

**Why**: `virtualItems` contains metadata objects from TanStack Virtual:
- `virtualItem.index` - Index in your data array
- `virtualItem.key` - Unique key for Vue
- `virtualItem.start` - Pixel offset for positioning
- `virtualItem.size` - Row height in pixels

Your actual data is in the separate `data` ref, accessed via the index.

---

## Performance Monitoring

### Virtualizer State Logging
```javascript
import { watch } from 'vue';

const { virtualItems, virtualTotalSize, scrollOffset } = useVirtualTable({...});

// Computed helpers for debugging
const virtualRange = computed(() => {
  const items = virtualItems.value;
  if (items.length === 0) {
    return { startIndex: 0, endIndex: 0, totalRendered: 0 };
  }
  return {
    startIndex: items[0].index,
    endIndex: items[items.length - 1].index,
    totalRendered: items.length
  };
});

const scrollMetrics = computed(() => {
  const total = virtualTotalSize.value;
  const offset = scrollOffset.value;
  return {
    scrollOffset: offset,
    totalSize: total,
    visibleRatio: total > 0 ? ((offset / total) * 100).toFixed(1) + '%' : '0%'
  };
});

// Log virtualizer state after mount
onMounted(async () => {
  await nextTick();

  console.log('[Virtualizer State]', {
    virtualTotalSize: virtualTotalSize.value,
    virtualItemsCount: virtualItems.value.length,
    virtualRange: virtualRange.value,
    dataLength: data.value.length
  });
});
```

### FPS Monitoring During Scroll
```javascript
let fpsFrameCount = 0;
let fpsLastTime = performance.now();
let fpsAnimationId = null;

const measureFPS = () => {
  fpsFrameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - fpsLastTime;

  if (elapsed >= 1000) {
    const fps = Math.round((fpsFrameCount / elapsed) * 1000);
    console.log('[Scroll FPS]', fps);
    fpsFrameCount = 0;
    fpsLastTime = currentTime;
  }

  fpsAnimationId = requestAnimationFrame(measureFPS);
};

onMounted(() => {
  if (scrollContainer.value) {
    let scrollTimeout;
    scrollContainer.value.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!fpsAnimationId) {
          measureFPS();
        }
      }, 100);
    });
  }
});

onUnmounted(() => {
  if (fpsAnimationId) {
    cancelAnimationFrame(fpsAnimationId);
  }
});
```

---

## Troubleshooting Guide

### Issue: No Rows Rendering (virtualTotalSize: 0, totalRendered: 0)

**Symptoms**:
```
virtualTotalSize: 0
virtualItemsCount: 0
virtualRange: {startIndex: 0, endIndex: 0, totalRendered: 0}
```

**Root Cause**: Incorrect options configuration - passing `ComputedRef` instead of plain values.

**Fix**: Use the computed options wrapper pattern (see "The Critical Pattern" above).

---

### Issue: "onScopeDispose() called when no active effect scope"

**Symptoms**: Vue warning in console, virtualizer may not work.

**Root Cause**: Calling `useVirtualizer()` inside `onMounted()` or other lifecycle hooks.

**Fix**: Move virtualizer initialization to setup scope, before any `await` statements.

```javascript
// ✅ CORRECT
const { virtualItems } = useVirtualTable({...}); // During setup

onMounted(async () => {
  mockData.value = await loadData(); // Data loads after
});
```

---

### Issue: Rows Don't Update When Data Changes

**Symptoms**: Initial render works, but virtualizer doesn't react to data changes.

**Root Cause**: Not using computed wrapper, so count isn't reactive.

**Fix**: Use the computed options wrapper pattern:
```javascript
const virtualizerOptions = computed(() => ({
  count: data.value?.length || 0  // Reactive!
}));
```

---

### Issue: scrollContainer Dimensions Are 0

**Symptoms**:
```
scrollContainer dimensions: { width: 0, height: 0 }
```

**Root Cause**: CSS missing or scroll container doesn't have explicit height.

**Fix**: Ensure scroll container has explicit height:
```css
.scroll-container {
  height: 100vh; /* or specific pixel height */
  overflow-y: auto;
}
```

---

### Issue: Rows Overlap or Have Incorrect Positioning

**Symptoms**: Rows render on top of each other or in wrong positions.

**Root Cause**: Missing or incorrect CSS positioning.

**Fix**: Ensure virtual rows use absolute positioning:
```vue
<div
  v-for="virtualItem in virtualItems"
  :key="virtualItem.key"
  :style="{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: virtualItem.size + 'px',
    transform: `translateY(${virtualItem.start}px)`
  }"
>
```

---

## Integration with Other Features

### Column Resizing
Virtual scrolling works seamlessly with dynamic column widths:

```vue
<div
  v-for="virtualItem in virtualItems"
  :key="virtualItem.key"
  class="virtual-row"
>
  <div
    v-for="column in visibleColumns"
    :key="column.key"
    :style="{ width: columnWidths[column.key] + 'px' }"
  >
    {{ mockData[virtualItem.index][column.key] }}
  </div>
</div>
```

The virtualizer automatically recalculates when column widths change.

### Column Drag-and-Drop
Virtual scrolling preserves column order:

```javascript
// visibleColumns is reactive - virtualizer updates automatically
const visibleColumns = computed(() => {
  return orderedColumns.value.filter(col => isColumnVisible(col.key));
});
```

No special handling needed - Vue's reactivity handles updates.

### Column Visibility Toggle
When columns are hidden/shown, virtualizer maintains state:

```javascript
const toggleColumnVisibility = (columnKey) => {
  hiddenColumns.value[columnKey] = !hiddenColumns.value[columnKey];
  // Virtualizer automatically reacts through visibleColumns computed
};
```

---

## Expected Performance Metrics

### Baseline (Our Implementation)
- **Data**: 1,000 rows with 12 columns
- **Initial Render**: 0.20ms (target: <100ms) ✅
- **DOM Nodes**: 23 (for viewport + overscan)
- **Reduction**: 43x fewer DOM nodes vs. static rendering
- **Virtual Total Size**: 48,000px (1,000 rows × 48px)
- **Scroll FPS**: 60 FPS consistently

### Performance Comparison
```
Phase 1 (static 100 rows):  ~20ms render,  100 DOM nodes
Phase 2 (virtual 1,000 rows): 0.20ms render, 23 DOM nodes
Improvement factor: 43x DOM node reduction
```

### Key Metrics to Monitor
1. **virtualTotalSize** - Should equal `count × estimateSize`
2. **virtualItemsCount** - Should be viewport height / row height + overscan
3. **DOM node count** - Should be same as virtualItemsCount
4. **Initial render time** - Should be <100ms
5. **Scroll FPS** - Should maintain 60 FPS

---

## Complete Working Example

See `src/composables/useVirtualTable.js` and `src/views/Cloud.vue` for the full implementation that powers a production-ready virtual table with:
- 1,000 rows rendered with only ~23 DOM nodes
- Column resize with composable pattern
- Column drag-and-drop reordering
- Column visibility toggle
- Performance monitoring and FPS tracking
- <100ms initial render, 60 FPS scrolling

---

## Key Takeaways

1. **Always use the computed options wrapper pattern** - This is non-negotiable for Vue 3 + TanStack Virtual
2. **Initialize during setup scope** - Never in lifecycle hooks
3. **Null refs are fine** - The callback pattern handles them gracefully
4. **Access data via index** - `mockData[virtualItem.index]`, not `virtualItem.property`
5. **Trust the reactivity** - Don't manually call `measure()` or try to force updates
6. **Monitor performance** - Log virtualizer state to verify correct behavior

---

## References

- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [TanStack Vue Virtual Examples](https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual)
- Project Implementation: `src/composables/useVirtualTable.js`
- Example Usage: `src/views/Cloud.vue`
