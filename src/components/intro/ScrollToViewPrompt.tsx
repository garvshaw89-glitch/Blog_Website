import React, { useEffect, useRef } from 'react';

interface ScrollToViewPromptProps {
  onComplete: () => void;
  prefersReducedMotion: boolean;
}

interface DustParticle {
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  dx: number;
  dy: number;
  size: number;
  alpha: number;
  phase: number;
}

function smootherstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * ScrollToViewPrompt:
 * Minimal bottom-center 15px dim prompt that emerges gently from fine dust particles
 * after the rocket converts into the cursor, holds briefly, and dissolves away cleanly
 * right before "PORTFOLIO  BY  GARV SHAW" slides in.
 */
export const ScrollToViewPrompt: React.FC<ScrollToViewPromptProps> = ({
  onComplete,
  prefersReducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    if (prefersReducedMotion) {
      textEl.style.opacity = '1';
      const fadeTimer = window.setTimeout(() => {
        textEl.style.opacity = '0';
      }, 650);
      const doneTimer = window.setTimeout(() => {
        onCompleteRef.current();
      }, 950);
      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(doneTimer);
      };
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) {
      onCompleteRef.current();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 260;
    const height = 56;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Offscreen 15px glyph target sampling
    const offscreen = document.createElement('canvas');
    offscreen.width = width * 2;
    offscreen.height = height * 2;
    const octx = offscreen.getContext('2d');

    const targets: { x: number; y: number }[] = [];
    if (octx) {
      octx.scale(2, 2);
      octx.clearRect(0, 0, width, height);
      octx.fillStyle = '#ffffff';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.font = '400 15px "Space Grotesk", "Inter", system-ui, sans-serif';

      const label = 'Scroll To View';
      const spacing = 1.8;
      const chars = label.split('');
      const charWidths = chars.map((c) => octx.measureText(c).width);
      const totalTextW =
        charWidths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
      let cursorX = width * 0.5 - totalTextW * 0.5;
      const textCenterY = height * 0.5;

      for (let i = 0; i < chars.length; i++) {
        const cw = charWidths[i];
        octx.fillText(chars[i], cursorX + cw * 0.5, textCenterY);
        cursorX += cw + spacing;
      }

      const img = octx.getImageData(0, 0, offscreen.width, offscreen.height).data;
      for (let py = 0; py < offscreen.height; py += 2) {
        for (let px = 0; px < offscreen.width; px += 2) {
          if (img[(py * offscreen.width + px) * 4 + 3] > 95) {
            targets.push({ x: px / 2, y: py / 2 });
          }
        }
      }
    }

    const maxParticles = 380;
    const sampledTargets: { x: number; y: number }[] = [];
    if (targets.length <= maxParticles) {
      sampledTargets.push(...targets);
    } else {
      const stride = targets.length / maxParticles;
      for (let i = 0; i < maxParticles; i++) {
        sampledTargets.push(targets[Math.floor(i * stride)]);
      }
    }

    const particles: DustParticle[] = sampledTargets.map((t) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 34;
      return {
        x: t.x + Math.cos(angle) * dist,
        y: t.y + Math.sin(angle) * dist * 0.45,
        sx: t.x + Math.cos(angle) * dist,
        sy: t.y + Math.sin(angle) * dist * 0.45,
        tx: t.x,
        ty: t.y,
        dx: t.x - (16 + Math.random() * 38),
        dy: t.y + (Math.random() - 0.65) * 18,
        size: 0.9 + Math.random() * 0.5,
        alpha: 0.32 + Math.random() * 0.28,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const ASSEMBLE_END = 0.72;
    const HOLD_END = 1.95;
    const DISSOLVE_END = 2.65;

    let rafId = 0;
    let finished = false;
    const startPerf = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startPerf) / 1000;

      if (elapsed >= DISSOLVE_END) {
        if (!finished) {
          finished = true;
          onCompleteRef.current();
        }
        return;
      }

      let textOpacity = 0;
      let particleOpacity = 1;

      if (elapsed < ASSEMBLE_END) {
        const p = elapsed / ASSEMBLE_END;
        textOpacity = smootherstep(Math.max(0, (p - 0.58) / 0.42));
        particleOpacity = smootherstep(Math.min(1, p / 0.25)) * (1 - textOpacity * 0.85);
      } else if (elapsed < HOLD_END) {
        textOpacity = 1;
        particleOpacity = 0.14;
      } else {
        const dp = (elapsed - HOLD_END) / (DISSOLVE_END - HOLD_END);
        textOpacity = 1 - smootherstep(Math.min(1, dp / 0.3));
        particleOpacity = Math.min(1, dp / 0.22) * (1 - smootherstep(Math.max(0, (dp - 0.28) / 0.72)));
      }

      textEl.style.opacity = textOpacity.toFixed(3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (particleOpacity > 0.01) {
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          if (elapsed < ASSEMBLE_END) {
            const p = smootherstep(elapsed / ASSEMBLE_END);
            const swirl = Math.sin(p * Math.PI) * 5 * (1 - p);
            pt.x = pt.sx + (pt.tx - pt.sx) * p + Math.cos(elapsed * 4 + pt.phase) * swirl;
            pt.y = pt.sy + (pt.ty - pt.sy) * p + Math.sin(elapsed * 3.5 + pt.phase) * swirl;
          } else if (elapsed < HOLD_END) {
            pt.x = pt.tx + Math.sin(elapsed * 2 + pt.phase) * 0.5;
            pt.y = pt.ty + Math.cos(elapsed * 1.8 + pt.phase) * 0.5;
          } else {
            const dp = smootherstep((elapsed - HOLD_END) / (DISSOLVE_END - HOLD_END));
            pt.x = pt.tx + (pt.dx - pt.tx) * dp;
            pt.y = pt.ty + (pt.dy - pt.ty) * dp;
          }

          ctx.globalAlpha = pt.alpha * particleOpacity;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 pb-[max(2rem,env(safe-area-inset-bottom))] z-[9] flex items-center justify-center pointer-events-none select-none"
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: '260px', height: '56px' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <span
          ref={textRef}
          className="relative z-10 font-normal tracking-[1.8px] leading-none"
          style={{
            fontSize: '15px',
            color: 'rgba(148, 163, 184, 0.55)',
            fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
            opacity: 0,
            transition: prefersReducedMotion ? 'opacity 0.25s ease' : undefined,
          }}
        >
          Scroll To View
        </span>
      </div>
    </div>
  );
};
