import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'initializing' | 'revealing' | 'complete'>('initializing');

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onComplete();
      return;
    }

    // Fast, crisp 1.1s total loading sequence
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage('revealing');
          setTimeout(() => {
            setStage('complete');
            setTimeout(onComplete, 350);
          }, 450);
          return 100;
        }
        // Organic progress increments
        const next = prev + Math.floor(Math.random() * 18) + 12;
        return Math.min(next, 100);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (stage === 'complete') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="loading-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[999999] bg-[#050505] flex flex-col justify-between p-6 sm:p-10 md:p-14 select-none pointer-events-auto"
      >
        {/* Top header status */}
        <div className="flex items-center justify-between text-xs font-mono tracking-widest text-neutral-500 uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-neutral-400">GARV SHAW // LAB</span>
          </div>
          <div>SYSTEM_V4.2.0</div>
        </div>

        {/* Center Editorial Loading Content */}
        <div className="max-w-xl mx-auto w-full my-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-400/90 block mb-2">
              {stage === 'initializing' ? 'INITIALIZING DIGITAL SYSTEM' : 'SYSTEM ONLINE'}
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white uppercase leading-none">
              {stage === 'initializing' ? 'GARV SHAW' : 'DIGITAL ARCHITECT'}
            </h1>
          </motion.div>

          {/* Precision Progress Bar */}
          <div className="w-full max-w-md bg-neutral-900/80 rounded-full h-1 border border-white/10 overflow-hidden relative mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.1 }}
            />
          </div>

          <div className="flex items-center justify-between w-full max-w-md font-mono text-[10px] text-neutral-400 tracking-wider">
            <span>[AI × CLOUD × SYSTEMS]</span>
            <span className="text-cyan-300 font-bold">{progress}%</span>
          </div>
        </div>

        {/* Bottom Technical Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
          <span>LATENCY: 0.12MS</span>
          <span>LOCATION: 22.5726° N, 88.3639° E</span>
          <span className="hidden sm:inline">ALL CORES ACTIVE</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
