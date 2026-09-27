import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MotionValue, useMotionValue, useSpring } from 'motion/react';
import { useCursor, CursorType, CursorTheme } from '../../context/CursorContext';
import { useReducedMotion } from '../../hooks/cursor/useReducedMotion';
import { applyMagneticAttraction, resetMagneticElement } from '../../hooks/cursor/useCursor';
import { TrailPoint } from './CursorTrail';
import { MicroParticle } from './CursorMicroParticles';
import { RippleEvent } from './CursorRipple';

interface InteractionManagerRenderProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  velocityScaleX: MotionValue<number>;
  velocityScaleY: MotionValue<number>;
  velocityAngle: MotionValue<number>;
  trailPoints: TrailPoint[];
  microParticles: MicroParticle[];
  ripples: RippleEvent[];
  currentSpeed: number;
  scrollSpeed: number;
  entranceScale: number;
  entranceOpacity: number;
  onRippleComplete: (id: number) => void;
  prefersReducedMotion: boolean;
}

interface CursorInteractionManagerProps {
  magneticStrength?: number;
  children: (props: InteractionManagerRenderProps) => React.ReactNode;
}

export const CursorInteractionManager: React.FC<CursorInteractionManagerProps> = ({
  magneticStrength = 0.22,
  children,
}) => {
  const {
    cursorType,
    cursorLabel,
    cursorTheme,
    isPointerDown,
    isIdle,
    isVisible,
    setCursorType,
    setCursorLabel,
    setCursorTheme,
    setIsPointerDown,
    setIsIdle,
    setIsVisible,
    setIsTouchDevice,
    resetCursor,
  } = useCursor();

  const prefersReducedMotion = useReducedMotion();

  // Instant pointer position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Outer ring spring: agile, physical, controlled
  const ringSpringConfig = { damping: 28, stiffness: 360, mass: 0.45 };
  const smoothX = useSpring(mouseX, ringSpringConfig);
  const smoothY = useSpring(mouseY, ringSpringConfig);

  // Ambient glow spring: soft volumetric delayed follow
  const glowSpringConfig = { damping: 34, stiffness: 160, mass: 0.85 };
  const glowX = useSpring(mouseX, glowSpringConfig);
  const glowY = useSpring(mouseY, glowSpringConfig);

  // Velocity stretch values for the outer ring
  const velocityScaleX = useMotionValue(1);
  const velocityScaleY = useMotionValue(1);
  const velocityAngle = useMotionValue(0);

  // Entrance animation state (0.6 -> 1 over 650ms on mount)
  const [entranceScale, setEntranceScale] = useState(0.6);
  const [entranceOpacity, setEntranceOpacity] = useState(0);

  // Subtle Trail buffer (up to 8 points)
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);
  const lastTrailSampleRef = useRef(0);

  // Micro Particles pool for high-velocity bursts
  const [microParticles, setMicroParticles] = useState<MicroParticle[]>([]);
  const particleIdRef = useRef(0);

  // Click ripple queue
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const rippleIdRef = useRef(0);

  // Velocity state
  const prevPosRef = useRef({ x: -100, y: -100, time: 0 });
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Scroll reaction state
  const lastScrollYRef = useRef(0);
  const [scrollSpeed, setScrollSpeed] = useState(0);

  // Idle timer ref
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active magnetic element tracker
  const activeMagneticElRef = useRef<HTMLElement | null>(null);

  // Clean up ripples
  const handleRippleComplete = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 2500);
  }, [setIsIdle]);

  // Release currently displaced magnetic element
  const releaseMagneticElement = useCallback(() => {
    if (activeMagneticElRef.current) {
      resetMagneticElement(activeMagneticElRef.current);
      activeMagneticElRef.current = null;
    }
  }, []);

  // Page Load Entrance Effect
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setEntranceScale(1);
      setEntranceOpacity(1);
    }, 120);

    return () => clearTimeout(entranceTimer);
  }, []);

  // Main Pointer & Interaction Event Loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect touch-only / coarse pointer devices
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const clientX = e.clientX;
      const clientY = e.clientY;

      mouseX.set(clientX);
      mouseY.set(clientY);

      if (!isVisible) {
        setIsVisible(true);
      }

      resetIdleTimer();

      // Velocity calculation
      const prev = prevPosRef.current;
      const dt = Math.max(now - prev.time, 16);
      const dx = clientX - prev.x;
      const dy = clientY - prev.y;
      const dist = Math.hypot(dx, dy);
      const speed = (dist / dt) * 16;
      setCurrentSpeed(speed);

      // Velocity stretching
      if (dist > 1 && !prefersReducedMotion) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const stretch = Math.min(speed * 0.045, 0.32);
        velocityAngle.set(angle);
        velocityScaleX.set(1 + stretch);
        velocityScaleY.set(Math.max(0.82, 1 - stretch * 0.35));
      } else {
        velocityScaleX.set(1);
        velocityScaleY.set(1);
      }

      prevPosRef.current = { x: clientX, y: clientY, time: now };

      // 1. Trail sampling: sample up to 8 points on brisk movement
      if (speed > 2.0 && !prefersReducedMotion && now - lastTrailSampleRef.current > 28) {
        lastTrailSampleRef.current = now;
        trailIdRef.current += 1;
        setTrailPoints((prevPts) => [
          { x: clientX, y: clientY, id: trailIdRef.current },
          ...prevPts.slice(0, 7),
        ]);
      } else if (speed < 1.2 && trailPoints.length > 0) {
        setTrailPoints([]);
      }

      // 2. Micro-particles burst on quick flick (speed > 4.5)
      if (speed > 4.5 && !prefersReducedMotion && Math.random() > 0.45) {
        particleIdRef.current += 1;
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDist = 3 + Math.random() * 8;
        const newParticle: MicroParticle = {
          id: particleIdRef.current,
          x: clientX + Math.cos(randomAngle) * randomDist,
          y: clientY + Math.sin(randomAngle) * randomDist,
          vx: Math.cos(randomAngle) * (1.2 + Math.random()),
          vy: Math.sin(randomAngle) * (1.2 + Math.random()),
          size: 2 + Math.random() * 2,
          opacity: 0.75,
        };

        setMicroParticles((prev) => [...prev.slice(-8), newParticle]);
      }

      // 3. Inspect DOM target for semantic cursor & magnetic behavior
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Magnetic Attraction Handling (spring-based magnetic attraction vectors)
      const magneticEl = (target.closest('[data-magnetic]') ||
        target.closest('button, [role="button"]')) as HTMLElement | null;

      if (magneticEl && !prefersReducedMotion) {
        if (activeMagneticElRef.current && activeMagneticElRef.current !== magneticEl) {
          resetMagneticElement(activeMagneticElRef.current);
        }
        activeMagneticElRef.current = magneticEl;
        applyMagneticAttraction(magneticEl, clientX, clientY, {
          strength: magneticStrength,
          maxDisplacement: 8,
        });
      } else {
        releaseMagneticElement();
      }

      // Section Theme detection
      const themedSection = target.closest('[data-cursor-theme]') as HTMLElement | null;
      if (themedSection) {
        const themeAttr = themedSection.getAttribute('data-cursor-theme') as CursorTheme;
        if (themeAttr && themeAttr !== cursorTheme) {
          setCursorTheme(themeAttr);
        }
      } else if (cursorTheme !== 'default') {
        setCursorTheme('default');
      }

      // Semantic Hover States & dynamic text mapping
      const customCursorAttr = target.closest('[data-cursor]') as HTMLElement | null;
      const customLabelAttr = target.closest('[data-cursor-label]') as HTMLElement | null;
      const declaredVal = customCursorAttr?.getAttribute('data-cursor');
      const declaredLabel = customLabelAttr?.getAttribute('data-cursor-label');

      const isExternalLink = target.closest('a[target="_blank"]') || target.closest('[data-cursor="external"]');
      const isStandardLink = target.closest('a');
      const isBtn = target.closest('button, [role="button"], [data-cursor="button"]');
      const isTextInput = target.closest('input, textarea, [contenteditable="true"]');
      const isSelectableText = target.closest('p, h1, h2, h3, h4, h5, h6, code, pre, span:not(button span)');

      if (declaredVal === 'view' || declaredVal === 'project') {
        setCursorType('project');
        setCursorLabel(declaredLabel || 'VIEW');
      } else if (declaredVal === 'explore' || declaredVal === 'image') {
        setCursorType('image');
        setCursorLabel(declaredLabel || 'EXPLORE');
      } else if (declaredVal === 'open' || declaredVal === 'link' || isExternalLink) {
        setCursorType('link');
        setCursorLabel(declaredLabel || 'OPEN');
      } else if (declaredVal === 'click' || declaredVal === 'button' || isBtn) {
        setCursorType('button');
        setCursorLabel(declaredLabel || '');
      } else if (declaredVal === 'drag') {
        setCursorType('drag');
        setCursorLabel(declaredLabel || 'DRAG');
      } else if (declaredVal === 'hidden') {
        setCursorType('hidden');
        setCursorLabel('');
      } else if (isTextInput) {
        setCursorType('text');
        setCursorLabel('');
      } else if (isStandardLink) {
        setCursorType('link');
        setCursorLabel(declaredLabel || 'OPEN');
      } else if (isSelectableText && !target.closest('button, a, [role="button"]')) {
        setCursorType('text');
        setCursorLabel('');
      } else {
        setCursorType('default');
        setCursorLabel('');
      }
    };

    // Scroll reaction listener
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastScrollYRef.current);
      lastScrollYRef.current = currentY;
      const speed = Math.min(delta, 35);
      setScrollSpeed(speed);

      // Slightly stretch the ring on fast vertical scrolls
      if (speed > 4 && !prefersReducedMotion) {
        const scrollStretch = Math.min(speed * 0.02, 0.25);
        velocityScaleY.set(1 + scrollStretch);
      }
    };

    const handlePointerDown = () => {
      setIsPointerDown(true);
    };

    const handlePointerUp = (e: MouseEvent) => {
      setIsPointerDown(false);

      // Trigger subtle ripple
      if (!prefersReducedMotion) {
        rippleIdRef.current += 1;
        setRipples((prev) => [
          ...prev.slice(-2),
          { id: rippleIdRef.current, x: e.clientX, y: e.clientY },
        ]);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      releaseMagneticElement();
      setTrailPoints([]);
      setMicroParticles([]);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      releaseMagneticElement();
    };
  }, [
    isVisible,
    cursorTheme,
    prefersReducedMotion,
    mouseX,
    mouseY,
    velocityAngle,
    velocityScaleX,
    velocityScaleY,
    resetIdleTimer,
    releaseMagneticElement,
    setCursorType,
    setCursorLabel,
    setCursorTheme,
    setIsPointerDown,
    setIsVisible,
    setIsTouchDevice,
    trailPoints.length,
    magneticStrength,
  ]);

  // Micro-particles decay animation frame loop
  useEffect(() => {
    if (microParticles.length === 0) return;

    const frameId = requestAnimationFrame(() => {
      setMicroParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.045,
          }))
          .filter((p) => p.opacity > 0.05)
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [microParticles]);

  // Scroll speed decay loop
  useEffect(() => {
    if (scrollSpeed <= 0.1) return;

    const decayTimer = setTimeout(() => {
      setScrollSpeed((prev) => Math.max(0, prev * 0.7));
    }, 40);

    return () => clearTimeout(decayTimer);
  }, [scrollSpeed]);

  return (
    <>
      {children({
        mouseX,
        mouseY,
        smoothX,
        smoothY,
        glowX,
        glowY,
        velocityScaleX,
        velocityScaleY,
        velocityAngle,
        trailPoints,
        microParticles,
        ripples,
        currentSpeed,
        scrollSpeed,
        entranceScale,
        entranceOpacity,
        onRippleComplete: handleRippleComplete,
        prefersReducedMotion,
      })}
    </>
  );
};
