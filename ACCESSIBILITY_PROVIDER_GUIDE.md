# AccessibilityProvider Implementation Guide

## Overview

The `AccessibilityProvider` is a React context provider that manages global accessibility state for the UNSAID/UNHEARD application. It provides:

- **Local Storage**: Immediate persistence of preferences in browser localStorage
- **Firebase Sync**: Cloud synchronization for authenticated users
- **Cross-Device Sync**: Real-time updates across multiple devices
- **Conflict Resolution**: Intelligent merging of preferences from different sources
- **Offline Support**: Full functionality without internet connection

## Architecture

### Components

1. **AccessibilityProvider** (`src/components/AccessibilityProvider.tsx`)
   - React context provider for global accessibility state
   - Manages local and cloud storage
   - Handles authentication state changes
   - Provides real-time synchronization

2. **Firebase Configuration** (`src/lib/firebase.ts`)
   - Initializes Firebase app
   - Exports auth, db, and app instances
   - Handles environment configuration

3. **Firebase Accessibility Service** (`src/lib/firebase-accessibility.ts`)
   - Firestore operations for preferences
   - Real-time subscription management
   - Preference merging logic

4. **Sync Status Indicators** (`src/components/SyncStatusIndicator.tsx`)
   - Visual feedback for sync status
   - Loading, syncing, and error states
   - Accessible status announcements

## Features

### 1. Local Storage Persistence

Preferences are always saved to localStorage, providing:
- Instant access on page load
- Offline functionality
- No dependency on authentication
- Fallback when cloud sync fails

```typescript
// Automatically saved to localStorage
updatePreferences({ 
  visualSettings: { fontSize: 'large' } 
});
```

### 2. Firebase Cloud Sync

When users are authenticated:
- Preferences sync to Firestore
- Changes propagate to all devices
- Real-time updates via Firestore listeners
- Automatic conflict resolution

```typescript
// Syncs to cloud if user is logged in
const { preferences, isSyncing } = useAccessibility();
```

### 3. Cross-Device Synchronization

The provider establishes real-time listeners:
- Device A updates preferences → Firestore
- Firestore → Device B receives update
- Device B applies new preferences
- All devices stay in sync

### 4. Conflict Resolution

When preferences exist in multiple locations:

```typescript
// Merge strategy:
// 1. Compare timestamps
// 2. Use most recent
// 3. If no timestamps, prefer cloud
// 4. Remove timestamp from result

const merged = mergePreferences(localPrefs, cloudPrefs);
```

### 5. Sync Loop Prevention

The provider prevents infinite sync loops:
- `isUpdatingRef` tracks internal updates
- Firestore listener ignores self-triggered updates
- Timeout allows propagation before reset

## Usage

### Basic Setup

Wrap your app with the provider:

```tsx
// app/layout.tsx
import { AccessibilityProvider } from '@/components/AccessibilityProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
```

### Reading Preferences

```tsx
import { useAccessibility } from '@/components/AccessibilityProvider';

function MyComponent() {
  const { preferences, isLoading } = useAccessibility();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontSize: preferences.visualSettings.fontSize }}>
      Content adapts to user preferences
    </div>
  );
}
```

### Updating Preferences

```tsx
function SettingsPanel() {
  const { preferences, updatePreferences } = useAccessibility();

  return (
    <div>
      <button onClick={() => updatePreferences({
        visualSettings: { fontSize: 'large' }
      })}>
        Large Text
      </button>
      
      <button onClick={() => updatePreferences({
        inputModes: ['voice', 'text']
      })}>
        Enable Voice Input
      </button>
    </div>
  );
}
```

### Monitoring Sync Status

```tsx
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

function Header() {
  const { isSyncing, syncError } = useAccessibility();

  return (
    <header>
      <h1>UNSAID/UNHEARD</h1>
      <SyncStatusIndicator />
      
      {syncError && (
        <div role="alert">
          Sync failed: {syncError}
        </div>
      )}
    </header>
  );
}
```

### Deep Merging Nested Settings

The provider automatically deep merges nested objects:

```tsx
// Only updates contrast, preserves fontSize and colorScheme
updatePreferences({
  visualSettings: { contrast: 'high' }
});

// Result:
// {
//   visualSettings: {
//     fontSize: 'medium',      // preserved
//     contrast: 'high',        // updated
//     colorScheme: 'auto'      // preserved
//   }
// }
```

## API Reference

### useAccessibility Hook

```typescript
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => void;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
}
```

#### preferences
Current accessibility preferences object containing:
- `inputModes`: Array of enabled input methods
- `outputModes`: Array of enabled output methods
- `visualSettings`: Font size, contrast, color scheme
- `motorSettings`: Touch targets, gesture timeouts
- `cognitiveSettings`: Simplified UI, reduced motion

#### updatePreferences(newPreferences)
Updates preferences with partial object. Deep merges nested settings.

**Parameters:**
- `newPreferences`: Partial<AccessibilityPreferences>

**Example:**
```typescript
updatePreferences({ 
  inputModes: ['voice'],
  visualSettings: { fontSize: 'large' }
});
```

#### isLoading
Boolean indicating if initial preferences are loading from localStorage.

#### isSyncing
Boolean indicating if preferences are currently syncing with Firebase.

#### syncError
String containing error message if sync fails, or null if no error.

## Data Flow

### Initial Load (No Auth)

```
1. Component mounts
2. Load from localStorage
3. Apply to document
4. Set isLoading = false
```

### Initial Load (With Auth)

```
1. Component mounts
2. Load from localStorage
3. Detect authenticated user
4. Fetch from Firestore
5. Merge local + cloud
6. Apply merged preferences
7. Subscribe to real-time updates
8. Set isLoading = false
```

### Preference Update

```
1. User calls updatePreferences()
2. Update local state
3. Save to localStorage
4. If authenticated:
   a. Save to Firestore
   b. Set isSyncing = true
   c. Wait for confirmation
   d. Set isSyncing = false
```

### Cross-Device Update

```
Device A:
1. User updates preferences
2. Saved to Firestore

Device B:
1. Firestore listener fires
2. Check if self-triggered (skip if yes)
3. Update local state
4. Apply to document
5. Save to localStorage
```

## Testing

### Unit Tests

```bash
# Test Firebase service
npm test firebase-accessibility.test.ts

# Test provider component
npm test AccessibilityProvider.test.tsx
```

### Test Coverage

- ✅ Preference merging logic
- ✅ Timestamp comparison
- ✅ Local storage operations
- ✅ Provider initialization
- ✅ Preference updates
- ✅ Deep merging
- ✅ Error handling
- ✅ Sync status indicators

### Manual Testing

1. **Local Storage**:
   - Update preferences
   - Refresh page
   - Verify preferences persist

2. **Cloud Sync** (requires Firebase setup):
   - Log in on Device A
   - Update preferences
   - Log in on Device B
   - Verify preferences match

3. **Real-time Sync**:
   - Open app on two devices
   - Update on Device A
   - Observe update on Device B

4. **Offline Mode**:
   - Disconnect internet
   - Update preferences
   - Verify local updates work
   - Reconnect internet
   - Verify sync occurs

## Requirements Validation

This implementation satisfies:

### Requirement 1.5
✅ "WHEN preferences are selected, THE System SHALL save them and apply them immediately across all features"

- Preferences saved to localStorage immediately
- Applied to document via `applyAccessibilityPreferences()`
- Available globally via React context

### Requirement 13.1
✅ "THE System SHALL store user preferences, posts, sessions, and learning progress in persistent storage"

- Preferences stored in localStorage (local persistence)
- Preferences stored in Firestore (cloud persistence)
- Automatic backup and recovery

### Requirement 13.2
✅ "WHEN users switch devices, THE System SHALL synchronize all accessibility settings and content"

- Real-time Firestore listeners
- Automatic sync on login
- Conflict resolution with timestamps
- Cross-device preference propagation

## Troubleshooting

### Preferences Not Persisting

**Symptom**: Preferences reset on page refresh

**Solutions**:
1. Check browser localStorage is enabled
2. Verify no browser extensions blocking storage
3. Check console for localStorage errors
4. Ensure provider wraps entire app

### Sync Not Working

**Symptom**: Changes don't sync across devices

**Solutions**:
1. Verify user is authenticated
2. Check Firebase configuration in `.env.local`
3. Verify Firestore security rules allow access
4. Check browser console for Firebase errors
5. Ensure both devices are online

### Infinite Sync Loop

**Symptom**: Preferences constantly updating

**Solutions**:
1. Check `isUpdatingRef` logic
2. Verify Firestore listener conditions
3. Ensure timeout allows propagation
4. Check for external preference updates

### Slow Sync

**Symptom**: Preferences take long to sync

**Solutions**:
1. Check network connection
2. Verify Firestore region is optimal
3. Monitor Firebase Console for issues
4. Consider increasing timeout values

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Consider debouncing rapid updates
2. **Batching**: Group multiple updates together
3. **Caching**: Firestore automatically caches data
4. **Indexing**: Ensure Firestore indexes are optimal

### Memory Management

- Unsubscribe from listeners on unmount
- Clean up refs and timers
- Avoid storing large objects in preferences

### Network Efficiency

- Only sync when preferences actually change
- Use Firestore merge operations
- Leverage offline persistence

## Security

### Best Practices

1. **Environment Variables**: Never commit Firebase config
2. **Security Rules**: Restrict Firestore access to authenticated users
3. **Validation**: Validate preference data before saving
4. **Sanitization**: Sanitize user input in preferences

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /accessibility-preferences/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

## Future Enhancements

### Planned Features

1. **Preference Profiles**: Multiple saved preference sets
2. **Sharing**: Share preferences with caregivers
3. **Backup/Restore**: Manual backup and restore
4. **Analytics**: Track preference usage patterns
5. **Recommendations**: AI-suggested preferences

### Migration Path

When adding new preference fields:

```typescript
// Add to AccessibilityPreferences interface
interface AccessibilityPreferences {
  // ... existing fields
  newFeature: {
    enabled: boolean;
    settings: Record<string, any>;
  };
}

// Update defaultAccessibilityPreferences
export const defaultAccessibilityPreferences = {
  // ... existing defaults
  newFeature: {
    enabled: false,
    settings: {},
  },
};

// Provider automatically handles migration
```

## Related Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Accessibility Setup](./ACCESSIBILITY_SETUP.md)
- [Design Document](./.kiro/specs/unsaid-unheard/design.md)
- [Requirements](./.kiro/specs/unsaid-unheard/requirements.md)

## Support

For issues or questions:
1. Check this guide and related documentation
2. Review test files for usage examples
3. Check Firebase Console for service status
4. Review browser console for error messages
