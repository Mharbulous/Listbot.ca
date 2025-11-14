# Firebase Hosting Deployment - Quick Tips

Concise tips for successful Firebase Hosting deployments.

---

## ✅ Configuration Tips

### Multi-Site Hosting Format
**Always use array format** for multi-site hosting in `firebase.json`:
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

### Hosting-Only Deployment
When deploying **only hosting**, remove `storage` and `firestore` sections from `firebase.json` to avoid path parsing conflicts.

---

## ✅ File Naming Rules

### No Spaces in Filenames
**Critical**: Firebase CLI cannot parse filenames with spaces. The CLI splits on spaces, causing `paths[1] undefined` errors.

**Example**:
- ❌ Bad: `BDLC Logo transparent.png`
- ✅ Good: `BDLC-Logo-transparent.png`

**How to check**:
```bash
find dist -type f -name "* *"
```

**How to fix**:
1. Rename source file (remove spaces, use hyphens/underscores)
2. Update all code references
3. Rebuild: `npm run build`
4. Deploy: `firebase deploy --only hosting:docs`

---

## ✅ Cache Management

### Clear Firebase Cache Between Attempts
Firebase caches deployment state. Clear it after fixing file issues:

```bash
rm -f .firebase/hosting.*.cache
```

Then rebuild and redeploy.

---

## ✅ Deployment Workflow

### Standard Deployment Steps
1. **Build**: `npm run build`
2. **Check filenames**: `find dist -type f -name "* *"`
3. **Clear cache**: `rm -f .firebase/hosting.*.cache`
4. **Deploy**: `firebase deploy --only hosting:docs`

### If Deployment Fails
1. Note the upload progress percentage (e.g., "39/59 files (66%)")
2. Check files around that position in sorted list
3. Look for spaces, special characters, or unusual names
4. Fix, rebuild, clear cache, redeploy

---

## ✅ Multi-Site Targeting

### Target Configuration
**In `.firebaserc`**:
```json
{
  "targets": {
    "PROJECT_ID": {
      "hosting": {
        "TARGET_NAME": ["SITE_ID"]
      }
    }
  }
}
```

**In `firebase.json`**:
```json
{
  "hosting": [
    {
      "target": "TARGET_NAME",
      "public": "dist",
      ...
    }
  ]
}
```

**Deploy command**:
```bash
firebase deploy --only hosting:TARGET_NAME
```

---

## ✅ Firebase CLI Version

### Keep CLI Updated
Update Firebase CLI regularly to avoid known bugs:

```bash
npm install -g firebase-tools@latest
```

Check version:
```bash
firebase --version
```

---

## ✅ Quick Troubleshooting

| Symptom | Solution |
|---------|----------|
| `paths[1] undefined` error | Check for spaces in filenames |
| Upload stops at same % | Check file at that position for naming issues |
| "Target not found" error | Verify `.firebaserc` targets configuration |
| Deployment succeeds but wrong site | Check `target` in `firebase.json` matches `.firebaserc` |
| Old files still deployed | Clear cache: `rm -f .firebase/hosting.*.cache` |

---

## ✅ Best Practices

1. **Never use spaces** in asset filenames (images, fonts, etc.)
2. **Use hyphens or underscores** instead: `my-file.png` or `my_file.png`
3. **Clear cache** after fixing file naming issues
4. **Rebuild before redeploying** after source file changes
5. **Test locally** with `firebase serve` before deploying
6. **Use `--only hosting:TARGET`** to deploy specific sites

---

## ✅ Common Mistakes to Avoid

- ❌ Forgetting to rebuild after renaming source files
- ❌ Not clearing Firebase cache after fixing file issues
- ❌ Using object format instead of array for multi-site hosting
- ❌ Including storage/firestore config when deploying only hosting
- ❌ Not updating code references after renaming files
- ❌ Deploying without checking for spaces in filenames first
