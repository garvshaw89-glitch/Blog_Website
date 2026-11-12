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

    transitionTimerRef.current = window.setTimeout(() => {
      introAudio.stop();
      onComplete();
    }, 1150);
  }, [onComplete]);

  // Deliberate, slow, luxurious damped scroll progression (compulsory to enter main website)
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

      // Slow, continuous glide while holding Arrow / Page / Space keys
      if (!isTransitioningRef.current && heldDirectionRef.current !== 0) {
        scrollTargetRef.current = Math.min(
          1,
          Math.max(0, scrollTargetRef.current + heldDirectionRef.current * 0.165 * dt)
        );
      }

      // Weighty, cinematic scroll inertia
      const factor = 1 - Math.exp(-4.4 * dt);
      scrollProgressRef.current +=
        (scrollTargetRef.current - scrollProgressRef.current) * factor;

      // After PORTFOLIO finishes gliding past center -> trigger futuristic entry into main page
      if (!isTransitioningRef.current && scrollProgressRef.current >= 0.8) {
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

  // Compulsory scroll handlers: keyboard (ArrowDown/Up, PageDown/Up, Space), wheel & touch swipe (no Esc/Enter skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowDown' ? 0.045 : 0.085;
          scrollTargetRef.current = Math.min(1, scrollTargetRef.current + step);
        }
        heldDirectionRef.current = 1;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (!e.repeat) {
          const step = e.key === 'ArrowUp' ? 0.045 : 0.085;
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
      const clampedDelta = Math.max(-110, Math.min(110, e.deltaY));
      scrollTargetRef.current = Math.min(
        1,
        Math.max(0, scrollTargetRef.current + clampedDelta * 0.00028)
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
        Math.max(0, scrollTargetRef.current + deltaY * 0.0009)
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

  if (webGlFailed) {
    return (
      <WebGlFallback
        scrollProgressRef={scrollProgressRef}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={isTransitioning}
      />
    );
  }

  return (
    <motion.div
      key="luxury-portal-entrance"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-transparent overflow-hidden select-none"
    >
      {/* 3D WebGL Particle Field */}
      <IntroScene
        elapsedTimeRef={elapsedTimeRef}
        scrollProgressRef={scrollProgressRef}
        isTransitioningRef={isTransitioningRef}
        onWebGLError={handleWebGLError}
      />

      {/* SVG Knockout PORTFOLIO Backdrop & Futuristic Portal Overlay */}
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isTransitioning={isTransitioning}
      />
    </motion.div>
  );
};
