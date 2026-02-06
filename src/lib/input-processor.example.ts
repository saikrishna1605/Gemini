/**
 * Example usage of MultimodalInputProcessor
 * 
 * This file demonstrates how to use the universal input handler system
 * for processing different types of multimodal inputs.
 */

import {
  MultimodalInputProcessor,
  defaultInputProcessor,
} from './input-processor';
import { MultimodalInput, IconSequence } from './accessibility';

// ============================================================================
// Example 1: Processing Text Input
// ============================================================================

async function processTextInput() {
  const textInput: MultimodalInput = {
    type: 'text',
    content: 'Hello, I need help with accessibility features',
    timestamp: new Date(),
  };

  const result = await defaultInputProcessor.process(textInput);
  
  console.log('Processed text:', result.processedContent);
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime, 'ms');
}

// ============================================================================
// Example 2: Processing Voice Input
// ============================================================================

async function processVoiceInput(audioBlob: Blob) {
  const voiceInput: MultimodalInput = {
    type: 'voice',
    content: audioBlob as AudioBlob,
    timestamp: new Date(),
    metadata: {
      language: 'en-US',
      sampleRate: 44100,
    },
  };

  const result = await defaultInputProcessor.process(voiceInput);
  
  if (result.errors) {
    console.error('Voice processing errors:', result.errors);
  } else {
    console.log('Transcribed text:', result.processedContent);
    console.log('Confidence:', result.confidence);
  }
}

// ============================================================================
// Example 3: Processing AAC Icon Input
// ============================================================================

async function processIconInput() {
  const iconSequence: IconSequence = {
    icons: [
      { id: '1', label: 'I', category: 'pronouns' },
      { id: '2', label: 'want', category: 'verbs' },
      { id: '3', label: 'help', category: 'nouns' },
    ],
    phrases: ['please'],
  };

  const iconInput: MultimodalInput = {
    type: 'icons',
    content: iconSequence,
    timestamp: new Date(),
  };

  const result = await defaultInputProcessor.process(iconInput);
  
  console.log('AAC sentence:', result.processedContent);
  console.log('Icon count:', result.metadata.iconCount);
  console.log('Categories:', result.metadata.categories);
}

// ============================================================================
// Example 4: Processing Camera Input
// ============================================================================

async function processCameraInput(imageBlob: Blob) {
  const cameraInput: MultimodalInput = {
    type: 'camera',
    content: imageBlob as ImageBlob,
    timestamp: new Date(),
    metadata: {
      captureMode: 'text-recognition',
    },
  };

  const result = await defaultInputProcessor.process(cameraInput);
  
  console.log('Extracted text:', result.processedContent);
  console.log('Confidence:', result.confidence);
  
  if (result.warnings) {
    console.warn('Warnings:', result.warnings);
  }
}

// ============================================================================
// Example 5: Processing Sign Language Input
// ============================================================================

async function processSignInput(videoBlob: Blob) {
  const signInput: MultimodalInput = {
    type: 'sign',
    content: videoBlob as VideoBlob,
    timestamp: new Date(),
    metadata: {
      duration: 5000, // 5 seconds
      signLanguage: 'ASL',
    },
  };

  const result = await defaultInputProcessor.process(signInput);
  
  console.log('Recognized sign:', result.processedContent);
  console.log('Confidence:', result.confidence);
}

// ============================================================================
// Example 6: Custom Configuration
// ============================================================================

async function useCustomConfiguration() {
  // Create a processor with custom settings
  const processor = new MultimodalInputProcessor({
    minConfidenceThreshold: 0.8, // Higher confidence requirement
    maxProcessingTime: 3000, // 3 second timeout
    autoFallback: true, // Enable automatic fallback
  });

  const input: MultimodalInput = {
    type: 'text',
    content: 'Test input',
    timestamp: new Date(),
  };

  const result = await processor.process(input);
  
  // Check if confidence meets threshold
  if (result.confidence < 0.8) {
    console.warn('Low confidence result:', result.confidence);
  }
}

// ============================================================================
// Example 7: Handling Errors and Fallbacks
// ============================================================================

async function handleErrorsAndFallbacks() {
  const input: MultimodalInput = {
    type: 'text',
    content: '   ', // Invalid empty input
    timestamp: new Date(),
  };

  const result = await defaultInputProcessor.process(input);
  
  if (result.errors && result.errors.length > 0) {
    console.error('Processing errors:', result.errors);
    
    // Try fallback processing
    const fallbackResult = await defaultInputProcessor.fallback(input);
    console.log('Fallback result:', fallbackResult.processedContent);
  }
}

// ============================================================================
// Example 8: Validating Input Before Processing
// ============================================================================

async function validateBeforeProcessing() {
  const input: MultimodalInput = {
    type: 'text',
    content: 'Valid input',
    timestamp: new Date(),
  };

  // Validate first
  if (defaultInputProcessor.validate(input)) {
    console.log('Input is valid, processing...');
    const result = await defaultInputProcessor.process(input);
    console.log('Result:', result.processedContent);
  } else {
    console.error('Input validation failed');
  }
}

// ============================================================================
// Example 9: Batch Processing Multiple Inputs
// ============================================================================

async function batchProcessInputs() {
  const inputs: MultimodalInput[] = [
    {
      type: 'text',
      content: 'First message',
      timestamp: new Date(),
    },
    {
      type: 'text',
      content: 'Second message',
      timestamp: new Date(),
    },
    {
      type: 'icons',
      content: {
        icons: [
          { id: '1', label: 'Hello', category: 'greetings' },
        ],
      },
      timestamp: new Date(),
    },
  ];

  // Process all inputs in parallel
  const results = await Promise.all(
    inputs.map((input) => defaultInputProcessor.process(input))
  );

  results.forEach((result, index) => {
    console.log(`Input ${index + 1}:`, result.processedContent);
    console.log(`Confidence: ${result.confidence}`);
  });
}

// ============================================================================
// Example 10: Real-time Input Processing with React
// ============================================================================

/**
 * Example React hook for processing multimodal input
 */
/*
import { useState, useCallback } from 'react';

export function useMultimodalInput() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processInput = useCallback(async (input: MultimodalInput) => {
    setProcessing(true);
    setError(null);

    try {
      const processed = await defaultInputProcessor.process(input);
      
      if (processed.errors && processed.errors.length > 0) {
        setError(processed.errors.join(', '));
      }
      
      setResult(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processInput,
    processing,
    result,
    error,
  };
}
*/

// ============================================================================
// Export examples for testing
// ============================================================================

export {
  processTextInput,
  processVoiceInput,
  processIconInput,
  processCameraInput,
  processSignInput,
  useCustomConfiguration,
  handleErrorsAndFallbacks,
  validateBeforeProcessing,
  batchProcessInputs,
};
