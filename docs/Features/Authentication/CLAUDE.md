# Authentication Feature

Multi-app SSO authentication, auth state machine, Firebase Auth integration, and security patterns.

## Available Documentation

@auth-state-machine.md - Complete authentication system architecture
- Auth state machine pattern (uninitialized → initializing → authenticated/unauthenticated)
- Solo firm architecture (firmId === userId)
- Firebase Auth integration with Firestore
- Multi-app SSO configuration

## Quick Reference

**For auth architecture:** See @auth-state-machine.md for complete system documentation
**For SSO setup:** See @docs/DevOps/firebase-project-setup.md
**For testing auth:** See @docs/Miscellaneous/auth-module-test-strategy.md

## Key Authentication Patterns

**State Machine**: Always check `authStore.isInitialized` before `authStore.isAuthenticated` to prevent Firebase race conditions.

**Solo Firm Architecture**: Every user automatically gets firmId === userId, providing consistent data patterns.

**Multi-App SSO**: All apps (ListBot, Intranet, Files) share single Firebase project config for seamless authentication.

**Redirect Handling**: Firebase v9 `getRedirectResult()` returns `null` when no redirect occurred (not UserCredential with null user) - see root CLAUDE.md technical best practices.

## Related Documentation

- System architecture: @docs/System/Architecture/overview.md
- Data security: @docs/Data/Security/firestore-security-rules.md
- DevOps setup: @docs/DevOps/CLAUDE.md
- Testing: @docs/Testing/CLAUDE.md
