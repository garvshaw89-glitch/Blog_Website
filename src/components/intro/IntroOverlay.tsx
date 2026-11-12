import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroOverlayProps {
  scrollProgressRef: React.RefObject<number>;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.3, 1];

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  scrollProgressRef,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  const maskGroupRef = useRef<SVGGElement | null>(null);
  const strokeGroupRef = useRef<SVGGElement | null>(null);

  // Sync SVG cutout mask & thick-bordered PORTFOLIO outline to scrollProgressRef at native display FPS
  useEffect(() => {
    let rafId = 0;

    const updateFromScroll = () => {
      const p = scrollProgressRef.current;
      const vw = window.innerWidth;

      // Sweep slowly across p = [0 .. 0.80] from right edge (+86vw) to off left edge (-104vw)
      const sweep = Math.min(Math.max(p / 0.8, 0), 1);
      const translateXVw = 86 - sweep * 190;
      const txPx = (translateXVw / 100) * vw;
      const transformAttr = `translate(${txPx.toFixed(2)}, 0)`;

      if (maskGroupRef.current) {
        maskGroupRef.current.setAttribute('transform', transformAttr);
      }
      if (strokeGroupRef.current) {
        strokeGroupRef.current.setAttribute('transform', transformAttr);
      }

      rafId = requestAnimationFrame(updateFromScroll);
    };

    rafId = requestAnimationFrame(updateFromScroll);
    return () => cancelAnimationFrame(rafId);
  }, [scrollProgressRef]);

  return (
    <>
      {/*
        SVG KNOCKOUT BACKDROP (z-[1]):
        - Everywhere outside PORTFOLIO is dark obsidian (#050505 / #09101c radial)
        - Inside the giant PORTFOLIO letters (fill="black" in mask), it cuts out a true
          transparent portal revealing the live main website underneath!
      */}
      <svg
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="portfolio-void-bg" cx="50%" cy="50%" r="72%">
            <stop offset="0%" stopColor="#09101c" />
            <stop offset="85%" stopColor="#050505" />
          </radialGradient>

          <mask id="portfolio-knockout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <g ref={maskGroupRef} transform="translate(1200, 0)">
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="black"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="700"
                letterSpacing="-0.03em"
                style={{ fontSize: 'clamp(54px, 19vw, 17.5rem)' }}
              >
                PORTFOLIO
              </text>
            </g>
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#portfolio-void-bg)"
          mask="url(#portfolio-knockout-mask)"
        />
      </svg>

      {/* Thick-bordered transparent PORTFOLIO framing the live website cutout (z-[5]) */}
      <svg
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
        preserveAspectRatio="none"
      >
        <g ref={strokeGroupRef} transform="translate(1200, 0)">
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill="transparent"
            stroke="rgba(226, 232, 240, 0.88)"
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="700"
            letterSpacing="-0.03em"
            style={{
              fontSize: 'clamp(54px, 19vw, 17.5rem)',
              filter: 'drop-shadow(0 0 18px rgba(56, 189, 248, 0.18))',
            }}
          >
            PORTFOLIO
          </text>
        </g>
      </svg>

      {/* UI Layer (z-10): Audio toggle only — no skip, no arrow, no loading bar */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: LUXURY_EASE }}
          className="w-full flex items-center justify-end z-20 pointer-events-auto"
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
        </motion.div>

        {/* Futuristic Portal Entry Effect */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: LUXURY_EASE }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-[#03050a]/80"
          >
            {/* Radial cyan-obsidian energy bloom */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.25 }}
              animate={{ scale: 2.3, opacity: [0.4, 0.95, 0.6] }}
              transition={{ duration: 1.15, ease: LUXURY_EASE }}
              style={{
                willChange: 'transform, opacity',
                background:
                  'radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.55) 0%, rgba(56, 189, 248, 0.22) 28%, rgba(5, 8, 16, 0.92) 68%, #050505 100%)',
              }}
              className="absolute inset-0"
            />

            {/* Futuristic expanding concentric portal rings */}
            <motion.div
              initial={{ scale: 0.12, opacity: 0.95, rotate: 0 }}
              animate={{ scale: 3.8, opacity: 0, rotate: 54 }}
              transition={{ duration: 1.1, ease: LUXURY_EASE }}
              style={{ willChange: 'transform, opacity' }}
              className="w-64 h-64 rounded-full border border-cyan-300/75 shadow-[0_0_45px_rgba(56,189,248,0.45)]"
            />
            <motion.div
              initial={{ scale: 0.06, opacity: 0.9, rotate: 0 }}
              animate={{ scale: 2.9, opacity: 0, rotate: -65 }}
              transition={{ duration: 1.05, delay: 0.08, ease: LUXURY_EASE }}
              style={{ willChange: 'transform, opacity' }}
              className="absolute w-48 h-48 rounded-full border border-dashed border-sky-200/65"
            />

            {/* Horizontal plasma horizon sweep */}
            <motion.div
              initial={{ scaleX: 0.05, opacity: 0 }}
              animate={{ scaleX: 1.4, opacity: [0, 1, 0.2] }}
              transition={{ duration: 1.05, ease: LUXURY_EASE }}
              style={{ willChange: 'transform, opacity' }}
              className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_rgba(56,189,248,0.85)]"
            />
          </motion.div>
        )}
      </div>
    </>
  );
};
