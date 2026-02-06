/**
 * Unit tests for AccessibilityProvider component
 */

// Mock Firebase modules BEFORE any imports
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn((callback) => {
      // Simulate no user logged in
      callback(null);
      return jest.fn(); // Return unsubscribe function
    }),
  },
  app: {},
}));

jest.mock('@/lib/firebase-accessibility', () => ({
  savePreferencesToFirestore: jest.fn(),
  loadPreferencesFromFirestore: jest.fn(),
  subscribeToPreferences: jest.fn(() => jest.fn()),
  mergePreferences: jest.fn((local, cloud) => cloud),
}));

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';
import { defaultAccessibilityPreferences } from '@/lib/accessibility';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the hook
function TestComponent() {
  const { preferences, updatePreferences, isLoading, isSyncing, syncError } = useAccessibility();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="syncing">{isSyncing ? 'syncing' : 'not-syncing'}</div>
      <div data-testid="sync-error">{syncError || 'no-error'}</div>
      <div data-testid="input-modes">{preferences.inputModes.join(',')}</div>
      <div data-testid="output-modes">{preferences.outputModes.join(',')}</div>
      <div data-testid="font-size">{preferences.visualSettings.fontSize}</div>
      <button
        onClick={() => updatePreferences({ inputModes: ['voice'] })}
        data-testid="update-button"
      >
        Update
      </button>
    </div>
  );
}

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should provide default preferences on initial load', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('input-modes')).toHaveTextContent(
      defaultAccessibilityPreferences.inputModes.join(',')
    );
    expect(screen.getByTestId('output-modes')).toHaveTextContent(
      defaultAccessibilityPreferences.outputModes.join(',')
    );
    expect(screen.getByTestId('font-size')).toHaveTextContent(
      defaultAccessibilityPreferences.visualSettings.fontSize
    );
  });

  it('should load preferences from localStorage if available', async () => {
    const storedPreferences = {
      ...defaultAccessibilityPreferences,
      inputModes: ['voice', 'text'],
      visualSettings: {
        ...defaultAccessibilityPreferences.visualSettings,
        fontSize: 'large',
      },
    };

    localStorageMock.setItem('accessibility-preferences', JSON.stringify(storedPreferences));

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('input-modes')).toHaveTextContent('voice,text');
    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
  });

  it('should update preferences when updatePreferences is called', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const updateButton = screen.getByTestId('update-button');
    
    act(() => {
      updateButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('input-modes')).toHaveTextContent('voice');
    });
  });

  it('should save preferences to localStorage when updated', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const updateButton = screen.getByTestId('update-button');
    
    act(() => {
      updateButton.click();
    });

    await waitFor(() => {
      const stored = localStorageMock.getItem('accessibility-preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.inputModes).toEqual(['voice']);
    });
  });

  it('should handle localStorage errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock localStorage to throw an error
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should still load with default preferences
    expect(screen.getByTestId('input-modes')).toHaveTextContent(
      defaultAccessibilityPreferences.inputModes.join(',')
    );

    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useAccessibility is used outside provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');

    consoleErrorSpy.mockRestore();
  });

  it('should deep merge nested settings when updating', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Create a component that can update nested settings
    function NestedUpdateComponent() {
      const { preferences, updatePreferences } = useAccessibility();

      return (
        <div>
          <div data-testid="contrast">{preferences.visualSettings.contrast}</div>
          <button
            onClick={() =>
              updatePreferences({
                visualSettings: { contrast: 'high' },
              })
            }
            data-testid="update-contrast"
          >
            Update Contrast
          </button>
        </div>
      );
    }

    const { rerender } = render(
      <AccessibilityProvider>
        <NestedUpdateComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('contrast')).toHaveTextContent('normal');
    });

    const updateButton = screen.getByTestId('update-contrast');
    
    act(() => {
      updateButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('contrast')).toHaveTextContent('high');
    });

    // Verify other visual settings are preserved
    const stored = localStorageMock.getItem('accessibility-preferences');
    const parsed = JSON.parse(stored!);
    expect(parsed.visualSettings.fontSize).toBe(defaultAccessibilityPreferences.visualSettings.fontSize);
    expect(parsed.visualSettings.colorScheme).toBe(defaultAccessibilityPreferences.visualSettings.colorScheme);
  });

  it('should initialize with syncing state indicators', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    // Initially should not be syncing (no user logged in)
    await waitFor(() => {
      expect(screen.getByTestId('syncing')).toHaveTextContent('not-syncing');
      expect(screen.getByTestId('sync-error')).toHaveTextContent('no-error');
    });
  });
});
