/**
 * Universal Input Handler System for UNSAID/UNHEARD
 * 
 * This module implements the MultimodalInputProcessor class that routes
 * different input types (voice, text, icons, sign, camera) to appropriate
 * processors with validation and fallback support.
 * 
 * Requirements: 6.2, 12.2
 */

import {
  MultimodalInput,
  ProcessedInput,
  InputProcessor,
  AudioBlob,
  ImageBlob,
  VideoBlob,
  IconSequence,
} from './accessibility';

// ============================================================================
// Input Validation Utilities
// ============================================================================

/**
 * Validates that a blob has the expected type prefix
 */
function validateBlobType(blob: Blob, expectedPrefix: string): boolean {
  return blob.type.startsWith(expectedPrefix);
}

/**
 * Validates icon sequence structure
 */
function validateIconSequence(content: any): content is IconSequence {
  return (
    typeof content === 'object' &&
    content !== null &&
    Array.isArray(content.icons) &&
    content.icons.every(
      (icon: any) =>
        typeof icon.id === 'string' &&
        typeof icon.label === 'string' &&
        typeof icon.category === 'string'
    )
  );
}

/**
 * Validates multimodal input structure and content
 */
export function validateMultimodalInput(input: MultimodalInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate timestamp
  if (!(input.timestamp instanceof Date) || isNaN(input.timestamp.getTime())) {
    errors.push('Invalid timestamp');
  }

  // Validate confidence if provided
  if (input.confidence !== undefined) {
    if (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1) {
      errors.push('Confidence must be a number between 0 and 1');
    }
  }

  // Validate content based on type
  switch (input.type) {
    case 'text':
      if (typeof input.content !== 'string') {
        errors.push('Text input must have string content');
      } else if (input.content.trim().length === 0) {
        errors.push('Text input cannot be empty');
      }
      break;

    case 'voice':
      if (!(input.content instanceof Blob)) {
        errors.push('Voice input must be a Blob');
      } else if (!validateBlobType(input.content, 'audio/')) {
        errors.push('Voice input must be an audio blob');
      }
      break;

    case 'camera':
      if (!(input.content instanceof Blob)) {
        errors.push('Camera input must be a Blob');
      } else if (!validateBlobType(input.content, 'image/')) {
        errors.push('Camera input must be an image blob');
      }
      break;

    case 'sign':
      if (!(input.content instanceof Blob)) {
        errors.push('Sign input must be a Blob');
      } else if (!validateBlobType(input.content, 'video/')) {
        errors.push('Sign input must be a video blob');
      }
      break;

    case 'icons':
      if (!validateIconSequence(input.content)) {
        errors.push('Icons input must be a valid IconSequence');
      }
      break;

    default:
      errors.push(`Unknown input type: ${input.type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Specialized Input Processors
// ============================================================================

/**
 * Processor for text input
 */
class TextInputProcessor implements InputProcessor {
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const content = input.content as string;

    return {
      originalInput: input,
      processedContent: content.trim(),
      confidence: 1.0,
      processingTime: Date.now() - startTime,
      metadata: {
        processor: 'TextInputProcessor',
        timestamp: new Date(),
        characterCount: content.length,
        wordCount: content.trim().split(/\s+/).length,
      },
    };
  }

  validate(input: MultimodalInput): boolean {
    return input.type === 'text' && typeof input.content === 'string';
  }

  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    return {
      originalInput: input,
      processedContent: String(input.content || ''),
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      warnings: ['Fallback text processing used'],
      metadata: {
        processor: 'TextInputProcessor',
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  }
}

/**
 * Processor for voice/audio input
 */
class VoiceInputProcessor implements InputProcessor {
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const audioBlob = input.content as AudioBlob;

    // In a real implementation, this would use speech-to-text API
    // For now, we return a placeholder that indicates processing occurred
    const confidence = input.confidence || 0.85;

    return {
      originalInput: input,
      processedContent: '[Voice input processed - speech-to-text integration pending]',
      confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        processor: 'VoiceInputProcessor',
        timestamp: new Date(),
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
      },
    };
  }

  validate(input: MultimodalInput): boolean {
    return (
      input.type === 'voice' &&
      input.content instanceof Blob &&
      validateBlobType(input.content, 'audio/')
    );
  }

  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    return {
      originalInput: input,
      processedContent: '[Voice input could not be processed]',
      confidence: 0.0,
      processingTime: Date.now() - startTime,
      errors: ['Voice processing failed'],
      warnings: ['Fallback voice processing used - manual transcription may be needed'],
      metadata: {
        processor: 'VoiceInputProcessor',
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  }
}

/**
 * Processor for icon/AAC input
 */
class IconInputProcessor implements InputProcessor {
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const iconSeq = input.content as IconSequence;

    // Combine icon labels and phrases into a sentence
    const iconLabels = iconSeq.icons.map((icon) => icon.label);
    const phrases = iconSeq.phrases || [];
    const combined = [...iconLabels, ...phrases].join(' ');

    // In a real implementation, this would use AAC Voice Builder AI
    const confidence = 0.9;

    return {
      originalInput: input,
      processedContent: combined,
      confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        processor: 'IconInputProcessor',
        timestamp: new Date(),
        iconCount: iconSeq.icons.length,
        phraseCount: phrases.length,
        categories: [...new Set(iconSeq.icons.map((i) => i.category))],
      },
    };
  }

  validate(input: MultimodalInput): boolean {
    return input.type === 'icons' && validateIconSequence(input.content);
  }

  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const iconSeq = input.content as IconSequence;

    // Simple fallback: just concatenate labels
    const labels = iconSeq.icons?.map((icon) => icon.label).join(' ') || '';

    return {
      originalInput: input,
      processedContent: labels,
      confidence: 0.6,
      processingTime: Date.now() - startTime,
      warnings: ['Fallback icon processing used - AI sentence building unavailable'],
      metadata: {
        processor: 'IconInputProcessor',
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  }
}

/**
 * Processor for sign language video input
 */
class SignInputProcessor implements InputProcessor {
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const videoBlob = input.content as VideoBlob;

    // In a real implementation, this would use Gemini 3 sign recognition
    const confidence = input.confidence || 0.75;

    return {
      originalInput: input,
      processedContent: '[Sign language input processed - AI recognition pending]',
      confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        processor: 'SignInputProcessor',
        timestamp: new Date(),
        videoSize: videoBlob.size,
        videoType: videoBlob.type,
      },
    };
  }

  validate(input: MultimodalInput): boolean {
    return (
      input.type === 'sign' &&
      input.content instanceof Blob &&
      validateBlobType(input.content, 'video/')
    );
  }

  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    return {
      originalInput: input,
      processedContent: '[Sign language input could not be processed]',
      confidence: 0.0,
      processingTime: Date.now() - startTime,
      errors: ['Sign language processing failed'],
      warnings: ['Fallback sign processing used - manual interpretation may be needed'],
      metadata: {
        processor: 'SignInputProcessor',
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  }
}

/**
 * Processor for camera/image input
 */
class CameraInputProcessor implements InputProcessor {
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const imageBlob = input.content as ImageBlob;

    // In a real implementation, this would use OCR and image analysis
    const confidence = input.confidence || 0.8;

    return {
      originalInput: input,
      processedContent: '[Camera input processed - OCR integration pending]',
      confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        processor: 'CameraInputProcessor',
        timestamp: new Date(),
        imageSize: imageBlob.size,
        imageType: imageBlob.type,
      },
    };
  }

  validate(input: MultimodalInput): boolean {
    return (
      input.type === 'camera' &&
      input.content instanceof Blob &&
      validateBlobType(input.content, 'image/')
    );
  }

  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    return {
      originalInput: input,
      processedContent: '[Camera input could not be processed]',
      confidence: 0.0,
      processingTime: Date.now() - startTime,
      errors: ['Camera processing failed'],
      warnings: ['Fallback camera processing used - manual image description may be needed'],
      metadata: {
        processor: 'CameraInputProcessor',
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  }
}

// ============================================================================
// Universal Input Handler
// ============================================================================

/**
 * Configuration options for MultimodalInputProcessor
 */
export interface InputProcessorConfig {
  /**
   * Minimum confidence threshold for accepting processed input
   * Default: 0.5
   */
  minConfidenceThreshold?: number;

  /**
   * Maximum processing time in milliseconds before timeout
   * Default: 5000 (5 seconds)
   */
  maxProcessingTime?: number;

  /**
   * Whether to automatically use fallback on processing failure
   * Default: true
   */
  autoFallback?: boolean;

  /**
   * Custom processors for specific input types
   */
  customProcessors?: Partial<Record<MultimodalInput['type'], InputProcessor>>;
}

/**
 * Universal multimodal input handler with routing, validation, and fallback
 * 
 * This class routes different input types to appropriate specialized processors,
 * validates inputs, scores confidence, and provides fallback mechanisms.
 * 
 * Requirements: 6.2, 12.2
 */
export class MultimodalInputProcessor {
  private processors: Map<MultimodalInput['type'], InputProcessor>;
  private config: Required<Omit<InputProcessorConfig, 'customProcessors'>>;

  constructor(config: InputProcessorConfig = {}) {
    // Initialize default configuration
    this.config = {
      minConfidenceThreshold: config.minConfidenceThreshold ?? 0.5,
      maxProcessingTime: config.maxProcessingTime ?? 5000,
      autoFallback: config.autoFallback ?? true,
    };

    // Initialize processor map with default processors
    this.processors = new Map([
      ['text', new TextInputProcessor()],
      ['voice', new VoiceInputProcessor()],
      ['icons', new IconInputProcessor()],
      ['sign', new SignInputProcessor()],
      ['camera', new CameraInputProcessor()],
    ]);

    // Override with custom processors if provided
    if (config.customProcessors) {
      Object.entries(config.customProcessors).forEach(([type, processor]) => {
        if (processor) {
          this.processors.set(type as MultimodalInput['type'], processor);
        }
      });
    }
  }

  /**
   * Validate input before processing
   */
  validate(input: MultimodalInput): boolean {
    const validation = validateMultimodalInput(input);
    return validation.valid;
  }

  /**
   * Get the appropriate processor for an input type
   */
  private getProcessor(type: MultimodalInput['type']): InputProcessor | null {
    return this.processors.get(type) || null;
  }

  /**
   * Process multimodal input with timeout and error handling
   */
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    // Validate input first
    const validation = validateMultimodalInput(input);
    if (!validation.valid) {
      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: validation.errors,
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          validationFailed: true,
        },
      };
    }

    // Get appropriate processor
    const processor = this.getProcessor(input.type);
    if (!processor) {
      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: [`No processor available for input type: ${input.type}`],
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          noProcessorFound: true,
        },
      };
    }

    // Validate with processor
    if (!processor.validate(input)) {
      if (this.config.autoFallback) {
        return this.fallback(input);
      }
      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: ['Processor validation failed'],
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          processorValidationFailed: true,
        },
      };
    }

    try {
      // Process with timeout
      const result = await this.processWithTimeout(processor, input);

      // Check confidence threshold
      if (result.confidence < this.config.minConfidenceThreshold) {
        result.warnings = result.warnings || [];
        result.warnings.push(
          `Low confidence: ${result.confidence.toFixed(2)} < ${this.config.minConfidenceThreshold}`
        );
      }

      return result;
    } catch (error) {
      // If processing fails and autoFallback is enabled, try fallback
      if (this.config.autoFallback) {
        return this.fallback(input);
      }

      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed'],
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          processingError: true,
        },
      };
    }
  }

  /**
   * Process input with timeout protection
   */
  private async processWithTimeout(
    processor: InputProcessor,
    input: MultimodalInput
  ): Promise<ProcessedInput> {
    return Promise.race([
      processor.process(input),
      new Promise<ProcessedInput>((_, reject) =>
        setTimeout(
          () => reject(new Error('Processing timeout')),
          this.config.maxProcessingTime
        )
      ),
    ]);
  }

  /**
   * Fallback processing when primary processing fails
   */
  async fallback(input: MultimodalInput): Promise<ProcessedInput> {
    const processor = this.getProcessor(input.type);
    if (!processor) {
      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: [`No fallback processor available for input type: ${input.type}`],
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          fallbackFailed: true,
        },
      };
    }

    try {
      const result = await processor.fallback(input);
      result.warnings = result.warnings || [];
      result.warnings.push('Fallback processing was used');
      return result;
    } catch (error) {
      return {
        originalInput: input,
        processedContent: '',
        confidence: 0.0,
        processingTime: 0,
        errors: [
          'Fallback processing failed',
          error instanceof Error ? error.message : 'Unknown error',
        ],
        metadata: {
          processor: 'MultimodalInputProcessor',
          timestamp: new Date(),
          fallbackError: true,
        },
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<Omit<InputProcessorConfig, 'customProcessors'>>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InputProcessorConfig>): void {
    if (config.minConfidenceThreshold !== undefined) {
      this.config.minConfidenceThreshold = config.minConfidenceThreshold;
    }
    if (config.maxProcessingTime !== undefined) {
      this.config.maxProcessingTime = config.maxProcessingTime;
    }
    if (config.autoFallback !== undefined) {
      this.config.autoFallback = config.autoFallback;
    }
    if (config.customProcessors) {
      Object.entries(config.customProcessors).forEach(([type, processor]) => {
        if (processor) {
          this.processors.set(type as MultimodalInput['type'], processor);
        }
      });
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance for convenience
export const defaultInputProcessor = new MultimodalInputProcessor();
