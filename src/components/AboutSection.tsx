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
    offset: ['start 0.98', 'start 0.22'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 24,
    mass: 0.72,
  });

  // Start physically UNDER the rotating Milky Way (z-[1] < MilkyWayGalaxy z-[2]),
  // then cross cleanly through the galaxy core into the foreground (z-10) mid-emergence.
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

  // Pure GPU-composited under-galaxy emergence transforms
  const portalScale = useTransform(smoothProgress, [0, 0.42, 1], [0.24, 0.7, 1]);
  const portalRotateZ = useTransform(smoothProgress, [0, 0.55, 1], [-14, -4, 0]);
  const portalRotateX = useTransform(smoothProgress, [0, 0.55, 1], [22, 6, 0]);
  const portalY = useTransform(smoothProgress, [0, 1], [115, 0]);
  const portalOpacity = useTransform(
    smoothProgress,
    [0, 0.14, 0.42, 0.78, 1],
    [0.06, 0.52, 0.84, 0.97, 1]
  );

  const coreGlowOpacity = useTransform(smoothProgress, [0, 0.4, 0.75, 1], [0.12, 0.75, 0.25, 0]);
  const coreGlowScale = useTransform(smoothProgress, [0, 0.45, 1], [0.42, 1.12, 1.32]);

  const leftColX = useTransform(smoothProgress, [0, 1], [56, 0]);
  const rightCardX = useTransform(smoothProgress, [0, 1], [-56, 0]);
  const rightCardRotateY = useTransform(smoothProgress, [0, 1], [-12, 0]);

  const pillar0Y = useTransform(smoothProgress, [0.18, 0.95], [48, 0]);
  const pillar0Scale = useTransform(smoothProgress, [0.18, 0.95], [0.82, 1]);
  const pillar0Opacity = useTransform(smoothProgress, [0.18, 0.68], [0, 1]);

  const pillar1Y = useTransform(smoothProgress, [0.26, 0.98], [56, 0]);
  const pillar1Scale = useTransform(smoothProgress, [0.26, 0.98], [0.78, 1]);
  const pillar1Opacity = useTransform(smoothProgress, [0.26, 0.74], [0, 1]);

  const pillar2Y = useTransform(smoothProgress, [0.34, 1], [64, 0]);
  const pillar2Scale = useTransform(smoothProgress, [0.34, 1], [0.74, 1]);
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
      className={`relative w-full py-20 sm:py-28 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-x-clip ${
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
            className="w-[540px] sm:w-[740px] h-[540px] sm:h-[740px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 226, 178, 0.22) 0%, rgba(125, 211, 252, 0.15) 30%, rgba(56, 189, 248, 0.05) 58%, transparent 76%)',
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
                transformStyle: 'preserve-3d',
                transformOrigin: '50% 42%',
                willChange: 'transform, opacity',
              }
        }
      >
        {/* Unified Section Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sky-400 font-semibold text-xs">01</span>
            <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
              IDENTITY &amp; ARCHITECTURAL PHILOSOPHY
            </span>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">GARV SHAW</span>
        </div>

        {/* Large Editorial Headline & Profile Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-14 sm:mb-16">
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
            <p className="font-sans text-[#A7ADB5] text-base sm:text-lg leading-relaxed font-light mt-6 max-w-xl [text-wrap:balance]">
              I am <strong className="text-[#F2F3F5] font-normal">Garv Shaw</strong>, a digital architect and software engineer designing intelligent platforms at the intersection of Artificial Intelligence, distributed cloud infrastructure, and financial systems.
            </p>
            <div className="mt-7 pt-5 border-t border-white/[0.08] flex flex-wrap items-center gap-3 font-mono text-xs text-[#626A73]">
              <span className="text-sky-400 font-medium">AI &amp; REASONING</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="text-[#A7ADB5]">CLOUD &amp; EDGE</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="text-[#A7ADB5]">FINTECH &amp; SYSTEMS</span>
            </div>
          </motion.div>

          {/* Architectural Profile Card */}
          <motion.div
            className="lg:col-span-5 flex justify-center lg:justify-end"
            style={
              prefersReducedMotion
                ? undefined
                : { x: rightCardX, rotateY: rightCardRotateY }
            }
          >
            <div className="relative group max-w-sm w-full p-6 sm:p-7 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_24px_65px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/[0.18] transition-colors duration-300">
              <div className="flex items-center gap-5 mb-5">
                <div className="shrink-0">
                  <ArchitectAvatar size={84} interactive={true} />
                </div>

                <div>
                  <span className="text-sky-400 font-mono text-[10px] tracking-[0.22em] uppercase block mb-1">
                    SYSTEM ARCHITECT
                  </span>
                  <h3 className="font-editorial text-2xl font-bold text-[#F2F3F5] uppercase tracking-tight">
                    GARV SHAW
                  </h3>
                  <p className="font-mono text-xs text-[#626A73] mt-0.5">
                    @garvshaw89-glitch
                  </p>
                </div>
              </div>

              <div className="divide-y divide-white/[0.06] border-y border-white/[0.06] font-mono text-xs text-[#A7ADB5]">
                <div className="flex justify-between py-2.5">
                  <span className="text-[#626A73] uppercase tracking-wider">ROLE</span>
                  <span className="text-[#F2F3F5]">Digital Architect</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#626A73] uppercase tracking-wider">FOCUS</span>
                  <span className="text-sky-400">AI × Cloud × Software</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#626A73] uppercase tracking-wider">LOCATION</span>
                  <span className="text-[#A7ADB5]">New Delhi, India</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-mono">
                <a
                  href="https://github.com/garvshaw89-glitch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-white transition-colors"
                >
                  <span>VIEW GITHUB</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-[#626A73] uppercase tracking-wider">OPEN TO ROLES</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3 Architectural Pillars emerging right behind the primary Milky Way warp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              style={prefersReducedMotion ? undefined : pillarStyles[i]}
              className="p-6 sm:p-7 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] hover:border-white/[0.18] transition-colors flex flex-col justify-between h-full shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-sky-400 mb-3">
                  <span>0{i + 1} · {pillar.tag}</span>
                </div>
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#F2F3F5] uppercase tracking-tight mb-3">
                  {pillar.title}
                </h3>
                <p className="font-sans text-sm text-[#A7ADB5] leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-[#626A73]">
                <span>DISCIPLINE</span>
                <span className="text-[#A7ADB5]">PRODUCTION GRADE</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
