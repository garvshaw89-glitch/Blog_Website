import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ParticleScene } from './ParticleScene';
import { EntryComposition } from './EntryComposition';
import { AsteroidFlightAnimation } from './asteroid/AsteroidFlightAnimation';
import { EntryAsteroidLanding } from './EntryAsteroidLanding';
import { ScrollToViewPrompt } from './ScrollToViewPrompt';
import { IntroOverlay } from './IntroOverlay';
import { IntroScene } from './IntroScene';
import { WebGlFallback } from './WebGlFallback';
import { introAudio } from './introAudio';

export type IntroPhase = 'sand' | 'asteroid' | 'prompt' | 'portal' | 'zooming';

interface LuxuryIntroProps {
  onComplete: () => void;
  onRocketCursorReady?: () => void;
  onPhaseChange?: (phase: IntroPhase) => void;
}

const SAND_HOLD_END_SEC = 8.75;
const SAND_EXIT_DURATION_SEC = 0.85;
const PORTAL_REVEAL_DURATION_SEC = 0.82;
const ZOOM_DURATION_SEC = 1.32;
const PORTAL_ZOOM_THRESHOLD = 0.78;

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({
  onComplete,
  onRocketCursorReady,
  onPhaseChange,
}) => {
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const [phase, setPhase] = useState<IntroPhase>('sand');
  const [isAudioOn, setIsAudioOn] = useState<boolean>(introAudio.enabled);
  const [webGlFailed, setWebGlFailed] = useState<boolean>(false);
  const [asteroidWebGlFailed, setAsteroidWebGlFailed] = useState<boolean>(false);
  const [isExitingSand, setIsExitingSand] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Refs shared at 60-120fps with Three.js & SVG knockout layers (zero React re-renders per frame)
  const timelineSecRef = useRef<number>(0);
  const isExitingRef = useRef<boolean>(false);
  const exitProgressRef = useRef<number>(0);
  const isHoveringEnterRef = useRef<boolean>(false);

  const portalElapsedRef = useRef<number>(0);
  const portalRevealRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const zoomProgressRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  const phaseRef = useRef<IntroPhase>('sand');
  const webGlFailedRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  const onRocketCursorReadyRef = useRef(onRocketCursorReady);
  const onPhaseChangeRef = useRef(onPhaseChange);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onRocketCursorReadyRef.current = onRocketCursorReady;
  }, [onRocketCursorReady]);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    onPhaseChangeRef.current?.(phase);
  }, [phase]);

  const setPhaseSafe = useCallback((next: IntroPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // Lock body scrolling during the full entry experience
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleToggleAudio = useCallback(() => {
    const next = introAudio.toggle();
    setIsAudioOn(next);
  }, []);

  const handleWebGLError = useCallback(() => {
    webGlFailedRef.current = true;
    setWebGlFailed(true);
  }, []);

  const handleAsteroidWebGLError = useCallback(() => {
    setAsteroidWebGlFailed(true);
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onRocketCursorReadyRef.current?.();
    onCompleteRef.current();
  }, []);

  const triggerPortalZoom = useCallback(() => {
    if (phaseRef.current === 'zooming' || completedRef.current) return;
    phaseRef.current = 'zooming';
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setPhase('zooming');
    introAudio.triggerWarp();
  }, []);

  // Master 60fps animation driver for Act 1 (THINK. CREATE. DISCOVER.), Portal Reveal, Scroll Damping & T-Zoom
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let sandExitElapsed = 0;
    let portalRevealElapsed = 0;
    let zoomElapsed = 0;

    // Reduced-motion quick progression through Act 1
    if (prefersReducedMotion) {
      timelineSecRef.current = 8.5;
    }

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const curPhase = phaseRef.current;

      if (curPhase === 'sand') {
        const holdEnd = prefersReducedMotion ? 1.45 : SAND_HOLD_END_SEC;
        timelineSecRef.current += dt;

        if (timelineSecRef.current >= holdEnd && !isExitingRef.current) {
          isExitingRef.current = true;
          setIsExitingSand(true);
        }

        if (isExitingRef.current) {
          sandExitElapsed += dt;
          const exitDur = prefersReducedMotion ? 0.35 : SAND_EXIT_DURATION_SEC;
          exitProgressRef.current = Math.min(1, sandExitElapsed / exitDur);

          if (exitProgressRef.current >= 1) {
            if (webGlFailedRef.current) {
              onRocketCursorReadyRef.current?.();
              setPhaseSafe('portal');
            } else {
              setPhaseSafe('asteroid');
            }
          }
        }
      } else if (curPhase === 'portal') {
        portalElapsedRef.current += dt;
        portalRevealElapsed += dt;
        portalRevealRef.current = Math.min(
          1,
          portalRevealElapsed / (prefersReducedMotion ? 0.25 : PORTAL_REVEAL_DURATION_SEC)
        );

        // Smooth C2-like exponential scroll damping for buttery 60-120fps tracking
        const damp = 1 - Math.exp(-6.5 * dt);
        scrollProgressRef.current +=
          (targetScrollRef.current - scrollProgressRef.current) * damp;

        if (scrollProgressRef.current >= PORTAL_ZOOM_THRESHOLD) {
          triggerPortalZoom();
        }
      } else if (curPhase === 'zooming') {
        portalElapsedRef.current += dt;
        portalRevealRef.current = 1;
        zoomElapsed += dt;
        const zDur = prefersReducedMotion ? 0.45 : ZOOM_DURATION_SEC;
        zoomProgressRef.current = Math.min(1, zoomElapsed / zDur);

        if (zoomProgressRef.current >= 1) {
          finishIntro();
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, setPhaseSafe, triggerPortalZoom, finishIntro]);

  // Wheel, touch swipe, and keyboard handlers for smooth scrolling through PORTFOLIO BY GARV SHAW
  useEffect(() => {
    let touchStartY = 0;

    const advancePortalScroll = (delta: number) => {
      if (phaseRef.current === 'prompt') {
        if (delta > 0) {
          setPhaseSafe('portal');
          targetScrollRef.current = Math.min(1, Math.max(0, delta * 0.6));
        }
        return;
      }
      if (phaseRef.current !== 'portal') return;
      targetScrollRef.current = Math.min(
        1,
        Math.max(0, targetScrollRef.current + delta)
      );
    };

    const handleWheel = (e: WheelEvent) => {
      if (phaseRef.current !== 'portal' && phaseRef.current !== 'prompt') return;
      e.preventDefault();
      // Normalize pixel/line/page deltas smoothly
      const modeMult = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      const rawDelta = (e.deltaY * modeMult) / Math.max(2600, window.innerHeight * 3.1);
      const clampedStep = Math.max(-0.14, Math.min(0.14, rawDelta));
      advancePortalScroll(clampedStep);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (phaseRef.current !== 'portal' && phaseRef.current !== 'prompt') return;
      if (e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const dy = touchStartY - currentY;
      touchStartY = currentY;
      const step = dy / Math.max(1350, window.innerHeight * 2.1);
      advancePortalScroll(Math.max(-0.14, Math.min(0.14, step)));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'portal' && phaseRef.current !== 'prompt') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        advancePortalScroll(0.14);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        advancePortalScroll(-0.12);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (phaseRef.current === 'prompt') {
          setPhaseSafe('portal');
        }
        targetScrollRef.current = 0.85;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setPhaseSafe]);

  const handleAsteroidCenterImpact = useCallback(() => {
    introAudio.triggerChime(432);
  }, []);

  const handleAsteroidBecomeCursor = useCallback(() => {
    onRocketCursorReadyRef.current?.();
  }, []);

  const handleAsteroidFinished = useCallback(() => {
    onRocketCursorReadyRef.current?.();
    setPhaseSafe('prompt');
  }, [setPhaseSafe]);

  const handlePromptComplete = useCallback(() => {
    if (phaseRef.current === 'prompt') {
      setPhaseSafe('portal');
    }
  }, [setPhaseSafe]);

  if (webGlFailed) {
    return (
      <WebGlFallback
        scrollProgressRef={scrollProgressRef}
        zoomProgressRef={zoomProgressRef}
        portalRevealRef={portalRevealRef}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={isTransitioning}
        prefersReducedMotion={prefersReducedMotion}
      />
    );
  }

  return (
    <motion.div
      key="luxury-entry-experience"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 h-[100dvh] w-full z-50 bg-transparent overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio by Garv Shaw — Entry Experience"
    >
      <h1 className="sr-only">Think. Create. Discover. Portfolio by Garv Shaw.</h1>

      {/* Permanent Knockout Portal Layer: opaque dark void during Act 1 & Asteroid, transparent PORTFOLIO BY GARV SHAW window in Act 3 */}
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        zoomProgressRef={zoomProgressRef}
        portalRevealRef={portalRevealRef}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={phase === 'sand' || isTransitioning}
      />

      {/* Act 1: THINK. -> CREATE. -> DISCOVER. Three.js Sand Particle Choreography */}
      {phase === 'sand' && (
        <>
          <ParticleScene
            timelineSecRef={timelineSecRef}
            isExitingRef={isExitingRef}
            exitProgressRef={exitProgressRef}
            isHoveringEnterRef={isHoveringEnterRef}
            prefersReducedMotion={prefersReducedMotion}
            onWebGLError={handleWebGLError}
          />
          <EntryComposition
            isExiting={isExitingSand}
            isAudioOn={isAudioOn}
            onToggleAudio={handleToggleAudio}
          />
        </>
      )}

      {/* Act 2: Passing Asteroid Belt -> Center Impact -> Shrink into Asteroid Cursor */}
      {phase === 'asteroid' &&
        (asteroidWebGlFailed ? (
          <EntryAsteroidLanding
            onCenterImpact={handleAsteroidCenterImpact}
            onBecomeCursor={handleAsteroidBecomeCursor}
            onFinished={handleAsteroidFinished}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : (
          <AsteroidFlightAnimation
            onCenterImpact={handleAsteroidCenterImpact}
            onBecomeCursor={handleAsteroidBecomeCursor}
            onFinished={handleAsteroidFinished}
            onWebGLError={handleAsteroidWebGLError}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}

      {/* Act 2.5: Subtle Dust-Forming "Scroll To View" Prompt */}
      {phase === 'prompt' && (
        <ScrollToViewPrompt
          onComplete={handlePromptComplete}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {/* Act 3: Ambient 3D Depth Particles Behind PORTFOLIO BY GARV SHAW Portal */}
      {(phase === 'portal' || phase === 'zooming') && (
        <IntroScene
          elapsedTimeRef={portalElapsedRef}
          scrollProgressRef={scrollProgressRef}
          isTransitioningRef={isTransitioningRef}
          onWebGLError={handleWebGLError}
        />
      )}
    </motion.div>
  );
};
