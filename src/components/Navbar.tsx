import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, Menu, X, Sparkles } from 'lucide-react';
import { interactionEngine } from '../context/SingularityInteractionEngine';

interface NavbarProps {
  entered?: boolean;
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  onReplayIntro?: () => void;
  id?: string;
}

const BRAND_CHARS = 'GARV SHAW'.split('');

interface GlideGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  endScale: number;
  heroWidth: number;
  heroHeight: number;
  heroFontSize: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  entered = true,
  onContactClick,
  onOpenCommandPalette,
  onReplayIntro,
  id = 'main-navbar',
}) => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const brandAnchorRef = useRef<HTMLSpanElement | null>(null);
  const [glide, setGlide] = useState<GlideGeometry | null>(null);
  const [isBrandSettled, setIsBrandSettled] = useState(false);
  const prevEnteredRef = useRef(false);

  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const unsubscribe = interactionEngine.subscribe((state) => {
      setHasScrolled(state.scrollY > 40);
      if (state.activeSectionId) {
        setActiveSection(state.activeSectionId);
      }
    });

    return () => unsubscribe();
  }, []);

  // Measure exact resting top-left corner position and compute 50px center-to-corner glide
  useLayoutEffect(() => {
    if (!entered) {
      prevEnteredRef.current = false;
      setGlide(null);
      setIsBrandSettled(false);
      return;
    }

    if (prevEnteredRef.current) return;
    prevEnteredRef.current = true;

    if (prefersReducedMotion || !brandAnchorRef.current) {
      setGlide(null);
      setIsBrandSettled(true);
      return;
    }

    const rect = brandAnchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let heroFontSize = 110;

    // Measure exact rendered dimensions of 110px hero string in the same editorial font
    const measureEl = document.createElement('span');
    measureEl.textContent = 'GARV SHAW';
    measureEl.className = 'font-editorial font-bold tracking-tight whitespace-nowrap';
    measureEl.style.position = 'fixed';
    measureEl.style.visibility = 'hidden';
    measureEl.style.pointerEvents = 'none';
    measureEl.style.fontSize = `${heroFontSize}px`;
    measureEl.style.lineHeight = '1';
    document.body.appendChild(measureEl);
    let heroRect = measureEl.getBoundingClientRect();

    // Clamp cleanly on narrow mobile/tablet screens so the 110px title never clips horizontally
    const maxAllowedW = Math.max(240, vw - 48);
    if (heroRect.width > maxAllowedW) {
      heroFontSize = Math.max(36, Math.floor((heroFontSize * maxAllowedW) / heroRect.width));
      measureEl.style.fontSize = `${heroFontSize}px`;
      heroRect = measureEl.getBoundingClientRect();
    }
    document.body.removeChild(measureEl);

    const endScale = rect.width / Math.max(1, heroRect.width);
    const startX = (vw - heroRect.width) * 0.5;
    const startY = vh * 0.44 - heroRect.height * 0.5;

    setGlide({
      startX,
      startY,
      endX: rect.left,
      endY: rect.top + (rect.height - heroRect.height * endScale) * 0.5,
      endScale,
      heroWidth: heroRect.width,
      heroHeight: heroRect.height,
      heroFontSize,
    });
    setIsBrandSettled(false);
  }, [entered, prefersReducedMotion]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === 'contact' && onContactClick) {
      onContactClick();
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showFloatingHeroBrand =
    entered && !isBrandSettled && glide !== null && !prefersReducedMotion;

  return (
    <>
      <header
        id={id}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none ${
          hasScrolled
            ? 'bg-[#050608]/95 border-b border-white/[0.08] pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
            : 'bg-transparent border-b border-transparent pt-[max(1.25rem,env(safe-area-inset-top))] pb-5'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Top-Left: Identity / Minimalist Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data-cursor="button"
              data-cursor-label="TOP"
              className="flex items-center gap-2 group text-left cursor-pointer relative"
            >
              <span
                ref={brandAnchorRef}
                className="font-editorial text-sm sm:text-base font-bold tracking-tight text-[#F2F3F5] group-hover:text-white transition-opacity duration-200 whitespace-nowrap"
                style={{
                  opacity: entered && (isBrandSettled || prefersReducedMotion) ? 1 : 0,
                }}
              >
                GARV SHAW
              </span>
            </button>
          </div>

          {/* Desktop Top-Center/Right: Editorial Nav Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-[11px] font-mono tracking-widest uppercase text-[#A7ADB5]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              data-cursor="link"
              data-cursor-label="ABOUT"
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'about' ? 'text-[#F2F3F5]' : ''
              }`}
            >
              {activeSection === 'about' && (
                <span className="w-1 h-1 rounded-full bg-[#7EA7FF]" />
              )}
              <span>ABOUT</span>
            </button>

            <span className="text-white/10">/</span>

            <button
              type="button"
              onClick={() => scrollToSection('projects')}
              data-cursor="link"
              data-cursor-label="VIEW"
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'projects' ? 'text-[#F2F3F5]' : ''
              }`}
            >
              {activeSection === 'projects' && (
                <span className="w-1 h-1 rounded-full bg-[#7EA7FF]" />
              )}
              <span>PROJECTS</span>
            </button>

            <span className="text-white/10">/</span>

            <button
              type="button"
              onClick={() => scrollToSection('writing')}
              data-cursor="link"
              data-cursor-label="READ"
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'writing' ? 'text-[#F2F3F5]' : ''
              }`}
            >
              {activeSection === 'writing' && (
                <span className="w-1 h-1 rounded-full bg-[#7EA7FF]" />
              )}
              <span>WRITING</span>
            </button>

            <span className="text-white/10">/</span>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              data-cursor="link"
              data-cursor-label="TALK"
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'contact' ? 'text-[#F2F3F5]' : ''
              }`}
            >
              {activeSection === 'contact' && (
                <span className="w-1 h-1 rounded-full bg-[#7EA7FF]" />
              )}
              <span>CONTACT</span>
            </button>
          </nav>

          {/* Top-Right: Transparent Editorial Quick Actions (Intro Replay, Command Palette) */}
          <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest uppercase text-[#A7ADB5]">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                data-cursor="link"
                data-cursor-label="INTRO"
                aria-label="Replay Cinematic Entrance Experience"
                title="Replay Cinematic Entrance Experience"
                className="flex items-center gap-1.5 bg-transparent text-[#A7ADB5] hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">INTRO</span>
              </button>
            )}

            {onReplayIntro && onOpenCommandPalette && (
              <span className="hidden sm:inline text-white/10">/</span>
            )}

            {onOpenCommandPalette && (
              <button
                type="button"
                id="cmd-palette-trigger"
                onClick={onOpenCommandPalette}
                data-cursor="link"
                data-cursor-label="CMD"
                aria-label="Open Command Palette"
                className="flex items-center gap-1.5 bg-transparent text-[#A7ADB5] hover:text-[#F2F3F5] transition-colors cursor-pointer"
              >
                <Command className="w-3 h-3 text-[#7EA7FF]" />
                <span className="hidden sm:inline">MENU</span>
                <kbd className="hidden lg:inline text-[9px] text-[#626A73] pl-0.5 font-sans">⌘K</kbd>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden p-1.5 text-[#A7ADB5] hover:text-[#F2F3F5] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B0E12] border-b border-white/10 px-6 py-6 flex flex-col gap-4 text-xs font-mono tracking-widest uppercase">
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
            >
              01 · ABOUT
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('projects')}
              className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
            >
              02 · PROJECTS
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('writing')}
              className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
            >
              03 · WRITING
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
            >
              04 · CONTACT
            </button>
            {onReplayIntro && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReplayIntro();
                }}
                className="text-left text-cyan-400 hover:text-cyan-300 py-2 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>REPLAY CINEMATIC INTRO</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Monumental 110px Futuristic Center-to-Top-Left Corner Entrance for GARV SHAW */}
      <AnimatePresence>
        {showFloatingHeroBrand && glide && (
          <motion.div
            key="garv-shaw-110px-entrance"
            aria-hidden="true"
            className="fixed left-0 top-0 z-50 pointer-events-none select-none"
            style={{
              transformOrigin: '0% 0%',
              willChange: 'transform, opacity, filter',
            }}
            initial={{
              x: glide.startX,
              y: glide.startY,
              scale: 1,
              opacity: 0,
              filter: 'blur(16px)',
            }}
            animate={{
              x: [glide.startX, glide.startX, glide.endX],
              y: [glide.startY, glide.startY, glide.endY],
              scale: [1.04, 1, glide.endScale],
              opacity: [0, 1, 1],
              filter: ['blur(16px)', 'blur(0px)', 'blur(0px)'],
            }}
            transition={{
              duration: 2.75,
              times: [0, 0.48, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => setIsBrandSettled(true)}
          >
            <div className="relative inline-block">
              {/* Futuristic targeting brackets around 110px title in center, dissolving on slide */}
              <motion.div
                initial={{ opacity: 0, scaleX: 1.25 }}
                animate={{ opacity: [0, 0.9, 0.9, 0], scaleX: [1.25, 1, 1, 0.92] }}
                transition={{ duration: 1.55, times: [0, 0.25, 0.72, 1], ease: 'easeOut' }}
                className="absolute -inset-x-7 -inset-y-4 pointer-events-none"
              >
                <span className="absolute left-0 top-0 w-5 h-5 border-t-[1.5px] border-l-[1.5px] border-cyan-400/85" />
                <span className="absolute right-0 top-0 w-5 h-5 border-t-[1.5px] border-r-[1.5px] border-cyan-400/85" />
                <span className="absolute left-0 bottom-0 w-5 h-5 border-b-[1.5px] border-l-[1.5px] border-cyan-400/85" />
                <span className="absolute right-0 bottom-0 w-5 h-5 border-b-[1.5px] border-r-[1.5px] border-cyan-400/85" />
              </motion.div>

              {/* Futuristic horizontal plasma trace underline */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.95, 0.85, 0] }}
                transition={{ duration: 1.5, times: [0, 0.3, 0.75, 1], ease: 'easeInOut' }}
                className="absolute left-0 right-0 -bottom-3 h-[2px] origin-center bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_rgba(56,189,248,0.9)]"
              />

              {/* Crisp 110px Editorial Typography with Staggered Hologram Reveal & Laser Sweep */}
              <div
                className="relative font-editorial font-bold tracking-tight leading-none whitespace-nowrap overflow-hidden"
                style={{ fontSize: `${glide.heroFontSize}px` }}
              >
                {BRAND_CHARS.map((ch, idx) => (
                  <motion.span
                    key={idx}
                    className="inline-block text-[#F2F3F5]"
                    style={{
                      textShadow:
                        '0 0 32px rgba(56, 189, 248, 0.68), 0 0 68px rgba(126, 167, 255, 0.38)',
                    }}
                    initial={{ opacity: 0, y: 24, scaleY: 0.7 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </motion.span>
                ))}

                {/* Holographic Cyan Laser Scan Beam Sweeping Across Letters */}
                <motion.span
                  aria-hidden="true"
                  initial={{ x: '-115%', opacity: 0 }}
                  animate={{ x: ['-115%', '120%'], opacity: [0, 0.9, 0.9, 0] }}
                  transition={{ duration: 1.05, delay: 0.28, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-36 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(125,211,252,0.55) 45%, rgba(255,255,255,0.88) 50%, rgba(56,189,248,0.5) 55%, transparent 100%)',
                    mixBlendMode: 'screen',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
