import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
} from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ArchitectAvatar } from './ui/ArchitectAvatar';
import { GlitchHeading } from './ui/GlitchHeading';

interface AboutSectionProps {
  onContactClick?: () => void;
  id?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  id = 'about',
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isAboveGalaxy, setIsAboveGalaxy] = useState<boolean>(
    () => Boolean(prefersReducedMotion)
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.98', 'start 0.2'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 92,
    damping: 22,
    mass: 0.85,
  });

  // Start physically UNDER the rotating Milky Way (z-[1] < MilkyWayGalaxy z-[2]),
  // then cross cleanly through the galaxy core into the foreground (z-10) mid-emergence!
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    if (prefersReducedMotion) {
      if (!isAboveGalaxy) setIsAboveGalaxy(true);
      return;
    }
    const shouldCross = latest >= 0.42;
    if (shouldCross !== isAboveGalaxy) {
      setIsAboveGalaxy(shouldCross);
    }
  });

  // Main container emergence from deep underneath the rotating Milky Way
  const portalScale = useTransform(smoothProgress, [0, 0.42, 1], [0.22, 0.68, 1]);
  const portalRotateZ = useTransform(smoothProgress, [0, 0.55, 1], [-16, -4.5, 0]);
  const portalRotateX = useTransform(smoothProgress, [0, 0.55, 1], [26, 8, 0]);
  const portalY = useTransform(smoothProgress, [0, 1], [130, 0]);
  const portalOpacity = useTransform(
    smoothProgress,
    [0, 0.14, 0.42, 0.78, 1],
    [0.08, 0.52, 0.82, 0.96, 1]
  );
  const portalBlur = useTransform(
    smoothProgress,
    [0, 0.42, 0.75, 1],
    ['blur(12px)', 'blur(5px)', 'blur(1.5px)', 'blur(0px)']
  );

  // Subtle Milky Way galactic emergence halo peaking as section pierces through the galaxy
  const coreGlowOpacity = useTransform(smoothProgress, [0, 0.4, 0.75, 1], [0.15, 0.82, 0.3, 0]);
  const coreGlowScale = useTransform(smoothProgress, [0, 0.45, 1], [0.4, 1.15, 1.38]);

  // Bilateral spiral expansion from Milky Way center outward to columns
  const leftColX = useTransform(smoothProgress, [0, 1], [72, 0]);
  const rightCardX = useTransform(smoothProgress, [0, 1], [-72, 0]);
  const rightCardRotateY = useTransform(smoothProgress, [0, 1], [-16, 0]);

  // Pillars cascade outward right behind the primary emergence
  const pillar0Y = useTransform(smoothProgress, [0.18, 0.95], [58, 0]);
  const pillar0Scale = useTransform(smoothProgress, [0.18, 0.95], [0.78, 1]);
  const pillar0Opacity = useTransform(smoothProgress, [0.18, 0.68], [0, 1]);

  const pillar1Y = useTransform(smoothProgress, [0.26, 0.98], [68, 0]);
  const pillar1Scale = useTransform(smoothProgress, [0.26, 0.98], [0.74, 1]);
  const pillar1Opacity = useTransform(smoothProgress, [0.26, 0.74], [0, 1]);

  const pillar2Y = useTransform(smoothProgress, [0.34, 1], [78, 0]);
  const pillar2Scale = useTransform(smoothProgress, [0.34, 1], [0.7, 1]);
  const pillar2Opacity = useTransform(smoothProgress, [0.34, 0.8], [0, 1]);

  const pillarStyles = [
    { y: pillar0Y, scale: pillar0Scale, opacity: pillar0Opacity },
    { y: pillar1Y, scale: pillar1Scale, opacity: pillar1Opacity },
    { y: pillar2Y, scale: pillar2Scale, opacity: pillar2Opacity },
  ];

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
      ref={sectionRef}
      id={id}
      className={`relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-x-clip ${
        isAboveGalaxy || prefersReducedMotion ? 'z-10' : 'z-[1]'
      }`}
      style={{ perspective: '1400px' }}
    >
      {/* Cosmic Galactic Core Emergence Glow while piercing through the Milky Way */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: coreGlowOpacity, scale: coreGlowScale }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        >
          <div
            className="w-[560px] sm:w-[780px] h-[560px] sm:h-[780px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 226, 178, 0.26) 0%, rgba(125, 211, 252, 0.18) 30%, rgba(56, 189, 248, 0.06) 58%, transparent 76%)',
            }}
          />
        </motion.div>
      )}

      <motion.div
        className="relative z-10 max-w-7xl mx-auto"
        style={
          prefersReducedMotion
            ? undefined
            : {
                scale: portalScale,
                rotateZ: portalRotateZ,
                rotateX: portalRotateX,
                y: portalY,
                opacity: portalOpacity,
                filter: portalBlur,
                transformStyle: 'preserve-3d',
                transformOrigin: '50% 42%',
                willChange: 'transform, opacity, filter',
              }
        }
      >
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
          <motion.div
            className="lg:col-span-7"
            style={prefersReducedMotion ? undefined : { x: leftColX }}
          >
            <GlitchHeading className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-[#F2F3F5] leading-[0.95]">
              THE PERSON
              <br />
              <span className="text-[#A7ADB5]">
                BEHIND THE
              </span>
              <br />
              SYSTEM.
            </GlitchHeading>
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
          </motion.div>

          {/* High-Resolution Profile Card */}
          <motion.div
            className="lg:col-span-5 flex justify-center lg:justify-end"
            style={
              prefersReducedMotion
                ? undefined
                : { x: rightCardX, rotateY: rightCardRotateY }
            }
          >
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
          </motion.div>
        </div>

        {/* 3 Architectural Pillars emerging right behind the primary Milky Way warp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              style={prefersReducedMotion ? undefined : pillarStyles[i]}
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
      </motion.div>
    </section>
  );
};
