import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface WebGlFallbackProps {
  onEnter: () => void;
  onSkip: () => void;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({ onEnter, onSkip }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] text-[#F5F5F0] overflow-hidden flex flex-col justify-between p-6 md:p-12 select-none">
      {/* Subtle Radial Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(20, 24, 34, 0.4) 0%, rgba(5, 5, 5, 0.95) 75%)',
        }}
      />

      {/* Abstract Animated Monolith Portal (CSS Geometric Approximation) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-white/10 animate-[spin_24s_linear_infinite]">
          <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_18s_linear_infinite_reverse]" />
          <div className="absolute inset-12 rounded-full border border-cyan-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rotate-45 border border-white/20 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-md" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between text-xs tracking-[0.25em] text-[#8E9299]">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#A5A7AC]">
            The Digital Archive
          </span>
        </div>

        <button
          onClick={onSkip}
          className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] text-[#A5A7AC] hover:text-[#F5F5F0] transition-colors"
        >
          SKIP INTRO [ESC]
        </button>
      </header>

      {/* Center Title */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center my-auto px-4">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.22em] text-[#F5F5F0] uppercase font-['Space_Grotesk',sans-serif]">
              Garv Shaw
            </h1>
            <div className="w-16 h-[1px] bg-neutral-700 my-4" />
            <p className="text-xs sm:text-sm tracking-[0.3em] text-[#8E9299] uppercase font-['Space_Grotesk',sans-serif]">
              Ideas • Technology • Design • Culture
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer CTA */}
      <footer className="relative z-10 w-full flex flex-col items-center justify-center pb-6">
        {showContent && (
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={onEnter}
            className="group flex flex-col items-center px-6 py-3 rounded-full hover:bg-white/[0.04] transition-all"
          >
            <span className="text-xs sm:text-sm tracking-[0.28em] group-hover:tracking-[0.36em] text-[#F5F5F0] uppercase transition-all">
              Enter The Journal
            </span>
            <div className="w-12 h-[1px] bg-neutral-600 group-hover:w-20 group-hover:bg-[#F5F5F0] transition-all my-2" />
            <ArrowDown className="w-3.5 h-3.5 text-[#8E9299] group-hover:translate-y-1 transition-all" />
          </motion.button>
        )}
      </footer>
    </div>
  );
};
