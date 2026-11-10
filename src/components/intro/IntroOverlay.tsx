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
  // Timeline thresholds matching the 5 distinct scenes:
  // Scene 01: 0.0 – 2.0s (The Void)
  // Scene 02: 2.0 – 5.0s (The Digital Core formation)
  // Scene 03: 5.0 – 8.0s (The Name Reveal)
  // Scene 04: 8.0s onward (The Interactive Portal & CTA)
  // Scene 05: Transition triggered on Enter
  const showScene2Kicker = elapsedTime >= 2.2 && elapsedTime < 4.9 && !isTransitioning;
  const showNameReveal = elapsedTime >= 4.9 && !isTransitioning;
  const showCTA = elapsedTime >= 7.8 && !isTransitioning;

  // Track light sweep trigger in Scene 03
  const [sweepActive, setSweepActive] = useState(false);

  useEffect(() => {
    if (elapsedTime >= 5.6 && !sweepActive) {
      setSweepActive(true);
    }
  }, [elapsedTime, sweepActive]);

  const firstName = ['G', 'A', 'R', 'V'];
  const lastName = ['S', 'H', 'A', 'W'];

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
      {/* 1. TOP HEADER: Archive Brand & Minimal Controls */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.3 }}
        className="w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299]"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#E4E4E7]">
            GARV SHAW
          </span>
          <span className="text-neutral-600">/</span>
          <span className="font-mono text-[10px] text-[#A5A7AC] tracking-[0.25em] hidden sm:inline">
            DIGITAL IDENTITY
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Subtle Ambient Sound Toggle (Web Audio API Synthesizer) */}
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

          {/* Minimal Skip Intro Button */}
          <button
            type="button"
            onClick={onSkip}
            tabIndex={0}
            aria-label="Skip intro and enter directly"
            className="px-3.5 py-1.5 text-[11px] font-mono tracking-[0.22em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/10 hover:border-white/20 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
          >
            SKIP INTRO [ESC]
          </button>
        </div>
      </motion.header>

      {/* 2. CENTER STAGE: SCENE 02 & SCENE 03 REVEALS */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center my-auto px-4 relative">
        {/* Scene 02: Subtle Digital Core Formation Indicator */}
        <AnimatePresence>
          {showScene2Kicker && (
            <motion.div
              key="scene-02-kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-cyan-400 uppercase tracking-[0.35em]">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>SCENE 02 // THE DIGITAL CORE</span>
              </div>
              <span className="font-mono text-[11px] tracking-[0.38em] uppercase text-[#8E9299]">
                MATERIALIZING IDENTITY MATRICES
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 03: THE NAME REVEAL (GARV SHAW) */}
        <AnimatePresence>
          {showNameReveal && (
            <motion.div
              key="master-name-reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center relative"
            >
              {/* Massive Oversized Name Composition with Staggered Letter Emergence */}
              <div className="relative overflow-visible py-2">
                <h1
                  className="relative flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-10 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-[0.2em] sm:tracking-[0.25em] text-[#F5F5F0] font-['Space_Grotesk',sans-serif] uppercase leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
                  aria-label="Garv Shaw"
                >
                  {/* First Name: GARV */}
                  <span className="inline-flex">
                    {firstName.map((char, i) => (
                      <motion.span
                        key={`fn-${char}-${i}`}
                        initial={{
                          opacity: 0,
                          y: 28,
                          filter: 'blur(10px)',
                          scale: 1.15,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          scale: 1.0,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.05 + i * 0.09,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>

                  {/* Last Name: SHAW */}
                  <span className="inline-flex">
                    {lastName.map((char, i) => (
                      <motion.span
                        key={`ln-${char}-${i}`}
                        initial={{
                          opacity: 0,
                          y: 28,
                          filter: 'blur(10px)',
                          scale: 1.15,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          scale: 1.0,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.45 + i * 0.09,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                </h1>

                {/* Horizontal Light Sweep / Shimmer across lettering (Scene 03 step 3) */}
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={
                    sweepActive
                      ? { x: '180%', opacity: [0, 0.8, 1, 0.8, 0] }
                      : { x: '-100%', opacity: 0 }
                  }
                  transition={{
                    duration: 1.8,
                    delay: 0.2,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="absolute inset-y-0 w-36 sm:w-56 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent pointer-events-none mix-blend-screen skew-x-[-24deg]"
                />
              </div>

              {/* Elegant Hairline Divider */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 110, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.95 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent my-4 sm:my-5"
              />

              {/* Subtitle 1: AI & CLOUD DEVELOPER */}
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm md:text-base font-mono tracking-[0.38em] text-[#E4E4E7] uppercase font-normal mb-1.5"
              >
                AI &amp; CLOUD DEVELOPER
              </motion.h2>

              {/* Subtitle 2: CREATIVE TECHNOLOGIST · DIGITAL BUILDER */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.7, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-[11px] sm:text-xs tracking-[0.34em] text-[#A5A7AC] font-['Space_Grotesk',sans-serif] uppercase font-light"
              >
                CREATIVE TECHNOLOGIST <span className="text-cyan-400/80 mx-1">·</span> DIGITAL BUILDER
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM CTA: SCENE 04 THE INTERACTIVE PORTAL CTA */}
      <footer className="w-full flex flex-col items-center justify-center pb-4 sm:pb-8">
        <AnimatePresence>
          {showCTA && (
            <motion.div
              key="enter-experience-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex flex-col items-center"
            >
              {/* Magnetic CTA Wrapper on Desktop */}
              <Magnet padding={80} strength={2.4}>
                <button
                  type="button"
                  onClick={onEnter}
                  tabIndex={0}
                  aria-label="Enter the digital experience"
                  className="group relative flex items-center gap-3 px-8 sm:px-10 py-4 rounded-full bg-gradient-to-b from-[#161a22]/80 to-[#0b0e14]/90 border border-white/15 hover:border-cyan-400/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden active:scale-95"
                >
                  {/* Subtle Light Reflection sweep on button */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                  <span className="font-['Space_Grotesk',sans-serif] text-xs sm:text-sm font-medium tracking-[0.26em] text-[#F5F5F0] group-hover:text-white uppercase transition-colors">
                    ENTER EXPERIENCE
                  </span>

                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-300" />
                </button>
              </Magnet>

              <span className="text-[10px] font-mono tracking-[0.24em] text-neutral-500 mt-3 opacity-70">
                PRESS ENTER OR CLICK TO EXPLORE
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 05: Warp Portal Transition Flare Effect */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.4 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[#050505] z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {/* Expanding radial beam */}
            <div
              className="w-full h-full animate-pulse"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.45) 0%, rgba(14, 165, 233, 0.15) 35%, rgba(5, 5, 5, 0.95) 75%)',
              }}
            />
            {/* Horizontal light flare beam */}
            <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse" />
          </motion.div>
        )}
      </footer>
    </div>
  );
};
