# Solo Firm Architecture

Last Updated: 2025-09-07

## Overview

The Solo Firm Architecture is a design pattern that treats solo users as single-member firms rather than having separate code paths for individual vs firm users. This eliminates special cases in storage, security, and duplicate detection while providing a clear upgrade path to multi-user firms.

**Key Design Principle**: New users automatically get a firm where `firmId === userId`, making them a "firm of one".

## Core Collections

### 1. Users Collection: `/users/{userId}`

**Purpose**: Store user preferences and app-specific settings

```javascript
{
  // User identity information
  firstName: 'John',           // Required - User's first name
  middleNames: 'Michael',      // Optional - User's middle name(s)
  lastName: 'Smith',           // Required - User's last name

  // User preferences only (identity comes from Firebase Auth)
  defaultFirmId: 'firm-abc-123',  // Primary firm for quick access (could be userId for solo users)
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en',
    dateFormat: 'YYYY-MM-DD',  // Default date format for display
    timeFormat: 'HH:mm',        // Default time format for display
    darkMode: false             // Dark mode preference
  },

  // Activity tracking
  lastLogin: Timestamp
}
```

### 2. Firms Collection: `/firms/{firmId}`

**Purpose**: Store firm info and embedded member list

**Solo User Design**: New users automatically get a firm where `firmId === userId`, making them a "firm of one". This eliminates special cases in storage, security, and duplicate detection.

```javascript
{
  // Firm information
  name: 'ACME Law Firm',  // For solo users: "John's Workspace"
  description: 'Full-service law firm',  // For solo users: "Personal workspace"

  // Embedded members (perfect for 3-10 users, or 1 for solo users)
  members: {
    'user-john-123': {
      email: 'john@acme.com',
      role: 'admin',  // 'admin' | 'member' (solo users are always admin)
      isLawyer: true,  // boolean flag indicating if user is a lawyer (default: false)
      joinedAt: Timestamp
    },
    'user-jane-456': {
      email: 'jane@acme.com',
      role: 'member',
      isLawyer: false,
      joinedAt: Timestamp
    }
  },

  // Simple pending invitations
  pendingInvites: {
    'newuser@acme.com': {
      invitedBy: 'user-john-123',
      invitedAt: Timestamp,
      role: 'member',
      fromFirm: 'firm-abc-123'  // Track which firm invited them
    }
  },

  // Which apps this firm has access to
  apps: ['intranet', 'bookkeeper'],  // Simple array

  // Basic settings
  settings: {
    timezone: 'America/New_York',
    maxMembers: 100
  },

  // Firm type flags
  isPersonal: false,  // true for solo users (firmId === userId)

  // Metadata
  createdAt: Timestamp,
  createdBy: 'user-john-123'
}
```

## Firm Data Collections: `/firms/{firmId}/{collection}/{documentId}`

**Purpose**: All firm data lives in flat collections under the firm

### Matters Collection: `/firms/{firmId}/matter/{matterId}`

**Reserved Matter ID**: Every firm has a reserved `matterId` called **"general"** where the firm stores general information about the firm, company policies, and non-client-specific documents.

**Design Note**: Client information is stored directly in matters as name strings, not as references to a separate collection. This simplified approach eliminates the need for a separate Clients collection and reduces data complexity.

```javascript
{
  // Matter identification
  matterNumber: '2024-001',  // Human-readable matter number/identifier
  description: 'Real Estate Purchase - 123 Main Street',

  // Parties involved
  clients: ['John Smith', 'Jane Doe'],  // Array of client name strings (supports multi-client matters)
  adverseParties: ['ABC Realty Inc.', 'XYZ Legal Services'],  // Array of adverse party name strings

  // Status and assignment
  status: 'active',  // 'active' | 'archived'
  archived: false,  // Boolean - whether matter is archived (archived matters hidden by default in UI)
  assignedTo: ['user-john-123', 'user-jane-456'],  // Array of user IDs assigned to work on matter
  responsibleLawyer: 'user-john-123',  // User ID of primary responsible lawyer

  // Development/Testing flags (optional)
  mockData: true,  // Boolean - marks development test data (allows safe clearing without deleting real matters)

  // Timestamps
  lastAccessed: Timestamp,  // Last time matter was viewed or modified
  createdAt: Timestamp,
  createdBy: 'user-john-123',
  updatedAt: Timestamp,
  updatedBy: 'user-john-123'
}
```

**Multi-Client Matters**: The `clients` array supports multiple client names for matters involving multiple parties (e.g., husband & wife estate planning).

**Status and Archived Fields**:

- `status: 'active'` - Matter is currently being worked on
- `status: 'archived'` - Matter is completed/closed and no longer active
- `archived: true` - Matter is archived and hidden from default views (can be shown via filter)
- Typically when `status` is 'archived', the `archived` field should also be `true` for consistency

**Mock Data Field** (Optional):

- `mockData: true` - Marks matters as development test data (only present on seeded matters)
- Manually created matters do not have this field
- The `clearMatters()` function only deletes matters where `mockData === true`, protecting real user data
- This safety feature prevents accidental deletion of production data during development

## Custom Claims (Firebase Auth)

Keep it **dead simple**. Solo users have `firmId === userId`:

```javascript
{
  firmId: 'firm-abc-123',  // For solo users: equals their userId
  role: 'admin'            // Solo users are always 'admin', firm members can be 'admin' | 'member'
}
```

## Common Query Patterns

### Simple, Efficient Queries

```javascript
// Get user's firm
const firm = await db.collection('firms').doc(auth.currentUser.firmId).get();

// Get firm members (already embedded)
const members = firm.data().members;

// Get all active (non-archived) matters
const matters = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .where('archived', '==', false)
  .orderBy('lastAccessed', 'desc')
  .get();

// Get matters assigned to a specific user
const userMatters = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .where('assignedTo', 'array-contains', userId)
  .where('archived', '==', false)
  .get();

// Get matters for a specific client (requires client-side filtering)
const allMatters = await db.collection('firms').doc(firmId).collection('matters').get();

const clientMatters = allMatters.docs
  .map((doc) => ({ id: doc.id, ...doc.data() }))
  .filter((matter) => matter.clients.includes('John Smith'));
```

## Architecture Benefits

### Design Advantages

- **Eliminates Special Cases**: No separate code paths for solo vs firm users
- **Simplified Security**: All data access uses firm-scoped security rules
- **Easy Upgrades**: Solo users can invite others without data migration
- **Consistent Patterns**: All queries follow the same firm-based structure
- **Duplicate Detection**: Unified deduplication across all user types

### Key Design Decisions

- Firms typically have 3-10 members (max 100)
- All apps share the same role-based permissions
- No denormalization needed for queries
- No audit trails in MVP
- Flat structure for simplicity
- Solo users are always admins of their personal firm

## Implementation Notes

### Solo User Creation Flow

1. New user signs up via Firebase Auth
2. System automatically creates a firm document with `firmId === userId`
3. Firm is marked as personal (`isPersonal: true`)
4. User is added as the sole admin member
5. Custom claims are set with `firmId` and `role: 'admin'`

### Firm Expansion

When a solo user invites others:

1. Add invitation to `pendingInvites` in firm document
2. When accepted, add new member to embedded `members` object
3. Update `isPersonal: false` if desired
4. No data migration required - all existing data remains accessible

This architecture provides a seamless path from individual use to firm collaboration while maintaining consistency throughout the application.
