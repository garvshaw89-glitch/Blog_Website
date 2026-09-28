import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rocketCinematicManager, CinematicState } from './rocketCinematicManager';
import { Rocket } from 'lucide-react';

export const ProfileCinematicOverlay: React.FC = () => {
  const [cinematicState, setCinematicState] = useState<CinematicState>(
    rocketCinematicManager.state
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicState({ ...state });
    });
  }, []);

  const { stage } = cinematicState;

  // STRICT STATE-MACHINE CONTROLLED TEXT VISIBILITY:
  // Under NO circumstances must text appear during PROFILE_FORMING, PROFILE_RECOGNIZABLE,
  // PROFILE_LOCKING, PROFILE_COMPLETE, PROFILE_HOLD, or TEXT_PREPARE.
  // Profile gets its own clean, uninterrupted moment.
  const isNameVisible =
    stage === 'NAME_REVEAL' ||
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  const isTaglineVisible =
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  // Overall container visible only when either piece of identity text is active
  const isContainerVisible = isNameVisible || isTaglineVisible;

  // Hide button during profile formation & hold so screen is 100% pure particle image
  const isButtonHidden =
    stage === 'PROFILE_FORMING' ||
    stage === 'PROFILE_RECOGNIZABLE' ||
    stage === 'PROFILE_LOCKING' ||
    stage === 'PROFILE_COMPLETE' ||
    stage === 'PROFILE_HOLD' ||
    stage === 'TEXT_PREPARE';

  return (
    <>
      {/* 1. Discrete Trigger Button at bottom-left */}
      <div
        className={`fixed bottom-6 left-6 z-40 pointer-events-auto transition-opacity duration-500 ${
          isButtonHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
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
          <Rocket
            className={`w-3.5 h-3.5 ${
              cinematicState.stage !== 'IDLE' ? 'text-cyan-400 -rotate-45' : 'text-neutral-400'
            }`}
          />
          <span>
            {cinematicState.stage === 'IDLE'
              ? 'PARTICLE ROCKET // LAUNCH'
              : `SEQUENCE // ${cinematicState.stage.replace(/_/g, ' ')}`}
          </span>
        </button>
      </div>

      {/* 
        2. POST-PROFILE IDENTITY TYPOGRAPHY
        Positioned below the centered 3D particle profile image.
        Composition:
               [ PARTICLE GITHUB PROFILE ]
                     GARV SHAW
              TURNING AI INTO INNOVATION
        
        STRICT TIMING:
        - 16.20s - 17.50s: PROFILE_HOLD -> NO TEXT (1.3s deliberate visual pause)
        - 17.50s - 17.70s: TEXT_PREPARE -> Profile remains stable, typography layer prepares
        - 17.70s - 18.10s: NAME_REVEAL  -> "GARV SHAW" appears (400ms: opacity 0->1, y:12->0, blur: 8px->0)
        - 18.10s - 18.70s: TAGLINE_REVEAL -> "TURNING AI INTO INNOVATION" appears (600ms: opacity 0->1, y:10->0, blur: 6px->0)
        - 18.70s - 19.50s: IDENTITY_COMPLETE -> Full composition held in harmony
      */}
      <AnimatePresence>
        {isContainerVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.5 } }}
            className="fixed inset-x-0 bottom-10 sm:bottom-14 md:bottom-16 z-40 flex flex-col items-center justify-center pointer-events-none select-none px-4 text-center"
          >
            {/* NAME: GARV SHAW */}
            {isNameVisible && (
              <motion.h2
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-editorial text-[clamp(28px,4.5vw,64px)] font-bold tracking-[-0.04em] text-[#F5F5F0] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] uppercase leading-none"
              >
                GARV SHAW
              </motion.h2>
            )}

            {/* TAGLINE: TURNING AI INTO INNOVATION */}
            {isTaglineVisible && (
              <motion.p
                initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-mono text-[clamp(11px,1.4vw,18px)] font-medium tracking-[0.08em] text-[#A5A7AC] uppercase mt-2.5 sm:mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
              >
                TURNING AI INTO INNOVATION
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
