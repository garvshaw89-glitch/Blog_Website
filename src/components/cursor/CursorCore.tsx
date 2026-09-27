import React from 'react';
import { motion, MotionValue } from 'motion/react';
import { CursorType, CursorTheme } from '../../context/CursorContext';

interface CursorCoreProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  cursorType: CursorType;
  cursorTheme: CursorTheme;
  isPointerDown: boolean;
  isIdle: boolean;
  prefersReducedMotion: boolean;
}

export const CursorCore: React.FC<CursorCoreProps> = ({
  x,
  y,
  cursorType,
  cursorTheme,
  isPointerDown,
  isIdle,
  prefersReducedMotion,
}) => {
  // Hide core when inside specialized label states like project cards to keep typography clean
  const isHidden = cursorType === 'project' || cursorType === 'image' || cursorType === 'drag' || cursorType === 'hidden' || cursorType === 'disabled';
  const isText = cursorType === 'text';
  const isButton = cursorType === 'button';
  const isLink = cursorType === 'link' || cursorType === 'external';

  // Theme-aware accent colors
  const getAccentColor = () => {
    switch (cursorTheme) {
      case 'light':
        return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]';
      case 'violet':
        return 'bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.9)]';
      case 'cyan':
      default:
        return 'bg-white shadow-[0_0_10px_#06b6d4,0_0_4px_#22d3ee]';
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
      animate={{
        scale: isHidden
          ? 0
          : isPointerDown
          ? 1.25
          : isText
          ? 0.7
          : isButton
          ? 1.2
          : isLink
          ? 1.35
          : isIdle && !prefersReducedMotion
          ? [1, 1.15, 1]
          : 1,
        opacity: isHidden ? 0 : isText ? 0.35 : 1,
      }}
      transition={
        isIdle && !prefersReducedMotion
          ? { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
          : { duration: 0.15, ease: 'easeOut' }
      }
      className={`absolute top-0 left-0 pointer-events-none rounded-full z-30 transition-colors duration-200 ${
        isText ? 'w-1 h-3 rounded-[1px] bg-cyan-300' : 'w-1.5 h-1.5'
      } ${getAccentColor()}`}
    />
  );
};
