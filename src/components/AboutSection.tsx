import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from './FadeIn';
import { Futuristic3DAboutText } from './Futuristic3DAboutText';
import { ContactButton } from './ContactButton';
import { ABOUT_3D_ASSETS, ENGINEERING_DOMAINS } from '../data/portfolioData';
import { BrainCircuit, Layers, Cloud, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  onContactClick?: () => void;
  id?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onContactClick,
  id = 'about',
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState(ENGINEERING_DOMAINS[0].id);
  const activeDomain =
    ENGINEERING_DOMAINS.find((d) => d.id === selectedDomainId) || ENGINEERING_DOMAINS[0];

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'BrainCircuit':
        return <BrainCircuit className="w-5 h-5 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-sky-400" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-indigo-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      default:
        return <BrainCircuit className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <section
      id={id}
      className="relative w-full min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 py-24 bg-transparent overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-900/15 via-cyan-500/10 to-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 3D Floating Cartoon Asset 1: Moon (Top-Left, Big) */}
      <div className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%] pointer-events-none z-0">
        <FadeIn delay={0.1} x={-80} y={0} duration={0.9}>
          <motion.div
            animate={{ y: [-14, 14, -14], rotate: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={ABOUT_3D_ASSETS.moon}
              alt="3D Moon Asset"
              loading="lazy"
              className="w-[140px] sm:w-[180px] md:w-[230px] lg:w-[260px] h-auto object-contain opacity-90 drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter hover:brightness-110 transition-all duration-300"
            />
          </motion.div>
        </FadeIn>
      </div>

      {/* 3D Floating Cartoon Asset 2: Sphere/Object3D (Bottom-Left, Big) */}
      <div className="absolute bottom-[8%] left-[2%] sm:left-[5%] md:left-[8%] pointer-events-none z-0">
        <FadeIn delay={0.25} x={-80} y={0} duration={0.9}>
          <motion.div
            animate={{ y: [12, -15, 12], rotate: [5, -6, 5], scale: [1, 1.05, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={ABOUT_3D_ASSETS.object3D}
              alt="3D Sphere Asset"
              loading="lazy"
              className="w-[120px] sm:w-[160px] md:w-[200px] lg:w-[230px] h-auto object-contain opacity-90 drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter hover:brightness-110 transition-all duration-300"
            />
          </motion.div>
        </FadeIn>
      </div>

      {/* 3D Floating Cartoon Asset 3: Lego (Top-Right, Big) */}
      <div className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%] pointer-events-none z-0">
        <FadeIn delay={0.15} x={80} y={0} duration={0.9}>
          <motion.div
            animate={{ y: [-15, 12, -15], rotate: [-7, 7, -7] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={ABOUT_3D_ASSETS.lego}
              alt="3D Lego Asset"
              loading="lazy"
              className="w-[140px] sm:w-[180px] md:w-[230px] lg:w-[260px] h-auto object-contain opacity-90 drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter hover:brightness-110 transition-all duration-300"
            />
          </motion.div>
        </FadeIn>
      </div>

      {/* 3D Floating Cartoon Asset 4: Group3D (Bottom-Right, Big) */}
      <div className="absolute bottom-[8%] right-[2%] sm:right-[5%] md:right-[8%] pointer-events-none z-0">
        <FadeIn delay={0.3} x={80} y={0} duration={0.9}>
          <motion.div
            animate={{ y: [14, -14, 14], rotate: [4, -7, 4], scale: [0.98, 1.03, 0.98] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={ABOUT_3D_ASSETS.group3D}
              alt="3D Abstract Group Asset"
              loading="lazy"
              className="w-[150px] sm:w-[190px] md:w-[240px] lg:w-[270px] h-auto object-contain opacity-90 drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter hover:brightness-110 transition-all duration-300"
            />
          </motion.div>
        </FadeIn>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-5xl text-center w-full">
        {/* Section Heading: "ABOUT ME" */}
        <FadeIn delay={0} y={40} className="w-full">
          <h2
            id="about-me-heading"
            className="hero-heading font-black uppercase leading-none tracking-tight text-center"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About me
          </h2>
        </FadeIn>

        {/* 3D Holographic Interactive Identity Card */}
        <div className="mt-10 sm:mt-14 md:mt-16 w-full flex justify-center">
          <Futuristic3DAboutText id="about-me-description" />
        </div>

        {/* Contact Me Button */}
        <div className="mt-12 sm:mt-16">
          <FadeIn delay={0.2} y={20}>
            <ContactButton id="about-contact-btn" onClick={onContactClick} />
          </FadeIn>
        </div>

        {/* Specialized Engineering Domains Tabs */}
        <div className="mt-16 w-full text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h3 className="font-mono text-xs uppercase tracking-widest text-slate-300">
                SPECIALIZED ENGINEERING DOMAINS
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500 hidden sm:inline">
              CLICK TO INSPECT ARCHITECTURE &amp; CAPABILITIES
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {ENGINEERING_DOMAINS.map((domain) => {
              const isSelected = domain.id === activeDomain.id;
              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomainId(domain.id)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E1524] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] translate-y-[-2px]'
                      : 'bg-[#090E17]/80 border-white/10 hover:border-white/20 hover:bg-[#0c1320]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                      {getDomainIcon(domain.icon)}
                    </div>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">
                      {domain.badge}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                    {domain.title}
                  </h4>
                  <p className="font-mono text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {domain.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDomain.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#090E17]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                      {getDomainIcon(activeDomain.icon)}
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xl sm:text-2xl text-white">
                        {activeDomain.title}
                      </h4>
                      <p className="font-mono text-xs text-cyan-400">{activeDomain.tagline}</p>
                    </div>
                  </div>
                  <p className="font-sans text-sm sm:text-base text-slate-300 leading-relaxed">
                    {activeDomain.description}
                  </p>
                </div>

                <div className="w-full lg:w-96 space-y-4 pt-4 lg:pt-0 lg:border-l lg:border-white/10 lg:pl-8">
                  <div>
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-2">
                      Core Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeDomain.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-2">
                      Featured Systems
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeDomain.relatedProjects?.map((proj) => (
                        <span
                          key={proj}
                          className="font-mono text-xs text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 inline-flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                          {proj}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
