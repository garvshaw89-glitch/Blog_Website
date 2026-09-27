import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Layout,
  Network,
  ShieldCheck,
  BrainCircuit,
  Database,
  Cloud,
  CheckCircle2,
  Layers,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

interface ArchNode {
  id: string;
  name: string;
  category: string;
  tech: string;
  purpose: string;
  responsibilities: string[];
  metrics: string;
  icon: React.ReactNode;
}

const ARCH_NODES: ArchNode[] = [
  {
    id: 'user',
    name: 'Client Viewport',
    category: 'Ingress',
    tech: 'Browser / Mobile PWA',
    purpose: 'Zero-latency interaction layer capturing user intents, gestures & keystrokes.',
    responsibilities: [
      'Local state buffering with Optimistic UI updates',
      'Encrypted token transmission via secure HttpOnly headers',
      'Audio/Video WebRTC peer negotiation',
    ],
    metrics: '< 16ms render loop (60 FPS)',
    icon: <Users className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: 'frontend',
    name: 'Edge Application',
    category: 'Presentation',
    tech: 'React 19 • Next.js 15 • Motion',
    purpose: 'SSR & client-hydrated interfaces with hardware-accelerated animations.',
    responsibilities: [
      'Streaming HTML chunks via React 19 concurrent boundaries',
      'Dynamic Web Worker offloading for mathematical projections',
      'Accessible WCAG AA focus & reduced-motion state management',
    ],
    metrics: '< 180 KB gzipped payload',
    icon: <Layout className="w-5 h-5 text-sky-400" />,
  },
  {
    id: 'gateway',
    name: 'Edge API Gateway',
    category: 'Routing',
    tech: 'Traefik • Node.js • Cloudflare',
    purpose: 'Multi-region proxy orchestrating rate-limiting, CORS & token validation.',
    responsibilities: [
      'Sliding window rate-limiting per client IP',
      'TLS 1.3 termination and HTTP/2 multiplexing',
      'WebSocket protocol upgrade and heartbeat watchdog',
    ],
    metrics: '< 25ms TTFB edge cache',
    icon: <Network className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'auth',
    name: 'Zero-Trust Security',
    category: 'Security',
    tech: 'OAuth 2.0 • JWT • Zod',
    purpose: 'Strict boundary defenses validating all incoming schemas before execution.',
    responsibilities: [
      'Cryptographic HMAC SHA-256 session verification',
      'Strict Zod runtime schema assertions on payloads',
      'Zero raw HTML injection or eval execution',
    ],
    metrics: '0 unverified inputs permitted',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'ai-service',
    name: 'AI & Realtime Engine',
    category: 'Inference & Streams',
    tech: 'Gemini 3.8 Flash • FastAPI • WebRTC',
    purpose: 'Sub-second neural generation, agent tool calls & bidirectional data streams.',
    responsibilities: [
      'Socratic dialogue engine & prompt-chain orchestration',
      'Low-latency WebRTC media relay & audio codecs',
      'Streaming token synthesis with JSON schema enforcement',
    ],
    metrics: '< 450ms first token latency',
    icon: <BrainCircuit className="w-5 h-5 text-purple-400" />,
  },
  {
    id: 'database',
    name: 'Persistent State Store',
    category: 'Data Layer',
    tech: 'PostgreSQL • Redis • Vector Index',
    purpose: 'Acid-compliant transactional storage and microsecond in-memory caching.',
    responsibilities: [
      'AES-256 encrypted fields for clinical & financial records',
      'Redis pub/sub for cross-server signaling broadcasts',
      'Indexed cosine similarity search on knowledge embeddings',
    ],
    metrics: '99.99% query consistency',
    icon: <Database className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'cloud',
    name: 'Multi-Cloud Fabric',
    category: 'Infrastructure',
    tech: 'Google Cloud Run • AWS S3 • Docker',
    purpose: 'Containerized stateless microservices scaling from zero to peak demand.',
    responsibilities: [
      'Automated container spin-up and healthcheck probes',
      'Distributed CDN replication of static assets',
      'Automated GitHub Actions CI/CD deployment routines',
    ],
    metrics: 'Zero-downtime rolling deploys',
    icon: <Cloud className="w-5 h-5 text-indigo-400" />,
  },
];

interface InteractiveArchitectureProps {
  id?: string;
}

export const InteractiveArchitecture: React.FC<InteractiveArchitectureProps> = ({
  id = 'architecture',
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState(ARCH_NODES[2].id);
  const activeNode = ARCH_NODES.find((n) => n.id === selectedNodeId) || ARCH_NODES[2];

  return (
    <section
      id={id}
      data-cursor-theme="violet"
      className="relative w-full py-24 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>04 // SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="hero-heading font-display font-black uppercase text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3">
            DATA PIPELINE & ARCHITECTURE
          </h2>
          <p className="text-slate-300 font-sans text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Click any architectural tier to inspect responsibilities, security boundaries, and telemetry metrics.
          </p>
        </div>

        {/* Visual Pipeline Flow Diagram */}
        <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-[#070D18]/90 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl mb-8">
          {/* Desktop Horizontal Flow / Mobile Vertical Flow */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-2 overflow-x-auto py-2">
            {ARCH_NODES.map((node, index) => {
              const isSelected = node.id === activeNode.id;
              return (
                <React.Fragment key={node.id}>
                  <button
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`flex-1 w-full lg:w-auto min-w-[130px] p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E1524] border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-105 z-10'
                        : 'bg-[#090E17]/80 border-white/10 hover:border-white/25 hover:bg-[#0c1322]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                        {node.icon}
                      </div>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-white tracking-wide truncate">
                      {node.name}
                    </h4>
                    <span className="font-mono text-[10px] text-cyan-400/90 block truncate mt-0.5">
                      {node.category}
                    </span>
                  </button>

                  {/* Flow Arrow (horizontal on lg, vertical on mobile) */}
                  {index < ARCH_NODES.length - 1 && (
                    <div className="text-cyan-500/60 shrink-0 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 hidden lg:block" />
                      <ArrowDown className="w-4 h-4 block lg:hidden my-1" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Detailed Node Inspector Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#090E17]/90 border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Purpose & Tech */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    TIER: {activeNode.category}
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                  {activeNode.name}
                </h3>
                <p className="font-mono text-xs text-cyan-400 mb-4 font-semibold">
                  STACK: {activeNode.tech}
                </p>
                <p className="font-sans text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
                  {activeNode.purpose}
                </p>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">TARGET SLA / METRIC: </span>
                  {activeNode.metrics}
                </div>
              </div>

              {/* Right Column: Responsibilities */}
              <div className="lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400 block mb-3">
                  SYSTEM RESPONSIBILITIES & HARDENING
                </span>
                <div className="space-y-3">
                  {activeNode.responsibilities.map((resp, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 font-sans text-xs sm:text-sm text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
