import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
  PanInfo,
} from 'motion/react';
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Layers,
} from 'lucide-react';
import {
  SHEET_SECTIONS,
  FEATURED_SHEET_IDS,
  SheetSectionId,
} from '../../types/sheets';

interface SlideOverSheetDeckProps {
  activeSheet: SheetSectionId | null;
  onSelectSheet: (id: SheetSectionId) => void;
  onClose: () => void;
  onJumpToPageSection: (id: SheetSectionId) => void;
  pauseEscape?: boolean;
  renderSection: (id: SheetSectionId) => React.ReactNode;
}

export const SlideOverSheetDeck: React.FC<SlideOverSheetDeckProps> = ({
  activeSheet,
  onSelectSheet,
  onClose,
  onJumpToPageSection,
  pauseEscape = false,
  renderSection,
}) => {
  const [isWideSheet, setIsWideSheet] = useState(false);
  const [showAllSheetsBar, setShowAllSheetsBar] = useState(false);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const prevSheetRef = useRef<SheetSectionId | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const prefersReducedMotion = useReducedMotion();

  const currentMeta = activeSheet
    ? SHEET_SECTIONS.find((s) => s.id === activeSheet) ?? SHEET_SECTIONS[0]
    : null;

  // Lock background page scroll while Slide Over sheet is open
  useEffect(() => {
    if (!activeSheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeSheet]);

  // Reset scroll to top & compute directional transition when switching tabs inside Slide Over
  useEffect(() => {
    if (!activeSheet) {
      prevSheetRef.current = null;
      return;
    }

    if (prevSheetRef.current && prevSheetRef.current !== activeSheet) {
      const prevIdx = SHEET_SECTIONS.findIndex((s) => s.id === prevSheetRef.current);
      const nextIdx = SHEET_SECTIONS.findIndex((s) => s.id === activeSheet);
      setSlideDirection(nextIdx >= prevIdx ? 1 : -1);
    }
    prevSheetRef.current = activeSheet;

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeSheet]);

  // Keyboard navigation: ESC closes (when no inner modal is open)
  useEffect(() => {
    if (!activeSheet || pauseEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSheet, pauseEscape, onClose]);

  const handleCycle = (delta: -1 | 1) => {
    if (!activeSheet) return;
    const idx = SHEET_SECTIONS.findIndex((s) => s.id === activeSheet);
    const nextIdx = (idx + delta + SHEET_SECTIONS.length) % SHEET_SECTIONS.length;
    onSelectSheet(SHEET_SECTIONS[nextIdx].id);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 130 || info.velocity.x > 420) {
      onClose();
    }
  };

  const featuredSections = SHEET_SECTIONS.filter((s) =>
    FEATURED_SHEET_IDS.includes(s.id)
  );
  const secondarySections = SHEET_SECTIONS.filter(
    (s) => !FEATURED_SHEET_IDS.includes(s.id)
  );
  const isSecondaryActive =
    activeSheet !== null && !FEATURED_SHEET_IDS.includes(activeSheet);

  return (
    <AnimatePresence>
      {activeSheet && currentMeta && (
        <div
          id="slide-over-sheet-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`${currentMeta.windowTitle} Slide Over Window`}
          className="fixed inset-0 z-[70] flex justify-end items-stretch p-2 sm:p-4 md:p-5 pt-14 sm:pt-16"
        >
          {/* Dimmed translucent stage scrim leaving the rotating Milky Way live behind */}
          <motion.div
            key="slide-over-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/58 cursor-pointer"
          />

          {/* Floating macOS / iPadOS Slide Over Sheet Wrapper */}
          <motion.div
            key="slide-over-sheet-window"
            drag={prefersReducedMotion ? false : 'x'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ left: 0, right: 500 }}
            dragElastic={{ left: 0.04, right: 0.55 }}
            onDragEnd={handleDragEnd}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { x: '108%', opacity: 0.35, scale: 0.96 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { x: 0, opacity: 1, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { x: '108%', opacity: 0.25, scale: 0.96 }
            }
            transition={{
              type: 'spring',
              stiffness: 330,
              damping: 33,
              mass: 0.9,
            }}
            onClick={(e) => e.stopPropagation()}
            className={`relative ml-auto flex flex-col w-full h-full rounded-[24px] sm:rounded-[30px] border border-white/[0.15] bg-[#070A10]/95 shadow-[-24px_0_90px_rgba(0,0,0,0.9),0_25px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isWideSheet ? 'max-w-6xl' : 'max-w-4xl'
            }`}
          >
            {/* iPadOS Stacked Window Card Silhouette behind the active Slide Over Sheet */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden md:block absolute top-4 bottom-4 -left-3.5 w-6 rounded-l-[26px] border-l border-y border-white/[0.08] bg-[#0B1018]/80 -z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none hidden lg:block absolute top-8 bottom-8 -left-6 w-5 rounded-l-[24px] border-l border-y border-white/[0.05] bg-[#080B12]/65 -z-20"
            />

            {/* Left Edge iPadOS Drag-to-Dismiss Pill */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              title="Drag right to dismiss Slide Over"
              className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-30 h-20 w-3 items-center justify-center cursor-grab active:cursor-grabbing group"
            >
              <span className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-cyan-300/75 transition-colors" />
            </div>

            {/* macOS / iPadOS Sheet Window Chrome Header */}
            <div
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('button, a, input, select')) return;
                dragControls.start(e);
              }}
              className="shrink-0 select-none border-b border-white/[0.09] bg-[#0B0F17]/95 rounded-t-[24px] sm:rounded-t-[30px] px-4 sm:px-6 pt-2.5 pb-3 cursor-grab active:cursor-grabbing"
            >
              {/* iPadOS Top Sheet Grabber Bar */}
              <div className="flex justify-center mb-2">
                <span className="w-10 h-1 rounded-full bg-white/25" />
              </div>

              {/* Main 3-Zone Window Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                {/* Left: macOS Traffic Lights + Window Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close Slide Over window"
                      title="Close window (ESC)"
                      className="group w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-110 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onJumpToPageSection(activeSheet)}
                      aria-label="Scroll to section in page"
                      title="Dock into main page scroll"
                      className="group w-3.5 h-3.5 rounded-full bg-[#FEBC2E] hover:brightness-110 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    >
                      <ArrowDown className="w-2.5 h-2.5 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWideSheet((prev) => !prev)}
                      aria-label={isWideSheet ? 'Compact Slide Over width' : 'Expand Sheet width'}
                      title={isWideSheet ? 'Compact Slide Over' : 'Expand Sheet'}
                      className="group w-3.5 h-3.5 rounded-full bg-[#28C840] hover:brightness-110 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    >
                      {isWideSheet ? (
                        <Minimize2 className="w-2 h-2 text-black/85 opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Maximize2 className="w-2 h-2 text-black/85 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 hidden md:block">
                    <h2 className="font-sans text-xs font-semibold text-[#F2F3F5] truncate">
                      {currentMeta.windowTitle}
                    </h2>
                  </div>
                </div>

                {/* Center: Segmented Slide Over Section Switcher (About · Projects · Writing · Contact) */}
                <div
                  role="tablist"
                  aria-label="Switch Slide Over window section"
                  className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto max-w-full"
                >
                  {featuredSections.map((sec) => {
                    const isActive = activeSheet === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onSelectSheet(sec.id)}
                        data-cursor="button"
                        className={`px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-white text-black font-semibold shadow-sm'
                            : 'text-[#A7ADB5] hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {sec.label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAllSheetsBar((prev) => !prev)}
                    aria-expanded={showAllSheetsBar}
                    data-cursor="button"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      showAllSheetsBar || isSecondaryActive
                        ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/35'
                        : 'text-[#A7ADB5] hover:text-white hover:bg-white/[0.06]'
                    }`}
                    title="View all portfolio section sheets"
                  >
                    <Layers className="w-3 h-3 shrink-0" />
                    <span>All</span>
                  </button>
                </div>

                {/* Right: Prev / Next + Scroll In Page + Close */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCycle(-1)}
                    aria-label="Previous section sheet"
                    title="Previous section"
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[#A7ADB5] hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycle(1)}
                    aria-label="Next section sheet"
                    title="Next section"
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[#A7ADB5] hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    data-cursor="button"
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] font-mono text-[11px] text-[#F2F3F5] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Optional Secondary Strip for All Other Sections */}
              <AnimatePresence initial={false}>
                {(showAllSheetsBar || isSecondaryActive) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2.5 border-t border-white/[0.06]">
                      {secondarySections.map((sec) => {
                        const isActive = activeSheet === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => onSelectSheet(sec.id)}
                            className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              isActive
                                ? 'bg-cyan-400 text-black font-semibold'
                                : 'bg-white/[0.03] text-[#A7ADB5] hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                            }`}
                          >
                            {sec.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable Slide Over Sheet Body with Directional Tab Slide Animation */}
            <div
              ref={scrollContainerRef}
              className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 md:px-10 py-6 sm:py-10 rounded-b-[24px] sm:rounded-b-[30px]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSheet}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: slideDirection * 48 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: slideDirection * -48 }
                  }
                  transition={{
                    duration: 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {renderSection(activeSheet)}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
