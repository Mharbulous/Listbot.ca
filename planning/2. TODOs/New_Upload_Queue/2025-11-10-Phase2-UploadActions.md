# Phase 2: Upload Actions - Cancel, Undo, Immediate Upload

**Phase:** 2 of 8
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 3-4 days
**Dependencies:** Phase 1 (Virtual Upload Queue)

---

## Overview

Implement essential file management actions allowing users to cancel files, undo cancellations, and upload individual files immediately without waiting for the full batch.

**Goal:** Full file control with cancel/undo and immediate uploads
**Deliverable:** Working action buttons with proper state management
**User Impact:** Users can manage individual files in queue, prioritize critical uploads

---

## Features

### 2.1 Cancel Action
### 2.2 Undo Action
### 2.3 Duplicate Promotion on Cancel
### 2.4 Immediate Upload Action

---

## 2.1 Cancel Action (Far Right Column)

### Visual Design

**Normal Row:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [👁️] [⬆️]   │ invoice.pdf       │ 2.4 MB   │ 🔵 Ready        │ /2024/Tax    │  [❌]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

**Cancelled Row:**
```
┌──────────────┬───────────────────┬──────────┬─────────────────┬──────────────┬────────┐
│ [—] [—]     │ ~~invoice.pdf~~   │ 2.4 MB   │ ⚪ Cancelled    │ /2024/Tax    │  [🔄]  │
└──────────────┴───────────────────┴──────────┴─────────────────┴──────────────┴────────┘
```

### Behavior Specification

**When user clicks ❌ Cancel button:**

1. **Visual State Changes:**
   - Row displays with crossed-out text (strikethrough)
   - Row opacity reduced to 50%
   - All action buttons disabled and show "—" placeholder
   - Cancel button replaced with 🔄 Undo button
   - Status changes to "⚪ Cancelled"

2. **Data State Changes:**
   - `file.status = 'cancelled'`
   - `file.previousStatus` = saved for undo
   - `file.cancelledAt` = timestamp

3. **Footer Updates:**
   - Exclude from "Ready" count
   - Exclude from "Total uploadable" count
   - Do NOT remove from total file count

### Implementation

```vue
<!-- CancelButton.vue -->
<template>
  <button
    class="cancel-button"
    :disabled="!canCancel"
    @click="handleCancel"
    :title="isCancelled ? 'Undo cancellation' : 'Cancel file'"
  >
    {{ isCancelled ? '🔄' : '❌' }}
  </button>
</template>

<script setup>
const props = defineProps({
  file: { type: Object, required: true }
});

const emit = defineEmits(['cancel', 'undo']);

const isCancelled = computed(() => props.file.status === 'cancelled');
const canCancel = computed(() => {
  // Cannot cancel files that are uploading or already uploaded
  return !['uploading', 'completed'].includes(props.file.status);
});

const handleCancel = () => {
  if (isCancelled.value) {
    emit('undo', props.file);
  } else {
    emit('cancel', props.file);
  }
};
</script>
```

### CSS Styling

```css
/* Cancelled row state */
.table-row.cancelled {
  opacity: 0.5;
  pointer-events: none; /* Disable interactions */
}

.table-row.cancelled .cell-content {
  text-decoration: line-through;
  color: #999;
}

.table-row.cancelled .action-button {
  cursor: not-allowed;
}

/* Enable only cancel button when cancelled */
.table-row.cancelled .cancel-button {
  pointer-events: auto;
  cursor: pointer;
}

/* Cancel button styling */
.cancel-button {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.cancel-button:hover:not(:disabled) {
  transform: scale(1.2);
}

.cancel-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

---

## 2.2 Undo Action

### Behavior Specification

**When user clicks 🔄 Undo button:**

1. **Visual State Restoration:**
   - Remove strikethrough styling
   - Restore full opacity
   - Re-enable action buttons
   - Undo button replaced with ❌ Cancel button
   - Status returns to previous state

2. **Data State Changes:**
   - `file.status = file.previousStatus`
   - Clear `file.cancelledAt`
   - Clear `file.previousStatus`

3. **Footer Updates:**
   - Re-include in appropriate status counts
   - Update total uploadable count

### Implementation

```javascript
// useFileActions.js
export function useFileActions(uploadQueue) {
  const cancelFile = (file) => {
    // Save current status for undo
    file.previousStatus = file.status;
    file.status = 'cancelled';
    file.cancelledAt = Date.now();

    // Check for duplicates to promote
    const duplicates = findDuplicates(file, uploadQueue.value);
    if (duplicates.length > 0) {
      promoteDuplicate(duplicates, file);
    }

    console.log(`[ACTION] Cancelled: ${file.fileName}`);
  };

  const undoCancel = (file) => {
    // Restore previous status
    file.status = file.previousStatus || 'ready';
    delete file.cancelledAt;
    delete file.previousStatus;

    // If we promoted a duplicate, we may need to adjust
    // (handled in duplicate management logic)

    console.log(`[ACTION] Undo cancel: ${file.fileName}`);
  };

  return { cancelFile, undoCancel };
}
```

---

## 2.3 Duplicate Promotion on Cancel

### Algorithm

**When original file is cancelled, promote the next oldest duplicate:**

```javascript
function promoteDuplicate(duplicates, cancelledFile) {
  // 1. Filter out already cancelled/uploaded duplicates
  const eligibleDuplicates = duplicates.filter(d =>
    d.status === 'skipped' && d.id !== cancelledFile.id
  );

  if (eligibleDuplicates.length === 0) return;

  // 2. Find oldest duplicate (earliest sourceLastModified)
  const oldestDuplicate = eligibleDuplicates.reduce((oldest, current) => {
    return current.sourceLastModified < oldest.sourceLastModified
      ? current
      : oldest;
  });

  // 3. Promote to ready status
  oldestDuplicate.status = 'ready';
  oldestDuplicate.promotedFrom = cancelledFile.id;

  // 4. Move promoted file to position of cancelled file
  const cancelledIndex = uploadQueue.value.indexOf(cancelledFile);
  const duplicateIndex = uploadQueue.value.indexOf(oldestDuplicate);

  // Remove from current position
  uploadQueue.value.splice(duplicateIndex, 1);

  // Insert after cancelled file
  uploadQueue.value.splice(cancelledIndex + 1, 0, oldestDuplicate);

  console.log(
    `[DUPLICATE] Promoted ${oldestDuplicate.fileName} (modified: ${oldestDuplicate.sourceLastModified})`
  );
}
```

### Example Flow

```
Before Cancel:
Row 5: invoice.pdf           [Status: Ready]        [Modified: 2024-01-15] ← User cancels
Row 6: invoice (1).pdf       [Status: Duplicate]    [Modified: 2024-01-10]
Row 7: invoice (2).pdf       [Status: Duplicate]    [Modified: 2024-01-20]

After Cancel:
Row 5: ~~invoice.pdf~~       [Status: Cancelled]    [Modified: 2024-01-15]  [Undo]
Row 6: invoice (1).pdf       [Status: Ready]        [Modified: 2024-01-10]  ← Promoted (oldest)
Row 7: invoice (2).pdf       [Status: Duplicate]    [Modified: 2024-01-20]
```

### Helper Functions

```javascript
// Find all duplicates of a file (same hash)
function findDuplicates(file, queue) {
  return queue.filter(f =>
    f.hash === file.hash && f.id !== file.id
  );
}

// Check if file has uncancelled duplicates
function hasEligibleDuplicates(file, queue) {
  const duplicates = findDuplicates(file, queue);
  return duplicates.some(d =>
    d.status === 'skipped' && d.status !== 'cancelled'
  );
}
```

---

## 2.4 Immediate Upload Action (⬆️ Button)

### Visual Design

**Actions Column:**
```
┌──────────────┐
│ [👁️] [⬆️]   │  ← Upload Now button (arrow up)
└──────────────┘
```

### Behavior Specification

**When user clicks ⬆️ Upload Now button:**

1. **Pre-Upload Validation:**
   - Check file status (must be 'ready')
   - Check if upload is paused (queue for resume)
   - Check network connection

2. **Immediate Upload:**
   - File jumps to front of upload queue
   - Status changes to 🟡 Uploading...
   - Upload Now button disabled
   - Progress indicator shown (if applicable)

3. **On Upload Complete:**
   - Status → 🟢 Uploaded (success)
   - Status → 🔴 Failed (error)
   - Upload Now button remains disabled

4. **Footer Updates:**
   - Increment "Uploaded" count
   - Decrement "Ready" count
   - Update progress percentage

### Implementation

```vue
<!-- UploadNowButton.vue -->
<template>
  <button
    class="upload-now-button"
    :disabled="!canUploadNow"
    @click="handleUploadNow"
    :title="getTooltip()"
  >
    ⬆️
  </button>
</template>

<script setup>
const props = defineProps({
  file: { type: Object, required: true }
});

const emit = defineEmits(['upload-now']);

const canUploadNow = computed(() => {
  return props.file.status === 'ready';
});

const getTooltip = () => {
  if (props.file.status === 'ready') return 'Upload this file now';
  if (props.file.status === 'uploading') return 'Uploading...';
  if (props.file.status === 'completed') return 'Already uploaded';
  if (props.file.status === 'skipped') return 'Duplicate file';
  return 'Cannot upload';
};

const handleUploadNow = () => {
  emit('upload-now', props.file);
};
</script>

<style scoped>
.upload-now-button {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.upload-now-button:hover:not(:disabled) {
  transform: scale(1.2);
}

.upload-now-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
```

### Upload Logic

```javascript
// useImmediateUpload.js
export function useImmediateUpload() {
  const uploadSingleFile = async (file) => {
    try {
      // Update status
      file.status = 'uploading';

      console.log(`[IMMEDIATE] Uploading: ${file.fileName}`);

      // 1. Calculate hash if not already done
      if (!file.hash) {
        file.hash = await calculateFileHash(file);
      }

      // 2. Check if file already exists in storage
      const exists = await checkFileExists(file.hash);
      if (exists) {
        file.status = 'skipped';
        await createMetadataRecord(file);
        console.log(`[IMMEDIATE] Skipped (duplicate): ${file.fileName}`);
        return { success: true, skipped: true };
      }

      // 3. Upload to Firebase Storage
      await uploadToStorage(file);

      // 4. Create metadata record
      await createMetadataRecord(file);

      // 5. Update status
      file.status = 'completed';

      console.log(`[IMMEDIATE] Success: ${file.fileName}`);
      return { success: true };

    } catch (error) {
      file.status = 'error';
      file.error = error.message;

      console.error(`[IMMEDIATE] Failed: ${file.fileName}`, error);
      return { success: false, error };
    }
  };

  return { uploadSingleFile };
}
```

### Use Cases

1. **Critical Document:** User needs to upload a contract immediately for review
2. **Testing:** User wants to verify upload process works before committing full batch
3. **Priority Files:** Upload important files first while continuing to queue others

---

## Implementation Tasks

### Task Checklist

#### 2.1 Cancel Action
- [ ] Create `CancelButton.vue` component
- [ ] Implement cancel click handler
- [ ] Add crossed-out row styling
- [ ] Disable action buttons in cancelled state
- [ ] Update footer counts on cancel
- [ ] Add unit tests for cancel logic

#### 2.2 Undo Action
- [ ] Implement undo click handler
- [ ] Restore previous status correctly
- [ ] Re-enable action buttons
- [ ] Update footer counts on undo
- [ ] Add unit tests for undo logic

#### 2.3 Duplicate Promotion
- [ ] Create `findDuplicates()` helper function
- [ ] Implement `promoteDuplicate()` algorithm
- [ ] Sort duplicates by sourceLastModified
- [ ] Move promoted file to correct position
- [ ] Handle edge cases (no duplicates, all cancelled)
- [ ] Add unit tests for promotion logic

#### 2.4 Immediate Upload
- [ ] Create `UploadNowButton.vue` component
- [ ] Create `useImmediateUpload.js` composable
- [ ] Implement single file upload logic
- [ ] Handle upload success/failure
- [ ] Update footer counts during upload
- [ ] Respect pause state (queue if paused)
- [ ] Add loading indicator during upload
- [ ] Add unit tests for upload logic

#### 2.5 Integration
- [ ] Add action buttons to table row
- [ ] Connect buttons to upload queue state
- [ ] Ensure footer updates reactively
- [ ] Test with various file states
- [ ] Test with duplicates
- [ ] Verify no race conditions

---

## Testing Requirements

### Unit Tests

```javascript
// useFileActions.spec.js
describe('File Actions', () => {
  describe('Cancel', () => {
    it('sets file status to cancelled', () => {});
    it('saves previous status for undo', () => {});
    it('disables action buttons', () => {});
    it('updates footer counts', () => {});
    it('promotes duplicate when cancelling original', () => {});
  });

  describe('Undo', () => {
    it('restores previous status', () => {});
    it('re-enables action buttons', () => {});
    it('updates footer counts', () => {});
  });

  describe('Duplicate Promotion', () => {
    it('finds duplicates by hash', () => {});
    it('selects oldest duplicate by modified date', () => {});
    it('promotes duplicate to ready status', () => {});
    it('moves promoted file after cancelled', () => {});
    it('handles no duplicates gracefully', () => {});
  });

  describe('Immediate Upload', () => {
    it('uploads file immediately', () => {});
    it('updates status during upload', () => {});
    it('handles upload success', () => {});
    it('handles upload failure', () => {});
    it('respects pause state', () => {});
  });
});
```

### Component Tests

```javascript
describe('CancelButton', () => {
  it('renders cancel icon when not cancelled', () => {});
  it('renders undo icon when cancelled', () => {});
  it('emits cancel event on click', () => {});
  it('emits undo event when cancelled', () => {});
  it('disables during upload', () => {});
});

describe('UploadNowButton', () => {
  it('renders upload icon', () => {});
  it('emits upload-now event on click', () => {});
  it('disables when not ready', () => {});
  it('shows correct tooltip for each state', () => {});
});
```

### Integration Tests

```javascript
describe('Action Integration', () => {
  it('cancel + undo restores original state', () => {});
  it('cancel original promotes duplicate', () => {});
  it('upload now works during batch upload', () => {});
  it('multiple immediate uploads queue correctly', () => {});
});
```

### Manual Testing Scenarios

1. **Cancel Flow:**
   - Cancel a ready file → verify visual state
   - Undo cancellation → verify restoration
   - Cancel during upload → verify disabled

2. **Duplicate Promotion:**
   - Cancel original with 3 duplicates → verify oldest promoted
   - Cancel promoted duplicate → verify next oldest promoted
   - Cancel when all duplicates cancelled → no promotion

3. **Immediate Upload:**
   - Upload single file immediately → verify success
   - Upload multiple files via Upload Now → verify queue
   - Upload during paused state → verify queued for resume
   - Upload fails → verify error state

---

## Success Criteria

### Functional Requirements
- [x] Cancel button changes row to crossed-out state
- [x] Undo button restores row to original state
- [x] Duplicate promotion works correctly
- [x] Upload Now uploads single file immediately
- [x] Footer counts update accurately for all actions
- [x] Action buttons disable appropriately based on state
- [x] Cancelled files excluded from batch upload

### Performance Requirements
- [x] Action buttons respond instantly (<50ms)
- [x] Immediate upload starts within 200ms
- [x] No frame drops during state changes
- [x] Memory usage unchanged

### Visual Requirements
- [x] Cancelled row styling clear and intuitive
- [x] Button icons recognizable and appropriate
- [x] Hover states provide visual feedback
- [x] Disabled states clearly indicated
- [x] Animations smooth (if any)

---

## Dependencies

### Internal Dependencies
- Phase 1: Virtual Upload Queue (table structure)
- `useUploadLogger.js` - For logging actions
- `useFileMetadata.js` - For metadata creation
- `fileHashWorker.js` - For hash calculation

### External Dependencies
- Firebase Storage API
- Firebase Firestore API

---

## Performance Benchmarks

**Action Response Times:**
| Action | Target | Actual |
|--------|--------|--------|
| Cancel Click | <50ms | _TBD_ |
| Undo Click | <50ms | _TBD_ |
| Upload Now Initiation | <200ms | _TBD_ |
| Duplicate Promotion | <100ms | _TBD_ |

**Performance Logging:**
```javascript
console.log('[PERFORMANCE] Phase 2 - Cancel action: Xms');
console.log('[PERFORMANCE] Phase 2 - Duplicate promotion: Xms');
console.log('[PERFORMANCE] Phase 2 - Immediate upload start: Xms');
```

---

## Known Issues / Risks

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition during immediate upload | Low | Medium | Use upload queue with locking |
| Duplicate promotion incorrect order | Low | High | Thorough testing with edge cases |
| Undo breaks after multiple cancels | Low | Medium | Track full state history |

### UX Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cancelled rows confusing | Low | Medium | Clear visual differentiation |
| Duplicate promotion not noticeable | Medium | Low | Add notification/animation |
| Upload Now not discoverable | Low | Low | Tooltip on hover |

---

## Next Phase Preview

**Phase 3:** Duplicate Management (grouping, "Use this file" swapping)
- Visual grouping of duplicates below originals
- "Use this file" button to swap original/duplicate
- Indentation and visual hierarchy

This phase builds on Phase 2's cancel/undo foundation.

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
