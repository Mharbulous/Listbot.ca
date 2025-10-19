# Firm Workflows and User Management

Last Updated: 2025-08-31

## Overview

This document describes the workflows for user registration, firm invitations, and firm data migration in our multi-tenant firm-based architecture. The system supports both solo users and collaborative firms with seamless transitions between modes.

## Solo User to Firm Workflow

### New User Registration

```javascript
async function createNewUser(userId, email, displayName) {
  // 1. Set custom claims (solo user is their own firm)
  await setCustomClaims(userId, {
    firmId: userId, // firmId === userId for solo users
    role: 'admin', // Solo users are admin of their own firm
  });

  // 2. Create user document
  await db
    .collection('users')
    .doc(userId)
    .set({
      defaultFirmId: userId,
      preferences: { theme: 'light', notifications: true },
      lastLogin: new Date(),
    });

  // 3. Create solo firm
  await db
    .collection('firms')
    .doc(userId)
    .set({
      name: `${displayName}'s Workspace`,
      description: 'Personal workspace',
      members: {
        [userId]: {
          email: email,
          role: 'admin',
          joinedAt: new Date(),
        },
      },
      pendingInvites: {},
      apps: ['intranet', 'bookkeeper'],
      settings: { timezone: 'UTC', maxMembers: 100 },
      isPersonal: true, // Flag for solo firms
      createdAt: new Date(),
      createdBy: userId,
    });
}
```

### Solo User Characteristics

**Automatic Setup**:

- Every new user gets a personal firm where `firmId === userId`
- User is automatically assigned 'admin' role for their firm
- Firm name defaults to "{Name}'s Workspace"
- `isPersonal: true` flag distinguishes solo firms

**Solo User Benefits**:

- Eliminates special cases in data storage and security
- Consistent firm-based architecture from day one
- Easy upgrade path to collaborative firms
- Perfect deduplication works the same way

## Firm Invitation Process

### 1. Admin Sends Invitation

```javascript
async function inviteUserToFirm(firmId, inviteeEmail, role = 'member') {
  const firmRef = db.collection('firms').doc(firmId);

  await firmRef.update({
    [`pendingInvites.${inviteeEmail}`]: {
      invitedBy: auth.currentUser.uid,
      invitedAt: new Date(),
      role: role,
      fromFirm: firmId,
    },
  });

  // Send invitation email (implementation dependent)
  await sendInvitationEmail(inviteeEmail, firmId, role);
}
```

### 2. User Signs Up or Logs In

When a user with a pending invitation authenticates:

```javascript
async function checkAndProcessInvitations(userId, userEmail) {
  const firmsSnapshot = await db
    .collection('firms')
    .where(`pendingInvites.${userEmail}`, '!=', null)
    .get();

  if (!firmsSnapshot.empty) {
    const invitingFirm = firmsSnapshot.docs[0];
    const invite = invitingFirm.data().pendingInvites[userEmail];

    // Get user's current firm (their solo firm)
    const currentFirm = await db.collection('firms').doc(userId).get();
    const currentFirmData = currentFirm.data();

    if (currentFirmData.isPersonal && Object.keys(currentFirmData.members).length === 1) {
      // Solo user joining another firm - migrate data
      await migrateSoloUserToFirm(userId, invitingFirm.id, invite.role);
    } else {
      // Firm founder with members - firm merger scenario
      await promptForFirmMerger(userId, invitingFirm.id, invite);
    }
  }
}
```

### 3. Firm Invitation Acceptance

```javascript
async function migrateSoloUserToFirm(userId, newFirmId, role) {
  // 1. Update custom claims
  await setCustomClaims(userId, {
    firmId: newFirmId,
    role: role,
  });

  // 2. Add user to new firm
  await db
    .collection('firms')
    .doc(newFirmId)
    .update({
      [`members.${userId}`]: {
        email: auth.currentUser.email,
        role: role,
        joinedAt: new Date(),
      },
      [`pendingInvites.${auth.currentUser.email}`]: firebase.firestore.FieldValue.delete(),
    });

  // 3. Migrate data from solo firm to new firm
  await migrateFirmData(userId, newFirmId);

  // 4. Clean up solo firm
  await db.collection('firms').doc(userId).delete();
}
```

## Firm Data Migration

### Complete Data Migration Process

```javascript
async function migrateFirmData(fromFirmId, toFirmId) {
  // Migrate all firm data collections as documented in FileMetadata.md
  const collections = ['matters', 'logs']; // File metadata collections handled separately

  for (const collectionName of collections) {
    const docs = await db.collection('firms').doc(fromFirmId).collection(collectionName).get();

    // Copy documents to new firm
    const batch = db.batch();
    docs.forEach((doc) => {
      const newDocRef = db.collection('firms').doc(toFirmId).collection(collectionName).doc(doc.id);
      batch.set(newDocRef, {
        ...doc.data(),
        migratedFrom: fromFirmId,
        migratedAt: new Date(),
      });
    });
    await batch.commit();
  }

  // Note: Firebase Storage files don't need to move -
  // we'll update storage paths in future uploads
  // or create a background job for this
}
```

### Migration Tracking

**Migration Metadata**:
Each migrated document includes:

```javascript
{
  // Original document data
  ...originalData,

  // Migration tracking
  migratedFrom: 'user-123',  // Original firm ID
  migratedAt: Timestamp      // When migration occurred
}
```

### Storage File Migration

**Current Approach**: Files remain in original storage paths

- File references in metadata remain valid
- New uploads use new firm paths
- Background job can relocate files later if needed

**Future Enhancement**: Background storage migration

```javascript
async function migrateStorageFiles(fromFirmId, toFirmId) {
  // List all files in old firm path
  const listRef = storage.ref(`firms/${fromFirmId}`);
  const files = await listRef.listAll();

  // Copy files to new firm path
  for (const fileRef of files.items) {
    const newPath = fileRef.fullPath.replace(`firms/${fromFirmId}`, `firms/${toFirmId}`);
    await fileRef.copy(storage.ref(newPath));
  }

  // Delete old files after successful copy
  for (const fileRef of files.items) {
    await fileRef.delete();
  }
}
```

## Firm Management Workflows

### Adding Firm Members

```javascript
async function addFirmMember(firmId, userId, email, role = 'member') {
  // Update firm document
  await db
    .collection('firms')
    .doc(firmId)
    .update({
      [`members.${userId}`]: {
        email: email,
        role: role,
        joinedAt: new Date(),
      },
    });

  // Update user's custom claims
  await setCustomClaims(userId, {
    firmId: firmId,
    role: role,
  });

  // Update user's default firm
  await db.collection('users').doc(userId).update({
    defaultFirmId: firmId,
  });
}
```

### Removing Firm Members

```javascript
async function removeFirmMember(firmId, userId) {
  // Remove from firm document
  await db
    .collection('firms')
    .doc(firmId)
    .update({
      [`members.${userId}`]: firebase.firestore.FieldValue.delete(),
    });

  // Create new solo firm for removed user
  const user = await auth.getUser(userId);
  await createNewUser(userId, user.email, user.displayName || 'User');
}
```

### Changing Member Roles

```javascript
async function changeMemberRole(firmId, userId, newRole) {
  // Update firm document
  await db
    .collection('firms')
    .doc(firmId)
    .update({
      [`members.${userId}.role`]: newRole,
    });

  // Update custom claims
  await setCustomClaims(userId, {
    firmId: firmId,
    role: newRole,
  });
}
```

## Firm Merger Scenarios

### When Solo User Has Built a Firm

If a solo user has invited others and built a firm, then receives an invitation:

```javascript
async function promptForFirmMerger(userId, invitingFirmId, invite) {
  // Present options to user:
  // 1. Join inviting firm (migrate all data and members)
  // 2. Invite the inviting firm to join their firm
  // 3. Decline invitation

  const choice = await presentMergerOptions(invite);

  switch (choice) {
    case 'join_inviting_firm':
      await mergeFirmIntoFirm(userId, invitingFirmId);
      break;
    case 'counter_invite':
      await sendCounterInvitation(userId, invitingFirmId);
      break;
    case 'decline':
      await declineInvitation(userId, invite);
      break;
  }
}
```

### Complete Firm Merger

```javascript
async function mergeFirmIntoFirm(fromFirmId, toFirmId) {
  const fromFirm = await db.collection('firms').doc(fromFirmId).get();
  const fromFirmData = fromFirm.data();

  // Migrate all firm members
  const batch = db.batch();
  for (const [userId, member] of Object.entries(fromFirmData.members)) {
    // Add to new firm
    const toFirmRef = db.collection('firms').doc(toFirmId);
    batch.update(toFirmRef, {
      [`members.${userId}`]: {
        ...member,
        migratedFrom: fromFirmId,
        migratedAt: new Date(),
      },
    });

    // Update user's custom claims
    await setCustomClaims(userId, {
      firmId: toFirmId,
      role: member.role,
    });
  }
  await batch.commit();

  // Migrate all firm data
  await migrateFirmData(fromFirmId, toFirmId);

  // Clean up old firm
  await db.collection('firms').doc(fromFirmId).delete();
}
```

## Invitation Management

### Pending Invitation Queries

```javascript
// Find all pending invitations for a user
async function getPendingInvitations(userEmail) {
  const invitations = [];
  const firmsSnapshot = await db
    .collection('firms')
    .where(`pendingInvites.${userEmail}`, '!=', null)
    .get();

  firmsSnapshot.forEach((doc) => {
    const firm = doc.data();
    const invitation = firm.pendingInvites[userEmail];
    invitations.push({
      firmId: doc.id,
      firmName: firm.name,
      ...invitation,
    });
  });

  return invitations;
}
```

### Invitation Cleanup

```javascript
// Remove expired invitations (run periodically)
async function cleanupExpiredInvitations() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - 30); // 30 day expiration

  const firmsSnapshot = await db.collection('firms').get();

  const batch = db.batch();
  firmsSnapshot.forEach((doc) => {
    const firm = doc.data();
    const updates = {};

    for (const [email, invite] of Object.entries(firm.pendingInvites || {})) {
      if (invite.invitedAt.toDate() < expirationDate) {
        updates[`pendingInvites.${email}`] = firebase.firestore.FieldValue.delete();
      }
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
    }
  });

  await batch.commit();
}
```

## Error Handling and Edge Cases

### Common Edge Cases

**User Already in Firm**:

```javascript
async function handleExistingMember(firmId, userEmail) {
  // Check if user is already a member
  const firm = await db.collection('firms').doc(firmId).get();
  const members = firm.data().members || {};

  const existingMember = Object.values(members).find((m) => m.email === userEmail);
  if (existingMember) {
    throw new Error('User is already a firm member');
  }
}
```

**Firm Size Limits**:

```javascript
async function validateFirmSize(firmId) {
  const firm = await db.collection('firms').doc(firmId).get();
  const firmData = firm.data();
  const currentSize = Object.keys(firmData.members).length;
  const maxSize = firmData.settings.maxMembers || 100;

  if (currentSize >= maxSize) {
    throw new Error(`Firm has reached maximum size of ${maxSize} members`);
  }
}
```

**Invalid Email Invitations**:

```javascript
async function validateInvitationEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }

  // Check if email is already a firm member
  await handleExistingMember(firmId, email);
}
```

### Transaction Safety

**Atomic Operations**:

```javascript
async function atomicFirmMigration(userId, fromFirmId, toFirmId) {
  const batch = db.batch();

  try {
    // All operations in single batch for atomicity
    batch.update(db.collection('firms').doc(toFirmId), {
      [`members.${userId}`]: memberData,
    });

    batch.delete(db.collection('firms').doc(fromFirmId));

    await batch.commit();

    // Update custom claims after Firestore changes
    await setCustomClaims(userId, { firmId: toFirmId, role: newRole });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
```

## Future Considerations

### Scalability Enhancements

**Large Firm Support** (if needed):

- Move members to subcollection when firm exceeds 100 members
- Implement member pagination for large firms
- Add member search and filtering capabilities

**Advanced Permissions** (if needed):

- Role-based permissions per app
- Custom permission sets beyond admin/member
- Resource-level access control (per matter, client, etc.)

**Audit and Compliance** (if needed):

- Complete audit trail for firm changes
- Member activity tracking
- Data retention policies for departed members
