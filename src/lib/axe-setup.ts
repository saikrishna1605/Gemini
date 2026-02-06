/**
 * Axe-core setup for automated accessibility testing
 * This file configures axe-core for development and testing environments
 */

// Configure axe-core for development
export function setupAxeCore() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues
    import('@axe-core/react').then((axeReact) => {
      import('react').then((React) => {
        import('react-dom').then((ReactDOM) => {
          // Initialize axe-core React integration
          if (axeReact.default) {
            axeReact.default(React, ReactDOM, 1000);
          }
        });
      });
    }).catch((error) => {
      console.warn('Failed to initialize axe-core:', error);
    });
  }
}

// Axe configuration for testing environments
export const axeConfig = {
  rules: {
    // Core WCAG 2.1 AA compliance rules
    'color-contrast': { enabled: true },
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'heading-order': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-roles': { enabled: true },
    'interactive-controls-name': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'landmark-one-main': { enabled: true },
    'duplicate-id': { enabled: true },
    
    // Additional accessibility rules for UNSAID/UNHEARD
    'button-name': { enabled: true },
    'link-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'input-button-name': { enabled: true },
    'select-name': { enabled: true },
    'textarea-name': { enabled: true },
    
    // Touch target size (custom rule for mobile accessibility)
    'target-size': { enabled: true },
    
    // Motion and animation accessibility
    'motion': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
};

// Helper function to run axe tests programmatically
export async function runAxeTest(element?: Element): Promise<unknown> {
  if (typeof window === 'undefined') {
    return null; // Skip in SSR
  }
  
  const axe = await import('axe-core');
  
  try {
    const results = await axe.run(element || document, axeConfig);
    
    if (results.violations.length > 0) {
      console.group('🚨 Accessibility Violations Found');
      results.violations.forEach((violation) => {
        console.error(`${violation.impact}: ${violation.description}`);
        console.log(`Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node) => {
          console.log('Element:', node.target);
          console.log('HTML:', node.html);
        });
      });
      console.groupEnd();
    } else {
      console.log('✅ No accessibility violations found');
    }
    
    return results;
  } catch (error) {
    console.error('Error running axe accessibility test:', error);
    return null;
  }
}

// React hook for running axe tests on component mount
export function useAxeTest(ref: React.RefObject<HTMLElement>, enabled = process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  
  React.useEffect(() => {
    if (!enabled || !ref.current) return;
    
    const timeoutId = setTimeout(() => {
      runAxeTest(ref.current!);
    }, 1000); // Delay to allow component to fully render
    
    return () => clearTimeout(timeoutId);
  }, [ref, enabled]);
}