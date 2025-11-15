# File Upload Deduplication Workflow - 3-Layer Array Constraint

This diagram illustrates the multi-dimensional array deduplication strategy for file uploads.

```mermaid
flowchart TD
    Start([User Adds Files]) --> Display[Display in Upload Queue<br/>Status: PENDING Yellow Dot]
    Display --> CheckPending{More PENDING<br/>files to process?}

    CheckPending -->|Yes| GetNext[Get Next File Object]
    CheckPending -->|No| Done([End Processing])

    GetNext --> CheckSize{Layer 1 Array<br/>at index fileSize<br/>empty?}

    CheckSize -->|Yes| StoreFirst[Store file at index fileSize<br/>Set status: FIRST]
    StoreFirst --> CheckPending

    CheckSize -->|No| CheckType{Existing object<br/>is Array?}

    CheckType -->|No - is File Object| CreateLayer2[Create Layer 2 Array<br/>at index fileSize]
    CreateLayer2 --> HashExisting[Calculate BLAKE3 hash<br/>of existing file]
    HashExisting --> MoveExisting[Move existing file to<br/>Layer 2 at index existingHash]
    MoveExisting --> HashNew[Calculate BLAKE3 hash<br/>of new file]
    HashNew --> CheckHashEmpty{Layer 2 Array<br/>at index newHash<br/>empty?}

    CheckHashEmpty -->|Yes| StoreFirstHash[Store new file at index newHash<br/>Set status: FIRST]
    StoreFirstHash --> CheckPending

    CheckHashEmpty -->|No| CheckLayer2Type{Existing object<br/>at index newHash<br/>is Array?}

    CheckType -->|Yes - is Array| JumpToLayer2[Access Layer 2 Array<br/>at index fileSize]
    JumpToLayer2 --> HashNew

    CheckLayer2Type -->|No - is File Object| CreateLayer3[Create Layer 3 Array<br/>at index newHash]
    CreateLayer3 --> MoveToLayer3[Move existing file<br/>to Layer 3]
    MoveToLayer3 --> AddCopy[Add new file to Layer 3<br/>Set status: COPY]
    AddCopy --> CheckPending

    CheckLayer2Type -->|Yes - is Array| AddDuplicate[Add new file to Layer 3<br/>Set status: DUPLICATE/COPY]
    AddDuplicate --> CheckPending

    style Start fill:#e1f5ff
    style Done fill:#e1f5ff
    style Display fill:#fff9c4
    style StoreFirst fill:#c8e6c9
    style StoreFirstHash fill:#c8e6c9
    style AddCopy fill:#ffccbc
    style AddDuplicate fill:#ffccbc
```

## Array Structure

```
Layer 1: Indexed by File Size
├─ index[1024]: File Object (status: FIRST) OR Array (Layer 2)
│
├─ index[2048]: Array (Layer 2) - Indexed by BLAKE3 Hash
│  ├─ index[hash_abc123]: File Object (status: FIRST) OR Array (Layer 3)
│  └─ index[hash_def456]: Array (Layer 3) - Multiple files with same hash
│     ├─ File 1 (Primary/Best)
│     ├─ File 2 (Copy - different metadata)
│     └─ File 3 (Duplicate - identical metadata)
│
└─ index[4096]: File Object (status: FIRST)
```

## Status Definitions

- **PENDING**: File added to queue, waiting to be processed (Yellow Dot indicator)
- **FIRST**: First file encountered with this size (Layer 1) or size+hash combination (Layer 2)
- **COPY**: File with same hash but different meaningful metadata (name, path, modified date)
- **DUPLICATE**: File with identical hash and core metadata (no informational value)

## Key Optimization Points

1. **Size Pre-filtering**: Files with unique sizes skip hashing entirely (status: FIRST)
2. **Lazy Hashing**: BLAKE3 hashing only occurs when size collision detected
3. **Progressive Array Creation**: Arrays only created when needed (collision detected)
4. **Hardware Calibrated**: Hash calculation time estimated using H-Factor system

## Performance Benefits

- Reduces hashing operations by ~70-90% (only hash size collisions)
- Instant visual feedback (optimistic UI updates)
- Non-blocking (web worker for hashing)
- Memory efficient (sparse array structure)
