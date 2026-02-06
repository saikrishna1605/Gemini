/**
 * CameraInput Component Usage Examples
 * 
 * Demonstrates various ways to use the CameraInput component
 * for accessible camera-based text reading.
 * 
 * Requirements: 4.1, 6.2
 */

'use client';

import React, { useState } from 'react';
import { CameraInput } from './CameraInput';

// ============================================================================
// Example 1: Basic Camera Input
// ============================================================================

export function BasicCameraExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Basic Camera Input</h2>
      <CameraInput
        autoStart
        showControls
        showPreview
        showOCRResults
        enableTextToSpeech
      />
    </div>
  );
}

// ============================================================================
// Example 2: Camera with Callbacks
// ============================================================================

export function CameraWithCallbacksExample() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);

  const handleTextExtracted = (text: string, conf: number) => {
    console.log('Text extracted:', text);
    console.log('Confidence:', conf);
    setExtractedText(text);
    setConfidence(conf);
  };

  const handleCapture = (imageDataUrl: string) => {
    console.log('Image captured:', imageDataUrl.substring(0, 50) + '...');
  };

  const handleError = (error: Error) => {
    console.error('Camera error:', error);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Camera with Callbacks</h2>
      
      <CameraInput
        showControls
        showOCRResults
        enableTextToSpeech
        onTextExtracted={handleTextExtracted}
        onCapture={handleCapture}
        onError={handleError}
      />

      {extractedText && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Extracted Text (via callback):</h3>
          <p className="text-gray-800">{extractedText}</p>
          <p className="text-sm text-gray-600 mt-2">
            Confidence: {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Front Camera (Selfie Mode)
// ============================================================================

export function FrontCameraExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Front Camera (Selfie Mode)</h2>
      <CameraInput
        config={{
          facingMode: 'user', // Front camera
          resolution: { width: 1280, height: 720, label: 'HD' },
        }}
        autoStart
        showControls
        showOCRResults
        enableTextToSpeech
      />
    </div>
  );
}

// ============================================================================
// Example 4: Back Camera (Document Scanning)
// ============================================================================

export function BackCameraExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Back Camera (Document Scanning)</h2>
      <CameraInput
        config={{
          facingMode: 'environment', // Back camera
          resolution: { width: 1920, height: 1080, label: 'Full HD' },
        }}
        autoStart
        showControls
        showPreview
        showOCRResults
        enableTextToSpeech
        ariaLabel="Document scanner camera"
      />
    </div>
  );
}

// ============================================================================
// Example 5: Minimal Camera (No Controls)
// ============================================================================

export function MinimalCameraExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Minimal Camera (No Controls)</h2>
      <p className="text-gray-600 mb-4">
        Camera with no built-in controls - use external buttons
      </p>
      <CameraInput
        autoStart
        showControls={false}
        showPreview={false}
        showOCRResults={false}
        enableTextToSpeech={false}
      />
    </div>
  );
}

// ============================================================================
// Example 6: Custom Styled Camera
// ============================================================================

export function CustomStyledCameraExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Custom Styled Camera</h2>
      <CameraInput
        className="max-w-2xl mx-auto border-4 border-blue-500 rounded-xl shadow-2xl"
        autoStart
        showControls
        showOCRResults
        enableTextToSpeech
      />
    </div>
  );
}

// ============================================================================
// Example 7: Text Reading Assistant
// ============================================================================

export function TextReadingAssistantExample() {
  const [history, setHistory] = useState<Array<{ text: string; timestamp: Date }>>([]);

  const handleTextExtracted = (text: string, confidence: number) => {
    if (text && !text.includes('pending') && confidence > 0.5) {
      setHistory((prev) => [
        { text, timestamp: new Date() },
        ...prev.slice(0, 9), // Keep last 10 items
      ]);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Text Reading Assistant</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Camera</h3>
          <CameraInput
            autoStart
            showControls
            showOCRResults
            enableTextToSpeech
            onTextExtracted={handleTextExtracted}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Reading History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-500 italic">No text captured yet</p>
            ) : (
              history.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Accessibility-First Camera
// ============================================================================

export function AccessibilityFirstCameraExample() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const handleTextExtracted = (text: string, confidence: number) => {
    const announcement = `Text extracted with ${(confidence * 100).toFixed(0)}% confidence: ${text}`;
    setAnnouncements((prev) => [...prev, announcement]);
  };

  const handleError = (error: Error) => {
    const announcement = `Error: ${error.message}`;
    setAnnouncements((prev) => [...prev, announcement]);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Accessibility-First Camera</h2>
      
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcements[announcements.length - 1]}
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Accessibility Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Keyboard navigation (Space/Enter to capture, Escape to stop)</li>
          <li>Screen reader announcements for all actions</li>
          <li>High contrast controls</li>
          <li>Large touch targets</li>
          <li>Text-to-speech for extracted text</li>
          <li>Clear error messages</li>
        </ul>
      </div>

      <CameraInput
        autoStart
        showControls
        showOCRResults
        enableTextToSpeech
        onTextExtracted={handleTextExtracted}
        onError={handleError}
        ariaLabel="Accessible text reading camera with full keyboard support"
      />

      {/* Visual announcement log */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Activity Log:</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
          {announcements.map((announcement, index) => (
            <p key={index} className="text-gray-700">
              {announcement}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 9: Multi-Language Support
// ============================================================================

export function MultiLanguageCameraExample() {
  const [language, setLanguage] = useState<string>('en');

  const labels = {
    en: {
      title: 'Multi-Language Text Reader',
      description: 'Capture and read text in multiple languages',
    },
    es: {
      title: 'Lector de Texto Multilingüe',
      description: 'Captura y lee texto en varios idiomas',
    },
    fr: {
      title: 'Lecteur de Texte Multilingue',
      description: 'Capturez et lisez du texte en plusieurs langues',
    },
  };

  const currentLabels = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">{currentLabels.title}</h2>
        <p className="text-gray-600 mb-4">{currentLabels.description}</p>

        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded ${
              language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`px-4 py-2 rounded ${
              language === 'es' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Español
          </button>
          <button
            onClick={() => setLanguage('fr')}
            className={`px-4 py-2 rounded ${
              language === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Français
          </button>
        </div>
      </div>

      <CameraInput
        autoStart
        showControls
        showOCRResults
        enableTextToSpeech
      />
    </div>
  );
}

// ============================================================================
// Example 10: Complete Demo Page
// ============================================================================

export function CompleteCameraDemoPage() {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', label: 'Basic', component: <BasicCameraExample /> },
    { id: 'callbacks', label: 'With Callbacks', component: <CameraWithCallbacksExample /> },
    { id: 'front', label: 'Front Camera', component: <FrontCameraExample /> },
    { id: 'back', label: 'Back Camera', component: <BackCameraExample /> },
    { id: 'minimal', label: 'Minimal', component: <MinimalCameraExample /> },
    { id: 'styled', label: 'Custom Styled', component: <CustomStyledCameraExample /> },
    { id: 'assistant', label: 'Reading Assistant', component: <TextReadingAssistantExample /> },
    { id: 'a11y', label: 'Accessibility First', component: <AccessibilityFirstCameraExample /> },
    { id: 'multilang', label: 'Multi-Language', component: <MultiLanguageCameraExample /> },
  ];

  const activeExampleComponent = examples.find((ex) => ex.id === activeExample)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            CameraInput Component Examples
          </h1>
          <p className="text-gray-600 mt-2">
            Accessible camera input with OCR and text-to-speech
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Select Example:</h2>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeExample === example.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeExampleComponent}
        </div>
      </div>
    </div>
  );
}

export default CompleteCameraDemoPage;
