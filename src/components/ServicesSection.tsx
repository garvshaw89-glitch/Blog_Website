import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, CheckCircle2, Terminal } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { SKILLS } from '../data/portfolioData';

interface ServicesSectionProps {
  id?: string;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ id = 'skills' }) => {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags for interactive filtering
  const allTags = Array.from(new Set(SKILLS.flatMap((s) => s.tags || []))).slice(0, 10);

  const filteredSkills = activeTag
    ? SKILLS.filter((s) => s.tags?.includes(activeTag))
    : SKILLS;

  return (
    <section
      id={id}
      className="relative w-full bg-gradient-to-b from-[#090E17] via-[#070C15] to-[#05070A] text-white rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] border-t border-cyan-500/20 px-4 sm:px-6 md:px-10 py-24 z-0 overflow-hidden shadow-[0_-20px_50px_rgba(6,182,212,0.08)]"
    >
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col relative z-10">
        {/* Section Heading */}
        <FadeIn delay={0} y={30} className="w-full text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-4">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>02 // ENGINEERING COMPETENCIES</span>
          </div>
          <h2
            id="skills-heading"
            className="hero-heading font-display font-black uppercase tracking-tight leading-none mb-4 select-none"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 100px)' }}
          >
            ENGINEERING MAP
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
            Factual breakdown of verified technical competencies, production-grade tools, and architectural capabilities.
          </p>

          {/* Interactive Tag Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTag === null
                  ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              All Domains ({SKILLS.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  activeTag === tag
                    ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill, index) => (
            <FadeIn
              key={skill.id}
              delay={index * 0.05}
              y={25}
              className="h-full"
            >
              <div
                id={`skill-card-${skill.id}`}
                className="h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#090E17]/90 border border-white/10 hover:border-cyan-500/40 hover:bg-[#0c1322] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-200 group"
              >
                <div>
                  {/* Card Header: Number + Title */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="font-mono text-2xl font-black text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
                      {skill.number}
                    </span>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      VERIFIED
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:text-cyan-400 tracking-wide mb-3 transition-colors">
                    {skill.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                    {skill.description}
                  </p>

                  {/* Capabilities List */}
                  {skill.capabilities && skill.capabilities.length > 0 && (
                    <div className="space-y-1.5 mb-5 pb-5 border-b border-white/10">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                        CAPABILITIES
                      </span>
                      {skill.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {/* Tech Stack Pills */}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Connected Projects */}
                  {skill.relatedProjects && skill.relatedProjects.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                      <span className="text-slate-400">APPLIED IN:</span>
                      <div className="flex items-center gap-1.5">
                        {skill.relatedProjects.map((proj) => (
                          <a
                            key={proj}
                            href="#projects"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                          >
                            <span>{proj}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
