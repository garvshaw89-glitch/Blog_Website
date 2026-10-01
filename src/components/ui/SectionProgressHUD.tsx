import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'hero-section', label: '00 // HERO' },
  { id: 'about', label: '01 // ABOUT' },
  { id: 'capabilities', label: '02 // CAPABILITIES' },
  { id: 'digital-dna', label: '03 // DNA' },
  { id: 'projects', label: '04 // WORK' },
  { id: 'github-telemetry', label: '05 // GITHUB' },
  { id: 'journey', label: '06 // JOURNEY' },
  { id: 'constellation', label: '07 // TOPOLOGY' },
  { id: 'writing', label: '08 // WRITING' },
  { id: 'ai-lab', label: '09 // AI LAB' },
  { id: 'contact', label: '10 // CONTACT' },
];

export const SectionProgressHUD: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero-section');

  useEffect(() => {
    const handleScroll = () => {
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260 && rect.bottom >= 220) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      aria-label="Section navigation timeline"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-2.5 select-none pointer-events-auto"
    >
      {SECTIONS.map((sec) => {
        const isActive = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            onClick={() => scrollToSection(sec.id)}
            data-cursor="button"
            className="group flex items-center gap-2 cursor-pointer py-1"
            title={`Jump to ${sec.label}`}
          >
            <span
              className={`font-mono text-[9px] uppercase tracking-wider transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                isActive ? 'text-cyan-300 font-bold opacity-100' : 'text-neutral-500'
              }`}
            >
              {sec.label}
            </span>
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                  : 'w-1.5 bg-white/20 group-hover:bg-white/50 group-hover:w-3'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};
