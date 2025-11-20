---
allowed-tools: Bash(git):*, Bash(npm):*, Bash(gh):*, TodoWrite, AskUserQuestion
description: Automate production promotion workflow with validation, auto-versioning, and tagging
---

# Production Promotion Workflow (`/produce`)

Automate the complete promotion of main branch to production with pre-flight validation, auto-increment versioning, squash merge, and automatic tagging.

## Workflow Overview

You will execute the following automated workflow:

1. **Pre-flight Validation** - Verify tests pass, build succeeds, git status clean
2. **Version Auto-increment** - Read latest tag, prompt for bump type, calculate next version
3. **PR Creation** - Create promotion PR from main to production
4. **GitHub Merge** - Guide user through approval and squash merge
5. **Post-merge Automation** - Pull production, create tag, push tag
6. **Cleanup** - Return to main branch, display success summary

## Step 1: Pre-flight Validation

Create a todo list to track the promotion workflow:

```
TodoWrite:
- Pre-flight validation
- Version selection
- Create promotion PR
- GitHub merge approval
- Tag and push release
- Return to main branch
```

**Run the following validation checks in sequence:**

### 1.1 Verify Git Status
```bash
git status
git branch --show-current
```

**Requirements:**
- Must be on `main` branch
- Working directory must be clean (no uncommitted changes)
- If not met: STOP and tell user to commit/stash changes first

### 1.2 Fetch Latest and Pull Main
```bash
git fetch origin
git pull origin main
```

### 1.3 Run Tests
```bash
npm run test:run -- --exclude tests/sso-e2e.test.js 2>&1 | tail -20
```

**If tests fail:** STOP the workflow and report test failures to user. Do NOT proceed with promotion.

### 1.4 Run Build
```bash
npm run build
```

**If build fails:** STOP the workflow and report build errors to user. Do NOT proceed with promotion.

**Mark "Pre-flight validation" as completed** in todo list.

## Step 2: Version Auto-increment

### 2.1 Get Latest Production Tag
```bash
git fetch origin production
git describe --tags --abbrev=0 origin/production 2>/dev/null || echo "No tags found"
```

Parse the latest tag (e.g., `v1.0.7-PhaseB-Upload-Server-Deduplication`)

### 2.2 Prompt for Version Bump Type

Use AskUserQuestion to ask:
- Question: "What type of version bump for this release?"
- Header: "Version Bump"
- Options:
  - "Patch (v1.0.8)" - Bug fixes and minor improvements
  - "Minor (v1.1.0)" - New features, non-breaking changes
  - "Major (v2.0.0)" - Breaking changes or major updates
  - "Custom version" - I'll specify exact version number

### 2.3 Calculate Next Version

Based on user selection:
- **Patch**: Increment patch number (v1.0.7 → v1.0.8)
- **Minor**: Increment minor, reset patch (v1.0.7 → v1.1.0)
- **Major**: Increment major, reset minor/patch (v1.0.7 → v2.0.0)
- **Custom**: Ask user to provide exact version string

### 2.4 Ask for Release Description

Use AskUserQuestion or simply ask in conversation:
- "Provide a brief description of key changes in this release (will be used in PR body)"

**Expected format:**
```
- Feature: Added file deduplication with copy metadata
- Fix: Resolved upload retry logic bug
- Refactor: Decomposed auth module into focused files
```

**Mark "Version selection" as completed** in todo list.

## Step 3: Create Promotion PR

### 3.1 Generate PR Body

Create comprehensive PR body:
```
Promotion from main to production for [VERSION]

## Version
[VERSION]

## Changes
[USER PROVIDED DESCRIPTION]

## Testing
- [x] All tests passing on main
- [x] Build successful
- [x] Pre-flight validation completed
- [x] Ready for production deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 3.2 Create PR with GitHub CLI
```bash
gh pr create \
  --base production \
  --head main \
  --title "Release [VERSION]" \
  --body "[PR BODY FROM ABOVE]"
```

Capture the PR URL from the command output.

**Mark "Create promotion PR" as completed** in todo list.

## Step 4: GitHub Merge Approval

Display clear instructions to user:

```
📋 GitHub Merge Required

PR Created: [PR_URL]

Please complete these steps on GitHub:

1. **Temporarily disable branch protection** (if needed):
   - Go to Settings → Branches → production rule
   - Uncheck "Include administrators"
   - Save changes

2. **Approve and merge the PR**:
   - Go to the PR: [PR_URL]
   - Refresh the page (Ctrl+F5)
   - Click "Squash and merge" dropdown
   - Select "Squash and merge" (IMPORTANT: not regular merge!)
   - Confirm the merge

3. **Re-enable branch protection**:
   - Go back to Settings → Branches → production rule
   - Re-check "Include administrators"
   - Save changes

When you've completed the squash merge on GitHub, type "done" or "merged" to continue.
```

**Wait for user confirmation** that merge is complete.

**Mark "GitHub merge approval" as completed** in todo list.

## Step 5: Post-Merge Automation

After user confirms merge is complete:

### 5.1 Pull Production and Create Tag
```bash
git fetch origin && \
git checkout production && \
git pull origin production && \
git tag -a [VERSION] -m "Release version [VERSION]" && \
git push origin [VERSION]
```

### 5.2 Verify Tag Was Pushed
```bash
git tag -l "[VERSION]"
```

Expected output: `[VERSION]`

**Mark "Tag and push release" as completed** in todo list.

## Step 6: Cleanup and Summary

### 6.1 Return to Main Branch
```bash
git checkout main
```

**Mark "Return to main branch" as completed** in todo list.

### 6.2 Display Success Summary

```
✅ Production Promotion Complete!

📦 Version: [VERSION]
🔗 PR: [PR_URL]
🏷️ Tag: [VERSION]
🌐 GitHub Release: https://github.com/Mharbulous/Listbot.ca/releases/tag/[VERSION]

Next Steps:
- Verify production branch: git log production -1
- View all tags: git tag -l
- Deploy when ready: `firebase deploy --only hosting:TARGET_NAME` (from production branch)

Important Reminders:
- If you disabled branch protection, ensure you re-enabled it
- Production will show "X commits behind main" - this is expected and correct
- All future development should continue on main branch
```

### 6.3 Mark All Todos Complete

Ensure all todo items are marked as completed.

## Error Handling

If any step fails:
1. **Tests fail**: Stop immediately, show test output, recommend fixing on main
2. **Build fails**: Stop immediately, show build errors, recommend fixing on main
3. **Git conflicts**: Guide user through conflict resolution (unlikely with squash merge)
4. **PR creation fails**: Check gh CLI is authenticated (`gh auth status`)
5. **Tag already exists**: Suggest deleting old tag or choosing different version

## Reference Documentation

- Complete workflow: `docs\DevOps\deployment-promotion.md`
- Promotion model: Read this for understanding the philosophy

## Important Notes

- **Always use "Squash and merge"** - This keeps production history clean
- **Never modify production directly** - All changes via PR from main
- **Every release gets a tag** - Enables rollbacks and clear versioning
- **Branch protection may need temporary disable** - Re-enable after merge
- **Production "behind main" is expected** - This is the correct state per promotion model
