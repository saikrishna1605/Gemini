'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function Home() {
  const { isOnboardingCompleted, isLoading, completeOnboarding, skipOnboarding } = useOnboarding();
  const { preferences } = useAccessibility();

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading UNSAID/UNHEARD...</p>
        </div>
      </div>
    );
  }

  // Show onboarding flow for new users
  if (!isOnboardingCompleted) {
    return (
      <OnboardingFlow 
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    );
  }

  // Main app content for returning users
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                UNSAID/UNHEARD
              </h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Accessibility-First Communication
              </span>
            </div>
            
            {/* Quick accessibility info */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span>Input:</span>
                <span className="font-medium">
                  {preferences.inputModes.join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Output:</span>
                <span className="font-medium">
                  {preferences.outputModes.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-8">
          {/* Welcome message */}
          <div className="space-y-4">
            <div className="text-6xl mb-4" role="img" aria-label="Welcome">
              👋
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your accessibility preferences are active. The app is configured to work with your preferred communication methods.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon="🎤"
              title="AAC Voice"
              description="Build sentences with icons and phrases, then speak them aloud"
              enabled={preferences.inputModes.includes('icons') || preferences.inputModes.includes('voice')}
            />
            <FeatureCard
              icon="💬"
              title="Live Captions"
              description="Convert speech to real-time captions with speaker identification"
              enabled={preferences.outputModes.includes('captions')}
            />
            <FeatureCard
              icon="🤟"
              title="Sign Language"
              description="Record sign clips and convert text to sign-friendly formats"
              enabled={preferences.inputModes.includes('sign') || preferences.outputModes.includes('sign')}
            />
            <FeatureCard
              icon="📷"
              title="Camera Reader"
              description="Take photos of text and have them read aloud or simplified"
              enabled={preferences.inputModes.includes('camera')}
            />
            <FeatureCard
              icon="👥"
              title="Community"
              description="Share achievements and connect with others in accessible formats"
              enabled={true}
            />
            <FeatureCard
              icon="🎓"
              title="Learning Hub"
              description="Access educational content in your preferred accessible formats"
              enabled={true}
            />
          </div>

          {/* Quick actions */}
          <div className="mt-12 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium">
                Start Communicating
              </button>
              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium">
                Browse Community
              </button>
              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium">
                Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
}

function FeatureCard({ icon, title, description, enabled }: FeatureCardProps) {
  return (
    <div className={`p-6 rounded-lg border-2 transition-all ${
      enabled 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
    }`}>
      <div className="text-center space-y-3">
        <div className="text-3xl" role="img" aria-hidden="true">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
        {enabled && (
          <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
            <span>✓</span>
            <span>Configured for you</span>
          </div>
        )}
      </div>
    </div>
  );
}
