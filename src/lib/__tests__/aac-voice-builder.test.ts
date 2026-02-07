/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Unit tests for AAC Voice Builder
 * 
 * Tests icon selection, phrase building, sentence construction,
 * and text-to-speech functionality.
 * 
 * Requirements: 2.1, 2.2
 */

import {
  AACVoiceBuilder,
  buildSentence,
  defaultIconLibrary,
  defaultQuickPhrases,
  AACIcon,
  AACCategory,
  ComplexityLevel,
  ConversationContext,
} from '../aac-voice-builder';
import { IconSequence } from '../accessibility';

describe('AAC Voice Builder', () => {
  describe('buildSentence', () => {
    it('should build sentences at all complexity levels', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
          { id: 'want', label: 'want', category: 'actions' },
          { id: 'food', label: 'food', category: 'things' },
        ],
        phrases: [],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.short).toBeTruthy();
      expect(result.medium).toBeTruthy();
      expect(result.long).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
    
    it('should include all icon labels in sentences', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
          { id: 'happy', label: 'happy', category: 'emotions' },
        ],
        phrases: [],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.short.toLowerCase()).toContain('i');
      expect(result.short.toLowerCase()).toContain('happy');
    });
    
    it('should include phrases in sentences', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
        ],
        phrases: ['need help'],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.short.toLowerCase()).toContain('need help');
    });
    
    it('should add question mark for question categories', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'where', label: 'where', category: 'questions' },
          { id: 'bathroom', label: 'bathroom', category: 'needs' },
        ],
        phrases: [],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.medium).toContain('?');
    });
    
    it('should capitalize first letter of sentences', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'i', category: 'people' },
          { id: 'want', label: 'want', category: 'actions' },
        ],
        phrases: [],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.short.charAt(0)).toBe(result.short.charAt(0).toUpperCase());
      expect(result.medium.charAt(0)).toBe(result.medium.charAt(0).toUpperCase());
      expect(result.long.charAt(0)).toBe(result.long.charAt(0).toUpperCase());
    });
    
    it('should return empty strings for empty icon sequence', () => {
      const iconSequence: IconSequence = {
        icons: [],
        phrases: [],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.short).toBe('');
      expect(result.medium).toBe('');
      expect(result.long).toBe('');
    });
    
    it('should increase confidence with more icons', () => {
      const shortSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
        ],
        phrases: [],
      };
      
      const longSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
          { id: 'want', label: 'want', category: 'actions' },
          { id: 'go', label: 'go', category: 'actions' },
          { id: 'home', label: 'home', category: 'places' },
          { id: 'now', label: 'now', category: 'time' },
        ],
        phrases: [],
      };
      
      const shortResult = buildSentence(shortSequence);
      const longResult = buildSentence(longSequence);
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
    });
    
    it('should include metadata about icon count and categories', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'i', label: 'I', category: 'people' },
          { id: 'happy', label: 'happy', category: 'emotions' },
        ],
        phrases: ['very much'],
      };
      
      const result = buildSentence(iconSequence);
      
      expect(result.metadata.iconCount).toBe(2);
      expect(result.metadata.phraseCount).toBe(1);
      expect(result.metadata.categories).toContain('people');
      expect(result.metadata.categories).toContain('emotions');
    });
    
    it('should use context when provided', () => {
      const iconSequence: IconSequence = {
        icons: [
          { id: 'help', label: 'help', category: 'actions' },
        ],
        phrases: [],
      };
      
      const context: ConversationContext = {
        previousMessages: [],
        mood: 'urgent',
      };
      
      const result = buildSentence(iconSequence, context);
      
      expect(result.metadata.contextUsed).toBe(true);
      // Urgent mood should add "Please" to the sentence
      expect(result.long.toLowerCase()).toContain('please');
    });
  });
  
  describe('AACVoiceBuilder class', () => {
    let builder: AACVoiceBuilder;
    
    beforeEach(() => {
      builder = new AACVoiceBuilder();
    });
    
    describe('Icon library management', () => {
      it('should load default icon library', () => {
        const icons = builder.getIconLibrary();
        expect(icons.length).toBeGreaterThan(0);
      });
      
      it('should filter icons by category', () => {
        const peopleIcons = builder.getIconsByCategory('people');
        expect(peopleIcons.every(icon => icon.category === 'people')).toBe(true);
      });
      
      it('should search icons by label', () => {
        const results = builder.searchIcons('happy');
        expect(results.some(icon => icon.label.includes('happy'))).toBe(true);
      });
      
      it('should search icons by synonym', () => {
        const results = builder.searchIcons('glad');
        // 'glad' is a synonym for 'happy'
        expect(results.some(icon => icon.synonyms?.includes('glad'))).toBe(true);
      });
    });
    
    describe('Sequence building', () => {
      it('should add icons to sequence', () => {
        builder.addIcon('i');
        builder.addIcon('want');
        
        const sequence = builder.getCurrentSequence();
        expect(sequence.icons.length).toBe(2);
        expect(sequence.icons[0].id).toBe('i');
        expect(sequence.icons[1].id).toBe('want');
      });
      
      it('should throw error for invalid icon ID', () => {
        expect(() => builder.addIcon('invalid-id')).toThrow();
      });
      
      it('should add phrases to sequence', () => {
        builder.addPhrase('hello there');
        
        const sequence = builder.getCurrentSequence();
        expect(sequence.phrases).toContain('hello there');
      });
      
      it('should remove last item from sequence', () => {
        builder.addIcon('i');
        builder.addIcon('want');
        builder.addPhrase('food');
        
        builder.removeLastItem(); // Remove phrase
        let sequence = builder.getCurrentSequence();
        expect(sequence.phrases?.length).toBe(0);
        
        builder.removeLastItem(); // Remove icon
        sequence = builder.getCurrentSequence();
        expect(sequence.icons.length).toBe(1);
      });
      
      it('should clear entire sequence', () => {
        builder.addIcon('i');
        builder.addIcon('want');
        builder.addPhrase('food');
        
        builder.clearSequence();
        
        const sequence = builder.getCurrentSequence();
        expect(sequence.icons.length).toBe(0);
        expect(sequence.phrases?.length).toBe(0);
      });
    });
    
    describe('Sentence building', () => {
      it('should build sentence from current sequence', () => {
        builder.addIcon('i');
        builder.addIcon('want');
        builder.addIcon('food');
        
        const result = builder.buildSentenceFromCurrent();
        
        expect(result.short).toBeTruthy();
        expect(result.medium).toBeTruthy();
        expect(result.long).toBeTruthy();
      });
    });
    
    describe('Context management', () => {
      it('should set conversation context', () => {
        const context: ConversationContext = {
          previousMessages: ['Hello', 'How are you?'],
          mood: 'casual',
        };
        
        builder.setContext(context);
        builder.addIcon('i');
        builder.addIcon('good');
        
        const result = builder.buildSentenceFromCurrent();
        expect(result.metadata.contextUsed).toBe(true);
      });
      
      it('should clear conversation context', () => {
        const context: ConversationContext = {
          previousMessages: ['Hello'],
          mood: 'casual',
        };
        
        builder.setContext(context);
        builder.clearContext();
        
        builder.addIcon('i');
        const result = builder.buildSentenceFromCurrent();
        expect(result.metadata.contextUsed).toBe(false);
      });
    });
    
    describe('Quick phrases', () => {
      it('should get quick phrases', () => {
        const phrases = builder.getQuickPhrases();
        expect(phrases.length).toBeGreaterThan(0);
      });
      
      it('should use quick phrase and increment frequency', () => {
        const phrases = builder.getQuickPhrases();
        const firstPhrase = phrases[0];
        const initialFrequency = firstPhrase.frequency;
        
        const text = builder.useQuickPhrase(firstPhrase.id);
        
        expect(text).toBe(firstPhrase.text);
        expect(firstPhrase.frequency).toBe(initialFrequency + 1);
        expect(firstPhrase.lastUsed).toBeInstanceOf(Date);
      });
      
      it('should throw error for invalid quick phrase ID', () => {
        expect(() => builder.useQuickPhrase('invalid-id')).toThrow();
      });
      
      it('should add custom quick phrase', () => {
        const newPhrase = builder.addQuickPhrase('Custom phrase', 'custom');
        
        expect(newPhrase.text).toBe('Custom phrase');
        expect(newPhrase.category).toBe('custom');
        expect(newPhrase.frequency).toBe(0);
        
        const phrases = builder.getQuickPhrases();
        expect(phrases).toContainEqual(newPhrase);
      });
      
      it('should sort quick phrases by frequency', () => {
        // Use some phrases to increase frequency
        const phrases = builder.getQuickPhrases();
        builder.useQuickPhrase(phrases[2].id);
        builder.useQuickPhrase(phrases[2].id);
        builder.useQuickPhrase(phrases[2].id);
        
        const sortedPhrases = builder.getQuickPhrases();
        expect(sortedPhrases[0].id).toBe(phrases[2].id);
      });
    });
    
    describe('Custom phrases', () => {
      it('should save custom phrase with icon sequence', () => {
        const iconSequence: IconSequence = {
          icons: [
            { id: 'i', label: 'I', category: 'people' },
            { id: 'want', label: 'want', category: 'actions' },
          ],
          phrases: [],
        };
        
        builder.saveCustomPhrase('I want', iconSequence);
        
        const customPhrases = builder.getCustomPhrases();
        expect(customPhrases.length).toBe(1);
        expect(customPhrases[0].phrase).toBe('I want');
      });
      
      it('should retrieve custom phrases', async () => {
        // Create a fresh builder for this test
        const freshBuilder = new AACVoiceBuilder();
        
        const iconSequence1: IconSequence = {
          icons: [{ id: 'i', label: 'I', category: 'people' }],
          phrases: [],
        };
        
        const iconSequence2: IconSequence = {
          icons: [{ id: 'you', label: 'you', category: 'people' }],
          phrases: [],
        };
        
        freshBuilder.saveCustomPhrase('Phrase 1', iconSequence1);
        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 2));
        freshBuilder.saveCustomPhrase('Phrase 2', iconSequence2);
        
        const customPhrases = freshBuilder.getCustomPhrases();
        expect(customPhrases.length).toBe(2);
      });
    });
    
    describe('Text-to-speech', () => {
      let mockSpeechSynthesis: any;
      let mockUtterance: any;
      
      // Mock speechSynthesis and SpeechSynthesisUtterance
      beforeEach(() => {
        mockUtterance = {
          text: '',
          rate: 1,
          pitch: 1,
          volume: 1,
          voice: null,
          lang: '',
          onend: null,
          onerror: null,
        };
        
        mockSpeechSynthesis = {
          speak: jest.fn(),
          cancel: jest.fn(),
          getVoices: jest.fn(() => []),
        };
        
        Object.defineProperty(global.window, 'speechSynthesis', {
          value: mockSpeechSynthesis,
          writable: true,
          configurable: true,
        });
        
        global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
          return { ...mockUtterance, text };
        }) as any;
      });
      
      it('should speak text aloud', async () => {
        const text = 'Hello world';
        
        // Mock the speak function to immediately call onend
        mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
          setTimeout(() => {
            if (utterance.onend) utterance.onend();
          }, 0);
        });
        
        await builder.speakAloud(text);
        
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });
      
      it('should apply voice settings', async () => {
        const text = 'Hello';
        const settings = {
          rate: 1.5,
          pitch: 1.2,
          volume: 0.8,
        };
        
        mockSpeechSynthesis.speak.mockImplementation((utterance: any) => {
          expect(utterance.rate).toBe(1.5);
          expect(utterance.pitch).toBe(1.2);
          expect(utterance.volume).toBe(0.8);
          setTimeout(() => {
            if (utterance.onend) utterance.onend();
          }, 0);
        });
        
        await builder.speakAloud(text, settings);
      });
      
      it('should throw error if speech synthesis not supported', async () => {
        // Remove speechSynthesis
        Object.defineProperty(global.window, 'speechSynthesis', {
          value: undefined,
          writable: true,
          configurable: true,
        });
        
        // Create a new builder instance after removing speechSynthesis
        const testBuilder = new AACVoiceBuilder();
        
        await expect(testBuilder.speakAloud('test')).rejects.toThrow(
          'Text-to-speech not supported'
        );
      });
      
      it('should get available voices', () => {
        const mockVoices = [
          { name: 'Voice 1', lang: 'en-US' },
          { name: 'Voice 2', lang: 'en-GB' },
        ] as SpeechSynthesisVoice[];
        
        mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
        
        const voices = builder.getAvailableVoices();
        expect(voices).toEqual(mockVoices);
      });
      
      it('should stop speaking', () => {
        builder.stopSpeaking();
        expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      });
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty icon library', () => {
      const builder = new AACVoiceBuilder([], []);
      const icons = builder.getIconLibrary();
      expect(icons.length).toBe(0);
    });
    
    it('should handle empty quick phrases', () => {
      const builder = new AACVoiceBuilder(defaultIconLibrary, []);
      const phrases = builder.getQuickPhrases();
      expect(phrases.length).toBe(0);
    });
    
    it('should handle sequence with only phrases', () => {
      const iconSequence: IconSequence = {
        icons: [],
        phrases: ['hello', 'world'],
      };
      
      const result = buildSentence(iconSequence);
      // Sentence is capitalized, so check case-insensitively
      expect(result.short.toLowerCase()).toContain('hello');
      expect(result.short.toLowerCase()).toContain('world');
    });
    
    it('should handle very long icon sequences', () => {
      const builder = new AACVoiceBuilder();
      
      // Add many icons
      for (let i = 0; i < 20; i++) {
        builder.addIcon('i');
      }
      
      const result = builder.buildSentenceFromCurrent();
      expect(result.metadata.iconCount).toBe(20);
    });
  });
});
