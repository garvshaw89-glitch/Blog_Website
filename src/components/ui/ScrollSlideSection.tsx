import React, { useRef } from 'react';
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
  const isAboveRef = useRef<boolean>(Boolean(prefersReducedMotion));
  const isAnimatingRef = useRef<boolean>(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.98', 'start 0.22'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 155,
    damping: 28,
    mass: 0.52,
    restDelta: 0.001,
  });

  // Zero-rerender DOM elevation: start physically UNDER MilkyWayGalaxy (z=1 < z=2),
  // then cross smoothly into the foreground (z=10) without triggering React re-renders.
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

    const shouldCross = latest >= 0.42;
    if (shouldCross !== isAboveRef.current) {
      isAboveRef.current = shouldCross;
      outer.style.zIndex = shouldCross ? '10' : '1';
    }

    // Only promote GPU compositor layer while section is actively emerging
    if (inner) {
      const active = latest > 0.004 && latest < 0.996;
      if (active !== isAnimatingRef.current) {
        isAnimatingRef.current = active;
        inner.style.willChange = active ? 'transform, opacity' : 'auto';
      }
    }
  });

  // Pure GPU-composited transforms (no expensive per-frame CSS blur filter or preserve-3d thrash)
  const portalScale = useTransform(smoothProgress, [0, 0.42, 1], [0.28, 0.74, 1]);
  const portalRotateZ = useTransform(smoothProgress, [0, 0.55, 1], [-12, -3.5, 0]);
  const portalRotateX = useTransform(smoothProgress, [0, 0.55, 1], [18, 5, 0]);
  const portalY = useTransform(smoothProgress, [0, 1], [96, 0]);
  const portalOpacity = useTransform(
    smoothProgress,
    [0, 0.14, 0.42, 0.78, 1],
    [0.06, 0.54, 0.85, 0.97, 1]
  );

  // Subtle Milky Way galactic emergence halo peaking as section pierces through the galaxy
  const coreGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.4, 0.75, 1],
    [0.08, 0.65, 0.2, 0]
  );
  const coreGlowScale = useTransform(smoothProgress, [0, 0.45, 1], [0.46, 1.08, 1.24]);

  return (
    <div
      ref={sectionRef}
      data-scroll-anchor="true"
      className="relative w-full bg-transparent overflow-x-clip"
      style={{
        zIndex: prefersReducedMotion ? 10 : 1,
        perspective: '1400px',
      }}
    >
      {/* Cosmic Galactic Core Emergence Glow while piercing through the Milky Way */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: coreGlowOpacity, scale: coreGlowScale }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        >
          <div
            className="w-[460px] sm:w-[640px] h-[460px] sm:h-[640px] rounded-full"
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
                rotateX: portalRotateX,
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
