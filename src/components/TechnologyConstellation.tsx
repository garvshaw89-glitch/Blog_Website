import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CONSTELLATION_NODES, CONSTELLATION_LINKS } from '../data/portfolioData';
import { ConstellationNode } from '../types';
import {
  ArrowUpRight,
  Cpu,
  Database,
  Cloud,
  Terminal,
  Sparkles,
  Code2,
  GitBranch,
  Layers,
  Activity,
} from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';

interface TechnologyConstellationProps {
  inSheet?: boolean;
  id?: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  Architecture: '#38bdf8',
  AI: '#22d3ee',
  Frontend: '#818cf8',
  Graphics: '#a78bfa',
  Backend: '#60a5fa',
  Languages: '#38bdf8',
  Data: '#34d399',
  Cloud: '#818cf8',
  DevOps: '#94a3b8',
  Core: '#38bdf8',
};

function getCategoryAccent(category: string): string {
  return CATEGORY_ACCENT[category] || '#38bdf8';
}

function getNodeIcon(category: string, isHub = false) {
  const sizeClass = isHub ? 'w-4 h-4' : 'w-3.5 h-3.5';
  switch (category) {
    case 'Architecture':
      return <Activity className={`${sizeClass} text-sky-300`} />;
    case 'AI':
      return <Sparkles className={`${sizeClass} text-cyan-300`} />;
    case 'Frontend':
      return <Layers className={`${sizeClass} text-indigo-300`} />;
    case 'Graphics':
      return <Cpu className={`${sizeClass} text-violet-300`} />;
    case 'Languages':
      return <Code2 className={`${sizeClass} text-sky-300`} />;
    case 'Backend':
      return <Terminal className={`${sizeClass} text-blue-300`} />;
    case 'Data':
      return <Database className={`${sizeClass} text-emerald-300`} />;
    case 'Cloud':
      return <Cloud className={`${sizeClass} text-indigo-300`} />;
    case 'DevOps':
      return <GitBranch className={`${sizeClass} text-slate-300`} />;
    default:
      return <Cpu className={`${sizeClass} text-slate-300`} />;
  }
}

function buildCurvedEdgePath(
  source: ConstellationNode,
  target: ConstellationNode,
  curveSign: number
): string {
  const x1 = source.x * 10;
  const y1 = source.y * 10;
  const x2 = target.x * 10;
  const y2 = target.y * 10;
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;

  const isHubEdge = source.level === 0 || target.level === 0;
  const curvature = isHubEdge ? 46 * curveSign : 64 * curveSign;

  // Bow outer ring chords outward from center (500, 500)
  if (!isHubEdge) {
    const radialX = mx - 500;
    const radialY = my - 500;
    const dot = nx * radialX + ny * radialY;
    const orientedSign = dot >= 0 ? 1 : -1;
    return `M ${x1} ${y1} Q ${mx + nx * 64 * orientedSign} ${my + ny * 64 * orientedSign} ${x2} ${y2}`;
  }

  return `M ${x1} ${y1} Q ${mx + nx * curvature} ${my + ny * curvature} ${x2} ${y2}`;
}

export const TechnologyConstellation: React.FC<TechnologyConstellationProps> = ({
  inSheet = false,
  id = 'constellation',
}) => {
  const [selectedId, setSelectedId] = useState<string>(CONSTELLATION_NODES[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const nodeMap = useMemo(() => {
    const map = new Map<string, ConstellationNode>();
    CONSTELLATION_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const selectedNode = nodeMap.get(selectedId) || CONSTELLATION_NODES[0];
  const activeFocusId = hoveredId || selectedId;
  const activeAccent = getCategoryAccent(selectedNode.category);

  const edgeDescriptors = useMemo(() => {
    return CONSTELLATION_LINKS.map((link, idx) => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return null;
      const curveSign = idx % 2 === 0 ? 1 : -1;
      return {
        key: `${link.source}-${link.target}`,
        source,
        target,
        path: buildCurvedEdgePath(source, target, curveSign),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [nodeMap]);

  const connectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    CONSTELLATION_LINKS.forEach((link) => {
      if (link.source === selectedNode.id) set.add(link.target);
      if (link.target === selectedNode.id) set.add(link.source);
    });
    return Array.from(set);
  }, [selectedNode.id]);

  const connectedNodes = useMemo(
    () =>
      connectedNodeIds
        .map((nodeId) => nodeMap.get(nodeId))
        .filter((n): n is ConstellationNode => Boolean(n)),
    [connectedNodeIds, nodeMap]
  );

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">07</span>
          <span className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-400">
            TOPOLOGY · ARCHITECTURAL GRAPH
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          TECHNOLOGY CONSTELLATION
        </span>
      </div>

      {/* Editorial Heading */}
      <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
        <GlitchHeading className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-4">
          TECHNOLOGY CONSTELLATION
        </GlitchHeading>
        <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light [text-wrap:balance]">
          Interactive runtime topology illustrating how distributed edge orchestration, AI inference,
          reactive clients, and persistence layers interlink in production systems.
        </p>
      </div>

      {/* Visual Graph & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        {/* Interactive Topology Field (7 cols) */}
        <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[480px] rounded-3xl bg-[#060B14]/90 border border-white/[0.09] p-4 sm:p-6 overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
          {/* Dynamic Radial Focus Aura Anchored to Selected Node */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] opacity-20 transition-all duration-700"
            style={{
              left: `${selectedNode.x}%`,
              top: `${selectedNode.y}%`,
              backgroundColor: activeAccent,
            }}
          />

          {/* Faint Architectural Calibration Guides & Concentric Orbital Rings */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <linearGradient id="constellationActiveLink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Calibration Crosshairs */}
            <line x1="500" y1="60" x2="500" y2="940" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
            <line x1="60" y1="500" x2="940" y2="500" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />

            {/* Inner & Outer Concentric Orbital Rings */}
            <circle
              cx="500"
              cy="500"
              r="230"
              fill="none"
              stroke="rgba(148,163,184,0.09)"
              strokeWidth="1"
            />
            <circle
              cx="500"
              cy="500"
              r="380"
              fill="none"
              stroke="rgba(56,189,248,0.08)"
              strokeWidth="1"
            />
            <circle
              cx="500"
              cy="500"
              r="455"
              fill="none"
              stroke="rgba(255,255,255,0.035)"
              strokeWidth="1"
            />

            {/* Curved Architectural Graph Links */}
            {edgeDescriptors.map((edge, idx) => {
              const isHighlighted =
                edge.source.id === activeFocusId || edge.target.id === activeFocusId;

              return (
                <g key={edge.key}>
                  <path
                    d={edge.path}
                    fill="none"
                    stroke={isHighlighted ? 'url(#constellationActiveLink)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth={isHighlighted ? 2.1 : 1}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && !prefersReducedMotion && (
                    <circle r="3.5" fill="#7dd3fc">
                      <animateMotion
                        dur={`${2.1 + (idx % 3) * 0.45}s`}
                        repeatCount="indefinite"
                        path={edge.path}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Node Layer */}
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[430px]">
            {CONSTELLATION_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isNeighbor = connectedNodeIds.includes(node.id);
              const accent = getCategoryAccent(node.category);
              const isHub = node.level === 0;

              return (
                <button
                  key={node.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: isSelected
                      ? accent
                      : isNeighbor
                      ? 'rgba(125,211,252,0.35)'
                      : 'rgba(255,255,255,0.12)',
                    boxShadow: isSelected
                      ? `0 0 28px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.16)`
                      : isNeighbor
                      ? '0 0 16px rgba(56,189,248,0.12)'
                      : '0 8px 24px rgba(0,0,0,0.45)',
                  }}
                  className={`absolute flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 font-mono transition-all duration-200 cursor-pointer ${
                    isHub
                      ? 'px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#091221]/95 border text-[11px] sm:text-xs font-bold tracking-[0.16em] text-white z-20'
                      : 'px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0A111E]/92 border text-[10px] sm:text-xs font-medium text-slate-200 hover:text-white z-10'
                  } ${isSelected ? 'scale-105 z-30 text-white' : 'hover:scale-[1.04]'}`}
                >
                  <span className="shrink-0">{getNodeIcon(node.category, isHub)}</span>
                  <span>{node.label}</span>
                </button>
              );
            })}
          </div>

          {/* Clean Hairline Footer Bar */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
            <span>{selectedNode.label} · TIER {selectedNode.level}</span>
            <span>{connectedNodes.length} LINKED NODES</span>
          </div>
        </div>

        {/* Right Architectural Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full p-6 sm:p-8 rounded-3xl bg-[#060B14]/90 border border-white/[0.09] shadow-[0_24px_70px_rgba(0,0,0,0.8)] flex flex-col justify-between"
            >
              <div>
                {/* Inspector Metadata Eyebrow (Zero Pill Boxes) */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-300">
                    {getNodeIcon(selectedNode.category, selectedNode.level === 0)}
                    <span>{selectedNode.category}</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    TIER {selectedNode.level}
                  </span>
                </div>

                {/* Selected Node Title & Summary */}
                <h3 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase tracking-tight mb-3">
                  {selectedNode.label}
                </h3>

                <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed font-light mb-6">
                  {selectedNode.description}
                </p>

                {/* Deployment Surface */}
                <div className="py-4 border-t border-white/[0.08]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 block mb-1.5">
                    RUNTIME SURFACE
                  </span>
                  <p className="text-xs sm:text-sm font-sans text-slate-200 leading-relaxed">
                    {selectedNode.whereUsed}
                  </p>
                </div>

                {/* Connected Nodes Quick Navigation */}
                <div className="py-4 border-t border-white/[0.08]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 block mb-2.5">
                    CONNECTED INTERFACES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedNodes.map((neighbor) => (
                      <button
                        key={neighbor.id}
                        type="button"
                        onClick={() => setSelectedId(neighbor.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-sky-400/50 hover:text-white text-slate-300 font-mono text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      >
                        {getNodeIcon(neighbor.category)}
                        <span>{neighbor.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Related Production Systems */}
              <div className="pt-4 border-t border-white/[0.08]">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 block mb-2.5">
                  PRODUCTION SYSTEMS
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.relatedProjects.map((project) => (
                    <a
                      key={project}
                      href="#projects"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-sky-400/60 hover:text-sky-300 text-slate-200 font-mono text-xs whitespace-nowrap shrink-0 transition-colors"
                    >
                      <span>{project}</span>
                      <ArrowUpRight className="w-3 h-3 text-sky-400" />
                    </a>
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
      className="relative w-full py-20 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      {content}
    </section>
  );
};
