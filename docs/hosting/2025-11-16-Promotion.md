# Promotion Model for Deployment

## Why This Model

**Constraint**: Claude Code (web) can only merge to the `main` branch.

**Solution**: Use a promotion model with two long-lived branches:
- `main` - Development/integration branch (default, receives all merges)
- `production` - Stable release branch (manually promoted from main)

This decouples continuous integration (what the tool does) from release management (what you control).

## Critical Non-Obvious Details

### Initial Setup (One-Time)

```bash
git checkout -b production
git push origin production
```

The production branch starts as a copy of main and diverges from that point forward.

### Promotion Workflow

**When main is stable and ready for release:**

```bash
git fetch origin
git checkout production
git pull origin production
git merge origin/main  # The "promotion"
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin production
git push origin v1.2.0  # Tags require separate push
```

**Non-obvious**: Always merge `origin/main` (not local `main`) to ensure you're promoting the exact state that's on GitHub.

**Non-obvious**: Tags are not pushed with branches by default. You must push them explicitly.

### Hotfix Strategy

**Problem**: Critical bug in production, but main has unreleased features.

**Solution**: Use `git cherry-pick` to apply only the fix commit to production.

```bash
# After merging hotfix to main via Claude Code, find the merge commit hash
git checkout production
git pull origin production
git cherry-pick <commit-hash>
git tag -a v1.2.1 -m "Hotfix for critical bug"
git push origin production
git push origin v1.2.1
```

**Non-obvious**: Cherry-picking applies the changes from a specific commit without bringing in the entire history. This allows surgical fixes to production without releasing unfinished work from main.

### Key Invariants

1. **main never merges from production** - Flow is always main → production (one direction)
2. **production only receives merges or cherry-picks** - Never commit directly to production
3. **Every production promotion gets a tag** - Tags are permanent markers for rollback/debugging
4. **Claude Code touches main only** - All other branch operations are manual

## Rationale

- **Separation of concerns**: Development velocity (main) vs. release stability (production)
- **Audit trail**: Tags provide permanent, immutable version markers
- **Flexibility**: Hotfixes don't require releasing half-finished features
- **Tool compatibility**: Works within Claude Code's constraint while maintaining best practices
