import { ref } from 'vue';

/**
 * Mock evidence/document data generator for testing virtual scrolling performance
 * Generates realistic document metadata and source file properties for performance testing
 */

const FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG', 'TXT', 'MSG', 'EML'];
const PRIVILEGES = ['Attorney-Client', 'Work Product', 'Not Privileged'];
const DOCUMENT_TYPES = [
  'Email',
  'Contract',
  'Invoice',
  'Receipt',
  'Memorandum',
  'Letter',
  'Report',
  'Spreadsheet',
  'Presentation',
  'Photo',
];
const AUTHORS = [
  'John Smith',
  'Jane Doe',
  'Bob Johnson',
  'Alice Williams',
  'Charlie Brown',
  'Diana Prince',
  'Eve Anderson',
  'Frank Miller',
];
const CUSTODIANS = [
  'Finance Department',
  'Legal Department',
  'HR Department',
  'IT Department',
  'Sales Department',
  'Marketing Department',
];

/**
 * Generate a random date within the last 2 years
 */
function generateRandomDate() {
  const now = Date.now();
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
  const randomTime = twoYearsAgo + Math.random() * (now - twoYearsAgo);
  return new Date(randomTime);
}

/**
 * Generate a random source file size between 1KB and 100MB
 */
function generateRandomSourceFileSize() {
  const minSize = 1024; // 1KB
  const maxSize = 100 * 1024 * 1024; // 100MB
  return Math.floor(Math.random() * (maxSize - minSize) + minSize);
}

/**
 * Generate a random source file name
 */
function generateSourceFileName(index, fileType) {
  const prefixes = [
    'Document',
    'Report',
    'Email',
    'Contract',
    'Invoice',
    'Receipt',
    'Memo',
    'Letter',
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}_${String(index).padStart(6, '0')}.${fileType.toLowerCase()}`;
}

/**
 * Generate a random description (some files have no description)
 */
function generateDescription() {
  const hasDescription = Math.random() > 0.3; // 70% have descriptions
  if (!hasDescription) return '';

  const descriptions = [
    'Important document for case review',
    'Financial records for Q1 2024',
    'Email correspondence with client',
    'Contract agreement with vendor',
    'Invoice for professional services',
    'Receipt for business expenses',
    'Internal memorandum regarding policy',
    'Letter to opposing counsel',
    'Monthly sales report',
    'Marketing presentation materials',
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Get random items from an array
 */
function getRandomItems(array, minCount = 1, maxCount = 3) {
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate a single mock evidence/document record
 */
function generateMockFile(index) {
  const fileType = FILE_TYPES[Math.floor(Math.random() * FILE_TYPES.length)];

  return {
    id: `file_${index}`,
    fileType, // Source file type (MIME type/extension)
    sourceFileName: generateSourceFileName(index, fileType),
    sourceFileSize: generateRandomSourceFileSize(),
    documentDate: generateRandomDate(), // Date of the underlying business document
    privilege: PRIVILEGES[Math.floor(Math.random() * PRIVILEGES.length)],
    description: generateDescription(),
    documentType: getRandomItems(DOCUMENT_TYPES, 1, 2),
    author: getRandomItems(AUTHORS, 1, 2),
    custodian: getRandomItems(CUSTODIANS, 1, 1),
  };
}

/**
 * Composable for generating and managing mock file data
 */
export function useMockFileData() {
  const files = ref([]);
  const isGenerating = ref(false);
  const generationTime = ref(0);

  /**
   * Generate mock file data
   * @param {number} count - Number of files to generate
   */
  function generateMockFiles(count) {
    isGenerating.value = true;
    const startTime = performance.now();

    const newFiles = [];
    for (let i = 1; i <= count; i++) {
      newFiles.push(generateMockFile(i));
    }

    files.value = newFiles;
    generationTime.value = performance.now() - startTime;
    isGenerating.value = false;

    return files.value;
  }

  /**
   * Clear all mock files
   */
  function clearFiles() {
    files.value = [];
    generationTime.value = 0;
  }

  /**
   * Generate files with performance logging
   * @param {number} count - Number of files to generate
   */
  function generateWithLogging(count) {
    const result = generateMockFiles(count);
    return result;
  }

  return {
    files,
    isGenerating,
    generationTime,
    generateMockFiles,
    generateWithLogging,
    clearFiles,
  };
}
