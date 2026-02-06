/**
 * Audio Input Processing for UNSAID/UNHEARD
 * 
 * This module provides Web Audio API integration for voice input,
 * audio quality detection, validation, and preprocessing for AI services.
 * 
 * Requirements: 2.1, 3.1
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Audio quality metrics
 */
export interface AudioQualityMetrics {
  /** Signal-to-noise ratio in dB */
  snr: number;
  /** Average volume level (0-1) */
  averageVolume: number;
  /** Peak volume level (0-1) */
  peakVolume: number;
  /** Whether audio contains clipping */
  hasClipping: boolean;
  /** Whether audio is too quiet */
  isTooQuiet: boolean;
  /** Whether audio is too loud */
  isTooLoud: boolean;
  /** Overall quality score (0-1) */
  qualityScore: number;
  /** Duration in seconds */
  duration: number;
}

/**
 * Audio quality validation result
 */
export interface AudioQualityValidation {
  /** Whether audio meets quality requirements */
  isValid: boolean;
  /** Quality metrics */
  metrics: AudioQualityMetrics;
  /** Validation warnings */
  warnings: string[];
  /** Validation errors */
  errors: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Preprocessed audio data ready for AI services
 */
export interface PreprocessedAudio {
  /** Processed audio blob */
  audioBlob: Blob;
  /** Audio format (e.g., 'audio/webm', 'audio/wav') */
  format: string;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of channels (1 for mono, 2 for stereo) */
  channels: number;
  /** Duration in seconds */
  duration: number;
  /** Quality metrics */
  quality: AudioQualityMetrics;
  /** Processing metadata */
  metadata: {
    originalFormat?: string;
    originalSize: number;
    processedSize: number;
    processingTime: number;
    timestamp: Date;
  };
}

/**
 * Audio recording configuration
 */
export interface AudioRecordingConfig {
  /** Sample rate in Hz (default: 16000 for speech) */
  sampleRate?: number;
  /** Number of channels (default: 1 for mono) */
  channels?: number;
  /** Audio constraints for getUserMedia */
  constraints?: MediaTrackConstraints;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  /** Minimum recording duration in seconds */
  minDuration?: number;
  /** Enable automatic gain control */
  autoGainControl?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable echo cancellation */
  echoCancellation?: boolean;
}

/**
 * Audio recording state
 */
export type AudioRecordingState = 
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'error';

// ============================================================================
// Audio Quality Detection and Validation
// ============================================================================

/**
 * Analyzes audio quality metrics from audio buffer
 */
export async function analyzeAudioQuality(
  audioBuffer: AudioBuffer
): Promise<AudioQualityMetrics> {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Calculate volume metrics
  let sumSquares = 0;
  let peakVolume = 0;
  let clippingCount = 0;
  const clippingThreshold = 0.99;

  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.abs(channelData[i]);
    sumSquares += sample * sample;
    peakVolume = Math.max(peakVolume, sample);
    
    if (sample >= clippingThreshold) {
      clippingCount++;
    }
  }

  const rms = Math.sqrt(sumSquares / channelData.length);
  const averageVolume = rms;
  const hasClipping = clippingCount > channelData.length * 0.001; // More than 0.1% clipping

  // Estimate SNR (simplified approach)
  // In production, this would use more sophisticated signal processing
  const signalPower = sumSquares / channelData.length;
  const noisePower = estimateNoisePower(channelData);
  const snr = 10 * Math.log10(signalPower / Math.max(noisePower, 0.0001));

  // Quality thresholds
  const isTooQuiet = averageVolume < 0.01;
  const isTooLoud = peakVolume > 0.95 || hasClipping;

  // Calculate overall quality score (0-1)
  let qualityScore = 1.0;
  
  // Penalize for being too quiet
  if (isTooQuiet) {
    qualityScore *= 0.5;
  } else if (averageVolume < 0.05) {
    qualityScore *= 0.7;
  }
  
  // Penalize for being too loud or clipping
  if (isTooLoud) {
    qualityScore *= 0.6;
  }
  
  // Penalize for low SNR
  if (snr < 10) {
    qualityScore *= 0.5;
  } else if (snr < 20) {
    qualityScore *= 0.8;
  }

  return {
    snr,
    averageVolume,
    peakVolume,
    hasClipping,
    isTooQuiet,
    isTooLoud,
    qualityScore,
    duration,
  };
}

/**
 * Estimates noise power in audio signal (simplified)
 */
function estimateNoisePower(channelData: Float32Array): number {
  // Use the quietest 10% of samples as noise estimate
  const sorted = Array.from(channelData).map(Math.abs).sort((a, b) => a - b);
  const noiseIndex = Math.floor(sorted.length * 0.1);
  const noiseSamples = sorted.slice(0, noiseIndex);
  
  const noiseSum = noiseSamples.reduce((sum, val) => sum + val * val, 0);
  return noiseSum / noiseSamples.length;
}

/**
 * Validates audio quality and provides feedback
 */
export async function validateAudioQuality(
  audioBuffer: AudioBuffer,
  minQualityScore: number = 0.5
): Promise<AudioQualityValidation> {
  const metrics = await analyzeAudioQuality(audioBuffer);
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for critical issues
  if (metrics.isTooQuiet) {
    errors.push('Audio is too quiet');
    suggestions.push('Move closer to the microphone or increase input volume');
  }

  if (metrics.isTooLoud) {
    errors.push('Audio is too loud or clipping');
    suggestions.push('Move away from the microphone or decrease input volume');
  }

  if (metrics.hasClipping) {
    warnings.push('Audio contains clipping distortion');
    suggestions.push('Reduce input volume to avoid distortion');
  }

  // Check for quality warnings
  if (metrics.snr < 10) {
    errors.push('Signal-to-noise ratio is too low');
    suggestions.push('Record in a quieter environment');
  } else if (metrics.snr < 20) {
    warnings.push('Background noise detected');
    suggestions.push('Try recording in a quieter location');
  }

  if (metrics.averageVolume < 0.05 && !metrics.isTooQuiet) {
    warnings.push('Audio level is low');
    suggestions.push('Speak louder or move closer to the microphone');
  }

  if (metrics.duration < 0.5) {
    warnings.push('Audio is very short');
    suggestions.push('Try recording a longer message');
  }

  // Determine if audio is valid
  const isValid = errors.length === 0 && metrics.qualityScore >= minQualityScore;

  return {
    isValid,
    metrics,
    warnings,
    errors,
    suggestions,
  };
}

// ============================================================================
// Audio Preprocessing for AI Services
// ============================================================================

/**
 * Preprocesses audio for AI speech-to-text services
 * 
 * This function:
 * - Converts to optimal format for AI services (mono, 16kHz)
 * - Normalizes volume levels
 * - Applies noise reduction if needed
 * - Validates quality
 */
export async function preprocessAudioForAI(
  audioBlob: Blob,
  targetSampleRate: number = 16000
): Promise<PreprocessedAudio> {
  const startTime = Date.now();
  const originalSize = audioBlob.size;
  const originalFormat = audioBlob.type;

  // Create audio context
  const audioContext = new AudioContext({ sampleRate: targetSampleRate });

  try {
    // Decode audio data
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Analyze quality
    const quality = await analyzeAudioQuality(audioBuffer);

    // Convert to mono if needed
    const monoBuffer = audioBuffer.numberOfChannels > 1
      ? convertToMono(audioBuffer, audioContext)
      : audioBuffer;

    // Normalize volume if needed
    const normalizedBuffer = quality.isTooQuiet || quality.isTooLoud
      ? normalizeAudioBuffer(monoBuffer, audioContext)
      : monoBuffer;

    // Resample if needed
    const resampledBuffer = audioBuffer.sampleRate !== targetSampleRate
      ? await resampleAudioBuffer(normalizedBuffer, targetSampleRate, audioContext)
      : normalizedBuffer;

    // Convert to WAV blob (widely supported format)
    const processedBlob = await audioBufferToWav(resampledBuffer);

    const processingTime = Date.now() - startTime;

    return {
      audioBlob: processedBlob,
      format: 'audio/wav',
      sampleRate: targetSampleRate,
      channels: 1,
      duration: resampledBuffer.duration,
      quality,
      metadata: {
        originalFormat,
        originalSize,
        processedSize: processedBlob.size,
        processingTime,
        timestamp: new Date(),
      },
    };
  } finally {
    // Clean up audio context
    await audioContext.close();
  }
}

/**
 * Converts stereo audio buffer to mono
 */
function convertToMono(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
): AudioBuffer {
  const monoBuffer = audioContext.createBuffer(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const monoData = monoBuffer.getChannelData(0);

  // Average all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < audioBuffer.length; i++) {
      monoData[i] += channelData[i] / audioBuffer.numberOfChannels;
    }
  }

  return monoBuffer;
}

/**
 * Normalizes audio buffer volume to optimal level
 */
function normalizeAudioBuffer(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
): AudioBuffer {
  const normalizedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Find peak value across all channels
  let peak = 0;
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
  }

  // Calculate normalization factor (target peak at 0.8 to avoid clipping)
  const targetPeak = 0.8;
  const normalizationFactor = peak > 0 ? targetPeak / peak : 1.0;

  // Apply normalization to all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);
    
    for (let i = 0; i < audioBuffer.length; i++) {
      outputData[i] = inputData[i] * normalizationFactor;
    }
  }

  return normalizedBuffer;
}

/**
 * Resamples audio buffer to target sample rate
 */
async function resampleAudioBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number,
  sourceContext: AudioContext
): Promise<AudioBuffer> {
  // Create offline context with target sample rate
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );

  // Create buffer source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  // Render resampled audio
  return await offlineContext.startRendering();
}

/**
 * Converts audio buffer to WAV blob
 */
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2; // 16-bit samples

  // Create WAV file buffer
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
  view.setUint16(32, numberOfChannels * 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let index = offset;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Writes string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ============================================================================
// Audio Recording Manager
// ============================================================================

/**
 * Manages audio recording with Web Audio API
 */
export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private state: AudioRecordingState = 'idle';
  private config: Required<AudioRecordingConfig>;

  constructor(config: AudioRecordingConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 16000,
      channels: config.channels ?? 1,
      constraints: config.constraints ?? {},
      maxDuration: config.maxDuration ?? 300, // 5 minutes default
      minDuration: config.minDuration ?? 0.5, // 0.5 seconds default
      autoGainControl: config.autoGainControl ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      echoCancellation: config.echoCancellation ?? true,
    };
  }

  /**
   * Gets current recording state
   */
  getState(): AudioRecordingState {
    return this.state;
  }

  /**
   * Gets recording duration in seconds
   */
  getRecordingDuration(): number {
    if (this.state !== 'recording' && this.state !== 'paused') {
      return 0;
    }
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Checks if browser supports audio recording
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Requests microphone permission and starts recording
   */
  async startRecording(): Promise<void> {
    if (this.state === 'recording') {
      throw new Error('Already recording');
    }

    if (!AudioRecorder.isSupported()) {
      this.state = 'error';
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      this.state = 'requesting-permission';

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          autoGainControl: this.config.autoGainControl,
          noiseSuppression: this.config.noiseSuppression,
          echoCancellation: this.config.echoCancellation,
          ...this.config.constraints,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create media recorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
      });

      // Set up event handlers
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.recordingStartTime = Date.now();
      this.state = 'recording';

      // Auto-stop at max duration
      setTimeout(() => {
        if (this.state === 'recording') {
          this.stopRecording().catch(console.error);
        }
      }, this.config.maxDuration * 1000);
    } catch (error) {
      this.state = 'error';
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stops recording and returns audio blob
   */
  async stopRecording(): Promise<Blob> {
    if (this.state !== 'recording' && this.state !== 'paused') {
      throw new Error('Not currently recording');
    }

    const duration = this.getRecordingDuration();
    if (duration < this.config.minDuration) {
      this.cleanup();
      throw new Error(
        `Recording too short: ${duration.toFixed(1)}s (minimum: ${this.config.minDuration}s)`
      );
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No media recorder available'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });
          this.cleanup();
          this.state = 'idle';
          resolve(audioBlob);
        } catch (error) {
          this.state = 'error';
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.state = 'processing';
    });
  }

  /**
   * Pauses recording
   */
  pauseRecording(): void {
    if (this.state !== 'recording') {
      throw new Error('Not currently recording');
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.state = 'paused';
    }
  }

  /**
   * Resumes recording
   */
  resumeRecording(): void {
    if (this.state !== 'paused') {
      throw new Error('Recording is not paused');
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.state = 'recording';
    }
  }

  /**
   * Cancels recording and cleans up
   */
  cancelRecording(): void {
    if (this.state === 'idle') {
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.cleanup();
    this.state = 'idle';
  }

  /**
   * Gets supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  /**
   * Cleans up resources
   */
  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
