# Quick Guide: Add Matthew to Firebase Development Project

## Steps to Complete Now

### 1. Add Matthew as Editor to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your current Firebase project
3. Click the gear icon (⚙️) → **Project settings**
4. Click the **Users and permissions** tab
5. Click **Add member**
6. Enter: `matthew@manuel.ca`
7. Select role: **Editor**
8. Click **Add member**

**Result**: Matthew will receive an email invitation to access the Firebase project with full development permissions.

### 2. Verify Matthew's Access

Once Matthew accepts the invitation, he should be able to:
- View all Firebase services (Authentication, Firestore, Storage, etc.)
- Modify security rules
- View and modify data
- Deploy Firebase functions (if you add them later)
- Manage Firebase configuration

### 3. Update Environment Files (Optional for now)

You can optionally copy your current `.env` to `.env.development` to make it clear this is the development configuration:

```bash
cp .env .env.development
```

Then add a comment at the top of `.env.development`:
```
# Development Firebase Configuration (Current Project)
```

## What Matthew Can Do

With Editor role on the Firebase project, Matthew can:
- ✅ Test authentication flows
- ✅ Create/modify Firestore security rules
- ✅ Create/modify Storage security rules
- ✅ View and modify data in Firestore
- ✅ View and modify files in Storage
- ✅ Deploy and test Firebase features
- ✅ View Analytics and monitoring

## What Matthew Cannot Do

- ❌ Delete the Firebase project
- ❌ Change billing settings
- ❌ Remove you (the Owner) from the project
- ❌ Modify project-level settings like project ID

## Production Project (Future)

When you create the production Firebase project later:
- Matthew will be added as **Viewer** role (read-only)
- This mirrors your GitHub `production` branch protection
- Only you (Owner) can make changes to production Firebase

## Next Steps

After Matthew is added:
1. Matthew should clone all three repositories (Listbot, Coryphaeus, Intranet)
2. All three should use the same `.env` file with the dev Firebase project
3. Test that SSO works across all three apps locally
4. Matthew can start contributing to development work

## Documentation Reference

For full details, see: `docs/firebase-project-setup.md`
