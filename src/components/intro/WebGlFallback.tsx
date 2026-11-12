import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';

interface WebGlFallbackProps {
  onEnter: () => void;
  onSkip: () => void;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({ onEnter, onSkip }) => {
  const [showControl, setShowControl] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowControl(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-screen bg-[#050505] overflow-hidden flex flex-col justify-between p-6 sm:p-10 select-none">
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rotate-45 border border-white/20 bg-gradient-to-tr from-white/10 to-transparent shadow-[0_0_40px_rgba(56,189,248,0.2)]" />
        </div>
      </div>

      {/* Top-right Skip Icon */}
      <div className="relative z-10 w-full flex items-center justify-end">
        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip entrance"
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/12 hover:border-white/25 bg-[#0a0d14]/90 text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-center Enter Icon */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center pb-6">
        {showControl && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <button
              type="button"
              onClick={onEnter}
              aria-label="Enter portfolio"
              className="group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-[#161b24] to-[#090c12] border border-white/15 hover:border-cyan-400/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-200 cursor-pointer shrink-0"
            >
              <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
