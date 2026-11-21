import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Code2,
  FolderGit2,
  Sparkles,
  Layers,
  Terminal,
  ExternalLink,
  Mail,
  Linkedin,
  Github,
  X,
  Compass,
  FileCode,
  Rocket,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { PROJECTS } from '../../data/portfolioData';

interface CommandItem {
  id: string;
  title: string;
  keywords?: string;
  category: 'Project' | 'Navigation' | 'Lab' | 'Social' | 'System';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjectModal?: (projectId: string) => void;
}

function openExternalViaAnchor(url: string) {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenProjectModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollTo = (id: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setStatusFeedback(`Copied ${label}`);
      window.setTimeout(() => {
        setStatusFeedback(null);
        onClose();
      }, 650);
    }
  };

  const projectCommands: CommandItem[] = PROJECTS.map((proj) => ({
    id: `proj-${proj.id}`,
    title: `Open Case Study: ${proj.title} (${proj.category})`,
    keywords: `${proj.title} ${proj.category} ${proj.tags.join(' ')}`,
    category: 'Project',
    shortcut: proj.number,
    icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    action: () => {
      onClose();
      if (onOpenProjectModal) {
        setTimeout(() => onOpenProjectModal(proj.id), 100);
      } else {
        scrollTo('projects');
      }
    },
  }));

  const commands: CommandItem[] = [
    ...projectCommands,
    {
      id: 'nav-work',
      title: 'View Selected Projects Showcase',
      category: 'Navigation',
      shortcut: '↵ 01',
      icon: <FolderGit2 className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('projects'),
    },
    {
      id: 'nav-lab',
      title: 'Open AI Engineering Lab (TF-IDF RAG & Agent Traces)',
      keywords: 'rag cosine vector agent gemini',
      category: 'Lab',
      shortcut: '↵ 02',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('ai-lab'),
    },
    {
      id: 'nav-arch',
      title: 'Inspect System Architecture & Digital DNA',
      category: 'Navigation',
      shortcut: '↵ 03',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      action: () => scrollTo('digital-dna'),
    },
    {
      id: 'nav-skills',
      title: 'Explore Engineering Competencies & Capabilities',
      category: 'Navigation',
      shortcut: '↵ 04',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      action: () => scrollTo('capabilities'),
    },
    {
      id: 'nav-constellation',
      title: 'View Technology Constellation Graph',
      category: 'Navigation',
      icon: <Compass className="w-4 h-4 text-purple-400" />,
      action: () => scrollTo('constellation'),
    },
    {
      id: 'nav-writing',
      title: 'Read Engineering Essays & Publications',
      category: 'Navigation',
      icon: <FileCode className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('writing'),
    },
    {
      id: 'nav-journey',
      title: 'View Engineering Journey & Milestones',
      category: 'Navigation',
      shortcut: '↵ 05',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => scrollTo('journey'),
    },
    {
      id: 'nav-about',
      title: 'About Garv Shaw & Engineering Profile',
      category: 'Navigation',
      icon: <FileCode className="w-4 h-4 text-slate-400" />,
      action: () => scrollTo('about'),
    },
    {
      id: 'nav-github-stats',
      title: 'Inspect Live GitHub Telemetry & Repositories',
      category: 'System',
      icon: <Github className="w-4 h-4 text-slate-300" />,
      action: () => scrollTo('github-telemetry'),
    },
    {
      id: 'action-copy-email',
      title: 'Copy Email Address (garvshawinfo@gmail.com)',
      keywords: 'clipboard email contact',
      category: 'System',
      icon: <Copy className="w-4 h-4 text-emerald-400" />,
      action: () => copyText('garvshawinfo@gmail.com', 'email address'),
    },
    {
      id: 'action-copy-github',
      title: 'Copy GitHub Handle (@garvshaw89-glitch)',
      keywords: 'clipboard username github',
      category: 'System',
      icon: <Copy className="w-4 h-4 text-sky-400" />,
      action: () => copyText('@garvshaw89-glitch', 'GitHub handle'),
    },
    {
      id: 'action-contact',
      title: 'Send Message / Start Inquiry',
      category: 'Social',
      icon: <Mail className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('contact'),
    },
    {
      id: 'ext-github',
      title: 'Open GitHub Profile (garvshaw89-glitch)',
      category: 'Social',
      icon: <ExternalLink className="w-4 h-4 text-slate-400" />,
      action: () => {
        openExternalViaAnchor('https://github.com/garvshaw89-glitch');
        onClose();
      },
    },
    {
      id: 'ext-linkedin',
      title: 'Open LinkedIn Profile (Garv Shaw)',
      category: 'Social',
      icon: <Linkedin className="w-4 h-4 text-blue-400" />,
      action: () => {
        openExternalViaAnchor('https://linkedin.com/in/garv-shaw-08a33237b');
        onClose();
      },
    },
    {
      id: 'action-launch-rocket',
      title: 'Ignite Particle Launch Burst Effect',
      category: 'System',
      shortcut: 'R',
      icon: <Rocket className="w-4 h-4 text-amber-400" />,
      action: () => {
        interactionEngine.triggerRocketLaunch(0, -0.92);
        onClose();
      },
    },
  ];

  const q = query.toLowerCase().trim();
  const filtered = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.keywords && cmd.keywords.toLowerCase().includes(q))
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setStatusFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="command-palette-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/90"
      >
        <motion.div
          id="command-palette-dialog"
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#090E17] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.18)] overflow-hidden mt-12 sm:mt-0"
        >
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0c1320]">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search projects, case studies, sections, or actions..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {statusFeedback && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-mono text-emerald-300 shrink-0">
                <Check className="w-3 h-3" />
                {statusFeedback}
              </span>
            )}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                data-cursor="button"
                aria-label="Clear search query"
                className="text-slate-400 hover:text-white p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-400 border border-white/10">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-sans text-sm">
                No matching commands found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    data-cursor="button"
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-white translate-x-0.5'
                        : 'text-slate-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-medium tracking-wide">
                          {item.title}
                        </span>
                        <span className="ml-2 font-mono text-[10px] uppercase text-cyan-400/80">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    {item.shortcut && (
                      <span className="font-mono text-xs text-slate-400 shrink-0 ml-2">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2.5 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Execute</span>
              <span>ESC Close</span>
            </div>
            <span className="text-cyan-400/90 font-medium">Garv Shaw · Engineering Suite</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
