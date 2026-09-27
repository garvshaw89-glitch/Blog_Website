import { useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { applyMagneticAttraction, resetMagneticElement } from './useCursor';

interface UseMagneticOptions {
  maxDisplacement?: number; // Maximum offset in px (default 6)
  damping?: number;         // Spring responsiveness (default 0.22, range 0.15 - 0.30)
  disabled?: boolean;
}

/**
 * Reusable hook for adding magnetic physics to interactive elements.
 * Pulls the element slightly toward the cursor within controlled bounds (4–8px).
 */
export function useMagneticElement<T extends HTMLElement = HTMLElement>(
  options: UseMagneticOptions = {}
) {
  const { maxDisplacement = 6, damping = 0.22, disabled = false } = options;
  const elementRef = useRef<T | null>(null);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (disabled || prefersReduced || !elementRef.current) return;

      const vector = applyMagneticAttraction(elementRef.current, e.clientX, e.clientY, {
        strength: damping,
        maxDisplacement,
      });

      if (!vector.isWithinThreshold) {
        resetMagneticElement(elementRef.current);
      }
    },
    [disabled, prefersReduced, maxDisplacement, damping]
  );

  const handleMouseLeave = useCallback(() => {
    if (!elementRef.current) return;
    resetMagneticElement(elementRef.current);
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || disabled || prefersReduced) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [handleMouseMove, handleMouseLeave, disabled, prefersReduced]);

  return elementRef;
}
