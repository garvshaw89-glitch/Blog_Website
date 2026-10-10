import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Compass } from 'lucide-react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

export interface SectionMeta {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
}

export const PORTFOLIO_SECTIONS: SectionMeta[] = [
  {
    id: 'hero-section',
    number: '00',
    title: 'OVERVIEW',
    subtitle: 'SYSTEM CORE & IDENTITY',
    category: 'ARCHITECT',
  },
  {
    id: 'about',
    number: '01',
    title: 'ABOUT',
    subtitle: 'ENGINEERING PHILOSOPHY & BACKGROUND',
    category: 'IDENTITY',
  },
  {
    id: 'capabilities',
    number: '02',
    title: 'CAPABILITIES',
    subtitle: 'AI, CLOUD ARCHITECTURE & SYSTEMS',
    category: 'SPECIALIZATION',
  },
  {
    id: 'digital-dna',
    number: '03',
    title: 'DIGITAL DNA',
    subtitle: 'SYSTEMIC NETWORK TOPOLOGY',
    category: 'FOUNDATION',
  },
  {
    id: 'projects',
    number: '04',
    title: 'PROJECTS',
    subtitle: 'PRODUCTION PLATFORMS & CASE STUDIES',
    category: 'PORTFOLIO',
  },
  {
    id: 'github-telemetry',
    number: '05',
    title: 'GITHUB',
    subtitle: 'LIVE CODE TELEMETRY & REPOSITORIES',
    category: 'CODEBASE',
  },
  {
    id: 'journey',
    number: '06',
    title: 'JOURNEY',
    subtitle: 'CHRONOLOGICAL CAREER TIMELINE',
    category: 'MILESTONES',
  },
  {
    id: 'constellation',
    number: '07',
    title: 'CONSTELLATION',
    subtitle: 'INTERACTIVE TECH MATRIX',
    category: 'TOPOLOGY',
  },
  {
    id: 'writing',
    number: '08',
    title: 'WRITING',
    subtitle: 'RESEARCH, ARTICLES & ARCHITECTURE ESSAYS',
    category: 'PUBLICATIONS',
  },
  {
    id: 'ai-lab',
    number: '09',
    title: 'AI LAB',
    subtitle: 'EXPERIMENTAL NEURAL PLAYGROUND',
    category: 'RESEARCH',
  },
  {
    id: 'contact',
    number: '10',
    title: 'CONTACT',
    subtitle: 'DIRECT COMM TRANSMISSION',
    category: 'DISPATCH',
  },
];

interface StickySectionHeaderProps {
  className?: string;
  onNavigateToSection?: (sectionId: string) => void;
}

export const StickySectionHeader: React.FC<StickySectionHeaderProps> = ({
  className = '',
  onNavigateToSection,
}) => {
  const [activeSection, setActiveSection] = useState<SectionMeta>(PORTFOLIO_SECTIONS[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [sectionProgress, setSectionProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = interactionEngine.subscribe((state) => {
      setIsVisible(state.scrollY > 160);

      if (state.activeSectionId) {
        const matched = PORTFOLIO_SECTIONS.find((sec) => sec.id === state.activeSectionId);
        if (matched) {
          setActiveSection(matched);
        }
      }
      setSectionProgress(Math.round(state.scrollProgress * 100));
    });

    return () => unsubscribe();
  }, []);

  const handleJump = (id: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      aria-label="Sticky Section Indicator"
      className={`fixed top-14 left-0 right-0 z-30 pointer-events-none transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      } ${className}`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between py-2 px-3.5 sm:px-4 rounded-md bg-[#080B10]/85 backdrop-blur-md border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto">
          {/* Left: Dynamic Current Section indicator with fluid animated text transition */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-hidden">
            {/* Live radar status beacon */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="font-mono text-[9px] text-[#55606E] tracking-widest uppercase hidden md:inline">
                LOC //
              </span>
            </div>

            {/* Section Index Badge */}
            <div className="font-mono text-[10px] sm:text-xs text-cyan-300 font-semibold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 shrink-0">
              {activeSection.number}
            </div>

            <ChevronRight className="w-3 h-3 text-white/20 shrink-0 hidden sm:block" />

            {/* Dynamically shifting section title */}
            <div className="relative h-6 flex items-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSection.id}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <span className="font-editorial text-xs sm:text-sm font-bold tracking-wider text-[#F2F3F5] uppercase">
                    {activeSection.title}
                  </span>

                  <span className="hidden lg:inline text-white/20">|</span>

                  <span className="hidden lg:inline font-mono text-[10px] text-[#8A94A0] tracking-wider uppercase">
                    {activeSection.subtitle}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Quick Segment Navigator Pill & Section Progress Micro-bar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Minimalist In-Section Reading Progress Bar */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-[#626A73]">
              <span className="hidden md:inline">SEC PROGRESS</span>
              <div className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-[#7EA7FF] transition-all duration-150"
                  style={{ width: `${Math.round(sectionProgress)}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-cyan-400">
                {Math.round(sectionProgress)}%
              </span>
            </div>

            {/* Quick jump to Next / Prev or Direct Jump Links */}
            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 sm:pl-3">
              <button
                type="button"
                onClick={() => {
                  const currentIndex = PORTFOLIO_SECTIONS.findIndex((s) => s.id === activeSection.id);
                  const prevIndex = Math.max(0, currentIndex - 1);
                  handleJump(PORTFOLIO_SECTIONS[prevIndex].id);
                }}
                disabled={activeSection.id === PORTFOLIO_SECTIONS[0].id}
                aria-label="Previous section"
                title="Previous section"
                data-cursor="button"
                data-cursor-label="PREV"
                className="p-1 text-[#8A94A0] hover:text-[#F2F3F5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold">▲</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentIndex = PORTFOLIO_SECTIONS.findIndex((s) => s.id === activeSection.id);
                  const nextIndex = Math.min(PORTFOLIO_SECTIONS.length - 1, currentIndex + 1);
                  handleJump(PORTFOLIO_SECTIONS[nextIndex].id);
                }}
                disabled={activeSection.id === PORTFOLIO_SECTIONS[PORTFOLIO_SECTIONS.length - 1].id}
                aria-label="Next section"
                title="Next section"
                data-cursor="button"
                data-cursor-label="NEXT"
                className="p-1 text-[#8A94A0] hover:text-[#F2F3F5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold">▼</span>
              </button>

              {/* Direct Jump to Projects or Contact fast */}
              <button
                type="button"
                onClick={() => handleJump('projects')}
                data-cursor="button"
                data-cursor-label="PROJECTS"
                className={`hidden md:inline-flex items-center px-2 py-0.5 ml-1 text-[9px] font-mono tracking-wider rounded transition-colors ${
                  activeSection.id === 'projects'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-[#8A94A0] hover:text-[#F2F3F5] hover:bg-white/[0.04]'
                }`}
              >
                WORK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
