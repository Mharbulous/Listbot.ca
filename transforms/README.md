# JSCodeshift Transformations

This directory contains automated code transformation scripts using [jscodeshift](https://github.com/facebook/jscodeshift).

## File → Upload Terminology Migration

### Overview

The `file-to-upload.transform.js` script performs comprehensive renaming of identifiers, properties, JSDoc comments, and CSS classes to align with the project's terminology standards.

### What It Transforms

1. **Function Names**: `getFileExtension` → `getUploadExtension`, etc.
2. **Variables/Refs**: `files` → `uploads`, `totalFiles` → `totalUploads`, etc.
3. **Function Parameters**: `file` → `upload` (context-aware)
4. **Object Properties**: `fileName` → `uploadFileName`, `fileCreated` → `uploadCreated`, etc.
5. **Type Definitions**: `FileItem` → `UploadFile`
6. **JSDoc Comments**: Updates type references and property names
7. **Inline Comments**: Replaces "file processing" with "upload processing", etc.
8. **CSS Classes**: `.file-*` → `.upload-*`

### What It Preserves

The script **does NOT** rename:

- `fileHash` - Database property name (must remain unchanged)
- `fileSize` - Database property name (must remain unchanged)
- Firebase collection names: `firms`, `evidence`, `sourceMetadata`, etc.
- Native File API: `File`, `FileReader`, `FileList`

### Usage

#### Prerequisites

Ensure jscodeshift is installed:

```bash
npm install -g jscodeshift
```

Or use npx (no installation required):

```bash
npx jscodeshift --version
```

#### Running the Transformation

**Single file:**

```bash
npx jscodeshift -t transforms/file-to-upload.transform.js src/path/to/file.js
```

**Multiple files:**

```bash
npx jscodeshift -t transforms/file-to-upload.transform.js \
  src/features/organizer/composables/useFilePreview.js \
  src/features/organizer/composables/useFileViewer.js \
  src/features/organizer/utils/fileUtils.js
```

**All affected files** (recommended - use the batch script):

```bash
bash transforms/run-file-to-upload-transform.sh
```

#### Options

- `--dry`: Dry run (no files are written)
- `--print`: Print output instead of writing to files
- `-d`: Dry run (same as --dry)

Example dry run:

```bash
npx jscodeshift -t transforms/file-to-upload.transform.js --dry src/features/organizer/utils/fileUtils.js
```

### Affected Files

According to the renaming plan, these 13 files contain identifiers that need renaming:

1. `src/features/organizer/composables/useFilePreview.js`
2. `src/features/organizer/composables/useFileViewer.js`
3. `src/features/organizer/utils/fileUtils.js`
4. `src/features/organizer/components/FileListItemContent.vue`
5. `src/features/organizer/components/FileItem.vue`
6. `src/features/organizer/views/ViewDocument.vue`
7. `src/utils/columnConfig.js`
8. `src/features/organizer/services/fileProcessingService.js`
9. `src/features/organizer/services/aiProcessingService.js`
10. `src/features/organizer/stores/organizerCore.js`
11. `src/features/organizer/types/viewer.types.js`

Note: Files 1-11 are .js/.vue files. The transformation script is optimized for JavaScript but may need manual adjustments for Vue SFC templates.

### Post-Transformation Checklist

After running the transformation:

1. **Review Changes**:
   ```bash
   git diff
   ```

2. **Run Linter**:
   ```bash
   npm run lint
   ```

3. **Run Tests**:
   ```bash
   npm run test:run
   ```

4. **Check Development Server**:
   ```bash
   npm run dev
   ```
   Verify no console errors

5. **Search for Remaining References**:
   ```bash
   # Search for old function names
   npx grep -r "getFileExtension" src/

   # Search for old variable names
   npx grep -r "\\bfiles\\b" src/ --include="*.js" --include="*.vue"
   ```

### Troubleshooting

**Issue**: Script reports conflicts with existing names

**Solution**: Review the conflict manually. The script skips renaming when the target name already exists to prevent accidental overwrites.

---

**Issue**: Vue template syntax not transformed

**Solution**: The script handles `<script>` sections in Vue files, but you may need to manually update templates. Search for class bindings and identifiers in `<template>` sections.

---

**Issue**: Comments not updated correctly

**Solution**: Review and manually update any complex comment structures that the regex patterns didn't catch.

### Implementation Phases

Follow this order for best results:

1. **Phase 1**: Types & Utilities (3 files)
2. **Phase 2**: Services (2 files)
3. **Phase 3**: Stores (1 file)
4. **Phase 4**: Composables (2 files)
5. **Phase 5**: Components (3 files)

Or run all at once using the batch script.

### Safety Features

The transformation script includes:

- **Scope checking**: Ensures new names don't conflict with existing identifiers
- **Exclusion lists**: Preserves critical database properties and collection names
- **Dry-run mode**: Test transformations before applying
- **Detailed logging**: See exactly what changes are being made
- **Idempotent**: Safe to run multiple times

### Manual Review Required

While the script handles most cases automatically, you should manually verify:

1. Vue template sections (`<template>`)
2. String interpolations that reference identifiers
3. Dynamic property access using bracket notation
4. Comments with complex formatting

## Contributing

When adding new transformation scripts:

1. Place them in this `transforms/` directory
2. Use the `.transform.js` suffix
3. Add comprehensive documentation to this README
4. Include a batch execution script if multiple files are affected
