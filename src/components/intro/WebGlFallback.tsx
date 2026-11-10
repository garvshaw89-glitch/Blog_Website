import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface WebGlFallbackProps {
  onEnter: () => void;
  onSkip: () => void;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({ onEnter, onSkip }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] text-[#F5F5F0] overflow-hidden flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Subtle Radial Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(20, 24, 34, 0.45) 0%, rgba(5, 5, 5, 0.95) 75%)',
        }}
      />

      {/* Abstract Animated Monolith Portal (CSS Geometric Approximation) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-white/10 animate-[spin_24s_linear_infinite]">
          <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_18s_linear_infinite_reverse]" />
          <div className="absolute inset-12 rounded-full border border-cyan-400/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rotate-45 border border-white/20 bg-gradient-to-tr from-white/10 to-transparent backdrop-blur-md shadow-[0_0_40px_rgba(56,189,248,0.2)]" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299]">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#E4E4E7]">
            GARV SHAW // DIGITAL IDENTITY
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="px-3.5 py-1.5 text-[11px] font-mono tracking-[0.22em] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors rounded-full border border-white/10 hover:border-white/20 bg-neutral-950/60 backdrop-blur-md cursor-pointer"
        >
          SKIP INTRO [ESC]
        </button>
      </header>

      {/* Center Title */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto px-4">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-[0.22em] text-[#F5F5F0] uppercase font-['Space_Grotesk',sans-serif]">
              Garv Shaw
            </h1>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-4" />
            <h2 className="text-xs sm:text-sm font-mono tracking-[0.36em] text-[#E4E4E7] uppercase mb-1">
              AI &amp; CLOUD DEVELOPER
            </h2>
            <p className="text-[11px] sm:text-xs tracking-[0.3em] text-[#A5A7AC] uppercase font-light">
              CREATIVE TECHNOLOGIST · DIGITAL BUILDER
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer CTA */}
      <footer className="relative z-10 w-full flex flex-col items-center justify-center pb-6">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <button
              type="button"
              onClick={onEnter}
              className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-b from-[#161a22]/80 to-[#0b0e14]/90 border border-white/15 hover:border-cyan-400/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm tracking-[0.26em] text-[#F5F5F0] group-hover:text-white uppercase transition-colors">
                ENTER EXPERIENCE
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[10px] font-mono tracking-[0.22em] text-neutral-500 mt-2">
              PRESS ENTER OR CLICK TO EXPLORE
            </span>
          </motion.div>
        )}
      </footer>
    </div>
  );
};
