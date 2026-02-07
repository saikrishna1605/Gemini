'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { announceToScreenReader, handleKeyboardNavigation } from '@/lib/accessibility';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type OnboardingStep = 'welcome' | 'input-preferences' | 'output-preferences' | 'visual-settings' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['welcome', 'input-preferences', 'output-preferences', 'visual-settings', 'complete'];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const { preferences, updatePreferences } = useAccessibility();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isTimerActive) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          announceToScreenReader('Setup time completed. You can continue at your own pace.', 'polite');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      const nextStep = STEP_ORDER[nextIndex];
      setCurrentStep(nextStep);
      announceToScreenReader(`Step ${nextIndex + 1} of ${STEP_ORDER.length}: ${getStepTitle(nextStep)}`, 'polite');
    } else {
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEP_ORDER[prevIndex];
      setCurrentStep(prevStep);
      announceToScreenReader(`Step ${prevIndex + 1} of ${STEP_ORDER.length}: ${getStepTitle(prevStep)}`, 'polite');
    }
  };

  const handleComplete = () => {
    announceToScreenReader('Accessibility setup complete! Welcome to UNSAID/UNHEARD.', 'polite');
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      announceToScreenReader('Setup skipped. You can configure accessibility preferences later in settings.', 'polite');
      onSkip();
    }
  };

  const getStepTitle = (step: OnboardingStep): string => {
    switch (step) {
      case 'welcome': return 'Welcome to UNSAID/UNHEARD';
      case 'input-preferences': return 'How would you like to communicate with us?';
      case 'output-preferences': return 'How would you like us to communicate with you?';
      case 'visual-settings': return 'Visual and accessibility settings';
      case 'complete': return 'Setup complete';
      default: return '';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header with progress */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 id="onboarding-title" className="text-2xl font-bold text-gray-900 dark:text-white">
              {getStepTitle(currentStep)}
            </h1>
            {isTimerActive && timeRemaining > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                {timeRemaining}s remaining
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Setup progress: ${Math.round(progressPercentage)}% complete`}
            />
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Step {currentStepIndex + 1} of {STEP_ORDER.length}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          {currentStep === 'welcome' && <WelcomeStep onStart={() => setIsTimerActive(true)} />}
          {currentStep === 'input-preferences' && <InputPreferencesStep />}
          {currentStep === 'output-preferences' && <OutputPreferencesStep />}
          {currentStep === 'visual-settings' && <VisualSettingsStep />}
          {currentStep === 'complete' && <CompleteStep />}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={goToPreviousStep}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                onKeyDown={(e) => handleKeyboardNavigation(e, goToPreviousStep)}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {onSkip && currentStep !== 'complete' && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md"
                onKeyDown={(e) => handleKeyboardNavigation(e, handleSkip)}
              >
                Skip Setup
              </button>
            )}
            
            <button
              onClick={currentStep === 'complete' ? handleComplete : goToNextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              onKeyDown={(e) => handleKeyboardNavigation(e, currentStep === 'complete' ? handleComplete : goToNextStep)}
            >
              {currentStep === 'complete' ? 'Get Started' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    onStart();
  }, [onStart]);

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4" role="img" aria-label="Welcome">
        👋
      </div>
      <div className="space-y-4">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Welcome to <strong>UNSAID/UNHEARD</strong> - an accessibility-first app designed for you.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Let's take 30 seconds to set up your communication preferences so the app works perfectly for your needs.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Quick setup:</strong> We'll ask about how you prefer to communicate and how you'd like information presented to you.
          </p>
        </div>
      </div>
    </div>
  );
}

// Input Preferences Step Component
function InputPreferencesStep() {
  const { preferences, updatePreferences } = useAccessibility();

  const inputOptions = [
    { id: 'text', label: 'Text', description: 'Type messages and responses', icon: '⌨️' },
    { id: 'voice', label: 'Voice', description: 'Speak naturally to communicate', icon: '🎤' },
    { id: 'icons', label: 'Icons & Symbols', description: 'Use pictures and symbols (AAC)', icon: '🔣' },
    { id: 'sign', label: 'Sign Language', description: 'Record sign language videos', icon: '🤟' },
    { id: 'camera', label: 'Camera', description: 'Take photos of text to read aloud', icon: '📷' },
  ] as const;

  const toggleInputMode = (mode: typeof inputOptions[number]['id']) => {
    const currentModes = preferences.inputModes;
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    
    updatePreferences({ inputModes: newModes });
    announceToScreenReader(`${mode} ${currentModes.includes(mode) ? 'removed' : 'added'}`, 'polite');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select all the ways you'd like to communicate with the app. You can choose multiple options.
        </p>
      </div>
      
      <div className="grid gap-4">
        {inputOptions.map((option) => {
          const isSelected = preferences.inputModes.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleInputMode(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="checkbox"
              aria-checked={isSelected}
              onKeyDown={(e) => handleKeyboardNavigation(e, () => toggleInputMode(option.id))}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {option.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {preferences.inputModes.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please select at least one input method to continue.
          </p>
        </div>
      )}
    </div>
  );
}

// Output Preferences Step Component
function OutputPreferencesStep() {
  const { preferences, updatePreferences } = useAccessibility();

  const outputOptions = [
    { id: 'audio', label: 'Audio', description: 'Hear spoken responses and content', icon: '🔊' },
    { id: 'captions', label: 'Captions', description: 'See text captions for all audio', icon: '💬' },
    { id: 'easy-read', label: 'Easy Read', description: 'Simplified text that\'s easier to understand', icon: '📖' },
    { id: 'sign', label: 'Sign Language', description: 'Sign-friendly content format', icon: '🤟' },
  ] as const;

  const toggleOutputMode = (mode: typeof outputOptions[number]['id']) => {
    const currentModes = preferences.outputModes;
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    
    updatePreferences({ outputModes: newModes });
    announceToScreenReader(`${mode} ${currentModes.includes(mode) ? 'removed' : 'added'}`, 'polite');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select how you'd like to receive information from the app. You can choose multiple options.
        </p>
      </div>
      
      <div className="grid gap-4">
        {outputOptions.map((option) => {
          const isSelected = preferences.outputModes.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleOutputMode(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="checkbox"
              aria-checked={isSelected}
              onKeyDown={(e) => handleKeyboardNavigation(e, () => toggleOutputMode(option.id))}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {option.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {preferences.outputModes.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please select at least one output method to continue.
          </p>
        </div>
      )}
    </div>
  );
}

// Visual Settings Step Component
function VisualSettingsStep() {
  const { preferences, updatePreferences } = useAccessibility();

  const fontSizeOptions = [
    { id: 'small', label: 'Small', description: '14px - Compact text' },
    { id: 'medium', label: 'Medium', description: '16px - Standard text' },
    { id: 'large', label: 'Large', description: '18px - Easier to read' },
    { id: 'extra-large', label: 'Extra Large', description: '22px - Much easier to read' },
  ] as const;

  const contrastOptions = [
    { id: 'normal', label: 'Normal', description: 'Standard contrast' },
    { id: 'high', label: 'High', description: 'Increased contrast for better visibility' },
    { id: 'extra-high', label: 'Extra High', description: 'Maximum contrast' },
  ] as const;

  const colorSchemeOptions = [
    { id: 'auto', label: 'Auto', description: 'Follow system preference' },
    { id: 'light', label: 'Light', description: 'Light background, dark text' },
    { id: 'dark', label: 'Dark', description: 'Dark background, light text' },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Customize the visual appearance to make the app comfortable for you.
        </p>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Text Size
        </h3>
        <div className="grid gap-3">
          {fontSizeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => updatePreferences({ visualSettings: { ...preferences.visualSettings, fontSize: option.id } })}
              className={`p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                preferences.visualSettings.fontSize === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              role="radio"
              aria-checked={preferences.visualSettings.fontSize === option.id}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {preferences.visualSettings.fontSize === option.id && (
                  <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    ●
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contrast */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Contrast
        </h3>
        <div className="grid gap-3">
          {contrastOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => updatePreferences({ visualSettings: { ...preferences.visualSettings, contrast: option.id } })}
              className={`p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                preferences.visualSettings.contrast === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              role="radio"
              aria-checked={preferences.visualSettings.contrast === option.id}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {preferences.visualSettings.contrast === option.id && (
                  <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    ●
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Color Theme
        </h3>
        <div className="grid gap-3">
          {colorSchemeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => updatePreferences({ visualSettings: { ...preferences.visualSettings, colorScheme: option.id } })}
              className={`p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                preferences.visualSettings.colorScheme === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              role="radio"
              aria-checked={preferences.visualSettings.colorScheme === option.id}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {preferences.visualSettings.colorScheme === option.id && (
                  <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    ●
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Additional Options
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.cognitiveSettings.reducedMotion}
              onChange={(e) => updatePreferences({
                cognitiveSettings: {
                  ...preferences.cognitiveSettings,
                  reducedMotion: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Reduce Motion
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Minimize animations and transitions
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.cognitiveSettings.simplifiedUI}
              onChange={(e) => updatePreferences({
                cognitiveSettings: {
                  ...preferences.cognitiveSettings,
                  simplifiedUI: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Simplified Interface
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Show fewer options and cleaner layouts
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

// Complete Step Component
function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4" role="img" aria-label="Success">
        ✅
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          You're all set!
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Your accessibility preferences have been saved and applied.
        </p>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Remember:</strong> You can always change these settings later in your profile preferences.
          </p>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to UNSAID/UNHEARD - let's start communicating!
        </p>
      </div>
    </div>
  );
}