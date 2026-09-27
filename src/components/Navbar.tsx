import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  id?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
  onOpenCommandPalette,
  id = 'main-navbar',
}) => {
  const [activeSection, setActiveSection] = useState('hero-section');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'About', target: 'about' },
    { label: 'Work', target: 'projects' },
    { label: 'Lab', target: 'ai-lab', isLab: true },
    { label: 'Architecture', target: 'architecture' },
    { label: 'Log', target: 'build-log' },
    { label: 'Contact', target: 'contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      // Section intersection detection
      const sectionIds = ['hero-section', 'about', 'skills', 'constellation', 'projects', 'architecture', 'ai-lab', 'build-log', 'contact'];
      for (const sectionId of sectionIds) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (targetId === 'contact' && onContactClick) {
      onContactClick();
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      id={id}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isScrolled ? 1 : 0,
        y: isScrolled ? 0 : -20,
        pointerEvents: isScrolled ? 'auto' : 'none',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 py-3 bg-[#05070A]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between">
        {/* Brand / Logo */}
        <a
          href="#hero-section"
          data-magnetic="true"
          onClick={(e) => scrollToSection(e, 'hero-section')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all">
            <div className="w-full h-full bg-[#05070a] rounded-[7px] flex items-center justify-center font-display font-black text-xs text-cyan-300">
              GS
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-sm tracking-wider uppercase text-white group-hover:text-cyan-300 transition-colors">
              GARV
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80 -mt-1 hidden sm:inline">
              AI + Cloud
            </span>
          </div>
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#0E1524]/60 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {navLinks.map((link) => {
            const isActive = activeSection === link.target;
            return (
              <a
                key={link.target}
                href={`#${link.target}`}
                data-magnetic="true"
                data-cursor="link"
                data-cursor-label="NAV"
                onClick={(e) => scrollToSection(e, link.target)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-cyan-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-full bg-cyan-500/20 border border-cyan-400/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {link.isLab && <Sparkles className="w-3 h-3 text-cyan-400" />}
                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Action: Command Palette Trigger + Contact */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="cmd-palette-trigger"
            type="button"
            data-magnetic="true"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 hover:text-white transition-all text-xs font-mono cursor-pointer"
            title="Search Garv's portfolio (Cmd + K)"
          >
            <Command className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-400 border border-white/10">
              ⌘K
            </kbd>
          </button>

          <a
            href="#contact"
            data-magnetic="true"
            onClick={(e) => scrollToSection(e, 'contact')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] transition-all cursor-pointer"
          >
            Connect
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#070D18]/95 border-b border-white/10 backdrop-blur-2xl px-6 py-6 overflow-hidden"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.target}
                  href={`#${link.target}`}
                  onClick={(e) => scrollToSection(e, link.target)}
                  className="flex items-center justify-between py-2 text-sm font-mono uppercase tracking-wider text-slate-200 hover:text-cyan-300 border-b border-white/5"
                >
                  <span className="flex items-center gap-2">
                    {link.isLab && <Sparkles className="w-4 h-4 text-cyan-400" />}
                    {link.label}
                  </span>
                  <span className="text-slate-500 text-xs">→</span>
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCommandPalette?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono"
                >
                  <Command className="w-4 h-4 text-cyan-400" />
                  <span>Open Command Palette (⌘K)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
