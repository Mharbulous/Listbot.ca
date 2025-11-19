# Firebase Project Setup - Dev vs Production

## Overview

This project will eventually use **two separate Firebase projects** to mirror the GitHub branch protection model:
- **Development Firebase Project**: Used for active development and testing (CURRENT PROJECT)
- **Production Firebase Project**: Used for production deployments only (TO BE CREATED LATER)

This separation provides the same protection model as GitHub branches:
- Development work happens freely in the dev Firebase project (like `main` branch)
- Production Firebase requires manual promotion process (like `production` branch)

## Current Status (Pre-Alpha)

**The existing Firebase project = Development environment**

Since the project is in pre-alpha with no user data:
- The current Firebase project serves as the **development environment**
- Production Firebase project will be created when ready for production deployment
- All current development work uses the dev Firebase project

## Multi-App SSO Considerations

**CRITICAL**: This project is part of a multi-app SSO architecture with three applications:
- Listbot.ca (ListBot)
- Coryphaeus
- Intranet

All three apps must share the **same Firebase project** within each environment:
- All apps use dev Firebase project during development
- All apps use production Firebase project in production

## Firebase Projects

### Development Firebase Project (CURRENT)
- **Status**: Active - this is your existing Firebase project
- **Purpose**: Active development and testing
- **Access Control**:
  - Owner: Brahm
  - Editor: Matthew (matthew@manuel.ca) - full development access
- **Usage**: Daily development work, testing new features
- **Project Details**: [Your current Firebase project - see Step 1 to document]

### Production Firebase Project (FUTURE)
- **Status**: Not yet created - will be created when ready for production deployment
- **Purpose**: Production deployments only
- **Access Control** (when created):
  - Owner: Brahm (primary administrator)
  - Matthew: Viewer role (read-only, can monitor but not modify)
- **Usage**: Only updated via manual promotion from dev project after testing
- **Project Details**: [Will be created later - see "Creating Production Project" section below]

## Immediate Setup Steps (Pre-Alpha)

### Step 1: Document Current (Dev) Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your current Firebase project
3. Navigate to Project Settings (gear icon)
4. Document the following:
   - Project ID
   - Project number
   - All enabled services (Auth, Firestore, Storage, etc.)
   - Authorized domains (under Authentication → Settings → Authorized domains)

**Action**: This becomes your **development** Firebase project

### Step 2: Add Matthew to Current (Dev) Firebase Project

1. In Firebase Console, go to your current project
2. Navigate to Project Settings → Users and permissions
3. Click "Add member"
4. Add Matthew (matthew@manuel.ca) with **Editor** role
   - Editor = full development access to all services

**Action**: Matthew can now develop alongside you in the dev environment

### Step 3: Label Environment Files for Development

Since your current `.env` file is for development:

1. Copy your current `.env` to `.env.development`
2. Update `.env.development` to clearly indicate it's the dev environment:
   ```bash
   # Development Firebase Configuration (Current Project)
   VITE_FIREBASE_API_KEY=your-current-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-current-auth-domain
   # ... rest of current config

   VITE_APP_ENV=development
   ```
3. Keep your `.env` file as-is (it already points to dev)

**Action**: Makes it clear this is the development environment

n## Creating Production Firebase Project (Future)

When ready for production deployment, create a separate production Firebase project:

### Step 1: Create Production Firebase Project

1. In Firebase Console, click "Add project"
2. Name it clearly: `Listbot-Production` or similar
3. Enable the same services as your dev project:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Any other services your dev project uses

4. Configure each service:
   - **Authentication**: Enable Email/Password provider
   - **Firestore**: Copy security rules from dev project
   - **Storage**: Copy security rules from dev project
   - **Authorized domains**: Add production domains (listbot.ca, etc.)

### Step 2: Add Team Members to Production Project

1. Project Settings → Users and permissions
2. Add Matthew (matthew@manuel.ca) as **Viewer** role
   - Read-only access mirrors GitHub production branch protection

### Step 3: Create `.env.production` File

After creating the production Firebase project:

```bash
# Production Firebase Configuration
VITE_FIREBASE_API_KEY=prod-api-key
VITE_FIREBASE_AUTH_DOMAIN=prod-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prod-project-id
VITE_FIREBASE_STORAGE_BUCKET=prod-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=prod-sender-id
VITE_FIREBASE_APP_ID=prod-app-id

VITE_APP_ENV=production
VITE_APP_DOMAIN=listbot.ca
VITE_ENABLE_AI_FEATURES=true
VITE_AI_MAX_FILE_SIZE_MB=20
```

### Step 4: Update All Three Apps

Remember: All three apps (Listbot, Coryphaeus, Intranet) must use the same production Firebase project.


## Development Workflow

### Daily Development (Main Branch)
1. Work locally with `.env` pointing to **dev Firebase project**
2. All three apps (Listbot, Coryphaeus, Intranet) use dev project
3. Test freely - dev project data can be wiped anytime
4. Push to `main` branch after testing

### Production Release (Production Branch)
1. Merge `main` → `production` branch via `git merge origin/main`
2. Production deployment builds with `.env.production`
3. All three apps use **production Firebase project**
4. Production Firebase data is protected (only manual changes)

## Security Rules Synchronization

When you update security rules in development:

1. Test rules thoroughly in dev Firebase project
2. Export rules from dev project
3. After merge to production, manually apply rules to production Firebase project
4. Test in production environment

**Never develop/test rules directly in production Firebase project.**

## Data Migration Between Projects

Since dev and production are separate Firebase projects:
- User accounts are separate
- Data does not automatically sync
- Test data in dev project
- Promote schema/structure changes manually to production

This isolation is intentional and mirrors your GitHub branch protection model.

## Troubleshooting

### SSO Not Working
- Verify all three apps use the **same** Firebase project for the environment
- Check authorized domains in Firebase Console include your domain
- Confirm `.env` files are identical across all three app directories

### Wrong Firebase Project
- Check which `.env` file is active
- Verify `VITE_FIREBASE_PROJECT_ID` matches expected project
- Check browser dev tools → Application → IndexedDB for active Firebase project

## Immediate Next Steps (Pre-Alpha)

1. [ ] Add Matthew (matthew@manuel.ca) as Editor to current (dev) Firebase project
2. [ ] Copy current `.env` to `.env.development` for clarity
3. [ ] Update Coryphaeus and Intranet repos with same Firebase project (dev)
4. [ ] Test SSO with dev Firebase project across all three apps

## Future Steps (When Ready for Production)

1. [ ] Create production Firebase project
2. [ ] Add Matthew as Viewer to production Firebase project
3. [ ] Create `.env.production` files in all three apps
4. [ ] Test production deployment process
