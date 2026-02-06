/**
 * Accessibility utilities and configuration for UNSAID/UNHEARD
 * This file contains core accessibility types, utilities, and axe-core setup
 * 
 * For multimodal input processing, see input-processor.ts
 */

// ============================================================================
// Multimodal Input Types
// ============================================================================

/**
 * Represents different types of input content
 */
export type AudioBlob = Blob & { type: `audio/${string}` };
export type ImageBlob = Blob & { type: `image/${string}` };
export type VideoBlob = Blob & { type: `video/${string}` };

/**
 * Represents a sequence of AAC icons for communication
 */
export interface IconSequence {
  icons: Array<{
    id: string;
    label: string;
    category: string;
  }>;
  phrases?: string[];
}

/**
 * Universal multimodal input structure
 * Supports voice, text, icons, sign language, and camera input
 */
export interface MultimodalInput {
  type: 'voice' | 'text' | 'icons' | 'sign' | 'camera';
  content: string | AudioBlob | ImageBlob | VideoBlob | IconSequence;
  confidence?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Processed input after validation and transformation
 */
export interface ProcessedInput {
  originalInput: MultimodalInput;
  processedContent: string;
  confidence: number;
  processingTime: number;
  errors?: string[];
  warnings?: string[];
  metadata: {
    processor: string;
    timestamp: Date;
    [key: string]: any;
  };
}

/**
 * Interface for universal input handling
 * All input processors must implement this interface
 */
export interface InputProcessor {
  /**
   * Process a multimodal input and return processed result
   */
  process(input: MultimodalInput): Promise<ProcessedInput>;
  
  /**
   * Validate input before processing
   */
  validate(input: MultimodalInput): boolean;
  
  /**
   * Fallback processing when primary processing fails
   */
  fallback(input: MultimodalInput): Promise<ProcessedInput>;
}

// ============================================================================
// Accessibility Preference Types
// ============================================================================

// Core accessibility preference types
export interface AccessibilityPreferences {
  inputModes: ('voice' | 'text' | 'icons' | 'sign' | 'camera')[];
  outputModes: ('audio' | 'captions' | 'easy-read' | 'sign')[];
  visualSettings: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    contrast: 'normal' | 'high' | 'extra-high';
    colorScheme: 'light' | 'dark' | 'auto';
  };
  motorSettings: {
    touchTargetSize: 'standard' | 'large' | 'extra-large';
    gestureTimeout: number;
    dwellTime: number;
  };
  cognitiveSettings: {
    simplifiedUI: boolean;
    reducedMotion: boolean;
    focusIndicators: 'standard' | 'enhanced';
  };
}

// Default accessibility preferences
export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  inputModes: ['text'],
  outputModes: ['audio', 'captions'],
  visualSettings: {
    fontSize: 'medium',
    contrast: 'normal',
    colorScheme: 'auto',
  },
  motorSettings: {
    touchTargetSize: 'standard',
    gestureTimeout: 3000,
    dwellTime: 1000,
  },
  cognitiveSettings: {
    simplifiedUI: false,
    reducedMotion: false,
    focusIndicators: 'standard',
  },
};

// Utility function to apply accessibility preferences to document
export function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  
  // Apply font size
  const fontSizeMap = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'extra-large': '22px',
  };
  root.style.fontSize = fontSizeMap[preferences.visualSettings.fontSize];
  
  // Apply color scheme
  if (preferences.visualSettings.colorScheme !== 'auto') {
    root.setAttribute('data-theme', preferences.visualSettings.colorScheme);
  }
  
  // Apply contrast
  if (preferences.visualSettings.contrast === 'high') {
    root.classList.add('high-contrast');
  } else if (preferences.visualSettings.contrast === 'extra-high') {
    root.classList.add('extra-high-contrast');
  }
  
  // Apply reduced motion
  if (preferences.cognitiveSettings.reducedMotion) {
    root.classList.add('reduce-motion');
  }
  
  // Apply touch target size
  const touchSizeMap = {
    'standard': '44px',
    'large': '48px',
    'extra-large': '56px',
  };
  root.style.setProperty('--touch-target-size', touchSizeMap[preferences.motorSettings.touchTargetSize]);
}

// Screen reader announcement utility
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management utility
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Keyboard navigation helper
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void
) {
  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter();
      }
      break;
    case ' ':
      if (onSpace) {
        event.preventDefault();
        onSpace();
      }
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      break;
  }
}