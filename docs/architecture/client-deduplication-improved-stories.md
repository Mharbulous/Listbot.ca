# Client-Side Deduplication: User Stories & Analysis

## Executive Summary

This document contains user stories to validate whether the "improved" deduplication logic is actually an improvement over the original implementation. These stories test all edge cases and interaction patterns to ensure behavioral equivalence while evaluating the claimed enhancements.

## Critical Analysis: Is It Actually Improved?

### Core Deduplication Logic Comparison

**Original Logic Flow:**
1. Group by size → Hash duplicates → Group by hash
2. For same-hash files: Group by metadata (name_size_lastModified)
3. If one metadata group: Keep first instance (one-and-the-same)
4. If multiple metadata groups: Choose best file, mark others as `isDuplicate = true`

**"Improved" Logic Flow:**
1. Group by size → Hash duplicates → Group by hash
2. For same-hash files: Check metadata
3. Same metadata → "same-file" status, keep first
4. Different metadata → "content-match" status, choose best file

**Key Observation:** The core deduplication algorithm appears **identical**. The main differences are:
- **Status naming**: More descriptive status names (`same-file`, `content-match` vs. `isDuplicate`)
- **Added features**: Database check, user preview, override capability
- **UX improvements**: Progress feedback, metrics, better visibility

### What's Actually "Improved"?

✅ **Genuine Improvements:**
1. **Database Check Phase**: Checking Firestore for existing files before upload is new functionality
2. **User Control**: Preview/review screen with override capability
3. **Progress Feedback**: Incremental hashing with progress indicators
4. **Better Status Tracking**: More granular status names for clarity
5. **Metrics Display**: Showing deduplication savings and statistics

⚠️ **Potentially Problematic Changes:**
1. **User Override**: Allowing users to override deduplication could lead to:
   - Duplicate uploads if user doesn't understand the logic
   - Increased storage costs
   - Confusion about which file is "canonical"
2. **Database Check Timing**: Checking database AFTER hashing means:
   - All files are hashed even if they exist in DB
   - Could check DB earlier based on size alone (but this would miss hash collisions)
3. **Complexity**: More statuses and phases mean more potential for bugs

### Behavioral Equivalence Question

**The critical question:** Does the improved logic produce the same final results as the original logic?

Based on the mermaid diagrams:
- **One-and-the-same detection**: ✅ Same (select first instance)
- **Copy detection**: ✅ Same (apply priority rules)
- **Priority rules**: ⚠️ Not explicitly shown in improved diagram
- **Final file selection**: ⚠️ Unclear if user override changes this

---

## User Story Categories

1. **Basic Deduplication**: Simple cases with unique files and copies
2. **One-and-the-Same**: Same file selected multiple times
3. **Priority Rules**: Testing the 5-tier priority system
4. **Database Interaction**: Files that already exist in Firestore
5. **User Override**: How user choices affect final results
6. **Edge Cases**: Error conditions, large file sets, cancellation

---

## Story Format

Each story follows this structure:
- **Scenario**: Description of the user action
- **Initial State**: Files selected by user
- **Expected Original Behavior**: What current system does
- **Expected Improved Behavior**: What new system should do
- **Equivalence Check**: Are the final uploaded files the same?
- **Validation Points**: Specific things to verify

---

## Category 1: Basic Deduplication

### Story 1.1: All Unique Files

**Scenario:** User selects 5 files with completely different content and sizes.

**Initial State:**
```
File A: report.pdf (1.5 MB, modified: 2024-01-15, hash: abc123...)
File B: invoice.xlsx (850 KB, modified: 2024-02-01, hash: def456...)
File C: photo.jpg (3.2 MB, modified: 2024-03-10, hash: 789ghi...)
File D: contract.docx (450 KB, modified: 2024-01-20, hash: jkl012...)
File E: memo.txt (12 KB, modified: 2024-02-15, hash: mno345...)
```

**Expected Original Behavior:**
- All 5 files grouped by size → all unique sizes
- No hashing needed
- All 5 marked as `status: ready`
- All 5 uploaded to Storage

**Expected Improved Behavior:**
- Phase 1: All 5 marked as `status: unique` (no hashing needed)
- Phase 2: Skipped (no copy candidates)
- Phase 3: Database check for all 5 hashes
  - Assuming none exist: All marked `status: ready-to-upload`
- Preview screen: Shows 5 files ready for upload
- User confirms: All 5 uploaded

**Equivalence Check:** ✅ Both systems upload all 5 files

**Validation Points:**
- ✓ No hashing occurs in either system (size-based optimization)
- ✓ Database check is additional step in improved system
- ✓ Final result identical

---

### Story 1.2: Two Copies (Different Metadata)

**Scenario:** User selects same document from two different folders with different names.

**Initial State:**
```
File A: /Desktop/project/final_report.pdf (1.5 MB, modified: 2024-01-15, hash: abc123...)
File B: /Documents/backup/report_v2.pdf (1.5 MB, modified: 2024-01-16, hash: abc123...)
```

**Expected Original Behavior:**
1. Both files have same size → hash both
2. Both have same hash → group by metadata key
3. Metadata keys differ (different name and modified date)
4. Choose best file using priority rules:
   - Priority 1 (earliest modified): File A wins (2024-01-15)
5. File A: `status: ready`
6. File B: `isDuplicate: true`, `status: uploadMetadataOnly`
7. Upload: File A to Storage, File B metadata only

**Expected Improved Behavior:**
1. Phase 1: Both same size → mark as `status: analyzing`
2. Phase 2: Hash both → same hash → check metadata
3. Metadata differs → `duplicate: content-match`
4. Apply priority rules: File A chosen as best
5. File A: `status: best`
6. File B: `status: available-copy`
7. Phase 3: Database check
   - File A hash not in DB → `status: ready-to-upload`
   - File B references File A → `status: metadata-only`
8. Preview screen: Shows File A for upload, File B as copy
9. User confirms: File A to Storage, File B metadata only

**Equivalence Check:** ✅ Both systems upload File A and metadata for File B

**Validation Points:**
- ✓ Priority rule 1 (earliest modified) correctly applied
- ✓ Final uploaded content identical
- ✓ Improved system shows more detailed status
- ? Does improved system allow user to override and pick File B instead?

---

### Story 1.3: Three Copies (Different Metadata)

**Scenario:** User has same document in three locations with different names and dates.

**Initial State:**
```
File A: /Desktop/draft.pdf (2 MB, modified: 2024-01-10, hash: xyz789...)
File B: /Documents/draft_final.pdf (2 MB, modified: 2024-01-12, hash: xyz789...)
File C: /Backup/document.pdf (2 MB, modified: 2024-01-08, hash: xyz789...)
```

**Expected Original Behavior:**
1. All same size → hash all three
2. All same hash → group by metadata
3. All have different metadata keys (different names/dates)
4. Choose best file:
   - Priority 1 (earliest modified): File C wins (2024-01-08)
5. File C: `status: ready`
6. Files A & B: `isDuplicate: true`, `status: uploadMetadataOnly`
7. Upload: File C to Storage, A & B metadata only

**Expected Improved Behavior:**
1. Phase 1: All same size → `status: analyzing`
2. Phase 2: Hash all → same hash → `duplicate: content-match`
3. Priority rules: File C wins (earliest modified)
4. File C: `status: best`
5. Files A & B: `status: available-copy`
6. Phase 3: Database check → File C not in DB
7. Preview: File C for upload, A & B as copies
8. User confirms: File C to Storage, A & B metadata only

**Equivalence Check:** ✅ Both systems upload File C and metadata for A & B

**Validation Points:**
- ✓ Correct file chosen by priority rules
- ✓ All three metadata records created in Firestore
- ✓ Only one file uploaded to Storage
- ? What if user wants to override and upload File A instead?

---

## Category 2: One-and-the-Same Detection

### Story 2.1: Same File Selected Twice

**Scenario:** User accidentally selects the same file twice from file picker.

**Initial State:**
```
File A (instance 1): /Desktop/report.pdf (1.5 MB, modified: 2024-01-15, hash: abc123...)
File A (instance 2): /Desktop/report.pdf (1.5 MB, modified: 2024-01-15, hash: abc123...)
```

**Expected Original Behavior:**
1. Both same size → hash both
2. Both same hash → group by metadata key
3. Metadata key identical: `report.pdf_1500000_1705305600000`
4. One-and-the-same detected: Keep first instance only
5. File A (instance 1): `status: ready`
6. File A (instance 2): Silently filtered (not in upload queue)
7. Upload: Only one instance to Storage

**Expected Improved Behavior:**
1. Phase 1: Both same size → `status: analyzing`
2. Phase 2: Hash both → same hash → check metadata
3. Metadata identical → `duplicate: same-file`
4. Auto-select first instance
5. File A (instance 1): `status: selected`
6. File A (instance 2): `status: ignored`
7. Phase 3: Database check
8. Preview: Shows only one instance, indicates duplicate selection
9. User confirms: One file to Storage

**Equivalence Check:** ✅ Both systems upload only one instance

**Validation Points:**
- ✓ Duplicate selection detected correctly
- ✓ Only one file uploaded
- ✓ User not confused by seeing duplicate in queue
- ✓ Improved system explicitly shows "ignored" status

---

### Story 2.2: Same File Selected Three Times

**Scenario:** User selects same file three times (perhaps from different file picker sessions).

**Initial State:**
```
File A (instance 1): /Desktop/memo.txt (5 KB, modified: 2024-02-01, hash: def456...)
File A (instance 2): /Desktop/memo.txt (5 KB, modified: 2024-02-01, hash: def456...)
File A (instance 3): /Desktop/memo.txt (5 KB, modified: 2024-02-01, hash: def456...)
```

**Expected Original Behavior:**
1. All same size → hash all
2. All same hash and metadata → one-and-the-same group
3. Keep first instance only
4. File A (instance 1): `status: ready`
5. Instances 2 & 3: Silently filtered
6. Upload: One file to Storage

**Expected Improved Behavior:**
1. Phase 1-2: Hash all → same hash and metadata
2. `duplicate: same-file` for all
3. Instance 1: `status: selected`
4. Instances 2 & 3: `status: ignored`
5. Preview: Shows selection pattern clearly
6. User confirms: One file to Storage

**Equivalence Check:** ✅ Both systems upload only one instance

**Validation Points:**
- ✓ All duplicate selections filtered
- ✓ No confusion about multiple selections
- ? Does improved system warn user about duplicate selections?

---

### Story 2.3: Mixed - One-and-the-Same + Copies

**Scenario:** User has one file selected twice AND a copy with different metadata.

**Initial State:**
```
File A (instance 1): /Desktop/contract.pdf (500 KB, modified: 2024-01-10, hash: ghi789...)
File A (instance 2): /Desktop/contract.pdf (500 KB, modified: 2024-01-10, hash: ghi789...)
File B: /Documents/contract_signed.pdf (500 KB, modified: 2024-01-15, hash: ghi789...)
```

**Expected Original Behavior:**
1. All same size → hash all three
2. All same hash → group by metadata
3. Two metadata groups:
   - Group 1 (instances 1 & 2): Same metadata → keep instance 1
   - Group 2 (File B): Different metadata
4. Choose best between instance 1 and File B:
   - Priority 1 (earliest modified): Instance 1 wins (2024-01-10)
5. Instance 1: `status: ready`
6. File B: `isDuplicate: true`, `status: uploadMetadataOnly`
7. Instance 2: Silently filtered
8. Upload: Instance 1 to Storage, File B metadata only

**Expected Improved Behavior:**
1. Phase 1-2: Hash all → same hash
2. Instances 1 & 2: `duplicate: same-file` → keep instance 1
3. File B: `duplicate: content-match` vs. instance 1
4. Priority rules: Instance 1 wins (earliest modified)
5. Instance 1: `status: ready-to-upload`
6. Instance 2: `status: ignored`
7. File B: `status: available-copy`
8. Preview: Shows instance 1 for upload, File B as copy, instance 2 ignored
9. User confirms: Instance 1 to Storage, File B metadata only

**Equivalence Check:** ✅ Both systems upload instance 1 and metadata for File B

**Validation Points:**
- ✓ One-and-the-same detection works alongside copy detection
- ✓ Correct file chosen by priority rules
- ✓ Duplicate selection silently filtered
- ✓ Final result identical

---

## Category 3: Priority Rules Testing

### Story 3.1: Priority Rule 1 - Earliest Modified Date

**Scenario:** Two copies with different modification dates.

**Initial State:**
```
File A: /Folder/doc_new.pdf (1 MB, modified: 2024-02-15, hash: aaa111...)
File B: /Folder/doc_old.pdf (1 MB, modified: 2024-01-01, hash: aaa111...)
```

**Expected Original Behavior:**
- Both same hash, different metadata
- Priority 1: File B wins (earlier date: 2024-01-01)
- File B: `status: ready`
- File A: `isDuplicate: true`

**Expected Improved Behavior:**
- `duplicate: content-match`
- Priority rules: File B wins
- File B: `status: ready-to-upload`
- File A: `status: available-copy`

**Equivalence Check:** ✅ Both upload File B

**Validation Points:**
- ✓ Earliest modified date correctly prioritized
- ? Does improved system explain WHY File B was chosen in the UI?

---

### Story 3.2: Priority Rule 2 - Longest Folder Path

**Scenario:** Two copies with same modified date but different folder depths.

**Initial State:**
```
File A: /Documents/report.pdf (1 MB, modified: 2024-01-15, hash: bbb222...)
File B: /Documents/Projects/2024/Q1/report.pdf (1 MB, modified: 2024-01-15, hash: bbb222...)
```

**Expected Original Behavior:**
- Same hash, same modified date
- Priority 2: File B wins (longer path)
- File B: `status: ready`
- File A: `isDuplicate: true`

**Expected Improved Behavior:**
- `duplicate: content-match`
- Priority rules: File B wins (longer path)
- File B: `status: ready-to-upload`
- File A: `status: available-copy`

**Equivalence Check:** ✅ Both upload File B

**Validation Points:**
- ✓ Longer folder path correctly prioritized
- ✓ Assumption: Deeper files are more organized

---

### Story 3.3: Priority Rule 3 - Shortest Filename

**Scenario:** Two copies in same folder, same date, different filename lengths.

**Initial State:**
```
File A: /Folder/report_with_very_long_descriptive_name.pdf (1 MB, modified: 2024-01-15, hash: ccc333...)
File B: /Folder/report.pdf (1 MB, modified: 2024-01-15, hash: ccc333...)
```

**Expected Original Behavior:**
- Same hash, same date, same folder depth
- Priority 3: File B wins (shorter name)
- File B: `status: ready`
- File A: `isDuplicate: true`

**Equivalence Check:** ✅ Both upload File B

**Validation Points:**
- ✓ Shortest filename correctly prioritized
- ✓ Assumption: Concise names are preferred

---

### Story 3.4: Priority Rule 4 - Alphanumeric Sort

**Scenario:** Two copies with same date, folder, and name length.

**Initial State:**
```
File A: /Folder/report_v2.pdf (1 MB, modified: 2024-01-15, hash: ddd444...)
File B: /Folder/report_v1.pdf (1 MB, modified: 2024-01-15, hash: ddd444...)
```

**Expected Original Behavior:**
- Same hash, date, folder depth, name length
- Priority 4: File B wins (alphabetically first)
- File B: `status: ready`
- File A: `isDuplicate: true`

**Equivalence Check:** ✅ Both upload File B

**Validation Points:**
- ✓ Alphanumeric sort correctly applied
- ✓ Stable, predictable ordering

---

### Story 3.5: Priority Rule 5 - Selection Order

**Scenario:** Two identical copies, user selects File A first, then File B.

**Initial State:**
```
File A: /Folder1/document.pdf (1 MB, modified: 2024-01-15, originalIndex: 0, hash: eee555...)
File B: /Folder2/document.pdf (1 MB, modified: 2024-01-15, originalIndex: 1, hash: eee555...)
```

**Expected Original Behavior:**
- All other priorities equal
- Priority 5: File A wins (selected first)
- File A: `status: ready`
- File B: `isDuplicate: true`

**Expected Improved Behavior:**
- Priority rules: File A wins (originalIndex: 0)
- File A: `status: ready-to-upload`
- File B: `status: available-copy`

**Equivalence Check:** ✅ Both upload File A

**Validation Points:**
- ✓ Selection order preserved as tiebreaker
- ✓ Deterministic behavior

---

### Story 3.6: All Priority Rules Combined

**Scenario:** Complex case exercising multiple priority rules.

**Initial State:**
```
File A: /a/report.pdf (1 MB, modified: 2024-01-15, originalIndex: 0, hash: fff666...)
File B: /a/b/report.pdf (1 MB, modified: 2024-01-14, originalIndex: 1, hash: fff666...)
File C: /a/report_copy.pdf (1 MB, modified: 2024-01-14, originalIndex: 2, hash: fff666...)
```

**Expected Original Behavior:**
1. All same hash → compare priorities:
   - File B vs. File C: B wins on Priority 2 (longer path)
   - File B vs. File A: B wins on Priority 1 (earlier date)
2. File B: `status: ready`
3. Files A & C: `isDuplicate: true`

**Expected Improved Behavior:**
- Priority analysis: File B wins
- File B: `status: ready-to-upload`
- Files A & C: `status: available-copy`

**Equivalence Check:** ✅ Both upload File B

**Validation Points:**
- ✓ Priority rules applied in correct order
- ✓ Earlier modified date (Priority 1) overrides all other factors

---

## Category 4: Database Interaction (New in Improved)

### Story 4.1: File Already Exists in Database

**Scenario:** User uploads a file that already exists in Firestore.

**Initial State:**
```
File A: /Desktop/invoice.pdf (800 KB, modified: 2024-02-01, hash: ggg777...)
Database: Document with hash ggg777... already exists
```

**Expected Original Behavior:**
- Original system does NOT check database during client-side processing
- File A: `status: ready`
- Upload attempted to Storage
- **QUESTION:** What happens when Storage upload encounters existing file?
  - Does Firebase Storage overwrite?
  - Does Firestore document creation fail due to duplicate hash ID?

**Expected Improved Behavior:**
1. Phase 1-2: File A marked as `status: unique`
2. Phase 3: Database check finds existing hash
3. File A: `status: already-uploaded`
4. Preview: Shows "Existing file found" message
5. User confirms: Only update metadata, add new source reference
6. No Storage upload occurs

**Equivalence Check:** ⚠️ **NOT EQUIVALENT** - Improved system avoids redundant upload

**Validation Points:**
- ✓ Improved system saves bandwidth by skipping upload
- ✓ Metadata still updated to track new source location
- ? How does original system handle this case currently?
- ? Does this change the document ID structure in Firestore?

---

### Story 4.2: Multiple Files, Some Exist in Database

**Scenario:** User uploads 3 files, one already exists in database.

**Initial State:**
```
File A: /Desktop/doc1.pdf (1 MB, modified: 2024-01-10, hash: hhh888...)
File B: /Desktop/doc2.pdf (1.5 MB, modified: 2024-02-15, hash: iii999...)
File C: /Desktop/doc3.pdf (2 MB, modified: 2024-03-01, hash: jjj000...)
Database: Document with hash iii999... (File B) already exists
```

**Expected Original Behavior:**
- All three files: `status: ready`
- All three uploaded to Storage
- File B upload: **Unknown behavior** when hash exists

**Expected Improved Behavior:**
1. Phase 1-2: All unique, proceed to Phase 3
2. Phase 3: Database check finds File B exists
3. File A: `status: ready-to-upload`
4. File B: `status: already-uploaded`
5. File C: `status: ready-to-upload`
6. Preview: Shows File B as existing
7. Upload: Files A & C to Storage, File B metadata update only

**Equivalence Check:** ⚠️ **UNCLEAR** - Depends on original behavior with existing files

**Validation Points:**
- ✓ Improved system handles partial matches correctly
- ? Original system behavior needs clarification

---

### Story 4.3: Copy Where Best File Exists in Database

**Scenario:** User uploads two copies, the "best" one already exists in database.

**Initial State:**
```
File A: /Desktop/old.pdf (1 MB, modified: 2024-01-01, hash: kkk111...)
File B: /Desktop/new.pdf (1 MB, modified: 2024-02-15, hash: kkk111...)
Database: Document with hash kkk111... already exists
```

**Expected Original Behavior:**
- File A chosen as best (earlier date)
- File A: `status: ready`
- File B: `isDuplicate: true`, `status: uploadMetadataOnly`
- Upload: File A to Storage (but hash exists?), File B metadata

**Expected Improved Behavior:**
1. Phase 1-2: Copies detected, File A chosen as best
2. Phase 3: Database check finds hash exists
3. File A: `status: already-uploaded`
4. File B: `status: available-copy`
5. Preview: Shows both as referencing existing file
6. Upload: Both metadata updated, no Storage upload

**Equivalence Check:** ⚠️ **POTENTIALLY DIFFERENT** - Improved system may handle this more gracefully

**Validation Points:**
- ✓ Improved system recognizes no upload needed
- ? Does original system upload File A even though it exists?
- ? Does Firestore reject duplicate document ID (hash)?

---

## Category 5: User Override (New in Improved)

### Story 5.1: User Overrides Best File Choice

**Scenario:** System chooses File A as best, but user prefers File B.

**Initial State:**
```
File A: /Desktop/report_old.pdf (1 MB, modified: 2024-01-01, hash: lll222...)
File B: /Desktop/report_new.pdf (1 MB, modified: 2024-02-15, hash: lll222...)
System choice: File A (earlier date wins)
```

**Expected Original Behavior:**
- File A: `status: ready`
- File B: `isDuplicate: true`
- No user override capability
- Upload: File A to Storage, File B metadata only

**Expected Improved Behavior:**
1. Phase 1-3: File A chosen as best, File B as copy
2. Preview: Shows File A as selected, File B as available
3. **User action:** Clicks File B to override
4. File A: `status: available-copy`
5. File B: `status: ready-to-upload`
6. Upload: File B to Storage, File A metadata only

**Equivalence Check:** ❌ **NOT EQUIVALENT** - Different file uploaded

**Validation Points:**
- ⚠️ User override changes which file is uploaded
- ⚠️ This is a NEW capability not in original system
- ? Should this be allowed? What's the use case?
- ? Could this lead to user confusion or mistakes?
- ✓ Gives users control, but at cost of complexity

---

### Story 5.2: User Chooses to Upload Multiple Copies

**Scenario:** System identifies copies, but user wants to upload both.

**Initial State:**
```
File A: /Projects/2023/final.pdf (1 MB, modified: 2024-01-15, hash: mmm333...)
File B: /Projects/2024/final.pdf (1 MB, modified: 2024-01-15, hash: mmm333...)
System: Detects as copies (same hash)
```

**Expected Original Behavior:**
- One file chosen as best, other marked as duplicate
- No way to upload both
- Upload: One file to Storage, one metadata only

**Expected Improved Behavior:**
1. Preview: Shows File A as best, File B as copy
2. **User action:** Overrides to upload both
3. Both: `status: ready-to-upload`
4. Upload: Both to Storage

**Equivalence Check:** ❌ **NOT EQUIVALENT** - Two files uploaded instead of one

**Validation Points:**
- ⚠️ **CRITICAL ISSUE**: Uploading both violates deduplication goal
- ⚠️ Both files have same hash → same document ID in Firestore
- ❌ **THIS WOULD FAIL**: Can't create two documents with same ID
- 🔴 **IMPROVED LOGIC HAS A FLAW HERE**

**Conclusion:** User should NOT be able to upload multiple copies with same hash to Storage, as they share the same document ID. Override should only allow choosing WHICH copy to upload, not uploading ALL copies.

---

### Story 5.3: User Overrides "Already Uploaded" Status

**Scenario:** System detects file exists in database, user wants to upload anyway.

**Initial State:**
```
File A: /Desktop/document.pdf (1 MB, modified: 2024-03-01, hash: nnn444...)
Database: Document with hash nnn444... already exists
```

**Expected Original Behavior:**
- No database check, file would be uploaded
- (Potential conflict at database level)

**Expected Improved Behavior:**
1. Phase 3: Database check finds hash exists
2. File A: `status: already-uploaded`
3. Preview: Shows "Existing file found"
4. **User action:** Wants to upload anyway (maybe source location changed?)
5. System: ???

**Equivalence Check:** ⚠️ **UNCLEAR** - What should happen?

**Validation Points:**
- ? Should user be able to override "already-uploaded" status?
- ? If file content is identical (same hash), why upload again?
- ✓ Metadata update makes sense (new source reference)
- ? Maybe user wants to update the Storage file if it was corrupted?

---

## Category 6: Edge Cases

### Story 6.1: Hash Collision (Theoretical)

**Scenario:** Two different files produce the same BLAKE3 hash (extremely unlikely).

**Initial State:**
```
File A: /Desktop/doc1.pdf (1 MB, content: "...", hash: ooo555...)
File B: /Desktop/doc2.pdf (1 MB, content: "DIFFERENT", hash: ooo555...)
```

**Expected Original Behavior:**
- Same hash → treated as duplicates
- One uploaded, other marked as duplicate
- **PROBLEM:** Different content but same hash → data loss

**Expected Improved Behavior:**
- Same hash → treated as duplicates
- **PROBLEM:** Same data loss issue

**Equivalence Check:** ⚠️ Both systems have same vulnerability

**Validation Points:**
- ✓ BLAKE3 collision probability is ~2^-128 (negligible)
- ✓ Neither system can detect true collisions
- ✓ This is acceptable given hash security guarantees

---

### Story 6.2: Hashing Failure

**Scenario:** One file fails to hash due to read error.

**Initial State:**
```
File A: /Desktop/good.pdf (1 MB, hash: ppp666...)
File B: /Desktop/corrupted.pdf (1.5 MB, hash: ERROR - read failure)
```

**Expected Original Behavior:**
- File A: Hashed successfully → `status: ready`
- File B: Hash error → included without hash (see code line 212-214)
- Both uploaded

**Expected Improved Behavior:**
- File A: `status: ready-to-upload`
- File B: `status: ERROR` or `status: pending`?
- Preview: Shows error for File B
- User decision: Upload anyway or exclude?

**Equivalence Check:** ⚠️ Different error handling

**Validation Points:**
- ✓ Original system includes file without hash (prevents data loss)
- ? Improved system should have clearer error handling
- ? How does Firestore handle document without hash ID?

---

### Story 6.3: Very Large File Set (1000+ files)

**Scenario:** User selects 1000 files with various duplicates.

**Initial State:**
```
1000 files:
- 600 unique files
- 200 files in 50 duplicate groups (4 per group)
- 200 files selected multiple times (one-and-the-same)
```

**Expected Original Behavior:**
- All processed in one batch
- Hashing blocks UI if worker fails
- Progress unclear to user
- Final result: 650 files uploaded (600 unique + 50 best from groups)

**Expected Improved Behavior:**
- Phase 1-2: Incremental progress shown
- Phase 3: Database check may be slow (1000 hash queries?)
- Preview: Clear summary of deduplication results
- User sees: "650 files to upload, 350 duplicates skipped, X GB saved"
- Upload: 650 files

**Equivalence Check:** ✅ Same final result, better UX

**Validation Points:**
- ✓ Improved system provides better progress feedback
- ✓ Database check needs optimization (batch queries?)
- ✓ Preview helps user understand what's happening
- ? Does improved system handle cancellation during Phase 2?

---

### Story 6.4: User Cancels During Hashing

**Scenario:** User starts upload, then cancels during hash phase.

**Expected Original Behavior:**
- Worker may continue running
- Unclear cancellation state
- Files may be partially processed

**Expected Improved Behavior:**
- User clicks cancel during Phase 2
- System: Stops hashing, terminates worker
- Returns to initial state or shows partial results?
- No files uploaded

**Equivalence Check:** N/A (cancellation)

**Validation Points:**
- ? Original system has `abortProcessing()` method
- ✓ Improved system should have clear cancellation at each phase
- ✓ Worker termination should be clean

---

## Summary of Findings

### ✅ Genuine Improvements
1. **Database check**: Avoids uploading files that already exist
2. **Progress feedback**: Better user experience during hashing
3. **Preview screen**: User visibility before upload
4. **Metrics display**: Shows deduplication savings
5. **Status clarity**: More descriptive status names

### ⚠️ Concerns & Questions

1. **User Override Risks:**
   - Story 5.2 reveals a critical flaw: Users cannot upload multiple copies with same hash (same Firestore ID)
   - Override should only allow choosing WHICH copy, not uploading ALL copies
   - This needs clear UI constraints

2. **Database Check Performance:**
   - Checking 1000+ hashes in Firestore could be slow
   - Needs batch query optimization
   - Should this be done BEFORE hashing? (No - loses benefit of size-based filtering)

3. **Original System Behavior Unclear:**
   - How does original system handle files that already exist in database?
   - Does Firestore reject duplicate hash IDs?
   - Need to test this scenario

4. **Behavioral Equivalence:**
   - Core deduplication algorithm appears identical
   - Main differences are:
     - Additional database check phase
     - User override capability
     - More detailed status tracking
   - Final uploaded files SHOULD be the same (if user doesn't override)

### 🔴 Critical Issues Found

1. **Story 5.2**: User override allowing multiple copies with same hash would cause Firestore ID collision
   - **FIX NEEDED**: Constrain override to choosing between copies, not uploading multiple

2. **Database Check Logic**: If "best" file already exists, what happens to other copies?
   - Should all copies reference existing hash?
   - This is actually better behavior than original system

### 📊 Behavioral Equivalence Verdict

**Core Algorithm:** ✅ **EQUIVALENT** - Same deduplication logic
**Final Results (without overrides):** ✅ **EQUIVALENT** - Same files uploaded
**Overall System:** ⚠️ **ENHANCED but NOT IDENTICAL** due to:
- Database check (new functionality)
- User override (new functionality, needs constraints)
- Better UX (improved, not changed)

### 🎯 Recommendations

1. **Implement the improved system** - It genuinely improves UX
2. **Fix Story 5.2** - Constrain user override to prevent ID collisions
3. **Optimize database checks** - Use batch queries for large file sets
4. **Document override behavior** - Make it clear what users can and cannot do
5. **Test database interaction** - Verify behavior when files exist in Firestore
6. **Preserve core logic** - Don't change priority rules or deduplication algorithm

### ✅ Final Answer: Is It Actually Improved?

**YES**, but with caveats:
- The core deduplication logic is unchanged (good - don't break what works)
- The UX improvements are genuine enhancements
- The database check is new functionality that adds value
- User override needs constraints to prevent issues
- The "improved" system is more complex, which increases risk of bugs

**Recommendation:** Implement with the fixes noted above, particularly constraining user override behavior.
