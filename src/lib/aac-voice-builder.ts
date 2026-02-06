/**
 * AAC Voice Builder for UNSAID/UNHEARD
 * 
 * This module implements the AAC (Augmentative and Alternative Communication)
 * Voice Builder system that transforms icon sequences into natural language
 * with context-aware sentence construction and multiple complexity levels.
 * 
 * Requirements: 2.1, 2.2
 */

import { IconSequence } from './accessibility';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Represents a single AAC icon
 */
export interface AACIcon {
  id: string;
  label: string;
  category: AACCategory;
  imageUrl?: string;
  synonyms?: string[];
  contextHints?: string[];
}

/**
 * AAC icon categories for organization
 */
export type AACCategory =
  | 'people'
  | 'actions'
  | 'emotions'
  | 'places'
  | 'things'
  | 'descriptors'
  | 'time'
  | 'questions'
  | 'social'
  | 'needs';

/**
 * Sentence complexity levels
 */
export type ComplexityLevel = 'short' | 'medium' | 'long';

/**
 * Result of sentence construction
 */
export interface SentenceResult {
  short: string;
  medium: string;
  long: string;
  confidence: number;
  metadata: {
    iconCount: number;
    phraseCount: number;
    categories: AACCategory[];
    contextUsed: boolean;
  };
}

/**
 * Conversation context for context-aware sentence building
 */
export interface ConversationContext {
  previousMessages: string[];
  topic?: string;
  participants?: string[];
  mood?: 'casual' | 'formal' | 'urgent';
}

/**
 * Quick phrase for rapid communication
 */
export interface QuickPhrase {
  id: string;
  text: string;
  category: string;
  frequency: number;
  lastUsed?: Date;
}

/**
 * Voice settings for text-to-speech
 */
export interface VoiceSettings {
  voice?: string;
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  language?: string;
}

// ============================================================================
// Default Icon Library
// ============================================================================

/**
 * Default AAC icon library
 * In a real implementation, this would be loaded from a database
 */
export const defaultIconLibrary: AACIcon[] = [
  // People
  { id: 'i', label: 'I', category: 'people', synonyms: ['me', 'myself'] },
  { id: 'you', label: 'you', category: 'people', synonyms: ['yourself'] },
  { id: 'we', label: 'we', category: 'people', synonyms: ['us'] },
  { id: 'they', label: 'they', category: 'people', synonyms: ['them'] },
  { id: 'person', label: 'person', category: 'people' },
  { id: 'friend', label: 'friend', category: 'people' },
  { id: 'family', label: 'family', category: 'people' },
  
  // Actions
  { id: 'want', label: 'want', category: 'actions', synonyms: ['need', 'desire'] },
  { id: 'go', label: 'go', category: 'actions', synonyms: ['leave', 'move'] },
  { id: 'eat', label: 'eat', category: 'actions', synonyms: ['consume'] },
  { id: 'drink', label: 'drink', category: 'actions' },
  { id: 'help', label: 'help', category: 'actions', synonyms: ['assist', 'support'] },
  { id: 'talk', label: 'talk', category: 'actions', synonyms: ['speak', 'communicate'] },
  { id: 'listen', label: 'listen', category: 'actions', synonyms: ['hear'] },
  { id: 'see', label: 'see', category: 'actions', synonyms: ['look', 'watch'] },
  { id: 'feel', label: 'feel', category: 'actions', synonyms: ['sense'] },
  { id: 'think', label: 'think', category: 'actions', synonyms: ['consider'] },
  { id: 'like', label: 'like', category: 'actions', synonyms: ['enjoy', 'love'] },
  { id: 'dislike', label: 'dislike', category: 'actions', synonyms: ['hate'] },
  
  // Emotions
  { id: 'happy', label: 'happy', category: 'emotions', synonyms: ['glad', 'joyful'] },
  { id: 'sad', label: 'sad', category: 'emotions', synonyms: ['unhappy', 'down'] },
  { id: 'angry', label: 'angry', category: 'emotions', synonyms: ['mad', 'upset'] },
  { id: 'scared', label: 'scared', category: 'emotions', synonyms: ['afraid', 'frightened'] },
  { id: 'excited', label: 'excited', category: 'emotions', synonyms: ['thrilled'] },
  { id: 'tired', label: 'tired', category: 'emotions', synonyms: ['exhausted', 'sleepy'] },
  { id: 'calm', label: 'calm', category: 'emotions', synonyms: ['peaceful', 'relaxed'] },
  
  // Places
  { id: 'home', label: 'home', category: 'places' },
  { id: 'school', label: 'school', category: 'places' },
  { id: 'work', label: 'work', category: 'places' },
  { id: 'outside', label: 'outside', category: 'places' },
  { id: 'inside', label: 'inside', category: 'places' },
  
  // Things
  { id: 'food', label: 'food', category: 'things' },
  { id: 'water', label: 'water', category: 'things' },
  { id: 'phone', label: 'phone', category: 'things' },
  { id: 'book', label: 'book', category: 'things' },
  { id: 'music', label: 'music', category: 'things' },
  
  // Descriptors
  { id: 'good', label: 'good', category: 'descriptors', synonyms: ['nice', 'great'] },
  { id: 'bad', label: 'bad', category: 'descriptors', synonyms: ['terrible', 'awful'] },
  { id: 'big', label: 'big', category: 'descriptors', synonyms: ['large', 'huge'] },
  { id: 'small', label: 'small', category: 'descriptors', synonyms: ['little', 'tiny'] },
  { id: 'hot', label: 'hot', category: 'descriptors', synonyms: ['warm'] },
  { id: 'cold', label: 'cold', category: 'descriptors', synonyms: ['cool', 'chilly'] },
  { id: 'more', label: 'more', category: 'descriptors' },
  { id: 'less', label: 'less', category: 'descriptors' },
  
  // Time
  { id: 'now', label: 'now', category: 'time', synonyms: ['currently'] },
  { id: 'later', label: 'later', category: 'time' },
  { id: 'today', label: 'today', category: 'time' },
  { id: 'tomorrow', label: 'tomorrow', category: 'time' },
  { id: 'yesterday', label: 'yesterday', category: 'time' },
  
  // Questions
  { id: 'what', label: 'what', category: 'questions' },
  { id: 'where', label: 'where', category: 'questions' },
  { id: 'when', label: 'when', category: 'questions' },
  { id: 'who', label: 'who', category: 'questions' },
  { id: 'why', label: 'why', category: 'questions' },
  { id: 'how', label: 'how', category: 'questions' },
  
  // Social
  { id: 'yes', label: 'yes', category: 'social' },
  { id: 'no', label: 'no', category: 'social' },
  { id: 'please', label: 'please', category: 'social' },
  { id: 'thank-you', label: 'thank you', category: 'social' },
  { id: 'sorry', label: 'sorry', category: 'social' },
  { id: 'hello', label: 'hello', category: 'social', synonyms: ['hi'] },
  { id: 'goodbye', label: 'goodbye', category: 'social', synonyms: ['bye'] },
  
  // Needs
  { id: 'bathroom', label: 'bathroom', category: 'needs' },
  { id: 'break', label: 'break', category: 'needs', synonyms: ['rest'] },
  { id: 'quiet', label: 'quiet', category: 'needs', synonyms: ['silence'] },
  { id: 'space', label: 'space', category: 'needs', synonyms: ['room'] },
];

/**
 * Default quick phrases for rapid communication
 */
export const defaultQuickPhrases: QuickPhrase[] = [
  { id: 'qp-1', text: 'I need help', category: 'needs', frequency: 0 },
  { id: 'qp-2', text: 'I need a break', category: 'needs', frequency: 0 },
  { id: 'qp-3', text: 'Can you repeat that?', category: 'questions', frequency: 0 },
  { id: 'qp-4', text: 'I understand', category: 'social', frequency: 0 },
  { id: 'qp-5', text: "I don't understand", category: 'social', frequency: 0 },
  { id: 'qp-6', text: 'Yes, please', category: 'social', frequency: 0 },
  { id: 'qp-7', text: 'No, thank you', category: 'social', frequency: 0 },
  { id: 'qp-8', text: 'Give me a moment', category: 'needs', frequency: 0 },
  { id: 'qp-9', text: 'I feel overwhelmed', category: 'emotions', frequency: 0 },
  { id: 'qp-10', text: 'That sounds good', category: 'social', frequency: 0 },
];

// ============================================================================
// Sentence Construction Logic
// ============================================================================

/**
 * Build sentences from icon sequence with multiple complexity levels
 * 
 * This function implements context-aware sentence construction that
 * transforms icon sequences into natural language at three complexity levels:
 * - Short: Minimal, direct communication
 * - Medium: Natural, conversational language
 * - Long: Detailed, expressive communication
 */
export function buildSentence(
  iconSequence: IconSequence,
  context?: ConversationContext
): SentenceResult {
  const icons = iconSequence.icons;
  const phrases = iconSequence.phrases || [];
  
  // Extract icon labels
  const iconLabels = icons.map(icon => icon.label);
  
  // Combine all text elements
  const allWords = [...iconLabels, ...phrases];
  
  // Analyze categories
  const categorySet = new Set(icons.map(icon => icon.category as AACCategory));
  const categories = Array.from(categorySet);
  
  // Build sentences at different complexity levels
  const short = buildShortSentence(allWords, categories);
  const medium = buildMediumSentence(allWords, categories, context);
  const long = buildLongSentence(allWords, categories, context);
  
  // Calculate confidence based on icon count and context
  const confidence = calculateConfidence(icons.length, phrases.length, context);
  
  return {
    short,
    medium,
    long,
    confidence,
    metadata: {
      iconCount: icons.length,
      phraseCount: phrases.length,
      categories,
      contextUsed: !!context,
    },
  };
}

/**
 * Build short sentence (minimal, direct)
 */
function buildShortSentence(words: string[], categories: AACCategory[]): string {
  if (words.length === 0) return '';
  
  // For short sentences, just join the words with minimal grammar
  const sentence = words.join(' ');
  
  // Capitalize first letter
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Build medium sentence (natural, conversational)
 */
function buildMediumSentence(
  words: string[],
  categories: AACCategory[],
  context?: ConversationContext
): string {
  if (words.length === 0) return '';
  
  // Add basic grammar improvements
  let sentence = words.join(' ');
  
  // Add articles where appropriate
  sentence = addArticles(sentence);
  
  // Add basic punctuation
  if (categories.includes('questions')) {
    sentence += '?';
  } else {
    sentence += '.';
  }
  
  // Capitalize first letter
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Build long sentence (detailed, expressive)
 */
function buildLongSentence(
  words: string[],
  categories: AACCategory[],
  context?: ConversationContext
): string {
  if (words.length === 0) return '';
  
  // Build more expressive sentence with context
  let sentence = words.join(' ');
  
  // Add articles and conjunctions
  sentence = addArticles(sentence);
  sentence = addConjunctions(sentence);
  
  // Add context-aware enhancements
  if (context) {
    sentence = enhanceWithContext(sentence, context);
  }
  
  // Add appropriate punctuation
  if (categories.includes('questions')) {
    sentence += '?';
  } else if (categories.includes('emotions') && words.length > 2) {
    sentence += '!';
  } else {
    sentence += '.';
  }
  
  // Capitalize first letter
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Add articles (a, an, the) where appropriate
 */
function addArticles(sentence: string): string {
  // Simple article insertion (in real implementation, would use NLP)
  const words = sentence.split(' ');
  const result: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    
    // Add article before nouns if not already present
    if (
      i > 0 &&
      !['a', 'an', 'the', 'my', 'your', 'our', 'their'].includes(prevWord) &&
      isNoun(word)
    ) {
      const article = startsWithVowel(word) ? 'a' : 'a';
      result.push(article);
    }
    
    result.push(word);
  }
  
  return result.join(' ');
}

/**
 * Add conjunctions (and, but, so) where appropriate
 */
function addConjunctions(sentence: string): string {
  // Simple conjunction insertion
  const words = sentence.split(' ');
  
  // If sentence has multiple clauses, add conjunctions
  if (words.length > 4) {
    const midpoint = Math.floor(words.length / 2);
    words.splice(midpoint, 0, 'and');
  }
  
  return words.join(' ');
}

/**
 * Enhance sentence with conversation context
 */
function enhanceWithContext(sentence: string, context: ConversationContext): string {
  // Add context-aware enhancements based on mood and topic
  if (context.mood === 'formal') {
    sentence = 'I would like to ' + sentence;
  } else if (context.mood === 'urgent') {
    sentence = 'Please, ' + sentence;
  }
  
  return sentence;
}

/**
 * Check if word is likely a noun
 */
function isNoun(word: string): boolean {
  const nouns = [
    'person', 'friend', 'family', 'food', 'water', 'phone', 'book',
    'music', 'home', 'school', 'work', 'bathroom', 'break', 'space',
  ];
  return nouns.includes(word.toLowerCase());
}

/**
 * Check if word starts with vowel
 */
function startsWithVowel(word: string): boolean {
  return /^[aeiou]/i.test(word);
}

/**
 * Calculate confidence score for sentence construction
 */
function calculateConfidence(
  iconCount: number,
  phraseCount: number,
  context?: ConversationContext
): number {
  let confidence = 0.7; // Base confidence
  
  // More icons = higher confidence
  if (iconCount >= 3) confidence += 0.1;
  if (iconCount >= 5) confidence += 0.1;
  
  // Phrases increase confidence
  if (phraseCount > 0) confidence += 0.05;
  
  // Context increases confidence
  if (context) confidence += 0.05;
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

// ============================================================================
// AAC Voice Builder Class
// ============================================================================

/**
 * Main AAC Voice Builder class
 * 
 * Provides icon selection, phrase building, sentence construction,
 * and text-to-speech functionality with context awareness.
 */
export class AACVoiceBuilder {
  private iconLibrary: Map<string, AACIcon>;
  private quickPhrases: QuickPhrase[];
  private customPhrases: Map<string, { phrase: string; icons: IconSequence }>;
  private conversationContext: ConversationContext | null;
  private currentSequence: IconSequence;
  
  constructor(
    iconLibrary: AACIcon[] = defaultIconLibrary,
    quickPhrases: QuickPhrase[] = defaultQuickPhrases
  ) {
    this.iconLibrary = new Map(iconLibrary.map(icon => [icon.id, icon]));
    this.quickPhrases = [...quickPhrases];
    this.customPhrases = new Map();
    this.conversationContext = null;
    this.currentSequence = { icons: [], phrases: [] };
  }
  
  /**
   * Get all available icons
   */
  getIconLibrary(): AACIcon[] {
    return Array.from(this.iconLibrary.values());
  }
  
  /**
   * Get icons by category
   */
  getIconsByCategory(category: AACCategory): AACIcon[] {
    return this.getIconLibrary().filter(icon => icon.category === category);
  }
  
  /**
   * Search icons by label or synonym
   */
  searchIcons(query: string): AACIcon[] {
    const lowerQuery = query.toLowerCase();
    return this.getIconLibrary().filter(icon => {
      const labelMatch = icon.label.toLowerCase().includes(lowerQuery);
      const synonymMatch = icon.synonyms?.some(syn => 
        syn.toLowerCase().includes(lowerQuery)
      );
      return labelMatch || synonymMatch;
    });
  }
  
  /**
   * Add icon to current sequence
   */
  addIcon(iconId: string): void {
    const icon = this.iconLibrary.get(iconId);
    if (!icon) {
      throw new Error(`Icon not found: ${iconId}`);
    }
    
    this.currentSequence.icons.push({
      id: icon.id,
      label: icon.label,
      category: icon.category,
    });
  }
  
  /**
   * Add phrase to current sequence
   */
  addPhrase(phrase: string): void {
    if (!this.currentSequence.phrases) {
      this.currentSequence.phrases = [];
    }
    this.currentSequence.phrases.push(phrase);
  }
  
  /**
   * Remove last item from sequence
   */
  removeLastItem(): void {
    if (this.currentSequence.phrases && this.currentSequence.phrases.length > 0) {
      this.currentSequence.phrases.pop();
    } else if (this.currentSequence.icons.length > 0) {
      this.currentSequence.icons.pop();
    }
  }
  
  /**
   * Clear current sequence
   */
  clearSequence(): void {
    this.currentSequence = { icons: [], phrases: [] };
  }
  
  /**
   * Get current sequence
   */
  getCurrentSequence(): IconSequence {
    return { ...this.currentSequence };
  }
  
  /**
   * Build sentence from current sequence
   */
  buildSentenceFromCurrent(): SentenceResult {
    return buildSentence(this.currentSequence, this.conversationContext || undefined);
  }
  
  /**
   * Set conversation context
   */
  setContext(context: ConversationContext): void {
    this.conversationContext = context;
  }
  
  /**
   * Clear conversation context
   */
  clearContext(): void {
    this.conversationContext = null;
  }
  
  /**
   * Get quick phrases
   */
  getQuickPhrases(): QuickPhrase[] {
    // Sort by frequency (most used first)
    return [...this.quickPhrases].sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Use quick phrase (increments frequency)
   */
  useQuickPhrase(phraseId: string): string {
    const phrase = this.quickPhrases.find(p => p.id === phraseId);
    if (!phrase) {
      throw new Error(`Quick phrase not found: ${phraseId}`);
    }
    
    phrase.frequency++;
    phrase.lastUsed = new Date();
    
    return phrase.text;
  }
  
  /**
   * Add custom quick phrase
   */
  addQuickPhrase(text: string, category: string): QuickPhrase {
    const newPhrase: QuickPhrase = {
      id: `custom-${Date.now()}`,
      text,
      category,
      frequency: 0,
    };
    
    this.quickPhrases.push(newPhrase);
    return newPhrase;
  }
  
  /**
   * Save custom phrase with icon sequence
   */
  saveCustomPhrase(phrase: string, icons: IconSequence): void {
    const key = `custom-${Date.now()}`;
    this.customPhrases.set(key, { phrase, icons });
  }
  
  /**
   * Get custom phrases
   */
  getCustomPhrases(): Array<{ key: string; phrase: string; icons: IconSequence }> {
    return Array.from(this.customPhrases.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }
  
  /**
   * Speak text aloud using Web Speech API
   */
  async speakAloud(text: string, settings: VoiceSettings = {}): Promise<void> {
    if (!window.speechSynthesis) {
      throw new Error('Text-to-speech not supported in this browser');
    }
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      if (settings.voice) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === settings.voice);
        if (voice) utterance.voice = voice;
      }
      
      if (settings.rate !== undefined) {
        utterance.rate = Math.max(0.1, Math.min(10, settings.rate));
      }
      
      if (settings.pitch !== undefined) {
        utterance.pitch = Math.max(0, Math.min(2, settings.pitch));
      }
      
      if (settings.volume !== undefined) {
        utterance.volume = Math.max(0, Math.min(1, settings.volume));
      }
      
      if (settings.language) {
        utterance.lang = settings.language;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      window.speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!window.speechSynthesis) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }
  
  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance for convenience
export const defaultAACVoiceBuilder = new AACVoiceBuilder();
