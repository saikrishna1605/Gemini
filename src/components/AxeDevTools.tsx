'use client';

import { useEffect } from 'react';
import { setupAxeCore } from '@/lib/axe-setup';

export function AxeDevTools() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      setupAxeCore();
    }
  }, []);

  // This component doesn't render anything
  return null;
}