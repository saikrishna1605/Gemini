# Firebase Setup Guide for UNSAID/UNHEARD

This guide explains how to set up Firebase for the UNSAID/UNHEARD accessibility-first application.

## Overview

Firebase is used in this application for:
- **Authentication**: User login and identity management
- **Firestore Database**: Storing and synchronizing accessibility preferences across devices
- **Real-time Sync**: Automatic synchronization of preferences when users switch devices

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. The UNSAID/UNHEARD project cloned locally

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "unsaid-unheard")
4. Follow the setup wizard:
   - Enable/disable Google Analytics (optional)
   - Accept terms and create project

### 2. Register Your Web App

1. In your Firebase project, click the web icon (`</>`) to add a web app
2. Register your app with a nickname (e.g., "UNSAID/UNHEARD Web")
3. You don't need to set up Firebase Hosting for now
4. Copy the Firebase configuration object - you'll need this in the next step

### 3. Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase configuration values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. Save the file. **Important**: Never commit `.env.local` to version control!

### 4. Enable Firestore Database

1. In the Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose a location (select one close to your users)
4. Start in **test mode** for development (you'll secure it later)
5. Click "Enable"

### 5. Set Up Firestore Security Rules

For development, you can use test mode rules. For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own accessibility preferences
    match /accessibility-preferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. Enable Authentication (Optional for Now)

The AccessibilityProvider works with or without authentication:
- **Without auth**: Preferences are stored locally in localStorage
- **With auth**: Preferences sync across devices via Firestore

To enable authentication later:
1. Go to "Build" > "Authentication" in Firebase Console
2. Click "Get started"
3. Enable your preferred sign-in methods (Email/Password, Google, etc.)

## How It Works

### Preference Storage

The `AccessibilityProvider` component manages accessibility preferences with a multi-layered approach:

1. **Local Storage**: Preferences are always saved to browser localStorage for offline access
2. **Firestore Sync**: When a user is authenticated, preferences are also saved to Firestore
3. **Real-time Updates**: Changes on one device automatically sync to other devices

### Synchronization Logic

When a user logs in:
1. Local preferences are loaded from localStorage
2. Cloud preferences are fetched from Firestore
3. The most recent preferences (based on timestamp) are used
4. A real-time listener is established for cross-device sync

### Conflict Resolution

If preferences exist both locally and in the cloud:
- Preferences with timestamps are compared
- The most recently updated preferences are used
- If no timestamps exist, cloud preferences take precedence

## Usage in Components

### Using the AccessibilityProvider

Wrap your app with the `AccessibilityProvider`:

```tsx
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

### Accessing Preferences in Components

Use the `useAccessibility` hook:

```tsx
import { useAccessibility } from '@/components/AccessibilityProvider';

function MyComponent() {
  const { preferences, updatePreferences, isLoading, isSyncing, syncError } = useAccessibility();

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div>
      <p>Font size: {preferences.visualSettings.fontSize}</p>
      <button onClick={() => updatePreferences({ 
        visualSettings: { fontSize: 'large' } 
      })}>
        Increase Font Size
      </button>
      {isSyncing && <p>Syncing...</p>}
      {syncError && <p>Error: {syncError}</p>}
    </div>
  );
}
```

## Testing

The Firebase integration includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test firebase-accessibility.test.ts
npm test AccessibilityProvider.test.tsx
```

Tests use mocked Firebase services and don't require a real Firebase project.

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your API key in `.env.local` is correct
- Ensure the environment variable names start with `NEXT_PUBLIC_`
- Restart your development server after changing `.env.local`

### Preferences Not Syncing
- Verify that Firestore is enabled in your Firebase project
- Check browser console for error messages
- Ensure the user is authenticated (check `currentUser` state)
- Verify Firestore security rules allow the operation

### "Permission denied" Errors
- Update your Firestore security rules to allow authenticated users to access their preferences
- Make sure the user is logged in before trying to sync

## Development vs Production

### Development
- Use test mode Firestore rules for easier development
- Firebase emulators can be used for local testing (optional)
- `.env.local` is used for configuration

### Production
- Update Firestore security rules to be more restrictive
- Use environment variables in your hosting platform
- Enable Firebase App Check for additional security
- Monitor usage in Firebase Console

## Next Steps

1. ✅ Firebase configuration is complete
2. ✅ AccessibilityProvider with sync is implemented
3. ⏭️ Implement user authentication (Task 7.1)
4. ⏭️ Add more features that use Firebase (posts, sessions, etc.)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
