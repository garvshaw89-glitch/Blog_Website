import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command, Menu, X, Sparkles } from 'lucide-react';
import { interactionEngine } from '../context/SingularityInteractionEngine';
import { NavbarHangingIdCard } from './intro/identity/NavbarHangingIdCard';

interface NavbarProps {
  entered?: boolean;
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  onReplayIntro?: () => void;
  id?: string;
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
  const [isBrandSettled, setIsBrandSettled] = useState(false);

  const brandAnchorRef = useRef<HTMLSpanElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = interactionEngine.subscribe((state) => {
      const nextScrolled = state.scrollY > 40;
      setHasScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
      if (state.activeSectionId) {
        const nextSection = state.activeSectionId;
        setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
      }
    }, 'scroll');

    return () => unsubscribe();
  }, []);

  // Reset top-left GARV SHAW wordmark visibility whenever the intro replays
  useEffect(() => {
    if (!entered) {
      setIsBrandSettled(false);
    }
  }, [entered]);

  // Close mobile drawer on Escape or resize to desktop
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileMenuOpen]);

  const handleBrandSettled = useCallback(() => {
    setIsBrandSettled(true);
  }, []);

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
          {/* Top-Left: GARV SHAW Brand Wordmark (receives the name detached from the hanging ID card) */}
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
                  opacity: entered && isBrandSettled ? 1 : 0,
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
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
              className={`transition-colors hover:text-[#F2F3F5] cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
                className="flex items-center gap-1.5 bg-transparent text-[#A7ADB5] hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
                className="flex items-center gap-1.5 bg-transparent text-[#A7ADB5] hover:text-[#F2F3F5] transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
              aria-expanded={mobileMenuOpen}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#A7ADB5] hover:text-[#F2F3F5] cursor-pointer -mr-2"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer + Outside-Click Dismiss Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 top-[4.25rem] bg-black/70 z-30"
            />
            <div
              ref={drawerRef}
              className="md:hidden relative z-40 bg-[#0B0E12] border-b border-white/10 px-6 py-4 flex flex-col gap-1 text-xs font-mono tracking-widest uppercase max-h-[calc(100dvh-4.5rem)] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
            >
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] min-h-[44px] flex items-center border-b border-white/[0.04]"
              >
                01 · ABOUT
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('projects')}
                className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] min-h-[44px] flex items-center border-b border-white/[0.04]"
              >
                02 · PROJECTS
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('writing')}
                className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] min-h-[44px] flex items-center border-b border-white/[0.04]"
              >
                03 · WRITING
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('ai-lab')}
                className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] min-h-[44px] flex items-center border-b border-white/[0.04]"
              >
                04 · AI ENGINEERING LAB
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] min-h-[44px] flex items-center border-b border-white/[0.04]"
              >
                05 · CONTACT
              </button>
              {onReplayIntro && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onReplayIntro();
                  }}
                  className="text-left text-cyan-400 hover:text-cyan-300 min-h-[44px] flex items-center gap-2 pt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>REPLAY CINEMATIC INTRO</span>
                </button>
              )}
            </div>
          </>
        )}
      </header>

      {/* Big Hanging 3D ID Card -> Extracts GARV SHAW to Top-Left Corner -> Retracts Back Up */}
      <NavbarHangingIdCard
        entered={entered}
        anchorRef={brandAnchorRef}
        onBrandSettled={handleBrandSettled}
      />
    </>
  );
};
