# Data Security Documentation

Firestore security rules, access patterns, and authentication requirements.

## Available Documentation

@firestore-security-rules.md - Complete Firestore security rules configuration and patterns

## Quick Reference

**For security rules:** See @firestore-security-rules.md

## Key Security Patterns

**Firm-Scoped Access**: All data scoped by firmId, with firmId === userId for solo users.

**Role-Based Permissions**: Shared permission model across all apps in multi-app SSO architecture.

**Query Constraints**: Firestore security rules are all-or-nothing - queries MUST include the same constraints as security rules (see root CLAUDE.md technical best practices).

## Related Documentation

- Data structures: @docs/Data/data-structures.md
- Solo firm architecture: @docs/Features/Matters/solo-firm-matters.md
- Authentication: @docs/Features/Authentication/CLAUDE.md
