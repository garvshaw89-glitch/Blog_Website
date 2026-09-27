import React from 'react';
import { motion, MotionValue } from 'motion/react';
import { CursorTheme } from '../../context/CursorContext';

interface CursorGlowProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  cursorTheme: CursorTheme;
  isVisible: boolean;
  prefersReducedMotion: boolean;
}

export const CursorGlow: React.FC<CursorGlowProps> = ({
  x,
  y,
  cursorTheme,
  isVisible,
  prefersReducedMotion,
}) => {
  if (prefersReducedMotion || !isVisible) {
    return null;
  }

  const getGlowGradient = () => {
    switch (cursorTheme) {
      case 'light':
        return 'from-white/10 via-slate-400/5 to-transparent';
      case 'violet':
        return 'from-indigo-500/15 via-purple-600/5 to-transparent';
      case 'cyan':
      default:
        return 'from-cyan-500/15 via-blue-600/5 to-transparent';
    }
  };

  return (
    <motion.div
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
      }}
      className="absolute top-0 left-0 pointer-events-none z-10 w-[220px] h-[220px] will-change-transform"
    >
      <div
        className={`w-full h-full rounded-full bg-radial ${getGlowGradient()} blur-[45px] opacity-75 transition-opacity duration-300`}
      />
    </motion.div>
  );
};
