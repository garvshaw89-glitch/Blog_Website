import React, { useState, useEffect } from 'react';
import { Command, ExternalLink, Menu, X } from 'lucide-react';
import { interactionEngine } from '../context/SingularityInteractionEngine';

interface NavbarProps {
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  onReplayIntro?: () => void;
  id?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
  onOpenCommandPalette,
  id = 'main-navbar',
}) => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = interactionEngine.subscribe((state) => {
      setHasScrolled(state.scrollY > 40);
      if (state.activeSectionId) {
        setActiveSection(state.activeSectionId);
      }
    });

    return () => unsubscribe();
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
    <header
      id={id}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none ${
        hasScrolled
          ? 'bg-[#050608]/75 backdrop-blur-md border-b border-white/[0.08] py-3.5'
          : 'bg-transparent border-b border-transparent py-5'
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
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <span className="font-editorial text-sm sm:text-base font-bold tracking-tight text-[#F2F3F5] group-hover:text-white transition-colors">
              GARV SHAW
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-[#626A73] tracking-widest pl-1 border-l border-white/10">
              SYS // 2026
            </span>
          </button>

          {/* Dynamic Sticky Section Indicator in Navbar */}
          {hasScrolled && (
            <div className="hidden sm:flex items-center gap-1.5 pl-2.5 border-l border-white/10 animate-fadeIn">
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

        {/* Top-Right: Quick Actions (Command Palette) */}
        <div className="flex items-center gap-3">

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
            className="text-left text-[#A7ADB5] hover:text-[#F2F3F5] py-2"
          >
            04 // CONTACT
          </button>
        </div>
      )}
    </header>
  );
};
