# User Settings and Preferences System

Last Updated: 2025-10-15

## Overview

The Settings system manages user-specific display and behavior preferences that persist to Firestore and are accessible across all authenticated sessions. Preferences are automatically loaded during authentication and reactively update the UI when changed.

**Access Point**: `http://localhost:5173/#/settings`

## Database Path

```
/users/{userId}
  └── preferences: {
        dateFormat: string,
        timeFormat: string,
        darkMode: boolean,
        theme: string,          // Legacy field
        notifications: boolean, // Legacy field
        language: string        // Legacy field
      }
```

**Key Characteristics**:

- **User-Scoped**: Preferences stored within user document at `/users/{userId}`
- **Nested Object**: Preferences are a nested object field, not a subcollection
- **Auto-Initialized**: Created during user's first authentication
- **Merge Updates**: Uses `{ merge: true }` to preserve other user document fields
- **Legacy Compatibility**: Maintains old preference fields for backward compatibility

## Preferences Schema

### Document Structure

```javascript
{
  // Display Format Preferences - ACTIVE
  dateFormat: string,        // Date display format (default: 'YYYY-MM-DD')
  timeFormat: string,        // Time display format (default: 'HH:mm')
  darkMode: boolean,         // Dark mode toggle (default: false)

  // Legacy Fields - MAINTAINED FOR COMPATIBILITY
  theme: string,             // Always 'light' (legacy)
  notifications: boolean,    // Always true (legacy)
  language: string           // Always 'en' (legacy)
}
```

### Field Constraints

**dateFormat:**

- **MUST** be one of 12 supported format strings (see Format Options below)
- **DEFAULT**: 'YYYY-MM-DD' if not set or user document doesn't exist
- **VALIDATION**: Must match exact format string from `dateFormatOptions`
- **REACTIVE**: Changes immediately update all date displays throughout the app

**timeFormat:**

- **MUST** be one of 5 supported format strings (see Format Options below)
- **DEFAULT**: 'HH:mm' if not set or user document doesn't exist
- **VALIDATION**: Must match exact format string from `timeFormatOptions`
- **FUTURE USE**: Currently stored but not actively used in UI

**darkMode:**

- **TYPE**: Boolean only (true/false)
- **DEFAULT**: false if not set or user document doesn't exist
- **FUTURE FEATURE**: Toggle present in UI but theme switching not yet implemented
- **VALIDATION**: Must be boolean type

## Format Options

### Available Date Formats (12 options)

Defined in `src/features/organizer/utils/categoryFormOptions.js`:

| Format String   | Example Output   | Description               |
| --------------- | ---------------- | ------------------------- |
| `YYYY-MM-DD`    | 2024-01-23       | ISO 8601 format (default) |
| `DD/MM/YYYY`    | 23/01/2024       | European format           |
| `MM/DD/YYYY`    | 01/23/2024       | US format                 |
| `DD-MM-YYYY`    | 23-01-2024       | European with dashes      |
| `MM-DD-YYYY`    | 01-23-2024       | US with dashes            |
| `DD.MM.YYYY`    | 23.01.2024       | European with dots        |
| `MM.DD.YYYY`    | 01.23.2024       | US with dots              |
| `YYYY/MM/DD`    | 2024/01/23       | ISO with slashes          |
| `DD MMM YYYY`   | 23 Jan 2024      | Short month name          |
| `MMM DD, YYYY`  | Jan 23, 2024     | US short month            |
| `DD MMMM YYYY`  | 23 January 2024  | Full month name           |
| `MMMM DD, YYYY` | January 23, 2024 | US full month             |

### Available Time Formats (5 options)

Defined in `src/features/organizer/utils/categoryFormOptions.js`:

| Format String  | Example Output | Description               |
| -------------- | -------------- | ------------------------- |
| `HH:mm`        | 23:01          | 24-hour format (default)  |
| `HH:mm:ss`     | 23:01:45       | 24-hour with seconds      |
| `h:mm a`       | 11:01 PM       | 12-hour with AM/PM        |
| `h:mm:ss a`    | 11:01:45 PM    | 12-hour with seconds      |
| `HH:mm:ss.SSS` | 23:01:45.123   | 24-hour with milliseconds |

## Store Architecture

### Pinia Store: `useUserPreferencesStore`

**Location**: `src/core/stores/userPreferences.js`

**State**:

```javascript
{
  // User preferences
  dateFormat: 'YYYY-MM-DD',    // Current date format
  timeFormat: 'HH:mm',          // Current time format
  darkMode: false,              // Dark mode enabled

  // Store lifecycle
  isInitialized: false,         // Preferences loaded from Firestore
  isLoading: false,             // Currently loading/saving
  error: null,                  // Last error message

  // Internal tracking
  _userId: null                 // Current user ID
}
```

**Getters**:

```javascript
currentDateFormat: (state) => state.dateFormat;
currentTimeFormat: (state) => state.timeFormat;
isDarkMode: (state) => state.darkMode;
isReady: (state) => state.isInitialized && !state.isLoading;
```

**Actions**:

- `initialize(userId)` - Load preferences from Firestore
- `updateDateFormat(format)` - Update and persist date format
- `updateTimeFormat(format)` - Update and persist time format
- `updateDarkMode(enabled)` - Update and persist dark mode
- `resetToDefaults()` - Reset all preferences to defaults
- `clear()` - Clear store state (called on logout)

## Initialization Workflow

### Authentication Integration

Preferences are automatically initialized during user authentication:

**Location**: `src/core/stores/auth.js` line 122

```javascript
// In auth store's _handleUserAuthenticated method:
async _handleUserAuthenticated(firebaseUser) {
  // 1. Set user identity
  this.user = { uid, email, displayName, photoURL };

  // 2. Setup firm (solo firm for new users)
  this.firmId = await this._getUserFirmId(uid);

  // 3. Initialize user preferences (AUTOMATIC)
  await this._initializeUserPreferences(firebaseUser.uid);

  // 4. Mark authenticated
  this.authState = 'authenticated';
}
```

### First-Time User Setup

When a new user creates an account:

1. **Solo Firm Creation**: Auth store creates firm document
2. **User Document Creation**: Creates `/users/{userId}` document with default preferences:
   ```javascript
   {
     preferences: {
       theme: 'light',
       notifications: true,
       language: 'en',
       dateFormat: 'YYYY-MM-DD',
       timeFormat: 'HH:mm',
       darkMode: false
     }
   }
   ```
3. **Preferences Store Init**: Loads preferences into Pinia store
4. **UI Updates**: All components using preferences reactively update

### Subsequent Logins

1. **Auth Check**: Firebase Auth determines user is logged in
2. **Preferences Load**: Store fetches existing preferences from `/users/{userId}`
3. **State Hydration**: Pinia store populated with saved preferences
4. **Reactive Updates**: UI components read from store and display user's preferences

## UI Component Structure

### Settings Page: `src/views/Settings.vue`

**Route**: `/#/settings`

**Layout**:

```
Settings Page
├── Preferences Section
│   ├── Date Format Selector (v-select)
│   ├── Time Format Selector (v-select)
│   └── Dark Mode Toggle (checkbox)
└── Account Settings Section
    ├── Change Password Button (placeholder)
    └── Delete Account Button (placeholder)
```

**Reactive Bindings**:

All inputs use computed properties with async setters:

```javascript
const selectedDateFormat = computed({
  get: () => dateFormat.value,
  set: async (value) => {
    await preferencesStore.updateDateFormat(value);
  },
});
```

**User Experience**:

- Selections update immediately (optimistic updates)
- Loading states during save operations
- Automatic error reversion if save fails
- No manual "Save" button required

### Format Selection UI

**Date Format Selector**:

- **Icon**: Orange calendar icon (`mdi-calendar`)
- **Display**: Format name + example (e.g., "YYYY-MM-DD (2024-01-23)")
- **Dropdown**: All 12 formats with examples
- **Auto-saves**: On selection change

**Time Format Selector**:

- **Icon**: Purple clock icon (`mdi-clock-outline`)
- **Display**: Format name + example (e.g., "HH:mm (23:01)")
- **Dropdown**: All 5 formats with examples
- **Auto-saves**: On selection change

## Update Operations

### Optimistic Update Pattern

**ALWAYS** use this pattern for preference updates:

```javascript
async updateDateFormat(format) {
  // 1. Validate user is initialized
  if (!this._userId) {
    console.error('[UserPreferences] Cannot update without initialized user');
    return;
  }

  // 2. Store previous value for rollback
  const previousFormat = this.dateFormat;

  // 3. Update immediately (optimistic)
  this.dateFormat = format;

  try {
    // 4. Persist to Firestore
    await this._savePreferences(this._userId, {
      dateFormat: format,
      timeFormat: this.timeFormat,
      darkMode: this.darkMode
    });
  } catch (error) {
    // 5. Revert on error
    this.dateFormat = previousFormat;
    this.error = error.message;
    throw error;
  }
}
```

**Benefits**:

- Instant UI feedback
- Automatic error handling
- No manual rollback code in components
- Consistent error recovery

### Firestore Save Operation

**ALWAYS** use merge mode to preserve other fields:

```javascript
await setDoc(
  userDocRef,
  {
    preferences: {
      dateFormat: preferences.dateFormat,
      timeFormat: preferences.timeFormat,
      darkMode: preferences.darkMode,
      // Legacy fields preserved
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  },
  { merge: true } // CRITICAL: Preserves other user document fields
);
```

## Integration with Other Features

### Date Formatting Utility

**Location**: `src/utils/dateFormatter.js`

The Settings system integrates with the centralized date formatter:

```javascript
// Date formatter uses user preferences
import { formatDate } from '@/utils/dateFormatter.js';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';

const preferencesStore = useUserPreferencesStore();
const formattedDate = formatDate(timestamp, preferencesStore.dateFormat);
```

### Organizer Page Integration

**Location**: `src/features/organizer/components/FileListItemContent.vue`

File dates automatically use user's selected format:

```javascript
// Component imports preferences store
const preferencesStore = useUserPreferencesStore();
const { dateFormat } = storeToRefs(preferencesStore);

// Computed property uses reactive format
const formattedDate = computed(() => {
  return formatDateUtil(props.evidence?.createdAt, dateFormat.value);
});
```

**Reactive Behavior**:

- User changes format in Settings
- Store updates automatically
- All FileListItemContent components re-render
- Dates display in new format instantly
- No page refresh required

## Query Operations

### Load User Preferences

```javascript
// Get user document
const userDocRef = doc(db, 'users', userId);
const userDoc = await getDoc(userDocRef);

if (userDoc.exists()) {
  const data = userDoc.data();
  const preferences = data.preferences || {};

  // Extract preferences with defaults
  const dateFormat = preferences.dateFormat || 'YYYY-MM-DD';
  const timeFormat = preferences.timeFormat || 'HH:mm';
  const darkMode = preferences.darkMode || false;
}
```

### Update Preferences

```javascript
// Update specific preference fields
const userDocRef = doc(db, 'users', userId);

await setDoc(
  userDocRef,
  {
    preferences: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      darkMode: false,
      // Legacy fields
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  },
  { merge: true }
);
```

### Reset to Defaults

```javascript
// Reset all preferences
await setDoc(
  userDocRef,
  {
    preferences: {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm',
      darkMode: false,
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  },
  { merge: true }
);
```

## Firestore Security Rules

```javascript
match /users/{userId} {
  // Users can only read/write their own preferences
  allow read: if request.auth != null &&
                 request.auth.uid == userId;

  allow write: if request.auth != null &&
                  request.auth.uid == userId &&
                  validateUserPreferences(request.resource.data);
}

function validateUserPreferences(data) {
  // Ensure preferences object exists
  return data.preferences is map &&
         // Validate date format (if present)
         (!('dateFormat' in data.preferences) ||
          data.preferences.dateFormat in [
            'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY',
            'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY',
            'MM.DD.YYYY', 'YYYY/MM/DD', 'DD MMM YYYY',
            'MMM DD, YYYY', 'DD MMMM YYYY', 'MMMM DD, YYYY'
          ]) &&
         // Validate time format (if present)
         (!('timeFormat' in data.preferences) ||
          data.preferences.timeFormat in [
            'HH:mm', 'HH:mm:ss', 'h:mm a',
            'h:mm:ss a', 'HH:mm:ss.SSS'
          ]) &&
         // Validate dark mode (if present)
         (!('darkMode' in data.preferences) ||
          data.preferences.darkMode is bool);
}
```

**Note**: For complete authentication flow and firm-based access control, see [security-rules.md](security-rules.md).

## Performance Considerations

### Store Initialization

- **Timing**: Preferences loaded during authentication (blocking)
- **Error Handling**: Falls back to defaults if load fails
- **Cache**: Pinia store caches preferences in memory
- **Updates**: Network requests only on preference changes

### Reactive Performance

- **Vue Reactivity**: Store uses Pinia's reactive state
- **Computed Properties**: Components use `storeToRefs` for reactive access
- **Re-render Scope**: Only components using changed preference re-render
- **No Watchers**: Direct computed bindings eliminate watcher overhead

### Firestore Operations

- **Read**: Single document read on login (~50-100ms)
- **Write**: Single document update on preference change (~100-200ms)
- **Merge Mode**: Preserves other fields without full document read
- **Optimistic Updates**: UI updates immediately, no waiting for Firestore

## Critical Constraints

### Data Integrity

- **NEVER** delete user preferences - always reset to defaults
- **NEVER** modify preferences for other users
- **ALWAYS** use merge mode to preserve other user document fields
- **ALWAYS** validate format strings against allowed values
- **NEVER** allow direct Firestore writes outside store actions

### Store Lifecycle

- **ALWAYS** initialize preferences during authentication
- **ALWAYS** clear store on logout
- **NEVER** access preferences before `isInitialized === true`
- **ALWAYS** handle missing preferences with defaults
- **NEVER** assume preferences exist on first login

### Update Operations

- **ALWAYS** store previous value before optimistic update
- **ALWAYS** revert on save error
- **NEVER** update multiple fields without coordinating state
- **ALWAYS** maintain legacy fields for backward compatibility
- **NEVER** skip validation in store actions

### Format Validation

- **ALWAYS** validate against `dateFormatOptions` array
- **ALWAYS** validate against `timeFormatOptions` array
- **NEVER** allow custom format strings
- **ALWAYS** default to 'YYYY-MM-DD' for invalid date formats
- **ALWAYS** default to 'HH:mm' for invalid time formats

## Cross-Reference to Other Documentation

- For authentication initialization flow, see Authentication documentation
- For date formatting implementation, see `src/utils/dateFormatter.js`
- For Organizer page date display, see [Evidence.md](Evidence.md)
- For solo firm patterns, see [SoloFirmMatters.md](SoloFirmMatters.md)
- For Firestore security rules, see [security-rules.md](security-rules.md)

## Common Pitfalls

**DO NOT** access preferences before initialization completes.
**DO NOT** modify preferences object directly - use store actions.
**DO NOT** hardcode date/time formats in components - use preferences.
**DO NOT** skip error handling in preference update operations.
**DO NOT** assume all users have preferences document (handle missing).
**DO NOT** forget to preserve legacy fields when saving preferences.
**DO NOT** allow invalid format strings to be persisted.
**DO NOT** implement dark mode theme switching yet (feature incomplete).

## Future Enhancements

### Planned Features

- **Dark Mode Implementation**: Complete theme switching functionality
- **Notification Preferences**: Email/push notification controls
- **Language Selection**: Multi-language support
- **Date Range Formats**: Quarter/week display options
- **Time Zone Selection**: Explicit timezone preference
- **Export Preferences**: Backup/restore settings across devices

### Migration Considerations

- **ALWAYS** maintain backward compatibility with old preference structure
- **NEVER** break existing users when adding new preferences
- **ALWAYS** provide sensible defaults for new preference fields
- **ALWAYS** test preference migrations with production data samples
