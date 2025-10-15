import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatDateTime } from '@/utils/dateFormatter.js';

describe('dateFormatter', () => {
  // Create a fixed date for testing: January 23, 2024 at 23:01:45.123
  // Use local time instead of UTC to avoid timezone issues
  const testDate = new Date(2024, 0, 23, 23, 1, 45, 123); // January = 0

  // Mock Firestore timestamp
  const mockFirestoreTimestamp = {
    toDate: () => testDate,
  };

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2024-01-23');
      expect(formatDate(mockFirestoreTimestamp, 'YYYY-MM-DD')).toBe('2024-01-23');
    });

    it('should format date as DD/MM/YYYY', () => {
      expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('23/01/2024');
    });

    it('should format date as MM/DD/YYYY', () => {
      expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('01/23/2024');
    });

    it('should format date as DD-MM-YYYY', () => {
      expect(formatDate(testDate, 'DD-MM-YYYY')).toBe('23-01-2024');
    });

    it('should format date as MM-DD-YYYY', () => {
      expect(formatDate(testDate, 'MM-DD-YYYY')).toBe('01-23-2024');
    });

    it('should format date as DD.MM.YYYY', () => {
      expect(formatDate(testDate, 'DD.MM.YYYY')).toBe('23.01.2024');
    });

    it('should format date as MM.DD.YYYY', () => {
      expect(formatDate(testDate, 'MM.DD.YYYY')).toBe('01.23.2024');
    });

    it('should format date as YYYY/MM/DD', () => {
      expect(formatDate(testDate, 'YYYY/MM/DD')).toBe('2024/01/23');
    });

    it('should format date as DD MMM YYYY', () => {
      expect(formatDate(testDate, 'DD MMM YYYY')).toBe('23 Jan 2024');
    });

    it('should format date as MMM DD, YYYY', () => {
      expect(formatDate(testDate, 'MMM DD, YYYY')).toBe('Jan 23, 2024');
    });

    it('should format date as DD MMMM YYYY', () => {
      expect(formatDate(testDate, 'DD MMMM YYYY')).toBe('23 January 2024');
    });

    it('should format date as MMMM DD, YYYY', () => {
      expect(formatDate(testDate, 'MMMM DD, YYYY')).toBe('January 23, 2024');
    });

    it('should return empty string for null timestamp', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('should default to YYYY-MM-DD when no format specified', () => {
      expect(formatDate(testDate)).toBe('2024-01-23');
    });

    it('should fallback to YYYY-MM-DD for unknown format', () => {
      expect(formatDate(testDate, 'UNKNOWN_FORMAT')).toBe('2024-01-23');
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:mm', () => {
      expect(formatTime(testDate, 'HH:mm')).toBe('23:01');
    });

    it('should format time as HH:mm:ss', () => {
      expect(formatTime(testDate, 'HH:mm:ss')).toBe('23:01:45');
    });

    it('should format time as h:mm a', () => {
      expect(formatTime(testDate, 'h:mm a')).toBe('11:01 PM');
    });

    it('should format time as h:mm:ss a', () => {
      expect(formatTime(testDate, 'h:mm:ss a')).toBe('11:01:45 PM');
    });

    it('should format time as HH:mm:ss.SSS', () => {
      expect(formatTime(testDate, 'HH:mm:ss.SSS')).toBe('23:01:45.123');
    });

    it('should handle AM times correctly', () => {
      const amDate = new Date(2024, 0, 23, 9, 30, 0); // Local time
      expect(formatTime(amDate, 'h:mm a')).toBe('9:30 AM');
    });

    it('should handle noon correctly', () => {
      const noonDate = new Date(2024, 0, 23, 12, 0, 0); // Local time
      expect(formatTime(noonDate, 'h:mm a')).toBe('12:00 PM');
    });

    it('should handle midnight correctly', () => {
      const midnightDate = new Date(2024, 0, 23, 0, 0, 0); // Local time
      expect(formatTime(midnightDate, 'h:mm a')).toBe('12:00 AM');
    });

    it('should return empty string for null timestamp', () => {
      expect(formatTime(null)).toBe('');
      expect(formatTime(undefined)).toBe('');
    });

    it('should default to HH:mm when no format specified', () => {
      expect(formatTime(testDate)).toBe('23:01');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      expect(formatDateTime(testDate, 'YYYY-MM-DD', 'HH:mm')).toBe('2024-01-23 23:01');
      expect(formatDateTime(testDate, 'DD/MM/YYYY', 'h:mm a')).toBe('23/01/2024 11:01 PM');
    });

    it('should return empty string for null timestamp', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('should use default formats when not specified', () => {
      expect(formatDateTime(testDate)).toBe('2024-01-23 23:01');
    });
  });
});
