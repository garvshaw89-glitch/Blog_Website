import React, { useEffect, useRef, useState } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import '../cursor/cursor.css';

/**
 * HIGH-END DUAL-ENTITY CUSTOM CURSOR
 * 
 * Architecture:
 * 1. Inner Point: 6px high-contrast glowing dot locked to real pointer with 0.85 micro-lerp
 * 2. Outer Ring: 36px physical spring/lerp ring (0.22 factor) with context-aware morphing:
 *    - DEFAULT: 36px subtle radiant boundary
 *    - HOVER / BUTTON: expands to 48px with subtle cyan pulse
 *    - LINK: expands to 52px with VISIT label
 *    - VIEW / PROJECT: expands to 58px with OPEN / EXPLORE label
 *    - DRAG: elongated pill with ← DRAG →
 * 3. Concentric Shockwave Pulse on Click
 * 
 * Safety & Quality:
 * - pointer-events: none (never blocks UI)
 * - z-index: 2147483647 (always on top of WebGL, modals, and nav)
 * - Auto-hidden on touch / coarse pointer devices
 * - Graceful fade on window leave / enter
 */

interface ShockwaveItem {
  id: number;
  x: number;
  y: number;
}

export interface CustomCursorProps {
  magneticStrength?: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength = 0.22 }) => {
  const coreRef = useRef<HTMLDivElement | null>(null);
  const outerRingRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const corePos = useRef({ x: -100, y: -100 });
  const outerRingPos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef<boolean>(false);

  const [shockwaves, setShockwaves] = useState<ShockwaveItem[]>([]);
  const shockwaveIdRef = useRef(0);

  const activeMagneticRef = useRef<HTMLElement | null>(null);
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
    corePos.current = { x: initX, y: initY };
    outerRingPos.current = { x: initX, y: initY };

    const handlePointerEnter = () => {
      isVisibleRef.current = true;
      if (coreRef.current) coreRef.current.style.opacity = '1';
      if (outerRingRef.current) outerRingRef.current.style.opacity = '1';
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      if (coreRef.current) coreRef.current.style.opacity = '0';
      if (outerRingRef.current) outerRingRef.current.style.opacity = '0';
    };

    window.addEventListener('mouseenter', handlePointerEnter);
    window.addEventListener('mouseleave', handlePointerLeave);

    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPos.current.x = state.clientX;
      targetPos.current.y = state.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        if (coreRef.current) coreRef.current.style.opacity = '1';
        if (outerRingRef.current) outerRingRef.current.style.opacity = '1';
      }

      // Handle magnetic physics
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

      // Contextual morphing inspection
      const outerEl = outerRingRef.current;
      const coreEl = coreRef.current;
      const labelEl = labelRef.current;

      if (outerEl && coreEl && labelEl) {
        outerEl.classList.remove('is-button', 'is-link', 'is-project', 'is-text');
        coreEl.classList.remove('is-button', 'is-text');

        const targetEl = document.elementFromPoint(state.clientX, state.clientY) as HTMLElement | null;
        const customCursor = targetEl?.closest('[data-cursor]')?.getAttribute('data-cursor');
        const customLabel = targetEl?.closest('[data-cursor-label]')?.getAttribute('data-cursor-label');

        if (customCursor === 'project' || customCursor === 'view' || state.hoverType === 'project') {
          outerEl.classList.add('is-project');
          labelEl.textContent = customLabel || 'OPEN';
          labelEl.style.display = 'block';
        } else if (customCursor === 'image') {
          outerEl.classList.add('is-project');
          labelEl.textContent = customLabel || 'EXPLORE';
          labelEl.style.display = 'block';
        } else if (customCursor === 'drag') {
          outerEl.classList.add('is-button');
          labelEl.textContent = '← DRAG →';
          labelEl.style.display = 'block';
        } else if (customCursor === 'button' || state.hoverType === 'button') {
          outerEl.classList.add('is-button');
          coreEl.classList.add('is-button');
          if (customLabel) {
            labelEl.textContent = customLabel;
            labelEl.style.display = 'block';
          } else {
            labelEl.textContent = 'VIEW ↗';
            labelEl.style.display = 'block';
          }
        } else if (customCursor === 'link' || state.hoverType === 'link') {
          outerEl.classList.add('is-link');
          if (customLabel) {
            labelEl.textContent = customLabel;
            labelEl.style.display = 'block';
          } else {
            labelEl.textContent = 'VISIT ↗';
            labelEl.style.display = 'block';
          }
        } else if (state.hoverType === 'text') {
          outerEl.classList.add('is-text');
          coreEl.classList.add('is-text');
          labelEl.style.display = 'none';
        } else {
          labelEl.style.display = 'none';
        }
      }
    });

    const handlePointerDown = (e: PointerEvent) => {
      shockwaveIdRef.current += 1;
      const newShockwave: ShockwaveItem = {
        id: shockwaveIdRef.current,
        x: e.clientX,
        y: e.clientY,
      };
      setShockwaves((prev) => [...prev.slice(-2), newShockwave]);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    let rafId: number;

    const tick = () => {
      interactionEngine.step();

      const tx = targetPos.current.x;
      const ty = targetPos.current.y;

      // 1. Inner Core: 0.85 micro-lerp for razor-sharp physical precision
      corePos.current.x += (tx - corePos.current.x) * 0.85;
      corePos.current.y += (ty - corePos.current.y) * 0.85;

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0)`;
      }

      // 2. Outer Ring: 0.22 spring-damped lerp for silky luxurious weight
      outerRingPos.current.x += (tx - outerRingPos.current.x) * 0.22;
      outerRingPos.current.y += (ty - outerRingPos.current.y) * 0.22;

      if (outerRingRef.current) {
        outerRingRef.current.style.transform = `translate3d(${outerRingPos.current.x}px, ${outerRingPos.current.y}px, 0)`;
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
      {/* Outer Trailing Ring */}
      <div ref={outerRingRef} className="cursor-outer-ring">
        <span
          ref={labelRef}
          className="cursor-view-label"
          style={{ display: 'none' }}
        >
          VIEW ↗
        </span>
      </div>

      {/* High-Contrast Concentric Inner Point */}
      <div ref={coreRef} className="cursor-inner-core" />

      {/* Concentric Click Shockwaves */}
      {shockwaves.map((sw) => (
        <div
          key={sw.id}
          className="cursor-shockwave"
          style={{
            left: `${sw.x}px`,
            top: `${sw.y}px`,
          }}
          onAnimationEnd={() =>
            setShockwaves((prev) => prev.filter((item) => item.id !== sw.id))
          }
        />
      ))}
    </div>
  );
};
