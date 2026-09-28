import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rocketCinematicManager, CinematicState } from './rocketCinematicManager';
import { Github, Rocket, ExternalLink } from 'lucide-react';

export const ProfileCinematicOverlay: React.FC = () => {
  const [cinematicState, setCinematicState] = useState<CinematicState>(
    rocketCinematicManager.state
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicState({ ...state });
    });
  }, []);

  // Show identity card only AFTER the github profile reveal has completed and is dissolving/finished
  const isPostProfileVisible =
    cinematicState.stage === 'DISSOLUTION';

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

      {/* 2. Identity Card: Appears only AFTER the GitHub profile effect completes so the portrait is never blocked */}
      <AnimatePresence>
        {isPostProfileVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-12 sm:bottom-16 z-40 flex flex-col items-center pointer-events-none select-none px-4"
          >
            <div className="p-5 rounded-2xl bg-[#08090B]/90 border border-white/15 backdrop-blur-md max-w-xs w-full shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col items-center text-center pointer-events-auto">
              {/* Status Indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">
                  DEVELOPER PROFILE
                </span>
              </div>

              {/* Name */}
              <h3 className="font-editorial text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mb-1">
                GARV SHAW
              </h3>

              {/* GitHub Handle with Link */}
              <a
                href="https://github.com/garvshaw89-glitch"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                data-cursor-label="PROFILE"
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>garvshaw89-glitch</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
