import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entrySequenceManager, EntryStage } from '../matter/entrySequenceManager';

interface LoadingScreenProps {
  onComplete: () => void;
}

/**
 * Section 35 — LOADING EXPERIENCE:
 * Minimal digital initialization sequence:
 * INITIALIZING WORLD → LOADING ENVIRONMENT → ESTABLISHING SYSTEM → READY
 * Extremely short and responsive.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [entryStage, setEntryStage] = useState<EntryStage>(entrySequenceManager.state.stage);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return entrySequenceManager.subscribe((state) => {
      setEntryStage(state.stage);
    });
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      entrySequenceManager.completeImmediately();
      onComplete();
      return;
    }

    let animId: number;
    const startTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      setElapsed(t);
      entrySequenceManager.tick(t);

      if (t >= 3.2 || entrySequenceManager.state.stage === 'HERO_ACTIVE') {
        entrySequenceManager.completeImmediately();
        onComplete();
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  // Section 35 initialization label progression
  const getInitPhase = () => {
    if (elapsed < 0.8) return 'INITIALIZING WORLD';
    if (elapsed < 1.6) return 'LOADING ENVIRONMENT';
    if (elapsed < 2.4) return 'ESTABLISHING SYSTEM';
    return 'READY';
  };

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 select-none"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B8CFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B8CFF]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#A5A7AC]">
              GARV SHAW // ARCHITECTURE
            </span>
          </div>

          <h2 className="font-mono text-xs tracking-[0.32em] text-[#F5F5F0] uppercase">
            {getInitPhase()}
          </h2>

          <div className="w-48 h-[1px] bg-neutral-900 overflow-hidden relative mt-1">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#5B8CFF]"
              style={{ width: `${Math.min(100, (elapsed / 3.0) * 100)}%` }}
            />
          </div>

          <button
            onClick={() => {
              entrySequenceManager.completeImmediately();
              onComplete();
            }}
            className="mt-6 px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-mono tracking-widest text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
