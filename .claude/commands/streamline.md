Review the file at path: `$ARGUMENTS`

## File Analysis

First, read the file and count its lines of code.

## Decomposition Decision

**If the file has MORE than 300 lines of code:**

1. **Create a Decomposition Plan**
   - Break the file down into smaller files, each with 200 lines of code or less
   - Decompose logically by area of concern to improve readability and maintainability
   - **Preserve design, appearance, behavior, and functionality EXACTLY** - no changes to how it works
   - Follow the DRY (Don't Repeat Yourself) principle UNLESS it would:
     - Add significant complexity
     - Make code less readable
     - Make code less maintainable
   - In such cases, the KISS (Keep It Simple, Stupid) principle takes priority over DRY

2. **Present Plan for Approval**
   - Show the user your decomposition plan
   - Explain the logical groupings and file structure
   - Wait for user comment and approval before proceeding

3. **Execute Decomposition (After Approval)**
   - Move the original file to `/deprecated` folder as a backup reference
   - Create new files according to the approved plan
   - Build each new file from scratch in the most elegant and simple way possible
   - Strictly preserve appearance, functionality, and behavior exactly as the original

4. **Provide Test Suggestions**
   - Upon completion, suggest specific tests for the user to try on the local server
   - Assume the local server is already running unless explicitly told otherwise

**If the file has 300 lines or LESS:**

- Inform the user that the file is already streamlined and doesn't require decomposition
- Optionally offer to perform a simple refactoring to improve code quality (if you see opportunities)

## Important Constraints

- **NO functional changes** - reproduce existing functionality exactly
- **NO design changes** - preserve visual appearance exactly
- **NO behavioral changes** - maintain all existing behavior
- Prioritize readability and maintainability
- Follow the project's existing patterns and conventions
- Consult `@docs/architecture/overview.md` for project structure guidelines
- Delegate linting to the beautifier agent after file creation
