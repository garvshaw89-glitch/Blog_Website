import React, { useRef, useState } from 'react';
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
  const prefersReducedMotion = useReducedMotion();
  const [isAboveGalaxy, setIsAboveGalaxy] = useState<boolean>(
    () => Boolean(prefersReducedMotion)
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.98', 'start 0.22'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 24,
    mass: 0.72,
  });

  // Start physically UNDER the rotating Milky Way (z-[1] < MilkyWayGalaxy z-[2]),
  // then cross cleanly through the galaxy core into the foreground (z-10) mid-emergence.
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    if (prefersReducedMotion) {
      if (!isAboveGalaxy) setIsAboveGalaxy(true);
      return;
    }
    const shouldCross = latest >= 0.42;
    if (shouldCross !== isAboveGalaxy) {
      setIsAboveGalaxy(shouldCross);
    }
  });

  // Pure GPU-composited transforms (no expensive per-frame CSS blur filter over WebGL)
  const portalScale = useTransform(smoothProgress, [0, 0.42, 1], [0.24, 0.7, 1]);
  const portalRotateZ = useTransform(smoothProgress, [0, 0.55, 1], [-14, -4, 0]);
  const portalRotateX = useTransform(smoothProgress, [0, 0.55, 1], [22, 6, 0]);
  const portalY = useTransform(smoothProgress, [0, 1], [115, 0]);
  const portalOpacity = useTransform(
    smoothProgress,
    [0, 0.14, 0.42, 0.78, 1],
    [0.06, 0.52, 0.84, 0.97, 1]
  );

  // Subtle Milky Way galactic emergence halo peaking as section pierces through the galaxy
  const coreGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.4, 0.75, 1],
    [0.12, 0.75, 0.25, 0]
  );
  const coreGlowScale = useTransform(smoothProgress, [0, 0.45, 1], [0.42, 1.12, 1.32]);

  return (
    <div
      ref={sectionRef}
      data-scroll-anchor="true"
      className={`relative w-full bg-transparent overflow-x-clip ${
        isAboveGalaxy || prefersReducedMotion ? 'z-10' : 'z-[1]'
      }`}
      style={{ perspective: '1400px' }}
    >
      {/* Cosmic Galactic Core Emergence Glow while piercing through the Milky Way */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: coreGlowOpacity, scale: coreGlowScale }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        >
          <div
            className="w-[540px] sm:w-[740px] h-[540px] sm:h-[740px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 226, 178, 0.22) 0%, rgba(125, 211, 252, 0.15) 30%, rgba(56, 189, 248, 0.05) 58%, transparent 76%)',
            }}
          />
        </motion.div>
      )}

      <motion.div
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
                transformStyle: 'preserve-3d',
                transformOrigin: '50% 42%',
                willChange: 'transform, opacity',
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
};
