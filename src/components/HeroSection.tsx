import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdentityCore } from './ui/IdentityCore';
import { ArrowDown, ArrowUpRight, Sparkles, Terminal, Activity } from 'lucide-react';

interface HeroSectionProps {
  onContactClick?: () => void;
  onExploreClick?: () => void;
  id?: string;
}

interface HeadlineItem {
  id: string;
  prefix: string;
  primary: string;
  highlight: string;
  subline: string;
  // Per-headline calibrated clamp sizing to balance short vs long phrases perfectly:
  // e.g., 'GARV SHAW' is 9 characters (can be bold and punchy), while
  // 'BUILDING INTELLIGENT DIGITAL SYSTEMS' has 36 characters (needs optimized fluid scale).
  fluidSize: string;
  lineHeight: string;
}

const HEADLINE_ROTATIONS: HeadlineItem[] = [
  {
    id: 'garv-shaw',
    prefix: 'HELLO, I AM',
    primary: 'GARV SHAW.',
    highlight: 'SHAW',
    subline: 'DIGITAL ARCHITECT & FULL-STACK SYSTEMS ENGINEER',
    fluidSize: 'text-[clamp(2.4rem,8.2vw,5.8rem)]',
    lineHeight: 'leading-[0.98]',
  },
  {
    id: 'building-systems',
    prefix: 'I AM',
    primary: 'BUILDING INTELLIGENT DIGITAL SYSTEMS.',
    highlight: 'INTELLIGENT',
    subline: 'AT THE INTERSECTION OF AI, CLOUD & DISTRIBUTED PLATFORMS',
    fluidSize: 'text-[clamp(1.75rem,5.2vw,4.5rem)]',
    lineHeight: 'leading-[1.04]',
  },
  {
    id: 'turning-ai',
    prefix: 'ENGINEERING LAB',
    primary: 'TURNING AI INTO INNOVATION.',
    highlight: 'INNOVATION',
    subline: 'AUTONOMOUS AGENTS, REASONING PIPELINES & HIGH-IMPACT PRODUCTS',
    fluidSize: 'text-[clamp(1.9rem,6.2vw,4.9rem)]',
    lineHeight: 'leading-[1.02]',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onContactClick,
  onExploreClick,
  id = 'hero-section',
}) => {
  const [rotationIndex, setRotationIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % HEADLINE_ROTATIONS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentRotation = HEADLINE_ROTATIONS[rotationIndex];

  return (
    <section
      id={id}
      data-cursor-theme="default"
      className="relative w-full min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-10 px-4 sm:px-6 md:px-12 select-none overflow-hidden"
    >
      {/* Main Center Editorial Composition with Fluid Typography Scaling */}
      <div className="w-full max-w-7xl mx-auto my-auto py-6 sm:py-10 flex flex-col items-center">
        {/* Dynamic Rotating Display Headline Box with Fixed Height Budget to prevent layout jumps */}
        <div className="text-center w-full mb-6 max-w-5xl mx-auto">
          {/* Active sequence pill indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {HEADLINE_ROTATIONS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRotationIndex(i)}
                aria-label={`Jump to headline: ${item.primary}`}
                data-cursor="button"
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === rotationIndex
                    ? 'w-9 bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'w-2 bg-white/20 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Calibrated Container with Minimum Height so the layout never jumps between short & multiline titles */}
          <div className="min-h-[160px] sm:min-h-[190px] md:min-h-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRotation.id}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center w-full px-2"
              >
                {/* Micro Category Eyebrow */}
                <span className="font-mono text-[10px] sm:text-xs md:text-sm font-semibold text-cyan-400 uppercase tracking-[0.25em] mb-2 sm:mb-3 block">
                  [ {currentRotation.prefix} ]
                </span>

                {/* Calibrated Responsive Fluid Headline
                    - Guaranteed zero overflow on 320px mobile screens
                    - Maintains harmonious visual weight whether rendering 2 words or 4 words
                    - Dynamic text-wrap: balance & break-words */}
                <h1
                  className={`font-editorial ${currentRotation.fluidSize} ${currentRotation.lineHeight} font-black uppercase tracking-tight text-white max-w-4xl mx-auto break-words [text-wrap:balance] drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]`}
                >
                  {currentRotation.id === 'garv-shaw' && (
                    <>
                      GARV{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
                        SHAW
                      </span>
                      .
                    </>
                  )}
                  {currentRotation.id === 'building-systems' && (
                    <>
                      BUILDING{' '}
                      <span className="text-cyan-400">
                        INTELLIGENT
                      </span>{' '}
                      DIGITAL SYSTEMS.
                    </>
                  )}
                  {currentRotation.id === 'turning-ai' && (
                    <>
                      TURNING AI INTO{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-400">
                        INNOVATION
                      </span>
                      .
                    </>
                  )}
                </h1>

                {/* Subtitle badge */}
                <p className="font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-neutral-400 mt-3 sm:mt-4 max-w-xl mx-auto">
                  {currentRotation.subline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Supporting Bio Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-neutral-300 font-sans text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light px-2"
          >
            I architect intelligent systems and digital products at the intersection of{' '}
            <strong className="text-white font-medium">Artificial Intelligence</strong>,{' '}
            <strong className="text-white font-medium">Cloud Infrastructure</strong>,{' '}
            <strong className="text-white font-medium">Software Engineering</strong>, and{' '}
            <strong className="text-white font-medium">FinTech</strong>.
          </motion.p>
        </div>

        {/* The Center Interactive Identity Core */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full my-2"
        >
          <IdentityCore />
        </motion.div>
      </div>

      {/* Bottom Editorial Control & Action Bar */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExploreClick}
            data-cursor="button"
            data-cursor-label="WORK"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-cyan-300 text-black font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <span>EXPLORE WORK</span>
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onContactClick}
            data-cursor="button"
            data-cursor-label="CONTACT"
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs tracking-wider transition-all cursor-pointer"
          >
            START A CONVERSATION
          </button>
        </div>

        {/* Live System Metas */}
        <div className="flex items-center gap-5 text-neutral-400 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neutral-400" />
            <span>GARV_SHAW.SYSTEM</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-300">STATUS: 100% ONLINE</span>
          </div>
        </div>
      </div>
    </section>
  );
};
