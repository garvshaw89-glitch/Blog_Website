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

  const getGlowStyle = (): React.CSSProperties => {
    switch (cursorTheme) {
      case 'light':
        return {
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(148,163,184,0.05) 45%, transparent 72%)',
        };
      case 'violet':
        return {
          background:
            'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.18) 0%, rgba(147,51,234,0.06) 45%, transparent 72%)',
        };
      case 'cyan':
      default:
        return {
          background:
            'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.18) 0%, rgba(37,99,235,0.06) 45%, transparent 72%)',
        };
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
      className="absolute top-0 left-0 pointer-events-none z-10 w-[260px] h-[260px] will-change-transform"
    >
      <div
        className="w-full h-full rounded-full opacity-80 transition-opacity duration-300"
        style={getGlowStyle()}
      />
    </motion.div>
  );
};
