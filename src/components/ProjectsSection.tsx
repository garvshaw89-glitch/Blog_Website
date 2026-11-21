import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Github, ExternalLink } from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import { ProjectItem } from '../types';
import { GlitchHeading } from './ui/GlitchHeading';

interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
  inSheet?: boolean;
  id?: string;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  onSelectProject,
  inSheet = false,
  id = 'projects',
}) => {
  const [filter, setFilter] = useState<'All' | 'AI' | 'FinTech' | 'Realtime'>('All');

  const filteredProjects =
    filter === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => {
          if (filter === 'AI') return p.category.includes('AI') || p.tags.some((t) => t.includes('AI'));
          if (filter === 'FinTech')
            return p.tags.some((t) => t.includes('FinTech') || t.includes('Salary') || t.includes('Budget'));
          if (filter === 'Realtime')
            return p.tags.some((t) => t.includes('Realtime') || t.includes('WebSockets') || t.includes('WPM'));
          return true;
        });

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">04</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            FEATURED PRODUCTION SYSTEMS
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          SELECTED CASE STUDIES
        </span>
      </div>

      {/* Section Title & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14 sm:mb-16">
        <div>
          <GlitchHeading className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-[#F2F3F5] leading-none">
            FEATURED
            <br />
            PROJECTS.
          </GlitchHeading>
          <p className="mt-4 text-[#A7ADB5] font-sans text-sm sm:text-base max-w-xl font-light [text-wrap:balance]">
            High-impact digital systems built from the ground up with meticulous attention to real-world performance, usability, and scale.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'AI', 'FinTech', 'Realtime'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              data-cursor="button"
              className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === cat
                  ? 'bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.22)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#A7ADB5] hover:text-white border border-white/[0.09]'
              }`}
            >
              {cat === 'All' ? `ALL (${PROJECTS.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Project Showcases */}
      <div className="space-y-16 sm:space-y-24">
        {filteredProjects.map((project, index) => {
          const isEven = index % 2 === 0;

          return (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative border-t border-white/[0.08] pt-10 sm:pt-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Text & Specs Column */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-between ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3.5 font-mono text-xs">
                      <span className="font-bold text-sky-400 tabular-nums">
                        {project.number}
                      </span>
                      <span aria-hidden="true" className="text-white/20">·</span>
                      <span className="uppercase tracking-[0.18em] text-[#A7ADB5]">
                        {project.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      data-cursor="project"
                      data-cursor-label="OPEN"
                      className="text-left font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-3.5 group-hover:text-sky-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-md"
                    >
                      {project.title}
                    </button>

                    <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light mb-5">
                      {project.description}
                    </p>

                    {/* Stack Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-7">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-[#D5D9DF] whitespace-nowrap shrink-0"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="flex items-center flex-wrap gap-4 pt-4 border-t border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      data-cursor="button"
                      data-cursor-label="CASE"
                      className="flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-white hover:bg-sky-300 text-black font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>VIEW CASE STUDY</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                        data-cursor-label="LIVE"
                        className="flex items-center gap-1.5 min-h-[42px] px-2 text-xs font-mono text-[#A7ADB5] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>LIVE DEMO</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                        data-cursor-label="CODE"
                        className="flex items-center gap-1.5 min-h-[42px] px-2 text-xs font-mono text-[#A7ADB5] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>SOURCE</span>
                        <Github className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Cinematic Project Visual Frame */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProject(project)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(project);
                    }
                  }}
                  data-cursor="project"
                  data-cursor-label="OPEN"
                  className={`lg:col-span-7 relative rounded-2xl overflow-hidden bg-[#070A10] border border-white/[0.1] group-hover:border-sky-400/45 transition-all duration-500 shadow-[0_24px_60px_rgba(0,0,0,0.82)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={project.col1TopImage}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top brightness-95 group-hover:scale-[1.03] group-hover:brightness-105 transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/85 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-[#070A10]/92 border border-white/[0.12] font-mono text-[10px] uppercase tracking-[0.18em] text-sky-300">
                        {project.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );

  if (inSheet) {
    return <div className="select-none">{content}</div>;
  }

  return (
    <section
      id={id}
      className="relative w-full py-20 sm:py-26 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      {content}
    </section>
  );
};
