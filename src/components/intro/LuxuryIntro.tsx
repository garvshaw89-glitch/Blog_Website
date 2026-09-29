import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntroStageId, INTRO_STAGES } from './types';
import { IntroScene } from './IntroScene';
import { IntroOverlay } from './IntroOverlay';
import { WebGlFallback } from './WebGlFallback';
import { introAudio } from './introAudio';

interface LuxuryIntroProps {
  onComplete: () => void;
}

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState<IntroStageId>('VOID');
  const [elapsed, setElapsed] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const manualOverrideRef = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      sessionStorage.setItem('intro_seen', 'true');
      onComplete();
    }
  }, [onComplete]);

  // Master Automated Timeline progression
  useEffect(() => {
    const startTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      setElapsed(t);

      // Only advance automatically if user hasn't manually scrubbed or entered transition
      if (!manualOverrideRef.current && !isTransitioning) {
        if (t < 2.4) {
          setCurrentStage('VOID');
          setStageProgress(t / 2.4);
        } else if (t < 5.6) {
          setCurrentStage('TERRAIN');
          setStageProgress((t - 2.4) / 3.2);
        } else if (t < 9.0) {
          setCurrentStage('METROPOLIS');
          setStageProgress((t - 5.6) / 3.4);
        } else {
          setCurrentStage('QUANTUM_ORB');
          setStageProgress(Math.min(1.0, (t - 9.0) / 3.2));
        }
      }
    }, 33);

    return () => clearInterval(interval);
  }, [isTransitioning]);

  const handleSelectStage = useCallback((stage: IntroStageId) => {
    manualOverrideRef.current = true;
    setCurrentStage(stage);
    introAudio.triggerChime(stage === 'METROPOLIS' ? 660 : stage === 'QUANTUM_ORB' ? 784 : 528);
  }, []);

  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentStage('PORTAL');
    introAudio.triggerWarp();

    try {
      sessionStorage.setItem('intro_seen', 'true');
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
    try {
      sessionStorage.setItem('intro_seen', 'true');
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
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 bg-[#050505] overflow-hidden select-none"
      >
        {/* Foundation Deep Dark Vignette */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #0a0d14 0%, #050505 85%)',
          }}
        />

        {/* 3D WebGL Living Particles, Metropolis & Orbital Scene */}
        <IntroScene
          currentStage={currentStage}
          elapsedTime={elapsed}
          isTransitioning={isTransitioning}
          onWebGLError={() => setWebGlFailed(true)}
        />

        {/* Senior UI/UX Editorial Overlay, Phase Scrubber & Audio */}
        <IntroOverlay
          currentStage={currentStage}
          elapsedTime={elapsed}
          stageProgress={stageProgress}
          onSelectStage={handleSelectStage}
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
