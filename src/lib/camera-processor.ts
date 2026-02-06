/**
 * Camera Input Processing for UNSAID/UNHEARD
 * 
 * This module provides camera access, image capture, preprocessing,
 * text detection, and OCR integration for accessibility features.
 * 
 * Requirements: 4.1, 6.2
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Camera capabilities and constraints
 */
export interface CameraCapabilities {
  /** Available camera devices */
  devices: MediaDeviceInfo[];
  /** Whether camera access is supported */
  isSupported: boolean;
  /** Whether multiple cameras are available */
  hasMultipleCameras: boolean;
  /** Supported resolutions */
  supportedResolutions: CameraResolution[];
}

/**
 * Camera resolution configuration
 */
export interface CameraResolution {
  width: number;
  height: number;
  label: string;
}

/**
 * Camera configuration options
 */
export interface CameraConfig {
  /** Preferred camera device ID */
  deviceId?: string;
  /** Preferred facing mode ('user' for front, 'environment' for back) */
  facingMode?: 'user' | 'environment';
  /** Target resolution */
  resolution?: CameraResolution;
  /** Enable auto-focus */
  autoFocus?: boolean;
  /** Enable flash/torch */
  flash?: boolean;
}

/**
 * Captured image data
 */
export interface CapturedImage {
  /** Image blob */
  blob: Blob;
  /** Image data URL for preview */
  dataUrl: string;
  /** Image dimensions */
  width: number;
  height: number;
  /** Capture timestamp */
  timestamp: Date;
  /** Camera device used */
  deviceId?: string;
  /** Image format (e.g., 'image/jpeg', 'image/png') */
  format: string;
  /** File size in bytes */
  size: number;
}

/**
 * Image preprocessing result
 */
export interface PreprocessedImage {
  /** Processed image blob */
  blob: Blob;
  /** Processed image data URL */
  dataUrl: string;
  /** Image dimensions */
  width: number;
  height: number;
  /** Processing operations applied */
  operations: string[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Quality metrics */
  quality: ImageQualityMetrics;
}

/**
 * Image quality metrics
 */
export interface ImageQualityMetrics {
  /** Brightness level (0-1) */
  brightness: number;
  /** Contrast level (0-1) */
  contrast: number;
  /** Sharpness score (0-1) */
  sharpness: number;
  /** Whether image is blurry */
  isBlurry: boolean;
  /** Whether image is too dark */
  isTooDark: boolean;
  /** Whether image is too bright */
  isTooBright: boolean;
  /** Overall quality score (0-1) */
  qualityScore: number;
}

/**
 * Text detection result
 */
export interface TextDetectionResult {
  /** Whether text was detected */
  hasText: boolean;
  /** Detected text regions */
  regions: TextRegion[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Text region in image
 */
export interface TextRegion {
  /** Bounding box coordinates */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score for this region (0-1) */
  confidence: number;
  /** Estimated text orientation in degrees */
  orientation?: number;
}

/**
 * OCR extraction result
 */
export interface OCRResult {
  /** Extracted text */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Text blocks with positioning */
  blocks: TextBlock[];
  /** Language detected */
  language?: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Warnings or issues */
  warnings: string[];
}

/**
 * Text block with positioning and metadata
 */
export interface TextBlock {
  /** Text content */
  text: string;
  /** Bounding box */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score (0-1) */
  confidence: number;
  /** Text lines within block */
  lines: TextLine[];
}

/**
 * Text line within a block
 */
export interface TextLine {
  /** Line text */
  text: string;
  /** Bounding box */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score (0-1) */
  confidence: number;
  /** Individual words */
  words: TextWord[];
}

/**
 * Individual word
 */
export interface TextWord {
  /** Word text */
  text: string;
  /** Bounding box */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Camera state
 */
export type CameraState =
  | 'idle'
  | 'requesting-permission'
  | 'ready'
  | 'capturing'
  | 'processing'
  | 'error';

// ============================================================================
// Camera Access and Management
// ============================================================================

/**
 * Checks if camera access is supported in the browser
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    navigator.mediaDevices.enumerateDevices
  );
}

/**
 * Gets available camera devices
 */
export async function getCameraDevices(): Promise<MediaDeviceInfo[]> {
  if (!isCameraSupported()) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error enumerating camera devices:', error);
    return [];
  }
}

/**
 * Gets camera capabilities
 */
export async function getCameraCapabilities(): Promise<CameraCapabilities> {
  const isSupported = isCameraSupported();
  const devices = isSupported ? await getCameraDevices() : [];

  // Common resolutions for camera capture
  const supportedResolutions: CameraResolution[] = [
    { width: 640, height: 480, label: 'VGA (640x480)' },
    { width: 1280, height: 720, label: 'HD (1280x720)' },
    { width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
    { width: 3840, height: 2160, label: '4K (3840x2160)' },
  ];

  return {
    devices,
    isSupported,
    hasMultipleCameras: devices.length > 1,
    supportedResolutions,
  };
}

/**
 * Requests camera permission and returns media stream
 */
export async function requestCameraAccess(
  config: CameraConfig = {}
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error('Camera access is not supported in this browser');
  }

  const videoConstraints: MediaTrackConstraints = {
    facingMode: config.facingMode || 'environment',
    width: config.resolution?.width || { ideal: 1920 },
    height: config.resolution?.height || { ideal: 1080 },
  };

  // Add device ID if specified
  if (config.deviceId) {
    videoConstraints.deviceId = { exact: config.deviceId };
  }

  const constraints: MediaStreamConstraints = {
    video: videoConstraints,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera device found');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use');
      }
    }
    throw error;
  }
}

/**
 * Stops camera stream and releases resources
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

// ============================================================================
// Image Capture
// ============================================================================

/**
 * Captures image from video stream
 */
export async function captureImageFromStream(
  videoElement: HTMLVideoElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.92
): Promise<CapturedImage> {
  // Create canvas with video dimensions
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      format,
      quality
    );
  });

  // Create data URL for preview
  const dataUrl = canvas.toDataURL(format, quality);

  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    timestamp: new Date(),
    format,
    size: blob.size,
  };
}

/**
 * Captures image from file input
 */
export async function captureImageFromFile(file: File): Promise<CapturedImage> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  // Create data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // Get image dimensions
  const dimensions = await getImageDimensions(dataUrl);

  return {
    blob: file,
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
    timestamp: new Date(),
    format: file.type,
    size: file.size,
  };
}

/**
 * Gets image dimensions from data URL
 */
function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

// ============================================================================
// Image Preprocessing
// ============================================================================

/**
 * Analyzes image quality metrics
 */
export async function analyzeImageQuality(
  imageData: ImageData
): Promise<ImageQualityMetrics> {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  // Calculate brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Perceived brightness formula
    totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const brightness = totalBrightness / pixelCount;

  // Calculate contrast (simplified using standard deviation)
  let sumSquaredDiff = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelBrightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    sumSquaredDiff += Math.pow(pixelBrightness - brightness, 2);
  }
  const contrast = Math.sqrt(sumSquaredDiff / pixelCount);

  // Estimate sharpness using Laplacian variance
  const sharpness = estimateSharpness(imageData);

  // Quality thresholds
  const isTooDark = brightness < 0.2;
  const isTooBright = brightness > 0.9;
  const isBlurry = sharpness < 0.3;

  // Calculate overall quality score
  let qualityScore = 1.0;

  if (isTooDark || isTooBright) {
    qualityScore *= 0.5;
  } else if (brightness < 0.3 || brightness > 0.8) {
    qualityScore *= 0.7;
  }

  if (isBlurry) {
    qualityScore *= 0.6;
  }

  if (contrast < 0.1) {
    qualityScore *= 0.7;
  }

  return {
    brightness,
    contrast,
    sharpness,
    isBlurry,
    isTooDark,
    isTooBright,
    qualityScore,
  };
}

/**
 * Estimates image sharpness using Laplacian variance
 */
function estimateSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;

  // Convert to grayscale and apply Laplacian operator
  let variance = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Get grayscale value
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Get neighbors
      const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
      const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
      const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
      const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;

      // Laplacian: center * 4 - (top + bottom + left + right)
      const laplacian = Math.abs(center * 4 - (top + bottom + left + right));
      variance += laplacian * laplacian;
      count++;
    }
  }

  // Normalize variance to 0-1 range
  const normalizedVariance = Math.sqrt(variance / count) / 255;
  return Math.min(normalizedVariance * 2, 1.0); // Scale to make more meaningful
}

/**
 * Preprocesses image for OCR
 */
export async function preprocessImageForOCR(
  capturedImage: CapturedImage
): Promise<PreprocessedImage> {
  const startTime = Date.now();
  const operations: string[] = [];

  // Create image element
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = capturedImage.dataUrl;
  });

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Get image data
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Analyze quality
  const quality = await analyzeImageQuality(imageData);

  // Apply preprocessing based on quality
  if (quality.isTooDark) {
    imageData = adjustBrightness(imageData, 1.5);
    operations.push('brightness-increase');
  } else if (quality.isTooBright) {
    imageData = adjustBrightness(imageData, 0.7);
    operations.push('brightness-decrease');
  }

  if (quality.contrast < 0.15) {
    imageData = adjustContrast(imageData, 1.3);
    operations.push('contrast-increase');
  }

  // Convert to grayscale for better OCR
  imageData = convertToGrayscale(imageData);
  operations.push('grayscale');

  // Apply sharpening if image is blurry
  if (quality.isBlurry) {
    imageData = sharpenImage(imageData);
    operations.push('sharpen');
  }

  // Put processed image data back
  ctx.putImageData(imageData, 0, 0);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create processed image blob'));
        }
      },
      'image/png'
    );
  });

  const dataUrl = canvas.toDataURL('image/png');
  const processingTime = Date.now() - startTime;

  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    operations,
    processingTime,
    quality,
  };
}

/**
 * Adjusts image brightness
 */
function adjustBrightness(imageData: ImageData, factor: number): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * factor);
    data[i + 1] = Math.min(255, data[i + 1] * factor);
    data[i + 2] = Math.min(255, data[i + 2] * factor);
  }
  return imageData;
}

/**
 * Adjusts image contrast
 */
function adjustContrast(imageData: ImageData, factor: number): ImageData {
  const data = imageData.data;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
  }
  return imageData;
}

/**
 * Converts image to grayscale
 */
function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return imageData;
}

/**
 * Sharpens image using convolution
 */
function sharpenImage(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  return new ImageData(output, width, height);
}

// ============================================================================
// Text Detection
// ============================================================================

/**
 * Detects text regions in image (simplified implementation)
 * 
 * Note: This is a basic implementation. In production, you would use:
 * - Tesseract.js for client-side OCR
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 */
export async function detectTextRegions(
  imageData: ImageData
): Promise<TextDetectionResult> {
  const startTime = Date.now();

  // Placeholder implementation
  // In production, this would use actual text detection algorithms
  const regions: TextRegion[] = [];
  const hasText = false;
  const confidence = 0.0;

  const processingTime = Date.now() - startTime;

  return {
    hasText,
    regions,
    confidence,
    processingTime,
  };
}

// ============================================================================
// OCR Integration
// ============================================================================

/**
 * Extracts text from image using OCR
 * 
 * Note: This is a placeholder implementation. In production, you would integrate:
 * - Tesseract.js for client-side OCR
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 * - Gemini Vision API
 */
export async function extractTextFromImage(
  preprocessedImage: PreprocessedImage
): Promise<OCRResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // Placeholder implementation
  // In production, this would call actual OCR service
  warnings.push('OCR integration pending - using placeholder');

  const processingTime = Date.now() - startTime;

  return {
    text: '[OCR text extraction pending - integration with Tesseract.js or Gemini Vision API required]',
    confidence: 0.0,
    blocks: [],
    processingTime,
    warnings,
  };
}

/**
 * Extracts and simplifies text from image
 * 
 * This combines OCR with text simplification for accessibility
 */
export async function extractAndSimplifyText(
  capturedImage: CapturedImage
): Promise<{
  originalText: string;
  simplifiedText: string;
  confidence: number;
  warnings: string[];
}> {
  // Preprocess image
  const preprocessed = await preprocessImageForOCR(capturedImage);

  // Extract text
  const ocrResult = await extractTextFromImage(preprocessed);

  // Placeholder for text simplification
  // In production, this would use Gemini AI for simplification
  const simplifiedText = ocrResult.text;

  return {
    originalText: ocrResult.text,
    simplifiedText,
    confidence: ocrResult.confidence,
    warnings: [
      ...ocrResult.warnings,
      'Text simplification pending - Gemini AI integration required',
    ],
  };
}

// ============================================================================
// Camera Manager Class
// ============================================================================

/**
 * Manages camera access, capture, and processing
 */
export class CameraManager {
  private stream: MediaStream | null = null;
  private state: CameraState = 'idle';
  private config: CameraConfig;

  constructor(config: CameraConfig = {}) {
    this.config = {
      facingMode: config.facingMode || 'environment',
      resolution: config.resolution || { width: 1920, height: 1080, label: 'Full HD' },
      autoFocus: config.autoFocus ?? true,
      flash: config.flash ?? false,
      ...config,
    };
  }

  /**
   * Gets current camera state
   */
  getState(): CameraState {
    return this.state;
  }

  /**
   * Checks if camera is ready
   */
  isReady(): boolean {
    return this.state === 'ready' && this.stream !== null;
  }

  /**
   * Initializes camera and requests permission
   */
  async initialize(): Promise<MediaStream> {
    if (this.stream) {
      return this.stream;
    }

    try {
      this.state = 'requesting-permission';
      this.stream = await requestCameraAccess(this.config);
      this.state = 'ready';
      return this.stream;
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Captures image from camera
   */
  async captureImage(
    videoElement: HTMLVideoElement,
    format: 'image/jpeg' | 'image/png' = 'image/jpeg',
    quality: number = 0.92
  ): Promise<CapturedImage> {
    if (!this.isReady()) {
      throw new Error('Camera is not ready');
    }

    try {
      this.state = 'capturing';
      const image = await captureImageFromStream(videoElement, format, quality);
      this.state = 'ready';
      return image;
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Captures and processes image for OCR
   */
  async captureAndProcess(
    videoElement: HTMLVideoElement
  ): Promise<{
    captured: CapturedImage;
    preprocessed: PreprocessedImage;
    ocr: OCRResult;
  }> {
    if (!this.isReady()) {
      throw new Error('Camera is not ready');
    }

    try {
      this.state = 'processing';

      // Capture image
      const captured = await this.captureImage(videoElement);

      // Preprocess for OCR
      const preprocessed = await preprocessImageForOCR(captured);

      // Extract text
      const ocr = await extractTextFromImage(preprocessed);

      this.state = 'ready';

      return {
        captured,
        preprocessed,
        ocr,
      };
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Stops camera and releases resources
   */
  stop(): void {
    if (this.stream) {
      stopCameraStream(this.stream);
      this.stream = null;
    }
    this.state = 'idle';
  }

  /**
   * Updates camera configuration
   */
  updateConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets current configuration
   */
  getConfig(): Readonly<CameraConfig> {
    return { ...this.config };
  }

  /**
   * Gets current media stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }
}
