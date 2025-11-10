# Phase 5: Column Management - Sort, Reorder, Resize

**Phase:** 5 of 8
**Status:** Not Started
**Priority:** Medium
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1 (Virtual Upload Queue)

---

## Overview

Add DocumentTable-style column management features: sorting, drag-and-drop reordering, and resizing. Files upload in the currently displayed sort order.

**Goal:** Sortable, reorderable, resizable columns
**Deliverable:** Full column management matching DocumentTable
**User Impact:** Users can organize queue view to their preference, control upload order

---

## Features

### 5.1 Column Sorting
### 5.2 Column Drag-and-Drop Reordering
### 5.3 Column Resizing
### 5.4 Upload in Sorted Order

---

## 5.1 Column Sorting

### Visual Design

**Unsorted Column:**
```
┌────────────────┐
│  File Name     │
└────────────────┘
```

**Sorted Ascending:**
```
┌────────────────┐
│  File Name ↑   │
└────────────────┘
```

**Sorted Descending:**
```
┌────────────────┐
│  File Name ↓   │
└────────────────┘
```

### Sort Behavior

**Click sequence:**
1. First click → Ascending (↑)
2. Second click → Descending (↓)
3. Third click → Clear sort (return to original order)

### Sortable Columns

| Column | Sort Type | Sort Key |
|--------|-----------|----------|
| File Name | Alphabetical | `fileName` |
| Size | Numerical | `size` (bytes) |
| Status | Priority Order | Custom comparator |
| Folder Path | Alphabetical | `folderPath` |

**Actions and Cancel columns:** Not sortable

### Status Sort Priority

```javascript
const STATUS_PRIORITY = {
  'ready': 1,
  'uploading': 2,
  'completed': 3,
  'skipped': 4,
  'error': 5,
  'cancelled': 6,
  'unknown': 7
};

const sortByStatus = (a, b) => {
  return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
};
```

### Implementation

```javascript
// useColumnSort.js
export function useColumnSort(data) {
  const sortColumn = ref(null);
  const sortDirection = ref(null);
  const originalOrder = ref([]);

  // Save original order on first load
  watch(data, (newData) => {
    if (originalOrder.value.length === 0) {
      originalOrder.value = [...newData];
    }
  }, { immediate: true });

  const sortedData = computed(() => {
    if (!sortColumn.value || !sortDirection.value) {
      return data.value;
    }

    const sorted = [...data.value].sort((a, b) => {
      const aVal = a[sortColumn.value];
      const bVal = b[sortColumn.value];

      // Handle special sort types
      if (sortColumn.value === 'status') {
        return sortByStatus(a, b);
      }

      // Numerical sort
      if (sortColumn.value === 'size') {
        return aVal - bVal;
      }

      // Alphabetical sort
      return String(aVal).localeCompare(String(bVal));
    });

    return sortDirection.value === 'desc' ? sorted.reverse() : sorted;
  });

  const toggleSort = (column) => {
    if (sortColumn.value === column) {
      // Cycle through: asc → desc → clear
      if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc';
      } else if (sortDirection.value === 'desc') {
        sortColumn.value = null;
        sortDirection.value = null;
      }
    } else {
      // New column, start with ascending
      sortColumn.value = column;
      sortDirection.value = 'asc';
    }

    console.log(`[SORT] ${column} ${sortDirection.value || 'cleared'}`);
  };

  return { sortColumn, sortDirection, sortedData, toggleSort };
}
```

### Component Integration

```vue
<!-- UploadTableHeader.vue -->
<template>
  <div class="header-cell" @click="handleSort">
    <span>{{ column.label }}</span>
    <span v-if="isSorted" class="sort-indicator">
      {{ sortDirection === 'asc' ? '↑' : '↓' }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  column: Object,
  sortColumn: String,
  sortDirection: String
});

const emit = defineEmits(['sort']);

const isSorted = computed(() => props.sortColumn === props.column.key);

const handleSort = () => {
  if (props.column.sortable !== false) {
    emit('sort', props.column.key);
  }
};
</script>
```

---

## 5.2 Column Drag-and-Drop Reordering

### Drag Handle Icon

**Header cell with drag handle:**
```
┌────────────────┐
│ ⋮⋮ File Name   │
└────────────────┘
```

**Drag handle appears on hover**

### Reordering Restrictions

- **Actions column:** Fixed left (cannot move)
- **Cancel column:** Fixed right (cannot move)
- **Other columns:** Freely reorderable

### Implementation

```javascript
// useColumnDragDrop.js
export function useColumnDragDrop(columns) {
  const columnOrder = ref(columns.map(col => col.key));
  const dragState = ref({
    dragging: null,
    dragOver: null
  });

  const onDragStart = (columnKey, event) => {
    // Prevent dragging fixed columns
    if (columnKey === 'actions' || columnKey === 'cancel') {
      event.preventDefault();
      return;
    }

    dragState.value.dragging = columnKey;
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (columnKey, event) => {
    event.preventDefault();

    // Prevent dropping on fixed columns
    if (columnKey === 'actions' || columnKey === 'cancel') {
      return;
    }

    dragState.value.dragOver = columnKey;
  };

  const onDrop = (targetKey) => {
    const draggingKey = dragState.value.dragging;

    if (!draggingKey || draggingKey === targetKey) {
      dragState.value = { dragging: null, dragOver: null };
      return;
    }

    // Reorder columns
    const newOrder = [...columnOrder.value];
    const fromIndex = newOrder.indexOf(draggingKey);
    const toIndex = newOrder.indexOf(targetKey);

    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggingKey);

    columnOrder.value = newOrder;

    // Persist to localStorage
    localStorage.setItem('uploadQueueColumnOrder', JSON.stringify(newOrder));

    dragState.value = { dragging: null, dragOver: null };
    console.log('[COLUMN] Reordered:', newOrder);
  };

  const onDragEnd = () => {
    dragState.value = { dragging: null, dragOver: null };
  };

  return { columnOrder, dragState, onDragStart, onDragOver, onDrop, onDragEnd };
}
```

### CSS Styling

```css
.drag-handle {
  opacity: 0;
  cursor: grab;
  margin-right: 8px;
  transition: opacity 0.2s;
}

.header-cell:hover .drag-handle {
  opacity: 1;
}

.header-cell.dragging {
  opacity: 0.5;
}

.header-cell.drag-over {
  border-left: 3px solid #2196F3;
}
```

---

## 5.3 Column Resizing

### Resize Handle

**Positioned at column border:**
```
┌────────────────│
│  File Name     │
└────────────────│
                 ↑ Resize handle
```

### Implementation

```javascript
// useColumnResize.js
export function useColumnResize(defaultWidths) {
  const columnWidths = ref({ ...defaultWidths });
  const resizeState = ref({
    resizing: null,
    startX: 0,
    startWidth: 0
  });

  const startResize = (columnKey, event) => {
    resizeState.value = {
      resizing: columnKey,
      startX: event.clientX,
      startWidth: columnWidths.value[columnKey]
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (event) => {
    if (!resizeState.value.resizing) return;

    const delta = event.clientX - resizeState.value.startX;
    const newWidth = Math.max(80, resizeState.value.startWidth + delta);

    columnWidths.value[resizeState.value.resizing] = newWidth;
  };

  const stopResize = () => {
    // Persist to localStorage
    localStorage.setItem('uploadQueueColumnWidths', JSON.stringify(columnWidths.value));

    resizeState.value = { resizing: null, startX: 0, startWidth: 0 };

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  };

  return { columnWidths, startResize };
}
```

### CSS Styling

```css
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  background-color: transparent;
}

.resize-handle:hover {
  background-color: rgba(33, 150, 243, 0.3);
}
```

---

## 5.4 Upload in Sorted Order

### Algorithm

**Files upload in the currently displayed order (after sort applied):**

```javascript
const startUpload = async () => {
  // Get current displayed order (includes sort)
  const uploadOrder = sortedData.value.filter(f => f.status === 'ready');

  console.log(`[UPLOAD] Starting upload of ${uploadOrder.length} files in sorted order`);

  for (const file of uploadOrder) {
    await uploadFile(file);
  }
};
```

### Mid-Upload Sort Change

**Edge case: User changes sort during active upload**

**Behavior:**
1. Maintain current upload sequence
2. Show warning: "Sort change will apply to remaining files"
3. Files already uploaded/uploading continue unchanged
4. Remaining files reorder per new sort

**Implementation:**

```javascript
const handleSortDuringUpload = (newSortColumn, newSortDirection) => {
  if (uploadStatus.value.isUploading) {
    // Show warning
    showNotification(
      'Sort order change will apply to remaining files',
      'warning'
    );

    // Get files currently uploading or completed
    const processedFiles = uploadQueue.value.filter(f =>
      ['uploading', 'completed'].includes(f.status)
    );

    // Get remaining files and sort them
    const remainingFiles = uploadQueue.value.filter(f =>
      f.status === 'ready'
    );

    // Apply new sort to remaining files only
    // (processed files stay in original positions)
  }

  // Apply sort
  sortColumn.value = newSortColumn;
  sortDirection.value = newSortDirection;
};
```

---

## Implementation Tasks

### Task Checklist

#### 5.1 Column Sorting
- [ ] Create `useColumnSort.js` composable
- [ ] Implement toggleSort function
- [ ] Implement sort comparators (alphabetical, numerical, status)
- [ ] Add sort indicators to headers
- [ ] Handle sort cycling (asc → desc → clear)
- [ ] Test with various data types

#### 5.2 Column Reordering
- [ ] Create `useColumnDragDrop.js` composable
- [ ] Implement drag start/over/drop/end handlers
- [ ] Add drag handle icon to headers
- [ ] Prevent dragging fixed columns
- [ ] Persist column order to localStorage
- [ ] Test reordering edge cases

#### 5.3 Column Resizing
- [ ] Create `useColumnResize.js` composable
- [ ] Implement resize mouse handlers
- [ ] Add resize handles to column borders
- [ ] Set minimum column width (80px)
- [ ] Persist column widths to localStorage
- [ ] Test resize interactions

#### 5.4 Upload Order
- [ ] Implement upload in sorted order
- [ ] Handle mid-upload sort changes
- [ ] Show warning for mid-upload sort
- [ ] Test upload order correctness
- [ ] Test sort change during upload

---

## Testing Requirements

### Unit Tests
```javascript
describe('Column Sorting', () => {
  it('sorts files alphabetically by name', () => {});
  it('sorts files numerically by size', () => {});
  it('sorts files by status priority', () => {});
  it('cycles through asc → desc → clear', () => {});
});

describe('Column Reordering', () => {
  it('reorders columns via drag-and-drop', () => {});
  it('prevents dragging actions column', () => {});
  it('prevents dragging cancel column', () => {});
  it('persists order to localStorage', () => {});
});

describe('Column Resizing', () => {
  it('resizes column on drag', () => {});
  it('enforces minimum width (80px)', () => {});
  it('persists widths to localStorage', () => {});
});
```

### Manual Testing
1. Sort each column, verify order
2. Drag columns to reorder
3. Resize columns
4. Start upload, verify sorted order
5. Change sort mid-upload, verify warning

---

## Success Criteria

- [x] Columns sort correctly (alphabetical, numerical, status)
- [x] Sort indicator shows direction
- [x] Columns reorder via drag-and-drop
- [x] Fixed columns cannot be moved
- [x] Columns resize with mouse drag
- [x] Order and widths persist to localStorage
- [x] Files upload in currently sorted order
- [x] Mid-upload sort shows warning

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
