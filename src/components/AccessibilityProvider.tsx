'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AccessibilityPreferences, defaultAccessibilityPreferences, applyAccessibilityPreferences } from '@/lib/accessibility';
import { 
  savePreferencesToFirestore, 
  loadPreferencesFromFirestore, 
  subscribeToPreferences,
  mergePreferences 
} from '@/lib/firebase-accessibility';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => void;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

const LOCAL_STORAGE_KEY = 'accessibility-preferences';
const LOCAL_STORAGE_TIMESTAMP_KEY = 'accessibility-preferences-timestamp';

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Track if we're currently updating to prevent sync loops
  const isUpdatingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadLocalPreferences = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsedPreferences = JSON.parse(stored);
          setPreferences({ ...defaultAccessibilityPreferences, ...parsedPreferences });
        }
      } catch (error) {
        console.error('Failed to load accessibility preferences from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalPreferences();
  }, []);

  // Sync with Firebase when user logs in
  useEffect(() => {
    if (!currentUser) {
      // User logged out, clean up subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    const syncWithFirebase = async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        // Load preferences from Firestore
        const cloudPreferences = await loadPreferencesFromFirestore(currentUser.uid);
        
        // Get local preferences with timestamp
        const localTimestamp = localStorage.getItem(LOCAL_STORAGE_TIMESTAMP_KEY);
        const localPreferencesWithTimestamp = {
          ...preferences,
          updatedAt: localTimestamp || undefined,
        };

        if (cloudPreferences) {
          // Merge local and cloud preferences
          const cloudPreferencesWithTimestamp = {
            ...cloudPreferences,
            updatedAt: undefined, // Will be set by Firestore
          };
          
          const mergedPreferences = mergePreferences(
            localPreferencesWithTimestamp,
            cloudPreferencesWithTimestamp
          );
          
          // Update local state if different
          if (JSON.stringify(mergedPreferences) !== JSON.stringify(preferences)) {
            isUpdatingRef.current = true;
            setPreferences(mergedPreferences);
          }
          
          // Save merged preferences back to Firestore
          await savePreferencesToFirestore(currentUser.uid, mergedPreferences);
        } else {
          // No cloud preferences, save local preferences to cloud
          await savePreferencesToFirestore(currentUser.uid, preferences);
        }

        // Subscribe to real-time updates
        unsubscribeRef.current = subscribeToPreferences(
          currentUser.uid,
          (updatedPreferences) => {
            if (updatedPreferences && !isUpdatingRef.current) {
              // Only update if we're not the ones who triggered the update
              setPreferences(updatedPreferences);
            }
            isUpdatingRef.current = false;
          }
        );
      } catch (error) {
        console.error('Failed to sync preferences with Firebase:', error);
        setSyncError('Failed to sync preferences with cloud storage');
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithFirebase();

    // Cleanup subscription on unmount or user change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser]); // Only depend on currentUser, not preferences

  // Apply preferences to document when they change
  useEffect(() => {
    if (!isLoading) {
      applyAccessibilityPreferences(preferences);
    }
  }, [preferences, isLoading]);

  // Save preferences to localStorage and Firebase when they change
  useEffect(() => {
    if (!isLoading && !isUpdatingRef.current) {
      const timestamp = new Date().toISOString();
      
      // Save to localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
        localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, timestamp);
      } catch (error) {
        console.error('Failed to save accessibility preferences to localStorage:', error);
      }

      // Save to Firebase if user is logged in
      if (currentUser) {
        isUpdatingRef.current = true;
        savePreferencesToFirestore(currentUser.uid, preferences)
          .catch((error) => {
            console.error('Failed to save preferences to Firebase:', error);
            setSyncError('Failed to save preferences to cloud storage');
          })
          .finally(() => {
            // Reset flag after a short delay to allow Firestore update to propagate
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 500);
          });
      }
    }
  }, [preferences, isLoading, currentUser]);

  const updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences,
      // Deep merge for nested objects
      visualSettings: {
        ...prev.visualSettings,
        ...(newPreferences.visualSettings || {}),
      },
      motorSettings: {
        ...prev.motorSettings,
        ...(newPreferences.motorSettings || {}),
      },
      cognitiveSettings: {
        ...prev.cognitiveSettings,
        ...(newPreferences.cognitiveSettings || {}),
      },
    }));
  };

  const value: AccessibilityContextType = {
    preferences,
    updatePreferences,
    isLoading,
    isSyncing,
    syncError,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}