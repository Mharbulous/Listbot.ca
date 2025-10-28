/**
 * Category Form Options
 *
 * Shared form options for category creation and editing.
 * These options define the available formats for Date, Timestamp, and Sequence category types.
 */

// Date format options ordered from most concise to least concise
export const dateFormatOptions = [
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD', example: '2024-01-23' },
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY', example: '23/01/2024' },
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY', example: '01/23/2024' },
  { title: 'DD-MM-YYYY', value: 'DD-MM-YYYY', example: '23-01-2024' },
  { title: 'MM-DD-YYYY', value: 'MM-DD-YYYY', example: '01-23-2024' },
  { title: 'DD.MM.YYYY', value: 'DD.MM.YYYY', example: '23.01.2024' },
  { title: 'MM.DD.YYYY', value: 'MM.DD.YYYY', example: '01.23.2024' },
  { title: 'YYYY/MM/DD', value: 'YYYY/MM/DD', example: '2024/01/23' },
  { title: 'DD MMM YYYY', value: 'DD MMM YYYY', example: '23 Jan 2024' },
  { title: 'MMM DD, YYYY', value: 'MMM DD, YYYY', example: 'Jan 23, 2024' },
  { title: 'DD MMMM YYYY', value: 'DD MMMM YYYY', example: '23 January 2024' },
  { title: 'MMMM DD, YYYY', value: 'MMMM DD, YYYY', example: 'January 23, 2024' },
];

// Time format options ordered from most concise to least concise
export const timeFormatOptions = [
  { title: 'HH:mm', value: 'HH:mm', example: '23:01' },
  { title: 'HH:mm:ss', value: 'HH:mm:ss', example: '23:01:45' },
  { title: 'h:mm a', value: 'h:mm a', example: '11:01 PM' },
  { title: 'h:mm:ss a', value: 'h:mm:ss a', example: '11:01:45 PM' },
  { title: 'HH:mm:ss.SSS', value: 'HH:mm:ss.SSS', example: '23:01:45.123' },
];

// Sequence format options ordered from most common to least common
export const sequenceFormatOptions = [
  { title: '1, 2, 3, ...', value: '1, 2, 3, ...' },
  { title: '01, 02, 03, ...', value: '01, 02, 03, ...' },
  { title: 'a, b, c, ...', value: 'a, b, c, ...' },
  { title: 'A, B, C, ...', value: 'A, B, C, ...' },
  { title: 'i, ii, iii, ...', value: 'i, ii, iii, ...' },
  { title: 'I, II, III, ...', value: 'I, II, III, ...' },
  { title: '1st, 2nd, 3rd, ...', value: '1st, 2nd, 3rd, ...' },
  { title: 'First, Second, Third, ...', value: 'First, Second, Third, ...' },
];

// Boolean format options
export const booleanFormatOptions = [
  { title: 'TRUE/FALSE', value: 'TRUE/FALSE' },
  { title: 'YES/NO', value: 'YES/NO' },
];
