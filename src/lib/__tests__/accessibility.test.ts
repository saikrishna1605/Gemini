/**
 * Unit tests for accessibility utilities
 * Tests the core accessibility configuration and helper functions
 */

import {
  AccessibilityPreferences,
  defaultAccessibilityPreferences,
  applyAccessibilityPreferences,
  announceToScreenReader,
  MultimodalInput,
  ProcessedInput,
  InputProcessor,
  IconSequence,
  AudioBlob,
  ImageBlob,
  VideoBlob,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    // Reset document state before each test
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.fontSize = '';
    document.body.innerHTML = '';
  });

  describe('defaultAccessibilityPreferences', () => {
    it('should have valid default preferences', () => {
      expect(defaultAccessibilityPreferences).toBeDefined();
      expect(defaultAccessibilityPreferences.inputModes).toContain('text');
      expect(defaultAccessibilityPreferences.outputModes).toContain('audio');
      expect(defaultAccessibilityPreferences.outputModes).toContain('captions');
      expect(defaultAccessibilityPreferences.visualSettings.fontSize).toBe('medium');
      expect(defaultAccessibilityPreferences.visualSettings.contrast).toBe('normal');
      expect(defaultAccessibilityPreferences.visualSettings.colorScheme).toBe('auto');
    });

    it('should have valid motor settings', () => {
      expect(defaultAccessibilityPreferences.motorSettings.touchTargetSize).toBe('standard');
      expect(defaultAccessibilityPreferences.motorSettings.gestureTimeout).toBe(3000);
      expect(defaultAccessibilityPreferences.motorSettings.dwellTime).toBe(1000);
    });

    it('should have valid cognitive settings', () => {
      expect(defaultAccessibilityPreferences.cognitiveSettings.simplifiedUI).toBe(false);
      expect(defaultAccessibilityPreferences.cognitiveSettings.reducedMotion).toBe(false);
      expect(defaultAccessibilityPreferences.cognitiveSettings.focusIndicators).toBe('standard');
    });
  });

  describe('applyAccessibilityPreferences', () => {
    it('should apply font size preferences', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          fontSize: 'large',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.style.fontSize).toBe('18px');
    });

    it('should apply extra-large font size', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          fontSize: 'extra-large',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.style.fontSize).toBe('22px');
    });

    it('should apply color scheme preferences', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          colorScheme: 'dark',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should not set data-theme for auto color scheme', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          colorScheme: 'auto',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('should apply high contrast mode', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          contrast: 'high',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });

    it('should apply extra-high contrast mode', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        visualSettings: {
          ...defaultAccessibilityPreferences.visualSettings,
          contrast: 'extra-high',
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.classList.contains('extra-high-contrast')).toBe(true);
    });

    it('should apply reduced motion preference', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        cognitiveSettings: {
          ...defaultAccessibilityPreferences.cognitiveSettings,
          reducedMotion: true,
        },
      };

      applyAccessibilityPreferences(preferences);

      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    });

    it('should apply touch target size', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        motorSettings: {
          ...defaultAccessibilityPreferences.motorSettings,
          touchTargetSize: 'large',
        },
      };

      applyAccessibilityPreferences(preferences);

      const touchTargetSize = document.documentElement.style.getPropertyValue('--touch-target-size');
      expect(touchTargetSize).toBe('48px');
    });

    it('should apply extra-large touch target size', () => {
      const preferences: AccessibilityPreferences = {
        ...defaultAccessibilityPreferences,
        motorSettings: {
          ...defaultAccessibilityPreferences.motorSettings,
          touchTargetSize: 'extra-large',
        },
      };

      applyAccessibilityPreferences(preferences);

      const touchTargetSize = document.documentElement.style.getPropertyValue('--touch-target-size');
      expect(touchTargetSize).toBe('56px');
    });
  });

  describe('announceToScreenReader', () => {
    it('should create an announcement element', () => {
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeTruthy();
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
      expect(announcement?.textContent).toBe('Test announcement');
    });

    it('should support assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live]');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should remove announcement after timeout', () => {
      jest.useFakeTimers();
      
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeTruthy();

      // Fast-forward time
      jest.advanceTimersByTime(1100);

      const removedAnnouncement = document.querySelector('[aria-live]');
      expect(removedAnnouncement).toBeNull();
      
      jest.useRealTimers();
    });
  });
});

describe('Multimodal Input Types', () => {
  describe('MultimodalInput', () => {
    it('should accept text input', () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello world',
        timestamp: new Date(),
      };

      expect(input.type).toBe('text');
      expect(input.content).toBe('Hello world');
      expect(input.timestamp).toBeInstanceOf(Date);
    });

    it('should accept voice input with AudioBlob', () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' }) as AudioBlob;
      const input: MultimodalInput = {
        type: 'voice',
        content: audioBlob,
        confidence: 0.95,
        timestamp: new Date(),
        metadata: { duration: 5000 },
      };

      expect(input.type).toBe('voice');
      expect(input.content).toBeInstanceOf(Blob);
      expect(input.confidence).toBe(0.95);
      expect(input.metadata?.duration).toBe(5000);
    });

    it('should accept camera input with ImageBlob', () => {
      const imageBlob = new Blob(['image data'], { type: 'image/jpeg' }) as ImageBlob;
      const input: MultimodalInput = {
        type: 'camera',
        content: imageBlob,
        timestamp: new Date(),
      };

      expect(input.type).toBe('camera');
      expect(input.content).toBeInstanceOf(Blob);
    });

    it('should accept sign input with VideoBlob', () => {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' }) as VideoBlob;
      const input: MultimodalInput = {
        type: 'sign',
        content: videoBlob,
        confidence: 0.88,
        timestamp: new Date(),
      };

      expect(input.type).toBe('sign');
      expect(input.content).toBeInstanceOf(Blob);
      expect(input.confidence).toBe(0.88);
    });

    it('should accept icons input with IconSequence', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'icon1', label: 'Hello', category: 'greetings' },
          { id: 'icon2', label: 'Friend', category: 'people' },
        ],
        phrases: ['Hello', 'my friend'],
      };

      const input: MultimodalInput = {
        type: 'icons',
        content: iconSequence,
        timestamp: new Date(),
      };

      expect(input.type).toBe('icons');
      expect((input.content as IconSequence).icons).toHaveLength(2);
      expect((input.content as IconSequence).phrases).toContain('Hello');
    });

    it('should support optional confidence and metadata', () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Test',
        timestamp: new Date(),
      };

      expect(input.confidence).toBeUndefined();
      expect(input.metadata).toBeUndefined();
    });
  });

  describe('ProcessedInput', () => {
    it('should contain all required fields', () => {
      const originalInput: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const processed: ProcessedInput = {
        originalInput,
        processedContent: 'Hello',
        confidence: 1.0,
        processingTime: 150,
        metadata: {
          processor: 'TextProcessor',
          timestamp: new Date(),
        },
      };

      expect(processed.originalInput).toBe(originalInput);
      expect(processed.processedContent).toBe('Hello');
      expect(processed.confidence).toBe(1.0);
      expect(processed.processingTime).toBe(150);
      expect(processed.metadata.processor).toBe('TextProcessor');
    });

    it('should support optional errors and warnings', () => {
      const originalInput: MultimodalInput = {
        type: 'voice',
        content: new Blob(['audio'], { type: 'audio/wav' }) as AudioBlob,
        timestamp: new Date(),
      };

      const processed: ProcessedInput = {
        originalInput,
        processedContent: 'Transcribed text',
        confidence: 0.75,
        processingTime: 500,
        errors: ['Low audio quality'],
        warnings: ['Background noise detected'],
        metadata: {
          processor: 'VoiceProcessor',
          timestamp: new Date(),
          audioQuality: 'low',
        },
      };

      expect(processed.errors).toContain('Low audio quality');
      expect(processed.warnings).toContain('Background noise detected');
      expect(processed.metadata.audioQuality).toBe('low');
    });

    it('should allow custom metadata fields', () => {
      const originalInput: MultimodalInput = {
        type: 'camera',
        content: new Blob(['image'], { type: 'image/jpeg' }) as ImageBlob,
        timestamp: new Date(),
      };

      const processed: ProcessedInput = {
        originalInput,
        processedContent: 'Extracted text from image',
        confidence: 0.92,
        processingTime: 800,
        metadata: {
          processor: 'OCRProcessor',
          timestamp: new Date(),
          imageResolution: '1920x1080',
          textRegions: 5,
        },
      };

      expect(processed.metadata.imageResolution).toBe('1920x1080');
      expect(processed.metadata.textRegions).toBe(5);
    });
  });

  describe('InputProcessor Interface', () => {
    // Mock implementation for testing
    class MockInputProcessor implements InputProcessor {
      async process(input: MultimodalInput): Promise<ProcessedInput> {
        const startTime = Date.now();
        
        if (!this.validate(input)) {
          return this.fallback(input);
        }

        let processedContent = '';
        if (typeof input.content === 'string') {
          processedContent = input.content;
        } else if ('icons' in input.content) {
          processedContent = input.content.icons.map(icon => icon.label).join(' ');
        } else {
          processedContent = 'Binary content processed';
        }

        return {
          originalInput: input,
          processedContent,
          confidence: input.confidence || 1.0,
          processingTime: Date.now() - startTime,
          metadata: {
            processor: 'MockInputProcessor',
            timestamp: new Date(),
          },
        };
      }

      validate(input: MultimodalInput): boolean {
        if (!input.type || !input.content || !input.timestamp) {
          return false;
        }
        return true;
      }

      async fallback(input: MultimodalInput): Promise<ProcessedInput> {
        return {
          originalInput: input,
          processedContent: 'Fallback processing',
          confidence: 0.5,
          processingTime: 0,
          errors: ['Primary processing failed'],
          metadata: {
            processor: 'MockInputProcessor-Fallback',
            timestamp: new Date(),
          },
        };
      }
    }

    it('should implement process method', async () => {
      const processor = new MockInputProcessor();
      const input: MultimodalInput = {
        type: 'text',
        content: 'Test input',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Test input');
      expect(result.confidence).toBe(1.0);
      expect(result.metadata.processor).toBe('MockInputProcessor');
    });

    it('should implement validate method', () => {
      const processor = new MockInputProcessor();
      
      const validInput: MultimodalInput = {
        type: 'text',
        content: 'Valid',
        timestamp: new Date(),
      };

      expect(processor.validate(validInput)).toBe(true);
    });

    it('should implement fallback method', async () => {
      const processor = new MockInputProcessor();
      const input: MultimodalInput = {
        type: 'text',
        content: 'Test',
        timestamp: new Date(),
      };

      const result = await processor.fallback(input);

      expect(result.processedContent).toBe('Fallback processing');
      expect(result.confidence).toBe(0.5);
      expect(result.errors).toContain('Primary processing failed');
      expect(result.metadata.processor).toBe('MockInputProcessor-Fallback');
    });

    it('should use fallback when validation fails', async () => {
      const processor = new MockInputProcessor();
      // Create invalid input (missing required fields)
      const invalidInput = {
        type: 'text',
        content: '',
        timestamp: new Date(),
      } as MultimodalInput;

      // Override validate to return false
      processor.validate = () => false;

      const result = await processor.process(invalidInput);

      expect(result.processedContent).toBe('Fallback processing');
      expect(result.errors).toContain('Primary processing failed');
    });

    it('should process IconSequence input', async () => {
      const processor = new MockInputProcessor();
      const iconSequence: IconSequence = {
        icons: [
          { id: '1', label: 'I', category: 'pronouns' },
          { id: '2', label: 'want', category: 'verbs' },
          { id: '3', label: 'help', category: 'nouns' },
        ],
      };

      const input: MultimodalInput = {
        type: 'icons',
        content: iconSequence,
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('I want help');
    });

    it('should process binary content (audio/image/video)', async () => {
      const processor = new MockInputProcessor();
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' }) as AudioBlob;

      const input: MultimodalInput = {
        type: 'voice',
        content: audioBlob,
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Binary content processed');
    });
  });

  describe('IconSequence', () => {
    it('should support icon arrays with required fields', () => {
      const sequence: IconSequence = {
        icons: [
          { id: 'icon1', label: 'Hello', category: 'greetings' },
          { id: 'icon2', label: 'World', category: 'nouns' },
        ],
      };

      expect(sequence.icons).toHaveLength(2);
      expect(sequence.icons[0].id).toBe('icon1');
      expect(sequence.icons[0].label).toBe('Hello');
      expect(sequence.icons[0].category).toBe('greetings');
    });

    it('should support optional phrases', () => {
      const sequence: IconSequence = {
        icons: [{ id: '1', label: 'Test', category: 'test' }],
        phrases: ['Test phrase 1', 'Test phrase 2'],
      };

      expect(sequence.phrases).toHaveLength(2);
      expect(sequence.phrases).toContain('Test phrase 1');
    });

    it('should work without phrases', () => {
      const sequence: IconSequence = {
        icons: [{ id: '1', label: 'Test', category: 'test' }],
      };

      expect(sequence.phrases).toBeUndefined();
    });
  });

  describe('Blob Type Guards', () => {
    it('should create AudioBlob with audio MIME type', () => {
      const audioBlob = new Blob(['audio'], { type: 'audio/wav' }) as AudioBlob;
      expect(audioBlob.type).toMatch(/^audio\//);
    });

    it('should create ImageBlob with image MIME type', () => {
      const imageBlob = new Blob(['image'], { type: 'image/jpeg' }) as ImageBlob;
      expect(imageBlob.type).toMatch(/^image\//);
    });

    it('should create VideoBlob with video MIME type', () => {
      const videoBlob = new Blob(['video'], { type: 'video/mp4' }) as VideoBlob;
      expect(videoBlob.type).toMatch(/^video\//);
    });
  });
});
