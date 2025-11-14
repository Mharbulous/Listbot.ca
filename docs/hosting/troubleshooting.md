# Firebase Hosting Deployment - Troubleshooting Guide

This document tracks issues encountered during Firebase Hosting deployment and their solutions, to prevent repeating the same errors.

## Date: 2025-11-13

### Project Context
- **Application**: Bookkeeper Vue 3 SPA
- **Firebase Project**: coryphaeus-ed11a
- **Target Domain**: docs.listbot.ca
- **Hosting Site**: docs-7762f

---

## Issue #1: "paths[1] argument must be of type string. Received undefined"

### Error Details
```
Error: Task [hash] failed: retries exhausted after 6 attempts, with error:
The "paths[1]" argument must be of type string. Received undefined
```

**When it occurred**: During `firebase deploy --only hosting:docs` command
**Upload progress**: Initial failures at 4-75%, breakthrough to 66% after filename fix
**Firebase CLI Version**: Initially 11.x, then updated to 14.x

### Solutions Attempted (Chronological)

#### 1. ❌ Clear Preview Channel and Retry
**Command**: `firebase hosting:channel:delete preview`
**Result**: Failed - preview channel did not exist
**Outcome**: No change to deployment error

#### 2. ❌ Update Firebase CLI
**Command**: `npm install -g firebase-tools@latest`
**Result**: Successfully updated from v11.x to v14.x (752 packages changed)
**Outcome**: Error persisted after update

#### 3. ❌ Fix firebase.json Array Format for Multi-Site
**Issue**: Multi-site hosting requires `hosting` to be an array, not an object
**Change Made**:
```json
// BEFORE (incorrect)
{
  "hosting": {
    "target": "docs",
    "public": "dist",
    ...
  }
}

// AFTER (correct)
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
**Result**: Error persisted after fix
**Outcome**: Array format is correct, but didn't resolve the issue

#### 4. ❌ Remove Storage/Firestore from firebase.json
**Research Finding**: Having storage and firestore configurations in firebase.json can cause deployment errors when deploying only hosting, especially if those services aren't properly configured for multi-site hosting.

**Change Made**:
```json
// BEFORE
{
  "hosting": [...],
  "storage": {
    "rules": "storage.rules"
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}

// AFTER
{
  "hosting": [...]
}
```
**Result**: Error persisted after removing storage/firestore
**Outcome**: This was correct for hosting-only deployment, but didn't resolve the paths error

#### 5. ✅ **SOLUTION: Remove Spaces from Filenames**
**Discovery**: Found file with space in name: `BDLC Logo transparent.png` in `/src/assets/images/`
**Problem**: Firebase CLI parser splits filenames on spaces, causing `paths[1]` to be undefined
**Research**: Confirmed via Stack Overflow that spaces in file paths cause Firebase deployment errors

**Fix Applied**:
1. Renamed file: `BDLC Logo transparent.png` → `BDLC-Logo-transparent.png`
2. Updated reference in `src/components/layout/AppSideBar.vue`
3. Rebuilt: `npm run build`
4. Deployed: `firebase deploy --only hosting:docs`

**Result**: ✅ **SIGNIFICANT PROGRESS** - Upload went from 4% to 66% (39/59 files)
**Outcome**: First major breakthrough, but error recurred at 66% indicating a second problematic file exists

#### 6. ⏳ Clear Firebase Hosting Cache (In Progress)
**Rationale**: Firebase caches deployment state in `.firebase/hosting.ZGlzdA.cache` which may contain stale file references
**Command**: `rm -f .firebase/hosting.ZGlzdA.cache`
**Status**: Cleared cache, testing deployment
**Expected Outcome**: May resolve conflicts between old and new file references

---

## Configuration Files Reference

### .firebaserc (Current)
```json
{
  "projects": {
    "default": "coryphaeus-ed11a"
  },
  "targets": {
    "coryphaeus-ed11a": {
      "hosting": {
        "docs": [
          "docs-7762f"
        ]
      }
    }
  }
}
```

### firebase.json (Current)
```json
{
  "hosting": [
    {
      "target": "docs",
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

---

## Research Sources

### Stack Overflow / GitHub Issues
- **Firebase CLI GitHub Issue #1915**: "TypeError [ERR_INVALID_ARG_TYPE]: The 'path' argument must be of type string"
- **Firebase CLI GitHub Issue #2233**: "The 'path' argument must be of type string. Received undefined"
- **Stack Overflow**: "firebase deploy gives a 'path' error"
- **Stack Overflow**: "Firebase deploy errors starting with non-zero exit code (space in project path)"

### Key Findings
1. **Multi-site hosting requires array format** for the `hosting` property in firebase.json
2. **Storage/Firestore configurations can interfere** with hosting-only deployments
3. **The "public" argument is required** and the folder must exist (even if empty)
4. **Spaces in filenames cause path parsing errors** - Firebase CLI splits on spaces
5. **firebase-debug.log** may contain additional error details (check project root after failed deployment)

---

## Deployment Commands Reference

### Multi-Site Hosting Deployment
```bash
# Deploy to specific target
firebase deploy --only hosting:docs

# Deploy to default site
firebase deploy --only hosting

# List all hosting sites
firebase hosting:sites:list

# Create new hosting site
firebase hosting:sites:create <site-name>

# Apply target to site
firebase target:apply hosting <target-name> <site-name>

# Clear Firebase cache
rm -f .firebase/hosting.*.cache
```

---

## Troubleshooting Workflow

When encountering `paths[1] undefined` error:

1. **Check for spaces in filenames**
   ```bash
   find dist -type f -name "* *"
   ```

2. **Check for special characters in filenames** (if spaces not found)
   ```bash
   find dist -type f | grep -E "[^a-zA-Z0-9._/-]"
   ```

3. **Clear Firebase hosting cache**
   ```bash
   rm -f .firebase/hosting.*.cache
   ```

4. **Rebuild dist folder**
   ```bash
   npm run build
   ```

5. **Deploy with verbose logging** (if needed)
   ```bash
   firebase deploy --only hosting:docs --debug
   ```

---

## Successful Deployment Checklist (Once Resolved)

- [ ] Site deployed successfully to https://docs-7762f.web.app
- [ ] Add custom domain docs.listbot.ca in Firebase Console
- [ ] Configure CNAME record at domain registrar: `docs.listbot.ca` → `docs-7762f.web.app`
- [ ] Wait for SSL certificate provisioning (24-48 hours)
- [ ] Verify site loads at custom domain with HTTPS
- [ ] Re-add storage and firestore configurations if needed
- [ ] Test storage and firestore deployments separately

---

## Notes

- **Build Info**: 83 files in dist folder, main bundle 2MB (603kB gzipped)
- **Build Warnings**: Dynamic/static import conflicts with Firebase modules (non-blocking)
- **Previous Successful Deployment**: Default site (coryphaeus-ed11a.web.app) deployed successfully before multi-site configuration
- **Progress Tracking**:
  - Initial: 1/21 files (4%)
  - After filename fix: 39/59 files (66%)
  - Indicates second problematic file around position 40 in sorted file list
