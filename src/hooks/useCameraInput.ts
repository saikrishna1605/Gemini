/**
 * React Hook for Camera Input
 * 
 * Provides camera access, image capture, and OCR functionality
 * for React components with accessibility support.
 * 
 * Requirements: 4.1, 6.2
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraManager,
  CameraConfig,
  CameraState,
  CapturedImage,
  PreprocessedImage,
  OCRResult,
  getCameraCapabilities,
  CameraCapabilities,
} from '@/lib/camera-processor';

// ============================================================================
// Hook Types
// ============================================================================

export interface UseCameraInputOptions {
  /** Camera configuration */
  config?: CameraConfig;
  /** Auto-start camera on mount */
  autoStart?: boolean;
  /** Callback when image is captured */
  onCapture?: (image: CapturedImage) => void;
  /** Callback when text is extracted */
  onTextExtracted?: (text: string, confidence: number) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface UseCameraInputReturn {
  /** Current camera state */
  state: CameraState;
  /** Whether camera is ready */
  isReady: boolean;
  /** Whether camera is currently capturing */
  isCapturing: boolean;
  /** Whether camera is processing */
  isProcessing: boolean;
  /** Current error if any */
  error: Error | null;
  /** Camera capabilities */
  capabilities: CameraCapabilities | null;
  /** Video element ref to attach to video element */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Last captured image */
  capturedImage: CapturedImage | null;
  /** Last preprocessed image */
  preprocessedImage: PreprocessedImage | null;
  /** Last OCR result */
  ocrResult: OCRResult | null;
  /** Start camera */
  startCamera: () => Promise<void>;
  /** Stop camera */
  stopCamera: () => void;
  /** Capture image */
  captureImage: () => Promise<CapturedImage>;
  /** Capture and process image for OCR */
  captureAndProcess: () => Promise<{
    captured: CapturedImage;
    preprocessed: PreprocessedImage;
    ocr: OCRResult;
  }>;
  /** Switch camera (front/back) */
  switchCamera: () => Promise<void>;
  /** Update camera configuration */
  updateConfig: (config: Partial<CameraConfig>) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for camera input with OCR capabilities
 * 
 * @example
 * ```tsx
 * function CameraComponent() {
 *   const {
 *     videoRef,
 *     isReady,
 *     captureAndProcess,
 *     ocrResult,
 *     startCamera,
 *     stopCamera
 *   } = useCameraInput({
 *     autoStart: true,
 *     onTextExtracted: (text) => console.log('Extracted:', text)
 *   });
 * 
 *   return (
 *     <div>
 *       <video ref={videoRef} autoPlay playsInline />
 *       {isReady && (
 *         <button onClick={captureAndProcess}>
 *           Capture & Read Text
 *         </button>
 *       )}
 *       {ocrResult && <p>{ocrResult.text}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCameraInput(
  options: UseCameraInputOptions = {}
): UseCameraInputReturn {
  const {
    config = {},
    autoStart = false,
    onCapture,
    onTextExtracted,
    onError,
  } = options;

  // State
  const [state, setState] = useState<CameraState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [preprocessedImage, setPreprocessedImage] = useState<PreprocessedImage | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);

  // Initialize camera manager
  useEffect(() => {
    cameraManagerRef.current = new CameraManager(config);

    return () => {
      if (cameraManagerRef.current) {
        cameraManagerRef.current.stop();
      }
    };
  }, []);

  // Load camera capabilities
  useEffect(() => {
    getCameraCapabilities()
      .then(setCapabilities)
      .catch((err) => {
        console.error('Failed to get camera capabilities:', err);
      });
  }, []);

  // Auto-start camera
  useEffect(() => {
    if (autoStart) {
      startCamera().catch((err) => {
        console.error('Failed to auto-start camera:', err);
      });
    }
  }, [autoStart]);

  // Sync state with camera manager
  useEffect(() => {
    const interval = setInterval(() => {
      if (cameraManagerRef.current) {
        const currentState = cameraManagerRef.current.getState();
        setState(currentState);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  /**
   * Starts camera and attaches stream to video element
   */
  const startCamera = useCallback(async () => {
    if (!cameraManagerRef.current) {
      const err = new Error('Camera manager not initialized');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      setError(null);
      const stream = await cameraManagerRef.current.initialize();

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start camera');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  /**
   * Stops camera and releases resources
   */
  const stopCamera = useCallback(() => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stop();
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setError(null);
    setCapturedImage(null);
    setPreprocessedImage(null);
    setOcrResult(null);
  }, []);

  /**
   * Captures image from camera
   */
  const captureImage = useCallback(async (): Promise<CapturedImage> => {
    if (!cameraManagerRef.current || !videoRef.current) {
      const err = new Error('Camera not ready');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      setError(null);
      const image = await cameraManagerRef.current.captureImage(videoRef.current);
      setCapturedImage(image);
      onCapture?.(image);
      return image;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to capture image');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onCapture, onError]);

  /**
   * Captures and processes image for OCR
   */
  const captureAndProcess = useCallback(async () => {
    if (!cameraManagerRef.current || !videoRef.current) {
      const err = new Error('Camera not ready');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      setError(null);
      const result = await cameraManagerRef.current.captureAndProcess(videoRef.current);

      setCapturedImage(result.captured);
      setPreprocessedImage(result.preprocessed);
      setOcrResult(result.ocr);

      onCapture?.(result.captured);
      onTextExtracted?.(result.ocr.text, result.ocr.confidence);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process image');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onCapture, onTextExtracted, onError]);

  /**
   * Switches between front and back camera
   */
  const switchCamera = useCallback(async () => {
    if (!cameraManagerRef.current) {
      const err = new Error('Camera manager not initialized');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      // Stop current camera
      stopCamera();

      // Get current config
      const currentConfig = cameraManagerRef.current.getConfig();

      // Toggle facing mode
      const newFacingMode = currentConfig.facingMode === 'user' ? 'environment' : 'user';

      // Update config
      cameraManagerRef.current.updateConfig({ facingMode: newFacingMode });

      // Restart camera
      await startCamera();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch camera');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [startCamera, stopCamera, onError]);

  /**
   * Updates camera configuration
   */
  const updateConfig = useCallback((newConfig: Partial<CameraConfig>) => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.updateConfig(newConfig);
    }
  }, []);

  // Derived state
  const isReady = state === 'ready';
  const isCapturing = state === 'capturing';
  const isProcessing = state === 'processing';

  return {
    state,
    isReady,
    isCapturing,
    isProcessing,
    error,
    capabilities,
    videoRef,
    capturedImage,
    preprocessedImage,
    ocrResult,
    startCamera,
    stopCamera,
    captureImage,
    captureAndProcess,
    switchCamera,
    updateConfig,
  };
}
