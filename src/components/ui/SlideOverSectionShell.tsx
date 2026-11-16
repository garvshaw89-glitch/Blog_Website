import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import { PanelRightOpen } from 'lucide-react';
import { SheetSectionId } from '../../types/sheets';

interface SlideOverSectionShellProps {
  sectionId: SheetSectionId;
  windowTitle: string;
  onOpenSlideOver?: (id: SheetSectionId) => void;
  children: React.ReactNode;
}

export const SlideOverSectionShell: React.FC<SlideOverSectionShellProps> = ({
  sectionId,
  windowTitle,
  onOpenSlideOver,
  children,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start 0.96', 'start 0.26'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 118,
    damping: 25,
    mass: 0.85,
  });

  // Authentic macOS / iPadOS Slide Over entrance from the right edge on scroll
  const sheetX = useTransform(smoothProgress, [0, 0.55, 1], [110, 26, 0]);
  const sheetScale = useTransform(smoothProgress, [0, 0.6, 1], [0.93, 0.98, 1]);
  const sheetRotateY = useTransform(smoothProgress, [0, 0.65, 1], [-5.5, -1.5, 0]);
  const sheetOpacity = useTransform(smoothProgress, [0, 0.25, 0.72, 1], [0.12, 0.68, 0.94, 1]);

  return (
    <div
      ref={outerRef}
      id={sectionId}
      className="relative w-full py-10 sm:py-16 px-3 sm:px-6 md:px-10 select-none overflow-x-clip"
      style={{ perspective: '1600px' }}
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: sheetX,
                scale: sheetScale,
                rotateY: sheetRotateY,
                opacity: sheetOpacity,
                transformStyle: 'preserve-3d',
                transformOrigin: '82% 28%',
                willChange: 'transform, opacity',
              }
        }
        className="relative max-w-7xl mx-auto rounded-[24px] sm:rounded-[32px] border border-white/[0.11] bg-[#07090E]/82 shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        {/* Subtle stacked background edge peeking behind the sheet like iPadOS Slide Over */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden md:block absolute -inset-y-2 -left-2.5 right-4 -z-10 rounded-[32px] border border-white/[0.05] bg-[#06080D]/45"
        />

        {/* macOS / iPadOS Window Sheet Header Bar */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-3.5 border-b border-white/[0.08] bg-white/[0.02] rounded-t-[24px] sm:rounded-t-[32px]">
          {/* Left: Traffic Lights + Window Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80" />
            </div>
            <span className="font-sans text-xs font-medium tracking-wide text-[#D7DDE6] truncate">
              {windowTitle}
            </span>
          </div>

          {/* Center: iPadOS Slide Over Grabber Handle */}
          <div className="hidden sm:flex items-center justify-center shrink-0" aria-hidden="true">
            <span className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Right: Dock / Open as Floating Slide Over Sheet */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSlideOver && (
              <button
                type="button"
                onClick={() => onOpenSlideOver(sectionId)}
                data-cursor="button"
                data-cursor-label="SHEET"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-400/15 border border-white/[0.1] hover:border-cyan-400/40 text-[11px] font-mono text-[#A7ADB5] hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title={`Open ${windowTitle} in Slide Over sheet`}
              >
                <PanelRightOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Slide Over</span>
              </button>
            )}
          </div>
        </div>

        {/* Sheet Body Content */}
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
};
