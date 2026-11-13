import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ParticleScene } from './ParticleScene';
import { IntroScene } from './IntroScene';
import { IntroOverlay } from './IntroOverlay';
import { WebGlFallback } from './WebGlFallback';
import { EntryRocketLanding } from './EntryRocketLanding';
import { introAudio } from './introAudio';
import { entrySequenceManager } from './entrySequenceManager';

interface LuxuryIntroProps {
  onComplete: () => void;
  onRocketCursorReady?: () => void;
}

const SAND_HOLD_END_SEC = 8.4;
const SAND_DISSOLVE_SEC = 0.95;
const ROCKET_LAUNCH_START_SEC = 8.15;
const PORTAL_ZOOM_DURATION_SEC = 2.1;

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({
  onComplete,
  onRocketCursorReady,
}) => {
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const [sandFinished, setSandFinished] = useState(false);
  const [rocketLaunchStarted, setRocketLaunchStarted] = useState(false);
  const [rocketFinished, setRocketFinished] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  // Unified timeline refs for white-sand THINK. -> CREATE. -> DISCOVER. + PORTFOLIO BY GARV SHAW portal
  const timelineSecRef = useRef(prefersReducedMotion ? 8.2 : 0);
  const isSandExitingRef = useRef(false);
  const sandExitProgressRef = useRef(0);
  const isHoveringEnterRef = useRef(false);
  const rocketLaunchedRef = useRef(false);
  const rocketCursorReadyRef = useRef(false);

  const portalRevealRef = useRef(0);
  const portalReadyForScrollRef = useRef(false);
  const elapsedTimeRef = useRef(0);
  const scrollTargetRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const zoomProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const heldDirectionRef = useRef<-1 | 0 | 1>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onRocketCursorReadyRef = useRef(onRocketCursorReady);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onRocketCursorReadyRef.current = onRocketCursorReady;
  }, [onRocketCursorReady]);

  // Lock background page scroll while compulsory entry portal is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const triggerEntryTransition = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    scrollTargetRef.current = 1.0;
    setIsTransitioning(true);
    introAudio.triggerWarp();
    entrySequenceManager.completeImmediately();
  }, []);

  // Unified master animation loop on the single PORTFOLIO BY GARV SHAW entry page:
  // 1) White sand forms THINK. -> CREATE. -> DISCOVER.
  // 2) DISCOVER. exhales gently into white sand breeze as PORTFOLIO BY GARV SHAW reveals
  // 3) Visitor scrolls right-to-left -> centers PORTFOLIO -> zooms through transparent 'T' into site
  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();
    let prevTime = startTime;
    let chime2Played = false;
    let chime3Played = false;
    let chime4Played = false;
    let sandMarkedDone = false;

    const loop = (now: number) => {
      if (hasCompletedRef.current) return;

      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const t = (now - startTime) / 1000;
      elapsedTimeRef.current = t;

      if (!prefersReducedMotion) {
        timelineSecRef.current = t;
      }
      entrySequenceManager.tick(t);

      // Optional subtle chimes synced with white sand formations
      if (!prefersReducedMotion) {
        if (!chime2Played && t >= 2.05) {
          chime2Played = true;
          introAudio.triggerChime(392.0);
        }
        if (!chime3Played && t >= 4.45) {
          chime3Played = true;
          introAudio.triggerChime(440.0);
        }
        if (!chime4Played && t >= 6.8) {
          chime4Played = true;
          introAudio.triggerChime(523.25);
        }
      }

      // Split center of universe & launch real rocket breakout toward PORTFOLIO BY GARV SHAW
      const rocketStartSec = prefersReducedMotion ? 1.05 : ROCKET_LAUNCH_START_SEC;
      if (!rocketLaunchedRef.current && t >= rocketStartSec) {
        rocketLaunchedRef.current = true;
        setRocketLaunchStarted(true);
      }

      // Safety fallback in case the tab was throttled so the portal never stalls waiting for the landing
      const safetyUnlockSec = prefersReducedMotion ? 1.5 : 13.0;
      if (!rocketCursorReadyRef.current && t >= safetyUnlockSec) {
        rocketCursorReadyRef.current = true;
        portalReadyForScrollRef.current = true;
        onRocketCursorReadyRef.current?.();
      }

      // Trigger smooth white-sand dissolution after DISCOVER. settles (or immediately if user starts scrolling)
      const holdEnd = prefersReducedMotion ? 1.2 : SAND_HOLD_END_SEC;
      if (!isSandExitingRef.current && (t >= holdEnd || scrollTargetRef.current > 0.002)) {
        isSandExitingRef.current = true;
      }

      if (isSandExitingRef.current && sandExitProgressRef.current < 1) {
        const speedMult = scrollTargetRef.current > 0.01 ? 1.65 : 1.0;
        const nextExit = Math.min(
          sandExitProgressRef.current + (dt * speedMult) / SAND_DISSOLVE_SEC,
          1
        );
        sandExitProgressRef.current = nextExit;

        // Smoothly cross-reveal PORTFOLIO BY GARV SHAW on the same page as sand exhales
        portalRevealRef.current = Math.max(
          portalRevealRef.current,
          Math.min(Math.max((nextExit - 0.15) / 0.7, 0), 1)
        );

        if (nextExit >= 1 && !sandMarkedDone) {
          sandMarkedDone = true;
          portalRevealRef.current = 1;
          setSandFinished(true);
        }
      }

      // Slow, steady glide while holding Arrow / Page / Space keys (once portal is unlocked)
      if (
        portalReadyForScrollRef.current &&
        !isTransitioningRef.current &&
        heldDirectionRef.current !== 0
      ) {
        scrollTargetRef.current = Math.min(
          1,
          Math.max(0, scrollTargetRef.current + heldDirectionRef.current * 0.115 * dt)
        );
      }

      // Weighty, cinematic scroll inertia for PORTFOLIO BY GARV SHAW slide
      const factor = 1 - Math.exp(-4.2 * dt);
      scrollProgressRef.current +=
        (scrollTargetRef.current - scrollProgressRef.current) * factor;

      // Once "PORTFOLIO" settles in the middle, trigger zoom through transparent 'T'
      if (!isTransitioningRef.current && scrollProgressRef.current >= 0.78) {
        triggerEntryTransition();
      }

      // Advance zoom-through-T smoothly into the main website
      if (isTransitioningRef.current && !hasCompletedRef.current) {
        const nextZ = Math.min(
          zoomProgressRef.current + dt / PORTAL_ZOOM_DURATION_SEC,
          1
        );
        zoomProgressRef.current = nextZ;

        if (nextZ >= 1) {
          hasCompletedRef.current = true;
          introAudio.stop();
          onCompleteRef.current();
          return;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [triggerEntryTransition, prefersReducedMotion]);

  const handleRocketBecomeCursor = useCallback(() => {
    if (!rocketCursorReadyRef.current) {
      rocketCursorReadyRef.current = true;
      portalReadyForScrollRef.current = true;
      onRocketCursorReadyRef.current?.();
    }
  }, []);

  const handleRocketFinished = useCallback(() => {
    setRocketFinished(true);
  }, []);

  const handleToggleAudio = useCallback(() => {
    const newState = introAudio.toggle();
    setIsAudioOn(newState);
  }, []);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  // Compulsory scroll / swipe / keyboard listeners for PORTFOLIO BY GARV SHAW entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current || !portalReadyForScrollRef.current) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowDown' ? 0.035 : 0.065;
          scrollTargetRef.current = Math.min(1, scrollTargetRef.current + step);
        }
        heldDirectionRef.current = 1;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowUp' ? 0.035 : 0.065;
          scrollTargetRef.current = Math.max(0, scrollTargetRef.current - step);
        }
        heldDirectionRef.current = -1;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
      }
      if (
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' ' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageUp'
      ) {
        heldDirectionRef.current = 0;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isTransitioningRef.current || !portalReadyForScrollRef.current) return;
      const clampedDelta = Math.max(-100, Math.min(100, e.deltaY));
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + clampedDelta * 0.00022)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      if (
        isTransitioningRef.current ||
        !portalReadyForScrollRef.current ||
        touchStartRef.current === null
      ) {
        return;
      }
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = touchStartRef.current.x - curX;
      const dy = touchStartRef.current.y - curY;
      touchStartRef.current = { x: curX, y: curY };

      const dominantDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const sensitivity = window.innerWidth < 768 ? 0.0011 : 0.00085;
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + dominantDelta * sensitivity)
      );
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  if (webGlFailed) {
    return (
      <div
        className="fixed inset-0 h-[100dvh] z-50 overflow-hidden select-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <WebGlFallback
          scrollProgressRef={scrollProgressRef}
          zoomProgressRef={zoomProgressRef}
          portalRevealRef={portalRevealRef}
          isAudioOn={isAudioOn}
          onToggleAudio={handleToggleAudio}
          isTransitioning={isTransitioning}
          prefersReducedMotion={prefersReducedMotion}
        />
        {rocketLaunchStarted && !rocketFinished && (
          <EntryRocketLanding
            onBecomeCursor={handleRocketBecomeCursor}
            onFinished={handleRocketFinished}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      key="luxury-portal-entrance"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className="fixed inset-0 h-[100dvh] z-50 bg-transparent overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Entry portal: Think, Create, Discover — Portfolio by Garv Shaw"
    >
      <h1 className="sr-only">Think. Create. Discover. Portfolio by Garv Shaw</h1>

      {/* 1. Ambient 3D floating particle field */}
      <IntroScene
        elapsedTimeRef={elapsedTimeRef}
        scrollProgressRef={scrollProgressRef}
        isTransitioningRef={isTransitioningRef}
        onWebGLError={handleWebGLError}
      />

      {/* 2. White sand THINK. -> CREATE. -> DISCOVER. on the same entry page */}
      {!sandFinished && (
        <ParticleScene
          timelineSecRef={timelineSecRef}
          isExitingRef={isSandExitingRef}
          exitProgressRef={sandExitProgressRef}
          isHoveringEnterRef={isHoveringEnterRef}
          prefersReducedMotion={prefersReducedMotion}
          onWebGLError={handleWebGLError}
        />
      )}

      {/* 3. SVG Knockout Slide ("PORTFOLIO  BY  GARV SHAW") -> Center PORTFOLIO -> Zoom through transparent 'T' */}
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        zoomProgressRef={zoomProgressRef}
        portalRevealRef={portalRevealRef}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={isTransitioning}
      />

      {/* 4. Real Rocket breaks out from middle of universe splitting particles, lands in center, and converts into cursor */}
      {rocketLaunchStarted && !rocketFinished && (
        <EntryRocketLanding
          onBecomeCursor={handleRocketBecomeCursor}
          onFinished={handleRocketFinished}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </motion.div>
  );
};
