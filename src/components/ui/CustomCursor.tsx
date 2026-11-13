import React, { useEffect, useRef } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import {
  createRocketSprites,
  ExhaustParticle,
  ParticleTone,
} from '../cursor/rocketBlueprint';
import { drawRealRocket } from '../intro/drawRealRocket';
import { CursorInteractionController } from '../cursor/CursorInteractionManager';
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
  const hoverGlowRef = useRef<number>(0);
  const boostUntilRef = useRef<number>(0);

  const activeMagneticRef = useRef<HTMLElement | null>(null);
  const currentCursorKeyRef = useRef<string>('default:');
  const lastHoverTargetRef = useRef<EventTarget | null>(null);

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
    let isFinePointer = finePointerQuery.matches;

    const syncCursorClass = (shouldHideNative: boolean) => {
      if (shouldHideNative && isFinePointer) {
        document.documentElement.classList.add('custom-cursor-enabled');
      } else {
        document.documentElement.classList.remove('custom-cursor-enabled');
      }
    };
    syncCursorClass(true);

    const handlePointerMediaChange = (e: MediaQueryListEvent) => {
      isFinePointer = e.matches;
      syncCursorClass(isFinePointer);
      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.opacity = isFinePointer ? '1' : '0';
      }
    };
    finePointerQuery.addEventListener('change', handlePointerMediaChange);

    if (!canvas) {
      return () => {
        finePointerQuery.removeEventListener('change', handlePointerMediaChange);
        document.documentElement.classList.remove('custom-cursor-enabled');
      };
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => {
        finePointerQuery.removeEventListener('change', handlePointerMediaChange);
        document.documentElement.classList.remove('custom-cursor-enabled');
      };
    }

    const controller = new CursorInteractionController();
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

    const { sprites } = createRocketSprites();
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
    rocketAngleRef.current = -28;
    targetAngleRef.current = -28;
    currentScaleRef.current = 1;
    targetScaleRef.current = 1;
    currentAlphaMultRef.current = 0;
    targetAlphaMultRef.current = isFinePointer ? 1 : 0;
    isVisibleRef.current = isFinePointer;
    canvas.style.opacity = '1';
    if (badgeWrapRef.current) {
      badgeWrapRef.current.style.opacity = isFinePointer ? '1' : '0';
    }

    const handlePointerEnter = () => {
      if (!isFinePointer) return;
      isVisibleRef.current = true;
      canvas.style.opacity = '1';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '0';
    };

    const handleRawPointerMove = (e: PointerEvent) => {
      lastHoverTargetRef.current = e.target;
    };

    window.addEventListener('mouseenter', handlePointerEnter);
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('pointermove', handleRawPointerMove, { passive: true });

    let latestSpeed = 0;

    const applyInteractionTargets = (now: number) => {
      if (!isFinePointer) {
        syncCursorClass(false);
        targetAlphaMultRef.current = 0;
        if (labelRef.current) labelRef.current.style.display = 'none';
        return;
      }

      const state = interactionEngine.state;
      const targets = controller.evaluate(
        state,
        latestSpeed,
        now,
        lastHoverTargetRef.current
      );

      targetScaleRef.current = targets.targetScale;
      targetThrustRef.current = targets.targetThrust;
      targetAlphaMultRef.current = targets.targetAlphaMult;
      hoverGlowRef.current = targets.hoverGlow;
      syncCursorClass(!targets.restoreNativeCursor);

      const labelEl = labelRef.current;
      if (labelEl) {
        const stateKey = `${targets.cursorType}:${targets.labelText}`;
        if (stateKey !== currentCursorKeyRef.current) {
          currentCursorKeyRef.current = stateKey;
          if (targets.labelText && !targets.restoreNativeCursor) {
            labelEl.textContent = targets.labelText;
            labelEl.style.display = 'block';
          } else {
            labelEl.style.display = 'none';
          }
        }
      }
    };

    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPos.current.x = state.clientX;
      targetPos.current.y = state.clientY;

      if (isFinePointer && !isVisibleRef.current) {
        isVisibleRef.current = true;
        canvas.style.opacity = '1';
        if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
      }

      // Magnetic attraction on desktop interactive targets
      if (isFinePointer && state.magneticTarget && !state.prefersReduced) {
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

      applyInteractionTargets(performance.now());
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

      const jitterX = (Math.random() - 0.5) * 3.2 * scale;
      const nozzleY = 27.8 * scale;
      const wx = originX + jitterX * cosA - nozzleY * sinA;
      const wy = originY + jitterX * sinA + nozzleY * cosA;

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

    const spawnTouchFeedbackBurst = (x: number, y: number) => {
      if (prefersReducedMotion) return;
      const count = 14;
      for (let i = 0; i < count; i++) {
        if (exhaustPool.length >= 64) exhaustPool.shift();
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
        const speedMag = 28 + Math.random() * 52;
        const tone: ParticleTone =
          i % 3 === 0 ? 'amber' : i % 2 === 0 ? 'cyan' : 'white';
        exhaustPool.push({
          x,
          y,
          vx: Math.cos(angle) * speedMag,
          vy: Math.sin(angle) * speedMag,
          size: 1.4 + Math.random() * 1.3,
          life: 0,
          maxLife: 0.26 + Math.random() * 0.2,
          tone,
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const now = performance.now();
      controller.notifyClick(now);
      boostUntilRef.current = now + 260;

      if (!isFinePointer || e.pointerType === 'touch') {
        // Mobile / touch devices: NO persistent custom mouse cursor — subtle radial stardust tap feedback only
        spawnTouchFeedbackBurst(e.clientX, e.clientY);
        return;
      }

      if (!prefersReducedMotion && targetAlphaMultRef.current > 0.1) {
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
      latestSpeed = speed;

      if (isFinePointer) {
        applyInteractionTargets(now);
      }

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
        badgeWrapRef.current.style.opacity =
          isFinePointer && isVisibleRef.current && targetAlphaMultRef.current > 0.1
            ? '1'
            : '0';
      }

      const isBoosting = now < boostUntilRef.current;
      const desiredScale = isBoosting ? targetScaleRef.current * 1.12 : targetScaleRef.current;
      const desiredThrust = isBoosting
        ? 1.95
        : Math.min(2.15, (0.88 + speed * 0.045) * targetThrustRef.current);

      const damp = 1 - Math.exp(-14 * dt);
      currentScaleRef.current += (desiredScale - currentScaleRef.current) * damp;
      currentThrustRef.current += (desiredThrust - currentThrustRef.current) * damp;
      currentAlphaMultRef.current +=
        ((isFinePointer ? targetAlphaMultRef.current : 0) - currentAlphaMultRef.current) * damp;

      const angleRad = (rocketAngleRef.current * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const sc = currentScaleRef.current;
      const thrust = currentThrustRef.current;

      // Emit subtle clean exhaust micro-sparks ONLY on active flight/boost (keeps miniature rocket razor-sharp)
      if (
        isFinePointer &&
        !prefersReducedMotion &&
        isVisibleRef.current &&
        currentAlphaMultRef.current > 0.25 &&
        (speed > 2.2 || isBoosting)
      ) {
        const emitRate = isBoosting ? 42 : Math.min(48, speed * 1.4);
        emitAccumulator += dt * emitRate;
        while (emitAccumulator >= 1) {
          emitAccumulator -= 1;
          spawnExhaustParticle(
            rocketPos.current.x,
            rocketPos.current.y,
            angleRad,
            sc,
            isBoosting ? 1.55 : 0.75 + Math.min(speed * 0.035, 1.0)
          );
        }
      }

      // Render crisp realistic miniature rocket + subtle exhaust sparks
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const shouldDrawRocket =
        isFinePointer && isVisibleRef.current && currentAlphaMultRef.current > 0.02;

      if (shouldDrawRocket || exhaustPool.length > 0) {
        const rx = rocketPos.current.x;
        const ry = rocketPos.current.y;

        // 1. Update & draw subtle trailing micro-sparks behind nozzle
        if (exhaustPool.length > 0) {
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
            ep.vx *= 0.94;
            ep.vy *= 0.94;

            const progress = ep.life / ep.maxLife;
            const alpha = (1 - progress) * (1 - progress) * 0.55;
            const drawRadius = ep.size * (1.1 - progress * 0.45) * 1.8;
            ctx.globalAlpha = alpha;
            ctx.drawImage(
              sprites[ep.tone],
              ep.x - drawRadius,
              ep.y - drawRadius,
              drawRadius * 2,
              drawRadius * 2
            );
          }
          ctx.globalCompositeOperation = 'source-over';
        }

        // 2. Render sculpted crisp miniature aerospace rocket rotated cleanly around nose tip (rx, ry)
        if (shouldDrawRocket) {
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(angleRad);

          // Crisp subtle dark rim drop-shadow so white titanium hull separates cleanly over bright cards
          ctx.shadowColor =
            hoverGlowRef.current > 0.25
              ? 'rgba(56, 189, 248, 0.45)'
              : 'rgba(2, 6, 23, 0.65)';
          ctx.shadowBlur = hoverGlowRef.current > 0.25 ? 8 : 5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1.5;

          const rocketCursorScale = sc * 0.96;
          drawRealRocket(
            ctx,
            rocketCursorScale,
            Math.min(1.35, thrust * 0.62),
            currentAlphaMultRef.current,
            timeSec
          );
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      unsubscribe();
      finePointerQuery.removeEventListener('change', handlePointerMediaChange);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointermove', handleRawPointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
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
