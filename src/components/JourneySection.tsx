import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Terminal, Briefcase, Sparkles, ArrowUpRight } from 'lucide-react';

interface JourneyMilestone {
  year: string;
  phase: string;
  title: string;
  focus: string;
  details: string[];
  status: string;
}

const MILESTONES: JourneyMilestone[] = [
  {
    year: '2026',
    phase: 'BUILDING',
    title: 'AI & SCALABLE PRODUCTION SYSTEMS',
    focus: 'Autonomous Agents, Full-Stack Architecture, Real-Time Market Infrastructure',
    details: [
      'Architecting multi-step autonomous agent workflows with Gemini 3.8 Flash and strict tool execution schemas.',
      'Deploying low-latency microservices with Google Cloud Run and WebRTC media channels (ArogyaSeva, StockMentor).',
      'Refining quantitative compensation forecasting and personal wealth models (SalaryOS).',
    ],
    status: 'ACTIVE NOW',
  },
  {
    year: '2025',
    phase: 'DEVELOPING',
    title: 'FULL-STACK SYSTEMS & CLOUD CONTAINERIZATION',
    focus: 'React 19, TypeScript, Docker Containers, Algorithmic Engines',
    details: [
      'Engineered spaced repetition mastery tree algorithms and interactive browser code sandboxes (MicroSkill).',
      'Constructed zero-lag keystroke performance telemetry with Canvas-drawn heatmaps (Typing Test Pro).',
      'Containerized backend microservices with Docker, Traefik edge routing, and automated CI/CD.',
    ],
    status: 'COMPLETED',
  },
  {
    year: '2024',
    phase: 'FOUNDATIONS',
    title: 'COMPUTER SCIENCE & CORE SYSTEMS',
    focus: 'C Systems Programming, Python AsyncIO, Data Structures & Algorithms',
    details: [
      'Deep study in memory allocation, cache locality, and POSIX socket programming in C.',
      'Constructed asynchronous data ingestion scripts and event-driven architecture prototypes in Python.',
      'Built algorithmic foundations across dynamic programming, graph traversal, and relational schema normalization.',
    ],
    status: 'FOUNDATION',
  },
];

interface JourneySectionProps {
  id?: string;
}

export const JourneySection: React.FC<JourneySectionProps> = ({ id = 'journey' }) => {
  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">05 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              EXPERIENCE & ENGINEERING JOURNEY
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">CHRONOLOGICAL ROADMAP</span>
        </div>

        {/* Section Title */}
        <div className="max-w-2xl mb-16">
          <h2 className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            JOURNEY.
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
            A transparent progression documenting systems engineered, architectural milestones conquered, and ongoing production ventures.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative border-l border-white/15 ml-4 sm:ml-8 pl-8 sm:pl-12 space-y-16">
          {MILESTONES.map((item, index) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[41px] sm:-left-[57px] top-1.5 flex items-center justify-center">
                <span
                  className={`w-4 h-4 rounded-full border-2 ${
                    item.status === 'ACTIVE NOW'
                      ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_15px_#22d3ee]'
                      : 'bg-neutral-900 border-neutral-600'
                  }`}
                />
              </div>

              {/* Milestone Content Card */}
              <div className="p-8 rounded-3xl bg-[#08090B]/90 border border-white/10 hover:border-white/20 transition-all backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="font-editorial text-3xl sm:text-4xl font-black text-white">
                      {item.year}
                    </span>
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan-300">
                      {item.phase}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                    {item.status}
                  </span>
                </div>

                <h3 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-white tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="font-mono text-xs text-neutral-400 mb-6">
                  {item.focus}
                </p>

                <ul className="space-y-2.5">
                  {item.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-sans text-neutral-300 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
