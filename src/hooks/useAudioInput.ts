/**
 * useAudioInput Hook for UNSAID/UNHEARD
 * 
 * React hook for managing audio input with recording state,
 * quality validation, and preprocessing.
 * 
 * Requirements: 2.1, 3.1
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AudioRecorder,
  AudioRecordingState,
  preprocessAudioForAI,
  validateAudioQuality,
  PreprocessedAudio,
  AudioQualityValidation,
  AudioRecordingConfig,
} from '@/lib/audio-processor';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface UseAudioInputOptions {
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  
  /** Minimum recording duration in seconds */
  minDuration?: number;
  
  /** Minimum quality score (0-1) to accept recording */
  minQualityScore?: number;
  
  /** Whether to automatically preprocess audio for AI */
  autoPreprocess?: boolean;
  
  /** Audio recording configuration */
  recordingConfig?: Partial<AudioRecordingConfig>;
  
  /** Callback when audio is successfully captured */
  onAudioCapture?: (audio: PreprocessedAudio) => void;
  
  /** Callback when recording state changes */
  onStateChange?: (state: AudioRecordingState) => void;
  
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseAudioInputReturn {
  /** Current recording state */
  state: AudioRecordingState;
  
  /** Current recording duration in seconds */
  duration: number;
  
  /** Audio quality validation result (if available) */
  qualityValidation: AudioQualityValidation | null;
  
  /** Whether audio is currently being processed */
  isProcessing: boolean;
  
  /** Current error message (if any) */
  error: string | null;
  
  /** Whether browser supports audio recording */
  isSupported: boolean;
  
  /** Start recording */
  startRecording: () => Promise<void>;
  
  /** Stop recording and process audio */
  stopRecording: () => Promise<void>;
  
  /** Pause recording */
  pauseRecording: () => void;
  
  /** Resume recording */
  resumeRecording: () => void;
  
  /** Cancel recording */
  cancelRecording: () => void;
  
  /** Clear error */
  clearError: () => void;
  
  /** Get progress percentage (0-100) */
  progressPercentage: number;
}

// ============================================================================
// useAudioInput Hook
// ============================================================================

/**
 * Hook for managing audio input with recording, validation, and preprocessing
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     state,
 *     duration,
 *     startRecording,
 *     stopRecording,
 *     error,
 *   } = useAudioInput({
 *     maxDuration: 60,
 *     onAudioCapture: (audio) => {
 *       console.log('Audio captured:', audio);
 *     },
 *   });
 * 
 *   return (
 *     <div>
 *       {state === 'idle' && (
 *         <button onClick={startRecording}>Start Recording</button>
 *       )}
 *       {state === 'recording' && (
 *         <>
 *           <p>Recording: {duration.toFixed(1)}s</p>
 *           <button onClick={stopRecording}>Stop</button>
 *         </>
 *       )}
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAudioInput(options: UseAudioInputOptions = {}): UseAudioInputReturn {
  const {
    maxDuration = 300,
    minDuration = 0.5,
    minQualityScore = 0.5,
    autoPreprocess = true,
    recordingConfig = {},
    onAudioCapture,
    onStateChange,
    onError,
  } = options;

  const [state, setState] = useState<AudioRecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [qualityValidation, setQualityValidation] = useState<AudioQualityValidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(AudioRecorder.isSupported());

  const recorderRef = useRef<AudioRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize recorder
  useEffect(() => {
    recorderRef.current = new AudioRecorder({
      maxDuration,
      minDuration,
      sampleRate: 16000,
      channels: 1,
      autoGainControl: true,
      noiseSuppression: true,
      echoCancellation: true,
      ...recordingConfig,
    });

    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancelRecording();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [maxDuration, minDuration, recordingConfig]);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Start duration tracking
  const startDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      if (recorderRef.current) {
        const currentDuration = recorderRef.current.getRecordingDuration();
        setDuration(currentDuration);
      }
    }, 100);
  }, []);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recorderRef.current || !isSupported) {
      const err = new Error('Audio recording is not supported');
      setError(err.message);
      if (onError) onError(err);
      return;
    }

    try {
      setError(null);
      setQualityValidation(null);
      await recorderRef.current.startRecording();
      setState('recording');
      startDurationTracking();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error.message);
      setState('error');
      if (onError) onError(error);
    }
  }, [isSupported, startDurationTracking, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    try {
      stopDurationTracking();
      setIsProcessing(true);
      setState('processing');

      // Stop recording and get audio blob
      const audioBlob = await recorderRef.current.stopRecording();

      // Validate and preprocess audio
      if (autoPreprocess) {
        const preprocessed = await preprocessAudioForAI(audioBlob);
        
        // Validate quality
        const audioContext = new AudioContext();
        const arrayBuffer = await preprocessed.audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const validation = await validateAudioQuality(audioBuffer, minQualityScore);
        await audioContext.close();

        setQualityValidation(validation);

        if (validation.isValid) {
          if (onAudioCapture) {
            onAudioCapture(preprocessed);
          }
          setState('idle');
          setDuration(0);
        } else {
          const err = new Error('Audio quality is too low');
          setError(err.message);
          setState('error');
          if (onError) onError(err);
        }
      } else {
        // Return raw audio without preprocessing
        const preprocessed: PreprocessedAudio = {
          audioBlob,
          format: audioBlob.type,
          sampleRate: 16000,
          channels: 1,
          duration: duration,
          quality: {
            snr: 0,
            averageVolume: 0,
            peakVolume: 0,
            hasClipping: false,
            isTooQuiet: false,
            isTooLoud: false,
            qualityScore: 1.0,
            duration: duration,
          },
          metadata: {
            originalSize: audioBlob.size,
            processedSize: audioBlob.size,
            processingTime: 0,
            timestamp: new Date(),
          },
        };

        if (onAudioCapture) {
          onAudioCapture(preprocessed);
        }
        setState('idle');
        setDuration(0);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop recording');
      setError(error.message);
      setState('error');
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    autoPreprocess,
    duration,
    minQualityScore,
    onAudioCapture,
    onError,
    stopDurationTracking,
  ]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.pauseRecording();
      setState('paused');
      stopDurationTracking();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pause recording');
      setError(error.message);
      if (onError) onError(error);
    }
  }, [stopDurationTracking, onError]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.resumeRecording();
      setState('recording');
      startDurationTracking();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resume recording');
      setError(error.message);
      if (onError) onError(error);
    }
  }, [startDurationTracking, onError]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (!recorderRef.current) return;

    recorderRef.current.cancelRecording();
    setState('idle');
    setDuration(0);
    setError(null);
    setQualityValidation(null);
    stopDurationTracking();
  }, [stopDurationTracking]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate progress percentage
  const progressPercentage = (duration / maxDuration) * 100;

  return {
    state,
    duration,
    qualityValidation,
    isProcessing,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearError,
    progressPercentage,
  };
}
