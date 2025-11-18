# Firebase Permissions Status

## Current Firebase Project: coryphaeus-ed11a

This is the **development** Firebase project shared across all three applications:
- Listbot.ca (ListBot)
- Coryphaeus
- Intranet

## Team Members

### Owner
- **Brahm** (brahmwhatisfair@gmail.com)
  - Full administrative access
  - Can manage all project settings, billing, and permissions

### Editor
- **Matthew Manuel** (matthew@manuel.ca)
  - Added: 2025-11-16
  - Role: Editor (full development access)
  - Can:
    - Modify Firebase services (Auth, Firestore, Storage, etc.)
    - Deploy code and functions
    - Modify security rules
    - View and modify data
    - Access all development tools
  - Cannot:
    - Delete the project
    - Modify billing settings
    - Remove Owner from project

## Verification

Matthew's permissions verified via:
```bash
gcloud projects get-iam-policy coryphaeus-ed11a --filter="bindings.members:matthew@manuel.ca"
```

Result:
```
ROLE          MEMBERS
roles/editor  user:matthew@manuel.ca
```

## GitHub Repository Access

Matthew has Write access to all three repositories in the multi-app SSO architecture:

### 1. Listbot.ca (ListBot)
- **Repository**: https://github.com/Mharbulous/Listbot.ca
- **Matthew's Role**: Write (collaborator)
- **Status**: Invitation accepted ✓
- **Branch Protection**:
  - `production` branch: Requires PR + 1 approval, enforce admins, no deletion/force-push
  - `main` branch: No deletion only

### 2. Coryphaeus
- **Repository**: https://github.com/Mharbulous/Coryphaeus
- **Matthew's Role**: Write (collaborator)
- **Status**: Invitation sent (2025-11-17)
- **Branch Protection**: None configured yet
- **Note**: No `production` branch exists yet

### 3. Intranet
- **Repository**: https://github.com/Mharbulous/Intranet
- **Matthew's Role**: Write (collaborator)
- **Status**: Invitation sent (2025-11-17)
- **Branch Protection**: None configured yet
- **Note**: No `production` branch exists yet

## Next Steps for Matthew

1. Accept GitHub invitations for Coryphaeus and Intranet repositories
2. Receive Firebase Console access email notification
3. Access Firebase Console at: https://console.firebase.google.com/project/coryphaeus-ed11a
4. Clone all three repositories:
   - `git clone https://github.com/Mharbulous/Listbot.ca.git`
   - `git clone https://github.com/Mharbulous/Coryphaeus.git`
   - `git clone https://github.com/Mharbulous/Intranet.git`
5. Use the same Firebase configuration (`.env`) across all three apps for SSO to work
6. Test multi-app SSO locally using the development Firebase project

## Production Environment (Future)

### Firebase Production Project
When ready for production:
- A separate production Firebase project will be created
- Matthew will be added with **Viewer** role (read-only)
- This mirrors the GitHub `production` branch protection model
- See `docs/firebase-project-setup.md` for details

### GitHub Branch Protection
For Coryphaeus and Intranet repositories, when ready for production:
1. Create `production` branch from `main`
2. Apply branch protection to `production`:
   - Require pull request before merging
   - Require at least 1 approval
   - Enforce for administrators
   - Prevent deletion
   - Prevent force-push
3. Apply branch protection to `main`:
   - Prevent deletion only
4. Follow same promotion model as Listbot.ca: Claude Code (web) → `main` only; manual `git merge origin/main` for production releases

## Multi-App SSO Architecture

All three applications MUST use the same Firebase project for SSO to work:
- Current development: All apps use `coryphaeus-ed11a`
- Future production: All apps will use the new production project

## Documentation

For full setup details, see:
- `docs/firebase-project-setup.md` - Complete Firebase project architecture
- `docs/firebase-add-matthew-steps.md` - Quick reference guide (manual steps)
