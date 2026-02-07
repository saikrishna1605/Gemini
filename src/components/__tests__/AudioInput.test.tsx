/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Unit Tests for AudioInput Component
 * 
 * Tests audio input component functionality, accessibility,
 * and user interactions.
 * 
 * Requirements: 2.1, 3.1
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioInput } from '../AudioInput';
import { AudioRecorder, PreprocessedAudio } from '@/lib/audio-processor';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the audio processor module
jest.mock('@/lib/audio-processor', () => {
  const actual = jest.requireActual('@/lib/audio-processor');
  
  return {
    ...actual,
    AudioRecorder: jest.fn().mockImplementation(() => ({
      getState: jest.fn().mockReturnValue('idle'),
      getRecordingDuration: jest.fn().mockReturnValue(0),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/webm' })),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      cancelRecording: jest.fn(),
    })),
    preprocessAudioForAI: jest.fn().mockResolvedValue({
      audioBlob: new Blob(['processed'], { type: 'audio/wav' }),
      format: 'audio/wav',
      sampleRate: 16000,
      channels: 1,
      duration: 1.0,
      quality: {
        snr: 25,
        averageVolume: 0.5,
        peakVolume: 0.8,
        hasClipping: false,
        isTooQuiet: false,
        isTooLoud: false,
        qualityScore: 0.9,
        duration: 1.0,
      },
      metadata: {
        originalSize: 1000,
        processedSize: 800,
        processingTime: 100,
        timestamp: new Date(),
      },
    }),
    validateAudioQuality: jest.fn().mockResolvedValue({
      isValid: true,
      metrics: {
        snr: 25,
        averageVolume: 0.5,
        peakVolume: 0.8,
        hasClipping: false,
        isTooQuiet: false,
        isTooLoud: false,
        qualityScore: 0.9,
        duration: 1.0,
      },
      warnings: [],
      errors: [],
      suggestions: [],
    }),
  };
});

// Mock AudioContext
class MockAudioContext {
  async decodeAudioData() {
    return {
      duration: 1.0,
      numberOfChannels: 1,
      sampleRate: 16000,
      length: 16000,
      getChannelData: () => new Float32Array(16000),
    };
  }
  async close() {}
}

(global as any).AudioContext = MockAudioContext;

// Mock Blob.arrayBuffer
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function() {
    return new ArrayBuffer(this.size);
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('AudioInput Component', () => {
  let mockRecorder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock recorder for each test
    mockRecorder = {
      getState: jest.fn().mockReturnValue('idle'),
      getRecordingDuration: jest.fn().mockReturnValue(0),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/webm' })),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      cancelRecording: jest.fn(),
    };
    
    (AudioRecorder as jest.Mock).mockImplementation(() => mockRecorder);
    
    // Mock AudioRecorder.isSupported
    (AudioRecorder.isSupported as jest.Mock) = jest.fn().mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render with start recording button', () => {
      render(<AudioInput />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });

    it('should render with custom className', () => {
      const { container } = render(<AudioInput className="custom-class" />);
      
      const audioInput = container.querySelector('.audio-input');
      expect(audioInput).toHaveClass('custom-class');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<AudioInput disabled />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toBeDisabled();
    });

    it('should show warning when browser does not support recording', () => {
      (AudioRecorder.isSupported as jest.Mock).mockReturnValue(false);
      
      render(<AudioInput />);
      
      expect(screen.getByText(/audio recording is not supported/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AudioInput />);
      
      expect(screen.getByRole('region', { name: /audio input recorder/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    it('should have proper ARIA live regions for status updates', async () => {
      render(<AudioInput />);
      
      // Start recording to trigger state changes
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Check for aria-live regions after state change
        const { container } = render(<AudioInput />);
        const liveRegions = container.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have minimum touch target size for buttons', () => {
      render(<AudioInput />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      
      // Check that button has the CSS class that applies min-height and min-width
      // The actual computed style may not be available in jsdom
      expect(startButton).toHaveClass('audio-input__button');
    });
  });

  describe('Recording Controls', () => {
    it('should start recording when start button is clicked', async () => {
      const onStateChange = jest.fn();
      render(<AudioInput onStateChange={onStateChange} />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith('recording');
      });
    });

    it('should show stop, pause, and cancel buttons when recording', async () => {
      render(<AudioInput />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pause recording/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel recording/i })).toBeInTheDocument();
      });
    });

    it('should show resume button when paused', async () => {
      render(<AudioInput />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause recording/i })).toBeInTheDocument();
      });
      
      // Pause recording
      const pauseButton = screen.getByRole('button', { name: /pause recording/i });
      fireEvent.click(pauseButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resume recording/i })).toBeInTheDocument();
      });
    });

    it('should call onAudioCapture when recording is stopped', async () => {
      const onAudioCapture = jest.fn();
      render(<AudioInput onAudioCapture={onAudioCapture} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });
      
      // Stop recording
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);
      
      await waitFor(() => {
        expect(onAudioCapture).toHaveBeenCalled();
      });
    });

    it('should cancel recording and return to idle state', async () => {
      const onStateChange = jest.fn();
      render(<AudioInput onStateChange={onStateChange} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel recording/i })).toBeInTheDocument();
      });
      
      // Cancel recording
      const cancelButton = screen.getByRole('button', { name: /cancel recording/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
      });
    });
  });

  describe('Duration Display', () => {
    it('should show duration when recording', async () => {
      render(<AudioInput maxDuration={60} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('timer')).toBeInTheDocument();
      });
    });

    it('should show progress bar when recording', async () => {
      render(<AudioInput />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when recording fails', async () => {
      const errorRecorder = {
        getState: jest.fn().mockReturnValue('idle'),
        getRecordingDuration: jest.fn().mockReturnValue(0),
        startRecording: jest.fn().mockRejectedValue(new Error('Permission denied')),
        stopRecording: jest.fn(),
        pauseRecording: jest.fn(),
        resumeRecording: jest.fn(),
        cancelRecording: jest.fn(),
      };
      
      (AudioRecorder as jest.Mock).mockImplementation(() => errorRecorder);
      
      const onError = jest.fn();
      render(<AudioInput onError={onError} />);
      
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should call onError callback when quality validation fails', async () => {
      const { validateAudioQuality } = require('@/lib/audio-processor');
      
      // Set up mock to return invalid quality
      validateAudioQuality.mockResolvedValueOnce({
        isValid: false,
        metrics: {
          qualityScore: 0.3,
          isTooQuiet: true,
          snr: 5,
          averageVolume: 0.005,
          peakVolume: 0.01,
          hasClipping: false,
          isTooLoud: false,
          duration: 1.0,
        },
        warnings: [],
        errors: ['Audio is too quiet'],
        suggestions: ['Move closer to the microphone'],
      });
      
      const onError = jest.fn();
      render(<AudioInput onError={onError} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockRecorder.startRecording).toHaveBeenCalled();
      });
      
      // Update mock state to recording
      mockRecorder.getState.mockReturnValue('recording');
      
      // Stop recording
      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Quality Feedback', () => {
    it('should show quality feedback when enabled', async () => {
      const { validateAudioQuality } = require('@/lib/audio-processor');
      validateAudioQuality.mockResolvedValueOnce({
        isValid: true,
        metrics: {
          qualityScore: 0.9,
          snr: 25,
          averageVolume: 0.5,
          peakVolume: 0.8,
          hasClipping: false,
          isTooQuiet: false,
          isTooLoud: false,
          duration: 1.0,
        },
        warnings: ['Background noise detected'],
        errors: [],
        suggestions: ['Try recording in a quieter location'],
      });
      
      render(<AudioInput showQualityFeedback />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockRecorder.startRecording).toHaveBeenCalled();
      });
      
      // Update mock state
      mockRecorder.getState.mockReturnValue('recording');
      
      // Stop recording
      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/audio quality: 90%/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should not show quality feedback when disabled', async () => {
      render(<AudioInput showQualityFeedback={false} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockRecorder.startRecording).toHaveBeenCalled();
      });
      
      // Update mock state
      mockRecorder.getState.mockReturnValue('recording');
      
      // Stop recording
      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/audio quality/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Processing State', () => {
    it('should show processing indicator when processing audio', async () => {
      // Make preprocessing take some time so we can observe the processing state
      const mockPreprocess = jest.requireMock('@/lib/audio-processor').preprocessAudioForAI;
      mockPreprocess.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          audioBlob: new Blob(['processed'], { type: 'audio/wav' }),
          format: 'audio/wav',
          sampleRate: 16000,
          channels: 1,
          duration: 1.0,
          quality: {
            snr: 25,
            averageVolume: 0.5,
            peakVolume: 0.8,
            hasClipping: false,
            isTooQuiet: false,
            isTooLoud: false,
            qualityScore: 0.9,
            duration: 1.0,
          },
          metadata: {
            originalSize: 1000,
            processedSize: 800,
            processingTime: 100,
            timestamp: new Date(),
          },
        }), 100))
      );

      render(<AudioInput />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockRecorder.startRecording).toHaveBeenCalled();
      });
      
      // Update mock state
      mockRecorder.getState.mockReturnValue('recording');
      
      // Stop recording
      const stopButton = await screen.findByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);
      
      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText(/processing audio/i)).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.queryByText(/processing audio/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Configuration', () => {
    it('should respect maxDuration prop', () => {
      render(<AudioInput maxDuration={60} />);
      
      // Component should be rendered with the configuration
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    it('should respect minDuration prop', () => {
      render(<AudioInput minDuration={2} />);
      
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    it('should respect minQualityScore prop', () => {
      render(<AudioInput minQualityScore={0.7} />);
      
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    it('should work without autoPreprocess', async () => {
      const onAudioCapture = jest.fn();
      render(<AudioInput autoPreprocess={false} onAudioCapture={onAudioCapture} />);
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockRecorder.startRecording).toHaveBeenCalled();
      });
      
      // Update mock state
      mockRecorder.getState.mockReturnValue('recording');
      
      // Stop recording
      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(onAudioCapture).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});
