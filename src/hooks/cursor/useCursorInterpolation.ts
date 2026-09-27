import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface CursorInterpolationConfig {
  /**
   * Interpolation factor for the inner dot.
   * A high factor (e.g., 0.85 - 0.95 or 1.0) ensures instantaneous, snappy pointer tracking
   * while maintaining unified rAF synchronization and perfect center alignment.
   * Default: 0.92
   */
  innerLerp?: number;

  /**
   * Interpolation factor for the outer trailing ring.
   * A lower factor (e.g., 0.18 - 0.28) provides an elegant, fluid trailing inertia.
   * Default: 0.22
   */
  outerLerp?: number;

  /**
   * Interpolation factor for the secondary depth ring / ambient halo.
   * Default: 0.12
   */
  secondaryLerp?: number;

  /**
   * Whether the cursor is running in a desktop fine-pointer environment.
   */
  enabled?: boolean;
}

export interface UseCursorInterpolationReturn {
  /** Whether the custom cursor is supported on the client (desktop with fine pointer) */
  isSupported: boolean;
  /** Current raw target mouse coordinates (X, Y) */
  targetPos: RefObject<{ x: number; y: number }>;
  /** Current interpolated inner dot coordinates (X, Y) */
  innerPos: RefObject<{ x: number; y: number }>;
  /** Current interpolated outer ring coordinates (X, Y) */
  outerPos: RefObject<{ x: number; y: number }>;
  /** Current interpolated secondary ring coordinates (X, Y) */
  secondaryPos: RefObject<{ x: number; y: number }>;
  /** Register DOM element refs to be updated directly in the unified rAF loop */
  bindElements: (elements: {
    inner: HTMLElement | null;
    outer: HTMLElement | null;
    secondary?: HTMLElement | null;
  }) => void;
  /** Programmatically set target position (e.g. for synthetic events or tests) */
  setTarget: (x: number, y: number) => void;
}

/**
 * Unified requestAnimationFrame cursor interpolation hook.
 *
 * Runs a single continuous GPU-synchronized 60-120fps animation loop with
 * distinct interpolation constants for the snappy inner dot, fluid trailing outer ring,
 * and soft secondary depth halo.
 *
 * Guarantees zero React re-renders in the hot path by updating DOM style.transform directly,
 * and maintains perfect concentric centering at all times.
 */
export function useCursorInterpolation(
  config: CursorInterpolationConfig = {}
): UseCursorInterpolationReturn {
  const {
    innerLerp = 0.92,
    outerLerp = 0.22,
    secondaryLerp = 0.12,
    enabled = true,
  } = config;

  const prefersReduced = useReducedMotion();
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Position refs
  const targetPos = useRef({ x: -100, y: -100 });
  const innerPos = useRef({ x: -100, y: -100 });
  const outerPos = useRef({ x: -100, y: -100 });
  const secondaryPos = useRef({ x: -100, y: -100 });

  // DOM node references to update in the single unified rAF loop
  const elementsRef = useRef<{
    inner: HTMLElement | null;
    outer: HTMLElement | null;
    secondary: HTMLElement | null;
  }>({
    inner: null,
    outer: null,
    secondary: null,
  });

  const bindElements = useCallback(
    (elements: {
      inner: HTMLElement | null;
      outer: HTMLElement | null;
      secondary?: HTMLElement | null;
    }) => {
      elementsRef.current = {
        inner: elements.inner,
        outer: elements.outer,
        secondary: elements.secondary || null,
      };
    },
    []
  );

  const setTarget = useCallback((x: number, y: number) => {
    targetPos.current.x = x;
    targetPos.current.y = y;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect fine pointer desktop environment
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointerQuery.matches || !enabled) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    // Initialize position to center of viewport on mount
    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;
    targetPos.current = { x: initX, y: initY };
    innerPos.current = { x: initX, y: initY };
    outerPos.current = { x: initX, y: initY };
    secondaryPos.current = { x: initX, y: initY };

    // Set initial position
    const { inner, outer, secondary } = elementsRef.current;
    if (inner) inner.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;
    if (outer) outer.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;
    if (secondary) secondary.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;

    // Pointer move listener: update target coordinates
    const handlePointerMove = (e: PointerEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId: number | null = null;

    // Unified 60-120fps animation loop
    const tick = () => {
      const tx = targetPos.current.x;
      const ty = targetPos.current.y;

      if (prefersReduced) {
        // Zero delay / lock directly in reduced motion
        innerPos.current.x = tx;
        innerPos.current.y = ty;
        outerPos.current.x = tx;
        outerPos.current.y = ty;
        secondaryPos.current.x = tx;
        secondaryPos.current.y = ty;
      } else {
        // Separate interpolation constants:
        // 1. Snappy Core: near-instantaneous (e.g. 0.92 lerp) keeping the dot perfectly glued to the cursor
        innerPos.current.x += (tx - innerPos.current.x) * innerLerp;
        innerPos.current.y += (ty - innerPos.current.y) * innerLerp;

        // 2. Smooth Trailing Outer Ring: fluid damping (e.g. 0.22 lerp) for luxury feel
        outerPos.current.x += (tx - outerPos.current.x) * outerLerp;
        outerPos.current.y += (ty - outerPos.current.y) * outerLerp;

        // 3. Ambient Secondary Ring: deeper inertia (e.g. 0.12 lerp)
        secondaryPos.current.x += (tx - secondaryPos.current.x) * secondaryLerp;
        secondaryPos.current.y += (ty - secondaryPos.current.y) * secondaryLerp;
      }

      const { inner, outer, secondary } = elementsRef.current;

      // Apply GPU-accelerated translate3d transforms directly
      if (inner) {
        inner.style.transform = `translate3d(${innerPos.current.x.toFixed(2)}px, ${innerPos.current.y.toFixed(2)}px, 0)`;
      }
      if (outer) {
        outer.style.transform = `translate3d(${outerPos.current.x.toFixed(2)}px, ${outerPos.current.y.toFixed(2)}px, 0)`;
      }
      if (secondary) {
        secondary.style.transform = `translate3d(${secondaryPos.current.x.toFixed(2)}px, ${secondaryPos.current.y.toFixed(2)}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [innerLerp, outerLerp, secondaryLerp, enabled, prefersReduced]);

  return {
    isSupported,
    targetPos,
    innerPos,
    outerPos,
    secondaryPos,
    bindElements,
    setTarget,
  };
}
