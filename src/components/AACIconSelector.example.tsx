/**
 * AAC Icon Selector Examples
 * 
 * Demonstrates various usage patterns for the AAC Icon Selector component
 */

'use client';

import React, { useState } from 'react';
import { AACIconSelector } from './AACIconSelector';
import { AACVoiceBuilder, SentenceResult, VoiceSettings } from '@/lib/aac-voice-builder';

// ============================================================================
// Example 1: Basic AAC Icon Selector
// ============================================================================

export function BasicAACExample() {
  const [lastSentence, setLastSentence] = useState<string>('');
  
  const handleSentenceBuilt = (result: SentenceResult) => {
    console.log('Sentence built:', result);
    setLastSentence(result.medium);
  };
  
  const handleSentenceSpoken = (text: string) => {
    console.log('Sentence spoken:', text);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Basic AAC Icon Selector</h1>
      
      <AACIconSelector
        onSentenceBuilt={handleSentenceBuilt}
        onSentenceSpoken={handleSentenceSpoken}
        showQuickPhrases={true}
      />
      
      {lastSentence && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Last Built Sentence:</h3>
          <p className="text-lg">{lastSentence}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: AAC with Custom Voice Settings
// ============================================================================

export function CustomVoiceAACExample() {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AAC with Custom Voice Settings</h1>
      
      {/* Voice settings controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">Voice Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="rate-slider" className="block mb-2">
              Speech Rate: {voiceSettings.rate?.toFixed(1)}x
            </label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.rate || 1.0}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="pitch-slider" className="block mb-2">
              Pitch: {voiceSettings.pitch?.toFixed(1)}
            </label>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.pitch || 1.0}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="volume-slider" className="block mb-2">
              Volume: {((voiceSettings.volume || 1.0) * 100).toFixed(0)}%
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume || 1.0}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      <AACIconSelector
        voiceSettings={voiceSettings}
        initialComplexity="medium"
      />
    </div>
  );
}

// ============================================================================
// Example 3: AAC with Conversation Context
// ============================================================================

export function ContextAwareAACExample() {
  const [builder] = useState(() => new AACVoiceBuilder());
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  
  const handleSentenceBuilt = (result: SentenceResult) => {
    // Add to conversation history
    setConversationHistory(prev => [...prev, result.medium]);
    
    // Update context
    builder.setContext({
      previousMessages: conversationHistory,
      mood: 'casual',
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Context-Aware AAC</h1>
      
      {/* Conversation history */}
      {conversationHistory.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Conversation History</h3>
          <div className="space-y-2">
            {conversationHistory.map((message, index) => (
              <div key={index} className="p-2 bg-white rounded border">
                {message}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setConversationHistory([]);
              builder.clearContext();
            }}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear History
          </button>
        </div>
      )}
      
      <AACIconSelector
        builder={builder}
        onSentenceBuilt={handleSentenceBuilt}
      />
    </div>
  );
}

// ============================================================================
// Example 4: AAC with Custom Icon Library
// ============================================================================

export function CustomIconLibraryExample() {
  const [builder] = useState(() => {
    // Create custom icon library
    const customIcons = [
      { id: 'custom-1', label: 'coding', category: 'actions' as const },
      { id: 'custom-2', label: 'debugging', category: 'actions' as const },
      { id: 'custom-3', label: 'computer', category: 'things' as const },
      { id: 'custom-4', label: 'frustrated', category: 'emotions' as const },
      { id: 'custom-5', label: 'accomplished', category: 'emotions' as const },
    ];
    
    const customPhrases = [
      { id: 'cp-1', text: 'I need help with this code', category: 'needs', frequency: 0 },
      { id: 'cp-2', text: 'This is working now', category: 'social', frequency: 0 },
      { id: 'cp-3', text: 'Can you explain that?', category: 'questions', frequency: 0 },
    ];
    
    return new AACVoiceBuilder(customIcons, customPhrases);
  });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AAC with Custom Icons</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm">
          This example uses a custom icon library focused on coding and development.
        </p>
      </div>
      
      <AACIconSelector
        builder={builder}
        showQuickPhrases={true}
      />
    </div>
  );
}

// ============================================================================
// Example 5: Minimal AAC (No Quick Phrases)
// ============================================================================

export function MinimalAACExample() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Minimal AAC Interface</h1>
      
      <AACIconSelector
        showQuickPhrases={false}
        initialComplexity="short"
        className="max-w-4xl"
      />
    </div>
  );
}

// ============================================================================
// Example 6: AAC with Sentence Logging
// ============================================================================

export function LoggingAACExample() {
  const [sentenceLog, setSentenceLog] = useState<Array<{
    timestamp: Date;
    sentence: string;
    complexity: string;
    confidence: number;
  }>>([]);
  
  const handleSentenceBuilt = (result: SentenceResult) => {
    setSentenceLog(prev => [
      ...prev,
      {
        timestamp: new Date(),
        sentence: result.medium,
        complexity: 'medium',
        confidence: result.confidence,
      },
    ]);
  };
  
  const handleSentenceSpoken = (text: string) => {
    console.log('Spoken:', text);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AAC with Sentence Logging</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AACIconSelector
            onSentenceBuilt={handleSentenceBuilt}
            onSentenceSpoken={handleSentenceSpoken}
          />
        </div>
        
        <div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Sentence Log</h3>
            
            {sentenceLog.length === 0 ? (
              <p className="text-gray-500 italic">No sentences built yet</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sentenceLog.map((entry, index) => (
                  <div key={index} className="p-3 bg-white rounded border">
                    <p className="font-medium">{entry.sentence}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.timestamp.toLocaleTimeString()} • 
                      Confidence: {(entry.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {sentenceLog.length > 0 && (
              <button
                onClick={() => setSentenceLog([])}
                className="mt-4 w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Log
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: All Examples Showcase
// ============================================================================

export function AllAACExamples() {
  const [activeExample, setActiveExample] = useState<string>('basic');
  
  const examples = [
    { id: 'basic', label: 'Basic', component: BasicAACExample },
    { id: 'voice', label: 'Custom Voice', component: CustomVoiceAACExample },
    { id: 'context', label: 'Context-Aware', component: ContextAwareAACExample },
    { id: 'custom', label: 'Custom Icons', component: CustomIconLibraryExample },
    { id: 'minimal', label: 'Minimal', component: MinimalAACExample },
    { id: 'logging', label: 'With Logging', component: LoggingAACExample },
  ];
  
  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || BasicAACExample;
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold mb-4">AAC Icon Selector Examples</h1>
          
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeExample === example.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        <ActiveComponent />
      </div>
    </div>
  );
}
