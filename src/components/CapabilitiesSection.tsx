import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface CapabilityItem {
  number: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  capabilities: string[];
  visualTheme: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    number: '01',
    title: 'ARTIFICIAL INTELLIGENCE',
    tagline: 'LLMs, RAG Pipelines & Autonomous Multi-Step Agents',
    description:
      'Architecting deterministic reasoning engines, prompt-chain synthesis, semantic vector search, and structured output extraction with sub-second response times.',
    technologies: ['Gemini 3.8 Flash', 'PyTorch', 'Vector Embeddings', 'RAG Pipelines', 'Function Calling', 'LangChain'],
    capabilities: [
      'Multi-turn Socratic dialogue loops',
      'Context-aware semantic chunking & ranking',
      'Autonomous agent execution with verification passes',
      'Low-latency streaming token delivery',
    ],
    visualTheme: '#06b6d4',
  },
  {
    number: '02',
    title: 'CLOUD SYSTEMS',
    tagline: 'Serverless Backends, Containers & Automated Pipelines',
    description:
      'Designing fault-tolerant infrastructure, auto-scaling microservices on Google Cloud Run and AWS, edge CDN routing, and automated zero-downtime CI/CD delivery.',
    technologies: ['Google Cloud Run', 'AWS Lambda & S3', 'Docker', 'Vercel Edge', 'Cloudflare Workers', 'GitHub Actions'],
    capabilities: [
      'Stateless containerized deployments',
      'Multi-region edge caching with sub-50ms TTFB',
      'Serverless event ingestion pipelines',
      'Cryptographic secrets and IAM isolation',
    ],
    visualTheme: '#6366f1',
  },
  {
    number: '03',
    title: 'SOFTWARE ENGINEERING',
    tagline: 'Strict TypeScript Schemas & Hardware-Accelerated Frontend',
    description:
      'Crafting clean, maintainable web systems using React 19, strict type definitions, state machines, and GPU-synchronized 60-120 FPS animations without layout thrashing.',
    technologies: ['React 19', 'Next.js 15', 'TypeScript 5.8', 'Tailwind CSS v4', 'Motion 12', 'State Machines'],
    capabilities: [
      'Atomic component architecture without bundle bloat',
      'Zod runtime schema enforcement at API boundaries',
      'Microsecond-accurate event handling and Canvas rendering',
      'Full keyboard accessibility and semantic HTML',
    ],
    visualTheme: '#38bdf8',
  },
  {
    number: '04',
    title: 'DIGITAL PRODUCTS',
    tagline: 'User Experience, Systematic Design & High Conversion Flow',
    description:
      'Bridging complex engineering with intuitive product interfaces. Obsessed with typographic hierarchy, subtle tactile feedback, and frictionless user flows.',
    technologies: ['Design Systems', 'Micro-Interactions', 'Responsive Layouts', 'Figma', 'Web Performance'],
    capabilities: [
      'Design token architectures',
      'Progressive Web App offline capabilities',
      'Zero-delay interactive state feedback',
      'High-contrast readability across devices',
    ],
    visualTheme: '#a855f7',
  },
  {
    number: '05',
    title: 'BUSINESS × TECHNOLOGY',
    tagline: 'Systems Architecture Driven by Commercial Viability',
    description:
      'Translating business requirements into scalable technical realities, prioritizing high ROI architectural decisions, operational efficiency, and rapid iteration.',
    technologies: ['System Modeling', 'Product Strategy', 'Workflow Automation', 'Scalability Roadmaps'],
    capabilities: [
      'Cost-optimized serverless architectures',
      'Defensible technological moats',
      'User journey funnel optimization',
      'Modular feature release management',
    ],
    visualTheme: '#10b981',
  },
  {
    number: '06',
    title: 'FINANCE × TECHNOLOGY',
    tagline: 'Quantitative Telemetry, Compensation & Risk Models',
    description:
      'Developing live financial market terminals, order book microstructure calculators, tax deduction forecasting pipelines, and quantitative compensation suites.',
    technologies: ['Market Microstructure', 'Realtime WebSockets', 'Mathematical Modeling', 'Predictive Analytics'],
    capabilities: [
      'Live candlestick charting and indicator computations',
      'Multi-jurisdiction net income modeling',
      'Sub-millisecond market feed synchronization',
      'Offline-first sensitive financial data calculation',
    ],
    visualTheme: '#f59e0b',
  },
];

interface CapabilitiesSectionProps {
  inSheet?: boolean;
  id?: string;
}

export const CapabilitiesSection: React.FC<CapabilitiesSectionProps> = ({
  inSheet = false,
  id = 'capabilities',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  const active = CAPABILITIES[hoveredIndex];

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">02</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            CAPABILITIES &amp; CORE DISCIPLINES
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          INTERACTIVE DIRECTORY
        </span>
      </div>

      {/* Interactive Directory & Specification Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Interactive Headings */}
        <div className="lg:col-span-7 flex flex-col divide-y divide-white/[0.08]">
          {CAPABILITIES.map((item, idx) => {
            const isSelected = hoveredIndex === idx;
            return (
              <div
                key={item.number}
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
                data-cursor="button"
                data-cursor-label="EXPLORE"
                className={`py-6 sm:py-7 transition-all duration-300 cursor-pointer flex flex-col group ${
                  isSelected ? 'pl-3 sm:pl-5' : 'hover:pl-2 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-baseline gap-4 sm:gap-5">
                    <span
                      className="font-mono text-xs tabular-nums transition-colors"
                      style={{ color: isSelected ? item.visualTheme : '#626A73' }}
                    >
                      {item.number}
                    </span>
                    <h3
                      className={`font-editorial text-2xl sm:text-4xl font-bold uppercase tracking-tight transition-colors ${
                        isSelected ? 'text-[#F2F3F5]' : 'text-[#A7ADB5] group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <ArrowUpRight
                    className={`w-5 h-5 transition-all duration-300 shrink-0 ${
                      isSelected
                        ? 'opacity-100 translate-x-0.5 -translate-y-0.5'
                        : 'opacity-0 group-hover:opacity-60 text-[#A7ADB5]'
                    }`}
                    style={{ color: isSelected ? item.visualTheme : undefined }}
                  />
                </div>

                {isSelected && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="font-mono text-xs tracking-wider mt-2.5"
                    style={{ color: item.visualTheme }}
                  >
                    {item.tagline}
                  </motion.p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Precision Specification Inspector */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-6 sm:p-8 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_24px_65px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[65px] opacity-20 transition-colors duration-500"
                style={{ backgroundColor: active.visualTheme }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.2em]"
                    style={{ color: active.visualTheme }}
                  >
                    DISCIPLINE SPECIFICATION
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F2F3F5] tabular-nums">
                    {active.number} / 06
                  </span>
                </div>

                <h4 className="font-editorial text-2xl sm:text-3xl font-bold uppercase text-[#F2F3F5] tracking-tight mb-2.5">
                  {active.title}
                </h4>

                <div
                  className="w-10 h-[2px] mb-4 transition-colors duration-500"
                  style={{ backgroundColor: active.visualTheme }}
                />

                <p className="font-sans text-[#A7ADB5] text-sm leading-relaxed font-light mb-6">
                  {active.description}
                </p>

                {/* Core capabilities hairline rows */}
                <div className="mb-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-2.5">
                    CORE CAPABILITIES
                  </span>
                  <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {active.capabilities.map((cap, i) => (
                      <li
                        key={i}
                        className="py-2 flex items-center justify-between gap-3 text-xs text-[#D5D9DF] font-sans"
                      >
                        <span>{cap}</span>
                        <span className="font-mono text-[10px] text-[#626A73] tabular-nums shrink-0">
                          0{i + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Production Stack */}
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-2.5">
                    PRODUCTION STACK
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {active.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.09] font-mono text-[11px] text-[#D5D9DF] whitespace-nowrap shrink-0"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
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
