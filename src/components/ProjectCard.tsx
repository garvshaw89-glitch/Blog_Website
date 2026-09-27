import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ProjectItem } from '../types';
import { LiveProjectButton } from './LiveProjectButton';
import { Github, ArrowUpRight, BookOpen, Layers } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  totalCards: number;
  onSelectProject: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  totalCards,
  onSelectProject,
}) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'start start'],
  });

  const targetScale = 1 - (totalCards - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div
      ref={cardContainerRef}
      className="min-h-[85vh] flex items-start justify-center sticky mb-12 sm:mb-16"
      style={{
        top: `${index * 26 + 80}px`,
      }}
    >
      <motion.div
        style={{ scale }}
        id={`project-card-${project.id}`}
        data-cursor="project"
        data-cursor-label="VIEW"
        onMouseMove={handleCardMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full max-w-6xl rounded-[32px] sm:rounded-[45px] md:rounded-[56px] border border-cyan-500/25 bg-gradient-to-br from-[#0c1322]/98 via-[#070D18]/98 to-[#05070A] p-5 sm:p-7 md:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 hover:border-cyan-400/80 hover:shadow-[0_0_50px_rgba(6,182,212,0.22)] backdrop-blur-xl relative"
      >
        {/* Dynamic Pointer-Following Spotlight Glow Inside Card */}
        {isHovered && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[32px] sm:rounded-[45px] md:rounded-[56px]"
            style={{
              background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6,182,212,0.07), transparent 60%)`,
            }}
          />
        )}

        {/* Top Row: Number, Category, Name & Action CTAs */}
        <div className="relative z-10 flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8 border-b border-white/10 pb-6">
          <div className="flex items-baseline gap-4 sm:gap-6">
            {/* Project Number */}
            <span
              className="font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-slate-600 leading-none select-none"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 100px)' }}
            >
              {project.number}
            </span>

            {/* Category & Title */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                  {project.category}
                </span>
                {project.status && (
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                      project.status === 'Building'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    ● {project.status}
                  </span>
                )}
              </div>
              <h3
                className="font-display font-black uppercase text-white tracking-tight leading-none"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)' }}
              >
                {project.title}
              </h3>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic="true"
                data-cursor="external"
                data-cursor-label="SOURCE"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 text-slate-300 font-mono uppercase tracking-wider text-xs px-3.5 sm:px-4 py-2 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
                title="View GitHub Repository"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Source</span>
              </a>
            )}

            {project.liveUrl && (
              <LiveProjectButton
                id={`live-btn-${project.id}`}
                label="Live Demo"
                url={project.liveUrl}
              />
            )}

            <button
              type="button"
              data-magnetic="true"
              onClick={() => onSelectProject(project)}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 text-black font-mono font-bold uppercase tracking-wider text-xs px-4 sm:px-5 py-2 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Case Study</span>
            </button>
          </div>
        </div>

        {/* Mid Row: Short Description & Tags */}
        <div className="relative z-10 mb-6">
          <p className="font-sans text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-3xl mb-4">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Row: Visual Showcase Bento */}
        <div
          onClick={() => onSelectProject(project)}
          data-cursor="image"
          data-cursor-label="VIEW PROJECT"
          className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 cursor-pointer group"
          title="Click to inspect detailed engineering case study"
        >
          {/* Main Visual (7 cols) */}
          <div className="md:col-span-7 h-52 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-white/10 relative group-hover:border-cyan-400/50 transition-colors">
            <img
              src={project.col1TopImage}
              alt={`${project.title} Interface Preview`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span className="font-mono text-[11px] text-cyan-300 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                <Layers className="w-3 h-3 text-cyan-400" /> Click to view Case Study & Architecture
              </span>
            </div>
          </div>

          {/* Secondary Visual (5 cols) */}
          <div className="md:col-span-5 h-52 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-white/10 relative group-hover:border-cyan-400/50 transition-colors hidden sm:block">
            <img
              src={project.col2Image}
              alt={`${project.title} Analytics & Metrics`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 right-4">
              <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                Deep Dive <ArrowUpRight className="w-3 h-3 text-cyan-400" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
