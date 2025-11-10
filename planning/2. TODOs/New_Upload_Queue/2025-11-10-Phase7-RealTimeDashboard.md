# Phase 7: Real-Time Dashboard - Queue & Upload Progress

**Phase:** 7 of 8
**Status:** Not Started
**Priority:** High
**Estimated Duration:** 3-4 days
**Dependencies:** Phases 1-6

---

## Overview

Unified progress display for both queueing and uploading operations with real-time metrics and non-blocking design.

**Goal:** Live dashboard showing current operation status
**Deliverable:** Persistent header with progress, metrics, time remaining
**User Impact:** Always know what's happening and how long it will take

---

## Features

### 7.1 Dashboard Header Component
### 7.2 Real-Time Metrics Calculation
### 7.3 Four Dashboard States
### 7.4 Non-Blocking Design

---

## 7.1 Dashboard Header Component

### Visual Design

**Queueing State:**
```
┌────────────────────────────────────────────────────────────────┐
│  Queueing files... (45% complete)                              │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░                    │
│  324/720 files • 5.2 files/s • 1m 23s remaining                │
│  [Cancel Queue]                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Uploading State:**
```
┌────────────────────────────────────────────────────────────────┐
│  Uploading... (62% complete)                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░                     │
│  446/720 files • 2.3 MB/s • 3m 45s remaining                   │
│  [Pause Upload]                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Component Structure

```vue
<!-- UploadDashboard.vue -->
<template>
  <div v-if="visible" class="upload-dashboard" :class="dashboardState">
    <!-- Title & Progress Percentage -->
    <div class="dashboard-header">
      <span class="dashboard-title">{{ title }}</span>
      <span class="dashboard-percentage">({{ progressPercentage }}% complete)</span>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar-container">
      <div
        class="progress-bar-fill"
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>

    <!-- Metrics -->
    <div class="dashboard-metrics">
      <span class="metric-item">{{ currentCount }}/{{ totalCount }} files</span>
      <span class="metric-separator">•</span>
      <span class="metric-item">{{ speedMetric }}</span>
      <span class="metric-separator">•</span>
      <span class="metric-item">{{ timeRemaining }} remaining</span>
    </div>

    <!-- Action Button -->
    <div class="dashboard-action">
      <button @click="handleAction">{{ actionLabel }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  state: { type: String, required: true }, // 'queueing', 'uploading', 'paused', 'complete'
  currentCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  speed: { type: Number, default: 0 }, // files/s or MB/s
  estimatedTimeRemaining: { type: Number, default: 0 } // seconds
});

const emit = defineEmits(['action']);

const dashboardState = computed(() => `state-${props.state}`);

const title = computed(() => {
  const titles = {
    queueing: 'Queueing files...',
    uploading: 'Uploading...',
    paused: 'Upload paused',
    complete: 'Upload complete! ✓'
  };
  return titles[props.state] || '';
});

const progressPercentage = computed(() => {
  if (props.totalCount === 0) return 0;
  return Math.round((props.currentCount / props.totalCount) * 100);
});

const speedMetric = computed(() => {
  if (props.state === 'queueing') {
    return `${props.speed.toFixed(1)} files/s`;
  } else if (props.state === 'uploading') {
    return `${props.speed.toFixed(1)} MB/s`;
  }
  return '';
});

const timeRemaining = computed(() => {
  const seconds = props.estimatedTimeRemaining;
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${minutes}m ${secs}s`;
});

const actionLabel = computed(() => {
  const labels = {
    queueing: 'Cancel Queue',
    uploading: 'Pause Upload',
    paused: 'Resume Upload',
    complete: 'Clear Queue'
  };
  return labels[props.state] || '';
});

const handleAction = () => {
  emit('action', props.state);
};
</script>

<style scoped>
.upload-dashboard {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #E3F2FD;
  border: 2px solid #2196F3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.state-uploading {
  background-color: #E8F5E9;
  border-color: #4CAF50;
}

.state-paused {
  background-color: #FFF3E0;
  border-color: #FF9800;
}

.state-complete {
  background-color: #E8F5E9;
  border-color: #4CAF50;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dashboard-title {
  font-weight: 600;
  font-size: 16px;
}

.dashboard-percentage {
  font-weight: 600;
  color: #1976D2;
}

.progress-bar-container {
  height: 12px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #1976D2);
  transition: width 0.3s ease;
}

.state-uploading .progress-bar-fill {
  background: linear-gradient(90deg, #4CAF50, #2E7D32);
}

.dashboard-metrics {
  display: flex;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.metric-separator {
  color: #999;
}

.dashboard-action button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #1976D2;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
</style>
```

---

## 7.2 Real-Time Metrics Calculation

### Queueing Metrics

```javascript
// useQueueingMetrics.js
export function useQueueingMetrics() {
  const processHistory = ref([]);
  const HISTORY_SIZE = 10;

  const recordProgress = (processedCount, timestamp) => {
    processHistory.value.push({ count: processedCount, time: timestamp });

    // Keep only recent history
    if (processHistory.value.length > HISTORY_SIZE) {
      processHistory.value.shift();
    }
  };

  const calculateSpeed = () => {
    if (processHistory.value.length < 2) return 0;

    const first = processHistory.value[0];
    const last = processHistory.value[processHistory.value.length - 1];

    const filesDelta = last.count - first.count;
    const timeDelta = (last.time - first.time) / 1000; // to seconds

    return timeDelta > 0 ? filesDelta / timeDelta : 0;
  };

  const estimateTimeRemaining = (processed, total) => {
    const speed = calculateSpeed();
    if (speed === 0) return 0;

    const remaining = total - processed;
    return remaining / speed; // seconds
  };

  return { recordProgress, calculateSpeed, estimateTimeRemaining };
}
```

### Upload Metrics

```javascript
// useUploadMetrics.js
export function useUploadMetrics() {
  const uploadHistory = ref([]);
  const HISTORY_SIZE = 5;

  const recordUpload = (bytesUploaded, timestamp) => {
    uploadHistory.value.push({ bytes: bytesUploaded, time: timestamp });

    if (uploadHistory.value.length > HISTORY_SIZE) {
      uploadHistory.value.shift();
    }
  };

  const calculateSpeed = () => {
    if (uploadHistory.value.length < 2) return 0;

    const first = uploadHistory.value[0];
    const last = uploadHistory.value[uploadHistory.value.length - 1];

    const bytesDelta = last.bytes - first.bytes;
    const timeDelta = (last.time - first.time) / 1000;

    const bytesPerSecond = timeDelta > 0 ? bytesDelta / timeDelta : 0;
    return bytesPerSecond / (1024 * 1024); // MB/s
  };

  const estimateTimeRemaining = (uploadedBytes, totalBytes) => {
    const speed = calculateSpeed();
    if (speed === 0) return 0;

    const remainingBytes = totalBytes - uploadedBytes;
    const remainingMB = remainingBytes / (1024 * 1024);
    return remainingMB / speed; // seconds
  };

  return { recordUpload, calculateSpeed, estimateTimeRemaining };
}
```

### Update Frequency

```javascript
// Update metrics every 500ms
const updateInterval = setInterval(() => {
  if (isQueueing.value) {
    queueMetrics.recordProgress(processedFiles.value, Date.now());
  } else if (isUploading.value) {
    uploadMetrics.recordUpload(totalBytesUploaded.value, Date.now());
  }
}, 500);
```

---

## 7.3 Four Dashboard States

### State 1: Queueing
**When:** During file analysis and hashing
**Display:**
```
Queueing files... (45% complete)
━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░
324/720 files • 5.2 files/s • 1m 23s remaining
[Cancel Queue]
```

### State 2: Uploading
**When:** During active file upload
**Display:**
```
Uploading... (62% complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░
446/720 files • 2.3 MB/s • 3m 45s remaining
[Pause Upload]
```

### State 3: Paused
**When:** User pauses upload
**Display:**
```
Upload paused (62% complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░
446/720 files uploaded • 274 remaining
[Resume Upload]
```

### State 4: Complete
**When:** All files processed
**Display:**
```
Upload complete! ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
720/720 files • 715 uploaded, 5 duplicates skipped
[Clear Queue]
```

**Auto-hide after 5 seconds**

---

## 7.4 Non-Blocking Design

### Key Principles

1. **Dashboard does not block interaction:**
   - Sticky positioning at top
   - User can scroll table during operations
   - Can sort, cancel files while uploading

2. **Collapsible (optional):**
   - Minimize button to collapse dashboard
   - Restore with click or auto-expand on important events

3. **Always visible status:**
   - User never loses context
   - Clear what's happening at all times

### Implementation

```vue
<template>
  <div class="upload-page">
    <!-- Dashboard: Sticky, non-blocking -->
    <UploadDashboard
      :visible="showDashboard"
      :state="dashboardState"
      :current-count="currentCount"
      :total-count="totalCount"
      :speed="speed"
      :estimated-time-remaining="timeRemaining"
      @action="handleDashboardAction"
    />

    <!-- Table: Always interactive -->
    <UploadTable
      :files="uploadQueue"
      @cancel="handleCancelFile"
      @sort="handleSort"
    />
  </div>
</template>
```

---

## Implementation Tasks

### Task Checklist

#### 7.1 Dashboard Component
- [ ] Create `UploadDashboard.vue`
- [ ] Implement four state displays
- [ ] Add progress bar animation
- [ ] Style for each state (colors, icons)
- [ ] Add action buttons
- [ ] Test state transitions

#### 7.2 Metrics Calculation
- [ ] Create `useQueueingMetrics.js`
- [ ] Create `useUploadMetrics.js`
- [ ] Implement rolling average for speed
- [ ] Implement time remaining estimation
- [ ] Add metric update interval (500ms)
- [ ] Test accuracy of estimates

#### 7.3 State Management
- [ ] Implement state transitions (queueing → uploading → complete)
- [ ] Handle pause/resume state changes
- [ ] Auto-hide on complete after 5s
- [ ] Test all state transitions

#### 7.4 Integration
- [ ] Integrate dashboard with upload orchestration
- [ ] Connect metrics to real upload progress
- [ ] Ensure non-blocking behavior
- [ ] Test user interaction during operations

---

## Testing Requirements

### Unit Tests
```javascript
describe('Dashboard States', () => {
  it('displays queueing state correctly', () => {});
  it('displays uploading state correctly', () => {});
  it('displays paused state correctly', () => {});
  it('displays complete state correctly', () => {});
  it('auto-hides after complete + 5s', () => {});
});

describe('Metrics Calculation', () => {
  it('calculates queueing speed (files/s)', () => {});
  it('calculates upload speed (MB/s)', () => {});
  it('estimates time remaining accurately', () => {});
  it('handles zero speed gracefully', () => {});
});
```

### Manual Testing
1. Start queueing, verify dashboard appears
2. Start upload, verify state transitions
3. Pause upload, verify state change
4. Resume upload, verify continuation
5. Complete upload, verify auto-hide

---

## Success Criteria

- [x] Dashboard shows during queueing operations
- [x] Dashboard shows during upload operations
- [x] Real-time metrics update smoothly (500ms interval)
- [x] Progress bar accurately reflects completion
- [x] Non-blocking, user can interact with table
- [x] Auto-hides on completion after 5 seconds
- [x] State transitions work correctly

---

**Phase Status:** ⬜ Not Started
**Last Updated:** 2025-11-10
**Assignee:** TBD
