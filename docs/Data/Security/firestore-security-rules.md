# Security Rules and Access Control

Last Updated: 2025-08-31

## Overview

This document defines the security rules for Firestore and Firebase Storage, ensuring proper access control for our multi-tenant firm-based architecture. The security model follows the principle of least privilege with clear firm-based isolation.

## Firestore Security Rules

### Simple, Consistent Pattern

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null &&
                            request.auth.uid == userId;
    }

    // Firm members can read firm, admins can write
    match /firms/{firmId} {
      allow read: if request.auth != null &&
                     request.auth.token.firmId == firmId;
      allow write: if request.auth != null &&
                      request.auth.token.firmId == firmId &&
                      request.auth.token.role == 'admin';
    }

    // All firm data follows same pattern
    match /firms/{firmId}/{collection}/{document} {
      allow read: if request.auth != null &&
                     request.auth.token.firmId == firmId;
      allow write: if request.auth != null &&
                      request.auth.token.firmId == firmId;
    }
  }
}
```

## Firebase Storage Security Rules

### Firm-Based File Access

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Firm members can access their firm's files
    match /firms/{firmId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
                            request.auth.token.firmId == firmId;
    }
  }
}
```

## Custom Claims Structure

### Authentication Claims

Keep it **dead simple**. Solo users have `firmId === userId`:

```javascript
{
  firmId: 'firm-abc-123',  // For solo users: equals their userId
  role: 'admin'            // Solo users are always 'admin', firm members can be 'admin' | 'member'
}
```

### Role-Based Access Control

**Admin Role Permissions**:

- Full read/write access to firm data
- Can modify firm settings and member roles
- Can invite new firm members
- Can delete firm data

**Member Role Permissions**:

- Full read/write access to firm data (matters, files)
- Cannot modify firm settings
- Cannot manage firm members
- Cannot delete the firm

**Solo User Special Case**:

- Always assigned 'admin' role for their personal firm
- Full control over their workspace
- Can invite others (converting to multi-user firm)

## Access Control Matrix

### Collection-Level Permissions

| Collection                                                           | Solo User (Admin) | Firm Admin               | Firm Member       |
| -------------------------------------------------------------------- | ----------------- | ------------------------ | ----------------- |
| `/users/{userId}`                                                    | Own document only | Own document only        | Own document only |
| `/firms/{firmId}`                                                    | Full access       | Read all, Write settings | Read only         |
| `/firms/{firmId}/matters`                                            | Full access       | Full access              | Full access       |
| File metadata collections (see [FileMetadata.md](./FileMetadata.md)) | Full access       | Full access              | Full access       |

### Data Isolation Guarantees

**Firm Isolation**:

- Users can only access data from their assigned firm
- `firmId` in custom claims enforces this at the security rule level
- Solo users have `firmId === userId` for complete isolation

**User Privacy**:

- User documents (`/users/{userId}`) only accessible by the user themselves
- No cross-user data access regardless of firm membership

**Multi-App Consistency**:

- Same security rules apply across all apps (Intranet, ListBot, etc.)
- Consistent firm-based access control model

## Security Implementation Details

### Custom Claims Validation

```javascript
// Custom claims are set server-side only
async function setCustomClaims(userId, claims) {
  await admin.auth().setCustomUserClaims(userId, {
    firmId: claims.firmId,
    role: claims.role,
  });
}

// Client-side claim access
const token = await auth.currentUser.getIdTokenResult();
const firmId = token.claims.firmId;
const role = token.claims.role;
```

### Security Rule Testing

**Valid Access Examples**:

```javascript
// User accessing their own document ✓
match /users/user-123 with auth.uid === 'user-123'

// Firm member accessing firm matter ✓
match /firms/firm-abc/matters/matter-1 with token.firmId === 'firm-abc'

// Admin modifying firm settings ✓
match /firms/firm-abc with token.firmId === 'firm-abc' && token.role === 'admin'
```

**Blocked Access Examples**:

```javascript
// User accessing another user's document ✗
match /users/user-456 with auth.uid === 'user-123'

// User accessing different firm's data ✗
match /firms/firm-xyz/matters with token.firmId === 'firm-abc'

// Member trying to modify firm settings ✗
match /firms/firm-abc with token.firmId === 'firm-abc' && token.role === 'member'
```

## Security Best Practices

### Token Management

**Automatic Token Refresh**:

- Firebase SDK handles token refresh automatically
- Custom claims included in refreshed tokens
- No manual token management required

**Claim Validation**:

- Always validate claims exist before using them
- Handle cases where claims might be null during initialization
- Use defensive programming for claim access

### Solo User to Firm Transition

**Security During Migration**:

1. **Before Migration**: User has `firmId === userId`
2. **During Migration**: Claims updated atomically
3. **After Migration**: User has `firmId === newFirmId`
4. **Data Access**: Security rules automatically enforce new access

```javascript
// Secure migration process
async function migrateSoloUserToFirm(userId, newFirmId, role) {
  // 1. Update custom claims first
  await setCustomClaims(userId, {
    firmId: newFirmId,
    role: role,
  });

  // 2. User now has access to new firm data
  // 3. Migrate data using admin SDK (bypasses security rules)
  // 4. Clean up old solo firm
}
```

### Error Handling

**Common Security Errors**:

```javascript
// Permission denied - user not authenticated
{
  code: "permission-denied",
  message: "Missing or insufficient permissions"
}

// Invalid firm access
{
  code: "permission-denied",
  message: "User cannot access this firm's data"
}

// Admin-only operation attempted by member
{
  code: "permission-denied",
  message: "Admin role required for this operation"
}
```

**Client-Side Handling**:

```javascript
try {
  const doc = await db.collection('firms').doc(firmId).get();
} catch (error) {
  if (error.code === 'permission-denied') {
    // Handle unauthorized access
    console.log('User does not have access to this firm');
  }
}
```

## Development and Testing

### Security Rule Testing

```javascript
// Test authenticated user access
const testEnv = initializeTestEnvironment({
  projectId: 'demo-project',
  rules: rulesContent,
});

const authedDb = testEnv
  .authenticatedContext('user-123', {
    firmId: 'firm-abc',
    role: 'admin',
  })
  .firestore();

// Should succeed
await assertSucceeds(authedDb.doc('firms/firm-abc').get());

// Should fail
await assertFails(authedDb.doc('firms/firm-xyz').get());
```

### Emulator Configuration

**Firebase Emulator Setup**:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "auth": {
    "port": 9099
  }
}
```

## Security Monitoring

### Access Logging

**Important Access Events**:

- Failed authentication attempts
- Permission denied errors
- Firm membership changes
- Admin privilege escalation

**Monitoring Setup**:

```javascript
// Log security events
db.collection('security-log').add({
  event: 'permission-denied',
  userId: auth.currentUser.uid,
  resource: '/firms/firm-xyz/matters',
  timestamp: new Date(),
  userAgent: navigator.userAgent,
});
```

### Audit Trail

**Key Security Events to Track**:

- Firm invitation acceptance
- Role changes (member ↔ admin)
- Solo user to firm migrations
- Firm data access attempts
- Custom claims modifications

**Implementation Note**: Audit logging is not implemented in MVP but should be added for production systems handling sensitive data.
