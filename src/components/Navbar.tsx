import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  const [startOffset, setStartOffset] = useState<{ x: number; y: number } | null>(null);
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

  // Measure center-to-top-left glide offset cleanly right when user enters the main page
  useLayoutEffect(() => {
    if (!entered) {
      prevEnteredRef.current = false;
      setStartOffset(null);
      setIsBrandSettled(false);
      return;
    }

    if (prevEnteredRef.current) return;
    prevEnteredRef.current = true;

    if (prefersReducedMotion || !brandAnchorRef.current) {
      setStartOffset({ x: 0, y: 0 });
      setIsBrandSettled(true);
      return;
    }

    const rect = brandAnchorRef.current.getBoundingClientRect();
    const startScale = window.innerWidth < 640 ? 1.85 : 2.35;
    const scaledWidth = rect.width * startScale;
    const centerX = Math.max(0, window.innerWidth * 0.5 - scaledWidth * 0.5);
    const centerY = window.innerHeight * 0.42;

    setStartOffset({
      x: centerX - rect.left,
      y: centerY - rect.top,
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

  const shouldAnimateBrand = entered && startOffset !== null && !prefersReducedMotion;

  return (
    <header
      id={id}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none ${
        hasScrolled
          ? 'bg-[#050608]/75 backdrop-blur-md border-b border-white/[0.08] pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5'
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
            {/* Invisible layout anchor ensures exact top-left resting box coordinates */}
            <span
              ref={brandAnchorRef}
              className="font-editorial text-sm sm:text-base font-bold tracking-tight inline-block relative"
              style={{ opacity: entered ? 1 : 0 }}
            >
              <span aria-hidden="true" className="opacity-0 pointer-events-none select-none">
                GARV SHAW
              </span>

              {shouldAnimateBrand ? (
                <motion.span
                  key="garv-shaw-entrance"
                  className="inline-flex items-baseline whitespace-nowrap absolute left-0 top-0 pointer-events-none"
                  style={{ transformOrigin: '0% 50%', willChange: 'transform, opacity, filter' }}
                  initial={{
                    x: startOffset.x,
                    y: startOffset.y,
                    scale: typeof window !== 'undefined' && window.innerWidth < 640 ? 1.85 : 2.35,
                    opacity: 0,
                    filter: 'blur(10px)',
                    letterSpacing: '0.28em',
                    textShadow: '0 0 28px rgba(125, 211, 252, 0.95)',
                  }}
                  animate={{
                    x: [startOffset.x, startOffset.x, 0],
                    y: [startOffset.y, startOffset.y, 0],
                    scale: [
                      typeof window !== 'undefined' && window.innerWidth < 640 ? 1.85 : 2.35,
                      typeof window !== 'undefined' && window.innerWidth < 640 ? 1.95 : 2.45,
                      1,
                    ],
                    opacity: [0, 1, 1],
                    filter: ['blur(10px)', 'blur(0px)', 'blur(0px)'],
                    letterSpacing: ['0.28em', '0.16em', '-0.025em'],
                    textShadow: [
                      '0 0 28px rgba(125, 211, 252, 0.95)',
                      '0 0 22px rgba(56, 189, 248, 0.72)',
                      '0 0 0px rgba(56, 189, 248, 0)',
                    ],
                  }}
                  transition={{
                    duration: 2.25,
                    times: [0, 0.44, 1],
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onAnimationComplete={() => setIsBrandSettled(true)}
                >
                  {BRAND_CHARS.map((ch, idx) => (
                    <motion.span
                      key={idx}
                      className="inline-block text-[#F2F3F5] group-hover:text-white transition-colors"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.55,
                        delay: idx * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {ch === ' ' ? '\u00A0' : ch}
                    </motion.span>
                  ))}
                </motion.span>
              ) : (
                <span className="absolute left-0 top-0 text-[#F2F3F5] group-hover:text-white transition-colors whitespace-nowrap">
                  GARV SHAW
                </span>
              )}
            </span>

            <motion.span
              initial={false}
              animate={{
                opacity: entered && (isBrandSettled || prefersReducedMotion) ? 1 : 0,
                x: entered && (isBrandSettled || prefersReducedMotion) ? 0 : -10,
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="hidden lg:inline-block font-mono text-[10px] text-[#626A73] tracking-widest pl-1 border-l border-white/10"
            >
              SYS // 2026
            </motion.span>
          </button>

          {/* Dynamic Sticky Section Indicator in Navbar */}
          {hasScrolled && (
            <div className="hidden lg:flex items-center gap-1.5 pl-2.5 border-l border-white/10 animate-fadeIn">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300 font-semibold">
                {activeSection === 'hero-section'
                  ? 'HERO'
                  : activeSection === 'about'
                  ? 'ABOUT'
                  : activeSection === 'capabilities'
                  ? 'CAPABILITIES'
                  : activeSection === 'digital-dna'
                  ? 'DIGITAL DNA'
                  : activeSection === 'projects'
                  ? 'PROJECTS'
                  : activeSection === 'github-telemetry'
                  ? 'GITHUB'
                  : activeSection === 'journey'
                  ? 'JOURNEY'
                  : activeSection === 'constellation'
                  ? 'CONSTELLATION'
                  : activeSection === 'writing'
                  ? 'WRITING'
                  : activeSection === 'ai-lab'
                  ? 'AI LAB'
                  : activeSection === 'contact'
                  ? 'CONTACT'
                  : activeSection.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Top-Center/Right: Editorial Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-[11px] font-mono tracking-widest uppercase text-[#A7ADB5]"
        >
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

        {/* Top-Right: Quick Actions (Intro Replay, Command Palette) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Replay Cinematic Intro Portal Button */}
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              data-cursor="button"
              data-cursor-label="INTRO"
              aria-label="Replay Cinematic Entrance Experience"
              title="Replay Cinematic Entrance Experience"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/[0.08] hover:border-cyan-400/40 bg-[#11151A]/60 hover:bg-[#171C22] text-[#A7ADB5] hover:text-cyan-300 font-mono text-[10px] tracking-wider transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">INTRO</span>
            </button>
          )}

          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              type="button"
              id="cmd-palette-trigger"
              onClick={onOpenCommandPalette}
              data-cursor="button"
              data-cursor-label="CMD"
              aria-label="Open Command Palette"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/[0.08] hover:border-white/20 bg-[#11151A]/60 hover:bg-[#171C22] text-[#A7ADB5] hover:text-[#F2F3F5] font-mono text-[10px] tracking-wider transition-colors cursor-pointer"
            >
              <Command className="w-3 h-3 text-[#7EA7FF]" />
              <span className="hidden sm:inline">MENU</span>
              <kbd className="hidden lg:inline text-[9px] text-[#626A73] pl-1 font-sans">⌘K</kbd>
            </button>
          )}

          {/* Mobile Hamburger */}
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
            onClick={() => scrollToSection('writing')}
            className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
          >
            01 // WRITING
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('projects')}
            className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
          >
            02 // PROJECTS
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
          >
            03 // ABOUT
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2 border-b border-white/[0.04]"
          >
            04 // CONTACT
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
  );
};
