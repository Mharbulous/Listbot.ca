# Documentation Organization

How documentation is structured, organized, and discovered throughout the ListBot codebase.

## Available Documentation

@documentation-hierarchy.md - Feature-module organization philosophy and structure

@documentation-structure.md - Visual structure diagrams and discovery patterns

## Quick Reference

**For organization philosophy:** See @documentation-hierarchy.md
**For discovery patterns:** See @documentation-structure.md
**For index generation:** See @docs/doc-index.md (the /doc-index command documentation)

## Key Concepts

**Feature-Module Structure**: Documentation organized by feature domain, with each feature folder containing all documentation for that feature (UI, logic, state, data).

**Progressive Disclosure**: CLAUDE.md index files provide navigation, detailed .md files contain information.

**Index Guidelines**: Root CLAUDE.md = 200-300 lines, folder indexes = 50-150 lines, descriptions = 80 chars max.

## Related Documentation

- Root documentation index: @docs/CLAUDE.md
- Research on indexing: @Research/2025-11-17-CLAUDEmdIndexing.md
