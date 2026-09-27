import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'hero-section', label: '00 // HERO' },
  { id: 'about', label: '01 // PROFILE' },
  { id: 'skills', label: '02 // COMPETENCIES' },
  { id: 'constellation', label: '03 // TOPOLOGY' },
  { id: 'projects', label: '04 // WORK' },
  { id: 'architecture', label: '05 // ARCHITECTURE' },
  { id: 'ai-lab', label: '06 // AI LAB' },
  { id: 'build-log', label: '07 // BUILD LOG' },
  { id: 'contact', label: '08 // TRANSMISSION' },
];

export const SectionProgressHUD: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero-section');

  useEffect(() => {
    const handleScroll = () => {
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
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
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3 select-none pointer-events-auto"
    >
      {SECTIONS.map((sec, idx) => {
        const isActive = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            onClick={() => scrollToSection(sec.id)}
            className="group flex items-center gap-2 cursor-pointer py-1"
            title={`Jump to ${sec.label}`}
          >
            <span
              className={`font-mono text-[9px] uppercase tracking-wider transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                isActive ? 'text-cyan-300 font-bold opacity-100' : 'text-slate-400'
              }`}
            >
              {sec.label}
            </span>
            <span
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-2 h-6 bg-cyan-400 shadow-[0_0_12px_#06b6d4]'
                  : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-cyan-300 group-hover:scale-125'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};
