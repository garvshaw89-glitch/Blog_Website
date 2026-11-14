import React, { useEffect, useRef } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import {
  createRocketSprites,
  ExhaustParticle,
  ParticleTone,
} from '../cursor/rocketBlueprint';
import { drawPassingAsteroid2D, drawRealAsteroid } from './drawRealAsteroid';

interface EntryAsteroidLandingProps {
  onCenterImpact?: () => void;
  onBecomeCursor?: () => void;
  onFinished: () => void;
  prefersReducedMotion?: boolean;
}

interface PassingRock2D {
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  radius: number;
  seed: number;
  rotSpeed: number;
  delay: number;
  duration: number;
}

function easeOutCubic(t: number): number {
  const u = 1 - Math.max(0, Math.min(1, t));
  return 1 - u * u * u;
}

function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/**
 * 2D Canvas fallback entry sequence mirroring `AsteroidFlightAnimation`:
 * 1) Real 2D-shaded cratered asteroids pass across from the sides of the Milky Way.
 * 2) Hero asteroid plunges into screen center with molten trail & crashes (shockwave + sparks + flash).
 * 3) Crashed boulder cools, shrinks smoothly down to ~30px Asteroid Cursor size, and settles on pointer.
 */
export const EntryAsteroidLanding: React.FC<EntryAsteroidLandingProps> = ({
  onCenterImpact,
  onBecomeCursor,
  onFinished,
  prefersReducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCenterImpactRef = useRef(onCenterImpact);
  const onBecomeCursorRef = useRef(onBecomeCursor);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onCenterImpactRef.current = onCenterImpact;
  }, [onCenterImpact]);

  useEffect(() => {
    onBecomeCursorRef.current = onBecomeCursor;
  }, [onBecomeCursor]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const t1 = window.setTimeout(() => onBecomeCursorRef.current?.(), 150);
      const t2 = window.setTimeout(() => onFinishedRef.current(), 300);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      onBecomeCursorRef.current?.();
      onFinishedRef.current();
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onBecomeCursorRef.current?.();
      onFinishedRef.current();
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('orientationchange', resize, { passive: true });

    const { sprites } = createRocketSprites();
    const sparks: ExhaustParticle[] = [];

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Passing swarm from side of Milky Way
    const swarm: PassingRock2D[] = [];
    for (let i = 0; i < 22; i++) {
      const fromRight = i % 6 === 0;
      const startX = fromRight ? W() * (1.06 + Math.random() * 0.12) : -W() * (0.08 + Math.random() * 0.12);
      const startY = H() * (0.08 + Math.random() * 0.74);
      const speedX = (fromRight ? -1 : 1) * (W() * (0.55 + Math.random() * 0.55));
      const speedY = H() * (0.08 + (Math.random() - 0.3) * 0.25);
      swarm.push({
        startX,
        startY,
        vx: speedX,
        vy: speedY,
        radius: 8 + Math.random() * 24,
        seed: 1.7 + i * 2.31,
        rotSpeed: (Math.random() - 0.5) * 3.8,
        delay: i < 5 ? i * 0.08 : 0.25 + (i / 22) * 2.4,
        duration: 1.6 + Math.random() * 1.1,
      });
    }

    const spawnCrashBurst = (cx: number, cy: number) => {
      for (let i = 0; i < 72; i++) {
        const ang = (i / 72) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        const spd = 90 + Math.random() * 320;
        const tone: ParticleTone = i % 3 === 0 ? 'amber' : i % 2 === 0 ? 'white' : 'cyan';
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 1.8 + Math.random() * 2.8,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.45,
          tone,
        });
      }
    };

    const spawnTrailEmber = (x: number, y: number, heat: number) => {
      if (sparks.length >= 160) sparks.shift();
      const tone: ParticleTone = Math.random() < 0.6 ? 'amber' : 'white';
      sparks.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 45 - 35,
        vy: (Math.random() - 0.5) * 45 - 15,
        size: (1.5 + Math.random() * 2.2) * (0.6 + heat * 0.6),
        life: 0,
        maxLife: 0.28 + Math.random() * 0.25,
        tone,
      });
    };

    const IMPACT_SEC = 2.0;
    const SHRINK_START_SEC = 2.55;
    const BECOME_CURSOR_SEC = 3.72;
    const FINISH_SEC = 4.02;

    let rafId = 0;
    let startTimeMs: number | null = null;
    let prevTimeMs = performance.now();
    let impactTriggered = false;
    let cursorActivated = false;
    let finishedCalled = false;

    const tick = (now: number) => {
      if (startTimeMs === null) startTimeMs = now;
      const elapsed = (now - startTimeMs) / 1000;
      const dt = Math.min((now - prevTimeMs) / 1000, 0.05);
      prevTimeMs = now;

      const w = W();
      const h = H();
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 1. Passing Asteroid Swarm from side of Milky Way
      for (const r of swarm) {
        const localT = elapsed - r.delay;
        if (localT < 0 || localT > r.duration) continue;
        const tNorm = localT / r.duration;
        const alpha = tNorm < 0.12 ? tNorm / 0.12 : tNorm > 0.85 ? (1 - tNorm) / 0.15 : 1;
        const x = r.startX + r.vx * localT;
        const y = r.startY + r.vy * localT;
        ctx.save();
        ctx.translate(x, y);
        drawPassingAsteroid2D(ctx, r.radius, r.seed, elapsed * r.rotSpeed, 0.12, alpha * 0.88);
        ctx.restore();
      }

      // 2. Hero Crashing Asteroid -> Shrink to Asteroid Cursor
      if (elapsed < FINISH_SEC) {
        if (elapsed < IMPACT_SEC) {
          const p = Math.max(0, Math.min(1, elapsed / IMPACT_SEC));
          const x = -w * 0.08 + (cx - -w * 0.08) * easeOutCubic(p);
          const y = h * 0.24 + (cy - h * 0.24) * easeOutCubic(p);
          const radius = 14 + Math.pow(p, 1.5) * 68;
          const heat = 0.2 + p * 0.9;

          if (p > 0.15) spawnTrailEmber(x, y, heat);

          ctx.save();
          ctx.translate(x, y);
          drawPassingAsteroid2D(ctx, radius, 9.4, elapsed * 3.8, heat, 1);
          ctx.restore();
        } else {
          if (!impactTriggered) {
            impactTriggered = true;
            spawnCrashBurst(cx, cy);
            onCenterImpactRef.current?.();
          }

          // Expanding impact shockwave rings
          const shockAge = elapsed - IMPACT_SEC;
          if (shockAge < 0.8) {
            const sp = shockAge / 0.8;
            const ringR = 24 + sp * Math.min(w, h) * 0.42;
            ctx.save();
            ctx.globalAlpha = Math.pow(1 - sp, 1.5) * 0.72;
            ctx.strokeStyle = '#fdba74';
            ctx.lineWidth = 2.5 * (1 - sp);
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 1.4 * (1 - sp);
            ctx.beginPath();
            ctx.arc(cx, cy, ringR * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          if (elapsed < SHRINK_START_SEC) {
            const recoilP = (elapsed - IMPACT_SEC) / (SHRINK_START_SEC - IMPACT_SEC);
            const radius = 84 - easeOutCubic(recoilP) * 20;
            const heat = Math.max(0.15, (1 - recoilP) * 0.95);
            ctx.save();
            ctx.translate(cx, cy);
            drawPassingAsteroid2D(ctx, radius, 9.4, elapsed * 2.2, heat, 1);
            ctx.restore();
          } else {
            const shrinkP = Math.min(
              1,
              (elapsed - SHRINK_START_SEC) / (BECOME_CURSOR_SEC - SHRINK_START_SEC)
            );
            const smooth = easeInOutCubic(shrinkP);
            const eng = interactionEngine.state;
            const hasPointer =
              eng.clientX > 0 && eng.clientY > 0 && eng.clientX < w && eng.clientY < h;
            const destX = hasPointer ? eng.clientX : cx;
            const destY = hasPointer ? eng.clientY : cy;

            const curX = cx + (destX - cx) * smooth;
            const curY = cy + (destY - cy) * smooth - Math.sin(shrinkP * Math.PI) * 28 * (1 - shrinkP);

            if (shrinkP > 0.05 && shrinkP < 0.94 && Math.random() < 0.55) {
              spawnTrailEmber(curX, curY, 0.35 * (1 - shrinkP));
            }

            if (elapsed >= BECOME_CURSOR_SEC && !cursorActivated) {
              cursorActivated = true;
              onBecomeCursorRef.current?.();
            }

            const fadeOut =
              elapsed >= BECOME_CURSOR_SEC
                ? Math.max(0, 1 - (elapsed - BECOME_CURSOR_SEC) / (FINISH_SEC - BECOME_CURSOR_SEC))
                : 1;

            const curScale = 4.6 + (1.28 - 4.6) * smooth;
            ctx.save();
            ctx.translate(curX, curY);
            drawRealAsteroid(ctx, curScale, (1 - smooth) * 0.7, fadeOut, elapsed, 0);
            ctx.restore();
          }
        }
      }

      // 3. Ember & Spark Particles
      if (sparks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life += dt;
          if (sp.life >= sp.maxLife) {
            sparks.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vx *= 0.95;
          sp.vy *= 0.95;
          const prog = sp.life / sp.maxLife;
          ctx.globalAlpha = (1 - prog) * (1 - prog) * 0.85;
          const r = sp.size * (1.4 - prog * 0.5);
          ctx.drawImage(sprites[sp.tone], sp.x - r, sp.y - r, r * 2, r * 2);
        }
        ctx.restore();
      }

      if (elapsed >= FINISH_SEC && !finishedCalled) {
        finishedCalled = true;
        onFinishedRef.current();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-[7] pointer-events-none"
    />
  );
};
