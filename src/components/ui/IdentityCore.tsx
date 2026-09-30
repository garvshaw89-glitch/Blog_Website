import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Cloud, Terminal, Grid3X3, Hammer } from 'lucide-react';

interface IdentityCoreState {
  word: string;
  subtext: string;
  themeColor: string;
  icon: React.ReactNode;
  geometryType: 'orbital' | 'neural' | 'cloud' | 'code' | 'grid' | 'build';
}

const IDENTITY_STATES: IdentityCoreState[] = [
  {
    word: 'GARV',
    subtext: 'DIGITAL ARCHITECT',
    themeColor: '#22d3ee',
    icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
    geometryType: 'orbital',
  },
  {
    word: 'AI',
    subtext: 'NEURAL REASONING & AGENTS',
    themeColor: '#38bdf8',
    icon: <Cpu className="w-5 h-5 text-sky-400" />,
    geometryType: 'neural',
  },
  {
    word: 'CLOUD',
    subtext: 'DISTRIBUTED EDGE SYSTEMS',
    themeColor: '#818cf8',
    icon: <Cloud className="w-5 h-5 text-indigo-400" />,
    geometryType: 'cloud',
  },
  {
    word: 'CODE',
    subtext: 'SYSTEM ARCHITECTURE',
    themeColor: '#34d399',
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    geometryType: 'code',
  },
  {
    word: 'SYSTEMS',
    subtext: 'FULL-STACK INFRASTRUCTURE',
    themeColor: '#a78bfa',
    icon: <Grid3X3 className="w-5 h-5 text-purple-400" />,
    geometryType: 'grid',
  },
  {
    word: 'BUILD',
    subtext: 'PRODUCTS × FINANCE × COMMERCE',
    themeColor: '#f43f5e',
    icon: <Hammer className="w-5 h-5 text-rose-400" />,
    geometryType: 'build',
  },
];

export const IdentityCore: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IDENTITY_STATES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const current = IDENTITY_STATES[index];

  return (
    <div className="relative w-full max-w-2xl h-[320px] sm:h-[380px] md:h-[420px] mx-auto flex items-center justify-center select-none pointer-events-auto">
      {/* Background Interactive Ambient Aura */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.18, 0.32, 0.18],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[90px] pointer-events-none"
        style={{ backgroundColor: current.themeColor }}
      />

      {/* Surrounding Geometric Systems tailored to current active identity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Orbital Gyroscope rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[260px] sm:w-[320px] md:w-[380px] h-[260px] sm:h-[320px] md:h-[380px] rounded-full border border-white/10 border-dashed"
        />

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[200px] sm:w-[250px] md:w-[300px] h-[200px] sm:h-[250px] md:h-[300px] rounded-full border border-white/15"
          style={{ borderColor: `${current.themeColor}33` }}
        />

        {/* Dynamic Nodes around perimeter based on geometryType */}
        {current.geometryType === 'orbital' && (
          <>
            {[0, 90, 180, 270].map((deg, i) => (
              <motion.div
                key={`orb-${i}`}
                animate={{ rotate: [deg, deg + 360] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute w-[260px] sm:w-[320px] h-[260px] sm:h-[320px] rounded-full flex items-start justify-center"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
              </motion.div>
            ))}
          </>
        )}

        {current.geometryType === 'neural' && (
          <div className="absolute inset-8 border border-sky-500/20 rounded-3xl flex items-center justify-between p-4">
            <span className="text-[10px] font-mono text-sky-400">LAYER_01: INPUT</span>
            <span className="text-[10px] font-mono text-sky-400">LAYER_04: INFERENCE</span>
          </div>
        )}

        {current.geometryType === 'cloud' && (
          <div className="absolute w-[300px] h-[160px] border border-indigo-500/25 rounded-2xl flex flex-col justify-between p-3 font-mono text-[9px] text-indigo-300">
            <div className="flex justify-between">
              <span>REGION: ASIA-SOUTH1</span>
              <span>PING: 14MS</span>
            </div>
            <div className="flex justify-between">
              <span>PODS: 12/12 HEALTHY</span>
              <span>UPTIME: 99.99%</span>
            </div>
          </div>
        )}

        {current.geometryType === 'code' && (
          <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-emerald-400/60 overflow-hidden">
            <span>async function orchestrate() &#123;</span>
            <span>return await synthesize(); &#125;</span>
          </div>
        )}

        {current.geometryType === 'grid' && (
          <div className="absolute w-[280px] h-[280px] border border-purple-500/20 grid grid-cols-3 grid-rows-3 gap-1 p-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-purple-500/10 rounded-sm" />
            ))}
          </div>
        )}

        {current.geometryType === 'build' && (
          <div className="absolute w-[240px] h-[240px] border border-rose-500/30 rotate-45" />
        )}
      </div>

      {/* Center Interactive Core Entity */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.word}
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)', y: 12 }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)', y: -12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center p-6 sm:p-7 rounded-3xl bg-[#08090B]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-w-sm w-full mx-4"
        >
          {/* Garv Shaw Profile Avatar with Colorful Animated Gradient Halo */}
          <div className="relative mb-4 group cursor-pointer" title="Garv Shaw - Verified Digital Architect">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 opacity-80 blur-md group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]">
              <img
                src="/github_avatar.png"
                alt="Garv Shaw Profile Avatar"
                className="w-full h-full object-cover rounded-full bg-[#050505]"
              />
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#08090B] shadow-[0_0_8px_#34d399]"
                title="Status: Verified Online"
              />
            </div>
          </div>

          {/* Top category label & icon */}
          <div className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            {current.icon}
            <span
              className="font-mono text-[10px] tracking-widest font-semibold uppercase"
              style={{ color: current.themeColor }}
            >
              CORE // {index + 1} OF {IDENTITY_STATES.length}
            </span>
          </div>

          {/* Morphing Headline Text */}
          <h2 className="font-editorial text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white uppercase leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
            {current.word}
          </h2>

          {/* Supporting Domain Description */}
          <p className="font-mono text-xs text-neutral-300 uppercase tracking-widest mt-3">
            {current.subtext}
          </p>

          {/* Micro dots navigation for manual preview */}
          <div className="flex items-center gap-1.5 mt-5">
            {IDENTITY_STATES.map((state, i) => (
              <button
                key={state.word}
                onClick={() => setIndex(i)}
                aria-label={`Select identity state ${state.word}`}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
