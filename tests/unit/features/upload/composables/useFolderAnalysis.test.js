import { describe, it, expect } from 'vitest';
import { useFolderAnalysis } from '../../../../../src/features/upload/composables/useFolderAnalysis.js';

describe('useFolderAnalysis', () => {
  const { preprocessFileData, calculateFileSizeMetrics, calculateFilenameStats } = useFolderAnalysis();

  const mockFiles = [
    { file: { size: 1024 }, path: 'documents/report.pdf' },
    { file: { size: 2048 }, path: 'images/photo.jpg' },
    { file: { size: 1024 }, path: 'documents/backup/report-backup.pdf' },
    { file: { size: 0 }, path: 'empty-file.txt' },
  ];

  it('preprocessFileData returns correct directory stats', () => {
    const result = preprocessFileData(mockFiles);

    expect(result.directoryStats).toEqual({
      totalDirectoryCount: 3, // documents, images, documents/backup
      maxFileDepth: 2,
      avgFileDepth: 1.0,
      avgDirectoryDepth: 1.3,
    });

    expect(result.folderStats).toEqual({
      rootFolderCount: 2, // documents, images
      hasSubfolders: true,
    });
  });

  it('calculateFileSizeMetrics returns correct metrics', () => {
    const result = calculateFileSizeMetrics(mockFiles);

    expect(result).toEqual({
      totalSizeMB: 0.004,
      uniqueFiles: 3,
      identicalSizeFiles: 1,
      zeroByteFiles: 1,
      largestFileSizesMB: [2, 1, 1, 0],
    });
  });

  it('calculateFilenameStats returns correct filename length', () => {
    const result = calculateFilenameStats(mockFiles);

    // Paths: 'documents/report.pdf' (20), 'images/photo.jpg' (16),
    // 'documents/backup/report-backup.pdf' (34), 'empty-file.txt' (14)
    // Sum: 84, Avg: 21.0
    expect(result.avgFilenameLength).toBeCloseTo(21.0, 1);
  });
});