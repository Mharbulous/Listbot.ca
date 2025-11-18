# Matters & Cases Feature

Matter management, client workflows, and firm structure for case organization.

## Available Documentation

@solo-firm-matters.md - Solo firm architecture and matter structure
- How firmId === userId works for solo users
- Matter creation and organization
- Upgrade path from solo to multi-user firm

@firm-workflows.md - Firm-level workflows and collaboration patterns

## Quick Reference

**For solo firm architecture:** See @solo-firm-matters.md
**For firm workflows:** See @firm-workflows.md
**For data structure:** See @docs/Data/data-structures.md

## Key Concepts

**Solo Firm Pattern**: Every user has firmId === userId, eliminating special cases and providing seamless upgrade path.

**Matter Organization**: All files organized under /firms/{firmId}/matters/{matterId}/ for consistent access patterns.

## Related Documentation

- Data schema: @docs/Data/data-structures.md
- Authentication: @docs/Features/Authentication/auth-state-machine.md
- File organization: @docs/Features/Organizer/CLAUDE.md
