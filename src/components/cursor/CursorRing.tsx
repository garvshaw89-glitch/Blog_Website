import React from 'react';
import { motion, MotionValue } from 'motion/react';
import { CursorType, CursorTheme } from '../../context/CursorContext';
import { CursorLabel } from './CursorLabel';

interface CursorRingProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  cursorType: CursorType;
  cursorLabel: string;
  cursorTheme: CursorTheme;
  isPointerDown: boolean;
  isIdle: boolean;
  velocityScaleX: MotionValue<number>;
  velocityScaleY: MotionValue<number>;
  velocityAngle: MotionValue<number>;
  prefersReducedMotion: boolean;
}

export const CursorRing: React.FC<CursorRingProps> = ({
  x,
  y,
  cursorType,
  cursorLabel,
  cursorTheme,
  isPointerDown,
  isIdle,
  velocityScaleX,
  velocityScaleY,
  velocityAngle,
  prefersReducedMotion,
}) => {
  const isLabelActive =
    cursorType === 'project' ||
    cursorType === 'image' ||
    cursorType === 'drag' ||
    cursorType === 'external' ||
    (cursorType === 'link' && !!cursorLabel);

  const isText = cursorType === 'text';
  const isButton = cursorType === 'button';
  const isLink = cursorType === 'link' || cursorType === 'external';
  const isHidden = cursorType === 'hidden' || cursorType === 'disabled';
  const isProject = cursorType === 'project';

  // Base theme classes
  const getThemeBorderAndGlow = () => {
    switch (cursorTheme) {
      case 'light':
        return isLabelActive
          ? 'bg-slate-900/90 border-white/60 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
          : isButton
          ? 'bg-white/10 border-white/70 shadow-[0_0_18px_rgba(255,255,255,0.3)]'
          : isLink
          ? 'bg-white/5 border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
          : 'bg-white/[0.02] border-white/20';
      case 'violet':
        return isLabelActive
          ? 'bg-indigo-950/90 border-indigo-400/80 shadow-[0_0_25px_rgba(129,140,248,0.35)]'
          : isButton
          ? 'bg-indigo-500/10 border-indigo-400/70 shadow-[0_0_18px_rgba(129,140,248,0.3)]'
          : isLink
          ? 'bg-indigo-500/5 border-indigo-400/40 shadow-[0_0_12px_rgba(129,140,248,0.2)]'
          : 'bg-white/[0.02] border-indigo-300/20';
      case 'cyan':
      default:
        return isLabelActive
          ? 'bg-[#070D18]/92 border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.35)]'
          : isButton
          ? 'bg-cyan-500/10 border-cyan-400/70 shadow-[0_0_22px_rgba(6,182,212,0.35)]'
          : isLink
          ? 'bg-cyan-500/5 border-cyan-400/40 shadow-[0_0_14px_rgba(6,182,212,0.2)]'
          : 'bg-white/[0.02] border-cyan-400/25';
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <motion.div
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        rotate: prefersReducedMotion ? 0 : velocityAngle,
        scaleX: prefersReducedMotion ? 1 : velocityScaleX,
        scaleY: prefersReducedMotion ? 1 : velocityScaleY,
      }}
      animate={{
        scale: isPointerDown
          ? 0.82
          : isText
          ? 0.45
          : isIdle && !prefersReducedMotion
          ? [1, 1.06, 1]
          : 1,
        opacity: isText ? 0.15 : 1,
      }}
      transition={
        isIdle && !prefersReducedMotion
          ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
          : { duration: 0.18, ease: 'easeOut' }
      }
      className="absolute top-0 left-0 pointer-events-none z-20 flex items-center justify-center will-change-transform"
    >
      <div
        className={`relative flex items-center justify-center border backdrop-blur-[3px] transition-all duration-200 select-none ${
          isProject
            ? 'w-20 h-20 rounded-full rotate-[-4deg]'
            : isLabelActive
            ? 'px-4 py-2 rounded-full'
            : isButton
            ? 'w-12 h-12 rounded-full border-[1.5px]'
            : isLink
            ? 'w-10 h-10 rounded-full border-[1.2px]'
            : 'w-8 h-8 rounded-full border-[1px]'
        } ${getThemeBorderAndGlow()}`}
      >
        {/* Subtle Rotating Accent for Button Hover State */}
        {isButton && !prefersReducedMotion && (
          <div className="cursor-ring-button-accent" />
        )}

        <CursorLabel
          cursorType={cursorType}
          cursorLabel={cursorLabel}
          cursorTheme={cursorTheme}
        />
      </div>
    </motion.div>
  );
};
