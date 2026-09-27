import React, { useState } from 'react';
import { FadeIn } from './FadeIn';
import { ProjectCard } from './ProjectCard';
import { PROJECTS } from '../data/portfolioData';
import { ProjectItem } from '../types';
import { FolderGit2 } from 'lucide-react';

interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
  id?: string;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  onSelectProject,
  id = 'projects',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'AI' | 'FinTech' | 'Realtime'>('All');

  const filteredProjects = selectedFilter === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => {
        if (selectedFilter === 'AI') return p.category.includes('AI') || p.tags.some(t => t.includes('AI'));
        if (selectedFilter === 'FinTech') return p.tags.some(t => t.includes('FinTech') || t.includes('Salary') || t.includes('Budget'));
        if (selectedFilter === 'Realtime') return p.tags.some(t => t.includes('Realtime') || t.includes('WebSockets') || t.includes('WPM'));
        return true;
      });

  return (
    <section
      id={id}
      data-cursor-theme="default"
      className="relative w-full bg-transparent rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 z-10 px-4 sm:px-6 md:px-12 pt-20 sm:pt-24 md:pt-32 pb-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Heading */}
        <FadeIn delay={0} y={30} className="w-full text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>04 // PRODUCTION SYSTEMS</span>
          </div>
          <h2
            id="projects-heading"
            className="hero-heading font-display font-black uppercase tracking-tight leading-none text-center select-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 100px)' }}
          >
            SELECTED WORK
          </h2>
          <p className="text-slate-300 font-sans text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-6">
            Engineered systems demonstrating end-to-end architecture, real-time data flows, and intelligent user experiences.
          </p>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(['All', 'AI', 'FinTech', 'Realtime'] as const).map((filter) => (
              <button
                key={filter}
                data-magnetic="true"
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter === 'All' ? `All Systems (${PROJECTS.length})` : filter}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Stacked Cards Container */}
        <div className="relative w-full flex flex-col">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              totalCards={filteredProjects.length}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
