/**
 * Unit tests for MultimodalInputProcessor
 * 
 * Tests input validation, routing logic, confidence scoring, and fallback mechanisms
 * Requirements: 6.2, 12.2
 */

import {
  MultimodalInputProcessor,
  validateMultimodalInput,
  defaultInputProcessor,
  InputProcessorConfig,
} from '../input-processor';
import {
  MultimodalInput,
  ProcessedInput,
  InputProcessor,
  IconSequence,
} from '../accessibility';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock audio blob
 */
function createAudioBlob(): Blob {
  const blob = new Blob(['audio data'], { type: 'audio/wav' });
  return blob as any; // Type assertion for testing
}

/**
 * Create a mock image blob
 */
function createImageBlob(): Blob {
  const blob = new Blob(['image data'], { type: 'image/png' });
  return blob as any;
}

/**
 * Create a mock video blob
 */
function createVideoBlob(): Blob {
  const blob = new Blob(['video data'], { type: 'video/mp4' });
  return blob as any;
}

/**
 * Create a valid icon sequence
 */
function createIconSequence(): IconSequence {
  return {
    icons: [
      { id: '1', label: 'I', category: 'pronouns' },
      { id: '2', label: 'want', category: 'verbs' },
      { id: '3', label: 'water', category: 'nouns' },
    ],
    phrases: ['please'],
  };
}

// ============================================================================
// Input Validation Tests
// ============================================================================

describe('validateMultimodalInput', () => {
  test('validates text input correctly', () => {
    const input: MultimodalInput = {
      type: 'text',
      content: 'Hello world',
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects empty text input', () => {
    const input: MultimodalInput = {
      type: 'text',
      content: '   ',
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Text input cannot be empty');
  });

  test('validates voice input correctly', () => {
    const input: MultimodalInput = {
      type: 'voice',
      content: createAudioBlob(),
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects voice input with wrong blob type', () => {
    const input: MultimodalInput = {
      type: 'voice',
      content: createImageBlob(), // Wrong type
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Voice input must be an audio blob');
  });

  test('validates camera input correctly', () => {
    const input: MultimodalInput = {
      type: 'camera',
      content: createImageBlob(),
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates sign input correctly', () => {
    const input: MultimodalInput = {
      type: 'sign',
      content: createVideoBlob(),
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates icon input correctly', () => {
    const input: MultimodalInput = {
      type: 'icons',
      content: createIconSequence(),
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects invalid icon sequence', () => {
    const input: MultimodalInput = {
      type: 'icons',
      content: { icons: 'not an array' } as any,
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Icons input must be a valid IconSequence');
  });

  test('validates confidence score range', () => {
    const input: MultimodalInput = {
      type: 'text',
      content: 'Hello',
      confidence: 1.5, // Invalid
      timestamp: new Date(),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Confidence must be a number between 0 and 1');
  });

  test('rejects invalid timestamp', () => {
    const input: MultimodalInput = {
      type: 'text',
      content: 'Hello',
      timestamp: new Date('invalid'),
    };

    const result = validateMultimodalInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid timestamp');
  });
});

// ============================================================================
// MultimodalInputProcessor Tests
// ============================================================================

describe('MultimodalInputProcessor', () => {
  let processor: MultimodalInputProcessor;

  beforeEach(() => {
    processor = new MultimodalInputProcessor();
  });

  // -------------------------------------------------------------------------
  // Text Input Processing
  // -------------------------------------------------------------------------

  describe('Text Input Processing', () => {
    test('processes text input successfully', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello world',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Hello world');
      expect(result.confidence).toBe(1.0);
      expect(result.errors).toBeUndefined();
      expect(result.metadata.processor).toBe('TextInputProcessor');
    });

    test('trims whitespace from text input', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: '  Hello world  ',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Hello world');
    });

    test('includes word count in metadata', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello world test',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.metadata.wordCount).toBe(3);
      expect(result.metadata.characterCount).toBe(16);
    });
  });

  // -------------------------------------------------------------------------
  // Voice Input Processing
  // -------------------------------------------------------------------------

  describe('Voice Input Processing', () => {
    test('processes voice input successfully', async () => {
      const input: MultimodalInput = {
        type: 'voice',
        content: createAudioBlob(),
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
      expect(result.metadata.processor).toBe('VoiceInputProcessor');
      expect(result.metadata.audioType).toBe('audio/wav');
    });

    test('uses provided confidence score', async () => {
      const input: MultimodalInput = {
        type: 'voice',
        content: createAudioBlob(),
        confidence: 0.95,
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBe(0.95);
    });
  });

  // -------------------------------------------------------------------------
  // Icon Input Processing
  // -------------------------------------------------------------------------

  describe('Icon Input Processing', () => {
    test('processes icon sequence successfully', async () => {
      const input: MultimodalInput = {
        type: 'icons',
        content: createIconSequence(),
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toContain('I');
      expect(result.processedContent).toContain('want');
      expect(result.processedContent).toContain('water');
      expect(result.processedContent).toContain('please');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.metadata.processor).toBe('IconInputProcessor');
    });

    test('includes icon metadata', async () => {
      const input: MultimodalInput = {
        type: 'icons',
        content: createIconSequence(),
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.metadata.iconCount).toBe(3);
      expect(result.metadata.phraseCount).toBe(1);
      expect(result.metadata.categories).toContain('pronouns');
      expect(result.metadata.categories).toContain('verbs');
      expect(result.metadata.categories).toContain('nouns');
    });
  });

  // -------------------------------------------------------------------------
  // Sign Input Processing
  // -------------------------------------------------------------------------

  describe('Sign Input Processing', () => {
    test('processes sign video successfully', async () => {
      const input: MultimodalInput = {
        type: 'sign',
        content: createVideoBlob(),
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
      expect(result.metadata.processor).toBe('SignInputProcessor');
      expect(result.metadata.videoType).toBe('video/mp4');
    });
  });

  // -------------------------------------------------------------------------
  // Camera Input Processing
  // -------------------------------------------------------------------------

  describe('Camera Input Processing', () => {
    test('processes camera image successfully', async () => {
      const input: MultimodalInput = {
        type: 'camera',
        content: createImageBlob(),
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
      expect(result.metadata.processor).toBe('CameraInputProcessor');
      expect(result.metadata.imageType).toBe('image/png');
    });
  });

  // -------------------------------------------------------------------------
  // Validation and Error Handling
  // -------------------------------------------------------------------------

  describe('Validation and Error Handling', () => {
    test('rejects invalid input', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: '   ', // Empty after trim
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBe(0.0);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('handles unknown input type', async () => {
      const input: MultimodalInput = {
        type: 'unknown' as any,
        content: 'test',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBe(0.0);
      expect(result.errors).toBeDefined();
    });

    test('validates input before processing', () => {
      const validInput: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      expect(processor.validate(validInput)).toBe(true);

      const invalidInput: MultimodalInput = {
        type: 'text',
        content: '   ',
        timestamp: new Date(),
      };

      expect(processor.validate(invalidInput)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Confidence Scoring
  // -------------------------------------------------------------------------

  describe('Confidence Scoring', () => {
    test('warns on low confidence', async () => {
      const processor = new MultimodalInputProcessor({
        minConfidenceThreshold: 0.9,
      });

      const input: MultimodalInput = {
        type: 'voice',
        content: createAudioBlob(),
        confidence: 0.7,
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('Low confidence'))).toBe(true);
    });

    test('accepts high confidence without warnings', async () => {
      const processor = new MultimodalInputProcessor({
        minConfidenceThreshold: 0.8,
      });

      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBe(1.0);
      expect(result.warnings).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Fallback Mechanisms
  // -------------------------------------------------------------------------

  describe('Fallback Mechanisms', () => {
    test('uses fallback when processing fails', async () => {
      // Create a custom processor that always fails
      const failingProcessor: InputProcessor = {
        process: async () => {
          throw new Error('Processing failed');
        },
        validate: () => true,
        fallback: async (input) => ({
          originalInput: input,
          processedContent: 'Fallback content',
          confidence: 0.5,
          processingTime: 0,
          warnings: ['Fallback used'],
          metadata: {
            processor: 'FailingProcessor',
            timestamp: new Date(),
            fallbackUsed: true,
          },
        }),
      };

      const processor = new MultimodalInputProcessor({
        customProcessors: {
          text: failingProcessor,
        },
      });

      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Fallback content');
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('Fallback'))).toBe(true);
    });

    test('can disable auto fallback', async () => {
      const failingProcessor: InputProcessor = {
        process: async () => {
          throw new Error('Processing failed');
        },
        validate: () => true,
        fallback: async (input) => ({
          originalInput: input,
          processedContent: 'Fallback content',
          confidence: 0.5,
          processingTime: 0,
          metadata: {
            processor: 'FailingProcessor',
            timestamp: new Date(),
          },
        }),
      };

      const processor = new MultimodalInputProcessor({
        autoFallback: false,
        customProcessors: {
          text: failingProcessor,
        },
      });

      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.confidence).toBe(0.0);
      expect(result.errors).toBeDefined();
      expect(result.processedContent).toBe('');
    });

    test('fallback method can be called directly', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.fallback(input);

      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('Fallback'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  describe('Configuration', () => {
    test('uses default configuration', () => {
      const processor = new MultimodalInputProcessor();
      const config = processor.getConfig();

      expect(config.minConfidenceThreshold).toBe(0.5);
      expect(config.maxProcessingTime).toBe(5000);
      expect(config.autoFallback).toBe(true);
    });

    test('accepts custom configuration', () => {
      const processor = new MultimodalInputProcessor({
        minConfidenceThreshold: 0.8,
        maxProcessingTime: 3000,
        autoFallback: false,
      });

      const config = processor.getConfig();

      expect(config.minConfidenceThreshold).toBe(0.8);
      expect(config.maxProcessingTime).toBe(3000);
      expect(config.autoFallback).toBe(false);
    });

    test('can update configuration', () => {
      const processor = new MultimodalInputProcessor();

      processor.updateConfig({
        minConfidenceThreshold: 0.9,
      });

      const config = processor.getConfig();
      expect(config.minConfidenceThreshold).toBe(0.9);
    });

    test('accepts custom processors', async () => {
      const customProcessor: InputProcessor = {
        process: async (input) => ({
          originalInput: input,
          processedContent: 'Custom processed',
          confidence: 1.0,
          processingTime: 0,
          metadata: {
            processor: 'CustomProcessor',
            timestamp: new Date(),
          },
        }),
        validate: () => true,
        fallback: async (input) => ({
          originalInput: input,
          processedContent: 'Custom fallback',
          confidence: 0.5,
          processingTime: 0,
          metadata: {
            processor: 'CustomProcessor',
            timestamp: new Date(),
          },
        }),
      };

      const processor = new MultimodalInputProcessor({
        customProcessors: {
          text: customProcessor,
        },
      });

      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processedContent).toBe('Custom processed');
      expect(result.metadata.processor).toBe('CustomProcessor');
    });
  });

  // -------------------------------------------------------------------------
  // Processing Time
  // -------------------------------------------------------------------------

  describe('Processing Time', () => {
    test('includes processing time in result', async () => {
      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });

    test('handles timeout gracefully', async () => {
      const slowProcessor: InputProcessor = {
        process: async (input) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            originalInput: input,
            processedContent: 'Slow result',
            confidence: 1.0,
            processingTime: 100,
            metadata: {
              processor: 'SlowProcessor',
              timestamp: new Date(),
            },
          };
        },
        validate: () => true,
        fallback: async (input) => ({
          originalInput: input,
          processedContent: 'Fallback',
          confidence: 0.5,
          processingTime: 0,
          metadata: {
            processor: 'SlowProcessor',
            timestamp: new Date(),
          },
        }),
      };

      const processor = new MultimodalInputProcessor({
        maxProcessingTime: 50, // Very short timeout
        customProcessors: {
          text: slowProcessor,
        },
      });

      const input: MultimodalInput = {
        type: 'text',
        content: 'Hello',
        timestamp: new Date(),
      };

      const result = await processor.process(input);

      // Should use fallback due to timeout
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('Fallback'))).toBe(true);
    });
  });
});

// ============================================================================
// Default Instance Tests
// ============================================================================

describe('defaultInputProcessor', () => {
  test('exports a default instance', () => {
    expect(defaultInputProcessor).toBeInstanceOf(MultimodalInputProcessor);
  });

  test('default instance can process inputs', async () => {
    const input: MultimodalInput = {
      type: 'text',
      content: 'Hello from default processor',
      timestamp: new Date(),
    };

    const result = await defaultInputProcessor.process(input);

    expect(result.processedContent).toBe('Hello from default processor');
    expect(result.confidence).toBeGreaterThan(0);
  });
});
