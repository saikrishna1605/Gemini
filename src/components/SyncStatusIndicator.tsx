'use client';

import React from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * SyncStatusIndicator Component
 * 
 * Displays the current synchronization status of accessibility preferences.
 * Shows loading, syncing, and error states to provide user feedback.
 * 
 * This component demonstrates how to use the AccessibilityProvider's
 * sync status indicators in your UI.
 */
export function SyncStatusIndicator() {
  const { isLoading, isSyncing, syncError } = useAccessibility();

  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        role="status"
        aria-live="polite"
      >
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        <span>Loading preferences...</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
        role="alert"
        aria-live="assertive"
      >
        <svg 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span>{syncError}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
        role="status"
        aria-live="polite"
      >
        <div className="animate-spin h-4 w-4 border-2 border-blue-200 border-t-blue-600 rounded-full" />
        <span>Syncing preferences...</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
      role="status"
      aria-live="polite"
    >
      <svg 
        className="h-4 w-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
      <span>Preferences saved</span>
    </div>
  );
}

/**
 * CompactSyncIndicator Component
 * 
 * A minimal version that only shows an icon, useful for headers or toolbars.
 */
export function CompactSyncIndicator() {
  const { isLoading, isSyncing, syncError } = useAccessibility();

  if (isLoading || isSyncing) {
    return (
      <div 
        className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"
        role="status"
        aria-label="Syncing preferences"
      />
    );
  }

  if (syncError) {
    return (
      <svg 
        className="h-5 w-5 text-red-600 dark:text-red-400" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        role="img"
        aria-label="Sync error"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
    );
  }

  return (
    <svg 
      className="h-5 w-5 text-green-600 dark:text-green-400" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      role="img"
      aria-label="Preferences synced"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 13l4 4L19 7" 
      />
    </svg>
  );
}
