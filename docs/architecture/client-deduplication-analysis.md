# Client-Side Deduplication Analysis

## Current Implementation (Old Upload Page)

### Overview
The old upload page at `/upload` implements a sophisticated client-side deduplication strategy that distinguishes between:
1. **Unique files** - Files with no duplicates
2. **One-and-the-same files** - The exact same file selected multiple times (silently filtered)
3. **Duplicate files (copies)** - Files with identical content but different metadata (marked, only one uploaded)

### Current Workflow - Mermaid Diagram

```mermaid
flowchart TD
    Start([User Selects Files]) --> A[Collect All Files]
    A --> B[Group by File Size]

    B --> C{Size Group<br/>Size == 1?}
    C -->|Yes| D[Mark as Unique<br/>Status: ready]
    C -->|No| E[Add to Duplicate<br/>Candidates]

    E --> F[Hash with BLAKE3<br/>128-bit / 32 hex chars]
    F --> G[Group by Hash Value]

    G --> H{Hash Group<br/>Size == 1?}
    H -->|Yes| I[Mark as Unique<br/>Status: ready]
    H -->|No| J[Group by Metadata Key<br/>fileName_size_lastModified]

    J --> K{Metadata Group<br/>Size > 1?}
    K -->|Yes| L[One-and-the-Same<br/>Select first instance<br/>Silently filter others]
    K -->|No| M[Unique metadata]

    L --> N{Multiple distinct<br/>metadata groups?}
    M --> N

    N -->|No| O[Keep single file<br/>Status: ready]
    N -->|Yes| P[Choose Best File<br/>Priority Rules]

    P --> Q[Best File<br/>Status: ready]
    P --> R[Other Copies<br/>Status: uploadMetadataOnly<br/>isDuplicate: true]

    D --> S[Upload Queue]
    I --> S
    O --> S
    Q --> S
    R --> S

    S --> T{Upload Phase}
    T -->|ready| U[Upload full file<br/>to Storage]
    T -->|uploadMetadataOnly| V[Only save metadata<br/>to Firestore<br/>Reference existing file]

    U --> W([Complete])
    V --> W

    style D fill:#90EE90
    style I fill:#90EE90
    style O fill:#90EE90
    style Q fill:#90EE90
    style R fill:#FFB6C1
    style L fill:#FFE4B5
```

### Priority Rules for Choosing Best File

When multiple files have the same hash but different metadata (true duplicates/copies):

1. **Earliest modification date** - Older file wins
2. **Longest folder path** - Deeper nested file wins
3. **Shortest filename** - More concise name wins
4. **Alphanumeric filename sort** - Alphabetically first wins
5. **Original selection order** - Earlier selected wins

### Key Components

#### File Locations
- **Worker**: `src/features/upload/workers/fileHashWorker.js`
- **Composables**:
  - `src/features/upload/composables/useQueueDeduplication.js`
  - `src/features/upload/composables/useQueueCore.js`
  - `src/features/upload/composables/useFileProcessor.js`
- **Main View**: `src/features/upload/FileUpload.vue`

#### Hash Algorithm
- **BLAKE3** with 128-bit output (32 hex characters)
- Used as document ID in Firestore for automatic database-level deduplication

#### Processing Paths
1. **Web Worker Path** (preferred) - Uses `fileHashWorker.js` for non-blocking hashing
2. **Main Thread Fallback** - Uses `useQueueCore.js` if worker fails

---

## Proposed Improved Workflow

### Improvements
1. **Simplified Status System** - Use clearer status names
2. **User Visibility** - Show deduplication results to user before upload
3. **User Control** - Allow users to override duplicate detection
4. **Performance Metrics** - Track and display deduplication savings
5. **Incremental Hashing** - Hash files incrementally for better progress feedback
6. **Early Database Check** - Check Firestore for existing files before full processing

### Improved Workflow - Mermaid Diagram

```mermaid
flowchart TD
    Start([User Selects Files]) --> A[Display Initial File List<br/>Status: pending]
    A --> B[User Initiates Processing]

    B --> C[Phase 1: Size Analysis<br/>Group by File Size]
    C --> D{Size Group<br/>Size == 1?}

    D -->|Yes| E[Mark as Unique<br/>Status: unique<br/>Update UI incrementally]
    D -->|No| F[Mark as Duplicate Candidate<br/>Status: analyzing]

    F --> G[Phase 2: Content Hashing<br/>BLAKE3 with Progress]
    G --> H[Update UI with Hash Progress<br/>Show % complete per file]

    H --> I[Group by Hash Value]
    I --> J{Hash Group<br/>Size == 1?}

    J -->|Yes| K[Mark as Unique<br/>Status: unique]
    J -->|No| L[Analyze Metadata Differences]

    L --> M{Metadata Key<br/>fileName_size_lastModified}
    M -->|Same metadata| N[One-and-the-Same<br/>Mark duplicate: same-file<br/>Show: File selected multiple times]
    M -->|Different metadata| O[True Duplicate Copy<br/>Mark duplicate: content-match]

    N --> P[Auto-select first instance<br/>Status: selected<br/>Others: Status: ignored]
    O --> Q[Apply Priority Rules<br/>to suggest best file]

    Q --> R[Mark suggested: best<br/>Others: available-duplicate]

    E --> S[Phase 3: Database Check<br/>Check existing hashes in Firestore]
    K --> S
    P --> S
    R --> S

    S --> T{File hash<br/>exists in DB?}
    T -->|Yes| U[Status: already-uploaded<br/>Show: Existing file found]
    T -->|No| V[Status: ready-to-upload]

    U --> W[Preview & Review Screen<br/>Show deduplication summary]
    V --> W

    W --> X{User Action}
    X -->|Override| Y[Allow user to change<br/>file selections]
    X -->|Confirm| Z[Final Upload Queue]

    Y --> W
    Z --> AA{Upload Phase}

    AA -->|ready-to-upload| AB[Upload full file<br/>to Storage + Firestore]
    AA -->|available-duplicate| AC[Save metadata only<br/>to Firestore<br/>Reference best file hash]
    AA -->|already-uploaded| AD[Update metadata only<br/>Add new source reference]

    AB --> AE[Display Upload Progress<br/>Show savings metrics]
    AC --> AE
    AD --> AE

    AE --> AF([Complete<br/>Show Summary:<br/>- Files uploaded<br/>- Duplicates skipped<br/>- Storage saved])

    style E fill:#90EE90
    style K fill:#90EE90
    style V fill:#90EE90
    style P fill:#FFE4B5
    style R fill:#87CEEB
    style U fill:#DDA0DD
    style AF fill:#FFD700
```

### Key Improvements Explained

#### 1. Enhanced User Experience
- **Incremental UI Updates**: Show progress as each file is analyzed
- **Clear Status Indicators**: Use intuitive status names like "unique", "analyzing", "already-uploaded"
- **Preview Screen**: Let users review deduplication results before committing

#### 2. Better Duplicate Handling
- **Three Duplicate Types**:
  - `same-file`: Exact same file selected multiple times (silently filter)
  - `content-match`: Different files with identical content (suggest best, allow override)
  - `already-uploaded`: File already exists in database (update metadata only)

#### 3. Performance Enhancements
- **Incremental Hashing**: Hash files one at a time with progress feedback
- **Early Database Check**: Query Firestore after hashing to find existing files
- **Smart Batching**: Process files in optimal batch sizes

#### 4. User Control
- **Override Capability**: Users can choose different file from duplicate group
- **Metadata Preview**: Show why files are considered duplicates
- **Upload Preview**: Display what will be uploaded before starting

#### 5. Metrics & Feedback
- **Deduplication Summary**:
  - Number of unique files
  - Number of duplicates detected
  - Estimated storage saved (MB/GB)
  - Time saved by skipping duplicates
- **Real-time Progress**: Show current operation and file being processed

### Status Flow Comparison

#### Current System
```
pending → ready → uploading → completed
pending → ready → uploadMetadataOnly → completed
```

#### Improved System
```
pending → analyzing → unique → ready-to-upload → uploading → completed
pending → analyzing → content-match → available-duplicate → metadata-only → completed
pending → analyzing → same-file → ignored
pending → analyzing → unique → already-uploaded → metadata-updated → completed
```

### Implementation Considerations

1. **Backward Compatibility**: New page can coexist with old page during development
2. **Progressive Enhancement**: Start with basic improvements, add advanced features iteratively
3. **Error Handling**: Better error messages for hash failures or network issues
4. **Cancellation**: Allow users to cancel analysis at any stage
5. **Memory Management**: Handle large file sets efficiently
