import React, { useEffect, useRef, useState } from 'react';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import '../cursor/cursor.css';

/**
 * DIGITAL SINGULARITY CUSTOM CURSOR
 *
 * Integrated Layers:
 * 1. Core: High-contrast 6px center dot locked directly to pointer
 * 2. Inner Ring: Thin 26px radiant cyan ring with fast follow
 * 3. Outer Ring: 44px trailing boundary with context-aware morphing
 * 4. Gyro Orbit Rings: 2 irregular orbital rings rotating continuously around cursor
 * 5. Orbiting Energy Particles: 4 micro-sparkles dynamically circling the cursor
 * 6. Multi-Layer Energy Trail: Velocity-driven trailing nodes creating light streaks
 * 7. Concentric Shockwave Pulse on Click
 * 8. Dynamic Morphing Cursor Label:
 *    - DEFAULT: ◉
 *    - BUTTON: VIEW ↗
 *    - PROJECT: OPEN
 *    - IMAGE: EXPLORE
 *    - LINK: VISIT ↗
 *    - DRAG: ← DRAG →
 *    - READ: READ ↗
 *
 * Guaranteed 100% visibility:
 * - Fixed z-index: 2147483647
 * - Pointer-events: none
 * - Fallback to native cursor if unsupported
 */

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

interface ShockwaveItem {
  id: number;
  x: number;
  y: number;
}

export interface CustomCursorProps {
  magneticStrength?: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength = 0.24 }) => {
  const coreRef = useRef<HTMLDivElement | null>(null);
  const innerRingRef = useRef<HTMLDivElement | null>(null);
  const outerRingRef = useRef<HTMLDivElement | null>(null);
  const orbit1Ref = useRef<HTMLDivElement | null>(null);
  const orbit2Ref = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const sparklesRef = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailPoints = useRef<TrailPoint[]>(
    Array.from({ length: 7 }, () => ({ x: -100, y: -100, alpha: 0, size: 6 }))
  );

  const targetPos = useRef({ x: -100, y: -100 });
  const innerRingPos = useRef({ x: -100, y: -100 });
  const outerRingPos = useRef({ x: -100, y: -100 });
  const orbitAngle = useRef(0);

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
    innerRingPos.current = { x: initX, y: initY };
    outerRingPos.current = { x: initX, y: initY };

    for (let i = 0; i < trailPoints.current.length; i++) {
      trailPoints.current[i].x = initX;
      trailPoints.current[i].y = initY;
    }

    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPos.current.x = state.clientX;
      targetPos.current.y = state.clientY;

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

        // Look for custom data-cursor-label attribute on hover target
        const targetEl = document.elementFromPoint(state.clientX, state.clientY) as HTMLElement | null;
        const customCursor = targetEl?.closest('[data-cursor]')?.getAttribute('data-cursor');
        const customLabel = targetEl?.closest('[data-cursor-label]')?.getAttribute('data-cursor-label');

        if (customCursor === 'project' || state.hoverType === 'project') {
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
      setShockwaves((prev) => [...prev.slice(-3), newShockwave]);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    let rafId: number;

    const tick = () => {
      interactionEngine.step();

      const tx = targetPos.current.x;
      const ty = targetPos.current.y;
      const energy = interactionEngine.state.normalizedEnergy;

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      innerRingPos.current.x += (tx - innerRingPos.current.x) * 0.45;
      innerRingPos.current.y += (ty - innerRingPos.current.y) * 0.45;
      if (innerRingRef.current) {
        innerRingRef.current.style.transform = `translate3d(${innerRingPos.current.x}px, ${innerRingPos.current.y}px, 0)`;
      }

      outerRingPos.current.x += (tx - outerRingPos.current.x) * 0.22;
      outerRingPos.current.y += (ty - outerRingPos.current.y) * 0.22;
      if (outerRingRef.current) {
        outerRingRef.current.style.transform = `translate3d(${outerRingPos.current.x}px, ${outerRingPos.current.y}px, 0)`;
      }

      orbitAngle.current += 0.025 + energy * 0.05;
      const angle1 = orbitAngle.current;
      const angle2 = -orbitAngle.current * 0.7;

      if (orbit1Ref.current) {
        orbit1Ref.current.style.transform = `translate3d(${outerRingPos.current.x}px, ${outerRingPos.current.y}px, 0) rotate(${angle1}rad) scale(${1 + energy * 0.15})`;
      }
      if (orbit2Ref.current) {
        orbit2Ref.current.style.transform = `translate3d(${outerRingPos.current.x}px, ${outerRingPos.current.y}px, 0) rotate(${angle2}rad) scale(${1 + energy * 0.2})`;
      }

      const sparkleRadius = 22 + energy * 8;
      for (let i = 0; i < 4; i++) {
        const sparkleEl = sparklesRef.current[i];
        if (sparkleEl) {
          const spAngle = angle1 * 1.5 + (i * Math.PI) / 2;
          const sx = tx + Math.cos(spAngle) * sparkleRadius;
          const sy = ty + Math.sin(spAngle) * (sparkleRadius * 0.65);
          sparkleEl.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
          sparkleEl.style.opacity = `${0.4 + Math.sin(spAngle) * 0.35 + energy * 0.3}`;
        }
      }

      trailPoints.current[0].x = tx;
      trailPoints.current[0].y = ty;

      const points = trailPoints.current;
      for (let i = 1; i < points.length; i++) {
        points[i].x += (points[i - 1].x - points[i].x) * (0.45 - i * 0.04);
        points[i].y += (points[i - 1].y - points[i].y) * (0.45 - i * 0.04);

        const trailEl = trailRefs.current[i];
        if (trailEl) {
          const trailAlpha = Math.max(0, (1 - i / points.length) * (energy * 0.75));
          const trailSize = Math.max(2, 6 - i * 0.6 + energy * 3);
          trailEl.style.transform = `translate3d(${points[i].x}px, ${points[i].y}px, 0)`;
          trailEl.style.width = `${trailSize}px`;
          trailEl.style.height = `${trailSize}px`;
          trailEl.style.marginTop = `-${trailSize / 2}px`;
          trailEl.style.marginLeft = `-${trailSize / 2}px`;
          trailEl.style.opacity = `${trailAlpha}`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      unsubscribe();
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
      {/* Velocity Energy Trail (7 nodes) */}
      {trailPoints.current.map((_, i) => (
        <div
          key={`trail-${i}`}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="cursor-trail-node"
        />
      ))}

      {/* Planetary Gyroscope Orbit Ring 2 */}
      <div ref={orbit2Ref} className="cursor-orbit-ring-2" />

      {/* Planetary Gyroscope Orbit Ring 1 */}
      <div ref={orbit1Ref} className="cursor-orbit-ring-1" />

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

      {/* Inner Glowing Ring */}
      <div ref={innerRingRef} className="cursor-inner-ring" />

      {/* Orbiting Energy Micro-Sparkles (4 units) */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`sparkle-${i}`}
          ref={(el) => {
            sparklesRef.current[i] = el;
          }}
          className="cursor-sparkle"
        />
      ))}

      {/* High-Contrast Concentric Inner Core */}
      <div ref={coreRef} className="cursor-inner-core" />

      {/* Concentric Shockwaves on Click */}
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
