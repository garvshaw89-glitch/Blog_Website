import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'motion/react';

interface ScrollSlideSectionProps {
  children: React.ReactNode;
}

export const ScrollSlideSection: React.FC<ScrollSlideSectionProps> = ({
  children,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const onChange = () => setIsCompactViewport(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isAboveRef = useRef<boolean>(Boolean(prefersReducedMotion));
  const isAnimatingRef = useRef<boolean>(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.98', 'start 0.24'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 185,
    damping: 28,
    mass: 0.36,
    restDelta: 0.002,
  });

  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const outer = sectionRef.current;
    const inner = innerRef.current;
    if (!outer) return;

    if (prefersReducedMotion) {
      if (!isAboveRef.current) {
        isAboveRef.current = true;
        outer.style.zIndex = '10';
      }
      return;
    }

    const shouldCross = latest >= 0.32;
    if (shouldCross !== isAboveRef.current) {
      isAboveRef.current = shouldCross;
      outer.style.zIndex = shouldCross ? '10' : '1';
    }

    if (inner) {
      const active = latest > 0.004 && latest < 0.996;
      if (active !== isAnimatingRef.current) {
        isAnimatingRef.current = active;
        inner.style.willChange = active ? 'transform, opacity' : 'auto';
      }
    }
  });

  // Unified across mobile, tablet, and desktop: lean 2D GPU-composited cosmic emergence (zero perspective/rotateX rasterization stalls)
  const portalScale = useTransform(
    smoothProgress,
    [0, 0.45, 1],
    isCompactViewport ? [0.90, 0.97, 1] : [0.86, 0.96, 1]
  );
  const portalRotateZ = useTransform(
    smoothProgress,
    [0, 0.55, 1],
    isCompactViewport ? [-2, -0.6, 0] : [-3.2, -1, 0]
  );
  const portalY = useTransform(
    smoothProgress,
    [0, 1],
    isCompactViewport ? [36, 0] : [52, 0]
  );
  const portalOpacity = useTransform(
    smoothProgress,
    [0, 0.16, 0.45, 0.82, 1],
    [0.12, 0.62, 0.9, 0.99, 1]
  );

  const coreGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.4, 0.75, 1],
    [0.08, 0.55, 0.18, 0]
  );
  const coreGlowScale = useTransform(smoothProgress, [0, 0.45, 1], [0.55, 1.06, 1.2]);

  return (
    <div
      ref={sectionRef}
      data-scroll-anchor="true"
      className="relative w-full bg-transparent overflow-x-clip"
      style={{
        zIndex: prefersReducedMotion ? 10 : 1,
      }}
    >
      {/* Cosmic Galactic Core Emergence Glow while piercing through the Milky Way (all viewports) */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: coreGlowOpacity, scale: coreGlowScale }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        >
          <div
            className="w-[78vw] max-w-[620px] aspect-square rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 226, 178, 0.20) 0%, rgba(125, 211, 252, 0.13) 32%, rgba(56, 189, 248, 0.04) 58%, transparent 74%)',
            }}
          />
        </motion.div>
      )}

      <motion.div
        ref={innerRef}
        className="relative z-10 w-full"
        style={
          prefersReducedMotion
            ? undefined
            : {
                scale: portalScale,
                rotateZ: portalRotateZ,
                y: portalY,
                opacity: portalOpacity,
                transformOrigin: '50% 42%',
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
};
