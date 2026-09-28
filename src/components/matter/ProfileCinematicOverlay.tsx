import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rocketCinematicManager, CinematicState } from './rocketCinematicManager';
import { Github, Sparkles, Rocket, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

export const ProfileCinematicOverlay: React.FC = () => {
  const [cinematicState, setCinematicState] = useState<CinematicState>(
    rocketCinematicManager.state
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicState({ ...state });
    });
  }, []);

  const isProfileVisible =
    cinematicState.stage === 'PROFILE_STABILIZED' ||
    (cinematicState.stage === 'PROFILE_RECONSTRUCT' && cinematicState.stageProgress > 0.7);

  return (
    <>
      {/* 1. Unobtrusive Floating Trigger Button at bottom-left */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => rocketCinematicManager.triggerSequence()}
          disabled={cinematicState.stage !== 'IDLE'}
          data-cursor="button"
          data-cursor-label="LAUNCH"
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 shadow-lg ${
            cinematicState.stage === 'IDLE'
              ? 'bg-[#08090B]/90 hover:bg-cyan-950/40 border-white/15 hover:border-cyan-400 text-neutral-300 hover:text-white cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-black/60 border-cyan-400/40 text-cyan-300 cursor-default animate-pulse'
          }`}
          title="Trigger Particle Rocket Launch & Profile Reveal"
        >
          <Rocket className={`w-3.5 h-3.5 ${cinematicState.stage !== 'IDLE' ? 'text-cyan-400 -rotate-45' : 'text-neutral-400'}`} />
          <span>
            {cinematicState.stage === 'IDLE'
              ? 'PARTICLE ROCKET // LAUNCH'
              : `SEQUENCE // ${cinematicState.stage}`}
          </span>
        </button>
      </div>

      {/* 2. Cinematic Minimal Staggered Identity Card Reveal */}
      <AnimatePresence>
        {isProfileVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-16 sm:bottom-20 z-40 flex flex-col items-center pointer-events-none select-none px-4"
          >
            <div className="p-6 rounded-2xl bg-[#08090B]/92 border border-white/15 backdrop-blur-md max-w-sm w-full shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col items-center text-center pointer-events-auto">
              {/* Top Eyebrow Tag */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">
                  RECONSTRUCTED PROFILE // IDENTITY MATRIX
                </span>
              </div>

              {/* Verified Name */}
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-1">
                GARV SHAW
              </h3>

              {/* GitHub Handle with Link */}
              <a
                href="https://github.com/garvshaw89-glitch"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                data-cursor-label="PROFILE"
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors mb-2"
              >
                <Github className="w-3.5 h-3.5" />
                <span>garvshaw89-glitch</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>

              {/* Identity & Pronouns */}
              <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">
                  he/him
                </span>
                <span>•</span>
                <span>SYSTEMS ARCHITECT</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
