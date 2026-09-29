import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { rocketCinematicManager, CinematicState } from './matter/rocketCinematicManager';

interface NavbarProps {
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  onReplayIntro?: () => void;
  id?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
  onOpenCommandPalette,
  onReplayIntro,
  id = 'main-navbar',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-section');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cinematicStage, setCinematicStage] = useState<CinematicState['stage']>(
    rocketCinematicManager.state.stage
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicStage(state.stage);
    });
  }, []);

  // During the entire particle reconstruction and profile hold, fade out Navbar completely:
  const isProfileActive =
    cinematicStage === 'PROFILE_FORMING' ||
    cinematicStage === 'PROFILE_RECOGNIZABLE' ||
    cinematicStage === 'PROFILE_LOCKING' ||
    cinematicStage === 'PROFILE_COMPLETE' ||
    cinematicStage === 'PROFILE_HOLD' ||
    cinematicStage === 'TEXT_PREPARE' ||
    cinematicStage === 'NAME_REVEAL' ||
    cinematicStage === 'TAGLINE_REVEAL' ||
    cinematicStage === 'IDENTITY_COMPLETE';

  const navLinks = [
    { label: 'WORK', target: 'projects' },
    { label: 'ABOUT', target: 'about' },
    { label: 'CAPABILITIES', target: 'capabilities' },
    { label: 'DNA', target: 'digital-dna' },
    { label: 'ENGINEERING', target: 'github-telemetry' },
    { label: 'WRITING', target: 'writing' },
    { label: 'CONTACT', target: 'contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);

      const sectionIds = [
        'hero-section',
        'about',
        'capabilities',
        'digital-dna',
        'projects',
        'github-telemetry',
        'journey',
        'constellation',
        'writing',
        'contact',
      ];

      for (const sectionId of sectionIds) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 240 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (targetId === 'contact' && onContactClick) {
      onContactClick();
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 
        Transforming Navbar:
        - When at top (isScrolled === false): blends cleanly into hero layout with full-width luxury editorial header.
        - When scrolled (isScrolled === true): morphs smoothly into a floating, compact frosted glass pill.
      */}
      <header
        id={id}
        className={`fixed top-0 left-0 right-0 z-40 pointer-events-none transition-all duration-700 flex justify-center p-4 sm:p-6 ${
          isProfileActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? 'w-auto max-w-4xl px-4 sm:px-6 py-2.5 rounded-full bg-[#08090B]/85 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl'
              : 'w-full max-w-7xl px-2 sm:px-6 py-3 bg-transparent border-transparent'
          }`}
        >
          {/* Brand Mark */}
          <a
            href="#hero-section"
            data-cursor="link"
            data-cursor-label="HOME"
            onClick={(e) => handleNavClick(e, 'hero-section')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center font-display font-black text-xs text-white group-hover:border-cyan-400 group-hover:text-cyan-300 transition-colors">
              G
            </div>
            {!isScrolled && (
              <div className="hidden sm:flex flex-col">
                <span className="font-editorial text-sm font-bold tracking-tight text-white uppercase group-hover:text-cyan-300 transition-colors">
                  GARV SHAW
                </span>
                <span className="font-mono text-[9px] tracking-widest text-neutral-400 uppercase -mt-0.5">
                  DIGITAL ARCHITECT
                </span>
              </div>
            )}
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const isActive = activeSection === item.target;
              return (
                <a
                  key={item.target}
                  href={`#${item.target}`}
                  data-cursor="link"
                  data-cursor-label={item.label}
                  onClick={(e) => handleNavClick(e, item.target)}
                  className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-cyan-300 bg-white/5 font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Controls: Portal Replay + Cmd+K + Let's Talk CTA */}
          <div className="flex items-center gap-2">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                data-cursor="button"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Enter 3D Luxury Portal Experience"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] tracking-wider uppercase">PORTAL</span>
              </button>
            )}

            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                data-cursor="button"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Search command palette (Cmd+K)"
              >
                <Command className="w-3 h-3" />
                <span className="text-[10px]">K</span>
              </button>
            )}

            <button
              type="button"
              onClick={onContactClick}
              data-cursor="button"
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-cyan-300 text-black text-xs font-mono font-semibold tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              <span>CONNECT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer ml-1"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 top-20 z-40 p-6 rounded-3xl bg-[#08090B]/98 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((item) => (
                <a
                  key={item.target}
                  href={`#${item.target}`}
                  onClick={(e) => handleNavClick(e, item.target)}
                  className="px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider text-neutral-300 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
