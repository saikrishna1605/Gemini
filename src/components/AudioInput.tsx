/**
 * Audio Input Component for UNSAID/UNHEARD
 * 
 * React component for capturing and processing audio input with
 * accessibility features and quality feedback.
 * 
 * Requirements: 2.1, 3.1
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AudioRecorder,
  AudioRecordingState,
  preprocessAudioForAI,
  validateAudioQuality,
  PreprocessedAudio,
  AudioQualityValidation,
} from '@/lib/audio-processor';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AudioInputProps {
  /** Callback when audio is successfully recorded and processed */
  onAudioCapture?: (audio: PreprocessedAudio) => void;
  
  /** Callback when recording state changes */
  onStateChange?: (state: AudioRecordingState) => void;
  
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  
  /** Minimum recording duration in seconds */
  minDuration?: number;
  
  /** Minimum quality score (0-1) to accept recording */
  minQualityScore?: number;
  
  /** Whether to show quality feedback during recording */
  showQualityFeedback?: boolean;
  
  /** Whether to automatically preprocess audio for AI */
  autoPreprocess?: boolean;
  
  /** Custom class name */
  className?: string;
  
  /** Whether component is disabled */
  disabled?: boolean;
}

// ============================================================================
// Audio Input Component
// ============================================================================

export function AudioInput({
  onAudioCapture,
  onStateChange,
  onError,
  maxDuration = 300,
  minDuration = 0.5,
  minQualityScore = 0.5,
  showQualityFeedback = true,
  autoPreprocess = true,
  className = '',
  disabled = false,
}: AudioInputProps) {
  const [state, setState] = useState<AudioRecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [qualityValidation, setQualityValidation] = useState<AudioQualityValidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    });

    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancelRecording();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [maxDuration, minDuration]);

  // Update state callback
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

        // Auto-stop at max duration
        if (currentDuration >= maxDuration) {
          handleStopRecording();
        }
      }
    }, 100);
  }, [maxDuration]);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    if (!recorderRef.current || disabled) return;

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
      if (onError) {
        onError(error);
      }
    }
  }, [disabled, startDurationTracking, onError]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
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
          setError('Audio quality is too low. Please try again.');
          setState('error');
          if (onError) {
            onError(new Error('Audio quality validation failed'));
          }
        }
      } else {
        // Just return the raw audio without preprocessing
        const preprocessed: PreprocessedAudio = {
          audioBlob,
          format: audioBlob.type,
          sampleRate: 16000, // Estimated
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
      if (onError) {
        onError(error);
      }
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

  // Handle pause recording
  const handlePauseRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.pauseRecording();
      setState('paused');
      stopDurationTracking();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pause recording');
      setError(error.message);
      if (onError) {
        onError(error);
      }
    }
  }, [stopDurationTracking, onError]);

  // Handle resume recording
  const handleResumeRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.resumeRecording();
      setState('recording');
      startDurationTracking();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resume recording');
      setError(error.message);
      if (onError) {
        onError(error);
      }
    }
  }, [startDurationTracking, onError]);

  // Handle cancel recording
  const handleCancelRecording = useCallback(() => {
    if (!recorderRef.current) return;

    recorderRef.current.cancelRecording();
    setState('idle');
    setDuration(0);
    setError(null);
    setQualityValidation(null);
    stopDurationTracking();
  }, [stopDurationTracking]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <div
      className={`audio-input ${className}`}
      role="region"
      aria-label="Audio input recorder"
    >
      {/* Recording Controls */}
      <div className="audio-input__controls">
        {state === 'idle' && (
          <button
            onClick={handleStartRecording}
            disabled={disabled || !AudioRecorder.isSupported()}
            className="audio-input__button audio-input__button--start"
            aria-label="Start recording"
            type="button"
          >
            <span className="audio-input__icon" aria-hidden="true">🎤</span>
            <span>Start Recording</span>
          </button>
        )}

        {state === 'recording' && (
          <>
            <button
              onClick={handleStopRecording}
              className="audio-input__button audio-input__button--stop"
              aria-label="Stop recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">⏹️</span>
              <span>Stop</span>
            </button>
            <button
              onClick={handlePauseRecording}
              className="audio-input__button audio-input__button--pause"
              aria-label="Pause recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">⏸️</span>
              <span>Pause</span>
            </button>
            <button
              onClick={handleCancelRecording}
              className="audio-input__button audio-input__button--cancel"
              aria-label="Cancel recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">✖️</span>
              <span>Cancel</span>
            </button>
          </>
        )}

        {state === 'paused' && (
          <>
            <button
              onClick={handleResumeRecording}
              className="audio-input__button audio-input__button--resume"
              aria-label="Resume recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">▶️</span>
              <span>Resume</span>
            </button>
            <button
              onClick={handleStopRecording}
              className="audio-input__button audio-input__button--stop"
              aria-label="Stop recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">⏹️</span>
              <span>Stop</span>
            </button>
            <button
              onClick={handleCancelRecording}
              className="audio-input__button audio-input__button--cancel"
              aria-label="Cancel recording"
              type="button"
            >
              <span className="audio-input__icon" aria-hidden="true">✖️</span>
              <span>Cancel</span>
            </button>
          </>
        )}

        {(state === 'processing' || isProcessing) && (
          <div className="audio-input__processing" role="status" aria-live="polite">
            <span className="audio-input__icon" aria-hidden="true">⏳</span>
            <span>Processing audio...</span>
          </div>
        )}
      </div>

      {/* Duration Display */}
      {(state === 'recording' || state === 'paused') && (
        <div className="audio-input__duration" role="timer" aria-live="polite">
          <div className="audio-input__duration-text">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </div>
          <div
            className="audio-input__progress-bar"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Recording progress"
          >
            <div
              className="audio-input__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="audio-input__error"
          role="alert"
          aria-live="assertive"
        >
          <span className="audio-input__icon" aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Quality Feedback */}
      {showQualityFeedback && qualityValidation && (
        <div
          className={`audio-input__quality ${
            qualityValidation.isValid
              ? 'audio-input__quality--valid'
              : 'audio-input__quality--invalid'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="audio-input__quality-header">
            <span className="audio-input__icon" aria-hidden="true">
              {qualityValidation.isValid ? '✅' : '❌'}
            </span>
            <span>
              Audio Quality: {(qualityValidation.metrics.qualityScore * 100).toFixed(0)}%
            </span>
          </div>

          {qualityValidation.errors.length > 0 && (
            <ul className="audio-input__quality-list" aria-label="Quality errors">
              {qualityValidation.errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}

          {qualityValidation.warnings.length > 0 && (
            <ul className="audio-input__quality-list" aria-label="Quality warnings">
              {qualityValidation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}

          {qualityValidation.suggestions.length > 0 && (
            <div className="audio-input__suggestions">
              <strong>Suggestions:</strong>
              <ul aria-label="Improvement suggestions">
                {qualityValidation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Browser Support Warning */}
      {!AudioRecorder.isSupported() && (
        <div
          className="audio-input__warning"
          role="alert"
        >
          <span className="audio-input__icon" aria-hidden="true">⚠️</span>
          <span>
            Audio recording is not supported in your browser. Please use a modern browser
            like Chrome, Firefox, or Safari.
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styled Audio Input Component (with default styles)
// ============================================================================

export function StyledAudioInput(props: AudioInputProps) {
  return (
    <>
      <style jsx>{`
        .audio-input {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #ffffff;
        }

        .audio-input__controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .audio-input__button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
          min-width: 44px;
        }

        .audio-input__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .audio-input__button--start {
          background: #10b981;
          color: white;
        }

        .audio-input__button--start:hover:not(:disabled) {
          background: #059669;
        }

        .audio-input__button--stop {
          background: #ef4444;
          color: white;
        }

        .audio-input__button--stop:hover:not(:disabled) {
          background: #dc2626;
        }

        .audio-input__button--pause,
        .audio-input__button--resume {
          background: #3b82f6;
          color: white;
        }

        .audio-input__button--pause:hover:not(:disabled),
        .audio-input__button--resume:hover:not(:disabled) {
          background: #2563eb;
        }

        .audio-input__button--cancel {
          background: #6b7280;
          color: white;
        }

        .audio-input__button--cancel:hover:not(:disabled) {
          background: #4b5563;
        }

        .audio-input__icon {
          font-size: 1.25rem;
        }

        .audio-input__processing {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          color: #6b7280;
        }

        .audio-input__duration {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .audio-input__duration-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .audio-input__progress-bar {
          width: 100%;
          height: 0.5rem;
          background: #e5e7eb;
          border-radius: 0.25rem;
          overflow: hidden;
        }

        .audio-input__progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.1s linear;
        }

        .audio-input__error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #991b1b;
        }

        .audio-input__warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 0.375rem;
          color: #92400e;
        }

        .audio-input__quality {
          padding: 1rem;
          border-radius: 0.375rem;
        }

        .audio-input__quality--valid {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .audio-input__quality--invalid {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .audio-input__quality-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .audio-input__quality-list {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style: disc;
        }

        .audio-input__suggestions {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid currentColor;
          opacity: 0.8;
        }

        .audio-input__suggestions ul {
          margin: 0.25rem 0;
          padding-left: 1.5rem;
          list-style: disc;
        }
      `}</style>
      <AudioInput {...props} />
    </>
  );
}
