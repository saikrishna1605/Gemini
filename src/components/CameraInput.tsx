/**
 * Camera Input Component for UNSAID/UNHEARD
 * 
 * Accessible camera input component with OCR capabilities
 * for capturing and reading text from images.
 * 
 * Requirements: 4.1, 6.2
 */

'use client';

import React, { useState } from 'react';
import { useCameraInput } from '@/hooks/useCameraInput';
import { CameraConfig } from '@/lib/camera-processor';

// ============================================================================
// Component Types
// ============================================================================

export interface CameraInputProps {
  /** Camera configuration */
  config?: CameraConfig;
  /** Auto-start camera on mount */
  autoStart?: boolean;
  /** Show camera controls */
  showControls?: boolean;
  /** Show captured image preview */
  showPreview?: boolean;
  /** Show OCR results */
  showOCRResults?: boolean;
  /** Enable text-to-speech for extracted text */
  enableTextToSpeech?: boolean;
  /** Callback when image is captured */
  onCapture?: (imageDataUrl: string) => void;
  /** Callback when text is extracted */
  onTextExtracted?: (text: string, confidence: number) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
  /** ARIA label for camera view */
  ariaLabel?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Accessible camera input component with OCR
 * 
 * Features:
 * - Camera access with permission handling
 * - Image capture with preview
 * - OCR text extraction
 * - Text-to-speech for extracted text
 * - Keyboard navigation
 * - Screen reader support
 * 
 * @example
 * ```tsx
 * <CameraInput
 *   autoStart
 *   showControls
 *   showOCRResults
 *   enableTextToSpeech
 *   onTextExtracted={(text) => console.log('Extracted:', text)}
 * />
 * ```
 */
export function CameraInput({
  config,
  autoStart = false,
  showControls = true,
  showPreview = true,
  showOCRResults = true,
  enableTextToSpeech = true,
  onCapture,
  onTextExtracted,
  onError,
  className = '',
  ariaLabel = 'Camera input for text reading',
}: CameraInputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const {
    videoRef,
    state,
    isReady,
    isCapturing,
    isProcessing,
    error,
    capabilities,
    capturedImage,
    ocrResult,
    startCamera,
    stopCamera,
    captureAndProcess,
    switchCamera,
  } = useCameraInput({
    config,
    autoStart,
    onCapture: (image) => {
      onCapture?.(image.dataUrl);
    },
    onTextExtracted,
    onError,
  });

  /**
   * Speaks text using Web Speech API
   */
  const speakText = (text: string) => {
    if (!enableTextToSpeech || !text || text.includes('pending')) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  /**
   * Stops speech
   */
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  /**
   * Handles capture and read button click
   */
  const handleCaptureAndRead = async () => {
    try {
      const result = await captureAndProcess();
      if (result.ocr.text && !result.ocr.text.includes('pending')) {
        speakText(result.ocr.text);
      }
    } catch (err) {
      console.error('Failed to capture and read:', err);
    }
  };

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (isReady) {
        handleCaptureAndRead();
      } else if (state === 'idle') {
        startCamera();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (isSpeaking) {
        stopSpeech();
      } else {
        stopCamera();
      }
    } else if (event.key === 's' && event.ctrlKey) {
      event.preventDefault();
      switchCamera();
    }
  };

  return (
    <div
      className={`camera-input ${className}`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Camera View */}
      <div className="camera-view relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          aria-label="Camera preview"
        />

        {/* State Overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center text-white p-4">
              {state === 'idle' && (
                <>
                  <p className="text-lg mb-4">Camera not started</p>
                  {showControls && (
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Start camera"
                    >
                      Start Camera
                    </button>
                  )}
                </>
              )}

              {state === 'requesting-permission' && (
                <p className="text-lg">Requesting camera permission...</p>
              )}

              {state === 'error' && error && (
                <>
                  <p className="text-lg text-red-400 mb-2">Camera Error</p>
                  <p className="text-sm">{error.message}</p>
                  {showControls && (
                    <button
                      onClick={startCamera}
                      className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Retry camera access"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {(isCapturing || isProcessing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">
                {isCapturing ? 'Capturing...' : 'Processing image...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && isReady && (
        <div className="controls mt-4 flex flex-wrap gap-3" role="toolbar" aria-label="Camera controls">
          <button
            onClick={handleCaptureAndRead}
            disabled={!isReady || isCapturing || isProcessing}
            className="flex-1 min-w-[200px] px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Capture image and read text aloud"
          >
            📸 Capture & Read Text
          </button>

          {capabilities?.hasMultipleCameras && (
            <button
              onClick={switchCamera}
              disabled={!isReady || isCapturing || isProcessing}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Switch camera"
              title="Switch between front and back camera (Ctrl+S)"
            >
              🔄 Switch Camera
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Stop speech"
            >
              🔇 Stop Speech
            </button>
          )}

          <button
            onClick={stopCamera}
            disabled={!isReady}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Stop camera"
          >
            ⏹️ Stop Camera
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showControls && isReady && (
        <div className="mt-3 text-sm text-gray-600" role="note">
          <p>
            <strong>Keyboard shortcuts:</strong> Space/Enter = Capture & Read, Escape = Stop, Ctrl+S = Switch Camera
          </p>
        </div>
      )}

      {/* Captured Image Preview */}
      {showPreview && capturedImage && (
        <div className="preview mt-4" role="region" aria-label="Captured image preview">
          <h3 className="text-lg font-semibold mb-2">Captured Image</h3>
          <img
            src={capturedImage.dataUrl}
            alt="Captured from camera"
            className="w-full max-w-md rounded-lg border-2 border-gray-300"
          />
          <div className="mt-2 text-sm text-gray-600">
            <p>Size: {(capturedImage.size / 1024).toFixed(1)} KB</p>
            <p>Dimensions: {capturedImage.width} × {capturedImage.height}</p>
          </div>
        </div>
      )}

      {/* OCR Results */}
      {showOCRResults && ocrResult && (
        <div className="ocr-results mt-4" role="region" aria-label="Extracted text">
          <h3 className="text-lg font-semibold mb-2">Extracted Text</h3>
          
          {ocrResult.text && !ocrResult.text.includes('pending') ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                <p className="text-gray-900 whitespace-pre-wrap">{ocrResult.text}</p>
              </div>

              {ocrResult.confidence > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    Confidence: {(ocrResult.confidence * 100).toFixed(1)}%
                    {ocrResult.confidence < 0.7 && (
                      <span className="ml-2 text-yellow-600">
                        (Low confidence - text may be inaccurate)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {enableTextToSpeech && (
                <button
                  onClick={() => speakText(ocrResult.text)}
                  disabled={isSpeaking}
                  className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Read text aloud"
                >
                  🔊 Read Aloud
                </button>
              )}
            </>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <p className="text-yellow-800">
                {ocrResult.text || 'No text detected in image'}
              </p>
              {ocrResult.warnings.length > 0 && (
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  {ocrResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && state !== 'error' && (
        <div
          className="error mt-4 p-4 bg-red-50 rounded-lg border border-red-300"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-800 font-medium">Error: {error.message}</p>
        </div>
      )}
    </div>
  );
}

export default CameraInput;
