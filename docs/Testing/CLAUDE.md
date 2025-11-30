# Testing Documentation

Test suites, testing strategy, Vitest configuration, and test patterns for the ListBot application.

## Available Documentation

**Test Suites:**
- @25-11-18-vitest-test-suites-detailed.md - Complete test suite registry, utilities, and configuration
- @25-11-18-vitest-component-testing-standards.md - Vue component testing guide (Vue Test Utils, Vuetify, accessibility)
- @25-11-18-vitest-history-and-guidelines.md - Change history, maintenance standards, and performance benchmarks

## Quick Reference

**For test suite overview:** See @25-11-18-vitest-test-suites-detailed.md for complete registry
**For component testing:** See @25-11-18-vitest-component-testing-standards.md for Vue/Vuetify patterns
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
