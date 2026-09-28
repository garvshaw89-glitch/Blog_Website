import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Cpu, Cloud, Terminal, Layers, TrendingUp, DollarSign } from 'lucide-react';

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
  id?: string;
}

export const CapabilitiesSection: React.FC<CapabilitiesSectionProps> = ({
  id = 'capabilities',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  const active = CAPABILITIES[hoveredIndex];

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">02 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              CAPABILITIES & CORE DISCIPLINES
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">EXPANDABLE DIRECTORY</span>
        </div>

        {/* Large Typography Interactive List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Interactive Headings */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-white/10">
            {CAPABILITIES.map((item, idx) => {
              const isSelected = hoveredIndex === idx;
              return (
                <div
                  key={item.number}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onClick={() => setHoveredIndex(idx)}
                  data-cursor="button"
                  data-cursor-label="EXPLORE"
                  className={`py-8 sm:py-10 transition-all duration-300 cursor-pointer flex flex-col group ${
                    isSelected ? 'pl-4 sm:pl-6' : 'hover:pl-2 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span className="font-mono text-xs text-neutral-400">
                        {item.number}
                      </span>
                      <h3
                        className={`font-editorial text-2xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight transition-colors ${
                          isSelected ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <ArrowUpRight
                      className={`w-6 h-6 transition-all duration-300 ${
                        isSelected
                          ? 'opacity-100 text-cyan-400 translate-x-1 -translate-y-1'
                          : 'opacity-0 group-hover:opacity-60 text-neutral-400'
                      }`}
                    />
                  </div>

                  {isSelected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="font-mono text-xs text-cyan-400/90 tracking-wider mt-3"
                    >
                      {item.tagline}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Deep Inspector Panel */}
          <div className="lg:col-span-5 sticky top-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.number}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 sm:p-10 rounded-3xl bg-[#08090B]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              >
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                    DISCIPLINE SPECIFICATION
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {active.number} / 06
                  </span>
                </div>

                <h4 className="font-editorial text-2xl sm:text-3xl font-bold uppercase text-white tracking-tight mb-4">
                  {active.title}
                </h4>

                <p className="font-sans text-neutral-300 text-sm sm:text-base leading-relaxed font-light mb-8">
                  {active.description}
                </p>

                {/* Key capabilities list */}
                <div className="mb-8">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 block mb-3">
                    CORE CAPABILITIES
                  </span>
                  <ul className="space-y-2">
                    {active.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-300 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 block mb-3">
                    PRODUCTION STACK
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {active.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-neutral-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
