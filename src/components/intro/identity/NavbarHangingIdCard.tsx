import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, ArrowUpRight, X } from 'lucide-react';
import { HangingIdCardScene } from './HangingIdCardScene';
import { IDENTITY_DATA } from './cardTextureFactory';

interface NavbarHangingIdCardProps {
  entered: boolean;
  hasScrolled: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

type CardStage = 'hidden' | 'center' | 'docked' | 'inspect';

const SLIDE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const NavbarHangingIdCard: React.FC<NavbarHangingIdCardProps> = ({
  entered,
  hasScrolled,
  anchorRef,
}) => {
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const [stage, setStage] = useState<CardStage>('hidden');
  const [hasSettledInCorner, setHasSettledInCorner] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isGitHubHovered, setIsGitHubHovered] = useState(false);
  const [isDockedHovered, setIsDockedHovered] = useState(false);

  const [layout, setLayout] = useState(() => ({
    vw: typeof window !== 'undefined' ? window.innerWidth : 1440,
    vh: typeof window !== 'undefined' ? window.innerHeight : 900,
    cornerCenterX: typeof window !== 'undefined' && window.innerWidth < 640 ? 48 : 74,
  }));

  const impulseRef = useRef({ velZ: 0, velY: 0, velX: 0 });
  const githubAnchorRef = useRef<HTMLAnchorElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const injectImpulse = useCallback((velZ: number, velY: number, velX = 0) => {
    impulseRef.current.velZ += velZ;
    impulseRef.current.velY += velY;
    impulseRef.current.velX += velX;
  }, []);

  const measureLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let cornerCenterX = vw < 640 ? 46 : 74;
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        cornerCenterX = rect.left + rect.width * 0.5;
      }
    }
    setLayout({ vw, vh, cornerCenterX });
  }, [anchorRef]);

  useLayoutEffect(() => {
    measureLayout();
    window.addEventListener('resize', measureLayout, { passive: true });
    window.addEventListener('orientationchange', measureLayout, { passive: true });
    return () => {
      window.removeEventListener('resize', measureLayout);
      window.removeEventListener('orientationchange', measureLayout);
    };
  }, [measureLayout, entered]);

  // Orchestrate: Main page enters -> Card drops & hangs in center -> Slides to top-left upside corner
  useEffect(() => {
    clearTimers();

    if (!entered) {
      setStage('hidden');
      setHasSettledInCorner(false);
      setIsCardHovered(false);
      setIsGitHubHovered(false);
      setIsDockedHovered(false);
      return;
    }

    measureLayout();

    if (prefersReducedMotion) {
      setStage('docked');
      setHasSettledInCorner(true);
      return;
    }

    setStage('center');
    setHasSettledInCorner(false);

    // Hang & swing naturally in center over the Milky Way, then slide to the top-left upside corner
    const slideTimer = window.setTimeout(() => {
      injectImpulse(0.92, -1.05, 0.1);
      setStage('docked');
    }, 2350);

    // Braking inertia pendulum counter-swing upon settling into the top-left corner
    const settleTimer = window.setTimeout(() => {
      injectImpulse(-0.72, 0.78, -0.06);
    }, 3220);

    const settledFlagTimer = window.setTimeout(() => {
      setHasSettledInCorner(true);
    }, 3700);

    timersRef.current.push(slideTimer, settleTimer, settledFlagTimer);

    return () => clearTimers();
  }, [entered, prefersReducedMotion, clearTimers, injectImpulse, measureLayout]);

  // Escape closes inspect mode cleanly back to top-left corner
  useEffect(() => {
    if (stage !== 'inspect') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        injectImpulse(0.85, -0.92, 0.08);
        setStage('docked');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, injectImpulse]);

  const handleGitHubClick = useCallback(() => {
    githubAnchorRef.current?.click();
  }, []);

  const handleDockToCorner = useCallback(() => {
    if (stage === 'docked') return;
    clearTimers();
    setHasSettledInCorner(false);
    injectImpulse(0.88, -0.95, 0.08);
    setStage('docked');
    const settleId = window.setTimeout(() => {
      injectImpulse(-0.62, 0.68, -0.05);
    }, 820);
    const settledFlagId = window.setTimeout(() => {
      setHasSettledInCorner(true);
    }, 1350);
    timersRef.current.push(settleId, settledFlagId);
  }, [stage, clearTimers, injectImpulse]);

  const handleExpandInspect = useCallback(() => {
    if (stage !== 'docked') return;
    clearTimers();
    setHasSettledInCorner(false);
    injectImpulse(-0.82, 0.9, 0.1);
    setStage('inspect');
  }, [stage, clearTimers, injectImpulse]);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  if (stage === 'hidden') return null;

  const isMobile = layout.vw < 640;
  const stageW = isMobile ? 286 : 360;
  const stageH = isMobile ? 450 : 540;

  // Compute target x, y, scale anchored at transformOrigin: '50% 0%' (top center where strap enters)
  const centerX = layout.vw * 0.5 - stageW * 0.5;
  const dockedX = layout.cornerCenterX - stageW * 0.5;

  const isDocked = stage === 'docked';
  const isInspect = stage === 'inspect';

  let targetX = centerX;
  let targetY = 0;
  let targetScale = isMobile ? Math.min(1, (layout.vh * 0.72) / stageH) : Math.min(1, (layout.vh * 0.76) / stageH);

  if (isDocked) {
    targetX = dockedX;
    if (hasScrolled) {
      targetScale = isMobile ? 0.175 : isDockedHovered ? 0.295 : 0.21;
      targetY = isMobile ? -16 : isDockedHovered ? 0 : -20;
    } else {
      targetScale = isMobile ? 0.215 : isDockedHovered ? 0.305 : 0.255;
      targetY = 0;
    }
  }

  // Reduced-motion or WebGL fallback: sleek obsidian-cyan CSS hanging ID badge
  if (prefersReducedMotion || webGlFailed) {
    return (
      <>
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

        <motion.div
          initial={{ x: centerX, y: -40, scale: 0.95, opacity: 0 }}
          animate={{ x: targetX, y: targetY, scale: targetScale, opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.25 : 1.15, ease: SLIDE_EASE }}
          style={{
            width: stageW,
            height: stageH,
            transformOrigin: '50% 0%',
          }}
          className="fixed top-0 left-0 z-[46] pointer-events-none flex flex-col items-center select-none"
        >
          <button
            type="button"
            onClick={isDocked ? handleExpandInspect : handleDockToCorner}
            data-cursor="button"
            data-cursor-label={isDocked ? 'ID CARD' : 'DOCK'}
            aria-label={isDocked ? 'Inspect Garv Shaw ID Card' : 'Dock ID Card to top-left corner'}
            className="pointer-events-auto flex flex-col items-center cursor-pointer focus-visible:outline-none"
          >
            {/* Woven dark lanyard strap */}
            <div className="w-6 h-32 bg-gradient-to-b from-[#0A0E17] via-[#131D30] to-[#0D1320] border-x border-sky-400/25 shadow-lg" />
            {/* Metallic crimp + clasp */}
            <div className="w-8 h-3.5 rounded-sm bg-gradient-to-r from-[#5B8AB2] via-[#CAE8FF] to-[#5B8AB2] -mt-0.5" />
            <div className="w-4 h-4 rounded-full border-2 border-sky-300/80 -mt-1" />
            {/* Compact obsidian-cyan ID card */}
            <div className="w-[238px] -mt-1.5 rounded-2xl border border-sky-400/45 bg-gradient-to-b from-[#0E1626] via-[#080D17] to-[#05080F] p-5 text-left shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
              <div className="w-10 h-2 mx-auto rounded-full bg-[#04060A] border border-sky-300/40 mb-4" />
              <div className="font-mono text-[9px] tracking-[0.22em] text-cyan-300/85 uppercase mb-2">
                {IDENTITY_DATA.verificationLabel}
              </div>
              <div className="font-editorial-serif text-3xl text-slate-100 leading-none tracking-wide">
                GARV
              </div>
              <div className="font-editorial-serif text-3xl text-sky-300 leading-none tracking-wide mb-2">
                SHAW
              </div>
              <div className="text-[11px] text-slate-300/80 mb-3">
                {IDENTITY_DATA.role}
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#05080F] border border-sky-400/25 font-mono text-[10px] text-sky-200 flex items-center justify-between">
                <span>{IDENTITY_DATA.githubHandle}</span>
                <ArrowUpRight className="w-3 h-3 text-cyan-300" />
              </div>
              <div className="mt-3 h-2.5 rounded-sm bg-gradient-to-r from-cyan-400/35 via-sky-200/55 to-indigo-400/40 border border-sky-300/30" />
              <div className="mt-3 font-mono text-[9px] tracking-[0.18em] text-slate-400">
                {IDENTITY_DATA.serialNumber}
              </div>
            </div>
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      {/* Native iframe-safe external anchor triggered by 3D raycast GitHub clicks */}
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

      {/* Soft backdrop scrim when visitor clicks top-left corner card to inspect it in center */}
      <AnimatePresence>
        {isInspect && (
          <motion.div
            key="id-card-inspect-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: SLIDE_EASE }}
            onClick={handleDockToCorner}
            className="fixed inset-0 z-[45] bg-[#04060b]/72"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Photorealistic 3D Hanging ID Card: Drops in Center -> Slides to Top-Left Upside Corner */}
      <motion.div
        key="navbar-hanging-id-card"
        initial={{
          x: centerX,
          y: 0,
          scale: targetScale,
          opacity: 1,
        }}
        animate={{
          x: targetX,
          y: targetY,
          scale: targetScale,
          opacity: 1,
        }}
        transition={{
          duration: isDocked ? (hasSettledInCorner ? 0.32 : 1.28) : 0.88,
          ease: SLIDE_EASE,
        }}
        onMouseEnter={() => {
          if (isDocked) setIsDockedHovered(true);
        }}
        onMouseLeave={() => {
          setIsDockedHovered(false);
        }}
        data-cursor={isDocked ? 'button' : isGitHubHovered ? 'link' : undefined}
        data-cursor-label={
          isDocked ? 'ID CARD' : isGitHubHovered ? 'GITHUB' : undefined
        }
        style={{
          width: stageW,
          height: stageH,
          transformOrigin: '50% 0%',
          willChange: 'transform',
        }}
        className="fixed top-0 left-0 z-[46] select-none pointer-events-auto"
      >
        <HangingIdCardScene
          transparent
          isDocked={isDocked}
          externalImpulseRef={impulseRef}
          onCardHoverChange={setIsCardHovered}
          onGitHubHoverChange={setIsGitHubHovered}
          onGitHubClick={handleGitHubClick}
          onCardBodyClick={isDocked ? handleExpandInspect : undefined}
          onWebGLError={handleWebGLError}
        />

        {/* Accessible transparent hit button over docked badge for keyboard & touch users */}
        {isDocked && (
          <button
            type="button"
            onClick={handleExpandInspect}
            aria-label="Inspect Garv Shaw Developer ID Card"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-[#080C15] focus:text-cyan-200 focus:border focus:border-cyan-400/50 font-mono text-xs"
          >
            Inspect ID Card
          </button>
        )}
      </motion.div>

      {/* Subtle Contextual Controls when Inspecting the Card in Center */}
      <AnimatePresence>
        {isInspect && (
          <motion.div
            key="id-card-inspect-controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: SLIDE_EASE }}
            className="fixed bottom-0 inset-x-0 z-[47] pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3 pointer-events-none select-none"
          >
            <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-sky-300/85">
              {isGitHubHovered
                ? 'OPEN GITHUB · @GARVSHAW89-GLITCH'
                : isCardHovered
                  ? 'EXPLORE MY IDENTITY'
                  : 'GARV SHAW · DEVELOPER ID'}
            </div>

            <div className="pointer-events-auto flex items-center gap-3">
              <a
                href={IDENTITY_DATA.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                data-cursor-label="GITHUB"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-sky-400/45 hover:border-cyan-300 bg-[#080C15]/92 text-slate-100 font-mono text-[11px] tracking-[0.14em] transition-colors cursor-pointer"
              >
                <Github className="w-3.5 h-3.5 text-sky-400" />
                <span>{IDENTITY_DATA.githubHandle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
              </a>

              <button
                type="button"
                onClick={handleDockToCorner}
                data-cursor="button"
                data-cursor-label="DOCK"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/15 hover:border-sky-400/50 bg-[#080C15]/92 text-slate-300 hover:text-white font-mono text-[11px] tracking-[0.2em] uppercase transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-sky-300" />
                <span>CLOSE</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
