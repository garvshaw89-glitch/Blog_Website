import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntroStageId, INTRO_STAGES } from './types';
import { ArrowDown, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface IntroOverlayProps {
  currentStage: IntroStageId;
  elapsedTime: number;
  stageProgress: number; // 0 to 1 in current stage
  onSelectStage: (stage: IntroStageId) => void;
  onEnter: () => void;
  onSkip: () => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

const STAGE_SUBTITLES: Record<IntroStageId, string> = {
  VOID: 'Before the architecture, there was pure digital matter.',
  TERRAIN: 'Fluids of data. Topographies of autonomous thought.',
  METROPOLIS: 'Architecting digital systems that outlast the moment.',
  QUANTUM_ORB: 'Intelligence compressed into a living singularity.',
  PORTAL: 'Passing through the digital portal...',
};

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  currentStage,
  elapsedTime,
  stageProgress,
  onSelectStage,
  onEnter,
  onSkip,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  const currentStageInfo = INTRO_STAGES.find((s) => s.id === currentStage) || INTRO_STAGES[0];

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
      {/* 1. TOP HEADER: Archive Brand, Live Stage Telemetry, Audio & Skip */}
      <header className="w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#F5F5F0]">
            The Digital Archive
          </span>
          <span className="hidden md:inline text-neutral-600">/</span>
          <span className="hidden md:inline font-mono text-[10px] text-neutral-400">
            PHASE {currentStageInfo.index} : {currentStageInfo.name}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* User-Initiated Sound FX Toggle */}
          <button
            onClick={onToggleAudio}
            tabIndex={0}
            aria-label={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
            title={isAudioOn ? 'Mute sound' : 'Enable ambient sound'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-[0.15em] text-[#A5A7AC] hover:text-[#F5F5F0] transition-colors rounded border border-white/5 hover:border-white/15 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
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

          {/* Skip Intro Button */}
          <button
            onClick={onSkip}
            tabIndex={0}
            aria-label="Skip intro to journal homepage"
            className="px-3.5 py-1.5 text-[11px] font-mono tracking-[0.2em] text-[#A5A7AC] hover:text-[#F5F5F0] transition-colors rounded border border-white/5 hover:border-white/15 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>
      </header>

      {/* 2. CENTER IDENTITY: Editorial Luxury Typography */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto px-4">
        {!isTransitioning && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Minimal Kicker */}
            <span className="text-[10px] sm:text-xs font-mono tracking-[0.38em] text-[#A5A7AC] uppercase mb-3">
              AI × Cloud × Software Architecture
            </span>

            {/* Brand Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-[0.22em] text-[#F5F5F0] font-['Space_Grotesk',sans-serif] uppercase leading-none drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
              Garv Shaw
            </h1>

            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8E9299]/50 to-transparent my-4" />

            {/* Dynamic Stage Narrative Subtitle */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStage}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.5 }}
                className="text-xs sm:text-sm tracking-[0.26em] text-[#A5A7AC] font-['Space_Grotesk',sans-serif] uppercase font-normal max-w-xl leading-relaxed"
              >
                {STAGE_SUBTITLES[currentStage]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* 3. BOTTOM CONTROLS: Interactive Stage Scrubber & Main CTA */}
      <footer className="w-full flex flex-col items-center gap-6 pb-2 sm:pb-6">
        {/* Interactive Timeline Scrubber (5 Stages matching video) */}
        {!isTransitioning && (
          <nav
            aria-label="Cinematic phase navigation"
            className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 p-1.5 rounded-full bg-[#08090C]/80 border border-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          >
            {INTRO_STAGES.map((stg) => {
              const isActive = stg.id === currentStage;
              return (
                <button
                  key={stg.id}
                  onClick={() => onSelectStage(stg.id)}
                  data-cursor="button"
                  tabIndex={0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)] font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isActive ? 'bg-cyan-400' : 'bg-neutral-600'
                    }`}
                  />
                  <span>
                    {stg.index} <span className="hidden md:inline">{stg.name}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Primary Luxury CTA */}
        {!isTransitioning && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
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
            <div className="relative flex flex-col items-center px-7 py-3 rounded-full transition-all duration-500 hover:bg-white/[0.04]">
              <span className="text-xs sm:text-sm font-['Space_Grotesk',sans-serif] font-medium tracking-[0.28em] group-hover:tracking-[0.38em] text-[#F5F5F0] transition-all duration-500 uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Enter The Journal
              </span>

              <div className="w-14 h-[1px] bg-neutral-600 group-hover:w-24 group-hover:bg-[#F5F5F0] transition-all duration-500 my-2" />

              <ArrowDown className="w-3.5 h-3.5 text-[#8E9299] group-hover:text-[#F5F5F0] group-hover:translate-y-1 transition-all duration-500" />
            </div>

            <span className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 mt-1">
              PRESS ENTER OR CLICK TO ENTER PORTAL
            </span>
          </motion.div>
        )}

        {/* Transitioning Portal Light Flare Feedback */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 bg-[#050505] z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </motion.div>
        )}
      </footer>
    </div>
  );
};
