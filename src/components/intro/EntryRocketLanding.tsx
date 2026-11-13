import React, { useEffect, useRef } from 'react';
import {
  buildRocketParticleBlueprint,
  createRocketSprites,
  ExhaustParticle,
  ParticleTone,
} from '../cursor/rocketBlueprint';
import { drawRealRocket } from './drawRealRocket';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

interface EntryRocketLandingProps {
  onCenterImpact?: () => void;
  onBecomeCursor: () => void;
  onFinished: () => void;
  prefersReducedMotion: boolean;
}

interface UniverseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  tone: ParticleTone;
  disturbed: boolean;
}

const smootherstep = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// Evaluate cubic Bezier point cleanly at t in [0, 1]
function cubicBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

/**
 * ENTRY ROCKET FLIGHT, LANDING & CURSOR CONVERSION
 *
 * 1. Launches a big, 3D-shaded real aerospace rocket from deep under the lower universe.
 * 2. Executes a dynamic supersonic flight maneuver across the starfield, parting space particles
 *    and trailing glowing Mach exhaust embers.
 * 3. Banks gracefully back to decelerate and land squarely in the middle of the entry page.
 * 4. Shrinks cleanly from big spacecraft scale down to cursor size (1.0), converting into
 *    the particle rocket blueprint and gliding seamlessly onto the live cursor.
 */
export const EntryRocketLanding: React.FC<EntryRocketLandingProps> = ({
  onCenterImpact,
  onBecomeCursor,
  onFinished,
  prefersReducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handoffDoneRef = useRef(false);
  const completedRef = useRef(false);
  const onCenterImpactRef = useRef(onCenterImpact);

  useEffect(() => {
    onCenterImpactRef.current = onCenterImpact;
  }, [onCenterImpact]);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (!handoffDoneRef.current) {
        handoffDoneRef.current = true;
        onBecomeCursor();
      }
      const timer = window.setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onFinished();
        }
      }, 100);
      return () => window.clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('orientationchange', resize, { passive: true });

    const { sprites, contrastBackingSprite } = createRocketSprites();
    const structure = buildRocketParticleBlueprint();
    const exhaustPool: ExhaustParticle[] = [];
    const spaceParticles: UniverseParticle[] = [];

    const initVw = window.innerWidth;
    const initVh = window.innerHeight;

    // Ambient universe particles across the lower & central cosmos that part around the flying rocket
    const cosmicCount = initVw < 640 ? 110 : 185;
    for (let i = 0; i < cosmicCount; i++) {
      const r = Math.random();
      const tone: ParticleTone =
        r < 0.44 ? 'white' : r < 0.8 ? 'cyan' : r < 0.93 ? 'silver' : 'amber';
      spaceParticles.push({
        x: Math.random() * initVw,
        y: initVh * 0.15 + Math.random() * (initVh * 0.85),
        vx: (Math.random() - 0.5) * 14,
        vy: -6 - Math.random() * 14,
        size: 0.9 + Math.random() * 1.7,
        alpha: 0.32 + Math.random() * 0.55,
        life: 0,
        maxLife: 2.6 + Math.random() * 1.2,
        tone,
        disturbed: false,
      });
    }

    // Phase timing (seconds)
    const FLIGHT_ASCENT_END = 1.05; // Rises powerfully from under the universe across center-right arc
    const MANEUVER_LAND_END = 1.92; // Sweeps left-back into center and decelerates for touchdown
    const LAND_HOLD_END = 2.28; // Touchdown shockwave & brief hero landing pose in middle
    const CONVERT_END = 3.18; // Shrinks big -> small cursor size (1.0) & converts into particle cursor

    let touchdownTriggered = false;
    let landingRingRadius = 12;
    let landingRingAlpha = 0;
    let smoothedAngleDeg = 28;

    const getFlightPosition = (tNorm: number, vw: number, vh: number, midX: number, midY: number) => {
      // Phase A: Under lower-left universe -> sweeps up diagonally toward right-mid sky
      if (tNorm <= 0.54) {
        const p = smootherstep(tNorm / 0.54);
        const startX = vw * 0.22;
        const startY = vh + 230;
        const apexX = vw * 0.67;
        const apexY = vh * 0.34;
        return {
          x: cubicBezier(startX, vw * 0.28, vw * 0.72, apexX, p),
          y: cubicBezier(startY, vh * 0.76, vh * 0.42, apexY, p),
        };
      }
      // Phase B: Sweeping orbital curve back around left-center and down onto center landing pad
      const p = smootherstep((tNorm - 0.54) / 0.46);
      const apexX = vw * 0.67;
      const apexY = vh * 0.34;
      return {
        x: cubicBezier(apexX, vw * 0.58, vw * 0.34, midX, p),
        y: cubicBezier(apexY, vh * 0.16, vh * 0.36, midY, p),
      };
    };

    const spawnPlumeParticle = (
      ox: number,
      oy: number,
      angleRad: number,
      sc: number,
      speedMult: number,
      toneOverride?: ParticleTone
    ) => {
      if (exhaustPool.length >= 220) exhaustPool.shift();
      const sinA = Math.sin(angleRad);
      const cosA = Math.cos(angleRad);
      const jitterX = (Math.random() - 0.5) * 3.8 * sc;
      const nozzleY = 27.8 * sc;
      const wx = ox + jitterX * cosA - nozzleY * sinA;
      const wy = oy + jitterX * sinA + nozzleY * cosA;

      const ejectMag = (46 + Math.random() * 90) * speedMult;
      const spread = (Math.random() - 0.5) * 0.52;
      const ejectAngle = angleRad + spread;

      const r = Math.random();
      const tone: ParticleTone =
        toneOverride || (r < 0.44 ? 'amber' : r < 0.8 ? 'cyan' : 'white');

      exhaustPool.push({
        x: wx,
        y: wy,
        vx: -Math.sin(ejectAngle) * ejectMag,
        vy: Math.cos(ejectAngle) * ejectMag,
        size: (1.25 + Math.random() * 1.45) * Math.max(0.8, Math.min(2.3, sc * 0.42)),
        life: 0,
        maxLife: 0.42 + Math.random() * 0.38,
        tone,
      });
    };

    const spawnTouchdownShockwave = (cx: number, cy: number, sc: number) => {
      const nozzleY = 28 * sc;
      for (let i = 0; i < 46; i++) {
        const theta = (i / 46) * Math.PI * 2;
        const speed = 95 + Math.random() * 85;
        const tone: ParticleTone = i % 3 === 0 ? 'amber' : i % 2 === 0 ? 'cyan' : 'white';
        exhaustPool.push({
          x: cx + Math.cos(theta) * 8,
          y: cy + nozzleY + Math.sin(theta) * 3.0,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed * 0.25,
          size: 1.55 + Math.random() * 1.25,
          life: 0,
          maxLife: 0.58 + Math.random() * 0.32,
          tone,
        });
      }
    };

    const spawnConversionSparks = (rx: number, ry: number, sc: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const ly = Math.random() * 26 * sc;
        const lx = (Math.random() - 0.5) * 11 * sc;
        const theta = Math.random() * Math.PI * 2;
        const spd = 28 + Math.random() * 62;
        const tone: ParticleTone = i % 3 === 0 ? 'white' : i % 2 === 0 ? 'cyan' : 'amber';
        exhaustPool.push({
          x: rx + lx,
          y: ry + ly,
          vx: Math.cos(theta) * spd,
          vy: Math.sin(theta) * spd,
          size: 1.15 + Math.random() * 1.05,
          life: 0,
          maxLife: 0.34 + Math.random() * 0.25,
          tone,
        });
      }
    };

    let rafId = 0;
    const startTime = performance.now();
    let prevTime = startTime;
    let emitAccum = 0;
    let convSparkAccum = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const elapsed = (now - startTime) / 1000;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      // Big unmistakable spacecraft scale on desktop, proportional on tablet & mobile
      const heroScale = vw < 480 ? 3.8 : isMobile ? 4.4 : vw < 1024 ? 5.3 : 6.2;

      const midX = vw * 0.5;
      const midY = vh * 0.5 - 14 * heroScale * 0.42;

      // Live pointer coordinates for seamless cursor handoff
      const eng = interactionEngine.state;
      const pointerValid =
        eng.clientX > 0 &&
        eng.clientY > 0 &&
        eng.clientX < vw &&
        eng.clientY < vh;
      const targetPointerX = pointerValid ? eng.clientX : vw * 0.5;
      const targetPointerY = pointerValid ? eng.clientY : vh * 0.5;

      let rx = midX;
      let ry = midY;
      let sc = heroScale;
      let angleDeg = 0;
      let thrust = 1.4;
      let realAlpha = 1;
      let particleAlpha = 0;
      let rocketVisible = true;

      if (elapsed <= MANEUVER_LAND_END) {
        // PHASE 1 & 2: Emerge big from under the universe, fly dramatic moving curve, bank cleanly & descend to middle
        const flightNorm = Math.min(elapsed / MANEUVER_LAND_END, 1);
        const pos = getFlightPosition(flightNorm, vw, vh, midX, midY);
        const ahead = getFlightPosition(Math.min(1, flightNorm + 0.015), vw, vh, midX, midY);
        const behind = getFlightPosition(Math.max(0, flightNorm - 0.015), vw, vh, midX, midY);

        rx = pos.x;
        ry = pos.y;

        // Slight perspective scale-in as it rises up out of deep lower space
        const emergeP = Math.min(elapsed / FLIGHT_ASCENT_END, 1);
        sc = heroScale * (0.72 + 0.28 * smootherstep(emergeP));
        thrust = flightNorm < 0.72 ? 1.95 : 1.95 - ((flightNorm - 0.72) / 0.28) * 1.1;

        const vx = ahead.x - behind.x;
        const vy = ahead.y - behind.y;
        const tangentAngle =
          Math.hypot(vx, vy) > 0.5 ? (Math.atan2(vy, vx) * 180) / Math.PI + 90 : 0;

        // Blend smoothly upright (0 deg) during final descent into center landing pad
        const uprightWeight = smootherstep(Math.max(0, (flightNorm - 0.76) / 0.24));
        const desiredAngle = tangentAngle * (1 - uprightWeight);

        const diff = ((((desiredAngle - smoothedAngleDeg + 180) % 360) + 360) % 360) - 180;
        smoothedAngleDeg += diff * Math.min(1, dt * 11);
        angleDeg = smoothedAngleDeg;
        realAlpha = Math.min(1, elapsed * 4.5);
        particleAlpha = 0;

        // Part surrounding universe particles dynamically around the speeding nose cone
        const pushRadius = 68 * (sc / 4);
        for (let i = 0; i < spaceParticles.length; i++) {
          const sp = spaceParticles[i];
          const dx = sp.x - rx;
          const dy = sp.y - ry;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < pushRadius) {
            const strength = (1 - dist / pushRadius) * 280 * dt;
            sp.vx += (dx / dist) * strength;
            sp.vy += (dy / dist) * strength;
            sp.disturbed = true;
          }
        }
      } else if (elapsed <= LAND_HOLD_END) {
        // Touchdown shockwave & calm center landing settle
        const p = (elapsed - MANEUVER_LAND_END) / (LAND_HOLD_END - MANEUVER_LAND_END);
        if (!touchdownTriggered) {
          touchdownTriggered = true;
          landingRingAlpha = 0.85;
          landingRingRadius = 14;
          spawnTouchdownShockwave(midX, midY, heroScale);
          onCenterImpactRef.current?.();
        }
        const cushion = Math.sin(p * Math.PI * 1.35) * 5.5 * Math.exp(-p * 3.2);
        rx = midX;
        ry = midY + cushion;
        sc = heroScale;
        thrust = 0.65 + Math.sin(p * Math.PI * 2) * 0.08;
        angleDeg = 0;
        realAlpha = 1;
        particleAlpha = 0;
      } else if (elapsed <= CONVERT_END) {
        // PHASE 3: Shrink smoothly from big real rocket to small cursor (1.0) & convert into particles
        const p = (elapsed - LAND_HOLD_END) / (CONVERT_END - LAND_HOLD_END);
        const glideEase = smootherstep(p);

        const arcLift = Math.sin(p * Math.PI) * 22;
        rx = midX + (targetPointerX - midX) * glideEase + arcLift * 0.2;
        ry = midY + (targetPointerY - midY) * glideEase - arcLift * 0.35;
        sc = heroScale + (1.0 - heroScale) * glideEase;
        thrust = 1.15 - glideEase * 0.15;

        const dx = targetPointerX - midX;
        const dy = targetPointerY - midY;
        angleDeg =
          Math.hypot(dx, dy) > 12
            ? ((Math.atan2(dy, dx) * 180) / Math.PI + 90) * Math.sin(p * Math.PI) * 0.45
            : 0;

        // Cross-convert realistic metallic rocket into luminous particle rocket
        const convertP = smootherstep(Math.min(Math.max((p - 0.12) / 0.68, 0), 1));
        realAlpha = 1 - convertP;
        particleAlpha = convertP;

        if (p > 0.08 && p < 0.82) {
          convSparkAccum += dt * 52;
          while (convSparkAccum >= 1) {
            convSparkAccum -= 1;
            spawnConversionSparks(rx, ry, sc, 1);
          }
        }
      } else {
        rocketVisible = false;
        if (!handoffDoneRef.current) {
          handoffDoneRef.current = true;
          onBecomeCursor();
        }
      }

      // Advance landing ring fade
      if (landingRingAlpha > 0.005) {
        landingRingRadius += dt * 210;
        landingRingAlpha = Math.max(0, landingRingAlpha - dt * 0.9);
      }

      // Emit rich moving exhaust trail
      if (rocketVisible) {
        const emitRate =
          elapsed <= MANEUVER_LAND_END ? 115 : elapsed <= LAND_HOLD_END ? 34 : 52;
        emitAccum += dt * emitRate;
        const angleRad = (angleDeg * Math.PI) / 180;
        while (emitAccum >= 1) {
          emitAccum -= 1;
          spawnPlumeParticle(rx, ry, angleRad, sc, thrust);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      const angleRad = (angleDeg * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      // 1. Update & draw ambient universe particles parting around the big flying rocket
      if (spaceParticles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = spaceParticles.length - 1; i >= 0; i--) {
          const sp = spaceParticles[i];
          sp.life += dt;
          if (sp.life >= sp.maxLife) {
            spaceParticles.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vx *= sp.disturbed ? 0.96 : 0.99;
          sp.vy *= sp.disturbed ? 0.96 : 0.99;

          const p = sp.life / sp.maxLife;
          const envelope = Math.min(1, sp.life * 3) * (1 - p);
          if (envelope <= 0.01) continue;

          const r = sp.size * 2.2;
          ctx.globalAlpha = sp.alpha * envelope;
          ctx.drawImage(sprites[sp.tone], sp.x - r, sp.y - r, r * 2, r * 2);
        }
        ctx.restore();
      }

      // 2. Touchdown plasma ring on landing
      if (landingRingAlpha > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(125, 211, 252, ${landingRingAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(
          midX,
          midY + 28 * heroScale,
          landingRingRadius,
          landingRingRadius * 0.24,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // 3. Soft contrast halo behind rocket
      if (rocketVisible) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.65 * Math.max(realAlpha, particleAlpha);
        const backingSpine = [5, 11, 17, 23];
        for (let b = 0; b < backingSpine.length; b++) {
          const ly = backingSpine[b] * sc;
          const bx = rx - ly * sinA;
          const by = ry + ly * cosA;
          const br = (9.5 + b * 1.1) * sc;
          ctx.drawImage(contrastBackingSprite, bx - br, by - br, br * 2, br * 2);
        }
        ctx.restore();
      }

      // 4. Exhaust plume sparks & embers
      if (exhaustPool.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = exhaustPool.length - 1; i >= 0; i--) {
          const ep = exhaustPool[i];
          ep.life += dt;
          if (ep.life >= ep.maxLife) {
            exhaustPool.splice(i, 1);
            continue;
          }
          ep.x += ep.vx * dt;
          ep.y += ep.vy * dt;
          ep.vx *= 0.96;
          ep.vy *= 0.96;

          const progress = ep.life / ep.maxLife;
          const alpha = (1 - progress) * (1 - progress) * 0.82;
          const drawRadius = ep.size * (1.35 - progress * 0.55) * 3.1;
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            sprites[ep.tone],
            ep.x - drawRadius,
            ep.y - drawRadius,
            drawRadius * 2,
            drawRadius * 2
          );
        }
        ctx.restore();
      }

      // 5. Real Big 3D-Shaded Aerospace Rocket
      if (rocketVisible && realAlpha > 0.01) {
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angleRad);
        drawRealRocket(ctx, sc, thrust, realAlpha, elapsed);
        ctx.restore();
      }

      // 6. Particle Rocket Blueprint (cross-fades in as rocket shrinks into cursor)
      if (rocketVisible && particleAlpha > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < structure.length; i++) {
          const pt = structure[i];
          let lx = pt.lx * sc;
          let ly = pt.ly * sc;

          if (pt.isFlame) {
            const flicker = 0.88 + 0.16 * Math.sin(elapsed * 28 + pt.phase);
            ly = (27.6 + (pt.ly - 27.6) * thrust * flicker) * sc;
            lx *= 0.92 + thrust * 0.12;
          }

          if (pt.jitterAmp > 0) {
            const jSpeed = pt.isFlame ? 22 : 4.2;
            lx += Math.sin(elapsed * jSpeed + pt.phase) * pt.jitterAmp * sc;
            ly += Math.cos(elapsed * (jSpeed * 0.85) + pt.phase * 1.3) * pt.jitterAmp * sc;
          }

          const wx = rx + lx * cosA - ly * sinA;
          const wy = ry + lx * sinA + ly * cosA;

          const twinkle = 0.82 + 0.18 * Math.sin(elapsed * 5.2 + pt.phase);
          const alpha = Math.min(1, pt.baseAlpha * twinkle * particleAlpha);
          const drawRadius = pt.size * sc * (pt.isFlame ? 3.05 : 2.75);

          ctx.globalAlpha = alpha;
          ctx.drawImage(
            sprites[pt.tone],
            wx - drawRadius,
            wy - drawRadius,
            drawRadius * 2,
            drawRadius * 2
          );
        }
        ctx.restore();
      }

      if (!rocketVisible && exhaustPool.length === 0 && spaceParticles.length === 0) {
        if (!completedRef.current) {
          completedRef.current = true;
          onFinished();
        }
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [onBecomeCursor, onFinished, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[7]"
    />
  );
};
