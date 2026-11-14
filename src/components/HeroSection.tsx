import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdentityCore } from './ui/IdentityCore';
import { GlitchHeading } from './ui/GlitchHeading';
import { ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onContactClick?: () => void;
  onExploreClick?: () => void;
  entered?: boolean;
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
    fluidSize: 'text-[clamp(2.5rem,9vw,9.5rem)]',
    lineHeight: 'leading-[0.92]',
  },
  {
    id: 'building-systems',
    prefix: '02 // SYSTEMS',
    primary: 'INTELLIGENT SYSTEMS.',
    highlight: 'INTELLIGENT',
    subline: 'AUTONOMOUS REASONING, CLOUD RUNTIMES & DISTRIBUTED PLATFORMS',
    fluidSize: 'text-[clamp(2.15rem,7.8vw,7.8rem)]',
    lineHeight: 'leading-[0.96]',
  },
  {
    id: 'turning-ai',
    prefix: '03 // LAB EXPERIMENTS',
    primary: 'AI TO INNOVATION.',
    highlight: 'INNOVATION',
    subline: 'REASONING PIPELINES, HIGH-FREQUENCY QUANT & SCALED PRODUCTS',
    fluidSize: 'text-[clamp(2.35rem,8.4vw,8.4rem)]',
    lineHeight: 'leading-[0.94]',
  },
];

type PopupPhase = 'hidden' | 'visible' | 'dissolving';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  entered = false,
  id = 'hero-section',
}) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [popupPhase, setPopupPhase] = useState<PopupPhase>('hidden');

  useEffect(() => {
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % HEADLINE_ROTATIONS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Timed left-side "Explore Work" popup:
  // Appears 5s after entering main page -> stays visible 3s -> slides toward Milky Way and dissolves
  useEffect(() => {
    if (!entered) {
      setPopupPhase('hidden');
      return;
    }

    setPopupPhase('hidden');

    const showTimer = window.setTimeout(() => {
      setPopupPhase('visible');
    }, 5000);

    const dissolveTimer = window.setTimeout(() => {
      setPopupPhase('dissolving');
    }, 8000);

    const clearTimer = window.setTimeout(() => {
      setPopupPhase('hidden');
    }, 9500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(clearTimer);
    };
  }, [entered]);

  const currentRotation = HEADLINE_ROTATIONS[rotationIndex];

  const handlePopupExplore = () => {
    setPopupPhase('dissolving');
    const el = document.getElementById('hero-identity-reveal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <section
      id={id}
      data-cursor-theme="default"
      className="relative w-full select-none overflow-hidden"
    >
      {/* PART 1: Pure Unobstructed Full-Viewport Milky Way Canvas (100dvh) */}
      <div className="relative w-full min-h-screen min-h-[100dvh] pointer-events-none">
        {/* Left-Side Timed "Explore Work" Popup (5s delay -> 3s visible -> slides into Milky Way & dissolves) */}
        {popupPhase !== 'hidden' && (
          <motion.div
            initial={{ opacity: 0, x: -110, y: 0, scale: 0.96, filter: 'blur(0px)' }}
            animate={
              popupPhase === 'visible'
                ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
                : { opacity: 0, x: '38vw', y: '-28vh', scale: 0.45, filter: 'blur(12px)' }
            }
            transition={
              popupPhase === 'visible'
                ? { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
                : { duration: 1.45, ease: [0.32, 0, 0.2, 1] }
            }
            className={`fixed left-5 sm:left-8 md:left-12 bottom-10 sm:bottom-14 z-30 ${
              popupPhase === 'visible' ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={handlePopupExplore}
              data-cursor="button"
              data-cursor-label="WORK"
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-[#07090e]/88 border border-cyan-300/25 hover:border-cyan-300/55 shadow-[0_12px_36px_rgba(6,182,212,0.16)] text-[#F2F3F5] font-mono text-xs uppercase tracking-[0.22em] transition-colors cursor-pointer"
            >
              <span>Explore Work</span>
              <motion.span
                animate={{ y: [0, 3.5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center"
              >
                <ArrowDown className="w-3.5 h-3.5 text-cyan-300" />
              </motion.span>
            </button>
          </motion.div>
        )}
      </div>

      {/* PART 2: Downside Editorial Identity Showcase (Appears on Scroll Down) */}
      <motion.div
        id="hero-identity-reveal"
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-h-[90vh] flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6 md:px-12"
      >
        <div className="w-full max-w-7xl mx-auto my-auto flex flex-col items-center">
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
                  {i === rotationIndex && <span className="w-1 h-1 rounded-full bg-[#FF9D38]" />}
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
                  {/* Micro Category Eyebrow with Editorial Dashes */}
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                    <span className="w-6 sm:w-10 h-[1px] bg-white/20" />
                    <span className="font-mono text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-[#A7ADB5]">
                      {currentRotation.id === 'turning-ai' ? (
                        <>
                          <span className="text-[#FF9D38] font-semibold">03</span> // LAB EXPERIMENTS
                        </>
                      ) : (
                        currentRotation.prefix
                      )}
                    </span>
                    <span className="w-6 sm:w-10 h-[1px] bg-white/20" />
                  </div>

                  {/* Oversized Sharp Editorial Headline */}
                  <GlitchHeading
                    as="h1"
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
                  </GlitchHeading>

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
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
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
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full my-2"
          >
            <IdentityCore />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
