/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Unit tests for AAC Icon Selector Component
 * 
 * Tests icon selection interface, phrase building, and accessibility features.
 * 
 * Requirements: 2.1, 2.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AACIconSelector } from '../AACIconSelector';
import { AACVoiceBuilder, SentenceResult } from '@/lib/aac-voice-builder';

// Mock the announceToScreenReader function
jest.mock('@/lib/accessibility', () => ({
  ...jest.requireActual('@/lib/accessibility'),
  announceToScreenReader: jest.fn(),
}));

describe('AACIconSelector', () => {
  beforeEach(() => {
    // Mock speechSynthesis
    global.window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => []),
    } as any;
  });
  
  describe('Rendering', () => {
    it('should render the component', () => {
      render(<AACIconSelector />);
      expect(screen.getByText('AAC Voice Builder')).toBeInTheDocument();
    });
    
    it('should render search input', () => {
      render(<AACIconSelector />);
      const searchInput = screen.getByLabelText(/search for aac icons/i);
      expect(searchInput).toBeInTheDocument();
    });
    
    it('should render category filters', () => {
      render(<AACIconSelector />);
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('People')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Emotions')).toBeInTheDocument();
    });
    
    it('should render icon grid', () => {
      render(<AACIconSelector />);
      const iconGrid = screen.getByRole('region', { name: /available icons/i });
      expect(iconGrid).toBeInTheDocument();
    });
    
    it('should render current sequence display', () => {
      render(<AACIconSelector />);
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toBeInTheDocument();
    });
    
    it('should show quick phrases when enabled', () => {
      render(<AACIconSelector showQuickPhrases={true} />);
      const quickPhrasesButton = screen.getByText(/show quick phrases/i);
      expect(quickPhrasesButton).toBeInTheDocument();
    });
    
    it('should hide quick phrases when disabled', () => {
      render(<AACIconSelector showQuickPhrases={false} />);
      const quickPhrasesButton = screen.queryByText(/show quick phrases/i);
      expect(quickPhrasesButton).not.toBeInTheDocument();
    });
  });
  
  describe('Icon selection', () => {
    it('should display icons from default library', () => {
      render(<AACIconSelector />);
      
      // Check for some default icons
      expect(screen.getByText('I')).toBeInTheDocument();
      expect(screen.getByText('want')).toBeInTheDocument();
      expect(screen.getByText('happy')).toBeInTheDocument();
    });
    
    it('should add icon to sequence when clicked', () => {
      render(<AACIconSelector />);
      
      const iconButton = screen.getByRole('button', { name: /add I to sentence/i });
      fireEvent.click(iconButton);
      
      // Check if icon appears in sequence display
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveTextContent('I');
    });
    
    it('should add multiple icons to sequence', () => {
      render(<AACIconSelector />);
      
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add want to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add food to sentence/i }));
      
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveTextContent('I');
      expect(sequenceDisplay).toHaveTextContent('want');
      expect(sequenceDisplay).toHaveTextContent('food');
    });
  });
  
  describe('Category filtering', () => {
    it('should filter icons by category', () => {
      render(<AACIconSelector />);
      
      // Click on "Emotions" category
      const emotionsButton = screen.getByRole('button', { name: /filter by emotions/i });
      fireEvent.click(emotionsButton);
      
      // Should show emotion icons
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('sad')).toBeInTheDocument();
      
      // Should not show non-emotion icons (they might not be visible)
      // We can check that the category button is pressed
      expect(emotionsButton).toHaveAttribute('aria-pressed', 'true');
    });
    
    it('should show all icons when "All" category is selected', () => {
      render(<AACIconSelector />);
      
      // First select a specific category
      fireEvent.click(screen.getByRole('button', { name: /filter by people/i }));
      
      // Then select "All"
      const allButton = screen.getByRole('button', { name: /filter by all/i });
      fireEvent.click(allButton);
      
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
  
  describe('Search functionality', () => {
    it('should filter icons by search query', () => {
      render(<AACIconSelector />);
      
      const searchInput = screen.getByLabelText(/search for aac icons/i);
      fireEvent.change(searchInput, { target: { value: 'happy' } });
      
      // Should show happy icon
      expect(screen.getByText('happy')).toBeInTheDocument();
    });
    
    it('should show no results message when search has no matches', () => {
      render(<AACIconSelector />);
      
      const searchInput = screen.getByLabelText(/search for aac icons/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistenticon' } });
      
      expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
    });
  });
  
  describe('Sequence management', () => {
    it('should remove last item when undo is clicked', () => {
      render(<AACIconSelector />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add want to sentence/i }));
      
      // Click undo
      const undoButton = screen.getByRole('button', { name: /remove last item/i });
      fireEvent.click(undoButton);
      
      // Should still have "I" but not "want"
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveTextContent('I');
      expect(sequenceDisplay).not.toHaveTextContent('want');
    });
    
    it('should clear all items when clear is clicked', () => {
      render(<AACIconSelector />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add want to sentence/i }));
      
      // Click clear
      const clearButton = screen.getByRole('button', { name: /clear all items/i });
      fireEvent.click(clearButton);
      
      // Should show empty message
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveTextContent(/select icons or phrases/i);
    });
    
    it('should disable undo and clear buttons when sequence is empty', () => {
      render(<AACIconSelector />);
      
      const undoButton = screen.getByRole('button', { name: /remove last item/i });
      const clearButton = screen.getByRole('button', { name: /clear all items/i });
      
      expect(undoButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });
  
  describe('Sentence generation', () => {
    it('should generate sentence when icons are added', () => {
      render(<AACIconSelector />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add want to sentence/i }));
      
      // Should show generated sentence
      const sentenceOutput = screen.getByRole('region', { name: /generated sentences/i });
      expect(sentenceOutput).toBeInTheDocument();
    });
    
    it('should call onSentenceBuilt callback', () => {
      const onSentenceBuilt = jest.fn();
      render(<AACIconSelector onSentenceBuilt={onSentenceBuilt} />);
      
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      expect(onSentenceBuilt).toHaveBeenCalled();
      expect(onSentenceBuilt).toHaveBeenCalledWith(
        expect.objectContaining({
          short: expect.any(String),
          medium: expect.any(String),
          long: expect.any(String),
          confidence: expect.any(Number),
        })
      );
    });
  });
  
  describe('Complexity levels', () => {
    it('should display complexity level buttons', () => {
      render(<AACIconSelector />);
      
      // Add an icon to generate sentence
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      expect(screen.getByRole('radio', { name: /short complexity/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /medium complexity/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /long complexity/i })).toBeInTheDocument();
    });
    
    it('should switch between complexity levels', () => {
      render(<AACIconSelector initialComplexity="short" />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      fireEvent.click(screen.getByRole('button', { name: /add happy to sentence/i }));
      
      // Check initial complexity
      const shortButton = screen.getByRole('radio', { name: /short complexity/i });
      expect(shortButton).toHaveAttribute('aria-checked', 'true');
      
      // Switch to medium
      const mediumButton = screen.getByRole('radio', { name: /medium complexity/i });
      fireEvent.click(mediumButton);
      expect(mediumButton).toHaveAttribute('aria-checked', 'true');
    });
  });
  
  describe('Text-to-speech', () => {
    it('should speak sentence when speak button is clicked', async () => {
      const onSentenceSpoken = jest.fn();
      render(<AACIconSelector onSentenceSpoken={onSentenceSpoken} />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      // Mock speak to immediately call onend
      (window.speechSynthesis.speak as jest.Mock).mockImplementation((utterance) => {
        setTimeout(() => utterance.onend(), 0);
      });
      
      // Click speak button
      const speakButton = screen.getByRole('button', { name: /speak sentence aloud/i });
      fireEvent.click(speakButton);
      
      await waitFor(() => {
        expect(window.speechSynthesis.speak).toHaveBeenCalled();
      });
    });
    
    it('should show stop button while speaking', async () => {
      render(<AACIconSelector />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      // Mock speak to not complete immediately
      (window.speechSynthesis.speak as jest.Mock).mockImplementation(() => {
        // Don't call onend
      });
      
      // Click speak button
      const speakButton = screen.getByRole('button', { name: /speak sentence aloud/i });
      fireEvent.click(speakButton);
      
      // Should show stop button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop speaking/i })).toBeInTheDocument();
      });
    });
    
    it('should stop speaking when stop button is clicked', async () => {
      render(<AACIconSelector />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      // Mock speak to not complete immediately
      (window.speechSynthesis.speak as jest.Mock).mockImplementation(() => {});
      
      // Click speak button
      const speakButton = screen.getByRole('button', { name: /speak sentence aloud/i });
      fireEvent.click(speakButton);
      
      // Click stop button
      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop speaking/i });
        fireEvent.click(stopButton);
      });
      
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });
  
  describe('Quick phrases', () => {
    it('should show quick phrases panel when toggled', () => {
      render(<AACIconSelector showQuickPhrases={true} />);
      
      const toggleButton = screen.getByRole('button', { name: /show quick phrases/i });
      fireEvent.click(toggleButton);
      
      const panel = screen.getByRole('region', { name: /quick phrases/i });
      expect(panel).toBeInTheDocument();
    });
    
    it('should hide quick phrases panel when toggled again', () => {
      render(<AACIconSelector showQuickPhrases={true} />);
      
      const toggleButton = screen.getByRole('button', { name: /show quick phrases/i });
      
      // Show panel
      fireEvent.click(toggleButton);
      expect(screen.getByRole('region', { name: /quick phrases/i })).toBeInTheDocument();
      
      // Hide panel
      fireEvent.click(toggleButton);
      expect(screen.queryByRole('region', { name: /quick phrases/i })).not.toBeInTheDocument();
    });
    
    it('should add quick phrase to sequence when clicked', () => {
      render(<AACIconSelector showQuickPhrases={true} />);
      
      // Show quick phrases
      const toggleButton = screen.getByRole('button', { name: /show quick phrases/i });
      fireEvent.click(toggleButton);
      
      // Click a quick phrase
      const quickPhrase = screen.getByRole('button', { name: /quick phrase: I need help/i });
      fireEvent.click(quickPhrase);
      
      // Should appear in sequence
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveTextContent('I need help');
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AACIconSelector />);
      
      expect(screen.getByRole('region', { name: /aac controls/i })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /icon categories/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /available icons/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /current sentence sequence/i })).toBeInTheDocument();
    });
    
    it('should have aria-live region for sequence updates', () => {
      render(<AACIconSelector />);
      
      const sequenceDisplay = screen.getByRole('region', { name: /current sentence sequence/i });
      expect(sequenceDisplay).toHaveAttribute('aria-live', 'polite');
    });
    
    it('should have proper button labels', () => {
      render(<AACIconSelector />);
      
      // Add an icon to enable buttons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      expect(screen.getByRole('button', { name: /remove last item/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all items/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /speak sentence aloud/i })).toBeInTheDocument();
    });
    
    it('should support keyboard navigation', () => {
      render(<AACIconSelector />);
      
      const iconButton = screen.getByRole('button', { name: /add I to sentence/i });
      
      // Should be focusable
      iconButton.focus();
      expect(document.activeElement).toBe(iconButton);
    });
  });
  
  describe('Custom builder', () => {
    it('should use custom builder when provided', () => {
      const customBuilder = new AACVoiceBuilder();
      render(<AACIconSelector builder={customBuilder} />);
      
      // Should render with custom builder
      expect(screen.getByText('AAC Voice Builder')).toBeInTheDocument();
    });
  });
  
  describe('Voice settings', () => {
    it('should apply custom voice settings', async () => {
      const voiceSettings = {
        rate: 1.5,
        pitch: 1.2,
        volume: 0.8,
      };
      
      render(<AACIconSelector voiceSettings={voiceSettings} />);
      
      // Add icons
      fireEvent.click(screen.getByRole('button', { name: /add I to sentence/i }));
      
      // Mock speak to check settings
      (window.speechSynthesis.speak as jest.Mock).mockImplementation((utterance) => {
        expect(utterance.rate).toBe(1.5);
        expect(utterance.pitch).toBe(1.2);
        expect(utterance.volume).toBe(0.8);
        setTimeout(() => utterance.onend(), 0);
      });
      
      // Click speak button
      const speakButton = screen.getByRole('button', { name: /speak sentence aloud/i });
      fireEvent.click(speakButton);
      
      await waitFor(() => {
        expect(window.speechSynthesis.speak).toHaveBeenCalled();
      });
    });
  });
});
