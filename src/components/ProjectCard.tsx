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
        className="w-full max-w-6xl rounded-2xl sm:rounded-3xl border border-white/[0.08] hover:border-white/[0.18] bg-[#0B0E12]/90 hover:bg-[#11151A] p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-xl relative hover:-translate-y-1"
      >
        {/* Dynamic Subtle Pointer Spotlight */}
        {isHovered && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-2xl sm:rounded-3xl"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(126,167,255,0.04), transparent 65%)`,
            }}
          />
        )}

        {/* Top Row: Number, Category, Name & Action CTAs */}
        <div className="relative z-10 flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8 border-b border-white/[0.08] pb-6">
          <div className="flex items-baseline gap-4 sm:gap-6">
            {/* Project Number */}
            <span
              className="font-editorial font-bold text-[#626A73] leading-none select-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 72px)' }}
            >
              {project.number}
            </span>

            {/* Category & Title */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] uppercase tracking-wider text-[#7EA7FF]">
                <span>{project.category}</span>
                {project.status && (
                  <>
                    <span className="text-white/20">/</span>
                    <span className="text-[#A7ADB5]">{project.status}</span>
                  </>
                )}
              </div>
              <h3
                className="font-editorial font-bold uppercase text-[#F2F3F5] tracking-tight leading-none"
                style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)' }}
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 bg-[#11151A] hover:bg-[#171C22] text-[#A7ADB5] hover:text-[#F2F3F5] font-mono uppercase tracking-wider text-xs px-3.5 sm:px-4 py-2 transition-all cursor-pointer"
                title="View GitHub Repository"
              >
                <Github className="w-3.5 h-3.5 text-[#A7ADB5]" />
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F3F5] hover:bg-white text-[#050608] font-mono font-semibold uppercase tracking-wider text-xs px-4 sm:px-5 py-2 shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Case Study</span>
            </button>
          </div>
        </div>

        {/* Mid Row: Short Description & Tags */}
        <div className="relative z-10 mb-6">
          <p className="font-sans text-sm sm:text-base text-[#A7ADB5] font-light leading-relaxed max-w-3xl mb-4">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#626A73]">
            {project.tags.map((tag, idx) => (
              <React.Fragment key={tag}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span>{tag}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom Row: Visual Showcase Bento */}
        <div
          onClick={() => onSelectProject(project)}
          data-cursor="image"
          data-cursor-label="EXPLORE"
          className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 cursor-pointer group"
          title="Click to inspect detailed engineering case study"
        >
          {/* Main Visual (7 cols) */}
          <div className="md:col-span-7 h-52 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-white/[0.08] relative group-hover:border-white/20 transition-colors">
            <img
              src={project.col1TopImage}
              alt={`${project.title} Interface Preview`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#F2F3F5] flex items-center gap-1.5 bg-[#050608]/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/[0.08]">
                <Layers className="w-3 h-3 text-[#7EA7FF]" /> Inspect Case Study & Architecture
              </span>
            </div>
          </div>

          {/* Secondary Visual (5 cols) */}
          <div className="md:col-span-5 h-52 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-white/[0.08] relative group-hover:border-white/20 transition-colors hidden sm:block">
            <img
              src={project.col2Image}
              alt={`${project.title} Analytics & Metrics`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 right-4">
              <span className="font-mono text-[11px] text-[#A7ADB5] flex items-center gap-1 bg-[#050608]/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/[0.08]">
                Telemetry Deep Dive <ArrowUpRight className="w-3 h-3 text-[#7EA7FF]" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
