# Categories and Tags System

Last Updated: 2025-09-20

## Critical Architecture Context

**DO NOT** assume tags are stored in the evidence document. Tags use a subcollection architecture at `/teams/{teamId}/evidence/{evidenceId}/tags/{categoryId}` for scalability.

**ALWAYS** enforce one tag per category through categoryId as document ID.

**NEVER** store duplicate tag colors. Colors are computed using triadic pattern based on category position.

## Data Structures - Single Source of Truth

### Categories Collection: `/teams/{teamId}/categories/{categoryId}`

```javascript
{
  name: string,                    // Max 50 chars
  color: string,                   // Hex format (#RRGGBB)
  isActive: boolean,               // Soft delete flag (undefined = true for legacy data)
  deletedAt: Timestamp,            // Set when soft deleted
  tags: [
    {
      id: string,                  // UUID
      name: string,                // Max 30 chars, unique within category
      color: string                // Hex color (optional, inherits category color)
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Tags Subcollection: `/teams/{teamId}/evidence/{evidenceId}/tags/{categoryId}`

```javascript
{
  // Core fields - REQUIRED
  categoryId: string,              // Same as document ID
  categoryName: string,
  tagName: string,
  source: 'ai' | 'ai-auto' | 'human',
  confidence: number,              // 0.0-1.0, 1.0 for human
  autoApproved: boolean,           // true if confidence >= 0.85
  reviewRequired: boolean,         // true if confidence < 0.85

  // Review tracking - OPTIONAL
  reviewedAt: Timestamp | null,
  reviewedBy: string | null,
  humanApproved: boolean | null,

  // Metadata - REQUIRED
  createdAt: Timestamp,
  createdBy: string,               // 'ai-system' or userId

  // AI analysis - REQUIRED for AI tags
  AIanalysis: {
    aiSelection: string,
    originalConfidence: number,
    aiAlternatives: string[],      // ALL alternatives, rank-ordered
    processingModel: string,
    contentMatch: string | null,
    reviewReason: string | null,
    reviewNote: string | null,
    userNote: string | null
  }
}
```

### Evidence Document Counters

```javascript
{
  // ALWAYS maintain these counters
  tagCount: number,
  autoApprovedCount: number,
  reviewRequiredCount: number
}
```

## Critical Constraints and Rules

### Validation Rules

**NEVER** allow:

- Category names starting with `system_` or `ai_`
- Tag names containing: `< > " ' & |`
- More than 100 tags per evidence document
- Tags referencing inactive categories
- Duplicate tag names within a category

**ALWAYS**:

- Trim whitespace from tag names
- Perform case-insensitive matching for duplicates
- Store original case in database
- Validate hex color format for colors
- Maintain one tag per category (enforced by document ID)

### Auto-Approval Rules

**ALWAYS** auto-approve when confidence >= 0.85
**NEVER** auto-approve when confidence < 0.85
**ALWAYS** set `reviewRequired: true` for confidence < 0.85
**ALWAYS** set `autoApproved: true` for confidence >= 0.85
**ALWAYS** set confidence to 1.0 for human-created tags

### Soft Delete Pattern

**DO NOT** hard delete categories.
**ALWAYS** set `isActive: false` and `deletedAt` timestamp for deletion.
**ALWAYS** treat undefined `isActive` as true for backward compatibility.
**ALWAYS** attempt `where('isActive', '==', true)` queries first, then fall back to client-side filtering if index missing.

## UI Component Requirements

### EditableTag Component (`src/components/features/tags/EditableTag.vue`)

**Props**:

- `tag` - Current tag object
- `categoryOptions` - Available tags array
- `isOpenCategory` - Boolean for Fixed vs Open List
- `tagColor` - Computed triadic color

**Events**:

- `tag-updated` - Existing option selected
- `tag-created` - New option created (Open List only)
- `tag-selected` - Option selected (no persistence)

### Fixed List vs Open List Behavior

**Fixed List Categories**:

- **NEVER** allow new option creation
- **ALWAYS** show lock icon during editing
- **ONLY** allow selection from existing options

**Open List Categories**:

- **ALWAYS** allow new option creation via Enter key
- **ALWAYS** show pencil icon during editing
- **ALWAYS** add new options to category tags array

### Color System

**NEVER** store individual tag colors. Use triadic rotation:

- Position 0: `#733381` (Purple)
- Position 1: `#589C48` (Green)
- Position 2: `#F58024` (Orange)

**ALWAYS** assign colors by `categoryIndex % 3`

## Development Testing Environment

**Testing Page**: `http://localhost:5174/#/dev/clickable-tags`

**Development Collections**:
- `devTesting` - Development categories collection
- `devTesting/config/TestTags` - Test tags subcollection

The testing page provides side-by-side comparison of Fixed List Categories (locked options) vs Open List Categories (user can create new options). Requires authentication for real Firebase integration testing.

## AI Alternatives Storage Pattern

**ALWAYS** store ALL alternatives in `aiAlternatives` array (no cap).
**NEVER** include the selected tag in alternatives array.
**ALWAYS** rank-order alternatives by confidence.

UI display strategy:

- Show top 2 alternatives as quick options
- "Other" button shows remaining alternatives + all other category options

## Required Firestore Indexes

```javascript
// Categories collection
{
  collection: 'teams/{teamId}/categories',
  fields: [
    { field: 'isActive', order: 'ASCENDING' },
    { field: 'createdAt', order: 'ASCENDING' }
  ]
}

// Tags subcollection
{
  collection: 'teams/{teamId}/evidence/{evidenceId}/tags',
  fields: [
    { field: 'reviewRequired', order: 'ASCENDING' },
    { field: 'createdAt', order: 'ASCENDING' }
  ]
}
```

## Query Patterns

### Get Active Categories with Fallback

```javascript
// ALWAYS try indexed query first
try {
  const snapshot = await db
    .collection('teams')
    .doc(teamId)
    .collection('categories')
    .where('isActive', '==', true)
    .get();
} catch (error) {
  // Fallback to client-side filtering if index missing
  const snapshot = await db.collection('teams').doc(teamId).collection('categories').get();
  // Filter client-side for isActive !== false
}
```

### Access Tag for Specific Category

```javascript
// Direct access via categoryId as document ID
const tagDoc = await db
  .collection('teams')
  .doc(teamId)
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .doc(categoryId)
  .get();
```

## Performance Requirements

- Tag counter updates MUST complete in <100ms
- Auto-approval processing MUST complete in <200ms
- Category loading MUST handle 1000+ tags without degradation
- **ALWAYS** use counters to avoid subcollection counts
- **NEVER** load all tags when only count needed

## Cross-Reference to Other Documentation

For authentication and team validation rules, see Authentication documentation.
For evidence document structure and lifecycle, see Evidence Management documentation.
For real-time synchronization patterns, see Real-Time Updates documentation.
For AI processing pipeline and confidence scoring, see AI Integration documentation.

## Migration and Backward Compatibility

**ALWAYS** handle missing `isActive` field as true.
**NEVER** assume all categories have modern structure.
**ALWAYS** perform background migrations without blocking operations.

## Environment Variables

```javascript
// Feature flags - NEVER hardcode these values
const ENABLE_AUTO_APPROVAL = process.env.VITE_ENABLE_AUTO_APPROVAL !== 'false';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.VITE_CONFIDENCE_THRESHOLD) || 0.85;
```

## Common Pitfalls

**DO NOT** store tags in the evidence document - use subcollection.
**DO NOT** allow multiple tags per category - one categoryId per tag document.
**DO NOT** compute colors client-side differently than triadic pattern.
**DO NOT** skip validation assuming Firestore rules will catch errors.
**DO NOT** query all tags when counters are available on evidence document.
**DO NOT** hard delete categories - always soft delete.
**DO NOT** assume `isActive` field exists - handle undefined as true.
