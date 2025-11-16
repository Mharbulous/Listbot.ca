import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applySequentialPrefilter, verifyWithHashing } from '../../../../../src/features/upload/composables/useSequentialPrefilter.js';

describe('useSequentialPrefilter - Redundant File Lifecycle', () => {
  // Mock hash function that returns deterministic hashes based on file name
  const createMockHashFunction = () => {
    return vi.fn(async (file) => {
      // Files with same base name get same hash
      const baseName = file.name.replace(/\s*\(\d+\)/, ''); // Remove (1), (2) suffixes
      return `hash_${baseName}_${file.size}`;
    });
  };

  // Helper to create mock file objects
  const createMockFile = (name, size, sourceLastModified, folderPath, status = null) => {
    return {
      id: `id_${name}_${Math.random()}`,
      name,
      size,
      sourceLastModified,
      folderPath,
      status,
      sourceFile: { name, size }, // Mock File object for hashing
    };
  };

  describe('Stage 1: Pre-filter - Redundant File Removal', () => {
    it('should remove files marked as redundant from previous processing', () => {
      const files = [
        createMockFile('document.pdf', 1000, 1234567890, '/folder1', null),
        createMockFile('document.pdf', 1000, 1234567890, '/folder1', 'redundant'),
        createMockFile('photo.jpg', 2000, 1234567891, '/folder2', null),
        createMockFile('photo.jpg', 2000, 1234567891, '/folder2', 'redundant'),
        createMockFile('report.doc', 3000, 1234567892, '/folder3', null),
      ];

      const result = applySequentialPrefilter(files);

      // Should have removed 2 redundant files
      expect(result.stats.redundantFilesRemoved).toBe(2);
      expect(result.sortedFiles.length).toBe(3);

      // Verify no redundant files in output
      const redundantFiles = result.sortedFiles.filter(f => f.status === 'redundant');
      expect(redundantFiles.length).toBe(0);
    });

    it('should log removed redundant files', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      const files = [
        createMockFile('test.pdf', 1000, 1234567890, '/folder1', 'redundant'),
        createMockFile('other.pdf', 2000, 1234567891, '/folder2', null),
      ];

      applySequentialPrefilter(files);

      // Check that removal was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removing 1 redundant files from previous processing')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Removing: test.pdf'));

      consoleLogSpy.mockRestore();
    });

    it('should handle empty file list', () => {
      const files = [];
      const result = applySequentialPrefilter(files);

      expect(result.stats.redundantFilesRemoved).toBe(0);
      expect(result.sortedFiles.length).toBe(0);
    });

    it('should handle all files being redundant', () => {
      const files = [
        createMockFile('file1.pdf', 1000, 1234567890, '/folder1', 'redundant'),
        createMockFile('file2.pdf', 2000, 1234567891, '/folder2', 'redundant'),
      ];

      const result = applySequentialPrefilter(files);

      expect(result.stats.redundantFilesRemoved).toBe(2);
      expect(result.sortedFiles.length).toBe(0);
    });
  });

  describe('Stage 2: Hash Verification - Marking Duplicates as Redundant', () => {
    it('should mark duplicates as redundant when hashes match', async () => {
      // Create files that will be marked as duplicates in Stage 1
      // Using identical paths to ensure they're marked as duplicates
      const files = [
        createMockFile('document.pdf', 1000, 1234567890, 'folder1'),
        createMockFile('document.pdf', 1000, 1234567890, 'folder1'),
      ];

      // Run Stage 1
      const stage1Result = applySequentialPrefilter(files);
      const sortedFiles = stage1Result.sortedFiles;

      // Verify Stage 1 marked second file as duplicate
      expect(sortedFiles[0].status).toBe('ready'); // Primary
      expect(sortedFiles[1].status).toBe('duplicate');

      // Run Stage 2
      const mockHashFn = createMockHashFunction();
      const preFilterCheck = () => true;
      const stage2Result = await verifyWithHashing(sortedFiles, mockHashFn, preFilterCheck);

      // Verify Stage 2 marked duplicate as redundant
      expect(sortedFiles[1].status).toBe('redundant');
      expect(sortedFiles[1].isRedundant).toBe(true);
      expect(sortedFiles[1].canUpload).toBe(false);
      expect(stage2Result.stats.redundantCount).toBe(1);
    });

    it('should keep copies unchanged when hashes match', async () => {
      // Create files that will be marked as copies (different dates)
      const files = [
        createMockFile('document.pdf', 1000, 1234567890, '/folder1'),
        createMockFile('document.pdf', 1000, 1234567999, '/folder2'), // Different date = copy
      ];

      // Run Stage 1
      const stage1Result = applySequentialPrefilter(files);
      const sortedFiles = stage1Result.sortedFiles;

      // Verify Stage 1 marked second file as copy
      expect(sortedFiles[0].status).toBe('ready'); // Primary
      expect(sortedFiles[1].status).toBe('copy');

      // Run Stage 2
      const mockHashFn = createMockHashFunction();
      const preFilterCheck = () => true;
      const stage2Result = await verifyWithHashing(sortedFiles, mockHashFn, preFilterCheck);

      // Verify Stage 2 kept it as copy (not redundant)
      expect(sortedFiles[1].status).toBe('copy');
      expect(sortedFiles[1].isCopy).toBe(true);
      expect(sortedFiles[1].canUpload).toBe(true);
      expect(stage2Result.stats.redundantCount).toBe(0);
    });

    it('should upgrade duplicates to primary when hashes differ', async () => {
      // Create files that look like duplicates but have different content
      // Using identical paths to ensure they're marked as duplicates
      const files = [
        createMockFile('document.pdf', 1000, 1234567890, 'folder1'),
        createMockFile('document.pdf', 1000, 1234567890, 'folder1'),
      ];

      // Run Stage 1
      const stage1Result = applySequentialPrefilter(files);
      const sortedFiles = stage1Result.sortedFiles;

      // Verify Stage 1 marked second file as duplicate
      expect(sortedFiles[1].status).toBe('duplicate');

      // Create hash function that returns different hashes
      const mockHashFn = vi.fn()
        .mockResolvedValueOnce('hash_different_1')
        .mockResolvedValueOnce('hash_different_2');

      const preFilterCheck = () => true;
      const stage2Result = await verifyWithHashing(sortedFiles, mockHashFn, preFilterCheck);

      // Verify Stage 2 upgraded to primary
      expect(sortedFiles[1].status).toBe('ready');
      expect(sortedFiles[1].isPrimary).toBe(true);
      expect(sortedFiles[1].isDuplicate).toBe(false);
      expect(sortedFiles[1].canUpload).toBe(true);
      expect(stage2Result.stats.upgradedToPrimaryCount).toBe(1);
      expect(stage2Result.stats.redundantCount).toBe(0);
    });
  });

  describe('Full Lifecycle: Duplicate → Redundant → Removed', () => {
    it('should complete full lifecycle across two batches', async () => {
      // BATCH 1: Initial upload with duplicates
      console.log('\n=== BATCH 1: Initial Upload ===');
      const batch1Files = [
        createMockFile('report.pdf', 1000, 1234567890, 'documents'),
        createMockFile('report.pdf', 1000, 1234567890, 'documents'),
        createMockFile('report.pdf', 1000, 1234567890, 'documents'),
      ];

      // Stage 1 - Batch 1
      const batch1Stage1 = applySequentialPrefilter(batch1Files);
      console.log('Batch 1 Stage 1 Stats:', batch1Stage1.stats);

      // Verify: First = Primary, Second/Third = Duplicate
      expect(batch1Stage1.sortedFiles[0].status).toBe('ready');
      expect(batch1Stage1.sortedFiles[1].status).toBe('duplicate');
      expect(batch1Stage1.sortedFiles[2].status).toBe('duplicate');
      expect(batch1Stage1.stats.primaryCount).toBe(1);
      expect(batch1Stage1.stats.duplicateCount).toBe(2);

      // Stage 2 - Batch 1
      const mockHashFn = createMockHashFunction();
      const preFilterCheck = () => true;
      const batch1Stage2 = await verifyWithHashing(
        batch1Stage1.sortedFiles,
        mockHashFn,
        preFilterCheck
      );
      console.log('Batch 1 Stage 2 Stats:', batch1Stage2.stats);

      // Verify: Duplicates marked as Redundant
      expect(batch1Stage1.sortedFiles[0].status).toBe('ready'); // Still primary
      expect(batch1Stage1.sortedFiles[1].status).toBe('redundant'); // Now redundant
      expect(batch1Stage1.sortedFiles[2].status).toBe('redundant'); // Now redundant
      expect(batch1Stage2.stats.redundantCount).toBe(2);

      // BATCH 2: New upload includes previous files (simulating re-upload)
      console.log('\n=== BATCH 2: New Upload (includes redundant files) ===');
      const batch2Files = [
        ...batch1Stage1.sortedFiles, // Include all files from batch 1 (with redundant status)
        createMockFile('invoice.pdf', 2000, 1234567891, '/invoices'),
      ];

      // Stage 1 - Batch 2
      const batch2Stage1 = applySequentialPrefilter(batch2Files);
      console.log('Batch 2 Stage 1 Stats:', batch2Stage1.stats);

      // Verify: Redundant files removed
      expect(batch2Stage1.stats.redundantFilesRemoved).toBe(2);
      expect(batch2Stage1.sortedFiles.length).toBe(2); // Only report.pdf (primary) and invoice.pdf

      // Verify no redundant files in output
      const redundantFiles = batch2Stage1.sortedFiles.filter(f => f.status === 'redundant');
      expect(redundantFiles.length).toBe(0);

      // Verify remaining files
      const fileNames = batch2Stage1.sortedFiles.map(f => f.name);
      expect(fileNames).toContain('report.pdf');
      expect(fileNames).toContain('invoice.pdf');
    });

    it('should handle mixed status files correctly', async () => {
      const files = [
        // Primary file
        createMockFile('unique.pdf', 1000, 1234567890, 'folder1'),

        // Duplicate pair (same hash, same metadata, same path)
        createMockFile('duplicate.pdf', 2000, 1234567891, 'folder2'),
        createMockFile('duplicate.pdf', 2000, 1234567891, 'folder2'),

        // Copy pair (different dates, same hash)
        createMockFile('copy.pdf', 3000, 1234567892, 'folder3'),
        createMockFile('copy.pdf', 3000, 1234567999, 'folder3'),

        // Previously marked redundant (should be removed)
        createMockFile('old.pdf', 4000, 1234567893, 'folder4', 'redundant'),
      ];

      // Stage 1
      const stage1Result = applySequentialPrefilter(files);

      // Verify redundant file removed
      expect(stage1Result.stats.redundantFilesRemoved).toBe(1);
      expect(stage1Result.sortedFiles.length).toBe(5);

      // Verify initial statuses
      const statuses = stage1Result.sortedFiles.map(f => ({ name: f.name, status: f.status }));
      console.log('After Stage 1:', statuses);

      // Stage 2
      const mockHashFn = createMockHashFunction();
      const preFilterCheck = () => true;
      const stage2Result = await verifyWithHashing(
        stage1Result.sortedFiles,
        mockHashFn,
        preFilterCheck
      );

      // Count final statuses
      const finalStatuses = {
        ready: stage1Result.sortedFiles.filter(f => f.status === 'ready').length,
        copy: stage1Result.sortedFiles.filter(f => f.status === 'copy').length,
        redundant: stage1Result.sortedFiles.filter(f => f.status === 'redundant').length,
      };

      console.log('Final statuses:', finalStatuses);
      console.log('Stage 2 stats:', stage2Result.stats);

      // Verify final counts
      expect(finalStatuses.ready).toBe(3); // unique, duplicate (primary), copy (primary)
      expect(finalStatuses.copy).toBe(1); // copy with different date
      expect(finalStatuses.redundant).toBe(1); // duplicate with same path
      expect(stage2Result.stats.redundantCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pre-filter not complete timeout', async () => {
      const files = [
        createMockFile('test.pdf', 1000, 1234567890, 'folder1'),
      ];

      const mockHashFn = createMockHashFunction();
      const preFilterCheck = () => false; // Always return false

      const result = await verifyWithHashing(files, mockHashFn, preFilterCheck);

      expect(result.verificationComplete).toBe(false);
      expect(result.stats.error).toBe('Pre-filter timeout');
    }, 15000); // Increase timeout to 15 seconds to allow for 10 retries

    it('should handle hash calculation errors', async () => {
      const files = [
        createMockFile('file1.pdf', 1000, 1234567890, 'folder1'),
        createMockFile('file1.pdf', 1000, 1234567890, 'folder1'),
      ];

      // Run Stage 1
      const stage1Result = applySequentialPrefilter(files);

      // Create hash function that throws error
      const mockHashFn = vi.fn().mockRejectedValue(new Error('Hash calculation failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const preFilterCheck = () => true;

      await verifyWithHashing(stage1Result.sortedFiles, mockHashFn, preFilterCheck);

      // Verify error was logged and file marked appropriately
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(stage1Result.sortedFiles[1].status).toBe('read error');
      expect(stage1Result.sortedFiles[1].canUpload).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should not recalculate existing hashes', async () => {
      const files = [
        createMockFile('file1.pdf', 1000, 1234567890, 'folder1'),
        createMockFile('file1.pdf', 1000, 1234567890, 'folder1'),
      ];

      // Pre-populate hash on first file
      files[0].hash = 'existing_hash_123';

      // Run Stage 1
      const stage1Result = applySequentialPrefilter(files);

      // Create hash function that tracks calls
      const mockHashFn = vi.fn().mockResolvedValue('new_hash_456');

      const preFilterCheck = () => true;
      await verifyWithHashing(stage1Result.sortedFiles, mockHashFn, preFilterCheck);

      // First file should not be hashed (already has hash)
      // Second file should be hashed once
      expect(mockHashFn).toHaveBeenCalledTimes(1);
      expect(stage1Result.sortedFiles[0].hash).toBe('existing_hash_123');
      expect(stage1Result.sortedFiles[1].hash).toBe('new_hash_456');
    });
  });
});
