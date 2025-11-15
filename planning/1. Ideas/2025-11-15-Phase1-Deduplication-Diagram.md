# Phase 1: Client-Side Constraint-Based Deduplication

**Phase 1 ONLY** - Pre-Upload Queue Organization (happens BEFORE user clicks "Upload" button)

This diagram shows the 3-layer constraint deduplication algorithm that runs on the client-side using FAST operations only (size grouping + XXH3 hashing). BLAKE3 hashing happens later in Phase 2 during network upload.

```mermaid
flowchart TD
    Start([User Selects Files]) --> Input[Input: File Selection]
    Input --> Layer1[Layer 1: Size-Based Index<br/>Group by file.size - O-1 operation]

    Layer1 --> UniqueSize{Unique<br/>Size?}

    UniqueSize -->|Yes| MarkReady[Mark: READY<br/>Skip to Output]
    UniqueSize -->|No| Layer3[Layer 3: XXH3 Metadata Hash<br/>XXH3-firmID + modDate + name + ext]

    Layer3 --> MetaExists{Metadata Hash<br/>in Queue?}

    MetaExists -->|Yes| MarkDuplicate[Mark: DUPLICATE<br/>Stop Processing<br/>Purpose: Catch 'same folder twice' scenario]
    MetaExists -->|No| Layer2[Layer 2: XXH3 Content Hash<br/>XXH3-file content]

    Layer2 --> ContentExists{Content Hash<br/>in Queue?}

    ContentExists -->|Yes| MarkCopy[Mark: COPY<br/>Same content, meaningful metadata]
    ContentExists -->|No| MarkPrimary[Mark: READY<br/>Primary file to upload]

    MarkReady --> Output[Output Queue]
    MarkDuplicate --> Output
    MarkCopy --> Output
    MarkPrimary --> Output

    Output --> Summary[Queue Status:<br/>ready - Primary files to upload<br/>copy - Same content, store metadata only<br/>duplicate - Filtered out, not uploaded]

    Summary --> Performance[Performance Insight:<br/>When user uploads same 5,000-file folder twice,<br/>Layer 3 catches all 5,000 duplicates with cheap<br/>XXH3 metadata hash, avoiding expensive content hashing]

    Performance --> Phase2Note[Next: Phase 2 Upload<br/>BLAKE3 hash during network upload<br/>Server-side deduplication]

    style Start fill:#e1f5ff
    style Input fill:#e1f5ff
    style Layer1 fill:#fff9c4
    style Layer2 fill:#ffecb3
    style Layer3 fill:#ffe0b2
    style MarkReady fill:#c8e6c9
    style MarkPrimary fill:#c8e6c9
    style MarkCopy fill:#bbdefb
    style MarkDuplicate fill:#e0e0e0
    style Output fill:#e1f5ff
    style Summary fill:#f3e5f5
    style Performance fill:#fff3e0
    style Phase2Note fill:#e8f5e9
```

## Processing Order (Critical!)

1. **Layer 1 - Size Index** (O(1) grouping)
   - Files with unique sizes → Mark `ready`, skip to output
   - Files with size collisions → Proceed to Layer 3

2. **Layer 3 - XXH3 Metadata Hash** (Cheap hash: ~10-50μs)
   - Hash = XXH3(firmID + modDate + name + ext)
   - Purpose: Catch "user uploaded same folder twice" with cheap hash
   - If metadata hash exists → Mark `duplicate`, stop
   - If metadata hash new → Proceed to Layer 2

3. **Layer 2 - XXH3 Content Hash** (More expensive: ~1-5ms per file)
   - Hash = XXH3(file content)
   - Purpose: Detect same content with different metadata
   - If content hash exists → Mark `copy`
   - If content hash new → Mark `ready`

## Output Statuses

| Status | Description | Upload? | Store Metadata? |
|--------|-------------|---------|-----------------|
| `ready` | Primary file to upload | ✅ Yes | ✅ Yes |
| `copy` | Same content, meaningful metadata differences | ❌ No (content exists) | ✅ Yes (metadata valuable) |
| `duplicate` | Exact duplicate, no informational value | ❌ No | ❌ No |

## Performance Characteristics

### Key Optimization: Layer 3 First
When user uploads the same 5,000-file folder twice:
- **Without Layer 3**: Would need 5,000 expensive content hashes
- **With Layer 3**: Catches all 5,000 duplicates with cheap metadata hash
- **Time saved**: ~4,950ms (5,000 × ~1ms content hash avoided)

### Hash Performance (Typical)
- **XXH3 Metadata Hash**: 10-50μs (string concat + hash)
- **XXH3 Content Hash**: 1-5ms per MB (depends on file size)
- **Size Grouping**: O(1) Map lookup

## Terminology Requirements (CLAUDE.md Directive #4)

Must use precise terminology per `/docs/architecture/file-lifecycle.md`:

- **"duplicate"**: Files with identical content AND core metadata (name, size, modDate) where folder path variations have NO informational value. Not uploaded, metadata not stored.

- **"copy"**: Files with same hash value but different file metadata that IS meaningful. Not uploaded to storage (content exists), but metadata IS stored for informational value.

- **"primary"** or **"best"**: The file with the most meaningful metadata that will be uploaded to storage.

- **"file metadata"**: Filesystem metadata (name, size, modified date, path) that does not affect hash value.

## What This Diagram Does NOT Show

This diagram is **Phase 1 ONLY** - it does NOT include:
- ❌ BLAKE3 hashing (that's Phase 2)
- ❌ Server-side operations (that's Phase 2)
- ❌ Database queries (that's Phase 2)
- ❌ File upload process (that's Phase 2)
- ❌ Storage operations (that's Phase 2)

Phase 2 happens AFTER user clicks "Upload" button and includes BLAKE3 hashing hidden in network upload time.
