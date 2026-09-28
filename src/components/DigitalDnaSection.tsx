import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Cloud, Terminal, Layers, TrendingUp, DollarSign, Sparkles } from 'lucide-react';

interface DnaNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  description: string;
  connectedTo: string[];
  techStack: string[];
}

const DNA_NODES: DnaNode[] = [
  {
    id: 'garv-core',
    label: 'GARV',
    category: 'CORE',
    x: 50,
    y: 50,
    description: 'Central engineering nucleus connecting intelligence, infrastructure, product systems, and economics.',
    connectedTo: ['ai', 'cloud', 'code', 'software', 'business', 'finance', 'design'],
    techStack: ['Systems Thinking', 'Full-Stack Architecture', 'Quantitative Design'],
  },
  {
    id: 'ai',
    label: 'AI',
    category: 'INTELLIGENCE',
    x: 24,
    y: 26,
    description: 'Neural models, LLM Socratic reasoning, vector embeddings, and autonomous function calling.',
    connectedTo: ['garv-core', 'code', 'finance'],
    techStack: ['Gemini 3.8 Flash', 'PyTorch', 'Vector Search', 'LangChain'],
  },
  {
    id: 'cloud',
    label: 'CLOUD',
    category: 'INFRASTRUCTURE',
    x: 76,
    y: 26,
    description: 'Stateless auto-scaling containers, serverless event ingestion, and edge CDN delivery networks.',
    connectedTo: ['garv-core', 'code', 'software'],
    techStack: ['Google Cloud Run', 'AWS Lambda & S3', 'Docker', 'Vercel Edge'],
  },
  {
    id: 'code',
    label: 'CODE',
    category: 'ENGINEERING',
    x: 16,
    y: 52,
    description: 'Clean TypeScript architectures, low-level C memory concepts, and asynchronous Python microservices.',
    connectedTo: ['garv-core', 'ai', 'cloud', 'software'],
    techStack: ['TypeScript', 'Python', 'C11', 'FastAPI', 'Node.js'],
  },
  {
    id: 'software',
    label: 'SOFTWARE',
    category: 'ARCHITECTURE',
    x: 84,
    y: 52,
    description: 'Production web platforms built with React 19, strict runtime schema boundaries, and state machines.',
    connectedTo: ['garv-core', 'cloud', 'design'],
    techStack: ['React 19', 'Next.js 15', 'Tailwind CSS v4', 'Zod'],
  },
  {
    id: 'business',
    label: 'BUSINESS',
    category: 'STRATEGY',
    x: 28,
    y: 78,
    description: 'Product-market fit synthesis, high ROI architectural roadmaps, and digital product economics.',
    connectedTo: ['garv-core', 'finance'],
    techStack: ['Product Strategy', 'Systems Modeling', 'Growth Analytics'],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    category: 'QUANTITATIVE',
    x: 50,
    y: 84,
    description: 'Order book microstructure, real-time WebSocket market telemetry, and predictive wealth calculators.',
    connectedTo: ['garv-core', 'business', 'ai'],
    techStack: ['Market Microstructure', 'Realtime WebSockets', 'Predictive Modeling'],
  },
  {
    id: 'design',
    label: 'DESIGN',
    category: 'EXPERIENCE',
    x: 72,
    y: 78,
    description: 'High-end typographic hierarchy, fluid spring physics micro-interactions, and 60-120 FPS aesthetics.',
    connectedTo: ['garv-core', 'software'],
    techStack: ['Design Systems', 'Motion 12', 'Figma', 'Micro-Interactions'],
  },
];

interface DigitalDnaSectionProps {
  id?: string;
}

export const DigitalDnaSection: React.FC<DigitalDnaSectionProps> = ({
  id = 'digital-dna',
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string>('garv-core');
  const activeNode = DNA_NODES.find((n) => n.id === activeNodeId) || DNA_NODES[0];

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">03 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              SYSTEMIC NETWORK // DIGITAL DNA
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">INTERACTIVE GRAPH</span>
        </div>

        {/* Section Headline */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            DIGITAL DNA
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
            A visual network illustrating how my engineering disciplines interconnect around a single central core: building defensible, high-performance digital products.
          </p>
        </div>

        {/* Interactive Network Graph & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* SVG Canvas Map */}
          <div className="lg:col-span-8 relative h-[420px] sm:h-[500px] md:h-[560px] rounded-3xl bg-[#08090B]/90 border border-white/10 p-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {DNA_NODES.map((sourceNode) =>
                sourceNode.connectedTo.map((targetId) => {
                  const targetNode = DNA_NODES.find((n) => n.id === targetId);
                  if (!targetNode) return null;

                  const isHighlighted =
                    activeNode.id === sourceNode.id || activeNode.id === targetNode.id;

                  return (
                    <line
                      key={`${sourceNode.id}-${targetNode.id}`}
                      x1={`${sourceNode.x}%`}
                      y1={`${sourceNode.y}%`}
                      x2={`${targetNode.x}%`}
                      y2={`${targetNode.y}%`}
                      stroke={isHighlighted ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '4 3' : 'none'}
                      className="transition-all duration-300"
                    />
                  );
                })
              )}
            </svg>

            {/* Interactive Nodes */}
            {DNA_NODES.map((node) => {
              const isActive = activeNode.id === node.id;
              const isCenter = node.id === 'garv-core';

              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  data-cursor="button"
                  data-cursor-label={node.label}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 cursor-pointer flex flex-col items-center group transition-all duration-300 ${
                    isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`rounded-2xl flex items-center justify-center font-editorial font-bold transition-all ${
                      isCenter
                        ? 'w-16 h-16 sm:w-20 sm:h-20 bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] text-sm sm:text-base'
                        : isActive
                        ? 'w-12 h-12 sm:w-14 sm:h-14 bg-cyan-400 text-black shadow-[0_0_25px_rgba(6,182,212,0.6)] text-xs sm:text-sm'
                        : 'w-10 h-10 sm:w-12 sm:h-12 bg-neutral-900 border border-white/20 text-neutral-300 text-[11px] sm:text-xs'
                    }`}
                  >
                    {node.label}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mt-1.5 whitespace-nowrap">
                    {node.category}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Node Details Inspector */}
          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-3xl bg-[#08090B]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                    NETWORK NODE // {activeNode.category}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>

                <h3 className="font-editorial text-3xl font-bold uppercase text-white tracking-tight mb-3">
                  {activeNode.label}
                </h3>

                <p className="font-sans text-neutral-300 text-sm leading-relaxed font-light mb-6">
                  {activeNode.description}
                </p>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-2.5">
                    ASSOCIATED CAPABILITIES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.techStack.map((tech) => (
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
