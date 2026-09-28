import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Github, ExternalLink, Sparkles } from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import { ProjectItem } from '../types';

interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
  id?: string;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  onSelectProject,
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

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">04 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              FEATURED PRODUCTION SYSTEMS
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">SELECTED CASE STUDIES</span>
        </div>

        {/* Section Title & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-none">
              FEATURED
              <br />
              PROJECTS.
            </h2>
            <p className="mt-4 text-neutral-400 font-sans text-base max-w-xl font-light">
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
                className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  filter === cat
                    ? 'bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {cat === 'All' ? `ALL (${PROJECTS.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Large Immersive Editorial Project Showcases */}
        <div className="space-y-24 sm:space-y-32">
          {filteredProjects.map((project, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="group relative border-t border-white/10 pt-10 sm:pt-14"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                  {/* Left Column: Number, Title, Description, Tags, Action */}
                  <div
                    className={`lg:col-span-5 flex flex-col justify-between ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-mono text-sm font-bold text-cyan-400">
                          {project.number}
                        </span>
                        <span className="text-neutral-500 font-mono text-xs">•</span>
                        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                          {project.category}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectProject(project)}
                        data-cursor="project"
                        data-cursor-label="OPEN"
                        className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4 group-hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {project.title}
                      </h3>

                      <p className="font-sans text-neutral-300 text-sm sm:text-base leading-relaxed font-light mb-6">
                        {project.description}
                      </p>

                      {/* Stack Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-8">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-neutral-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project)}
                        data-cursor="button"
                        data-cursor-label="CASE"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-cyan-300 text-black font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        <span>VIEW CASE</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-cursor="link"
                          data-cursor-label="LIVE"
                          className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
                          className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>CODE</span>
                          <Github className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Huge Cinematic Visual presentation */}
                  <div
                    onClick={() => onSelectProject(project)}
                    data-cursor="project"
                    data-cursor-label="OPEN"
                    className={`lg:col-span-7 relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-cyan-400/40 transition-all duration-500 shadow-[0_25px_60px_rgba(0,0,0,0.8)] cursor-pointer ${
                      isEven ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={project.col1TopImage}
                        alt={project.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 group-hover:brightness-105 transition-all duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 font-mono text-[10px] uppercase tracking-widest text-cyan-300">
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
    </section>
  );
};
