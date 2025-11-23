Review the documentation file at path: `$ARGUMENTS`

## Exception List - Do NOT Decompose

The following files are **EXEMPT** from the 700-line limit and should **NEVER** be decomposed:

- **All CLAUDE.md files** - These are intentionally designed as index files that point to detailed documentation

**If the file is on the exception list:**
- Inform the user that this file is exempt from streamlining
- Explain why it's on the exception list
- Do NOT proceed with decomposition

## Doc-Folder-Structure Date Check (Only when NO target file specified)

**If the user has NOT specified a specific file to streamline:**

1. Check if `docs\doc-Folder-Structure.md` exists (or any file matching the pattern `docs\YY-MM-DD-doc-Folder-Structure.md`)
2. Extract the date (YY-MM-DD) from the filename
3. Compare the date to today's date

**If the doc-Folder-Structure file does NOT exist or the date is in the PAST:**
- Review all documentation files in the `/docs` folder and its subfolders (excluding CLAUDE.md files)
- Count the actual number of lines for each file
- Create or update the file as `docs\YY-MM-DD-doc-Folder-Structure.md` (using today's date)
- Report to the user: "doc-Folder-Structure.md was outdated (or missing) and has been updated. Please commit these changes and start a new chat window to run /doc-streamline with a fresh context."
- **STOP** - Do NOT proceed with streamlining in this session

**If the doc-Folder-Structure file date is CURRENT or FUTURE:**
- Proceed with the normal file selection process below

**If the user HAS specified a specific file:**
- Skip this entire date check and proceed directly to streamlining the specified file

## File Selection

**When no target file is specified**, review the files in `docs\YY-MM-DD-doc-Folder-Structure.md` and identify candidate files that would benefit most from decomposition.

**Selection Strategy:**
- **PRIORITY 1**: Files with NO date prefix in their filename (e.g., `overview.md` instead of `25-11-23-overview.md`)
- **PRIORITY 2**: Files with the OLDEST date prefix (if all files have dates)
- Identify files >700 lines that cover multiple distinct areas of concern
- However, once you find a file that would obviously benefit, stop searching and select that file

## Decomposition Decision

**If the file has MORE than 700 lines:**

1. **Create a Decomposition Plan**
   - Break the file down into smaller files by **single, narrow areas of concern**
   - Each new file should focus on ONE specific topic/concept/feature area
   - Goal: Enable AI models to read minimal, focused documentation for context without extraneous information
   - **CRITICAL**: This is ONLY reorganization - decompose files by area of concern, do NOT update the information
   - **Content must be IDENTICAL** before and after decomposition
   - No content changes, no updates, no improvements - ONLY reorganization into separate files
   - Decomposed files should inherit the **original file's date prefix** to preserve history
   - Consider creating a logical hierarchy (index file → subtopic files)

2. **Present Plan for Approval**
   - Show the user your decomposition plan
   - Explain the logical groupings and file structure
   - Wait for user comment and approval before proceeding

3. **Execute Decomposition (After Approval)**
   - Move the original file to `/deprecated` folder as a backup reference
   - Create new files according to the approved plan
   - **All new files inherit the original file's date prefix** (e.g., if decomposing `23-05-15-guide.md`, new files are `23-05-15-guide-auth.md`, `23-05-15-guide-routing.md`, etc.)
   - Preserve all content exactly - no updates, no improvements, ONLY reorganization
   - Create or update an index file if needed to link decomposed files

4. **Update Documentation (After Completion)**
   - Update `docs\YY-MM-DD-doc-Folder-Structure.md` with:
     - New file structure reflecting the decomposition
     - Line counts for all newly created files
   - Remove or mark as deprecated the original file entry

**If the file has 700 lines or LESS:**

1. **Evaluate File**
   - Assess if the file would benefit from reorganization for clarity
   - Check if it covers multiple distinct areas of concern

2. **Report Findings**
   - If reorganization would improve clarity, suggest reorganization plan to user
   - Otherwise, report that the file is appropriately sized and skip decomposition

## Important Constraints

- **NO content changes** - this is ONLY reorganization
- **NO information updates** - preserve all information exactly as written
- **NO improvements** - do not fix outdated info, typos, or style during decomposition
- **Date preservation** - decomposed files inherit the original file's date prefix
- Prioritize logical grouping by narrow areas of concern
- Focus on enabling AI models to read minimal, focused documentation
- Follow the project's existing documentation patterns and structure
- Respect the CLAUDE.md indexed feature-module structure
