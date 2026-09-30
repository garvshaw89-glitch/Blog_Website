import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ShieldCheck, Terminal, Award, Compass, Cpu, Layers } from 'lucide-react';

interface AboutSectionProps {
  onContactClick?: () => void;
  id?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onContactClick,
  id = 'about',
}) => {
  const pillars = [
    {
      title: 'INTELLIGENT SYSTEMS',
      tag: 'AI & REASONING',
      desc: 'Developing domain-grounded LLM pipelines, autonomous tool-use agents, and vector retrieval architectures with low latency.',
    },
    {
      title: 'CLOUD ARCHITECTURE',
      tag: 'CONTAINERS & RUNTIME',
      desc: 'Deploying fault-tolerant microservices on Google Cloud Run, AWS Lambda, Docker, and edge caching networks.',
    },
    {
      title: 'FINANCIAL PRODUCT ENGINEERING',
      tag: 'QUANT & TELEMETRY',
      desc: 'Building quantitative market terminals, compensation analytics engines, and real-time WebSocket telemetry interfaces.',
    },
  ];

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Eyebrow */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">01 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              IDENTITY & ARCHITECTURAL PHILOSOPHY
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">GARV SHAW</span>
        </div>

        {/* Large Editorial Headline & Verified Profile Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          <div className="lg:col-span-7">
            <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-[0.95]">
              THE PERSON
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                BEHIND THE
              </span>
              <br />
              SYSTEM.
            </h2>
            <p className="font-sans text-neutral-300 text-base sm:text-lg leading-relaxed font-light mt-6 max-w-xl">
              I am <strong className="text-white font-medium">Garv Shaw</strong>, a digital architect and software engineer designing intelligent platforms at the intersection of Artificial Intelligence, distributed cloud infrastructure, and financial systems.
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 font-mono text-xs text-neutral-400">
              <span className="px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-semibold">
                AI × REASONING
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold">
                CLOUD & EDGE
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold">
                FINTECH × SYSTEMS
              </span>
            </div>
          </div>

          {/* High-Resolution Verified Profile Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group max-w-sm w-full p-6 sm:p-7 rounded-3xl bg-[#08090B]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-cyan-400/40 transition-all duration-500">
              {/* Colorful animated aura glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 opacity-25 group-hover:opacity-60 blur-xl transition-opacity duration-500 -z-10" />

              <div className="flex items-center gap-5 mb-5">
                {/* Avatar with colorful ring */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[3px] bg-gradient-to-tr from-cyan-400 via-purple-500 to-rose-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]">
                    <img
                      src="/github_avatar.png"
                      alt="Garv Shaw - Digital Architect Profile"
                      className="w-full h-full object-cover rounded-[13px] bg-[#050505]"
                    />
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#08090B] shadow-[0_0_8px_#34d399]"
                    title="Status: Online"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] tracking-widest uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>VERIFIED ARCHITECT</span>
                  </div>
                  <h3 className="font-editorial text-2xl font-bold text-white uppercase tracking-tight">
                    GARV SHAW
                  </h3>
                  <p className="font-mono text-xs text-neutral-400 mt-0.5">
                    @garvshaw89-glitch
                  </p>
                </div>
              </div>

              <div className="space-y-2 py-4 border-y border-white/5 font-mono text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">ROLE:</span>
                  <span className="text-white font-medium">Digital Architect</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">FOCUS:</span>
                  <span className="text-cyan-300">AI × Cloud × Software</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">LOCATION:</span>
                  <span className="text-neutral-300">New Delhi, India</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-mono">
                <a
                  href="https://github.com/garvshaw89-glitch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>VIEW REPOSITORIES</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-emerald-400">AVAILABLE FOR ROLES</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="p-8 rounded-3xl bg-[#08090B]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between h-full"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 block mb-3">
                  PILLAR 0{i + 1} • {pillar.tag}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white uppercase tracking-tight mb-4">
                  {pillar.title}
                </h3>
                <p className="font-sans text-sm text-neutral-300 leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>STATUS</span>
                <span className="text-emerald-400">PRODUCTION READY</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
