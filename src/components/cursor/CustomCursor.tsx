import React, { useEffect, useRef, useState, useCallback } from 'react';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import './cursor.css';

export interface CustomCursorProps {
  /** Configurable magnetic attraction strength (default: 0.22, range: 0.15 - 0.30) */
  magneticStrength?: number;
}

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength = 0.22 }) => {
  // Direct DOM element references for 60-120 FPS performance (zero React state during mouse movement)
  const coreRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const secRingRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  // Position references
  const targetPos = useRef({ x: -100, y: -100 });
  const corePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const secRingPos = useRef({ x: -100, y: -100 });

  // Initialized flag and touch detection
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const rippleIdRef = useRef(0);

  // Active magnetic element tracker
  const activeMagneticRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedRef = useRef(false);

  // Clean up a completed ripple
  const handleRippleEnd = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect fine pointer desktop environment (hover capability + fine pointer)
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointerQuery.matches) {
      setIsSupported(false);
      return;
    }

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedRef.current = reducedMotionQuery.matches;

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedRef.current = e.matches;
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Confirmed custom cursor is running on desktop: safely hide native cursor
    document.documentElement.classList.add('custom-cursor-enabled');

    // Initialize cursor coordinates immediately to center of screen so cursor is ALWAYS visible
    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;
    targetPos.current = { x: initX, y: initY };
    corePos.current = { x: initX, y: initY };
    ringPos.current = { x: initX, y: initY };
    secRingPos.current = { x: initX, y: initY };

    if (coreRef.current) {
      coreRef.current.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;
    }
    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;
    }
    if (secRingRef.current) {
      secRingRef.current.style.transform = `translate3d(${initX}px, ${initY}px, 0)`;
    }

    // Update target position on pointer movement
    const handlePointerMove = (e: PointerEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      targetPos.current.x = clientX;
      targetPos.current.y = clientY;

      // Inspect target for semantic hover states
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isButton = !!target.closest('button, [role="button"], [data-cursor="button"]');
      const isProject = !!target.closest('[data-cursor="project"], [data-cursor="view"], [data-cursor="image"]');
      const isLink = !isButton && !isProject && !!target.closest('a, [data-cursor="link"], [data-cursor="open"], [data-cursor="external"]');
      const isText = !isButton && !isProject && !isLink && !!target.closest('input, textarea, [contenteditable="true"]');

      // Update classes directly on DOM elements without React re-render
      const ringEl = ringRef.current;
      const secRingEl = secRingRef.current;
      const coreEl = coreRef.current;
      const labelEl = labelRef.current;

      if (ringEl && secRingEl && coreEl) {
        ringEl.classList.remove('is-button', 'is-link', 'is-project', 'is-text');
        secRingEl.classList.remove('is-button', 'is-link', 'is-project', 'is-text');
        coreEl.classList.remove('is-button', 'is-text');

        if (isProject) {
          ringEl.classList.add('is-project');
          secRingEl.classList.add('is-project');
          if (labelEl) labelEl.style.display = 'block';
        } else {
          if (labelEl) labelEl.style.display = 'none';

          if (isButton) {
            ringEl.classList.add('is-button');
            secRingEl.classList.add('is-button');
            coreEl.classList.add('is-button');
          } else if (isLink) {
            ringEl.classList.add('is-link');
            secRingEl.classList.add('is-link');
          } else if (isText) {
            ringEl.classList.add('is-text');
            secRingEl.classList.add('is-text');
            coreEl.classList.add('is-text');
          }
        }
      }

      // Magnetic Element Handling
      const magneticEl = target.closest('[data-magnetic]') as HTMLElement | null;
      if (magneticEl && !prefersReducedRef.current) {
        if (activeMagneticRef.current && activeMagneticRef.current !== magneticEl) {
          resetMagneticElement(activeMagneticRef.current);
        }
        activeMagneticRef.current = magneticEl;
        applyMagneticAttraction(magneticEl, clientX, clientY, {
          strength: magneticStrength,
          maxDisplacement: 8,
        });
      } else if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
        activeMagneticRef.current = null;
      }
    };

    // Click effect (expanding ripple) - cursor remains 100% visible throughout
    const handlePointerDown = (e: PointerEvent) => {
      if (prefersReducedRef.current) return;
      rippleIdRef.current += 1;
      const newRipple: RippleItem = {
        id: rippleIdRef.current,
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev.slice(-3), newRipple]);
    };

    // Clean release of magnetic target when mouse leaves window, but NEVER hide the cursor
    const handleWindowBlur = () => {
      if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
        activeMagneticRef.current = null;
      }
    };

    // Main 60-120 FPS Motion Loop
    const tick = () => {
      const targetX = targetPos.current.x;
      const targetY = targetPos.current.y;

      if (prefersReducedRef.current) {
        corePos.current.x = targetX;
        corePos.current.y = targetY;
        ringPos.current.x = targetX;
        ringPos.current.y = targetY;
        secRingPos.current.x = targetX;
        secRingPos.current.y = targetY;
      } else {
        // Inner dot: very fast, near-immediate follow
        corePos.current.x += (targetX - corePos.current.x) * 0.75;
        corePos.current.y += (targetY - corePos.current.y) * 0.75;

        // Outer ring: slightly delayed smooth inertia
        ringPos.current.x += (targetX - ringPos.current.x) * 0.18;
        ringPos.current.y += (targetY - ringPos.current.y) * 0.18;

        // Secondary ring: slightly more delayed depth ring
        secRingPos.current.x += (targetX - secRingPos.current.x) * 0.08;
        secRingPos.current.y += (targetY - secRingPos.current.y) * 0.08;
      }

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }
      if (secRingRef.current) {
        secRingRef.current.style.transform = `translate3d(${secRingPos.current.x}px, ${secRingPos.current.y}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleWindowBlur);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      document.documentElement.classList.remove('custom-cursor-enabled');
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
      }
    };
  }, [magneticStrength]);

  // If touch/coarse pointer device, do NOT show custom cursor
  if (!isSupported) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="custom-cursor"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '40px',
        height: '40px',
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: 1,
        visibility: 'visible',
        display: 'block',
      }}
    >
      {/* 3. Secondary Ring: 55-70px subtle larger ring that creates depth */}
      <div
        ref={secRingRef}
        className="cursor-secondary-ring"
      />

      {/* 2. Outer Ring: 32-42px thin circular ring with smooth animation */}
      <div
        ref={ringRef}
        className="cursor-outer-ring"
      >
        {/* Tiny VIEW label inside project hover state (always high contrast) */}
        <span
          ref={labelRef}
          className="cursor-view-label"
          style={{ display: 'none' }}
        >
          VIEW
        </span>
      </div>

      {/* 1. Inner Core: 5-7px crisp solid brand dot with strong contrast */}
      <div
        ref={coreRef}
        className="cursor-inner-core"
      />

      {/* Click Expanding Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="cursor-click-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
          onAnimationEnd={() => handleRippleEnd(ripple.id)}
        />
      ))}
    </div>
  );
};
