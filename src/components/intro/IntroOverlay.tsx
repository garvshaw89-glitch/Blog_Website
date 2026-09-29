import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Volume2, VolumeX, Sparkles } from 'lucide-react';

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
  // Timeline reveals
  // 3.5s onward: Typography reveals
  const showTypography = elapsedTime >= 3.2 && !isTransitioning;
  // 4.8s onward: Primary CTA reveals
  const showCTA = elapsedTime >= 4.8 && !isTransitioning;

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
      {/* 1. TOP HEADER: Archive Brand & Minimal Actions */}
      <header className="w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-200" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#E4E4E7]">
            The Digital Archive
          </span>
          <span className="hidden sm:inline text-neutral-600">/</span>
          <span className="hidden sm:inline font-mono text-[10px] text-neutral-400 tracking-[0.25em]">
            VOL. 2026
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Subtle Ambient Sound Toggle (Web Audio API Synthesizer) */}
          <button
            onClick={onToggleAudio}
            tabIndex={0}
            aria-label={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
            title={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-[0.18em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/5 hover:border-white/15 bg-neutral-950/50 backdrop-blur-md cursor-pointer"
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
            onClick={onSkip}
            tabIndex={0}
            aria-label="Skip intro and enter the journal"
            className="px-3.5 py-1.5 text-[11px] font-mono tracking-[0.22em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/5 hover:border-white/15 bg-neutral-950/50 backdrop-blur-md cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>
      </header>

      {/* 2. CENTER IDENTITY: Editorial Luxury Typography */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto px-4">
        <AnimatePresence>
          {showTypography && (
            <motion.div
              key="editorial-identity"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              {/* Restrained Kicker */}
              <span className="text-[10px] sm:text-xs font-mono tracking-[0.42em] text-[#A1A1AA] uppercase mb-4">
                The Digital Archive &bull; Garv Shaw
              </span>

              {/* Main Title: Garv Shaw / The Journal */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.24em] text-[#F5F5F0] font-['Space_Grotesk',sans-serif] uppercase leading-none drop-shadow-[0_16px_40px_rgba(0,0,0,0.9)]">
                Garv Shaw
              </h1>

              {/* Elegant Hairline Divider */}
              <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#71717A]/60 to-transparent my-5 sm:my-6" />

              {/* Subtitle: Restrained Modern Luxury Editorial */}
              <p className="text-xs sm:text-sm tracking-[0.32em] text-[#A1A1AA] font-['Space_Grotesk',sans-serif] uppercase font-light max-w-xl leading-relaxed">
                Ideas &bull; Technology &bull; Design &bull; Culture
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM CTA: Minimalist Portal Entrance Button */}
      <footer className="w-full flex flex-col items-center justify-center pb-4 sm:pb-8">
        <AnimatePresence>
          {showCTA && (
            <motion.div
              key="enter-cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex flex-col items-center group cursor-pointer"
              onClick={onEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEnter();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Enter the journal"
            >
              <div className="relative flex flex-col items-center px-8 py-3.5 rounded-full transition-all duration-500 hover:bg-white/[0.04]">
                <span className="text-xs sm:text-sm font-['Space_Grotesk',sans-serif] font-normal tracking-[0.28em] group-hover:tracking-[0.38em] text-[#F5F5F0] transition-all duration-500 uppercase flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-300 group-hover:text-cyan-400 transition-colors" />
                  Enter The Journal
                </span>

                {/* Underline line animation */}
                <div className="w-14 h-[1px] bg-neutral-600 group-hover:w-28 group-hover:bg-[#F5F5F0] transition-all duration-500 my-2" />

                <ArrowDown className="w-3.5 h-3.5 text-[#8E9299] group-hover:text-[#F5F5F0] group-hover:translate-y-1 transition-all duration-500" />
              </div>

              <span className="text-[10px] font-mono tracking-[0.24em] text-neutral-500 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                PRESS ENTER OR CLICK TO ENTER PORTAL
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portal Transition Light Flare Feedback */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65 }}
            className="fixed inset-0 bg-[#050505] z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse" />
          </motion.div>
        )}
      </footer>
    </div>
  );
};
