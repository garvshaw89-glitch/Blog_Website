import React, { useEffect, useRef } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import {
  buildRocketParticleBlueprint,
  createRocketSprites,
  ExhaustParticle,
  ParticleTone,
} from '../cursor/rocketBlueprint';
import '../cursor/cursor.css';

export interface CustomCursorProps {
  magneticStrength?: number;
  enabled?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  magneticStrength = 0.22,
  enabled = true,
}) => {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!enabled) {
      document.documentElement.classList.remove('custom-cursor-enabled');
      isVisibleRef.current = false;
      if (canvas) {
        canvas.style.opacity = '0';
        const ctxClear = canvas.getContext('2d');
        if (ctxClear) {
          ctxClear.setTransform(1, 0, 0, 1, 0, 0);
          ctxClear.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.opacity = '0';
      }
      return;
    }

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const isFinePointer = finePointerQuery.matches;

    if (isFinePointer) {
      document.documentElement.classList.add('custom-cursor-enabled');
    }

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', resizeCanvas, { passive: true });

    const { sprites, contrastBackingSprite } = createRocketSprites();
    const structure = buildRocketParticleBlueprint();
    const exhaustPool: ExhaustParticle[] = [];

    const engState = interactionEngine.state;
    const hasPointerPos =
      engState.clientX > 0 &&
      engState.clientY > 0 &&
      engState.clientX < window.innerWidth &&
      engState.clientY < window.innerHeight;
    const initX = hasPointerPos ? engState.clientX : window.innerWidth / 2;
    const initY = hasPointerPos ? engState.clientY : window.innerHeight / 2;
    targetPos.current = { x: initX, y: initY };
    prevTargetPos.current = { x: initX, y: initY };
    rocketPos.current = { x: initX, y: initY };
    badgePos.current = { x: initX, y: initY };
    rocketAngleRef.current = 0;
    targetAngleRef.current = 0;
    currentScaleRef.current = 1;
    targetScaleRef.current = 1;
    currentAlphaMultRef.current = 1;
    isVisibleRef.current = true;
    canvas.style.opacity = '1';
    if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';

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

    const handlePointerDown = (e: PointerEvent) => {
      const now = performance.now();
      boostUntilRef.current = now + 260;

      if (e.pointerType === 'touch') {
        targetPos.current.x = e.clientX;
        targetPos.current.y = e.clientY;
        rocketPos.current.x = e.clientX;
        rocketPos.current.y = e.clientY;
        prevTargetPos.current.x = e.clientX;
        prevTargetPos.current.y = e.clientY;
        isVisibleRef.current = true;
        canvas.style.opacity = '1';
      }

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

    let touchHoldUntil = isFinePointer ? 0 : performance.now() + 450;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      isTouching = true;
      touchHoldUntil = performance.now() + 900;
      targetPos.current.x = t.clientX;
      targetPos.current.y = t.clientY;
      rocketPos.current.x = t.clientX;
      rocketPos.current.y = t.clientY;
      prevTargetPos.current.x = t.clientX;
      prevTargetPos.current.y = t.clientY;
      isVisibleRef.current = true;
      canvas.style.opacity = '1';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      isTouching = true;
      touchHoldUntil = performance.now() + 650;
      targetPos.current.x = t.clientX;
      targetPos.current.y = t.clientY;
      isVisibleRef.current = true;
      canvas.style.opacity = '1';
    };

    const handleTouchEnd = () => {
      isTouching = false;
      touchHoldUntil = performance.now() + 550;
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    let rafId = 0;
    let prevTime = performance.now();
    let emitAccumulator = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const timeSec = now * 0.001;

      interactionEngine.step();

      // Auto-fade rocket after touch release on coarse-pointer phones/tablets
      if (!isFinePointer && !isTouching) {
        const remaining = touchHoldUntil - now;
        if (remaining <= 0) {
          isVisibleRef.current = false;
        }
      }

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
      const touchFade =
        !isFinePointer && !isTouching
          ? Math.max(0, Math.min(1, (touchHoldUntil - now) / 550))
          : 1;
      currentAlphaMultRef.current +=
        (targetAlphaMultRef.current * touchFade - currentAlphaMultRef.current) * damp;

      const angleRad = (rocketAngleRef.current * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const sc = currentScaleRef.current;
      const thrust = currentThrustRef.current;

      // Emit velocity-driven trailing stardust exhaust particles in screen space
      if (!prefersReducedMotion && (isVisibleRef.current || (!isFinePointer && touchFade > 0.05))) {
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

      if (isVisibleRef.current || exhaustPool.length > 0) {
        const rx = rocketPos.current.x;
        const ry = rocketPos.current.y;

        if (isVisibleRef.current && currentAlphaMultRef.current > 0.02) {
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
          const alpha = (1 - progress) * (1 - progress) * 0.72;
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
        if (isVisibleRef.current && currentAlphaMultRef.current > 0.02) {
          for (let i = 0; i < structure.length; i++) {
            const pt = structure[i];
            let lx = pt.lx * sc;
            let ly = pt.ly * sc;

            if (pt.isFlame) {
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
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      document.documentElement.classList.remove('custom-cursor-enabled');
      cancelAnimationFrame(rafId);

      if (activeMagneticRef.current) {
        resetMagneticElement(activeMagneticRef.current);
      }
    };
  }, [magneticStrength, enabled]);

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
