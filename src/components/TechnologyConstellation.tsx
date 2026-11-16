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

function getNodeIcon(category: string, className = 'w-4 h-4') {
  switch (category) {
    case 'Architecture':
      return <Activity className={className} />;
    case 'AI':
      return <Sparkles className={className} />;
    case 'Frontend':
      return <Layers className={className} />;
    case 'Graphics':
      return <Cpu className={className} />;
    case 'Languages':
      return <Code2 className={className} />;
    case 'Backend':
      return <Terminal className={className} />;
    case 'Data':
      return <Database className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'DevOps':
      return <GitBranch className={className} />;
    default:
      return <Cpu className={className} />;
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
  if (!isHubEdge) {
    const radialX = mx - 500;
    const radialY = my - 500;
    const dot = nx * radialX + ny * radialY;
    const orientedSign = dot >= 0 ? 1 : -1;
    return `M ${x1} ${y1} Q ${(mx + nx * 64 * orientedSign).toFixed(1)} ${(my + ny * 64 * orientedSign).toFixed(1)} ${x2} ${y2}`;
  }

  const curvature = 46 * curveSign;
  return `M ${x1} ${y1} Q ${(mx + nx * curvature).toFixed(1)} ${(my + ny * curvature).toFixed(1)} ${x2} ${y2}`;
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
  const activeFocusNode = nodeMap.get(activeFocusId) || selectedNode;
  const activeAccent = getCategoryAccent(activeFocusNode.category);

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

  const calibrationTicks = useMemo(() => {
    const ticks: Array<{ x1: number; y1: number; x2: number; y2: number; major: boolean }> = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const major = deg % 45 === 0;
      const rIn = major ? 444 : 450;
      const rOut = 458;
      ticks.push({
        x1: 500 + Math.cos(rad) * rIn,
        y1: 500 + Math.sin(rad) * rIn,
        x2: 500 + Math.cos(rad) * rOut,
        y2: 500 + Math.sin(rad) * rOut,
        major,
      });
    }
    return ticks;
  }, []);

  const getConnectedIds = (targetId: string) => {
    const set = new Set<string>();
    CONSTELLATION_LINKS.forEach((link) => {
      if (link.source === targetId) set.add(link.target);
      if (link.target === targetId) set.add(link.source);
    });
    return Array.from(set);
  };

  const connectedToFocusIds = useMemo(() => getConnectedIds(activeFocusId), [activeFocusId]);
  const connectedToSelectedIds = useMemo(() => getConnectedIds(selectedNode.id), [selectedNode.id]);

  const connectedNodes = useMemo(
    () =>
      connectedToSelectedIds
        .map((nodeId) => nodeMap.get(nodeId))
        .filter((n): n is ConstellationNode => Boolean(n)),
    [connectedToSelectedIds, nodeMap]
  );

  const couplingRatio = Math.round(
    (connectedNodes.length / Math.max(1, CONSTELLATION_NODES.length - 1)) * 100
  );

  const content = (
    <div className="max-w-6xl mx-auto">
      {/* Compact Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">07</span>
          <span className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#A7ADB5]">
            TOPOLOGY · DISTRIBUTED RUNTIMES
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          TECHNOLOGY CONSTELLATION
        </span>
      </div>

      {/* Editorial Heading */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <GlitchHeading className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-3">
          TECHNOLOGY CONSTELLATION
        </GlitchHeading>
        <p className="font-sans text-[#A7ADB5] text-xs sm:text-sm leading-relaxed font-light [text-wrap:balance]">
          Interactive runtime topology illustrating how distributed edge orchestration, AI inference,
          reactive clients, and persistence layers interlink in production systems.
        </p>
      </div>

      {/* Balanced Compact Visual Graph & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Interactive Topology Field (7 cols) */}
        <div className="lg:col-span-7 relative h-[350px] sm:h-[400px] rounded-2xl bg-[#070A10]/90 border border-white/[0.09] p-3.5 sm:p-5 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between">
          {/* Dynamic Radial Focus Glow Anchored to Active Node */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at ${activeFocusNode.x}% ${activeFocusNode.y}%, ${activeAccent}22 0%, ${activeAccent}08 32%, transparent 65%)`,
            }}
          />

          {/* Precision Coordinate Matrix */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Compact Topology Coordinate Space */}
          <div className="relative flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                <linearGradient id="constellationActiveLink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={activeAccent} stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.78" />
                </linearGradient>
              </defs>

              <line x1="500" y1="60" x2="500" y2="940" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
              <line x1="60" y1="500" x2="940" y2="500" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />

              <circle cx="500" cy="500" r="230" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
              <circle cx="500" cy="500" r="380" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="1" />
              <circle
                cx="500"
                cy="500"
                r="458"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />

              {calibrationTicks.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.major ? 'rgba(56,189,248,0.28)' : 'rgba(255,255,255,0.09)'}
                  strokeWidth={t.major ? '1.4' : '1'}
                />
              ))}

              {edgeDescriptors.map((edge, idx) => {
                const isHighlighted =
                  edge.source.id === activeFocusId || edge.target.id === activeFocusId;

                return (
                  <g key={edge.key}>
                    {isHighlighted && (
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={activeAccent}
                        strokeOpacity="0.18"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    )}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={isHighlighted ? 'url(#constellationActiveLink)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isHighlighted ? 2.1 : 1}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                    {isHighlighted && !prefersReducedMotion && (
                      <circle r="3.8" fill="#e0f2fe">
                        <animateMotion
                          dur={`${2.0 + (idx % 3) * 0.45}s`}
                          repeatCount="indefinite"
                          path={edge.path}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Compact Sculpted Medallion Nodes */}
            {CONSTELLATION_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isFocus = activeFocusId === node.id;
              const isNeighbor = connectedToFocusIds.includes(node.id);
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
                  data-cursor="button"
                  data-cursor-label={node.label}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 flex flex-col items-center group cursor-pointer transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-full ${
                    isFocus
                      ? 'scale-105 z-30 opacity-100'
                      : isNeighbor
                      ? 'opacity-95 z-20 hover:scale-105'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {isHub ? (
                    <div
                      className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-[#0A1220]/95 border"
                      style={{
                        borderColor: isFocus ? accent : 'rgba(255,255,255,0.22)',
                        boxShadow: isFocus
                          ? `0 0 32px ${accent}48, inset 0 1px 0 rgba(255,255,255,0.18)`
                          : '0 0 20px rgba(0,0,0,0.85)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-1 rounded-full border border-white/[0.08]"
                      />
                      <span style={{ color: isFocus ? accent : '#7dd3fc' }} className="mb-0.5">
                        {getNodeIcon(node.category, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                      </span>
                      <span className="font-editorial text-[9px] sm:text-[10px] font-bold tracking-[0.12em] text-[#F2F3F5]">
                        {node.label}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300 border"
                      style={{
                        backgroundColor: isFocus
                          ? '#0E1A2D'
                          : isNeighbor
                          ? 'rgba(13,19,31,0.95)'
                          : 'rgba(10,14,22,0.92)',
                        borderColor: isFocus
                          ? accent
                          : isNeighbor
                          ? `${accent}66`
                          : 'rgba(255,255,255,0.14)',
                        boxShadow: isFocus
                          ? `0 0 20px ${accent}44, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : isNeighbor
                          ? `0 0 12px ${accent}1c`
                          : '0 6px 14px rgba(0,0,0,0.5)',
                        color: isFocus || isNeighbor ? accent : '#94a3b8',
                      }}
                    >
                      {getNodeIcon(node.category, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                    </div>
                  )}

                  {!isHub && (
                    <span
                      className="mt-1 font-editorial text-[9px] sm:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap pointer-events-none transition-colors"
                      style={{
                        color: isFocus ? '#ffffff' : isNeighbor ? '#e2e8f0' : '#94a3b8',
                      }}
                    >
                      {node.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slim Footer Bar */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/[0.06] text-[9px] font-mono uppercase tracking-[0.18em] text-[#626A73]">
            <span>{activeFocusNode.label} · TIER 0{activeFocusNode.level}</span>
            <span>{connectedToFocusIds.length} LINKED INTERFACES</span>
          </div>
        </div>

        {/* Compact Right Architectural Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[60px] opacity-20 transition-colors duration-500"
                style={{ backgroundColor: getCategoryAccent(selectedNode.category) }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/[0.08]">
                  <div
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: getCategoryAccent(selectedNode.category) }}
                  >
                    {getNodeIcon(selectedNode.category, 'w-3.5 h-3.5')}
                    <span>{selectedNode.category}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73]">
                    TIER 0{selectedNode.level}
                  </span>
                </div>

                <h3 className="font-editorial font-bold text-2xl sm:text-3xl text-[#F2F3F5] uppercase tracking-tight mb-2">
                  {selectedNode.label}
                </h3>

                <div
                  className="w-9 h-[2px] mb-3 transition-colors duration-500"
                  style={{ backgroundColor: getCategoryAccent(selectedNode.category) }}
                />

                <p className="text-[#A7ADB5] font-sans text-xs sm:text-sm leading-relaxed font-light mb-4">
                  {selectedNode.description}
                </p>

                <div className="py-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#626A73] mb-1.5">
                    <span>TOPOLOGY INTEGRATION</span>
                    <span className="text-[#E2E6EC] tabular-nums">
                      {connectedNodes.length}/{CONSTELLATION_NODES.length - 1} INTERFACES
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${couplingRatio}%`,
                        backgroundColor: getCategoryAccent(selectedNode.category),
                      }}
                    />
                  </div>
                </div>

                <div className="py-3 border-t border-white/[0.08]">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#626A73] block mb-1">
                    RUNTIME SURFACE
                  </span>
                  <p className="text-xs font-sans text-[#E2E6EC] leading-relaxed">
                    {selectedNode.whereUsed}
                  </p>
                </div>

                <div className="py-3 border-t border-white/[0.08]">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#626A73] block mb-2">
                    CONNECTED INTERFACES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedNodes.map((neighbor) => (
                      <button
                        key={neighbor.id}
                        type="button"
                        onClick={() => setSelectedId(neighbor.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/10 hover:border-sky-400/50 hover:text-white text-[#D5D9DF] font-mono text-[10px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      >
                        <span style={{ color: getCategoryAccent(neighbor.category) }}>
                          {getNodeIcon(neighbor.category, 'w-3 h-3')}
                        </span>
                        <span>{neighbor.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-white/[0.08]">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#626A73] block mb-2">
                  PRODUCTION SYSTEMS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.relatedProjects.map((project) => (
                    <a
                      key={project}
                      href="#projects"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 hover:border-sky-400/60 hover:text-sky-300 text-[#E2E6EC] font-mono text-[10px] whitespace-nowrap shrink-0 transition-colors"
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
      className="relative w-full py-14 sm:py-16 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      {content}
    </section>
  );
};
