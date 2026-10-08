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
    prefix: '01 // ARCHITECT',
    primary: 'GARV SHAW.',
    highlight: 'SHAW',
    subline: 'DIGITAL ARCHITECT & FULL-STACK SYSTEMS ENGINEER',
    fluidSize: 'text-[clamp(3.8rem,9.5vw,9.5rem)]',
    lineHeight: 'leading-[0.92]',
  },
  {
    id: 'building-systems',
    prefix: '02 // SYSTEMS',
    primary: 'INTELLIGENT SYSTEMS.',
    highlight: 'INTELLIGENT',
    subline: 'AUTONOMOUS REASONING, CLOUD RUNTIMES & DISTRIBUTED PLATFORMS',
    fluidSize: 'text-[clamp(3.2rem,8.2vw,7.8rem)]',
    lineHeight: 'leading-[0.96]',
  },
  {
    id: 'turning-ai',
    prefix: '03 // LAB EXPERIMENTS',
    primary: 'AI TO INNOVATION.',
    highlight: 'INNOVATION',
    subline: 'REASONING PIPELINES, HIGH-FREQUENCY QUANT & SCALED PRODUCTS',
    fluidSize: 'text-[clamp(3.4rem,8.6vw,8.4rem)]',
    lineHeight: 'leading-[0.94]',
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
      <div className="w-full max-w-7xl mx-auto my-auto py-6 sm:py-10 flex flex-col items-center opacity-100">
        {/* Dynamic Rotating Display Headline Box with Fixed Height Budget to prevent layout jumps */}
        <div className="text-center w-full mb-6 max-w-5xl mx-auto">
          {/* Subtle Editorial Sequence Counter (Zero-Pill Discipline) */}
          <div className="flex items-center justify-center gap-3 mb-5 font-mono text-[10px] tracking-widest text-[#626A73]">
            {HEADLINE_ROTATIONS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRotationIndex(i)}
                aria-label={`Jump to headline: ${item.primary}`}
                data-cursor="button"
                className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                  i === rotationIndex ? 'text-[#F2F3F5] font-semibold' : 'text-[#626A73] hover:text-[#A7ADB5]'
                }`}
              >
                <span>{`0${i + 1}`}</span>
                {i === rotationIndex && <span className="w-1 h-1 rounded-full bg-[#7EA7FF]" />}
              </button>
            ))}
          </div>

          {/* Calibrated Container with Minimum Height so the layout never jumps between short & multiline titles */}
          <div className="min-h-[170px] sm:min-h-[200px] md:min-h-[230px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRotation.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center w-full px-2"
              >
                {/* Micro Category Eyebrow */}
                <span className="font-mono text-[10px] sm:text-xs font-medium text-[#7EA7FF] uppercase tracking-[0.25em] mb-2 sm:mb-3 block">
                  {currentRotation.prefix}
                </span>

                {/* Oversized Sharp Editorial Headline */}
                <h1
                  className={`font-editorial ${currentRotation.fluidSize} ${currentRotation.lineHeight} font-bold tracking-tight text-[#F2F3F5] max-w-5xl mx-auto break-words [text-wrap:balance]`}
                >
                  {currentRotation.id === 'garv-shaw' && (
                    <>
                      GARV{' '}
                      <span className="text-[#A7ADB5]">
                        SHAW
                      </span>
                      .
                    </>
                  )}
                  {currentRotation.id === 'building-systems' && (
                    <>
                      INTELLIGENT{' '}
                      <span className="text-[#7EA7FF]">
                        SYSTEMS
                      </span>
                      .
                    </>
                  )}
                  {currentRotation.id === 'turning-ai' && (
                    <>
                      AI TO{' '}
                      <span className="text-[#FF9D38]">
                        INNOVATION
                      </span>
                      .
                    </>
                  )}
                </h1>

                {/* Subtitle datum */}
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#626A73] mt-3 sm:mt-4 max-w-xl mx-auto">
                  {currentRotation.subline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Supporting Editorial Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-[#A7ADB5] font-sans text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light px-2"
          >
            Architecting intelligent systems and digital products at the intersection of{' '}
            <strong className="text-[#F2F3F5] font-normal">Artificial Intelligence</strong>,{' '}
            <strong className="text-[#F2F3F5] font-normal">Cloud Infrastructure</strong>, and{' '}
            <strong className="text-[#F2F3F5] font-normal">Distributed Runtimes</strong>.
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExploreClick}
            data-cursor="button"
            data-cursor-label="WORK"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F2F3F5] hover:bg-white text-[#050608] font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-lg"
          >
            <span>EXPLORE WORK</span>
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onContactClick}
            data-cursor="button"
            data-cursor-label="CONTACT"
            className="px-5 py-2.5 rounded-lg bg-[#11151A] hover:bg-[#171C22] border border-white/[0.08] hover:border-white/20 text-[#A7ADB5] hover:text-[#F2F3F5] font-mono text-xs tracking-wider transition-all cursor-pointer"
          >
            START A CONVERSATION
          </button>
        </div>

        {/* Live System Metas */}
        <div className="flex items-center gap-5 text-[#626A73] font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#626A73]" />
            <span>GARV_SHAW.SYS</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#7EA7FF]" />
            <span className="text-[#A7ADB5]">100% OPERATIONAL</span>
          </div>
        </div>
      </div>
    </section>
  );
};
