# Phase 3: Duplicate Management - Smart Display & Swapping

**Phase:** 3 of 8
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1 (Virtual Upload Queue), Phase 2 (Upload Actions)

---

## Overview

Implement intelligent duplicate handling with visual grouping and the ability to swap which version of a duplicate file will be uploaded.

**Goal:** Duplicates grouped below originals with swap capability
**Deliverable:** Visual hierarchy for duplicates with "Use this file" functionality
**User Impact:** Users can easily identify and choose which version of duplicate files to upload

---

## Features

### 3.1 Duplicate Grouping & Visual Hierarchy
### 3.2 "Use This File" Swap Action
### 3.3 Duplicate Detection Display

---

## 3.1 Duplicate Grouping & Visual Hierarchy

### Visual Design

**Grouped Display:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
│ [👁️] [↔️]   │   ↳ invoice (1).pdf│ 2.4 MB   │ 🟠 Duplicate    │ /2024/Backup │  [❌]  │
│ [👁️] [↔️]   │   ↳ invoice (2).pdf│ 2.4 MB   │ 🟠 Duplicate    │ /Archive     │  [❌]  │
│ [👁️] [⬆️]   │ report.docx       │ 890 KB   │ 🔵 Ready        │ /Reports     │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

### Visual Indicators

**Original File (Ready):**
- Standard row styling
- 🔵 Ready status
- Normal indentation
- Upload Now button (⬆️) visible

**Duplicate File (Skipped):**
- Indented file name with "↳" arrow prefix
- 🟠 Duplicate status
- Slightly lighter background color
- "Use This File" button (↔️) instead of Upload Now

### Grouping Logic

```javascript
// Group files by hash, with original first
function groupDuplicates(files) {
  const groups = new Map();

  files.forEach(file => {
    if (!groups.has(file.hash)) {
      groups.set(file.hash, {
        original: null,
        duplicates: []
      });
    }

    const group = groups.get(file.hash);

    if (file.status === 'ready' || file.status === 'uploading' || file.status === 'completed') {
      // This is the "original" (the one that will be uploaded)
      group.original = file;
    } else if (file.status === 'skipped') {
      // This is a duplicate
      group.duplicates.push(file);
    }
  });

  return groups;
}

// Flatten groups into display order: original, then duplicates
function flattenGroupsForDisplay(groups) {
  const displayOrder = [];

  groups.forEach(group => {
    if (group.original) {
      displayOrder.push(group.original);

      // Sort duplicates by modified date (oldest first)
      const sortedDuplicates = group.duplicates.sort((a, b) =>
        a.sourceLastModified - b.sourceLastModified
      );

      displayOrder.push(...sortedDuplicates);
    }
  });

  return displayOrder;
}
```

### CSS Styling

```css
/* Duplicate row styling */
.table-row.duplicate {
  background-color: rgba(156, 39, 176, 0.05); /* Light purple tint */
}

.table-row.duplicate:hover {
  background-color: rgba(156, 39, 176, 0.10);
}

/* Indented file name for duplicates */
.duplicate .file-name-cell {
  padding-left: 32px; /* Extra indentation */
}

.duplicate .file-name-cell::before {
  content: '↳ ';
  color: #9C27B0; /* Purple */
  margin-right: 4px;
  font-weight: bold;
}

/* Group border (optional) */
.duplicate-group {
  border-left: 3px solid #9C27B0;
  margin-left: 8px;
}
```

---

## 3.2 "Use This File" Swap Action (↔️ Button)

### Visual Design

**Duplicate Action Buttons:**
```
┌──────────────┐
│ [👁️] [↔️]   │  ← "Use This File" button (swap arrows)
└──────────────┘
```

### Behavior Specification

**When user clicks ↔️ "Use This File" button on duplicate:**

1. **Role Swap:**
   - Clicked duplicate → becomes 🔵 Ready (new original)
   - Previous original → becomes 🟠 Duplicate

2. **Position Swap:**
   - New original moves to top of group
   - Old original moves into duplicate position

3. **Button Swap:**
   - New original gets ⬆️ Upload Now button
   - Old original gets ↔️ "Use This File" button

4. **Visual Animation:**
   - Smooth row transition (300ms)
   - Highlight affected rows briefly

5. **Footer Updates:**
   - Counts remain the same (just swapped roles)

### Swap Algorithm

```javascript
// useFileSwap.js
export function useFileSwap(uploadQueue) {
  const swapOriginalWithDuplicate = (duplicate, original) => {
    console.log(`[SWAP] Swapping ${duplicate.fileName} with ${original.fileName}`);

    // 1. Save current positions
    const originalIndex = uploadQueue.value.indexOf(original);
    const duplicateIndex = uploadQueue.value.indexOf(duplicate);

    // 2. Swap statuses
    const tempStatus = original.status;
    original.status = duplicate.status;
    duplicate.status = tempStatus;

    // 3. Add swap metadata for tracking
    duplicate.swappedAt = Date.now();
    original.wasOriginal = true;

    // 4. Swap positions in array
    uploadQueue.value.splice(duplicateIndex, 1); // Remove duplicate
    uploadQueue.value.splice(originalIndex, 0, duplicate); // Insert at original position

    // 5. Trigger animation (handled by component)
    return {
      newOriginal: duplicate,
      newDuplicate: original,
      animateRows: [originalIndex, duplicateIndex]
    };
  };

  const findOriginalForDuplicate = (duplicate, queue) => {
    return queue.find(f =>
      f.hash === duplicate.hash &&
      f.id !== duplicate.id &&
      (f.status === 'ready' || f.status === 'uploading' || f.status === 'completed')
    );
  };

  return {
    swapOriginalWithDuplicate,
    findOriginalForDuplicate
  };
}
```

### Component Implementation

```vue
<!-- SwapButton.vue -->
<template>
  <button
    class="swap-button"
    :disabled="!canSwap"
    @click="handleSwap"
    title="Use this file instead"
  >
    ↔️
  </button>
</template>

<script setup>
const props = defineProps({
  file: { type: Object, required: true },
  originalFile: { type: Object, required: true }
});

const emit = defineEmits(['swap']);

const canSwap = computed(() => {
  // Can only swap if original hasn't been uploaded yet
  return !['uploading', 'completed'].includes(props.originalFile.status);
});

const handleSwap = () => {
  if (canSwap.value) {
    emit('swap', {
      duplicate: props.file,
      original: props.originalFile
    });
  }
};
</script>

<style scoped>
.swap-button {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.swap-button:hover:not(:disabled) {
  transform: scale(1.2) rotate(90deg);
}

.swap-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
```

### Swap Animation

```vue
<!-- UploadTable.vue -->
<template>
  <div
    class="table-row"
    :class="{
      duplicate: file.status === 'skipped',
      swapping: isSwapping(file.id)
    }"
  >
    <!-- Row content -->
  </div>
</template>

<style>
/* Swap animation */
.table-row.swapping {
  animation: swapFlash 0.6s ease-in-out;
}

@keyframes swapFlash {
  0%, 100% {
    background-color: inherit;
  }
  50% {
    background-color: rgba(33, 150, 243, 0.3); /* Blue flash */
  }
}

/* Smooth position transitions */
.table-row {
  transition: transform 0.3s ease-out;
}
</style>
```

---

## 3.3 Duplicate Detection Display

### Duplicate Badge (Optional Enhancement)

**Add badge to original showing duplicate count:**

```
┌──────────────┬───────────────────────────┬──────────┬─────────────────┐
│ [👁️] [⬆️]   │ invoice.pdf [+2 versions] │ 2.4 MB   │ 🔵 Ready        │
│ [👁️] [↔️]   │   ↳ invoice (1).pdf       │ 2.4 MB   │ 🟠 Duplicate    │
│ [👁️] [↔️]   │   ↳ invoice (2).pdf       │ 2.4 MB   │ 🟠 Duplicate    │
└──────────────┴───────────────────────────┴──────────┴─────────────────┘
```

### Implementation

```vue
<!-- FileNameCell.vue -->
<template>
  <div class="file-name-cell">
    <span class="file-name">{{ file.fileName }}</span>
    <span v-if="duplicateCount > 0" class="duplicate-badge">
      +{{ duplicateCount }} version{{ duplicateCount > 1 ? 's' : '' }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  file: { type: Object, required: true },
  duplicateCount: { type: Number, default: 0 }
});
</script>

<style scoped>
.duplicate-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background-color: rgba(156, 39, 176, 0.15);
  border: 1px solid #9C27B0;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #9C27B0;
}
</style>
```

### Expandable Groups (Future Enhancement)

**Collapsible duplicate groups:**

```
┌──────────────┬───────────────────────────┬──────────┬─────────────────┐
│ [👁️] [⬆️]   │ ▼ invoice.pdf [+2]        │ 2.4 MB   │ 🔵 Ready        │
│ [👁️] [↔️]   │   ↳ invoice (1).pdf       │ 2.4 MB   │ 🟠 Duplicate    │
│ [👁️] [↔️]   │   ↳ invoice (2).pdf       │ 2.4 MB   │ 🟠 Duplicate    │
└──────────────┴───────────────────────────┴──────────┴─────────────────┘

Collapsed:
┌──────────────┬───────────────────────────┬──────────┬─────────────────┐
│ [👁️] [⬆️]   │ ▶ invoice.pdf [+2]        │ 2.4 MB   │ 🔵 Ready        │
└──────────────┴───────────────────────────┴──────────┴─────────────────┘
```

*(This is a low-priority enhancement, defer to post-Phase 8)*

---

## Implementation Tasks

### Task Checklist

#### 3.1 Duplicate Grouping
- [ ] Create `useDuplicateGrouping.js` composable
- [ ] Implement `groupDuplicates()` function
- [ ] Implement `flattenGroupsForDisplay()` function
- [ ] Sort duplicates by modified date within group
- [ ] Add visual indentation for duplicates
- [ ] Add "↳" arrow prefix to duplicate names
- [ ] Apply light purple background to duplicate rows
- [ ] Test with various duplicate scenarios

#### 3.2 Swap Action
- [ ] Create `SwapButton.vue` component
- [ ] Create `useFileSwap.js` composable
- [ ] Implement `swapOriginalWithDuplicate()` function
- [ ] Implement `findOriginalForDuplicate()` function
- [ ] Add swap animation (flash + position transition)
- [ ] Update action buttons after swap
- [ ] Handle edge cases (already uploading, etc.)
- [ ] Test swap with multiple duplicates

#### 3.3 Display Enhancements
- [ ] Add duplicate count badge to original (optional)
- [ ] Implement group border (optional)
- [ ] Add hover state highlighting for group
- [ ] Ensure virtual scrolling works with groups
- [ ] Test visual hierarchy clarity

#### 3.4 Integration
- [ ] Integrate grouping with existing table
- [ ] Update row rendering to show indentation
- [ ] Connect swap action to upload queue
- [ ] Ensure swap doesn't break virtual scrolling
- [ ] Test with Phase 2 cancel/promotion logic
- [ ] Verify footer counts remain accurate

---

## Testing Requirements

### Unit Tests

```javascript
// useDuplicateGrouping.spec.js
describe('Duplicate Grouping', () => {
  it('groups files by hash', () => {});
  it('identifies original as ready file', () => {});
  it('identifies duplicates as skipped files', () => {});
  it('sorts duplicates by modified date', () => {});
  it('flattens groups in correct display order', () => {});
  it('handles files with no duplicates', () => {});
  it('handles multiple duplicate groups', () => {});
});

// useFileSwap.spec.js
describe('File Swap', () => {
  it('swaps status between original and duplicate', () => {});
  it('swaps positions in queue', () => {});
  it('finds original for duplicate by hash', () => {});
  it('prevents swap when original uploading', () => {});
  it('prevents swap when original uploaded', () => {});
  it('handles multiple swaps in sequence', () => {});
});
```

### Component Tests

```javascript
describe('SwapButton', () => {
  it('renders swap icon', () => {});
  it('emits swap event on click', () => {});
  it('disables when original is uploading', () => {});
  it('disables when original is uploaded', () => {});
  it('shows correct tooltip', () => {});
});

describe('Duplicate Row Rendering', () => {
  it('shows indentation for duplicates', () => {});
  it('shows arrow prefix for duplicates', () => {});
  it('applies purple background to duplicates', () => {});
  it('groups duplicates below original', () => {});
});
```

### Integration Tests

```javascript
describe('Duplicate Management Integration', () => {
  it('swap updates original and duplicate correctly', () => {});
  it('cancel original promotes next duplicate', () => {});
  it('swap after cancel restores correct order', () => {});
  it('multiple swaps maintain group integrity', () => {});
  it('virtual scrolling works with grouped duplicates', () => {});
});
```

### Manual Testing Scenarios

1. **Basic Grouping:**
   - Upload 5 files with 2 duplicates of same file
   - Verify original shows first, duplicates grouped below
   - Verify indentation and styling

2. **Swap Action:**
   - Swap duplicate to be original
   - Verify positions and statuses change
   - Verify Upload Now button moves to new original
   - Verify swap animation plays

3. **Multiple Duplicates:**
   - Upload file with 5 duplicates
   - Swap multiple times
   - Verify each swap maintains group order

4. **Interaction with Cancel:**
   - Cancel original → verify duplicate promotes
   - Swap promoted duplicate → verify works correctly
   - Cancel all duplicates → verify no promotion

5. **Large Groups:**
   - Upload 1000 files with 50 duplicate groups
   - Verify virtual scrolling performance
   - Verify swap responsiveness

---

## Success Criteria

### Functional Requirements
- [x] Duplicates display immediately below originals
- [x] Visual indentation clearly shows grouping
- [x] Swap button changes original and duplicate roles
- [x] Swap button updates to Upload Now on new original
- [x] Positions swap correctly in queue
- [x] Swap animation provides clear feedback
- [x] Cannot swap when original uploading/uploaded

### Performance Requirements
- [x] Grouping calculation <50ms for 1000 files
- [x] Swap action responds in <100ms
- [x] Virtual scrolling unaffected by grouping
- [x] Animation smooth at 60 FPS

### Visual Requirements
- [x] Duplicate rows clearly distinguishable
- [x] Indentation amount appropriate (not too much/little)
- [x] Purple tint subtle but noticeable
- [x] Arrow prefix aligned correctly
- [x] Group visual hierarchy intuitive

---

## Dependencies

### Internal Dependencies
- Phase 1: Virtual Upload Queue (table structure)
- Phase 2: Upload Actions (cancel/undo logic)
- `useFileActions.js` - For cancel/promotion integration

---

## Performance Benchmarks

**Duplicate Operations:**
| Operation | Target | Actual |
|-----------|--------|--------|
| Group 1000 files | <50ms | _TBD_ |
| Swap action | <100ms | _TBD_ |
| Render grouped display | <100ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 3 - Grouping calculation: Xms');
console.log('[PERFORMANCE] Phase 3 - Swap action: Xms');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with dynamic groups | Low | High | Test extensively with various group sizes |
| Swap causes position jump in scroll | Medium | Low | Use key-based rendering for stability |
| Multiple rapid swaps cause race condition | Low | Medium | Debounce swap action |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Indentation not noticeable enough | Low | Medium | User testing, adjust if needed |
| Swap button purpose unclear | Medium | Low | Clear tooltip, consider icon change |
| Large groups overwhelming | Low | Low | Consider collapsible groups (future) |

---

## Next Phase Preview

**Phase 4:** Simplified Upload Initiation (three-button system)
- Remove folder options modal
- Add three distinct upload buttons
- Streamline workflow for faster uploads

This phase simplifies the upload start process.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
