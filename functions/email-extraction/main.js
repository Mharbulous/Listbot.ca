/**
 * Email Extraction Module
 * 
 * Clean exports for the entire module.
 * 
 * Usage:
 *   const { processEmailFile } = require('./email-extraction');
 *   const { parseEmailFile, isEmailFile } = require('./email-extraction/parser');
 */

// Main orchestrator (primary export)
const { processEmailFile } = require('./orchestrator');

// Parser utilities (for external use)
const { parseEmailFile, isEmailFile, getExtension } = require('./parser');

// Errors (for catching specific error types)
const errors = require('./errors');

// Constants (for reference)
const constants = require('./constants');

module.exports = {
  // Main function
  processEmailFile,
  
  // Parser utilities
  parseEmailFile,
  isEmailFile,
  getExtension,
  
  // Errors
  ...errors,
  
  // Constants
  ...constants
};
