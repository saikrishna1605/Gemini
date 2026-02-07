'use client';

/**
 * AAC Icon Selector Component
 * 
 * Provides an accessible interface for selecting AAC icons and building
 * sentences with multiple complexity levels.
 * 
 * Requirements: 2.1, 2.2
 */

import React, { useState, useRef } from 'react';
import {
  AACVoiceBuilder,
  AACIcon,
  AACCategory,
  SentenceResult,
  ComplexityLevel,
  VoiceSettings,
  defaultAACVoiceBuilder,
} from '@/lib/aac-voice-builder';
import { IconSequence } from '@/lib/accessibility';
import { announceToScreenReader } from '@/lib/accessibility';

// ============================================================================
// Component Props
// ============================================================================

export interface AACIconSelectorProps {
  /**
   * AAC Voice Builder instance (optional, uses default if not provided)
   */
  builder?: AACVoiceBuilder;
  
  /**
   * Callback when sentence is built
   */
  onSentenceBuilt?: (result: SentenceResult) => void;
  
  /**
   * Callback when sentence is spoken
   */
  onSentenceSpoken?: (text: string) => void;
  
  /**
   * Initial complexity level
   */
  initialComplexity?: ComplexityLevel;
  
  /**
   * Voice settings for text-to-speech
   */
  voiceSettings?: VoiceSettings;
  
  /**
   * Whether to show quick phrases
   */
  showQuickPhrases?: boolean;
  
  /**
   * Custom CSS class
   */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function AACIconSelector({
  builder = defaultAACVoiceBuilder,
  onSentenceBuilt,
  onSentenceSpoken,
  initialComplexity = 'medium',
  voiceSettings = {},
  showQuickPhrases = true,
  className = '',
}: AACIconSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<AACCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSequence, setCurrentSequence] = useState<IconSequence>({ icons: [], phrases: [] });
  const [sentenceResult, setSentenceResult] = useState<SentenceResult | null>(null);
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>(initialComplexity);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuickPhrasesPanel, setShowQuickPhrasesPanel] = useState(false);
  
  const sequenceDisplayRef = useRef<HTMLDivElement>(null);
  
  // Get icons based on category and search
  const getFilteredIcons = (): AACIcon[] => {
    let icons = builder.getIconLibrary();
    
    // Filter by category
    if (selectedCategory !== 'all') {
      icons = builder.getIconsByCategory(selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      icons = builder.searchIcons(searchQuery);
    }
    
    return icons;
  };
  
  // Handle icon selection
  const handleIconSelect = (icon: AACIcon) => {
    builder.addIcon(icon.id);
    const newSequence = builder.getCurrentSequence();
    setCurrentSequence(newSequence);
    
    // Announce to screen reader
    announceToScreenReader(`Added ${icon.label} to sentence`, 'polite');
    
    // Auto-build sentence
    buildSentence();
  };
  
  // Handle phrase addition
  const handleAddPhrase = (phrase: string) => {
    builder.addPhrase(phrase);
    const newSequence = builder.getCurrentSequence();
    setCurrentSequence(newSequence);
    
    // Announce to screen reader
    announceToScreenReader(`Added phrase to sentence`, 'polite');
    
    // Auto-build sentence
    buildSentence();
  };
  
  // Build sentence from current sequence
  const buildSentence = () => {
    const result = builder.buildSentenceFromCurrent();
    setSentenceResult(result);
    
    if (onSentenceBuilt) {
      onSentenceBuilt(result);
    }
  };
  
  // Remove last item
  const handleRemoveLastItem = () => {
    builder.removeLastItem();
    const newSequence = builder.getCurrentSequence();
    setCurrentSequence(newSequence);
    
    // Announce to screen reader
    announceToScreenReader('Removed last item', 'polite');
    
    // Rebuild sentence
    if (newSequence.icons.length > 0 || (newSequence.phrases && newSequence.phrases.length > 0)) {
      buildSentence();
    } else {
      setSentenceResult(null);
    }
  };
  
  // Clear sequence
  const handleClearSequence = () => {
    builder.clearSequence();
    setCurrentSequence({ icons: [], phrases: [] });
    setSentenceResult(null);
    
    // Announce to screen reader
    announceToScreenReader('Cleared all items', 'polite');
  };
  
  // Speak sentence aloud
  const handleSpeakAloud = async () => {
    if (!sentenceResult) return;
    
    const textToSpeak = sentenceResult[complexityLevel];
    
    setIsSpeaking(true);
    announceToScreenReader('Speaking sentence', 'assertive');
    
    try {
      await builder.speakAloud(textToSpeak, voiceSettings);
      
      if (onSentenceSpoken) {
        onSentenceSpoken(textToSpeak);
      }
      
      announceToScreenReader('Finished speaking', 'polite');
    } catch (error) {
      console.error('Speech synthesis error:', error);
      announceToScreenReader('Failed to speak sentence', 'assertive');
    } finally {
      setIsSpeaking(false);
    }
  };
  
  // Stop speaking
  const handleStopSpeaking = () => {
    builder.stopSpeaking();
    setIsSpeaking(false);
    announceToScreenReader('Stopped speaking', 'polite');
  };
  
  // Handle quick phrase selection
  const handleQuickPhraseSelect = (phraseId: string) => {
    const phraseText = builder.useQuickPhrase(phraseId);
    handleAddPhrase(phraseText);
    setShowQuickPhrasesPanel(false);
  };
  
  // Categories for filtering
  const categories: Array<{ id: AACCategory | 'all'; label: string; icon: string }> = [
    { id: 'all', label: 'All', icon: '🔤' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'emotions', label: 'Emotions', icon: '😊' },
    { id: 'places', label: 'Places', icon: '📍' },
    { id: 'things', label: 'Things', icon: '📦' },
    { id: 'descriptors', label: 'Descriptors', icon: '✨' },
    { id: 'time', label: 'Time', icon: '⏰' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'social', label: 'Social', icon: '💬' },
    { id: 'needs', label: 'Needs', icon: '🆘' },
  ];
  
  const filteredIcons = getFilteredIcons();
  const quickPhrases = builder.getQuickPhrases().slice(0, 10);
  
  return (
    <div className={`aac-icon-selector ${className}`}>
      {/* Header with controls */}
      <div className="aac-header" role="region" aria-label="AAC Controls">
        <h2 className="text-2xl font-bold mb-4">AAC Voice Builder</h2>
        
        {/* Search bar */}
        <div className="mb-4">
          <label htmlFor="icon-search" className="sr-only">
            Search icons
          </label>
          <input
            id="icon-search"
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search for AAC icons"
          />
        </div>
        
        {/* Quick phrases toggle */}
        {showQuickPhrases && (
          <button
            onClick={() => setShowQuickPhrasesPanel(!showQuickPhrasesPanel)}
            className="mb-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-expanded={showQuickPhrasesPanel}
            aria-controls="quick-phrases-panel"
          >
            {showQuickPhrasesPanel ? 'Hide' : 'Show'} Quick Phrases
          </button>
        )}
        
        {/* Quick phrases panel */}
        {showQuickPhrasesPanel && (
          <div
            id="quick-phrases-panel"
            className="mb-4 p-4 bg-purple-50 rounded-lg"
            role="region"
            aria-label="Quick phrases"
          >
            <h3 className="text-lg font-semibold mb-2">Quick Phrases</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handleQuickPhraseSelect(phrase.id)}
                  className="px-3 py-2 bg-white border border-purple-300 rounded hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-left"
                  aria-label={`Quick phrase: ${phrase.text}`}
                >
                  {phrase.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Category filter */}
      <div className="mb-4" role="navigation" aria-label="Icon categories">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-pressed={selectedCategory === cat.id}
              aria-label={`Filter by ${cat.label}`}
            >
              <span aria-hidden="true">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Icon grid */}
      <div
        className="icon-grid mb-6"
        role="region"
        aria-label="Available icons"
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {filteredIcons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => handleIconSelect(icon)}
              className="icon-button p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={`Add ${icon.label} to sentence`}
            >
              <div className="text-3xl mb-2" aria-hidden="true">
                {icon.imageUrl ? (
                  <img src={icon.imageUrl} alt="" className="w-12 h-12 mx-auto" />
                ) : (
                  '🔤'
                )}
              </div>
              <div className="text-sm font-medium">{icon.label}</div>
            </button>
          ))}
        </div>
        
        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No icons found. Try a different search or category.
          </div>
        )}
      </div>
      
      {/* Current sequence display */}
      <div
        ref={sequenceDisplayRef}
        className="sequence-display mb-6 p-4 bg-gray-50 rounded-lg"
        role="region"
        aria-label="Current sentence sequence"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Current Sequence</h3>
          <div className="flex gap-2">
            <button
              onClick={handleRemoveLastItem}
              disabled={currentSequence.icons.length === 0 && (!currentSequence.phrases || currentSequence.phrases.length === 0)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Remove last item from sequence"
            >
              ⬅️ Undo
            </button>
            <button
              onClick={handleClearSequence}
              disabled={currentSequence.icons.length === 0 && (!currentSequence.phrases || currentSequence.phrases.length === 0)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear all items from sequence"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 min-h-[60px] items-center">
          {currentSequence.icons.map((icon, index) => (
            <div
              key={`icon-${index}`}
              className="px-3 py-2 bg-blue-100 border border-blue-300 rounded"
              role="listitem"
            >
              {icon.label}
            </div>
          ))}
          {currentSequence.phrases?.map((phrase, index) => (
            <div
              key={`phrase-${index}`}
              className="px-3 py-2 bg-purple-100 border border-purple-300 rounded"
              role="listitem"
            >
              {phrase}
            </div>
          ))}
          {currentSequence.icons.length === 0 && (!currentSequence.phrases || currentSequence.phrases.length === 0) && (
            <div className="text-gray-400 italic">
              Select icons or phrases to build a sentence
            </div>
          )}
        </div>
      </div>
      
      {/* Sentence output */}
      {sentenceResult && (
        <div
          className="sentence-output mb-6 p-4 bg-green-50 rounded-lg"
          role="region"
          aria-label="Generated sentences"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Generated Sentence</h3>
            
            {/* Complexity level selector */}
            <div className="flex gap-2" role="radiogroup" aria-label="Sentence complexity level">
              {(['short', 'medium', 'long'] as ComplexityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setComplexityLevel(level)}
                  className={`px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    complexityLevel === level
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-green-300 hover:bg-green-100'
                  }`}
                  role="radio"
                  aria-checked={complexityLevel === level}
                  aria-label={`${level} complexity`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Display selected complexity level */}
          <div className="mb-4 p-3 bg-white rounded border border-green-300">
            <p className="text-xl" aria-live="polite">
              {sentenceResult[complexityLevel]}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Confidence: {(sentenceResult.confidence * 100).toFixed(0)}%
            </p>
          </div>
          
          {/* Speak button */}
          <div className="flex gap-2">
            {!isSpeaking ? (
              <button
                onClick={handleSpeakAloud}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-lg"
                aria-label="Speak sentence aloud"
              >
                🔊 Speak Out Loud
              </button>
            ) : (
              <button
                onClick={handleStopSpeaking}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-lg"
                aria-label="Stop speaking"
              >
                ⏹️ Stop Speaking
              </button>
            )}
          </div>
          
          {/* Show all complexity levels */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View all complexity levels
            </summary>
            <div className="mt-2 space-y-2">
              <div className="p-2 bg-white rounded border">
                <strong>Short:</strong> {sentenceResult.short}
              </div>
              <div className="p-2 bg-white rounded border">
                <strong>Medium:</strong> {sentenceResult.medium}
              </div>
              <div className="p-2 bg-white rounded border">
                <strong>Long:</strong> {sentenceResult.long}
              </div>
            </div>
          </details>
        </div>
      )}
      
      <style jsx>{`
        .aac-icon-selector {
          max-width: 100%;
          margin: 0 auto;
        }
        
        .icon-button {
          min-height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .icon-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
