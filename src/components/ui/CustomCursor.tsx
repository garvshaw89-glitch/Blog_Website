import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'project' | 'external' | 'drag'>('default');
  const [cursorText, setCursorText] = useState('');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 450, mass: 0.4 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Detect touch device or prefers-reduced-motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check element under cursor for semantic cursor states
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const projectCard = target.closest('[data-cursor="project"]');
      const externalLink = target.closest('[data-cursor="external"]') || (target.closest('a[target="_blank"]'));
      const dragArea = target.closest('[data-cursor="drag"]');
      const interactive = target.closest('button, a, input, [role="button"], [tabindex="0"]');

      if (projectCard) {
        setCursorType('project');
        setCursorText('VIEW PROJECT');
      } else if (externalLink) {
        setCursorType('external');
        setCursorText('OPEN ↗');
      } else if (dragArea) {
        setCursorType('drag');
        setCursorText('DRAG');
      } else if (interactive) {
        setCursorType('pointer');
        setCursorText('');
      } else {
        setCursorType('default');
        setCursorText('');
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (isTouchDevice || !isVisible) {
    return null;
  }

  const isExpanded = cursorType !== 'default';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
    >
      {/* Precision Center Dot */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className={`w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-opacity duration-150 ${
          cursorType === 'project' || cursorType === 'external' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Outer Spring Follower Ring / Interactive Pill */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className={`flex items-center justify-center border transition-all duration-200 backdrop-blur-[2px] ${
          cursorType === 'project' || cursorType === 'external' || cursorType === 'drag'
            ? 'px-3 py-1.5 rounded-full bg-cyan-950/80 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            : isExpanded
            ? 'w-10 h-10 rounded-full bg-cyan-500/10 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : 'w-7 h-7 rounded-full bg-transparent border-white/20'
        }`}
      >
        {cursorText && (
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-200 whitespace-nowrap">
            {cursorText}
          </span>
        )}
      </motion.div>
    </div>
  );
};
