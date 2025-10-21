/**
 * Mock data utilities for the Analyze view
 */

const descriptions = [
  'Initial consultation agreement outlining scope of legal services and fee structure for corporate merger transaction',
  'Amendment to service agreement modifying payment terms and deliverable schedules',
  'Comprehensive quarterly financial report including income statements, balance sheets, and cash flow analysis',
  'Internal memorandum regarding compliance requirements for upcoming regulatory audit',
  'Client correspondence discussing strategy for pending litigation matter with multiple defendants',
  'Draft settlement agreement for intellectual property dispute involving patent infringement claims',
  'Meeting minutes from board of directors quarterly review session covering strategic initiatives',
  'Due diligence report analyzing potential risks and liabilities for proposed acquisition target',
  'Employment contract with non-compete and confidentiality provisions for senior executive position',
  'Research memorandum analyzing recent case law developments affecting securities regulations'
];

/**
 * Generate varied descriptions for testing table content
 * @param {number} index - Row index to determine which description to use
 * @returns {string} Description text
 */
export function getDescription(index) {
  return descriptions[index % descriptions.length];
}
