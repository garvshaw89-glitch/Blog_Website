import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HangingIdCardScene, NameScreenRect } from './HangingIdCardScene';
import { IDENTITY_DATA } from './cardTextureFactory';

interface NavbarHangingIdCardProps {
  entered: boolean;
  anchorRef: React.RefObject<HTMLSpanElement | null>;
  onBrandSettled: () => void;
}

interface ExtractedNameGlide {
  startX: number;
  startY: number;
  liftX: number;
  liftY: number;
  endX: number;
  endY: number;
  startScale: number;
  liftScale: number;
  endScale: number;
  baseFontSize: number;
}

type SequencePhase = 'idle' | 'hanging' | 'extracting' | 'retracting' | 'done';

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const NavbarHangingIdCard: React.FC<NavbarHangingIdCardProps> = ({
  entered,
  anchorRef,
  onBrandSettled,
}) => {
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const [phase, setPhase] = useState<SequencePhase>('idle');
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [showCardScene, setShowCardScene] = useState(false);
  const [isHoverPeek, setIsHoverPeek] = useState(false);
  const [anchorScreenX, setAnchorScreenX] = useState(88);
  const [nameGlide, setNameGlide] = useState<ExtractedNameGlide | null>(null);
  const [isNameMoving, setIsNameMoving] = useState(false);

  const githubAnchorRef = useRef<HTMLAnchorElement>(null);
  const fallbackNameRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const isHoverPeekRef = useRef(false);
  const onBrandSettledRef = useRef(onBrandSettled);

  useEffect(() => {
    onBrandSettledRef.current = onBrandSettled;
  }, [onBrandSettled]);

  useEffect(() => {
    isHoverPeekRef.current = isHoverPeek;
  }, [isHoverPeek]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Track horizontal screen center of top-left GARV SHAW anchor for corner hang alignment
  const syncAnchorX = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      setAnchorScreenX(rect.left + rect.width * 0.5);
    }
  }, [anchorRef]);

  // Compute exact pixel-to-pixel flight path from GARV SHAW on the 3D card -> top-left Navbar corner
  const computeNameGlide = useCallback(
    (sourceRect: NameScreenRect) => {
      const targetEl = anchorRef.current;
      const vw = window.innerWidth;
      const baseFontSize = 64;

      const measureEl = document.createElement('span');
      measureEl.textContent = IDENTITY_DATA.name;
      measureEl.className = 'font-editorial font-bold tracking-tight whitespace-nowrap';
      measureEl.style.position = 'fixed';
      measureEl.style.visibility = 'hidden';
      measureEl.style.pointerEvents = 'none';
      measureEl.style.fontSize = `${baseFontSize}px`;
      measureEl.style.lineHeight = '1';
      document.body.appendChild(measureEl);
      const baseRect = measureEl.getBoundingClientRect();
      document.body.removeChild(measureEl);

      const targetRect = targetEl
        ? targetEl.getBoundingClientRect()
        : { left: vw < 640 ? 20 : 32, top: 20, width: 108, height: 22 };

      const safeBaseW = Math.max(1, baseRect.width);
      const safeBaseH = Math.max(1, baseRect.height);

      const startScale = Math.max(0.28, sourceRect.width / safeBaseW);
      const endScale = Math.max(0.16, targetRect.width / safeBaseW);
      const liftScale = Math.min(1.42, startScale * 1.28);

      const startX = sourceRect.left;
      const startY = sourceRect.top + (sourceRect.height - safeBaseH * startScale) * 0.5;
      const liftX = startX - (safeBaseW * (liftScale - startScale)) * 0.45;
      const liftY = startY - 18;
      const endX = targetRect.left;
      const endY = targetRect.top + (targetRect.height - safeBaseH * endScale) * 0.5;

      setNameGlide({
        startX,
        startY,
        liftX,
        liftY,
        endX,
        endY,
        startScale,
        liftScale,
        endScale,
        baseFontSize,
      });
      setIsNameMoving(true);
    },
    [anchorRef]
  );

  const triggerExtractAndRetract = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'extracting' || prev === 'retracting' || prev === 'done') return prev;
      return 'extracting';
    });

    if (webGlFailed) {
      const rect = fallbackNameRef.current?.getBoundingClientRect();
      if (rect) {
        computeNameGlide({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } else {
        computeNameGlide({
          left: window.innerWidth * 0.5 - 110,
          top: window.innerHeight * 0.44,
          width: 220,
          height: 44,
        });
      }
    }

    // Wait 1.5s after "GARV SHAW" begins gliding to top-left corner, then smoothly raise the card up
    const retractTimer = window.setTimeout(() => {
      setPhase('retracting');
    }, 1500);

    const fallbackEndTimer = window.setTimeout(() => {
      if (webGlFailed) {
        setPhase('done');
      }
    }, 2650);

    timersRef.current.push(retractTimer, fallbackEndTimer);
  }, [webGlFailed, computeNameGlide]);

  const dropSettledStartedRef = useRef(false);

  const startThreeSecondHangCountdown = useCallback(() => {
    if (dropSettledStartedRef.current) return;
    dropSettledStartedRef.current = true;
    const hangTimer = window.setTimeout(() => {
      triggerExtractAndRetract();
    }, 3000);
    timersRef.current.push(hangTimer);
  }, [triggerExtractAndRetract]);

  // Orchestrate main-page entrance:
  // 1) Big hanging ID card descends from top over the Milky Way
  // 2) Hangs smoothly for a full 3 seconds
  // 3) "GARV SHAW" lifts off the ID card & glides up to the top-left corner
  // 4) 1.5 seconds after the name starts moving, the ID card retracts smoothly back UP
  useEffect(() => {
    clearTimers();
    dropSettledStartedRef.current = false;
    setIsHoverPeek(false);

    if (!entered) {
      setPhase('idle');
      setShowCardScene(false);
      setNameGlide(null);
      setIsNameMoving(false);
      return;
    }

    if (prefersReducedMotion) {
      setPhase('done');
      setShowCardScene(false);
      onBrandSettledRef.current();
      return;
    }

    syncAnchorX();
    setPhase('hanging');
    setShowCardScene(true);
    setNameGlide(null);
    setIsNameMoving(false);

    // Safety fallback if WebGL fails or fallback DOM card is active (1.15s descent -> 3s hang)
    const fallbackDropTimer = window.setTimeout(() => {
      startThreeSecondHangCountdown();
    }, 1150);

    timersRef.current.push(fallbackDropTimer);

    return () => clearTimers();
  }, [entered, prefersReducedMotion, clearTimers, startThreeSecondHangCountdown, syncAnchorX]);

  // Near-radius cursor hover detector around top-left GARV SHAW corner once initial sequence finishes
  useEffect(() => {
    if (!entered || prefersReducedMotion || phase !== 'done') return;

    syncAnchorX();

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const anchorEl = anchorRef.current;
      if (!anchorEl) return;

      const rect = anchorEl.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (!isHoverPeekRef.current) {
        // Cursor enters near radius of GARV SHAW in the top-left corner -> start hanging smoothly
        if (dist <= 135 || (e.clientX <= rect.right + 75 && e.clientY <= rect.bottom + 75)) {
          setAnchorScreenX(cx);
          setIsHoverPeek(true);
        }
      } else {
        // Stay hanging while cursor remains near GARV SHAW or over the hanging corner card;
        // once cursor moves far away -> smoothly pull the card back up
        const maxZoneY = Math.min(460, Math.max(320, window.innerHeight * 0.56));
        const withinZone = e.clientX <= rect.left + 290 && e.clientY <= maxZoneY;
        if (!withinZone) {
          setIsHoverPeek(false);
        }
      }
    };

    const handleLeave = () => {
      if (isHoverPeekRef.current) {
        setIsHoverPeek(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', syncAnchorX, { passive: true });
    document.addEventListener('mouseleave', handleLeave, { passive: true });
    window.addEventListener('blur', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', syncAnchorX);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('blur', handleLeave);
    };
  }, [entered, prefersReducedMotion, phase, anchorRef, syncAnchorX]);

  const handleNameScreenRect = useCallback(
    (rect: NameScreenRect) => {
      computeNameGlide(rect);
    },
    [computeNameGlide]
  );

  const handleDropSettled = useCallback(() => {
    startThreeSecondHangCountdown();
  }, [startThreeSecondHangCountdown]);

  const handleRetractComplete = useCallback(() => {
    setPhase((prev) => (prev === 'retracting' ? 'done' : prev));
  }, []);

  const handleNameGlideComplete = useCallback(() => {
    setIsNameMoving(false);
    setNameGlide(null);
    onBrandSettledRef.current();
  }, []);

  const handleGitHubClick = useCallback(() => {
    githubAnchorRef.current?.click();
  }, []);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  if (!entered || prefersReducedMotion) return null;

  const isCornerMode = phase === 'done';
  const isExtracting = phase === 'extracting' || phase === 'retracting';
  const isRetracting = isCornerMode ? !isHoverPeek : phase === 'retracting';

  return (
    <>
      {/* Native iframe-safe anchor for GitHub clicks on the big ID card */}
      <a
        ref={githubAnchorRef}
        href={IDENTITY_DATA.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-only"
        tabIndex={-1}
      >
        Open Garv Shaw GitHub Profile
      </a>

      {/* 1. Hanging 3D ID Card: Initial center drop + corner near-radius hover-peek hang/retract */}
      {showCardScene &&
        (webGlFailed ? (
          <motion.div
            key="fallback-big-id-card"
            initial={{ y: '-110vh' }}
            animate={{
              y: isRetracting ? '-115vh' : isCornerMode ? '3.5rem' : '0vh',
              scale: isCornerMode ? 0.56 : 1,
            }}
            transition={{
              duration: isRetracting ? 0.95 : 1.0,
              ease: LUXURY_EASE,
            }}
            style={{ transformOrigin: 'top center' }}
            className={`fixed top-0 flex flex-col pointer-events-none select-none ${
              isCornerMode
                ? 'left-4 sm:left-8 items-start z-[35]'
                : 'inset-x-0 items-center z-[45]'
            }`}
          >
            <div className="w-7 h-28 sm:h-36 bg-gradient-to-b from-[#0A0E17] via-[#131D30] to-[#0D1320] border-x border-sky-400/30 shadow-xl" />
            <div className="w-10 h-4 rounded-sm bg-gradient-to-r from-[#5B8AB2] via-[#CAE8FF] to-[#5B8AB2] -mt-0.5" />
            <div className="w-5 h-5 rounded-full border-2 border-sky-300/80 -mt-1" />
            <div className="w-[310px] sm:w-[356px] -mt-1.5 rounded-2xl border border-sky-400/50 bg-gradient-to-b from-[#0E1626] via-[#080D17] to-[#05080F] p-7 text-left shadow-[0_32px_90px_rgba(0,0,0,0.85)]">
              <div className="w-12 h-2.5 mx-auto rounded-full bg-[#04060A] border border-sky-300/45 mb-5" />
              <div className="font-mono text-[10px] tracking-[0.22em] text-cyan-300/85 uppercase mb-2.5">
                {IDENTITY_DATA.verificationLabel}
              </div>
              <div
                ref={fallbackNameRef}
                className={`font-editorial-serif text-4xl sm:text-[42px] text-slate-100 leading-none tracking-wide mb-2 transition-opacity duration-300 ${
                  !isCornerMode && isExtracting ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {IDENTITY_DATA.name}
              </div>
              <div className="text-xs sm:text-sm text-cyan-300/85 mb-4">
                {IDENTITY_DATA.role}
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#05080F] border border-sky-400/25 font-mono text-[11px] text-sky-200">
                {IDENTITY_DATA.githubHandle}
              </div>
              <div className="mt-4 h-3 rounded-sm bg-gradient-to-r from-cyan-400/35 via-sky-200/55 to-indigo-400/40 border border-sky-300/30" />
              <div className="mt-4 font-mono text-[10px] tracking-[0.2em] text-slate-400">
                {IDENTITY_DATA.serialNumber}
              </div>
            </div>
          </motion.div>
        ) : (
          <div
            className={`fixed inset-0 select-none ${
              isCornerMode
                ? 'z-[35] pointer-events-none'
                : isRetracting
                  ? 'z-[45] pointer-events-none'
                  : 'z-[45] pointer-events-auto'
            }`}
          >
            <HangingIdCardScene
              transparent
              heroDropMode
              cornerMode={isCornerMode}
              anchorScreenX={anchorScreenX}
              isExtractingName={!isCornerMode && isExtracting}
              isRetracting={isRetracting}
              onGitHubClick={handleGitHubClick}
              onNameScreenRect={handleNameScreenRect}
              onDropSettled={handleDropSettled}
              onRetractComplete={handleRetractComplete}
              onWebGLError={handleWebGLError}
            />
          </div>
        ))}

      {/* 2. Extracted "GARV SHAW" Name Peeling Off the ID Card -> Gliding Up to Top-Left Corner */}
      <AnimatePresence>
        {isNameMoving && nameGlide && (
          <motion.div
            key="garv-shaw-extracted-from-card"
            aria-hidden="true"
            className="fixed left-0 top-0 z-[48] pointer-events-none select-none"
            style={{
              transformOrigin: '0% 0%',
              willChange: 'transform, opacity',
            }}
            initial={{
              x: nameGlide.startX,
              y: nameGlide.startY,
              scale: nameGlide.startScale,
              opacity: 0.92,
            }}
            animate={{
              x: [nameGlide.startX, nameGlide.liftX, nameGlide.endX],
              y: [nameGlide.startY, nameGlide.liftY, nameGlide.endY],
              scale: [nameGlide.startScale, nameGlide.liftScale, nameGlide.endScale],
              opacity: [0.92, 1, 1],
            }}
            transition={{
              duration: 1.65,
              times: [0, 0.24, 1],
              ease: LUXURY_EASE,
            }}
            onAnimationComplete={handleNameGlideComplete}
          >
            <div className="relative inline-block">
              {/* Luminous cyan extraction energy sweep as the name detaches from the card */}
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0.95, scaleX: 0.3 }}
                animate={{ opacity: [0.95, 0.85, 0], scaleX: [0.3, 1.15, 1] }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                className="absolute -inset-x-3 -bottom-1.5 h-[2px] origin-left bg-gradient-to-r from-cyan-300 via-white to-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.95)]"
              />

              <span
                className="block font-editorial font-bold tracking-tight leading-none whitespace-nowrap text-[#F2F3F5]"
                style={{
                  fontSize: `${nameGlide.baseFontSize}px`,
                  textShadow:
                    '0 0 28px rgba(56, 189, 248, 0.65), 0 0 56px rgba(126, 167, 255, 0.35)',
                }}
              >
                {IDENTITY_DATA.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
