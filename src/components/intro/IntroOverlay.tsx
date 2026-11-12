import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Volume2, VolumeX, X } from 'lucide-react';
import { Magnet } from '../Magnet';

interface IntroOverlayProps {
  scrollProgressRef: React.RefObject<number>;
  onEnter: () => void;
  onSkip: () => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.3, 1];

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  scrollProgressRef,
  onEnter,
  onSkip,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  const portfolioTextRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Direct DOM transform & opacity updates synced to scrollProgressRef at native display refresh rate (zero React re-renders)
  useEffect(() => {
    let rafId = 0;

    const updateFromScroll = () => {
      const p = scrollProgressRef.current;

      if (portfolioTextRef.current) {
        // Right-to-left horizontal sweep across p = [0 .. 0.78]
        const sweep = Math.min(Math.max(p / 0.78, 0), 1);
        // Smoothly sweep from +72vw (right edge) through center to -110vw (off left edge)
        const translateX = 72 - sweep * 182;
        // Transparent outlined font subtly reveals as scrolling begins
        const fadeIn = Math.min(Math.max(p / 0.06, 0.25), 1);
        const fadeOut = p > 0.65 ? Math.max(0, 1 - (p - 0.65) / 0.16) : 1;
        const opacity = fadeIn * fadeOut;

        portfolioTextRef.current.style.transform = `translate3d(${translateX.toFixed(3)}vw, 0, 0)`;
        portfolioTextRef.current.style.opacity = opacity.toFixed(3);
      }

      if (progressBarRef.current) {
        const barScale = Math.min(Math.max(p / 0.78, 0.04), 1);
        progressBarRef.current.style.transform = `scaleX(${barScale.toFixed(4)})`;
      }

      rafId = requestAnimationFrame(updateFromScroll);
    };

    rafId = requestAnimationFrame(updateFromScroll);
    return () => cancelAnimationFrame(rafId);
  }, [scrollProgressRef]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
      {/* Top-right icon-only audio & skip controls */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: LUXURY_EASE }}
        className="w-full flex items-center justify-end gap-2.5 z-20 pointer-events-auto"
      >
        <button
          type="button"
          onClick={onToggleAudio}
          tabIndex={0}
          aria-label={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/12 hover:border-white/25 bg-[#0a0d14]/90 text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          {isAudioOn ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onSkip}
          tabIndex={0}
          aria-label="Skip entrance"
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/12 hover:border-white/25 bg-[#0a0d14]/90 text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Center Stage: Oversized transparent PORTFOLIO moving from right to left on scroll */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10">
        <div
          ref={portfolioTextRef}
          style={{
            transform: 'translate3d(62vw, 0, 0)',
            opacity: 0.18,
            willChange: 'transform, opacity',
            fontSize: 'clamp(50px, 19vw, 18rem)',
            color: 'rgba(255, 255, 255, 0.03)',
            WebkitTextStroke: '1.5px rgba(226, 232, 240, 0.36)',
            textShadow: '0 0 60px rgba(56, 189, 248, 0.12)',
          }}
          className="font-['Space_Grotesk',sans-serif] font-bold tracking-[-0.04em] leading-none whitespace-nowrap select-none"
        >
          PORTFOLIO
        </div>
      </div>

      {/* Bottom-center minimal scroll progress rail & optional icon trigger */}
      <div className="w-full flex flex-col items-center justify-center gap-4 pb-5 sm:pb-8 z-20">
        <div className="pointer-events-auto">
          <Magnet padding={80} strength={2.4}>
            <button
              type="button"
              onClick={onEnter}
              tabIndex={0}
              aria-label="Enter portfolio"
              className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-b from-[#161b24] to-[#090c12] border border-white/20 hover:border-cyan-400/60 shadow-[0_10px_35px_rgba(0,0,0,0.85)] hover:shadow-[0_0_32px_rgba(56,189,248,0.28)] transition-[border-color,box-shadow,transform] duration-200 cursor-pointer overflow-hidden active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </Magnet>
        </div>

        {/* Minimal geometric scroll rail */}
        <div className="w-32 sm:w-44 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            style={{
              transform: 'scaleX(0.04)',
              transformOrigin: 'left center',
              willChange: 'transform',
            }}
            className="w-full h-full bg-gradient-to-r from-cyan-400/70 via-sky-200 to-cyan-300"
          />
        </div>
      </div>

      {/* Futuristic Portal Entry Effect */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.85, ease: LUXURY_EASE }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-[#03050a]/85"
        >
          {/* Radial energy bloom */}
          <motion.div
            initial={{ scale: 0.25, opacity: 0.2 }}
            animate={{ scale: 2.2, opacity: [0.35, 0.95, 0.7] }}
            transition={{ duration: 1.0, ease: LUXURY_EASE }}
            style={{
              willChange: 'transform, opacity',
              background:
                'radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.52) 0%, rgba(56, 189, 248, 0.22) 28%, rgba(5, 8, 16, 0.94) 68%, #050505 100%)',
            }}
            className="absolute inset-0"
          />

          {/* Futuristic concentric expanding rings */}
          <motion.div
            initial={{ scale: 0.15, opacity: 0.9, rotate: 0 }}
            animate={{ scale: 3.4, opacity: 0, rotate: 48 }}
            transition={{ duration: 0.95, ease: LUXURY_EASE }}
            style={{ willChange: 'transform, opacity' }}
            className="w-64 h-64 rounded-full border border-cyan-300/70 shadow-[0_0_45px_rgba(56,189,248,0.45)]"
          />
          <motion.div
            initial={{ scale: 0.08, opacity: 0.85, rotate: 0 }}
            animate={{ scale: 2.6, opacity: 0, rotate: -60 }}
            transition={{ duration: 0.9, delay: 0.08, ease: LUXURY_EASE }}
            style={{ willChange: 'transform, opacity' }}
            className="absolute w-48 h-48 rounded-full border border-dashed border-sky-200/60"
          />

          {/* Horizontal plasma horizon sweep */}
          <motion.div
            initial={{ scaleX: 0.05, opacity: 0 }}
            animate={{ scaleX: 1.35, opacity: [0, 1, 0.25] }}
            transition={{ duration: 0.9, ease: LUXURY_EASE }}
            style={{ willChange: 'transform, opacity' }}
            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_rgba(56,189,248,0.8)]"
          />
        </motion.div>
      )}
    </div>
  );
};
