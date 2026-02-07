/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Unit Tests for CameraInput Component
 * 
 * Tests camera input component with accessibility features
 * 
 * Requirements: 4.1, 6.2
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock useCameraInput hook
jest.mock('@/hooks/useCameraInput');

import { CameraInput } from '../CameraInput';
import { useCameraInput } from '@/hooks/useCameraInput';

const mockUseCameraInput = useCameraInput as jest.MockedFunction<typeof useCameraInput>;

// Mock Web Speech API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  speaking: false,
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

// Mock SpeechSynthesisUtterance
(global as any).SpeechSynthesisUtterance = class {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
};

// ============================================================================
// Test Helpers
// ============================================================================

function createMockHookReturn(overrides = {}) {
  return {
    state: 'idle' as const,
    isReady: false,
    isCapturing: false,
    isProcessing: false,
    error: null,
    capabilities: {
      devices: [],
      isSupported: true,
      hasMultipleCameras: false,
      supportedResolutions: [],
    },
    videoRef: { current: null },
    capturedImage: null,
    preprocessedImage: null,
    ocrResult: null,
    startCamera: jest.fn(),
    stopCamera: jest.fn(),
    captureImage: jest.fn(),
    captureAndProcess: jest.fn(),
    switchCamera: jest.fn(),
    updateConfig: jest.fn(),
    ...overrides,
  };
}

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('CameraInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraInput.mockReturnValue(createMockHookReturn());
  });

  test('should render camera input component', () => {
    render(<CameraInput />);

    expect(screen.getByRole('region', { name: /camera input/i })).toBeInTheDocument();
  });

  test('should render with custom aria label', () => {
    render(<CameraInput ariaLabel="Custom camera label" />);

    expect(screen.getByRole('region', { name: /custom camera label/i })).toBeInTheDocument();
  });

  test('should render video element', () => {
    render(<CameraInput />);

    const video = screen.getByLabelText(/camera preview/i);
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe('VIDEO');
  });

  test('should apply custom className', () => {
    const { container } = render(<CameraInput className="custom-class" />);

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

// ============================================================================
// Camera State Tests
// ============================================================================

describe('Camera States', () => {
  test('should show start button when camera is idle', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'idle' })
    );

    render(<CameraInput showControls />);

    expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
  });

  test('should show requesting permission message', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'requesting-permission' })
    );

    render(<CameraInput />);

    expect(screen.getByText(/requesting camera permission/i)).toBeInTheDocument();
  });

  test('should show controls when camera is ready', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', isReady: true })
    );

    render(<CameraInput showControls />);

    expect(screen.getByRole('button', { name: /capture.*read text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop camera/i })).toBeInTheDocument();
  });

  test('should show processing overlay when capturing', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'capturing', isCapturing: true })
    );

    render(<CameraInput />);

    expect(screen.getByText(/capturing/i)).toBeInTheDocument();
  });

  test('should show processing overlay when processing', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'processing', isProcessing: true })
    );

    render(<CameraInput />);

    expect(screen.getByText(/processing image/i)).toBeInTheDocument();
  });

  test('should show error message when in error state', () => {
    const error = new Error('Camera permission denied');
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'error', error })
    );

    render(<CameraInput showControls />);

    expect(screen.getByText(/camera error/i)).toBeInTheDocument();
    expect(screen.getByText(/camera permission denied/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Camera Controls Tests
// ============================================================================

describe('Camera Controls', () => {
  test('should call startCamera when start button is clicked', async () => {
    const startCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'idle', startCamera })
    );

    render(<CameraInput showControls />);

    const startButton = screen.getByRole('button', { name: /start camera/i });
    await userEvent.click(startButton);

    expect(startCamera).toHaveBeenCalled();
  });

  test('should call captureAndProcess when capture button is clicked', async () => {
    const captureAndProcess = jest.fn().mockResolvedValue({
      captured: {},
      preprocessed: {},
      ocr: { text: 'Test text', confidence: 0.9 },
    });

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        captureAndProcess,
      })
    );

    render(<CameraInput showControls />);

    const captureButton = screen.getByRole('button', { name: /capture.*read text/i });
    await userEvent.click(captureButton);

    expect(captureAndProcess).toHaveBeenCalled();
  });

  test('should call stopCamera when stop button is clicked', async () => {
    const stopCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        stopCamera,
      })
    );

    render(<CameraInput showControls />);

    const stopButton = screen.getByRole('button', { name: /stop camera/i });
    await userEvent.click(stopButton);

    expect(stopCamera).toHaveBeenCalled();
  });

  test('should show switch camera button when multiple cameras available', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        capabilities: {
          devices: [{}, {}],
          isSupported: true,
          hasMultipleCameras: true,
          supportedResolutions: [],
        },
      })
    );

    render(<CameraInput showControls />);

    expect(screen.getByRole('button', { name: /switch camera/i })).toBeInTheDocument();
  });

  test('should call switchCamera when switch button is clicked', async () => {
    const switchCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        switchCamera,
        capabilities: {
          devices: [{}, {}],
          isSupported: true,
          hasMultipleCameras: true,
          supportedResolutions: [],
        },
      })
    );

    render(<CameraInput showControls />);

    const switchButton = screen.getByRole('button', { name: /switch camera/i });
    await userEvent.click(switchButton);

    expect(switchCamera).toHaveBeenCalled();
  });

  test('should disable controls when capturing', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'capturing',
        isReady: true,
        isCapturing: true,
      })
    );

    render(<CameraInput showControls />);

    const captureButton = screen.getByRole('button', { name: /capture.*read text/i });
    expect(captureButton).toBeDisabled();
  });

  test('should hide controls when showControls is false', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', isReady: true })
    );

    render(<CameraInput showControls={false} />);

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Keyboard Navigation Tests
// ============================================================================

describe('Keyboard Navigation', () => {
  test('should start camera on Space key when idle', () => {
    const startCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'idle', startCamera })
    );

    const { container } = render(<CameraInput />);
    const cameraInput = container.querySelector('.camera-input');

    fireEvent.keyDown(cameraInput!, { key: ' ' });

    expect(startCamera).toHaveBeenCalled();
  });

  test('should capture on Enter key when ready', async () => {
    const captureAndProcess = jest.fn().mockResolvedValue({
      captured: {},
      preprocessed: {},
      ocr: { text: 'Test', confidence: 0.9 },
    });

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        captureAndProcess,
      })
    );

    const { container } = render(<CameraInput />);
    const cameraInput = container.querySelector('.camera-input');

    fireEvent.keyDown(cameraInput!, { key: 'Enter' });

    await waitFor(() => {
      expect(captureAndProcess).toHaveBeenCalled();
    });
  });

  test('should stop camera on Escape key', () => {
    const stopCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        stopCamera,
      })
    );

    const { container } = render(<CameraInput />);
    const cameraInput = container.querySelector('.camera-input');

    fireEvent.keyDown(cameraInput!, { key: 'Escape' });

    expect(stopCamera).toHaveBeenCalled();
  });

  test('should switch camera on Ctrl+S', async () => {
    const switchCamera = jest.fn();
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        switchCamera,
      })
    );

    const { container } = render(<CameraInput />);
    const cameraInput = container.querySelector('.camera-input');

    fireEvent.keyDown(cameraInput!, { key: 's', ctrlKey: true });

    expect(switchCamera).toHaveBeenCalled();
  });
});

// ============================================================================
// Image Preview Tests
// ============================================================================

describe('Image Preview', () => {
  test('should show captured image preview', () => {
    const capturedImage = {
      blob: new Blob(),
      dataUrl: 'data:image/jpeg;base64,test',
      width: 1920,
      height: 1080,
      timestamp: new Date(),
      format: 'image/jpeg',
      size: 102400,
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ capturedImage })
    );

    render(<CameraInput showPreview />);

    expect(screen.getByRole('region', { name: /captured image preview/i })).toBeInTheDocument();
    expect(screen.getByAltText(/captured from camera/i)).toBeInTheDocument();
    expect(screen.getByText(/100\.0 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/1920 × 1080/i)).toBeInTheDocument();
  });

  test('should hide preview when showPreview is false', () => {
    const capturedImage = {
      blob: new Blob(),
      dataUrl: 'data:image/jpeg;base64,test',
      width: 1920,
      height: 1080,
      timestamp: new Date(),
      format: 'image/jpeg',
      size: 102400,
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ capturedImage })
    );

    render(<CameraInput showPreview={false} />);

    expect(screen.queryByRole('region', { name: /captured image preview/i })).not.toBeInTheDocument();
  });
});

// ============================================================================
// OCR Results Tests
// ============================================================================

describe('OCR Results', () => {
  test('should show extracted text', () => {
    const ocrResult = {
      text: 'Hello World',
      confidence: 0.95,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults />);

    expect(screen.getByRole('region', { name: /extracted text/i })).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText(/confidence: 95\.0%/i)).toBeInTheDocument();
  });

  test('should show low confidence warning', () => {
    const ocrResult = {
      text: 'Test',
      confidence: 0.6,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults />);

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  test('should show OCR warnings', () => {
    const ocrResult = {
      text: '[OCR pending]',
      confidence: 0.0,
      blocks: [],
      processingTime: 100,
      warnings: ['OCR integration pending'],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults />);

    expect(screen.getByText(/OCR integration pending/i)).toBeInTheDocument();
  });

  test('should hide OCR results when showOCRResults is false', () => {
    const ocrResult = {
      text: 'Test',
      confidence: 0.9,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults={false} />);

    expect(screen.queryByRole('region', { name: /extracted text/i })).not.toBeInTheDocument();
  });
});

// ============================================================================
// Text-to-Speech Tests
// ============================================================================

describe('Text-to-Speech', () => {
  beforeEach(() => {
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
  });

  test('should show read aloud button when text is extracted', () => {
    const ocrResult = {
      text: 'Hello World',
      confidence: 0.95,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults enableTextToSpeech />);

    expect(screen.getByRole('button', { name: /read.*aloud/i })).toBeInTheDocument();
  });

  test('should speak text when read aloud button is clicked', async () => {
    const ocrResult = {
      text: 'Hello World',
      confidence: 0.95,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults enableTextToSpeech />);

    const readButton = screen.getByRole('button', { name: /read.*aloud/i });
    await userEvent.click(readButton);

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  test('should not speak text containing "pending"', async () => {
    const captureAndProcess = jest.fn().mockResolvedValue({
      captured: {},
      preprocessed: {},
      ocr: { text: '[OCR pending]', confidence: 0.0 },
    });

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({
        state: 'ready',
        isReady: true,
        captureAndProcess,
      })
    );

    render(<CameraInput showControls enableTextToSpeech />);

    const captureButton = screen.getByRole('button', { name: /capture.*read text/i });
    await userEvent.click(captureButton);

    await waitFor(() => {
      expect(captureAndProcess).toHaveBeenCalled();
    });

    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  });

  test('should hide text-to-speech features when disabled', () => {
    const ocrResult = {
      text: 'Hello World',
      confidence: 0.95,
      blocks: [],
      processingTime: 100,
      warnings: [],
    };

    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ ocrResult })
    );

    render(<CameraInput showOCRResults enableTextToSpeech={false} />);

    expect(screen.queryByRole('button', { name: /read.*aloud/i })).not.toBeInTheDocument();
  });
});

// ============================================================================
// Callback Tests
// ============================================================================

describe('Callbacks', () => {
  test('should call onCapture callback', async () => {
    const onCapture = jest.fn();
    const captureAndProcess = jest.fn().mockResolvedValue({
      captured: { dataUrl: 'data:image/jpeg;base64,test' },
      preprocessed: {},
      ocr: { text: 'Test', confidence: 0.9 },
    });

    mockUseCameraInput.mockImplementation((options) => {
      // Simulate calling onCapture
      if (options.onCapture) {
        setTimeout(() => {
          options.onCapture({ dataUrl: 'data:image/jpeg;base64,test' } as any);
        }, 0);
      }

      return createMockHookReturn({
        state: 'ready',
        isReady: true,
        captureAndProcess,
      });
    });

    render(<CameraInput showControls onCapture={onCapture} />);

    const captureButton = screen.getByRole('button', { name: /capture.*read text/i });
    await userEvent.click(captureButton);

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith('data:image/jpeg;base64,test');
    });
  });

  test('should call onTextExtracted callback', async () => {
    const onTextExtracted = jest.fn();

    mockUseCameraInput.mockImplementation((options) => {
      // Simulate calling onTextExtracted
      if (options.onTextExtracted) {
        setTimeout(() => {
          options.onTextExtracted('Test text', 0.9);
        }, 0);
      }

      return createMockHookReturn({
        state: 'ready',
        isReady: true,
        captureAndProcess: jest.fn().mockResolvedValue({
          captured: {},
          preprocessed: {},
          ocr: { text: 'Test text', confidence: 0.9 },
        }),
      });
    });

    render(<CameraInput showControls onTextExtracted={onTextExtracted} />);

    const captureButton = screen.getByRole('button', { name: /capture.*read text/i });
    await userEvent.click(captureButton);

    await waitFor(() => {
      expect(onTextExtracted).toHaveBeenCalledWith('Test text', 0.9);
    });
  });

  test('should call onError callback', () => {
    const onError = jest.fn();
    const error = new Error('Test error');

    mockUseCameraInput.mockImplementation((options) => {
      // Simulate calling onError
      if (options.onError) {
        setTimeout(() => {
          options.onError(error);
        }, 0);
      }

      return createMockHookReturn({ error });
    });

    render(<CameraInput onError={onError} />);

    waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Accessibility', () => {
  test('should have proper ARIA labels', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', isReady: true })
    );

    render(<CameraInput showControls />);

    expect(screen.getByRole('region', { name: /camera input/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/camera preview/i)).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: /camera controls/i })).toBeInTheDocument();
  });

  test('should have proper button labels', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', isReady: true })
    );

    render(<CameraInput showControls />);

    expect(screen.getByRole('button', { name: /capture image and read text aloud/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop camera/i })).toBeInTheDocument();
  });

  test('should show keyboard shortcuts help', () => {
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', isReady: true })
    );

    render(<CameraInput showControls />);

    expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
  });

  test('should have error alert with proper role', () => {
    const error = new Error('Test error');
    mockUseCameraInput.mockReturnValue(
      createMockHookReturn({ state: 'ready', error })
    );

    render(<CameraInput />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Test error');
  });
});

