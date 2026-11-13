import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntroOverlay } from './IntroOverlay';

interface WebGlFallbackProps {
  scrollProgressRef: React.RefObject<number>;
  zoomProgressRef: React.RefObject<number>;
  portalRevealRef: React.RefObject<number>;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
  prefersReducedMotion: boolean;
}

const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.3, 1];

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({
  scrollProgressRef,
  zoomProgressRef,
  portalRevealRef,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
  prefersReducedMotion,
}) => {
  const [wordIndex, setWordIndex] = useState<number>(prefersReducedMotion ? 3 : 0);
  const [wordsDone, setWordsDone] = useState<boolean>(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setWordIndex(3);
      const tDone = window.setTimeout(() => setWordsDone(true), 1200);
      return () => window.clearTimeout(tDone);
    }

    const t1 = window.setTimeout(() => setWordIndex(1), 2000);
    const t2 = window.setTimeout(() => setWordIndex(2), 4000);
    const t3 = window.setTimeout(() => setWordIndex(3), 6200);
    const t4 = window.setTimeout(() => setWordsDone(true), 8800);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [prefersReducedMotion]);

  const activeWord = wordsDone
    ? ''
    : wordIndex === 1
    ? 'THINK.'
    : wordIndex === 2
    ? 'CREATE.'
    : wordIndex >= 3
    ? 'DISCOVER.'
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-transparent overflow-hidden select-none">
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        zoomProgressRef={zoomProgressRef}
        portalRevealRef={portalRevealRef}
        isAudioOn={isAudioOn}
        onToggleAudio={onToggleAudio}
        isTransitioning={isTransitioning}
      />

      {/* Pure white-sand serif fallback word sequence on the same entry page */}
      <div
        aria-live="polite"
        className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none px-6"
      >
        <AnimatePresence mode="wait">
          {activeWord && (
            <motion.span
              key={activeWord}
              initial={{ opacity: 0, filter: 'blur(8px)', letterSpacing: '0.26em' }}
              animate={{
                opacity: 1,
                filter: 'blur(0px)',
                letterSpacing: '0.16em',
              }}
              exit={{ opacity: 0, filter: 'blur(10px)', letterSpacing: '0.28em' }}
              transition={{ duration: 0.95, ease: EDITORIAL_EASE }}
              className="font-editorial-serif font-light text-white text-[clamp(2.6rem,11vw,8.5rem)] leading-none text-center"
              style={{ textShadow: '0 0 32px rgba(255, 255, 255, 0.25)' }}
            >
              {activeWord}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
