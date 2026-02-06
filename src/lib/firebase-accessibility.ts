/**
 * Firebase service for accessibility preferences
 * Handles persistence and synchronization of user accessibility settings
 */

import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { AccessibilityPreferences } from './accessibility';

const PREFERENCES_COLLECTION = 'accessibility-preferences';

/**
 * Save accessibility preferences to Firestore
 * @param userId - User ID to save preferences for
 * @param preferences - Accessibility preferences to save
 */
export async function savePreferencesToFirestore(
  userId: string,
  preferences: AccessibilityPreferences
): Promise<void> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    await setDoc(docRef, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save preferences to Firestore:', error);
    throw new Error('Failed to save preferences to cloud storage');
  }
}

/**
 * Load accessibility preferences from Firestore
 * @param userId - User ID to load preferences for
 * @returns Accessibility preferences or null if not found
 */
export async function loadPreferencesFromFirestore(
  userId: string
): Promise<AccessibilityPreferences | null> {
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Remove the updatedAt field before returning
      const { updatedAt, ...preferences } = data;
      return preferences as AccessibilityPreferences;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load preferences from Firestore:', error);
    throw new Error('Failed to load preferences from cloud storage');
  }
}

/**
 * Subscribe to real-time updates of accessibility preferences
 * @param userId - User ID to subscribe to
 * @param callback - Callback function to handle preference updates
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToPreferences(
  userId: string,
  callback: (preferences: AccessibilityPreferences | null) => void
): Unsubscribe {
  const docRef = doc(db, PREFERENCES_COLLECTION, userId);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const { updatedAt, ...preferences } = data;
        callback(preferences as AccessibilityPreferences);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to preferences:', error);
      callback(null);
    }
  );
}

/**
 * Merge local preferences with cloud preferences
 * Uses the most recent timestamp to determine which preferences to keep
 * @param localPreferences - Local preferences with timestamp
 * @param cloudPreferences - Cloud preferences with timestamp
 * @returns Merged preferences
 */
export function mergePreferences(
  localPreferences: AccessibilityPreferences & { updatedAt?: string },
  cloudPreferences: AccessibilityPreferences & { updatedAt?: string }
): AccessibilityPreferences {
  // If one doesn't have a timestamp, prefer the one that does
  if (!localPreferences.updatedAt && cloudPreferences.updatedAt) {
    const { updatedAt, ...prefs } = cloudPreferences;
    return prefs;
  }
  
  if (localPreferences.updatedAt && !cloudPreferences.updatedAt) {
    const { updatedAt, ...prefs } = localPreferences;
    return prefs;
  }
  
  // If both have timestamps, use the most recent
  if (localPreferences.updatedAt && cloudPreferences.updatedAt) {
    const localTime = new Date(localPreferences.updatedAt).getTime();
    const cloudTime = new Date(cloudPreferences.updatedAt).getTime();
    
    if (localTime > cloudTime) {
      const { updatedAt, ...prefs } = localPreferences;
      return prefs;
    } else {
      const { updatedAt, ...prefs } = cloudPreferences;
      return prefs;
    }
  }
  
  // If neither has a timestamp, prefer cloud preferences
  const { updatedAt, ...prefs } = cloudPreferences;
  return prefs;
}
