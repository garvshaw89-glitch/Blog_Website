import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entrySequenceManager, EntryStage } from '../matter/entrySequenceManager';

interface EntryPageProps {
  onComplete: () => void;
}

/**
 * 01 - 26: FUTURISTIC LUXURY PARTICLE ENTRY PAGE
 * Visual language: LUXURY × FUTURE × DIGITAL MATTER × PRECISION × INTELLIGENCE
 * 
 * Timeline Architecture:
 * 0.0 - 0.8s: INITIAL_VOID (20-40 faint particles across viewport, central dot awakens & brightens)
 * 0.8 - 1.8s: AWAKENING (Central pulse propagation, digital matter awakens)
 * 1.8 - 2.8s: CONSTELLATION (Dynamic temporary connections between proximate particles)
 * 2.8 - 3.4s: FORM 01 — SPHERE (3D rotating sphere)
 * 3.4 - 3.9s: FORM 02 — RING (Rotating circular ring, breaks apart)
 * 3.9 - 4.5s: FORM 03 — WAVE (Flowing transverse sine wave surface)
 * 4.5 - 5.5s: DIGITAL GLOBE (Earth-like continental geometry with authentic geo-hash)
 * 5.5 - 6.2s: ARCHITECTURE (Minimal digital blueprint wireframe)
 * 6.2 - 6.8s: WATERY PARTICLE FIELD (Fluid ocean field)
 * 6.8 - 7.6s: BRAND REVEAL ("GARV SHAW" -> "DIGITAL ARCHITECT" -> "AI × CLOUD × SOFTWARE")
 * 7.6 - 8.3s: "INTELLIGENCE IN MOTION"
 * 8.3 - 9.0s: FINAL ENTRY TRANSITION (Particle universe expands outward, unveiling the portfolio)
 * 9.0s+: Seamless continuity into main Living Digital Matter background
 */
export const LoadingScreen: React.FC<EntryPageProps> = ({ onComplete }) => {
  const [entryStage, setEntryStage] = useState<EntryStage>('INITIAL_VOID');
  const [elapsed, setElapsed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with global entry manager
  useEffect(() => {
    return entrySequenceManager.subscribe((state) => {
      setEntryStage(state.stage);
    });
  }, []);

  // Main timing loop
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      entrySequenceManager.update({ prefersReduced: true });
      // Clean fast reduced-motion entrance
      const timer = setTimeout(() => {
        entrySequenceManager.completeImmediately();
        onComplete();
      }, 2200);
      return () => clearTimeout(timer);
    }

    const startTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      setElapsed(t);

      // Transition stages according to the spec
      if (t < 0.8) {
        if (entrySequenceManager.state.stage !== 'INITIAL_VOID') {
          entrySequenceManager.setStage('INITIAL_VOID');
        }
      } else if (t < 1.8) {
        if (entrySequenceManager.state.stage !== 'AWAKENING') {
          entrySequenceManager.setStage('AWAKENING');
        }
      } else if (t < 2.8) {
        if (entrySequenceManager.state.stage !== 'CONSTELLATION') {
          entrySequenceManager.setStage('CONSTELLATION');
        }
      } else if (t < 3.4) {
        if (entrySequenceManager.state.stage !== 'FORM_SPHERE') {
          entrySequenceManager.setStage('FORM_SPHERE');
        }
      } else if (t < 3.9) {
        if (entrySequenceManager.state.stage !== 'FORM_RING') {
          entrySequenceManager.setStage('FORM_RING');
        }
      } else if (t < 4.5) {
        if (entrySequenceManager.state.stage !== 'FORM_WAVE') {
          entrySequenceManager.setStage('FORM_WAVE');
        }
      } else if (t < 5.5) {
        if (entrySequenceManager.state.stage !== 'DIGITAL_GLOBE') {
          entrySequenceManager.setStage('DIGITAL_GLOBE');
        }
      } else if (t < 6.2) {
        if (entrySequenceManager.state.stage !== 'ARCHITECTURE') {
          entrySequenceManager.setStage('ARCHITECTURE');
        }
      } else if (t < 6.8) {
        if (entrySequenceManager.state.stage !== 'WATER_FIELD') {
          entrySequenceManager.setStage('WATER_FIELD');
        }
      } else if (t < 7.6) {
        if (entrySequenceManager.state.stage !== 'BRAND_REVEAL') {
          entrySequenceManager.setStage('BRAND_REVEAL');
        }
      } else if (t < 8.3) {
        if (entrySequenceManager.state.stage !== 'INTELLIGENCE_MOTION') {
          entrySequenceManager.setStage('INTELLIGENCE_MOTION');
        }
      } else if (t < 9.0) {
        if (entrySequenceManager.state.stage !== 'PARTICLES_EXPAND') {
          entrySequenceManager.setStage('PARTICLES_EXPAND');
        }
      } else {
        clearInterval(interval);
        entrySequenceManager.completeImmediately();
        onComplete();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  // High-performance 2D Overlay Particle Canvas for Initial Dormant Void & Constellation Lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial 32 dormant particles
    const initialDots = Array.from({ length: 34 }, (_, i) => ({
      x: width * (0.15 + Math.random() * 0.7),
      y: height * (0.15 + Math.random() * 0.7),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: i === 0 ? 3.0 : 1.0 + Math.random() * 1.6,
      opacity: i === 0 ? 0.9 : 0.08 + Math.random() * 0.2,
      isCenter: i === 0,
    }));
    // Lock index 0 at center
    initialDots[0].x = width / 2;
    initialDots[0].y = height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const stage = entrySequenceManager.state.stage;

      // Only draw initial 2D constellation overlay during 0.0 - 2.8s
      if (
        stage === 'INITIAL_VOID' ||
        stage === 'AWAKENING' ||
        stage === 'CONSTELLATION'
      ) {
        // Draw temporary thin constellation lines
        if (stage === 'CONSTELLATION') {
          ctx.lineWidth = 0.5;
          for (let i = 0; i < initialDots.length; i++) {
            for (let j = i + 1; j < initialDots.length; j++) {
              const dx = initialDots[i].x - initialDots[j].x;
              const dy = initialDots[i].y - initialDots[j].y;
              const dist = Math.hypot(dx, dy);
              if (dist < 110) {
                const lineAlpha = (1 - dist / 110) * 0.18;
                ctx.strokeStyle = `rgba(245, 245, 240, ${lineAlpha})`;
                ctx.beginPath();
                ctx.moveTo(initialDots[i].x, initialDots[i].y);
                ctx.lineTo(initialDots[j].x, initialDots[j].y);
                ctx.stroke();
              }
            }
          }
        }

        // Draw dots
        for (let i = 0; i < initialDots.length; i++) {
          const p = initialDots[i];

          // Center dot pulse awakening
          if (p.isCenter && stage === 'AWAKENING') {
            p.opacity = 1.0;
            // Draw delicate expanding ripple
            const rippleR = ((elapsed - 0.8) / 1.0) * Math.min(width, height) * 0.45;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, rippleR), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(91, 140, 255, ${Math.max(0, 0.4 - rippleR / 300)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.isCenter
            ? `rgba(245, 245, 240, ${p.opacity})`
            : `rgba(199, 201, 206, ${p.opacity})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [elapsed]);

  const showGarvShaw =
    entryStage === 'BRAND_REVEAL' ||
    entryStage === 'INTELLIGENCE_MOTION' ||
    entryStage === 'PARTICLES_EXPAND';

  const showDigitalArchitect =
    (entryStage === 'BRAND_REVEAL' && elapsed >= 7.05) ||
    entryStage === 'INTELLIGENCE_MOTION' ||
    entryStage === 'PARTICLES_EXPAND';

  const showTechStack =
    (entryStage === 'BRAND_REVEAL' && elapsed >= 7.3) ||
    entryStage === 'INTELLIGENCE_MOTION' ||
    entryStage === 'PARTICLES_EXPAND';

  const showIntelligenceInMotion =
    entryStage === 'INTELLIGENCE_MOTION' ||
    entryStage === 'PARTICLES_EXPAND';

  const isExpandingOut = entryStage === 'PARTICLES_EXPAND';

  return (
    <AnimatePresence>
      <motion.div
        key="luxury-particle-entry-page"
        initial={{ opacity: 1 }}
        animate={{
          opacity: isExpandingOut ? 0 : 1,
          scale: isExpandingOut ? 1.04 : 1,
        }}
        exit={{ opacity: 0, filter: 'blur(16px)' }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[999990] bg-gradient-to-b from-[#050505] to-[#080A0F] pointer-events-auto select-none overflow-hidden flex flex-col items-center justify-center"
      >
        {/* Subtle Canvas Layer for Awakening Void and Constellations */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Minimal Corner Technical Indicator */}
        <div className="absolute top-6 left-6 text-[10px] font-mono tracking-widest text-[#8F9299]/60 uppercase z-20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>GARV SHAW // ENTRY SEQUENCE</span>
        </div>

        {/* Skip button in top right for polite user control */}
        <button
          onClick={() => {
            entrySequenceManager.completeImmediately();
            onComplete();
          }}
          data-cursor="button"
          data-cursor-label="ENTER"
          className="absolute top-6 right-6 text-[10px] font-mono tracking-[0.2em] text-[#8F9299]/50 hover:text-[#F5F5F0] uppercase z-30 transition-colors py-1 px-2.5 rounded border border-white/5 hover:border-white/20"
        >
          [ SKIP INTRO ↗ ]
        </button>

        {/* Center Typography Composition */}
        <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
          {/* Section 13 & 14: GARV SHAW BRAND REVEAL */}
          <div className="h-32 sm:h-40 flex flex-col items-center justify-center">
            {showGarvShaw && !showIntelligenceInMotion && (
              <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                {/* GARV SHAW */}
                <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F5F5F0] uppercase leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                  GARV SHAW
                </h1>

                {/* DIGITAL ARCHITECT (250ms after name) */}
                {showDigitalArchitect && (
                  <motion.p
                    initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="font-mono text-xs sm:text-sm tracking-[0.25em] text-[#C7C9CE] uppercase mt-3"
                  >
                    DIGITAL ARCHITECT
                  </motion.p>
                )}

                {/* AI × CLOUD × SOFTWARE (Technical Typography) */}
                {showTechStack && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="font-mono text-[10px] sm:text-xs tracking-[0.35em] text-[#8F9299] uppercase mt-2"
                  >
                    AI × CLOUD × SOFTWARE
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Section 15: INTELLIGENCE IN MOTION */}
            {showIntelligenceInMotion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1.0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <span className="font-mono text-[10px] tracking-[0.4em] text-[#5B8CFF] uppercase mb-2">
                  STATEMENT
                </span>
                <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#F5F5F0] uppercase drop-shadow-[0_0_40px_rgba(91,140,255,0.35)]">
                  INTELLIGENCE IN MOTION
                </h2>
              </motion.div>
            )}
          </div>
        </div>

        {/* Minimal Bottom Stage Telemetry */}
        <div className="absolute bottom-6 inset-x-6 flex items-center justify-between text-[10px] font-mono tracking-widest text-[#8F9299]/50 uppercase z-20">
          <div>PHASE: {entryStage.replace(/_/g, ' ')}</div>
          <div className="hidden sm:block">SYSTEM // 60 FPS ADAPTIVE</div>
          <div>PRECISION: 0.001</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
