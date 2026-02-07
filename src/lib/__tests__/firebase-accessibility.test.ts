/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Unit tests for Firebase accessibility preferences service
 */

// Mock Firebase modules before importing
jest.mock('../firebase', () => ({
  db: {},
  auth: {},
  app: {},
}));

import { mergePreferences } from '../firebase-accessibility';
import { AccessibilityPreferences, defaultAccessibilityPreferences } from '../accessibility';

describe('Firebase Accessibility Service', () => {
  describe('mergePreferences', () => {
    const basePreferences: AccessibilityPreferences = {
      ...defaultAccessibilityPreferences,
    };

    it('should prefer cloud preferences when local has no timestamp', () => {
      const localPrefs = { ...basePreferences };
      const cloudPrefs = {
        ...basePreferences,
        inputModes: ['voice' as const],
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['voice']);
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should prefer local preferences when cloud has no timestamp', () => {
      const localPrefs = {
        ...basePreferences,
        inputModes: ['text' as const],
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const cloudPrefs = { ...basePreferences };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['text']);
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should prefer more recent preferences when both have timestamps', () => {
      const localPrefs = {
        ...basePreferences,
        inputModes: ['text' as const],
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const cloudPrefs = {
        ...basePreferences,
        inputModes: ['voice' as const],
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['voice']);
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should prefer local preferences when local is more recent', () => {
      const localPrefs = {
        ...basePreferences,
        inputModes: ['text' as const],
        updatedAt: '2024-01-02T00:00:00.000Z',
      };
      const cloudPrefs = {
        ...basePreferences,
        inputModes: ['voice' as const],
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['text']);
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should prefer cloud preferences when neither has timestamp', () => {
      const localPrefs = {
        ...basePreferences,
        inputModes: ['text' as const],
      };
      const cloudPrefs = {
        ...basePreferences,
        inputModes: ['voice' as const],
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['voice']);
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should remove updatedAt property from result', () => {
      const localPrefs = {
        ...basePreferences,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const cloudPrefs = {
        ...basePreferences,
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should preserve all accessibility settings in merged result', () => {
      const localPrefs = {
        ...basePreferences,
        inputModes: ['text' as const, 'voice' as const],
        outputModes: ['audio' as const, 'captions' as const],
        visualSettings: {
          fontSize: 'large' as const,
          contrast: 'high' as const,
          colorScheme: 'dark' as const,
        },
        updatedAt: '2024-01-02T00:00:00.000Z',
      };
      const cloudPrefs = {
        ...basePreferences,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.inputModes).toEqual(['text', 'voice']);
      expect(result.outputModes).toEqual(['audio', 'captions']);
      expect(result.visualSettings.fontSize).toBe('large');
      expect(result.visualSettings.contrast).toBe('high');
      expect(result.visualSettings.colorScheme).toBe('dark');
    });

    it('should handle complex nested settings correctly', () => {
      const localPrefs = {
        ...basePreferences,
        motorSettings: {
          touchTargetSize: 'extra-large' as const,
          gestureTimeout: 5000,
          dwellTime: 2000,
        },
        cognitiveSettings: {
          simplifiedUI: true,
          reducedMotion: true,
          focusIndicators: 'enhanced' as const,
        },
        updatedAt: '2024-01-02T00:00:00.000Z',
      };
      const cloudPrefs = {
        ...basePreferences,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = mergePreferences(localPrefs, cloudPrefs);
      
      expect(result.motorSettings.touchTargetSize).toBe('extra-large');
      expect(result.motorSettings.gestureTimeout).toBe(5000);
      expect(result.motorSettings.dwellTime).toBe(2000);
      expect(result.cognitiveSettings.simplifiedUI).toBe(true);
      expect(result.cognitiveSettings.reducedMotion).toBe(true);
      expect(result.cognitiveSettings.focusIndicators).toBe('enhanced');
    });
  });
});
