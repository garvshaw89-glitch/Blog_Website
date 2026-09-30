import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CONSTELLATION_NODES, CONSTELLATION_LINKS } from '../data/portfolioData';
import { ConstellationNode } from '../types';
import { Compass, ArrowUpRight, Cpu, Database, Cloud, Terminal, Sparkles } from 'lucide-react';

interface TechnologyConstellationProps {
  id?: string;
}

export const TechnologyConstellation: React.FC<TechnologyConstellationProps> = ({
  id = 'constellation',
}) => {
  const [selectedNode, setSelectedNode] = useState<ConstellationNode>(CONSTELLATION_NODES[0]);

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'Core':
        return <Cpu className="w-3.5 h-3.5 text-[#5B8CFF]" />;
      case 'AI':
        return <Sparkles className="w-3.5 h-3.5 text-[#4CC9F0]" />;
      case 'Frontend':
      case 'Graphics':
        return <Cpu className="w-3.5 h-3.5 text-[#795CFF]" />;
      case 'Backend':
      case 'APIs':
        return <Terminal className="w-3.5 h-3.5 text-blue-400" />;
      case 'Data':
        return <Database className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Cloud':
      case 'DevOps':
        return <Cloud className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-slate-300" />;
    }
  };

  const getNodeCoords = (nodeId: string) => {
    const node = CONSTELLATION_NODES.find((n) => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 50, y: 50 };
  };

  return (
    <section
      id={id}
      className="relative w-full py-20 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">07 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              TOPOLOGY // ARCHITECTURAL GRAPH
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">TECHNOLOGY CONSTELLATION</span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            TECHNOLOGY CONSTELLATION
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
            Interactive topology showing how my AI orchestration, backend services, real-time protocols, and multi-cloud infrastructure interlink around production systems.
          </p>
        </div>

        {/* Visual Graph & Interactive Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Topology Canvas / SVG (7 cols on desktop) */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[480px] rounded-3xl bg-[#070D18]/90 border border-white/10 p-4 sm:p-6 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-tech-dots opacity-30 pointer-events-none" />

            {/* SVG Connecting Links */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {CONSTELLATION_LINKS.map((link, idx) => {
                const source = getNodeCoords(link.source);
                const target = getNodeCoords(link.target);
                const isHighlighted =
                  selectedNode.id === link.source || selectedNode.id === link.target;

                return (
                  <g key={idx}>
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={isHighlighted ? '#06B6D4' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '4 2' : 'none'}
                      className="transition-all duration-300"
                    />
                    {isHighlighted && (
                      <circle r="3" fill="#22D3EE">
                        <animateMotion
                          dur="2.8s"
                          repeatCount="indefinite"
                          path={`M ${source.x * 5} ${source.y * 4} L ${target.x * 5} ${target.y * 4}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Nodes */}
            <div className="relative w-full h-full">
              {CONSTELLATION_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-black font-bold shadow-[0_0_25px_rgba(6,182,212,0.8)] scale-110 z-20'
                        : 'bg-[#0E1524]/90 text-slate-200 border border-white/15 hover:border-cyan-400 hover:scale-105 z-10'
                    }`}
                  >
                    <span>{getNodeIcon(node.category)}</span>
                    <span className="whitespace-nowrap">{node.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Left Legend */}
            <div className="absolute bottom-3 left-4 flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> ACTIVE NODE
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-slate-500" /> DATA PIPELINE
              </span>
            </div>
          </div>

          {/* Inspector Panel (5 cols on desktop) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8 rounded-3xl bg-[#090E17]/90 border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    CATEGORY: {selectedNode.category}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    TIER {selectedNode.level}
                  </span>
                </div>

                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-3">
                  {selectedNode.label}
                </h3>

                <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed mb-5">
                  {selectedNode.description}
                </p>

                {/* Where I use it */}
                <div className="mb-5 pb-5 border-b border-white/10">
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-1.5">
                    WHERE I USE IT
                  </span>
                  <p className="text-xs sm:text-sm font-sans text-slate-200">
                    {selectedNode.whereUsed}
                  </p>
                </div>

                {/* Related Projects */}
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-2">
                    RELATED PROJECTS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.relatedProjects.map((project) => (
                      <a
                        key={project}
                        href="#projects"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400 hover:text-cyan-300 font-mono text-xs transition-colors"
                      >
                        <span>{project}</span>
                        <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                      </a>
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
