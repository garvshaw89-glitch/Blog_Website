import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rocketCinematicManager, CinematicState } from './rocketCinematicManager';
import { DotParticleAvatar } from './DotParticleAvatar';
import { Rocket, Globe, Sparkles, User, Radio, ExternalLink, CheckCircle2 } from 'lucide-react';

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

  const isRocketActive =
    stage === 'GATHER' ||
    stage === 'ROCKET_FORMED' ||
    stage === 'IGNITION' ||
    stage === 'LAUNCH' ||
    stage === 'FLIGHT' ||
    stage === 'DESCENT' ||
    stage === 'LANDING_IMPACT' ||
    stage === 'PARTICLE_CLOUD';

  const isProfileForming =
    stage === 'PROFILE_FORMING' ||
    stage === 'PROFILE_RECOGNIZABLE' ||
    stage === 'PROFILE_LOCKING';

  const isProfileActive =
    isProfileForming ||
    stage === 'PROFILE_COMPLETE' ||
    stage === 'PROFILE_HOLD' ||
    stage === 'TEXT_PREPARE' ||
    stage === 'NAME_REVEAL' ||
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  // The GitHub profile card appears strictly AFTER showing the 3D profile dot/particle effect image
  const isProfileCardRevealed =
    stage === 'PROFILE_COMPLETE' ||
    stage === 'PROFILE_HOLD' ||
    stage === 'TEXT_PREPARE' ||
    stage === 'NAME_REVEAL' ||
    stage === 'TAGLINE_REVEAL' ||
    stage === 'IDENTITY_COMPLETE';

  const isEarthActive = !isRocketActive && !isProfileActive && ambientState === 'GLOBE';
  const isFlowActive = !isRocketActive && !isProfileActive && ambientState === 'FREE_FLOW';

  return (
    <>
      {/* ============================================================ */}
      {/* 1. SENIOR UI/UX INTERACTIVE LIVING MATTER COMMAND DOCK        */}
      {/* Discrete, luxury floating controls at bottom-left             */}
      {/* ============================================================ */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-auto transition-all duration-500">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#08090B]/90 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* A. 20,000 PARTICLE EARTH GLOBE BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerEarth()}
            data-cursor="button"
            data-cursor-label="EARTH"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isEarthActive
                ? 'bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Summon 20,000-Particle Planetary Earth Hologram"
          >
            <Globe
              className={`w-3.5 h-3.5 ${
                isEarthActive ? 'text-emerald-400 animate-spin' : 'text-neutral-400'
              }`}
              style={{ animationDuration: '24s' }}
            />
            <span className="font-semibold">EARTH</span>
          </button>

          {/* B. REAL HEAVY AEROSPACE ROCKET LAUNCH BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerSequence()}
            data-cursor="button"
            data-cursor-label="ROCKET"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isRocketActive
                ? 'bg-cyan-950/80 border border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.4)] animate-pulse'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Launch Multi-Stage Aerospace Rocket Cinematic"
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

          {/* C. GITHUB PROFILE PHOTO PARTICLE REVEAL BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerProfile()}
            data-cursor="button"
            data-cursor-label="PROFILE"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isProfileActive
                ? 'bg-indigo-950/80 border border-indigo-400/60 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.4)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
            title="Synthesize 20,000-Particle GitHub Avatar Portrait with Authentic Colors"
          >
            <User
              className={`w-3.5 h-3.5 ${
                isProfileActive ? 'text-indigo-400' : 'text-neutral-400'
              }`}
            />
            <span className="font-semibold">PROFILE</span>
          </button>

          {/* D. LIVING FLUID MATTER FLOW BUTTON */}
          <button
            type="button"
            onClick={() => rocketCinematicManager.triggerFlow()}
            data-cursor="button"
            data-cursor-label="FLOW"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
              isFlowActive
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
      {/* 2. REAL-TIME PLANETARY / AEROSPACE / PROFILE TELEMETRY HUD    */}
      {/* High-end technical editorial readout at bottom-right          */}
      {/* ============================================================ */}
      <AnimatePresence>
        {(isEarthActive || isRocketActive || isProfileActive) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
            className="fixed bottom-6 right-6 z-40 pointer-events-none hidden md:flex flex-col items-end gap-1 font-mono text-[11px] tracking-widest select-none"
          >
            {/* 20,000 PARTICLE EARTH TELEMETRY */}
            {isEarthActive && (
              <div className="flex flex-col items-end px-3.5 py-2 rounded-lg bg-[#08090B]/85 backdrop-blur-md border border-emerald-500/20 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold">TERRA BIOSPHERE // 20,000 PARTICLES</span>
                </div>
                <div className="text-neutral-400 mt-1 flex items-center gap-3">
                  <span>SCALE: 12,742 KM</span>
                  <span>•</span>
                  <span>TILT: 23.44°</span>
                  <span>•</span>
                  <span>ORBIT: 29.78 KM/S</span>
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  SAPPHIRE OCEANS • EMERALD FORESTS • GOLDEN DESERT • POLAR ICE
                </div>
              </div>
            )}

            {/* REAL ROCKET TELEMETRY */}
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
                  MULTI-STAGE RAPTOR PROPULSION • SUPERSONIC SHOCK PLUME
                </div>
              </div>
            )}

            {/* GITHUB PROFILE PHOTO TELEMETRY */}
            {isProfileActive && (
              <div className="flex flex-col items-end px-3.5 py-2 rounded-lg bg-[#08090B]/85 backdrop-blur-md border border-indigo-500/30 shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span className="font-semibold">
                    {isProfileForming
                      ? 'SYNTHESIZING 20,000 PARTICLES...'
                      : 'AUTHENTIC PORTRAIT HOLOGRAM ACTIVE'}
                  </span>
                </div>
                <div className="text-neutral-300 mt-1 flex items-center gap-3 font-semibold">
                  <span>GARV SHAW</span>
                  <span>•</span>
                  <span>@garvshaw89-glitch</span>
                  <span>•</span>
                  <span>20,000 PTS</span>
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  ACTUAL PHOTOGRAPHIC CHROMATICITY • 3D DEPTH RELIEF
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 3. PROFILE FORMING STATUS BANNER (Center Unobstructed)        */}
      {/* While the 3D particles are forming, the screen is wide open  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isProfileForming && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15, transition: { duration: 0.3 } }}
            className="fixed inset-x-0 bottom-24 z-30 flex justify-center pointer-events-none select-none"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#08090B]/80 border border-cyan-400/40 backdrop-blur-md text-cyan-300 font-mono text-xs shadow-2xl tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>LOCKING 20,000 PARTICLES INTO AUTHENTIC PORTRAIT...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 4. GITHUB PROFILE REVEAL CARD (WITH DOT EFFECT AVATAR)       */}
      {/* Appears strictly AFTER showing the 3D profile dot image      */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isProfileCardRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96, transition: { duration: 0.35 } }}
            className="fixed inset-x-0 bottom-6 sm:bottom-8 md:bottom-10 z-40 flex flex-col items-center justify-center pointer-events-auto px-4 text-center select-none"
          >
            <div className="relative group max-w-lg w-full p-5 sm:p-6 rounded-3xl bg-[#08090B]/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] hover:border-cyan-400/50 transition-all duration-500">
              {/* Vibrant Animated Multi-Color Neon Aura */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/40 via-purple-500/40 to-rose-400/40 opacity-70 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-left">
                {/* Authentic GitHub Avatar rendered as an Interactive Dot Particle Matrix! */}
                <div className="relative flex-shrink-0">
                  <DotParticleAvatar
                    size={96}
                    gridResolution={32}
                    showToggle={true}
                    interactive={true}
                  />
                  <span
                    className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#08090B] shadow-[0_0_8px_#34d399] flex items-center justify-center"
                    title="Verified Active Architect"
                  >
                    <CheckCircle2 className="w-3 h-3 text-black" />
                  </span>
                </div>

                {/* Identity & Technical Metas */}
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-widest uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>VERIFIED DIGITAL ARCHITECT</span>
                  </div>

                  <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white leading-none">
                    GARV{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-400">
                      SHAW
                    </span>
                  </h2>

                  <p className="font-mono text-xs text-neutral-300 tracking-wider mt-1">
                    @garvshaw89-glitch • 20,000-Dot Hologram
                  </p>

                  {/* Specialization Chips */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-mono text-[9px] font-semibold tracking-wider">
                      AI & AGENTS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-400/40 text-indigo-300 font-mono text-[9px] font-semibold tracking-wider">
                      CLOUD SYSTEMS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 font-mono text-[9px] font-semibold tracking-wider">
                      DOT MATRIX
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 mt-4 w-full pt-3 border-t border-white/10">
                    <a
                      href="https://github.com/garvshaw89-glitch"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-cyan-300 text-black font-mono text-[11px] font-semibold tracking-wider transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                      <span>GITHUB PROFILE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => rocketCinematicManager.triggerFlow()}
                      className="px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 hover:text-white font-mono text-[11px] tracking-wider transition-all"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
