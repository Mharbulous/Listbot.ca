# Testing Documentation

Test suites, testing strategy, Vitest configuration, and test patterns for the ListBot application.

## Available Documentation

@vitest-test-suites.md - Complete registry of all test suites, test counts, and health status
- Virtual Folder System tests (81 tests)
- Component tests (227 tests)
- Memory leak prevention tests (16 tests)
- Upload system tests
- SSO integration tests

## Quick Reference

**For test suite overview:** See @vitest-test-suites.md for complete registry
**For test patterns:** See root CLAUDE.md directive #5 - all tests must be in /tests folder
**For web worker testing:** See root CLAUDE.md technical best practices section

## Key Testing Patterns

**Test Location**: All Vitest tests MUST be in the `/tests` folder (not co-located with source files).

**Web Worker Testing**: Use `@vitest/web-worker` with `self.onmessage` pattern, avoid `environment: 'jsdom'`.

**Firestore Mocking**: Security rules are all-or-nothing - queries must include the same constraints as rules.

## Test Suite Health

**Overall Status**: ✅ EXCELLENT (100% passing, ~450 tests total)

## Related Documentation

- Upload system being tested: @docs/Features/Upload/CLAUDE.md
- Auth system being tested: @docs/Features/Authentication/CLAUDE.md
- Data schemas being tested: @docs/Data/CLAUDE.md
