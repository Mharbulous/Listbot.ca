# Security Rules and Access Control

**Reconciled up to**: 2025-11-18
Last Updated: 2025-08-31

> **⚠️ CRITICAL NOTICE: This document describes the PLANNED production security architecture.**
> **The current codebase implements MVP-level security rules for development.**
> See [Current Implementation vs. Planned Architecture](#current-implementation-vs-planned-architecture) below.

## Key Files

- `firestore.rules` - Firestore security rules (current: development mode)
- `storage.rules` - Firebase Storage security rules (current: solo-firm only)
- `src/core/stores/auth/` - Authentication state management (decomposed module)
  - `authStore.js` - Main auth state machine
  - `authFirmSetup.js` - Firm setup logic
  - `authStateHandlers.js` - Auth state handlers

## Overview

This document defines the **planned production** security rules for Firestore and Firebase Storage, ensuring proper access control for our multi-tenant firm-based architecture. The security model follows the principle of least privilege with clear firm-based isolation.

## Current Implementation vs. Planned Architecture

### Current MVP Implementation (as of 2025-11-18)

**Firestore Rules** - ❌ Development Mode:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
- Wide-open access for all authenticated users
- No firm isolation
- No role-based access control
- **Status**: Development/testing only - NOT production ready

**Storage Rules** - ⚠️ Solo Firm Only:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /firms/{firmId}/matters/{matterId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
                           request.auth.uid == firmId;  // Solo firm
    }
  }
}
```
- Works only for solo users (where `firmId === userId`)
- No multi-tenant firm support
- No custom claims validation
- **Status**: Partially implemented - covers solo firm use case

**Custom Claims** - ❌ Not Implemented:
- No custom claims (`firmId`, `role`) in auth tokens
- No server-side claim management
- Auth store uses basic Firebase Authentication only

**Migration Path**: See [Migration Roadmap](#migration-roadmap) section below.

---

## Planned Production Security Rules

The following sections describe the **target architecture** for production deployment.

## Firestore Security Rules (Planned)

### Simple, Consistent Pattern

**Implementation Status**: ❌ Not Implemented

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

## Firebase Storage Security Rules (Planned)

### Firm-Based File Access

**Implementation Status**: ⚠️ Partially Implemented (solo firm only)

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

## Custom Claims Structure (Planned)

### Authentication Claims

**Implementation Status**: ❌ Not Implemented

Keep it **dead simple**. Solo users have `firmId === userId`:

```javascript
{
  firmId: 'firm-abc-123',  // For solo users: equals their userId
  role: 'admin'            // Solo users are always 'admin', firm members can be 'admin' | 'member'
}
```

### Role-Based Access Control

**Implementation Status**: ❌ Not Implemented

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

## Access Control Matrix (Planned)

### Collection-Level Permissions

**Implementation Status**: ❌ Not Implemented

| Collection                                                                                  | Solo User (Admin) | Firm Admin               | Firm Member       |
| ------------------------------------------------------------------------------------------- | ----------------- | ------------------------ | ----------------- |
| `/users/{userId}`                                                                           | Own document only | Own document only        | Own document only |
| `/firms/{firmId}`                                                                           | Full access       | Read all, Write settings | Read only         |
| `/firms/{firmId}/matters`                                                                   | Full access       | Full access              | Full access       |
| File metadata collections (see @docs/Features/Organizer/Data/file-metadata-schema.md) | Full access       | Full access              | Full access       |

### Data Isolation Guarantees (Planned)

**Implementation Status**: ❌ Not Implemented

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

## Security Implementation Details (Planned)

### Custom Claims Validation

**Implementation Status**: ❌ Not Implemented

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

### Security Rule Testing (Planned)

**Implementation Status**: ❌ Not Implemented

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

## Security Best Practices (Planned)

### Token Management

**Implementation Status**: ⚠️ Partial (basic Firebase auth only)

**Automatic Token Refresh**:

- Firebase SDK handles token refresh automatically
- Custom claims included in refreshed tokens
- No manual token management required

**Claim Validation**:

- Always validate claims exist before using them
- Handle cases where claims might be null during initialization
- Use defensive programming for claim access

### Solo User to Firm Transition (Planned)

**Implementation Status**: ❌ Not Implemented

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

**Implementation Status**: ⚠️ Partial (basic permission errors only)

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

### Security Rule Testing (Planned)

**Implementation Status**: ❌ Not Implemented

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

**Implementation Status**: ✅ Implemented (basic emulator setup)

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

## Security Monitoring (Planned)

### Access Logging

**Implementation Status**: ❌ Not Implemented

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

### Audit Trail (Planned)

**Implementation Status**: ❌ Not Implemented

**Key Security Events to Track**:

- Firm invitation acceptance
- Role changes (member ↔ admin)
- Solo user to firm migrations
- Firm data access attempts
- Custom claims modifications

**Implementation Note**: Audit logging is not implemented in MVP but should be added for production systems handling sensitive data.

---

## Migration Roadmap

### Phase 1: Custom Claims Infrastructure
- [ ] Implement server-side custom claims management (Cloud Functions)
- [ ] Add `firmId` and `role` to auth tokens
- [ ] Update auth store to read and validate custom claims
- [ ] Add claim refresh logic to auth state machine

### Phase 2: Firestore Security Rules
- [ ] Replace development rules with production firm-based rules
- [ ] Implement user document isolation
- [ ] Add firm-level read/write rules with claim validation
- [ ] Add role-based write restrictions (admin vs. member)
- [ ] Test with Firebase emulator and rule testing framework

### Phase 3: Storage Security Rules
- [ ] Update storage rules to use custom claims (`token.firmId`)
- [ ] Remove solo-firm-only restriction
- [ ] Test multi-tenant file access

### Phase 4: RBAC Implementation
- [ ] Implement admin vs. member permission checks in UI
- [ ] Add role validation in composables (e.g., `useFirmMembers`)
- [ ] Create admin-only components and routes
- [ ] Add role-based feature flags

### Phase 5: Testing & Monitoring
- [ ] Write comprehensive security rule tests
- [ ] Implement access logging for security events
- [ ] Add audit trail for critical operations
- [ ] Perform security audit and penetration testing

### Phase 6: Solo-to-Firm Migration
- [ ] Implement secure migration function
- [ ] Test data migration with security rules
- [ ] Add UI for firm invitations and member management

**Estimated Timeline**: 6-8 weeks for full production security implementation
