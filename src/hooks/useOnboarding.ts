'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'unsaid-unheard-onboarding-completed';

export function useOnboarding() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if onboarding has been completed
    const checkOnboardingStatus = () => {
      try {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsOnboardingCompleted(completed === 'true');
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // Default to showing onboarding if we can't read from storage
        setIsOnboardingCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error('Failed to save onboarding completion status:', error);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error('Failed to reset onboarding status:', error);
    }
  };

  const skipOnboarding = () => {
    // Same as completing, but we could track this differently if needed
    completeOnboarding();
  };

  return {
    isOnboardingCompleted,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  };
}