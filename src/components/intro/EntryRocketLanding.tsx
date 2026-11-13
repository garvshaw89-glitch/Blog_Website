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
  onBecomeCursor: () => void;
  onFinished: () => void;
  prefersReducedMotion: boolean;
}

interface UniverseSplitParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  tone: ParticleTone;
  hasSplit: boolean;
}

const smootherstep = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/**
 * ENTRY ROCKET LANDING SEQUENCE
 *
 * 1. Splits open the universe particle field right in the center of space ("middle of the universe").
 * 2. Real 3D-shaded aerospace rocket breaks out forward from deep space through the particle rift.
 * 3. Decelerates and lands cleanly in the middle of the entry page with a thruster shockwave ring.
 * 4. Converts into luminous micro-particles while shrinking to cursor scale (1.0) and gliding
 *    onto the live pointer coordinates to become the interactive particle rocket cursor.
 */
export const EntryRocketLanding: React.FC<EntryRocketLandingProps> = ({
  onBecomeCursor,
  onFinished,
  prefersReducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handoffDoneRef = useRef(false);
  const completedRef = useRef(false);

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
    const universeParticles: UniverseSplitParticle[] = [];

    const initVw = window.innerWidth;
    const initVh = window.innerHeight;
    const minDim = Math.min(initVw, initVh);
    const initMidX = initVw * 0.5;
    const initMidY = initVh * 0.5;

    // Seed cosmic particles clustered at the middle of the universe ready to be split open
    const cosmicCount = initVw < 640 ? 150 : 230;
    for (let i = 0; i < cosmicCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.72) * minDim * 0.34;
      const px = initMidX + Math.cos(theta) * dist;
      const py = initMidY + Math.sin(theta) * dist * 0.78;
      const r = Math.random();
      const tone: ParticleTone =
        r < 0.42 ? 'white' : r < 0.78 ? 'cyan' : r < 0.92 ? 'silver' : 'amber';
      universeParticles.push({
        x: px,
        y: py,
        prevX: px,
        prevY: py,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        size: 1.0 + Math.random() * 1.9,
        alpha: 0.45 + Math.random() * 0.55,
        life: 0,
        maxLife: 1.45 + Math.random() * 1.1,
        tone,
        hasSplit: false,
      });
    }

    // Phase timing (seconds)
    const BREAKOUT_END = 0.85; // Splits center universe & rocket bursts forward from deep space
    const LANDING_END = 1.82; // Decelerates & lands in middle of entry page with shockwave
    const CONVERT_END = 2.75; // Converts real rocket -> particle rocket & shrinks into cursor

    let breakoutTriggered = false;
    let touchdownTriggered = false;
    let riftRingRadius = 4;
    let riftRingAlpha = 0.9;
    let landingRingRadius = 10;
    let landingRingAlpha = 0;

    const triggerUniverseSplit = (cx: number, cy: number) => {
      for (let i = 0; i < universeParticles.length; i++) {
        const p = universeParticles[i];
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.max(4, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        // Strong lateral + radial "splitting open the universe" velocity impulse
        const sideSign = dx >= 0 ? 1 : -1;
        const radialBurst = (220 + Math.random() * 340) * (0.45 + 0.55 * (1 - Math.min(dist / (minDim * 0.35), 1)));
        const splitParting = sideSign * (130 + Math.random() * 210);
        p.vx += nx * radialBurst + splitParting;
        p.vy += ny * radialBurst * 0.78 + (Math.random() - 0.5) * 95;
        p.hasSplit = true;
      }

      // Add high-energy breakout shards radiating from the split center
      const shardCount = initVw < 640 ? 44 : 72;
      for (let i = 0; i < shardCount; i++) {
        const theta = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
        const speed = 240 + Math.random() * 420;
        const sideBoost = Math.cos(theta) * 140;
        const tone: ParticleTone = i % 5 === 0 ? 'amber' : i % 2 === 0 ? 'cyan' : 'white';
        universeParticles.push({
          x: cx + Math.cos(theta) * 4,
          y: cy + Math.sin(theta) * 4,
          prevX: cx,
          prevY: cy,
          vx: Math.cos(theta) * speed + sideBoost,
          vy: Math.sin(theta) * speed * 0.85,
          size: 1.3 + Math.random() * 1.8,
          alpha: 0.95,
          life: 0,
          maxLife: 0.85 + Math.random() * 0.75,
          tone,
          hasSplit: true,
        });
      }
    };

    const spawnPlumeParticle = (
      ox: number,
      oy: number,
      angleRad: number,
      sc: number,
      speedMult: number,
      toneOverride?: ParticleTone
    ) => {
      if (exhaustPool.length >= 160) exhaustPool.shift();
      const sinA = Math.sin(angleRad);
      const cosA = Math.cos(angleRad);
      const jitterX = (Math.random() - 0.5) * 4.0 * sc;
      const nozzleY = 27.8 * sc;
      const wx = ox + jitterX * cosA - nozzleY * sinA;
      const wy = oy + jitterX * sinA + nozzleY * cosA;

      const ejectMag = (42 + Math.random() * 82) * speedMult;
      const spread = (Math.random() - 0.5) * 0.6;
      const ejectAngle = angleRad + spread;

      const r = Math.random();
      const tone: ParticleTone =
        toneOverride || (r < 0.36 ? 'amber' : r < 0.8 ? 'cyan' : 'white');

      exhaustPool.push({
        x: wx,
        y: wy,
        vx: -Math.sin(ejectAngle) * ejectMag,
        vy: Math.cos(ejectAngle) * ejectMag,
        size: (1.45 + Math.random() * 1.45) * Math.max(0.85, sc * 0.56),
        life: 0,
        maxLife: 0.34 + Math.random() * 0.3,
        tone,
      });
    };

    const spawnTouchdownShockwave = (cx: number, cy: number, sc: number) => {
      const nozzleY = 28 * sc;
      for (let i = 0; i < 40; i++) {
        const theta = (i / 40) * Math.PI * 2;
        const speed = 80 + Math.random() * 75;
        const tone: ParticleTone = i % 3 === 0 ? 'amber' : i % 2 === 0 ? 'cyan' : 'white';
        exhaustPool.push({
          x: cx + Math.cos(theta) * 6,
          y: cy + nozzleY + Math.sin(theta) * 2.5,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed * 0.26,
          size: 1.55 + Math.random() * 1.25,
          life: 0,
          maxLife: 0.55 + Math.random() * 0.3,
          tone,
        });
      }
    };

    const spawnConversionSparks = (rx: number, ry: number, sc: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const ly = Math.random() * 26 * sc;
        const lx = (Math.random() - 0.5) * 11 * sc;
        const theta = Math.random() * Math.PI * 2;
        const spd = 25 + Math.random() * 55;
        const tone: ParticleTone = i % 3 === 0 ? 'white' : i % 2 === 0 ? 'cyan' : 'amber';
        exhaustPool.push({
          x: rx + lx,
          y: ry + ly,
          vx: Math.cos(theta) * spd,
          vy: Math.sin(theta) * spd,
          size: 1.2 + Math.random() * 1.1,
          life: 0,
          maxLife: 0.32 + Math.random() * 0.25,
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
      const heroScale = vw < 480 ? 2.15 : isMobile ? 2.45 : vw < 1024 ? 2.95 : 3.45;

      const midX = vw * 0.5;
      const midY = vh * 0.5 - 16 * heroScale * 0.45;
      const riftCenterY = vh * 0.5;

      // Live pointer position for the cursor handoff
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
      let portalBloom = 0;

      if (elapsed <= BREAKOUT_END) {
        // PHASE 1: Come straight out from the middle of the universe, splitting particles outward!
        const p = elapsed / BREAKOUT_END;
        if (!breakoutTriggered && p >= 0.08) {
          breakoutTriggered = true;
          triggerUniverseSplit(midX, riftCenterY);
        }
        const depthEase = 1 - Math.pow(1 - p, 2.8);
        // Emerge from center depth (scale 0.08 -> heroScale * 1.16)
        sc = heroScale * (0.08 + 1.08 * depthEase);
        rx = midX;
        // Slight dramatic breakout surge upward out of the rift center
        ry = riftCenterY + (midY - 32 - riftCenterY) * depthEase;
        thrust = 1.95 - p * 0.25;
        angleDeg = Math.sin(p * Math.PI) * 1.8;
        realAlpha = Math.min(1, p * 4.5);
        particleAlpha = Math.max(0, 1 - p * 2.8) * 0.65;
        portalBloom = Math.sin(Math.min(1, p * 1.35) * Math.PI);
      } else if (elapsed <= LANDING_END) {
        // PHASE 2: Descend onto the exact middle of the entry page & land cleanly
        const p = (elapsed - BREAKOUT_END) / (LANDING_END - BREAKOUT_END);
        const approachPhase = Math.min(p / 0.42, 1);
        const approachEase = smootherstep(approachPhase);

        const hoverY = midY - 32;
        if (p < 0.42) {
          rx = midX;
          ry = hoverY + (midY - hoverY) * approachEase;
          sc = heroScale * (1.16 - 0.16 * approachEase);
          thrust = 1.5 - approachEase * 0.72;
        } else {
          if (!touchdownTriggered) {
            touchdownTriggered = true;
            landingRingAlpha = 0.78;
            landingRingRadius = 10;
            spawnTouchdownShockwave(midX, midY, heroScale);
          }
          const settleP = (p - 0.42) / 0.58;
          const cushion = Math.sin(settleP * Math.PI * 1.5) * 4.5 * Math.exp(-settleP * 3.5);
          rx = midX;
          ry = midY + cushion;
          sc = heroScale;
          thrust = 0.68 + Math.sin(settleP * Math.PI * 2) * 0.08;
        }
        angleDeg = 0;
        realAlpha = 1;
        particleAlpha = 0;
      } else if (elapsed <= CONVERT_END) {
        // PHASE 3: Real rocket converts into particle rocket & shrinks smoothly into cursor
        const p = (elapsed - LANDING_END) / (CONVERT_END - LANDING_END);
        const glideEase = smootherstep(p);

        const arcLift = Math.sin(p * Math.PI) * 24;
        rx = midX + (targetPointerX - midX) * glideEase + arcLift * 0.22;
        ry = midY + (targetPointerY - midY) * glideEase - arcLift * 0.35;
        sc = heroScale + (1.0 - heroScale) * glideEase;
        thrust = 1.15 - glideEase * 0.15;

        const dx = targetPointerX - midX;
        const dy = targetPointerY - midY;
        angleDeg =
          Math.hypot(dx, dy) > 12
            ? ((Math.atan2(dy, dx) * 180) / Math.PI + 90) * Math.sin(p * Math.PI) * 0.5
            : 0;

        // Smooth cross-conversion: solid aerospace rocket dissolves into particle blueprint
        const convertP = smootherstep(Math.min(p / 0.65, 1));
        realAlpha = 1 - convertP;
        particleAlpha = convertP;

        if (p < 0.75) {
          convSparkAccum += dt * 48;
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

      // Advance split rift wave & touchdown shock-ring
      if (riftRingAlpha > 0.005) {
        riftRingRadius += dt * (vw < 640 ? 320 : 480);
        riftRingAlpha = Math.max(0, riftRingAlpha - dt * 1.1);
      }
      if (landingRingAlpha > 0.005) {
        landingRingRadius += dt * 165;
        landingRingAlpha = Math.max(0, landingRingAlpha - dt * 0.85);
      }

      // Emit rocket exhaust dust
      if (rocketVisible) {
        const emitRate = elapsed <= BREAKOUT_END ? 85 : elapsed <= LANDING_END ? 34 : 50;
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

      // A. Center universe split-rift glow & expanding shockwave
      if (portalBloom > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const bloomR = (isMobile ? 85 : 135) * (0.4 + portalBloom * 0.8);
        const riftGrad = ctx.createRadialGradient(midX, riftCenterY, 0, midX, riftCenterY, bloomR);
        riftGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.75 * portalBloom).toFixed(3)})`);
        riftGrad.addColorStop(0.28, `rgba(125, 211, 252, ${(0.42 * portalBloom).toFixed(3)})`);
        riftGrad.addColorStop(0.7, `rgba(14, 165, 233, ${(0.14 * portalBloom).toFixed(3)})`);
        riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = riftGrad;
        ctx.beginPath();
        ctx.arc(midX, riftCenterY, bloomR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp split-tear flare bisecting the universe horizontally & vertically
        ctx.globalAlpha = portalBloom * 0.7;
        const tearW = bloomR * 1.45;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        ctx.fillRect(midX - tearW, riftCenterY - 1.2, tearW * 2, 2.4);
        ctx.restore();
      }

      if (riftRingAlpha > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(186, 230, 253, ${(riftRingAlpha * 0.55).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(midX, riftCenterY, riftRingRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // B. Update & draw universe-split particles bursting outward from center
      if (universeParticles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = universeParticles.length - 1; i >= 0; i--) {
          const p = universeParticles[i];
          p.life += dt;
          if (p.life >= p.maxLife) {
            universeParticles.splice(i, 1);
            continue;
          }
          p.prevX = p.x;
          p.prevY = p.y;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= p.hasSplit ? 0.965 : 0.985;
          p.vy *= p.hasSplit ? 0.965 : 0.985;

          const progress = p.life / p.maxLife;
          const fade = p.alpha * (1 - progress) * (1 - progress * 0.5);
          if (fade <= 0.01) continue;

          // Subtle luminous streak when breaking outward
          const speed = Math.hypot(p.vx, p.vy);
          if (p.hasSplit && speed > 90) {
            ctx.globalAlpha = fade * 0.45;
            ctx.strokeStyle = p.tone === 'amber' ? '#fbbf24' : p.tone === 'cyan' ? '#7dd3fc' : '#ffffff';
            ctx.lineWidth = Math.max(0.8, p.size * 0.55);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
            ctx.stroke();
          }

          const drawRadius = p.size * 2.5;
          ctx.globalAlpha = fade;
          ctx.drawImage(
            sprites[p.tone],
            p.x - drawRadius,
            p.y - drawRadius,
            drawRadius * 2,
            drawRadius * 2
          );
        }
        ctx.restore();
      }

      // C. Subtle touchdown plasma ring beneath thruster nozzle on landing
      if (landingRingAlpha > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(125, 211, 252, ${landingRingAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(
          midX,
          midY + 28 * heroScale,
          landingRingRadius,
          landingRingRadius * 0.25,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // D. Backing contrast shadow behind rocket
      if (rocketVisible) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.68 * Math.max(realAlpha, particleAlpha);
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

      // E. Drifting exhaust & conversion spark particles
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
          const alpha = (1 - progress) * (1 - progress) * 0.78;
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

      // F. Draw REAL 3D-shaded aerospace rocket
      if (rocketVisible && realAlpha > 0.01) {
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angleRad);
        drawRealRocket(ctx, sc, thrust, realAlpha, elapsed);
        ctx.restore();
      }

      // G. Draw Particle Rocket Blueprint (fades in during conversion to cursor)
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

      if (!rocketVisible && exhaustPool.length === 0 && universeParticles.length === 0) {
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
