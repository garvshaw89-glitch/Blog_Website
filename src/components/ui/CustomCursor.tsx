import React, { useEffect, useRef, useState } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import '../cursor/cursor.css';

export interface CustomCursorProps {
  magneticStrength?: number;
}

type ParticleTone = 'silver' | 'cyan' | 'amber' | 'white';

interface RocketStructureParticle {
  lx: number;
  ly: number;
  size: number;
  baseAlpha: number;
  tone: ParticleTone;
  phase: number;
  jitterAmp: number;
  isFlame?: boolean;
  flameReach?: number;
}

interface ExhaustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  tone: ParticleTone;
}

function createGlowSprite(coreHex: string, midRgba: string, outerRgba: string): HTMLCanvasElement {
  const size = 24;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const half = size / 2;
    const grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, coreHex);
    grad.addColorStop(0.28, midRgba);
    grad.addColorStop(0.62, outerRgba);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

/**
 * Generates the exact 34x46 aerospace rocket blueprint (nose-tip at (0, 0))
 * rendered strictly from luminous micro-particles matching MotionParticleWorld.
 */
function buildRocketParticleBlueprint(): RocketStructureParticle[] {
  const pts: RocketStructureParticle[] = [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const push = (
    lx: number,
    ly: number,
    size: number,
    baseAlpha: number,
    tone: ParticleTone,
    jitterAmp = 0.28,
    isFlame = false,
    flameReach = 0
  ) => {
    pts.push({
      lx,
      ly,
      size,
      baseAlpha,
      tone,
      phase: rand() * Math.PI * 2,
      jitterAmp,
      isFlame,
      flameReach,
    });
  };

  // Exact fuselage half-width matching the 34x46 SVG Bezier silhouette (nose tip at 0,0)
  const hullHalfWidth = (y: number): number => {
    if (y <= 0) return 0;
    if (y <= 19.2) {
      const t = y / 19.2;
      return 5.4 * Math.pow(t, 0.72);
    }
    const t = Math.min((y - 19.2) / 6.4, 1);
    return 5.4 - 1.3 * t;
  };

  // 1. Precision nose tip beacon at exact (0, 0) pointer hotspot
  push(0, 0, 2.5, 1.0, 'white', 0);
  push(0, 0.8, 2.0, 0.95, 'cyan', 0.08);

  // 2. Outer aerodynamic fuselage contour (y = 0 .. 25.6) + cyan nose cone accents
  const hullSteps = 22;
  for (let i = 1; i <= hullSteps; i++) {
    const y = (i / hullSteps) * 25.6;
    const hw = hullHalfWidth(y);
    const inNoseCone = y <= 7.8;

    push(-hw, y, inNoseCone ? 1.55 : 1.4, 0.92, inNoseCone ? 'cyan' : 'silver', 0.2);
    push(hw, y, inNoseCone ? 1.55 : 1.4, 0.88, inNoseCone ? 'cyan' : 'silver', 0.2);

    // Nose cone horizontal ring & dense glowing interior particles
    if (inNoseCone) {
      const cols = Math.max(1, Math.round(hw / 1.35));
      for (let c = -cols + 1; c < cols; c++) {
        const x = (c / cols) * hw;
        push(x, y, 1.25, 0.82, c === 0 ? 'white' : 'cyan', 0.18);
      }
    }
  }

  // 3. Recessed teardrop canopy cutout (y = 9.6 .. 17.2)
  const canopyHalfW = (y: number): number => {
    if (y < 9.6 || y > 17.2) return 0;
    const t = (y - 9.6) / 7.6;
    return 2.05 * Math.sin(Math.pow(t, 0.75) * Math.PI);
  };

  for (let i = 0; i <= 12; i++) {
    const y = 9.6 + (i / 12) * 7.6;
    const cw = canopyHalfW(y);
    if (cw > 0.25) {
      push(-cw, y, 1.35, 0.95, 'cyan', 0.14);
      push(cw, y, 1.35, 0.95, 'cyan', 0.14);
    } else {
      push(0, y, 1.4, 0.95, 'cyan', 0.12);
    }
  }
  // Canopy specular highlight glint
  push(-0.75, 11.7, 1.25, 0.95, 'white', 0.1);
  push(-1.05, 13.0, 1.15, 0.85, 'white', 0.1);

  // 4. Split-lit interior hull shimmer particles (avoiding dark canopy interior for clear contrast)
  for (let y = 8.4; y <= 24.8; y += 1.65) {
    const hw = hullHalfWidth(y) * 0.76;
    const cw = canopyHalfW(y);
    for (let x = -hw; x <= hw; x += 1.55) {
      if (cw > 0 && Math.abs(x) < cw + 0.55) continue;
      const isLeftLit = x < 0;
      const tone: ParticleTone = rand() < 0.08 ? 'amber' : isLeftLit ? 'white' : 'silver';
      push(
        x + (rand() - 0.5) * 0.35,
        y + (rand() - 0.5) * 0.35,
        1.15 + rand() * 0.45,
        isLeftLit ? 0.78 : 0.58,
        tone,
        0.26
      );
    }
  }

  // 5. Central dorsal fin spine (y = 18.4 .. 25.2)
  for (let y = 18.4; y <= 25.2; y += 1.15) {
    push(0, y, 1.45, 0.94, 'cyan', 0.15);
  }

  // 6. Swept delta stabilizer wings (left & right mirror)
  const wingTriangles: [number, number, number, number, number, number][] = [
    [-5.2, 16.8, -11.8, 24.8, -5.4, 23.6],
    [5.2, 16.8, 11.8, 24.8, 5.4, 23.6],
  ];

  for (const [x1, y1, x2, y2, x3, y3] of wingTriangles) {
    // Crisp wing leading/trailing edges
    const edges: [number, number, number, number, number][] = [
      [x1, y1, x2, y2, 9],
      [x2, y2, x3, y3, 7],
      [x3, y3, x1, y1, 6],
    ];
    for (const [ax, ay, bx, by, steps] of edges) {
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const tone: ParticleTone = s === steps && ax === x1 ? 'amber' : 'cyan';
        push(
          ax + (bx - ax) * f,
          ay + (by - ay) * f,
          1.35,
          0.9,
          tone,
          0.2
        );
      }
    }
    // Interior wing fill particles
    for (let u = 0.2; u <= 0.78; u += 0.28) {
      for (let v = 0.2; v <= 0.78 - u * 0.5; v += 0.28) {
        const w = 1 - u - v;
        if (w <= 0.08) continue;
        push(
          x1 * u + x2 * v + x3 * w,
          y1 * u + y2 * v + y3 * w,
          1.15,
          0.66,
          rand() < 0.14 ? 'silver' : 'cyan',
          0.25
        );
      }
    }
  }

  // 7. Thruster bell nozzle rim (y = 25.6 .. 27.4)
  for (let x = -3.8; x <= 3.8; x += 1.08) {
    push(x, 25.8, 1.3, 0.85, 'silver', 0.12);
    push(x * 1.05, 27.2, 1.35, 0.9, 'cyan', 0.12);
  }

  // 8. Dynamic particle exhaust plume (y = 27.8 .. 42.5)
  for (let i = 0; i < 34; i++) {
    const reach = (i / 33) * 1.0; // 0 = nozzle throat, 1 = plume tip
    const baseY = 27.8 + reach * 14.5;
    const spread = (1 - reach * 0.75) * 3.1;
    const lx = (rand() - 0.5) * 2 * spread;
    const isCore = Math.abs(lx) < 1.1 && reach < 0.55;
    const tone: ParticleTone = isCore
      ? 'white'
      : reach > 0.45 && rand() < 0.52
      ? 'amber'
      : 'cyan';
    push(
      lx,
      baseY,
      (1.75 - reach * 0.65) + rand() * 0.4,
      0.95 - reach * 0.48,
      tone,
      0.75,
      true,
      reach
    );
  }

  return pts;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength = 0.22 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const badgeWrapRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const rocketPos = useRef({ x: -100, y: -100 });
  const badgePos = useRef({ x: -100, y: -100 });
  const rocketAngleRef = useRef<number>(-32);
  const targetAngleRef = useRef<number>(-32);
  const prevTargetPos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef<boolean>(false);

  const targetScaleRef = useRef<number>(1);
  const currentScaleRef = useRef<number>(1);
  const targetThrustRef = useRef<number>(1);
  const currentThrustRef = useRef<number>(1);
  const targetAlphaMultRef = useRef<number>(1);
  const currentAlphaMultRef = useRef<number>(1);
  const boostUntilRef = useRef<number>(0);

  const activeMagneticRef = useRef<HTMLElement | null>(null);
  const currentCursorKeyRef = useRef<string>('default:');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointerQuery.matches) {
      setIsSupported(false);
      return;
    }

    document.documentElement.classList.add('custom-cursor-enabled');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const sprites: Record<ParticleTone, HTMLCanvasElement> = {
      white: createGlowSprite('rgba(255,255,255,1)', 'rgba(224,242,254,0.65)', 'rgba(56,189,248,0.18)'),
      silver: createGlowSprite('rgba(241,245,249,0.98)', 'rgba(203,213,225,0.55)', 'rgba(148,163,184,0.15)'),
      cyan: createGlowSprite('rgba(224,242,254,1)', 'rgba(56,189,248,0.72)', 'rgba(14,165,233,0.2)'),
      amber: createGlowSprite('rgba(254,243,199,1)', 'rgba(255,157,56,0.72)', 'rgba(245,158,11,0.2)'),
    };
    const contrastBackingSprite = createGlowSprite(
      'rgba(3,5,10,0.45)',
      'rgba(3,5,10,0.22)',
      'rgba(3,5,10,0)'
    );

    const structure = buildRocketParticleBlueprint();
    const exhaustPool: ExhaustParticle[] = [];

    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;
    targetPos.current = { x: initX, y: initY };
    prevTargetPos.current = { x: initX, y: initY };
    rocketPos.current = { x: initX, y: initY };
    badgePos.current = { x: initX, y: initY };

    const handlePointerEnter = () => {
      isVisibleRef.current = true;
      canvas.style.opacity = '1';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      canvas.style.opacity = '0';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '0';
    };

    window.addEventListener('mouseenter', handlePointerEnter);
    window.addEventListener('mouseleave', handlePointerLeave);

    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPos.current.x = state.clientX;
      targetPos.current.y = state.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        canvas.style.opacity = '1';
        if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
      }

      // Magnetic attraction on interactive targets
      if (state.magneticTarget && !state.prefersReduced) {
        if (activeMagneticRef.current && activeMagneticRef.current !== state.magneticTarget) {
          resetMagneticElement(activeMagneticRef.current);
        }
        activeMagneticRef.current = state.magneticTarget;
        applyMagneticAttraction(state.magneticTarget, state.clientX, state.clientY, {
          strength: magneticStrength,
          maxDisplacement: 8,
        });
      } else if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
        activeMagneticRef.current = null;
      }

      const labelEl = labelRef.current;
      if (labelEl) {
        const customCursor = state.customCursor;
        const customLabel = state.customCursorLabel;

        let newCursorType = 'default';
        let newLabelText = '';

        if (customCursor === 'project' || customCursor === 'view' || state.hoverType === 'project') {
          newCursorType = 'project';
          newLabelText = customLabel || 'OPEN';
        } else if (customCursor === 'image') {
          newCursorType = 'project';
          newLabelText = customLabel || 'EXPLORE';
        } else if (customCursor === 'drag') {
          newCursorType = 'drag';
          newLabelText = '← DRAG →';
        } else if (customCursor === 'button' || state.hoverType === 'button') {
          newCursorType = 'button';
          newLabelText = customLabel || 'VIEW ↗';
        } else if (customCursor === 'link' || state.hoverType === 'link') {
          newCursorType = 'link';
          newLabelText = customLabel || 'VISIT ↗';
        } else if (state.hoverType === 'text') {
          newCursorType = 'text';
          newLabelText = '';
        }

        const stateKey = `${newCursorType}:${newLabelText}`;
        if (stateKey !== currentCursorKeyRef.current) {
          currentCursorKeyRef.current = stateKey;

          if (newCursorType === 'project') {
            targetScaleRef.current = 1.16;
            targetThrustRef.current = 1.35;
            targetAlphaMultRef.current = 1;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'drag' || newCursorType === 'button') {
            targetScaleRef.current = 1.12;
            targetThrustRef.current = 1.24;
            targetAlphaMultRef.current = 1;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'link') {
            targetScaleRef.current = 1.1;
            targetThrustRef.current = 1.22;
            targetAlphaMultRef.current = 1;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'text') {
            targetScaleRef.current = 0.84;
            targetThrustRef.current = 0.68;
            targetAlphaMultRef.current = 0.78;
            labelEl.style.display = 'none';
          } else {
            targetScaleRef.current = 1;
            targetThrustRef.current = 1;
            targetAlphaMultRef.current = 1;
            labelEl.style.display = 'none';
          }
        }
      }
    });

    const spawnExhaustParticle = (
      originX: number,
      originY: number,
      angleRad: number,
      scale: number,
      speedBoost: number,
      toneOverride?: ParticleTone
    ) => {
      if (exhaustPool.length >= 64) exhaustPool.shift();
      const sinA = Math.sin(angleRad);
      const cosA = Math.cos(angleRad);

      // Nozzle sits at local (0, 27.6) relative to nose tip (0, 0)
      const jitterX = (Math.random() - 0.5) * 3.2 * scale;
      const nozzleY = 27.8 * scale;
      const wx = originX + jitterX * cosA - nozzleY * sinA;
      const wy = originY + jitterX * sinA + nozzleY * cosA;

      // Tail eject direction = rocket +Y local axis rotated to screen space
      const ejectMag = (26 + Math.random() * 44) * speedBoost;
      const spread = (Math.random() - 0.5) * 0.45;
      const ejectAngle = angleRad + spread;
      const vx = -Math.sin(ejectAngle) * ejectMag;
      const vy = Math.cos(ejectAngle) * ejectMag;

      const r = Math.random();
      const tone: ParticleTone =
        toneOverride || (r < 0.34 ? 'amber' : r < 0.78 ? 'cyan' : 'white');

      exhaustPool.push({
        x: wx,
        y: wy,
        vx,
        vy,
        size: 1.5 + Math.random() * 1.4,
        life: 0,
        maxLife: 0.28 + Math.random() * 0.26,
        tone,
      });
    };

    const handlePointerDown = () => {
      const now = performance.now();
      boostUntilRef.current = now + 260;

      if (!prefersReducedMotion) {
        const angleRad = (rocketAngleRef.current * Math.PI) / 180;
        for (let i = 0; i < 18; i++) {
          spawnExhaustParticle(
            rocketPos.current.x,
            rocketPos.current.y,
            angleRad,
            currentScaleRef.current,
            2.3,
            i % 3 === 0 ? 'amber' : i % 2 === 0 ? 'white' : 'cyan'
          );
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    let rafId = 0;
    let prevTime = performance.now();
    let emitAccumulator = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const timeSec = now * 0.001;

      interactionEngine.step();

      const tx = targetPos.current.x;
      const ty = targetPos.current.y;

      const dx = tx - prevTargetPos.current.x;
      const dy = ty - prevTargetPos.current.y;
      const speed = Math.hypot(dx, dy);

      if (speed > 1.0) {
        targetAngleRef.current = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      }
      prevTargetPos.current.x = tx;
      prevTargetPos.current.y = ty;

      // Shortest-arc aerodynamic banking interpolation
      const angleDiff =
        ((((targetAngleRef.current - rocketAngleRef.current + 180) % 360) + 360) % 360) - 180;
      rocketAngleRef.current += angleDiff * 0.22;

      // Crisp 0.90 micro-lerp so nose-tip stays locked to pointer input
      rocketPos.current.x += (tx - rocketPos.current.x) * 0.9;
      rocketPos.current.y += (ty - rocketPos.current.y) * 0.9;

      // Upright trailing HUD badge
      badgePos.current.x += (tx - badgePos.current.x) * 0.26;
      badgePos.current.y += (ty - badgePos.current.y) * 0.26;
      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.transform = `translate3d(${badgePos.current.x}px, ${badgePos.current.y}px, 0)`;
      }

      const isBoosting = now < boostUntilRef.current;
      const desiredScale = isBoosting ? targetScaleRef.current * 1.12 : targetScaleRef.current;
      const desiredThrust = isBoosting
        ? 1.95
        : Math.min(2.0, (0.88 + speed * 0.04) * targetThrustRef.current);

      const damp = 1 - Math.exp(-14 * dt);
      currentScaleRef.current += (desiredScale - currentScaleRef.current) * damp;
      currentThrustRef.current += (desiredThrust - currentThrustRef.current) * damp;
      currentAlphaMultRef.current += (targetAlphaMultRef.current - currentAlphaMultRef.current) * damp;

      const angleRad = (rocketAngleRef.current * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const sc = currentScaleRef.current;
      const thrust = currentThrustRef.current;

      // Emit velocity-driven trailing stardust exhaust particles in screen space
      if (!prefersReducedMotion && isVisibleRef.current) {
        const emitRate = speed > 1.2 ? Math.min(90, 24 + speed * 2.2) : 14;
        emitAccumulator += dt * emitRate;
        while (emitAccumulator >= 1) {
          emitAccumulator -= 1;
          spawnExhaustParticle(
            rocketPos.current.x,
            rocketPos.current.y,
            angleRad,
            sc,
            isBoosting ? 1.8 : 0.8 + Math.min(speed * 0.04, 1.2)
          );
        }
      }

      // Render particle rocket + exhaust stream
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (isVisibleRef.current) {
        const rx = rocketPos.current.x;
        const ry = rocketPos.current.y;

        // Subtle dark backing pass keeps particles legible even over bright UI buttons
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.72 * currentAlphaMultRef.current;
        const backingSpine = [5, 11, 17, 23];
        for (let b = 0; b < backingSpine.length; b++) {
          const ly = backingSpine[b] * sc;
          const bx = rx - ly * sinA;
          const by = ry + ly * cosA;
          const br = (9.5 + b * 1.1) * sc;
          ctx.drawImage(contrastBackingSprite, bx - br, by - br, br * 2, br * 2);
        }

        ctx.globalCompositeOperation = 'lighter';

        // 1. Update & draw drifting exhaust particles behind the rocket
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
          const alpha = (1 - progress) * (1 - progress) * 0.72 * currentAlphaMultRef.current;
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

        // 2. Draw structured particle rocket rotated around exact nose tip (rx, ry)

        for (let i = 0; i < structure.length; i++) {
          const pt = structure[i];
          let lx = pt.lx * sc;
          let ly = pt.ly * sc;

          if (pt.isFlame) {
            // Stretch active plume along thruster axis & animate supersonic shimmer
            const flicker = prefersReducedMotion
              ? 1
              : 0.88 + 0.16 * Math.sin(timeSec * 28 + pt.phase);
            ly = (27.6 + (pt.ly - 27.6) * thrust * flicker) * sc;
            lx *= 0.92 + thrust * 0.12;
          }

          if (!prefersReducedMotion && pt.jitterAmp > 0) {
            const jSpeed = pt.isFlame ? 22 : 4.2;
            lx += Math.sin(timeSec * jSpeed + pt.phase) * pt.jitterAmp * sc;
            ly += Math.cos(timeSec * (jSpeed * 0.85) + pt.phase * 1.3) * pt.jitterAmp * sc;
          }

          const wx = rx + lx * cosA - ly * sinA;
          const wy = ry + lx * sinA + ly * cosA;

          const twinkle = prefersReducedMotion
            ? 1
            : 0.8 + 0.2 * Math.sin(timeSec * 5.2 + pt.phase);
          const alpha = Math.min(1, pt.baseAlpha * twinkle * currentAlphaMultRef.current);
          const drawRadius = pt.size * sc * (isBoosting && pt.isFlame ? 3.2 : 2.75);

          ctx.globalAlpha = alpha;
          ctx.drawImage(
            sprites[pt.tone],
            wx - drawRadius,
            wy - drawRadius,
            drawRadius * 2,
            drawRadius * 2
          );
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.documentElement.classList.remove('custom-cursor-enabled');
      cancelAnimationFrame(rafId);

      if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
      }
    };
  }, [magneticStrength]);

  if (!isSupported) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="custom-cursor"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: 1,
        visibility: 'visible',
        display: 'block',
      }}
    >
      {/* Full-viewport Particle Rocket Canvas */}
      <canvas ref={canvasRef} className="cursor-rocket-canvas" />

      {/* Upright Trailing Context HUD Badge */}
      <div ref={badgeWrapRef} className="cursor-rocket-badge-wrap">
        <span
          ref={labelRef}
          className="cursor-view-label"
          style={{ display: 'none' }}
        >
          VIEW ↗
        </span>
      </div>
    </div>
  );
};
