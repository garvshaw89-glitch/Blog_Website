import React from 'react';
import { motion } from 'motion/react';
import { GlitchHeading } from './ui/GlitchHeading';

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
    status: 'ACTIVE FOCUS',
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
    status: 'SHIPPED',
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
    status: 'COMPLETED',
  },
];

interface JourneySectionProps {
  inSheet?: boolean;
  id?: string;
}

export const JourneySection: React.FC<JourneySectionProps> = ({
  inSheet = false,
  id = 'journey',
}) => {
  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">06</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            EXPERIENCE &amp; ENGINEERING JOURNEY
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          CHRONOLOGICAL ROADMAP
        </span>
      </div>

      {/* Section Title */}
      <div className="max-w-2xl mb-12 sm:mb-14">
        <GlitchHeading className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-3.5">
          JOURNEY.
        </GlitchHeading>
        <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light [text-wrap:balance]">
          A progression documenting systems engineered, architectural milestones shipped, and ongoing production ventures.
        </p>
      </div>

      {/* Sculpted Architectural Timeline */}
      <div className="relative border-l border-white/[0.12] ml-3 sm:ml-6 pl-7 sm:pl-11 space-y-10 sm:space-y-12">
        {MILESTONES.map((item, index) => (
          <motion.div
            key={item.year}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.1 }}
            className="relative"
          >
            {/* Sculpted Milestone Node Marker */}
            <div className="absolute -left-[35px] sm:-left-[51px] top-6 flex items-center justify-center">
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  index === 0
                    ? 'bg-sky-400 border-sky-200'
                    : 'bg-[#070A10] border-white/30'
                }`}
              />
            </div>

            {/* Milestone Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] hover:border-white/[0.18] transition-colors shadow-[0_18px_55px_rgba(0,0,0,0.75)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] mb-5">
                <div className="flex items-center gap-3">
                  <span className="font-editorial text-3xl sm:text-4xl font-bold text-[#F2F3F5] tabular-nums">
                    {item.year}
                  </span>
                  <span aria-hidden="true" className="text-white/20 font-mono text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-sky-300">
                    {item.phase}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#626A73] uppercase tracking-[0.2em]">
                  {item.status}
                </span>
              </div>

              <h3 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-[#F2F3F5] tracking-tight mb-1.5">
                {item.title}
              </h3>
              <p className="font-mono text-xs text-[#626A73] mb-5">
                {item.focus}
              </p>

              <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {item.details.map((detail, idx) => (
                  <li
                    key={idx}
                    className="py-2.5 flex items-baseline gap-3 text-sm font-sans text-[#D5D9DF] font-light leading-relaxed"
                  >
                    <span className="font-mono text-[10px] text-sky-400 tabular-nums shrink-0">
                      0{idx + 1}
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
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
