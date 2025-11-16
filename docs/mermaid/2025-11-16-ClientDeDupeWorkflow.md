# Client-Side Deduplication Workflow Diagram

**Date:** 2025-11-16
**Source:** `docs/dedupe/2025-11-16-ClientDeDupeLogic.md`
**Status:** Production

---

## Overview

This diagram visualizes the **two-stage, six-phase** client-side deduplication workflow that efficiently identifies and handles duplicate files before upload.

---

## Main Workflow

```mermaid
flowchart TD
    Start([User Drops Files]) --> Phase1[Phase 1: Quick Feedback<br/>0-50ms<br/>Sort files by folder path<br/>Process first 200 files]

    Phase1 --> Phase1_5[Phase 1.5: Deduplication Check<br/>50-150ms<br/>Call deduplicateAgainstExisting]

    Phase1_5 --> ParallelStart{Parallel Execution}

    ParallelStart --> Phase1_6[Phase 1.6: Group Timestamp Update<br/>Tentative<br/>150-200ms]
    ParallelStart --> Stage1[Stage 1: Pre-filter<br/>Metadata Comparison]

    Phase1_6 --> |Uses referenceFileId| TentativeGroup[Tentative grouping applied<br/>Refined later in Stage 2]

    Stage1 --> RemoveRedundant[Remove files with<br/>status=redundant<br/>from previous batch]

    RemoveRedundant --> SortFiles[Sort ALL files:<br/>size asc → date asc → name alpha]

    SortFiles --> FirstPrimary[Mark first file as Primary<br/>status=ready]

    FirstPrimary --> SeqLoop{For each<br/>remaining file}

    SeqLoop --> |Next file| CheckSize{Same size as<br/>previous?}

    CheckSize --> |No| MarkPrimary[Mark as Primary<br/>status=ready]
    MarkPrimary --> SeqLoop

    CheckSize --> |Yes| MarkCopy[Tentatively mark as Copy<br/>status=copy<br/>Set referenceFileId]

    MarkCopy --> CheckDate{Same modified<br/>date?}

    CheckDate --> |No| KeepCopy1[Keep as Copy]
    KeepCopy1 --> SeqLoop

    CheckDate --> |Yes| CheckName{Same name?}

    CheckName --> |No| KeepCopy2[Keep as Copy]
    KeepCopy2 --> SeqLoop

    CheckName --> |Yes| ComparePaths{Compare<br/>folder paths}

    ComparePaths --> |Identical or<br/>path variations only| MarkDuplicate[Mark as Duplicate<br/>status=duplicate]
    ComparePaths --> |Different paths| KeepCopy3[Keep as Copy]

    MarkDuplicate --> SeqLoop
    KeepCopy3 --> SeqLoop

    SeqLoop --> |All files processed| Stage1Complete[Stage 1 Complete<br/>Set preFilterComplete flag]

    Stage1Complete --> Stage2[Stage 2: Hash Verification]

    Stage2 --> WaitPrefilter[Wait for preFilterComplete<br/>Max 10 attempts × 1000ms]

    WaitPrefilter --> HashLoop{For each Copy<br/>or Duplicate file}

    HashLoop --> |Next file| FindRef[Find referenceFile using<br/>referenceFileId]

    FindRef --> HashBoth[Calculate BLAKE3 hashes<br/>for both files if not cached]

    HashBoth --> CompareHash{Hashes<br/>match?}

    CompareHash --> |No| UpgradePrimary[Upgrade to Primary<br/>status=ready]
    UpgradePrimary --> HashLoop

    CompareHash --> |Yes| CheckStatus{File status?}

    CheckStatus --> |duplicate| MarkRedundant[Mark as Redundant<br/>status=redundant<br/>Will be removed in NEXT batch]
    CheckStatus --> |copy| StayCopy[Keep as Copy<br/>Hash matches, metadata differs]

    MarkRedundant --> HashLoop
    StayCopy --> HashLoop

    HashLoop --> |All verified| Stage2Complete[Stage 2 Complete]

    TentativeGroup --> Stage2Wrapper
    Stage2Complete --> Stage2Wrapper[Stage 2 Wrapper:<br/>Auto-verification + Grouping Fix]

    Stage2Wrapper --> CollectHashes[Collect verified hashes from:<br/>- Redundant files<br/>- Verified Copy files]

    CollectHashes --> UpdateGroup[Update groupTimestamp<br/>for ALL files with verified hashes<br/>CRITICAL FIX: Uses actual hash values]

    UpdateGroup --> SortQueue[Sort queue to move<br/>duplicate groups to top]

    SortQueue --> Complete([Deduplication Complete<br/>Files ready for upload])

    style Start fill:#e1f5ff
    style Complete fill:#d4edda
    style Phase1 fill:#fff3cd
    style Phase1_5 fill:#fff3cd
    style Phase1_6 fill:#fff3cd
    style Stage1 fill:#cfe2ff
    style Stage2 fill:#f8d7da
    style Stage2Wrapper fill:#d1ecf1
    style MarkRedundant fill:#f8d7da
    style MarkDuplicate fill:#ffe5b4
    style MarkCopy fill:#d1ecf1
    style MarkPrimary fill:#d4edda
```

---

## Two-Phase Cleanup Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Duplicate: Metadata indicates<br/>likely duplicate<br/>(Stage 1)

    Duplicate --> Redundant: Hash verification confirms<br/>identical content<br/>(Stage 2)

    Redundant --> Removed: Deleted in Stage 1<br/>of NEXT batch

    Removed --> [*]

    note right of Duplicate
        Status: duplicate
        NO hash yet
        NOT removed immediately
    end note

    note right of Redundant
        Status: redundant
        Hash verified
        Awaiting removal
    end note

    note right of Removed
        Removed from queue
        Lifecycle complete
    end note
```

---

## File Status Transitions

```mermaid
flowchart LR
    subgraph "Stage 1: Metadata Only"
        Ready1[ready<br/>Primary]
        Copy1[copy<br/>Same hash likely,<br/>different metadata]
        Dup1[duplicate<br/>Same hash likely,<br/>path variations only]
    end

    subgraph "Stage 2: Hash Verified"
        Ready2[ready<br/>Upgraded Primary]
        Copy2[copy<br/>Hash matches,<br/>metadata differs]
        Redundant[redundant<br/>Hash matches,<br/>marked for removal]
    end

    subgraph "Next Batch Stage 1"
        Removed[Removed from queue]
    end

    Copy1 --> |Hash differs| Ready2
    Copy1 --> |Hash matches| Copy2
    Dup1 --> |Hash differs| Ready2
    Dup1 --> |Hash matches| Redundant
    Redundant --> |Step 3:<br/>Remove redundant| Removed

    Ready1 -.-> |No change| Upload1[Upload to storage]
    Ready2 -.-> |No change| Upload2[Upload to storage]
    Copy2 -.-> |Metadata only| Record[Record metadata<br/>NO storage upload]

    style Ready1 fill:#d4edda
    style Ready2 fill:#d4edda
    style Copy1 fill:#d1ecf1
    style Copy2 fill:#d1ecf1
    style Dup1 fill:#ffe5b4
    style Redundant fill:#f8d7da
    style Removed fill:#e2e3e5
```

---

## Timing and Thread Execution

```mermaid
gantt
    title Client Deduplication Timeline
    dateFormat SSS
    axisFormat %L ms

    section Main Thread
    Phase 1 Quick Feedback           :p1, 000, 50ms
    Phase 1.5 Deduplication Check    :p1_5, 050, 100ms
    Phase 1.6 Group Timestamp (Tentative) :p1_6, 150, 50ms

    section Stage 1
    Stage 1 Pre-filter (Metadata)    :s1, 050, 150ms
    Set preFilterComplete flag       :milestone, s1_done, 200, 0ms

    section Stage 2
    Wait for preFilterComplete       :s2_wait, 200, 100ms
    Stage 2 Hash Verification        :s2, 300, 500ms

    section Stage 2 Wrapper
    Stage 2 Wrapper Auto-trigger     :s2w, 800, 200ms
    Update groupTimestamp (Accurate) :s2w_group, 800, 100ms
    Sort queue by groupTimestamp     :s2w_sort, 900, 100ms
```

---

## Key Decision Points

### Size Comparison (Stage 1 Step 4)
```mermaid
flowchart LR
    A{Size same as<br/>previous file?} --> |No| B[Mark as Primary<br/>SKIP hashing]
    A --> |Yes| C[Continue to metadata<br/>comparison]

    style B fill:#d4edda
    style C fill:#fff3cd
```

**Optimization:** Only 10-20% of files reach Stage 2 hashing because unique sizes are eliminated early.

---

### Hash Comparison (Stage 2 Step 15)
```mermaid
flowchart LR
    A{BLAKE3 hashes match?} --> |No| B[Upgrade to Primary<br/>Actually unique content]
    A --> |Yes| C{Original status?}

    C --> |duplicate| D[Mark as Redundant<br/>Remove in next batch]
    C --> |copy| E[Keep as Copy<br/>Record metadata only]

    style B fill:#d4edda
    style D fill:#f8d7da
    style E fill:#d1ecf1
```

---

## Group Timestamp Management (Two-Step Fix)

```mermaid
sequenceDiagram
    participant Phase1_6 as Phase 1.6<br/>(Tentative)
    participant Stage2 as Stage 2<br/>(Hash Verification)
    participant Wrapper as Stage 2 Wrapper<br/>(Accurate Fix)
    participant Queue as Upload Queue

    Note over Phase1_6: PROBLEM: Runs BEFORE<br/>hashing complete

    Phase1_6->>Queue: Collect referenceFileIds<br/>from tentative duplicates
    Phase1_6->>Queue: Update groupTimestamp<br/>(tentative grouping)

    Note over Stage2: Hashing happens here

    Stage2->>Stage2: Calculate BLAKE3 hashes
    Stage2->>Stage2: Mark as redundant if<br/>hash matches

    Note over Wrapper: SOLUTION: Re-group<br/>with actual hashes

    Wrapper->>Queue: Collect VERIFIED hashes<br/>from redundant + copy files
    Wrapper->>Queue: Update groupTimestamp<br/>(accurate grouping)
    Wrapper->>Queue: Sort queue to move<br/>groups to top

    Note over Queue: Duplicate files now<br/>accurately grouped!
```

---

## File Metadata vs Hash Content

```mermaid
flowchart TD
    File[File on Disk] --> Meta[File Metadata<br/>name, size, date, path]
    File --> Content[File Content<br/>Binary data]

    Meta --> |Compared in<br/>Stage 1| Status1{Metadata<br/>Comparison}
    Content --> |Hashed in<br/>Stage 2| Hash[BLAKE3 Hash]

    Status1 --> |All match| Duplicate[Likely Duplicate<br/>Needs hash verification]
    Status1 --> |Some differ| Copy[Likely Copy<br/>Needs hash verification]
    Status1 --> |Size differs| Primary1[Primary<br/>Skip hashing]

    Duplicate --> |+ Hash match| Redundant[Redundant<br/>Remove in next batch]
    Copy --> |+ Hash match| CopyVerified[Verified Copy<br/>Record metadata only]
    Copy --> |+ Hash differs| Primary2[Primary<br/>Actually unique]
    Duplicate --> |+ Hash differs| Primary3[Primary<br/>Actually unique]

    style Meta fill:#d1ecf1
    style Content fill:#fff3cd
    style Hash fill:#ffe5b4
    style Redundant fill:#f8d7da
    style Primary1 fill:#d4edda
    style Primary2 fill:#d4edda
    style Primary3 fill:#d4edda
```

---

## Implementation Files Reference

### Core Composables
- **Phase 1, 1.5, 1.6:** `src/features/upload/composables/useUploadTable-addition.js:48-114`
- **Stage 1 & 2 Algorithms:** `src/features/upload/composables/useSequentialPrefilter.js:1-392`
- **Stage 2 Wrapper:** `src/features/upload/composables/useSequentialVerification.js:102-211`
- **Orchestrator:** `src/features/upload/composables/useUploadTableDeduplicationSequential.js:1-107`

### Key Logic Locations
- **Remove redundant (Step 3):** `useSequentialPrefilter.js:95-111`
- **Sequential comparison (Steps 4-9):** `useSequentialPrefilter.js:126-208`
- **Folder path comparison (Step 8):** `useSequentialPrefilter.js:164-205`
- **Hash verification (Steps 14-16):** `useSequentialPrefilter.js:285-368`
- **Phase 1.6 tentative grouping:** `useUploadTable-addition.js:88-114`
- **Stage 2 wrapper grouping fix:** `useSequentialVerification.js:146-188`

---

## Terminology Quick Reference

| Term | Upload to Storage? | Record Metadata? | Description |
|------|-------------------|------------------|-------------|
| **Primary** | ✅ Yes | ✅ Yes | Unique content or best version in group |
| **Copy** | ❌ No | ✅ Yes | Same hash, different meaningful metadata |
| **Duplicate** | ❌ No | ❌ No | Same hash, path variations only (no info value) |
| **Redundant** | ❌ No | ❌ No | Hash-verified duplicate awaiting removal |

---

## Notes

- **Efficiency:** Only 10-20% of files require BLAKE3 hashing due to Stage 1 metadata filtering
- **Race Condition Prevention:** Two-phase cleanup lifecycle prevents issues with rapid batch uploads
- **UI Grouping:** Two-step groupTimestamp approach (tentative + accurate) ensures proper visual grouping
- **Flexibility:** `referenceFileId` pattern allows future optimizations beyond sequential comparison
