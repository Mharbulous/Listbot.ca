/**
 * JSCodeshift transformation script for file → upload terminology migration
 *
 * This script performs comprehensive renaming of identifiers, properties, JSDoc,
 * comments, and CSS classes while preserving:
 * - fileHash and fileSize database properties
 * - Firebase collection names (firms, evidence, sourceMetadata)
 *
 * Usage:
 *   npx jscodeshift -t transforms/file-to-upload.transform.js <files>
 */

// ============================================================================
// CONFIGURATION: Renaming Mappings
// ============================================================================

/**
 * Function name renamings
 * Format: 'oldName' → 'newName'
 */
const FUNCTION_RENAMES = {
  // Utils
  'getFileExtension': 'getUploadExtension',
  'getFileIcon': 'getUploadIcon',
  'getFileIconColor': 'getUploadIconColor',
  'formatFileSize': 'formatUploadSize',

  // Composables
  'loadFiles': 'loadUploads',
  'selectUpload': 'selectUpload', // parameter only
  'generateUploadPreview': 'generateUploadPreview', // parameter only

  // Services
  'getFileForProcessing': 'getUploadForProcessing',
  'getFileDownloadURL': 'getUploadDownloadURL',
  'validateFileSize': 'validateUploadSize',
};

/**
 * Variable/ref/computed renamings
 */
const VARIABLE_RENAMES = {
  // Composables
  'files': 'uploads',
  'totalFiles': 'totalUploads',

  // Components
  'displayName': 'uploadFileName',
  'fileExtension': 'uploadExtension',
  'formattedFileSize': 'uploadSizeFormatted',
  'fileIcon': 'uploadIcon',
  'fileIconColor': 'uploadIconColor',
  'isPdfFile': 'isUploadPdf',

  // Stores
  'displayInfoCache': 'uploadDisplayCache',
};

/**
 * Object property renamings (for database fields and type definitions)
 * EXCLUDES: fileHash, fileSize (kept unchanged per requirements)
 */
const PROPERTY_RENAMES = {
  // Column config
  'fileName': 'uploadFileName',
  'fileType': 'uploadFileType',

  // Database properties (excluding fileHash, fileSize)
  'fileCreated': 'uploadCreated',
  'fileModified': 'uploadModified',
  'filePath': 'uploadPath',

  // TypeDef timestamp properties
  'dateUploaded': 'uploadedAt',
  'dateModified': 'lastModified',
};

/**
 * TypeDef-specific property renamings (only in viewer.types.js)
 * These are too generic to rename globally
 */
const TYPEDEF_PROPERTY_RENAMES = {
  'name': 'uploadName',
  'path': 'uploadPath',
  'size': 'uploadSize',
  'type': 'uploadType',
};

/**
 * Type name renamings (for JSDoc @typedef, @type, @param, @returns)
 */
const TYPE_RENAMES = {
  'FileItem': 'UploadFile',
};

/**
 * Navigation state property renamings
 */
const NAVIGATION_PROPERTY_RENAMES = {
  'currentFile': 'currentUpload',
};

/**
 * CSS class name pattern transformations
 */
const CSS_CLASS_PATTERNS = [
  { pattern: /\bfile-/g, replacement: 'upload-' },
  { pattern: /\bfiles-/g, replacement: 'uploads-' },
];

/**
 * Exclusion patterns - identifiers that should NOT be renamed
 */
const EXCLUSIONS = {
  // Specific database properties to preserve
  properties: new Set(['fileHash', 'fileSize']),

  // Firebase collection names to preserve
  collections: new Set(['firms', 'evidence', 'sourceMetadata', 'users', 'teams']),

  // Common system identifiers to avoid
  systemNames: new Set([
    'File', // Native File API
    'FileReader', // Native FileReader API
    'FileList', // Native FileList API
    'filename', // Generic filename parameter

    // JavaScript built-in properties (must never rename)
    'constructor',
    'prototype',
    'length',
    'toString',
    'valueOf',
    'hasOwnProperty',
    '__proto__',
  ]),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an identifier should be excluded from renaming
 */
function isExcluded(name) {
  return EXCLUSIONS.properties.has(name) ||
         EXCLUSIONS.collections.has(name) ||
         EXCLUSIONS.systemNames.has(name);
}

/**
 * Safely rename an identifier if conditions are met
 */
function safeRename(path, oldName, newName, j) {
  if (!newName || oldName === newName) return false;
  if (isExcluded(oldName)) return false;
  return true;
}

/**
 * Transform comments by replacing terminology
 */
function transformComment(comment) {
  if (!comment || !comment.value) return comment;

  let value = comment.value;

  // Type guard: ensure value is a string before calling replace
  if (typeof value !== 'string') return comment;

  // Replace common phrases (case-insensitive, whole word)
  const replacements = [
    { from: /\bfile processing\b/gi, to: 'upload processing' },
    { from: /\bfile upload\b/gi, to: 'file upload' }, // Keep this phrase
    { from: /\bprocess files\b/gi, to: 'process uploads' },
    { from: /\bfile viewer\b/gi, to: 'upload viewer' },
    { from: /\bfile preview\b/gi, to: 'upload preview' },
    { from: /\bselected file\b/gi, to: 'selected upload' },
    { from: /\bfile details\b/gi, to: 'upload details' },
    { from: /\bfile search\b/gi, to: 'upload search' },
    { from: /\bfile list\b/gi, to: 'upload list' },
    { from: /\bfile grid\b/gi, to: 'upload grid' },
  ];

  replacements.forEach(({ from, to }) => {
    value = value.replace(from, to);
  });

  return { ...comment, value };
}

/**
 * Transform JSDoc tags
 */
function transformJSDocTag(tag, j) {
  // Transform type names in @type, @param, @returns
  if (tag.type && tag.type.name) {
    const typeName = tag.type.name;
    if (TYPE_RENAMES[typeName]) {
      tag.type.name = TYPE_RENAMES[typeName];
    }
  }

  // Transform type names in @typedef
  if (tag.title === 'typedef' && tag.name) {
    if (TYPE_RENAMES[tag.name]) {
      tag.name = TYPE_RENAMES[tag.name];
    }
  }

  return tag;
}

// ============================================================================
// TRANSFORMATION LOGIC
// ============================================================================

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasModifications = false;

  console.log(`\n🔍 Processing: ${fileInfo.path}`);

  // ==========================================================================
  // 1. FUNCTION DECLARATIONS & EXPRESSIONS
  // ==========================================================================

  root.find(j.FunctionDeclaration).forEach(path => {
    const oldName = path.node.id.name;
    const newName = FUNCTION_RENAMES[oldName];

    if (safeRename(path, oldName, newName, j)) {
      console.log(`  ✓ Function: ${oldName} → ${newName}`);
      path.node.id.name = newName;
      hasModifications = true;
    }
  });

  // Arrow functions assigned to variables
  root.find(j.VariableDeclarator).forEach(path => {
    if (path.node.id && path.node.id.name) {
      const oldName = path.node.id.name;
      const newName = FUNCTION_RENAMES[oldName] || VARIABLE_RENAMES[oldName];

      if (safeRename(path, oldName, newName, j)) {
        console.log(`  ✓ Variable: ${oldName} → ${newName}`);
        path.node.id.name = newName;
        hasModifications = true;
      }
    }
  });

  // ==========================================================================
  // 2. FUNCTION PARAMETERS
  // ==========================================================================

  // Rename 'file' parameter to 'upload' in specific functions
  root.find(j.Function).forEach(path => {
    if (path.node.params) {
      path.node.params.forEach(param => {
        if (param.type === 'Identifier' && param.name === 'file') {
          // Check if parent function is one that should have 'upload' parameter
          const parentName = path.parent.value?.id?.name;
          if (parentName && (
            parentName.includes('Upload') ||
            parentName.includes('select') ||
            parentName.includes('generate')
          )) {
            console.log(`  ✓ Parameter: file → upload in ${parentName}`);
            param.name = 'upload';
            hasModifications = true;
          }
        }
      });
    }
  });

  // ==========================================================================
  // 3. OBJECT PROPERTIES (Database fields, type definitions)
  // ==========================================================================

  // Determine if this is the viewer.types.js file
  const isViewerTypesFile = fileInfo.path.includes('viewer.types.js');

  // Property keys in object expressions
  root.find(j.Property).forEach(path => {
    if (path.node.key.type === 'Identifier') {
      const oldName = path.node.key.name;
      let newName = PROPERTY_RENAMES[oldName];

      // Apply typedef-specific renames only in viewer.types.js
      if (!newName && isViewerTypesFile) {
        newName = TYPEDEF_PROPERTY_RENAMES[oldName];
      }

      if (newName && !isExcluded(oldName)) {
        console.log(`  ✓ Property key: ${oldName} → ${newName}`);
        path.node.key.name = newName;
        hasModifications = true;
      }
    }
  });

  // Member expressions (obj.property access)
  root.find(j.MemberExpression).forEach(path => {
    if (path.node.property.type === 'Identifier') {
      const oldName = path.node.property.name;
      let newName = PROPERTY_RENAMES[oldName] || NAVIGATION_PROPERTY_RENAMES[oldName];

      // Apply typedef-specific renames only in viewer.types.js
      if (!newName && isViewerTypesFile) {
        newName = TYPEDEF_PROPERTY_RENAMES[oldName];
      }

      if (newName && !isExcluded(oldName)) {
        console.log(`  ✓ Member property: ${oldName} → ${newName}`);
        path.node.property.name = newName;
        hasModifications = true;
      }
    }
  });

  // ==========================================================================
  // 4. IDENTIFIERS (General variables, refs, computed)
  // ==========================================================================

  root.find(j.Identifier).forEach(path => {
    const oldName = path.node.name;
    const newName = VARIABLE_RENAMES[oldName];

    if (newName && !isExcluded(oldName)) {
      // Skip if this identifier is a property key (already handled)
      if (path.parent.node.type === 'Property' && path.parent.node.key === path.node) {
        return;
      }

      // Skip if this is a member expression property (already handled)
      if (path.parent.node.type === 'MemberExpression' && path.parent.node.property === path.node) {
        return;
      }

      if (safeRename(path, oldName, newName, j)) {
        console.log(`  ✓ Identifier: ${oldName} → ${newName}`);
        path.node.name = newName;
        hasModifications = true;
      }
    }
  });

  // ==========================================================================
  // 5. JSDOC COMMENTS & TYPE DEFINITIONS
  // ==========================================================================

  root.find(j.Comment).forEach(path => {
    const comment = path.node;

    // Transform JSDoc comments
    if (comment.type === 'CommentBlock' && comment.value.includes('@')) {
      // Parse JSDoc
      const lines = comment.value.split('\n');
      let modified = false;

      const newLines = lines.map(line => {
        let newLine = line;

        // Transform type names in @typedef, @type, @param, @returns
        Object.entries(TYPE_RENAMES).forEach(([oldType, newType]) => {
          const typeRegex = new RegExp(`\\b${oldType}\\b`, 'g');
          if (typeRegex.test(newLine)) {
            newLine = newLine.replace(typeRegex, newType);
            modified = true;
          }
        });

        // Transform property names in @property definitions
        Object.entries(PROPERTY_RENAMES).forEach(([oldProp, newProp]) => {
          const propRegex = new RegExp(`@property\\s+{[^}]+}\\s+${oldProp}\\b`, 'g');
          if (propRegex.test(newLine)) {
            newLine = newLine.replace(propRegex, (match) => {
              return match.replace(oldProp, newProp);
            });
            modified = true;
          }
        });

        return newLine;
      });

      if (modified) {
        comment.value = newLines.join('\n');
        console.log(`  ✓ JSDoc updated`);
        hasModifications = true;
      }
    }

    // Transform regular comments
    const transformed = transformComment(comment);
    if (transformed.value !== comment.value) {
      comment.value = transformed.value;
      console.log(`  ✓ Comment updated`);
      hasModifications = true;
    }
  });

  // ==========================================================================
  // 6. STRING LITERALS (CSS classes, column keys)
  // ==========================================================================

  root.find(j.Literal).forEach(path => {
    if (typeof path.node.value === 'string') {
      let newValue = path.node.value;
      let modified = false;

      // Skip Material Design Icons (mdi-*)
      if (newValue.startsWith('mdi-')) {
        return;
      }

      // Transform CSS class names
      CSS_CLASS_PATTERNS.forEach(({ pattern, replacement }) => {
        if (pattern.test(newValue)) {
          newValue = newValue.replace(pattern, replacement);
          modified = true;
        }
      });

      if (modified) {
        console.log(`  ✓ String literal: "${path.node.value}" → "${newValue}"`);
        path.node.value = newValue;
        hasModifications = true;
      }
    }
  });

  // Template literals
  root.find(j.TemplateElement).forEach(path => {
    if (path.node.value && path.node.value.raw) {
      let newValue = path.node.value.raw;
      let modified = false;

      CSS_CLASS_PATTERNS.forEach(({ pattern, replacement }) => {
        if (pattern.test(newValue)) {
          newValue = newValue.replace(pattern, replacement);
          modified = true;
        }
      });

      if (modified) {
        console.log(`  ✓ Template literal updated`);
        path.node.value.raw = newValue;
        path.node.value.cooked = newValue;
        hasModifications = true;
      }
    }
  });

  // ==========================================================================
  // FINALIZATION
  // ==========================================================================

  if (hasModifications) {
    console.log(`✅ Modified: ${fileInfo.path}\n`);
    return root.toSource({ quote: 'single' });
  } else {
    console.log(`⏭️  No changes: ${fileInfo.path}\n`);
    return null; // Return null to indicate no changes
  }
};

module.exports.parser = 'babel';
