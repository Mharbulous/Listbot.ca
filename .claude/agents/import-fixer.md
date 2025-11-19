# Import Fixer Agent

Specialized agent for systematically fixing import path errors after folder structure migrations or refactors.

## Agent Type
`general-purpose` - Requires iterative build-fix cycles with full tool access

## Purpose
Autonomously fix broken import paths by:
1. Running builds to identify import errors
2. Applying migration pattern rules to determine correct paths
3. Editing files to fix imports
4. Iterating until build succeeds

## When to Use
- After folder structure migrations causing widespread import breaks
- When `npm run build` fails with "Could not resolve" errors
- When multiple files need systematic import path updates
- Post-refactor import cleanup

## Usage Pattern

```
User: "Fix all import paths after the folder migration. Use these patterns:
- core/stores/auth → core/auth/stores
- stores/* → features/*/stores/*
- ./services/firebase → @/services/firebase"