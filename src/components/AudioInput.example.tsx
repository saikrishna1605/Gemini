/**
 * Audio Input Component Examples
 * 
 * Demonstrates various use cases for the AudioInput component
 * in the UNSAID/UNHEARD application.
 * 
 * Requirements: 2.1, 3.1
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState } from 'react';
import { StyledAudioInput } from './AudioInput';
import { useAudioInput } from '@/hooks/useAudioInput';
import { PreprocessedAudio } from '@/lib/audio-processor';

// ============================================================================
// Example 1: Basic Audio Input
// ============================================================================

export function BasicAudioInputExample() {
  const [audioData, setAudioData] = useState<PreprocessedAudio | null>(null);

  return (
    <div>
      <h2>Basic Audio Input</h2>
      <StyledAudioInput
        onAudioCapture={(audio) => {
          console.log('Audio captured:', audio);
          setAudioData(audio);
        }}
        onError={(error) => {
          console.error('Audio error:', error);
        }}
      />
      
      {audioData && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Captured Audio Info:</h3>
          <ul>
            <li>Duration: {audioData.duration.toFixed(2)}s</li>
            <li>Format: {audioData.format}</li>
            <li>Sample Rate: {audioData.sampleRate}Hz</li>
            <li>Quality Score: {(audioData.quality.qualityScore * 100).toFixed(0)}%</li>
            <li>Size: {(audioData.audioBlob.size / 1024).toFixed(2)}KB</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Using the useAudioInput Hook
// ============================================================================

export function AudioInputHookExample() {
  const {
    state,
    duration,
    qualityValidation,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    progressPercentage,
  } = useAudioInput({
    maxDuration: 60,
    minDuration: 1,
    minQualityScore: 0.6,
    onAudioCapture: (audio) => {
      console.log('Audio captured via hook:', audio);
    },
    onError: (error) => {
      console.error('Hook error:', error);
    },
  });

  if (!isSupported) {
    return <div>Audio recording is not supported in your browser.</div>;
  }

  return (
    <div>
      <h2>Audio Input with Hook</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>State:</strong> {state}
      </div>

      {state === 'idle' && (
        <button onClick={startRecording}>Start Recording</button>
      )}

      {state === 'recording' && (
        <>
          <div>Recording: {duration.toFixed(1)}s</div>
          <div>Progress: {progressPercentage.toFixed(0)}%</div>
          <button onClick={stopRecording}>Stop</button>
          <button onClick={pauseRecording}>Pause</button>
          <button onClick={cancelRecording}>Cancel</button>
        </>
      )}

      {state === 'paused' && (
        <>
          <div>Paused at: {duration.toFixed(1)}s</div>
          <button onClick={resumeRecording}>Resume</button>
          <button onClick={stopRecording}>Stop</button>
          <button onClick={cancelRecording}>Cancel</button>
        </>
      )}

      {state === 'processing' && <div>Processing audio...</div>}

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </div>
      )}

      {qualityValidation && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Quality Report:</h3>
          <p>Score: {(qualityValidation.metrics.qualityScore * 100).toFixed(0)}%</p>
          <p>Valid: {qualityValidation.isValid ? 'Yes' : 'No'}</p>
          {qualityValidation.warnings.length > 0 && (
            <div>
              <strong>Warnings:</strong>
              <ul>
                {qualityValidation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Voice Message Recorder
// ============================================================================

export function VoiceMessageRecorder() {
  const [messages, setMessages] = useState<PreprocessedAudio[]>([]);

  const handleAudioCapture = (audio: PreprocessedAudio) => {
    setMessages((prev) => [...prev, audio]);
  };

  return (
    <div>
      <h2>Voice Message Recorder</h2>
      
      <StyledAudioInput
        maxDuration={120}
        minDuration={0.5}
        showQualityFeedback={true}
        onAudioCapture={handleAudioCapture}
      />

      <div style={{ marginTop: '2rem' }}>
        <h3>Recorded Messages ({messages.length})</h3>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              padding: '1rem',
              margin: '0.5rem 0',
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
            }}
          >
            <div>
              <strong>Message {index + 1}</strong>
            </div>
            <div>Duration: {msg.duration.toFixed(2)}s</div>
            <div>Quality: {(msg.quality.qualityScore * 100).toFixed(0)}%</div>
            <audio
              controls
              src={URL.createObjectURL(msg.audioBlob)}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: AAC Voice Input Integration
// ============================================================================

export function AACVoiceInputExample() {
  const [transcription, setTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAudioCapture = async (audio: PreprocessedAudio) => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would send audio to speech-to-text API
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setTranscription('[Transcribed text would appear here]');
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h2>AAC Voice Input</h2>
      <p>Record your voice to convert it to text for AAC communication</p>
      
      <StyledAudioInput
        maxDuration={30}
        minQualityScore={0.7}
        showQualityFeedback={true}
        onAudioCapture={handleAudioCapture}
      />

      {isProcessing && (
        <div style={{ marginTop: '1rem' }}>
          Processing speech-to-text...
        </div>
      )}

      {transcription && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            borderRadius: '0.5rem',
          }}
        >
          <strong>Transcription:</strong>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Live Caption Input
// ============================================================================

export function LiveCaptionInputExample() {
  const [captions, setCaptions] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);

  const handleAudioCapture = async (audio: PreprocessedAudio) => {
    // In a real implementation, this would use streaming speech-to-text
    // For now, we'll simulate adding a caption
    const newCaption = `[${new Date().toLocaleTimeString()}] Audio captured (${audio.duration.toFixed(1)}s)`;
    setCaptions((prev) => [...prev, newCaption]);
  };

  return (
    <div>
      <h2>Live Caption Input</h2>
      <p>Capture audio for real-time captioning</p>
      
      <StyledAudioInput
        maxDuration={10}
        minDuration={0.3}
        showQualityFeedback={false}
        autoPreprocess={true}
        onAudioCapture={handleAudioCapture}
        onStateChange={(state) => setIsLive(state === 'recording')}
      />

      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: isLive ? '#e8f5e9' : '#f5f5f5',
          borderRadius: '0.5rem',
          minHeight: '200px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isLive ? '#4caf50' : '#9e9e9e',
              marginRight: '0.5rem',
            }}
          />
          <strong>{isLive ? 'LIVE' : 'Idle'}</strong>
        </div>

        {captions.length === 0 ? (
          <p style={{ color: '#666' }}>No captions yet. Start recording to begin.</p>
        ) : (
          <div>
            {captions.map((caption, index) => (
              <div
                key={index}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'white',
                  borderRadius: '0.25rem',
                }}
              >
                {caption}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Accessibility-Focused Audio Input
// ============================================================================

export function AccessibleAudioInputExample() {
  const [status, setStatus] = useState<string>('Ready to record');

  return (
    <div>
      <h2>Accessible Audio Input</h2>
      <p>Fully accessible audio recording with screen reader support</p>
      
      {/* Status announcement for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '0.5rem',
        }}
      >
        {status}
      </div>

      <StyledAudioInput
        maxDuration={60}
        showQualityFeedback={true}
        onStateChange={(state) => {
          switch (state) {
            case 'recording':
              setStatus('Recording in progress. Press Stop when finished.');
              break;
            case 'paused':
              setStatus('Recording paused. Press Resume to continue or Stop to finish.');
              break;
            case 'processing':
              setStatus('Processing your audio. Please wait.');
              break;
            case 'idle':
              setStatus('Ready to record. Press Start Recording to begin.');
              break;
            case 'error':
              setStatus('An error occurred. Please try again.');
              break;
          }
        }}
        onAudioCapture={(audio) => {
          setStatus(
            `Recording complete! Duration: ${audio.duration.toFixed(1)} seconds. ` +
            `Quality: ${(audio.quality.qualityScore * 100).toFixed(0)}%.`
          );
        }}
        onError={(error) => {
          setStatus(`Error: ${error.message}. Please try again.`);
        }}
      />
    </div>
  );
}
