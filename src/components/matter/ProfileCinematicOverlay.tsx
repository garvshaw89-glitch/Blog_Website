import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rocketCinematicManager, CinematicState } from './rocketCinematicManager';
import { Rocket, Globe, Sparkles, Activity, Radio, Compass } from 'lucide-react';

export const ProfileCinematicOverlay: React.FC = () => {
  const [cinematicState, setCinematicState] = useState<CinematicState>(
    rocketCinematicManager.state
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicState({ ...state });
    });
  }, []);

  const { stage, ambientState, rocketAltitudeMeters, rocketVelocityKmh } = cinematicState;

  const isRocketActive = stage !== 'IDLE';
  const isEarthActive = !isRocketActive && ambientState === 'GLOBE';

  // STRICT STATE-MACHINE CONTROLLED TEXT VISIBILITY:
  // Under NO circumstances must text appear during PROFILE_FORMING, PROFILE_RECOGNIZABLE,
  // PROFILE_LOCKING, PROFILE_COMPLETE, PROFILE_HOLD, or TEXT_PREPARE.
  const isNameVisible =
    stage === 'NAME_REVEAL' ||
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  const isTaglineVisible =
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  const isContainerVisible = isNameVisible || isTaglineVisible;

  // Hide UI overlays during profile formation & hold so screen is 100% pure particle image
  const isProfilePureMoment =
    stage === 'PROFILE_FORMING' ||
    stage === 'PROFILE_RECOGNIZABLE' ||
    stage === 'PROFILE_LOCKING' ||
    stage === 'PROFILE_COMPLETE' ||
    stage === 'PROFILE_HOLD' ||
    stage === 'TEXT_PREPARE';

  return (
    <>
      {/* ============================================================ */}
      {/* 1. SENIOR UI/UX INTERACTIVE LIVING MATTER COMMAND DOCK        */}
      {/* Discrete, luxury floating controls at bottom-left             */}
      {/* ============================================================ */}
      <div
        className={`fixed bottom-6 left-6 z-40 pointer-events-auto transition-all duration-700 ${
          isProfilePureMoment ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#08090B]/90 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* A. EARTH TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerEarth()}
            disabled={isRocketActive}
            data-cursor="button"
            data-cursor-label="EARTH"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isEarthActive
                ? 'bg-emerald-950/70 border border-emerald-400/60 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Summon Planetary Earth Hologram"
          >
            <Globe
              className={`w-3.5 h-3.5 ${
                isEarthActive ? 'text-emerald-400 animate-spin' : 'text-neutral-400'
              }`}
              style={{ animationDuration: '24s' }}
            />
            <span className="font-semibold">EARTH</span>
          </button>

          {/* B. REAL ROCKET TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerSequence()}
            disabled={isRocketActive}
            data-cursor="button"
            data-cursor-label="LAUNCH"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isRocketActive
                ? 'bg-cyan-950/70 border border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.4)] animate-pulse'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Launch Heavy Aerospace Rocket Cinematic"
          >
            <Rocket
              className={`w-3.5 h-3.5 ${
                isRocketActive ? 'text-cyan-400 -rotate-45' : 'text-neutral-400'
              }`}
            />
            <span className="font-semibold">
              {isRocketActive ? stage.replace(/_/g, ' ') : 'ROCKET'}
            </span>
          </button>

          {/* C. LIVING FLUID MATTER FLOW BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerFlow()}
            disabled={isRocketActive}
            data-cursor="button"
            data-cursor-label="FLOW"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              !isEarthActive && !isRocketActive && ambientState === 'FREE_FLOW'
                ? 'bg-blue-950/60 border border-blue-400/50 text-blue-200'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Return to Living Fluid Particle Flow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FLOW</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. REAL-TIME PLANETARY / AEROSPACE TELEMETRY HUD               */}
      {/* High-end technical editorial readout at bottom-right          */}
      {/* ============================================================ */}
      <AnimatePresence>
        {(isEarthActive || isRocketActive) && !isProfilePureMoment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
            className="fixed bottom-6 right-6 z-40 pointer-events-none hidden md:flex flex-col items-end gap-1 font-mono text-[11px] tracking-widest select-none"
          >
            {isEarthActive && (
              <div className="flex flex-col items-end px-3.5 py-2 rounded-lg bg-[#08090B]/85 backdrop-blur-md border border-emerald-500/20 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold">TERRA BIOSPHERE // ACTIVE</span>
                </div>
                <div className="text-neutral-400 mt-1 flex items-center gap-3">
                  <span>SCALE: 12,742 KM</span>
                  <span>•</span>
                  <span>TILT: 23.44°</span>
                  <span>•</span>
                  <span>ORBIT: 29.78 KM/S</span>
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  SAPPHIRE OCEANS • EMERALD FORESTS • GOLDEN DESERT • CLOUDS
                </div>
              </div>
            )}

            {isRocketActive && (
              <div className="flex flex-col items-end px-3.5 py-2 rounded-lg bg-[#08090B]/85 backdrop-blur-md border border-cyan-500/25 shadow-xl">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                  <span className="font-semibold">HEAVY LAUNCH VEHICLE // {stage.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-neutral-300 mt-1 flex items-center gap-3 font-semibold">
                  <span>ALT: {rocketAltitudeMeters.toLocaleString()} M</span>
                  <span>•</span>
                  <span>VEL: {rocketVelocityKmh.toLocaleString()} KM/H</span>
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  5x RAPTOR PROPULSION • SUPERSONIC SHOCK PLUME NOMINAL
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 3. POST-PROFILE IDENTITY TYPOGRAPHY                           */}
      {/* Positioned below the centered 3D particle profile image.     */}
      {/* ============================================================ */}
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
