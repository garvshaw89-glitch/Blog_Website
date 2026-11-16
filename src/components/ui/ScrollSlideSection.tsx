import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';

interface ScrollSlideSectionProps {
  children: React.ReactNode;
}

export const ScrollSlideSection: React.FC<ScrollSlideSectionProps> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.96', 'start 0.28'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 112,
    damping: 24,
    mass: 0.85,
  });

  // Scroll-triggered lateral slide + scale emergence without any box chrome
  const slideX = useTransform(smoothProgress, [0, 0.55, 1], [96, 22, 0]);
  const slideScale = useTransform(smoothProgress, [0, 0.6, 1], [0.94, 0.985, 1]);
  const slideRotateY = useTransform(smoothProgress, [0, 0.65, 1], [-4.5, -1.2, 0]);
  const slideOpacity = useTransform(
    smoothProgress,
    [0, 0.22, 0.7, 1],
    [0.14, 0.68, 0.94, 1]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-clip"
      style={{ perspective: '1500px' }}
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: slideX,
                scale: slideScale,
                rotateY: slideRotateY,
                opacity: slideOpacity,
                transformStyle: 'preserve-3d',
                transformOrigin: '80% 30%',
                willChange: 'transform, opacity',
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
};
