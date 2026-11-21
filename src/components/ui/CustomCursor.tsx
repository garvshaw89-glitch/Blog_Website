import React, { useEffect, useRef } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import { drawRealAsteroid, drawCosmicReticle } from '../intro/drawRealAsteroid';
import { CursorInteractionController } from '../cursor/CursorInteractionManager';
import '../cursor/cursor.css';

export interface CustomCursorProps {
  magneticStrength?: number;
  enabled?: boolean;
  morphToAsteroid?: boolean;
}

interface ClickImpactPulse {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  isTouch: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  magneticStrength = 0.22,
  enabled = true,
  morphToAsteroid = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const badgeWrapRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const cursorPos = useRef({ x: -100, y: -100 });
  const badgePos = useRef({ x: -100, y: -100 });
  const tiltAngleRef = useRef<number>(0);
  const targetTiltRef = useRef<number>(0);
  const prevTargetPos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef<boolean>(false);

  const targetScaleRef = useRef<number>(1);
  const currentScaleRef = useRef<number>(1);
  const targetEnergyRef = useRef<number>(1);
  const currentEnergyRef = useRef<number>(1);
  const targetAlphaMultRef = useRef<number>(1);
  const currentAlphaMultRef = useRef<number>(1);
  const hoverGlowRef = useRef<number>(0);
  const boostUntilRef = useRef<number>(0);
  const isTextInputRef = useRef<boolean>(false);
  const morphRef = useRef<boolean>(morphToAsteroid);
  const needsResetPosRef = useRef<boolean>(false);

  const activeMagneticRef = useRef<HTMLElement | null>(null);
  const currentCursorKeyRef = useRef<string>('default:');
  const lastHoverTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    morphRef.current = morphToAsteroid;
  }, [morphToAsteroid]);

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
    const anyFineQuery = window.matchMedia('(any-pointer: fine)');
    let isFinePointer = finePointerQuery.matches || anyFineQuery.matches;
    let isTouchSuppressingVisual = !isFinePointer;
    let lastNativeHidden: boolean | null = null;

    const syncCursorClass = (shouldHideNative: boolean) => {
      const nextHidden = Boolean(shouldHideNative && isFinePointer);
      if (lastNativeHidden === nextHidden) return;
      lastNativeHidden = nextHidden;
      if (nextHidden) {
        document.documentElement.classList.add('custom-cursor-enabled');
      } else {
        document.documentElement.classList.remove('custom-cursor-enabled');
      }
    };
    syncCursorClass(isFinePointer);

    const handlePointerMediaChange = () => {
      isFinePointer = finePointerQuery.matches || anyFineQuery.matches;
      isTouchSuppressingVisual = !isFinePointer;
      syncCursorClass(isFinePointer);
      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.opacity = isFinePointer ? '1' : '0';
      }
    };
    finePointerQuery.addEventListener('change', handlePointerMediaChange);
    anyFineQuery.addEventListener('change', handlePointerMediaChange);

    if (!canvas) {
      return () => {
        finePointerQuery.removeEventListener('change', handlePointerMediaChange);
        anyFineQuery.removeEventListener('change', handlePointerMediaChange);
        document.documentElement.classList.remove('custom-cursor-enabled');
      };
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return () => {
        finePointerQuery.removeEventListener('change', handlePointerMediaChange);
        anyFineQuery.removeEventListener('change', handlePointerMediaChange);
        document.documentElement.classList.remove('custom-cursor-enabled');
      };
    }

    const controller = new CursorInteractionController();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clickPulses: ClickImpactPulse[] = [];
    let isPointerPressed = false;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    let needsFullClear = true;
    let prevDrawRect: { x: number; y: number; w: number; h: number } | null = null;

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      needsFullClear = true;
      prevDrawRect = null;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', resizeCanvas, { passive: true });

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
    cursorPos.current = { x: initX, y: initY };
    badgePos.current = { x: initX, y: initY };
    tiltAngleRef.current = 0;
    targetTiltRef.current = 0;
    currentScaleRef.current = 1;
    targetScaleRef.current = 1;
    currentAlphaMultRef.current = isFinePointer ? 1 : 0;
    targetAlphaMultRef.current = isFinePointer ? 1 : 0;
    isVisibleRef.current = isFinePointer;
    canvas.style.opacity = '1';
    if (badgeWrapRef.current) {
      badgeWrapRef.current.style.opacity = isFinePointer ? '1' : '0';
    }

    const handlePointerEnter = () => {
      if (!isFinePointer || isTouchSuppressingVisual) return;
      isVisibleRef.current = true;
      canvas.style.opacity = '1';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '0';
      needsFullClear = true;
    };

    const handleWindowBlur = () => {
      isPointerPressed = false;
      isVisibleRef.current = false;
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '0';
      needsFullClear = true;
    };

    const handleRawPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        isFinePointer = true;
        isTouchSuppressingVisual = false;
        syncCursorClass(true);
        if (!isVisibleRef.current) {
          isVisibleRef.current = true;
          canvas.style.opacity = '1';
        }
      } else if (e.pointerType === 'touch') {
        // Temporarily suppress custom asteroid draw on touch tap, without unlocking OS cursor on hybrid laptops
        isTouchSuppressingVisual = true;
      }
      lastHoverTargetRef.current = e.target;
    };

    window.addEventListener('mouseenter', handlePointerEnter);
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pointermove', handleRawPointerMove, { passive: true });

    let latestSpeed = 0;

    const applyInteractionTargets = (now: number) => {
      if (!isFinePointer || isTouchSuppressingVisual) {
        if (!isFinePointer) syncCursorClass(false);
        targetAlphaMultRef.current = 0;
        isTextInputRef.current = false;
        if (labelRef.current) labelRef.current.style.display = 'none';
        return;
      }

      // Guarantee OS cursor NEVER shows while fine pointer is active
      syncCursorClass(true);

      const state = interactionEngine.state;
      const targets = controller.evaluate(
        state,
        latestSpeed,
        now,
        lastHoverTargetRef.current
      );

      targetScaleRef.current = targets.targetScale;
      targetEnergyRef.current = targets.targetThrust;
      targetAlphaMultRef.current = targets.targetAlphaMult;
      hoverGlowRef.current = targets.hoverGlow;
      isTextInputRef.current = targets.cursorType === 'text';

      const labelEl = labelRef.current;
      if (labelEl) {
        const showLabel = morphRef.current && Boolean(targets.labelText);
        const stateKey = `${targets.cursorType}:${showLabel ? targets.labelText : ''}`;
        if (stateKey !== currentCursorKeyRef.current) {
          currentCursorKeyRef.current = stateKey;
          if (showLabel) {
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

      if (isFinePointer && !isTouchSuppressingVisual && !isVisibleRef.current) {
        isVisibleRef.current = true;
        canvas.style.opacity = '1';
        if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
      }

      if (isFinePointer && !isTouchSuppressingVisual && morphRef.current && state.magneticTarget && !state.prefersReduced) {
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

    const handlePointerDown = (e: PointerEvent) => {
      const now = performance.now();
      lastHoverTargetRef.current = e.target;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        isFinePointer = true;
        isTouchSuppressingVisual = false;
        syncCursorClass(true);
      } else if (e.pointerType === 'touch') {
        isTouchSuppressingVisual = true;
      }
      controller.notifyClick(now);
      isPointerPressed = true;
      boostUntilRef.current = now + 260;
      applyInteractionTargets(now);

      if (clickPulses.length >= 6) clickPulses.shift();
      clickPulses.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
        maxAge: prefersReducedMotion ? 0.22 : 0.42,
        isTouch: e.pointerType === 'touch' || !isFinePointer,
      });
    };

    const handlePointerUp = () => {
      isPointerPressed = false;
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    let rafId = 0;
    let prevTime = performance.now();
    let isTabHidden = typeof document !== 'undefined' ? document.hidden : false;

    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      if (!isTabHidden) {
        prevTime = performance.now();
        needsFullClear = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const tick = (now: number) => {
      if (isTabHidden) {
        prevTime = now;
        rafId = requestAnimationFrame(tick);
        return;
      }

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

      if (isFinePointer && !isTouchSuppressingVisual) {
        applyInteractionTargets(now);
      }

      // Subtle dynamic rock banking tilt on fast horizontal motion while tip stays locked at (0,0)
      targetTiltRef.current = morphRef.current ? Math.max(-14, Math.min(14, dx * 0.55)) : 0;
      prevTargetPos.current.x = tx;
      prevTargetPos.current.y = ty;

      tiltAngleRef.current += (targetTiltRef.current - tiltAngleRef.current) * 0.2;

      // Razor-sharp micro-lerp so rocky tip aligns cleanly to pointer input
      cursorPos.current.x += (tx - cursorPos.current.x) * 0.92;
      cursorPos.current.y += (ty - cursorPos.current.y) * 0.92;

      // Trailing HUD badge
      badgePos.current.x += (tx - badgePos.current.x) * 0.26;
      badgePos.current.y += (ty - badgePos.current.y) * 0.26;
      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.transform = `translate3d(${badgePos.current.x}px, ${badgePos.current.y}px, 0)`;
        badgeWrapRef.current.style.opacity =
          morphRef.current &&
          isFinePointer &&
          !isTouchSuppressingVisual &&
          isVisibleRef.current &&
          targetAlphaMultRef.current > 0.1
            ? '1'
            : '0';
      }

      const isBoosting = now < boostUntilRef.current;
      const desiredScale = isPointerPressed
        ? targetScaleRef.current * 0.84
        : isBoosting
          ? targetScaleRef.current * 1.16
          : targetScaleRef.current;
      const desiredEnergy = isPointerPressed || isBoosting
        ? 1.95
        : Math.min(1.65, (0.28 + speed * 0.04) * targetEnergyRef.current);

      const damp = 1 - Math.exp(-16 * dt);
      currentScaleRef.current += (desiredScale - currentScaleRef.current) * damp;
      currentEnergyRef.current += (desiredEnergy - currentEnergyRef.current) * damp;
      currentAlphaMultRef.current +=
        ((isFinePointer && !isTouchSuppressingVisual ? targetAlphaMultRef.current : 0) -
          currentAlphaMultRef.current) *
        damp;

      const sc = currentScaleRef.current;
      const asteroidScale = sc * 1.24;

      const shouldDrawCursor =
        isFinePointer &&
        !isTouchSuppressingVisual &&
        isVisibleRef.current &&
        currentAlphaMultRef.current > 0.02;

      const hasPulses = clickPulses.length > 0;
      const isTextCaret = isTextInputRef.current;
      const isSettled =
        !hasPulses &&
        !isPointerPressed &&
        !isBoosting &&
        !isTextCaret &&
        morphRef.current === needsResetPosRef.current &&
        Math.abs(tx - cursorPos.current.x) < 0.15 &&
        Math.abs(ty - cursorPos.current.y) < 0.15 &&
        Math.abs(targetTiltRef.current - tiltAngleRef.current) < 0.08 &&
        Math.abs(desiredScale - currentScaleRef.current) < 0.004 &&
        Math.abs(
          (isFinePointer && !isTouchSuppressingVisual ? targetAlphaMultRef.current : 0) -
            currentAlphaMultRef.current
        ) < 0.004;

      if (morphRef.current !== needsResetPosRef.current) {
        needsResetPosRef.current = morphRef.current;
        needsFullClear = true;
      }

      // Skip redundant 2D canvas repaints when pointer is completely stationary
      if (!isSettled || needsFullClear || !prevDrawRect) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (needsFullClear || hasPulses || !prevDrawRect) {
          ctx.clearRect(0, 0, viewW, viewH);
          needsFullClear = false;
        } else {
          ctx.clearRect(prevDrawRect.x, prevDrawRect.y, prevDrawRect.w, prevDrawRect.h);
        }

        let minX = viewW;
        let minY = viewH;
        let maxX = 0;
        let maxY = 0;
        let drewAnything = false;

        // 1. Render crisp Asteroid Impact Click Shockwave Rings right at click point
        if (hasPulses) {
          for (let i = clickPulses.length - 1; i >= 0; i--) {
            const pulse = clickPulses[i];
            pulse.age += dt;
            if (pulse.age >= pulse.maxAge) {
              clickPulses.splice(i, 1);
              continue;
            }

            const p = pulse.age / pulse.maxAge;
            const ease = 1 - Math.pow(1 - p, 3);
            const fade = Math.pow(1 - p, 1.5);
            const maxR = prefersReducedMotion ? 22 : pulse.isTouch ? 34 : 38;

            ctx.save();
            ctx.translate(pulse.x, pulse.y);

            const outerR = 3 + ease * maxR;
            ctx.strokeStyle = `rgba(125, 211, 252, ${(0.88 * fade).toFixed(3)})`;
            ctx.lineWidth = Math.max(0.75, 2.1 * (1 - p));
            ctx.beginPath();
            ctx.arc(0, 0, outerR, 0, Math.PI * 2);
            ctx.stroke();

            const innerR = 2 + ease * (maxR * 0.56);
            ctx.strokeStyle = `rgba(251, 146, 60, ${(0.78 * fade).toFixed(3)})`;
            ctx.lineWidth = Math.max(0.65, 1.6 * (1 - p));
            ctx.beginPath();
            ctx.arc(0, 0, innerR, 0, Math.PI * 2);
            ctx.stroke();

            if (p < 0.38 && !prefersReducedMotion) {
              const glintFade = 1 - p / 0.38;
              const glintLen = 6 + (1 - glintFade) * 6;
              ctx.strokeStyle = `rgba(255, 251, 235, ${(0.95 * glintFade).toFixed(3)})`;
              ctx.lineWidth = 1.4 * glintFade;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(-glintLen, 0);
              ctx.lineTo(glintLen, 0);
              ctx.moveTo(0, -glintLen);
              ctx.lineTo(0, glintLen);
              ctx.stroke();
            }

            ctx.restore();
            minX = Math.min(minX, pulse.x - outerR - 8);
            minY = Math.min(minY, pulse.y - outerR - 8);
            maxX = Math.max(maxX, pulse.x + outerR + 8);
            maxY = Math.max(maxY, pulse.y + outerR + 8);
            drewAnything = true;
          }
          if (clickPulses.length === 0) {
            needsFullClear = true;
          }
        }

        if (shouldDrawCursor) {
          const rx = cursorPos.current.x;
          const ry = cursorPos.current.y;

          ctx.save();
          ctx.translate(rx, ry);
          if (morphRef.current) {
            ctx.rotate((tiltAngleRef.current * Math.PI) / 180);
            drawRealAsteroid(
              ctx,
              asteroidScale,
              currentEnergyRef.current,
              currentAlphaMultRef.current,
              timeSec,
              hoverGlowRef.current,
              isTextInputRef.current
            );
          } else {
            drawCosmicReticle(
              ctx,
              currentAlphaMultRef.current,
              timeSec,
              hoverGlowRef.current
            );
          }
          ctx.restore();

          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';

          const pad = Math.ceil(56 * Math.max(1, asteroidScale));
          minX = Math.min(minX, rx - pad);
          minY = Math.min(minY, ry - pad);
          maxX = Math.max(maxX, rx + pad);
          maxY = Math.max(maxY, ry + pad);
          drewAnything = true;
        }

        if (drewAnything) {
          const cx = Math.max(0, Math.floor(minX));
          const cy = Math.max(0, Math.floor(minY));
          prevDrawRect = {
            x: cx,
            y: cy,
            w: Math.min(viewW - cx, Math.ceil(maxX - cx)),
            h: Math.min(viewH - cy, Math.ceil(maxY - cy)),
          };
        } else {
          prevDrawRect = null;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      unsubscribe();
      finePointerQuery.removeEventListener('change', handlePointerMediaChange);
      anyFineQuery.removeEventListener('change', handlePointerMediaChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pointermove', handleRawPointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
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
      {/* Full-viewport Asteroid Cursor Canvas */}
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
