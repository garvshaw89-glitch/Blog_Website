import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ShieldCheck, Terminal, Award, Compass, Cpu, Layers } from 'lucide-react';
import { ArchitectAvatar } from './ui/ArchitectAvatar';

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
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#7EA7FF] font-semibold text-xs">01 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#A7ADB5]">
              IDENTITY & ARCHITECTURAL PHILOSOPHY
            </span>
          </div>
          <span className="font-mono text-xs text-[#626A73]">GARV SHAW</span>
        </div>

        {/* Large Editorial Headline & Verified Profile Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          <div className="lg:col-span-7">
            <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-[#F2F3F5] leading-[0.95]">
              THE PERSON
              <br />
              <span className="text-[#A7ADB5]">
                BEHIND THE
              </span>
              <br />
              SYSTEM.
            </h2>
            <p className="font-sans text-[#A7ADB5] text-base sm:text-lg leading-relaxed font-light mt-6 max-w-xl">
              I am <strong className="text-[#F2F3F5] font-normal">Garv Shaw</strong>, a digital architect and software engineer designing intelligent platforms at the intersection of Artificial Intelligence, distributed cloud infrastructure, and financial systems.
            </p>
            <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-4 font-mono text-xs text-[#626A73]">
              <span className="text-[#7EA7FF] font-medium">AI & REASONING</span>
              <span className="text-white/20">/</span>
              <span className="text-[#A7ADB5]">CLOUD & EDGE</span>
              <span className="text-white/20">/</span>
              <span className="text-[#A7ADB5]">FINTECH & SYSTEMS</span>
            </div>
          </div>

          {/* High-Resolution Profile Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group max-w-sm w-full p-6 sm:p-7 rounded-2xl bg-[#0B0E12]/95 border border-white/[0.08] shadow-2xl hover:border-white/[0.18] transition-all duration-500">
              <div className="flex items-center gap-5 mb-5">
                {/* Avatar with authentic dot-matrix particle effect */}
                <div className="relative shrink-0">
                  <ArchitectAvatar size={88} interactive={true} />
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 border-[#0B0E12] z-10"
                    title="Status: Online"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[#7EA7FF] font-mono text-[10px] tracking-widest uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7EA7FF]" />
                    <span>SYSTEM ARCHITECT</span>
                  </div>
                  <h3 className="font-editorial text-2xl font-bold text-[#F2F3F5] uppercase tracking-tight">
                    GARV SHAW
                  </h3>
                  <p className="font-mono text-xs text-[#626A73] mt-0.5">
                    @garvshaw89-glitch
                  </p>
                </div>
              </div>

              <div className="space-y-2 py-4 border-y border-white/[0.06] font-mono text-xs text-[#A7ADB5]">
                <div className="flex justify-between">
                  <span className="text-[#626A73]">ROLE:</span>
                  <span className="text-[#F2F3F5]">Digital Architect</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#626A73]">FOCUS:</span>
                  <span className="text-[#7EA7FF]">AI × Cloud × Software</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#626A73]">LOCATION:</span>
                  <span className="text-[#A7ADB5]">New Delhi, India</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-mono">
                <a
                  href="https://github.com/garvshaw89-glitch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#7EA7FF] hover:text-white transition-colors"
                >
                  <span>VIEW GITHUB</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-[#A7ADB5]">AVAILABLE FOR ROLES</span>
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
              className="p-8 rounded-2xl bg-[#0B0E12]/80 border border-white/[0.08] hover:border-white/[0.18] transition-all flex flex-col justify-between h-full"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#7EA7FF] block mb-3">
                  PILLAR 0{i + 1} / {pillar.tag}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#F2F3F5] uppercase tracking-tight mb-4">
                  {pillar.title}
                </h3>
                <p className="font-sans text-sm text-[#A7ADB5] leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#626A73]">
                <span>STATUS</span>
                <span className="text-[#A7ADB5]">PRODUCTION GRADE</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
