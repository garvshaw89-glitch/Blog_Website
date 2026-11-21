import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Github,
  Layers,
  Sparkles,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { ProjectItem } from '../types';
import { PROJECTS } from '../data/portfolioData';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onSelectProject?: (project: ProjectItem) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onSelectProject,
}) => {
  const [activeTab, setActiveTab] = useState<'case-study' | 'architecture' | 'gallery'>('case-study');
  const [copiedClone, setCopiedClone] = useState(false);

  const currentIdx = project ? PROJECTS.findIndex((p) => p.id === project.id) : -1;
  const hasSiblings = Boolean(onSelectProject && currentIdx !== -1 && PROJECTS.length > 1);

  const handleStep = useCallback(
    (delta: number) => {
      if (!onSelectProject || currentIdx === -1) return;
      const nextIdx = (currentIdx + delta + PROJECTS.length) % PROJECTS.length;
      onSelectProject(PROJECTS[nextIdx]);
    },
    [currentIdx, onSelectProject]
  );

  useEffect(() => {
    if (!project) return;
    setActiveTab('case-study');
    setCopiedClone(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight' && hasSiblings) {
        e.preventDefault();
        handleStep(1);
      } else if (e.key === 'ArrowLeft' && hasSiblings) {
        e.preventDefault();
        handleStep(-1);
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [project, onClose, hasSiblings, handleStep]);

  if (!project || typeof document === 'undefined') return null;

  const caseStudy = project.caseStudy;
  const cloneCommand =
    project.githubUrl && project.githubUrl !== 'https://github.com/garvshaw89-glitch'
      ? `git clone ${project.githubUrl}.git`
      : null;

  const handleCopyClone = () => {
    if (!cloneCommand || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    window.setTimeout(() => setCopiedClone(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <div
        id="project-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-6 bg-black/92 overflow-y-auto"
      >
        <motion.div
          id="project-modal-content"
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070D18] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(6,182,212,0.16)] overflow-hidden text-[#D7E2EA] my-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-[#090E17] shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-cyan-400 font-bold text-lg sm:text-xl shrink-0">
                {project.number}
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 block truncate">
                  {project.category} · {project.type}
                </span>
                <h2 className="font-display font-black text-base sm:text-2xl text-white uppercase tracking-tight leading-none truncate">
                  {project.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="external"
                  data-cursor-label="GITHUB"
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="View GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="external"
                  data-cursor-label="LIVE"
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-cyan-500 text-black text-xs font-mono font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
                  title="Launch Live Project"
                >
                  <span className="hidden sm:inline">Launch</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                id="close-project-modal"
                type="button"
                onClick={onClose}
                data-cursor="button"
                data-cursor-label="CLOSE"
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/5 bg-[#05070a]/70 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('case-study')}
              data-cursor="button"
              className={`px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'case-study'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Case Study Deep Dive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              data-cursor="button"
              className={`px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Architecture &amp; Stack
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              data-cursor="button"
              className={`px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'gallery'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Interface
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
            {activeTab === 'case-study' && caseStudy && (
              <div className="space-y-8">
                {/* 1. Overview & Role */}
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400 mb-2">
                    01 // EXECUTIVE OVERVIEW
                  </h3>
                  <p className="font-sans text-base sm:text-lg text-slate-200 leading-relaxed mb-4">
                    {caseStudy.overview}
                  </p>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-slate-300">
                    <span className="text-cyan-400 font-semibold">MY ROLE: </span>
                    {caseStudy.role}
                  </div>
                </div>

                {/* 2. Problem & Solution Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> THE PROBLEM
                    </span>
                    <p className="font-sans text-sm text-slate-300 leading-relaxed">
                      {caseStudy.problem}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3.5 h-3.5" /> THE ENGINEERING SOLUTION
                    </span>
                    <p className="font-sans text-sm text-slate-300 leading-relaxed">
                      {caseStudy.solution}
                    </p>
                  </div>
                </div>

                {/* 3. Key Features */}
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400 mb-3">
                    02 // KEY CAPABILITIES &amp; FEATURES
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {caseStudy.keyFeatures.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Engineering Challenges & Design Decisions */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                    03 // ENGINEERING CHALLENGES &amp; DESIGN TRADEOFFS
                  </h3>
                  <div className="space-y-2.5">
                    {caseStudy.engineeringChallenges.map((ch, i) => (
                      <div key={i} className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 font-sans text-xs sm:text-sm text-slate-200">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                          CHALLENGE #{i + 1}
                        </span>
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Result & Verification */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#090E17] border border-white/10 flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold block mb-1">
                      VERIFIED OUTCOME
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {caseStudy.result}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'architecture' && caseStudy && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400 mb-2">
                    SYSTEM ARCHITECTURE SUMMARY
                  </h3>
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs sm:text-sm text-cyan-300">
                    {caseStudy.architectureSummary}
                  </div>
                </div>

                {cloneCommand && (
                  <div className="p-3.5 rounded-2xl bg-[#05080F] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs text-slate-300">
                      <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                      <code className="truncate select-all">{cloneCommand}</code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyClone}
                      data-cursor="button"
                      data-cursor-label="COPY"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 shrink-0 cursor-pointer"
                    >
                      {copiedClone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY CLONE</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {caseStudy.aiComponent && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI &amp; MODEL LAYER
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {caseStudy.aiComponent}
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="font-mono text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-1.5">
                      <Server className="w-3.5 h-3.5" /> BACKEND ARCHITECTURE
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {caseStudy.backend}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3.5 h-3.5" /> DATABASE &amp; STORAGE
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {caseStudy.database}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="font-mono text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1.5">
                      <Cloud className="w-3.5 h-3.5" /> CLOUD &amp; DEPLOYMENT
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {caseStudy.cloudInfra}
                    </p>
                  </div>
                </div>

                {/* Tech Tags */}
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-2">
                    TECHNOLOGIES USED
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-mono text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={project.col1TopImage}
                      alt={`${project.title} Screenshot 1`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-3 bg-black/60 font-mono text-xs text-slate-400">
                      Primary Interface View
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={project.col2Image}
                      alt={`${project.title} Screenshot 2`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-3 bg-black/60 font-mono text-xs text-slate-400">
                      Analytics &amp; Telemetry View
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={project.col1BottomImage}
                      alt={`${project.title} Screenshot 3`}
                      className="w-full h-72 object-cover"
                    />
                    <div className="p-3 bg-black/60 font-mono text-xs text-slate-400">
                      Workflow &amp; Learning View
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-white/10 bg-[#090E17] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {hasSiblings && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    data-cursor="button"
                    data-cursor-label="PREV"
                    aria-label="Previous project case study"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    data-cursor="button"
                    data-cursor-label="NEXT"
                    aria-label="Next project case study"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="hidden md:inline font-mono text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">←</kbd>{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">→</kbd> step ·{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">ESC</kbd> close
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="external"
                  data-cursor-label="SOURCE"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[40px] rounded-xl bg-white/5 border border-white/15 text-slate-200 font-mono text-xs hover:border-cyan-400 hover:text-white transition-all"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>View Source</span>
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="external"
                  data-cursor-label="LIVE"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[40px] rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <span>Open Live Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
