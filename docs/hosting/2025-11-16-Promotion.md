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

## Critical Non-Obvious Details

### Initial Setup (One-Time)

```bash
git checkout -b production
git push origin production
```

The production branch starts as a copy of main. From this point forward:
- `main` continues to accumulate detailed commit history
- `production` receives only squashed commits via promotions
- The two histories diverge and become independent

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

**Alternative (using GitHub web interface)**:
1. Go to your repository on GitHub
2. Click "Pull requests" → "New pull request"
3. Set base branch to `production`
4. Set compare branch to `main`
5. Fill in title and description
6. Create pull request

#### Step 2: Get Approval and Squash Merge

1. Wait for required approval (minimum 1 reviewer)
2. **Use "Squash and merge"** on GitHub (NOT regular merge)
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

#### Step 3: Tag the Release

```bash
# After the PR is merged, tag the release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0  # Tags require separate push
```

**Non-obvious**: You cannot push directly to production due to branch protection. All changes must go through a pull request.

**Non-obvious**: Tags are not pushed with branches by default. You must push them explicitly.

**Non-obvious**: The PR-based workflow provides an audit trail and review point before production deployment.

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

### Key Invariants

1. **main never merges from production** - Flow is always main → production (one direction)
2. **production only receives changes via pull requests** - Direct pushes are blocked by branch protection
3. **Every production update requires 1 approval** - Even administrators must get PR approval
4. **Every production promotion gets a tag** - Tags are permanent markers for rollback/debugging
5. **All PRs to production use squash merge** - Maintains clean, consolidated production history separate from main
6. **production will always show "behind main"** - Expected result of squash merges; purely cosmetic
7. **Claude Code touches main only** - All other branch operations are manual

## Rationale

- **Separation of concerns**: Development velocity (main) vs. release stability (production)
- **Clean production history**: Squash merges create focused, meaningful commits that document releases, not development details
- **Audit trail**: Tags provide permanent, immutable version markers. Pull requests add another layer of audit.
- **Review gate**: Branch protection ensures at least one other person reviews production changes
- **Flexibility**: Hotfixes don't require releasing half-finished features
- **Tool compatibility**: Works within Claude Code's constraint while maintaining best practices
- **Safety**: PR-based workflow prevents accidental direct pushes to production
- **Independent histories**: Production and main have separate git histories optimized for different purposes
