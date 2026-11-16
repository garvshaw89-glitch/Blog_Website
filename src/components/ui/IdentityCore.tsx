import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  Cpu,
  Cloud,
  Terminal,
  Layers,
  Activity,
} from 'lucide-react';
import { ArchitectAvatar } from './ArchitectAvatar';

interface IdentityCoreState {
  id: string;
  word: string;
  subtext: string;
  themeColor: string;
  highlights: string[];
  icon: React.ReactNode;
}

const IDENTITY_STATES: IdentityCoreState[] = [
  {
    id: 'architect',
    word: 'ARCHITECT',
    subtext: 'INTELLIGENT SYSTEMS DESIGN',
    themeColor: '#38bdf8',
    highlights: ['Multi-Agent AI', 'Distributed Runtimes', 'Financial Systems'],
    icon: <Sparkles className="w-4 h-4 text-sky-300" />,
  },
  {
    id: 'ai',
    word: 'AI ENGINE',
    subtext: 'NEURAL REASONING & AGENTS',
    themeColor: '#22d3ee',
    highlights: ['Structured Tool Use', 'Vector Retrieval', 'Streaming Inference'],
    icon: <Cpu className="w-4 h-4 text-cyan-300" />,
  },
  {
    id: 'cloud',
    word: 'CLOUD EDGE',
    subtext: 'MULTI-REGION INFRASTRUCTURE',
    themeColor: '#818cf8',
    highlights: ['Cloud Run Containers', 'Serverless Compute', 'Edge Caching'],
    icon: <Cloud className="w-4 h-4 text-indigo-300" />,
  },
  {
    id: 'runtimes',
    word: 'RUNTIMES',
    subtext: 'DISTRIBUTED EDGE & STREAMS',
    themeColor: '#34d399',
    highlights: ['WebSocket Telemetry', 'Zero-Copy Buffers', 'Async Workers'],
    icon: <Activity className="w-4 h-4 text-emerald-300" />,
  },
  {
    id: 'systems',
    word: 'SYSTEMS',
    subtext: 'DETERMINISTIC ARCHITECTURE',
    themeColor: '#a78bfa',
    highlights: ['Strict Type Schemas', 'State Machines', 'Zero-Lag UI'],
    icon: <Layers className="w-4 h-4 text-violet-300" />,
  },
  {
    id: 'build',
    word: 'PRODUCTS',
    subtext: 'FINANCE × APPLIED SOFTWARE',
    themeColor: '#fbbf24',
    highlights: ['Quant Terminals', 'Compensation OS', 'High-Craft UX'],
    icon: <Terminal className="w-4 h-4 text-amber-300" />,
  },
];

// Perimeter distributed runtime mesh points rendered on a 640x400 architectural SVG field
const MESH_NODES = [
  { id: 'edge-n', label: 'EDGE', x: 76, y: 78 },
  { id: 'infer-n', label: 'INFER', x: 564, y: 78 },
  { id: 'stream-n', label: 'STREAM', x: 46, y: 200 },
  { id: 'worker-n', label: 'WORKER', x: 594, y: 200 },
  { id: 'cache-n', label: 'CACHE', x: 76, y: 322 },
  { id: 'state-n', label: 'STATE', x: 564, y: 322 },
];

const MESH_PATHS = [
  'M 76 78 Q 200 130 320 200',
  'M 564 78 Q 440 130 320 200',
  'M 46 200 Q 180 200 320 200',
  'M 594 200 Q 460 200 320 200',
  'M 76 322 Q 200 270 320 200',
  'M 564 322 Q 440 270 320 200',
  'M 76 78 Q 320 24 564 78',
  'M 76 322 Q 320 376 564 322',
];

export const IdentityCore: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IDENTITY_STATES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const current = IDENTITY_STATES[index];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-3xl min-h-[340px] sm:min-h-[400px] mx-auto flex items-center justify-center select-none pointer-events-auto"
    >
      {/* Subtle Ambient Aura Matched to Active Discipline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[96px] opacity-20 transition-colors duration-700"
        style={{ backgroundColor: current.themeColor }}
      />

      {/* Precision Orbital Rings & Distributed Runtime Topology Mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute w-[280px] sm:w-[360px] h-[280px] sm:h-[360px] rounded-full border border-white/[0.06] transition-colors duration-500"
          style={{ borderColor: `${current.themeColor}22` }}
        />
        <div className="absolute w-[350px] sm:w-[440px] h-[350px] sm:h-[440px] rounded-full border border-dashed border-white/[0.05]" />

        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid meet"
          className="hidden sm:block w-full h-full max-w-[680px] opacity-80"
        >
          {MESH_PATHS.map((d, i) => (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={
                  i % 2 === index % 2
                    ? `${current.themeColor}55`
                    : 'rgba(255,255,255,0.08)'
                }
                strokeWidth={i % 2 === index % 2 ? '1.35' : '0.9'}
                className="transition-all duration-500"
              />
              {!prefersReducedMotion && i < 6 && i % 2 === index % 2 && (
                <circle r="2.4" fill={current.themeColor}>
                  <animateMotion
                    dur={`${2.6 + (i % 3) * 0.4}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              )}
            </g>
          ))}

          {MESH_NODES.map((node, i) => {
            const highlighted = i % 2 === index % 2;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={highlighted ? 4.5 : 3}
                  fill={highlighted ? current.themeColor : '#1e293b'}
                  stroke={highlighted ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                  strokeWidth="1"
                />
                <text
                  y={node.y > 200 ? 18 : -12}
                  textAnchor="middle"
                  fill={highlighted ? '#cbd5e1' : '#64748b'}
                  fontSize="9"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  letterSpacing="2"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Center Frosted Architectural Focal Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.94, y: 10 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.03, y: -10 }
          }
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center p-6 sm:p-8 rounded-[28px] bg-[#070A10]/92 border border-white/[0.11] shadow-[0_28px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] max-w-md w-full mx-4"
        >
          {/* Top Index & Clean Metadata Row */}
          <div className="w-full flex items-center justify-between pb-4 mb-5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#A7ADB5]">
              <span
                className="tabular-nums font-semibold"
                style={{ color: current.themeColor }}
              >
                0{index + 1}
              </span>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <span>{current.subtext}</span>
            </div>
            <span className="shrink-0">{current.icon}</span>
          </div>

          {/* Interactive Dot-Matrix Portrait */}
          <div className="mb-4">
            <ArchitectAvatar size={72} interactive={true} />
          </div>

          {/* Primary Sculpted Title */}
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#F2F3F5] uppercase leading-none">
            {current.word}
          </h2>

          {/* Unboxed Architectural Capabilities Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-[#A7ADB5]">
            {current.highlights.map((item, idx) => (
              <React.Fragment key={item}>
                {idx > 0 && (
                  <span aria-hidden="true" className="text-white/20">
                    ·
                  </span>
                )}
                <span className="whitespace-nowrap">{item}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Interactive State Selector Bar */}
          <div
            role="tablist"
            aria-label="Select engineering discipline"
            className="mt-6 pt-4 border-t border-white/[0.07] w-full flex items-center justify-between gap-1 overflow-x-auto"
          >
            {IDENTITY_STATES.map((state, i) => {
              const isSelected = i === index;
              return (
                <button
                  key={state.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setIndex(i)}
                  data-cursor="button"
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#626A73] hover:text-[#F2F3F5] hover:bg-white/[0.05]'
                  }`}
                >
                  {state.word.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
