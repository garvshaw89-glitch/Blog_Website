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

        {/* Large Editorial Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          <div className="lg:col-span-8">
            <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-[0.95]">
              THE PERSON
              <br />
              <span className="text-neutral-500">BEHIND THE</span>
              <br />
              SYSTEM.
            </h2>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between h-full pt-2">
            <p className="font-sans text-neutral-300 text-base sm:text-lg leading-relaxed font-light">
              I am Garv Shaw, a digital architect and software engineer designing intelligent platforms at the intersection of Artificial Intelligence, distributed cloud infrastructure, and financial systems.
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between font-mono text-xs text-neutral-400">
              <span>SPECIALIZATION</span>
              <span className="text-[#5B8CFF]">AI &times; CLOUD &times; SOFTWARE</span>
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
