# Proposed Improvements to 2025-11-16-Promotion.md

Based on the successful v1.1.1 promotion, here are the recommended improvements:

## 1. Add Quick Reference Section (Insert after line 29)

Insert this new section between the "Trade-off" paragraph and "## Critical Non-Obvious Details":

```markdown
## Quick Reference (After First Time)

**Checklist for promoting main → production:**
- [ ] Ensure main is stable and ready for release
- [ ] Create PR: `gh pr create --base production --head main --title "Release vX.X.X"`
- [ ] Get 1 approval on GitHub
- [ ] Use "Squash and merge" dropdown (NOT regular merge or rebase)
- [ ] Pull locally: `git fetch origin && git checkout production && git pull`
- [ ] Tag: `git tag -a vX.X.X -m "Release version X.X.X" && git push origin vX.X.X`
- [ ] Switch back: `git checkout main`
- [ ] Verify: Check releases page on GitHub

**First time?** See detailed walkthrough below.
```

## 2. Enhance Web Interface Instructions (Replace lines 76-82)

Replace the current "Alternative (using GitHub web interface)" section with:

```markdown
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
```

## 3. Clarify Solo Developer Approval (Replace lines 84-92)

Replace "Step 2: Get Approval and Squash Merge" with:

```markdown
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
```

## 4. Add "Squash vs Rebase" Comparison (Insert after Step 2)

Insert this new subsection after the "Step 2" section (after line 100):

```markdown
#### Important: Why "Squash and Merge" (Not "Rebase and Merge")

GitHub offers three merge options. Here's why you must use **Squash and merge**:

| Option | Effect | Production History | "Behind Main" Warning |
|--------|--------|-------------------|---------------------|
| **Squash and merge** ✅ | Collapses all commits into 1 | Clean release commits | Yes (expected) |
| Rebase and merge ❌ | Replays all commits individually | Identical to main's detailed history | No |
| Regular merge ❌ | Creates merge commit | Preserves all main commits + merge commit | No |

**Why squash is correct**: The "behind main" warning is the intentional trade-off for clean production history. Using rebase defeats the entire purpose of the promotion model.
```

## 5. Add Verification Step (Insert after Step 3)

Insert this new step after the current "Step 3: Tag the Release" (after line 114):

```markdown
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
```

## 6. Add Troubleshooting Section (Insert before "Key Invariants")

Insert this new section before "### Key Invariants" (around line 217):

```markdown
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
```

---

## Summary of Improvements

1. ✅ **Quick Reference** - Fast checklist for repeat promotions
2. ✅ **Enhanced Web UI Instructions** - More detailed GitHub web interface steps
3. ✅ **Solo Developer Guidance** - Clarifies self-approval process
4. ✅ **Squash vs Rebase Table** - Proactively answers the "why not rebase?" question
5. ✅ **Verification Step** - Confirms successful promotion
6. ✅ **Troubleshooting Section** - Common issues and solutions

## How to Apply

You can apply these changes manually by editing the file, or run:

```bash
# This will be implemented if you approve
```
