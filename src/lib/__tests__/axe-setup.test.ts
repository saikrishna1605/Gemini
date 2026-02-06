/**
 * Unit tests for axe-core setup and configuration
 * Tests the automated accessibility testing configuration
 */

import { axeConfig } from '../axe-setup';

describe('Axe-core Setup', () => {
  describe('axeConfig', () => {
    it('should have core WCAG 2.1 AA rules enabled', () => {
      expect(axeConfig.rules['color-contrast'].enabled).toBe(true);
      expect(axeConfig.rules['keyboard'].enabled).toBe(true);
      expect(axeConfig.rules['image-alt'].enabled).toBe(true);
      expect(axeConfig.rules['label'].enabled).toBe(true);
      expect(axeConfig.rules['heading-order'].enabled).toBe(true);
    });

    it('should have ARIA rules enabled', () => {
      expect(axeConfig.rules['aria-valid-attr'].enabled).toBe(true);
      expect(axeConfig.rules['aria-valid-attr-value'].enabled).toBe(true);
      expect(axeConfig.rules['aria-roles'].enabled).toBe(true);
    });

    it('should have interactive element rules enabled', () => {
      expect(axeConfig.rules['interactive-controls-name'].enabled).toBe(true);
      expect(axeConfig.rules['button-name'].enabled).toBe(true);
      expect(axeConfig.rules['link-name'].enabled).toBe(true);
    });

    it('should have form accessibility rules enabled', () => {
      expect(axeConfig.rules['form-field-multiple-labels'].enabled).toBe(true);
      expect(axeConfig.rules['input-button-name'].enabled).toBe(true);
      expect(axeConfig.rules['select-name'].enabled).toBe(true);
      expect(axeConfig.rules['textarea-name'].enabled).toBe(true);
    });

    it('should have page structure rules enabled', () => {
      expect(axeConfig.rules['page-has-heading-one'].enabled).toBe(true);
      expect(axeConfig.rules['landmark-one-main'].enabled).toBe(true);
      expect(axeConfig.rules['duplicate-id'].enabled).toBe(true);
    });

    it('should have mobile accessibility rules enabled', () => {
      expect(axeConfig.rules['target-size'].enabled).toBe(true);
      expect(axeConfig.rules['motion'].enabled).toBe(true);
    });

    it('should include WCAG 2.1 AA tags', () => {
      expect(axeConfig.tags).toContain('wcag2a');
      expect(axeConfig.tags).toContain('wcag2aa');
      expect(axeConfig.tags).toContain('wcag21aa');
      expect(axeConfig.tags).toContain('best-practice');
    });
  });
});
