# Deduplication Phase 1 vs Phase 2 Inconsistency Examples

## Overview
This document provides concrete user stories demonstrating how the inconsistency between Phase 1 (client-side) and Phase 2 (server-side) deduplication logic causes incorrect file classification.

**Key Issue:** Files marked as **COPY** in Phase 1 become **DUPLICATE** in Phase 2 due to Phase 2 excluding `folderPath` from metadata comparison.

---

## User Story 1: Legal Case with Different Versions

### Scenario
Attorney Sarah is working on a personal injury case. The client provided the same incident report stored in multiple locations based on who reviewed it:

### Files Being Uploaded
1. `Client Documents/Original/Incident_Report.pdf`
   - Size: 245 KB
   - Modified: 2024-01-15 10:30 AM
   - Hash: `a7f3c9d2e1b8...` (BLAKE3)

2. `Expert Review/Dr_Smith_Review/Incident_Report.pdf`
   - Size: 245 KB
   - Modified: 2024-01-15 10:30 AM
   - Hash: `a7f3c9d2e1b8...` (identical content)

3. `Defense Production/2024-03/Incident_Report.pdf`
   - Size: 245 KB
   - Modified: 2024-01-15 10:30 AM
   - Hash: `a7f3c9d2e1b8...` (identical content)

### What SHOULD Happen (Business Logic)
These are **COPIES** - identical content in different contextual locations. Each folder path provides meaningful information:
- `Client Documents/Original/` → Source from client
- `Expert Review/Dr_Smith_Review/` → Part of expert analysis
- `Defense Production/2024-03/` → Received from opposing counsel

**Expected Behavior:** Upload file once to Storage, record all 3 metadata variants to preserve discovery chain.

---

### What ACTUALLY Happens

#### Phase 1 (Client-Side) - ✅ CORRECT
```
[METADATA-FILTER] Pre-filtering files...

File 1: Client Documents/Original/Incident_Report.pdf
  Metadata key: Incident_Report.pdf_251904_1705316400000_Client Documents/Original/
  Status: READY (unique metadata group)

File 2: Expert Review/Dr_Smith_Review/Incident_Report.pdf
  Metadata key: Incident_Report.pdf_251904_1705316400000_Expert Review/Dr_Smith_Review/
  Status: READY (unique metadata group)

File 3: Defense Production/2024-03/Incident_Report.pdf
  Metadata key: Incident_Report.pdf_251904_1705316400000_Defense Production/2024-03/
  Status: READY (unique metadata group)

[HASH] Calculating hashes...
  All 3 files have same hash: a7f3c9d2e1b8...

[GROUPING] Detecting duplicates and copies...
  Hash group a7f3c9d2e1b8 has 3 files
  3 different metadata groups (folderPath differs)

  chooseBestFile() priority:
    1. Earliest modified: All equal (2024-01-15 10:30 AM)
    2. Longest folder path:
       - File 1: 28 chars (Client Documents/Original/)
       - File 2: 34 chars (Expert Review/Dr_Smith_Review/) ← WINNER
       - File 3: 25 chars (Defense Production/2024-03/)

  Result:
    - File 2 → PRIMARY (will upload to Storage)
    - File 1 → COPY (metadata only)
    - File 3 → COPY (metadata only)
```

**Phase 1 Status:** ✅ CORRECT
- 1 file marked for upload
- 2 files marked as COPY (metadata-only)

---

#### Phase 2 (Server-Side) - ❌ INCORRECT

```
[UPLOAD] Processing File 2 (PRIMARY)
  Hash: a7f3c9d2e1b8...
  Check Firestore: Not found
  Check Storage: Not found
  → UPLOADING to Storage
  → Creating Evidence document

  Metadata hash generation:
    Input: "Incident_Report.pdf|1705316400000|a7f3c9d2e1b8..."
    Output: "m1_abc123def456" (xxHash)

  Created:
    - Storage file: gs://.../evidence/a7f3c9d2e1b8...
    - Evidence doc: /evidence/a7f3c9d2e1b8...
    - Metadata doc: /evidence/a7f3c9d2e1b8.../sourceMetadata/m1_abc123def456
    - Embedded variant: sourceMetadataVariants.m1_abc123def456

[COPY] Processing File 1 (COPY from Phase 1)
  Hash: a7f3c9d2e1b8... (already exists)

  Metadata hash generation:
    Input: "Incident_Report.pdf|1705316400000|a7f3c9d2e1b8..."
    Output: "m1_abc123def456" (SAME HASH - folderPath not included!)

  Check: /evidence/a7f3c9d2e1b8.../sourceMetadata/m1_abc123def456
    → EXISTS
    → Uploaded by: sarah@lawfirm.com
    → Current user: sarah@lawfirm.com

  Result: DUPLICATE - Skip (no metadata created)
  ❌ WRONG! Should be COPY - folderPath is different!

[COPY] Processing File 3 (COPY from Phase 1)
  Same as File 1...
  Result: DUPLICATE - Skip (no metadata created)
  ❌ WRONG! Should be COPY - folderPath is different!
```

**Phase 2 Status:** ❌ INCORRECT
- File 1 metadata **LOST** (marked duplicate due to same user + same metadata hash)
- File 3 metadata **LOST** (marked duplicate due to same user + same metadata hash)

---

### Impact on Sarah's Case

**What Sarah Expected:**
When viewing the document in the Organizer, she can see:
```
Incident_Report.pdf
  Source Files (3):
    ✓ Client Documents/Original/Incident_Report.pdf
    ✓ Expert Review/Dr_Smith_Review/Incident_Report.pdf
    ✓ Defense Production/2024-03/Incident_Report.pdf
```

**What Sarah Actually Gets:**
```
Incident_Report.pdf
  Source Files (1):
    ✓ Expert Review/Dr_Smith_Review/Incident_Report.pdf
```

**Legal Consequences:**
- ❌ No record that document came from client's original production
- ❌ No record that same document was in defense production
- ❌ Discovery chain broken - can't prove document provenance
- ❌ Potential sanctions if opposing counsel questions document authenticity

---

## User Story 2: Corporate Investigation - Time-Based Versions

### Scenario
Compliance officer Marcus is investigating potential fraud. The suspect's computer had the same document in multiple locations with different modification dates (document opened/viewed but not changed).

### Files Being Uploaded
1. `Desktop/Q4_Report.xlsx`
   - Size: 1.2 MB
   - Modified: **2024-10-01 08:15 AM** (original creation)
   - Hash: `b3f8a1c5d9e2...`

2. `Recent Items/Q4_Report.xlsx`
   - Size: 1.2 MB
   - Modified: **2024-11-15 03:22 PM** (accessed during investigation period)
   - Hash: `b3f8a1c5d9e2...` (identical content)

3. `USB Backup/Q4_Report.xlsx`
   - Size: 1.2 MB
   - Modified: **2024-11-20 11:45 PM** (copied after subpoena served)
   - Hash: `b3f8a1c5d9e2...` (identical content)

---

### What SHOULD Happen

These are **COPIES** - the modification date differences are CRITICAL forensic evidence:
- Oct 1 → Original creation (before fraud period)
- Nov 15 → Accessed during investigation period (suspicious)
- Nov 20 → Copied to USB after subpoena (potential spoliation evidence!)

**Expected:** Upload once, preserve all 3 metadata variants with different timestamps.

---

### What ACTUALLY Happens

#### Phase 1 (Client-Side) - ✅ CORRECT

```
[METADATA-FILTER] Pre-filtering files...

File 1: Desktop/Q4_Report.xlsx
  Metadata key: Q4_Report.xlsx_1258291_1727769300000_Desktop/
  Status: READY

File 2: Recent Items/Q4_Report.xlsx
  Metadata key: Q4_Report.xlsx_1258291_1729873320000_Recent Items/
  Status: READY (different lastModified!)

File 3: USB Backup/Q4_Report.xlsx
  Metadata key: Q4_Report.xlsx_1258291_1732147500000_USB Backup/
  Status: READY (different lastModified!)

[HASH] All have same hash: b3f8a1c5d9e2...

[GROUPING] 3 different metadata groups (different lastModified timestamps)

  chooseBestFile() priority:
    1. Earliest modified:
       - File 1: 1727769300000 (Oct 1) ← WINNER (earliest = most authoritative)
       - File 2: 1729873320000 (Nov 15)
       - File 3: 1732147500000 (Nov 20)

  Result:
    - File 1 → PRIMARY (upload to Storage)
    - File 2 → COPY (metadata only)
    - File 3 → COPY (metadata only)
```

**Phase 1:** ✅ Correctly identified 3 different metadata variants

---

#### Phase 2 (Server-Side) - ✅ CORRECT (Different Scenario!)

**Wait... this scenario actually works correctly in Phase 2!**

```
[UPLOAD] File 1 (PRIMARY)
  Metadata hash: "Q4_Report.xlsx|1727769300000|b3f8a1c5d9e2..." → "m2_xyz789abc"

[COPY] File 2
  Metadata hash: "Q4_Report.xlsx|1729873320000|b3f8a1c5d9e2..." → "m2_def456ghi"
  (Different hash due to different lastModified!)
  → Creates metadata variant ✓

[COPY] File 3
  Metadata hash: "Q4_Report.xlsx|1732147500000|b3f8a1c5d9e2..." → "m2_jkl789mno"
  (Different hash due to different lastModified!)
  → Creates metadata variant ✓
```

**Why it works here:** Phase 2's metadata hash **INCLUDES** `lastModified`, which differs between the files.

**But this reveals the inconsistency:**
- Phase 2 treats `lastModified` as meaningful (includes in hash)
- Phase 2 treats `folderPath` as meaningless (excludes from hash)
- **This is arbitrary and inconsistent with Phase 1's logic!**

---

## User Story 3: Multi-User Upload - Same Session

### Scenario
Law firm partners John and Emily are both uploading discovery documents from a shared case folder. They unknowingly both upload the same file in the same upload session.

### Files Being Uploaded (Single Session)
1. **John's upload:**
   `Shared/Discovery/Exhibit_A.pdf`
   - Size: 500 KB
   - Modified: 2024-06-10 2:00 PM
   - Hash: `c7d9e2f1a3b5...`

2. **Emily's upload (different path):**
   `My Documents/Case Files/Important/Exhibit_A.pdf`
   - Size: 500 KB
   - Modified: 2024-06-10 2:00 PM
   - Hash: `c7d9e2f1a3b5...` (same file)

---

### What SHOULD Happen

These are **COPIES** - same file from different user contexts:
- John's path: `Shared/Discovery/` (official discovery folder)
- Emily's path: `My Documents/Case Files/Important/` (Emily's working copy)

**Expected:** Upload once, record both metadata variants showing both users uploaded it.

---

### What ACTUALLY Happens

#### Phase 1 (Client-Side) - ✅ CORRECT

```
[METADATA-FILTER] Pre-filtering files...

File 1 (John): Shared/Discovery/Exhibit_A.pdf
  Metadata key: Exhibit_A.pdf_512000_1718028000000_Shared/Discovery/
  Status: READY

File 2 (Emily): My Documents/Case Files/Important/Exhibit_A.pdf
  Metadata key: Exhibit_A.pdf_512000_1718028000000_My Documents/Case Files/Important/
  Status: READY (different folderPath)

[HASH] Same hash: c7d9e2f1a3b5...

[GROUPING] 2 metadata groups

  chooseBestFile():
    Priority 2 (Longest folder path):
      - File 1: 17 chars (Shared/Discovery/)
      - File 2: 35 chars (My Documents/Case Files/Important/) ← WINNER

  Result:
    - File 2 (Emily) → PRIMARY
    - File 1 (John) → COPY
```

---

#### Phase 2 (Server-Side) - ❌ INCORRECT

```
[UPLOAD] File 2 - Emily (PRIMARY)
  User: emily@lawfirm.com
  Metadata hash: "Exhibit_A.pdf|1718028000000|c7d9e2f1a3b5..." → "m3_abc123"
  → Creates Evidence doc with uploadedBy: emily@lawfirm.com

[COPY] File 1 - John (COPY from Phase 1)
  User: john@lawfirm.com (different user!)
  Metadata hash: "Exhibit_A.pdf|1718028000000|c7d9e2f1a3b5..." → "m3_abc123"

  Check existing metadata m3_abc123:
    uploadedBy: emily@lawfirm.com
    currentUser: john@lawfirm.com
    → Different users! ✓

  Result: Creates COPY metadata variant ✓

  BUT WAIT... the folder path is LOST!

  Created metadata only shows:
    sourceFileName: Exhibit_A.pdf
    sourceLastModified: 1718028000000
    sourceFolderPath: "My Documents/Case Files/Important/" (Emily's path)
    uploadedBy: john@lawfirm.com

  ❌ John's actual folder path "Shared/Discovery/" is LOST!
  ❌ Replaced with Emily's path from the Evidence document
```

**The Problem:**
Phase 2's `createCopyMetadataRecord` (useUploadProcessor.js:168) doesn't have access to the original folderPath from the queue item! It only knows:
- `queueFile.name` → "Exhibit_A.pdf"
- `queueFile.sourceLastModified` → 1718028000000
- `queueFile.hash` → c7d9e2f1a3b5

The `queueFile.folderPath` exists but **isn't used in metadata hash generation**, so when checking for existing metadata, it can't distinguish between different folder paths.

---

## User Story 4: Re-Upload After Database Wipe

### Scenario
Development team wipes the Firestore database for testing. Attorney Lisa re-uploads files she previously uploaded. Some files are in new folders due to reorganization.

### Files Previously Uploaded (Original Session - Lost in Wipe)
1. `2024 Cases/Smith v Jones/Complaint.pdf`
   - Metadata hash: `m4_original123`

### Files Being Re-Uploaded (New Session - After Reorganization)
1. `Active Litigation/Smith v Jones/Complaint.pdf`
   - Size: 750 KB
   - Modified: 2024-03-15 9:00 AM
   - Hash: `d8e1f2a4b6c7...`

2. `Archive/Filed Complaints/Complaint.pdf`
   - Size: 750 KB
   - Modified: 2024-03-15 9:00 AM
   - Hash: `d8e1f2a4b6c7...` (same file, archived)

---

### What SHOULD Happen

After database wipe, Storage files still exist (not wiped). Re-uploading should:
1. Detect file exists in Storage (skip upload)
2. Recreate Evidence document
3. Create metadata for both folder paths as COPIES

---

### What ACTUALLY Happens

#### Phase 1 - ✅ CORRECT

```
File 1: Active Litigation/Smith v Jones/Complaint.pdf
  Status: READY

File 2: Archive/Filed Complaints/Complaint.pdf
  Status: READY (different folderPath)

[GROUPING]
  Result:
    - File 1 → PRIMARY (longer path)
    - File 2 → COPY
```

---

#### Phase 2 - ❌ INCORRECT

```
[UPLOAD] File 1 (PRIMARY)
  Check Storage: EXISTS (from before wipe) ✓
  Check Firestore: NOT EXISTS (was wiped)

  Metadata hash: "Complaint.pdf|1710496800000|d8e1f2a4b6c7..." → "m4_new456"

  Creates:
    - Evidence doc (recreated)
    - Metadata m4_new456
    - sourceFolderPath: "Active Litigation/Smith v Jones/"

[COPY] File 2 (COPY from Phase 1)
  Current user: lisa@lawfirm.com

  Metadata hash: "Complaint.pdf|1710496800000|d8e1f2a4b6c7..." → "m4_new456"
  (SAME HASH - folderPath not included!)

  Check existing metadata m4_new456:
    uploadedBy: lisa@lawfirm.com
    currentUser: lisa@lawfirm.com
    → Same user! ❌

  Result: DUPLICATE - Skip

  ❌ Archive folder path LOST!
```

**Impact:**
Lisa reorganized her files, moving some to Archive. This organizational context is lost because Phase 2 thinks it's a duplicate upload by the same user.

---

## Summary Table: Phase 1 vs Phase 2 Behavior

| User Story | Files | Phase 1 Result | Phase 2 Result | Data Lost |
|------------|-------|----------------|----------------|-----------|
| **1. Legal Case** | 3 files, different folders, same content/metadata | 1 PRIMARY<br>2 COPY ✅ | 1 PRIMARY<br>2 DUPLICATE ❌ | 2 folder paths |
| **2. Forensic Timestamps** | 3 files, different modified dates | 1 PRIMARY<br>2 COPY ✅ | 1 PRIMARY<br>2 COPY ✅ | None (works!) |
| **3. Multi-User** | 2 files, different users, different folders | 1 PRIMARY<br>1 COPY ✅ | 1 PRIMARY<br>1 COPY ⚠️ | Folder path replaced |
| **4. Re-Upload** | 2 files, same user, reorganized folders | 1 PRIMARY<br>1 COPY ✅ | 1 PRIMARY<br>1 DUPLICATE ❌ | 1 folder path |

---

## Root Cause Summary

### Phase 1 Metadata Grouping
**File:** `src/features/upload/composables/deduplication/detection.js:17`
```javascript
const metadataKey = `${queueItem.name}_${queueItem.size}_${queueItem.sourceLastModified}_${queueItem.folderPath}`;
```
**Includes:** name, size, lastModified, **folderPath** ✅

### Phase 2 Metadata Hash
**File:** `src/features/upload/composables/useFileMetadata.js:33`
```javascript
const metadataString = `${sourceFileName}|${lastModified}|${fileHash}`;
```
**Includes:** sourceFileName, lastModified, fileHash
**Missing:** **folderPath** ❌

### Consequence
**Same metadata hash** → Phase 2 thinks it's a duplicate
**Different folder paths** → Phase 1 correctly identifies as copies

**Result:** Files classified as COPY in Phase 1 are incorrectly marked as DUPLICATE in Phase 2, causing metadata loss.
