import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();

  // Smooth out scroll progression with high-frequency spring physics
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <aside
      aria-label="Reading and scroll progress indicator"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] pointer-events-none select-none bg-cyan-950/25 backdrop-blur-[1px]"
    >
      <motion.div
        style={{ scaleX, transformOrigin: '0%' }}
        className="relative w-full h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.85),0_0_24px_rgba(6,182,212,0.45)]"
      >
        {/* Animated leading edge glint */}
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent via-cyan-100 to-white/95 blur-[0.5px]" />
        {/* High-intensity focal laser particle */}
        <div className="absolute -top-[1.5px] -bottom-[1.5px] right-0 w-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_16px_#06b6d4,0_0_24px_#22d3ee]" />
      </motion.div>
    </aside>
  );
};
