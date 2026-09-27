import { useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { applyMagneticAttraction, resetMagneticElement, stopMagneticSpring } from './useCursor';

interface UseMagneticOptions {
  maxDisplacement?: number; // Maximum offset in px (default 6)
  strength?: number;        // Magnetic pull coefficient (default 0.22, range 0.15 - 0.30)
  range?: number;           // Custom detection radius in px
  damping?: number;         // Spring damping (default 22)
  stiffness?: number;       // Spring stiffness (default 220)
  disabled?: boolean;
}

/**
 * Reusable hook for adding magnetic physics to interactive elements.
 * Pulls the element slightly toward the cursor within controlled bounds (4–8px)
 * using real-time spring physics for smooth, non-snapping fluid motion.
 */
export function useMagneticElement<T extends HTMLElement = HTMLElement>(
  options: UseMagneticOptions = {}
) {
  const {
    maxDisplacement = 6,
    strength = 0.22,
    range,
    damping = 22,
    stiffness = 220,
    disabled = false,
  } = options;
  const elementRef = useRef<T | null>(null);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (disabled || prefersReduced || !elementRef.current) return;

      const vector = applyMagneticAttraction(elementRef.current, e.clientX, e.clientY, {
        strength,
        range,
        maxDisplacement,
        damping,
        stiffness,
      });

      if (!vector.isWithinThreshold) {
        resetMagneticElement(elementRef.current, { damping, stiffness });
      }
    },
    [disabled, prefersReduced, maxDisplacement, strength, range, damping, stiffness]
  );

  const handleMouseLeave = useCallback(() => {
    if (!elementRef.current) return;
    resetMagneticElement(elementRef.current, { damping, stiffness });
  }, [damping, stiffness]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || disabled || prefersReduced) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      stopMagneticSpring(el);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [handleMouseMove, handleMouseLeave, disabled, prefersReduced]);

  return elementRef;
}
