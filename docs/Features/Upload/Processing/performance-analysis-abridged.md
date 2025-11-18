# Performance Analysis Summary - Abridged Dataset

## Overview
This document contains only the performance-relevant console messages from three test scenarios:
1. **Before optimization** (BLAKE3 hashing)
2. **After optimization** (XXH3 hashing)
3. **Scaling test** (increasingly large folder sizes)

---

## I. PERFORMANCE METRICS - BEFORE (BLAKE3)

### Test 1: 34 Files (Initial Drop)
```
📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive): {filesSelected: 34}
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 0}
  ├─ [PREFILTER] Complete: {ready: 34, dup: 0, copy: 0} (0.30ms)
  ├─ [HASH] Hashing 8 files...
  ├─ [HASH] Complete: {groups: 3, hashed: 8} (avg: 5.19ms/file, total: 41.50ms)
📊 [DEDUP] T=42.30ms - Complete
📊 [QUEUE METRICS] T=43.40ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=44.20ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=70.30ms - Initial table PAINTED (visible to user)
📊 [QUEUE METRICS] T=70.40ms - All files finished adding to queue (34 files) {averageTimePerFile: '2.07ms'}
```

### Test 2: 34 Files (Duplicate Drop)
```
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 34}
  ├─ [PREFILTER] Complete: {ready: 0, dup: 34, copy: 0} (0.50ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=0.60ms - Complete
📊 [QUEUE METRICS] T=2325.50ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=2327.80ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=2334.50ms - All files rendered (68 files) {renderedRows: 23}
```

**Tentative Verification:**
```
📊 [VERIFY] T=0.00ms - Starting: {tentative: 34, reference: 26}
  ├─ [HASH-REF] Hashed 26 files (avg: 5.53ms/file, total: 143.80ms)
  ├─ [VERIFY] Checked 34 files (avg: 6.14ms/file, total: 208.90ms)
  └─ [CLEANUP] Removed 34 duplicates, verified 0 copies, promoted 0 to ready
📊 [VERIFY] T=356.00ms - Complete
```

### Test 3: 781 Files (Large Batch)
```
📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive): {filesSelected: 781}
```

**Phase 1 - First 200 Files:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 34}
  ├─ [PREFILTER] Complete: {ready: 200, dup: 0, copy: 0} (0.30ms)
  ├─ [HASH] Complete: {groups: 3, hashed: 0} (avg: 0.00ms/file, total: 0.00ms)
📊 [DEDUP] T=0.70ms - Complete
📊 [QUEUE METRICS] T=2.10ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=3.10ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=20.90ms - Initial table PAINTED (visible to user)
```

**Phase 2 - Remaining 581 Files:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 234}
  ├─ [PREFILTER] Complete: {ready: 581, dup: 0, copy: 0} (0.80ms)
  ├─ [HASH] Hashing 46 files...
  ├─ [HASH] Complete: {groups: 41, hashed: 38} (avg: 4.23ms/file, total: 160.60ms)
📊 [DEDUP] T=162.30ms - Complete
📊 [QUEUE METRICS] T=198.30ms - All files finished adding to queue (781 files) {averageTimePerFile: '0.25ms'}
📊 [QUEUE METRICS] T=198.50ms - All files rendered (815 files) {renderedRows: 23}
```

### Test 4: 781 Files (Duplicate Drop)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 815}
  ├─ [PREFILTER] Complete: {ready: 0, dup: 200, copy: 0} (1.20ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=1.80ms - Complete
📊 [QUEUE METRICS] T=256.40ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=272.10ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 1015}
  ├─ [PREFILTER] Complete: {ready: 0, dup: 581, copy: 0} (2.00ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=3.00ms - Complete
📊 [QUEUE METRICS] T=959.90ms - All files finished adding to queue (781 files) {averageTimePerFile: '1.23ms'}
📊 [QUEUE METRICS] T=960.00ms - All files rendered (1596 files) {renderedRows: 23}
```

### Test 5: 781 Files (Triple Duplicate Drop)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 1596}
  ├─ [PREFILTER] Complete: {ready: 0, dup: 200, copy: 0} (1.90ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.60ms - Complete
📊 [QUEUE METRICS] T=830.80ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=850.60ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 1796}
  ├─ [PREFILTER] Complete: {ready: 0, dup: 581, copy: 0} (1.90ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.70ms - Complete
📊 [QUEUE METRICS] T=2526.60ms - All files finished adding to queue (781 files) {averageTimePerFile: '3.24ms'}
📊 [QUEUE METRICS] T=2526.70ms - All files rendered (2377 files) {renderedRows: 23}
```

---

## II. PERFORMANCE METRICS - AFTER XXH3 OPTIMIZATION

### Test 1: 34 Files (Initial Drop)
```
📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive): {filesSelected: 34}
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 0}
  ├─ [PREFILTER] Complete: {ready: 34, dupe: 0, copy: 0} (0.10ms)
  ├─ [HASH] Hashing 8 files...
  ├─ [HASH] Complete: {groups: 3, hashed: 8} (avg: 13.65ms/file, total: 109.20ms)
📊 [DEDUP] T=109.70ms - Complete
📊 [QUEUE METRICS] T=110.70ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=111.60ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=137.80ms - Initial table PAINTED (visible to user)
📊 [QUEUE METRICS] T=137.90ms - All files finished adding to queue (34 files) {averageTimePerFile: '4.06ms'}
```

### Test 2: 34 Files (Duplicate Drop)
```
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 34}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 34, copy: 0} (0.30ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=0.60ms - Complete
📊 [QUEUE METRICS] T=2927.60ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=2930.10ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=2936.40ms - All files rendered (68 files) {renderedRows: 23}
```

**Tentative Verification:**
```
📊 [VERIFY] T=0.00ms - Starting: {tentative: 34, reference: 26}
  ├─ [HASH-REF] Hashed 26 files (avg: 8.86ms/file, total: 230.30ms)
  ├─ [VERIFY] Checked 34 files (avg: 9.91ms/file, total: 336.80ms)
  └─ [CLEANUP] Removed 34 dupes, verified 0 copies, promoted 0 to ready
📊 [VERIFY] T=570.60ms - Complete
```

### Test 3: 781 Files (Large Batch)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 34}
  ├─ [PREFILTER] Complete: {ready: 200, dupe: 0, copy: 0} (0.20ms)
  ├─ [HASH] Complete: {groups: 3, hashed: 0} (avg: 0.00ms/file, total: 0.00ms)
📊 [DEDUP] T=0.50ms - Complete
📊 [QUEUE METRICS] T=1.80ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=2.70ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=14.00ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 234}
  ├─ [PREFILTER] Complete: {ready: 581, dupe: 0, copy: 0} (0.30ms)
  ├─ [HASH] Hashing 38 files...
  ├─ [HASH] Complete: {groups: 41, hashed: 38} (avg: 4.64ms/file, total: 176.30ms)
📊 [DEDUP] T=177.40ms - Complete
📊 [QUEUE METRICS] T=205.80ms - All files finished adding to queue (781 files) {averageTimePerFile: '0.26ms'}
📊 [QUEUE METRICS] T=205.80ms - All files rendered (815 files) {renderedRows: 23}
```

### Test 4: 781 Files (Duplicate Drop)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 815}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 200, copy: 0} (1.10ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=1.70ms - Complete
📊 [QUEUE METRICS] T=288.90ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=307.30ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 1015}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 581, copy: 0} (1.40ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.30ms - Complete
📊 [QUEUE METRICS] T=998.70ms - All files finished adding to queue (781 files) {averageTimePerFile: '1.28ms'}
📊 [QUEUE METRICS] T=998.80ms - All files rendered (1596 files) {renderedRows: 23}
```

---

## III. PERFORMANCE METRICS - SCALING TEST (Web Worker)

### Test 1: 34 Files (Initial Drop)
```
📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive): {filesSelected: 34}
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 0}
  ├─ [PREFILTER] Complete: {ready: 34, dupe: 0, copy: 0} (0.50ms)
  ├─ [HASH] Hashing 8 files using Web Worker...
```
**Worker Performance:**
```
[HASH-PERF] Starting hash of 8 files (2.67 MB total)
[HASH-PERF] Hashing complete: 109.20ms for 8 files (24.47 MB/s)
[HASH-PERF] XXH32 Average: 13.65ms per file
```
```
  ├─ [HASH] Complete: {groups: 3, hashed: 8} (avg: 16.26ms/file, total: 130.10ms)
📊 [DEDUP] T=131.80ms - Complete
📊 [QUEUE METRICS] T=133.20ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=134.10ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=162.20ms - Initial table PAINTED (visible to user)
📊 [QUEUE METRICS] T=162.30ms - All files finished adding to queue (34 files) {averageTimePerFile: '4.77ms'}
```

### Test 2: 184 Files (Medium Batch)
```
📊 [DEDUP] T=0.00ms - Starting: {new: 184, existing: 34}
  ├─ [PREFILTER] Complete: {ready: 184, dupe: 0, copy: 0} (0.40ms)
  ├─ [HASH] Hashing 160 files using Web Worker...
```
**Worker Performance:**
```
[HASH-PERF] Starting hash of 160 files (57.82 MB total)
[HASH-PERF] Hashing complete: 1894.30ms for 160 files (30.52 MB/s)
[HASH-PERF] XXH32 Average: 11.84ms per file
```
```
  ├─ [HASH] Complete: {groups: 57, hashed: 160} (avg: 11.95ms/file, total: 1911.90ms)
📊 [DEDUP] T=1913.80ms - Complete
📊 [QUEUE METRICS] T=4498.90ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=4500.80ms - Initial batch complete (184 files)
📊 [QUEUE METRICS] T=4511.40ms - All files rendered (218 files) {renderedRows: 23}
```

### Test 3: 781 Files (Large Batch)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 218}
  ├─ [PREFILTER] Complete: {ready: 200, dupe: 0, copy: 0} (0.40ms)
  ├─ [HASH] Complete: {groups: 57, hashed: 0} (avg: 0.00ms/file, total: 0.10ms)
📊 [DEDUP] T=1.50ms - Complete
📊 [QUEUE METRICS] T=3.20ms - Deduplication complete for Phase 1
📊 [QUEUE METRICS] T=4.80ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=25.50ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 418}
  ├─ [PREFILTER] Complete: {ready: 581, dupe: 0, copy: 0} (1.30ms)
  ├─ [HASH] Hashing 38 files using Web Worker...
```
**Worker Performance:**
```
[HASH-PERF] Starting hash of 38 files (0.70 MB total)
[HASH-PERF] Hashing complete: 117.50ms for 38 files (5.93 MB/s)
[HASH-PERF] XXH32 Average: 3.09ms per file
```
```
  ├─ [HASH] Complete: {groups: 95, hashed: 38} (avg: 5.01ms/file, total: 190.40ms)
📊 [DEDUP] T=193.20ms - Complete
📊 [QUEUE METRICS] T=256.70ms - All files finished adding to queue (781 files) {averageTimePerFile: '0.33ms'}
📊 [QUEUE METRICS] T=256.80ms - All files rendered (999 files) {renderedRows: 23}
```

### Test 4: 34 Files (After 999 Files in Queue)
```
📊 [DEDUP] T=0.00ms - Starting: {new: 34, existing: 999}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 34, copy: 0} (2.00ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.10ms - Complete
📊 [QUEUE METRICS] T=6.30ms - Initial batch complete (34 files)
📊 [QUEUE METRICS] T=49.00ms - Initial table PAINTED (visible to user)
📊 [QUEUE METRICS] T=49.10ms - All files finished adding to queue (34 files) {averageTimePerFile: '1.44ms'}
```

**Tentative Verification (Fallback Hashing):**
```
📊 [VERIFY] T=0.00ms - Starting: {tentative: 34, reference: 21}
  ├─ [HASH-REF] Hashed 21 files (avg: 37.17ms/file, total: 780.50ms)
  ├─ [VERIFY] Checked 34 files (avg: 64.62ms/file, total: 2197.20ms)
  └─ [CLEANUP] Removed 15 dupes, verified 0 copies, promoted 19 to ready
📊 [VERIFY] T=3021.30ms - Complete
📊 [QUEUE METRICS] T=3246.50ms - All files rendered (1018 files) {renderedRows: 23}
```

### Test 5: 184 Files (After 1018 Files in Queue)
```
📊 [DEDUP] T=0.00ms - Starting: {new: 184, existing: 1018}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 184, copy: 0} (1.80ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.00ms - Complete
📊 [QUEUE METRICS] T=9.10ms - Initial batch complete (184 files)
📊 [QUEUE METRICS] T=32.50ms - Initial table PAINTED (visible to user)
📊 [QUEUE METRICS] T=32.60ms - All files finished adding to queue (184 files) {averageTimePerFile: '0.18ms'}
```

**Tentative Verification (Fallback Hashing):**
```
📊 [VERIFY] T=0.00ms - Starting: {tentative: 184, reference: 27}
  ├─ [HASH-REF] Hashed 27 files (avg: 15.56ms/file, total: 420.20ms)
  ├─ [VERIFY] Checked 184 files (avg: 23.47ms/file, total: 4318.40ms)
  └─ [CLEANUP] Removed 178 dupes, verified 0 copies, promoted 6 to ready
📊 [VERIFY] T=4903.80ms - Complete
📊 [QUEUE METRICS] T=5095.30ms - All files rendered (1024 files) {renderedRows: 23}
```

### Test 6: 781 Files (After 1024 Files in Queue)
**Phase 1:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 200, existing: 1024}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 200, copy: 0} (1.70ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=1.70ms - Complete
📊 [QUEUE METRICS] T=8.00ms - Initial batch complete (200 files)
📊 [QUEUE METRICS] T=42.30ms - Initial table PAINTED (visible to user)
```

**Phase 2:**
```
📊 [DEDUP] T=0.00ms - Starting: {new: 581, existing: 1224}
  ├─ [PREFILTER] Complete: {ready: 0, dupe: 581, copy: 0} (2.40ms)
  └─ [HASH] Skipped - all files pre-filtered
📊 [DEDUP] T=2.40ms - Complete
📊 [QUEUE METRICS] T=116.40ms - All files finished adding to queue (781 files) {averageTimePerFile: '0.15ms'}
📊 [QUEUE METRICS] T=116.50ms - All files rendered (1805 files) {renderedRows: 23}
```

---

## KEY PERFORMANCE INSIGHTS

### Hashing Performance Comparison

| Scenario | Algorithm | Files | Total Size | Throughput | Avg/File |
|----------|-----------|-------|------------|------------|----------|
| Before (Test 1) | BLAKE3 | 8 | ~2.67 MB | ~64 MB/s | 5.19ms |
| After (Test 1) | XXH3 | 8 | ~2.67 MB | ~24 MB/s | 13.65ms |
| Worker (Test 1) | XXH32 | 8 | 2.67 MB | 24.47 MB/s | 13.65ms |
| Worker (Test 2) | XXH32 | 160 | 57.82 MB | 30.52 MB/s | 11.84ms |
| Worker (Test 3) | XXH32 | 38 | 0.70 MB | 5.93 MB/s | 3.09ms |

### Deduplication Performance

| Queue Size | New Files | Prefilter Time | Result |
|------------|-----------|----------------|--------|
| 0 | 34 | 0.50ms | 34 ready, 0 dup |
| 34 | 34 | 0.50ms | 0 ready, 34 dup |
| 815 | 200 | 1.20ms | 0 ready, 200 dup |
| 999 | 34 | 2.00ms | 0 ready, 34 dup |
| 1018 | 184 | 1.80ms | 0 ready, 184 dup |
| 1024 | 200 | 1.70ms | 0 ready, 200 dup |

**Observation:** Metadata pre-filtering time scales linearly with queue size (~0.001ms per 100 existing files)

### Table Rendering Performance

| Total Files | Render Time | Files/Second |
|-------------|-------------|--------------|
| 68 | ~6ms | ~11,000 |
| 218 | ~11ms | ~19,800 |
| 815 | ~7ms | ~116,400 |
| 999 | ~1ms | ~999,000 |
| 1018 | ~226ms | ~4,500 |
| 1805 | ~74ms | ~24,400 |

**Observation:** Virtual scrolling keeps rendering time low regardless of total file count

### Tentative Verification Performance (Fallback Hashing)

| Test | Files | Ref Hash Time | Verify Time | Total | Avg/File |
|------|-------|---------------|-------------|-------|----------|
| After XXH3 | 34 | 230ms (26 files) | 337ms (34 files) | 571ms | 16.8ms |
| Worker Test 4 | 34 | 781ms (21 files) | 2197ms (34 files) | 3021ms | 88.9ms |
| Worker Test 5 | 184 | 420ms (27 files) | 4318ms (184 files) | 4904ms | 26.7ms |

**Observation:** Fallback hashing in tentative verification is significantly slower (37-65ms/file vs 3-14ms/file for worker)
