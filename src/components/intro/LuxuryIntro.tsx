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

  // Lock background page scroll while entry portal is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    try {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        entrySequenceManager.completeImmediately();
        onComplete();
      }
    } catch {
      // Ignore
    }
  }, [onComplete]);

  const triggerEntryTransition = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    scrollTargetRef.current = 1.0;
    setIsTransitioning(true);
    introAudio.triggerWarp();
    entrySequenceManager.completeImmediately();

    transitionTimerRef.current = window.setTimeout(() => {
      introAudio.stop();
      onComplete();
    }, 1000);
  }, [onComplete]);

  // Master timeline + smooth damped virtual scroll loop (zero per-frame React re-renders)
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

      // Continuous smooth scroll while keyboard Arrow / Page / Space key is held
      if (!isTransitioningRef.current && heldDirectionRef.current !== 0) {
        scrollTargetRef.current = Math.min(
          1,
          Math.max(0, scrollTargetRef.current + heldDirectionRef.current * 0.58 * dt)
        );
      }

      // Exponential damping for silky scroll inertia
      const factor = 1 - Math.exp(-8.5 * dt);
      scrollProgressRef.current +=
        (scrollTargetRef.current - scrollProgressRef.current) * factor;

      // Once PORTFOLIO finishes sweeping right-to-left and user scrolls past threshold -> futuristic entry
      if (!isTransitioningRef.current && scrollProgressRef.current >= 0.78) {
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

  const handleSkip = useCallback(() => {
    if (isTransitioningRef.current) return;
    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current);
    }
    introAudio.stop();
    entrySequenceManager.completeImmediately();
    onComplete();
  }, [onComplete]);

  const handleToggleAudio = useCallback(() => {
    const newState = introAudio.toggle();
    setIsAudioOn(newState);
  }, []);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  // Keyboard scroll (ArrowDown/Up, PageDown/Up, Space), Enter & Escape, plus Wheel & Touch swipe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
        return;
      }

      if (isTransitioningRef.current) return;

      if (e.key === 'Enter') {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag === 'button') return;
        e.preventDefault();
        triggerEntryTransition();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowDown' ? 0.14 : 0.24;
          scrollTargetRef.current = Math.min(1, scrollTargetRef.current + step);
        }
        heldDirectionRef.current = 1;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowUp' ? 0.14 : 0.24;
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
      const clampedDelta = Math.max(-180, Math.min(180, e.deltaY));
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + clampedDelta * 0.00085)
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
        Math.max(0, scrollTargetRef.current + deltaY * 0.0022)
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
  }, [handleSkip, triggerEntryTransition]);

  if (webGlFailed) {
    return <WebGlFallback onEnter={triggerEntryTransition} onSkip={handleSkip} />;
  }

  return (
    <motion.div
      key="luxury-portal-entrance"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#050505] overflow-hidden select-none"
    >
      {/* Foundation Deep Dark Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-85"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, #080d16 0%, #050505 85%)',
        }}
      />

      {/* 3D WebGL Liquid Chrome & Ambient Particle Field */}
      <IntroScene
        elapsedTimeRef={elapsedTimeRef}
        scrollProgressRef={scrollProgressRef}
        isTransitioningRef={isTransitioningRef}
        onWebGLError={handleWebGLError}
      />

      {/* Scroll-Driven PORTFOLIO & Futuristic Portal Overlay */}
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        onEnter={triggerEntryTransition}
        onSkip={handleSkip}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={isTransitioning}
      />

      {/* Subtle film-grain atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </motion.div>
  );
};
