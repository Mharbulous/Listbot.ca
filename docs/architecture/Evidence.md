# Evidence Document Structure

## Database Path

```
/firms/{firmId}/matters/general/evidence/{fileHash}
```

**IMPORTANT**: Document ID is the BLAKE3 hash of the file content (32 hex characters). This provides automatic deduplication - identical files cannot create duplicate evidence records.

**Note**: All collections are hardcoded to use `/matters/general/` as a testing ground for feature development. In the future, 'general' will become the default matter when no specific matter is selected, and the system will support dynamic matter IDs for organizing files by legal matter, client, or project.

## Document Schema

### Required Fields

```javascript
{
  // Document ID = fileHash (BLAKE3, 32 chars) - NOT A STORED FIELD

  // Display Configuration - REQUIRED
  sourceID: string,           // Metadata hash - references sourceMetadata collection

  // File Properties - REQUIRED
  fileSize: number,              // Bytes, must be > 0

  // Processing Status - REQUIRED
  isProcessed: boolean,          // Default: false
  hasAllPages: boolean | null,   // null until processing complete
  processingStage: string,       // ENUM: 'uploaded' | 'splitting' | 'merging' | 'complete'

  // Tag Counters - REQUIRED
  tagCount: number,              // Default: 0, increment on tag add
  autoApprovedCount: number,     // Default: 0, tags with confidence >= 85%
  reviewRequiredCount: number,   // Default: 0, tags with confidence < 85%

  // Timestamps - REQUIRED
  updatedAt: timestamp           // Server timestamp, update on any change
}
```

### Field Constraints

**Document ID (fileHash):**

- **MUST** be a valid BLAKE3 hash (32 hexadecimal characters)
- **AUTOMATIC DEDUPLICATION**: Using fileHash as document ID prevents duplicate evidence records
- **ALWAYS** verify file exists in Firebase Storage before creating evidence document
- **NEVER** manually set document ID - use the fileHash from upload process

**sourceID:**

- **ALWAYS** verify hash exists in sourceMetadata collection
- **MUST** be a valid metadataHash (xxHash, 16 characters)
- **USE** hash-based lookup for metadata retrieval

**Note**: For understanding the critical distinction between source file metadata and storage file references, including how sourceMetadata is stored as a subcollection under evidence documents, see [FileMetadata.md](FileMetadata.md).

**processingStage:**

- **MUST** follow this progression: 'uploaded' → 'splitting' → 'merging' → 'complete'
- **NEVER** skip stages or move backwards
- **UPDATE** isProcessed to true only when stage = 'complete'

**Tag Counters:**

- **INCREMENT** counters atomically using FieldValue.increment()
- **NEVER** manually calculate from subcollection
- **UPDATE** updatedAt whenever counters change

**Note**: For complete tag subcollection architecture, validation rules, and Categories patterns, see [CategoryTags.md](CategoryTags.md).

## Source Metadata Subcollection

### Path Structure

```
/firms/{firmId}/matters/general/evidence/{evidenceId}/sourceMetadata/{metadataHash}
```

### Purpose

The sourceMetadata subcollection stores variant metadata for files with identical content but different upload contexts (different names, timestamps, or folder paths). This preserves all source file contexts while maintaining efficient storage deduplication.

### Source Metadata Document Schema

```javascript
{
  // Core file metadata
  sourceFileName: string,      // Exact filename with SOURCE FILE CASE PRESERVED
  lastModified: Timestamp,      // Source file's timestamp (Firestore Timestamp)
  fileHash: string,            // BLAKE3 of file content (32 hex chars)

  // File path information
  sourceFolderPath: string,    // Pipe-delimited paths (e.g., "Documents/2023|Archive/Legal")

  // MIME type information
  sourceFileType: string       // MIME type from file.type property (e.g., "application/pdf")
}
```

### Key Characteristics

- **Multiple variants per evidence**: One evidence document can have multiple sourceMetadata subcollection documents
- **Automatic deduplication**: Identical metadata (same metadataHash) stored only once per evidence document
- **Preserves original context**: Each document represents a unique upload context with different name, timestamp, or path
- **Case preservation**: The ONLY place where source file extension case is preserved

## Tag Subcollection

### Path Structure

```
/firms/{firmId}/matters/general/evidence/{evidenceId}/tags/{categoryId}
```

### Tag Document Schema

```javascript
{
  // Tag Identity - REQUIRED
  categoryId: string,            // Must match document ID
  tags: string[],                // Array of tag values for this category

  // AI Processing - REQUIRED
  confidence: number,            // 0-100, decimal allowed
  aiSource: string,              // Model identifier (e.g., 'gpt-4')

  // Approval Status - REQUIRED
  status: string,                // ENUM: 'auto_approved' | 'pending_review' | 'human_approved' | 'rejected'

  // Optional Metadata
  reviewedBy: string | null,     // User ID if human reviewed
  reviewedAt: timestamp | null,  // Timestamp of human review

  // Timestamps - REQUIRED
  createdAt: timestamp,          // Server timestamp
  updatedAt: timestamp           // Server timestamp
}
```

### Tag Status Rules

**ALWAYS** set status based on confidence:

- confidence >= 85: status = 'auto_approved'
- confidence < 85: status = 'pending_review'

**NEVER** allow:

- Empty tags array
- Duplicate categoryId within same evidence
- Confidence values outside 0-100 range
- Manual status changes without updating reviewedBy/reviewedAt

## Firestore Security Rules

```javascript
match /firms/{firmId}/matters/general/evidence/{fileHash} {
  // Evidence document access
  // Note: fileHash is the document ID (BLAKE3, 32 hex chars)
  allow read: if request.auth != null &&
                 request.auth.token.firmId == firmId;

  allow create: if request.auth != null &&
                   request.auth.token.firmId == firmId &&
                   validateEvidenceCreate(request.resource.data, fileHash);

  allow update: if request.auth != null &&
                   request.auth.token.firmId == firmId &&
                   validateEvidenceUpdate(request.resource.data, resource.data);

  allow delete: if false; // NEVER allow deletion

  // Tag subcollection
  match /tags/{categoryId} {
    allow read: if request.auth != null &&
                   request.auth.token.firmId == firmId;

    allow write: if request.auth != null &&
                    request.auth.token.firmId == firmId &&
                    request.resource.id == request.resource.data.categoryId &&
                    validateTagDocument(request.resource.data);
  }
}

// Validation Functions
function validateEvidenceCreate(data, fileHash) {
  return data.keys().hasAll(['sourceID', 'fileSize',
                              'isProcessed', 'processingStage', 'tagCount',
                              'autoApprovedCount', 'reviewRequiredCount', 'updatedAt']) &&
         fileHash.size() == 32 &&  // Document ID must be valid BLAKE3 hash
         data.sourceID.size() == 16 &&  // Must be valid xxHash metadata hash
         data.fileSize > 0 &&
         data.processingStage in ['uploaded', 'splitting', 'merging', 'complete'] &&
         data.tagCount >= 0 &&
         data.autoApprovedCount >= 0 &&
         data.reviewRequiredCount >= 0;
}

function validateTagDocument(data) {
  return data.confidence >= 0 &&
         data.confidence <= 100 &&
         data.tags.size() > 0 &&
         data.status in ['auto_approved', 'pending_review', 'human_approved', 'rejected'] &&
         (data.confidence >= 85 ? data.status == 'auto_approved' : true) &&
         (data.confidence < 85 ? data.status == 'pending_review' : true);
}
```

**Note**: For complete security rule patterns, custom claims structure, and firm-based access control implementation, see [security-rules.md](security-rules.md).

```javascript

```

## Query Operations

### Get Evidence with Tag Counts

```javascript
const evidenceDoc = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .get();

// ALWAYS check document exists
if (!evidenceDoc.exists) throw new Error('Evidence not found');

const data = evidenceDoc.data();
// USE counters from document, DO NOT query subcollection for counts
const tagMetrics = {
  total: data.tagCount,
  autoApproved: data.autoApprovedCount,
  reviewRequired: data.reviewRequiredCount,
};
```

**Note**: For firm member management and data migration workflows that affect evidence document access patterns, see [firm-workflows.md](firm-workflows.md).

```javascript

```

### Get Tags for Evidence

```javascript
// Get all tags
const tagsSnapshot = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .get();

// Get pending review tags only
const pendingTags = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .where('status', '==', 'pending_review')
  .get();
```

### Add Tag to Evidence

```javascript
// MUST use transaction to maintain counter integrity
await db.runTransaction(async (transaction) => {
  const evidenceRef = db
    .collection('firms')
    .doc(firmId)
    .collection('matters')
    .doc('general')
    .collection('evidence')
    .doc(evidenceId);

  const tagRef = evidenceRef.collection('tags').doc(categoryId);

  // Determine status based on confidence
  const status = confidence >= 85 ? 'auto_approved' : 'pending_review';

  // Create tag document
  transaction.set(tagRef, {
    categoryId,
    tags: tagArray,
    confidence,
    aiSource,
    status,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update counters atomically
  const counterUpdates = {
    tagCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === 'auto_approved') {
    counterUpdates.autoApprovedCount = FieldValue.increment(1);
  } else {
    counterUpdates.reviewRequiredCount = FieldValue.increment(1);
  }

  transaction.update(evidenceRef, counterUpdates);
});
```

### Update Processing Stage

```javascript
// MUST follow stage progression rules
const validTransitions = {
  uploaded: ['splitting'],
  splitting: ['merging'],
  merging: ['complete'],
  complete: [], // Terminal state
};

// ALWAYS validate transition
const currentStage = evidenceDoc.data().processingStage;
const canTransition = validTransitions[currentStage].includes(newStage);

if (!canTransition) {
  throw new Error(`Invalid stage transition: ${currentStage} → ${newStage}`);
}

// Update stage
await evidenceRef.update({
  processingStage: newStage,
  isProcessed: newStage === 'complete',
  hasAllPages: newStage === 'complete' ? true : null,
  updatedAt: FieldValue.serverTimestamp(),
});
```

## Performance Requirements

### Indexing

**MUST** create composite indexes:

```
Collection: tags
- status ASC, confidence DESC
- categoryId ASC, createdAt DESC
- status ASC, updatedAt DESC
```

### Counter Maintenance

- **NEVER** recalculate counters from subcollection queries
- **ALWAYS** use FieldValue.increment() for atomic updates
- **USE** counters for UI display without subcollection reads

### Batch Operations

- **LIMIT** batch writes to 500 documents per batch
- **USE** BulkWriter for large tag imports
- **IMPLEMENT** exponential backoff for retries

**Note**: For complete storage path organization, processing folder architecture, and Firebase Storage optimization strategies, see [firebase-storage.md](firebase-storage.md).

## Critical Constraints

### Data Integrity

- **NEVER** delete evidence documents
- **NEVER** modify document ID (fileHash) after creation
- **AUTOMATIC DEDUPLICATION**: Same fileHash = same document (setDoc overwrites safely)
- **ALWAYS** maintain counter accuracy with transactions
- **NEVER** allow orphaned tags (evidence deleted but tags remain)

### File References

- **ALWAYS** verify file exists in Firebase Storage before creating evidence
- **NEVER** store file content in Firestore
- **USE** fileHash (document ID) to locate files in Storage: `firms/{firmId}/matters/general/uploads/{fileHash}.{extension}`
- **ALWAYS** verify metadata hash exists in sourceMetadata collection
- **ACCESS** file using: `evidence.id` (which is the fileHash)

**Note**: For understanding firm-based data isolation including solo user patterns where firmId === userId, see [SoloFirmMatters.md](SoloFirmMatters.md).

### Processing Workflow

- **MUST** process documents in order: upload → split → merge → complete
- **NEVER** mark isProcessed=true unless processingStage='complete'
- **ALWAYS** update timestamps on any field change
- **DO NOT** allow manual stage changes without proper validation

### Tag Management

- **ENFORCE** confidence thresholds: 85% for auto-approval
- **NEVER** allow confidence values outside 0-100 range
- **ALWAYS** track reviewer identity for manual approvals
- **MAINTAIN** accurate counts through atomic transactions
