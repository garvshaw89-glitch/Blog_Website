import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { IntroScene } from './IntroScene';
import { IntroOverlay } from './IntroOverlay';
import { WebGlFallback } from './WebGlFallback';
import { introAudio } from './introAudio';
import { entrySequenceManager } from './entrySequenceManager';

interface LuxuryIntroProps {
  onComplete: () => void;
}

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({ onComplete }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const elapsedTimeRef = useRef(0);
  const scrollTargetRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const heldDirectionRef = useRef<-1 | 0 | 1>(0);
  const touchStartYRef = useRef<number | null>(null);

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

    // 0.0–0.75s: Slowly dim the light | 0.65–1.60s: 3D screen flip -> move to main page
    transitionTimerRef.current = window.setTimeout(() => {
      introAudio.stop();
      onComplete();
    }, 1600);
  }, [onComplete]);

  // Slow, deliberate scroll progression through "PORTFOLIO   BY   GARV SHAW"
  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();
    let prevTime = startTime;

    const loop = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const t = (now - startTime) / 1000;
      elapsedTimeRef.current = t;
      entrySequenceManager.tick(t);

      // Slow, steady glide while holding Arrow / Page / Space keys
      if (!isTransitioningRef.current && heldDirectionRef.current !== 0) {
        scrollTargetRef.current = Math.min(
          1,
          Math.max(0, scrollTargetRef.current + heldDirectionRef.current * 0.115 * dt)
        );
      }

      // Weighty, cinematic scroll inertia
      const factor = 1 - Math.exp(-4.2 * dt);
      scrollProgressRef.current +=
        (scrollTargetRef.current - scrollProgressRef.current) * factor;

      // Once "GARV SHAW" finishes gliding past center -> slowly dim light, flip screen, enter main page
      if (!isTransitioningRef.current && scrollProgressRef.current >= 0.82) {
        triggerEntryTransition();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [triggerEntryTransition]);

  const handleToggleAudio = useCallback(() => {
    const newState = introAudio.toggle();
    setIsAudioOn(newState);
  }, []);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  // Compulsory scroll handlers: keyboard (ArrowDown/Up, PageDown/Up, Space), wheel & touch swipe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;

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
      if (isTransitioningRef.current) return;
      const clampedDelta = Math.max(-100, Math.min(100, e.deltaY));
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + clampedDelta * 0.00022)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioningRef.current || touchStartYRef.current === null || e.touches.length === 0) {
        return;
      }
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + deltaY * 0.0007)
      );
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const scanlineOverlay = isTransitioning ? (
    <div aria-hidden="true" className="intro-scanline-overlay">
      <div className="intro-scanline-grid" />
      <div className="intro-scanline-beam" />
      <div className="intro-scanline-beam-echo" />
    </div>
  ) : null;

  if (webGlFailed) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ perspective: '1600px' }}
      >
        <motion.div
          animate={
            isTransitioning
              ? { rotateY: -92, scale: 0.88, opacity: 0 }
              : { rotateY: 0, scale: 1, opacity: 1 }
          }
          transition={{
            duration: 0.95,
            delay: isTransitioning ? 0.62 : 0,
            ease: [0.42, 0, 0.2, 1],
          }}
          style={{
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
          className="w-full h-full"
        >
          <WebGlFallback
            scrollProgressRef={scrollProgressRef}
            isAudioOn={isAudioOn}
            onToggleAudio={handleToggleAudio}
            isTransitioning={isTransitioning}
          />
        </motion.div>
        {scanlineOverlay}
      </div>
    );
  }

  return (
    <motion.div
      key="luxury-portal-entrance"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ perspective: '1600px' }}
      className="fixed inset-0 z-50 bg-transparent overflow-hidden select-none"
    >
      {/* Phase 2 of Entry Effect: 3D Screen Flip after light dims */}
      <motion.div
        animate={
          isTransitioning
            ? { rotateY: -92, scale: 0.88, opacity: 0 }
            : { rotateY: 0, scale: 1, opacity: 1 }
        }
        transition={{
          duration: 0.95,
          delay: isTransitioning ? 0.62 : 0,
          ease: [0.42, 0, 0.2, 1],
        }}
        style={{
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform, opacity',
        }}
        className="relative w-full h-full"
      >
        {/* 3D WebGL Particle Field */}
        <IntroScene
          elapsedTimeRef={elapsedTimeRef}
          scrollProgressRef={scrollProgressRef}
          isTransitioningRef={isTransitioningRef}
          onWebGLError={handleWebGLError}
        />

        {/* SVG Knockout PORTFOLIO  BY  GARV SHAW Backdrop & Dimmer */}
        <IntroOverlay
          scrollProgressRef={scrollProgressRef}
          isAudioOn={isAudioOn}
          onToggleAudio={handleToggleAudio}
          isTransitioning={isTransitioning}
        />
      </motion.div>

      {/* Dynamic CSS Scanline Overlay sweeping across the viewport during transition */}
      {scanlineOverlay}
    </motion.div>
  );
};
