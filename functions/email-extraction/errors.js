/**
 * Email Extraction Errors
 * 
 * Typed errors that make debugging straightforward.
 * Each error knows WHERE it happened and WHY.
 */

class EmailExtractionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'EmailExtractionError';
    this.phase = details.phase || 'unknown';
    this.fileName = details.fileName || null;
    this.fileHash = details.fileHash || null;
    this.timestamp = new Date().toISOString();
    
    // Preserve additional context for debugging
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      phase: this.phase,
      fileName: this.fileName,
      fileHash: this.fileHash,
      timestamp: this.timestamp,
      details: this.details
    };
  }
}

class ValidationError extends EmailExtractionError {
  constructor(message, details = {}) {
    super(message, { ...details, phase: 'validation' });
    this.name = 'ValidationError';
    this.field = details.field || null;
    this.receivedValue = details.receivedValue; // What we got
    this.expectedType = details.expectedType || null; // What we expected
  }
}

class ParseError extends EmailExtractionError {
  constructor(message, details = {}) {
    super(message, { ...details, phase: 'parse' });
    this.name = 'ParseError';
    this.format = details.format || null; // 'msg' or 'eml'
    this.parserError = details.parserError || null; // Original error from library
  }
}

class StorageError extends EmailExtractionError {
  constructor(message, details = {}) {
    super(message, { ...details, phase: 'storage' });
    this.name = 'StorageError';
    this.operation = details.operation || null; // 'download', 'upload', 'save'
    this.path = details.path || null;
  }
}

class LockError extends EmailExtractionError {
  constructor(message, details = {}) {
    super(message, { ...details, phase: 'lock' });
    this.name = 'LockError';
    this.reason = details.reason || null;
  }
}

module.exports = {
  EmailExtractionError,
  ValidationError,
  ParseError,
  StorageError,
  LockError
};
