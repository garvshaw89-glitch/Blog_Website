import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Cpu,
  Cloud,
  Code2,
  Layers,
  TrendingUp,
  Briefcase,
  Sparkles,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';
import { DigitalDnaThreeCanvas } from './ui/DigitalDnaThreeCanvas';

interface DnaNode {
  id: string;
  index: string;
  label: string;
  category: string;
  x: number;
  y: number;
  accent: string;
  description: string;
  connectedTo: string[];
  techStack: string[];
}

const DNA_NODES: DnaNode[] = [
  {
    id: 'synthesis-hub',
    index: '00',
    label: 'SYSTEMS',
    category: 'SYNTHESIS',
    x: 50,
    y: 50,
    accent: '#38bdf8',
    description:
      'Unified engineering discipline linking applied intelligence, distributed cloud runtimes, software architecture, and financial modeling into production platforms.',
    connectedTo: ['ai', 'cloud', 'code', 'software', 'business', 'finance', 'design'],
    techStack: ['Systems Thinking', 'Full-Stack Architecture', 'Quantitative Design'],
  },
  {
    id: 'ai',
    index: '01',
    label: 'AI',
    category: 'INTELLIGENCE',
    x: 50,
    y: 16,
    accent: '#22d3ee',
    description:
      'Deterministic reasoning pipelines, LLM structured tool execution, semantic vector retrieval, and low-latency streaming inference.',
    connectedTo: ['synthesis-hub', 'code', 'finance'],
    techStack: ['Gemini 3.8 Flash', 'PyTorch', 'Vector Search', 'LangChain'],
  },
  {
    id: 'cloud',
    index: '02',
    label: 'CLOUD',
    category: 'INFRASTRUCTURE',
    x: 77,
    y: 28,
    accent: '#818cf8',
    description:
      'Stateless auto-scaling containers, serverless event ingestion, multi-region edge caching, and automated zero-downtime delivery.',
    connectedTo: ['synthesis-hub', 'code', 'software'],
    techStack: ['Google Cloud Run', 'AWS Lambda & S3', 'Docker', 'Vercel Edge'],
  },
  {
    id: 'software',
    index: '03',
    label: 'SOFTWARE',
    category: 'PLATFORM',
    x: 84,
    y: 57,
    accent: '#60a5fa',
    description:
      'Production web systems engineered with strict runtime schema boundaries, deterministic state machines, and resilient API contracts.',
    connectedTo: ['synthesis-hub', 'cloud', 'design'],
    techStack: ['React 19', 'Next.js 15', 'Tailwind CSS v4', 'Zod'],
  },
  {
    id: 'design',
    index: '04',
    label: 'DESIGN',
    category: 'EXPERIENCE',
    x: 66,
    y: 81,
    accent: '#a78bfa',
    description:
      'Editorial typographic hierarchy, tactile spring-physics micro-interactions, and GPU-composited 60–120 FPS spatial interfaces.',
    connectedTo: ['synthesis-hub', 'software'],
    techStack: ['Design Systems', 'Motion 12', 'Figma', 'WebGL Shaders'],
  },
  {
    id: 'finance',
    index: '05',
    label: 'FINANCE',
    category: 'QUANTITATIVE',
    x: 34,
    y: 81,
    accent: '#fbbf24',
    description:
      'Order book microstructure analytics, real-time WebSocket price telemetry, and deterministic compensation & tax forecasting.',
    connectedTo: ['synthesis-hub', 'business', 'ai'],
    techStack: ['Market Microstructure', 'Realtime WebSockets', 'Predictive Modeling'],
  },
  {
    id: 'business',
    index: '06',
    label: 'BUSINESS',
    category: 'STRATEGY',
    x: 16,
    y: 57,
    accent: '#34d399',
    description:
      'Translating commercial constraints into scalable technical roadmaps, cost-efficient cloud topologies, and measurable product outcomes.',
    connectedTo: ['synthesis-hub', 'finance'],
    techStack: ['Product Strategy', 'System Economics', 'Workflow Automation'],
  },
  {
    id: 'code',
    index: '07',
    label: 'CODE',
    category: 'ENGINEERING',
    x: 23,
    y: 28,
    accent: '#38bdf8',
    description:
      'Type-safe TypeScript systems, low-level C memory and socket fundamentals, and high-throughput asynchronous Python services.',
    connectedTo: ['synthesis-hub', 'ai', 'cloud', 'software'],
    techStack: ['TypeScript', 'Python', 'C11', 'FastAPI', 'Node.js'],
  },
];

// Unique undirected edges for clean SVG rendering without duplicate double-strokes
interface EdgeDescriptor {
  key: string;
  source: DnaNode;
  target: DnaNode;
  path: string;
}

function buildCurvedPath(source: DnaNode, target: DnaNode, curveSign: number): string {
  const x1 = source.x * 10;
  const y1 = source.y * 10;
  const x2 = target.x * 10;
  const y2 = target.y * 10;
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5;

  const isHubEdge = source.id === 'synthesis-hub' || target.id === 'synthesis-hub';
  if (isHubEdge) {
    // Graceful galactic spiral spoke curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const offset = 52 * curveSign;
    return `M ${x1} ${y1} Q ${(mx + nx * offset).toFixed(1)} ${(my + ny * offset).toFixed(1)} ${x2} ${y2}`;
  }

  // Peripheral arc curving gently toward center
  const cx = mx * 0.72 + 500 * 0.28;
  const cy = my * 0.72 + 500 * 0.28;
  return `M ${x1} ${y1} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
}

function getNodeIcon(id: string, className: string) {
  switch (id) {
    case 'synthesis-hub':
      return <Cpu className={className} />;
    case 'ai':
      return <Sparkles className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'software':
      return <Layers className={className} />;
    case 'business':
      return <Briefcase className={className} />;
    case 'finance':
      return <TrendingUp className={className} />;
    case 'design':
    default:
      return <Compass className={className} />;
  }
}

interface DigitalDnaSectionProps {
  inSheet?: boolean;
  id?: string;
}

export const DigitalDnaSection: React.FC<DigitalDnaSectionProps> = ({
  inSheet = false,
  id = 'digital-dna',
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string>('synthesis-hub');
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeNode =
    DNA_NODES.find((n) => n.id === activeNodeId) || DNA_NODES[0];

  const connectedNodes = useMemo(
    () =>
      activeNode.connectedTo
        .map((cid) => DNA_NODES.find((n) => n.id === cid))
        .filter((n): n is DnaNode => Boolean(n)),
    [activeNode]
  );

  // Deduplicate undirected pairs once
  const edges = useMemo<EdgeDescriptor[]>(() => {
    const seen = new Set<string>();
    const list: EdgeDescriptor[] = [];
    DNA_NODES.forEach((src) => {
      src.connectedTo.forEach((tid, idx) => {
        const tgt = DNA_NODES.find((n) => n.id === tid);
        if (!tgt) return;
        const pairKey = [src.id, tgt.id].sort().join('--');
        if (seen.has(pairKey)) return;
        seen.add(pairKey);
        list.push({
          key: pairKey,
          source: src,
          target: tgt,
          path: buildCurvedPath(src, tgt, idx % 2 === 0 ? 1 : -1),
        });
      });
    });
    return list;
  }, []);

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-16">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#7EA7FF] font-semibold text-xs">
            03
          </span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">
            ·
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A7ADB5]">
            SYSTEMIC TOPOLOGY &amp; ARCHITECTURE
          </span>
        </div>
        <span className="font-mono text-xs text-[#626A73]">3D BIOLOGICAL HELIX</span>
      </div>

      {/* Section Headline */}
      <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
        <GlitchHeading className="font-editorial text-3xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-4">
          DIGITAL DNA
        </GlitchHeading>
        <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light [text-wrap:balance]">
          An interactive 3D biological helix &amp; architectural topology mapping how intelligence, cloud runtimes, quantitative modeling, and product craft interlock.
        </p>
      </div>

      {/* Interactive Orbital DNA Graph & Precision Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        {/* Left/Main Orbital Topology Canvas (8 cols) */}
        <div
          ref={canvasContainerRef}
          className="lg:col-span-8 relative min-h-[420px] sm:min-h-[500px] md:min-h-[560px] rounded-3xl bg-[#070A10]/88 border border-white/[0.09] p-4 sm:p-6 overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.82)]"
        >
          {/* Three.js 3D Biological Double-Helix Particle Field Reactive to Mouse Proximity */}
          <DigitalDnaThreeCanvas
            containerRef={canvasContainerRef}
            activeAccent={activeNode.accent}
            reducedMotion={Boolean(prefersReducedMotion)}
          />

          {/* Subtle Ambient Radial Focal Glow synced to active node */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at ${activeNode.x}% ${activeNode.y}%, rgba(56, 189, 248, 0.12) 0%, rgba(126, 167, 255, 0.04) 32%, transparent 65%)`,
            }}
          />

          {/* Subtle Precision Coordinate Grid Dots */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Concentric Orbital Rings & Radial Crosshairs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[34%] aspect-square rounded-full border border-white/[0.06]" />
            <div className="absolute w-[68%] aspect-square rounded-full border border-dashed border-white/[0.05]" />
            <div className="absolute w-[92%] aspect-square rounded-full border border-white/[0.03]" />
          </div>

          {/* Curved Synaptic Connection Paths + Animated Data Packets */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <linearGradient id="dnaActiveLink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.82" />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const isHighlighted =
                activeNode.id === edge.source.id ||
                activeNode.id === edge.target.id;

              return (
                <g key={edge.key}>
                  <path
                    d={edge.path}
                    fill="none"
                    stroke={
                      isHighlighted
                        ? 'url(#dnaActiveLink)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }
                    strokeWidth={isHighlighted ? 2.4 : 1}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  {isHighlighted && !prefersReducedMotion && (
                    <circle r="4.2" fill="#7dd3fc">
                      <animateMotion
                        dur="2.4s"
                        repeatCount="indefinite"
                        path={edge.path}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Precision Nodes */}
          {DNA_NODES.map((node) => {
            const isActive = activeNode.id === node.id;
            const isConnected = activeNode.connectedTo.includes(node.id);
            const isCenter = node.id === 'synthesis-hub';

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveNodeId(node.id)}
                onMouseEnter={() => setActiveNodeId(node.id)}
                data-cursor="button"
                data-cursor-label={node.label}
                aria-pressed={isActive}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 cursor-pointer flex flex-col items-center group transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full ${
                  isActive
                    ? 'scale-110 z-20'
                    : isConnected
                    ? 'opacity-95 hover:scale-105'
                    : 'opacity-65 hover:opacity-100 hover:scale-105'
                }`}
              >
                {isCenter ? (
                  <div
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-[#0C1422] border-2 border-cyan-300/80 shadow-[0_0_40px_rgba(56,189,248,0.38)]'
                        : 'bg-[#0A0E17]/95 border border-white/25 group-hover:border-cyan-300/60 shadow-[0_0_25px_rgba(0,0,0,0.85)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-1.5 rounded-full border border-white/[0.08]"
                    />
                    {getNodeIcon(
                      node.id,
                      `w-4 h-4 mb-1 transition-colors ${
                        isActive ? 'text-cyan-300' : 'text-[#7EA7FF]'
                      }`
                    )}
                    <span className="font-editorial text-[11px] sm:text-xs font-bold tracking-wider text-[#F2F3F5]">
                      {node.label}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-cyan-400 text-[#050608] border border-cyan-200 shadow-[0_0_28px_rgba(56,189,248,0.55)]'
                        : isConnected
                        ? 'bg-[#0D131F]/95 text-[#F2F3F5] border border-cyan-400/40 shadow-[0_8px_24px_rgba(0,0,0,0.65)]'
                        : 'bg-[#0B0E14]/92 text-[#A7ADB5] border border-white/15 group-hover:border-white/35 group-hover:text-white'
                    }`}
                  >
                    {getNodeIcon(
                      node.id,
                      `w-4 h-4 sm:w-5 sm:h-5 ${
                        isActive
                          ? 'text-[#050608]'
                          : isConnected
                          ? 'text-cyan-300'
                          : 'text-[#A7ADB5] group-hover:text-white'
                      }`
                    )}
                  </div>
                )}

                <div className="mt-1.5 flex flex-col items-center text-center pointer-events-none">
                  {!isCenter && (
                    <span
                      className={`font-editorial text-[11px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-cyan-300'
                          : isConnected
                          ? 'text-[#F2F3F5]'
                          : 'text-[#A7ADB5]'
                      }`}
                    >
                      {node.label}
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#626A73] whitespace-nowrap">
                    {node.category}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Clean Unboxed Footer Legend */}
          <div className="absolute bottom-3.5 left-5 right-5 flex items-center justify-between text-[10px] font-mono text-[#626A73] pointer-events-none">
            <span>MOVE CURSOR OVER HELIX · CLICK ANY DISCIPLINE NODE</span>
            <span className="hidden sm:inline text-[#A7ADB5]">
              {activeNode.connectedTo.length} ACTIVE SYNAPSES
            </span>
          </div>
        </div>

        {/* Right Column: Precision Discipline Inspector (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_24px_70px_rgba(0,0,0,0.82)]"
            >
              <div>
                {/* Clean Typographic Metadata Header (Zero-Pill, Zero Code-Comment) */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6 font-mono text-xs">
                  <div className="flex items-center gap-2 text-[#7EA7FF]">
                    <span className="tabular-nums font-semibold">
                      {activeNode.index}
                    </span>
                    <span aria-hidden="true" className="text-white/25">
                      ·
                    </span>
                    <span className="uppercase tracking-widest">
                      {activeNode.category}
                    </span>
                  </div>
                  {getNodeIcon(activeNode.id, 'w-4 h-4 text-cyan-300/85')}
                </div>

                <h3 className="font-editorial text-3xl sm:text-4xl font-bold uppercase text-[#F2F3F5] tracking-tight mb-4">
                  {activeNode.label}
                </h3>

                <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light mb-8">
                  {activeNode.description}
                </p>

                {/* Core Stack Specification */}
                <div className="mb-8">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-3">
                    CORE CAPABILITIES
                  </span>
                  <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {activeNode.techStack.map((tech, idx) => (
                      <div
                        key={tech}
                        className="py-2.5 flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-[#F2F3F5]">{tech}</span>
                        <span className="text-[#626A73] tabular-nums">
                          0{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Connected Disciplines Jump Matrix */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-3">
                  CONNECTED DISCIPLINES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedNodes.map((cn) => (
                    <button
                      key={cn.id}
                      type="button"
                      onClick={() => setActiveNodeId(cn.id)}
                      data-cursor="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-400/15 border border-white/[0.08] hover:border-cyan-400/40 font-mono text-[11px] text-[#A7ADB5] hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>{cn.label}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-70" />
                    </button>
                  ))}
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
