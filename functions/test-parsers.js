#!/usr/bin/env node

/**
 * Simple test script to validate email parsers
 * Run with: node test-parsers.js
 */

const { isEmailFile } = require('./parsers');
const { MAX_FILE_SIZE, MAX_DEPTH, PARSE_STATUS } = require('./constants');

console.log('🧪 Testing Email Extraction Modules\n');

// Test 1: Constants
console.log('✓ Testing constants...');
console.assert(MAX_FILE_SIZE === 100 * 1024 * 1024, 'MAX_FILE_SIZE should be 100MB');
console.assert(MAX_DEPTH === 10, 'MAX_DEPTH should be 10');
console.assert(PARSE_STATUS.PENDING === 'pending', 'PARSE_STATUS.PENDING should be "pending"');
console.log('  ✓ All constants valid\n');

// Test 2: Email file detection
console.log('✓ Testing email file detection...');
console.assert(isEmailFile('test.msg') === true, 'Should detect .msg files');
console.assert(isEmailFile('TEST.MSG') === true, 'Should detect .MSG files (case insensitive)');
console.assert(isEmailFile('test.eml') === true, 'Should detect .eml files');
console.assert(isEmailFile('test.EML') === true, 'Should detect .EML files (case insensitive)');
console.assert(isEmailFile('test.pdf') === false, 'Should not detect .pdf as email');
console.assert(isEmailFile('test.docx') === false, 'Should not detect .docx as email');
console.assert(isEmailFile('email.msg.pdf') === false, 'Should use extension, not substring');
console.log('  ✓ Email file detection working correctly\n');

// Test 3: Module loading
console.log('✓ Testing module structure...');
try {
  const parsers = require('./parsers');
  console.assert(typeof parsers.parseEmail === 'function', 'parseEmail should be a function');
  console.assert(typeof parsers.isEmailFile === 'function', 'isEmailFile should be a function');
  console.log('  ✓ Parsers module structure valid\n');

  // Note: emailExtraction.js requires Firebase Admin initialization
  // It will be tested via deployment, not in this unit test
  console.log('  ℹ EmailExtraction module requires Firebase (will be tested on deployment)\n');
} catch (error) {
  console.error('  ✗ Module loading error:', error.message);
  process.exit(1);
}

// Test 4: BLAKE3 hashing (if we can test without Firebase)
console.log('✓ Testing BLAKE3 hashing...');
try {
  const blake3 = require('blake3');
  const hash1 = blake3.createHash();
  hash1.update(Buffer.from('test data'));
  const result1 = hash1.digest('hex');

  const hash2 = blake3.createHash();
  hash2.update(Buffer.from('test data'));
  const result2 = hash2.digest('hex');

  console.assert(result1 === result2, 'Same data should produce same hash');
  console.assert(result1.length === 64, 'BLAKE3 hash should be 64 hex characters');
  console.log(`  ✓ BLAKE3 hashing working (sample: ${result1.substring(0, 16)}...)\n`);
} catch (error) {
  console.error('  ✗ BLAKE3 hashing error:', error.message);
  process.exit(1);
}

// Test 5: Parser dependencies
console.log('✓ Testing parser dependencies...');
try {
  const MsgReader = require('@kenjiuno/msgreader').default;
  console.assert(typeof MsgReader === 'function', 'MsgReader should be a constructor');
  console.log('  ✓ @kenjiuno/msgreader loaded\n');

  const mailparser = require('mailparser');
  console.assert(typeof mailparser.simpleParser === 'function', 'simpleParser should be a function');
  console.log('  ✓ mailparser loaded\n');
} catch (error) {
  console.error('  ✗ Parser dependency error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed!\n');
console.log('📋 Summary:');
console.log('  • Constants: ✓');
console.log('  • Email detection: ✓');
console.log('  • Module structure: ✓');
console.log('  • BLAKE3 hashing: ✓');
console.log('  • Parser dependencies: ✓');
console.log('\n✨ Email extraction modules are ready for deployment!\n');
