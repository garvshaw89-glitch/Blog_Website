import { useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface UseMagneticOptions {
  maxDisplacement?: number; // Maximum offset in px (default 8)
  damping?: number;         // Spring responsiveness (default 0.25)
  disabled?: boolean;
}

/**
 * Reusable hook for adding magnetic physics to interactive elements.
 * Pulls the element slightly toward the cursor within controlled bounds (4–12px).
 */
export function useMagneticElement<T extends HTMLElement = HTMLElement>(
  options: UseMagneticOptions = {}
) {
  const { maxDisplacement = 8, damping = 0.25, disabled = false } = options;
  const elementRef = useRef<T | null>(null);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (disabled || prefersReduced || !elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const distance = Math.hypot(deltaX, deltaY);
      const threshold = Math.max(rect.width, rect.height) * 0.85;

      if (distance < threshold) {
        const moveX = Math.max(-maxDisplacement, Math.min(maxDisplacement, deltaX * damping));
        const moveY = Math.max(-maxDisplacement, Math.min(maxDisplacement, deltaY * damping));

        elementRef.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        elementRef.current.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)';
      } else {
        elementRef.current.style.transform = 'translate3d(0, 0, 0)';
        elementRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      }
    },
    [disabled, prefersReduced, maxDisplacement, damping]
  );

  const handleMouseLeave = useCallback(() => {
    if (!elementRef.current) return;
    elementRef.current.style.transform = 'translate3d(0, 0, 0)';
    elementRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
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
