# Phase 3: File Copy Management (Deduplication)

**Phase:** 3 of 7
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 4-5 days
**Dependencies:** Phase 1 (Foundation), Phase 1.5 (Virtualization)

---

## Overview

Implement intelligent file copy/duplicate handling with visual grouping and checkbox-based selection to choose which copy of a file to upload. Additionally, filter out true duplicates (same file uploaded multiple times) with warning popup.

**Goal:** Copies grouped below primary file with checkbox-based swap capability; duplicates filtered with user notification
**Deliverable:** Visual hierarchy for copies with checkbox swap + duplicate filtering popup
**User Impact:** Users can easily identify and choose which copy to upload, while being warned about duplicate uploads

---

## Terminology (CRITICAL)

**This phase uses precise deduplication terminology:**

- **"Copy"** or **"Copies"**: Files with the same hash value but different file metadata (different name, path, or modified date)
  - Example: `invoice.pdf` in `/2024/Tax` and `invoice (1).pdf` in `/2024/Backup` with same content
  - These files will be uploaded to the SAME document (deduplicated by hash)
  - User must choose which copy's metadata to use

- **"Duplicate"** or **"Duplicates"**: The exact same file being queued multiple times (same hash, same metadata, same location)
  - Example: User drags the same folder twice, resulting in `invoice.pdf` appearing twice in queue
  - These are true duplicates and should be filtered out with a warning popup
  - Only one instance should remain in the queue

- **"Primary Copy"**: The copy that will be uploaded (selected for upload)
  - Always displayed at the top of the copy group
  - Checkbox is checked by default
  - Filename displayed in **bold**
  - Has 🔵 Ready status

- **"Secondary Copy"** or just "Copy": Copies that will NOT be uploaded
  - Displayed below the primary copy in the group
  - Checkbox is unchecked by default
  - Filename displayed in normal (non-bold) font
  - Has 🟣 Copy status (purple dot)

**Visual Note:** Throughout this document, status emojis (🔵 🟡 🟢 🟣 ⚪ 🔴 🟠) are visual shorthand for planning purposes. The actual implementation uses CSS-styled colored dots (circles) with text labels. See `StatusCell.vue` for implementation details.

---

## Features

### 3.1 Copy Grouping & Visual Hierarchy
### 3.2 Checkbox-Based Copy Swap
### 3.3 Duplicate Filtering with Warning Popup

---

## 3.1 Copy Grouping & Visual Hierarchy

### Visual Design

**Column Order (Current Implementation):**
Select | File Name | Size | Folder Path | Status

**Grouped Display:**
```
┌────────┬───────────────────┬──────────┬──────────────┬─────────┐
│ Select │ File Name         │ Size     │ Folder Path  │ Status  │
├────────┼───────────────────┼──────────┼──────────────┼─────────┤
│  [✓]   │ invoice.pdf       │ 2.4 MB   │ /2024/Tax    │ 🔵 Ready│  ← Primary (bold, left border)
│  [ ]   │ invoice (1).pdf   │ 2.4 MB   │ /2024/Backup │ 🟣 Copy │  ← Copy (non-bold, left border)
│  [ ]   │ invoice (2).pdf   │ 2.4 MB   │ /Archive     │ 🟣 Copy │  ← Copy (non-bold, left border)
│  [✓]   │ report.docx       │ 890 KB   │ /Reports     │ 🔵 Ready│  ← Unique file (bold, no border)
└────────┴───────────────────┴──────────┴──────────────┴─────────┘
```

**Note:** Status emojis (🔵 🟣) are visual shorthand. Actual implementation renders: `<span class="status-dot">` (colored circle) + text label.

### Visual Indicators

**Primary Copy (Ready to Upload):**
- **Bold filename** (only bold file in the group)
- 🔵 Ready status (blue dot + "Ready" text)
- Checkbox **checked** by default
- Colored left border (3px solid purple) on entire row
- Located at **top** of copy group

**Secondary Copies (Will NOT Upload):**
- **Non-bold filename** (regular font weight)
- 🟣 Copy status (purple dot + "Copy" text)
- Checkbox **unchecked** by default
- Colored left border (3px solid purple) on entire row
- Located **below** primary copy in group

**Unique Files (No Copies):**
- **Bold filename** (default for all unique files)
- 🔵 Ready status
- Checkbox checked by default
- **No left border**

### Grouping Logic

```javascript
// Group files by hash, identifying primary and secondary copies
function groupCopies(files) {
  const groups = new Map();

  files.forEach(file => {
    if (!groups.has(file.hash)) {
      groups.set(file.hash, {
        primary: null,
        copies: []
      });
    }

    const group = groups.get(file.hash);

    // Primary copy: the one with checkbox checked (status ready/uploading/completed)
    if (file.status === 'ready' || file.status === 'uploading' || file.status === 'completed') {
      group.primary = file;
    }
    // Secondary copy: unchecked (status 'copy')
    else if (file.status === 'copy') {
      group.copies.push(file);
    }
  });

  return groups;
}

// Flatten groups into display order: primary first, then copies
function flattenGroupsForDisplay(groups) {
  const displayOrder = [];

  groups.forEach(group => {
    if (group.primary) {
      // Always put primary at top
      displayOrder.push(group.primary);

      // Sort copies by modified date (oldest first)
      const sortedCopies = group.copies.sort((a, b) =>
        a.sourceLastModified - b.sourceLastModified
      );

      displayOrder.push(...sortedCopies);
    }
  });

  return displayOrder;
}
```

### CSS Styling

```css
/* Copy group left border (applies to ALL files in a copy group) */
.table-row.copy-group {
  border-left: 3px solid #9C27B0; /* Purple left border */
}

/* Primary copy - bold filename */
.table-row.primary-copy .filename-text {
  font-weight: 700; /* Bold */
}

/* Secondary copy - normal filename */
.table-row.secondary-copy .filename-text {
  font-weight: 400; /* Normal */
}

/* Unique files (no copies) - bold by default */
.table-row .filename-text {
  font-weight: 700; /* Bold by default */
}

/* Unique files explicitly not in a copy group */
.table-row:not(.copy-group) .filename-text {
  font-weight: 700; /* Ensure bold for unique files */
}
```

---

## 3.2 Checkbox-Based Copy Swap

### Behavior Specification

**Checkbox Interaction Rules:**

1. **Primary Copy Checkbox (Checked → Unchecked):**
   - When primary copy checkbox is **unchecked**:
     - Primary copy status → `skip` (⚪ Skip)
     - ALL copies in group status → `skip` (⚪ Skip)
     - ALL checkboxes in group → unchecked
     - Entire group will be skipped (not uploaded)
     - Group still visible, can be restored

2. **Secondary Copy Checkbox (Unchecked → Checked):**
   - When a secondary copy checkbox is **checked**:
     - That copy becomes the **new primary**
     - Old primary becomes a **secondary copy**
     - Rows swap positions (new primary moves to top)
     - Filenames swap bold/non-bold styling
     - Statuses swap (new primary gets Ready, old gets Copy)
     - Only ONE checkbox can be checked in a copy group at a time

3. **Skipped Group Restoration (Any Copy Checked):**
   - When ANY checkbox in a skipped group is **checked**:
     - That copy becomes the new primary (Ready status)
     - All other copies → `copy` status (unchecked)
     - Group restored from skip state

4. **Select All / Deselect All Behavior:**
   - **Select All** checkbox affects **only primary copies**
   - Does NOT affect secondary copies (they remain unchecked)
   - **Deselect All** unchecks all primary copies (sets groups to skip state)

5. **Mutual Exclusivity:**
   - Among copies with the same hash, **maximum ONE** checkbox can be checked
   - Checking one copy automatically unchecks the previous primary

### Swap Algorithm

```javascript
// useCopySwap.js
export function useCopySwap(uploadQueue) {

  /**
   * Handle checkbox change on a file
   * @param {Object} file - The file whose checkbox changed
   * @param {boolean} isChecked - New checkbox state
   */
  const handleCheckboxChange = (file, isChecked) => {
    const copyGroup = findCopyGroup(file.hash, uploadQueue.value);

    if (!copyGroup || copyGroup.length === 1) {
      // Not a copy group, just toggle skip status
      file.status = isChecked ? 'ready' : 'skip';
      return;
    }

    if (isChecked) {
      // User checked a copy - make it the primary
      promoteCopyToPrimary(file, copyGroup);
    } else {
      // User unchecked the primary - skip entire group
      skipEntireGroup(copyGroup);
    }
  };

  /**
   * Promote a copy to primary (swap)
   * @param {Object} newPrimary - The copy to promote
   * @param {Array} copyGroup - All files in the group
   */
  const promoteCopyToPrimary = (newPrimary, copyGroup) => {
    console.log(`[COPY SWAP] Promoting ${newPrimary.name} to primary`);

    // Find current primary
    const currentPrimary = copyGroup.find(f =>
      f.status === 'ready' || f.status === 'uploading' || f.status === 'completed'
    );

    if (currentPrimary && currentPrimary.id !== newPrimary.id) {
      // Demote current primary to copy
      currentPrimary.status = 'copy';

      // Swap positions in queue (move new primary above old primary)
      const newPrimaryIndex = uploadQueue.value.indexOf(newPrimary);
      const currentPrimaryIndex = uploadQueue.value.indexOf(currentPrimary);

      // Remove new primary from its current position
      uploadQueue.value.splice(newPrimaryIndex, 1);

      // Insert new primary at the top of the group (current primary's position)
      uploadQueue.value.splice(currentPrimaryIndex, 0, newPrimary);
    }

    // Promote new primary
    newPrimary.status = 'ready';
    newPrimary.swappedAt = Date.now();

    // Ensure all other copies are unchecked
    copyGroup.forEach(f => {
      if (f.id !== newPrimary.id && f.status !== 'copy') {
        f.status = 'copy';
      }
    });
  };

  /**
   * Skip entire copy group
   * @param {Array} copyGroup - All files in the group
   */
  const skipEntireGroup = (copyGroup) => {
    console.log(`[COPY SWAP] Skipping entire group (${copyGroup.length} files)`);

    copyGroup.forEach(file => {
      file.status = 'skip';
    });
  };

  /**
   * Find all files with the same hash
   * @param {string} hash - File hash
   * @param {Array} queue - Upload queue
   * @returns {Array} - Files with matching hash
   */
  const findCopyGroup = (hash, queue) => {
    return queue.filter(f => f.hash === hash);
  };

  return {
    handleCheckboxChange,
    promoteCopyToPrimary,
    skipEntireGroup,
    findCopyGroup
  };
}
```

### Component Changes

**UploadTableRow.vue - Checkbox Handler:**

```vue
<script setup>
import { computed } from 'vue';

const props = defineProps({
  file: { type: Object, required: true },
  isCopyGroup: { type: Boolean, default: false },
  isPrimary: { type: Boolean, default: false }
});

const emit = defineEmits(['checkbox-change']);

// Checkbox is checked if status is ready/uploading/completed
const isChecked = computed(() => {
  return ['ready', 'uploading', 'completed'].includes(props.file.status);
});

// Apply copy group styling
const rowClasses = computed(() => ({
  'copy-group': props.isCopyGroup,
  'primary-copy': props.isCopyGroup && props.isPrimary,
  'secondary-copy': props.isCopyGroup && !props.isPrimary
}));

const handleCheckboxChange = (event) => {
  emit('checkbox-change', {
    file: props.file,
    isChecked: event.target.checked
  });
};
</script>

<template>
  <div class="upload-table-row" :class="rowClasses">
    <!-- Select Column -->
    <div class="row-cell select-cell">
      <input
        type="checkbox"
        :checked="isChecked"
        :disabled="file.status === 'completed'"
        @change="handleCheckboxChange"
      />
    </div>

    <!-- File Name Column - Bold for primary, normal for copies -->
    <div class="row-cell filename-cell">
      <span class="filename-text">{{ file.name }}</span>
      <span v-if="isHovering" class="eyeball-icon" @click="openFile">👁️</span>
    </div>

    <!-- Size Column -->
    <div class="row-cell size-cell">
      {{ formatFileSize(file.size) }}
    </div>

    <!-- Folder Path Column -->
    <div class="row-cell path-cell">
      {{ file.folderPath || '/' }}
    </div>

    <!-- Status Column -->
    <div class="row-cell status-cell-wrapper">
      <StatusCell :status="file.status" />
    </div>
  </div>
</template>
```

**StatusCell.vue - Add Copy Status:**

```javascript
// Status text mapping (add 'copy' status)
const statusTextMap = {
  ready: 'Ready',
  uploading: 'Uploading...',
  completed: 'Uploaded',
  copy: 'Copy',        // NEW: Purple dot for secondary copies
  skip: 'Skip',
  error: 'Failed',
  uploadMetadataOnly: 'Metadata Only',
  unknown: 'Unknown',
  'n/a': 'N/A',
};

// CSS for copy status
.status-copy {
  background-color: #9C27B0; /* Purple */
}
```

---

## 3.3 Duplicate Filtering with Warning Popup

### Behavior Specification

**When files are added to queue:**

1. **Detect True Duplicates:**
   - During `addFilesToQueue()`, check for files with:
     - Same hash
     - Same file metadata (name, size, modified date)
     - Same folder path
   - These are "duplicates" (user trying to queue the same file multiple times)

2. **Filter Duplicates:**
   - Keep only ONE instance of each duplicate
   - Track count of filtered duplicates
   - Store list of duplicate filenames

3. **Show Warning Popup (if duplicates found):**
   - Display modal/dialog with:
     - Count of duplicates filtered (e.g., "15 duplicate files were filtered")
     - Scrollable list of duplicate filenames
     - OK button to dismiss
   - Popup appears after queue processing completes
   - Non-blocking (user can dismiss and continue)

### Detection Logic

```javascript
// useDuplicateFilter.js
export function useDuplicateFilter() {

  /**
   * Filter duplicate files from array
   * @param {Array} files - Files to filter
   * @returns {Object} - { uniqueFiles, duplicates }
   */
  const filterDuplicates = (files) => {
    const seen = new Map();
    const uniqueFiles = [];
    const duplicates = [];

    files.forEach(file => {
      // Create unique key: hash + metadata + path
      const key = `${file.hash}_${file.name}_${file.size}_${file.lastModified}_${file.webkitRelativePath || ''}`;

      if (seen.has(key)) {
        // This is a duplicate - same file queued again
        duplicates.push({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size
        });
      } else {
        // First occurrence - keep it
        seen.set(key, true);
        uniqueFiles.push(file);
      }
    });

    console.log(`[DUPLICATE FILTER] Found ${duplicates.length} duplicates, kept ${uniqueFiles.length} unique files`);

    return {
      uniqueFiles,
      duplicates
    };
  };

  return {
    filterDuplicates
  };
}
```

### Popup Component

**DuplicateWarningPopup.vue:**

```vue
<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 bg-warning">
        <v-icon start>mdi-alert</v-icon>
        Duplicate Files Detected
      </v-card-title>

      <v-card-text class="pt-4">
        <p class="text-body-1 mb-4">
          <strong>{{ duplicateCount }}</strong> duplicate {{ duplicateCount === 1 ? 'file was' : 'files were' }}
          filtered from the upload queue. You were attempting to upload the same
          {{ duplicateCount === 1 ? 'file' : 'files' }} multiple times.
        </p>

        <div class="duplicate-list-container">
          <p class="text-subtitle-2 mb-2">Filtered duplicates:</p>
          <div class="duplicate-list">
            <div
              v-for="(dup, index) in duplicates"
              :key="index"
              class="duplicate-item"
            >
              <v-icon size="small" color="grey">mdi-file-outline</v-icon>
              <span class="duplicate-name">{{ dup.path }}</span>
              <span class="duplicate-size text-grey">{{ formatFileSize(dup.size) }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="handleClose">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  duplicates: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close']);

const show = ref(true);

const duplicateCount = computed(() => props.duplicates.length);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const handleClose = () => {
  show.value = false;
  emit('close');
};
</script>

<style scoped>
.duplicate-list-container {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
}

.duplicate-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.duplicate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.duplicate-name {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.duplicate-size {
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
```

### Integration with Queue Management

**useUploadTable.js - Updated addFilesToQueue:**

```javascript
import { useDuplicateFilter } from './useDuplicateFilter.js';

export function useUploadTable() {
  const uploadQueue = ref([]);
  const showDuplicateWarning = ref(false);
  const filteredDuplicates = ref([]);

  const { filterDuplicates } = useDuplicateFilter();

  const addFilesToQueue = async (files) => {
    // STEP 1: Filter duplicates
    const { uniqueFiles, duplicates } = filterDuplicates(files);

    if (duplicates.length > 0) {
      // Store duplicates for popup
      filteredDuplicates.value = duplicates;
      showDuplicateWarning.value = true;
    }

    // STEP 2: Process unique files only
    const processedFiles = uniqueFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      hash: file.hash, // Computed during processing
      status: 'ready',
      folderPath: extractFolderPath(file),
      sourceFile: file,
      sourceLastModified: file.lastModified,
    }));

    // STEP 3: Detect copies (same hash, different metadata)
    const groupedByHash = new Map();
    processedFiles.forEach(file => {
      if (!groupedByHash.has(file.hash)) {
        groupedByHash.set(file.hash, []);
      }
      groupedByHash.get(file.hash).push(file);
    });

    // STEP 4: Mark copies and set primary
    groupedByHash.forEach((group) => {
      if (group.length > 1) {
        // Multiple files with same hash = copies
        // First one is primary (ready), rest are copies
        group.forEach((file, index) => {
          file.status = index === 0 ? 'ready' : 'copy';
        });
      }
    });

    uploadQueue.value.push(...processedFiles);

    console.log(`[QUEUE] Added ${processedFiles.length} files (filtered ${duplicates.length} duplicates)`);
  };

  const closeDuplicateWarning = () => {
    showDuplicateWarning.value = false;
    filteredDuplicates.value = [];
  };

  return {
    uploadQueue,
    showDuplicateWarning,
    filteredDuplicates,
    addFilesToQueue,
    closeDuplicateWarning,
    // ... other methods
  };
}
```

---

## Implementation Tasks

### Task Checklist

#### 3.1 Copy Grouping
- [ ] Add 'copy' status to StatusCell.vue (purple dot)
- [ ] Create `useCopyGrouping.js` composable
- [ ] Implement `groupCopies()` function
- [ ] Implement `flattenGroupsForDisplay()` function
- [ ] Sort copies by modified date within group
- [ ] Add left border styling for copy groups
- [ ] Add bold/non-bold filename styling
- [ ] Test with various copy scenarios

#### 3.2 Checkbox Swap
- [ ] Create `useCopySwap.js` composable
- [ ] Implement `handleCheckboxChange()` function
- [ ] Implement `promoteCopyToPrimary()` swap function
- [ ] Implement `skipEntireGroup()` function
- [ ] Update UploadTableRow.vue checkbox handler
- [ ] Add copy group classes (primary-copy, secondary-copy)
- [ ] Test mutual exclusivity (only one checked per group)
- [ ] Test swap animation/transition
- [ ] Test Select All/None with copy groups

#### 3.3 Duplicate Filtering
- [ ] Create `useDuplicateFilter.js` composable
- [ ] Implement `filterDuplicates()` detection function
- [ ] Create `DuplicateWarningPopup.vue` component
- [ ] Integrate duplicate filtering into `addFilesToQueue()`
- [ ] Add duplicate tracking state (showWarning, filteredDuplicates)
- [ ] Test duplicate detection accuracy
- [ ] Test popup display and dismissal
- [ ] Test with large duplicate counts (100+)

#### 3.4 Integration
- [ ] Integrate copy grouping with existing table
- [ ] Update row rendering to apply copy group styling
- [ ] Connect checkbox swap to upload queue
- [ ] Ensure copy swap doesn't break virtual scrolling
- [ ] Test with Phase 1.5 virtualization
- [ ] Verify footer counts are accurate with copies
- [ ] Test Select All/None behavior with mixed files

---

## Testing Requirements

### Unit Tests

```javascript
// useCopyGrouping.spec.js
describe('Copy Grouping', () => {
  it('groups files by hash', () => {});
  it('identifies primary as first ready file', () => {});
  it('identifies copies as files with copy status', () => {});
  it('sorts copies by modified date', () => {});
  it('flattens groups in correct display order', () => {});
  it('handles files with no copies', () => {});
  it('handles multiple copy groups', () => {});
});

// useCopySwap.spec.js
describe('Copy Swap (Checkbox-Based)', () => {
  it('promotes copy to primary when checkbox checked', () => {});
  it('swaps positions in queue (new primary to top)', () => {});
  it('demotes old primary to copy status', () => {});
  it('skips entire group when primary unchecked', () => {});
  it('restores group when any copy checked', () => {});
  it('enforces mutual exclusivity (one checked per group)', () => {});
  it('Select All affects only primary copies', () => {});
  it('Deselect All skips all groups', () => {});
});

// useDuplicateFilter.spec.js
describe('Duplicate Filtering', () => {
  it('detects duplicates with same hash and metadata', () => {});
  it('keeps first occurrence of duplicate', () => {});
  it('filters subsequent duplicates', () => {});
  it('distinguishes duplicates from copies', () => {});
  it('handles edge case: no duplicates', () => {});
  it('handles edge case: all duplicates', () => {});
});
```

### Component Tests

```javascript
describe('DuplicateWarningPopup', () => {
  it('renders duplicate count correctly', () => {});
  it('displays scrollable list of duplicates', () => {});
  it('formats file sizes correctly', () => {});
  it('emits close event on OK button', () => {});
  it('handles singular vs plural text', () => {});
});

describe('Copy Row Rendering', () => {
  it('applies left border to copy group rows', () => {});
  it('applies bold to primary copy filename', () => {});
  it('applies normal font to secondary copy filenames', () => {});
  it('groups copies below primary', () => {});
  it('does not apply border to unique files', () => {});
});
```

### Integration Tests

```javascript
describe('Copy Management Integration', () => {
  it('checkbox swap updates primary and copies correctly', () => {});
  it('skip primary skips entire group', () => {});
  it('restore from skip promotes checked copy', () => {});
  it('multiple swaps maintain group integrity', () => {});
  it('virtual scrolling works with copy groups', () => {});
  it('Select All checks only primaries', () => {});
  it('footer counts exclude secondary copies', () => {});
});

describe('Duplicate Filtering Integration', () => {
  it('filters duplicates during queue addition', () => {});
  it('shows popup when duplicates detected', () => {});
  it('popup does not show when no duplicates', () => {});
  it('queue contains only unique files after filtering', () => {});
});
```

### Manual Testing Scenarios

1. **Basic Copy Grouping:**
   - Upload 5 files with 2 copies of same file
   - Verify primary shows first with bold name and checked checkbox
   - Verify copies show below with normal font and unchecked checkboxes
   - Verify left border on all rows in group

2. **Checkbox Swap:**
   - Check a secondary copy's checkbox
   - Verify it becomes primary (moves to top, bold, Ready status)
   - Verify old primary becomes copy (normal font, Copy status)
   - Verify only one checkbox checked in group

3. **Skip Entire Group:**
   - Uncheck primary copy checkbox
   - Verify entire group status changes to Skip
   - Verify all checkboxes unchecked
   - Verify group still visible

4. **Restore from Skip:**
   - Check any copy in skipped group
   - Verify that copy becomes new primary
   - Verify group restored from skip state
   - Verify other copies remain unchecked

5. **Select All / Deselect All:**
   - Use Select All checkbox
   - Verify only primary copies are checked
   - Verify secondary copies remain unchecked
   - Use Deselect All
   - Verify all groups go to skip state

6. **Duplicate Filtering:**
   - Drag same folder twice to queue
   - Verify popup appears with duplicate count
   - Verify scrollable list shows duplicate filenames
   - Verify queue contains only one copy of each file
   - Dismiss popup with OK button

7. **Large Copy Groups:**
   - Upload file with 5 copies
   - Swap multiple times (check different copies)
   - Verify each swap maintains correct order and styling
   - Verify footer counts remain accurate

8. **Mixed Scenario:**
   - Upload 1000 files with 50 copy groups and 20 duplicates
   - Verify virtual scrolling performance
   - Verify duplicate popup shows 20 filtered
   - Verify copy groups display correctly
   - Verify checkbox swaps are responsive

---

## Success Criteria

### Functional Requirements
- [ ] Copies display below primary with visual distinction
- [ ] Left border clearly shows copy grouping
- [ ] Bold/non-bold filename indicates primary vs copies
- [ ] Checkbox swap changes primary and swaps positions
- [ ] Only one checkbox checked per copy group
- [ ] Unchecking primary skips entire group
- [ ] Checking any copy in skipped group restores it
- [ ] Select All affects only primary copies
- [ ] Deselect All skips all groups
- [ ] Duplicates filtered during queue addition
- [ ] Popup shows when duplicates detected
- [ ] Popup displays accurate count and scrollable list
- [ ] Popup dismisses with OK button

### Performance Requirements
- [ ] Copy grouping calculation <50ms for 1000 files
- [ ] Checkbox swap responds in <100ms
- [ ] Virtual scrolling unaffected by copy grouping
- [ ] Duplicate filtering <100ms for 1000 files
- [ ] Popup renders in <200ms

### Visual Requirements
- [ ] Copy rows clearly distinguishable with left border
- [ ] Bold vs non-bold filename distinction clear
- [ ] Primary always at top of copy group
- [ ] Purple Copy status visible and distinct
- [ ] Copy group visual hierarchy intuitive
- [ ] Popup warning clear and actionable

---

## Dependencies

### Internal Dependencies
- Phase 1.0: Upload Queue Foundation (table structure, status system)
- Phase 1.5: Virtualization (virtual scrolling must work with copy groups)
- `useUploadTable.js` - For queue management integration
- `StatusCell.vue` - Add 'copy' status (purple dot)

### New Status Type
- Add `copy` to status validator in StatusCell.vue
- Purple dot + "Copy" text label

---

## Performance Benchmarks

**Copy Operations:**
| Operation | Target | Actual |
|-----------|--------|--------|
| Group 1000 files | <50ms | _TBD_ |
| Checkbox swap | <100ms | _TBD_ |
| Render grouped display | <100ms | _TBD_ |
| Filter duplicates | <100ms | _TBD_ |
| Show popup | <200ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 3 - Copy grouping: Xms');
console.log('[PERFORMANCE] Phase 3 - Checkbox swap: Xms');
console.log('[PERFORMANCE] Phase 3 - Duplicate filtering: Xms');
console.log('[PERFORMANCE] Phase 3 - Copy groups: X groups with Y total copies');
console.log('[PERFORMANCE] Phase 3 - Duplicates filtered: X files');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Virtual scrolling breaks with dynamic copy groups | Low | High | Test extensively with various group sizes |
| Checkbox swap causes position jump in scroll | Medium | Low | Use key-based rendering for stability |
| Multiple rapid swaps cause race condition | Low | Medium | Debounce checkbox change events |
| Duplicate detection misses edge cases | Medium | Medium | Comprehensive testing with varied metadata |
| Large duplicate lists crash popup | Low | Low | Virtualize popup list if needed |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Left border not noticeable enough | Low | Medium | User testing, adjust color/width if needed |
| Bold vs non-bold not obvious | Medium | Low | Add additional visual cue if needed |
| Checkbox swap behavior unclear | Medium | Medium | Add tooltip/help text explaining behavior |
| Duplicate popup ignored by users | Low | Low | Make popup more prominent, require explicit dismiss |

---

## Next Phase Preview

**Phase 4:** Column Management (sort, reorder, resize)
- Sortable columns (click header to sort)
- Drag-and-drop column reordering
- Column resizing with mouse drag
- Upload order respects current sort
- Copy groups maintained during sorting

This phase adds table customization capabilities.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-12 (Updated for actual Phase 1.0/1.5 implementation, checkbox-based swap, duplicate filtering)
**Assignee:** TBD

---

## Summary of Changes from Original Plan

**Major Changes:**
1. **Terminology:** Clarified "copies" vs "duplicates" - copies have same hash but different metadata; duplicates are the same file queued multiple times
2. **Swap Mechanism:** Changed from dedicated swap button (↔️) to checkbox-based swap for simplicity and consistency
3. **Column Order:** Updated to match actual implementation: Select | File Name | Size | Folder Path | Status
4. **Visual Hierarchy:** Changed from indentation + arrow to left border + bold/non-bold text
5. **Duplicate Handling:** Added duplicate filtering with warning popup (new feature)
6. **Select All Behavior:** Clarified that Select All affects only primary copies, not secondary copies
7. **Status Display:** Added note that emojis are visual shorthand; actual implementation uses CSS dots
8. **Terminology:** Replaced "Cancel" with "Skip" throughout to match Phase 1.0 implementation

**Rationale:**
- Checkbox-based swap is more intuitive and consistent with existing UI
- Left border + font weight provides clearer visual hierarchy
- Duplicate filtering prevents user error and provides helpful feedback
- Aligns with actual Phase 1.0/1.5 architecture and components
