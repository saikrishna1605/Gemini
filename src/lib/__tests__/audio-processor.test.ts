/**
 * Unit Tests for Audio Processor
 * 
 * Tests audio quality detection, validation, preprocessing,
 * and recording functionality.
 * 
 * Requirements: 2.1, 3.1
 */

import {
  analyzeAudioQuality,
  validateAudioQuality,
  preprocessAudioForAI,
  AudioRecorder,
  AudioQualityMetrics,
} from '../audio-processor';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Web Audio API
class MockAudioContext {
  sampleRate = 16000;
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
    };
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer) {
    // Create a mock audio buffer with some test data
    const buffer = new MockAudioBuffer(1, 16000, 16000); // 1 second of audio
    const channelData = buffer.getChannelData(0);
    
    // Fill with test audio data (sine wave)
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    
    return buffer;
  }

  async close() {
    // Mock close
  }
}

class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  duration: number;
  private channelData: Float32Array[];

  constructor(channels: number, length: number, sampleRate: number) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = Array.from({ length: channels }, () => new Float32Array(length));
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }
}

class MockOfflineAudioContext extends MockAudioContext {
  async startRendering() {
    return new MockAudioBuffer(1, 16000, 16000);
  }
}

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType = 'audio/webm';

  static isTypeSupported(type: string) {
    return type.includes('audio/webm');
  }

  start() {
    this.state = 'recording';
    // Simulate data available after a short delay
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock audio data'], { type: 'audio/webm' }),
        });
      }
    }, 10);
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      setTimeout(() => this.onstop!(), 10);
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Set up global mocks
(global as any).AudioContext = MockAudioContext;
(global as any).OfflineAudioContext = MockOfflineAudioContext;
(global as any).MediaRecorder = MockMediaRecorder;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
});

// Mock Blob.arrayBuffer if not available
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function() {
    return new ArrayBuffer(this.size);
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function createMockAudioBuffer(
  duration: number = 1.0,
  sampleRate: number = 16000,
  fillFunction?: (data: Float32Array) => void
): AudioBuffer {
  const length = Math.floor(duration * sampleRate);
  const buffer = new MockAudioBuffer(1, length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  if (fillFunction) {
    fillFunction(channelData);
  } else {
    // Default: sine wave at 440 Hz with moderate volume
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
    }
  }
  
  return buffer as unknown as AudioBuffer;
}

// ============================================================================
// Audio Quality Analysis Tests
// ============================================================================

describe('analyzeAudioQuality', () => {
  it('should analyze audio with good quality', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000);
    const metrics = await analyzeAudioQuality(buffer);

    expect(metrics).toMatchObject({
      duration: 1.0,
      hasClipping: false,
      isTooQuiet: false,
      isTooLoud: false,
    });
    expect(metrics.qualityScore).toBeGreaterThan(0.5);
    expect(metrics.averageVolume).toBeGreaterThan(0);
    expect(metrics.peakVolume).toBeGreaterThan(0);
    expect(metrics.snr).toBeGreaterThan(0);
  });

  it('should detect audio that is too quiet', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      // Very quiet audio
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.005;
      }
    });

    const metrics = await analyzeAudioQuality(buffer);

    expect(metrics.isTooQuiet).toBe(true);
    expect(metrics.averageVolume).toBeLessThan(0.01);
    expect(metrics.qualityScore).toBeLessThan(0.7);
  });

  it('should detect audio that is too loud with clipping', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      // Very loud audio with clipping
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 1.2;
        // Clip values
        if (data[i] > 1.0) data[i] = 1.0;
        if (data[i] < -1.0) data[i] = -1.0;
      }
    });

    const metrics = await analyzeAudioQuality(buffer);

    expect(metrics.isTooLoud).toBe(true);
    expect(metrics.hasClipping).toBe(true);
    expect(metrics.peakVolume).toBeGreaterThan(0.95);
    expect(metrics.qualityScore).toBeLessThan(0.8);
  });

  it('should handle very short audio', async () => {
    const buffer = createMockAudioBuffer(0.1, 16000);
    const metrics = await analyzeAudioQuality(buffer);

    expect(metrics.duration).toBeCloseTo(0.1, 2);
    expect(metrics.qualityScore).toBeGreaterThan(0);
  });

  it('should calculate SNR for noisy audio', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      // Signal with noise
      for (let i = 0; i < data.length; i++) {
        const signal = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
        const noise = (Math.random() - 0.5) * 0.1;
        data[i] = signal + noise;
      }
    });

    const metrics = await analyzeAudioQuality(buffer);

    expect(metrics.snr).toBeGreaterThan(0);
    // With added noise, SNR should be lower than pure signal
    expect(metrics.snr).toBeLessThan(50);
  });
});

// ============================================================================
// Audio Quality Validation Tests
// ============================================================================

describe('validateAudioQuality', () => {
  it('should validate good quality audio', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000);
    const validation = await validateAudioQuality(buffer, 0.5);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.metrics.qualityScore).toBeGreaterThanOrEqual(0.5);
  });

  it('should reject audio that is too quiet', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.005;
      }
    });

    const validation = await validateAudioQuality(buffer, 0.5);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Audio is too quiet');
    expect(validation.suggestions.length).toBeGreaterThan(0);
  });

  it('should reject audio that is too loud', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 1.2;
        if (data[i] > 1.0) data[i] = 1.0;
        if (data[i] < -1.0) data[i] = -1.0;
      }
    });

    const validation = await validateAudioQuality(buffer, 0.5);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Audio is too loud or clipping');
    expect(validation.suggestions.length).toBeGreaterThan(0);
  });

  it('should provide warnings for borderline quality', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      // Slightly low volume
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.03;
      }
    });

    const validation = await validateAudioQuality(buffer, 0.3);

    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.suggestions.length).toBeGreaterThan(0);
  });

  it('should warn about very short audio', async () => {
    const buffer = createMockAudioBuffer(0.3, 16000);
    const validation = await validateAudioQuality(buffer, 0.5);

    expect(validation.warnings).toContain('Audio is very short');
  });

  it('should respect custom quality threshold', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000);
    
    // Should pass with low threshold
    const validation1 = await validateAudioQuality(buffer, 0.3);
    expect(validation1.isValid).toBe(true);
    
    // Might fail with very high threshold
    const validation2 = await validateAudioQuality(buffer, 0.99);
    // Result depends on the exact quality score
    expect(validation2.metrics.qualityScore).toBeLessThan(1.0);
  });
});

// ============================================================================
// Audio Preprocessing Tests
// ============================================================================

describe('preprocessAudioForAI', () => {
  it('should preprocess audio blob for AI services', async () => {
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    
    const preprocessed = await preprocessAudioForAI(mockBlob, 16000);

    expect(preprocessed).toMatchObject({
      format: 'audio/wav',
      sampleRate: 16000,
      channels: 1,
    });
    expect(preprocessed.audioBlob).toBeInstanceOf(Blob);
    expect(preprocessed.duration).toBeGreaterThan(0);
    expect(preprocessed.quality).toBeDefined();
    expect(preprocessed.metadata).toMatchObject({
      originalFormat: 'audio/webm',
      originalSize: mockBlob.size,
    });
    expect(preprocessed.metadata.processingTime).toBeGreaterThan(0);
  });

  it('should include quality metrics in preprocessed audio', async () => {
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    
    const preprocessed = await preprocessAudioForAI(mockBlob);

    expect(preprocessed.quality).toMatchObject({
      snr: expect.any(Number),
      averageVolume: expect.any(Number),
      peakVolume: expect.any(Number),
      hasClipping: expect.any(Boolean),
      isTooQuiet: expect.any(Boolean),
      isTooLoud: expect.any(Boolean),
      qualityScore: expect.any(Number),
      duration: expect.any(Number),
    });
  });

  it('should convert to mono and target sample rate', async () => {
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    
    const preprocessed = await preprocessAudioForAI(mockBlob, 8000);

    expect(preprocessed.channels).toBe(1);
    expect(preprocessed.sampleRate).toBe(8000);
  });
});

// ============================================================================
// AudioRecorder Tests
// ============================================================================

describe('AudioRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check if recording is supported', () => {
    expect(AudioRecorder.isSupported()).toBe(true);
  });

  it('should initialize with default config', () => {
    const recorder = new AudioRecorder();
    expect(recorder.getState()).toBe('idle');
    expect(recorder.getRecordingDuration()).toBe(0);
  });

  it('should initialize with custom config', () => {
    const recorder = new AudioRecorder({
      maxDuration: 60,
      minDuration: 1,
      sampleRate: 48000,
      channels: 2,
    });
    expect(recorder.getState()).toBe('idle');
  });

  it('should start recording', async () => {
    const recorder = new AudioRecorder();
    
    await recorder.startRecording();
    
    expect(recorder.getState()).toBe('recording');
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    
    recorder.cancelRecording();
  });

  it('should not start recording if already recording', async () => {
    const recorder = new AudioRecorder();
    
    await recorder.startRecording();
    
    await expect(recorder.startRecording()).rejects.toThrow('Already recording');
    
    recorder.cancelRecording();
  });

  it('should stop recording and return audio blob', async () => {
    const recorder = new AudioRecorder({ minDuration: 0.01 });
    
    await recorder.startRecording();
    
    // Wait a bit to ensure minimum duration
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const blob = await recorder.stopRecording();
    
    expect(blob).toBeInstanceOf(Blob);
    expect(recorder.getState()).toBe('idle');
  });

  it('should reject recording shorter than minimum duration', async () => {
    const recorder = new AudioRecorder({ minDuration: 10 });
    
    await recorder.startRecording();
    
    // Try to stop immediately
    await expect(recorder.stopRecording()).rejects.toThrow('Recording too short');
  });

  it('should pause and resume recording', async () => {
    const recorder = new AudioRecorder();
    
    await recorder.startRecording();
    expect(recorder.getState()).toBe('recording');
    
    recorder.pauseRecording();
    expect(recorder.getState()).toBe('paused');
    
    recorder.resumeRecording();
    expect(recorder.getState()).toBe('recording');
    
    recorder.cancelRecording();
  });

  it('should cancel recording', async () => {
    const recorder = new AudioRecorder();
    
    await recorder.startRecording();
    expect(recorder.getState()).toBe('recording');
    
    recorder.cancelRecording();
    expect(recorder.getState()).toBe('idle');
    expect(recorder.getRecordingDuration()).toBe(0);
  });

  it('should track recording duration', async () => {
    const recorder = new AudioRecorder();
    
    await recorder.startRecording();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = recorder.getRecordingDuration();
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1);
    
    recorder.cancelRecording();
  });

  it('should handle errors during recording start', async () => {
    // Mock getUserMedia to fail
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied')
    );
    
    const recorder = new AudioRecorder();
    
    await expect(recorder.startRecording()).rejects.toThrow('Permission denied');
    expect(recorder.getState()).toBe('error');
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty audio buffer', async () => {
    const buffer = createMockAudioBuffer(0.001, 16000, (data) => {
      // Fill with zeros (silence)
      data.fill(0);
    });

    const metrics = await analyzeAudioQuality(buffer);
    
    expect(metrics.isTooQuiet).toBe(true);
    expect(metrics.averageVolume).toBe(0);
    expect(metrics.peakVolume).toBe(0);
  });

  it('should handle audio with extreme values', async () => {
    const buffer = createMockAudioBuffer(1.0, 16000, (data) => {
      // Alternating extreme values
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 1.0 : -1.0;
      }
    });

    const metrics = await analyzeAudioQuality(buffer);
    
    expect(metrics.peakVolume).toBe(1.0);
    expect(metrics.hasClipping).toBe(true);
  });

  it('should handle different sample rates', async () => {
    const rates = [8000, 16000, 44100, 48000];
    
    for (const rate of rates) {
      const buffer = createMockAudioBuffer(1.0, rate);
      const metrics = await analyzeAudioQuality(buffer);
      
      expect(metrics.duration).toBeCloseTo(1.0, 1);
    }
  });
});
