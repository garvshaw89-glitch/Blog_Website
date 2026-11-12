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
  const strokeTextRef = useRef<SVGTextElement | null>(null);

  // Sync SVG cutout mask & thick-bordered "PORTFOLIO  BY  GARV SHAW" to scrollProgressRef
  useEffect(() => {
    let rafId = 0;

    const updateFromScroll = () => {
      const p = scrollProgressRef.current;
      const vw = window.innerWidth;
      const measuredWidth = strokeTextRef.current?.getComputedTextLength() || vw * 2.5;

      // Sweep slowly across p = [0 .. 0.82] from right edge to completely past left edge
      const sweep = Math.min(Math.max(p / 0.82, 0), 1);
      const startX = vw * 0.82;
      const endX = -(measuredWidth + vw * 0.1);
      const txPx = startX + (endX - startX) * sweep;
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

  const renderSequenceTspans = (isStrokeLayer: boolean) => (
    <>
      <tspan
        fill={isStrokeLayer ? 'transparent' : 'black'}
        style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
      >
        PORTFOLIO
      </tspan>
      <tspan
        fill={isStrokeLayer ? 'transparent' : 'white'}
        stroke={isStrokeLayer ? 'none' : undefined}
        style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
      >
        {'\u00A0\u00A0'}
      </tspan>
      <tspan
        className={isStrokeLayer ? 'intro-by-multicolor' : undefined}
        fill={isStrokeLayer ? undefined : 'white'}
        stroke={isStrokeLayer ? 'none' : undefined}
        strokeWidth={isStrokeLayer ? 0 : undefined}
        style={{ fontSize: 'clamp(15px, 5.7vw, 5.25rem)' }}
      >
        BY
      </tspan>
      <tspan
        fill={isStrokeLayer ? 'transparent' : 'white'}
        stroke={isStrokeLayer ? 'none' : undefined}
        style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
      >
        {'\u00A0\u00A0'}
      </tspan>
      <tspan
        fill={isStrokeLayer ? 'transparent' : 'black'}
        style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
      >
        GARV SHAW
      </tspan>
    </>
  );

  return (
    <>
      {/*
        SVG KNOCKOUT BACKDROP (z-[1]):
        - Everywhere outside PORTFOLIO and GARV SHAW is dark obsidian (#050505 / #09101c radial)
        - Inside PORTFOLIO and GARV SHAW (fill="black" in mask), it cuts out a true
          transparent window revealing the live main website underneath!
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
                x="0"
                y="50%"
                dy="0.35em"
                textAnchor="start"
                dominantBaseline="alphabetic"
                fill="black"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="700"
                letterSpacing="-0.03em"
                style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
              >
                {renderSequenceTspans(false)}
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

      {/* Thick-bordered transparent PORTFOLIO & GARV SHAW + solid multicolour BY (z-[5]) */}
      <svg
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
        preserveAspectRatio="none"
      >
        <g ref={strokeGroupRef} transform="translate(1200, 0)">
          <text
            ref={strokeTextRef}
            x="0"
            y="50%"
            dy="0.35em"
            textAnchor="start"
            dominantBaseline="alphabetic"
            fill="transparent"
            stroke="rgba(226, 232, 240, 0.88)"
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="700"
            letterSpacing="-0.03em"
            style={{
              fontSize: 'clamp(50px, 19vw, 17.5rem)',
              filter: 'drop-shadow(0 0 18px rgba(56, 189, 248, 0.18))',
            }}
          >
            {renderSequenceTspans(true)}
          </text>
        </g>
      </svg>

      {/* UI Layer (z-10): Audio toggle only */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: isTransitioning ? 0 : 1, y: 0 }}
          transition={{ duration: 0.6, ease: LUXURY_EASE }}
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
      </div>

      {/* Phase 1 of Entry Effect: Slowly dim the light */}
      {isTransitioning && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.75, ease: [0.32, 0, 0.45, 1] }}
          className="fixed inset-0 z-30 pointer-events-none bg-[#030407]"
        />
      )}
    </>
  );
};
