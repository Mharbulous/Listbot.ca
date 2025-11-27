# Claude Night Shift Workflow Testing Guide

A step-by-step guide to verify your automated Claude Code GitHub Actions workflow is functioning correctly.

---

## Prerequisites Checklist

Before testing, ensure the following are configured:

### 1. Repository Secrets

Navigate to: **Settings → Secrets and variables → Actions**

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com | ✅ Yes |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions | ✅ Auto |
| `CLAUDE_CODE_OAUTH_TOKEN` | Alternative auth method (if not using API key) | Optional |

### 2. Repository Labels

Create these labels if they don't exist (**Issues → Labels → New label**):

| Label | Color (suggested) | Description |
|-------|-------------------|-------------|
| `status: ready-for-ai` | `#0E8A16` (green) | Issue ready for Claude to process |
| `status: in-progress` | `#FBCA04` (yellow) | Claude is currently working |
| `status: ai-complete` | `#1D76DB` (blue) | Claude finished successfully |
| `status: ai-error` | `#D93F0B` (red) | Claude encountered an error |
| `status: needs-review` | `#C5DEF5` (light blue) | Requires human review |

### 3. Workflow File

Confirm the workflow file exists at:
```
.github/workflows/claude-night-shift.yml
```

---

## Test 1: Manual Workflow Trigger (No Issue)

This tests that the workflow runs and enters maintenance mode correctly.

### Steps

1. **Ensure no issues have the `status: ready-for-ai` label**

2. **Trigger the workflow manually:**

   **Option A: GitHub UI**
   - Go to **Actions** tab
   - Select "Claude Night Shift" workflow
   - Click **Run workflow** dropdown
   - Click the green **Run workflow** button

   **Option B: GitHub CLI**
   ```bash
   gh workflow run claude-night-shift.yml
   ```

3. **Monitor the run:**
   - Click on the running workflow
   - Watch the "Find Ready Issue" step
   - Confirm it outputs: `ℹ️ No ready issues found`
   - Confirm "Run Maintenance" step executes

### Expected Result

```
✅ Workflow completes successfully
✅ "Find Ready Issue" shows found=false
✅ "Run Maintenance" step runs
✅ No errors in logs
```

---

## Test 2: Issue Processing (Main Test)

This tests the full issue-to-PR workflow.

### Step 1: Create a Test Issue

Create a simple test issue to verify the workflow:

**Title:**
```
[TEST] Add comment to README
```

**Body:**
```markdown
## Task
Add a comment to the top of README.md with today's date.

## Acceptance Criteria
- [ ] README.md has a new HTML comment at the top
- [ ] Comment includes the current date
- [ ] No other changes to the file

## Notes
This is a test issue to verify the Claude Night Shift workflow.
```

### Step 2: Add the Trigger Label

```bash
# Using GitHub CLI
gh issue edit <ISSUE_NUMBER> --add-label "status: ready-for-ai"

# Or use the GitHub UI:
# Issue → Labels → Add "status: ready-for-ai"
```

### Step 3: Trigger the Workflow

```bash
gh workflow run claude-night-shift.yml
```

Or wait for the scheduled time (2 AM Vancouver time).

### Step 4: Monitor Progress

1. **Watch the Actions tab** for the workflow run
2. **Check the issue** for comment updates:
   - First comment: "🤖 Claude Code is working on this issue..."
   - Label changes to: `status: in-progress`
3. **Wait for completion** (typically 2-10 minutes)

### Step 5: Verify Results

**On Success:**
- [ ] Issue label changed to `status: ai-complete`
- [ ] Final comment includes:
  - ✅ Completion message
  - 🌿 Branch name (`claude/issue-X`)
  - 👉 Link to create PR
- [ ] Branch exists: `git fetch && git branch -r | grep claude/issue`
- [ ] Branch contains commits referencing the issue

**On Failure:**
- [ ] Issue label changed to `status: ai-error`
- [ ] Comment includes link to workflow logs
- [ ] Review logs for error details

---

## Test 3: Verify Branch and Changes

After a successful run:

```bash
# Fetch all branches
git fetch --all

# List Claude branches
git branch -r | grep claude

# Check out the branch
git checkout claude/issue-<NUMBER>

# View the commits
git log --oneline -5

# View the changes
git diff main...HEAD
```

---

## Test 4: Scheduled Run Verification

To confirm the cron schedule works:

1. **Check recent workflow runs:**
   ```bash
   gh run list --workflow=claude-night-shift.yml --limit=10
   ```

2. **Verify timing:**
   - Runs should appear at ~10:00 UTC (2 AM PST)
   - Or ~9:00 UTC (2 AM PDT during daylight saving)

3. **Check the cron syntax:**
   ```yaml
   # Current setting (verify in your workflow file)
   - cron: '0 10 * * *'  # 10:00 UTC = 2:00 AM PST
   ```

---

## Troubleshooting

### Workflow Never Runs

| Symptom | Solution |
|---------|----------|
| No runs appear | Check Actions are enabled (Settings → Actions → General) |
| Cron doesn't trigger | GitHub may delay cron jobs; use manual trigger to test |
| Permission denied | Verify workflow permissions in settings |

### Claude Code Fails to Start

| Error | Solution |
|-------|----------|
| `ANTHROPIC_API_KEY not set` | Add secret in repository settings |
| `claude: command not found` | Check Node.js setup step succeeded |
| `Permission denied` | Ensure `--dangerously-skip-permissions` flag is present |

### No Commits Created

| Symptom | Solution |
|---------|----------|
| "No changes were made" | Issue may be unclear; add more specific instructions |
| Claude didn't understand | Check CLAUDE.md exists and is readable |
| API timeout | Issue may be too complex; break into smaller tasks |

### Branch Not Pushed

| Error | Solution |
|-------|----------|
| `Permission denied to github-actions` | Check `permissions:` block in workflow |
| `Remote rejected` | Branch protection rules may block pushes |

### Label Not Changing

| Symptom | Solution |
|---------|----------|
| Label stuck on `in-progress` | Workflow may have crashed; check logs |
| Label doesn't exist | Create the required labels (see Prerequisites) |

---

## Quick Diagnostic Commands

```bash
# View recent workflow runs
gh run list --workflow=claude-night-shift.yml

# View specific run logs
gh run view <RUN_ID> --log

# Check issues with AI labels
gh issue list --label "status: ready-for-ai"
gh issue list --label "status: in-progress"
gh issue list --label "status: ai-complete"
gh issue list --label "status: ai-error"

# View Claude branches
git fetch && git branch -r | grep claude

# Check workflow file syntax
gh workflow view claude-night-shift.yml
```

---

## Test Issue Templates

### Simple Test (Recommended First)
```markdown
**Title:** [TEST] Add timestamp comment to README

**Body:**
Add an HTML comment to line 1 of README.md containing the text "Last reviewed by Claude: [DATE]"
```

### Medium Complexity
```markdown
**Title:** [TEST] Create hello-world utility

**Body:**
Create a new file `src/utils/hello.js` that exports a function `sayHello(name)` returning "Hello, {name}!". Include JSDoc comments.
```

### Documentation Test
```markdown
**Title:** [TEST] Document the auth flow

**Body:**
Add a new section to docs/ARCHITECTURE.md explaining the authentication state machine. Reference the existing code in src/auth/.
```

---

## Success Checklist

After completing all tests, verify:

- [ ] Manual trigger works (Test 1)
- [ ] Issue processing works end-to-end (Test 2)
- [ ] Branches are created with correct names
- [ ] Commits reference issue numbers
- [ ] Labels transition correctly through states
- [ ] Comments are posted with PR links
- [ ] Scheduled runs appear at correct times (Test 4)
- [ ] Maintenance mode runs when no issues exist

---

## Next Steps

Once testing is complete:

1. **Create real issues** with the `status: ready-for-ai` label
2. **Monitor first few automated runs** to ensure stability
3. **Adjust the prompt** in the workflow if Claude needs more context
4. **Enable maintenance tasks** by uncommenting the P3a/P3b/P3c sections
