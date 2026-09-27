import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, ShieldCheck, Sparkles } from 'lucide-react';

export const EasterEggToast: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Standard Konami Code Sequence: Up, Up, Down, Down, Left, Right, Left, Right, B, A
    const konamiSequence = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing into active input elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const expectedKey = konamiSequence[konamiIndex];
      const pressedKey = e.key;

      if (pressedKey.toLowerCase() === expectedKey.toLowerCase()) {
        konamiIndex += 1;
        if (konamiIndex === konamiSequence.length) {
          setToastMessage('SYSTEM MESSAGE: Welcome, Engineer');
          konamiIndex = 0;
        }
      } else {
        // If current key matches start of sequence, set index to 1, else reset
        if (pressedKey === 'ArrowUp') {
          konamiIndex = 1;
        } else {
          konamiIndex = 0;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss notification after 7 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          id="konami-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed top-6 right-6 z-[250] max-w-sm sm:max-w-md p-4 rounded-2xl bg-[#090E17]/95 border border-cyan-400 shadow-[0_20px_50px_rgba(6,182,212,0.45),0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-2xl flex items-start gap-3.5 text-[#D7E2EA] pointer-events-auto"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Terminal className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                KERNEL OVERRIDE // 0x7F
              </span>
            </div>
            <h4 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
              {toastMessage}
            </h4>
            <p className="font-sans text-xs text-slate-300 mt-1 leading-relaxed">
              Konami sequence verified. Developer telemetry and engineering kernel unlocked.
            </p>
          </div>

          <button
            onClick={() => setToastMessage(null)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
