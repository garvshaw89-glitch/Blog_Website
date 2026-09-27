import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CursorTheme } from '../../context/CursorContext';

export interface RippleEvent {
  id: number;
  x: number;
  y: number;
}

interface CursorRippleProps {
  ripples: RippleEvent[];
  cursorTheme: CursorTheme;
  prefersReducedMotion: boolean;
  onRippleComplete: (id: number) => void;
}

export const CursorRipple: React.FC<CursorRippleProps> = ({
  ripples,
  cursorTheme,
  prefersReducedMotion,
  onRippleComplete,
}) => {
  if (prefersReducedMotion || ripples.length === 0) {
    return null;
  }

  const getRippleBorder = () => {
    switch (cursorTheme) {
      case 'light':
        return 'border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.4)]';
      case 'violet':
        return 'border-indigo-400/60 shadow-[0_0_12px_rgba(129,140,248,0.4)]';
      case 'cyan':
      default:
        return 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => onRippleComplete(ripple.id)}
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-8 h-8 rounded-full border pointer-events-none ${getRippleBorder()}`}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
