# Client-Side Deduplication: Architecture Rationale & Enhancement Guide

## Executive Summary

This document explains the architectural rationale behind the original client-side deduplication design and provides guidance on how to enhance it with UX improvements WITHOUT sacrificing its performance characteristics.

**Key Insight:** The original design is architecturally superior to the "improved" proposal. This document preserves the reasoning behind the design decisions to prevent future regressions.

---

## Core Design Philosophy

### The Smart Performance Optimization

The original deduplication design uses a two-phase approach that **hides expensive operations behind unavoidable wait time**:

**Phase 1: Client-Side Deduplication (Instant)**
- Group files by size
- Only hash files with duplicate sizes
- No database queries
- Result: Instant feedback, minimal CPU usage

**Phase 2: Upload with Hash Verification (During Upload)**
- Hash files as they're about to upload
- Query database for existing hashes
- Upload file content
- Save metadata
- Result: Hash/database latency is HIDDEN behind the much longer file upload time

### Why This Matters

**Upload time is ~100x longer than hash+query time:**
- Hashing a 10MB file: ~50ms
- Querying Firestore: ~100ms
- Uploading 10MB file: ~5-15 seconds (depending on connection)

By performing hash and database operations DURING upload, users never notice the ~150ms overhead because it's completely hidden by the 5-15 second upload time.

**Moving hash/query to BEFORE upload would:**
- Make users wait for ALL hashing before ANY upload starts
- Force database queries even if user cancels
- Show ~150ms × N files of latency BEFORE upload begins
- Increase Firestore load (queries for files that may never be uploaded)

---

## Terminology (Critical for Litigation Discovery)

This app is designed for **litigation document discovery**, which requires specific terminology:

- **duplicate** or **duplicates**: Files with the same hash value AND same modified date
- **copy** or **copies**: Files with the same hash value but different file metadata
- **file metadata**: Filesystem metadata (name, size, modified date, path) that does not affect hash value
- **one-and-the-same**: The exact same file (same hash, same metadata, same folder location)

### Non-Negotiable Requirements

1. **ALL metadata from ALL copies MUST be saved** - For litigation discovery, suppressing any file location or metadata is unacceptable
2. **No user override of deduplication** - Users cannot choose which files to upload or suppress
3. **"Best file" selection is UI-only** - Since identical hash = identical content, the choice of which copy to upload is irrelevant. The "best file" selection only determines which metadata displays as primary in the UI
4. **Hash-based document IDs** - Using BLAKE3 hash as Firestore document ID provides database-level deduplication (can't create duplicate documents)

---

## Original Architecture: Detailed Walkthrough

### Step 1: Size-Based Pre-Filtering (Client-Side Only)

```javascript
// Group files by size
const fileSizeGroups = new Map(); // size -> [file_references]

files.forEach((file, index) => {
  const fileSize = file.size;
  const fileRef = {
    file,
    originalIndex: index,
    path: getFilePath(file),
    metadata: {
      sourceFileName: file.name,
      sourceFileSize: file.size,
      sourceFileType: file.type,
      lastModified: file.lastModified,
    },
  };

  if (!fileSizeGroups.has(fileSize)) {
    fileSizeGroups.set(fileSize, []);
  }
  fileSizeGroups.get(fileSize).push(fileRef);
});

// Separate unique from potential duplicates
const uniqueFiles = [];
const duplicateCandidates = [];

for (const [, fileRefs] of fileSizeGroups) {
  if (fileRefs.length === 1) {
    uniqueFiles.push(fileRefs[0]); // Definitely unique - skip hashing
  } else {
    duplicateCandidates.push(...fileRefs); // Need to hash these
  }
}
```

**Rationale:** Files with unique sizes cannot be duplicates. This optimization avoids hashing potentially 50-70% of files, saving significant CPU time.

### Step 2: Hash Duplicate Candidates (Client-Side Only)

```javascript
const hashGroups = new Map(); // hash -> [file_references]

for (const fileRef of duplicateCandidates) {
  const hash = await generateFileHash(fileRef.file); // BLAKE3 128-bit
  fileRef.hash = hash;

  if (!hashGroups.has(hash)) {
    hashGroups.set(hash, []);
  }
  hashGroups.get(hash).push(fileRef);
}
```

**Rationale:** Only hash files that might be duplicates (same size). Use BLAKE3 for speed and security.

### Step 3: Group by Metadata for One-and-the-Same Detection

```javascript
for (const [hash, fileRefs] of hashGroups) {
  if (fileRefs.length === 1) {
    finalFiles.push(fileRefs[0]); // Unique hash
    continue;
  }

  // Multiple files with same hash - check metadata
  const oneAndTheSameGroups = new Map(); // metadata_key -> [file_references]

  fileRefs.forEach((fileRef) => {
    // Metadata signature for detecting one-and-the-same
    const metadataKey = `${fileRef.metadata.sourceFileName}_${fileRef.metadata.sourceFileSize}_${fileRef.metadata.lastModified}`;

    if (!oneAndTheSameGroups.has(metadataKey)) {
      oneAndTheSameGroups.set(metadataKey, []);
    }
    oneAndTheSameGroups.get(metadataKey).push(fileRef);
  });

  // Process each metadata group
  for (const [, oneAndTheSameFiles] of oneAndTheSameGroups) {
    if (oneAndTheSameFiles.length > 1) {
      // One-and-the-same: User selected same file multiple times
      // Keep only first instance (others are silently filtered)
      finalFiles.push(oneAndTheSameFiles[0]);
    } else {
      // Unique metadata (copy with different name/date)
      finalFiles.push(oneAndTheSameFiles[0]);
    }
  }

  // If multiple distinct metadata groups, choose best file
  if (oneAndTheSameGroups.size > 1) {
    const allUniqueFiles = Array.from(oneAndTheSameGroups.values()).map(group => group[0]);
    const bestFile = chooseBestFile(allUniqueFiles);

    // Mark others as copies
    allUniqueFiles.forEach((fileRef) => {
      if (fileRef !== bestFile) {
        fileRef.isCopy = true;
        // This file's metadata will be saved, but file content won't be uploaded
      }
    });
  }
}
```

**Rationale:**
- One-and-the-same files (user accidentally selected same file twice) are silently filtered - no need to confuse user
- Copies (same content, different metadata) all get their metadata saved, but only one file uploaded
- Best file selection uses priority rules for deterministic, sensible behavior

### Step 4: Priority Rules for Best File Selection

When multiple copies exist (same hash, different metadata), choose the best file:

1. **Earliest modification date** - Older file likely the original
2. **Longest folder path** - Deeper nesting suggests more organized structure
3. **Shortest filename** - Concise names preferred over verbose ones
4. **Alphanumeric sort** - Alphabetically first for consistency
5. **Original selection order** - First selected wins (stable sort)

```javascript
const chooseBestFile = (fileRefs) => {
  return fileRefs.sort((a, b) => {
    // Priority 1: Earliest modification date
    if (a.metadata.lastModified !== b.metadata.lastModified) {
      return a.metadata.lastModified - b.metadata.lastModified;
    }

    // Priority 2: Longest folder path
    const aFolderPath = a.path.substring(0, a.path.lastIndexOf('/') + 1);
    const bFolderPath = b.path.substring(0, b.path.lastIndexOf('/') + 1);
    if (aFolderPath.length !== bFolderPath.length) {
      return bFolderPath.length - aFolderPath.length; // Descending
    }

    // Priority 3: Shortest filename
    if (a.metadata.sourceFileName.length !== b.metadata.sourceFileName.length) {
      return a.metadata.sourceFileName.length - b.metadata.sourceFileName.length;
    }

    // Priority 4: Alphanumeric filename sort
    if (a.metadata.sourceFileName !== b.metadata.sourceFileName) {
      return a.metadata.sourceFileName.localeCompare(b.metadata.sourceFileName);
    }

    // Priority 5: Original selection order
    return a.originalIndex - b.originalIndex;
  })[0];
};
```

**Rationale:** These rules provide deterministic, sensible selection that users would generally agree with. The order matters - earlier modified date trumps all other factors.

### Step 5: Upload Phase (Hash-Based Database Deduplication)

During upload, for each file:

```javascript
// Hash was already calculated in client-side phase
const documentId = file.hash; // BLAKE3 hash is the document ID

try {
  // Check if document exists (happens DURING upload, not before)
  const docRef = doc(db, 'documents', documentId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // File already exists in database
    // Update metadata to add new source reference
    await updateDoc(docRef, {
      sources: arrayUnion({
        fileName: file.metadata.sourceFileName,
        path: file.path,
        lastModified: file.metadata.lastModified,
        uploadedAt: serverTimestamp(),
      })
    });
  } else {
    // New file - upload to Storage and create Firestore document
    await uploadBytes(storageRef, file.file);
    await setDoc(docRef, {
      hash: documentId,
      size: file.metadata.sourceFileSize,
      type: file.metadata.sourceFileType,
      sources: [{
        fileName: file.metadata.sourceFileName,
        path: file.path,
        lastModified: file.metadata.lastModified,
        uploadedAt: serverTimestamp(),
      }]
    });
  }

  // Upload copies (metadata only)
  for (const copy of file.copies) {
    await updateDoc(docRef, {
      sources: arrayUnion({
        fileName: copy.metadata.sourceFileName,
        path: copy.path,
        lastModified: copy.metadata.lastModified,
        uploadedAt: serverTimestamp(),
      })
    });
  }
} catch (error) {
  // Handle errors
}
```

**Rationale:**
- Hash as document ID provides database-level deduplication (Firestore prevents duplicate IDs)
- Database query happens DURING upload, so latency is hidden
- All source metadata is preserved in `sources` array for litigation discovery
- If file exists, only metadata is updated (no redundant Storage upload)

---

## UX Enhancement Opportunities

The following enhancements improve user experience WITHOUT changing the core architecture:

### 1. Better Status Names

**Original:**
- `pending` - File queued
- `ready` - Ready to upload
- `uploadMetadataOnly` - Copy of existing file
- `uploading` - Currently uploading
- `completed` - Done

**Enhanced:**
- `pending` - File queued
- `unique` - Unique file (no duplicates detected)
- `same-file` - One-and-the-same (duplicate selection)
- `content-match` - Copy detected (same hash, different metadata)
- `ready-to-upload` - Ready for upload
- `metadata-only` - Metadata will be saved, file content skipped
- `uploading` - Currently uploading
- `completed` - Done
- `error` - Hash failure or other error

**Implementation:**
```javascript
// During client-side deduplication
if (fileSizeGroups.get(fileSize).length === 1) {
  fileRef.status = 'unique'; // Instead of 'ready'
}

// For one-and-the-same
if (oneAndTheSameFiles.length > 1) {
  oneAndTheSameFiles[0].status = 'same-file';
  // Others are filtered, not shown in queue
}

// For copies
if (fileRef.isCopy) {
  fileRef.status = 'content-match';
  fileRef.uploadStatus = 'metadata-only'; // During upload
}
```

### 2. Progress Feedback During Hashing

**Show progress DURING client-side deduplication:**

```javascript
let processedCount = 0;
const totalFiles = duplicateCandidates.length;

for (const fileRef of duplicateCandidates) {
  const hash = await generateFileHash(fileRef.file);
  fileRef.hash = hash;

  processedCount++;

  // Update UI with progress
  onProgress({
    phase: 'analyzing',
    current: processedCount,
    total: totalFiles,
    percentage: Math.round((processedCount / totalFiles) * 100),
    currentFile: fileRef.metadata.sourceFileName,
  });
}
```

**UI Display:**
```
Analyzing files: 45 / 100 (45%)
Current: report_2024.pdf
```

### 3. Preview/Summary Screen Before Upload

**After client-side deduplication, show summary:**

```javascript
const summary = {
  totalSelected: files.length,
  uniqueFiles: uniqueFiles.length,
  copies: files.filter(f => f.isCopy).length,
  oneAndTheSame: /* count of filtered files */,
  toUpload: files.filter(f => !f.isCopy).length,
  metadataOnly: files.filter(f => f.isCopy).length,
  estimatedStorageSaved: /* calculate size of copies */,
};
```

**UI Display:**
```
┌─────────────────────────────────────┐
│ Upload Preview                      │
├─────────────────────────────────────┤
│ Files Selected:        150          │
│ Unique Files:          120          │
│ Copies Detected:       25           │
│ Duplicate Selections:  5 (filtered) │
├─────────────────────────────────────┤
│ To Upload:             120 files    │
│ Metadata Only:         25 files     │
│ Storage Saved:         ~450 MB      │
├─────────────────────────────────────┤
│         [Cancel]  [Confirm Upload]  │
└─────────────────────────────────────┘
```

**Important:** This is display-only. No user override capability.

### 4. Deduplication Metrics Display

**During and after upload, show savings:**

```javascript
const metrics = {
  filesUploaded: 120,
  filesCopies: 25,
  totalFiles: 145,
  storageSaved: calculateSize(copies),
  timeSaved: estimateTimeSaved(copies),
  deduplicationRate: (25 / 145 * 100).toFixed(1) + '%',
};
```

**UI Display:**
```
Upload Complete!

120 files uploaded
25 copies detected (metadata saved)
───────────────────────────
Storage saved: 450 MB
Deduplication: 17.2%
```

### 5. Error Handling for Hash Failures

**When a file fails to hash:**

```javascript
try {
  const hash = await generateFileHash(fileRef.file);
  fileRef.hash = hash;
} catch (error) {
  fileRef.status = 'error';
  fileRef.error = 'Failed to hash file - cannot upload';
  fileRef.canUpload = false; // Disable checkbox
  // Continue processing other files
}
```

**UI Display:**
```
🔴 corrupted_file.pdf - Failed to hash file
   [ⓘ] This file cannot be uploaded (checkbox disabled)
```

**Rationale:** Files without hashes cannot be uploaded (no document ID). Better to block with clear error than upload and fail mysteriously.

### 6. File Type Indicators

**Show visual indicators for file statuses:**

```javascript
const statusIcons = {
  'unique': '✓',        // Green checkmark
  'same-file': '⊗',     // Gray circled X
  'content-match': '⚌',  // Blue parallel lines
  'uploading': '↑',     // Up arrow
  'completed': '✓',     // Green checkmark
  'error': '✗',         // Red X
};
```

---

## Common Questions & Answers

### Q: Why not hash all files upfront to give better progress feedback?

**A:** Because it wastes CPU and time. Files with unique sizes (typically 50-70% of files) cannot be duplicates, so hashing them provides zero value while consuming significant CPU time.

### Q: Why not query the database before upload to avoid uploading existing files?

**A:** Because:
1. It adds visible latency before upload can start
2. It increases Firestore load (queries for files that may be cancelled)
3. The query time is tiny compared to upload time - hiding it during upload is free
4. The hash-based document ID prevents accidental duplicates anyway

### Q: Why can't users override the deduplication decisions?

**A:** Because:
1. Litigation discovery requires ALL metadata from ALL copies - cannot be suppressed
2. Files with identical hashes ARE identical - the choice of which to upload is irrelevant
3. Firestore uses hash as document ID - can't upload multiple files with same hash
4. Users overriding could accidentally violate discovery requirements

### Q: What if the "best file" selection is wrong?

**A:** The best file selection is irrelevant because:
1. Identical hash = identical content (BLAKE3 collision probability is ~2^-128)
2. ALL metadata from ALL copies is saved in Firestore `sources` array
3. The "best file" only determines which metadata displays as primary in UI
4. Users can search/filter by any source metadata to find specific copies

### Q: Why earliest modification date as Priority 1?

**A:** Because in document workflows, the earliest version is typically the original, and later versions are copies. This matches user expectations in 90%+ of cases. Other priority rules handle the remaining cases.

### Q: What about BLAKE3 hash collisions?

**A:** Collision probability is ~2^-128 (1 in 340 undecillion). This is equivalent to:
- Hashing every atom in 100 Earth's worth of data
- Running for longer than the age of the universe
- **ACCEPTABLE RISK** - Far more likely that cosmic rays corrupt RAM during hashing

### Q: Why not use MD5 or SHA-256?

**A:** BLAKE3 is:
- Faster than MD5 and SHA-256 (by 10x+)
- More secure than MD5 (which is cryptographically broken)
- As secure as SHA-256
- Supports parallel hashing (better for large files)

### Q: How does this handle files already in the database?

**A:** During upload (not before):
1. Try to create Firestore document with hash as ID
2. If exists, update operation adds new source metadata
3. If doesn't exist, upload to Storage and create document
4. Hash-based ID provides automatic database-level deduplication

---

## Implementation Checklist

To enhance the UI without breaking the architecture:

- [ ] **Update status names** to more descriptive values
- [ ] **Add progress callback** during client-side hashing phase
- [ ] **Create preview/summary component** to show before upload
- [ ] **Add deduplication metrics** display during and after upload
- [ ] **Implement error status** for hash failures with disabled checkbox
- [ ] **Add visual indicators** (icons, colors) for different statuses
- [ ] **Display "one-and-the-same" detection** when same file selected multiple times
- [ ] **Show "copy detected" messages** with explanation
- [ ] **Display storage saved** calculations

**DO NOT:**
- ❌ Add user override capabilities
- ❌ Query database before upload phase
- ❌ Hash files before user clicks upload button
- ❌ Allow suppressing metadata from any copy
- ❌ Change priority rules without documenting rationale
- ❌ Move expensive operations out of upload phase

---

## Testing Strategy

### Unit Tests

Test each component independently:

```javascript
describe('chooseBestFile', () => {
  it('should choose earliest modified date', () => {
    const files = [
      { metadata: { lastModified: 1000 }, path: '/a', originalIndex: 0 },
      { metadata: { lastModified: 500 }, path: '/b', originalIndex: 1 },
    ];
    expect(chooseBestFile(files).originalIndex).toBe(1);
  });

  it('should use longest path as tiebreaker', () => {
    const files = [
      { metadata: { lastModified: 1000 }, path: '/a/file.pdf', originalIndex: 0 },
      { metadata: { lastModified: 1000 }, path: '/a/b/c/file.pdf', originalIndex: 1 },
    ];
    expect(chooseBestFile(files).originalIndex).toBe(1);
  });

  // ... test all 5 priority rules
});

describe('oneAndTheSameDetection', () => {
  it('should filter duplicate selections', () => {
    const files = [
      { name: 'file.pdf', size: 1000, lastModified: 1000, path: '/a/file.pdf' },
      { name: 'file.pdf', size: 1000, lastModified: 1000, path: '/a/file.pdf' },
    ];
    const result = processDuplicateGroups(files);
    expect(result.finalFiles.length).toBe(1);
  });
});

describe('sizeBased Filtering', () => {
  it('should not hash unique-sized files', () => {
    const files = [
      { size: 1000 },
      { size: 2000 },
      { size: 3000 },
    ];
    const result = groupBySize(files);
    expect(result.uniqueFiles.length).toBe(3);
    expect(result.duplicateCandidates.length).toBe(0);
  });

  it('should identify duplicate candidates', () => {
    const files = [
      { size: 1000 },
      { size: 1000 },
      { size: 2000 },
    ];
    const result = groupBySize(files);
    expect(result.uniqueFiles.length).toBe(1);
    expect(result.duplicateCandidates.length).toBe(2);
  });
});
```

### Integration Tests

Test the complete flow:

```javascript
describe('Complete Deduplication Flow', () => {
  it('should handle mix of unique, copies, and one-and-the-same', async () => {
    const files = [
      createFile('unique1.pdf', 1000, 'content1'),
      createFile('unique2.pdf', 2000, 'content2'),
      createFile('copy1.pdf', 3000, 'content3'),
      createFile('copy2.pdf', 3000, 'content3'), // Same content, different name
      createFile('same.pdf', 4000, 'content4'),
      createFile('same.pdf', 4000, 'content4'), // One-and-the-same
    ];

    const result = await processFiles(files);

    expect(result.unique.length).toBe(2);
    expect(result.copies.length).toBe(1); // One marked as copy
    expect(result.totalToUpload).toBe(4); // 2 unique + 2 best files
  });
});
```

### Performance Tests

Verify optimization effectiveness:

```javascript
describe('Performance', () => {
  it('should skip hashing for unique-sized files', async () => {
    const files = createManyFiles(1000, 'unique_sizes');
    const hashSpy = jest.spyOn(hashModule, 'generateFileHash');

    await processFiles(files);

    expect(hashSpy).not.toHaveBeenCalled();
  });

  it('should only hash duplicate candidates', async () => {
    const files = [
      ...createManyFiles(700, 'unique_sizes'),
      ...createManyFiles(300, 'same_size'),
    ];
    const hashSpy = jest.spyOn(hashModule, 'generateFileHash');

    await processFiles(files);

    expect(hashSpy).toHaveBeenCalledTimes(300); // Only the 300 candidates
  });
});
```

---

## Conclusion

The original deduplication design is **architecturally superior** because it optimizes for:

1. **Performance**: Hides expensive operations behind unavoidable wait time
2. **Efficiency**: Avoids hashing 50-70% of files through size-based pre-filtering
3. **Database load**: Minimizes Firestore queries by deferring to upload phase
4. **User experience**: Instant feedback for client-side deduplication
5. **Litigation compliance**: Preserves all metadata for discovery purposes

The UX enhancements described in this document improve user visibility and feedback WITHOUT sacrificing these architectural benefits.

**Key Principle:** Never move expensive operations (hashing, database queries) out of the upload phase where their cost is hidden behind the much longer file upload time.
