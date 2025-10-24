/**
 * Mock data generator for Cloud table
 * Generates realistic file records for testing and development
 */

import { getDescription } from './analyzeMockData';

const FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'MSG', 'EML'];

const DOCUMENT_TYPES = [
  'Contract',
  'Email',
  'Report',
  'Memo',
  'Invoice',
  'Presentation',
  'Spreadsheet',
  'Letter',
  'Agreement',
  'Correspondence'
];

const PRIVILEGE_LEVELS = [
  'Privileged',
  'Non-Privileged',
  'Attorney-Client',
  'Work Product',
  'Confidential'
];

const AUTHORS = [
  'John Smith',
  'Sarah Johnson',
  'Michael Chen',
  'Emily Rodriguez',
  'David Kim',
  'Jennifer Williams',
  'Robert Taylor',
  'Lisa Anderson',
  'James Martinez',
  'Amanda Thompson'
];

const CUSTODIANS = [
  'Legal Dept.',
  'Finance Dept.',
  'HR Dept.',
  'IT Dept.',
  'Sales Dept.',
  'Marketing Dept.',
  'Operations',
  'Executive Office',
  'Compliance',
  'Accounting'
];

const STATUSES = [
  'Active',
  'Archived',
  'Under Review',
  'Pending Approval',
  'Draft',
  'Final'
];

const FILE_NAME_PREFIXES = [
  'contract',
  'agreement',
  'report',
  'memo',
  'invoice',
  'email',
  'presentation',
  'analysis',
  'summary',
  'proposal'
];

/**
 * Generate a random date within a range
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Date in YYYY-MM-DD format
 */
function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

/**
 * Generate a random file size in MB
 * @returns {string} File size formatted as "X.XMB"
 */
function randomSize() {
  const size = (Math.random() * 4.5 + 0.5).toFixed(1);
  return `${size}MB`;
}

/**
 * Generate a random element from an array
 * @param {Array} arr - Source array
 * @returns {*} Random element
 */
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a single mock file record
 * @param {number} index - Record index (used for uniqueness)
 * @returns {Object} Mock file record with all 12 columns
 */
function generateFileRecord(index) {
  const fileType = randomElement(FILE_TYPES);
  const prefix = randomElement(FILE_NAME_PREFIXES);
  const year = 2024;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

  // Generate created date first, then modified date after it
  const createdDate = randomDate(new Date(2024, 0, 1), new Date(2024, 9, 1));
  const modifiedDate = randomDate(new Date(createdDate), new Date(2024, 10, 21));

  return {
    id: index,
    fileType: fileType,
    fileName: `${prefix}_${index}_${year}_${month}.${fileType.toLowerCase()}`,
    size: randomSize(),
    date: `${year}-${month}-${day}`,
    privilege: randomElement(PRIVILEGE_LEVELS),
    description: getDescription(index),
    documentType: randomElement(DOCUMENT_TYPES),
    author: randomElement(AUTHORS),
    custodian: randomElement(CUSTODIANS),
    createdDate: createdDate,
    modifiedDate: modifiedDate,
    status: randomElement(STATUSES)
  };
}

/**
 * Generate an array of mock file records
 * @param {number} count - Number of records to generate (default: 10000)
 * @returns {Array} Array of mock file records
 */
export function generateCloudMockData(count = 10000) {
  const records = [];
  for (let i = 0; i < count; i++) {
    records.push(generateFileRecord(i + 1));
  }
  return records;
}
