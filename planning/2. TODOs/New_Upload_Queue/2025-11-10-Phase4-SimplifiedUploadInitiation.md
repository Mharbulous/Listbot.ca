# Phase 4: Simplified Upload Initiation - Three-Button System

**Phase:** 4 of 8
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 2-3 days
**Dependencies:** Phase 1 (Virtual Upload Queue)

---

## Overview

Remove the folder options modal and streamline upload initiation with three distinct buttons that directly start file queueing without blocking dialogs.

**Goal:** Remove folder options modal, streamline upload initiation
**Deliverable:** Direct upload actions with no blocking dialogs
**User Impact:** Faster workflow, fewer clicks (4+ clicks → 2 clicks)

---

## Current vs. New Flow

### Current Flow (Old)
```
User Action:          Drag folder → Wait for modal → Select option → Click Continue
User Clicks:          1 drop + 1 radio + 1 button = 3 actions
Time to Queue:        ~3-5 seconds
Blocking:             Yes (modal blocks interaction)
```

### New Flow
```
User Action:          Click "Upload Folder + Subfolders" → Queue instantly
User Clicks:          1 button = 1 action
Time to Queue:        <500ms
Blocking:             No (non-blocking progress indicator)
```

---

## Features

### 4.1 Three-Button Upload System
### 4.2 Remove Folder Options Modal
### 4.3 Non-Blocking Queue Progress
### 4.4 Simplified Drag-and-Drop

---

## 4.1 Three-Button Upload System

### Button Layout

**New UI:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Drag and drop files or folders here, or:                      │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐│
│  │ Upload Files │  │ Upload Folder │  │ Upload Folder +      ││
│  │              │  │               │  │ Subfolders           ││
│  └──────────────┘  └───────────────┘  └──────────────────────┘│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Button Specifications

#### Button 1: Upload Files
**Icon:** 📄 (document)
**Label:** "Upload Files"
**Behavior:**
- Opens native file picker with multi-select enabled
- Allows selection of individual files from any location
- Files can be from different folders
- Immediately queues selected files (no modal)

**HTML Implementation:**
```html
<input
  ref="fileInput"
  type="file"
  multiple
  accept="*/*"
  style="display: none"
  @change="handleFileSelect"
/>
<button @click="$refs.fileInput.click()">
  📄 Upload Files
</button>
```

#### Button 2: Upload Folder
**Icon:** 📁 (folder)
**Label:** "Upload Folder"
**Behavior:**
- Opens native folder picker
- Processes **root folder only** (no recursion)
- webkitdirectory attribute, but filters out subfolders
- Immediately queues root-level files (no modal)

**HTML Implementation:**
```html
<input
  ref="folderInput"
  type="file"
  webkitdirectory
  directory
  style="display: none"
  @change="handleFolderSelect"
/>
<button @click="$refs.folderInput.click()">
  📁 Upload Folder
</button>
```

**Processing Logic:**
```javascript
const handleFolderSelect = (event) => {
  const allFiles = Array.from(event.target.files);

  // Filter to root folder only
  const rootPath = allFiles[0].webkitRelativePath.split('/')[0];
  const rootFiles = allFiles.filter(file => {
    const path = file.webkitRelativePath;
    const parts = path.split('/');
    // Only include files directly in root (path depth = 2: folder/file.ext)
    return parts.length === 2 && parts[0] === rootPath;
  });

  console.log(`[FOLDER] Root only: ${rootFiles.length} files from ${rootPath}`);

  // Queue immediately
  addFilesToQueue(rootFiles);
};
```

#### Button 3: Upload Folder + Subfolders
**Icon:** 📂 (open folder)
**Label:** "Upload Folder + Subfolders"
**Behavior:**
- Opens native folder picker
- Processes **all nested subfolders recursively**
- Standard webkitdirectory behavior (no filtering)
- Immediately queues all files (no modal)

**HTML Implementation:**
```html
<input
  ref="folderRecursiveInput"
  type="file"
  webkitdirectory
  directory
  style="display: none"
  @change="handleFolderRecursiveSelect"
/>
<button @click="$refs.folderRecursiveInput.click()">
  📂 Upload Folder + Subfolders
</button>
```

**Processing Logic:**
```javascript
const handleFolderRecursiveSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  const folderName = allFiles[0].webkitRelativePath.split('/')[0];

  console.log(`[FOLDER+] Recursive: ${allFiles.length} files from ${folderName}`);

  // Queue all files immediately
  addFilesToQueue(allFiles);
};
```

### Component Implementation

```vue
<!-- UploadButtons.vue -->
<template>
  <div class="upload-buttons-container">
    <!-- Hidden file inputs -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="*/*"
      style="display: none"
      @change="handleFileSelect"
    />
    <input
      ref="folderInput"
      type="file"
      webkitdirectory
      directory
      style="display: none"
      @change="handleFolderSelect"
    />
    <input
      ref="folderRecursiveInput"
      type="file"
      webkitdirectory
      directory
      style="display: none"
      @change="handleFolderRecursiveSelect"
    />

    <!-- Visible buttons -->
    <div class="button-row">
      <button class="upload-btn files-btn" @click="triggerFileSelect">
        <span class="btn-icon">📄</span>
        <span class="btn-label">Upload Files</span>
      </button>

      <button class="upload-btn folder-btn" @click="triggerFolderSelect">
        <span class="btn-icon">📁</span>
        <span class="btn-label">Upload Folder</span>
      </button>

      <button class="upload-btn folder-recursive-btn" @click="triggerFolderRecursiveSelect">
        <span class="btn-icon">📂</span>
        <span class="btn-label">Upload Folder + Subfolders</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['files-selected', 'folder-selected', 'folder-recursive-selected']);

const fileInput = ref(null);
const folderInput = ref(null);
const folderRecursiveInput = ref(null);

const triggerFileSelect = () => fileInput.value.click();
const triggerFolderSelect = () => folderInput.value.click();
const triggerFolderRecursiveSelect = () => folderRecursiveInput.value.click();

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  emit('files-selected', files);
  event.target.value = ''; // Reset input
};

const handleFolderSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  const rootFiles = filterRootOnly(allFiles);
  emit('folder-selected', rootFiles);
  event.target.value = '';
};

const handleFolderRecursiveSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  emit('folder-recursive-selected', allFiles);
  event.target.value = '';
};

const filterRootOnly = (files) => {
  if (files.length === 0) return [];
  const rootPath = files[0].webkitRelativePath.split('/')[0];
  return files.filter(file => {
    const parts = file.webkitRelativePath.split('/');
    return parts.length === 2 && parts[0] === rootPath;
  });
};
</script>

<style scoped>
.upload-buttons-container {
  padding: 40px;
  text-align: center;
}

.button-row {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  border: 2px solid #2196F3;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background-color: #E3F2FD;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-icon {
  font-size: 48px;
}

.btn-label {
  font-size: 16px;
  font-weight: 600;
  color: #1976D2;
}

.folder-recursive-btn {
  border-color: #4CAF50;
}

.folder-recursive-btn .btn-label {
  color: #2E7D32;
}

.folder-recursive-btn:hover {
  background-color: #E8F5E9;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}
</style>
```

---

## 4.2 Remove Folder Options Modal

### Changes Required

**Files to Modify:**
- `FileUpload.vue` - Remove modal rendering
- `FolderOptionsDialog.vue` - Mark as deprecated
- `useFolderOptions.js` - Remove or simplify

**Logic to Remove:**
```javascript
// DELETE: Folder analysis modal
const showFolderOptions = ref(false);
const subfolderCount = ref(0);
const mainFolderAnalysis = ref({});
const allFilesAnalysis = ref({});

// DELETE: Modal confirmation
const confirmFolderOptions = () => { /* ... */ };
```

**New Simplified Logic:**
```javascript
// Direct queueing, no modal
const handleFolderUpload = async (files, recursive = false) => {
  console.log(`[UPLOAD] ${recursive ? 'Recursive' : 'Root only'}: ${files.length} files`);
  await addFilesToQueue(files);
};
```

---

## 4.3 Non-Blocking Queue Progress

### Progress Indicator Design

**For large batches (>500 files), show non-blocking progress:**

```
┌────────────────────────────────────────────────────────────┐
│  Queueing files... (324/720 analyzed)                      │
│  ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░                          │
└────────────────────────────────────────────────────────────┘
```

**Positioned above table, does not block interaction**

### Component Implementation

```vue
<!-- QueueProgressIndicator.vue -->
<template>
  <div v-if="isQueueing" class="queue-progress">
    <div class="progress-text">
      Queueing files... ({{ processed }}/{{ total }} analyzed)
    </div>
    <div class="progress-bar-container">
      <div
        class="progress-bar-fill"
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isQueueing: { type: Boolean, default: false },
  processed: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const progressPercentage = computed(() => {
  return props.total > 0 ? (props.processed / props.total) * 100 : 0;
});
</script>

<style scoped>
.queue-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #E3F2FD;
  border: 1px solid #2196F3;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #1976D2;
  margin-bottom: 8px;
}

.progress-bar-container {
  height: 8px;
  background-color: #BBDEFB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #2196F3;
  transition: width 0.3s ease;
}
</style>
```

### Queue Processing Logic

```javascript
// Batch queue loading with progress updates
const addFilesToQueue = async (files) => {
  const BATCH_SIZE = 100;
  const queueProgress = ref({
    isQueueing: true,
    processed: 0,
    total: files.length
  });

  // Process in batches
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    // Process batch
    await processBatch(batch);

    // Update progress
    queueProgress.value.processed = Math.min(i + BATCH_SIZE, files.length);

    // Allow UI to update
    await nextTick();
  }

  queueProgress.value.isQueueing = false;
  console.log(`[QUEUE] Complete: ${files.length} files queued`);
};
```

---

## 4.4 Simplified Drag-and-Drop

### Folder Detection & Inline Choice

**When folder structure detected:**

```
┌────────────────────────────────────────────────────────────┐
│  Folder dropped: "My Documents"                            │
│                                                             │
│  ○ Upload this folder only (42 files)                     │
│  ● Upload folder + subfolders (178 files)  [Continue]     │
└────────────────────────────────────────────────────────────┘
```

**Non-modal, appears inline above table**

### Implementation

```vue
<!-- FolderDropChoice.vue -->
<template>
  <div v-if="visible" class="folder-choice-panel">
    <div class="choice-header">
      <span class="folder-icon">📁</span>
      <span>Folder dropped: "{{ folderName }}"</span>
    </div>

    <div class="choice-options">
      <label class="choice-option">
        <input
          type="radio"
          name="folder-mode"
          value="root"
          v-model="selectedMode"
        />
        Upload this folder only ({{ rootFileCount }} files)
      </label>

      <label class="choice-option">
        <input
          type="radio"
          name="folder-mode"
          value="recursive"
          v-model="selectedMode"
          checked
        />
        Upload folder + subfolders ({{ totalFileCount }} files)
      </label>
    </div>

    <div class="choice-actions">
      <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
      <button class="btn-continue" @click="handleContinue">Continue</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  folderName: { type: String, required: true },
  rootFileCount: { type: Number, required: true },
  totalFileCount: { type: Number, required: true },
  allFiles: { type: Array, required: true }
});

const emit = defineEmits(['continue', 'cancel']);

const selectedMode = ref('recursive'); // Default to recursive

const handleContinue = () => {
  emit('continue', {
    mode: selectedMode.value,
    files: selectedMode.value === 'root'
      ? filterRootOnly(props.allFiles)
      : props.allFiles
  });
};

const filterRootOnly = (files) => {
  const rootPath = files[0].webkitRelativePath.split('/')[0];
  return files.filter(file => {
    const parts = file.webkitRelativePath.split('/');
    return parts.length === 2 && parts[0] === rootPath;
  });
};
</script>

<style scoped>
.folder-choice-panel {
  background-color: #FFF9C4;
  border: 2px solid #FBC02D;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.choice-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.choice-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.choice-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-continue {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background-color: #E0E0E0;
  color: #424242;
}

.btn-continue {
  background-color: #4CAF50;
  color: white;
}
</style>
```

---

## 4.5 Remove Time Estimate from UI

### Console Logging Only

**Performance metrics logged to console:**

```javascript
console.log('[PERFORMANCE] Folder analysis: 123ms');
console.log('[PERFORMANCE] Estimated queue time: 1.6s');
console.log('[PERFORMANCE] Root files: 42, Recursive: 178');
```

**No user-facing time estimate displayed**

**Rationale:**
- Users see instant queue population instead
- Focus on speed rather than prediction
- Metrics still tracked for performance monitoring

---

## Implementation Tasks

### Task Checklist

#### 4.1 Three-Button System
- [ ] Create `UploadButtons.vue` component
- [ ] Implement file input with multi-select
- [ ] Implement folder input (root only)
- [ ] Implement folder recursive input
- [ ] Add root-only filtering logic
- [ ] Style buttons to match design
- [ ] Add hover states and transitions
- [ ] Test file selection workflows

#### 4.2 Remove Modal
- [ ] Remove `FolderOptionsDialog.vue` import
- [ ] Remove modal state variables
- [ ] Remove modal confirmation logic
- [ ] Simplify `useFolderOptions.js`
- [ ] Test that removal doesn't break anything

#### 4.3 Queue Progress
- [ ] Create `QueueProgressIndicator.vue`
- [ ] Implement batch processing with progress
- [ ] Add progress bar animation
- [ ] Position above table (non-blocking)
- [ ] Auto-hide when complete
- [ ] Test with large file sets

#### 4.4 Drag-and-Drop
- [ ] Create `FolderDropChoice.vue`
- [ ] Detect folder structure in drop
- [ ] Show inline choice panel
- [ ] Pre-select "Include subfolders"
- [ ] Handle continue/cancel actions
- [ ] Test drag-and-drop workflows

#### 4.5 Remove Time Estimate
- [ ] Remove time estimate UI components
- [ ] Keep calculation for console logging
- [ ] Update documentation
- [ ] Test performance logging

---

## Testing Requirements

### Unit Tests
```javascript
describe('Three-Button System', () => {
  it('files button opens file picker', () => {});
  it('folder button opens folder picker', () => {});
  it('folder recursive button opens folder picker', () => {});
  it('filters root-only files correctly', () => {});
  it('handles empty selection gracefully', () => {});
});
```

### Integration Tests
```javascript
describe('Upload Initiation', () => {
  it('files button queues selected files', () => {});
  it('folder button queues root files only', () => {});
  it('folder recursive queues all files', () => {});
  it('drag folder shows inline choice', () => {});
  it('queue progress shows for large batches', () => {});
});
```

### Manual Testing
1. Click each button, select files/folders
2. Verify correct files queued
3. Drag folder, verify inline choice appears
4. Test with various folder structures
5. Verify no modals block interaction

---

## Success Criteria

- [x] Three buttons display and work correctly
- [x] No folder options modal appears
- [x] Files queue immediately after selection
- [x] Queue progress shows for large batches (>500 files)
- [x] Drag-and-drop shows inline choice (not modal)
- [x] Time estimates logged to console only
- [x] Workflow is 2 clicks (down from 4+)

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
