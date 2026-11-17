import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Github, ArrowUpRight } from 'lucide-react';
import { HangingIdCardScene } from './identity/HangingIdCardScene';
import { ReducedMotionIdCard } from './identity/ReducedMotionIdCard';
import { IDENTITY_DATA } from './identity/cardTextureFactory';

interface LuxuryIntroProps {
  onComplete: () => void;
  onRocketCursorReady?: () => void;
}

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({
  onComplete,
  onRocketCursorReady,
}) => {
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isGitHubHovered, setIsGitHubHovered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isReadyForCta, setIsReadyForCta] = useState(false);

  const veilRef = useRef<HTMLDivElement>(null);
  const githubAnchorRef = useRef<HTMLAnchorElement>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onRocketCursorReadyRef = useRef(onRocketCursorReady);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onRocketCursorReadyRef.current = onRocketCursorReady;
  }, [onRocketCursorReady]);

  // Lock background scroll while the identity entry installation is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Reveal subtle studio HUD controls once the lanyard & card finish descending
  useEffect(() => {
    const timer = window.setTimeout(
      () => setIsReadyForCta(true),
      prefersReducedMotion ? 120 : 1250
    );
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const finishEntry = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onRocketCursorReadyRef.current?.();
    onCompleteRef.current();
  }, []);

  const handleTriggerEnter = useCallback(() => {
    if (isEntering || completedRef.current) return;
    setIsEntering(true);

    if (prefersReducedMotion || webGlFailed) {
      window.setTimeout(finishEntry, 440);
    }
  }, [isEntering, prefersReducedMotion, webGlFailed, finishEntry]);

  // Keyboard support: pressing Enter launches the portfolio transition
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isEntering && isReadyForCta) {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName?.toLowerCase();
        if (activeTag === 'a') return;
        e.preventDefault();
        handleTriggerEnter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEntering, isReadyForCta, handleTriggerEnter]);

  // Trigger real anchor click so GitHub opens cleanly without window.open
  const handleGitHubCardClick = useCallback(() => {
    githubAnchorRef.current?.click();
  }, []);

  // Drive seamless dark-obsidian + warm champagne studio cross-dissolve during camera zoom
  const handleEnterProgress = useCallback((progress: number) => {
    if (!veilRef.current) return;
    const fadeStart = 0.56;
    const t = Math.max(0, Math.min(1, (progress - fadeStart) / (1 - fadeStart)));
    const eased = t * t * (3 - 2 * t);
    veilRef.current.style.opacity = eased.toFixed(3);
  }, []);

  const handleWebGLError = useCallback(() => {
    setWebGlFailed(true);
  }, []);

  if (prefersReducedMotion || webGlFailed) {
    return (
      <ReducedMotionIdCard
        onEnter={handleTriggerEnter}
        isEntering={isEntering}
      />
    );
  }

  return (
    <motion.div
      key="garv-shaw-identity-entry"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-0 h-[100dvh] w-full z-50 bg-[#050608] overflow-hidden select-none ${
        isGitHubHovered
          ? 'cursor-pointer'
          : isCardHovered
            ? 'cursor-grab'
            : 'cursor-default'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Garv Shaw — Cinematic Developer Identity Entry"
    >
      <h1 className="sr-only">
        Garv Shaw — Developer / Creative Designer Identity Entry
      </h1>

      {/* Native external anchor used by 3D raycast GitHub clicks (iframe-safe) */}
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

      {/* 1. Photorealistic Three.js Studio Scene: Descending Lanyard, Metallic Clasp & Swinging ID Card */}
      <HangingIdCardScene
        isEntering={isEntering}
        onCardHoverChange={setIsCardHovered}
        onGitHubHoverChange={setIsGitHubHovered}
        onGitHubClick={handleGitHubCardClick}
        onEnterProgress={handleEnterProgress}
        onEnterComplete={finishEntry}
        onWebGLError={handleWebGLError}
      />

      {/* Subtle architectural vignette framing the studio stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 75% at 50% 48%, transparent 45%, rgba(3, 5, 10, 0.74) 100%)',
        }}
      />

      {/* 2. Restrained Editorial Studio Framing (Top Corners) */}
      <header
        className={`pointer-events-none fixed top-0 inset-x-0 z-10 flex items-start justify-between px-6 sm:px-10 pt-[max(1.5rem,env(safe-area-inset-top))] transition-all duration-700 ${
          isReadyForCta && !isEntering
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-sm sm:text-base tracking-[0.22em] text-slate-100/90 uppercase">
            {IDENTITY_DATA.name}
          </span>
          <span className="font-mono text-[10px] tracking-[0.26em] text-cyan-300/70 uppercase">
            IDENTITY INSTALLATION
          </span>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-0.5 font-mono text-[10px] tracking-[0.22em]">
          <span className="text-slate-200/70">{IDENTITY_DATA.serialNumber}</span>
          <span className="text-sky-400/70">{IDENTITY_DATA.verificationLabel}</span>
        </div>
      </header>

      {/* 3. Bottom Editorial Interaction Bar: Hover Prompt + GitHub Quick Link + ENTER CTA */}
      <footer
        className={`pointer-events-none fixed bottom-0 inset-x-0 z-10 flex flex-col items-center gap-3.5 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] transition-all duration-700 ${
          isReadyForCta && !isEntering
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3'
        }`}
      >
        {/* Contextual Hover Instruction: EXPLORE MY IDENTITY / GitHub Active Hint */}
        <div className="h-6 flex items-center justify-center">
          <div
            className={`transition-all duration-300 flex items-center gap-2 font-mono text-[11px] tracking-[0.34em] uppercase ${
              isGitHubHovered
                ? 'text-cyan-200 opacity-100 translate-y-0'
                : isCardHovered
                  ? 'text-sky-300 opacity-100 translate-y-0'
                  : 'text-sky-300/60 opacity-80 translate-y-0.5'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isCardHovered || isGitHubHovered
                  ? 'bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.95)] scale-110'
                  : 'bg-sky-400/55 scale-90'
              }`}
            />
            <span>
              {isGitHubHovered
                ? 'OPEN GITHUB · @GARVSHAW89-GLITCH'
                : 'EXPLORE MY IDENTITY'}
            </span>
          </div>
        </div>

        {/* Primary Sculpted Luxury ENTER Button + Accessible GitHub Companion Link */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleTriggerEnter}
            disabled={isEntering}
            className="group relative overflow-hidden px-11 sm:px-14 py-3.5 rounded-full border border-sky-400/50 hover:border-cyan-300 bg-[#080C15]/88 hover:bg-[#0D1524] text-[#F2F3F5] font-mono text-xs tracking-[0.38em] uppercase transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.78)] hover:shadow-[0_0_30px_rgba(56,189,248,0.28)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
            />
            <span className="relative flex items-center gap-2.5">
              <span>ENTER</span>
              <span className="inline-block w-3.5 h-[1px] bg-cyan-300/85 group-hover:w-5 transition-all duration-300" />
            </span>
          </button>

          <a
            href={IDENTITY_DATA.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Garv Shaw on GitHub (@garvshaw89-glitch)"
            className={`group inline-flex items-center gap-2 px-4 py-3.5 rounded-full border bg-[#080C15]/80 hover:bg-[#0D1524] font-mono text-[11px] tracking-[0.14em] transition-all duration-300 cursor-pointer ${
              isGitHubHovered
                ? 'border-cyan-300 text-slate-50 shadow-[0_0_22px_rgba(56,189,248,0.25)]'
                : 'border-white/[0.12] hover:border-sky-400/60 text-slate-300/80 hover:text-slate-50'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{IDENTITY_DATA.githubHandle}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300/85 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </footer>

      {/* 4. Seamless Studio Cross-Dissolve Veil synced to Camera Zoom-In */}
      <div
        ref={veilRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle at 50% 48%, rgba(10, 18, 32, 0.94) 0%, rgba(5, 6, 8, 1) 68%)',
        }}
      />
    </motion.div>
  );
};
