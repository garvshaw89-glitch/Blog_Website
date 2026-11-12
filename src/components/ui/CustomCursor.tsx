import React, { useEffect, useRef, useState } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import '../cursor/cursor.css';

interface IgnitionBurstItem {
  id: number;
  x: number;
  y: number;
}

export interface CustomCursorProps {
  magneticStrength?: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength = 0.22 }) => {
  const rocketRef = useRef<HTMLDivElement | null>(null);
  const flameWrapRef = useRef<SVGGElement | null>(null);
  const badgeWrapRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const rocketPos = useRef({ x: -100, y: -100 });
  const badgePos = useRef({ x: -100, y: -100 });
  const rocketAngleRef = useRef<number>(-32);
  const targetAngleRef = useRef<number>(-32);
  const prevTargetPos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef<boolean>(false);
  const boostTimeoutRef = useRef<number | null>(null);
  const hoverThrustMultiplierRef = useRef<number>(1);

  const [bursts, setBursts] = useState<IgnitionBurstItem[]>([]);
  const burstIdRef = useRef(0);

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

    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;
    targetPos.current = { x: initX, y: initY };
    prevTargetPos.current = { x: initX, y: initY };
    rocketPos.current = { x: initX, y: initY };
    badgePos.current = { x: initX, y: initY };

    const handlePointerEnter = () => {
      isVisibleRef.current = true;
      if (rocketRef.current) rocketRef.current.style.opacity = '1';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '1';
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      if (rocketRef.current) rocketRef.current.style.opacity = '0';
      if (badgeWrapRef.current) badgeWrapRef.current.style.opacity = '0';
    };

    window.addEventListener('mouseenter', handlePointerEnter);
    window.addEventListener('mouseleave', handlePointerLeave);

    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPos.current.x = state.clientX;
      targetPos.current.y = state.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        if (rocketRef.current) rocketRef.current.style.opacity = '1';
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

      // Contextual morphing handled directly by the rocket + upright HUD badge
      const rocketEl = rocketRef.current;
      const labelEl = labelRef.current;

      if (rocketEl && labelEl) {
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

          rocketEl.classList.remove('is-button', 'is-link', 'is-project', 'is-text');

          if (newCursorType === 'project') {
            rocketEl.classList.add('is-project');
            hoverThrustMultiplierRef.current = 1.3;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'drag' || newCursorType === 'button') {
            rocketEl.classList.add('is-button');
            hoverThrustMultiplierRef.current = 1.2;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'link') {
            rocketEl.classList.add('is-link');
            hoverThrustMultiplierRef.current = 1.18;
            labelEl.textContent = newLabelText;
            labelEl.style.display = 'block';
          } else if (newCursorType === 'text') {
            rocketEl.classList.add('is-text');
            hoverThrustMultiplierRef.current = 0.72;
            labelEl.style.display = 'none';
          } else {
            hoverThrustMultiplierRef.current = 1;
            labelEl.style.display = 'none';
          }
        }
      }
    });

    const handlePointerDown = (e: PointerEvent) => {
      burstIdRef.current += 1;
      const newBurst: IgnitionBurstItem = {
        id: burstIdRef.current,
        x: e.clientX,
        y: e.clientY,
      };
      setBursts((prev) => [...prev.slice(-2), newBurst]);

      if (rocketRef.current) {
        rocketRef.current.classList.add('is-boosting');
        if (boostTimeoutRef.current !== null) {
          window.clearTimeout(boostTimeoutRef.current);
        }
        boostTimeoutRef.current = window.setTimeout(() => {
          rocketRef.current?.classList.remove('is-boosting');
        }, 240);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    let rafId: number;

    const tick = () => {
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

      // Crisp 0.90 micro-lerp so the rocket tip stays locked to pointer input
      rocketPos.current.x += (tx - rocketPos.current.x) * 0.9;
      rocketPos.current.y += (ty - rocketPos.current.y) * 0.9;

      if (rocketRef.current) {
        rocketRef.current.style.transform = `translate3d(${rocketPos.current.x}px, ${rocketPos.current.y}px, 0) rotate(${rocketAngleRef.current.toFixed(1)}deg)`;
      }

      if (flameWrapRef.current) {
        const thrustScale = Math.min(
          2.0,
          (0.85 + speed * 0.038) * hoverThrustMultiplierRef.current
        );
        flameWrapRef.current.style.transform = `scaleY(${thrustScale.toFixed(2)})`;
      }

      // Upright trailing HUD badge follows cleanly without rotating
      badgePos.current.x += (tx - badgePos.current.x) * 0.26;
      badgePos.current.y += (ty - badgePos.current.y) * 0.26;

      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.transform = `translate3d(${badgePos.current.x}px, ${badgePos.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      unsubscribe();
      window.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.documentElement.classList.remove('custom-cursor-enabled');
      cancelAnimationFrame(rafId);
      if (boostTimeoutRef.current !== null) {
        window.clearTimeout(boostTimeoutRef.current);
      }

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

      {/* Refined Aerospace Rocket Cursor (nose tip anchored at exact 17, 2) */}
      <div ref={rocketRef} className="cursor-rocket">
        <svg
          viewBox="0 0 34 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-rocket-svg"
        >
          <defs>
            <linearGradient id="rocket-hull-left" x1="17" y1="2" x2="11" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="rocket-hull-right" x1="17" y1="2" x2="23" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="60%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="rocket-wing-grad" x1="17" y1="18" x2="17" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="rocket-flame-outer" x1="17" y1="29" x2="17" y2="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="32%" stopColor="#38BDF8" />
              <stop offset="68%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
            </linearGradient>
            <linearGradient id="rocket-flame-core" x1="17" y1="29" x2="17" y2="39" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </linearGradient>
          </defs>

          {/* Dual-Layer Supersonic Thruster Plume */}
          <g ref={flameWrapRef} className="cursor-rocket-flame-wrap">
            <path
              className="cursor-rocket-flame"
              d="M13.2 29C13.2 29 14.4 40.5 17 44.5C19.6 40.5 20.8 29 20.8 29H13.2Z"
              fill="url(#rocket-flame-outer)"
            />
            <path
              className="cursor-rocket-flame"
              d="M15 29C15 29 15.8 36 17 38.8C18.2 36 19 29 19 29H15Z"
              fill="url(#rocket-flame-core)"
            />
          </g>

          {/* Swept Delta Stabilizer Wings */}
          <path
            d="M11.8 18.8L5.2 26.8L11.6 25.6L12.4 20.2Z"
            fill="url(#rocket-wing-grad)"
            stroke="#7DD3FC"
            strokeWidth="0.65"
            strokeLinejoin="round"
          />
          <path
            d="M22.2 18.8L28.8 26.8L22.4 25.6L21.6 20.2Z"
            fill="url(#rocket-wing-grad)"
            stroke="#7DD3FC"
            strokeWidth="0.65"
            strokeLinejoin="round"
          />

          {/* Fuselage Halves (3D lit bevel along central spine) */}
          <path
            d="M17 2C13.6 7.5 11.6 13.8 11.6 21.2L12.9 27.6H17V2Z"
            fill="url(#rocket-hull-left)"
          />
          <path
            d="M17 2C20.4 7.5 22.4 13.8 22.4 21.2L21.1 27.6H17V2Z"
            fill="url(#rocket-hull-right)"
          />

          {/* Fuselage Outer Contour */}
          <path
            d="M17 2C13.6 7.5 11.6 13.8 11.6 21.2L12.9 27.6H21.1L22.4 21.2C22.4 13.8 20.4 7.5 17 2Z"
            stroke="#38BDF8"
            strokeWidth="0.85"
            strokeLinejoin="round"
          />

          {/* Precision Cyan Nose Cone Tip */}
          <path
            d="M17 2C15.4 4.7 14.3 7.3 13.5 9.8H20.5C19.7 7.3 18.6 4.7 17 2Z"
            fill="#38BDF8"
          />
          <circle cx="17" cy="2.3" r="0.9" fill="#E0F2FE" />

          {/* Recessed Aerospace Teardrop Canopy */}
          <path
            d="M17 11.6C15.5 13.2 14.9 15.2 15.1 17.6C15.2 18.5 16 19.2 17 19.2C18 19.2 18.8 18.5 18.9 17.6C19.1 15.2 18.5 13.2 17 11.6Z"
            fill="#0B1120"
            stroke="#38BDF8"
            strokeWidth="0.85"
          />
          <path
            d="M16.2 13.3C15.8 14.1 15.7 15.1 15.8 16.2"
            stroke="#E0F2FE"
            strokeWidth="0.8"
            strokeLinecap="round"
          />

          {/* Central Dorsal Fin Spine */}
          <line
            x1="17"
            y1="20.4"
            x2="17"
            y2="27.2"
            stroke="#0EA5E9"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Thruster Bell Nozzle */}
          <path
            d="M13.6 27.5H20.4L21 29.4H13L13.6 27.5Z"
            fill="#1E293B"
            stroke="#475569"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Click Ignition Plasma Flash (no circle) */}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="cursor-rocket-ignition"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
          }}
          onAnimationEnd={() =>
            setBursts((prev) => prev.filter((item) => item.id !== b.id))
          }
        />
      ))}
    </div>
  );
};
