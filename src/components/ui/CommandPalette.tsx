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
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Lab' | 'Social' | 'System';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjectModal?: (projectId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenProjectModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  const commands: CommandItem[] = [
    {
      id: 'nav-work',
      title: 'View Selected Projects',
      category: 'Navigation',
      shortcut: '↵ 01',
      icon: <FolderGit2 className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('projects'),
    },
    {
      id: 'nav-lab',
      title: 'Open AI Engineering Lab & Assistant',
      category: 'Lab',
      shortcut: '↵ 02',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => scrollTo('ai-lab'),
    },
    {
      id: 'nav-arch',
      title: 'Inspect System Architecture Diagram',
      category: 'Navigation',
      shortcut: '↵ 03',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      action: () => scrollTo('architecture'),
    },
    {
      id: 'nav-skills',
      title: 'Explore Engineering Competencies & Map',
      category: 'Navigation',
      shortcut: '↵ 04',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      action: () => scrollTo('skills'),
    },
    {
      id: 'nav-constellation',
      title: 'View Technology Constellation Graph',
      category: 'Navigation',
      icon: <Compass className="w-4 h-4 text-purple-400" />,
      action: () => scrollTo('constellation'),
    },
    {
      id: 'nav-log',
      title: 'View Engineering Build Log',
      category: 'Navigation',
      shortcut: '↵ 05',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => scrollTo('build-log'),
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
      title: 'Inspect Live GitHub Telemetry',
      category: 'System',
      icon: <Github className="w-4 h-4 text-slate-300" />,
      action: () => scrollTo('github-telemetry'),
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
        window.open('https://github.com/garvshaw89-glitch', '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
    {
      id: 'ext-linkedin',
      title: 'Open LinkedIn Profile (Garv Shaw)',
      category: 'Social',
      icon: <Linkedin className="w-4 h-4 text-blue-400" />,
      action: () => {
        window.open('https://linkedin.com/in/garv-shaw-08a33237b', '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open palette
          const btn = document.getElementById('cmd-palette-trigger');
          btn?.click();
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
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
        className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          id="command-palette-dialog"
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#090E17]/95 border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.2)] backdrop-blur-2xl overflow-hidden mt-12 sm:mt-0"
        >
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0c1320]/60">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search Garv's portfolio, systems, or projects... (ESC to exit)"
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-white p-1"
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
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-white translate-x-1'
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
          <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Execute</span>
              <span>ESC Close</span>
            </div>
            <span className="text-cyan-400/90 font-medium">Garv Shaw • Engineering Suite</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
