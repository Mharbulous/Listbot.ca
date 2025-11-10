# Single-Query Schema Refactoring Plan

**Date**: 2025-10-28
**Status**: In Progress
**Goal**: Optimize DocumentTable.vue data fetching from 2,230 queries → 1 query (90% reduction)

---

## Executive Summary

The DocumentTable component currently suffers from an N+1 query problem, requiring **10 Firestore reads per document** (2,230 total reads for 223 documents, taking 4.6 seconds). This plan implements a denormalization strategy to reduce this to a **single query** by embedding frequently-accessed data directly in evidence documents, while maintaining subcollections for audit trails and detail views.

**Expected Improvement**: 4.6s → ~0.5s load time (10x faster), 90% reduction in Firestore reads

---

## 1. Current Schema Analysis

### The N+1 Problem

For 223 documents, the current implementation requires **2,230 Firestore reads**:

1. **1 query**: Main evidence collection query (gets all 223 documents)
2. **223 queries**: One `sourceMetadata` subcollection query per document (for filename, modified date, folder path)
3. **223 queries**: One `sourceMetadata` collection count query per document (to determine "Multiple Source Files" status)
4. **1,561 queries** (7 × 223): One tag subcollection query per system category per document

**Total: 2,230 reads at ~20ms per read = 4,600ms load time**

### Current Firestore Document Structure

```
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}
├── Evidence Document Fields:
│   ├── sourceID: string (metadataHash)
│   ├── fileSize: number
│   ├── fileType: string (MIME type)
│   ├── uploadDate: timestamp
│   ├── isProcessed: boolean
│   ├── processingStage: string
│   ├── tagCount: number
│   ├── autoApprovedCount: number
│   └── reviewRequiredCount: number
│
├── /sourceMetadata/{metadataHash} (SUBCOLLECTION - causes N queries)
│   ├── sourceFileName: string
│   ├── sourceLastModified: timestamp
│   └── sourceFolderPath: string
│
└── /tags/{categoryId} (SUBCOLLECTION - causes N×M queries)
    ├── tagName: string
    ├── confidence: number
    ├── status: string
    ├── autoApproved: boolean
    ├── createdAt: timestamp
    └── source: string
```

### Root Cause

**The schema violates Firestore's performance best practice**: Frequently-accessed data is stored in subcollections, requiring separate queries for each document. This is a classic N+1 query anti-pattern.

**Firestore Best Practice**: Embed frequently-accessed data in parent documents. Reserve subcollections for:
- Data that changes independently
- Audit trails and historical records
- Detail views that aren't displayed in lists

---

## 2. DocumentTable Data Requirements

### What the Table Displays

Based on analysis of `DocumentTable.vue` and `Documents.vue`, each row needs:

#### Built-in Columns (from Evidence + SourceMetadata)
1. **fileName**: `sourceMetadata.sourceFileName` ❌ (subcollection)
2. **size**: `evidence.fileSize` ✅ (parent document)
3. **date**: `evidence.uploadDate` ✅ (parent document)
4. **fileType**: `evidence.fileType` ✅ (parent document)
5. **modifiedDate**: `sourceMetadata.sourceLastModified` ❌ (subcollection)
6. **sourceFolderPath**: `sourceMetadata.sourceFolderPath` ❌ (subcollection)
7. **alternateSources**: Count of sourceMetadata docs ❌ (requires count query)

#### System Category Columns (from Tags Subcollection)
For each of ~7-50 system categories:
- **{categoryId}**: `tags/{categoryId}.tagName` ❌ (subcollection)

### Performance Impact Summary

- **3 of 7 built-in fields** require subcollection queries
- **ALL category tag values** require subcollection queries
- **Result**: 10 queries per document (1 evidence + 2 sourceMetadata + 7 tags)

---

## 3. Proposed Solution: Denormalization

### Strategy

**Write to both locations**:
1. **Subcollections** → For audit trails, detail views, full metadata
2. **Parent document** → For fast table rendering, embedded summary data

### Optimized Evidence Document Structure

```javascript
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}
{
  // ===== EXISTING FIELDS (unchanged) =====
  sourceID: string,                    // Primary metadataHash for display
  fileSize: number,
  fileType: string,
  uploadDate: timestamp,
  isProcessed: boolean,
  processingStage: string,

  // Tag counters (unchanged)
  tagCount: number,
  autoApprovedCount: number,
  reviewRequiredCount: number,

  // ===== NEW: EMBEDDED SOURCE METADATA =====
  // (for fast table rendering - eliminates 2 queries per document)
  sourceFileName: string,              // From sourceMetadata[sourceID]
  sourceLastModified: timestamp,       // From sourceMetadata[sourceID]
  sourceFolderPath: string,            // From sourceMetadata[sourceID]
  sourceMetadataCount: number,         // Count of alternate source files

  // ===== NEW: EMBEDDED TAGS MAP =====
  // (for fast table rendering - eliminates N queries per document)
  tags: {
    [categoryId]: {
      tagName: string,
      confidence: number,
      autoApproved: boolean,
      reviewRequired: boolean,
      source: string,                  // 'ai' | 'human' | 'bulk_import'
      createdAt: timestamp,
      reviewedAt: timestamp
    }
  },

  // ===== NEW: EMBEDDED SOURCE METADATA VARIANTS =====
  // (for deduplication tracking - eliminates 1 query per document)
  sourceMetadataVariants: {
    [metadataHash]: {
      sourceFileName: string,
      sourceLastModified: timestamp,
      sourceFolderPath: string,
      uploadDate: timestamp
    }
  },

  // ===== KEEP SUBCOLLECTIONS FOR DETAIL VIEWS =====
  // (not queried during table rendering)
  // /sourceMetadata/{metadataHash} - Full metadata including checksums, etc.
  // /tags/{categoryId} - Full tag metadata with AI processing details
}
```

### Key Design Decisions

1. **Embed Primary Source Metadata**: Copy the primary source file's metadata (identified by `sourceID`) to the evidence document root for instant access

2. **Embed All Tags as Map**: Store tags in a `tags: {}` map keyed by `categoryId` for O(1) lookup instead of N queries

3. **Embed Source Variants Map**: Store all source metadata variants in `sourceMetadataVariants: {}` for deduplication display without counting queries

4. **Maintain Subcollections**: Keep subcollections for:
   - Detailed metadata access (full sourceMetadata documents)
   - Tag review workflows (full tag documents with AI metadata)
   - Audit trails and historical data
   - Any data not displayed in the table

5. **Atomic Batch Writes**: Use Firestore batch writes to ensure subcollection and parent document stay synchronized

---

## 4. Performance Analysis

### Query Optimization: Before vs After

#### BEFORE (Current N+1 Pattern)

```javascript
async function fetchFiles(firmId, matterId, systemCategories, maxResults) {
  // 1 query: Get all evidence documents
  const evidenceSnapshot = await getDocs(query(evidenceRef, limit(maxResults)));

  // For EACH document (N queries):
  for (const doc of evidenceSnapshot.docs) {
    // Query 1: Get sourceMetadata for filename/path/date
    const sourceMetadataDoc = await getDoc(sourceMetadataRef);

    // Query 2: Count sourceMetadata docs for "Multiple Sources"
    const sourceMetadataSnapshot = await getDocs(sourceMetadataCollectionRef);

    // Query 3-N: Get each category tag (M queries per doc)
    for (const category of systemCategories) {
      const tagDoc = await getDoc(tagRef);
    }
  }

  // Total: 1 + (N × (2 + M)) queries
  // For 223 docs, 7 categories: 1 + (223 × 9) = 2,008 queries
}
```

**Performance**:
- 223 documents: 2,230 queries, 4.6 seconds
- 10,000 documents: ~100,000 queries, ~40 minutes

#### AFTER (Optimized Single Query)

```javascript
async function fetchFiles(firmId, matterId, systemCategories, maxResults) {
  // SINGLE query: Get all evidence documents with embedded data
  const evidenceSnapshot = await getDocs(
    query(evidenceRef, orderBy('uploadDate', 'desc'), limit(maxResults))
  );

  // Map documents to table rows (no additional queries!)
  const files = evidenceSnapshot.docs.map(doc => {
    const data = doc.data();

    return {
      id: doc.id,
      fileName: data.sourceFileName || 'ERROR: Missing metadata',
      size: formatUploadSize(data.fileSize),
      date: data.uploadDate,
      fileType: data.fileType || 'ERROR: Missing file type',
      modifiedDate: data.sourceLastModified || null,
      sourceFolderPath: data.sourceFolderPath || 'ERROR: Missing metadata',
      alternateSources: data.sourceMetadataCount === 0 ? 'No source information'
                      : data.sourceMetadataCount === 1 ? 'FALSE'
                      : 'TRUE',

      // Spread all embedded tag values directly into row (O(1) access!)
      ...Object.fromEntries(
        systemCategories.map(category => [
          category.id,
          data.tags?.[category.id]?.tagName || '🤖'
        ])
      )
    };
  });

  // Total: 1 query for any number of documents!
  return files;
}
```

**Performance**:
- 223 documents: 223 reads (1 query), ~0.5 seconds (10x faster)
- 10,000 documents: 10,000 reads (1 query), ~2 seconds (1,200x faster)

### Projected Performance Improvements

| Documents | Current Time | Optimized Time | Speedup |
|-----------|--------------|----------------|---------|
| 223       | 4.6s         | ~0.5s          | 10x     |
| 1,000     | ~20s         | ~1.0s          | 20x     |
| 10,000    | ~40 min      | ~2.0s          | 1,200x  |

### Cost Analysis

**Firestore Pricing**: $0.06 per 100,000 reads

| Documents | Current Reads | Optimized Reads | Cost Savings |
|-----------|---------------|-----------------|--------------|
| 223       | 2,230         | 223             | 90%          |
| 10,000    | ~100,000      | 10,000          | 90%          |
| 100,000   | ~1,000,000    | 100,000         | 90%          |

**Savings at 100,000 documents**: $0.54 per query (from $0.60 to $0.06)

---

## 5. Implementation Plan

### Phase 1: Write Operations (Denormalize Data)

Update all write operations to sync data to both subcollections AND parent documents.

#### Phase 1.1: Initialize Embedded Fields ✅ COMPLETED
- **File**: `src/features/organizer/services/evidenceService.js`
- **Changes**: Initialize empty `tags: {}`, `sourceMetadata: {}`, `sourceMetadataVariants: {}` fields when creating evidence documents
- **Status**: Completed

#### Phase 1.2: Sync Source Metadata to Evidence Document 🔄 IN PROGRESS
- **File**: `src/features/upload/composables/useFileMetadata.js`
- **Changes**:
  1. Import `updateDoc` from Firestore
  2. After writing to `sourceMetadata` subcollection, update evidence document:
     - Set `sourceFileName`, `sourceLastModified`, `sourceFolderPath`
     - Increment `sourceMetadataCount`
     - Add to `sourceMetadataVariants` map
  3. Update `metadataRecordExists()` to check embedded `sourceMetadataVariants` instead of subcollection
- **Status**: In Progress

#### Phase 1.3: Sync Tags to Evidence Document ⏳ PENDING
- **File**: `src/features/organizer/services/tagSubcollectionService.js`
- **Changes**: Update the following methods to write to both locations using batch writes:
  1. `addTag()` - Write to subcollection AND `evidence.tags[categoryId]`
  2. `approveAITag()` - Update subcollection AND `evidence.tags[categoryId]`
  3. `rejectAITag()` - Update subcollection AND remove from `evidence.tags`
  4. `approveTagsBatch()` - Batch update both locations
  5. `rejectTagsBatch()` - Batch update both locations
  6. `deleteTag()` - Delete from subcollection AND remove from `evidence.tags`
  7. `deleteAllTags()` - Delete all from both locations
- **Implementation Pattern**:
  ```javascript
  const batch = writeBatch(db);

  // Write to subcollection (audit trail)
  batch.set(tagSubcollectionRef, fullTagData);

  // Write to parent (fast table access)
  batch.update(evidenceRef, {
    [`tags.${categoryId}`]: embeddedTagData
  });

  await batch.commit();
  ```

### Phase 2: Read Operations (Use Embedded Data)

Update all read operations to access embedded data instead of querying subcollections.

#### Phase 2.1: Optimize Main Data Fetch ⏳ PENDING (CRITICAL FOR PERFORMANCE)
- **File**: `src/services/uploadService.js`
- **Changes**:
  1. Remove `fetchSystemTags()` function entirely
  2. Rewrite `fetchFiles()` to:
     - Single query: `getDocs(query(evidenceRef, orderBy('uploadDate', 'desc'), limit(maxResults)))`
     - Map documents to rows using embedded fields only
     - Access tags via `data.tags[categoryId].tagName`
     - Access sourceMetadata via `data.sourceFileName`, etc.
  3. Remove all subcollection query logic
- **Expected Result**: 2,230 queries → 1 query (90% reduction!)

#### Phase 2.2: Update Tag Reading in Organizer ⏳ PENDING
- **File**: `src/features/organizer/composables/organizerCore.js`
- **Changes**: Update tag reading to prefer embedded `evidence.tags` map over subcollection queries
- **Note**: Keep subcollection queries as fallback for detail views

#### Phase 2.3: Update Tag Operations ⏳ PENDING
- **File**: `src/features/organizer/services/tagOperationService.js`
- **Changes**: Ensure tag operations read from embedded tags when appropriate
- **Note**: Detail operations should still use subcollections for full metadata

#### Phase 2.4: Update Evidence Queries ⏳ PENDING
- **File**: `src/features/organizer/services/evidenceQueryService.js`
- **Changes**: Update query logic to use embedded fields for filtering and sorting
- **Note**: May enable new query capabilities (e.g., filter by tag value without subcollection queries)

### Phase 3: UI Updates

#### Phase 3.1: Update Document Detail View ⏳ PENDING
- **File**: `src/views/ViewDocument.vue`
- **Changes**: Use embedded `sourceMetadata` fields instead of subcollection queries for basic info
- **Note**: Keep subcollection queries for detailed metadata display

### Phase 4: Testing & Validation

#### Phase 4.1: Upload Test Files ⏳ PENDING
- Upload test files with various sourceMetadata and tags
- Verify embedded data is correctly synchronized

#### Phase 4.2: Performance Testing ⏳ PENDING
- Load DocumentTable with 100+ documents
- Measure query count and load time
- Verify single-query optimization is working
- Expected: 1 query per page load (plus 3 category queries = 4 total)

#### Phase 4.3: Data Integrity Testing ⏳ PENDING
- Verify subcollection and embedded data stay synchronized
- Test tag approve/reject operations
- Test tag delete operations
- Test source metadata updates

---

## 6. Migration Strategy

### Pre-Alpha Advantage: No Migration Needed

**Current Status**: Pre-alpha, no production users, no legacy data

**Strategy**: Direct implementation (no migration scripts required)

1. **Wipe existing database** (user confirmed they will do this)
2. **Deploy updated schema**
3. **Upload fresh test data**
4. **Verify performance improvements**

### If Migration Were Needed (Future Reference)

For future reference, if we had existing data to migrate:

```javascript
// Migration script (NOT NEEDED NOW - for future reference only)
async function migrateEvidenceDocuments(firmId, matterId) {
  const evidenceRef = collection(db, 'firms', firmId, 'matters', matterId, 'evidence');
  const evidenceSnapshot = await getDocs(evidenceRef);

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const evidenceDoc of evidenceSnapshot.docs) {
    const evidenceData = evidenceDoc.data();
    const fileHash = evidenceDoc.id;

    // Migrate sourceMetadata
    const sourceMetadataRef = collection(evidenceRef, fileHash, 'sourceMetadata');
    const sourceMetadataSnapshot = await getDocs(sourceMetadataRef);

    const sourceMetadataVariants = {};
    sourceMetadataSnapshot.forEach(metaDoc => {
      const metaData = metaDoc.data();
      sourceMetadataVariants[metaDoc.id] = {
        sourceFileName: metaData.sourceFileName,
        sourceLastModified: metaData.sourceLastModified,
        sourceFolderPath: metaData.sourceFolderPath,
        uploadDate: metaData.uploadDate || evidenceData.uploadDate
      };
    });

    // Get primary source metadata
    const primaryMeta = sourceMetadataVariants[evidenceData.sourceID] || {};

    // Migrate tags
    const tagsRef = collection(evidenceRef, fileHash, 'tags');
    const tagsSnapshot = await getDocs(tagsRef);

    const embeddedTags = {};
    tagsSnapshot.forEach(tagDoc => {
      const tagData = tagDoc.data();
      embeddedTags[tagDoc.id] = {
        tagName: tagData.tagName,
        confidence: tagData.confidence,
        autoApproved: tagData.autoApproved,
        reviewRequired: tagData.reviewRequired,
        source: tagData.source,
        createdAt: tagData.createdAt,
        reviewedAt: tagData.reviewedAt
      };
    });

    // Update evidence document
    batch.update(doc(evidenceRef, fileHash), {
      sourceFileName: primaryMeta.sourceFileName || '',
      sourceLastModified: primaryMeta.sourceLastModified || null,
      sourceFolderPath: primaryMeta.sourceFolderPath || '',
      sourceMetadataCount: Object.keys(sourceMetadataVariants).length,
      sourceMetadataVariants: sourceMetadataVariants,
      tags: embeddedTags
    });

    batchCount++;

    // Commit every 500 documents (Firestore batch limit)
    if (batchCount >= 500) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
}
```

---

## 7. Risk Analysis & Mitigation

### Risk 1: Write Performance Degradation

**Risk**: Writing to both subcollection and parent document increases write latency

**Mitigation**:
- Use Firestore batch writes for atomicity (single network roundtrip)
- Writes happen **once** during upload/tagging
- Reads happen **thousands of times** during table rendering
- This is the **correct trade-off** for read-heavy workloads

**Impact**: Acceptable (writes are infrequent, reads are frequent)

### Risk 2: Data Synchronization Issues

**Risk**: Subcollection and embedded data could get out of sync

**Mitigation**:
- Use batch writes for atomicity (all-or-nothing)
- Centralize write logic in service classes
- Add validation to ensure both locations are updated
- Keep subcollections as source of truth for detail views
- Embedded data is cache/denormalization, subcollections are authoritative

**Impact**: Low (batch writes ensure atomicity)

### Risk 3: Document Size Limits

**Risk**: Firestore documents have 1MB size limit, embedding too much data could hit this

**Analysis**:
- Each tag entry: ~200 bytes (tagName + metadata)
- 50 categories × 200 bytes = 10KB for all tags
- sourceMetadataVariants: ~300 bytes per variant
- 10 variants × 300 bytes = 3KB
- **Total embedded data**: ~15KB per document
- **Firestore limit**: 1MB
- **Safety margin**: 98.5%

**Mitigation**:
- Monitor document sizes
- If approaching limits, can move less-frequently-accessed data to subcollections
- Current design is well within limits

**Impact**: Very Low (15KB << 1MB)

### Risk 4: Query Performance with Large Documents

**Risk**: Larger documents could slow down query performance

**Analysis**:
- Firestore charges by document read, not document size
- Network transfer time increases linearly with document size
- 15KB additional data per document is minimal
- Trade-off: 10 small queries vs. 1 larger query
- **Network cost**: 10 roundtrips (~200ms) >> 1 roundtrip with 15KB extra (~5ms)

**Impact**: Negligible (1 large query << 10 small queries)

---

## 8. Success Criteria

### Performance Metrics

- [ ] **Load time**: DocumentTable loads in <1 second for 500 documents
- [ ] **Query count**: Single evidence query per page load (plus 3 category queries = 4 total)
- [ ] **Firestore reads**: 90% reduction in read operations
- [ ] **User experience**: Instant table rendering without loading spinners

### Data Integrity

- [ ] **Synchronization**: Subcollection and embedded data match 100%
- [ ] **Tag operations**: Approve/reject/delete operations update both locations
- [ ] **Source metadata**: File uploads create embedded and subcollection data correctly
- [ ] **Atomicity**: Batch writes succeed or fail together (no partial updates)

### Code Quality

- [ ] **No regression**: All existing features continue working
- [ ] **Tests pass**: All unit and integration tests pass
- [ ] **Maintainability**: Write operations are centralized and consistent
- [ ] **Documentation**: Code comments explain denormalization strategy

---

## 9. Rollback Plan

### If Issues Arise During Implementation

Since we're in pre-alpha with no production data:

1. **Revert code changes** via git
2. **Wipe database** and start fresh
3. **Re-upload test data** with previous schema

### If Issues Arise Post-Deployment (Future)

For future deployments with real data:

1. **Keep subcollections as source of truth** (they remain intact)
2. **Disable embedded data reads** via feature flag
3. **Fall back to subcollection queries** temporarily
4. **Fix synchronization issues** in write operations
5. **Re-migrate data** if needed
6. **Re-enable embedded data reads** after validation

---

## 10. Future Enhancements

### Phase 5: Additional Optimizations (Future)

1. **Composite indexes** for complex filtering
2. **Pagination improvements** with cursor-based queries
3. **Cache embedded data** in client-side state management
4. **Incremental loading** for very large tables (>10,000 documents)
5. **Background sync** to rebuild embedded data if inconsistencies detected

### Phase 6: Monitoring (Future)

1. **Performance metrics** dashboard
2. **Data consistency** checks
3. **Query performance** tracking
4. **Document size** monitoring
5. **Error rate** tracking for batch writes

---

## 11. References

### Firestore Best Practices
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Denormalization Guidelines](https://firebase.google.com/docs/firestore/manage-data/structure-data#denormalization)
- [Query Performance](https://firebase.google.com/docs/firestore/best-practices#query_performance)

### Internal Documentation
- `@docs/architecture/overview.md` - System architecture
- `@docs/front-end/DocumentTable.md` - DocumentTable architecture
- `@src/services/uploadService.js` - Current data fetching logic
- `@src/features/organizer/services/evidenceService.js` - Evidence document creation

### Performance Analysis
- Current metrics: 223 docs = 2,230 reads = 4.6s
- Target metrics: 223 docs = 223 reads = ~0.5s
- Scaling projection: 10,000 docs = ~2s (vs. 40 minutes current)

---

## 12. Conclusion

This denormalization strategy addresses the root cause of DocumentTable's performance issues by eliminating the N+1 query anti-pattern. By embedding frequently-accessed data in parent documents while maintaining subcollections for audit trails, we achieve:

- **10x faster load times** for current data volumes
- **1,200x faster** for projected future volumes (10,000 documents)
- **90% reduction** in Firestore read operations
- **Minimal risk** due to pre-alpha status (no data migration needed)
- **Sustainable architecture** that scales linearly instead of quadratically

The implementation leverages Firestore's batch write capabilities to maintain data consistency, follows established best practices for denormalization, and provides a clear path to single-query table rendering.

**Next Steps**: Complete Phase 1.2 (useFileMetadata.js), then Phase 1.3 (tagSubcollectionService.js), then Phase 2.1 (uploadService.js - the critical performance optimization).
