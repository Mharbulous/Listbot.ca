# Promotion Model for Deployment

## Why This Model

**Constraint**: Claude Code (web) can only merge to the `main` branch.

**Solution**: Use a promotion model with two long-lived branches:
- `main` - Development/integration branch (default, receives all merges)
- `production` - Stable release branch (manually promoted from main)

This decouples continuous integration (what the tool does) from release management (what you control).

## Git History Philosophy

**Critical Design Decision**: The `production` branch should NOT contain the full git history of `main`.

**Why:**
- **Clean release history**: Each production commit represents a deliberate release decision, not every individual development commit
- **Easier rollbacks**: Clear, consolidated commits make it obvious what changed in each release
- **Reduced noise**: Production history focuses on what shipped, not how it was developed
- **Clear audit trail**: Tags + squashed commits = unambiguous version history

**How this is achieved:**
- All promotions from `main` to `production` use **squash merges**
- Squash merges collapse all commits from `main` into a single commit on `production`
- Each squashed commit represents one complete release
- The `production` branch maintains its own linear history independent of `main`'s detailed history

**Trade-off**: GitHub will show "`production` is X commits behind `main`" - this is **expected and cosmetic** (see "Understanding the 'Behind Main' Warning" section below).
## Quick Reference

**Complete checklist for promoting and deploying:**
- [ ] Ensure main is stable and ready for release
- [ ] Create PR: `gh pr create --base production --head main --title "Release vX.X.X"`
- [ ] Get 1 approval on GitHub
- [ ] Use "Squash and merge" dropdown (NOT regular merge or rebase)
- [ ] Pull locally: `git fetch origin && git checkout production && git pull`
- [ ] Tag: `git tag -a vX.X.X -m "Release version X.X.X" && git push origin vX.X.X`
- [ ] Verify production is clean: `git status` (no uncommitted changes)
- [ ] Build: `npm run build` (from production branch)
- [ ] Deploy: `firebase deploy --only hosting:TARGET_NAME` (or your hosting command)
- [ ] Verify deployment succeeded (visit live URL)
- [ ] Return to main: `git checkout main`

### Promotion Workflow

**Branch Protection**: The `production` branch has the following protection rules:
- Requires pull request with 1 approving review
- Enforced for administrators
- No direct pushes allowed
- No force pushes allowed

**When main is stable and ready for release:**

#### Step 1: Create Promotion Pull Request

```bash
# Use GitHub CLI to create a PR from main to production
gh pr create \
  --base production \
  --head main \
  --title "Release v1.2.0" \
  --body "Promoting main to production for version 1.2.0 release

## Changes in this release
- Feature 1
- Feature 2
- Bug fix 3

## Testing
- [ ] All tests passing on main
- [ ] Manual smoke testing completed
- [ ] Ready for production deployment"
```

**Alternative (using GitHub web interface)** - Recommended for first-time users:
1. Go to your repository on GitHub
2. Click "Pull requests" → "New pull request"
3. **Important**: Click "compare across forks" if the base branch selector doesn't show production
4. Set **base** branch to `production` (left dropdown)
5. Set **compare** branch to `main` (right dropdown)
6. Fill in title: "Release v1.2.0"
7. Fill in description with changes and testing checklist
8. Click "Create pull request"
9. **If you're a solo developer**: You can approve your own PR and merge

#### Step 2: Get Approval and Squash Merge

1. **Get required approval**
   - Minimum 1 reviewer approval required
   - **Solo developers**: You can approve your own PR via the GitHub web interface (branch protection allows this for administrators)
     - Click "Files changed" tab → "Review changes" → "Approve" → "Submit review"
   - **Team developers**: Get approval from another team member

2. **Use "Squash and merge"** on GitHub (NOT regular merge or rebase)
   - Click the dropdown arrow next to "Merge pull request"
   - Select "Squash and merge"
   - Edit the commit message to summarize the release (title becomes commit message)
   - Confirm the squash merge

3. Pull the updated production branch locally

```bash
git fetch origin
git checkout production
git pull origin production
```

**Critical**: Always use **Squash and merge** to keep production history clean and separate from main's detailed commit history.

#### Important: Why "Squash and Merge" (Not "Rebase and Merge")

GitHub offers three merge options. Here's why you must use **Squash and merge**:

| Option | Effect | Production History | "Behind Main" Warning |
|--------|--------|-------------------|---------------------|
| **Squash and merge** ✅ | Collapses all commits into 1 | Clean release commits | Yes (expected) |
| Rebase and merge ❌ | Replays all commits individually | Identical to main's detailed history | No |
| Regular merge ❌ | Creates merge commit | Preserves all main commits + merge commit | No |

**Why squash is correct**: The "behind main" warning is the intentional trade-off for clean production history. Using rebase defeats the entire purpose of the promotion model.

#### Step 3: Tag the Release

```bash
# After the PR is merged, tag the release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0  # Tags require separate push
```

**Non-obvious**: You cannot push directly to production due to branch protection. All changes must go through a pull request.

**Non-obvious**: Tags are not pushed with branches by default. You must push them explicitly.

**Non-obvious**: The PR-based workflow provides an audit trail and review point before production deployment.

#### Step 4: Verify and Return to Main

```bash
# Verify the tag exists
git tag -l "v1.2.0"

# Check GitHub releases page
# Visit: https://github.com/yourusername/yourrepo/releases/tag/v1.2.0

# Switch back to main for continued development
git checkout main
```

**Expected**: GitHub will show "production is X commits behind main" - this is correct and intentional.

### Deployment Workflow

**Critical Principle**: ALWAYS deploy from the `production` branch, NEVER from `main`.

The `production` branch represents your stable, released code. Deploying from `main` defeats the entire purpose of the promotion model.

#### Step 5: Prepare for Deployment

**Before deploying, ensure production branch is clean:**

```bash
# Switch to production
git checkout production

# Check for uncommitted changes
git status
```

**If you have uncommitted changes on production:**

This violates the promotion model. Production should only receive changes via PR from main.

```bash
# Stash changes on production
git stash push -m "Description of changes"

# Switch to main and apply them
git checkout main
git stash pop

# Commit to main
git add .
git commit -m "Your commit message"

# Push to main (will be in next promotion)
git push origin main

# Return to production for deployment
git checkout production
```

**Why this matters**: The production branch must remain a clean reflection of what was promoted via PR. Any direct modifications bypass your review process.

#### Step 6: Build Production Application

```bash
# Ensure you're on production branch
git branch --show-current  # Should show: production

# Build the application
npm run build
```

**Non-obvious**: Build from `production`, not `main`. This ensures you're deploying exactly what was promoted and tagged.

#### Step 7: Deploy to Hosting

```bash
# For Firebase hosting (example)
firebase deploy --only hosting:TARGET_NAME

# For other hosting providers, use their deployment command
```

**Non-obvious**: The `dist/` folder (build output) should be in `.gitignore`. You build fresh on the production branch for each deployment.

#### Step 8: Verify Deployment

1. Visit the live URL to confirm deployment succeeded
2. Check critical functionality works
3. Verify the version matches your tag (if displayed in app)

```bash
# Return to main for continued development
git checkout main
```

### Post-Deployment Checklist

After successful deployment:

1. **Verify live site**: Visit the hosting URL and test critical functionality
2. **Check version**: Confirm the deployed version matches your tag
3. **Monitor errors**: Watch Firebase Console / error tracking for issues
4. **Document**: Update any deployment logs or release notes
5. **Return to main**: `git checkout main` for continued development

**If deployment fails:**
- Check build output for errors
- Verify Firebase/hosting configuration
- Ensure all environment variables are set
- Review hosting provider's deployment logs
- Do NOT modify production branch - fix on main and re-promote if needed

### Handling Uncommitted Changes on Production

**Scenario**: You're on the production branch and `git status` shows uncommitted changes.

**Why this happens**: 
- Build artifacts not in `.gitignore`
- Manual edits made directly on production (don't do this!)
- Files pulled from remote that shouldn't be tracked

**Correct response**: Move changes to main branch via commit, not via PR.

```bash
# On production with uncommitted changes
git stash push -m "Infrastructure: Description of changes"
git checkout main
git stash pop
git add <files>
git commit -m "Infrastructure: Description"
git push origin main

# Clean production is now ready for deployment
git checkout production
```

**Why not create a PR from production to main?** 
- Violates the one-way flow (main → production only)
- Creates merge conflicts and confusion
- Production should only receive, never send

**Prevention**: Keep production pristine. Only touch it for promotion and deployment.


### Hotfix Strategy

**Problem**: Critical bug in production, but main has unreleased features.

**Solution**: Create a hotfix branch, cherry-pick the fix, and create a PR to production.

#### Step 1: Create Hotfix Branch and Cherry-Pick

```bash
# After merging hotfix to main via Claude Code, find the merge commit hash
git fetch origin
git checkout -b hotfix/critical-bug-fix origin/production
git cherry-pick <commit-hash>
```

**Non-obvious**: Cherry-picking applies the changes from a specific commit without bringing in the entire history. This allows surgical fixes to production without releasing unfinished work from main.

#### Step 2: Push Hotfix Branch and Create PR

```bash
git push origin hotfix/critical-bug-fix

# Create PR to production
gh pr create \
  --base production \
  --head hotfix/critical-bug-fix \
  --title "Hotfix v1.2.1: Critical bug fix" \
  --body "Emergency hotfix for critical production bug

## Issue
Describe the critical bug

## Fix
Describe what was fixed

## Cherry-picked from
Commit: <commit-hash> on main branch"
```

#### Step 3: Get Approval, Squash Merge, and Tag

1. Get required approval (expedite if truly critical)
2. **Use "Squash and merge"** on GitHub (maintain clean production history)
3. Pull and tag the release

```bash
git fetch origin
git checkout production
git pull origin production
git tag -a v1.2.1 -m "Hotfix for critical bug"
git push origin v1.2.1
```

**Non-obvious**: Even hotfixes require PR approval due to branch protection. Plan accordingly for critical situations (have backup reviewers available).

### Understanding the "Behind Main" Warning

When viewing `production` on GitHub, you'll see: **"production is X commits behind main"**

**This is expected and cosmetic.** Here's why:

- `main` accumulates individual commits (every feature, bug fix, refactor)
- `production` receives squashed commits (one commit per release)
- GitHub compares commit counts, not actual code state
- Even when `production` contains all code from `main`, the commit counts differ

**Example:**
- `main` has 64 commits since last promotion
- You squash merge to `production` → creates 1 commit
- GitHub shows: "production is 64 commits behind main"
- Reality: `production` has all the code, just in 1 commit instead of 64

**Should you care?**
- **No, if you want clean production history** (recommended approach)
- The warning is purely cosmetic and doesn't affect deployments
- Production history remains clean and focused on releases
- This is the trade-off for having separate git histories

**Option: Sync production to eliminate warning** (NOT recommended)

If you absolutely want to eliminate the warning (at the cost of losing clean history):

```bash
# WARNING: This destroys production's clean history
# Only do this if you're willing to give up squash merges

git checkout production
git fetch origin
git reset --hard origin/main
git push origin production --force
```

**Why this is NOT recommended:**
- Defeats the entire purpose of separate histories
- Production inherits all of main's detailed commits
- Loses the clean release history
- You'll need to temporarily disable branch protection to force push
- After this, you're back to having production mirror main's history

**Best practice**: Accept the "behind" warning as the cost of clean production history.

### Troubleshooting

**"production branch not found in base selector"**
- Click "compare across forks" link to reveal all branches
- Ensure production branch exists: `git branch -r | grep production`

**"No approval from reviewer despite being admin"**
- As admin, you can approve your own PR via the web interface
- Click "Files changed" tab → "Review changes" → "Approve" → "Submit review"

**"Tag already exists"**
- List tags: `git tag -l`
- Delete if needed: `git tag -d v1.2.0 && git push origin :refs/tags/v1.2.0`
- Recreate tag with correct commit

**"Production shows 'X commits behind main'"**
- This is expected and intentional (see "Understanding the 'Behind Main' Warning")
- Production has all the code, just in squashed commits

### Key Invariants

1. **main never merges from production** - Flow is always main → production (one direction)
2. **production only receives changes via pull requests** - Direct pushes are blocked by branch protection
3. **Every production update requires 1 approval** - Even administrators must get PR approval
4. **Every production promotion gets a tag** - Tags are permanent markers for rollback/debugging
5. **All PRs to production use squash merge** - Maintains clean, consolidated production history separate from main
6. **production will always show "behind main"** - Expected result of squash merges; purely cosmetic
7. **Claude Code touches main only** - All other branch operations are manual
8. **Always deploy from production, never from main** - Production branch is the source of truth for deployed code9. **Production branch must be clean before deployment** - No uncommitted changes allowed; move them to main

## Rationale

- **Separation of concerns**: Development velocity (main) vs. release stability (production)
- **Clean production history**: Squash merges create focused, meaningful commits that document releases, not development details
- **Audit trail**: Tags provide permanent, immutable version markers. Pull requests add another layer of audit.
- **Review gate**: Branch protection ensures at least one other person reviews production changes
- **Flexibility**: Hotfixes don't require releasing half-finished features
- **Tool compatibility**: Works within Claude Code's constraint while maintaining best practices
- **Safety**: PR-based workflow prevents accidental direct pushes to production
- **Independent histories**: Production and main have separate git histories optimized for different purposes
