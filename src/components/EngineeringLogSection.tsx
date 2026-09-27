import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Calendar, ArrowUpRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ENGINEERING_LOGS } from '../data/portfolioData';
import { EngineeringLogEntry } from '../types';

interface EngineeringLogSectionProps {
  id?: string;
}

export const EngineeringLogSection: React.FC<EngineeringLogSectionProps> = ({
  id = 'build-log',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(ENGINEERING_LOGS[0].id);

  const toggleExpand = (logId: string) => {
    setExpandedId(expandedId === logId ? null : logId);
  };

  return (
    <section
      id={id}
      className="relative w-full py-24 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>06 // CONTINUOUS TELEMETRY</span>
          </div>
          <h2 className="hero-heading font-display font-black uppercase text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3">
            ENGINEERING BUILD LOG
          </h2>
          <p className="text-slate-300 font-sans text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Dated chronological records of architecture iterations, performance benchmarks, and production experiments.
          </p>
        </div>

        {/* Log Entries Timeline */}
        <div className="space-y-4">
          {ENGINEERING_LOGS.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
                  isExpanded
                    ? 'bg-[#090E17] border-cyan-500/40 shadow-[0_10px_35px_rgba(6,182,212,0.15)]'
                    : 'bg-[#070D18]/80 border-white/10 hover:border-white/20 hover:bg-[#090e17]'
                }`}
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                      {log.date}
                    </span>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                        {log.category} • {log.relatedProject}
                      </span>
                      <h3 className="font-display font-bold text-base sm:text-lg text-white tracking-wide">
                        {log.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-slate-400 hidden md:inline">
                      {isExpanded ? 'Collapse' : 'Inspect'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Collapsible Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5 pt-5 border-t border-white/10 overflow-hidden"
                    >
                      <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                        {log.summary}
                      </p>

                      {log.details && (
                        <div className="space-y-2 mb-4">
                          {log.details.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs font-sans text-slate-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {log.technologies.map((t) => (
                            <span
                              key={t}
                              className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <a
                          href="#projects"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>View {log.relatedProject}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
