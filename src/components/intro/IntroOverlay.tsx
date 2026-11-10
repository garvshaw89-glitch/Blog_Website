import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Magnet } from '../Magnet';

interface IntroOverlayProps {
  elapsedTime: number;
  onEnter: () => void;
  onSkip: () => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  elapsedTime,
  onEnter,
  onSkip,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  // Timeline thresholds matching the user's 4 distinct scenes:
  // Scene 01: 0.0 – 2.8s (Typography takeover: Massive GARV enters from beyond screen edges)
  // Scene 02: 2.8 – 5.8s (Visual transformation: typography stretches, fragments, liquid distortion)
  // Scene 03: 5.8 – 8.8s (Identity composition: refined editorial composition, asymmetric alignment)
  // Scene 04: 8.8s onward (Enter: elegant button appears, cinematic light sweep passes)
  const isScene01 = elapsedTime < 2.8 && !isTransitioning;
  const isScene02 = elapsedTime >= 2.8 && elapsedTime < 5.8 && !isTransitioning;
  const isScene03 = elapsedTime >= 5.8 && elapsedTime < 8.8 && !isTransitioning;
  const isScene04 = elapsedTime >= 8.8 && !isTransitioning;

  // Track cinematic light sweep beam across screen
  const [lightSweepTriggered, setLightSweepTriggered] = useState(false);

  useEffect(() => {
    if (elapsedTime >= 8.6 && !lightSweepTriggered) {
      setLightSweepTriggered(true);
    }
  }, [elapsedTime, lightSweepTriggered]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* TOP BAR: Clean Minimal Header (Visible across scenes)            */}
      {/* ---------------------------------------------------------------- */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299] z-20"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#E4E4E7]">
            GARV SHAW
          </span>
          <span className="text-neutral-600 hidden sm:inline">/</span>
          <span className="font-mono text-[10px] text-[#A5A7AC] tracking-[0.25em] hidden sm:inline">
            SYSTEM 2026
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            tabIndex={0}
            aria-label={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
            title={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-[0.18em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/10 hover:border-white/20 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
          >
            {isAudioOn ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline text-cyan-300">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">SOUND</span>
              </>
            )}
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={onSkip}
            tabIndex={0}
            aria-label="Skip entrance experience"
            className="px-3.5 py-1.5 text-[11px] font-mono tracking-[0.22em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/10 hover:border-white/20 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>
      </motion.header>

      {/* ---------------------------------------------------------------- */}
      {/* SCENE 01 — TYPOGRAPHY TAKEOVER                                   */}
      {/* Full black screen. Massive GARV typography enters from beyond    */}
      {/* the screen edges. Letters move horizontally with slow, precise    */}
      {/* kinetic motion, occupying almost the entire viewport.            */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {isScene01 && (
          <motion.div
            key="scene-01-typography-takeover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden z-10 pointer-events-none"
          >
            <div className="w-full flex items-center justify-between px-2 sm:px-6 md:px-12">
              {/* G: Enters from far left */}
              <motion.span
                initial={{ x: '-120vw', opacity: 0 }}
                animate={{ x: '0vw', opacity: 1 }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk',sans-serif] font-bold text-[22vw] leading-none text-[#F4F4F5] tracking-tighter drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none"
              >
                G
              </motion.span>

              {/* A: Enters with slight delayed kinetic glide */}
              <motion.span
                initial={{ x: '-80vw', opacity: 0 }}
                animate={{ x: '0vw', opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk',sans-serif] font-bold text-[22vw] leading-none text-[#E2E8F0] tracking-tighter drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none"
              >
                A
              </motion.span>

              {/* R: Enters from right with parallax counter-motion */}
              <motion.span
                initial={{ x: '80vw', opacity: 0 }}
                animate={{ x: '0vw', opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk',sans-serif] font-bold text-[22vw] leading-none text-[#CBD5E1] tracking-tighter drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none"
              >
                R
              </motion.span>

              {/* V: Enters from far right */}
              <motion.span
                initial={{ x: '120vw', opacity: 0 }}
                animate={{ x: '0vw', opacity: 1 }}
                transition={{ duration: 1.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk',sans-serif] font-bold text-[22vw] leading-none text-[#94A3B8] tracking-tighter drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none"
              >
                V
              </motion.span>
            </div>

            {/* Subtle hairline edge tracking coordinates */}
            <div className="absolute bottom-16 left-12 font-mono text-[10px] text-neutral-500 tracking-[0.3em] uppercase">
              TYPOGRAPHY TAKEOVER // LATENT VELOCITY
            </div>
            <div className="absolute bottom-16 right-12 font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase">
              SCALE: 100VW
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* SCENE 02 — VISUAL TRANSFORMATION                                 */}
      {/* The typography stretches, fragments and transforms into an        */}
      {/* abstract metallic liquid visual.                                 */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {isScene02 && (
          <motion.div
            key="scene-02-fragmentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          >
            {/* Chromatic Liquid Dispersion Slits */}
            <div className="w-full max-w-4xl px-8 flex flex-col gap-2 opacity-40">
              <motion.div
                initial={{ scaleX: 1, filter: 'blur(0px)' }}
                animate={{ scaleX: [1, 2.2, 0.2], filter: ['blur(0px)', 'blur(8px)', 'blur(20px)'] }}
                transition={{ duration: 2.6, ease: 'easeInOut' }}
                className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              />
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: [1, 1.8, 0], filter: ['blur(0px)', 'blur(12px)', 'blur(24px)'] }}
                transition={{ duration: 2.8, delay: 0.1, ease: 'easeInOut' }}
                className="h-[1px] w-3/4 mx-auto bg-gradient-to-r from-transparent via-slate-200 to-transparent"
              />
            </div>

            {/* Minimal Sub-Indicator */}
            <div className="mt-8 flex items-center gap-2 font-mono text-[10px] text-cyan-400 uppercase tracking-[0.35em]">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              <span>METALLIC LIQUID TRANSFORMATION</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* SCENE 03 & 04 — REFINED EDITORIAL IDENTITY & ENTER CTA           */}
      {/* GARV SHAW resolves into a refined editorial composition.         */}
      {/* Small identity text, asymmetric alignment & balanced whitespace. */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {(isScene03 || isScene04) && (
          <motion.div
            key="scene-03-editorial-identity"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto my-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 pointer-events-auto"
          >
            {/* Left Column: Asymmetrical Editorial Typography */}
            <div className="lg:col-span-7 flex flex-col text-left">
              {/* Category / Chapter Kicker */}
              <div className="flex items-center gap-3 mb-4 font-mono text-[11px] text-[#8E9299] tracking-[0.35em] uppercase">
                <span className="text-cyan-400 font-semibold">01 //</span>
                <span>IDENTITY ARCHIVE</span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400">INDEX 2026</span>
              </div>

              {/* Master Name: GARV SHAW */}
              <h1 className="font-['Space_Grotesk',sans-serif] font-bold text-5xl sm:text-7xl md:text-8xl text-[#F5F5F0] uppercase tracking-tight leading-[0.95] drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
                GARV SHAW
              </h1>

              {/* Hairline Divider */}
              <div className="w-24 h-[1px] bg-gradient-to-r from-cyan-400/80 to-transparent my-6" />

              {/* Primary Role & Creative Identity */}
              <h2 className="font-mono text-sm sm:text-base text-[#E2E8F0] tracking-[0.25em] uppercase font-medium mb-2">
                AI &amp; CLOUD ARCHITECT
              </h2>

              <p className="font-['Space_Grotesk',sans-serif] text-xs sm:text-sm text-[#A0A5AD] tracking-[0.2em] uppercase font-light leading-relaxed max-w-lg">
                CREATIVE TECHNOLOGIST <span className="text-cyan-400 mx-1">·</span> SOFTWARE ENGINEER <span className="text-cyan-400 mx-1">·</span> DIGITAL SYSTEMS BUILDER
              </p>

              {/* Curated Editorial Metadata Tags */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-8 font-mono text-[10px] text-[#6B7280] tracking-[0.28em] uppercase">
                <span>NEW DELHI // GLOBAL</span>
                <span className="text-neutral-700">/</span>
                <span>B.TECH CSE</span>
                <span className="text-neutral-700">/</span>
                <span>HIGH PERFORMANCE WEB</span>
              </div>
            </div>

            {/* Right Column: Generous balanced whitespace allowing 3D Liquid Chrome to shine */}
            <div className="lg:col-span-5 hidden lg:block" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* SCENE 04 — ENTER CTA & CINEMATIC LIGHT SWEEP                     */}
      {/* An elegant ENTER button appears. A cinematic light sweep passes   */}
      {/* through the screen.                                              */}
      {/* ---------------------------------------------------------------- */}
      <footer className="w-full flex flex-col items-center justify-center pb-6 sm:pb-10 z-20">
        <AnimatePresence>
          {isScene04 && (
            <motion.div
              key="scene-04-enter-cta"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex flex-col items-center"
            >
              {/* Magnetic Luxury CTA Button */}
              <Magnet padding={90} strength={2.4}>
                <button
                  type="button"
                  onClick={onEnter}
                  tabIndex={0}
                  aria-label="Enter digital portfolio website"
                  className="group relative flex items-center gap-4 px-9 sm:px-12 py-4 sm:py-4.5 rounded-full bg-gradient-to-b from-[#141820]/90 to-[#080b10]/95 border border-white/20 hover:border-cyan-400/60 shadow-[0_0_35px_rgba(0,0,0,0.85)] hover:shadow-[0_0_40px_rgba(56,189,248,0.3)] backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden active:scale-95"
                >
                  {/* Subtle Light Reflection sweep on button */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                  <span className="font-['Space_Grotesk',sans-serif] text-xs sm:text-sm font-semibold tracking-[0.3em] text-[#F5F5F0] group-hover:text-white uppercase transition-colors">
                    ENTER
                  </span>

                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-2 transition-all duration-300" />
                </button>
              </Magnet>

              <span className="text-[10px] font-mono tracking-[0.26em] text-neutral-500 mt-3.5 opacity-70">
                PRESS ENTER OR CLICK TO EXPLORE
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Light Sweep Beam (Scene 04 Requirement) */}
        {lightSweepTriggered && !isTransitioning && (
          <motion.div
            initial={{ x: '-120vw', opacity: 0 }}
            animate={{ x: '120vw', opacity: [0, 0.9, 1, 0.8, 0] }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 w-48 sm:w-80 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none mix-blend-screen skew-x-[-22deg] z-30"
          />
        )}

        {/* Warp Transition on Click */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[#050505] z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <div
              className="w-full h-full animate-pulse"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.5) 0%, rgba(14, 165, 233, 0.18) 35%, rgba(5, 5, 5, 0.98) 75%)',
              }}
            />
            <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse" />
          </motion.div>
        )}
      </footer>
    </div>
  );
};
