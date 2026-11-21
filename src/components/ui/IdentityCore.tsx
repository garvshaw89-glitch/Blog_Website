import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  Cpu,
  Cloud,
  Terminal,
  Layers,
  Activity,
  Database,
  Globe,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { ArchitectAvatar } from './ArchitectAvatar';

interface RuntimeState {
  id: string;
  tabLabel: string;
  word: string;
  subtext: string;
  summary: string;
  themeColor: string;
  highlights: string[];
  activeMeshIds: string[];
  icon: React.ReactNode;
}

const RUNTIME_STATES: RuntimeState[] = [
  {
    id: 'architect',
    tabLabel: 'ARCHITECT',
    word: 'ARCHITECT',
    subtext: 'INTELLIGENT SYSTEMS DESIGN',
    summary:
      'Systems architecture uniting low-latency interfaces, async workers, and multi-region cloud delivery.',
    themeColor: '#38bdf8',
    highlights: ['Multi-Agent AI Orchestration', 'Distributed Edge Runtimes', 'Quantitative Financial Systems'],
    activeMeshIds: ['edge', 'ingress', 'core', 'infer', 'state'],
    icon: <Sparkles className="w-3.5 h-3.5 text-sky-300" />,
  },
  {
    id: 'ai',
    tabLabel: 'AI ENGINE',
    word: 'AI ENGINE',
    subtext: 'NEURAL REASONING & AGENTS',
    summary:
      'Deterministic LLM reasoning pipelines with structured tool execution and sub-second token streaming.',
    themeColor: '#22d3ee',
    highlights: ['Structured Tool Execution', 'Hybrid Vector Retrieval', 'Sub-Second Stream Inference'],
    activeMeshIds: ['ingress', 'stream', 'core', 'infer', 'workers'],
    icon: <Cpu className="w-3.5 h-3.5 text-cyan-300" />,
  },
  {
    id: 'cloud',
    tabLabel: 'CLOUD',
    word: 'CLOUD EDGE',
    subtext: 'MULTI-REGION INFRASTRUCTURE',
    summary:
      'Stateless auto-scaling containers, edge routing tables, and fault-isolated serverless compute clusters.',
    themeColor: '#818cf8',
    highlights: ['Stateless Cloud Run Containers', 'Edge Compute Gateways', 'Zero-Downtime Delivery'],
    activeMeshIds: ['edge', 'stream', 'core', 'workers', 'state'],
    icon: <Cloud className="w-3.5 h-3.5 text-indigo-300" />,
  },
  {
    id: 'runtimes',
    tabLabel: 'RUNTIMES',
    word: 'RUNTIMES',
    subtext: 'DISTRIBUTED EDGE & STREAMS',
    summary:
      'Coordinated execution fabric routing real-time WebSocket frames, worker pools, and replicated state.',
    themeColor: '#34d399',
    highlights: ['Bi-Directional Socket Streams', 'Async Worker Pools', 'Consistent Edge Replication'],
    activeMeshIds: ['edge', 'ingress', 'stream', 'core', 'infer', 'workers', 'state'],
    icon: <Activity className="w-3.5 h-3.5 text-emerald-300" />,
  },
  {
    id: 'systems',
    tabLabel: 'SYSTEMS',
    word: 'SYSTEMS',
    subtext: 'DETERMINISTIC ARCHITECTURE',
    summary:
      'Strict compile-time contracts, predictable state machines, and hardware-accelerated spatial interfaces.',
    themeColor: '#a78bfa',
    highlights: ['Typed Schema Boundaries', 'Predictable State Machines', 'GPU-Composited Interfaces'],
    activeMeshIds: ['ingress', 'core', 'workers', 'state'],
    icon: <Layers className="w-3.5 h-3.5 text-violet-300" />,
  },
  {
    id: 'build',
    tabLabel: 'PRODUCTS',
    word: 'PRODUCTS',
    subtext: 'FINANCE × APPLIED SOFTWARE',
    summary:
      'Translating quantitative market telemetry, payroll forecasting, and crisp interaction craft into production.',
    themeColor: '#fbbf24',
    highlights: ['Quantitative Market Terminals', 'Deterministic Tax & Payroll OS', 'Editorial Interaction Craft'],
    activeMeshIds: ['edge', 'stream', 'core', 'infer', 'state'],
    icon: <Terminal className="w-3.5 h-3.5 text-amber-300" />,
  },
];

interface MeshNodeDef {
  id: string;
  label: string;
  targetStateIndex: number;
  x: number;
  y: number;
  tier: 'ingress' | 'core' | 'compute';
}

const MESH_NODES: MeshNodeDef[] = [
  { id: 'edge', label: 'EDGE', targetStateIndex: 2, x: 16, y: 21, tier: 'ingress' },
  { id: 'ingress', label: 'GATE', targetStateIndex: 4, x: 14, y: 50, tier: 'ingress' },
  { id: 'stream', label: 'STREAM', targetStateIndex: 3, x: 16, y: 79, tier: 'ingress' },
  { id: 'core', label: 'CORE', targetStateIndex: 0, x: 50, y: 50, tier: 'core' },
  { id: 'infer', label: 'INFER', targetStateIndex: 1, x: 84, y: 21, tier: 'compute' },
  { id: 'workers', label: 'POOL', targetStateIndex: 3, x: 86, y: 50, tier: 'compute' },
  { id: 'state', label: 'STATE', targetStateIndex: 5, x: 84, y: 79, tier: 'compute' },
];

interface MeshLinkDef {
  id: string;
  from: string;
  to: string;
  path: string;
}

const MESH_LINKS: MeshLinkDef[] = [
  { id: 'edge-core', from: 'edge', to: 'core', path: 'M 160 210 Q 330 240 500 500' },
  { id: 'ingress-core', from: 'ingress', to: 'core', path: 'M 140 500 Q 320 455 500 500' },
  { id: 'stream-core', from: 'stream', to: 'core', path: 'M 160 790 Q 330 760 500 500' },
  { id: 'core-infer', from: 'core', to: 'infer', path: 'M 500 500 Q 670 240 840 210' },
  { id: 'core-workers', from: 'core', to: 'workers', path: 'M 500 500 Q 680 545 860 500' },
  { id: 'core-state', from: 'core', to: 'state', path: 'M 500 500 Q 670 760 840 790' },
  { id: 'edge-infer', from: 'edge', to: 'infer', path: 'M 160 210 Q 500 95 840 210' },
  { id: 'stream-state', from: 'stream', to: 'state', path: 'M 160 790 Q 500 905 840 790' },
];

function getMeshGlyph(id: string) {
  switch (id) {
    case 'edge':
      return <Globe className="w-3.5 h-3.5" />;
    case 'ingress':
      return <Layers className="w-3.5 h-3.5" />;
    case 'stream':
      return <Radio className="w-3.5 h-3.5" />;
    case 'infer':
      return <Sparkles className="w-3.5 h-3.5" />;
    case 'workers':
      return <Cpu className="w-3.5 h-3.5" />;
    case 'state':
      return <Database className="w-3.5 h-3.5" />;
    default:
      return <Activity className="w-3.5 h-3.5" />;
  }
}

export const IdentityCore: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % RUNTIME_STATES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const current = RUNTIME_STATES[index];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-3xl mx-auto select-none pointer-events-auto"
    >
      {/* Subtle Ambient Aura Matched to Active Subsystem */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-full opacity-25 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${current.themeColor} 0%, transparent 70%)`,
        }}
      />

      {/* Compact Multi-Plane Architectural Runtime Console */}
      <div className="relative rounded-2xl bg-[#070A10]/90 border border-white/[0.1] shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* LEFT STAGE (6 cols): Compact Distributed Mesh */}
          <div className="md:col-span-6 relative h-[220px] sm:h-[245px] p-3.5 overflow-hidden">
            {/* Subtle Coordinate Dot Matrix */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />

            {/* Dynamic Center Radial Spotlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${current.themeColor}20 0%, ${current.themeColor}06 40%, transparent 72%)`,
              }}
            />

            {/* Concentric Calibration Rings */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-[116px] sm:w-[132px] aspect-square rounded-full border transition-colors duration-500"
                style={{ borderColor: `${current.themeColor}34` }}
              />
              <div className="absolute w-[184px] sm:w-[210px] aspect-square rounded-full border border-dashed border-white/[0.06]" />
            </div>

            {/* Curved Fiber Mesh & Animated Signal Packets */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 w-full h-full"
            >
              <defs>
                <linearGradient id="runtimeMeshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={current.themeColor} stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.82" />
                  <stop offset="100%" stopColor={current.themeColor} stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {MESH_LINKS.map((link, linkIdx) => {
                const isActive =
                  current.activeMeshIds.includes(link.from) &&
                  current.activeMeshIds.includes(link.to);

                return (
                  <g key={link.id}>
                    {isActive && (
                      <path
                        d={link.path}
                        fill="none"
                        stroke={current.themeColor}
                        strokeOpacity="0.2"
                        strokeWidth="6"
                      />
                    )}
                    <path
                      d={link.path}
                      fill="none"
                      stroke={isActive ? 'url(#runtimeMeshGrad)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isActive ? '2.2' : '1'}
                      className="transition-all duration-500"
                    />
                    {isActive && !prefersReducedMotion && (
                      <circle r="4.5" fill={current.themeColor}>
                        <animateMotion
                          dur={`${2.0 + (linkIdx % 3) * 0.4}s`}
                          repeatCount="indefinite"
                          path={link.path}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Mesh Nodes */}
            <div className="relative w-full h-full">
              {MESH_NODES.map((node) => {
                const isNodeHighlighted = current.activeMeshIds.includes(node.id);
                const isHub = node.tier === 'core';

                if (isHub) {
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setIndex(node.targetStateIndex)}
                      aria-label="Inspect Runtime Core"
                      data-cursor="button"
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        transform: 'translate(-50%, -50%)',
                        borderColor: `${current.themeColor}88`,
                        boxShadow: `0 0 28px ${current.themeColor}34, inset 0 1px 0 rgba(255,255,255,0.16)`,
                      }}
                      className="absolute z-20 w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full bg-[#090F1A]/95 border flex flex-col items-center justify-center transition-all duration-500 hover:scale-105 cursor-pointer"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-1 rounded-full border border-white/[0.08]"
                      />
                      <div className="pointer-events-none">
                        <ArchitectAvatar size={38} interactive={false} />
                      </div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/85 mt-0.5">
                        {current.tabLabel}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setIndex(node.targetStateIndex)}
                    data-cursor="button"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                      isNodeHighlighted ? 'opacity-100 scale-100' : 'opacity-45 hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors duration-300 ${
                        isNodeHighlighted
                          ? 'bg-[#0C1524]/95 text-white'
                          : 'bg-[#090D16]/90 text-slate-400 group-hover:text-white'
                      }`}
                      style={{
                        borderColor: isNodeHighlighted
                          ? `${current.themeColor}78`
                          : 'rgba(255,255,255,0.12)',
                        boxShadow: isNodeHighlighted
                          ? `0 0 16px ${current.themeColor}2c`
                          : '0 4px 12px rgba(0,0,0,0.45)',
                        color: isNodeHighlighted ? current.themeColor : undefined,
                      }}
                    >
                      {getMeshGlyph(node.id)}
                    </div>
                    <span className="mt-1 font-mono text-[8px] sm:text-[9px] font-semibold tracking-[0.14em] text-[#D5D9DF] whitespace-nowrap pointer-events-none">
                      {node.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT STAGE (6 cols): Crisp Compact Architectural Spec */}
          <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between bg-[#060910]/65">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full justify-between text-left"
              >
                <div>
                  {/* Index & Eyebrow */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#A7ADB5]">
                      <span
                        className="tabular-nums font-semibold"
                        style={{ color: current.themeColor }}
                      >
                        0{index + 1}
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        ·
                      </span>
                      <span className="truncate">{current.subtext}</span>
                    </div>
                    <span className="shrink-0">{current.icon}</span>
                  </div>

                  {/* Compact Display Title */}
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F3F5] uppercase leading-none mb-2">
                    {current.word}
                  </h2>

                  <div
                    className="w-8 h-[2px] mb-2.5 transition-colors duration-500"
                    style={{ backgroundColor: current.themeColor }}
                  />

                  <p className="font-sans text-xs text-[#A7ADB5] leading-relaxed font-light mb-3.5">
                    {current.summary}
                  </p>
                </div>

                {/* Tight Hairline Subsystem Spec Rows */}
                <div className="border-t border-white/[0.08]">
                  {current.highlights.map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between py-1.5 border-b border-white/[0.06] last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[9px] text-[#626A73] tabular-nums">
                          0{idx + 1}
                        </span>
                        <span className="font-sans text-[11px] sm:text-xs text-[#E2E6EC]">
                          {item}
                        </span>
                      </div>
                      <ArrowRight
                        className="w-3 h-3 opacity-60 shrink-0"
                        style={{ color: current.themeColor }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slim Bottom Interactive Discipline Selector Rail */}
        <div
          role="tablist"
          aria-label="Select engineering discipline"
          className="border-t border-white/[0.08] bg-[#05070C]/92 px-3 sm:px-4 py-2 flex items-center justify-between gap-1.5 overflow-x-auto"
        >
          {RUNTIME_STATES.map((state, i) => {
            const isSelected = i === index;
            return (
              <button
                key={state.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setIndex(i)}
                data-cursor="button"
                className={`relative px-2.5 py-1 rounded-md font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white/[0.09] text-white font-semibold border border-white/15'
                    : 'text-[#626A73] border border-transparent hover:text-[#D5D9DF] hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className="tabular-nums text-[9px]"
                  style={{ color: isSelected ? state.themeColor : undefined }}
                >
                  0{i + 1}
                </span>
                <span>{state.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
