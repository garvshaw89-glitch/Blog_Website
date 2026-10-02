import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntroScene } from './IntroScene';
import { IntroOverlay } from './IntroOverlay';
import { WebGlFallback } from './WebGlFallback';
import { introAudio } from './introAudio';
import { entrySequenceManager } from './entrySequenceManager';

interface LuxuryIntroProps {
  onComplete: () => void;
}

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({ onComplete }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    try {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        entrySequenceManager.completeImmediately();
        sessionStorage.setItem('garv_journal_intro_completed', 'true');
        onComplete();
      }
    } catch {
      // Ignore
    }
  }, [onComplete]);

  // Master Automated Timeline progression
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      setElapsed(t);
      entrySequenceManager.tick(t);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    introAudio.triggerWarp();
    entrySequenceManager.completeImmediately();

    try {
      sessionStorage.setItem('garv_journal_intro_completed', 'true');
    } catch {
      // Ignore
    }

    setTimeout(() => {
      introAudio.stop();
      onComplete();
    }, 950);
  }, [isTransitioning, onComplete]);

  const handleSkip = useCallback(() => {
    introAudio.stop();
    entrySequenceManager.completeImmediately();
    try {
      sessionStorage.setItem('garv_journal_intro_completed', 'true');
    } catch {
      // Ignore
    }
    onComplete();
  }, [onComplete]);

  const handleToggleAudio = useCallback(() => {
    const newState = introAudio.toggle();
    setIsAudioOn(newState);
  }, []);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Enter') {
        if (!isTransitioning) {
          e.preventDefault();
          handleEnter();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip, handleEnter, isTransitioning]);

  if (webGlFailed) {
    return <WebGlFallback onEnter={handleEnter} onSkip={handleSkip} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="luxury-portal-entrance"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 bg-[#050505] overflow-hidden select-none"
      >
        {/* Foundation Deep Dark Vignette */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #0d0f14 0%, #050505 85%)',
          }}
        />

        {/* 3D WebGL Digital Core & Ambient Particle Field */}
        <IntroScene
          elapsedTime={elapsed}
          isTransitioning={isTransitioning}
          onWebGLError={() => setWebGlFailed(true)}
        />

        {/* Minimal Editorial Typography & Entry CTA */}
        <IntroOverlay
          elapsedTime={elapsed}
          onEnter={handleEnter}
          onSkip={handleSkip}
          isAudioOn={isAudioOn}
          onToggleAudio={handleToggleAudio}
          isTransitioning={isTransitioning}
        />

        {/* Film grain micro-filter */}
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
    </AnimatePresence>
  );
};
