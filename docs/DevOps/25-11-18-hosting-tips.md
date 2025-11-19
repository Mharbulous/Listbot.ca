# Firebase Hosting Deployment - Tips That Actually Work

**Reconciled up to**: 2025-11-18

## Key Files

- `firebase.json` - Multi-site hosting configuration with array format
- `.firebaserc` - Firebase targets and project configuration

---

## Context

This document provides troubleshooting tips for Firebase hosting deployment issues encountered during the deployment process. For the complete promotion and deployment workflow, see @docs/DevOps/deployment-promotion.md.

This document contains ONLY the non-obvious solutions that required research to discover.

---

## ✅ THE FIX: Remove Spaces from Filenames

### The Problem
Firebase CLI error: `The "paths[1]" argument must be of type string. Received undefined`

**Root Cause**: Firebase CLI cannot parse filenames containing spaces. When it encounters a space, it splits the filename into multiple path components, causing `paths[1]` to be undefined.

**Solution**: Remove ALL spaces from asset filenames before building. Use `find src -type f -name "* *"` to locate them.

---

## Our Specific Case

We had **3 files** with spaces that prevented deployment:

1. `src/assets/images/BDLC Logo transparent.png` → `BDLC-Logo-transparent.png`
   - **Impact**: Deployment went from 4% to 66%
2. `src/assets/images/LOGO with name.jpg` → `LOGO-with-name.jpg`
3. `src/assets/images/snapshots/Tasks Menu.png` → `Tasks-Menu.png`

**After renaming all 3 files**: ✅ Deployment succeeded 100%

---

## Required Configuration (Didn't Fix Error, But Necessary)

### 1. Use Array Format in firebase.json

Multi-site hosting requires array format:
```json
{
  "hosting": [
    {
      "target": "docs",
      "public": "dist",
      ...
    }
  ]
}
```

### 2. Remove Storage/Firestore When Deploying Only Hosting

Remove `storage` and `firestore` sections from firebase.json to prevent path parsing conflicts:
```json
{
  "hosting": [...]
  // Remove: "storage": {...}, "firestore": {...}
}
```

### 3. Configure Targets in .firebaserc

Required for multi-site deployment:
```json
{
  "projects": { "default": "PROJECT_ID" },
  "targets": {
    "PROJECT_ID": {
      "hosting": { "TARGET_NAME": ["SITE_ID"] }
    }
  }
}
```

---

## What DIDN'T Help

These actions did NOT resolve the deployment error:
- ❌ Updating Firebase CLI
- ❌ Clearing preview channels
- ❌ Clearing Firebase cache

**The ONLY thing that fixed the deployment error was removing spaces from filenames.**
