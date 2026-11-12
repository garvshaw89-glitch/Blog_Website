import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroOverlayProps {
  scrollProgressRef: React.RefObject<number>;
  zoomProgressRef: React.RefObject<number>;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.3, 1];

// C2-continuous quintic smootherstep (zero velocity & acceleration at endpoints)
const smootherstep = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  scrollProgressRef,
  zoomProgressRef,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  const maskGroupRef = useRef<SVGGElement | null>(null);
  const strokeGroupRef = useRef<SVGGElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const backdropRectRef = useRef<SVGRectElement | null>(null);
  const tailMaskRef = useRef<SVGTSpanElement | null>(null);
  const tailStrokeRef = useRef<SVGTSpanElement | null>(null);

  // Sync SVG cutout mask & thick-bordered typography with cached glyph measurements
  // so 60-120fps scroll and T-zoom animations incur zero per-frame layout thrashing.
  useEffect(() => {
    let rafId = 0;
    let isDisposed = false;

    const metrics = {
      vw: window.innerWidth,
      vh: window.innerHeight,
      totalWidth: window.innerWidth * 2.5,
      pLeft: 0,
      portfolioCenterX: window.innerWidth * 0.6,
      tCenterX: window.innerWidth * 0.24,
    };

    const measureTypography = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      metrics.vw = vw;
      metrics.vh = vh;

      const textEl = strokeTextRef.current;
      if (!textEl) return;

      const totalWidth = textEl.getComputedTextLength();
      if (totalWidth > 0) {
        metrics.totalWidth = totalWidth;
      }

      try {
        const pRect = textEl.getExtentOfChar(0);
        const tRect = textEl.getExtentOfChar(3); // 'T' in PORTFOLIO
        const oRect = textEl.getExtentOfChar(8); // final 'O' in PORTFOLIO
        metrics.pLeft = pRect.x;
        metrics.portfolioCenterX = pRect.x + (oRect.x + oRect.width - pRect.x) * 0.5;
        metrics.tCenterX = tRect.x + tRect.width * 0.5;
      } catch {
        // Fallback proportions if glyphs are not yet measurable
        metrics.portfolioCenterX = metrics.totalWidth * 0.24;
        metrics.tCenterX = metrics.totalWidth * 0.095;
      }
    };

    measureTypography();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!isDisposed) measureTypography();
      });
    }

    const handleResize = () => measureTypography();
    window.addEventListener('resize', handleResize, { passive: true });

    let prevShowTail: boolean | null = null;
    let wasZooming = false;

    const updateFrame = () => {
      if (isDisposed) return;

      const p = scrollProgressRef.current;
      const z = zoomProgressRef.current;
      const { vw, vh, totalWidth, pLeft, portfolioCenterX, tCenterX } = metrics;
      const tCenterY = vh * 0.5;

      const showTail = p <= 0.56 && z === 0;
      if (showTail !== prevShowTail) {
        prevShowTail = showTail;
        const tailOpacity = showTail ? '1' : '0';
        const tailVisibility = showTail ? 'visible' : 'hidden';

        if (tailMaskRef.current) {
          tailMaskRef.current.style.opacity = tailOpacity;
          tailMaskRef.current.style.visibility = tailVisibility;
        }
        if (tailStrokeRef.current) {
          tailStrokeRef.current.style.opacity = tailOpacity;
          tailStrokeRef.current.style.visibility = tailVisibility;
        }
      }

      let transformAttr: string;

      if (z > 0) {
        // Disable SVG drop-shadow filter during zoom so scaling up to 68x stays GPU-smooth
        if (!wasZooming && strokeTextRef.current) {
          wasZooming = true;
          strokeTextRef.current.style.filter = 'none';
        }

        // Smooth C2 quintic focus onto the 'T' stem + silky exponential fly-through zoom
        const focusEase = smootherstep(z / 0.45);
        const pivotX = portfolioCenterX + (tCenterX - portfolioCenterX) * focusEase;
        const zoomEase = smootherstep(z);
        const zoomScale = Math.pow(68, zoomEase);

        transformAttr = `translate(${(vw * 0.5).toFixed(2)}, ${tCenterY.toFixed(2)}) scale(${zoomScale.toFixed(4)}) translate(${(-pivotX).toFixed(2)}, ${(-tCenterY).toFixed(2)})`;

        if (strokeTextRef.current) {
          const strokeFade = 1 - smootherstep((z - 0.42) / 0.44);
          strokeTextRef.current.style.opacity = strokeFade.toFixed(3);
        }

        if (backdropRectRef.current) {
          const backdropFade = 1 - smootherstep((z - 0.78) / 0.22);
          backdropRectRef.current.style.opacity = backdropFade.toFixed(3);
        }
      } else {
        if (wasZooming && strokeTextRef.current) {
          wasZooming = false;
          strokeTextRef.current.style.filter = 'drop-shadow(0 0 18px rgba(56, 189, 248, 0.18))';
        }

        if (backdropRectRef.current) {
          backdropRectRef.current.style.opacity = '1';
        }
        if (strokeTextRef.current) {
          strokeTextRef.current.style.opacity = '1';
        }

        if (p <= 0.56) {
          // Phase 1: Slow right-to-left slide of "PORTFOLIO  BY  GARV SHAW"
          const t1 = Math.min(Math.max(p / 0.56, 0), 1);
          const startX1 = vw * 0.82;
          const endX1 = -(totalWidth + vw * 0.08);
          const tx = startX1 + (endX1 - startX1) * t1;
          transformAttr = `translate(${tx.toFixed(2)}, 0)`;
        } else {
          // Phase 2: "PORTFOLIO" glides smoothly into the middle of the screen
          const easeCenter = smootherstep((p - 0.56) / 0.2);
          const startX2 = vw * 1.05 - pLeft;
          const centerTx = vw * 0.5 - portfolioCenterX;
          const tx = startX2 + (centerTx - startX2) * easeCenter;
          transformAttr = `translate(${tx.toFixed(2)}, 0)`;
        }
      }

      if (maskGroupRef.current) {
        maskGroupRef.current.setAttribute('transform', transformAttr);
      }
      if (strokeGroupRef.current) {
        strokeGroupRef.current.setAttribute('transform', transformAttr);
      }

      rafId = requestAnimationFrame(updateFrame);
    };

    rafId = requestAnimationFrame(updateFrame);
    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollProgressRef, zoomProgressRef]);

  const renderSequenceTspans = (
    isStrokeLayer: boolean,
    tailRef: React.RefObject<SVGTSpanElement | null>
  ) => (
    <>
      <tspan
        fill={isStrokeLayer ? 'transparent' : 'black'}
        style={{ fontSize: 'clamp(50px, 19vw, 17.5rem)' }}
      >
        PORTFOLIO
      </tspan>
      <tspan ref={tailRef}>
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
        style={{ willChange: 'transform, opacity' }}
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
                {renderSequenceTspans(false, tailMaskRef)}
              </text>
            </g>
          </mask>
        </defs>

        <rect
          ref={backdropRectRef}
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
        style={{ willChange: 'transform, opacity' }}
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
            {renderSequenceTspans(true, tailStrokeRef)}
          </text>
        </g>
      </svg>

      {/* UI Layer (z-10): Audio toggle only */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: isTransitioning ? 0 : 1, y: 0 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
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
    </>
  );
};
